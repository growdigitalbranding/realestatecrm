"""
Growthlearners showreel soundtrack — synthesized from scratch.

128 BPM, 16 bars of 4/4 = exactly 30.000 s.
Key: Ab major / F minor.  Progression (one chord per bar):  Fm  Db  Ab  Eb

Arrangement (bars are zero-indexed, the visual timeline uses the same grid):
  0-1   intro     filtered pluck pulse, ticking hats, snare build, riser
  2-5   drop A    four-on-the-floor, sidechained supersaw, rolling bass, arp
  6-9   drop A'   + lead hook, fills at every bar end
  10-11 break     half-time claps, pads, snare roll + riser, 1/2-beat silence
  12-13 drop B    everything, crashes
  14    resolve   logo slam — big impact, groove continues filtered
  15    outro     final stab and ring-out

Every visual event in the edit has a matching SFX cue in SFX_CUES below.
"""
import json
import os
import numpy as np
from scipy import signal

SR = 48000
BPM = 128
BEAT = 60.0 / BPM
BAR = BEAT * 4
LEN = 30.0
N = int(SR * LEN) + SR * 2  # 2 s tail room, trimmed at the end
rng = np.random.default_rng(7)


def T(bar, beat=0.0):
    return bar * BAR + beat * BEAT


def S(t):
    return int(round(t * SR))


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


class Bus:
    def __init__(self):
        self.x = np.zeros((2, N))

    def add(self, sig, t, gain=1.0, pan=0.0):
        if sig.ndim == 1:
            l = np.cos((pan + 1) * np.pi / 4)
            r = np.sin((pan + 1) * np.pi / 4)
            sig = np.vstack([sig * l * 1.414, sig * r * 1.414])
        i = S(t)
        if i >= N:
            return
        n = min(sig.shape[1], N - i)
        self.x[:, i:i + n] += sig[:, :n] * gain


# ---------------------------------------------------------------- dsp helpers
def env_adsr(n, a, d, s, r, hold=None):
    a, d, r = int(a * SR) + 1, int(d * SR) + 1, int(r * SR) + 1
    hold = n - r if hold is None else int(hold * SR)
    e = np.zeros(n)
    x = np.arange(n)
    e = np.where(x < a, x / a, 1.0)
    dd = np.clip((x - a) / d, 0, 1)
    e = np.where(x >= a, 1 - (1 - s) * dd, e)
    rel = np.clip((x - hold) / r, 0, 1)
    e = e * (1 - rel)
    return e


