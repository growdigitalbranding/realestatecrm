# Growthlearners — 30s showreel

A 30-second, 1080p60 motion-graphics promo for [growthlearners.com](https://growthlearners.com/).
Final render: `growthlearners-showreel.mp4`.

Everything is generated from code: the soundtrack is synthesized in Python and the picture is a GSAP
timeline rendered frame by frame in headless Chromium. Picture and sound share one tempo grid
(128 BPM, 16 bars = exactly 30.000 s), so every cut, pop, slam and whip lands on a beat.

## Edit (bar → shot)

| Bars | Time | Music | Picture |
|---|---|---|---|
| 1–2 | 0.00–3.75 | Intro: filtered pluck pulse, snare build, riser | Growth curve plots one point per beat (Day 01 → Day 30), camera follows, last point rockets up into a lime iris |
| 3 | 3.75–5.63 | Drop A + impact | One word per kick: **LEARN / AI / DIGITAL / MARKETING** (colour flips, scramble, variable-width type) |
| 4 | 5.63–7.50 | Drop A | Odometer 00→30, calendar of 30 days fills on the 16ths, slab wipe |
| 5–6 | 7.50–11.25 | Drop A + riser | Research → Strategize → Create → Automate → **Launch**; the rocket lifts off and the camera whips up |
| 7–10 | 11.25–18.75 | Drop A' + hook | Four modules, one per bar, joined by whip pans, each built from animated UI components (persona, calendar, ad creative, video timeline, ads manager, analytics) |
| 11–12 | 18.75–22.50 | Breakdown, snare roll, half-beat of silence | "You finish owning:" checklist ticks on the claps; website, CRM and automation cards float in; the push-in cuts to black on the silence: *Only 8 seats.* |
| 13–14 | 22.50–26.25 | Drop B | Bento grid of batch facts springs out of the centre, then reflows on bar 14 |
| 15–16 | 26.25–30.00 | Final impact + stab, ring-out | Grid implodes → logo builds (bars, dot, wordmark), tagline decodes, CTA: *Next batch · 5 Oct 2026 / growthlearners.com* |

Techniques used: beat-locked keyframes, overshoot and elastic springs, squash and stretch, anticipation,
staggered character animation, a variable-font width axis, text scramble, odometer counters, DrawSVG line work,
whip pans with directional blur, a shape iris and slab wipes, kick-driven camera pulses, impact shake,
chromatic fringing, true sub-frame motion blur (4 samples, 180° shutter), and film grain plus a vignette in post.

## Brand assets

The build container could not reach growthlearners.com (blocked by the network egress policy), so the
course facts come from the public listing (8 seats, 20 live sessions, offline in Coimbatore, Mon–Fri 6:30–8:30 PM,
₹18,999, next batch 5 Oct 2026, 30 days of WhatsApp support, internship after each batch). The logo is
a **stand-in wordmark**. To use the real one:

1. Drop `logo.svg` or `logo.png` (transparent, light-on-dark) into `assets/`.
2. Run `SKIP_AUDIO=1 ./build.sh`.

The end card will then use the supplied logo. The palette lives in `C` in `src/lib.js`.

## Build

```bash
npm install
pip install numpy scipy imageio-ffmpeg
./build.sh                # soundtrack + 7,200 sub-frames + encode (≈6 min on 4 cores)
node render.mjs stills 4.2 13.1 27.5   # review single frames → out/stills/
```

- `audio/compose.py`: synthesizer, arrangement, SFX cues and mastering → `audio/soundtrack.wav`
- `src/lib.js`: tempo grid (`B(bar, beat)`), easing, text helpers, and procedural tracks
- `src/scenes.js`: the eight scenes, HUD, and global camera/shake/flash
- `render.mjs`: deterministic frame renderer (Playwright)
- `build.sh`: motion-blur blend, grain, vignette, loudness mastering (−14 LUFS), H.264 encode
