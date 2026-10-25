#!/usr/bin/env python3
"""Shore brand kit: animated banner and ads from one set of parts.

Builds into docs/brand/:
  banner.svg            animated README banner (1280x400), self-contained (font and screens embedded)
  logo.svg, mark.svg    the mark with and without the wordmark
  banner.gif/.mp4       the banner as video, with a fade so it loops cleanly
  ad-landscape.mp4      1200x628 ad, ad-square.mp4 1080x1080 ad, plus .png stills
and site/social.png (1280x640) for link previews and the GitHub social preview.

Needs Pillow, Node with Playwright (as for the browser checks) and ffmpeg.
Screens come from site/shots/*.jpg, the font from app/assets/manrope.woff2.
"""
import base64, io, os, shutil, subprocess, sys, tempfile
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'docs', 'brand')
INK, DEEP, DEEP2, WARM = '#e3e6dc', '#0f161a', '#20303a', '#f2c58b'
SCREENS = [('home-weather', 'Your apps and a calm picture'), ('nowplaying', 'Album art while music plays'), ('screensaver-mosaic', 'Its own screensaver')]
CYCLE = 9.0  # seconds for the three screens

def b64(path, size=None, q=72):
    if size is None:
        return base64.b64encode(open(path, 'rb').read()).decode()
    im = Image.open(path).convert('RGB').resize(size, Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=q, optimize=True, progressive=True)
    return base64.b64encode(buf.getvalue()).decode()

FONT = b64(os.path.join(ROOT, 'app', 'assets', 'manrope.woff2'))

def mark(x, y, s, animate=True, cls='m'):
    """The half sun over three waterlines. (x, y) is the waterline centre, s the sun radius."""
    lw, gap, th = [3.0 * s, 2.3 * s, 1.5 * s], 0.36 * s, 0.2 * s
    sun = f'<path class="{cls}-sun" d="M{x - s:.1f},{y:.1f} a{s:.1f},{s:.1f} 0 0 1 {2 * s:.1f},0 Z" fill="{INK}"/>'
    clip = f'<clipPath id="{cls}-clip"><rect x="{x - 2 * s:.1f}" y="{y - 2.2 * s:.1f}" width="{4 * s:.1f}" height="{2.2 * s - 0.04 * s:.1f}"/></clipPath>'
    lines = ''
    for i, w in enumerate(lw):
        ly = y + gap * (i + 0.55) + th * i
        lines += f'<rect class="{cls}-line {cls}-l{i}" x="{x - w / 2:.1f}" y="{ly:.1f}" width="{w:.1f}" height="{th:.1f}" rx="{th / 2:.1f}" fill="{INK}" style="transform-origin:{x:.1f}px {ly + th / 2:.1f}px"/>'
    return f'<defs>{clip}</defs><g clip-path="url(#{cls}-clip)"><g class="{cls}-rise">{sun}</g></g>{lines}'

def style(video):
    # Intro once, then the screens cycle. In video, everything fades out at the end so the loop restarts cleanly.
    return f'''<style>
@font-face{{font-family:Manrope;src:url(data:font/woff2;base64,{FONT}) format("woff2");font-weight:200 800}}
text{{font-family:Manrope,sans-serif;fill:{INK}}}
.m-rise{{animation:rise 1.4s cubic-bezier(.2,.8,.2,1) .2s both}}
@keyframes rise{{from{{transform:translateY(70%)}}to{{transform:none}}}}
.m-line{{animation:draw .9s cubic-bezier(.2,.8,.2,1) both,shimmer 3.6s ease-in-out 2s infinite}}
.m-l0{{animation-delay:.5s,2s}}.m-l1{{animation-delay:.65s,2.4s}}.m-l2{{animation-delay:.8s,2.8s}}
@keyframes draw{{from{{transform:scaleX(0);opacity:0}}to{{transform:scaleX(1);opacity:1}}}}
@keyframes shimmer{{0%,100%{{opacity:1}}50%{{opacity:.55}}}}
.word{{animation:fadeup 1s cubic-bezier(.2,.8,.2,1) .9s both}}
.tag{{animation:fadeup 1s cubic-bezier(.2,.8,.2,1) 1.2s both}}
.chips{{animation:fadeup 1s cubic-bezier(.2,.8,.2,1) 1.5s both}}
.tv{{animation:fadein 1.2s ease 1s both}}
@keyframes fadeup{{from{{opacity:0;transform:translateY(14px)}}to{{opacity:1;transform:none}}}}
@keyframes fadein{{from{{opacity:0}}to{{opacity:1}}}}
.scr{{opacity:0;animation:scr {CYCLE}s linear infinite both}}
.scr image{{animation:kb {CYCLE / 3 + 1.4:.1f}s linear infinite both}}
@keyframes scr{{0%{{opacity:0}}8%{{opacity:1}}33%{{opacity:1}}41%{{opacity:0}}100%{{opacity:0}}}}
@keyframes kb{{from{{transform:scale(1.0)}}to{{transform:scale(1.07)}}}}
.cap{{opacity:0;animation:scr {CYCLE}s linear infinite both}}
.glow{{animation:glow 6s ease-in-out infinite alternate}}
@keyframes glow{{from{{opacity:.55}}to{{opacity:1}}}}
{".all{animation:outro .7s ease 11.3s both}@keyframes outro{to{opacity:0}}" if video else ""}
</style>'''

