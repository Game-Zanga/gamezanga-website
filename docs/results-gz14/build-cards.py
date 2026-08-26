#!/usr/bin/env python3
"""Batch-render the top-10 winner cards for the Game Zanga 14 results.

    python3 build-cards.py <thumbs-dir> <out-dir>

Kept outside the repo on purpose: the rankings are embargoed until the premiere.

PIL does not shape Arabic — it draws the isolated forms left-to-right, so text
comes out disconnected and backwards. Every Arabic string therefore goes through
arabic_reshaper (joins the letters) and python-bidi (reorders for display)
before it is drawn. Cairo is the brand face and is the full build, not the
site's subsets, so mixed titles like "كاتب الأحلام Dream Writer" render whole.
"""
import json, sys, pathlib
from PIL import Image, ImageDraw, ImageFont, ImageOps
import arabic_reshaper
from bidi.algorithm import get_display

THUMBS = pathlib.Path(sys.argv[1])
OUT = pathlib.Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
FONT = str(pathlib.Path(__file__).parent / "fonts" / "cairo-full.ttf")

W = H = 1080
BG = (10, 10, 15)
FG = (245, 245, 247)
MUTED = (154, 154, 176)
FAINT = (110, 110, 134)
ACCENT = (179, 71, 255)
ACCENT2 = (255, 94, 58)

ORDINAL = {1:"الأول",2:"الثاني",3:"الثالث",4:"الرابع",5:"الخامس",
           6:"السادس",7:"السابع",8:"الثامن",9:"التاسع",10:"العاشر"}

AR = lambda s: any('\u0600' <= c <= '\u06ff' or '\ufb50' <= c <= '\ufeff' for c in s)

# Cairo ships the joining forms but omits 11 ISOLATED presentation forms
# (ا ب ت ر ز ...), which is why they rendered as tofu. An isolated form is
# visually identical to the base letter's default glyph, so any codepoint the
# font lacks is swapped for its Unicode decomposition — same picture, no
# fallback font, brand typography intact.
import unicodedata
from fontTools.ttLib import TTFont as _TTF
_CMAP = _TTF(FONT).getBestCmap()

def _substitute(s):
    out = []
    for ch in s:
        if ord(ch) in _CMAP:
            out.append(ch); continue
        dec = unicodedata.decomposition(ch)
        if dec and "<" in dec:
            base = int(dec.split()[-1], 16)
            if base in _CMAP:
                out.append(chr(base)); continue
        out.append(ch)  # genuinely unavailable — will show as tofu, and should
    return "".join(out)

def shape(s):
    """Join + reorder Arabic, then repair glyphs the font lacks."""
    if not AR(s):
        return s
    return _substitute(get_display(arabic_reshaper.reshape(s)))

def font(size, weight="Bold"):
    f = ImageFont.truetype(FONT, size)
    try: f.set_variation_by_name(weight)
    except Exception: pass
    return f

def glow(size, color, opacity):
    g = ImageOps.invert(Image.radial_gradient("L")).resize(size, Image.BICUBIC)
    g = g.point(lambda v: int(v * opacity))
    layer = Image.new("RGBA", size, color + (255,)); layer.putalpha(g)
    return layer

def gradient(size, c1, c2):
    g = Image.new("RGBA", size); p = g.load()
    n = max(1, size[0] - 1)
    for x in range(size[0]):
        t = x / n
        col = (round(c1[0]+(c2[0]-c1[0])*t), round(c1[1]+(c2[1]-c1[1])*t),
               round(c1[2]+(c2[2]-c1[2])*t), 255)
        for y in range(size[1]): p[x, y] = col
    return g

def centered(d, cx, y, text, f, fill):
    t = shape(text)
    w = d.textlength(t, font=f)
    d.text((cx - w/2, y), t, font=f, fill=fill)
    return w

def centered_gradient(card, cx, y, text, f, c1, c2):
    """Gradient-filled text: draw to a mask, tint through it."""
    t = shape(text)
    d0 = ImageDraw.Draw(Image.new("L", (1, 1)))
    w = int(d0.textlength(t, font=f)) + 8
    asc, desc = f.getmetrics()
    h = asc + desc
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).text((4, 0), t, font=f, fill=255)
    tint = gradient((w, h), c1, c2); tint.putalpha(mask)
    card.alpha_composite(tint, (int(cx - w/2), int(y)))
    return w

def fit(text, base, maxw, weight="Black"):
    """Shrink until the line fits — titles vary a lot in length."""
    f = font(base, weight)
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    t = shape(text)
    while d.textlength(t, font=f) > maxw and base > 26:
        base -= 2; f = font(base, weight)
    return f

