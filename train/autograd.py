"""아주 작은 reverse-mode autograd (numpy).

교육용 tiny GPT를 학습시키기 위해 필요한 연산만 구현했다.
"""
import numpy as np


class Tensor:
    __slots__ = ("data", "grad", "_backward", "_prev", "requires_grad")

    def __init__(self, data, prev=(), requires_grad=False):
        self.data = np.asarray(data, dtype=np.float64)
        self.grad = None
        self._backward = lambda: None
        self._prev = prev
        self.requires_grad = requires_grad or any(p.requires_grad for p in prev)

    @property
    def shape(self):
        return self.data.shape

    def zero_grad(self):
        self.grad = None

    def _accum(self, g):
        if self.grad is None:
            self.grad = np.zeros_like(self.data)
        self.grad += g

    def backward(self):
        topo, visited = [], set()

        def build(t):
            if id(t) in visited:
                return
            visited.add(id(t))
            for p in t._prev:
                build(p)
            topo.append(t)

        build(self)
        self.grad = np.ones_like(self.data)
        for t in reversed(topo):
            t._backward()

    # --- 연산자 ---
    def __add__(self, other):
        return add(self, other)

    def __mul__(self, other):
        return scale(self, other)

    def __matmul__(self, other):
        return matmul(self, other)


def _unbroadcast(g, shape):
    """브로드캐스팅된 gradient를 원래 shape으로 되돌린다."""
    while g.ndim > len(shape):
        g = g.sum(axis=0)
    for i, s in enumerate(shape):
        if s == 1 and g.shape[i] != 1:
            g = g.sum(axis=i, keepdims=True)
    return g.reshape(shape)


def add(a, b):
    out = Tensor(a.data + b.data, (a, b))

    def _bw():
        if out.grad is None:
            return
        a._accum(_unbroadcast(out.grad, a.data.shape))
        b._accum(_unbroadcast(out.grad, b.data.shape))

    out._backward = _bw
    return out


def scale(a, k):
    out = Tensor(a.data * k, (a,))

    def _bw():
        if out.grad is not None:
            a._accum(out.grad * k)

    out._backward = _bw
    return out


def matmul(a, b):
    out = Tensor(np.matmul(a.data, b.data), (a, b))

    def _bw():
        if out.grad is None:
            return
        g = out.grad
        a._accum(_unbroadcast(np.matmul(g, np.swapaxes(b.data, -1, -2)), a.data.shape))
        b._accum(_unbroadcast(np.matmul(np.swapaxes(a.data, -1, -2), g), b.data.shape))

    out._backward = _bw
    return out


def add_const(a, c):
    """상수 배열(예: causal mask)을 더한다."""
    out = Tensor(a.data + c, (a,))

    def _bw():
        if out.grad is not None:
            a._accum(out.grad)

    out._backward = _bw
    return out


def softmax(a, axis=-1):
    x = a.data
    x = x - x.max(axis=axis, keepdims=True)
    e = np.exp(x)
    y = e / e.sum(axis=axis, keepdims=True)
    out = Tensor(y, (a,))

    def _bw():
        if out.grad is None:
            return
        g = out.grad
        a._accum((g - (g * y).sum(axis=axis, keepdims=True)) * y)

    out._backward = _bw
    return out


def layernorm(a, gamma, beta, eps=1e-5):
    x = a.data
    mu = x.mean(axis=-1, keepdims=True)
    xc = x - mu
    var = (xc ** 2).mean(axis=-1, keepdims=True)
    inv = 1.0 / np.sqrt(var + eps)
    xhat = xc * inv
    out = Tensor(xhat * gamma.data + beta.data, (a, gamma, beta))

    def _bw():
        if out.grad is None:
            return
        g = out.grad
        gamma._accum(_unbroadcast((g * xhat).sum(axis=tuple(range(g.ndim - 1))), gamma.data.shape))
        beta._accum(_unbroadcast(g.sum(axis=tuple(range(g.ndim - 1))), beta.data.shape))
        gx = g * gamma.data
        n = x.shape[-1]
        dx = inv / n * (n * gx - gx.sum(axis=-1, keepdims=True)
                        - xhat * (gx * xhat).sum(axis=-1, keepdims=True))
        a._accum(dx)

    out._backward = _bw
    return out


_C = np.sqrt(2.0 / np.pi)


def gelu(a):
    x = a.data
    inner = _C * (x + 0.044715 * x ** 3)
    t = np.tanh(inner)
    out = Tensor(0.5 * x * (1.0 + t), (a,))

    def _bw():
        if out.grad is None:
            return
        dinner = _C * (1.0 + 3 * 0.044715 * x ** 2)
        d = 0.5 * (1.0 + t) + 0.5 * x * (1.0 - t ** 2) * dinner
        a._accum(out.grad * d)

    out._backward = _bw
    return out


def embedding(w, idx):
    """w: (V, D), idx: (B, T) int -> (B, T, D)"""
    out = Tensor(w.data[idx], (w,))

    def _bw():
        if out.grad is None:
            return
        gw = np.zeros_like(w.data)
        np.add.at(gw, idx.reshape(-1), out.grad.reshape(-1, w.data.shape[-1]))
        w._accum(gw)

    out._backward = _bw
    return out


def reshape(a, shape):
    out = Tensor(a.data.reshape(shape), (a,))

    def _bw():
        if out.grad is not None:
            a._accum(out.grad.reshape(a.data.shape))

    out._backward = _bw
    return out


def transpose(a, axes):
    out = Tensor(np.transpose(a.data, axes), (a,))
    inv = np.argsort(axes)

    def _bw():
        if out.grad is not None:
            a._accum(np.transpose(out.grad, inv))

    out._backward = _bw
    return out


def cross_entropy(logits, targets):
    """logits: (N, V), targets: (N,) int"""
    x = logits.data
    x = x - x.max(axis=-1, keepdims=True)
    e = np.exp(x)
    p = e / e.sum(axis=-1, keepdims=True)
    n = targets.shape[0]
    loss = -np.log(p[np.arange(n), targets] + 1e-12).mean()
    out = Tensor(loss, (logits,))

    def _bw():
        g = p.copy()
        g[np.arange(n), targets] -= 1.0
        logits._accum(g / n * (out.grad if out.grad is not None else 1.0))

    out._backward = _bw
    return out