def tv(x, y, w, h, thumbs, caption_y=None, caption_size=22):
    r = max(10, w * 0.022)
    out = f'<g class="tv"><rect x="{x - 8:.1f}" y="{y - 8:.1f}" width="{w + 16:.1f}" height="{h + 16:.1f}" rx="{r + 6:.1f}" fill="#0a0f12" stroke="rgba(255,255,255,.12)"/>'
    out += f'<clipPath id="tvclip{int(w)}"><rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{r:.1f}"/></clipPath><g clip-path="url(#tvclip{int(w)})">'
    for i, (data, _) in enumerate(thumbs):
        delay = i * CYCLE / 3 - CYCLE * 0.08 + 1.0
        out += (f'<g class="scr" style="animation-delay:{delay:.2f}s"><image href="data:image/jpeg;base64,{data}" x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" '
                f'preserveAspectRatio="xMidYMid slice" style="transform-origin:{x + w / 2:.1f}px {y + h / 2:.1f}px;animation-delay:{delay:.2f}s"/></g>')
    out += '</g></g>'
    if caption_y is not None:
        for i, (_, cap) in enumerate(thumbs):
            delay = i * CYCLE / 3 - CYCLE * 0.08 + 1.0
            out += f'<text class="cap" x="{x + w / 2:.1f}" y="{caption_y:.1f}" text-anchor="middle" font-size="{caption_size}" font-weight="500" fill-opacity=".72" style="animation-delay:{delay:.2f}s">{cap}</text>'
    return out

def chips(x, y, size, anchor='start', items=('Screensaver', 'Album art', 'Weather', 'Phone companion')):
    out, cx = '<g class="chips">', x
    widths = [len(t) * size * 0.56 + size * 1.5 for t in items]
    total = sum(widths) + size * 0.5 * (len(items) - 1)
    if anchor == 'middle': cx = x - total / 2
    for t, w in zip(items, widths):
        out += f'<rect x="{cx:.1f}" y="{y:.1f}" width="{w:.1f}" height="{size * 2:.1f}" rx="{size:.1f}" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.14)"/>'
        out += f'<text x="{cx + w / 2:.1f}" y="{y + size * 1.36:.1f}" text-anchor="middle" font-size="{size}" font-weight="500" fill-opacity=".8">{t}</text>'
        cx += w + size * 0.5
    return out + '</g>'

def background(w, h, gx, gy, gr):
    return (f'<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{DEEP2}"/><stop offset="1" stop-color="{DEEP}"/></linearGradient>'
            f'<radialGradient id="warm"><stop offset="0" stop-color="{WARM}" stop-opacity=".22"/><stop offset="1" stop-color="{WARM}" stop-opacity="0"/></radialGradient></defs>'
            f'<rect width="{w}" height="{h}" fill="url(#bg)"/><circle class="glow" cx="{gx}" cy="{gy}" r="{gr}" fill="url(#warm)"/>')

def svg(w, h, body, video):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{style(video)}<g class="all">{body}</g></svg>'

def banner(thumbs, video=False):
    w, h = 1280, 400
    body = background(w, h, 190, 150, 330)
    body += mark(150, 150, 46)
    body += '<text class="word" x="246" y="176" font-size="92" font-weight="300" letter-spacing="-2">Shore</text>'
    body += '<text class="tag" x="84" y="262" font-size="29" font-weight="400" fill-opacity=".78">A calm home screen for Google TV</text>'
    body += chips(84, 300, 17)
    body += tv(700, 46, 512, 288, thumbs, caption_y=372, caption_size=19)
    return svg(w, h, body, video)

