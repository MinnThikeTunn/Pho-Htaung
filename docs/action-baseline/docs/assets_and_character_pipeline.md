# Cartoon character, asset and audio production contract

Revision: 1.1 · 2026-10-22 · Cartoon direction and generated character concept face/costume/attitude approved. Final animation and in-game presentation not approved. Current actual files/rights status: [manifest](../public/assets/manifest.json), [implementation report](implementation_report.md). Inventory statuses below describe the original planning pass, not a current asset acquisition ledger.

## 1. Scope and actual availability

The inspected Are.na blocks and Gemini chat provide source directories and workflows, not acquired sprite packs. No final Phoe Htaung sheet, U Gyi drawing, licensed music file, voice recording, texture atlas or imported font binary has been supplied by that collection during this review.

This contract describes what an artist/asset agent must deliver. Do not create a manifest entry marked “verified” because a website name appears in Gemini. Do not call these assets downloaded/ready until files exist and are inspected.

2D cartoon is approved. Pixel art is not the baseline. Gemini's 32×32/64×64 advice was a pixel-art example; it does not override the logical world or force the character into a tiny square.

## 2. Visual direction

Baseline proposal within the approved cartoon direction:

- Side-view, expressive, simple shapes with a consistent dark outline and restrained two/three-tone shading.
- Rustic stone/wood/metal environment; subdued background; readable foreground and aim warning.
- Human, comic Phoe Htaung, not a realistic hero, robot, spirit or superhero.
- One shared light direction, outline treatment and palette family across custom/stock assets.
- Breakable wood has a visibly different material from indestructible stone/metal. Destroyed scenery cannot look solid.
- Falling stones visibly dangerous; supported stones visibly safe to step on. Motion/streak/outline treatment must communicate the state without relying only on red/green.
- Decorative props must not look like usable steps if they have no collision. Solid gate/lift edges must align with their readable art silhouette.

Do not copy Machinarium characters, paintovers, backgrounds, UI or distinctive assets. It remains a mood/reference, not a template to reproduce. Do not turn the scene into horror to match an available stock pack.

## 3. Phoe Htaung character brief

Identity to retain from the human storyline:

- Adult Burmese village man, boastful posture and quick comic reactions.
- Tucked-up longyi, one flip-flop, torn shoulder bag; betel-chewing mannerism optional in idle.
- Clear hands/feet and facing direction at gameplay size.
- Expressive silhouette before small costume detail; no dependence on readable tiny facial features.

Do not add a weapon/combat mechanic because some older Gemini draft mentions a machete. The betel cutter and bag can be character detail; they are not active CH1 inventory actions. Decide the exact palette, proportions, face, garment pattern and accessory placement on a small sample sheet, then ask for owner visual approval before producing every animation.

U Gyi's physical body is **not shown in CH1**. Use his original short dialogue/voice presence and the machine's behavior. Do not introduce a portrait/body reveal merely to fill a UI slot. Full-body U Gyi assets belong to future ending work.

### Character sample review

Deliver before final production: neutral side pose, facing reversal check, taunt pose and one pushing pose against a rock, shown at actual gameplay scale against a room sample. Review readability and tone, not just a large standalone illustration. This document does not claim those drawings already exist.

## 4. Character texture and pivot baseline

Engineering export proposal, adjustable only with import metadata updated and unchanged collision:

| Property | Baseline |
|---|---|
| Uniform source frame | 128 × 160 RGBA pixels |
| Display scale | 0.5; logical frame 64 × 80 |
| Source feet anchor | (64,144) |
| Normalized sprite origin | (0.5,0.9) |
| Gameplay body | 36 × 56 logical pixels |
| Body relative to feet | x = -18..18, y = -56..0 |
| Equivalent source body box | x=28..100, y=32..144 |
| Collision authority | Domain data, never opaque texture bounds |

The bottom 16 source pixels are padding, not additional standing height. Costume/hand motion may use the wider visual frame without growing the hitbox. Keep actual soles aligned to the same feet anchor in every frame; render shadows separately. Trimmed atlases must retain original frame dimensions and source offsets, or disable trimming initially.

Initial export faces right. Left mirroring is acceptable for the placeholder, but check bag/sandal asymmetry and approval for final art. No automatic animation frame cropping, camera zoom or feet-pivot movement between states.

### Minimum animation states

Frame counts/rates below are production targets, not new gameplay timers. Placeholder can use fewer frames provided states remain readable.

| State | Suggested frames | Playback | Trigger / authority |
|---|---:|---|---|
| idle | 4 | 4 fps loop | Grounded FREE with no motion |
| walk | 6 | 10 fps loop | Horizontal grounded movement |
| jump rise | 1–2 | Hold/cycle during rise | Actual vertical velocity <0 |
| fall | 1–2 | Hold/cycle during descent | Unsupported vertical velocity ≥0 |
| push | 4 | 8 fps loop | Actual successful push intent/contact |
| taunt | 3 | Fit into exactly 0.35 s | Valid E; never extend control lock |
| death impact | 1–3 | Impact/fade inside 0.90 s lifecycle | Terminal death event; never delay retry |

