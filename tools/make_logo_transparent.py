# -*- coding: utf-8 -*-
"""
Logo 去白底脚本
将 logo.jpg 的白色/近白色背景转换为透明，输出为 PNG。
使用「与纯白的欧式距离」做柔和过渡，避免边缘锯齿/白色光晕。
"""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "logo.jpg"
DST = ROOT / "assets" / "images" / "logo.png"

THRESHOLD_LOW = 28
THRESHOLD_HIGH = 95


def ensure_pillow():
    try:
        import PIL  # noqa: F401
    except ImportError:
        print("[错误] 缺少 Pillow，请先执行: pip install Pillow")
        sys.exit(1)


def make_transparent(src: Path, dst: Path) -> None:
    from PIL import Image
    import math

    if not src.exists():
        print(f"[错误] 源文件不存在: {src}")
        sys.exit(1)

    dst.parent.mkdir(parents=True, exist_ok=True)

    img = Image.open(src).convert("RGBA")
    width, height = img.size
    print(f"[信息] 读取 {src.name}，尺寸 {width}x{height}")

    pixels = img.load()
    span = THRESHOLD_HIGH - THRESHOLD_LOW

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            dist = math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2)
            if dist <= THRESHOLD_LOW:
                pixels[x, y] = (r, g, b, 0)
            elif dist >= THRESHOLD_HIGH:
                pixels[x, y] = (r, g, b, a)
            else:
                ratio = (dist - THRESHOLD_LOW) / span
                alpha = int(round(a * ratio))
                pixels[x, y] = (r, g, b, alpha)

    img = trim_transparent_border(img)

    img.save(dst, "PNG", optimize=True)
    print(f"[完成] 已生成: {dst}")
    print(f"        大小: {dst.stat().st_size / 1024:.1f} KB")


def trim_transparent_border(img):
    """裁剪掉透明边缘，让 logo 紧贴画布。"""
    bbox = img.getbbox()
    if bbox:
        before = img.size
        img = img.crop(bbox)
        after = img.size
        print(f"[信息] 已裁剪透明边: {before} -> {after}")
    return img


def main():
    ensure_pillow()
    make_transparent(SRC, DST)


if __name__ == "__main__":
    main()
