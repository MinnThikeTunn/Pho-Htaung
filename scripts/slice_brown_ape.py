#!/usr/bin/env python3
"""
Pure-Python (stdlib-only) sprite slicer & seamless knuckle-walk animation generator
for the Chapter 4 Brown Ape.
- Uses a 720x380 canvas with CENTER_X = 360 (originX = 0.5) so even the 472px strike
  lunge (anchor = 0.7436 -> 351px reach) fits 100% unclipped and flips symmetrically.
- Uses a continuous smooth 2D displacement field with bilinear sampling to articulate
  the 4-frame knuckle-walk cycle with zero seams or alpha bands.
"""
import math
import os
import struct
import zlib

SRC_PATH = "art/source/chapter4/arena_apes_v1.png"
OUT_DIR = "public/assets/chapter4"

TARGET_W = 720
TARGET_H = 380
BASELINE_Y = 368
CENTER_X = 360

BROWN_RECTS = {
    "idle":    {"x": 76,   "y": 49, "w": 336, "h": 360, "anchor": 0.5000},
    "windup":  {"x": 503,  "y": 49, "w": 329, "h": 360, "anchor": 0.4924},
    "strike":  {"x": 869,  "y": 52, "w": 472, "h": 360, "anchor": 0.7436},
    "recover": {"x": 1426, "y": 52, "w": 285, "h": 360, "anchor": 0.4877},
}


def paeth_predictor(a: int, b: int, c: int) -> int:
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    elif pb <= pc:
        return b
    return c


def read_png_rgba(path: str) -> tuple[int, int, list[bytearray]]:
    with open(path, "rb") as f:
        data = f.read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("Not a valid PNG file")

    pos = 8
    width = height = bit_depth = color_type = 0
    idat_chunks = []

    while pos < len(data):
        length = struct.unpack(">I", data[pos : pos + 4])[0]
        chunk_type = data[pos + 4 : pos + 8]
        chunk_data = data[pos + 8 : pos + 8 + length]
        pos += 12 + length

        if chunk_type == b"IHDR":
            width, height, bit_depth, color_type, _, _, _ = struct.unpack(">IIBBBBB", chunk_data)
        elif chunk_type == b"IDAT":
            idat_chunks.append(chunk_data)
        elif chunk_type == b"IEND":
            break

    bpp = 4 if color_type == 6 else 3
    raw = zlib.decompress(b"".join(idat_chunks))
    stride = width * bpp
    rows: list[bytearray] = []
    prev_row = bytearray(stride)

    offset = 0
    for _ in range(height):
        filter_type = raw[offset]
        offset += 1
        cur = bytearray(raw[offset : offset + stride])
        offset += stride

        if filter_type == 1:
            for i in range(bpp, stride):
                cur[i] = (cur[i] + cur[i - bpp]) & 0xFF
        elif filter_type == 2:
            for i in range(stride):
                cur[i] = (cur[i] + prev_row[i]) & 0xFF
        elif filter_type == 3:
            for i in range(stride):
                left = cur[i - bpp] if i >= bpp else 0
                cur[i] = (cur[i] + ((left + prev_row[i]) >> 1)) & 0xFF
        elif filter_type == 4:
            for i in range(stride):
                left = cur[i - bpp] if i >= bpp else 0
                up = prev_row[i]
                up_left = prev_row[i - bpp] if i >= bpp else 0
                cur[i] = (cur[i] + paeth_predictor(left, up, up_left)) & 0xFF

        prev_row = cur
        if bpp == 4:
            rows.append(cur)
        else:
            rgba = bytearray(width * 4)
            for x in range(width):
                rgba[x * 4 : x * 4 + 3] = cur[x * 3 : x * 3 + 3]
                rgba[x * 4 + 3] = 255
            rows.append(rgba)

    return width, height, rows


def write_png_rgba(path: str, width: int, height: int, rows: list[bytearray]) -> None:
    def make_chunk(chunk_type: bytes, chunk_data: bytes) -> bytes:
        crc = zlib.crc32(chunk_type + chunk_data) & 0xFFFFFFFF
        return struct.pack(">I", len(chunk_data)) + chunk_type + chunk_data + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    raw_rows = bytearray()
    for r in rows:
        raw_rows.append(0)
        raw_rows.extend(r)
    compressed = zlib.compress(bytes(raw_rows), 6)

    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(make_chunk(b"IHDR", ihdr))
        f.write(make_chunk(b"IDAT", compressed))
        f.write(make_chunk(b"IEND", b""))


def create_canvas(w: int, h: int) -> list[bytearray]:
    return [bytearray(w * 4) for _ in range(h)]