Priority: DEAD > EXITING > TAUNTING > airborne > push > walk > idle. EXITING can use an existing stance/fade; no new mechanical state or mandatory victory dance. Avoid pushing animation while airborne. Failed push at a wall can have a static strain pose, not actual body displacement.

No ragdoll simulation required. Slapstick squash/flatten FX can be noncolliding view effects; no new gore assets or new death types are needed for CH1.

## 5. Chapter 1 asset inventory

Logical dimensions below are authoritative collision/scene data, not a demand that every PNG have that exact pixel size. High-resolution exports may use a consistent 2× scale with metadata.

| Asset ID | Required states / use | Logical size / placement | Current status |
|---|---|---|---|
| `phoe_htaung` | States above | Feet anchor + body contract | Not created |
| `ch1_background` | Room silhouette/depth, no baked gameplay objects | 1280×720 composition | Not acquired/created |
| `ground` | Nonbreakable floor | Top640, full width | Placeholder allowed |
| `fixed_step` | Clearly solid/indestructible | 112×96 | Placeholder allowed |
| `stone` | Falling, settled, shatter FX | 96×96 body | Placeholder allowed |
| `wood_gate` | Intact, destroyed remnants noncolliding | 64×280 body | Not acquired/created |
| `gold_shelf` | Intact/broken | 144×16 body | Not acquired/created |
| `pressure_plate` | Weighted/unweighted | 128×8 sensor | Placeholder allowed |
| `lift` | Metal platform + readable chain link | 128×16 body | Placeholder allowed |
| `gantry` | Aim/reload/drop view | Visual rail Y64–128 | Not acquired/created |
| `coin` | Pickup, optional visual sparkle | radius10 pickup | Placeholder allowed |
| `gold_pouch` | Resting/falling, occlusion outline | 24×24 pickup | Not acquired/created |
| `exit` | Right stairs/door identity | Defined exit zone | Placeholder allowed |
| `target_preview` | Dashed track, solid lock, path, crack icon | 96-wide footprint | Procedural view geometry preferred |
| `hud` | Gold/deaths/time/E and menus | Responsive, warning-safe | Text/simple UI allowed |
| `ch1_exit_link` | Safe stairs, pipes, glow | No enemies/pickups/shop | Simple composition allowed |
| `myanmar_font` | Readable bundled Unicode text | Verify actual font/license | Not acquired |

Background must not contain a baked opaque rock, coin, gate or shelf that the simulation later removes. Keep stateful props in separate layers/textures. Art cannot move a platform to make a composition prettier without updating and revalidating geometry.

## 6. Runtime layer order and readability

Suggested view depths: background 0; distant decor 10; machines/chains 20; solids 30; pickups 40; actors 50; nonblocking dust 60; target warnings/occluded pickup outline 70; HUD/subtitles 100. Depths are engineering conventions, not world collision priority.

Warnings must remain readable through dust/shake and cannot hide under a background layer. Where a platform/player legitimately occludes part of the trajectory, preserve a clear footprint and solid/dashed distinction. Blocked pouch/coin outline indicates its existence without pretending it is collectible through a solid.

Do not bake Burmese text into images. HUD and subtitles use the chosen font with actual line layout. Test the 1280×720 viewport and scaled 960×540/1920×1080 surfaces; letterbox rather than stretch world geometry.

## 7. File formats and source preservation

- Layered originals: `.kra`, `.svg`, `.ora`, `.aseprite`/compatible source as appropriate; keep existing format if supplied. Do not require installing every tool.
- Runtime: transparent RGBA PNG + atlas JSON for animated sprites; PNG/WebP backgrounds after browser decode check. JPEG only for fully opaque artwork, never character transparency.
- Animation files and metadata must identify frame names, dimensions, origin, scale, loop and duration. Atlases must not include frame numbering gaps by accident.
- Font: self-host verified WOFF2 or another browser-compatible format with its license.
- Audio master: lossless WAV; runtime compressed format(s) verified in target browser. Do not upscale a compressed original and claim it is a new master.
- Naming: lowercase snake_case stable asset IDs; version source files, do not silently overwrite original vendor files.

Proposed paths:

```text
art/source/characters/phoe_htaung/
art/source/chapter1/
art/source/audio/
public/assets/characters/phoe_htaung/
public/assets/chapter1/
public/assets/ui/
public/assets/fonts/
public/assets/audio/
docs/asset_manifest.json       # created/populated only when assets are actually acquired
public/credits.txt            # generated from verified entries before release
```

Edits are derivative working copies. Preserve alpha, palette, alignment and masks. For simple vector recolor, edit the existing vector/style precisely; do not ask an image generator to redraw the whole object. Pixel-only tool shortcuts from Gemini are not universal across applications or suitable for cartoon brushwork.

No art generation, image editing, purchase, bulk download, external upload, voice cloning or software installation is authorized by the request to write these documents. Those are later tasks with the applicable tool/skill and permissions.

## 8. Acquisition and rights ledger

Every acquired/generated/placeholder asset needs a ledger entry. Suggested schema:

