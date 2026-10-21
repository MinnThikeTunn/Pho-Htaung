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

def process_component(img_rgba, labels, c_id, thresh, baseline_y, kernel):
    comp_mask = (labels == c_id)
    ys, xs = np.where(comp_mask)
    if len(xs) == 0:
        return None
    x_min = max(0, xs.min() - 4)
    x_max = min(img_rgba.shape[1], xs.max() + 4)
    
    mask_255 = comp_mask.astype(np.uint8) * 255
    mask_dil = cv2.dilate(mask_255, kernel, iterations=1)
    
    # Include feet down to baseline_y inside column span
    feet_mask = (thresh[665:baseline_y, x_min+6:x_max-6] > 0).astype(np.uint8) * 255
    mask_dil[665:baseline_y, x_min+6:x_max-6] = np.maximum(
        mask_dil[665:baseline_y, x_min+6:x_max-6],
        feet_mask
    )
    
    res = img_rgba[:baseline_y, x_min:x_max].copy()
    sub_mask = mask_dil[:baseline_y, x_min:x_max]
    
    min_c = np.min(res[:, :, :3], axis=2)
    is_white = min_c > 248
    
    alpha = np.where(sub_mask > 0, 255, 0).astype(np.uint8)
    alpha[is_white] = 0
    res[:, :, 3] = alpha
    
    pil_frame = Image.fromarray(res)
    bbox = pil_frame.getbbox()
    return pil_frame.crop(bbox) if bbox else pil_frame

def fit_to_canvas(trimmed_img, canvas_w=60, canvas_h=84, bottom_pad=4):
    scale_w = (canvas_w - 6) / float(trimmed_img.width)
    scale_h = (canvas_h - bottom_pad - 4) / float(trimmed_img.height)
    scale = min(scale_w, scale_h)
    
    new_w = max(1, int(trimmed_img.width * scale))
    new_h = max(1, int(trimmed_img.height * scale))
    scaled = trimmed_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    paste_x = (canvas_w - new_w) // 2
    paste_y = canvas_h - bottom_pad - new_h
    canvas.paste(scaled, (paste_x, paste_y), scaled)
    return canvas