def exp_env(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def polyblep(t, dt):
    y = np.zeros_like(t)
    m = t < dt
    x = t[m] / dt[m] if np.ndim(dt) else t[m] / dt
    y[m] = x + x - x * x - 1
    m2 = t > 1 - (dt if not np.ndim(dt) else dt)
    if np.ndim(dt):
        x = (t[m2] - 1) / dt[m2]
    else:
        x = (t[m2] - 1) / dt
    y[m2] = x * x + x + x + 1
    return y


def saw(freq, n, phase0=None):
    f = np.broadcast_to(np.asarray(freq, float), (n,)).copy()
    dt = f / SR
    ph = (np.cumsum(dt) + (rng.random() if phase0 is None else phase0)) % 1.0
    return 2 * ph - 1 - polyblep(ph, dt)


def square(freq, n, pw=0.5):
    f = np.broadcast_to(np.asarray(freq, float), (n,)).copy()
    dt = f / SR
    ph = (np.cumsum(dt) + rng.random()) % 1.0
    s1 = 2 * ph - 1 - polyblep(ph, dt)
    ph2 = (ph + pw) % 1.0
    s2 = 2 * ph2 - 1 - polyblep(ph2, dt)
    return (s1 - s2) * 0.5


def sine(freq, n, phase0=0.0):
    f = np.broadcast_to(np.asarray(freq, float), (n,))
    return np.sin(2 * np.pi * (np.cumsum(f) / SR + phase0))


def lp(x, fc, q=0.707):
    sos = signal.butter(2, min(fc, SR * 0.45), 'low', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=-1)


def hp(x, fc):
    sos = signal.butter(2, fc, 'high', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=-1)


def bp(x, lo, hi):
    sos = signal.butter(2, [lo, min(hi, SR * 0.45)], 'band', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=-1)


def _biquad(fc, res, mode):
    # RBJ cookbook biquad; res 0..1 maps to Q 0.707..4
    q = 0.707 + res * 3.3
    w0 = 2 * np.pi * fc / SR
    al = np.sin(w0) / (2 * q)
    c = np.cos(w0)
    if mode == 'lp':
        b = np.array([(1 - c) / 2, 1 - c, (1 - c) / 2])
    else:
        b = np.array([(1 + c) / 2, -(1 + c), (1 + c) / 2])
    a = np.array([1 + al, -2 * c, 1 - al])
    return b / a[0], a / a[0]


def svf_sweep(x, cutoff, res=0.2, mode='lp'):
    """Chamberlin state-variable filter with per-sample cutoff (vectorised in blocks)."""
    cutoff = np.broadcast_to(np.asarray(cutoff, float), x.shape[-1:])
    out = np.zeros_like(x)
    blk = 64
    zi = None
    for i in range(0, x.shape[-1], blk):
        fc = float(np.clip(cutoff[i], 30, SR * 0.42))
        b, a = _biquad(fc, res, mode)
        # add resonance by pulling poles toward unit circle
        seg = x[..., i:i + blk]
        if zi is None:
            zi = np.zeros(max(len(a), len(b)) - 1) if x.ndim == 1 else np.zeros((x.shape[0], max(len(a), len(b)) - 1))
        y, zi = signal.lfilter(b, a, seg, axis=-1, zi=zi)
        out[..., i:i + blk] = y
    return out


def reverb_ir(seconds=2.4, predelay=0.012, bright=6000):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    irs = []
    for _ in range(2):
        noise = rng.standard_normal(n) * np.exp(-t * 6.9 / seconds)
        noise = lp(noise, bright)
        noise[: int(predelay * SR)] = 0
        irs.append(noise)
    ir = np.vstack(irs)
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True)) * 0.9


def convolve_stereo(x, ir):
    return np.vstack([signal.fftconvolve(x[c], ir[c])[: x.shape[1]] for c in range(2)])


def delay(x, time, fb=0.35, mix=0.35, pingpong=True):
    d = int(time * SR)
    y = np.zeros_like(x)
    tap = x.copy()
    g = 1.0
    for k in range(1, 7):
        g *= fb
        tap = np.roll(tap, d, axis=-1)
        tap[..., :d] = 0
        tap = lp(tap, 5200)
        if pingpong and x.ndim == 2:
            y += g * (tap[::-1] if k % 2 else tap)
        else:
            y += g * tap
    return x + y * mix


def soft(x, drive=1.0):
    return np.tanh(x * drive) / np.tanh(drive)


# ---------------------------------------------------------------- instruments
def kick(punch=1.0, tail=0.32):
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    f = 46 + 150 * np.exp(-t * 32) + 60 * np.exp(-t * 200)
    body = sine(f, n) * np.exp(-t / tail)
    click = hp(rng.standard_normal(n) * np.exp(-t * 900), 2000) * 0.35
    k = soft((body + click) * 1.6 * punch, 1.4)
    return k * 0.95


def clap(tone=1.0):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    e = np.zeros(n)
    for off in (0.0, 0.009, 0.019, 0.028):
        i = int(off * SR)
        e[i:] += np.exp(-(t[: n - i]) * 180) * 0.8
    e += np.exp(-t * 14) * 0.5 * (t > 0.028)
    x = bp(rng.standard_normal(n), 900, 5200) * e
    x += sine(185 * tone, n) * np.exp(-t * 40) * 0.25
    return soft(x * 1.4, 1.2)


def snare(n_s=0.25):
    n = int(n_s * SR)
    t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 1500, 9000) * np.exp(-t * 26)
    x += sine(210 * (1 + 0.4 * np.exp(-t * 60)), n) * np.exp(-t * 30) * 0.6
    return x * 0.9


def hat(open_=False):
    n = int((0.35 if open_ else 0.06) * SR)
    t = np.arange(n) / SR
    x = hp(rng.standard_normal(n), 7500)
    metal = sum(square(f, n) for f in (5412, 6820, 8130)) * 0.08
    x = (x + hp(metal, 6000)) * np.exp(-t * (9 if open_ else 70))
    return x * 0.5


