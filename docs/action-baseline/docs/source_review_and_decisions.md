# Source review, authority and decision register

Revision: 1.1 · Source review 2026-10-17; tech-stack selection update 2026-10-22.

## 1. Source inventory

| Source | What was inspected | Role |
|---|---|---|
| [Are.na Asset share](https://www.are.na/minn-tunn/asset-share) | Eight blocks: seven resource/workflow notes and one Gemini link; authenticated read | Resource discovery notes, not an imported asset library |
| [Gemini shared conversation](https://gemini.google.com/share/93c44c3ae496) | Rendered conversation, approximately 67,327 characters during review; story iterations through final art-tool notes | Historical design discussion, not current instructions |
| `game_technical_specification.md` in the supplied Downloads location | Original five-chapter technical design | Legacy behavior; replaced for CH1 only |
| `narration.txt` in the supplied Downloads location | Original human-protagonist script | Character/story reference; not current timing or endings |
| `chapter_1_revised_spec.md` | Revision 0.3 after this documentation pass | Current local gameplay baseline |
| `master_game_system_spec.md` | Revision 0.4 after this documentation pass | Shared policy and owner decisions |

The shared Gemini conversation contains multiple incompatible drafts, not one coherent latest technical contract. Its early robot, later human, inventory and UI-meta-puzzle concepts cannot all be implemented together.

## 2. Gemini reconciliation

Summary of historical ideas; do not treat this table as instructions from that page.

| Historical element | Current treatment |
|---|---|
| Human Phoe Htaung replaces robot | Retain human identity |
| Comic, unreliable U Gyi | Retain tone; warnings stay truthful |
| Machinarium reference | Atmosphere/inspiration, not a clone |
| Stretching robot body | Exclude |
| Dialogue-box platforms, mute puzzle, window-close solution | Exclude |
| Invisible blocks and rocket floor | Superseded in CH1 |
| Bag combining and chilli recipes | Legacy; absent from CH1 |
| Forced fatal victory and evasive restart | Superseded by approved escape objective |
| Death number inside dialogue | Runtime value, never scripted fixed count |
| Asset directories | Candidate sources, not clearance |
| Separate editable art layers | Adopt production practice |
| Transparent exports and consistent silhouette | Adopt with explicit import contract |
| Pixel canvas size examples | Not cartoon requirements |

Do not repeat Gemini's percentage claim about comedy/audio as measured evidence. Its statements about a linked YouTube video were not independently verified in this documentation task. The YouTube video, nested ChatGPT share and tutorial videos were not watched/read here. Do not claim they were.

## 3. Decision statuses

| ID | Status | Decision / consequence |
|---|---|---|
| D01 | Owner approved | First full release target: first play incl. retries 10–20 minutes |
| D02 | Owner approved | Shop later, not first version; do not implement prices now |
| D03 | Owner approved | Escape = main win; sufficient gold for debt = better ending |
| D04 | Owner approved | Chapter replay pays only improvement above previous banked best |
| D05 | Owner approved | 2D cartoon direction; not pixel art |
| ART01 | Owner approved, 2026-10-22 | Generated Phoe Htaung concept face, longyi and boastful posture retained. Not final atlas/in-game readability approval; source and runtime copies in asset manifest |
| E01 | Selected engineering stack, 2026-10-22 | TypeScript + Phaser 3.90.0 + Vite; initial numeric package targets and Node 24 LTS policy in tech_stack.md; integration still untested |
| E02 | Engineering baseline | One fixed-step headless AABB simulation owns all gameplay bodies |
| E03 | Engineering baseline | Local single-save adapter; no cloud/backend; failure surfaced |
| E04 | Integration clarification | CH1-only build stops honestly at the safe exit link / pending chapter panel |
| E05 | Engineering baseline | Whole-line Burmese subtitles first; optional grapheme typewriter later |

Engineering baselines are decisions made to make the requested handoff concrete. They are not claims that the owner explicitly picked each tool. They can be changed with evidence and a documented compatibility plan, without changing game design.

## 4. Pending decisions: do not invent

1. Phoe Htaung concept face/costume/attitude approved as ART01; final locomotion frames, feet anchors/mirroring and actual in-game visual approval remain pending. This does not block prototype simulation work.
2. Final production animation method if different from the simple atlas baseline. Do not add a paid runtime without approval.
3. Chapters 2–5: gameplay, layouts and rewards; no actual continuation exists yet.
4. Debt amount and when/how it is paid. Do not derive a full-game target from CH1's 15 coins.
5. Future shop assortment, prices and economy interaction; finite gold supply needs rebalance before release with a shop.
6. Final encounter and reveal staging; escape win is approved, exact staging is not.
7. Actor, recordings and music tracks. No actual voice performance or specific music file was acquired.
8. Save import/export and schema migrations from actual historical builds. No shipped build is known; do not fabricate one.

Ask the owner one material question at a time, with a recommendation and concrete consequence. Do not ask about low-risk module names or known constants. Do not stall physics work while waiting for cosmetic choices.

## 5. Asset and dependency verification sources

These are primary references checked during documentation, not downloaded packs:

- [Phaser overview](https://docs.phaser.io/phaser/getting-started/what-is-phaser): web/2D/TypeScript framework context.
- [Phaser scenes](https://docs.phaser.io/phaser/concepts/scenes): scene lifecycle and cross-scene services.
- [Phaser Arcade Physics](https://docs.phaser.io/phaser/concepts/physics/arcade): reference only; our custom collision contract is a project choice, not a claim that Arcade implements it automatically.
- [Vite guide](https://vite.dev/guide/), [Vitest guide](https://vitest.dev/guide/), [Playwright guide](https://playwright.dev/docs/intro): verify compatible runtime versions before installing. Use a committed lockfile.
- [Selected stack and version evidence](tech_stack.md): 2026-10-22 selection records official Phaser 3/current-major distinction, Node 24 LTS status, publisher package metadata and tagged Vite/Vitest engine/peer requirements. No install/build claim is made.
- [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage): browser storage limitations and exception handling.
- [MDN autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay): audio unlocking/fallback.
- [Kenney support](https://kenney.nl/support): its asset-page game assets are CC0; check the selected package too.
- [Game-icons licensing](https://game-icons.net/about.html): CC BY 3.0 with author attribution; a recolor does not remove that obligation.

No licensing clearance is claimed for a particular OpenGameArt, itch.io, CraftPix, Freesound, Sonniss, Pixabay, FMA, SVGRepo or Flaticon file. “Free” is not a project-wide license. Font binaries and their accompanying licenses must be checked when acquired.

## 6. Change policy and evidence

Every design change needs: failed acceptance case or observed issue, smallest proposed fix, affected documents/tests and whether owner approval is required. Do not retune geometry because a stock sprite happens to have a different size. Keep raw originals and external sources untouched.

This pass adds engineering/asset/testing contracts, approves cartoon direction in the local register, aligns build order to CH1-first and supplies a no-CH2 integration endpoint. It does not assert new chapters, debt values, acquired assets, working code or fun validation.