def landscape(thumbs, w=1200, h=628, video=False):
    body = background(w, h, 170, 130, 360)
    body += mark(130, 128, 40)
    body += '<text class="word" x="202" y="150" font-size="80" font-weight="300" letter-spacing="-2">Shore</text>'
    body += '<text class="tag" x="72" y="236" font-size="40" font-weight="300" letter-spacing="-.6">A calm home screen</text>'
    body += '<text class="tag" x="72" y="286" font-size="40" font-weight="300" letter-spacing="-.6">for Google TV.</text>'
    body += f'<text class="chips" x="72" y="{h - 64}" font-size="20" font-weight="500" fill-opacity=".6">Free and open source · github.com/taynotfound/shore</text>'
    body += chips(72, 330, 16, items=('Screensaver', 'Album art', 'Weather'))
    body += tv(560, 118, 576, 324, thumbs, caption_y=500, caption_size=20)
    return svg(w, h, body, video)

def square(thumbs, video=False):
    w = h = 1080
    body = background(w, h, 540, 190, 420)
    body += mark(424, 196, 52)
    body += '<text class="word" x="520" y="226" font-size="104" font-weight="300" letter-spacing="-2.6" text-anchor="start">Shore</text>'
    body += '<text class="tag" x="540" y="356" font-size="50" font-weight="300" letter-spacing="-.8" text-anchor="middle">A calm home screen for Google TV.</text>'
    body += chips(540, 400, 20, anchor='middle')
    body += tv(100, 520, 880, 495, thumbs)
    return svg(w, h, body, video)

def render(svg_path, out_base, w, h, seconds, fps, gif_width=None, still_at=6.0):
    frames = tempfile.mkdtemp(prefix='shore-brand-')
    script = os.path.join(os.path.dirname(__file__), 'render_frames.mjs')
    subprocess.run(['node', script, svg_path, frames, str(w), str(h), str(seconds), str(fps), str(still_at)], check=True, cwd=ROOT)
    shutil.copy(os.path.join(frames, 'still.png'), out_base + '.png')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', os.path.join(frames, 'f%04d.png'),
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'slow', '-movflags', '+faststart', out_base + '.mp4'], check=True)
    if gif_width:
        palette = os.path.join(frames, 'palette.png')
        vf = f'fps=12,scale={gif_width}:-1:flags=lanczos'  # keeps the GIF near 4 MB
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', out_base + '.mp4', '-vf', vf + ',palettegen=max_colors=128:stats_mode=diff', palette], check=True)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', out_base + '.mp4', '-i', palette, '-lavfi', vf + '[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle', out_base + '.gif'], check=True)
    shutil.rmtree(frames)

def main():
    os.makedirs(OUT, exist_ok=True)
    shots = os.path.join(ROOT, 'site', 'shots')
    small = [(b64(os.path.join(shots, n + '.jpg'), (640, 360), 74), c) for n, c in SCREENS]
    large = [(b64(os.path.join(shots, n + '.jpg'), (1280, 720), 82), c) for n, c in SCREENS]
    open(os.path.join(OUT, 'banner.svg'), 'w').write(banner(small))
    open(os.path.join(OUT, 'mark.svg'), 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" rx="44" fill="{DEEP}"/>{mark(100, 104, 34, cls="s")}</svg>')
    open(os.path.join(OUT, 'logo.svg'), 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 160" width="560" height="160"><style>@font-face{{font-family:Manrope;src:url(data:font/woff2;base64,{FONT}) format("woff2");font-weight:200 800}}</style>{mark(80, 84, 34, cls="s")}<text x="150" y="104" font-family="Manrope,sans-serif" font-size="72" font-weight="300" letter-spacing="-1.6" fill="{INK}">Shore</text></svg>')
    if '--svg-only' in sys.argv: return
    tmp = tempfile.mkdtemp(prefix='shore-svg-')
    jobs = [('banner', banner(small, True), 1280, 400, 800), ('ad-landscape', landscape(large, video=True), 1200, 628, None), ('ad-square', square(large, True), 1080, 1080, None)]
    for name, content, w, h, gif in jobs:
        path = os.path.join(tmp, name + '.svg'); open(path, 'w').write(content)
        render(path, os.path.join(OUT, name), w, h, 12.0, 30, gif)
    social = os.path.join(tmp, 'social.svg'); open(social, 'w').write(landscape(large, 1280, 640))
    frames = tempfile.mkdtemp(prefix='shore-social-')
    subprocess.run(['node', os.path.join(os.path.dirname(__file__), 'render_frames.mjs'), social, frames, '1280', '640', '0', '1', '6.0'], check=True, cwd=ROOT)
    shutil.copy(os.path.join(frames, 'still.png'), os.path.join(ROOT, 'site', 'social.png'))
    shutil.rmtree(frames); shutil.rmtree(tmp)

if __name__ == '__main__':
    main()
