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

def process_prop(crop, paper_crop, is_door=False):
    min_c = crop.min(axis=2)
    white_mask = (min_c >= 235).astype(np.uint8)
    
    # If it's the door, we only mask out border-connected white to keep the inner torchlight void intact
    if is_door:
        _, labels, stats, _ = cv2.connectedComponentsWithStats(white_mask, connectivity=8)
        border_labels = set(np.concatenate([labels[0, :], labels[-1, :], labels[:, 0], labels[:, -1]]))
        border_labels = [l for l in border_labels if l != 0]
        bg_bool = np.isin(labels, border_labels)
    else:
        bg_bool = white_mask.astype(bool)
        
    dist_from_white = cv2.distanceTransform((~bg_bool).astype(np.uint8), cv2.DIST_L2, 5)
    dist_inside_white = cv2.distanceTransform(bg_bool.astype(np.uint8), cv2.DIST_L2, 5)
    signed_dist = dist_from_white - dist_inside_white
    
    alpha = smoothstep(-1.8, 1.8, signed_dist)
    defringed = defringe_white(crop, alpha)
    textured = apply_paper_texture(defringed, paper_crop, strength=0.20)
    
    # Crop tightly to alpha > 0.05
    vis_y, vis_x = np.where(alpha > 0.05)
    y0, y1 = vis_y.min(), vis_y.max() + 1
    x0, x1 = vis_x.min(), vis_x.max() + 1
    
    tight_rgb = textured[y0:y1, x0:x1]
    tight_alpha = (alpha[y0:y1, x0:x1] * 255).astype(np.uint8)
    
    rgba = np.dstack([tight_rgb, tight_alpha])
    return Image.fromarray(rgba)

def slice_props():
    sheet_path = r'C:\Users\USER\.gemini\antigravity-cli\brain\6a9d050a-6287-44b3-aae7-68b05673612c\props_adolf_lachman_sheet_1792577546243.jpg'
    out_dir = 'public/assets/props'
    os.makedirs(out_dir, exist_ok=True)
    
    sheet = np.array(Image.open(sheet_path))
    paper = np.array(Image.open('public/assets/textures/parchment_paper.png').convert('RGB').resize((1376, 768)))
    
    # 1. Door: x in 20..510, y in 20..680
    door_crop = sheet[20:680, 20:510]
    paper_door = paper[20:680, 20:510]
    door_img = process_prop(door_crop, paper_door, is_door=True)
    door_path = os.path.join(out_dir, 'prop_cave_door.png')
    door_img.save(door_path)
    print(f'Saved {door_path} (size={door_img.size})')
    
    # 2. Bridge: x in 510..900, y in 80..680
    bridge_crop = sheet[80:680, 510:900]
    paper_bridge = paper[80:680, 510:900]
    bridge_img = process_prop(bridge_crop, paper_bridge, is_door=False)
    bridge_path = os.path.join(out_dir, 'prop_drawbridge.png')
    bridge_img.save(bridge_path)
    print(f'Saved {bridge_path} (size={bridge_img.size})')
    
    # 3. Winch: x in 880..1360, y in 120..680
    winch_crop = sheet[120:680, 880:1360]
    paper_winch = paper[120:680, 880:1360]
    winch_img = process_prop(winch_crop, paper_winch, is_door=False)
    winch_path = os.path.join(out_dir, 'prop_winch_machine.png')
    winch_img.save(winch_path)
    print(f'Saved {winch_path} (size={winch_img.size})')

if __name__ == '__main__':
    slice_props()
