from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "ui-icons"
OUT.mkdir(parents=True, exist_ok=True)

INK = "#171927"
CREAM = "#fff0c4"
GOLD = "#e7aa45"
ORANGE = "#cf6b3c"
OLIVE = "#8da35b"
GREEN = "#6f8f54"
RED = "#b64f46"
BLUE = "#6f91aa"
CYAN = "#88c7c2"
BROWN = "#8a5939"
WOOD = "#ad7746"
STONE = "#87909a"
WHITE = "#fff8dc"


def icon(name, painter):
    image = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    painter(draw)
    image.save(OUT / f"{name}.png", optimize=True)


def rect(d, box, fill, outline=INK):
    d.rectangle(box, fill=fill, outline=outline)


def line(d, points, fill=CREAM, width=1):
    d.line(points, fill=fill, width=width)


def hammer(d):
    rect(d, (2, 2, 9, 5), STONE)
    rect(d, (7, 5, 9, 13), WOOD)
    rect(d, (10, 9, 14, 13), ORANGE)
    line(d, [(10, 11), (14, 11)], CREAM)


def person(d, x, color):
    rect(d, (x + 1, 3, x + 4, 6), CREAM)
    rect(d, (x, 7, x + 5, 12), color)
    d.point((x + 2, 4), fill=INK)


def shield(d, color=BLUE):
    d.polygon([(3, 2), (12, 2), (13, 8), (8, 14), (2, 8)], fill=INK)
    d.polygon([(4, 3), (11, 3), (11, 8), (8, 12), (4, 8)], fill=color)
    line(d, [(8, 3), (8, 11)], CREAM)


def coin(d):
    rect(d, (3, 3, 12, 12), GOLD)
    rect(d, (5, 5, 10, 10), ORANGE, GOLD)
    line(d, [(6, 7), (9, 7), (9, 9), (6, 9)], CREAM)


def house(d):
    d.polygon([(1, 7), (8, 1), (14, 7)], fill=INK)
    d.polygon([(3, 7), (8, 3), (12, 7)], fill=ORANGE)
    rect(d, (3, 7, 12, 14), CREAM)
    rect(d, (7, 9, 9, 14), BROWN)


def pickaxe(d):
    line(d, [(4, 3), (12, 6)], STONE, 2)
    line(d, [(8, 5), (4, 14)], WOOD, 2)
    d.point((3, 3), fill=CREAM)
    d.point((13, 6), fill=CREAM)


def sword(d):
    line(d, [(3, 13), (12, 2)], CREAM, 2)
    line(d, [(4, 10), (8, 13)], GOLD, 2)
    d.point((2, 14), fill=BROWN)


def bow(d):
    line(d, [(4, 2), (2, 6), (2, 10), (4, 14)], WOOD, 2)
    line(d, [(4, 2), (8, 8), (4, 14)], CREAM)
    line(d, [(7, 8), (14, 8)], GOLD)
    d.polygon([(14, 8), (11, 6), (11, 10)], fill=GOLD)


