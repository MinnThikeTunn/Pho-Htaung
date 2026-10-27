# Chapter 3 ancient-city art revision — 2026-10-27

Owner observed that the new flat assets/background did not match the earlier chapters or feel like searching a mysterious ancient lost city. Reworked Chapter3 presentation on the existing `codex/chapter-3-scale-puzzle` branch. Human protagonist/cartoon direction, Chapter1/2 artwork and all domain rules remain unchanged.

## Actual changes

- `public/assets/chapter3/scale_chamber_v1.png`:1672×941 RGB painted stone chamber derived through built-in image_gen from the existing project Chapter1 background. Weathered Burmese guardian relief, mossy stone, ochre plaster, worn gold leaf, deeper niche/portal and warm amber light.
- `public/assets/chapter3/scale_props_v1.png`:1536×1024 true RGBA atlas containing stone, sandbag, crate, gold figurine, sliding gate slab and reference weight. No solid rectangular sprite backdrops. Measured alpha0..254 and tight per-object source bounds; no source-pixel editing or resampling performed.
- Original byte-identical copies and full prompts preserved under `art/source/chapter3/`; asset hashes, dimensions and provenance recorded in the adjacent runtime `manifest.json`. Total new runtime PNG bytes5,027,443. No new dependency or external stock acquisition.
- `src/content/chapter3Art.ts`: texture IDs/paths and alpha-derived frame rectangles. `src/main.ts`: preload the local images.
- `src/view/ScaleView.ts`: use painted layers, independent collectible/weight/door images, woodgrain shelf, bronze rope/beam/pans, grounding shadows and subdued hotspot rings. Beam sits above the carved face instead of crossing it. Door texture crops behind the lintel as it rises.

The door still maps to the existing64×380 body; its frame is sized at import instead of changing collision geometry to match a source sprite. Item locations/weights, shelf, reach, movement, gate speed/warning, exit condition, currency and campaign settlement are unchanged. The decorative wall relief is not a collidable platform or actor. All live puzzle objects are separately rendered, not baked into the background.

## Verification actually performed

- `npm.cmd run build`:PASS (includes strict app/test typechecks).
- `npm.cmd run test -- --reporter=json --outputFile=reports/chapter3-art-vitest.json`:86/86 PASS,0 failures. No domain source changed for this visual revision.
- Source/runtime hash and PNG mode/dimensions/alpha analysis:PASS. Six source frames measured from alpha≥8 and checked against the atlas dimensions; source images copied unmodified.
- Local HTTP check:200 after starting approved loopback Vite.
- Supported in-app browser, default desktop viewport: entered Chapter3 replay from existing campaign, inspected real painted room/props, picked stone and gold, placed both, waited for full-open status, inspected the retracted door, then walked through the exit. Actual result: treasure left,87.30 active seconds (includes agent inspection time), wallet5/deaths3 unchanged. Previously recovered campaign relic is retained by the existing settlement rule.
- Bounded captured console errors/warnings:[] (limit30); no universal error-free claim.
- Actual captures: [initial painted room](../reports/chapter3-ancient-city.jpg), [live objects on the pan / gate open](../reports/chapter3-painted-gate-open.jpg).

Built-in image generation was used, not CLI fallback. Background was generated with the project-owned earlier background as an edit reference; prop atlas generated separately with transparency requested. [Exact final prompt set and source details](../art/source/chapter3/README.md). No named artist imitation, ripped media, voice generation or photoreal character replacement.

## Limits

This improves art coherence; owner approval of the in-game look is still pending. It does not establish fun/originality, license clearance for the game's older unrelated assets, a layered painting master, mobile/alternate-GPU QA or finished Chapter4. Missing-art fallbacks are implemented but were not separately exercised by deleting or blocking the new assets. Automated Playwright execution was not repeated; browser verification used actual supported UI input.
