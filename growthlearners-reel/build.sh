#!/usr/bin/env bash
# Full pipeline: soundtrack → frames (with sub-frame motion blur) → graded, mastered MP4.
set -euo pipefail
cd "$(dirname "$0")"
FF=${FFMPEG:-$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")}
FPS=60
SUB=${SUB:-4}

if [[ "${SKIP_AUDIO:-0}" != 1 ]]; then python3 audio/compose.py; fi
if [[ "${SKIP_FRAMES:-0}" != 1 ]]; then rm -rf out/frames; SUB=$SUB node render.mjs frames; fi

# tmix averages each group of SUB sub-frames (motion blur), select keeps one per output frame.
# Film grain + vignette are applied here (much cheaper than in the browser).
# Audio: EBU R128 master to -14 LUFS / -1 dBTP (streaming-platform loudness).
"$FF" -y -loglevel warning -stats \
  -framerate $((FPS * SUB)) -i out/frames/f%06d.jpg \
  -i audio/soundtrack.wav \
  -filter_complex "[0:v]tmix=frames=${SUB},select='not(mod(n+1\,${SUB}))',setpts=N/${FPS}/TB,format=yuv420p,vignette=angle=PI/5:mode=forward,noise=alls=5:allf=t+u[v];[1:a]loudnorm=I=-14:TP=-1:LRA=9,aresample=48000[a]" \
  -map "[v]" -map "[a]" -r $FPS \
  -c:v libx264 -preset slow -crf 16 -profile:v high -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 256k -shortest \
  growthlearners-showreel.mp4

"$FF" -hide_banner -i growthlearners-showreel.mp4 2>&1 | grep -E "Duration|Stream" || true