def main():
    assets_dir = "D:/game/public/assets/"
    char_dir = "D:/game/public/assets/character/"
    os.makedirs(char_dir, exist_ok=True)
    
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    
    # =========================================================================
    # 1. STANDALONE IDLE from Code_Generated_Image.jpg
    # =========================================================================
    print("Processing IDLE...")
    idle_raw = Image.open(os.path.join(assets_dir, "Code_Generated_Image.jpg")).convert("RGBA")
    idle_np = np.array(idle_raw)
    idle_crop = idle_np[50:1160, 280:660, :]
    idle_trans = remove_white_bg(idle_crop)
    idle_trimmed = Image.fromarray(idle_trans)
    bbox = idle_trimmed.getbbox()
    if bbox:
        idle_trimmed = idle_trimmed.crop(bbox)
        
    # Standard size (60x84, fits platform)
    idle_game = fit_to_canvas(idle_trimmed, 60, 84, bottom_pad=4)
    idle_game.save(os.path.join(char_dir, "ph_idle.png"), "PNG")
    # 2x High-DPI size (120x168)
    fit_to_canvas(idle_trimmed, 120, 168, bottom_pad=8).save(os.path.join(char_dir, "ph_idle_2x.png"), "PNG")
    print("  -> Saved ph_idle.png (60x84) and ph_idle_2x.png")

    # =========================================================================
    # 2. WALK FRAMES & CROUCH from Code_Generated_Image (1).jpg
    # =========================================================================
    print("Processing WALK & CROUCH...")
    walk_bgr = cv2.imread(os.path.join(assets_dir, "Code_Generated_Image (1).jpg"))
    walk_rgba = cv2.cvtColor(walk_bgr, cv2.COLOR_BGR2RGBA)
    walk_gray = cv2.cvtColor(walk_bgr, cv2.COLOR_BGR2GRAY)
    _, walk_thresh = cv2.threshold(walk_gray, 245, 255, cv2.THRESH_BINARY_INV)
    walk_thresh_ns = walk_thresh.copy()
    walk_thresh_ns[665:, :] = 0
    walk_cleaned = cv2.morphologyEx(walk_thresh_ns, cv2.MORPH_OPEN, kernel)
    _, walk_labels, walk_stats, _ = cv2.connectedComponentsWithStats(walk_cleaned)
    
    walk_map = {
        "ph_walk_1": 3,
        "ph_walk_2": 8,
        "ph_walk_3": 5,
        "ph_walk_4": 16,
        "ph_crouch": 18
    }
    
    for name, c_id in walk_map.items():
        trimmed = process_component(walk_rgba, walk_labels, c_id, walk_thresh, 695, kernel)
        if trimmed:
            game_img = fit_to_canvas(trimmed, 60, 84, bottom_pad=4)
            game_img.save(os.path.join(char_dir, f"{name}.png"), "PNG")
            fit_to_canvas(trimmed, 120, 168, bottom_pad=8).save(os.path.join(char_dir, f"{name}_2x.png"), "PNG")
            print(f"  -> Saved {name}.png (60x84)")

    # =========================================================================
    # 3. JUMP CYCLE from Phoe_Htaung_Jump_Sprite_Sheet_V2.jpg
    # =========================================================================
    print("Processing JUMP CYCLE...")
    jump_bgr = cv2.imread(os.path.join(assets_dir, "Phoe_Htaung_Jump_Sprite_Sheet_V2.jpg"))
    jump_rgba = cv2.cvtColor(jump_bgr, cv2.COLOR_BGR2RGBA)
    jump_gray = cv2.cvtColor(jump_bgr, cv2.COLOR_BGR2GRAY)
    _, jump_thresh = cv2.threshold(jump_gray, 245, 255, cv2.THRESH_BINARY_INV)
    jump_thresh_ns = jump_thresh.copy()
    jump_thresh_ns[700:, :] = 0
    jump_cleaned = cv2.morphologyEx(jump_thresh_ns, cv2.MORPH_OPEN, kernel)
    _, jump_labels, jump_stats, _ = cv2.connectedComponentsWithStats(jump_cleaned)
    
    # 5 Jump poses sorted left to right
    # Comp 15 = prep, Comp 1 = up, Comp 2 = apex, Comp 3 = fall, Comp 17 = land
    jump_map = {
        "ph_jump_prep": 15,
        "ph_jump_up": 1,
        "ph_jump_apex": 2,
        "ph_jump_fall": 3,
        "ph_jump_land": 17
    }
    
    for name, c_id in jump_map.items():
        trimmed = process_component(jump_rgba, jump_labels, c_id, jump_thresh, 720, kernel)
        if trimmed:
            game_img = fit_to_canvas(trimmed, 60, 84, bottom_pad=4)
            game_img.save(os.path.join(char_dir, f"{name}.png"), "PNG")
            fit_to_canvas(trimmed, 120, 168, bottom_pad=8).save(os.path.join(char_dir, f"{name}_2x.png"), "PNG")
            print(f"  -> Saved {name}.png (60x84)")

    # =========================================================================
    # 4. SLAPSTICK REACTIONS & DEATHS from Phoe_Htaung_Slapstick_Sprite_Sheet_V1.jpg
    # =========================================================================
    print("Processing SLAPSTICK & DEATHS...")
    slap_bgr = cv2.imread(os.path.join(assets_dir, "Phoe_Htaung_Slapstick_Sprite_Sheet_V1.jpg"))
    slap_rgba = cv2.cvtColor(slap_bgr, cv2.COLOR_BGR2RGBA)
    slap_gray = cv2.cvtColor(slap_bgr, cv2.COLOR_BGR2GRAY)
    _, slap_thresh = cv2.threshold(slap_gray, 245, 255, cv2.THRESH_BINARY_INV)
    slap_thresh_ns = slap_thresh.copy()
    slap_thresh_ns[700:, :] = 0
    slap_cleaned = cv2.morphologyEx(slap_thresh_ns, cv2.MORPH_OPEN, kernel)
    _, slap_labels, slap_stats, _ = cv2.connectedComponentsWithStats(slap_cleaned)
    
    # Slapstick map:
    # Comp 3 = Laugh / Shock / Chuckle (60x84 & 60x90)
    # Comp 68 = Pancake / Flat (90x32)
    # Comp 6 = Boiled / Steamed Red / Being Mad (60x84)
    # Comp 1 = Skeleton / Electro (60x84)
    # Comp 8 = Thinking / Bag Rummage (60x84)
    
    # 4a. Shock & Laugh (Comp 3)
    shock_trim = process_component(slap_rgba, slap_labels, 3, slap_thresh, 720, kernel)
    if shock_trim:
        fit_to_canvas(shock_trim, 60, 90, bottom_pad=4).save(os.path.join(char_dir, "ph_shock.png"), "PNG")
        fit_to_canvas(shock_trim, 60, 90, bottom_pad=4).save(os.path.join(char_dir, "ph_denial.png"), "PNG")
        fit_to_canvas(shock_trim, 60, 84, bottom_pad=4).save(os.path.join(char_dir, "ph_laugh.png"), "PNG")
        fit_to_canvas(shock_trim, 120, 168, bottom_pad=8).save(os.path.join(char_dir, "ph_laugh_2x.png"), "PNG")
        print("  -> Saved ph_shock.png, ph_denial.png, and ph_laugh.png")
        
    # 4b. Pancake / Smashed Flat (90x32)
    pancake_trim = process_component(slap_rgba, slap_labels, 68, slap_thresh, 720, kernel)
    if pancake_trim:
        fit_to_canvas(pancake_trim, 90, 32, bottom_pad=2).save(os.path.join(char_dir, "ph_flat.png"), "PNG")
        print("  -> Saved ph_flat.png (90x32)")
        
    # 4c. Boiled / Steamed Red / Being Mad (Comp 6)
    boiled_trim = process_component(slap_rgba, slap_labels, 6, slap_thresh, 720, kernel)
    if boiled_trim:
        fit_to_canvas(boiled_trim, 60, 84, bottom_pad=4).save(os.path.join(char_dir, "ph_boiled.png"), "PNG")
        fit_to_canvas(boiled_trim, 60, 84, bottom_pad=4).save(os.path.join(char_dir, "ph_mad.png"), "PNG")
        fit_to_canvas(boiled_trim, 120, 168, bottom_pad=8).save(os.path.join(char_dir, "ph_mad_2x.png"), "PNG")
        print("  -> Saved ph_boiled.png and ph_mad.png (60x84)")
        
    # 4d. Skeleton / Electrocuted / Ash (60x84)
    skel_trim = process_component(slap_rgba, slap_labels, 1, slap_thresh, 720, kernel)
    if skel_trim:
        fit_to_canvas(skel_trim, 60, 84, bottom_pad=4).save(os.path.join(char_dir, "ph_skeleton.png"), "PNG")
        fit_to_canvas(skel_trim, 60, 84, bottom_pad=4).save(os.path.join(char_dir, "ph_ash.png"), "PNG")
        print("  -> Saved ph_skeleton.png & ph_ash.png (60x84)")
        
    # 4e. Thinking & Bag Rummage (Comp 8)
    bag_trim = process_component(slap_rgba, slap_labels, 8, slap_thresh, 720, kernel)
    if bag_trim:
        fit_to_canvas(bag_trim, 60, 84, bottom_pad=4).save(os.path.join(char_dir, "ph_bag_rummage.png"), "PNG")
        fit_to_canvas(bag_trim, 60, 84, bottom_pad=4).save(os.path.join(char_dir, "ph_think.png"), "PNG")
        fit_to_canvas(bag_trim, 120, 168, bottom_pad=8).save(os.path.join(char_dir, "ph_think_2x.png"), "PNG")
        print("  -> Saved ph_bag_rummage.png and ph_think.png (60x84)")

    # =========================================================================
    # 5. HIGH-RES DIALOGUE PORTRAIT
    # =========================================================================
    p_crop = idle_np[50:480, 320:680, :]
    p_trans = remove_white_bg(p_crop)
    Image.fromarray(p_trans).save(os.path.join(char_dir, "ph_portrait.png"), "PNG")
    print("  -> Saved ph_portrait.png")

    print("\nSUCCESS: All character poses sliced to exact 60x84 platform-friendly dimensions!")

if __name__ == "__main__":
    main()
