// Deterministic frame renderer: seeks the GSAP timeline per frame and screenshots it.
//   node render.mjs frames            → all frames (parallel workers) into out/frames
//   node render.mjs stills 1.2 3.9 …  → single frames into out/stills (for review)
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const FPS = Number(process.env.FPS || 60);
const DUR = 30;
const WORKERS = Number(process.env.WORKERS || 4);
const SUB = Number(process.env.SUB || 4), SHUTTER = 0.5;
const mode = process.argv[2] || 'frames';
const url = 'file://' + path.join(here, 'index.html');

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const logo = ['assets/logo.svg', 'assets/logo.png'].find(f => existsSync(path.join(here, f)));
  if (logo) await page.addInitScript(l => { window.LOGO = l; }, logo);
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('console', m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  return page;
}

const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--font-render-hinting=none', '--allow-file-access-from-files'] });
if (mode === 'stills') {
  const out = path.join(here, 'out/stills');
  mkdirSync(out, { recursive: true });
  const page = await openPage(browser);
  for (const a of process.argv.slice(3)) {
    const t = Number(a);
    await page.evaluate(t => window.renderFrame(t), t);
    await page.screenshot({ path: path.join(out, `t${t.toFixed(3)}.png`) });
  }
} else {
  const out = path.join(here, 'out/frames');
  mkdirSync(out, { recursive: true });
  const total = Math.round(DUR * FPS);
  const from = Number(process.env.FROM || 0), to = Number(process.env.TO || total);
  const t0 = Date.now();
  let done = 0;
  await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
    const page = await openPage(browser);
    // interleaved so every worker walks forward in time
    // SUB sub-frames per frame spread over a 180° shutter → blended into motion blur by ffmpeg tmix
    for (let i = from * SUB + w; i < to * SUB; i += WORKERS) {
      const f = Math.floor(i / SUB), k = i % SUB;
      await page.evaluate(t => window.renderFrame(t), f / FPS + (k * SHUTTER) / (FPS * SUB));
      await page.screenshot({ path: path.join(out, `f${String(i).padStart(6, '0')}.jpg`), type: 'jpeg', quality: 95 });
      if (++done % 480 === 0) console.log(`${done}/${(to - from) * SUB} sub-frames  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  }));
}
await browser.close();
