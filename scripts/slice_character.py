import os
import cv2
import numpy as np
from PIL import Image

def remove_white_bg(img_rgba, threshold=244, ramp=12):
    rgb = img_rgba[:, :, :3].astype(np.float32)
    min_c = np.min(rgb, axis=2)
    max_c = np.max(rgb, axis=2)
    sat = max_c - min_c
    
    alpha = np.ones(min_c.shape, dtype=np.float32) * 255.0
    
    is_white = (min_c >= threshold) & (sat < 16)
    diff = 255.0 - min_c
    
    ramp_alpha = (diff / float(ramp)) * 255.0
    ramp_alpha = np.clip(ramp_alpha, 0.0, 255.0)
    
    alpha[is_white] = ramp_alpha[is_white]
    alpha[min_c >= 253] = 0.0
    
    res = img_rgba.copy()
    res[:, :, 3] = alpha.astype(np.uint8)
    return res

def main():
    sheet_src = "D:/game/public/assets/Code_Generated_Image (1).jpg"
    idle_src = "D:/game/public/assets/Code_Generated_Image.jpg"
    out_dir = "D:/game/public/assets/character/"
    os.makedirs(out_dir, exist_ok=True)
    
    img_bgr = cv2.imread(sheet_src)
    img_rgba = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGBA)
    h_img, w_img, _ = img_rgba.shape
    
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 245, 255, cv2.THRESH_BINARY_INV)
    thresh_no_shadow = thresh.copy()
    thresh_no_shadow[665:, :] = 0
    
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    cleaned = cv2.morphologyEx(thresh_no_shadow, cv2.MORPH_OPEN, kernel)
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(cleaned)
    
    # Target uniform frame dimensions (matching Legacy-Fantasy standard)
    target_w = 260
    target_h = 660
    baseline_y = 695
    
    frames = []
    
    # 1. PRISTINE STANDALONE IDLE from Code_Generated_Image.jpg
    print("1/6: Extracting clean IDLE from Code_Generated_Image.jpg...")
    idle_raw = Image.open(idle_src).convert("RGBA")
    idle_np = np.array(idle_raw)
    idle_crop = idle_np[50:1160, 280:660, :]
    idle_trans = remove_white_bg(idle_crop)
    idle_pil = Image.fromarray(idle_trans)
    
    scale = 620.0 / idle_pil.height
    w_sc = int(idle_pil.width * scale)
    h_sc = 620
    idle_scaled = idle_pil.resize((w_sc, h_sc), Image.Resampling.LANCZOS)
    
    c_idle = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    c_idle.paste(idle_scaled, ((target_w - w_sc)//2, target_h - 10 - h_sc), idle_scaled)
    c_idle.save(os.path.join(out_dir, "ph_idle.png"), "PNG")
    c_idle.resize((target_w//2, target_h//2), Image.Resampling.LANCZOS).save(os.path.join(out_dir, "ph_idle_sm.png"), "PNG")
    frames.append(c_idle)
    print("  -> Saved ph_idle.png")
    
    # 2. Extract Walk 1, 2, 3, 4 and Crouch using connected components
    walk_info = [
        ("walk_1", 3),
        ("walk_2", 8),
        ("walk_3", 5),
        ("walk_4", 16),
        ("crouch", 18)
    ]
    
    for idx, (name, c_id) in enumerate(walk_info, start=2):
        print(f"{idx}/6: Extracting isolated pose '{name}' (component {c_id})...")
        comp_mask = (labels == c_id)
        ys, xs = np.where(comp_mask)
        x_min = max(0, xs.min() - 4)
        x_max = min(w_img, xs.max() + 4)
        y_min = max(0, ys.min() - 4)
        
        # Build exact mask for this component
        mask_255 = comp_mask.astype(np.uint8) * 255
        mask_dil = cv2.dilate(mask_255, kernel, iterations=1)
        
        # Add feet down to baseline_y
        feet_mask = (thresh[665:baseline_y, x_min+6:x_max-6] > 0).astype(np.uint8) * 255
        mask_dil[665:baseline_y, x_min+6:x_max-6] = feet_mask
        
        # Crop patch
        res = img_rgba[:baseline_y, x_min:x_max].copy()
        sub_mask = mask_dil[:baseline_y, x_min:x_max]
        
        # Whiteness check
        min_c = np.min(res[:, :, :3], axis=2)
        is_white = min_c > 248
        
        alpha = np.where(sub_mask > 0, 255, 0).astype(np.uint8)
        alpha[is_white] = 0
        res[:, :, 3] = alpha
        
        pil_frame = Image.fromarray(res)
        bbox = pil_frame.getbbox()
        if bbox:
            trimmed = pil_frame.crop(bbox)
        else:
            trimmed = pil_frame
            
        canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
        paste_x = (target_w - trimmed.width) // 2
        paste_y = target_h - 10 - trimmed.height
        canvas.paste(trimmed, (paste_x, paste_y), trimmed)
        
        canvas.save(os.path.join(out_dir, f"ph_{name}.png"), "PNG")
        canvas.resize((target_w//2, target_h//2), Image.Resampling.LANCZOS).save(os.path.join(out_dir, f"ph_{name}_sm.png"), "PNG")
        frames.append(canvas)
        print(f"  -> Saved ph_{name}.png")
        
    # Build complete Legacy-Fantasy style unified horizontal sprite sheet
    sheet_w = target_w * len(frames)
    sheet_h = target_h
    sheet = Image.new("RGBA", (sheet_w, sheet_h), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        sheet.paste(frame, (i * target_w, 0), frame)
        
    sheet.save(os.path.join(out_dir, "ph_spritesheet.png"), "PNG")
    sheet_sm = sheet.resize((sheet_w // 2, sheet_h // 2), Image.Resampling.LANCZOS)
    sheet_sm.save(os.path.join(out_dir, "ph_spritesheet_sm.png"), "PNG")
    print(f"Saved complete 6-frame spritesheet: {sheet_w}x{sheet_h} -> ph_spritesheet.png")
    
    # High-res dialogue portrait
    p_crop = idle_np[50:480, 320:680, :]
    p_trans = remove_white_bg(p_crop)
    Image.fromarray(p_trans).save(os.path.join(out_dir, "ph_portrait.png"), "PNG")
    print("Saved dialogue portrait: ph_portrait.png")

if __name__ == "__main__":
    main()