def extract_aligned_pose(sheet_rows: list[bytearray], rect: dict) -> list[bytearray]:
    rx, ry, rw, rh = rect["x"], rect["y"], rect["w"], rect["h"]
    anchor = rect["anchor"]

    bottom_y = rh - 1
    for cy in range(rh - 1, -1, -1):
        row = sheet_rows[ry + cy]
        if any(row[(rx + cx) * 4 + 3] > 20 for cx in range(rw)):
            bottom_y = cy
            break

    canvas = create_canvas(TARGET_W, TARGET_H)
    anchor_px = int(round(rw * anchor))
    paste_x = CENTER_X - anchor_px
    paste_y = BASELINE_Y - bottom_y

    for cy in range(rh):
        dy = paste_y + cy
        if 0 <= dy < TARGET_H:
            src_row = sheet_rows[ry + cy]
            dst_row = canvas[dy]
            for cx in range(rw):
                dx = paste_x + cx
                if 0 <= dx < TARGET_W:
                    s_idx = (rx + cx) * 4
                    d_idx = dx * 4
                    dst_row[d_idx : d_idx + 4] = src_row[s_idx : s_idx + 4]

    return canvas


def smoothstep(edge0: float, edge1: float, x: float) -> float:
    t = max(0.0, min(1.0, (x - edge0) / (edge1 - edge0)))
    return t * t * (3.0 - 2.0 * t)


def sample_bilinear(rows: list[bytearray], sx: float, sy: float) -> tuple[int, int, int, int]:
    if sx < 0 or sx >= TARGET_W - 1 or sy < 0 or sy >= TARGET_H - 1:
        return 0, 0, 0, 0
    x0 = int(sx)
    y0 = int(sy)
    fx = sx - x0
    fy = sy - y0
    r0 = rows[y0]
    r1 = rows[y0 + 1]
    i00 = x0 * 4
    i10 = (x0 + 1) * 4

    a00, a10, a01, a11 = r0[i00 + 3], r0[i10 + 3], r1[i00 + 3], r1[i10 + 3]
    if a00 == 0 and a10 == 0 and a01 == 0 and a11 == 0:
        return 0, 0, 0, 0

    w00 = (1.0 - fx) * (1.0 - fy)
    w10 = fx * (1.0 - fy)
    w01 = (1.0 - fx) * fy
    w11 = fx * fy

    a = a00 * w00 + a10 * w10 + a01 * w01 + a11 * w11
    if a < 1.0:
        return 0, 0, 0, 0

    # Premultiplied interpolation prevents dark fringes at edges
    aw00 = a00 * w00
    aw10 = a10 * w10
    aw01 = a01 * w01
    aw11 = a11 * w11
    inv_a = 1.0 / a

    r = (r0[i00] * aw00 + r0[i10] * aw10 + r1[i00] * aw01 + r1[i10] * aw11) * inv_a
    g = (r0[i00 + 1] * aw00 + r0[i10 + 1] * aw10 + r1[i00 + 1] * aw01 + r1[i10 + 1] * aw11) * inv_a
    b = (r0[i00 + 2] * aw00 + r0[i10 + 2] * aw10 + r1[i00 + 2] * aw01 + r1[i10 + 2] * aw11) * inv_a

    return (
        int(min(255, max(0, round(r)))),
        int(min(255, max(0, round(g)))),
        int(min(255, max(0, round(b)))),
        int(min(255, max(0, round(a)))),
    )


def build_seamless_walk_frame(
    base_rows: list[bytearray],
    front_dx: float,
    front_dy: float,
    hind_dx: float,
    hind_dy: float,
    torso_dx: float,
    torso_dy: float,
    shoulder_roll_dy: float,
) -> list[bytearray]:
    """
    Applies a continuous, C1-smooth 2D deformation field over the brown ape pose.
    - Upper body & head bob and roll with the heavy knuckle-walk gait.
    - Front knuckle-arms (x < CENTER_X) and hind legs (x > CENTER_X) swing and lift
      smoothly with zero seams or transparency artifacts.
    """
    out = create_canvas(TARGET_W, TARGET_H)

    # Active bounding region inside 720x380 canvas to speed up warp
    x_min, x_max = 150, 560
    y_min, y_max = 10, 376

    for y in range(y_min, y_max):
        dst_row = out[y]
        # Smooth vertical blend from torso (y <= 195) to lower limbs (y >= 285)
        limb_t = smoothstep(195.0, 285.0, float(y))
        torso_t = 1.0 - limb_t

        # Foot grounding taper near baseline so planted feet stay crisp
        lift_scale = smoothstep(215.0, 355.0, float(y))

        for x in range(x_min, x_max):
            # Smooth horizontal blend between front knuckle-arms (left of CENTER_X)
            # and hind legs (right of CENTER_X) over a 76px transition zone
            hind_t = smoothstep(CENTER_X - 38.0, CENTER_X + 38.0, float(x))
            front_t = 1.0 - hind_t

            # Local limb displacement
            l_dx = front_t * front_dx + hind_t * hind_dx
            l_dy = (front_t * front_dy + hind_t * hind_dy) * lift_scale

            # Upper torso + shoulder roll displacement
            roll = (front_t - hind_t) * shoulder_roll_dy * smoothstep(260.0, 120.0, float(y))
            u_dx = torso_dx
            u_dy = torso_dy + roll

            dx = torso_t * u_dx + limb_t * l_dx
            dy = torso_t * u_dy + limb_t * l_dy

            r, g, b, a = sample_bilinear(base_rows, x - dx, y - dy)
            if a > 0:
                di = x * 4
                dst_row[di] = r
                dst_row[di + 1] = g
                dst_row[di + 2] = b
                dst_row[di + 3] = a

    return out


