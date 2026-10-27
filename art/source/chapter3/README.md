# Chapter 3 painted scenery — 2026-10-27

User requested matching the earlier chapters' mysterious ancient lost-city look instead of the flat green prototype. Created with the built-in image_gen tool, not CLI/API fallback. Environment is an edit of the project's existing AI-generated `public/assets/chapter1/background_v1.png`; the prop atlas is newly generated original imagery. No named artist/game was used in these prompts.

These are integrated art candidates awaiting owner in-game review, not claims of final approval or exclusive copyright. No third-party stock asset was downloaded. Existing character art and Chapter1/2 art are unchanged. Originals here and runtime copies under `public/assets/chapter3/` have identical bytes. No layered painting master exists.

`scale_props_v1.png` is genuine RGBA (1536×1024), alpha range0..254. Original RGB under transparent pixels may look brown when displayed without alpha; the browser uses alpha. Source pixels have not been resized, background-removed or repainted. Frame bounds in `src/content/chapter3Art.ts` were measured from alpha≥8; Phaser trims source frames at import and sizes the gate to its existing64×380 collider. This is render metadata, not new physics.

The background excludes live scales, gate slab and pickups. They are independent runtime objects and remain movable/removable. New painted assets do not decide hitboxes, warnings, weights or settlement. The statue relief is decorative scenery, not a magic actor.

## Environment prompt

Use case: style-transfer. Asset type: side-view 2D game environment background, 16:9.
Edit the supplied existing game background into a mysterious ancient Burmese/Bagan lost-city weighing chamber for the same game. Preserve its hand-painted illustrated finish, chipped mossy teal-grey stone masonry, old ochre plaster, muted bronze, rich material texture, subdued amber shafts of light and deep atmospheric recesses. Grounded material detail and depth, cohesive with the reference, no photoreal camera look, no clean vector shapes.
Composition is a strictly front/side elevation for a 1280x720 game. Wall fills image down to a perfectly horizontal floor seam at y=640/720 (89% image height); bottom 11% is weathered cut stone floor fascia. No sloped floor or foreground clutter.
A large ancient carved Burmese guardian STONE RELIEF in a recessed central niche: center x=622/1280, head near y=315/720, crowned top y=215/720, torso from y=370 to y=610/720. Elegant weather-worn detailed stone carving with a human face, carved headdress, faded gold-leaf traces, believable layered chiselwork; hands/arms kept close to torso, no held objects. The carving is part of the wall, no large protruding pedestal or walkable ledges. It must look ancient and mysterious, not threatening or magical.
Right-side stone portal behind the gameplay gate: opening x=1030..1115/1280 and y=250..640/720, tall narrow doorway, dim warm inner passage. Do not paint a gate/door slab inside it.
Leave clear space for overlaid interactive scales across x=440..820, y=280..575. Leave empty wall at x=300..450,y=530 for a separately drawn shelf. Darker low-contrast upper 20% for HUD, no lettering. Background-only: NO scales, chains, suspended weights, crates, sacks, gold pickups, characters, game UI, readable text, arrows, watermarks. Do not copy any named artist or existing game. Deliver one finished richly painted environment, NOT a screenshot mockup.

## Transparent prop atlas prompt

Use case: stylized-concept. Asset type: genuine transparent RGBA game prop atlas.
Create exactly SIX separate hand-painted 2D side-view game props on a FULLY TRANSPARENT background, in a precise 3-column by 2-row regular equal-square grid, wide 3:2 image. Each prop isolated inside its own cell with clear transparent padding, no overlap across cells. NO opaque/checkerboard background, text, cell lines, labels, numbers, ground planes or cast shadows outside the object.
Style: detailed illustrated ancient Burmese lost-city adventure game, muted teal-grey stone, aged ochre, weathered wood and tarnished bronze, textured brushwork, dark hand-inked edges, soft warm upper-left highlights; tactile materials cohesive with a mossy stone temple interior. Not glossy toy art, not minimal vector, not photoreal. Orthographic side/front elevation, not isometric.
Top-left cell: one irregular chipped grey stone weight, compact broad boulder with small chisel marks and moss flecks.
Top-middle: one tied bulging old coarse burlap sandbag, tan cloth with stitching and visible rope knot.
Top-right: one small ancient weathered wooden crate, planks and diagonal cross brace, worn iron corner fittings.
Bottom-left: a small golden Burmese guardian votive figurine, recognizable carved head and tapering decorated body, worn gold leaf and bronze shadows, no live character.
Bottom-middle: one tall narrow ancient stone-and-bronze sliding portcullis door slab seen straight-on, closed opaque slab, inset decorated bands, chipped stone rim; height dominates cell, width roughly one fifth its height, no surrounding portal.
Bottom-right: one rectangular stone reference counterweight with worn bronze corner bands, no written number.
Props must have clear silhouettes. Keep each entire object inside its cell and broadly centered. Each normal prop fills about 75% cell width and height. Door fills about 85% cell height, with narrow shape. Transparent background is essential.
