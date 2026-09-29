/* Shared timing grid + helpers. Everything is a pure function of time t (seconds). */
const BPM = 128, BEAT = 60 / BPM, BAR = BEAT * 4, DUR = 30;
const B = (bar, beat = 0) => bar * BAR + beat * BEAT;

const C = {
  ink: '#07080F', ink2: '#0E1020', panel: '#121528', paper: '#F3F4FA', lime: '#C6FF34',
  violet: '#6D4AFF', sky: '#38CFFF', coral: '#FF5C39', muted: '#8A8FAD', white: '#F7F8FF',
};

const $ = (s, r = document) => r.querySelector(s);
const SVGNS = 'http://www.w3.org/2000/svg';

function el(tag, cls, parent, html, style) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  if (style) Object.assign(e.style, style);
  if (parent) parent.appendChild(e);
  return e;
}
function box(parent, x, y, w, h, cls = '', style = {}) {
  return el('div', 'abs ' + cls, parent, null, Object.assign({ left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' }, style));
}
function txt(parent, x, y, html, style = {}, cls = '') {
  return el('div', 'abs ' + cls, parent, html, Object.assign({ left: x + 'px', top: y + 'px', whiteSpace: 'nowrap' }, style));
}
function svgEl(tag, attrs, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function svgBox(parent, x, y, w, h, vb) {
  const s = svgEl('svg', { width: w, height: h, viewBox: vb || `0 0 ${w} ${h}` });
  Object.assign(s.style, { position: 'absolute', left: x + 'px', top: y + 'px' });
  parent.appendChild(s);
  return s;
}

/* split text into per-character spans, optionally wrapped in a clipping mask */
function splitChars(node, masked = false) {
  const text = node.textContent;
  node.textContent = '';
  const host = masked ? el('span', 'mask', node) : node;
  const out = [];
  for (const ch of text) {
    const s = el('span', 'ch', host);
    s.textContent = ch === ' ' ? ' ' : ch;
    out.push(s);
  }
  return out;
}
/* scale font-size so the element fits in maxW x maxH (layout box, ignores transforms) */
function fitText(node, maxW, maxH, start = 400) {
  node.style.fontSize = start + 'px';
  const prevW = node.style.width, prevF = node.style.flexShrink;
  node.style.width = 'max-content'; node.style.flexShrink = '0';
  const w = node.offsetWidth, h = node.offsetHeight;
  node.style.width = prevW; node.style.flexShrink = prevF || '0';
  const k = Math.min(maxW / w, maxH ? maxH / h : 1e9);
  node.style.fontSize = (start * k).toFixed(2) + 'px';
  return start * k;
}

/* math */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  inQuad: k => k * k, inCubic: k => k * k * k, inQuart: k => k ** 4,
  outCubic: k => 1 - (1 - k) ** 3, outQuart: k => 1 - (1 - k) ** 4, outExpo: k => (k >= 1 ? 1 : 1 - 2 ** (-10 * k)),
  inOutCubic: k => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2),
  inOutQuart: k => (k < 0.5 ? 8 * k ** 4 : 1 - (-2 * k + 2) ** 4 / 2),
  inExpo: k => (k <= 0 ? 0 : 2 ** (10 * k - 10)),
  outBack: (k, s = 1.70158) => 1 + (s + 1) * (k - 1) ** 3 + s * (k - 1) ** 2,
  outElastic: k => (k === 0 || k === 1 ? k : 2 ** (-10 * k) * Math.sin((k * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
};
/* deterministic smooth noise */
function noise1(x, seed = 0) {
  return (Math.sin(x * 1.0 + seed * 12.9898) * 0.5 + Math.sin(x * 2.17 + seed * 4.1414 + 1.3) * 0.3 + Math.sin(x * 4.73 + seed * 7.77 + 2.1) * 0.2);
}
function rnd(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* procedural per-frame tracks */
const tracks = [];
const track = fn => tracks.push(fn);

/* scene registry: visibility windows */
const scenes = [];
function scene(id, t0, t1, bg) {
  const s = el('div', 'scene', $('#cam'));
  s.id = id;
  if (bg) el('div', 'fill', s, null, { background: bg });
  scenes.push({ s, t0, t1 });
  return s;
}

/* typing text */
function typer(node, text, t0, t1, caret = true) {
  track(t => {
    const k = prog(t, t0, t1);
    const n = Math.round(k * text.length);
    const on = caret && (k < 1 || Math.floor(t / (BEAT / 2)) % 2 === 0) && t >= t0 - 0.2;
    node.innerHTML = text.slice(0, n).replace(/ /g, '&nbsp;') + (on ? '<span style="color:#C6FF34">|</span>' : '');
  });
}
/* number counter */
function counter(node, from, to, t0, t1, fmt = v => Math.round(v).toLocaleString('en-IN'), ease = E.outExpo) {
  track(t => { node.textContent = fmt(lerp(from, to, ease(prog(t, t0, t1)))); });
}
/* scramble decode */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+/<>';
function scramble(chars, finals, t0, each = 0.03, dur = 0.18, seed = 1) {
  track(t => {
    chars.forEach((c, i) => {
      const settle = t0 + dur + i * each;
      if (t >= settle || t < t0) c.textContent = finals[i];
      else {
        const r = rnd(seed * 1000 + i * 31 + Math.floor(t * 30))();
        c.textContent = finals[i] === ' ' ? ' ' : GLYPHS[Math.floor(r * GLYPHS.length)];
      }
    });
  });
}

/* the master timeline */
gsap.registerPlugin(DrawSVGPlugin, CustomEase);
const tl = gsap.timeline({ paused: true });
CustomEase.create('snap', 'M0,0 C0.14,0 0.12,1.12 0.42,1.04 0.62,0.99 0.8,1 1,1');
CustomEase.create('whip', 'M0,0 C0.6,0 0.28,1 1,1');
