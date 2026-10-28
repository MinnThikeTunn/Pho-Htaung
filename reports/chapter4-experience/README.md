# Chapter4 gameplay review — 2026-10-28

Historical evidence from before the owner's requested fixes. Current tuning and subsequent verification are in [the combat revision](../../docs/chapter4_balance_review.md); rerunning the helper against the revised build will produce different outcomes.

Reviewed build: `1457096`, branch `codex/chapter-4-ape-arena`. Requested scope: play and assess the experience from a player's perspective. No production gameplay or balance was changed during this review.

## How this was tested

Computer Use's native pipe was unavailable after retry/reset. A local installed Chrome was therefore driven with Playwright keyboard and rendered DOM controls. This is **automated browser gameplay observed through screenshots/results**, not a human tester's subjective experience or an interactive in-app-browser session. The AI's design judgement below is inferred from those observations and code inspection. Sound and continuous animation feel were not assessed.

Disposable contexts started with a legal Chapter3-complete save fixture, wallet5/deaths3, and the existing default sling receiver. No Chapter4 health, actor positions, enemy states, timer, victory flags or inventory were mutated. All combat and exits used actual keys. This does not prove clearing Chapters1–3 or the previous pickup integration. The user's normal campaign/profile was untouched.

Reproduce from the integration checkout with a running port3000 preview:

```
node scripts/playtest-chapter4.mjs
```

Uses installed Chrome, not a newly downloaded browser. Each invocation writes `results.json`; the full first comparison set is preserved separately in [combat-results.json](combat-results.json). A more rigorous focused pause/retry rerun is [results.json](results.json). CLI selection `pause-retry` runs only that case. These probes are not the standalone nine-test Playwright suite; no new suite-wide pass is claimed.

## Actual outcomes

| Play pattern | Outcome | What it demonstrates |
|---|---|---|
| Stay at spawn; only hold/release K during combat | Both apes defeated, actual right exit reached,58HP left,12.00s combat, wallet5 | Movement, jumping, J and L are unnecessary for this successful learned pattern. |
| Approach with D1800ms; distinct J presses360ms apart; no sling/defence | Player0HP, brown137/150, silver150/150; clock still63s, ammo12 | Fists cannot win this route, but make very little visible progress. This does not prove the best possible fist strategy. |
| K with repeated jumps and L every third cycle | Both defeated, actual exit reached,86HP left,14.47s combat, wallet5 | Defence can preserve health. This scripted pattern is not an optimal defended run or a controlled timing benchmark. |

K-only play was also observed before a helper path correction:11.97s/58HP. The repeated result supports the cheap-strategy concern; it does not establish a population difficulty distribution. The loop's `shots` field counts charge/release cycles, not guaranteed fired shots; the win snapshots show12→2 ammo, consistent with10 fired stones.

Focused pause/retry rerun confirmed a real0.515 charge bar before Escape, charge0 while paused, unchangedHP/ammo/time across the pause, and no shot on resume. Subsequently fired until ammo11, then held R1500ms: player100, enemies150/150, ammo12 and75s restored. Long-held R did not loop continuously. Captured page-error arrays were empty at this tested scope; network/console warnings were not comprehensively audited.

Screenshots visually confirm red enemy fill at1440×1000 and1280×720. Raw `redFill` DOM-probe values return the progress track colour in this Chromium API and are **not valid fill-colour evidence**; use the actual screenshot. No pixel payload was edited.

## Player-facing assessment

**Working foundation, insufficient combat decisions and replay depth.** The strongest finding is that repeatedly charging K without moving clears the encounter in about12s, leaving58HP. A75s timer provides almost no urgency for that route. The supply piles, punch and dodge may work mechanically but are not necessary to solve the obvious optimal-looking strategy.

The active defensive pattern preserved more health, which is a useful foundation. However, survival/progression is binary and the current result provides no additional gameplay consequence for preserved health. Merely finishing already permits the simpler strategy; adding reward currencies is not recommended to disguise this combat issue.

The two enemy roles are visually distinct, but the successful route simply fires through the brown enemy, then the silver one. No encounter event forced a change in plan. Existing attack warnings/locked trajectories are fair building blocks; removing them or adding surprise unavoidable attacks would damage that fairness.

J's1 damage versus150HP is barely visible. Its existing brief push/stun applies only outside enemy windup/strike. The fist-only run establishes weakness, not usefulness as a spacing tool. Preserve the owner requirement that fists alone cannot win, while making their tactical purpose legible.

The painted courtyard establishes the lost-city setting. At1280×720 the player, sling and stones are small, while large health/dialogue/charge panels dominate the top portion. The projectile/impact is harder to read than the HUD. Ape movement uses pose switching/sliding and player combat reuses existing poses (source inspection); completed locomotion, hit reactions and perceived animation smoothness remain separate work. The encounter currently communicates a prototype more strongly than a finished arcade fight.

Nothing observed establishes innovative or unique gameplay. The setting/hero can supply identity, but this encounter's present rule sequence is a familiar repeated shot loop. A second play has little new decision content. This is a design judgement about the tested encounter, not a claim that originality can be certified by an automated run.

## Smallest recommended next iteration — proposals only

1. **Make standing-and-firing meaningfully unsafe through the existing readable attacks.** Adjust approach/attack pressure and firing opportunities, then repeat the K-only and defended routes. Aim for movement/dodge to matter while retaining reaction time; avoid simply inflatingHP or adding an unavoidable hit.
2. **Give the existing J/L a clear job before adding buttons.** J should visibly create a brief space/opportunity to ready the sling; L should evade a committed attack. Keep fist-only victory impossible, as requested. Increasing punch damage alone would not solve its role.
3. **Improve hit and warning readability.** Emphasize successful impact, enemy recovery and character silhouette; reduce persistent text obstruction. Preserve hitboxes, projectile timings and art independence. Dedicated combat animation/audio needs its own review.

An optional further design step would be to make enemy recovery the clear best firing opportunity, with readable guard states. That is a material gameplay change requiring owner discussion, not a change silently introduced in this assessment. First test the three small priorities; no additional enemies, arena expansion, new currency, extra skills or random mutations are needed to diagnose the current weakness.

Acceptance for a next iteration should distinguish: stationary spam loses under fair warnings; a reactive route can still win; J creates an understandable opportunity; hits can be read at the intended desktop size. These are proposed playtest goals, not new owner-approved constants or tests already passed.

## Evidence

- [Entry: red health bars](entry-red-health.png)
- [Stationary clear](stationary-result.png)
- [Fists-only defeat](fists-result.png)
- [Defended clear](active-result.png)
- [1280×720 layout after retry](desktop-1280.png)

The local test browser closed after each run. Preview is stopped at handoff. No push/PR, package changes or gameplay modifications were made.