```json
{
  "assetId": "stone",
  "status": "candidate",
  "sourceKind": "external",
  "sourceUrl": null,
  "author": null,
  "licenseId": null,
  "licenseEvidencePath": null,
  "sourceFile": null,
  "runtimeFiles": [],
  "sha256": null,
  "modifications": [],
  "attributionText": null,
  "commercialUseVerified": false,
  "derivativeUseVerified": false,
  "redistributionChecked": false,
  "reviewedAt": null
}
```

Allowed statuses: candidate, acquired_unverified, verified, placeholder, rejected. A runtime release entry must be verified or an original project-owned placeholder with documented provenance; final-art readiness also requires visual sign-off. A bare URL is not license evidence. Store the selected file's license text/author/download page and required credits; confirm whether redistributing source assets inside a public repository is allowed. Hash real bytes, never invented strings.

Resource triage:

- Kenney: promising for neutral props/UI; [official support](https://kenney.nl/support) describes its asset-page game assets as CC0. Still record the chosen pack and included license.
- Game-icons: optional HUD symbols, not final Phoe Htaung art; [official about](https://game-icons.net/about.html) requires author attribution under CC BY 3.0.
- OpenGameArt/itch.io/CraftPix/Freesound/Sonniss/Pixabay/FMA/SVGRepo/Flaticon: discovery only. Verify each actual file/pack; do not infer CC0, commercial clearance or redistribution rights from “free.”
- Google Fonts candidate: Noto Sans Myanmar (or verified suitable alternative). Preserve the selected font's license; do not assume every Burmese font found online has the same terms.
- Original custom art: record creator/permission and editable source. If an AI tool is used later, record the tool/output and review consistency/rights before treating it as production art.

Do not download large mixed-license libraries just to cover one missing icon. Choose coherent minimal assets. Exclude noncommercial or unclear-license content from the release baseline until a compatible use is established. Credit requirements survive recoloring/cropping.

## 9. Sound and voice cue sheet

One VO line at a time; repeat taunt/death voice cooldown 3 s. Critical lock cue outranks decorative audio. If a low-priority VO is playing when death occurs, stop/replace it with the eligible death cue; do not queue stale speeches across retry. Subtitles and visual warnings remain sufficient when all audio is muted.

| Cue ID | Trigger | Production direction |
|---|---|---|
| `target_lock` | Enter LOCKED once | Short distinct warning, not misleading |
| `stone_drop` | Spawn machine rock | Short mechanism/fall onset |
| `stone_land` | New support | Heavy brief impact |
| `wood_break` | Gate/shelf destroyed | Brief wood crack, no lingering blocker |
| `stone_shatter` | Rock-rock hit | Clear break confirmation |
| `push_loop` | Actual grounded pushing | Quiet; stop immediately on end/reset |
| `lift_loop` | Lift actually moving | Low-level chain/motor; stop when obstructed |
| `coin_pickup` | New pickup ID | Brief positive cue, not cash settlement |
| `death_hit` | Latched death | Slapstick impact inside retry window |
| `chapter_clear` | Completion after valid survival | Short success cue, no forced dance |
| `ugyi_entry`, `phoe_taunt`, `ugyi_gate`, `ugyi_plate`, `ugyi_shelf`, `ugyi_death`, `ugyi_exit` | Chapter dialogue table | Exact current text/timing; nonblocking |

Use the CH1 dialogue table for words and display maxima. Do not record long historical Gemini paragraphs and extend timers to fit them. A silent/text-only placeholder is acceptable for prototype. Original comic Burmese performance is intended; do not copy a YouTube recording, clone a person's voice or claim the video audio is licensed. Broad narration traits are a reference, not permission to reuse performance.

Unlock/resume audio only through user interaction, handle browser rejection, and continue muted if it fails. See [MDN autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay). Settings should separately control music/SFX/voice, with subtitles still on. No unbounded overlapping landing/death sounds, full-scale clipping or misleading countdown audio.

## 10. Integration and QA gates

1. Inventory actual files and rights before import.
2. Review one character sample and one room sample together; no mass final-art production before that sign-off.
3. Export uniform anchors/scale; validate atlas names/dimensions and alpha edges.
4. Import behind stable IDs with a procedural placeholder fallback for missing optional art/audio.
5. Re-run collision/route tests after every art swap; collision state hashes must not change solely from texture changes.
6. Check assets at actual gameplay scale, not only at zoomed design size. Check every animation on lift and against rocks.
7. Verify Burmese shaping, disabled audio, muted warnings, dust visibility, occluded gold, reset cleanup and loaded font layout.
8. Produce a real credits file from verified metadata and a missing-assets list. Do not fabricate “all licenses checked.”

Initial asset budget target: ≤10 MB compressed runtime media for the CH1 prototype; measure actual transfer/decode and document exceptions. Prefer small atlases and short cues over large stock archives. This target is an engineering budget, not a reason to remove readable warnings or required Unicode glyphs.

Fallback ladder: complete graybox → coherent cartoon placeholder → approved character sample → final atlas/props/audio. Final art may improve presentation but cannot be used as evidence that core gameplay is fun.
