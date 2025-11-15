#!/usr/bin/env python3
"""
Generate Extension Icons
Creates 16x16, 48x48, and 128x128 PNG icons with a target design
"""

import os
from PIL import Image, ImageDraw

def create_target_icon(size):
    """Create a target/crosshair icon"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Calculate dimensions
    center = size / 2

    # Create gradient background circle
    # Draw filled circle with purple gradient
    for r in range(int(size * 0.47), 0, -1):
        # Calculate color based on radius (gradient effect)
        ratio = r / (size * 0.47)
        red = int(102 + (1 - ratio) * (118 - 102))
        green = int(126 + (1 - ratio) * (75 - 126))
        blue = int(234 + (1 - ratio) * (162 - 234))

        draw.ellipse(
            [center - r, center - r, center + r, center + r],
            fill=(red, green, blue, 255)
        )

    # Draw target circles (white)
    line_width = max(1, int(size * 0.023))

    # Outer circle
    r1 = size * 0.35
    draw.ellipse(
        [center - r1, center - r1, center + r1, center + r1],
        outline=(255, 255, 255, 255),
        width=line_width
    )

    # Middle circle
    r2 = size * 0.23
    draw.ellipse(
        [center - r2, center - r2, center + r2, center + r2],
        outline=(255, 255, 255, 255),
        width=line_width
    )

    # Inner circle
    r3 = size * 0.12
    draw.ellipse(
        [center - r3, center - r3, center + r3, center + r3],
        outline=(255, 255, 255, 255),
        width=line_width
    )

    # Center dot
    r4 = size * 0.047
    draw.ellipse(
        [center - r4, center - r4, center + r4, center + r4],
        fill=(255, 255, 255, 255)
    )

    # Draw crosshair lines
    # Vertical top
    draw.line(
        [(center, size * 0.03), (center, size * 0.22)],
        fill=(255, 255, 255, 255),
        width=line_width
    )

    # Vertical bottom
    draw.line(
        [(center, size * 0.78), (center, size * 0.97)],
        fill=(255, 255, 255, 255),
        width=line_width
    )

    # Horizontal left
    draw.line(
        [(size * 0.03, center), (size * 0.22, center)],
        fill=(255, 255, 255, 255),
        width=line_width
    )

    # Horizontal right
    draw.line(
        [(size * 0.78, center), (size * 0.97, center)],
        fill=(255, 255, 255, 255),
        width=line_width
    )

    return img

def main():
    print("🎨 Generating extension icons...\n")

    # Create icons directory if it doesn't exist
    icons_dir = os.path.join(os.path.dirname(__file__), 'icons')
    os.makedirs(icons_dir, exist_ok=True)

    # Generate icons in different sizes
    sizes = [16, 48, 128]

    for size in sizes:
        filename = f'icon{size}.png'
        filepath = os.path.join(icons_dir, filename)

        print(f"Creating {filename}...")
        icon = create_target_icon(size)
        icon.save(filepath, 'PNG')

        file_size = os.path.getsize(filepath)
        print(f"✓ Created {filename} ({file_size} bytes)")

    print("\n✨ All icons generated successfully!")
    print("\nNext steps:")
    print("1. Go to chrome://extensions/")
    print("2. Enable 'Developer mode'")
    print("3. Click 'Load unpacked'")
    print("4. Select the Lead-Generation- directory")
    print("\nEnjoy your Lead Generator Pro extension! 🎯")

if __name__ == '__main__':
    try:
        main()
    except ImportError:
        print("❌ Error: PIL (Pillow) not found")
        print("\nPlease install Pillow:")
        print("  pip install Pillow")
        print("\nOr use the HTML generator method instead:")
        print("  Open icons/generate-icons.html in your browser")
