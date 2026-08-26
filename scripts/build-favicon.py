#!/usr/bin/env python3
"""Render the browser/app icons from the square wordmark.

    python3 scripts/build-favicon.py [accent1] [accent2]

Writes app/icon.png, app/apple-icon.png and app/favicon.ico. Next's file
conventions pick all three up automatically — do not add an `icons` entry to
the metadata export or it overrides them.

gz-squarelogo.png is pure white with an alpha channel (it is a CSS mask on the
site), so it is invisible on any light surface. The icon therefore paints the
brand gradient full-bleed and lays the white mark over it, which is what the
navbar tile does and what keeps it legible on both light and dark tab bars.

Pass the next edition's colours to re-skin: e.g. `0ea5a4 22d3ee` for GZ15.
"""

import sys
from PIL import Image

ACCENT = sys.argv[1] if len(sys.argv) > 1 else "b347ff"
ACCENT2 = sys.argv[2] if len(sys.argv) > 2 else "ff5e3a"
hx = lambda h: tuple(int(h.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
A, B = hx(ACCENT), hx(ACCENT2)

SRC = "/tmp/sq-hires.png"   # high-res original; public/ holds a web-sized copy
MASTER = 1024

# full-bleed 135° gradient, same angle as the site
bg = Image.new("RGB", (MASTER, MASTER))
px = bg.load()
for y in range(MASTER):
    for x in range(MASTER):
        t = (x + y) / (2 * (MASTER - 1))
        px[x, y] = (round(A[0] + (B[0] - A[0]) * t),
                    round(A[1] + (B[1] - A[1]) * t),
                    round(A[2] + (B[2] - A[2]) * t))

logo = Image.open(SRC).convert("RGBA")
target = int(MASTER * 0.82)                       # small padding — at 16px every pixel counts
w = target
h = round(logo.height * w / logo.width)
if h > target:                                    # the mark is slightly taller than wide
    h = target
    w = round(logo.width * h / logo.height)
logo = logo.resize((w, h), Image.LANCZOS)

white = Image.new("RGBA", logo.size, (255, 255, 255, 255))
white.putalpha(logo.getchannel("A"))
bg.paste(white, ((MASTER - w) // 2, (MASTER - h) // 2), white)

bg.resize((512, 512), Image.LANCZOS).save("app/icon.png", optimize=True)
bg.resize((180, 180), Image.LANCZOS).save("app/apple-icon.png", optimize=True)
# multi-resolution .ico so the 16px tab and the 48px bookmark bar each get a
# purpose-scaled bitmap instead of one badly downsampled image
# .convert("RGBA") is required: Next/Turbopack decodes app/favicon.ico at build
# time and fails the whole build with "The PNG is not in RGBA format!" if PIL
# writes RGB frames.
bg.convert("RGBA").save("app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
print("wrote app/icon.png, app/apple-icon.png, app/favicon.ico")