def crash(len_s=2.6):
    n = int(len_s * SR)
    t = np.arange(n) / SR
    x = hp(rng.standard_normal((2, n)), 4200) * np.exp(-t * 1.9)
    ring = sum(sine(f, n) for f in (3150, 4417, 5810, 7303)) * np.exp(-t * 2.6) * 0.05
    x = x + ring
    x[:, : int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))
    return x * 0.45


def impact(len_s=3.2, f0=62):
    n = int(len_s * SR)
    t = np.arange(n) / SR
    boom = sine(f0 * (0.55 + 0.45 * np.exp(-t * 3.5)) + 30 * np.exp(-t * 40), n) * np.exp(-t * 1.2)
    boom = soft(boom * 2.2, 2.0)
    thump = lp(rng.standard_normal(n), 300) * np.exp(-t * 14) * 1.5
    x = boom + thump
    st = np.vstack([x, x])
    tail = convolve_stereo(np.vstack([thump, thump]) * 0.6, reverb_ir(2.8, bright=2500))
    return st + tail


def riser(len_s, f0=300, f1=9000, pitch=True):
    n = int(len_s * SR)
    t = np.linspace(0, 1, n)
    noise = rng.standard_normal((2, n))
    fc = f0 * (f1 / f0) ** (t ** 1.6)
    x = np.vstack([svf_sweep(noise[c], fc, 0) for c in range(2)])
    x = x - np.vstack([lp(x[c], 200) for c in range(2)])
    amp = t ** 2.2
    out = x * amp * 0.5
    if pitch:
        p = sum(saw(mtof(60 + 24 * t ** 1.8) * dtn, n) for dtn in (1, 1.006, 0.994)) / 3
        p = lp(p, 5000) * amp * 0.12
        out = out + np.vstack([p, p])
    return out


def downlifter(len_s=1.6):
    n = int(len_s * SR)
    t = np.linspace(0, 1, n)
    noise = rng.standard_normal((2, n))
    fc = 9000 * (200 / 9000) ** (t ** 0.6)
    x = np.vstack([svf_sweep(noise[c], fc, 0) for c in range(2)])
    return x * (1 - t) ** 2 * 0.35


def whoosh(len_s=0.45, up=True):
    n = int(len_s * SR)
    t = np.linspace(0, 1, n)
    noise = rng.standard_normal((2, n))
    shape = np.sin(np.pi * t ** (0.6 if up else 1.4)) ** 2
    fc = (600 + 7000 * shape)
    x = np.vstack([svf_sweep(noise[c], fc, 0) for c in range(2)])
    x = np.vstack([hp(x[c], 300) for c in range(2)])
    return x * shape * 0.55


def pop(f=900, len_s=0.12):
    n = int(len_s * SR)
    t = np.arange(n) / SR
    x = sine(f * (1 + 1.2 * np.exp(-t * 60)), n) * np.exp(-t * 38)
    return x * 0.5


def tick(f=3200):
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    return (sine(f, n) * np.exp(-t * 260) + hp(rng.standard_normal(n), 5000) * np.exp(-t * 500) * 0.3) * 0.45


def ding(m=84):
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    x = sine(f, n) * np.exp(-t * 5) + sine(f * 2.76, n) * np.exp(-t * 11) * 0.3 + sine(f * 5.4, n) * np.exp(-t * 20) * 0.12
    return x * 0.28


def supersaw(notes, n, voices=7, spread=0.22, cutoff=4200, env=None):
    st = np.zeros((2, n))
    for m in notes:
        f = mtof(m)
        for v in range(voices):
            det = (v - (voices - 1) / 2) / ((voices - 1) / 2)
            s = saw(f * 2 ** (det * spread / 12), n)
            pan = det * 0.85
            st[0] += s * np.cos((pan + 1) * np.pi / 4)
            st[1] += s * np.sin((pan + 1) * np.pi / 4)
    st /= voices * len(notes) ** 0.5
    if np.ndim(cutoff):
        st = np.vstack([svf_sweep(st[c], cutoff, 0.2) for c in range(2)])
    else:
        st = np.vstack([lp(lp(st[c], cutoff), cutoff) for c in range(2)])
    if env is not None:
        st *= env
    return st


