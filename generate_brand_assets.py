import os
import math
from PIL import Image, ImageDraw, ImageFont

def render_skipit_mark(size=512, bg_color=None, fg_color="#FFFFFF", corner_radius=None):
    # Scale factor
    scale = size / 200.0
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if bg_color:
        radius = int(corner_radius * size) if corner_radius else int(0.24 * size)
        # Draw rounded rectangle background
        draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=radius, fill=bg_color)

    # In our 200x200 normalized coordinate space:
    # Quadrant:
    # Right edge at x = 115, Top edge at y = 35
    # Radius R = 72
    # Dot radius r = 18 (diameter 36)
    # Dot 1 center at (115 - 18, 35 + 72 + 20 + 18) = (97, 145) -> right edge is at 115
    # Dot 2 center at (115 + 16 + 18, 145) = (149, 145) -> right edge is at 167

    # Center the entire mark within 200x200:
    # Total width of mark = from (115 - 72) = 43 to 167 = 124 px wide.
    # Total height of mark = from 35 to (145 + 18) = 163 = 128 px tall.
    # Offset to center:
    offset_x = (200 - 124) / 2 - 43 # = 38 - 43 = -5 => shifts x so it's centered
    offset_y = (200 - 128) / 2 - 35 # = 36 - 35 = +1

    # Apply offset
    ox = offset_x
    oy = offset_y

    # Quadrant at (115 + ox, 35 + oy):
    qx1 = (115 + ox) * scale
    qy0 = (35 + oy) * scale
    R = 72 * scale

    # Pie/Sector: center is at (qx1, qy0). Arc goes from 90 to 180 degrees
    # Bounding box of full circle: [(qx1 - R, qy0 - R), (qx1 + R, qy0 + R)]
    draw.pieslice([(qx1 - R, qy0 - R), (qx1 + R, qy0 + R)], start=90, end=180, fill=fg_color)

    # Dot 1:
    d1_cx = (97 + ox) * scale
    d1_cy = (145 + oy) * scale
    r = 18 * scale
    draw.ellipse([(d1_cx - r, d1_cy - r), (d1_cx + r, d1_cy + r)], fill=fg_color)

    # Dot 2:
    d2_cx = (149 + ox) * scale
    d2_cy = (145 + oy) * scale
    draw.ellipse([(d2_cx - r, d2_cy - r), (d2_cx + r, d2_cy + r)], fill=fg_color)

    return img

def main():
    os.makedirs('assets/images', exist_ok=True)
    
    # 1. High-Res App Icon (1024x1024)
    icon_1024 = render_skipit_mark(size=1024, bg_color="#0044FF", fg_color="#FFFFFF", corner_radius=0.22)
    icon_1024.save('assets/images/skipit_app_icon_1024.png', 'PNG')

    # 2. Transparent Mark (512x512)
    mark_white = render_skipit_mark(size=512, bg_color=None, fg_color="#FFFFFF")
    mark_white.save('assets/images/skipit_mark_white.png', 'PNG')
    
    mark_blue = render_skipit_mark(size=512, bg_color=None, fg_color="#0044FF")
    mark_blue.save('assets/images/skipit_mark_blue.png', 'PNG')

    # 3. Android Mipmap launcher icons
    android_res_base = 'apps/mobile/android/app/src/main/res'
    mipmap_sizes = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192,
    }

    for folder, px in mipmap_sizes.items():
        folder_path = os.path.join(android_res_base, folder)
        os.makedirs(folder_path, exist_ok=True)
        # Android launcher icon (rounded square with #0044FF background)
        launcher_img = render_skipit_mark(size=px, bg_color="#0044FF", fg_color="#FFFFFF", corner_radius=0.22)
        out_path = os.path.join(folder_path, 'ic_launcher.png')
        launcher_img.save(out_path, 'PNG')
        print(f"Generated {out_path} ({px}x{px})")

    print("Brand assets generated successfully!")

if __name__ == '__main__':
    main()
