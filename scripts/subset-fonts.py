#!/usr/bin/env python3
"""
Subset the display and UI fonts to exactly the glyphs the game uses.

The full Japanese fonts are ~10 MB each; the subsets are a few dozen KB. Rerun
this whenever new non-ASCII text (kanji, kana, symbols) is added to the source.

    pip install fonttools brotli
    npm pack @expo-google-fonts/shippori-mincho-b1 @expo-google-fonts/zen-maru-gothic
    (untar both into $FONT_SRC, default /tmp/fonts)
    python3 scripts/subset-fonts.py
"""
import os
import pathlib
import sys

from fontTools import subset

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = pathlib.Path(os.environ.get("FONT_SRC", "/tmp/fonts"))
OUT = ROOT / "public" / "fonts"

FONTS = {
    "shippori-700.woff2": "expo-google-fonts-shippori-mincho-b1-0.4.1/700Bold/ShipporiMinchoB1_700Bold.ttf",
    "shippori-800.woff2": "expo-google-fonts-shippori-mincho-b1-0.4.1/800ExtraBold/ShipporiMinchoB1_800ExtraBold.ttf",
    "zenmaru-500.woff2": "expo-google-fonts-zen-maru-gothic-0.4.1/500Medium/ZenMaruGothic_500Medium.ttf",
    "zenmaru-700.woff2": "expo-google-fonts-zen-maru-gothic-0.4.1/700Bold/ZenMaruGothic_700Bold.ttf",
}

EXTRA = "…—–‘’“”·×÷•★☆✦←→↑↓↺♪©°±½¼¾€¥々〜「」『』、。・ー"


def collect() -> str:
    chars = set(chr(c) for c in range(32, 127))
    chars.update(EXTRA)
    for path in list((ROOT / "src").rglob("*")) + [ROOT / "index.html"]:
        if path.suffix not in {".ts", ".tsx", ".css", ".html"} or not path.is_file():
            continue
        for ch in path.read_text(encoding="utf-8"):
            if ord(ch) > 127:
                chars.add(ch)
    return "".join(sorted(chars))


def main() -> int:
    text = collect()
    OUT.mkdir(parents=True, exist_ok=True)
    print(f"{len(text)} characters")
    for out_name, rel in FONTS.items():
        src = SRC / rel
        if not src.exists():
            print(f"missing {src}", file=sys.stderr)
            return 1
        opts = subset.Options()
        opts.flavor = "woff2"
        opts.layout_features = ["*"]
        opts.name_IDs = ["*"]
        opts.notdef_outline = True
        font = subset.load_font(str(src), opts)
        sub = subset.Subsetter(opts)
        sub.populate(text=text)
        sub.subset(font)
        dest = OUT / out_name
        subset.save_font(font, str(dest), opts)
        print(f"{out_name}: {dest.stat().st_size // 1024} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
