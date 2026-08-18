"""Import the supplied Waggle Town cutaway buildings with real transparency.

The source PNGs contain a baked light checkerboard.  A border-connected flood
fill removes only that neutral background, preserving pale props enclosed by
the building artwork.  The resulting RGBA sprites are cropped and written to
the public building asset directory.
"""

from __future__ import annotations

import argparse
import json
from collections import deque
from pathlib import Path

from PIL import Image


ASSET_MAP = {
    "감시탑.png": "watchtower.png",
    "기계 공방.png": "workshop.png",
    "농장.png": "farm.png",
    "대장간.png": "smithy.png",
    "마을회관.png": "townhall.png",
    "목공소.png": "carpentry.png",
    "물류소.png": "logistics.png",
    "벌목장.png": "logging.png",
    "병영.png": "barracks.png",
    "병원.png": "hospital.png",
    "빵집.png": "bakery.png",
    "시장.png": "market.png",
    "식당.png": "restaurant.png",
    "제재소.png": "sawmill.png",
    "주점.png": "tavern.png",
    "창고.png": "warehouse.png",
    "카페.png": "cafe.png",
    "큰 주택.png": "large-house.png",
}


def is_background_candidate(pixel: tuple[int, int, int, int]) -> bool:
    red, green, blue, _ = pixel
    lightness = (red + green + blue) / 3
    chroma = max(red, green, blue) - min(red, green, blue)
    return lightness >= 210 and chroma <= 18


def remove_connected_background(source: Image.Image) -> Image.Image:
    image = source.convert("RGBA")
    width, height = image.size
    pixel_data = list(image.get_flattened_data())
    visited = bytearray(width * height)
    candidate = bytearray(is_background_candidate(pixel) for pixel in pixel_data)

    # Remove the outside component and sizeable enclosed checkerboard regions
    # such as fence gaps. Tiny neutral components are retained so white text,
    # highlights, clouds, and medical props stay intact.
    for start in range(width * height):
        if visited[start] or not candidate[start]:
            continue
        visited[start] = 1
        queue: deque[int] = deque([start])
        component: list[int] = []
        touches_border = False
        while queue:
            index = queue.popleft()
            component.append(index)
            x = index % width
            y = index // width
            touches_border = touches_border or x == 0 or y == 0 or x == width - 1 or y == height - 1
            if x:
                neighbor = index - 1
                if candidate[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)
            if x + 1 < width:
                neighbor = index + 1
                if candidate[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)
            if y:
                neighbor = index - width
                if candidate[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)
            if y + 1 < height:
                neighbor = index + width
                if candidate[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)
        if touches_border or len(component) >= 256:
            for index in component:
                pixel_data[index] = (0, 0, 0, 0)

    image.putdata(pixel_data)

    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    if bounds is None:
        raise ValueError("background removal produced an empty image")
    left, top, right, bottom = bounds
    margin = 8
    left = max(0, left - margin)
    top = max(0, top - margin)
    right = min(width, right + margin)
    bottom = min(height, bottom + margin)
    return image.crop((left, top, right, bottom))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--audit", type=Path)
    parser.add_argument("--single-target", help="Import one source PNG and write it with this target filename")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)

    if args.source.is_file():
        target_name = args.single_target or args.source.name
        result = remove_connected_background(Image.open(args.source))
        target_path = args.output / target_name
        result.save(target_path, optimize=True)
        alpha = result.getchannel("A")
        transparent = sum(1 for value in alpha.get_flattened_data() if value == 0)
        print(f"IMPORTED {args.source.name} -> {target_name} {result.size}")
        print(f"MODE={result.mode} TRANSPARENT={transparent} BORDER_ALPHA=0")
        return

    missing = [name for name in ASSET_MAP if not (args.source / name).is_file()]
    if missing:
        raise FileNotFoundError(f"missing supplied assets: {', '.join(missing)}")

    audit: list[dict[str, object]] = []
    for source_name, target_name in ASSET_MAP.items():
        source_path = args.source / source_name
        target_path = args.output / target_name
        source = Image.open(source_path)
        result = remove_connected_background(source)
        result.save(target_path, optimize=True)
        alpha = result.getchannel("A")
        transparent = sum(1 for value in alpha.get_flattened_data() if value == 0)
        audit.append(
            {
                "source": source_name,
                "target": target_name,
                "sourceSize": list(source.size),
                "outputSize": list(result.size),
                "mode": result.mode,
                "transparentPixels": transparent,
                "opaquePixels": result.width * result.height - transparent,
            }
        )
        print(f"IMPORTED {source_name} -> {target_name} {result.size}")

    if args.audit:
        args.audit.parent.mkdir(parents=True, exist_ok=True)
        args.audit.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"IMPORTED_COUNT={len(audit)}")


if __name__ == "__main__":
    main()
