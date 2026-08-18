from __future__ import annotations

from collections import deque
from pathlib import Path
from shutil import copy2

from PIL import Image


SOURCE_ROOT = Path(r"C:\Users\ydhfx\OneDrive\Desktop\새 폴더")
PROJECT_ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = PROJECT_ROOT / "public" / "game-assets"


def atlas_named(prefix: str) -> Path:
    matches = sorted(SOURCE_ROOT.glob(f"{prefix}*.png"))
    if not matches:
        raise FileNotFoundError(f"Missing source atlas: {prefix}*.png")
    return matches[0]


def background_like(pixel: tuple[int, int, int]) -> bool:
    r, g, b = pixel
    # The supplied atlases use a connected warm beige paper field.  Flooding
    # only from crop edges protects equally bright character/balloon pixels
    # enclosed by their original dark outline.
    return r >= 198 and g >= 154 and b >= 92 and r >= g and g >= b


def transparent_subject(
    atlas: Image.Image,
    box: tuple[int, int, int, int],
    internal_seeds: tuple[tuple[int, int], ...] = (),
) -> Image.Image:
    crop = atlas.crop(box).convert("RGBA")
    width, height = crop.size
    pixels = crop.load()
    background = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def enqueue(x: int, y: int) -> None:
        index = y * width + x
        if background[index] or not background_like(pixels[x, y][:3]):
            return
        background[index] = 1
        queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)
    # Balloon ropes, the passenger and the basket form closed shapes.  The
    # paper field inside those shapes cannot be reached from the crop edge, so
    # explicitly flood known paper pixels on both sides of each passenger.
    for x, y in internal_seeds:
        enqueue(x, y)

    while queue:
        x, y = queue.popleft()
        if x:
            enqueue(x - 1, y)
        if x + 1 < width:
            enqueue(x + 1, y)
        if y:
            enqueue(x, y - 1)
        if y + 1 < height:
            enqueue(x, y + 1)

    missed_seeds = [
        (x, y) for x, y in internal_seeds if not background[y * width + x]
    ]
    if missed_seeds:
        raise RuntimeError(
            f"Internal transparency seeds no longer match the paper field: {missed_seeds}"
        )

    for y in range(height):
        for x in range(width):
            if background[y * width + x]:
                pixels[x, y] = (0, 0, 0, 0)
            else:
                r, g, b, _ = pixels[x, y]
                pixels[x, y] = (r, g, b, 255)

    alpha_box = crop.getchannel("A").getbbox()
    if alpha_box is None:
        raise RuntimeError(f"No foreground detected in crop {box}")
    subject = crop.crop(alpha_box)
    padded = Image.new("RGBA", (subject.width + 4, subject.height + 4), (0, 0, 0, 0))
    padded.alpha_composite(subject, (2, 2))
    return padded


def save_subject(
    atlas: Image.Image,
    box: tuple[int, int, int, int],
    path: Path,
    internal_seeds: tuple[tuple[int, int], ...] = (),
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    transparent_subject(atlas, box, internal_seeds).save(path, optimize=True)


def main() -> None:
    citizen_atlas_path = atlas_named("시민")
    balloon_atlas_path = atlas_named("열기구")
    citizen_atlas = Image.open(citizen_atlas_path).convert("RGB")
    balloon_atlas = Image.open(balloon_atlas_path).convert("RGB")

    citizen_root = ASSET_ROOT / "civilians"
    balloon_root = ASSET_ROOT / "balloons"
    citizen_root.mkdir(parents=True, exist_ok=True)
    balloon_root.mkdir(parents=True, exist_ok=True)
    copy2(citizen_atlas_path, citizen_root / "source-atlas.png")
    copy2(balloon_atlas_path, balloon_root / "source-atlas.png")

    citizen_crops = {
        "male-a": {
            "body": (188, 122, 420, 357),
            "left-foot": (228, 354, 302, 408),
            "right-foot": (304, 354, 382, 408),
        },
        "male-b": {
            "body": (566, 124, 856, 358),
            "left-foot": (630, 354, 706, 410),
            "right-foot": (708, 354, 790, 410),
        },
        "female-a": {
            "body": (180, 532, 466, 758),
            "left-foot": (224, 754, 302, 812),
            "right-foot": (304, 754, 382, 812),
        },
        "female-b": {
            "body": (570, 530, 860, 760),
            "left-foot": (626, 754, 704, 814),
            "right-foot": (706, 754, 788, 814),
        },
    }
    for variant, parts in citizen_crops.items():
        for part, box in parts.items():
            save_subject(citizen_atlas, box, citizen_root / variant / f"{part}.png")

    balloon_crops = {
        # Seed coordinates are local to each crop.  Multiple heights make the
        # alpha cleanup robust even where the head or basket divides a gap.
        "male-a": ((145, 126, 520, 804), ((80, 434), (100, 394), (310, 394), (310, 434))),
        "female-a": ((570, 126, 962, 804), ((70, 394), (70, 414), (196, 385), (340, 394), (340, 414))),
        "male-b": ((1004, 126, 1388, 804), ((66, 394), (66, 414), (192, 385), (326, 394), (326, 414))),
    }
    for variant, (box, internal_seeds) in balloon_crops.items():
        save_subject(
            balloon_atlas,
            box,
            balloon_root / f"{variant}.png",
            internal_seeds,
        )

    for path in sorted([*citizen_root.glob("*/*.png"), *balloon_root.glob("*.png")]):
        image = Image.open(path).convert("RGBA")
        alpha = image.getchannel("A")
        print(
            f"{path.relative_to(PROJECT_ROOT)} "
            f"size={image.width}x{image.height} "
            f"alpha={alpha.getextrema()} opaque={alpha.histogram()[255]}"
        )


if __name__ == "__main__":
    main()
