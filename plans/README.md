# Plans — NEXUS scroll pacing + darker sharper grade

Base commit: `fd11dba`. Note: working tree holds uncommitted scroll-smoothing edits (Lenis, camera damps, chapter heights); each plan's excerpts state which base they assume. Executors: if any step doesn't match the code you find, STOP and report.

| # | Plan | Severity | Status | Depends on |
|---|------|----------|--------|------------|
| 001 | [Even scroll room for finale](001-even-scroll-room-for-finale.md) | HIGH | TODO | — |
| 002 | [Darker, sharper grade](002-darker-sharper-grade.md) | HIGH | TODO | — |
| 003 | [Inactive dims recede](003-inactive-dims-recede.md) | HIGH | TODO | — |
| 004 | [Text-camera one clock](004-text-camera-one-clock.md) | HIGH | TODO | 001 |
| 005 | [Type system sharpen](005-type-system-sharpen.md) | MEDIUM | TODO | — (005 body color assumes 002's grade; 004 owns entrance timing) |

## Recommended order

1. **001 first** — fixes the skipped finale (peaks, waypoints, Lenis, CTA). Retest scroll pacing before grading.
2. **004 second** — locks text to the camera's clock (sprocket rAF, earlier/faster entrances, intro glide). Builds on 001's peaks and damps.
3. **003 third** — depth recession (galaxy/nebula/wash opacities). Pure opacity math, easy to eye-check.
4. **002 fourth** — full grade (lights, fog mood, post). Judge it on top of 001+003+004.
5. **005 last** — static type only (scale, rhythm, contrast, dead-rule cleanup). Safe anytime, but keep after 004 so entrance timing has one owner.

002 and 003 both edit `src/scene/SpaceExtension.tsx` but different blocks (002: `FogShifter` ~lines 377-387; 003: atmosphere wash line ~56 + `SpaceFill` ~967-990). 004 and 005 both touch `src/nexus.css` and `src/Overlay.tsx` in disjoint blocks (004: `.chapter-inner` transition + GSAP + sprocket; 005: title/body/eyebrow rules). If executing in parallel worktrees, merge carefully; sequentially, follow the order above.

## Findings not yet planned (awaiting selection)

| # | Severity | Category | Location | Finding | Fix summary |
|---|----------|----------|----------|---------|-------------|
| 4 | MEDIUM | Performance | `src/nexus.css:133,149,164,175,204,223,238,441` + `:582` | Eight `transition: all` (700ms/600ms) plus `width`/`height`/`margin` in `.cursor-ring` animate off-GPU | Scope each to `transform, opacity, color, background-color, border-color`; cursor-ring to `width, height, margin` → `transform` scale pattern or leave static |
| 5 | MEDIUM | Accessibility | `src/scene/CameraRig.tsx:87-95`, `src/scene/Thread.tsx:26-33`, `src/scene/Galaxies.tsx:227-229` | R3F loop ignores `prefers-reduced-motion` (jitter, thread pulse, mandala spin keep moving); only Lenis is gated (`src/App.tsx:20`) | Gate jitter/pulse/spin behind the existing matchMedia signal; keep opacity feedback per AUDIT §6 |
| 6 | LOW | Cohesion & tokens | `src/nexus.css` (12× hardcoded `cubic-bezier(0.32,0.72,0,1)`) | Drawer curve duplicated, no `--ease-*` tokens (AUDIT §7: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1); --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1); --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);`) | Consolidate to tokens; keep values identical |
| 7 | LOW | Interruptibility | `src/Overlay.tsx:59-99` | Chapter entrances use one-shot GSAP keyframes with `once: true` + a separate `IntersectionObserver` toggle for `.in-view` — rapid scroll reversals replay nothing mid-motion | Acceptable as-is for marketing chapters; only revisit if text visibly lags behind the camera |

## Missed opportunities (additive, not corrective)

1. Sprocket-rail jumps use `window.scrollTo({ behavior: "smooth" })` (`src/scene/scrollStore.ts:12-16`) fighting Lenis smoothing — route through the Lenis instance so jumps glide like the rest of the journey.
2. Dimension crossfades currently tint fog while the background stands still (fixed by 002's synced mood lerp) — no further masking needed after 002.
3. No velocity-reactive vignette: a subtle vignette swell on fast scroll would sell speed without brightening the frame (unlike today's opacity boosts). Only after 001–003 land.
