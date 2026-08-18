from __future__ import annotations

import json
import shutil
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\ydhfx\OneDrive\Desktop\새 폴더 (2)")
OUTPUT = ROOT / "public" / "game-assets" / "cavalry"
RIG_ROOT = ROOT / "public" / "game-assets" / "characters-v2"


FRAME_CROPS = {
    "normal-run-1.png": (SOURCE / "기마병 모션1.png", (110, 105, 735, 755)),
    "armored-run-1.png": (SOURCE / "기마병 모션1.png", (785, 105, 1415, 755)),
    "normal-run-2.png": (SOURCE / "기마병 모션2.png", (110, 105, 735, 735)),
    "armored-run-2.png": (SOURCE / "기마병 모션2.png", (785, 105, 1415, 735)),
    "lance.png": (SOURCE / "기마병 무기.png", (135, 395, 1415, 590)),
}


def flood_card_background(image: Image.Image) -> Image.Image:
    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()
    background = bytearray(width * height)
    queued = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def seed(x: int, y: int) -> None:
        index = y * width + x
        if not queued[index]:
            queued[index] = 1
            queue.append((x, y))

    for x in range(width):
        seed(x, 0)
        seed(x, height - 1)
    for y in range(height):
        seed(0, y)
        seed(width - 1, y)

    while queue:
        x, y = queue.popleft()
        background[y * width + x] = 1
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if nx < 0 or ny < 0 or nx >= width or ny >= height:
                continue
            index = ny * width + nx
            if queued[index]:
                continue
            current = pixels[x, y]
            neighbor = pixels[nx, ny]
            delta = max(abs(current[channel] - neighbor[channel]) for channel in range(3))
            # The supplied card background changes gradually. The dark, continuous
            # pixel outline is the hard boundary that keeps the original subject intact.
            if delta > 18 or sum(neighbor) / 3 < 88:
                continue
            queued[index] = 1
            queue.append((nx, ny))

    rgba = rgb.convert("RGBA")
    alpha = Image.new("L", rgb.size, 255)
    alpha_pixels = alpha.load()
    for y in range(height):
        for x in range(width):
            if background[y * width + x]:
                alpha_pixels[x, y] = 0

    # Remove the warm anti-aliased fringe without touching enclosed horse/rider colors.
    expanded = alpha.filter(ImageFilter.MinFilter(3))
    rgba.putalpha(expanded)
    return rgba


def largest_component_only(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    width, height = rgba.size
    opaque = bytearray(1 if value else 0 for value in alpha.getdata())
    visited = bytearray(width * height)
    components: list[list[int]] = []
    for index, value in enumerate(opaque):
        if not value or visited[index]:
            continue
        visited[index] = 1
        queue = deque([index])
        component: list[int] = []
        while queue:
            current = queue.popleft()
            component.append(current)
            x, y = current % width, current // width
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if nx < 0 or ny < 0 or nx >= width or ny >= height:
                    continue
                neighbor = ny * width + nx
                if opaque[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)
        components.append(component)
    if not components:
        raise RuntimeError("No cavalry foreground component found")
    keep = set(max(components, key=len))
    alpha_data = bytearray(alpha.tobytes())
    for index in range(width * height):
        if index not in keep:
            alpha_data[index] = 0
        else:
            alpha_data[index] = 255
    rgba.putalpha(Image.frombytes("L", (width, height), bytes(alpha_data)))
    return rgba


def crop_to_alpha(image: Image.Image, margin: int = 5) -> Image.Image:
    box = image.getchannel("A").getbbox()
    if box is None:
        raise RuntimeError("Transparent extraction produced an empty image")
    left = max(0, box[0] - margin)
    top = max(0, box[1] - margin)
    right = min(image.width, box[2] + margin)
    bottom = min(image.height, box[3] + margin)
    return ImageOps.expand(image.crop((left, top, right, bottom)), border=2, fill=(0, 0, 0, 0))


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


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    audit: dict[str, dict[str, int]] = {}
    for name, (source, box) in FRAME_CROPS.items():
        card = Image.open(source).convert("RGB").crop(box)
        cutout = crop_to_alpha(largest_component_only(flood_card_background(card)))
        destination = OUTPUT / name
        cutout.save(destination, optimize=True)
        audit[name] = alpha_audit(destination)

    soldier = RIG_ROOT / "soldier"
    for job_id, body_name in (("cavalry", "normal-run-2.png"), ("armored-cavalry", "armored-run-2.png")):
        rig = RIG_ROOT / job_id
        rig.mkdir(parents=True, exist_ok=True)
        shutil.copy2(OUTPUT / body_name, rig / "body.png")
        # Runtime uses the horse legs contained in the exact source image. These satisfy
        # the shared loader contract but are intentionally not rendered for mounted units.
        shutil.copy2(soldier / "left-foot.png", rig / "left-foot.png")
        shutil.copy2(soldier / "right-foot.png", rig / "right-foot.png")

    audit["cavalry-body.png"] = alpha_audit(RIG_ROOT / "cavalry" / "body.png")
    audit["armored-cavalry-body.png"] = alpha_audit(RIG_ROOT / "armored-cavalry" / "body.png")
    (OUTPUT / "alpha-audit.json").write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")

    manifest_path = RIG_ROOT / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for job_id, folder in (("CAVALRY", "cavalry"), ("ARMORED_CAVALRY", "armored-cavalry")):
        manifest[job_id] = {
            "body": f"/game-assets/characters-v2/{folder}/body.png",
            "leftFoot": f"/game-assets/characters-v2/{folder}/left-foot.png",
            "rightFoot": f"/game-assets/characters-v2/{folder}/right-foot.png",
        }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    rig_audit_path = RIG_ROOT / "alpha-audit.json"
    rig_audit = json.loads(rig_audit_path.read_text(encoding="utf-8"))
    existing = {entry["jobId"]: entry for entry in rig_audit["assets"]}
    for job_id, folder in (("CAVALRY", "cavalry"), ("ARMORED_CAVALRY", "armored-cavalry")):
        existing[job_id] = {
            "jobId": job_id,
            "components": 1,
            "body": alpha_audit(RIG_ROOT / folder / "body.png"),
            "leftFoot": alpha_audit(RIG_ROOT / folder / "left-foot.png"),
            "rightFoot": alpha_audit(RIG_ROOT / folder / "right-foot.png"),
        }
    rig_audit["assets"] = list(existing.values())
    rig_audit["jobs"] = len(rig_audit["assets"])
    rig_audit["passed"] = all(
        part["partial"] == 0 and part["borderAlpha"] == 0 and part["transparent"] > 0
        for entry in rig_audit["assets"]
        for part in (entry["body"], entry["leftFoot"], entry["rightFoot"])
    )
    rig_audit_path.write_text(json.dumps(rig_audit, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(audit, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