icon("town", lambda d: (house(d), rect(d, (11, 4, 14, 14), BLUE)))
icon("event", lambda d: (rect(d, (3, 2, 12, 13), CREAM), line(d, [(5, 5), (10, 5)], ORANGE), line(d, [(5, 8), (10, 8)], BROWN), line(d, [(5, 11), (8, 11)], BROWN)))
icon("weather-sun", lambda d: (rect(d, (5, 5, 10, 10), GOLD), [d.point(p, fill=CREAM) for p in [(7, 1), (7, 14), (1, 7), (14, 7), (3, 3), (12, 3), (3, 12), (12, 12)]]))
icon("weather-rain", lambda d: (rect(d, (3, 4, 12, 9), BLUE), rect(d, (5, 2, 9, 7), STONE), [line(d, [(x, 11), (x - 1, 14)], CYAN) for x in (4, 8, 12)]))
icon("coin", coin)
icon("wood", lambda d: (rect(d, (2, 4, 13, 7), WOOD), rect(d, (4, 8, 14, 11), BROWN), d.ellipse((10, 5, 12, 6), fill=CREAM)))
icon("food", lambda d: (line(d, [(8, 2), (8, 14)], OLIVE), [line(d, [(8, y), (4, y - 2)], GOLD, 2) for y in (6, 10, 14)], [line(d, [(8, y), (12, y - 2)], GOLD, 2) for y in (8, 12)]))
icon("stone", lambda d: (d.polygon([(2, 11), (4, 5), (8, 3), (13, 7), (14, 12), (4, 14)], fill=INK), d.polygon([(4, 11), (5, 6), (8, 5), (12, 8), (12, 11)], fill=STONE), line(d, [(6, 7), (10, 9)], CREAM)))
icon("metal", lambda d: (rect(d, (2, 5, 13, 12), STONE), rect(d, (4, 3, 11, 6), CREAM), line(d, [(4, 9), (11, 9)], BLUE)))
icon("crystal", lambda d: (d.polygon([(8, 1), (13, 6), (10, 14), (5, 14), (2, 7)], fill=INK), d.polygon([(8, 3), (11, 7), (9, 12), (6, 12), (4, 7)], fill=CYAN), line(d, [(8, 3), (7, 12)], WHITE)))
icon("shield", shield)
icon("build", hammer)
icon("residents", lambda d: (person(d, 2, OLIVE), person(d, 9, ORANGE)))
icon("skills", lambda d: (rect(d, (2, 6, 5, 9), GOLD), rect(d, (11, 2, 14, 5), CYAN), rect(d, (11, 11, 14, 14), ORANGE), line(d, [(5, 7), (11, 4)], CREAM), line(d, [(5, 8), (11, 12)], CREAM)))
icon("defense", shield)
icon("resources", lambda d: (rect(d, (2, 8, 13, 14), BROWN), rect(d, (3, 5, 12, 9), WOOD), line(d, [(7, 5), (7, 14)], CREAM)))
icon("records", lambda d: (rect(d, (3, 2, 12, 14), CREAM), rect(d, (3, 2, 5, 14), ORANGE), line(d, [(7, 5), (10, 5)], BROWN), line(d, [(7, 8), (10, 8)], BROWN), line(d, [(7, 11), (10, 11)], BROWN)))
icon("settings", lambda d: (d.rectangle((5, 1, 10, 14), fill=STONE), d.rectangle((1, 5, 14, 10), fill=STONE), d.rectangle((3, 3, 12, 12), fill=STONE), d.rectangle((6, 6, 9, 9), fill=INK)))
icon("category-recommended", lambda d: (d.polygon([(8, 1), (10, 6), (15, 7), (11, 10), (12, 15), (8, 12), (4, 15), (5, 10), (1, 7), (6, 6)], fill=GOLD), d.point((8, 5), fill=CREAM)))
icon("category-housing", house)
icon("category-production", hammer)
icon("category-life", lambda d: (rect(d, (3, 6, 12, 12), BROWN), rect(d, (5, 3, 10, 7), CREAM), line(d, [(5, 9), (10, 9)], GOLD)))
icon("category-defense", shield)
icon("check", lambda d: line(d, [(2, 8), (6, 12), (14, 3)], GREEN, 3))
icon("cancel-x", lambda d: (line(d, [(3, 3), (13, 13)], RED, 3), line(d, [(13, 3), (3, 13)], RED, 3)))
icon("arrow-up", lambda d: (d.polygon([(8, 2), (14, 8), (10, 8), (10, 14), (6, 14), (6, 8), (2, 8)], fill=OLIVE), line(d, [(8, 4), (8, 12)], CREAM)))
icon("warning", lambda d: (d.polygon([(8, 1), (15, 14), (1, 14)], fill=GOLD), rect(d, (7, 5, 8, 10), INK, INK), d.point((8, 12), fill=INK)))
icon("close", lambda d: (rect(d, (2, 2, 13, 13), RED), line(d, [(5, 5), (10, 10)], CREAM, 2), line(d, [(10, 5), (5, 10)], CREAM, 2)))
icon("pause", lambda d: (rect(d, (4, 3, 6, 12), CREAM), rect(d, (9, 3, 11, 12), CREAM)))
icon("rally", lambda d: (rect(d, (3, 2, 5, 14), WOOD), d.polygon([(5, 3), (13, 5), (5, 9)], fill=ORANGE)))
icon("retreat", lambda d: (d.polygon([(2, 8), (8, 2), (8, 6), (14, 6), (14, 10), (8, 10), (8, 14)], fill=BLUE),))
icon("focus", lambda d: (rect(d, (2, 2, 4, 5), RED), rect(d, (11, 2, 13, 5), RED), rect(d, (2, 10, 4, 13), RED), rect(d, (11, 10, 13, 13), RED), rect(d, (7, 7, 8, 8), CREAM)))
icon("sound", lambda d: (d.polygon([(2, 6), (5, 6), (9, 2), (9, 14), (5, 10), (2, 10)], fill=GOLD), line(d, [(11, 5), (13, 8), (11, 11)], CREAM)))
icon("vibration", lambda d: (rect(d, (5, 3, 10, 13), BLUE), line(d, [(3, 5), (2, 8), (3, 11)], CREAM), line(d, [(12, 5), (14, 8), (12, 11)], CREAM)))
icon("shake", lambda d: (rect(d, (5, 5, 10, 11), STONE), line(d, [(2, 4), (4, 2)], ORANGE), line(d, [(12, 2), (14, 4)], ORANGE), line(d, [(2, 12), (4, 14)], ORANGE), line(d, [(12, 14), (14, 12)], ORANGE)))
icon("weather", lambda d: (rect(d, (3, 5, 12, 10), BLUE), rect(d, (5, 3, 9, 8), STONE), d.point((12, 3), fill=GOLD)))
icon("bell", lambda d: (d.polygon([(3, 11), (5, 9), (5, 5), (8, 2), (11, 5), (11, 9), (13, 11)], fill=GOLD), rect(d, (3, 11, 13, 12), ORANGE), d.point((8, 14), fill=CREAM)))
icon("language", lambda d: (rect(d, (2, 3, 13, 12), BLUE), line(d, [(4, 6), (11, 6)], CREAM), line(d, [(4, 9), (9, 9)], CREAM)))
icon("save", lambda d: (rect(d, (2, 2, 13, 13), BLUE), rect(d, (5, 3, 10, 6), CREAM), rect(d, (5, 9, 10, 13), STONE)))
icon("pickaxe", pickaxe)
icon("rare-ore", lambda d: (pickaxe(d), d.polygon([(11, 9), (14, 11), (12, 14), (9, 12)], fill=CYAN)))
icon("wheat", lambda d: (line(d, [(8, 2), (8, 14)], OLIVE), [d.point((x, y), fill=GOLD) for x, y in [(6, 4), (10, 5), (6, 7), (10, 8), (6, 10), (10, 11)]]))
icon("carry", lambda d: (rect(d, (3, 7, 12, 13), BROWN), d.polygon([(5, 7), (7, 3), (9, 3), (11, 7)], fill=GOLD)))
icon("hammer", hammer)
icon("house", house)
icon("storage", lambda d: (rect(d, (2, 3, 13, 8), WOOD), rect(d, (2, 9, 13, 14), BROWN), line(d, [(7, 3), (7, 14)], CREAM)))
icon("sword", sword)
icon("bow", bow)
icon("heal", lambda d: (rect(d, (6, 2, 9, 13), CREAM), rect(d, (2, 6, 13, 9), CREAM), rect(d, (7, 4, 8, 11), RED), rect(d, (4, 7, 11, 8), RED)))

print(f"generated {len(list(OUT.glob('*.png')))} UI icons in {OUT}")
