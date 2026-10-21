import os
import numpy as np
from PIL import Image
import cv2

def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)

def apply_paper_texture(rgb, paper_rgb, strength=0.22):
    """
    Blends physical watercolor/parchment paper grain using Multiply mode.
    Multiplication factor: 1.0 - strength * (1.0 - paper / 255.0)
    """
    factor = 1.0 - strength * (1.0 - (paper_rgb / 255.0))
    return np.clip(rgb.astype(float) * factor, 0, 255).astype(np.uint8)

def defringe(rgb, alpha_norm, bg_color):
    """
    Un-premultiplies edge pixels to remove background color contamination (cream or white halo).
    Where 0.02 < alpha < 0.98:
      C_obs = alpha * C_art + (1 - alpha) * C_bg
      => C_art = (C_obs - (1 - alpha) * C_bg) / alpha
    """
    res = rgb.copy().astype(float)
    mask = (alpha_norm > 0.02) & (alpha_norm < 0.98)
    a = alpha_norm[mask, np.newaxis]
    res[mask] = np.clip((res[mask] - (1.0 - a) * bg_color) / np.maximum(a, 0.05), 0, 255)
    return res.astype(np.uint8)

def compute_feathered_alpha(bg_mask, feather_radius=3.0):
    """
    Uses Signed Distance Transform (SDF) to generate a sub-pixel smooth, anti-aliased alpha mask.
    bg_mask: boolean mask where True indicates background (alpha = 0).
    """
    dist_from_bg = cv2.distanceTransform((~bg_mask).astype(np.uint8), cv2.DIST_L2, 5)
    dist_inside_bg = cv2.distanceTransform(bg_mask.astype(np.uint8), cv2.DIST_L2, 5)
    signed_dist = dist_from_bg - dist_inside_bg # >0 inside artwork, <0 inside bg
    
    # Smooth transition across [-feather_radius/2, +feather_radius/2]
    half_r = feather_radius * 0.5
    alpha = smoothstep(-half_r, +half_r, signed_dist)
    return alpha

