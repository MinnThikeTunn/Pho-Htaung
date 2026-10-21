import os
import cv2
import numpy as np
from PIL import Image

def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)

def apply_paper_texture(rgb, paper_rgb, strength=0.20):
    factor = 1.0 - strength * (1.0 - (paper_rgb / 255.0))
    return np.clip(rgb.astype(float) * factor, 0, 255).astype(np.uint8)

def defringe_white(rgb, alpha_norm):
    res = rgb.copy().astype(float)
    a = alpha_norm[:, :, np.newaxis]
    res = np.clip((res - (1.0 - a) * 255.0) / np.maximum(a, 0.05), 0, 255)
    return res.astype(np.uint8)

def process_single_item(item_crop, paper_crop, target_size=(96, 96)):
    # Find background mask: pure white or near white
    min_c = item_crop.min(axis=2)
    # Outside candidate mask
    white_mask = (min_c >= 235).astype(bool)
    
    # Distance transforms for sub-pixel anti-aliasing
    dist_from_white = cv2.distanceTransform((~white_mask).astype(np.uint8), cv2.DIST_L2, 5)
    dist_inside_white = cv2.distanceTransform(white_mask.astype(np.uint8), cv2.DIST_L2, 5)
    signed_dist = dist_from_white - dist_inside_white
    
    alpha = smoothstep(-1.5, 1.5, signed_dist)
    
    # Defringe against white
    item_defringed = defringe_white(item_crop, alpha)
    
    # Apply paper texture
    item_textured = apply_paper_texture(item_defringed, paper_crop, strength=0.20)
    
    # Crop tightly to non-transparent pixels
    vis_y, vis_x = np.where(alpha > 0.05)
    if len(vis_y) == 0:
        return Image.new('RGBA', target_size, (0, 0, 0, 0))
    
    y0, y1 = vis_y.min(), vis_y.max() + 1
    x0, x1 = vis_x.min(), vis_x.max() + 1
    
    tight_rgb = item_textured[y0:y1, x0:x1]
    tight_alpha = (alpha[y0:y1, x0:x1] * 255).astype(np.uint8)
    tight_rgba = np.dstack([tight_rgb, tight_alpha])
    
    tight_img = Image.fromarray(tight_rgba)
    
    # Fit into target_size with aspect ratio preserved and 8px padding
    pad = 8
    max_w = target_size[0] - pad * 2
    max_h = target_size[1] - pad * 2
    scale = min(max_w / tight_img.width, max_h / tight_img.height)
    new_w = max(1, int(tight_img.width * scale))
    new_h = max(1, int(tight_img.height * scale))
    
    resized = tight_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    final_canvas = Image.new('RGBA', target_size, (0, 0, 0, 0))
    offset_x = (target_size[0] - new_w) // 2
    offset_y = (target_size[1] - new_h) // 2
    final_canvas.paste(resized, (offset_x, offset_y), resized)
    
    return final_canvas

def slice_all():
    sheet_path = r'C:\Users\USER\.gemini\antigravity-cli\brain\6a9d050a-6287-44b3-aae7-68b05673612c\items_adolf_lachman_sheet_1792577010293.jpg'
    out_dir = 'public/assets/items'
    os.makedirs(out_dir, exist_ok=True)
    
    sheet = np.array(Image.open(sheet_path))
    paper = np.array(Image.open('public/assets/textures/parchment_paper.png').convert('RGB').resize((1200, 896)))
    
    min_c = sheet.min(axis=2)
    is_item = (min_c < 220).astype(np.uint8)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
    closed = cv2.morphologyEx(is_item, cv2.MORPH_CLOSE, kernel)
    
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(closed, connectivity=8)
    valid_items = []
    for i in range(1, num_labels):
        x, y, w, h, area = stats[i]
        if area > 800 and w < 600 and h < 500:
            valid_items.append((x, y, w, h, area))
            
    valid_items.sort(key=lambda item: (item[1] // 250, item[0]))
    print(f'Found {len(valid_items)} items on sheet.')
    
    item_keys = [
        'item_betel_cutter',
        'item_torn_bottle',
        'item_rusty_spike',
        'item_cog',
        'item_bamboo_pole',
        'item_chili',
        'item_twigs',
        'item_stone_3',
        'item_gold_7',
        'item_red_gem',
        'item_chalk',
        'item_engineer_note'
    ]
    
    H, W, _ = sheet.shape
    pad = 16
    for idx, (x, y, w, h, area) in enumerate(valid_items):
        if idx >= len(item_keys):
            break
        k = item_keys[idx]
        x0 = max(0, x - pad)
        y0 = max(0, y - pad)
        x1 = min(W, x + w + pad)
        y1 = min(H, y + h + pad)
        
        crop = sheet[y0:y1, x0:x1]
        paper_crop = paper[y0:y1, x0:x1]
        
        img = process_single_item(crop, paper_crop, (96, 96))
        save_path = os.path.join(out_dir, f'{k}.png')
        img.save(save_path)
        print(f'Saved {save_path}')
        
        # Also create half_bottle from item_torn_bottle
        if k == 'item_torn_bottle':
            # Cut top half or bottom half with jagged edge
            half_crop = crop.copy()
            mid_y = half_crop.shape[0] // 2
            # Clear top half to pure white
            half_crop[:mid_y, :] = 255
            # Make jagged cutline
            for col in range(half_crop.shape[1]):
                jag = int(np.sin(col * 0.4) * 4 + np.random.uniform(-2, 2))
                half_crop[:mid_y + jag, col] = 255
            half_img = process_single_item(half_crop, paper_crop, (96, 96))
            half_path = os.path.join(out_dir, 'item_half_bottle.png')
            half_img.save(half_path)
            print(f'Saved {half_path}')

if __name__ == '__main__':
    slice_all()
