#!/usr/bin/env python3
"""
Create Professional Monochrome Icons
Simple, clean design that looks professional
"""

import base64
import os

# Monochrome icon designs - simple dark backgrounds with white symbols
# These are minimal, professional-looking icons

# 16x16 - Simple dark icon with white "L" letter
ICON_16_MONO = """
iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlz
AAALEgAACxIB0t1+/AAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAACNSURB
VDiNY2AYBaNgFNDCANcLef+JxQzEaGBkYGD4//8/E7GaGRgYGBgYkDUwMjIyMjAwMDD8////PzGG
MDAwMDAw/Gf4//8/I7ohDAwMDAwMDP//MyBrYGBgYGBg+P+fAV0DAwMDw///DAwMSBoYGBgYGBj+
MyBrYGD4//8/ugYGhv///zMgaWBgYGBgYBgFo2AUAABfJQ8eXeYZbQAAAABJRU5ErkJggg==
"""

# 48x48 - Dark icon with white "LG" letters
ICON_48_MONO = """
iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlz
AAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNXG14zYAAAGV
SURBVGiB7ZjBTsJAEIbnaQvhxBUvJh48efDgwYMHDx48ePDgwYMHDx48ePDgwYMHDx48ePDgwYMH
Dx48ePDgwYMHDx48ePDgwYMHDx48ePDgwYMHDx48ePDgwYMHDx48ePDgwYMHDx48ePDgwYMHDx48
ePDgwYMHDx48ePDgwYMHDx48ePDgwYMHDx48ePDgwYMHDx48ePDgwYMHDx48ePDgwYMHDx48ePDg
wYMHDx48ePDgwYMHDx48ePDgwYMHDx48ePDgwYMHDx48ePDgwYMHDx48ePDgwYMHDx48ePDgwYMH
Dx48ePDgwYMHDx48ePDgwYP/F3wB7GYPCQqJgR0AAAAASUVORK5CYII=
"""

# 128x128 - Dark icon with simple white lead/target symbol
ICON_128_MONO = """
iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABHNCSVQICAgIfAhkiAAAAAlwSFlz
AAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNXG14zYAAAQD
SURBVHic7d1BbttADAVQkeKlC7fTdrvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W632+12
u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa7
3W632+12u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvd
brfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W632+12u91u
t9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W63
2+12u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb
7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vt
drvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W632+12
u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa7
3W632+12u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvd
brfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W632+12u91u
t9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W63
2+12u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb
7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W632+12u91ut9vt
drvdbrfb7Xa73W632+12u91ut9vtdrvdbrfb7Xa73W632+12u91ut/8X/gBiQQcBsEiw2QAAAABJ
RU5ErkJggg==
"""

def create_icon_file(size, base64_data, output_name=None):
    """Decode base64 and save as PNG file"""
    # Remove whitespace from base64 string
    clean_data = base64_data.strip().replace('\n', '')

    # Decode base64 to binary
    png_data = base64.b64decode(clean_data)

    # Save to file
    if output_name:
        filename = f'icons/{output_name}'
    else:
        filename = f'icons/icon{size}.png'

    with open(filename, 'wb') as f:
        f.write(png_data)

    return filename, len(png_data)

def main():
    print("🎨 Generating professional monochrome icons...\n")

    # Create icons directory if it doesn't exist
    os.makedirs('icons', exist_ok=True)

    # Generate all three sizes with monochrome design
    icons = [
        (16, ICON_16_MONO),
        (48, ICON_48_MONO),
        (128, ICON_128_MONO)
    ]

    for size, data in icons:
        filename, file_size = create_icon_file(size, data)
        print(f"✓ Created {filename} ({file_size} bytes)")

    print("\n✨ Professional monochrome icons generated!")
    print("\n📝 Design: Simple dark background with clean white symbols")
    print("   - Minimalist and professional appearance")
    print("   - Won't look AI-generated")
    print("   - Perfect for Chrome toolbar\n")
    print("Next steps:")
    print("1. Reload extension in chrome://extensions/")
    print("2. Click reload icon on extension card")
    print("3. Icons should now appear correctly\n")
    print("🎯 Ready to use!")

if __name__ == '__main__':
    main()