def process_all_layers():
    assets_dir = 'public/assets'
    out_dir = 'public/assets/parallax'
    os.makedirs(out_dir, exist_ok=True)

    paper_path = os.path.join(assets_dir, 'textures', 'parchment_paper.png')
    paper_rgb = np.array(Image.open(paper_path).convert('RGB')).astype(float)

    print('=== STEP 1: Processing Layer 0 (Sky) ===')
    l0_path = os.path.join(assets_dir, 'Layer_0_Sky_Adolf_Lachman_Style.jpg')
    arr0 = np.array(Image.open(l0_path).convert('RGB'))
    arr0_textured = apply_paper_texture(arr0, paper_rgb, strength=0.20)
    # Layer 0 is fully opaque background
    alpha0 = np.full((768, 1376), 255, dtype=np.uint8)
    rgba0 = np.dstack([arr0_textured, alpha0])
    Image.fromarray(rgba0).save(os.path.join(out_dir, 'layer_0_sky.png'))
    print('Saved layer_0_sky.png')

    print('=== STEP 2: Processing Layer 1 (Far Pagodas) ===')
    l1_path = os.path.join(assets_dir, 'Layer_1_Far_Background_Adolf_Lachman_Style.jpg')
    arr1 = np.array(Image.open(l1_path).convert('RGB'))
    bg1_ref = np.array([247.5, 246.6, 241.1])
    dist1 = np.sqrt(np.sum((arr1.astype(float) - bg1_ref)**2, axis=2))
    min_c1 = arr1.min(axis=2)

    # Candidate sky: low color distance to top cream paper and high brightness
    sky1_candidate = ((min_c1 >= 210) & (dist1 < 45)).astype(np.uint8)
    # Find component connected to top row
    _, labels1, _, _ = cv2.connectedComponentsWithStats(sky1_candidate, connectivity=8)
    top_label = labels1[0, 0] # Component at (0, 0)
    sky1_mask = (labels1 == top_label)

    alpha1 = compute_feathered_alpha(sky1_mask, feather_radius=3.5)

    # Smooth vertical fade at bottom horizon (rows 620 to 670)
    y_idx = np.arange(768)[:, np.newaxis]
    bottom_fade1 = np.clip((670 - y_idx) / (670 - 620), 0.0, 1.0)
    alpha1 = alpha1 * bottom_fade1

    # Soft horizontal fade on far left/right edges (outer 4 pixels) to prevent border seams
    x_idx = np.arange(1376)[np.newaxis, :]
    left_fade1 = np.clip(x_idx / 4.0, 0.0, 1.0)
    right_fade1 = np.clip((1375 - x_idx) / 4.0, 0.0, 1.0)
    alpha1 = alpha1 * left_fade1 * right_fade1

    arr1_defringed = defringe(arr1, alpha1, bg1_ref)
    arr1_textured = apply_paper_texture(arr1_defringed, paper_rgb, strength=0.22)
    rgba1 = np.dstack([arr1_textured, (alpha1 * 255).astype(np.uint8)])
    Image.fromarray(rgba1).save(os.path.join(out_dir, 'layer_1_pagodas.png'))
    print(f'Saved layer_1_pagodas.png (Mean alpha: {alpha1.mean():.3f})')

    print('=== STEP 3: Processing Layer 2 (Midground Ruins) ===')
    l2_path = os.path.join(assets_dir, 'Layer_2_Midground_Ruins_Adolf_Lachman_Style.jpg')
    arr2 = np.array(Image.open(l2_path).convert('RGB'))
    bg2_ref = np.array([240.2, 240.4, 229.0])
    dist2 = np.sqrt(np.sum((arr2.astype(float) - bg2_ref)**2, axis=2))
    min_c2 = arr2.min(axis=2)

    paper2_candidate = ((dist2 < 14) & (min_c2 >= 215)).astype(np.uint8)
    # Keep components with area >= 500 (border paper and open archway windows)
    _, labels2, stats2, _ = cv2.connectedComponentsWithStats(paper2_candidate, connectivity=8)
    valid_components = np.where(stats2[:, cv2.CC_STAT_AREA] >= 500)[0]
    # Label 0 is background (artwork), so exclude 0
    valid_components = [c for c in valid_components if c != 0]
    bg2_mask = np.isin(labels2, valid_components)

    alpha2 = compute_feathered_alpha(bg2_mask, feather_radius=3.2)
    arr2_defringed = defringe(arr2, alpha2, bg2_ref)
    arr2_textured = apply_paper_texture(arr2_defringed, paper_rgb, strength=0.22)
    rgba2 = np.dstack([arr2_textured, (alpha2 * 255).astype(np.uint8)])
    Image.fromarray(rgba2).save(os.path.join(out_dir, 'layer_2_ruins.png'))
    print(f'Saved layer_2_ruins.png (Mean alpha: {alpha2.mean():.3f})')

    print('=== STEP 4: Processing Layer 3 (Walkable Ground Platform) ===')
    l3_path = os.path.join(assets_dir, 'Layer_3_Walkable_Ground_Adolf_Lachman_Style.jpg')
    arr3 = np.array(Image.open(l3_path).convert('RGB'))
    min_c3 = arr3.min(axis=2)
    white_bg3 = (min_c3 >= 245).astype(np.uint8)

    # Connected components of white background
    _, labels3, stats3, _ = cv2.connectedComponentsWithStats(white_bg3, connectivity=8)
    # The two large components above (component 1) and below (component 2) the platform
    valid_bg3 = np.where(stats3[:, cv2.CC_STAT_AREA] >= 50000)[0]
    valid_bg3 = [c for c in valid_bg3 if c != 0]
    bg3_mask = np.isin(labels3, valid_bg3)

    alpha3 = compute_feathered_alpha(bg3_mask, feather_radius=3.0)

    # Soft horizontal fade on far left/right edges (outer 4 pixels) to prevent border seams
    alpha3 = alpha3 * left_fade1 * right_fade1

    bg3_ref = np.array([255.0, 255.0, 255.0])
    arr3_defringed = defringe(arr3, alpha3, bg3_ref)
    arr3_textured = apply_paper_texture(arr3_defringed, paper_rgb, strength=0.22)
    rgba3 = np.dstack([arr3_textured, (alpha3 * 255).astype(np.uint8)])
    Image.fromarray(rgba3).save(os.path.join(out_dir, 'layer_3_ground.png'))
    print(f'Saved layer_3_ground.png (Mean alpha: {alpha3.mean():.3f})')

    print('=== STEP 5: Processing Layer 4 (Foreground Vignette Frame) ===')
    l4_path = os.path.join(assets_dir, 'Layer_4_Foreground_Vignette_Adolf_Lachman_Style.jpg')
    arr4 = np.array(Image.open(l4_path).convert('RGB'))
    min_c4 = arr4.min(axis=2).astype(float)

    # Dark silhouette frame is where min_c4 < 75.
    # Transparent portal/white background is where min_c4 > 210.
    alpha4 = smoothstep(0.0, 1.0, (210.0 - min_c4) / (210.0 - 75.0))

    # De-fringe against pure white so all edges are deep, clean, and velvety dark
    a4 = alpha4[:, :, np.newaxis]
    arr4_defringed = np.clip((arr4.astype(float) - (1.0 - a4) * 255.0) / np.maximum(a4, 0.05), 0, 255).astype(np.uint8)
    arr4_textured = apply_paper_texture(arr4_defringed, paper_rgb, strength=0.22)
    rgba4 = np.dstack([arr4_textured, (alpha4 * 255).astype(np.uint8)])
    Image.fromarray(rgba4).save(os.path.join(out_dir, 'layer_4_foreground.png'))
    print(f'Saved layer_4_foreground.png (Mean alpha: {alpha4.mean():.3f})')

    print('=== STEP 6: Creating Composite Preview ===')
    # Alpha blend layers in sequence: 0 -> 1 -> 2 -> 3 -> 4
    comp = arr0_textured.astype(float) / 255.0

    layers_to_blend = [
        (arr1_textured, alpha1),
        (arr2_textured, alpha2),
        (arr3_textured, alpha3),
        (arr4_textured, alpha4)
    ]

    for lay_rgb, lay_a in layers_to_blend:
        a = lay_a[:, :, np.newaxis]
        lay_float = lay_rgb.astype(float) / 255.0
        comp = comp * (1.0 - a) + lay_float * a

    comp_img = np.clip(comp * 255.0, 0, 255).astype(np.uint8)
    Image.fromarray(comp_img).save(os.path.join(out_dir, 'composite_preview.png'))
    print('Composite preview saved to public/assets/parallax/composite_preview.png')

if __name__ == '__main__':
    process_all_layers()
