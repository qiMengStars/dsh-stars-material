"""Attribute every large flat colour in a DSH screenshot to an exact Material 3
role, and prove the stock DSH palette is gone.

Read-only: reads a PNG path plus the palette table printed by
build/print-palette.mjs and reports the mapping. It never touches the app.
"""

from __future__ import annotations

import sys
from collections import Counter

from PIL import Image

STOCK = {
    # values shipped in design-platform.css for the stock light theme
    "neutral-bluish-00": (0xFF, 0xFF, 0xFF),
    "neutral-bluish-50": (0xF9, 0xFA, 0xFB),
    "neutral-bluish-75": (0xF1, 0xF3, 0xF5),
    "neutral-bluish-100": (0xEB, 0xEE, 0xF2),
    "neutral-bluish-150": (0xE9, 0xEC, 0xF2),
    "neutral-bluish-1000": (0x0F, 0x11, 0x15),
}


def hexs(rgb: tuple[int, int, int]) -> str:
    return "#%02x%02x%02x" % rgb


def main() -> int:
    path = sys.argv[1]
    palette_path = sys.argv[2] if len(sys.argv) > 2 else None

    role_by_hex: dict[tuple[int, int, int], list[str]] = {}
    if palette_path:
        with open(palette_path, encoding="utf-8") as handle:
            for line in handle:
                line = line.split()
                if len(line) != 2:
                    continue
                value, role = line
                value = value.lstrip("#")
                rgb = (int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16))
                role_by_hex.setdefault(rgb, []).append(role)

    image = Image.open(path).convert("RGB")
    counts = Counter(image.get_flattened_data())
    total = image.size[0] * image.size[1]
    print(f"image {image.size[0]}x{image.size[1]} ({total} px)\n")

    matched_px = 0
    print("-- flat colours that are exact Material 3 roles --")
    for rgb, n in counts.most_common(40):
        roles = role_by_hex.get(rgb)
        if roles is None:
            continue
        matched_px += n
        share = 100.0 * n / total
        print(f"  {hexs(rgb)}  {n:>8} px  {share:5.2f}%  <- {', '.join(roles)}")

    print(f"\nmaterial 3 role pixels: {matched_px} ({100.0 * matched_px / total:.2f}%)\n")

    print("-- stock DSH colours still on screen --")
    remaining = 0
    for name, rgb in STOCK.items():
        n = counts.get(rgb, 0)
        remaining += n
        print(f"  {name:<22} {hexs(rgb)}  {n:>8} px")
    print(f"\nstock palette pixels: {remaining} ({100.0 * remaining / total:.2f}%)")

    print("\n-- unmatched colours above 1% of the screen --")
    for rgb, n in counts.most_common(40):
        share = 100.0 * n / total
        if share < 1.0 or rgb in role_by_hex:
            continue
        print(f"  {hexs(rgb)}  {n:>8} px  {share:5.2f}%  (blend / overlay / artwork)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
