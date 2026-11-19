"""Confirm the dimmed background in a DSH screenshot is the Material 3 scrim.

The plugin maps --dsw-alias-bg-mask-1 to scrim at 32% alpha. If the theme is
live, every dimmed surface must be exactly scrim-over-surface, so this script
recomposites the palette and looks for those blends.

Read-only: reads a PNG plus the palette table, never the running app.
"""

from __future__ import annotations

import sys
from collections import Counter

from PIL import Image

ALPHA = 0.32


def hexs(rgb: tuple[int, int, int]) -> str:
    return "#%02x%02x%02x" % rgb


def main() -> int:
    path = sys.argv[1]
    palette_path = sys.argv[2]

    roles: list[tuple[str, tuple[int, int, int]]] = []
    with open(palette_path, encoding="utf-8") as handle:
        for line in handle:
            parts = line.split()
            if len(parts) != 2:
                continue
            value, role = parts
            value = value.lstrip("#")
            roles.append((role, (int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16))))

    image = Image.open(path).convert("RGB")
    counts = Counter(image.get_flattened_data())
    total = image.size[0] * image.size[1]

    print(f"image {image.size[0]}x{image.size[1]} ({total} px)")
    print(f"scrim alpha under test: {ALPHA}\n")

    matches = 0
    print("-- dimmed surfaces (scrim over a Material 3 role) --")
    for role, rgb in roles:
        blended = tuple(round((1 - ALPHA) * channel) for channel in rgb)
        n = counts.get(blended, 0)
        if n < 1000:
            continue
        matches += n
        print(
            f"  {hexs(blended)}  {n:>8} px  {100.0 * n / total:5.2f}%"
            f"  = scrim over {role} {hexs(rgb)}"
        )

    print(f"\ndimmed Material 3 pixels: {matches} ({100.0 * matches / total:.2f}%)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
