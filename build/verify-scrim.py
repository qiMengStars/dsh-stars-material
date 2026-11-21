"""校验 DSH 截图中的压暗背景是否为 Material 3 scrim。

插件将 --dsw-alias-bg-mask-1 映射为 alpha 0.32 的 scrim。主题生效时，每处压暗表面
均等于 scrim 与某个 Material 3 表面色按该 alpha 混色的结果。本脚本读取配色表，
按同一 alpha 逐角色合成混色值，并统计各混色值在截图中的像素数。

参数依次为截图路径、build/print-palette.mjs 输出的配色表路径。
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

    print(f"图片 {image.size[0]}x{image.size[1]}（{total} px）")
    print(f"按 {ALPHA} 的 scrim 不透明度检验\n")

    matches = 0
    print("-- 压暗表面（scrim 与 Material 3 角色混色）--")
    for role, rgb in roles:
        blended = tuple(round((1 - ALPHA) * channel) for channel in rgb)
        n = counts.get(blended, 0)
        if n < 1000:
            continue
        matches += n
        print(
            f"  {hexs(blended)}  {n:>8} px  {100.0 * n / total:5.2f}%"
            f"  = scrim 与 {role} {hexs(rgb)} 混色"
        )

    print(f"\n被压暗的 Material 3 像素：{matches}（{100.0 * matches / total:.2f}%）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