logo = Image.open("public/images/gz-logo.png").convert("RGBA") \
    if pathlib.Path("public/images/gz-logo.png").exists() else None

winners = json.load(open(pathlib.Path(__file__).parent / "winners.json"))

for wdata in winners:
    card = Image.new("RGBA", (W, H), BG + (255,))

    grid = Image.new("RGBA", (W, H), (0,0,0,0)); gd = ImageDraw.Draw(grid)
    for x in range(0, W, 60): gd.line([(x,0),(x,H)], fill=(255,255,255,7))
    for y in range(0, H, 60): gd.line([(0,y),(W,y)], fill=(255,255,255,7))
    card = Image.alpha_composite(card, grid)
    card.alpha_composite(glow((980,700), ACCENT, 0.28), (400,-280))
    card.alpha_composite(glow((880,640), ACCENT2, 0.15), (-240,600))

    d = ImageDraw.Draw(card)
    y = 62

    # kicker
    centered(d, W/2, y, "نتائج زنقة الألعاب ١٤", font(26, "Bold"), MUTED + (255,))
    y += 54

    # placement
    rank_txt = f"المركز {ORDINAL[wdata['rank']]}"
    centered_gradient(card, W/2, y, rank_txt, font(64, "Black"), ACCENT, ACCENT2)
    y += 96

    # award, if any
    if wdata["award"]:
        f_aw = fit(wdata["award"], 27, W*0.86, "Bold")
        tw = ImageDraw.Draw(Image.new("L",(1,1))).textlength(shape(wdata["award"]), font=f_aw)
        pad = 22; ph = 50
        box = (int(W/2 - tw/2 - pad), y, int(W/2 + tw/2 + pad), y + ph)
        d.rounded_rectangle(box, radius=ph//2, fill=(30,22,44,255),
                            outline=ACCENT + (255,), width=2)
        centered(d, W/2, y + 8, wdata["award"], f_aw, ACCENT + (255,))
        y += ph + 26
    else:
        y += 12

    # Cover art is sized from the space actually left over, not a fixed width —
    # an award pill adds ~76px and used to push the country line underneath the
    # footer wordmark, silently losing it.
    FOOTER = 156                     # wordmark + breathing room
    f_name_probe = fit(wdata["name"], 62, W*0.86, "Black")
    text_below = f_name_probe.getmetrics()[0] + 22 + 42 + 34 + 40  # name+dev+country+gaps
    avail = H - FOOTER - text_below - y

    th = Image.open(THUMBS / wdata["thumb"]).convert("RGBA")
    ratio = th.height / th.width
    tw_ = min(620, int(avail / ratio))
    th_ = round(tw_ * ratio)
    frame = Image.new("RGBA", (tw_ + 6, th_ + 6), (0,0,0,0))
    ImageDraw.Draw(frame).rounded_rectangle([0,0,tw_+5,th_+5], radius=18,
                                            outline=(70,70,110,255), width=3)
    th = th.resize((tw_, th_), Image.LANCZOS)
    card.alpha_composite(th, (int(W/2 - tw_/2), int(y)))
    card.alpha_composite(frame, (int(W/2 - tw_/2 - 3), int(y - 3)))
    y += th_ + 40

    # game name
    f_name = fit(wdata["name"], 62, W*0.86, "Black")
    centered(d, W/2, y, wdata["name"], f_name, FG + (255,))
    y += f_name.getmetrics()[0] + 22

    # developer + country
    centered(d, W/2, y, f"من تطوير ({wdata['dev']})", fit(f"من تطوير ({wdata['dev']})", 28, W*0.84, "Regular"), MUTED + (255,))
    y += 42
    centered(d, W/2, y, wdata["country"], font(26, "SemiBold"), FAINT + (255,))

    # footer wordmark
    if logo is not None:
        lw = 240; lh = round(logo.height * lw / logo.width)
        lg = logo.resize((lw, lh), Image.LANCZOS)
        tint = gradient((lw, lh), ACCENT, ACCENT2); tint.putalpha(lg.getchannel("A"))
        card.alpha_composite(tint, ((W - lw)//2, H - lh - 52))

    assert y < H - FOOTER + 30, (
        f"rank {wdata['rank']}: content runs to {y}, footer starts at {H - FOOTER}")

    out = OUT / f"gz14-rank-{wdata['rank']:02d}.png"
    card.convert("RGB").save(out, optimize=True)
    print("wrote", out.name, "—", wdata["name"][:34])