def hstack_frames(frames: list[list[bytearray]]) -> tuple[int, int, list[bytearray]]:
    count = len(frames)
    total_w = TARGET_W * count
    out = create_canvas(total_w, TARGET_H)
    for idx, frame in enumerate(frames):
        x_off = idx * TARGET_W * 4
        row_bytes = TARGET_W * 4
        for y in range(TARGET_H):
            out[y][x_off : x_off + row_bytes] = frame[y]
    return total_w, TARGET_H, out


def main():
    if not os.path.exists(SRC_PATH):
        raise FileNotFoundError(f"Missing {SRC_PATH}")

    os.makedirs(OUT_DIR, exist_ok=True)
    w, h, sheet_rows = read_png_rgba(SRC_PATH)
    print(f"Loaded {SRC_PATH} ({w}x{h})")

    poses: dict[str, list[bytearray]] = {}
    for name, rect in BROWN_RECTS.items():
        poses[name] = extract_aligned_pose(sheet_rows, rect)
        out_path = os.path.join(OUT_DIR, f"brown_ape_{name}.png")
        write_png_rgba(out_path, TARGET_W, TARGET_H, poses[name])
        print(f"Saved {out_path} ({TARGET_W}x{TARGET_H})")

    # 4-frame heavy gorilla knuckle-walk cycle (seamless 2D mesh warp):
    # (base_pose, front_dx, front_dy, hind_dx, hind_dy, torso_dx, torso_dy, shoulder_roll_dy)
    walk_specs = [
        ("idle",    -14.0,   0.0,  12.0, -10.0,  -4.0,   3.0,   4.0),  # Walk 1: Front knuckles reach & plant, hind legs lift
        ("idle",     -5.0, -12.0,   4.0,   0.0,  -1.0,  -5.0,  -3.0),  # Walk 2: Front knuckles lift, shoulders vault upward
        ("recover",  12.0,   0.0, -12.0,   0.0,   4.0,   4.0,  -4.0),  # Walk 3: Gathered heavy stride compression
        ("idle",      4.0,  -2.0,  -5.0, -11.0,   1.0,  -4.0,   3.0),  # Walk 4: Hind leg push-off & stride extension
    ]

    walk_frames: list[list[bytearray]] = []
    for idx, (pose_key, fdx, fdy, hdx, hdy, tdx, tdy, roll) in enumerate(walk_specs, start=1):
        wf = build_seamless_walk_frame(poses[pose_key], fdx, fdy, hdx, hdy, tdx, tdy, roll)
        walk_frames.append(wf)
        wf_path = os.path.join(OUT_DIR, f"brown_ape_walk_{idx}.png")
        write_png_rgba(wf_path, TARGET_W, TARGET_H, wf)
        print(f"Saved {wf_path} ({TARGET_W}x{TARGET_H})")

    # Save 4-frame walk spritesheet (2880x380)
    ww, wh, walk_sheet = hstack_frames(walk_frames)
    walk_sheet_path = os.path.join(OUT_DIR, "brown_ape_walk_spritesheet.png")
    write_png_rgba(walk_sheet_path, ww, wh, walk_sheet)
    print(f"Saved {walk_sheet_path} ({ww}x{wh})")

    # Save full 8-frame spritesheet (5760x380):
    # [0: idle, 1: walk_1, 2: walk_2, 3: walk_3, 4: walk_4, 5: windup, 6: strike, 7: recover]
    all_frames = [
        poses["idle"],
        *walk_frames,
        poses["windup"],
        poses["strike"],
        poses["recover"],
    ]
    fw, fh, full_sheet = hstack_frames(all_frames)
    full_sheet_path = os.path.join(OUT_DIR, "brown_ape_spritesheet.png")
    write_png_rgba(full_sheet_path, fw, fh, full_sheet)
    print(f"Saved {full_sheet_path} ({fw}x{fh})")


if __name__ == "__main__":
    main()