def pluck(m, len_s=0.35, bright=1.0):
    n = int(len_s * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    x = (saw(f, n) + saw(f * 1.004, n) + square(f * 0.5, n) * 0.5) / 2.2
    fc = 400 + 6500 * bright * np.exp(-t * 18)
    x = svf_sweep(x, fc, 0.3)
    return x * np.exp(-t * 7) * env_adsr(n, 0.002, 0.05, 1, 0.02)


def bass_note(m, len_s, cutoff=900):
    n = int(len_s * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    x = saw(f, n) * 0.55 + square(f, n) * 0.25 + sine(f, n) * 0.55
    fc = cutoff * (0.5 + 1.2 * np.exp(-t * 14))
    x = svf_sweep(x, fc, 0.25)
    return soft(x * env_adsr(n, 0.003, 0.08, 0.8, 0.02) * 1.3, 1.5) * 0.8


def lead(m, len_s, vib=True):
    n = int(len_s * SR)
    t = np.arange(n) / SR
    f = mtof(m) * (1 + (0.006 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t * 4 - 0.4, 0, 1) if vib else 0))
    x = square(f, n, 0.32) * 0.6 + saw(f * 1.003, n) * 0.4 + saw(f * 0.997, n) * 0.4
    x = svf_sweep(x, 2600 + 2400 * np.exp(-t * 10), 0.35)
    return x * env_adsr(n, 0.006, 0.12, 0.7, 0.06) * 0.5


# ---------------------------------------------------------------- song data
# Fm  Db  Ab  Eb   (MIDI, voiced around middle C)
CHORDS = [
    [65, 68, 72, 77],   # Fm  F Ab C F
    [65, 68, 73, 77],   # Db/F
    [63, 68, 72, 75],   # Ab/Eb
    [63, 67, 70, 75],   # Eb
]
ROOTS = [41, 37, 44, 39]  # F2 Db2 Ab2 Eb2
ARP = [  # 16th arp patterns (scale-tone indices into chord + octave)
    [0, 2, 3, 1, 2, 3, 0, 2, 3, 1, 2, 3, 0, 2, 3, 2],
]
HOOK = [  # (bar-in-4, beat, midi, len-in-beats)  — main hook for drops
    (0, 0.0, 84, 0.5), (0, 0.5, 80, 0.5), (0, 1.0, 84, 0.5), (0, 1.75, 87, 0.75), (0, 2.5, 84, 0.5), (0, 3.0, 80, 1.0),
    (1, 0.0, 85, 0.5), (1, 0.5, 80, 0.5), (1, 1.0, 85, 0.5), (1, 1.75, 89, 0.75), (1, 2.5, 87, 0.5), (1, 3.0, 85, 1.0),
    (2, 0.0, 84, 0.5), (2, 0.5, 80, 0.5), (2, 1.0, 84, 0.5), (2, 1.75, 87, 0.75), (2, 2.5, 91, 0.5), (2, 3.0, 87, 1.0),
    (3, 0.0, 86, 0.5), (3, 0.5, 82, 0.5), (3, 1.0, 87, 0.75), (3, 2.0, 91, 0.5), (3, 2.5, 89, 0.5), (3, 3.0, 87, 1.0),
]

drums, bass, music, fx, sc_src = Bus(), Bus(), Bus(), Bus(), []
K = kick()
CL = clap()
HC = hat(False)
HO = hat(True)

DROP_BARS = list(range(2, 10)) + [12, 13, 14]

# ---------------- drums
for bar in range(16):
    for b in range(4):
        t = T(bar, b)
        if bar in DROP_BARS:
            drums.add(K, t, 0.72)
            sc_src.append(t)
            drums.add(HO, T(bar, b + 0.5), 0.45, pan=0.25)
            if b in (1, 3):
                drums.add(CL, t, 0.62, pan=-0.05)
            for s16 in (0.25, 0.75):
                drums.add(HC, T(bar, b + s16), 0.22 + 0.06 * rng.random(), pan=-0.3)
        elif bar in (0, 1):
            # intro: heartbeat kick on 1 and the "and" of 2, ticking hats rising
            if b in (0, 2) and bar == 1:
                drums.add(kick(0.7, 0.2), t, 0.55)
            for s16 in (0, 0.25, 0.5, 0.75):
                drums.add(HC, T(bar, b + s16), (0.05 + 0.2 * (bar * 4 + b + s16) / 8) * (1.3 if s16 == 0.5 else 1), pan=0.35)
        elif bar in (10, 11):
            if b == 2:
                drums.add(CL, t, 0.55)
            if bar == 10:
                for s8 in (0, 0.5):
                    drums.add(HC, T(bar, b + s8), 0.12, pan=0.3)
        elif bar == 15:
            if b == 0:
                drums.add(K, t, 1.0)
                sc_src.append(t)
    # fills at the end of drop bars 5, 7, 9
    if bar in (5, 9):
        for i, s in enumerate(np.arange(3.0, 4.0, 0.125)):
            drums.add(snare(0.14), T(bar, s), 0.18 + 0.05 * i, pan=(i % 2 - 0.5) * 0.4)
    if bar == 7:
        for i, s in enumerate((3.5, 3.75)):
            drums.add(CL, T(bar, s), 0.35 + 0.1 * i)

# intro snare build (bar 1)
for i, s in enumerate(np.arange(2.0, 4.0, 0.125)):
    drums.add(snare(0.12), T(1, s), 0.05 + 0.3 * (i / 16) ** 1.5, pan=0.1)
# breakdown snare roll (bar 11): 8ths → 16ths → 32nds, stops half a beat early (silence gap)
roll = list(np.arange(0, 2, 0.5)) + list(np.arange(2, 3, 0.25)) + list(np.arange(3, 3.5, 0.125))
for i, s in enumerate(roll):
    drums.add(snare(0.12), T(11, s), 0.08 + 0.42 * (i / len(roll)) ** 1.6)

# ---------------- sidechain envelope (for music + bass)
duck = np.ones(N)
for t in sc_src:
    i = S(t)
    n = int(BEAT * SR)
    x = np.arange(n) / SR
    d = 1 - 0.8 * np.exp(-x / 0.085) * (1 - np.exp(-x / 0.002))
    d = 1 - 0.82 * np.clip(1 - x / 0.24, 0, 1) ** 2.2
    seg = duck[i:i + n]
    duck[i:i + n] = np.minimum(seg, d[: len(seg)])

# ---------------- bass: rolling offbeat 8ths in the drops, sub note on outros
for bar in DROP_BARS:
    r = ROOTS[bar % 4]
    for b8 in range(8):
        oct_ = 12 if b8 % 2 == 1 and bar in (6, 7, 8, 9, 12, 13) and b8 in (3, 7) else 0
        bass.add(bass_note(r + oct_, BEAT * 0.48, 950 if bar >= 12 else 780), T(bar, b8 * 0.5), 0.9)
# outro sub hold
bass.add(bass_note(ROOTS[0], BAR * 1.2, 380), T(15, 0), 0.9)
# breakdown sustained sub
for bar in (10, 11):
    bass.add(bass_note(ROOTS[bar % 4], BAR * 0.98 if bar == 10 else BEAT * 3.45, 320) * 0.7, T(bar), 0.8)

# ---------------- chords
for bar in range(16):
    ch = CHORDS[bar % 4]
    n = int(BAR * SR)
    if bar in (0, 1):
        # filtered pulsing 8th chords opening up
        for b8 in range(8):
            prog = (bar * 8 + b8) / 16
            nn = int(BEAT * 0.45 * SR)
            e = env_adsr(nn, 0.003, 0.12, 0.3, 0.05)
            music.add(supersaw(ch, nn, 5, 0.18, 800 + 4200 * prog ** 1.5, e), T(bar, b8 * 0.5), 0.8)
    elif bar in DROP_BARS:
        # off-beat stabs + sustained wash
        for b in range(4):
            nn = int(BEAT * 0.4 * SR)
            e = env_adsr(nn, 0.002, 0.14, 0.35, 0.05)
            music.add(supersaw([m + 12 for m in ch[1:]], nn, 7, 0.2, 5600 if bar >= 12 else 4800, e), T(bar, b + 0.5), 0.42)
        e = env_adsr(n, 0.01, 0.4, 0.8, 0.1)
        music.add(supersaw(ch, n, 7, 0.24, 3000 if bar >= 12 else 2300, e), T(bar), 0.5)
    elif bar in (10, 11):
        nn = int((BAR if bar == 10 else BEAT * 3.5) * SR)
        e = env_adsr(nn, 0.25, 0.5, 0.85, 0.08)
        cut = np.linspace(900, 2400, nn) if bar == 10 else np.linspace(2400, 7000, nn)
        music.add(supersaw(ch, nn, 7, 0.28, cut, e), T(bar), 0.6)
    elif bar == 15:
        e = env_adsr(int(BAR * 1.9 * SR), 0.004, 1.4, 0.35, 0.6, hold=BAR * 1.2)
        music.add(supersaw([m + 12 for m in CHORDS[0]] + [53], int(BAR * 1.9 * SR), 7, 0.26, np.linspace(6000, 900, int(BAR * 1.9 * SR)), e), T(15), 0.62)

# ---------------- arps (intro + drops + breakdown)
arp = Bus()
for bar in range(16):
    if bar in (14, 15):
        continue
    ch = CHORDS[bar % 4]
    for i in range(16):
        if bar in (0, 1) and i % 2 == 1 and bar == 0:
            continue
        idx = ARP[0][i]
        m = ch[idx] + (12 if (i // 4) % 2 == 1 and bar >= 2 else 0)
        bright = 0.35 + 0.65 * (bar / 2 if bar < 2 else 1)
        if bar in (10, 11):
            bright = 0.5
        arp.add(pluck(m, 0.3, bright), T(bar, i * 0.25), 0.3 if bar >= 2 else 0.36, pan=(0.35 if i % 2 else -0.35))

# ---------------- hook lead in drop A' and drop B
ld = Bus()
for bar in list(range(6, 10)) + [12, 13]:
    for (bi, beat, m, ln) in HOOK:
        if bi == bar % 4:
            ld.add(lead(m - 12, ln * BEAT * 0.95), T(bar, beat), 0.42 if bar >= 12 else 0.34)

# ---------------- risers / impacts / transitions
fx.add(riser(BAR * 2, 250, 9000), T(0), 0.55)
fx.add(riser(BAR * 1.0, 400, 10000), T(5), 0.35)
fx.add(riser(BAR * 1.75, 200, 12000), T(10, 1), 0.7)
fx.add(riser(BAR * 0.5, 800, 9000, pitch=False), T(13, 2), 0.35)
for t, g in ((T(2), 1.0), (T(12), 1.0), (T(14), 1.15)):
    fx.add(impact(), t, 0.85 * g)
    fx.add(crash(), t, 0.7 * g)
for t in (T(6), T(10)):
    fx.add(crash(1.8), t, 0.45)
    fx.add(downlifter(1.4), t, 0.6)
fx.add(impact(4.0, 55), T(15), 0.9)
fx.add(crash(3.4), T(15), 0.65)
fx.add(downlifter(2.2), T(14), 0.5)

# ---------------- SFX synced to the visual edit (see src/timeline.js)
SFX_CUES = []


def sfx(kind, bar, beat, gain=1.0, pan=0.0, **kw):
    SFX_CUES.append(dict(kind=kind, t=round(T(bar, beat), 4)))
    t = T(bar, beat)
    if kind == 'whoosh':
        w = whoosh(kw.get('len', 0.45))
        fx.add(w, t - kw.get('len', 0.45) * 0.55, gain * 0.9)
    elif kind == 'pop':
        fx.add(pop(kw.get('f', 900)), t, gain * 0.55, pan)
    elif kind == 'tick':
        fx.add(tick(kw.get('f', 3200)), t, gain * 0.6, pan)
    elif kind == 'ding':
        fx.add(ding(kw.get('m', 84)), t, gain * 0.8, pan)


# shot 1 — growth-curve points pop on beats
for i in range(8):
    sfx('pop', i // 4, i % 4, 0.5 + 0.06 * i, pan=-0.6 + 0.17 * i, f=600 + 90 * i)
# shot 2 — word slams each beat (kick covers it) + counter ticks
for i in range(16):
    sfx('tick', 3, i * 0.25, 0.35, pan=-0.5 + i / 16, f=2800 + i * 60)
# shot 3 — five verbs
for i, b in enumerate((0, 1, 2, 3)):
    sfx('pop', 4, b, 0.4, pan=-0.5 + i * 0.33, f=1100)
sfx('whoosh', 5, 2.5, 0.8, len=0.6)
# shot 4 — module whip pans at each bar (6,7,8,9)
for bar in (7, 8, 9):
    sfx('whoosh', bar, 0, 0.75, len=0.42)
for bar in (6, 7, 8, 9):
    for i in range(6):
        sfx('tick', bar, 1 + i * 0.25, 0.28, pan=-0.4 + 0.16 * i, f=3600)
# shot 5 — checklist ticks on beats of the breakdown
for i, (bar, b) in enumerate(((10, 0.5), (10, 1.5), (10, 2.5), (10, 3.5), (11, 0.5))):
    sfx('ding', bar, b, 0.9, pan=-0.3 + i * 0.15, m=(80, 84, 87, 91, 92)[i])
sfx('whoosh', 12, 0, 0.9, len=0.35)
# shot 6 — bento tiles
for bar in (12, 13):
    for b in range(4):
        sfx('pop', bar, b + 0.5, 0.3, pan=(-0.4 if b % 2 else 0.4), f=1400)
# shot 7 — implode + logo
sfx('whoosh', 14, 0, 1.0, len=0.7)
for i in range(6):
    sfx('tick', 14, 1 + i * 0.125, 0.35, pan=-0.3 + i * 0.12, f=4200)
sfx('ding', 15, 0, 0.8, m=96)

# ---------------- mix
duck2 = np.vstack([duck, duck])
music_x = music.x * duck2
bass_x = np.vstack([lp(bass.x[c], 5000) for c in range(2)]) * duck2
arp_x = delay(arp.x * np.vstack([duck, duck]) ** 0.5, BEAT * 0.75, 0.4, 0.45)
ld_x = delay(ld.x, BEAT * 0.75, 0.3, 0.3) * duck2 ** 0.4

rev_send = music_x * 0.35 + arp_x * 0.35 + ld_x * 0.45 + drums.x * 0.06
rev = convolve_stereo(rev_send, reverb_ir(2.6))
rev = np.vstack([hp(rev[c], 350) for c in range(2)])

mix = (drums.x * 0.95 + bass_x * 0.42 + music_x * 1.5 + arp_x * 1.25 + ld_x * 1.35 + fx.x * 0.85 + rev * 0.9)
# master EQ: rumble cut, low-mid scoop, air shelf
mix = np.vstack([hp(mix[c], 28) for c in range(2)])
mix = mix - np.vstack([bp(mix[c], 180, 420) for c in range(2)]) * 0.3
mix = mix + np.vstack([hp(mix[c], 3500) for c in range(2)]) * 0.55

# master: gentle glue compression via rms follower, then soft clip and peak limit
mono = np.abs(mix).max(axis=0)
env = signal.lfilter([1 - np.exp(-1 / (0.03 * SR))], [1, -np.exp(-1 / (0.03 * SR))], mono)
thr = 0.55
gain = np.where(env > thr, (thr + (env - thr) / 3.0) / np.maximum(env, 1e-9), 1.0)
mix = mix * gain
mix = mix / np.abs(mix).max() * 1.35
mix = soft(mix, 1.25)
mix = mix / np.abs(mix).max() * 0.94

# trim to 30 s with a short fade on the last 350 ms of the ring-out
out = mix[:, : int(LEN * SR)]
fade = int(0.35 * SR)
out[:, -fade:] *= np.linspace(1, 0, fade) ** 2
out[:, :64] *= np.linspace(0, 1, 64)

from scipy.io import wavfile

here = os.path.dirname(os.path.abspath(__file__))
wavfile.write(os.path.join(here, 'soundtrack.wav'), SR, (out.T * 32767).astype(np.int16))
with open(os.path.join(here, 'cues.json'), 'w') as f:
    json.dump(dict(bpm=BPM, beat=BEAT, bar=BAR, sfx=SFX_CUES), f, indent=1)
print('wrote soundtrack.wav', out.shape, 'peak', np.abs(out).max())
