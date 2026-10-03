"""Animate the supplied ASCII portrait without approximating its glyphs.

The source already contains ASCII art. Recover its glyph tiles from pixels,
then reveal them in reading order. Keeping the original raster tiles preserves
the exact symbols, font, spacing and portrait instead of converting it again.
Usage: python tools/generate-ascii-portrait.py [path/to/reference.png]
Requires Pillow. No network, JavaScript or runtime service is needed.
"""
from pathlib import Path
import sys

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/ascii-portrait-source.png"
if len(sys.argv) > 1:
    supplied = Path(sys.argv[1]).resolve()
    if supplied != SOURCE.resolve():
        with Image.open(supplied) as reference:
            reference.convert("RGB").save(SOURCE)

original = Image.open(SOURCE).convert("RGB")
if original.height != 543 or original.width not in (745, 1024):
    raise ValueError("Expected the supplied 745 × 543 portrait or its 1024 × 543 screenshot.")

# The portrait spans 23 monospaced rows. Include punctuation above/below
# the main glyph bodies; do not OCR or substitute ambiguous characters.
pixels = original.load()
left, right = original.width // 2 - 200, original.width // 2 + 200
paper_x = left - 25
tiles = []
background = original.copy()
for y in range(7, original.height):
    for x in range(left, right):
        background.putpixel((x, y), pixels[paper_x, y])
for row in range(23):
    top = round(7 + row * 23.4)
    bottom = min(original.height, round(7 + (row + 1) * 23.4))
    active = [x for x in range(left, right)
              if any(min(pixels[x, y]) > 30 for y in range(top, bottom))]
    runs = []
    for x in active:
        if not runs or x > runs[-1][-1] + 1:
            runs.append([x])
        else:
            runs[-1].append(x)
    for run in runs:
        box = (run[0], top, run[-1] + 1, bottom)
        tiles.append(box)
        # Use the unoccupied margin at the same scanline as the paper color.
        # Restoring each tile recovers every source pixel in its bounding box.
        for y in range(top, bottom):
            for x in run:
                background.putpixel((x, y), pixels[paper_x, y])

# One shared palette avoids palette shimmer between successive frames.
palette = original.quantize(colors=128, method=Image.Quantize.MEDIANCUT)
canvas = background.copy()
frames = [canvas.quantize(palette=palette, dither=Image.Dither.NONE)]
durations = [400]
for index, box in enumerate(tiles):
    canvas.paste(original.crop(box), box[:2])
    if index == len(tiles) - 1:
        # Restore the exact original background and all antialiasing at rest.
        canvas = original.copy()
    # Two newly drawn glyph segments per frame keep the asset compact while
    # preserving a clearly visible terminal-style typing cadence.
    if index % 2 == 1 or index == len(tiles) - 1:
        frames.append(canvas.quantize(palette=palette, dither=Image.Dither.NONE))
        durations.append(40)

durations[-1] = 4000
output = ROOT / "assets/ascii-portrait.gif"
frames[0].save(output, save_all=True, append_images=frames[1:],
               duration=durations, loop=0, disposal=1, optimize=True)

# Validate the encoded result, not just the frame construction.
assert ImageChops.difference(canvas, original).getbbox() is None
with Image.open(output) as animation:
    count = animation.n_frames
    animation.seek(count - 1)
    decoded = animation.convert("RGB")
    expected = original.quantize(palette=palette, dither=Image.Dither.NONE).convert("RGB")
    assert ImageChops.difference(decoded, expected).getbbox() is None
    assert animation.info.get("loop") == 0

print(f"{len(tiles)} glyph segments; {count} frames; "
      f"{sum(durations)/1000:.2f}s loop; {output.stat().st_size/1024:.1f} KiB")
print("Verified: final frame matches the palette-encoded reference exactly.")
