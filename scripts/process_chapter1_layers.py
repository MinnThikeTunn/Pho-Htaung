import os
import numpy as np
from PIL import Image
import cv2

def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)

def apply_paper_texture(rgb, paper_rgb, strength=0.22):
    factor = 1.0 - strength * (1.0 - (paper_rgb / 255.0))
    return np.clip(rgb.astype(float) * factor, 0, 255).astype(np.uint8)

def defringe(rgb, alpha_norm, bg_color):
    res = rgb.copy().astype(float)
    mask = (alpha_norm > 0.02) & (alpha_norm < 0.98)
    a = alpha_norm[mask, np.newaxis]
    res[mask] = np.clip((res[mask] - (1.0 - a) * bg_color) / np.maximum(a, 0.05), 0, 255)
    return res.astype(np.uint8)

def compute_feathered_alpha(bg_mask, feather_radius=3.0):
    bg_bool = bg_mask.astype(bool)
    dist_from_bg = cv2.distanceTransform((~bg_bool).astype(np.uint8), cv2.DIST_L2, 5)
    dist_inside_bg = cv2.distanceTransform(bg_bool.astype(np.uint8), cv2.DIST_L2, 5)
    signed_dist = dist_from_bg - dist_inside_bg
    half_r = feather_radius * 0.5
    return smoothstep(-half_r, +half_r, signed_dist)

def process_chapter1_layers():
    assets_dir = 'public/assets'
    out_dir = 'public/assets/parallax/chapter1'
    os.makedirs(out_dir, exist_ok=True)

    paper_path = os.path.join(assets_dir, 'textures', 'parchment_paper.png')
    paper_rgb = np.array(Image.open(paper_path).convert('RGB')).astype(float)
    white_ref = np.array([255.0, 255.0, 255.0])

    print('=== STEP 1: Processing Chapter 1 Layer 0 (Cavern) ===')
    l0_path = os.path.join(assets_dir, 'Chapter1_Layer_0_Sky.jpg')
    arr0 = np.array(Image.open(l0_path).convert('RGB'))
    arr0_textured = apply_paper_texture(arr0, paper_rgb, strength=0.20)
    alpha0 = np.full((768, 1376), 255, dtype=np.uint8)
    rgba0 = np.dstack([arr0_textured, alpha0])
    Image.fromarray(rgba0).save(os.path.join(out_dir, 'ch1_layer_0_sky.png'))
    print('Saved ch1_layer_0_sky.png')

    print('=== STEP 2: Processing Chapter 1 Layer 1 (Machinery) ===')
    l1_path = os.path.join(assets_dir, 'Chapter1_Layer_1_Machinery.jpg')
    arr1 = np.array(Image.open(l1_path).convert('RGB'))
    min_c1 = arr1.min(axis=2)
    # White background & spoke cutouts
    white1 = (min_c1 >= 238).astype(np.uint8)
    alpha1 = compute_feathered_alpha(white1, feather_radius=3.2)
    arr1_defringed = defringe(arr1, alpha1, white_ref)
    arr1_textured = apply_paper_texture(arr1_defringed, paper_rgb, strength=0.22)
    rgba1 = np.dstack([arr1_textured, (alpha1 * 255).astype(np.uint8)])
    Image.fromarray(rgba1).save(os.path.join(out_dir, 'ch1_layer_1_machinery.png'))
    print(f'Saved ch1_layer_1_machinery.png (Mean alpha: {alpha1.mean():.3f})')

    print('=== STEP 3: Processing Chapter 1 Layer 2 (Cliffs) ===')
    l2_path = os.path.join(assets_dir, 'Chapter1_Layer_2_Cliffs.jpg')
    arr2 = np.array(Image.open(l2_path).convert('RGB'))
    min_c2 = arr2.min(axis=2)
    white2 = (min_c2 >= 235).astype(np.uint8)
    alpha2 = compute_feathered_alpha(white2, feather_radius=3.5)
    # 2-pixel outer border edge softening
    x_idx = np.arange(1376)[np.newaxis, :]
    y_idx = np.arange(768)[:, np.newaxis]
    border_fade = np.clip(x_idx / 2.0, 0.0, 1.0) * np.clip((1375 - x_idx) / 2.0, 0.0, 1.0)
    alpha2 = alpha2 * border_fade
    arr2_defringed = defringe(arr2, alpha2, white_ref)
    arr2_textured = apply_paper_texture(arr2_defringed, paper_rgb, strength=0.22)
    rgba2 = np.dstack([arr2_textured, (alpha2 * 255).astype(np.uint8)])
    Image.fromarray(rgba2).save(os.path.join(out_dir, 'ch1_layer_2_cliffs.png'))
    print(f'Saved ch1_layer_2_cliffs.png (Mean alpha: {alpha2.mean():.3f})')

    print('=== STEP 4: Processing Chapter 1 Layer 3 (Ground & Platforms) ===')
    l3_path = os.path.join(assets_dir, 'Chapter1_Layer_3_Ground.jpg')
    arr3 = np.array(Image.open(l3_path).convert('RGB'))
    min_c3 = arr3.min(axis=2)
    white3 = (min_c3 >= 235).astype(np.uint8)
    # Connected component 1 covers the entire upper void and pit
    _, labels3, stats3, _ = cv2.connectedComponentsWithStats(white3, connectivity=8)
    main_void_idx = np.argmax(stats3[1:, cv2.CC_STAT_AREA]) + 1
    bg3_mask = (labels3 == main_void_idx)
    alpha3 = compute_feathered_alpha(bg3_mask, feather_radius=3.2)
    alpha3 = alpha3 * border_fade
    arr3_defringed = defringe(arr3, alpha3, white_ref)
    arr3_textured = apply_paper_texture(arr3_defringed, paper_rgb, strength=0.22)
    rgba3 = np.dstack([arr3_textured, (alpha3 * 255).astype(np.uint8)])
    Image.fromarray(rgba3).save(os.path.join(out_dir, 'ch1_layer_3_ground.png'))
    print(f'Saved ch1_layer_3_ground.png (Mean alpha: {alpha3.mean():.3f})')

    print('=== STEP 5: Processing Chapter 1 Layer 4 (Foreground Frame) ===')
    l4_path = os.path.join(assets_dir, 'Chapter1_Layer_4_Foreground.jpg')
    arr4 = np.array(Image.open(l4_path).convert('RGB'))
    min_c4 = arr4.min(axis=2).astype(float)
    # Dark silhouette frame is where min_c4 < 75. White center portal is where min_c4 > 210
    alpha4 = smoothstep(0.0, 1.0, (210.0 - min_c4) / (210.0 - 75.0))
    a4 = alpha4[:, :, np.newaxis]
    arr4_defringed = np.clip((arr4.astype(float) - (1.0 - a4) * 255.0) / np.maximum(a4, 0.05), 0, 255).astype(np.uint8)
    arr4_textured = apply_paper_texture(arr4_defringed, paper_rgb, strength=0.22)
    rgba4 = np.dstack([arr4_textured, (alpha4 * 255).astype(np.uint8)])
    Image.fromarray(rgba4).save(os.path.join(out_dir, 'ch1_layer_4_foreground.png'))
    print(f'Saved ch1_layer_4_foreground.png (Mean alpha: {alpha4.mean():.3f})')

    print('=== STEP 6: Creating Chapter 1 Composite Preview ===')
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
    Image.fromarray(comp_img).save(os.path.join(out_dir, 'ch1_composite_preview.png'))
    print('Composite preview saved to public/assets/parallax/chapter1/ch1_composite_preview.png')

if __name__ == '__main__':
    process_chapter1_layers()
