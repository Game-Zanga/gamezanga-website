#!/usr/bin/env python3
"""Render public/og.png — the 1200x630 card shown when gamezanga.net is shared.

Run:  python3 scripts/build-og-image.py

The Arabic wordmark comes from the logo PNG as *artwork*, never as drawn text:
public/images/gz-logo.png is a white-on-alpha CSS mask, so it is tinted through
its own alpha channel here exactly the way the site hero tints it with
`mask-image` + a gradient background. That also sidesteps Arabic shaping — PIL
does not shape Arabic, so any Arabic drawn as text would come out disconnected
and backwards. Only Latin metadata is drawn with a font.

Re-run this whenever the edition number or jam dates change in lib/jam-config.ts.
"""

from PIL import Image, ImageDraw, ImageFont, ImageOps

W, H = 1200, 630
BG = (10, 10, 15)
ACCENT = (179, 71, 255)      # --color-accent
ACCENT2 = (255, 94, 58)      # --color-accent-2
MUTED = (154, 154, 176)
FAINT = (110, 110, 134)

EDITION = "EDITION 14"
DATES = "13 – 16 AUGUST 2026"
SITE = "gamezanga.net"
TAGLINE = "72-HOUR ARABIC GAME JAM"

BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
REG = "/System/Library/Fonts/Supplemental/Arial.ttf"


def glow(size, color, opacity):
    """Soft radial brand glow, mirroring the body's radial-gradient()s."""
    g = ImageOps.invert(Image.radial_gradient("L")).resize(size, Image.BICUBIC)
    g = g.point(lambda v: int(v * opacity))
    layer = Image.new("RGBA", size, color + (255,))
    layer.putalpha(g)
    return layer


def tracked(draw, xy, text, font, fill, tracking=0, anchor_center=True):
    """Draw letter-spaced text; PIL has no tracking of its own."""
    widths = [draw.textlength(c, font=font) for c in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x, y = xy
    if anchor_center:
        x -= total / 2
    for c, w in zip(text, widths):
        draw.text((x, y), c, font=font, fill=fill)
        x += w + tracking
    return total


card = Image.new("RGB", (W, H), BG)

# --- brand atmosphere: grid + two glows, same recipe as globals.css ----------
grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(grid)
for x in range(0, W, 40):
    gd.line([(x, 0), (x, H)], fill=(255, 255, 255, 8))
for y in range(0, H, 40):
    gd.line([(0, y), (W, y)], fill=(255, 255, 255, 8))
card = Image.alpha_composite(card.convert("RGBA"), grid)

card.alpha_composite(glow((1100, 800), ACCENT, 0.30), (420, -320))
card.alpha_composite(glow((900, 700), ACCENT2, 0.16), (-260, 180))

# --- wordmark, tinted through its own alpha ---------------------------------
logo = Image.open("public/images/gz-logo.png").convert("RGBA")
lw = 720
logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)

grad = Image.new("RGBA", logo.size)
gp = grad.load()
for x in range(logo.width):
    t = x / max(1, logo.width - 1)
    gp_col = (
        round(ACCENT[0] + (ACCENT2[0] - ACCENT[0]) * t),
        round(ACCENT[1] + (ACCENT2[1] - ACCENT[1]) * t),
        round(ACCENT[2] + (ACCENT2[2] - ACCENT[2]) * t),
        255,
    )
    for y in range(logo.height):
        gp[x, y] = gp_col
grad.putalpha(logo.getchannel("A"))

lx, ly = (W - logo.width) // 2, 168
card.alpha_composite(grad, (lx, ly))

draw = ImageDraw.Draw(card)

# --- kicker above the wordmark ----------------------------------------------
f_kick = ImageFont.truetype(BOLD, 21)
tracked(draw, (W / 2, ly - 62), TAGLINE, f_kick, MUTED + (255,), tracking=5.5)

# --- edition + dates below ---------------------------------------------------
y = ly + logo.height + 54
f_ed = ImageFont.truetype(BOLD, 34)
f_dates = ImageFont.truetype(REG, 30)

ed_w = tracked(draw, (W / 2, y), EDITION, f_ed, (245, 245, 247, 255), tracking=3)
y += 58
draw.text((W / 2, y), DATES, font=f_dates, fill=MUTED + (255,), anchor="ma")

# --- footer: accent rule + domain -------------------------------------------
rule_y = H - 92
rule = Image.new("RGBA", (360, 3))
rp = rule.load()
for x in range(360):
    t = x / 359
    rp[x, 0] = rp[x, 1] = rp[x, 2] = (
        round(ACCENT[0] + (ACCENT2[0] - ACCENT[0]) * t),
        round(ACCENT[1] + (ACCENT2[1] - ACCENT[1]) * t),
        round(ACCENT[2] + (ACCENT2[2] - ACCENT[2]) * t),
        255,
    )
card.alpha_composite(rule, ((W - 360) // 2, rule_y))

f_site = ImageFont.truetype(BOLD, 24)
tracked(draw, (W / 2, rule_y + 26), SITE, f_site, FAINT + (255,), tracking=3)

card.convert("RGB").save("public/og.png", optimize=True)
print("wrote public/og.png", card.size)
