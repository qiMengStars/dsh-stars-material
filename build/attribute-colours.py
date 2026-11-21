"""统计截图中大面积平色对应的 Material 3 角色，以及原装调色板的残留像素量。

参数依次为截图路径、build/print-palette.mjs 输出的配色表路径。
"""

from __future__ import annotations

import sys
from collections import Counter

from PIL import Image

STOCK = {
    # design-platform.css 中原装浅色主题定义的颜色值（深色主题下会被覆盖）
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
    print(f"图片 {image.size[0]}x{image.size[1]}（{total} px）\n")

    matched_px = 0
    print("-- 与某个 Material 3 角色完全一致的平色 --")
    for rgb, n in counts.most_common(40):
        roles = role_by_hex.get(rgb)
        if roles is None:
            continue
        matched_px += n
        share = 100.0 * n / total
        print(f"  {hexs(rgb)}  {n:>8} px  {share:5.2f}%  <- {', '.join(roles)}")

    print(f"\nMaterial 3 角色像素：{matched_px}（{100.0 * matched_px / total:.2f}%）\n")

    print("-- 截图中残留的原装 DSH 颜色 --")
    remaining = 0
    for name, rgb in STOCK.items():
        n = counts.get(rgb, 0)
        remaining += n
        print(f"  {name:<22} {hexs(rgb)}  {n:>8} px")
    print(f"\n原装调色板像素：{remaining}（{100.0 * remaining / total:.2f}%）")

    print("\n-- 占屏 1% 以上且不属于任何角色的颜色 --")
    for rgb, n in counts.most_common(40):
        share = 100.0 * n / total
        if share < 1.0 or rgb in role_by_hex:
            continue
        print(f"  {hexs(rgb)}  {n:>8} px  {share:5.2f}%（混色 / 遮罩 / 图形）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
