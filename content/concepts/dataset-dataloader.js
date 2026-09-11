WIKI.concept({
slug:'dataset-dataloader',

tldr:'Dataset은 샘플을 인덱스로 하나씩 꺼내는 방법을 정의하고, DataLoader는 이를 배치로 묶고(collate) 섞고 병렬로 미리 읽어 GPU 연산에 끊김 없이 공급하는 역할을 나눠 맡는다.',

why:'모델 코드는 분명 맞는데 학습이 이상하게 느리거나(GPU 사용률이 낮게 들쭉날쭉) 배치 안에 크기가 다른 샘플이 섞여 에러가 나는 문제의 대부분은 Dataset/DataLoader 설정에서 나온다. GPU가 연산을 끝내고 다음 배치를 기다리며 노는 시간(데이터 로딩 병목)을 줄이는 것이 학습 속도 최적화의 절반이며, 이 병목을 모델 구조 문제로 오진하고 엉뚱한 곳을 고치는 실수도 흔하다.',

sections:[
{h:'역할 분리', d:'Dataset은 "인덱스 $i$ 를 주면 샘플 하나만 반환한다"는 단순한 인터페이스( `__getitem__`, `__len__` )만 책임진다 — 파일에서 읽기, 전처리, 증강까지 이 안에서 일어난다. DataLoader는 그 위에서 여러 인덱스를 뽑아 배치를 구성하고, 여러 워커 프로세스로 병렬로 샘플을 가져오고, 다음 배치를 미리 준비해 두는(prefetch) 오케스트레이션을 담당한다. 역할을 나눈 덕분에 Dataset만 바꿔 끼우면 같은 DataLoader 로직을 재사용할 수 있다.'},
{h:'collate 함수', d:'여러 샘플들을 하나의 배치 텐서로 합치는 과정을 collate라 부른다. 이미지처럼 모든 샘플의 크기가 같으면 단순히 쌓기(stack)만 하면 되지만, 텍스트·가변 길이 시퀀스처럼 샘플마다 길이가 다르면 배치 안 최대 길이에 맞춰 패딩(padding)을 넣고, 패딩된 위치를 모델이 무시하도록 어텐션 마스크를 함께 만들어야 한다. 이 로직을 커스텀 `collate_fn`으로 직접 짜야 하는 경우가 실무에서 흔하다.'},
 {h:'워커와 프리페치', d:'파일 읽기·디코딩·증강은 CPU 작업이라 메인 프로세스 하나로 하면 GPU가 계산을 끝내고 다음 배치를 기다리며 놀게 된다. DataLoader는 `num_workers`개의 별도 프로세스가 다음 배치들을 미리 준비해 두는 식으로 이 병목을 가린다. 워커 수가 너무 적으면 GPU가 굶고, 너무 많으면 CPU·메모리 경쟁으로 오히려 느려질 수 있어 CPU 코어 수·디스크 속도에 맞춰 실측으로 조정한다.'},
{h:'셔플과 샘플러', d:'매 에폭마다 데이터의 순서를 섞는(`shuffle=True`) 것은 배치마다 편향된 순서(예: 클래스별로 정렬된 데이터)를 학습에 계속 노출시키지 않기 위해서다. 분산 학습에서는 각 GPU가 겹치지 않는 부분집합만 보도록 `DistributedSampler`가 이 셔플·분할을 함께 담당하고, [클래스 불균형](#/c/class-imbalance)이 심한 데이터에서는 클래스 비율을 맞춰 뽑는 `WeightedRandomSampler`를 쓰기도 한다.'},
 {h:'실무에서', d:'이미지 디코딩·토크나이징처럼 CPU가 무거운 전처리는 Dataset 안에서 하고, 텐서 변환 이후의 가벼운 배치 단위 연산(정규화 등)은 collate 이후 GPU에서 처리해 CPU 병목을 줄이는 식으로 나누는 것이 흔한 패턴이다. LLM 사전학습처럼 데이터가 너무 커서 메모리에 다 못 올리는 경우, 인덱스로 아무 곳이나 접근하는 맵 스타일(map-style) Dataset 대신 순서대로만 흘려 읽는 반복자(iterable-style) Dataset을 쓴다.'},
{h:'병목 진단', d:'GPU 사용률(`nvidia-smi`)이 스텝마다 0%와 100% 사이를 오가며 들쭉날쭉하다면, 대개 GPU가 계산을 끝내고 다음 배치를 기다리며 노는 데이터 로딩 병목이다. 이때는 `num_workers`를 늘리거나, `pin_memory=True`로 CPU→GPU 전송을 비동기화하거나, 전처리 자체를 더 가볍게(예: 디코딩을 미리 해 둔 포맷으로 저장) 만드는 순서로 원인을 좁혀 간다.'}
],

code:{lang:'python', d:'가변 길이 시퀀스를 패딩해 배치로 묶는 커스텀 collate_fn의 최소 구현 예.', src:'import torch\nfrom torch.nn.utils.rnn import pad_sequence\n\ndef collate_fn(batch):\n    # batch: [(seq1, label1), (seq2, label2), ...], 길이가 제각각\n    seqs, labels = zip(*batch)\n    padded = pad_sequence(seqs, batch_first=True, padding_value=0)\n    mask = (padded != 0).long()  # 패딩 위치를 모델이 무시하도록\n    return padded, mask, torch.tensor(labels)\n\nloader = torch.utils.data.DataLoader(\n    dataset, batch_size=32, shuffle=True,\n    num_workers=4, collate_fn=collate_fn)'},

diagram:{type:'flow', cap:'인덱스 하나가 GPU에 실제로 올라갈 배치 텐서가 되기까지.',
 nodes:[
  {t:'Dataset[i]', s:'샘플 1개 반환'},
  {t:'Sampler', s:'인덱스 순서 결정'},
  {t:'collate_fn', s:'배치로 묶기·패딩'},
  {t:'DataLoader', s:'병렬 로딩·prefetch'}
 ]},

confuse:[
 {a:'Dataset', b:'DataLoader', d:'Dataset은 "샘플 하나를 어떻게 가져오는가"만 정의하는 정적인 정의이고, DataLoader는 그 Dataset을 어떤 순서·배치 크기·병렬도로 실제로 순회할지 결정하는 실행기다. Dataset은 여러 DataLoader 설정에서 재사용될 수 있다.'},
{a:'맵 스타일(map-style) Dataset', b:'반복자 스타일(iterable-style) Dataset', d:'맵 스타일은 인덱스로 임의 접근(random access)이 자유롭게 가능해 셔플·샘플러를 마음껏 쓸 수 있다. 반복자 스타일은 순서대로만 읽을 수 있어(스트리밍) 매우 큰 데이터셋에 적합하지만 셔플은 버퍼 단위의 근사 셔플로만 가능하다.'},
{a:'배치 크기(batch size)', b:'워커 수(num_workers)', d:'배치 크기는 한 스텝에서 GPU가 처리하는 샘플 수([배치·에폭](#/c/batch-epoch) 참고)이고, 워커 수는 그 배치를 준비하는 데 동원하는 CPU 프로세스 개수다. 워커 수를 늘려도 배치 크기는 바뀌지 않는다 — 데이터 로딩 **속도**만 바뀐다.'},
{a:'셔플(shuffle)', b:'[데이터 증강](#/c/augmentation)', d:'셔플은 샘플이 **등장하는 순서**만 매 에폭 바꾸는 것이고, 증강은 샘플 **내용 자체**를 변형해 다양성을 늘리는 것이다. 순서를 아무리 섞어도 내용이 바뀌지 않으면 증강이 아니고, 둘은 서로 독립적으로 함께 적용된다.'}
],

pitfalls:[
 '가변 길이 시퀀스를 collate 없이 그냥 쌓으려 하면 텐서 크기가 안 맞아 에러가 나거나, 패딩을 했는데 어텐션 마스크를 안 만들어 모델이 패딩 토큰까지 실제 입력처럼 처리해 버린다.',
 '워커 수를 CPU 코어 수보다 훨씬 많이 잡으면 컨텍스트 스위칭·메모리 경쟁으로 오히려 로딩이 느려질 수 있다 — 실측 없이 크게 잡는 것은 위험하다.',
 '분산 학습에서 `DistributedSampler` 없이 그냥 shuffle만 켜면 GPU마다 같은 데이터를 중복해서 보게 되어 사실상 유효 데이터 양이 줄어든다.',
 '워커마다 별도의 프로세스로 데이터를 읽다 보니, 워커 안에서 만든 난수 생성기 시드를 제대로 분리하지 않으면 여러 워커가 똑같은 증강(augmentation) 결과를 만들어내는 조용한 버그가 생길 수 있다.'
],

papers:['imagenet'],
terms:['batch-epoch','class-imbalance','data-quality','augmentation','stratified-split','labeling']
})
