# Turns the hero clip into the home page's scroll frames (public/film/lg and /sm).
# Fills the clip's letterbox, evens out the background light to ode cream (#FAF6F0) without
# touching the cup, crops to 4:5 and keeps every second frame up to the last clean one.
# Usage: extract the clip to PNGs (ffmpeg -i clip.mp4 -an raw/%03d.png), then
#        python scripts/film_frames.py raw public/film
import sys, os
import numpy as np
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]
LAST = 176
TARGET = np.array([250, 246, 240], float)
CROP = (0, 180, 720, 1080)

from scipy.ndimage import gaussian_filter, zoom

def blur(x, r):
    # gaussian blur at quarter scale, upsampled back
    h, w = x.shape[:2]
    small = x[::4, ::4]
    sig = (r / 4, r / 4) + ((0,) if x.ndim == 3 else ())
    sm = gaussian_filter(small, sig, mode='nearest')
    f = (h / sm.shape[0], w / sm.shape[1]) + ((1,) if x.ndim == 3 else ())
    return zoom(sm, f, order=1)[:h, :w]

def process(i):
    a = np.asarray(Image.open(f'{src}/{i:03d}.png').convert('RGB')).astype(float)
    L = a.mean(2)
    bright = np.percentile(L, 90, axis=1) > 205
    top = 0
    while top < 640 and not bright[top:top + 6].all(): top += 1
    bot = 1279
    while bot > 640 and not bright[bot - 5:bot + 1].all(): bot -= 1
    if top > 0: top += 10
    if bot < 1279: bot -= 10
    inside = np.zeros(L.shape, bool); inside[top:bot + 1] = True
    # background = cream pixels inside the picture
    med = np.median(a[inside & (L > 215)], 0)
    dist = np.abs(a - med).sum(2)
    bgm = (inside & (dist < 30)).astype(float)
    field = blur(a * bgm[..., None], 90) / np.maximum(blur(bgm, 90), 1e-3)[..., None]
    g = a * (TARGET / np.maximum(field, 1))
    # flatten the empty background (grain and compression blotches) so it reads as one surface with the
    # filled part; shadows are darker and steam is whiter than the cream, so both stay
    sm = gaussian_filter(g, (2, 2, 0))
    d = np.abs(sm - TARGET).sum(2)
    whiter = sm[..., 2] - TARGET[2] > 3
    m = np.clip((16 - d) / 8, 0, 1) * ~whiter
    m = gaussian_filter(m, 2)[..., None]
    g = g * (1 - m) + TARGET * m
    # outside the picture: plain cream, feathered across 24px
    w = inside.astype(float)
    w = blur(w, 24)
    w = np.where(inside, np.maximum(w, 0), 0)
    w = np.clip((w - 0.0) / 0.5, 0, 1)[..., None]
    g = g * w + TARGET * (1 - w)
    return Image.fromarray(np.clip(g, 0, 255).astype(np.uint8)).crop(CROP)

os.makedirs(f'{out}/lg', exist_ok=True); os.makedirs(f'{out}/sm', exist_ok=True)
frames = list(range(1, LAST + 1, 2))
for n, i in enumerate(frames):
    im = process(i)
    im.filter(ImageFilter.UnsharpMask(1.2, 40, 2)).save(f'{out}/lg/{n:03d}.webp', quality=74, method=6)
    im.resize((480, 600), Image.LANCZOS).save(f'{out}/sm/{n:03d}.webp', quality=72, method=6)
print(len(frames), 'frames')
