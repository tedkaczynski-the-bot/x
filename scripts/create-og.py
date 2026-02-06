#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

# Create the OG image
width, height = 1200, 630
bg_color = (10, 10, 10)  # #0a0a0a

# Create base image
img = Image.new('RGB', (width, height), bg_color)
draw = ImageDraw.Draw(img)

# Load logo
script_dir = os.path.dirname(os.path.abspath(__file__))
public_dir = os.path.join(os.path.dirname(script_dir), 'public')
logo_path = os.path.join(public_dir, 'logo.png')

logo = Image.open(logo_path)
logo = logo.convert('RGBA')

# Resize logo to fit nicely (80px height)
logo_height = 100
logo_ratio = logo.width / logo.height
logo_width = int(logo_height * logo_ratio)
logo = logo.resize((logo_width, logo_height), Image.Resampling.LANCZOS)

# Try to load a bold font, fall back to default
try:
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 72)
except:
    try:
        font = ImageFont.truetype("/System/Library/Fonts/SFNSDisplay.ttf", 72)
    except:
        font = ImageFont.load_default()

# Calculate positions
text_x = "X"
text_lobster = "LOBSTER"

# Get text sizes
bbox_x = draw.textbbox((0, 0), text_x, font=font)
bbox_lobster = draw.textbbox((0, 0), text_lobster, font=font)
text_width = (bbox_x[2] - bbox_x[0]) + (bbox_lobster[2] - bbox_lobster[0])
text_height = max(bbox_x[3] - bbox_x[1], bbox_lobster[3] - bbox_lobster[1])

# Total width of logo + gap + text
gap = 20
total_width = logo_width + gap + text_width

# Center everything
start_x = (width - total_width) // 2
center_y = height // 2

# Paste logo
logo_y = center_y - logo_height // 2
img.paste(logo, (start_x, logo_y), logo)

# Draw text
text_start_x = start_x + logo_width + gap
text_y = center_y - text_height // 2 - 10  # Slight adjustment for visual centering

# Draw X in red
draw.text((text_start_x, text_y), text_x, fill=(239, 68, 68), font=font)  # #ef4444

# Draw LOBSTER in white
x_width = bbox_x[2] - bbox_x[0]
draw.text((text_start_x + x_width, text_y), text_lobster, fill=(255, 255, 255), font=font)

# Save
output_path = os.path.join(public_dir, 'og-image.png')
img.save(output_path, 'PNG')
print(f"Saved to {output_path}")
