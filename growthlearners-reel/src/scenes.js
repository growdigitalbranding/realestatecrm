/* =====================================================================
   GROWTHLEARNERS — 30s showreel.  Edit locked to a 128 BPM grid:
   bar 0-1  S1 growth curve (intro)        bar 10-11 S6 "you finish owning" (breakdown)
   bar 2    S2 LEARN / AI / DIGITAL / MKT  bar 12-13 S7 bento stats (drop B)
   bar 3    S3 30 days                     bar 14-15 S8 logo resolve + end card
   bar 4-5  S4 research → launch
   bar 6-9  S5 four modules (one per bar)
   ===================================================================== */

const KICKS = [];
[2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14].forEach(b => { for (let i = 0; i < 4; i++) KICKS.push(B(b, i)); });
KICKS.push(B(15));
const IMPACTS = [{ t: B(2), a: 20 }, { t: B(12), a: 24 }, { t: B(14), a: 18 }, { t: B(15), a: 12 }];
const CAM = { x: 0, y: 0, s: 1, r: 0 };

/* ------------------------------------------------------------------ S1 */
function S1() {
  const s = scene('s1', 0, B(2) + 0.01, 'radial-gradient(ellipse at 50% 60%, #121634 0%, #07080F 70%)');
  const svg = svgBox(s, 0, 0, 1920, 1080);
  const defs = svgEl('defs', {}, svg);
  const lg = svgEl('linearGradient', { id: 'gArea', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  svgEl('stop', { offset: 0, 'stop-color': C.lime, 'stop-opacity': 0.34 }, lg);
  svgEl('stop', { offset: 1, 'stop-color': C.lime, 'stop-opacity': 0 }, lg);
  const cp = svgEl('clipPath', { id: 'cArea' }, defs);
  const clipR = svgEl('rect', { x: 0, y: 0, width: 0, height: 1400 }, cp);
  const tg = svgEl('linearGradient', { id: 'gTrail', x1: 0, y1: 1, x2: 0, y2: 0 }, defs);
  svgEl('stop', { offset: 0, 'stop-color': C.lime, 'stop-opacity': 0 }, tg);
  svgEl('stop', { offset: 1, 'stop-color': C.lime, 'stop-opacity': 1 }, tg);

  // design-canvas "+" markers
  const marks = [];
  const gm = svgEl('g', {}, svg);
  for (let yy = 0; yy < 9; yy++) for (let xx = 0; xx < 15; xx++) {
    const x = 40 + xx * 140, y = 20 + yy * 140;
    marks.push(svgEl('path', { d: `M${x - 7} ${y}H${x + 7}M${x} ${y - 7}V${y + 7}`, stroke: '#fff', 'stroke-width': 1.5, opacity: 0.2 }, gm));
  }
  tl.fromTo(marks, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.7, ease: 'back.out(3)', stagger: { each: 0.004, from: 'center', grid: [9, 15] } }, 0.02);
  // baseline axis
  const axis = svgEl('path', { d: 'M180 880 H1760', stroke: 'rgba(255,255,255,.25)', 'stroke-width': 2 }, svg);
  tl.fromTo(axis, { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 0.9, ease: 'expo.out' }, 0.05);
  for (let i = 0; i <= 10; i++) {
    const tk = svgEl('path', { d: `M${180 + i * 158} 880 v12`, stroke: 'rgba(255,255,255,.35)', 'stroke-width': 2 }, svg);
    tl.fromTo(tk, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.1 + i * 0.03);
  }

  const P = [[240, 800], [440, 716], [640, 752], [840, 600], [1040, 640], [1240, 470], [1440, 410], [1640, 240]];
  const PT = P.map((_, i) => B(0, i));
  const area = svgEl('path', { d: `M${P[0][0]} 880 ` + P.map(p => `L${p[0]} ${p[1]}`).join(' ') + ` L${P[7][0]} 880 Z`, fill: 'url(#gArea)', 'clip-path': 'url(#cArea)' }, svg);
  const line = svgEl('path', { d: 'M' + P.map(p => p.join(' ')).join(' L'), fill: 'none', stroke: C.lime, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
  const segL = P.slice(1).map((p, i) => Math.hypot(p[0] - P[i][0], p[1] - P[i][1]));
  const total = segL.reduce((a, b) => a + b, 0);
  line.setAttribute('stroke-dasharray', total + ' ' + total);
  const trail = svgEl('rect', { x: P[7][0] - 5, y: 0, width: 10, height: 0, rx: 5, fill: 'url(#gTrail)' }, svg);

  const head = t => {
    let h = 0;
    for (let i = 1; i < 8; i++) h += E.inQuad(prog(t, PT[i] - 0.3, PT[i]));
    const i = Math.min(6, Math.floor(h)), f = h - i;
    const x = lerp(P[i][0], P[i + 1][0], f), y = lerp(P[i][1], P[i + 1][1], f);
    let len = 0; for (let k = 0; k < i; k++) len += segL[k]; len += segL[i] * f;
    return { h, x, y, len };
  };

  const labels = ['DAY 01', 'DAY 05', 'DAY 09', 'DAY 13', 'DAY 17', 'DAY 21', 'DAY 26', 'DAY 30'];
  const dots = P.map((p, i) => {
    const g = svgEl('g', { transform: `translate(${p[0]} ${p[1]})` }, svg);
    const ring = svgEl('circle', { r: 16, fill: 'none', stroke: C.lime, 'stroke-width': 3, opacity: 0 }, g);
    const halo = svgEl('circle', { r: 30, fill: C.lime, opacity: 0.18 }, g);
    const dot = svgEl('circle', { r: 13, fill: i === 7 ? C.lime : C.ink, stroke: C.lime, 'stroke-width': 5 }, g);
    const lab = svgEl('g', {}, g);
    svgEl('rect', { x: -58, y: -78, width: 116, height: 38, rx: 19, fill: i === 7 ? C.lime : 'rgba(255,255,255,.08)', stroke: 'rgba(255,255,255,.2)' }, lab);
    const tx = svgEl('text', { x: 0, y: -52, 'text-anchor': 'middle', fill: i === 7 ? C.ink : '#fff', 'font-family': 'Mono', 'font-size': 16, 'font-weight': 700, 'letter-spacing': 2 }, lab);
    tx.textContent = labels[i];
    const t = PT[i];
    tl.fromTo([dot, halo], { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.45, ease: 'back.out(4)' }, t);
    tl.fromTo(ring, { attr: { r: 14 }, opacity: 1 }, { attr: { r: 90 }, opacity: 0, duration: 0.6, ease: 'expo.out', immediateRender: false }, t);
    tl.fromTo(lab, { y: 26, opacity: 0, scale: 0.6, transformOrigin: '50% 100%' }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2.5)' }, t + 0.04);
    return g;
  });

  // caption
  const cap = txt(s, 300, 150, 'fig. 01 — the 30-day growth curve', { fontSize: '22px', color: C.muted }, 'mono');
  const cap2 = txt(s, 300, 184, '<span class="serif" style="font-size:64px;color:#fff;text-transform:none;letter-spacing:0">Every career has a curve.</span>', {}, '');
  tl.fromTo(cap, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5, ease: 'expo.out' }, B(0, 2));
  const capChars = splitChars(cap2.firstChild, true);
  tl.fromTo(capChars, { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: 'expo.out', stagger: 0.012 }, B(1, 0));

  track(t => {
    if (t >= B(2)) return;
    const hd = head(t);
    line.setAttribute('stroke-dashoffset', total - hd.len);
    clipR.setAttribute('width', hd.x);
    // rocket: last point shoots up
    const k = E.inCubic(prog(t, B(1, 3.35), B(2)));
    const y7 = -1100 * k;
    dots[7].setAttribute('transform', `translate(${P[7][0]} ${P[7][1] + y7}) scale(${1 + k * 0.6},${1 + k * 1.8})`);
    trail.setAttribute('y', P[7][1] + y7);
    trail.setAttribute('height', Math.max(0, -y7));
    // anticipation squash
    const sq = Math.sin(Math.PI * prog(t, B(1, 3), B(1, 3.4))) * 0.06;
    svg.style.transform = `scaleY(${1 - sq})`;
    svg.style.transformOrigin = '50% 880px';
    // camera follows the head
    const push = E.inOutCubic(prog(t, 0, B(1, 3.4)));
    CAM.s = 1.02 + 0.13 * push;
    CAM.x = -(hd.x - 960) * 0.2 * push;
    CAM.y = -(hd.y - 560) * 0.4 * push + 700 * E.inQuart(prog(t, B(1, 3.3), B(2)));
    CAM.r = -2 + 2 * push;
  });

  // iris to lime (screen-space)
  const iris = $('#iris');
  tl.set(iris, { x: 960 - 100, y: 180 - 100 }, 0);
  tl.fromTo(iris, { scale: 0 }, { scale: 26, duration: 0.2, ease: 'power2.in' }, B(2) - 0.2);
  tl.set(iris, { scale: 0 }, B(2) + 0.001);
}

/* ------------------------------------------------------------------ S2 */
function S2() {
  const words = [
    { w: 'LEARN', bg: C.lime, fg: C.ink },
    { w: 'AI', bg: C.ink, fg: C.lime },
    { w: 'DIGITAL', bg: C.violet, fg: '#fff' },
    { w: 'MARKETING', bg: C.paper, fg: C.ink },
  ];
  words.forEach((o, i) => {
    const t = B(2, i), t1 = B(2, i + 1);
    const s = scene('s2_' + i, t, t1, o.bg);
    const stageW = el('div', 'abs', s, null, { left: 0, top: 0, width: '1920px', height: '1080px', display: 'flex', alignItems: 'center', justifyContent: 'center' });
    const w = el('div', 'arch', stageW, o.w, { color: o.fg, position: 'relative', fontStretch: '125%' });
    fitText(w, o.w === 'AI' ? 900 : 1720, o.w === 'AI' ? 640 : 440);
    const chars = splitChars(w, true);
    tl.fromTo(stageW, { scale: 1 }, { scale: 1.07, duration: BEAT, ease: 'power1.out' }, t);
    if (o.w === 'LEARN') {
      const ring = box(s, 960 - 300, 540 - 300, 600, 600, '', { border: '8px solid ' + C.ink, borderRadius: '50%' });
      s.insertBefore(ring, stageW);
      tl.fromTo(ring, { scale: 0.2, opacity: 1 }, { scale: 3.2, opacity: 0, duration: 0.55, ease: 'expo.out' }, t);
      tl.fromTo(chars, { yPercent: 120, rotation: 12 }, { yPercent: 0, rotation: 0, duration: 0.42, ease: 'expo.out', stagger: 0.03 }, t - 0.03);
    } else if (o.w === 'AI') {
      tl.fromTo(chars, { scale: 0, rotation: -25 }, { scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(2.2)', stagger: 0.05 }, t - 0.02);
      const star = 'M100 0 C108 70 130 92 200 100 C130 108 108 130 100 200 C92 130 70 108 0 100 C70 92 92 70 100 0Z';
      [[1370, 170, 220, 0], [470, 720, 120, 0.06], [1480, 780, 70, 0.1]].forEach(([x, y, sz, d]) => {
        const sv = svgBox(s, x, y, sz, sz, '0 0 200 200');
        svgEl('path', { d: star, fill: C.lime }, sv);
        tl.fromTo(sv, { scale: 0, rotation: -120 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(3)' }, t + d);
      });
    } else if (o.w === 'DIGITAL') {
      scramble(chars, chars.map(c => c.textContent), t, 0.028, 0.14, 3);
      tl.fromTo(chars, { x: 140, opacity: 0 }, { x: 0, opacity: 1, duration: 0.32, ease: 'expo.out', stagger: 0.02 }, t - 0.02);
      const r = rnd(9);
      for (let k = 0; k < 26; k++) {
        const sz = 18 + Math.floor(r() * 3) * 14;
        const px = Math.round((140 + r() * 1640) / 28) * 28, py = Math.round((90 + r() * 900) / 28) * 28;
        if (py > 330 && py < 750) continue;
        const sq = box(s, px, py, sz, sz, '', { background: r() > 0.5 ? C.lime : '#fff' });
        tl.fromTo(sq, { scale: 0 }, { scale: 1, duration: 0.14, ease: 'back.out(3)', yoyo: true, repeat: 1, repeatDelay: 0.06 + r() * 0.08 }, t + r() * 0.2);
      }
    } else {
      const hl = box(s, 90, 380, 1740, 330, '', { background: C.lime, transformOrigin: '0% 50%' });
      s.insertBefore(hl, stageW);
      tl.fromTo(hl, { scaleX: 0 }, { scaleX: 1, duration: 0.34, ease: 'expo.out' }, t + 0.02);
      tl.fromTo(chars, { yPercent: -120 }, { yPercent: 0, duration: 0.38, ease: 'expo.out', stagger: 0.018 }, t - 0.02);
      track(tt => { if (tt >= t - 0.1 && tt <= t1) w.style.fontStretch = (80 + 45 * E.outExpo(prog(tt, t, t + 0.4))) + '%'; });
    }
    // tiny meta caption
    const m = txt(s, 90, 980, `0${i + 1} / 04 &nbsp; — &nbsp; ${['the craft', 'the engine', 'the medium', 'the job'][i]}`, { fontSize: '18px', color: o.fg, opacity: 0.7 }, 'mono');
    tl.fromTo(m, { x: -20, opacity: 0 }, { x: 0, opacity: 0.7, duration: 0.3, ease: 'expo.out' }, t + 0.05);
  });
}

/* ------------------------------------------------------------------ S3 */
function S3() {
  const t0 = B(3), t1 = B(4) + 0.02;
  const s = scene('s3', t0, t1, C.ink);
  // odometer "30"
  const odo = box(s, 150, 150, 640, 560, '', { overflow: 'hidden' });
  const digH = 760;
  const cols = [0, 1].map(k => {
    const col = box(odo, k * 300, 0, 300, digH * 11);
    for (let d = 0; d <= 10; d++) {
      el('div', 'arch', col, String(d % 10), { position: 'absolute', left: 0, top: d * digH + 'px', height: digH + 'px', width: '300px', fontSize: '560px', lineHeight: '560px', paddingTop: '20px', textAlign: 'center', color: C.lime, fontStretch: '100%' });
    }
    return col;
  });
  track(t => {
    if (t < t0 - 0.1 || t > t1) return;
    const v = 30 * E.outCubic(prog(t, t0, B(3, 2.4)));
    const ones = v % 10;
    const tens = Math.floor(v / 10) + Math.max(0, ones - 9);
    cols[0].style.transform = `translateY(${-tens * digH}px)`;
    cols[1].style.transform = `translateY(${-ones * digH}px)`;
  });
  tl.fromTo(odo, { scale: 0.4, opacity: 0, rotation: -8 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.5, ease: 'back.out(1.8)' }, t0);
  const days = txt(s, 168, 700, 'DAYS', { fontSize: '200px', color: '#fff', fontStretch: '125%' }, 'arch');
  const dch = splitChars(days, true);
  tl.fromTo(dch, { yPercent: 110 }, { yPercent: 0, duration: 0.45, ease: 'expo.out', stagger: 0.04 }, t0 + BEAT * 0.5);
  const sub = txt(s, 172, 930, '20 live sessions · offline · Coimbatore', { fontSize: '22px', color: C.muted }, 'mono');
  tl.fromTo(sub, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4, ease: 'expo.out' }, t0 + BEAT * 1);

  // calendar
  const cal = box(s, 1010, 150, 760, 780, 'card');
  const hd = txt(cal, 40, 36, 'OCTOBER · BATCH', { fontSize: '20px', color: C.lime, letterSpacing: '.18em' }, 'mono');
  txt(cal, 560, 36, '2026', { fontSize: '20px', color: C.muted }, 'mono');
  'MTWTFSS'.split('').forEach((d, i) => txt(cal, 52 + i * 98, 100, d, { fontSize: '18px', color: C.muted, width: '80px', textAlign: 'center' }, 'mono'));
  const weekCol = [C.lime, C.sky, C.violet, C.coral, C.coral];
  const cells = [];
  for (let i = 0; i < 35; i++) {
    const r = Math.floor(i / 7), c = i % 7;
    const cell = box(cal, 40 + c * 98, 150 + r * 118, 86, 104, '', { borderRadius: '16px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.07)' });
    if (i < 30) {
      const fillc = box(cell, 0, 0, 86, 104, '', { borderRadius: '16px', background: weekCol[r] });
      txt(cell, 12, 10, String(i + 1).padStart(2, '0'), { fontSize: '18px', color: 'rgba(255,255,255,.55)' }, 'mono');
      const n2 = txt(fillc, 12, 10, String(i + 1).padStart(2, '0'), { fontSize: '18px', color: C.ink, fontWeight: 700 }, 'mono');
      cells.push([cell, fillc]);
    }
  }
  tl.fromTo(cal, { y: 120, opacity: 0, rotationX: 30, transformPerspective: 1600 }, { y: 0, opacity: 1, rotationX: 0, duration: 0.55, ease: 'expo.out' }, t0);
  cells.forEach(([cell, f], i) => {
    const t = t0 + BEAT * 0.25 + i * 0.048;
    tl.fromTo(f, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(3)' }, t);
  });
  const legend = el('div', 'abs', s, null, { left: '1010px', top: '958px', display: 'flex', gap: '14px' });
  ['Research', 'Create', 'Video', 'Launch'].forEach((l, i) => {
    const c = el('div', 'chip', legend, `<span class="dot" style="background:${weekCol[i]}"></span>${l}`, { height: '40px', fontSize: '17px' });
    tl.fromTo(c, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'back.out(2)' }, t0 + BEAT * (0.5 + i * 0.5));
  });

  // slab wipe transition into S4
  const wipe = el('div', 'abs', $('#stage'), null, { left: 0, top: 0, width: '1920px', height: '1080px', pointerEvents: 'none' });
  $('#stage').insertBefore(wipe, $('#iris'));
  [C.lime, C.violet, '#fff'].forEach((c, i) => {
    const slab = box(wipe, 0, -400, 1100, 1900, '', { background: c, transform: 'rotate(18deg)' });
    tl.fromTo(slab, { x: -1700 }, { x: 2600, duration: 0.42, ease: 'power3.inOut' }, B(3, 3.45) + i * 0.045);
  });
}

/* ------------------------------------------------------------------ icons */
function gearPath(cx, cy, r1, r2, teeth) {
  let d = '';
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2, a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
    const r = i % 2 ? r1 : r2;
    const p0 = [cx + r * Math.cos(a0 + 0.05), cy + r * Math.sin(a0 + 0.05)], p1 = [cx + r * Math.cos(a1 - 0.05), cy + r * Math.sin(a1 - 0.05)];
    d += (i ? 'L' : 'M') + p0.map(v => v.toFixed(1)).join(' ') + 'L' + p1.map(v => v.toFixed(1)).join(' ');
  }
  return d + 'Z';
}
const ICONS = {
  research: ['M85 30a55 55 0 1 1 0 110a55 55 0 1 1 0-110Z', 'M125 125 L172 172', 'M60 85 h50'],
  strategize: ['M100 25a75 75 0 1 1 0 150a75 75 0 1 1 0-150Z', 'M100 60a40 40 0 1 1 0 80a40 40 0 1 1 0-80Z', 'M100 100 L168 32', 'M150 30 h20 v20'],
  create: ['M100 18 C108 78 122 92 182 100 C122 108 108 122 100 182 C92 122 78 108 18 100 C78 92 92 78 100 18Z', 'M160 30 v24 M148 42 h24'],
  automate: [gearPath(100, 100, 58, 78, 9), 'M100 78a22 22 0 1 1 0 44a22 22 0 1 1 0-44Z'],
  launch: ['M100 18 C140 50 146 108 132 146 L68 146 C54 108 60 50 100 18Z', 'M100 62a15 15 0 1 1 0 30a15 15 0 1 1 0-30Z', 'M68 112 L42 156 L70 146', 'M132 112 L158 156 L130 146'],
};
function icon(parent, name, x, y, size, color = '#fff', sw = 9) {
  const sv = svgBox(parent, x, y, size, size, '0 0 200 200');
  const paths = ICONS[name].map(d => svgEl('path', { d, fill: 'none', stroke: color, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, sv));
  return { sv, paths };
}

/* ------------------------------------------------------------------ S4 */
function S4() {
  const t0 = B(4), t1 = B(6) + 0.3;
  const s = scene('s4', t0 - 0.05, t1, 'radial-gradient(ellipse at 50% 40%, #1b1545 0%, #07080F 65%)');
  const verbs = ['RESEARCH', 'STRATEGIZE', 'CREATE', 'AUTOMATE', 'LAUNCH'];
  const keys = ['research', 'strategize', 'create', 'automate', 'launch'];
  const times = [B(4, 0), B(4, 1), B(4, 2), B(4, 3), B(5, 0)];
  const wrap = box(s, 0, 0, 1920, 1080);
  const stepsRow = el('div', 'abs', s, null, { left: '260px', top: '900px', width: '1400px', height: '80px' });
  const rail = box(stepsRow, 30, 28, 1340, 4, '', { background: 'rgba(255,255,255,.12)', borderRadius: '2px' });
  const railFill = box(stepsRow, 30, 28, 1340, 4, '', { background: C.lime, borderRadius: '2px', transformOrigin: '0 50%' });
  tl.fromTo(railFill, { scaleX: 0 }, { scaleX: 0.25, duration: 0.3, ease: 'expo.out' }, times[1]);
  tl.to(railFill, { scaleX: 0.5, duration: 0.3, ease: 'expo.out' }, times[2]);
  tl.to(railFill, { scaleX: 0.75, duration: 0.3, ease: 'expo.out' }, times[3]);
  tl.to(railFill, { scaleX: 1, duration: 0.3, ease: 'expo.out' }, times[4]);
  tl.fromTo(stepsRow, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'expo.out' }, t0);

  verbs.forEach((v, i) => {
    const t = times[i], tn = times[i + 1];
    const node = box(stepsRow, 30 + i * 335 - 30, 0, 60, 60, '', { borderRadius: '50%', background: '#15183a', border: '2px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' });
    const num = el('div', 'mono', node, '0' + (i + 1), { fontSize: '16px', color: '#fff', fontWeight: 700 });
    const lab = txt(stepsRow, 30 + i * 335 - 100, 70, v, { fontSize: '15px', width: '200px', textAlign: 'center', color: C.muted }, 'mono');
    tl.to(node, { backgroundColor: C.lime, borderColor: C.lime, duration: 0.12 }, t);
    tl.to(num, { color: C.ink, duration: 0.12 }, t);
    tl.fromTo(node, { scale: 1 }, { scale: 1.35, duration: 0.12, ease: 'power2.out', yoyo: true, repeat: 1 }, t);
    tl.to(lab, { color: '#fff', duration: 0.1 }, t);

    const grp = box(wrap, 0, 0, 1920, 1080);
    const ic = icon(grp, keys[i], 960 - 130, 170, 260, i === 4 ? C.lime : '#fff', 9);
    const disc = box(grp, 960 - 170, 130, 340, 340, '', { borderRadius: '50%', background: i % 2 ? C.violet : 'rgba(198,255,52,.14)' });
    grp.insertBefore(disc, ic.sv);
    const word = el('div', 'arch', grp, v, { position: 'absolute', left: 0, width: '1920px', top: '520px', textAlign: 'center', color: '#fff' });
    fitText(word, 1500, 250, 240);
    word.style.width = '1920px';
    const ch = splitChars(word, true);
    tl.fromTo(disc, { scale: 0 }, { scale: 1, duration: 0.45, ease: 'back.out(2.2)' }, t - 0.02);
    tl.fromTo(ic.paths, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.4, ease: 'expo.out', stagger: 0.04 }, t);
    tl.fromTo(ic.sv, { scale: 0.5, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2.5)' }, t - 0.02);
    tl.fromTo(ch, { yPercent: 115 }, { yPercent: 0, duration: 0.36, ease: 'expo.out', stagger: 0.02 }, t - 0.03);
    if (i < 4) {
      // exit before next verb
      tl.to(ch, { yPercent: -115, duration: 0.16, ease: 'power3.in', stagger: 0.01 }, tn - 0.16);
      tl.to([disc, ic.sv], { scale: 0, rotation: 60, duration: 0.16, ease: 'power3.in' }, tn - 0.16);
      if (keys[i] === 'automate') tl.to(ic.paths[0], { rotation: 90, transformOrigin: '50% 50%', duration: BEAT, ease: 'none' }, t);
    } else {
      // LAUNCH: shake, countdown, lift-off, whip up
      track(tt => {
        if (tt < B(5, 1) || tt > B(6)) return;
        const a = 6 * E.inQuad(prog(tt, B(5, 1), B(5, 2.5)));
        const lift = E.inCubic(prog(tt, B(5, 2.5), B(5, 3.4)));
        ic.sv.style.translate = `${noise1(tt * 60, 1) * a}px ${noise1(tt * 60, 2) * a - lift * 1100}px`;
        word.style.scale = `${1 - 0.08 * Math.sin(Math.PI * prog(tt, B(5, 2.3), B(5, 2.9)))} ${1 + 0.25 * Math.sin(Math.PI * prog(tt, B(5, 2.3), B(5, 2.9)))}`;
      });
      const flame = svgBox(grp, 960 - 50, 420, 100, 180, '0 0 100 180');
      const fp = svgEl('path', { d: 'M20 0 Q50 180 80 0 Z', fill: C.lime }, flame);
      tl.fromTo(flame, { scaleY: 0, transformOrigin: '50% 0%' }, { scaleY: 1, duration: 0.2, ease: 'back.out(3)' }, B(5, 2.2));
      track(tt => {
        if (tt < B(5, 2.2) || tt > B(6)) return;
        const lift = E.inCubic(prog(tt, B(5, 2.5), B(5, 3.4)));
        flame.style.translate = `0 ${-lift * 1100}px`;
        flame.style.scale = `1 ${0.8 + 0.4 * Math.abs(Math.sin(tt * 40))}`;
      });
      // smoke puffs
      const r = rnd(44);
      for (let k = 0; k < 16; k++) {
        const pz = 40 + r() * 80;
        const p = box(grp, 960 - pz / 2 + (r() - 0.5) * 60, 440, pz, pz, '', { borderRadius: '50%', background: 'rgba(255,255,255,.85)' });
        const st = B(5, 2.3) + r() * 0.35;
        tl.fromTo(p, { scale: 0, x: 0, y: 0, opacity: 0.9 }, { scale: 1.8, x: (r() - 0.5) * 700, y: 60 + r() * 120, opacity: 0, duration: 0.8, ease: 'expo.out' }, st);
      }
      ['3', '2', '1'].forEach((n, k) => {
        const c = txt(grp, 1500, 220, n, { fontSize: '120px', color: C.lime, fontStretch: '125%' }, 'arch');
        tl.fromTo(c, { scale: 2.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.18, ease: 'expo.out' }, B(5, 1 + k * 0.5));
        tl.to(c, { opacity: 0, scale: 0.6, duration: 0.12 }, B(5, 1.4 + k * 0.5));
      });
    }
  });
  const title = txt(s, 90, 80, 'the method', { fontSize: '20px', color: C.muted }, 'mono');
  tl.fromTo(title, { opacity: 0 }, { opacity: 1, duration: 0.3 }, t0);
}

/* ------------------------------------------------------------------ S5 modules */
function moduleShell(parent, i, title, line, chips, t) {
  const p = box(parent, i * 1920, 0, 1920, 1080);
  const num = txt(p, 110, 90, '0' + (i + 1), { fontSize: '300px', color: 'transparent', WebkitTextStroke: '2px rgba(198,255,52,.9)', fontStretch: '125%', lineHeight: '1' }, 'arch');
  const tag = txt(p, 120, 420, `module 0${i + 1} / 04`, { fontSize: '18px', color: C.lime }, 'mono');
  const ttl = txt(p, 116, 460, title, { fontSize: '92px', color: '#fff', whiteSpace: 'nowrap', width: '760px', fontStretch: '100%', lineHeight: '.95' }, 'arch');
  const ln = txt(p, 120, 700, line, { fontSize: '27px', color: '#b9bdd6', whiteSpace: 'normal', width: '640px', lineHeight: '1.35', fontWeight: 450 });
  const chipWrap = el('div', 'abs', p, null, { left: '120px', top: '850px', width: '720px', display: 'flex', flexWrap: 'wrap', gap: '12px' });
  const chipEls = chips.map(c => el('div', 'chip', chipWrap, `<span class="dot"></span>${c}`));
  const tch = splitChars(num);
  tl.fromTo(tch, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out', stagger: 0.05 }, t + 0.02);
  tl.fromTo(tag, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4, ease: 'expo.out' }, t + 0.05);
  const words = ttl.innerHTML.split('<br>');
  ttl.innerHTML = '';
  const lines = words.map(w => { const d = el('div', null, ttl, w); return splitChars(d, true); }).flat();
  tl.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: 'expo.out', stagger: 0.012 }, t + 0.04);
  tl.fromTo(ln, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, t + BEAT * 0.5);
  chipEls.forEach((c, k) => tl.fromTo(c, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(3)' }, t + BEAT * (1 + k * 0.25)));
  return p;
}
function cardIn(c, t, from = {}) {
  tl.fromTo(c, Object.assign({ x: 260, opacity: 0, rotationY: -28, transformPerspective: 1800, transformOrigin: '0% 50%' }, from), { x: 0, y: 0, opacity: 1, rotationY: 0, rotationX: 0, duration: 0.6, ease: 'expo.out' }, t);
}
function S5() {
  const t0 = B(6), t1 = B(10) + 0.02;
  const s = scene('s5', t0 - 0.35, t1, 'radial-gradient(ellipse at 70% 50%, #161a3a 0%, #07080F 70%)');
  const rail = box(s, 0, 0, 1920 * 4, 1080);
  // whip-pans between modules (x) + vertical arrival from S4
  track(t => {
    if (t < t0 - 0.4 || t > t1) return;
    let x = 0, blur = 0;
    for (let i = 1; i < 4; i++) {
      const k = prog(t, B(6 + i) - 0.3, B(6 + i) + 0.12);
      x -= 1920 * E.inOutQuart(k);
      blur += Math.sin(Math.PI * k) * 60;
    }
    rail.style.transform = `translate(${x}px, 0px)`;
    $('#mbxb').setAttribute('stdDeviation', `${blur.toFixed(1)} 0`);
    rail.style.filter = blur > 0.5 ? 'url(#mbx)' : 'none';
    // vertical whip from S4 (camera follows the rocket up)
    const ky = prog(t, t0 - 0.32, t0 + 0.1);
    const y = 1080 * E.inOutQuart(ky);
    const by = ky > 0 && ky < 1 ? Math.sin(Math.PI * ky) * 55 : 0;
    $('#mbyb').setAttribute('stdDeviation', `0 ${by.toFixed(1)}`);
    const s4 = $('#s4');
    s4.style.transform = `translateY(${y}px)`;
    s.style.transform = `translateY(${y - 1080}px)`;
    s4.style.filter = s.style.filter = by > 0.5 ? 'url(#mby)' : 'none';
    if (blur > 0.5) s.style.filter = 'none';
  });

  /* ---- 01 research & strategy */
  const T1 = B(6);
  const p1 = moduleShell(rail, 0, 'Research &amp;<br>Strategy', 'Decide who it’s for, what it says and what it must achieve — before anything is generated.', ['Research pack', 'Positioning line', '30-day calendar', 'Creative brief'], T1 - 0.16);
  const search = box(p1, 880, 150, 900, 100, 'card', { borderRadius: '50px' });
  icon(search, 'research', 34, 24, 52, C.lime, 16);
  const q = txt(search, 110, 30, '', { fontSize: '32px', color: '#fff', fontWeight: 500 });
  typer(q, 'ai digital marketing course coimbatore', T1 + 0.15, T1 + BEAT * 2.2);
  cardIn(search, T1 - 0.05);
  const persona = box(p1, 880, 290, 430, 470, 'card');
  txt(persona, 30, 26, 'persona', { fontSize: '15px', color: C.muted, letterSpacing: '.16em' }, 'mono');
  const av = box(persona, 30, 70, 110, 110, '', { borderRadius: '50%', background: `linear-gradient(135deg, ${C.lime}, ${C.sky})`, display: 'flex', alignItems: 'center', justifyContent: 'center' });
  el('div', 'arch', av, 'PR', { color: C.ink, fontSize: '44px', fontStretch: '110%' });
  txt(persona, 160, 86, 'Priya R.', { fontSize: '36px', fontWeight: 700 });
  txt(persona, 160, 136, '27 · career switcher', { fontSize: '20px', color: C.muted });
  const tags = el('div', 'abs', persona, null, { left: '30px', top: '210px', width: '380px', display: 'flex', flexWrap: 'wrap', gap: '10px' });
  ['Coimbatore', 'Instagram', 'Evenings', 'No code'].forEach((g, k) => {
    const c = el('div', 'chip', tags, g, { height: '38px', fontSize: '17px', padding: '0 16px' });
    tl.fromTo(c, { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, T1 + 0.2 + k * 0.06);
  });
  [['Intent', 0.86, C.lime], ['Budget fit', 0.72, C.sky], ['Urgency', 0.64, C.violet]].forEach(([l, v, c], k) => {
    txt(persona, 30, 330 + k * 44, l, { fontSize: '18px', color: C.muted });
    const b0 = box(persona, 170, 338 + k * 44, 230, 12, 'bar');
    const b1 = box(persona, 170, 338 + k * 44, 230 * v, 12, 'bar', { background: c, transformOrigin: '0 50%' });
    tl.fromTo(b1, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'expo.out' }, T1 + BEAT * (1 + k * 0.25));
  });
  cardIn(persona, T1 + 0.04);
  const calc = box(p1, 1340, 290, 440, 470, 'card');
  txt(calc, 30, 26, 'content · 30 days', { fontSize: '15px', color: C.muted, letterSpacing: '.16em' }, 'mono');
  const kinds = [C.lime, C.violet, C.sky, 'rgba(255,255,255,.14)'];
  const rr = rnd(5);
  for (let k = 0; k < 30; k++) {
    const c = k % 6, r = Math.floor(k / 6);
    const col = kinds[Math.floor(rr() * 4)];
    const cell = box(calc, 30 + c * 64, 76 + r * 64, 54, 54, '', { borderRadius: '12px', background: col });
    tl.fromTo(cell, { scale: 0, rotation: -45 }, { scale: 1, rotation: 0, duration: 0.3, ease: 'back.out(3)' }, T1 + BEAT * 1 + k * 0.022);
  }
  const lg = el('div', 'abs', calc, null, { left: '30px', top: '420px', display: 'flex', gap: '18px', fontSize: '15px', color: C.muted, fontFamily: 'Mono', letterSpacing: '.1em' });
  lg.innerHTML = `<span><b style="color:${C.lime}">■</b> REEL</span><span><b style="color:${C.violet}">■</b> CAROUSEL</span><span><b style="color:${C.sky}">■</b> STORY</span>`;
  cardIn(calc, T1 + 0.1);
  const pos = box(p1, 880, 790, 900, 150, 'card', { background: C.lime, border: 'none' });
  txt(pos, 34, 24, 'positioning', { fontSize: '15px', color: 'rgba(7,8,15,.6)', letterSpacing: '.16em' }, 'mono');
  const pq = txt(pos, 34, 54, '', { fontSize: '54px', color: C.ink }, 'serif');
  typer(pq, '“From zero to live campaigns in 30 days.”', T1 + BEAT * 1.5, T1 + BEAT * 3.4);
  cardIn(pos, T1 + BEAT * 1.25, { x: 0, y: 140, rotationY: 0, rotationX: -40, transformOrigin: '50% 100%' });

  /* ---- 02 brand creative system */
  const T2 = B(7);
  const p2 = moduleShell(rail, 1, 'Brand Creative<br>System', 'Build a look the brand can repeat — then art-direct the creative that comes out of it.', ['Colour system', 'Type', 'Ad set', 'Brand kit'], T2);
  const sw = box(p2, 880, 150, 440, 250, 'card');
  txt(sw, 30, 26, 'palette', { fontSize: '15px', color: C.muted, letterSpacing: '.16em' }, 'mono');
  [C.lime, C.violet, C.sky, C.coral, '#fff'].forEach((c, k) => {
    const d = box(sw, 30 + k * 78, 90, 66, 66, '', { borderRadius: '50%', background: c, boxShadow: '0 10px 20px rgba(0,0,0,.4)' });
    txt(sw, 30 + k * 78, 176, c.replace('#', '').toUpperCase(), { fontSize: '12px', color: C.muted, width: '66px', textAlign: 'center' }, 'mono');
    tl.fromTo(d, { y: -240, scaleY: 1.4 }, { y: 0, scaleY: 1, duration: 0.55, ease: 'bounce.out' }, T2 + 0.08 + k * 0.05);
  });
  cardIn(sw, T2 - 0.04);
  const ty = box(p2, 880, 430, 440, 330, 'card');
  txt(ty, 30, 26, 'type', { fontSize: '15px', color: C.muted, letterSpacing: '.16em' }, 'mono');
  const aa = txt(ty, 26, 50, 'Aa', { fontSize: '200px', color: '#fff', fontStretch: '125%' }, 'arch');
  const aa2 = txt(ty, 270, 110, 'Aa', { fontSize: '110px', color: C.lime }, 'serif');
  txt(ty, 30, 280, 'ARCHIVO · INSTRUMENT', { fontSize: '14px', color: C.muted }, 'mono');
  track(t => { if (t > T2 - 0.4 && t < T2 + BAR) aa.style.fontStretch = (62 + 63 * E.outElastic(prog(t, T2 + 0.1, T2 + 1.1))) + '%'; });
  cardIn(ty, T2 + 0.05);
  // ad creative, assembled from parts
  const ad = box(p2, 1360, 120, 440, 700, 'card', { background: '#fff', border: 'none' });
  const adH = box(ad, 0, 0, 440, 70);
  box(adH, 20, 16, 38, 38, '', { borderRadius: '50%', background: `conic-gradient(${C.lime}, ${C.violet}, ${C.lime})` });
  txt(adH, 70, 14, 'growthlearners', { fontSize: '18px', fontWeight: 700, color: C.ink });
  txt(adH, 70, 38, 'Sponsored', { fontSize: '14px', color: '#777' });
  const img = box(ad, 0, 70, 440, 440, '', { background: `linear-gradient(150deg, ${C.violet} 0%, #2b1a8a 60%, ${C.ink} 100%)`, overflow: 'hidden' });
  const blob = box(img, 220, 40, 300, 300, '', { borderRadius: '50%', background: C.lime });
  const blob2 = box(img, -60, 300, 200, 200, '', { borderRadius: '50%', border: '3px solid rgba(255,255,255,.5)' });
  const h1 = txt(img, 30, 180, 'Launch<br>your career', { fontSize: '66px', color: '#fff', whiteSpace: 'normal', lineHeight: '.9', fontStretch: '100%' }, 'arch');
  const h2 = txt(img, 32, 350, '30 days · 8 seats', { fontSize: '20px', color: C.lime }, 'mono');
  const cta = box(ad, 20, 530, 400, 64, '', { borderRadius: '14px', background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px' });
  cta.innerHTML = `<span style="font-weight:700;font-size:21px;color:#fff">Enroll now</span><span style="color:${C.lime};font-size:26px">→</span>`;
  const heart = svgBox(ad, 20, 620, 44, 44, '0 0 24 24');
  const hp = svgEl('path', { d: 'M12 21s-7.5-4.6-9.6-9.2C.9 8.5 3 5 6.4 5c2 0 3.6 1.2 4.6 2.8C12 6.2 13.6 5 15.6 5 19 5 21.1 8.5 19.6 11.8 17.5 16.4 12 21 12 21z', fill: '#ff3b5c' }, heart);
  const likes = txt(ad, 76, 628, '0 likes', { fontSize: '20px', fontWeight: 700, color: C.ink });
  counter(likes, 0, 1284, T2 + BEAT * 2, T2 + BEAT * 3.5, v => Math.round(v).toLocaleString('en-IN') + ' likes');
  tl.fromTo(ad, { y: 200, opacity: 0, rotation: 8 }, { y: 0, opacity: 1, rotation: -3, duration: 0.7, ease: 'expo.out' }, T2 + 0.02);
  tl.fromTo(img, { clipPath: 'inset(50% 50% 50% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'expo.out' }, T2 + BEAT);
  tl.fromTo(blob, { scale: 0 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,0.5)' }, T2 + BEAT * 1.25);
  tl.fromTo(blob2, { scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(2)' }, T2 + BEAT * 1.4);
  tl.fromTo(h1, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: 'expo.out' }, T2 + BEAT * 1.5);
  tl.fromTo(h2, { opacity: 0 }, { opacity: 1, duration: 0.3 }, T2 + BEAT * 1.75);
  tl.fromTo(cta, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(2)' }, T2 + BEAT * 2);
  tl.fromTo(heart, { scale: 0 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1.2,0.4)' }, T2 + BEAT * 2.25);
  // ghost variants fanning behind the ad
  [[-12, -140, C.sky], [9, 90, C.coral]].forEach(([rot, dx, c], k) => {
    const g = box(p2, 1360, 150, 440, 640, '', { borderRadius: '26px', background: c, opacity: 0.9 });
    p2.insertBefore(g, ad);
    tl.fromTo(g, { rotation: -3, x: 0, scale: 0.9 }, { rotation: rot, x: dx, scale: 0.92, duration: 0.6, ease: 'back.out(2)' }, T2 + BEAT * (2.5 + k * 0.25));
  });

  /* ---- 03 AI video ad */
  const T3 = B(8);
  const p3 = moduleShell(rail, 2, 'AI Video<br>Ad Film', 'AI is the production engine. You are the director — script, shots, edit, sound.', ['Script', 'Shot list', 'AI footage', 'Final cut'], T3);
  const pl = box(p3, 880, 120, 920, 520, 'card', { background: '#000' });
  const scr = box(pl, 20, 20, 880, 420, '', { borderRadius: '14px', overflow: 'hidden', background: `linear-gradient(180deg, #ff8a4c 0%, #ff5c39 35%, #6d4aff 100%)` });
  const sun = box(scr, 560, 120, 180, 180, '', { borderRadius: '50%', background: '#ffe07a' });
  const hills = svgBox(scr, 0, 200, 880, 220, '0 0 880 220');
  const h1p = svgEl('path', { d: 'M0 120 Q160 40 320 110 T640 90 T960 110 V220 H0Z', fill: '#2b1a8a' }, hills);
  const h2p = svgEl('path', { d: 'M0 170 Q200 100 420 160 T880 150 V220 H0Z', fill: C.ink }, hills);
  const sky = txt(scr, 50, 60, 'Your career,<br>launched.', { fontSize: '78px', color: '#fff', whiteSpace: 'normal', lineHeight: '.9', fontStretch: '110%' }, 'arch');
  const rec = txt(scr, 760, 24, '<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#ff2d55;margin-right:8px;vertical-align:-1px"></span>REC', { fontSize: '16px', color: '#fff' }, 'mono');
  const badge = txt(scr, 24, 360, 'AI RENDER · 4K', { fontSize: '15px', color: C.ink, background: C.lime, padding: '8px 14px', borderRadius: '8px' }, 'mono');
  const shimmer = box(scr, -300, 0, 200, 420, '', { background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent)', transform: 'skewX(-20deg)' });
  tl.fromTo(shimmer, { x: -300 }, { x: 1400, duration: 0.7, ease: 'power2.inOut' }, T3 + BEAT * 0.8);
  const prog1 = box(pl, 90, 470, 780, 8, 'bar');
  const prog2 = box(pl, 90, 470, 780, 8, 'bar', { background: C.lime, transformOrigin: '0 50%' });
  const ppath = svgBox(pl, 30, 456, 36, 36, '0 0 24 24');
  const pp = svgEl('path', { d: 'M6 4 L20 12 L6 20Z', fill: '#fff' }, ppath);
  txt(pl, 640, 482, '', { fontSize: '14px' }, 'mono');
  track(t => {
    if (t < T3 - 0.4 || t > T3 + BAR + 0.3) return;
    const k = prog(t, T3, T3 + BAR);
    sun.style.transform = `translate(${-k * 160}px, ${k * 60}px)`;
    h1p.setAttribute('transform', `translate(${-k * 120} 0)`);
    h2p.setAttribute('transform', `translate(${-k * 260} 0)`);
    prog2.style.transform = `scaleX(${k})`;
    rec.style.opacity = Math.floor(t / (BEAT / 2)) % 2 ? 0.35 : 1;
  });
  cardIn(pl, T3 - 0.05);
  tl.fromTo(sky.children.length ? sky : sky, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'expo.out' }, T3 + BEAT * 0.5);
  tl.fromTo(badge, { scale: 0 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' }, T3 + BEAT * 0.75);
  const tln = box(p3, 880, 670, 920, 290, 'card');
  txt(tln, 26, 22, 'timeline · 00:15', { fontSize: '15px', color: C.muted, letterSpacing: '.16em' }, 'mono');
  const tracksDef = [['V1', [[0, 180, C.violet], [190, 250, C.sky], [450, 200, C.violet], [660, 160, C.coral]]], ['TX', [[60, 220, C.lime], [420, 180, C.lime]]], ['A1', null]];
  tracksDef.forEach(([n, clips], r) => {
    txt(tln, 26, 76 + r * 66, n, { fontSize: '15px', color: C.muted }, 'mono');
    if (clips) clips.forEach(([x, w, c], k) => {
      const cl = box(tln, 80 + x, 64 + r * 66, w - 8, 50, '', { background: c, borderRadius: '10px', opacity: 0.95 });
      tl.fromTo(cl, { x: 700, opacity: 0 }, { x: 0, opacity: 0.95, duration: 0.45, ease: 'expo.out' }, T3 + BEAT * (1 + (r * 4 + k) * 0.12));
    });
    else {
      const bars = [];
      for (let k = 0; k < 52; k++) bars.push(box(tln, 80 + k * 15.6, 64 + r * 66, 9, 50, '', { background: '#fff', borderRadius: '3px', opacity: 0.75, transformOrigin: '50% 50%' }));
      track(t => {
        if (t < T3 - 0.4 || t > T3 + BAR + 0.3) return;
        const since = (t - T3) % BEAT;
        const pulse = Math.exp(-since / 0.12);
        bars.forEach((b, k) => { b.style.transform = `scaleY(${0.15 + 0.85 * Math.abs(noise1(k * 0.7 + t * 6, 4)) * (0.5 + 0.5 * pulse) * prog(t, T3 + BEAT, T3 + BEAT * 1.5)})`; });
      });
    }
  });
  const ph = box(tln, 80, 50, 3, 220, '', { background: C.lime, boxShadow: `0 0 16px ${C.lime}` });
  track(t => { if (t > T3 - 0.4 && t < T3 + BAR + 0.3) ph.style.transform = `translateX(${820 * E.inOutCubic(prog(t, T3 + BEAT, T3 + BAR))}px)`; });
  cardIn(tln, T3 + 0.08, { x: 0, y: 160, rotationY: 0 });
  const prm = box(p3, 1120, 590, 640, 68, 'card', { borderRadius: '34px', background: '#1d2146' });
  const prt = txt(prm, 30, 20, '', { fontSize: '20px', color: '#fff' }, 'mono');
  typer(prt, '> 15s ad · energetic · golden hour', T3 + BEAT * 0.4, T3 + BEAT * 1.6);
  tl.fromTo(prm, { scale: 0, transformOrigin: '10% 50%' }, { scale: 1, duration: 0.4, ease: 'back.out(2)' }, T3 + BEAT * 0.3);

  /* ---- 04 campaigns go live */
  const T4 = B(9);
  const p4 = moduleShell(rail, 3, 'Campaigns<br>Go Live', 'A live website, live Google and Meta campaigns — spending, tracking, reporting.', ['Meta Ads', 'Google Ads', 'Tracking', 'Reporting'], T4);
  const mm = box(p4, 880, 140, 520, 330, 'card');
  txt(mm, 30, 26, 'meta ads · oct batch', { fontSize: '15px', color: C.muted, letterSpacing: '.16em' }, 'mono');
  txt(mm, 30, 70, 'Leads — Coimbatore 22-34', { fontSize: '26px', fontWeight: 700 });
  const tog = box(mm, 30, 140, 110, 58, '', { borderRadius: '29px', background: 'rgba(255,255,255,.14)' });
  const knob = box(tog, 5, 5, 48, 48, '', { borderRadius: '50%', background: '#fff' });
  const stat = txt(mm, 164, 150, 'In review', { fontSize: '26px', color: C.muted, fontWeight: 600 });
  tl.to(tog, { backgroundColor: C.lime, duration: 0.15 }, T4 + BEAT * 0.5);
  tl.to(knob, { x: 52, duration: 0.35, ease: 'back.out(3)' }, T4 + BEAT * 0.5);
  tl.set(stat, { textContent: '● Active', color: C.lime }, T4 + BEAT * 0.5);
  tl.fromTo(stat, { scale: 1.3, transformOrigin: '0 50%' }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, T4 + BEAT * 0.5);
  [['Budget', '₹500/day'], ['Placement', 'Reels + Feed']].forEach(([a, b], k) => {
    txt(mm, 30 + k * 240, 236, a, { fontSize: '16px', color: C.muted });
    txt(mm, 30 + k * 240, 262, b, { fontSize: '24px', fontWeight: 700 });
  });
  cardIn(mm, T4 - 0.05);
  const gg = box(p4, 1430, 140, 370, 330, 'card', { background: '#fff', border: 'none' });
  txt(gg, 28, 26, '<b>Sponsored</b>', { fontSize: '16px', color: '#202124' });
  txt(gg, 28, 56, 'growthlearners.com', { fontSize: '18px', color: '#202124' });
  const gt = txt(gg, 28, 90, 'AI Digital Marketing Course in Coimbatore', { fontSize: '27px', color: '#1a0dab', whiteSpace: 'normal', width: '320px', lineHeight: '1.2', fontWeight: 500 });
  [0, 1, 2].forEach(k => box(gg, 28, 200 + k * 26, [300, 280, 200][k], 12, '', { background: '#e3e4ea', borderRadius: '6px' }));
  const gbtn = box(gg, 28, 280, 150, 30, '', { borderRadius: '6px', border: '1px solid #dadce0' });
  cardIn(gg, T4 + 0.06);
  const an = box(p4, 880, 500, 920, 440, 'card');
  txt(an, 30, 26, 'last 7 days', { fontSize: '15px', color: C.muted, letterSpacing: '.16em' }, 'mono');
  [['Reach', 0, 48200, v => (v / 1000).toFixed(1) + 'K'], ['CTR', 0, 3.9, v => v.toFixed(1) + '%'], ['Leads', 0, 212, v => Math.round(v)]].forEach(([l, a, b, f], k) => {
    txt(an, 30 + k * 290, 70, l, { fontSize: '18px', color: C.muted });
    const v = txt(an, 30 + k * 290, 96, '0', { fontSize: '64px', color: k === 2 ? C.lime : '#fff', fontStretch: '100%' }, 'arch');
    counter(v, a, b, T4 + BEAT * (1 + k * 0.25), T4 + BEAT * (2.6 + k * 0.25), f);
  });
  const ch = svgBox(an, 30, 190, 860, 220, '0 0 860 220');
  const cdef = svgEl('defs', {}, ch);
  const cg = svgEl('linearGradient', { id: 'gCh', x1: 0, y1: 0, x2: 0, y2: 1 }, cdef);
  svgEl('stop', { offset: 0, 'stop-color': C.lime, 'stop-opacity': 0.35 }, cg);
  svgEl('stop', { offset: 1, 'stop-color': C.lime, 'stop-opacity': 0 }, cg);
  const pts = [[0, 190], [120, 170], [240, 176], [360, 130], [480, 140], [600, 90], [720, 60], [860, 14]];
  for (let k = 0; k < 7; k++) {
    const bh = 40 + k * 18;
    const bb = svgEl('rect', { x: 40 + k * 120, y: 220 - bh, width: 40, height: bh, rx: 6, fill: 'rgba(255,255,255,.08)' }, ch);
    tl.fromTo(bb, { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 0.5, ease: 'back.out(2)' }, T4 + BEAT * 1 + k * 0.04);
  }
  const cl = svgEl('path', { d: 'M' + pts.map(p => p.join(' ')).join(' L'), fill: 'none', stroke: C.lime, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, ch);
  const ca = svgEl('path', { d: 'M0 220 L' + pts.map(p => p.join(' ')).join(' L') + ' L860 220Z', fill: 'url(#gCh)' }, ch);
  tl.fromTo(cl, { drawSVG: '0%' }, { drawSVG: '100%', duration: BEAT * 2, ease: 'power2.inOut' }, T4 + BEAT);
  tl.fromTo(ca, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: BEAT * 2, ease: 'power2.inOut' }, T4 + BEAT);
  const endDot = svgEl('circle', { cx: 860, cy: 14, r: 10, fill: C.lime }, ch);
  tl.fromTo(endDot, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.4, ease: 'back.out(4)' }, T4 + BEAT * 3);
  cardIn(an, T4 + 0.1, { x: 0, y: 180, rotationY: 0 });
}

/* ------------------------------------------------------------------ S6 breakdown */
function S6() {
  const t0 = B(10), t1 = B(11, 3.5);
  const s = scene('s6', t0, t1, 'radial-gradient(ellipse at 30% 30%, #231a5c 0%, #0b0a1f 55%, #07080F 100%)');
  const inner = box(s, 0, 0, 1920, 1080);
  const h = txt(inner, 120, 150, '<span class="serif" style="font-size:132px">You finish</span>', {});
  const h2 = txt(inner, 120, 290, 'OWNING:', { fontSize: '128px', color: C.lime, fontStretch: '125%' }, 'arch');
  const hc = splitChars(h.firstChild, true), h2c = splitChars(h2, true);
  tl.fromTo(hc, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.02 }, t0 + 0.02);
  tl.fromTo(h2c, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.03 }, t0 + 0.15);
  const items = ['A live website', 'Live Google & Meta campaigns', 'An AI video ad', 'A CRM', 'An automation'];
  const tts = [B(10, 0.5), B(10, 1.5), B(10, 2.5), B(10, 3.5), B(11, 0.5)];
  items.forEach((it, i) => {
    const row = box(inner, 120, 470 + i * 96, 820, 80);
    const bx = box(row, 0, 10, 58, 58, '', { borderRadius: '16px', border: '3px solid rgba(255,255,255,.35)' });
    const fill = box(bx, -3, -3, 58, 58, '', { borderRadius: '16px', background: C.lime });
    const ck = svgBox(bx, 6, 6, 40, 40, '0 0 24 24');
    const cp = svgEl('path', { d: 'M4 12.5 L10 18 L20 6', fill: 'none', stroke: C.ink, 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, ck);
    const lb = txt(row, 90, 12, it, { fontSize: '46px', fontWeight: 650, color: '#fff', letterSpacing: '-.01em' });
    tl.fromTo(row, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'expo.out' }, tts[i] - BEAT * 0.45);
    tl.fromTo(fill, { scale: 0 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' }, tts[i]);
    tl.fromTo(cp, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.3, ease: 'power2.out' }, tts[i] + 0.05);
    tl.fromTo(lb, { color: '#ffffff' }, { color: C.lime, duration: 0.08, yoyo: true, repeat: 1 }, tts[i]);
  });

  // right side: floating components
  const flo = [];
  // website
  const web = box(inner, 1000, 110, 800, 500, 'card', { background: '#0d0f22' });
  const bar = box(web, 0, 0, 800, 44, '', { background: '#191c38' });
  [0, 1, 2].forEach(k => box(bar, 18 + k * 22, 16, 12, 12, '', { borderRadius: '50%', background: ['#ff5f57', '#febc2e', '#28c840'][k] }));
  box(bar, 110, 10, 440, 24, '', { borderRadius: '12px', background: 'rgba(255,255,255,.08)' });
  txt(bar, 130, 13, 'growthlearners.com', { fontSize: '14px', color: C.muted }, 'mono');
  const nav = box(web, 0, 44, 800, 60);
  logoMark(nav, 30, 14, 34);
  txt(nav, 74, 17, '<b>growth</b>learners', { fontSize: '20px' });
  ['Course', 'Outcomes', 'Batch'].forEach((n, k) => txt(nav, 430 + k * 100, 20, n, { fontSize: '15px', color: C.muted }));
  txt(web, 40, 138, 'AI DIGITAL MARKETING · COIMBATORE', { fontSize: '13px', color: C.lime }, 'mono');
  const wh = txt(web, 38, 166, 'Research, create, automate<br>and launch — in 30 days.', { fontSize: '34px', whiteSpace: 'normal', lineHeight: '1.05', fontStretch: '100%' }, 'arch');
  txt(web, 40, 290, '20 live sessions · 8 seats · offline classroom', { fontSize: '17px', color: C.muted });
  const wb = box(web, 40, 336, 220, 56, '', { borderRadius: '28px', background: C.lime, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.ink, fontWeight: 700, fontSize: '18px' });
  wb.textContent = 'Reserve a seat →';
  const wimg = box(web, 520, 130, 240, 300, '', { borderRadius: '18px', background: `linear-gradient(160deg, ${C.violet}, #2b1a8a)` });
  const wcurve = svgBox(wimg, 20, 110, 200, 160, '0 0 200 160');
  const wcp = svgEl('path', { d: 'M0 150 L40 120 L80 130 L120 80 L160 60 L200 10', fill: 'none', stroke: C.lime, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, wcurve);
  tl.fromTo(web, { opacity: 0, y: 80, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'expo.out' }, tts[0] - 0.1);
  tl.fromTo(wcp, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.8, ease: 'expo.out' }, tts[0] + 0.1);
  flo.push([web, 0]);
  // campaign pill + video thumb
  const camp = box(inner, 1580, 60, 290, 90, 'card', { borderRadius: '45px', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 22px' });
  camp.innerHTML = `<span style="width:14px;height:14px;border-radius:50%;background:${C.lime};box-shadow:0 0 14px ${C.lime}"></span><span style="font-weight:700;font-size:22px">2 campaigns live</span>`;
  tl.fromTo(camp, { scale: 0, rotation: 10 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2.5)' }, tts[1]);
  flo.push([camp, 1]);
  const vid = box(inner, 950, 650, 210, 136, 'card', { background: `linear-gradient(180deg, #ff8a4c, ${C.violet})` });
  const play = svgBox(vid, 75, 38, 60, 60, '0 0 24 24');
  svgEl('circle', { cx: 12, cy: 12, r: 11, fill: 'rgba(0,0,0,.35)' }, play);
  svgEl('path', { d: 'M10 7.5 L16.5 12 L10 16.5Z', fill: '#fff' }, play);
  tl.fromTo(vid, { scale: 0, rotation: -12 }, { scale: 1, rotation: -4, duration: 0.55, ease: 'back.out(2.5)' }, tts[2]);
  flo.push([vid, 2]);
  // CRM kanban
  const crm = box(inner, 1180, 640, 380, 330, 'card');
  txt(crm, 24, 20, 'crm', { fontSize: '14px', color: C.muted, letterSpacing: '.16em' }, 'mono');
  ['NEW', 'CALLED', 'ENROLLED'].forEach((c, k) => {
    txt(crm, 22 + k * 120, 56, c, { fontSize: '12px', color: C.muted }, 'mono');
    for (let j = 0; j < 3 - k; j++) box(crm, 22 + k * 120, 84 + j * 62, 106, 50, '', { borderRadius: '10px', background: 'rgba(255,255,255,.07)' });
  });
  const mover = box(crm, 22, 84, 106, 50, '', { borderRadius: '10px', background: C.lime, boxShadow: '0 12px 24px rgba(0,0,0,.5)' });
  txt(mover, 10, 8, 'Priya R.', { fontSize: '14px', color: C.ink, fontWeight: 700 });
  box(mover, 10, 30, 60, 8, '', { borderRadius: '4px', background: 'rgba(7,8,15,.3)' });
  tl.fromTo(crm, { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, tts[3] - 0.1);
  tl.to(mover, { keyframes: [{ x: 120, y: -8, rotation: 6, duration: 0.3, ease: 'power3.inOut' }, { x: 240, y: 0, rotation: 0, duration: 0.3, ease: 'back.out(2)' }] }, tts[3] + 0.15);
  flo.push([crm, 3]);
  // automation flow
  const au = box(inner, 1590, 640, 250, 330, 'card');
  txt(au, 24, 20, 'automation', { fontSize: '14px', color: C.muted, letterSpacing: '.16em' }, 'mono');
  const nodes = [['Form', 70], ['WhatsApp', 160], ['CRM', 250]];
  const wire = svgBox(au, 0, 0, 250, 330);
  const wp = svgEl('path', { d: 'M125 94 V274', stroke: 'rgba(255,255,255,.25)', 'stroke-width': 3, 'stroke-dasharray': '6 6' }, wire);
  nodes.forEach(([n, y], k) => {
    const nd = box(au, 40, y, 170, 48, '', { borderRadius: '12px', background: k === 1 ? '#25D366' : '#1d2146', border: '1px solid rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px' });
    nd.textContent = n;
    tl.fromTo(nd, { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' }, tts[4] + k * 0.07);
  });
  const pulse = box(au, 117, 94, 16, 16, '', { borderRadius: '50%', background: C.lime, boxShadow: `0 0 16px ${C.lime}` });
  track(t => { if (t > tts[4] && t < t1) { const k = ((t - tts[4]) / (BEAT * 1.0)) % 1; pulse.style.transform = `translateY(${k * 170}px)`; pulse.style.opacity = 1; } else pulse.style.opacity = 0; });
  tl.fromTo(au, { opacity: 0, x: 80 }, { opacity: 1, x: 0, duration: 0.5, ease: 'expo.out' }, tts[4] - 0.12);
  flo.push([au, 4]);

  // float + build-up camera
  track(t => {
    if (t < t0 - 0.1 || t > t1) return;
    flo.forEach(([e, k]) => { e.style.translate = `${noise1(t * 0.9, k) * 10}px ${noise1(t * 0.8, k + 9) * 14}px`; });
    const b = E.inCubic(prog(t, B(11, 1), B(11, 3.5)));
    CAM.s = 1 + 0.02 * prog(t, t0, B(11, 1)) + 0.45 * b;
    CAM.r = -4 * b;
    CAM.x = -120 * b; CAM.y = -60 * b;
  });

  // silence gap: "Only 8 seats."
  const gap = scene('s6b', B(11, 3.5), B(12) + 0.001, '#000');
  const only = txt(gap, 0, 470, '<span class="serif" style="font-size:96px;color:#fff">Only <span style="color:#C6FF34">8</span> seats.</span>', { width: '1920px', textAlign: 'center' });
  tl.fromTo(only, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, ease: 'expo.out' }, B(11, 3.5));
}

/* ------------------------------------------------------------------ logo mark (stand-in, swap in real SVG via assets/logo.svg) */
function logoMark(parent, x, y, size, color = C.lime) {
  const sv = svgBox(parent, x, y, size, size, '0 0 100 100');
  svgEl('rect', { x: 8, y: 58, width: 22, height: 34, rx: 7, fill: color }, sv);
  svgEl('rect', { x: 39, y: 38, width: 22, height: 54, rx: 7, fill: color }, sv);
  svgEl('rect', { x: 70, y: 22, width: 22, height: 70, rx: 7, fill: color }, sv);
  svgEl('circle', { cx: 81, cy: 8, r: 8, fill: color }, sv);
  return sv;
}

/* ------------------------------------------------------------------ S7 bento */
function S7() {
  const t0 = B(12), t1 = B(14) + 0.02;
  const s = scene('s7', t0, t1, C.ink);
  const A = [[80, 80, 560, 520], [664, 80, 560, 248], [1248, 80, 592, 248], [664, 352, 560, 248], [1248, 352, 592, 248], [80, 624, 848, 376], [952, 624, 432, 376], [1408, 624, 432, 376]];
  const Bl = [[80, 644, 384, 356], [488, 644, 384, 166], [1224, 80, 616, 258], [488, 834, 384, 166], [1224, 362, 616, 258], [80, 80, 1120, 540], [896, 644, 460, 356], [1380, 644, 460, 356]];
  const tiles = [];
  const mk = (i, bg, fg) => {
    const [x, y, w, h] = A[i];
    const t = box(s, x, y, w, h, '', { borderRadius: '34px', background: bg, overflow: 'hidden', color: fg });
    const inner = box(t, 0, 0, w, h, '', { transformOrigin: '0 0' });
    tiles.push({ t, inner, w0: w, h0: h });
    return inner;
  };
  // 1: 8 seats
  const t1i = mk(0, C.lime, C.ink);
  txt(t1i, 40, 36, 'seats per batch', { fontSize: '20px', color: C.ink }, 'mono');
  const eight = txt(t1i, 30, 40, '8', { fontSize: '420px', color: C.ink, fontStretch: '100%' }, 'arch');
  const seats = [];
  for (let k = 0; k < 8; k++) {
    const st = box(t1i, 300 + (k % 2) * 110, 90 + Math.floor(k / 2) * 100, 86, 80, '', { borderRadius: '20px 20px 12px 12px', background: C.ink });
    seats.push(st);
  }
  tl.fromTo(seats, { scale: 0, y: -40 }, { scale: 1, y: 0, duration: 0.35, ease: 'back.out(3)', stagger: 0.058 }, t0 + BEAT * 0.5);
  // 2: 20 live sessions
  const t2i = mk(1, '#15183a', '#fff');
  const n20 = txt(t2i, 36, 30, '20', { fontSize: '170px', color: '#fff', fontStretch: '110%' }, 'arch');
  txt(t2i, 290, 70, 'live<br>sessions', { fontSize: '44px', whiteSpace: 'normal', lineHeight: '1', fontWeight: 700 });
  counter(n20, 0, 20, t0 + 0.05, t0 + BEAT * 1.5, v => String(Math.round(v)));
  // 3: offline Coimbatore
  const t3i = mk(2, C.violet, '#fff');
  txt(t3i, 40, 40, 'offline classroom', { fontSize: '18px' }, 'mono');
  txt(t3i, 38, 100, 'Coimbatore', { fontSize: '76px', fontStretch: '100%' }, 'arch');
  const pin = svgBox(t3i, 500, 22, 60, 74, '0 0 24 30');
  svgEl('path', { d: 'M12 29s9-9.6 9-16.5A9 9 0 0 0 3 12.5C3 19.4 12 29 12 29z', fill: C.lime }, pin);
  svgEl('circle', { cx: 12, cy: 12.5, r: 3.6, fill: C.violet }, pin);
  tl.fromTo(pin, { y: -200, scaleY: 1.3 }, { y: 0, scaleY: 1, duration: 0.6, ease: 'bounce.out' }, t0 + BEAT * 0.5);
  const ripple = box(t3i, 490, 88, 80, 24, '', { borderRadius: '50%', border: `3px solid ${C.lime}` });
  tl.fromTo(ripple, { scale: 0, opacity: 1 }, { scale: 3, opacity: 0, duration: 0.7, ease: 'expo.out' }, t0 + BEAT * 0.9);
  // 4: schedule
  const t4i = mk(3, '#15183a', '#fff');
  txt(t4i, 40, 40, 'mon – fri', { fontSize: '18px', color: C.muted }, 'mono');
  txt(t4i, 38, 110, '6:30 – 8:30<span style="font-size:36px;color:#8A8FAD"> PM</span>', { fontSize: '76px', fontStretch: '100%' }, 'arch');
  const clk = svgBox(t4i, 470, 26, 64, 64, '0 0 100 100');
  svgEl('circle', { cx: 50, cy: 50, r: 44, fill: 'none', stroke: C.lime, 'stroke-width': 7 }, clk);
  const hand = svgEl('path', { d: 'M50 50 V16', stroke: '#fff', 'stroke-width': 7, 'stroke-linecap': 'round' }, clk);
  const hand2 = svgEl('path', { d: 'M50 50 H72', stroke: '#fff', 'stroke-width': 7, 'stroke-linecap': 'round' }, clk);
  tl.fromTo(hand, { rotation: 0, svgOrigin: '50 50' }, { rotation: 720 + 180, svgOrigin: '50 50', duration: BAR * 1.5, ease: 'expo.out' }, t0 + BEAT);
  tl.fromTo(hand2, { rotation: 0, svgOrigin: '50 50' }, { rotation: 75, svgOrigin: '50 50', duration: BAR * 1.5, ease: 'expo.out' }, t0 + BEAT);
  // 5: price
  const t5i = mk(4, '#fff', C.ink);
  txt(t5i, 40, 40, 'course fee', { fontSize: '18px', color: '#555' }, 'mono');
  const price = txt(t5i, 36, 84, '₹0', { fontSize: '120px', fontStretch: '100%', color: C.ink }, 'arch');
  counter(price, 0, 18999, t0 + BEAT * 1.5, t0 + BEAT * 3.5, v => '₹' + Math.round(v).toLocaleString('en-IN'));
  // 6: next batch
  const t6i = mk(5, C.coral, C.ink);
  txt(t6i, 44, 44, 'next batch starts', { fontSize: '22px' }, 'mono');
  const date = txt(t6i, 38, 104, '5 OCT', { fontSize: '150px', fontStretch: '112%' }, 'arch');
  txt(t6i, 46, 300, '2026 · Monday', { fontSize: '40px', fontWeight: 700 });
  const page = box(t6i, 650, 60, 170, 220, '', { borderRadius: '22px', background: C.ink, transformOrigin: '50% 0%' });
  txt(page, 0, 20, 'OCT', { width: '170px', textAlign: 'center', fontSize: '26px', color: C.coral }, 'mono');
  txt(page, 0, 60, '05', { width: '170px', textAlign: 'center', fontSize: '116px', color: '#fff', fontStretch: '100%' }, 'arch');
  const pageFlip = box(t6i, 650, 60, 170, 220, '', { borderRadius: '22px', background: '#2a2d4a', transformOrigin: '50% 0%' });
  txt(pageFlip, 0, 60, '04', { width: '170px', textAlign: 'center', fontSize: '116px', color: '#fff', fontStretch: '100%' }, 'arch');
  tl.fromTo(pageFlip, { rotationX: 0, transformPerspective: 900 }, { rotationX: -100, opacity: 0, duration: 0.45, ease: 'power3.in' }, B(13, 0.3));
  // 7: whatsapp
  const t7i = mk(6, '#25D366', C.ink);
  txt(t7i, 36, 36, 'after the course', { fontSize: '18px' }, 'mono');
  txt(t7i, 34, 80, '30 days', { fontSize: '80px', fontStretch: '100%' }, 'arch');
  txt(t7i, 36, 170, 'WhatsApp support', { fontSize: '32px', fontWeight: 700 });
  const bub = box(t7i, 36, 250, 150, 70, '', { borderRadius: '24px 24px 24px 6px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' });
  const tdots = [0, 1, 2].map(() => box(bub, 0, 0, 14, 14, '', { position: 'relative', borderRadius: '50%', background: '#888' }));
  track(t => { if (t > t0 && t < t1) tdots.forEach((d, k) => { d.style.transform = `translateY(${-8 * Math.max(0, Math.sin((t * 7 - k * 0.6) * 2))}px)`; }); });
  tl.fromTo(bub, { scale: 0, transformOrigin: '0 100%' }, { scale: 1, duration: 0.4, ease: 'back.out(3)' }, B(13, 1.5));
  // 8: internship
  const t8i = mk(7, '#15183a', '#fff');
  txt(t8i, 36, 36, 'every batch ends with', { fontSize: '18px', color: C.muted }, 'mono');
  txt(t8i, 34, 80, 'an internship', { fontSize: '58px', fontStretch: '100%', color: '#fff' }, 'arch');
  const stamp = box(t8i, 36, 200, 250, 110, '', { borderRadius: '18px', border: `5px solid ${C.lime}`, color: C.lime, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Archivo', fontWeight: 900, fontSize: '40px', fontStretch: '120%' });
  stamp.textContent = 'PORTFOLIO';
  tl.fromTo(stamp, { scale: 2.4, opacity: 0, rotation: -18 }, { scale: 1, opacity: 1, rotation: -6, duration: 0.3, ease: 'power4.in' }, B(13, 2.2));

  // entrance from center with spring
  tiles.forEach(({ t }, i) => {
    const [x, y, w, h] = A[i];
    const dx = 960 - (x + w / 2), dy = 540 - (y + h / 2);
    tl.fromTo(t, { x: dx, y: dy, scale: 0, rotation: (i % 2 ? 1 : -1) * 20 }, { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.7, ease: 'back.out(1.6)' }, t0 - 0.02 + Math.hypot(dx, dy) / 12000);
  });
  // reflow at bar 13
  tiles.forEach(({ t }, i) => {
    const [x, y, w, h] = Bl[i];
    tl.to(t, { left: x, top: y, width: w, height: h, duration: 0.55, ease: 'back.out(1.3)' }, B(13) - 0.05 + i * 0.012);
  });
  // implode into the logo at bar 14
  tiles.forEach(({ t }, i) => {
    const [x, y, w, h] = Bl[i];
    tl.to(t, { x: 960 - (x + w / 2), y: 540 - (y + h / 2), scale: 0, rotation: (i % 2 ? 1 : -1) * 90, duration: 0.42, ease: 'power4.in' }, B(13, 3) + i * 0.015);
  });
  track(t => {
    if (t < t0 - 0.1 || t > t1) return;
    tiles.forEach(({ t: tile, inner, w0, h0 }) => {
      const w = parseFloat(tile.style.width), h = parseFloat(tile.style.height);
      inner.style.transform = `scale(${Math.min(w / w0, h / h0)})`;
    });
  });
  const shock = box(s, 960 - 200, 540 - 200, 400, 400, '', { borderRadius: '50%', border: `6px solid ${C.lime}` });
  tl.fromTo(shock, { scale: 0, opacity: 1 }, { scale: 6, opacity: 0, duration: 0.8, ease: 'expo.out' }, t0);
  s.insertBefore(shock, s.children[1]);
}

/* ------------------------------------------------------------------ S8 logo */
function S8() {
  const t0 = B(14);
  const s = scene('s8', t0 - 0.02, DUR + 1, 'radial-gradient(ellipse at 50% 55%, #1a1f45 0%, #07080F 60%)');
  // rings + particles burst
  const rings = [0, 1, 2].map(k => box(s, 960 - 150, 470 - 150, 300, 300, '', { borderRadius: '50%', border: `${4 - k}px solid ${k ? 'rgba(198,255,52,.5)' : C.lime}` }));
  rings.forEach((r, k) => tl.fromTo(r, { scale: 0, opacity: 1 }, { scale: 5 + k * 2, opacity: 0, duration: 1.1 + k * 0.2, ease: 'expo.out' }, t0 + k * 0.06));
  const r = rnd(77);
  for (let k = 0; k < 40; k++) {
    const a = r() * Math.PI * 2, d = 300 + r() * 700, sz = 6 + r() * 14;
    const p = box(s, 960 - sz / 2, 470 - sz / 2, sz, sz, '', { borderRadius: r() > 0.3 ? '50%' : '3px', background: r() > 0.4 ? C.lime : '#fff' });
    tl.fromTo(p, { x: 0, y: 0, scale: 1, opacity: 1 }, { x: Math.cos(a) * d, y: Math.sin(a) * d, scale: 0, opacity: 0.2, duration: 1.2 + r() * 0.6, ease: 'expo.out' }, t0);
  }
  // logo lockup
  const lock = box(s, 0, 0, 1920, 1080);
  const markS = 190;
  const ww = el('div', 'abs', lock, null, { left: 0, top: '375px', width: '1920px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '38px' });
  const mark = svgEl('svg', { width: markS, height: markS, viewBox: '0 0 100 100' });
  ww.appendChild(mark);
  const bars = [[8, 58, 34], [39, 38, 54], [70, 22, 70]].map(([x, y, h]) => svgEl('rect', { x, y, width: 22, height: h, rx: 7, fill: C.lime }, mark));
  const headDot = svgEl('circle', { cx: 81, cy: 8, r: 8, fill: C.lime }, mark);
  const word = el('div', null, ww, null, { fontFamily: 'Archivo', fontSize: '170px', fontStretch: '100%', letterSpacing: '-.035em', lineHeight: '1', whiteSpace: 'nowrap' });
  const w1 = el('span', null, word, 'growth', { fontWeight: 900, color: '#fff' });
  const w2 = el('span', null, word, 'learners', { fontWeight: 300, color: '#fff' });
  const ch = [...splitChars(w1), ...splitChars(w2)];
  if (window.LOGO) { // real brand logo supplied via assets/ → it replaces the stand-in lockup
    ww.innerHTML = '';
    const img = el('img', null, ww, null, { height: '230px', maxWidth: '1400px', objectFit: 'contain' });
    img.src = window.LOGO;
    tl.fromTo(img, { scale: 0.4, opacity: 0, clipPath: 'inset(0 100% 0 0)' }, { scale: 1, opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.8, ease: 'expo.out' }, t0 + 0.02);
  }
  tl.fromTo(bars, { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 0.8, ease: 'elastic.out(1,0.45)', stagger: 0.07 }, t0 + 0.02);
  tl.fromTo(headDot, { y: -160, scale: 1.4, transformOrigin: '50% 50%' }, { y: 0, scale: 1, duration: 0.7, ease: 'bounce.out' }, t0 + BEAT * 0.4);
  tl.fromTo(ch, { y: -120, opacity: 0, rotation: -25, scale: 0.6 }, { y: 0, opacity: 1, rotation: 0, scale: 1, duration: 0.5, ease: 'back.out(2.2)', stagger: 0.045 }, t0 + BEAT * 0.85);
  tl.to(w2, { color: C.lime, duration: 0.2 }, t0 + BEAT * 2);
  const ul = box(lock, 560, 610, 800, 8, '', { background: C.lime, borderRadius: '4px', transformOrigin: '0 50%' });
  tl.fromTo(ul, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'expo.out' }, t0 + BEAT * 2);
  tl.to(ul, { scaleX: 0, transformOrigin: '100% 50%', duration: 0.5, ease: 'expo.in' }, t0 + BEAT * 3.1);
  const tag = txt(lock, 0, 640, 'AI DIGITAL MARKETING COURSE · COIMBATORE', { width: '1920px', textAlign: 'center', fontSize: '28px', letterSpacing: '.34em', color: '#cfd3ea' }, 'mono');
  const tagc = splitChars(tag);
  scramble(tagc, tagc.map(c => c.textContent), t0 + BEAT * 2, 0.012, 0.12, 8);
  tl.fromTo(tagc, { opacity: 0 }, { opacity: 1, duration: 0.05, stagger: 0.012 }, t0 + BEAT * 2);
  const ctaRow = el('div', 'abs', lock, null, { left: 0, top: '740px', width: '1920px', display: 'flex', justifyContent: 'center', gap: '22px' });
  const pill = el('div', null, ctaRow, 'Next batch · 5 Oct 2026', { height: '84px', padding: '0 42px', borderRadius: '42px', background: C.lime, color: C.ink, fontWeight: 800, fontSize: '32px', display: 'flex', alignItems: 'center' });
  const url = el('div', null, ctaRow, 'growthlearners.com &nbsp;→', { height: '84px', padding: '0 42px', borderRadius: '42px', border: '2px solid rgba(255,255,255,.3)', color: '#fff', fontWeight: 600, fontSize: '32px', display: 'flex', alignItems: 'center' });
  tl.fromTo([pill, url], { y: 70, opacity: 0, scale: 0.8 }, { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(2)', stagger: 0.08 }, t0 + BEAT * 3);
  // final stab: lockup pulse + glow
  tl.fromTo(ww, { scale: 1 }, { keyframes: [{ scale: 1.07, duration: 0.08, ease: 'power2.out' }, { scale: 1, duration: 0.7, ease: 'elastic.out(1,0.35)' }] }, B(15));
  const glow = box(s, 960 - 700, 470 - 700, 1400, 1400, '', { borderRadius: '50%', background: 'radial-gradient(circle, rgba(198,255,52,.35) 0%, rgba(198,255,52,0) 60%)' });
  s.insertBefore(glow, lock);
  tl.fromTo(glow, { scale: 0.3, opacity: 0 }, { keyframes: [{ scale: 1, opacity: 1, duration: 0.1 }, { scale: 1.3, opacity: 0.25, duration: 1.4, ease: 'power2.out' }] }, B(15));
  const ring2 = box(s, 960 - 150, 470 - 150, 300, 300, '', { borderRadius: '50%', border: `3px solid ${C.lime}`, opacity: 0 });
  tl.fromTo(ring2, { scale: 0.5, opacity: 1 }, { scale: 7, opacity: 0, duration: 1.2, ease: 'expo.out', immediateRender: false }, B(15));
  const fine = txt(s, 0, 1000, 'offline · Mon–Fri 6:30–8:30 PM · 20 live sessions · 8 seats', { width: '1920px', textAlign: 'center', fontSize: '18px', color: C.muted }, 'mono');
  tl.fromTo(fine, { opacity: 0 }, { opacity: 1, duration: 0.6 }, B(15, 0.5));
  track(t => {
    if (t < t0 - 0.1) return;
    CAM.s = 1.0 + 0.04 * E.outCubic(prog(t, t0, DUR));
    CAM.x = 0; CAM.y = 0; CAM.r = 0;
  });
}

/* ------------------------------------------------------------------ HUD */
function HUD() {
  const h = $('#hud');
  const tlab = el('div', null, h, '', { left: '44px', top: '36px' });
  const trt = el('div', null, h, '', { right: '44px', top: '36px' });
  const bl = el('div', null, h, '', { left: '44px', bottom: '36px' });
  const br = el('div', null, h, 'GROWTHLEARNERS.COM', { right: '44px', bottom: '36px' });
  tlab.textContent = 'GROWTHLEARNERS — REEL 26';
  const names = [[0, 'INTRO'], [B(2), 'LEARN'], [B(3), '30 DAYS'], [B(4), 'METHOD'], [B(6), 'MOD 01'], [B(7), 'MOD 02'], [B(8), 'MOD 03'], [B(9), 'MOD 04'], [B(10), 'OUTCOMES'], [B(12), 'BATCH'], [B(14), 'END']];
  track(t => {
    const f = Math.floor(t * 30);
    const ss = Math.floor(t), ff = f % 30;
    const bar = Math.floor(t / BAR) + 1, beat = Math.floor((t % BAR) / BEAT) + 1;
    trt.innerHTML = `00:00:${String(ss).padStart(2, '0')}:${String(ff).padStart(2, '0')} &nbsp; ${'●'.repeat(beat)}${'○'.repeat(4 - beat)} &nbsp; 128 BPM`;
    let n = names[0][1];
    names.forEach(([tt, nm]) => { if (t >= tt) n = nm; });
    bl.textContent = `${String(bar).padStart(2, '0')}/16 — ${n}`;
    h.style.opacity = t > B(14, 2) ? 0.62 * (1 - prog(t, B(14, 2), B(14, 3))) : 0.62;
  });
}

/* ------------------------------------------------------------------ global fx */
function GLOBAL() {
  const cam = $('#cam'), shake = $('#shake'), flash = $('#flash');
  const FLASHES = [{ t: B(12), a: 0.6 }, { t: B(14), a: 0.75 }, { t: B(15), a: 0.35 }, { t: B(10), a: 0.5 }];
  track(t => {
    // scenes
    scenes.forEach(({ s, t0, t1 }) => { s.style.display = t >= t0 && t < t1 ? 'block' : 'none'; });
    // kick pulse
    let kp = 0;
    for (const k of KICKS) if (t >= k && t - k < 0.4) kp = Math.max(kp, Math.exp(-(t - k) / 0.09));
    // impact shake + chroma
    let sh = 0, ch = 0;
    for (const im of IMPACTS) if (t >= im.t) { const d = t - im.t; sh += im.a * Math.exp(-d / 0.16); ch += 10 * Math.exp(-d / 0.1); }
    sh += 7 * E.inQuad(prog(t, B(11, 1), B(11, 3.5))) * (t < B(11, 3.5) ? 1 : 0);
    const sx = noise1(t * 47, 11) * sh, sy = noise1(t * 43, 12) * sh, sr = noise1(t * 39, 13) * sh * 0.05;
    shake.style.transform = `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) rotate(${sr.toFixed(3)}deg)`;
    const s = CAM.s * (1 + 0.014 * kp);
    cam.style.transform = `translate(${CAM.x.toFixed(2)}px, ${CAM.y.toFixed(2)}px) scale(${s.toFixed(4)}) rotate(${CAM.r.toFixed(3)}deg)`;
    cam.style.filter = ch > 0.6 ? `drop-shadow(${ch.toFixed(1)}px 0 0 rgba(255,0,90,.55)) drop-shadow(${(-ch).toFixed(1)}px 0 0 rgba(0,210,255,.55))` : 'none';
    let fl = 0;
    for (const f of FLASHES) if (t >= f.t) fl = Math.max(fl, f.a * Math.exp(-(t - f.t) / 0.045));
    flash.style.opacity = fl.toFixed(3);
    // final fade
    $('#stage').style.opacity = 1 - E.inQuad(prog(t, DUR - 0.28, DUR));
  });
  // default drifting camera for scenes that do not drive it
  track(t => {});
}

/* ------------------------------------------------------------------ boot */
async function boot() {
  await Promise.all([
    document.fonts.load('900 100px Archivo'), document.fonts.load('300 100px Archivo'), document.fonts.load('600 20px Inter'),
    document.fonts.load('500 20px Mono'), document.fonts.load('700 20px Mono'), document.fonts.load('italic 40px Serif'),
    document.fonts.load('900 100px Archivo', '₹'),
  ]);
  await document.fonts.ready;
  S1(); S2(); S3(); S4(); S5(); S6(); S7(); S8(); HUD(); GLOBAL();
  window.renderFrame(0);
  window.READY = true;
}
const DEFAULT_CAM = t => { CAM.x = 0; CAM.y = 0; CAM.r = 0; CAM.s = 1 + 0.015 * Math.sin(t * 0.8); };
window.renderFrame = t => {
  DEFAULT_CAM(t);
  tl.seek(t, true);
  for (const f of tracks) f(t);
};
boot();
