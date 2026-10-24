import os
import cv2
import numpy as np
from PIL import Image

def remove_background(img_rgba, thresh_val=242, ramp=14):
    """Cleanly converts white/light background into smooth alpha transparency."""
    rgb = img_rgba[:, :, :3].astype(np.float32)
    min_c = np.min(rgb, axis=2)
    max_c = np.max(rgb, axis=2)
    sat = max_c - min_c
    
    is_bg = (min_c >= thresh_val) & (sat < 20)
    
    alpha = np.ones(min_c.shape, dtype=np.float32) * 255.0
    diff = 255.0 - min_c
    ramp_alpha = np.clip((diff / float(ramp)) * 255.0, 0.0, 255.0)
    
    alpha[is_bg] = ramp_alpha[is_bg]
    alpha[min_c >= 252] = 0.0
    
    res = img_rgba.copy()
    res[:, :, 3] = alpha.astype(np.uint8)
    return res

def process_actions_sheet(src_path, out_dir):
    if not os.path.exists(src_path):
        print(f"Error: {src_path} does not exist.")
        return False
        
    os.makedirs(out_dir, exist_ok=True)
    img_bgr = cv2.imread(src_path)
    if img_bgr is None:
        print(f"Failed to read image at {src_path}")
        return False
        
    img_rgba = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGBA)
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
    
    kernel = np.ones((3, 3), np.uint8)
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(cleaned)
    
    comp_list = []
    for i in range(1, num_labels):
        area = stats[i, cv2.CC_STAT_AREA]
        if area > 8000:
            comp_list.append((stats[i, cv2.CC_STAT_LEFT], i))
            
    comp_list.sort(key=lambda item: item[0])
    print(f"Detected {len(comp_list)} sequential action poses.")
    
    pose_names = ["idle_inhale", "idle_exhale", "crouch", "bag_rummage", "hold"]
    
    canvas_w = 380
    canvas_h = 850
    target_height = 800
    
    sliced_frames = []
    for idx, (x_left, comp_id) in enumerate(comp_list):
        name = pose_names[idx] if idx < len(pose_names) else f"action_{idx+1}"
        comp_mask = (labels == comp_id)
        mask_dil = cv2.dilate(comp_mask.astype(np.uint8) * 255, kernel, iterations=1)
        
        x = stats[comp_id, cv2.CC_STAT_LEFT]
        y = stats[comp_id, cv2.CC_STAT_TOP]
        w = stats[comp_id, cv2.CC_STAT_WIDTH]
        h = stats[comp_id, cv2.CC_STAT_HEIGHT]
        
        x1 = max(0, x - 4)
        y1 = max(0, y - 4)
        x2 = min(img_rgba.shape[1], x + w + 4)
        y2 = min(img_rgba.shape[0], y + h + 4)
        
        sub_rgba = img_rgba[y1:y2, x1:x2].copy()
        sub_mask = mask_dil[y1:y2, x1:x2]
        
        sub_cleaned = remove_background(sub_rgba)
        sub_cleaned[:, :, 3] = np.where(sub_mask > 0, sub_cleaned[:, :, 3], 0)
        
        pil_frame = Image.fromarray(sub_cleaned)
        bbox = pil_frame.getbbox()
        if bbox:
            cropped = pil_frame.crop(bbox)
        else:
            cropped = pil_frame
            
        # For crouch, preserve natural lower height rather than stretching to 800px
        is_crouch = ("crouch" in name)
        if is_crouch:
            scale = (target_height * 0.72) / float(cropped.height)
        else:
            scale = target_height / float(cropped.height)
            
        new_w = max(1, int(cropped.width * scale))
        new_h = int(cropped.height * scale)
        resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        frame_canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
        paste_x = (canvas_w - new_w) // 2
        paste_y = canvas_h - 15 - new_h
        frame_canvas.paste(resized, (paste_x, paste_y), resized)
        
        frame_path = os.path.join(out_dir, f"phoe_{name}.png")
        frame_canvas.save(frame_path, "PNG")
        print(f"  -> Saved action frame '{name}': {frame_path} ({canvas_w}x{canvas_h})")
        sliced_frames.append(frame_canvas)
        
    sheet_w = canvas_w * len(sliced_frames)
    sheet_h = canvas_h
    full_sheet = Image.new("RGBA", (sheet_w, sheet_h), (0, 0, 0, 0))
    for i, frame in enumerate(sliced_frames):
        full_sheet.paste(frame, (i * canvas_w, 0), frame)
        
    spritesheet_path = os.path.join(out_dir, "phoe_actions_spritesheet.png")
    full_sheet.save(spritesheet_path, "PNG")
    print(f"Successfully generated {len(sliced_frames)}-frame actions spritesheet at: {spritesheet_path} ({sheet_w}x{sheet_h})")
    return True

if __name__ == "__main__":
    src = "art/source/characters/phoe_htaung_actions_sheet_v1.png"
    out = "public/assets/character"
    process_actions_sheet(src, out)
