"""统计应用截图中命中 Material 3 角色的像素，以及宿主默认浅色主题的残留像素占比。

用法：python build/attribute-colours.py <screenshot-path> [palette-table-path]
其中 palette-table-path 可由 build/dump-palette.mjs 或 build/print-palette.mjs 生成。
"""

from __future__ import annotations

import sys
from collections import Counter

from PIL import Image

STOCK = {
    # design-platform.css 中宿主默认浅色主题的中性色板
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
    print(f"图片尺寸：{image.size[0]}x{image.size[1]}（共 {total} px）\n")

    matched_px = 0
    print("-- 命中 Material 3 角色的纯色像素 --")
    for rgb, n in counts.most_common(40):
        roles = role_by_hex.get(rgb)
        if roles is None:
            continue
        matched_px += n
        share = 100.0 * n / total
        print(f"  {hexs(rgb)}  {n:>8} px  {share:5.2f}%  <- {', '.join(roles)}")

    print(f"\nMaterial 3 角色像素总计：{matched_px}（{100.0 * matched_px / total:.2f}%）\n")

    print("-- 宿主默认浅色主题残留颜色 --")
    remaining = 0
    for name, rgb in STOCK.items():
        n = counts.get(rgb, 0)
        remaining += n
        print(f"  {name:<22} {hexs(rgb)}  {n:>8} px")
    print(f"\n宿主残留颜色像素总计：{remaining}（{100.0 * remaining / total:.2f}%）")

    print("\n-- 占比 >= 1% 且未匹配角色的颜色 --")
    for rgb, n in counts.most_common(40):
        share = 100.0 * n / total
        if share < 1.0 or rgb in role_by_hex:
            continue
        print(f"  {hexs(rgb)}  {n:>8} px  {share:5.2f}%（混合色 / 遮罩 / 图形）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
