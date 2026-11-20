"""确认 DSH 截图里被压暗的背景确实是 Material 3 的 scrim。

插件把 --dsw-alias-bg-mask-1 映射成 32% alpha 的 scrim。如果主题真的在跑，每一处被压暗的
表面都必须正好是 scrim 叠在某个表面色上的结果，所以这个脚本按配色表重新合成一遍，找那些
混色值。
只读：给一个 PNG 加一份配色表，不碰运行中的应用。
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
    print("-- 被压暗的表面（scrim 叠在某个 Material 3 角色上）--")
    for role, rgb in roles:
        blended = tuple(round((1 - ALPHA) * channel) for channel in rgb)
        n = counts.get(blended, 0)
        if n < 1000:
            continue
        matches += n
        print(
            f"  {hexs(blended)}  {n:>8} px  {100.0 * n / total:5.2f}%"
            f"  = scrim 叠在 {role} {hexs(rgb)} 上"
        )

    print(f"\n被压暗的 Material 3 像素：{matches}（{100.0 * matches / total:.2f}%）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
