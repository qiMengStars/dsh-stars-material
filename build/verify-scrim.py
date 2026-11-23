"""检验应用截图中弹窗遮罩压暗背景是否符合 Material 3 scrim 混合结果。

本主题将 `--dsw-alias-bg-mask-1` 映射为不透明度 0.32 的黑色 scrim（`#000000`）。
本脚本读取配色表，按 `round((1 - ALPHA) * channel)` 计算每个角色被遮罩压暗后的颜色，
并在截图中统计像素数不少于 1000 的匹配区域。

用法：python build/verify-scrim.py <screenshot-path> <palette-table-path>
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

    print(f"图片尺寸：{image.size[0]}x{image.size[1]}（共 {total} px）")
    print(f"按 scrim 不透明度 {ALPHA} 校验\n")

    matches = 0
    print("-- 匹配的压暗背景（黑色 scrim 与角色色混合）--")
    for role, rgb in roles:
        blended = tuple(round((1 - ALPHA) * channel) for channel in rgb)
        n = counts.get(blended, 0)
        if n < 1000:
            continue
        matches += n
        print(
            f"  {hexs(blended)}  {n:>8} px  {100.0 * n / total:5.2f}%"
            f"  = scrim 叠加 {role}（{hexs(rgb)}）"
        )

    print(f"\n匹配的压暗像素总计：{matches}（{100.0 * matches / total:.2f}%）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
