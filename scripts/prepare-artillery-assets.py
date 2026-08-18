from __future__ import annotations

import json
import shutil
from collections import deque
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
GENERATED = Path(r"C:\Users\ydhfx\.codex\generated_images\01a00a4e-fddf-79e3-9575-61411078b464")
SOURCE = Path(r"C:\Users\ydhfx\OneDrive\Desktop\새 폴더\포병")
OUTPUT = ROOT / "public" / "game-assets" / "artillery"
RIG_OUTPUT = ROOT / "public" / "game-assets" / "characters-v2" / "artillery"


def transparent_cutout(source: Path, destination: Path) -> dict[str, int]:
    image = Image.open(source).convert("RGB")
    width, height = image.size
    pixels = image.load()
    candidate = bytearray(width * height)
    exterior = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    for y in range(height):
        for x in range(width):
            red, green, blue = pixels[x, y]
            high = max(red, green, blue)
            low = min(red, green, blue)
            if high >= 222 and high - low <= 20:
                candidate[y * width + x] = 1

    def seed(x: int, y: int) -> None:
        index = y * width + x
        if candidate[index] and not exterior[index]:
            exterior[index] = 1
            queue.append((x, y))

    for x in range(width):
        seed(x, 0)
        seed(x, height - 1)
    for y in range(height):
        seed(0, y)
        seed(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if nx < 0 or nx >= width or ny < 0 or ny >= height:
                continue
            index = ny * width + nx
            if candidate[index] and not exterior[index]:
                exterior[index] = 1
                queue.append((nx, ny))

    rgba = Image.new("RGBA", image.size)
    out = rgba.load()
    for y in range(height):
        for x in range(width):
            out[x, y] = (*pixels[x, y], 0 if exterior[y * width + x] else 255)

    alpha = rgba.getchannel("A")
    box = alpha.getbbox()
    if box is None:
        raise RuntimeError(f"No foreground found in {source}")
    margin = 4
    left = max(0, box[0] - margin)
    top = max(0, box[1] - margin)
    right = min(width, box[2] + margin)
    bottom = min(height, box[3] + margin)
    rgba = rgba.crop((left, top, right, bottom))
    destination.parent.mkdir(parents=True, exist_ok=True)
    rgba.save(destination, optimize=True)
    border_alpha = list(rgba.getchannel("A").crop((0, 0, rgba.width, 1)).getdata())
    border_alpha += list(rgba.getchannel("A").crop((0, rgba.height - 1, rgba.width, rgba.height)).getdata())
    border_alpha += list(rgba.getchannel("A").crop((0, 0, 1, rgba.height)).getdata())
    border_alpha += list(rgba.getchannel("A").crop((rgba.width - 1, 0, rgba.width, rgba.height)).getdata())
    return {
        "width": rgba.width,
        "height": rgba.height,
        "opaque": sum(1 for value in rgba.getchannel("A").getdata() if value == 255),
        "transparent": sum(1 for value in rgba.getchannel("A").getdata() if value == 0),
        "borderAlpha": max(border_alpha, default=0),
    }


def alpha_audit(path: Path) -> dict[str, int]:
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    values = list(alpha.getdata())
    border = list(alpha.crop((0, 0, image.width, 1)).getdata())
    border += list(alpha.crop((0, image.height - 1, image.width, image.height)).getdata())
    border += list(alpha.crop((0, 0, 1, image.height)).getdata())
    border += list(alpha.crop((image.width - 1, 0, image.width, image.height)).getdata())
    return {
        "width": image.width,
        "height": image.height,
        "transparent": sum(1 for value in values if value == 0),
        "partial": sum(1 for value in values if 0 < value < 255),
        "opaque": sum(1 for value in values if value == 255),
        "borderAlpha": max(border, default=0),
    }


def transparent_dark_background(source: Path, destination: Path) -> None:
    image = Image.open(source).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    candidate = bytearray(width * height)
    exterior = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()
    for y in range(height):
        for x in range(width):
            red, green, blue, _ = pixels[x, y]
            if max(red, green, blue) <= 42:
                candidate[y * width + x] = 1
    def seed(x: int, y: int) -> None:
        index = y * width + x
        if candidate[index] and not exterior[index]:
            exterior[index] = 1
            queue.append((x, y))
    for x in range(width):
        seed(x, 0)
        seed(x, height - 1)
    for y in range(height):
        seed(0, y)
        seed(width - 1, y)
    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                index = ny * width + nx
                if candidate[index] and not exterior[index]:
                    exterior[index] = 1
                    queue.append((nx, ny))
    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            pixels[x, y] = (red, green, blue, 0 if exterior[y * width + x] else alpha)
    image = ImageOps.expand(image, border=2, fill=(0, 0, 0, 0))
    image.save(destination, optimize=True)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    RIG_OUTPUT.mkdir(parents=True, exist_ok=True)
    idle_source = GENERATED / "exec-cac83f82-7588-40b0-ac93-4e2b4dc3ac22.png"
    fire_source = GENERATED / "exec-b65a7bf0-1e0b-4c8d-ac3d-c21e3df73a8c.png"
    idle_path = OUTPUT / "idle.png"
    fire_path = OUTPUT / "fire.png"
    audit = {
        "idle": transparent_cutout(idle_source, idle_path),
        "fire": transparent_cutout(fire_source, fire_path),
    }

    shutil.copy2(idle_path, RIG_OUTPUT / "body.png")
    soldier = ROOT / "public" / "game-assets" / "characters-v2" / "soldier"
    shutil.copy2(soldier / "left-foot.png", RIG_OUTPUT / "left-foot.png")
    shutil.copy2(soldier / "right-foot.png", RIG_OUTPUT / "right-foot.png")
    shutil.copy2(SOURCE / "포병 사운드.mp3", OUTPUT / "cannon.mp3")

    explosion_output = OUTPUT / "explosion"
    explosion_output.mkdir(parents=True, exist_ok=True)
    for index, source in enumerate(sorted((SOURCE / "폭발이펙트").glob("*.png")), start=1):
        destination = explosion_output / f"{index}.png"
        transparent_dark_background(source, destination)
        audit[f"explosion-{index}"] = alpha_audit(destination)

    audit["body"] = alpha_audit(RIG_OUTPUT / "body.png")
    audit["leftFoot"] = alpha_audit(RIG_OUTPUT / "left-foot.png")
    audit["rightFoot"] = alpha_audit(RIG_OUTPUT / "right-foot.png")
    (OUTPUT / "alpha-audit.json").write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")

    manifest_path = ROOT / "public" / "game-assets" / "characters-v2" / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["ARTILLERY"] = {
        "body": "/game-assets/characters-v2/artillery/body.png",
        "leftFoot": "/game-assets/characters-v2/artillery/left-foot.png",
        "rightFoot": "/game-assets/characters-v2/artillery/right-foot.png",
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    rig_audit_path = ROOT / "public" / "game-assets" / "characters-v2" / "alpha-audit.json"
    rig_audit = json.loads(rig_audit_path.read_text(encoding="utf-8"))
    artillery_entry = {
        "jobId": "ARTILLERY",
        "components": 1,
        "body": audit["body"],
        "leftFoot": audit["leftFoot"],
        "rightFoot": audit["rightFoot"],
    }
    rig_audit["assets"] = [item for item in rig_audit["assets"] if item.get("jobId") != "ARTILLERY"] + [artillery_entry]
    rig_audit["jobs"] = len(rig_audit["assets"])
    rig_audit["passed"] = all(
        part["borderAlpha"] == 0 and part["transparent"] > 0
        for item in rig_audit["assets"]
        for part in (item["body"], item["leftFoot"], item["rightFoot"])
    )
    rig_audit_path.write_text(json.dumps(rig_audit, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(audit, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
