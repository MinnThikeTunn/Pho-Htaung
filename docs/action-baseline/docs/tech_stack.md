# Tech stack — Chapter 1 implementation baseline

Revision: 1.0 · Decision date: 2026-10-22.

Status: selected stack now installed/locked and headless-tested. Exact versions and build results are in [implementation_report.md](implementation_report.md); browser integration remains unverified. Historical bootstrap targets below remain provenance, not claims of browser readiness or independent permission to expand scope.

## 1. အဓိကဆုံးဖြတ်ချက်

**TypeScript + Phaser 3 + Vite** ဖြင့် browser မှဆော့နိုင်သော 2D cartoon ဂိမ်းတည်ဆောက်မည်။ ပထမ milestone သည် Chapter 1 ဖြစ်သည်။ Godot/Unity/React ဖြင့်တစ်ပြိုင်နက် version မရေးရ။

Phaser သည် ပုံဆွဲခြင်း၊ sprite animation၊ input၊ အသံနှင့် scenes ကိုကိုင်မည်။ Game logic၊ physics၊ ငွေစာရင်းနှင့် save state ကို TypeScript modules သီးခြားထားမည်။ Backend၊ database server နှင့် login မလိုသေးပါ။

## 2. Selected components

| Layer | Selection | Responsibility |
|---|---|---|
| Platform | Desktop web, keyboard, 1280×720 logical world | Browser-playable CH1, aspect-preserving scaling |
| Language | TypeScript, strict checking | Typed state, input, content and system contracts |
| Engine | Phaser 3.90.0 | Scenes, render loop, sprites, input and sound |
| Rendering | Phaser AUTO; WebGL where available, Canvas-compatible presentation | No custom shader requirement; verify fallback rather than assume it |
| Gameplay physics | Small project-owned fixed-step AABB simulation at 60 Hz | Jump, push, falling rocks, supports, plate/lift, swept collisions |
| Menu/HUD | Plain HTML/CSS DOM overlay; world labels/effects in Phaser | Keyboard-focusable menus, Burmese text, responsive overlay |
| State | Plain TypeScript data + finite state machines | Campaign/session/attempt separation; no global state library |
| Build/dev server | Vite, vanilla TypeScript layout | Local dev and static production bundle |
| Tool runtime | Node.js 24 LTS + its bundled npm | Development/testing only, not needed on the player's machine |
| Dependencies | npm, one package-lock.json | Exact direct dependency versions, reproducible installs |
| Unit/integration tests | Vitest | Headless simulation, ledger, reset and save-adapter checks |
| Browser tests | @playwright/test, Chromium first | Real input, menus, reload, pause, scaling and browser errors |
| Save | Versioned JSON via localStorage adapter | Local campaign/settings; no cloud sync or anti-cheat promise |
| Audio | Phaser Sound Manager over browser audio | SFX/voice/music; user-input unlock and silent fallback |
| Character animation | PNG sprite atlas + metadata | Cartoon placeholder/final frames; no extra skeletal runtime initially |
| Font | Locally bundled, verified Noto Sans Myanmar candidate | Burmese DOM text and world labels; acquire/check license before use |
| Distribution | Static dist/ output | Hosting provider deferred; no publishing in this task |

The DOM overlay renders state; it cannot decide collisions, award coins or drive game timing. No React, Vue, Next.js, Tailwind, Redux, Zustand, Howler or Spine runtime is needed for this slice.

## 3. Initial version targets

Select these direct package versions for the first bootstrap, subject to the validation gate below:

| Package/runtime | Initial target | Verification source |
|---|---|---|
| Node.js | Supported patched 24.x LTS | [Official release status](https://nodejs.org/en/about/previous-releases) |
| npm | Bundled with the selected Node 24 distribution; record exact version | No package-manager substitution needed |
| phaser | 3.90.0 | [Official Phaser 3 releases](https://phaser.io/download/phaser3) |
| typescript | 7.0.2 | [Publisher package metadata](https://registry.npmjs.org/typescript/latest), version observed on review date |
| vite | 8.3.5 | [Official tagged package metadata](https://raw.githubusercontent.com/vitejs/vite/v8.3.5/packages/vite/package.json) |
| vitest | 5.0.5 | [Official tagged package metadata](https://raw.githubusercontent.com/vitest-dev/vitest/v5.0.5/packages/vitest/package.json) |
| @playwright/test | 1.64.1 | [Publisher package metadata](https://registry.npmjs.org/@playwright/test/latest), version observed on review date |
| @types/node | Compatible stable 24.x; resolve one exact patch at bootstrap | Match chosen Node major; do not pull next/preview |

Latest-tag links above are evidence of what was observed on 2026-10-22, not instructions to install whatever `latest` points to in the future. Use the numeric targets in this table. No package.json or lockfile was generated in this documentation task.

Metadata compatibility checked: Vitest 5.0.5 accepts Node 24 and Vite 8 in its engine/peer ranges; Vite 8.3.5's Node requirement accepts the selected Node line. [Vitest metadata](https://raw.githubusercontent.com/vitest-dev/vitest/v5.0.5/packages/vitest/package.json), [Vite metadata](https://raw.githubusercontent.com/vitejs/vite/v8.3.5/packages/vite/package.json).

This is **not** a claim that the full Phaser/TypeScript/build/browser combination has passed tests. Phaser declaration checking, native tool binaries on the actual OS, dependency resolution and browser availability must be verified at M0. Do not use `--force`, `--legacy-peer-deps`, disabled type checking or ignored install scripts as a substitute for diagnosing an incompatible combination.

After the first successful bootstrap, record exact Node/npm, all resolved direct package versions and installed browser revision. Use exact direct versions without `^`/`~`, commit package-lock.json, and use npm ci for subsequent clean installs. Compatible tool patch adjustments need an evidence note; changing engine major or physics architecture requires explicit review. No automatic major upgrades during CH1 development.

## 4. Why this engine, not an engine migration now?

The official current stable Phaser download was 4.2.1 during review, so **Phaser 3 is an intentional choice, not a claim that it is the latest**. [Current stable release](https://phaser.io/download/release/v4.2.1).

Keep 3.90.0 for this first slice because existing scene/asset/technical contracts already use Phaser 3 and the requested CH1 needs no identified Phaser 4-only capability. This avoids mixing API examples from different majors. It is a project-scope judgment, not a claim of superior performance, perpetual maintenance or absence of vulnerabilities. Record any discovered blocker/security issue and review the smallest compatible remedy.

Godot/Unity could be considered if a future requirement changes the primary platform or workflow, but no such requirement exists now. Do not maintain multiple engine implementations to keep that option open. Keep the domain modules engine-independent instead.

## 5. Physics boundary — important

The specified game is not a physically realistic rigid-body simulation. Its rules intentionally require falling rocks to shatter together, forbid stacking and prevent lift crushing. The selected small AABB solver owns these rules.

- Scope: rectangles, gravity, horizontal movement/push, one vertical lift and swept collision resolution.
- Do not add rotation, torque, rope physics, slopes, arbitrary stack simulation or an extensible physics framework.
- Do not attach Arcade/Matter bodies to actors already moved by the domain solver.
- Phaser render rate and animation frames cannot change gameplay state or timing.
- This approach gives control but adds collision implementation/testing work. Prove the hard push/support/lift fixtures in M1/M2; do not treat custom physics as a free or already-correct feature.
- If that work reveals a blocker, document the failing fixture before proposing an alternative. Do not quietly rewrite game rules to fit an engine default.

## 6. TypeScript and build conventions

- ES modules (`type: module` in the future package.json), strict TypeScript, browser target ES2022 and bundler-style module resolution.
- Separate browser/domain and Node tool-config checking where needed; no Node globals in gameplay domain code.
- Use Phaser's supplied type declarations; do not add an unrelated @types/phaser package.
- Run an actual TypeScript check separately from bundling. Do not assume Vite transpilation establishes type safety.
- Whole-line Burmese subtitles first; no new typewriter library. A future typewriter must use grapheme segmentation.
- Use plain data state machines; no FSM/ECS/state-management package until a real requirement justifies one.
- Keep builds local and reproducible; no runtime CDN game dependencies, hotlinked textures or embedded credentials.

Required future npm scripts (not currently runnable):

| Script | Contract |
|---|---|
| dev | Vite dev server, loopback host by default |
| typecheck | tsc --noEmit against applicable project configuration(s) |
| build | Typecheck followed by Vite production build |
| preview | Local production preview, not public deployment |
| test | vitest run, one-shot |
| test:e2e | playwright test using the local build/server |

Do not scaffold over the existing docs with a command that replaces the workspace. Add the minimal project structure safely when implementation is requested.

## 7. Explicitly deferred

Backend, SQL/NoSQL server, cloud save, authentication, online leaderboard, analytics, multiplayer, mobile controls, Electron/Tauri wrapper, shop UI/economy, paid animation runtime and hosting provider choice. None is needed to prove Chapter 1 is playable and fun.

No need to prebuild a shop framework now: separate cumulative earned/best records from wallet balance and retain extensible save ownership as already specified.

## 8. Validation before accepting the bootstrap

1. Inspect actual Node/npm/OS; use supported compatible tools, not a guessed local setup.
2. Resolve dependencies without forcing conflicts, generate lockfile and record versions/security findings.
3. Pass typecheck, a pure domain smoke test and production build.
4. Launch the actual Phaser scene in Chromium; verify no missing module/asset errors and working keyboard input.
5. Verify WebGL presentation and test a supported Canvas-compatible path separately before claiming fallback support.
6. Run the initial Playwright smoke test. Later execute all gameplay cases in [verification_plan.md](verification_plan.md).

This documentation pass performs none of those install/build/runtime checks. Full contracts remain in [technical_architecture.md](technical_architecture.md) and [assets_and_character_pipeline.md](assets_and_character_pipeline.md).
