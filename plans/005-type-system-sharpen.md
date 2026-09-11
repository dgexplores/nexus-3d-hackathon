# 005 — Sharpen the type system: scale, rhythm, contrast

- **Status**: TODO
- **Commit**: fd11dba (excerpts match current working tree. If a step doesn't match the code you find, STOP and report.)
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens (typographic system); Accessibility (contrast)
- **Estimated scope**: 1 file (`src/nexus.css`), ~25 lines changed

## Problem

Four type voices (Instrument Serif display, Space Grotesk/Geist sans, JetBrains Mono) with no shared scale — sizes, leadings, and trackings were tuned per-block and now fight each other. Confirmed:

```css
/* src/nexus.css:295-304 — current hero: 8rem all-caps serif at 0.84 leading */
.hero-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(3.6rem, 14vw, 8rem);
  letter-spacing: -0.055em;
  line-height: 0.84;
  margin: 0;
  color: #f8fafc;
  text-wrap: balance;
}
```

At `14vw` the title hits its `8rem` cap early on desktop while all-caps serif at `-0.055em`/`0.84` collides with itself; on mid screens the 13-character "THE MULTIVERSE" wraps awkwardly against the thread label below it (`src/Overlay.tsx:240-244`).

```css
/* src/nexus.css:401-409 — current chapter titles */
.chapter h2 {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(2.1rem, 5.2vw, 3.3rem);
  line-height: 0.94;
  letter-spacing: -0.035em;
  margin: 0.5rem 0 0.65rem;
  color: #f8fafc;
}
```

```css
/* src/nexus.css:410-415 — current per-dim overrides, two of which are dead */
.chapter[data-dim="paint"] h2 { font-family: var(--font-display); font-style: italic; }
.chapter[data-dim="ink"] h2 { font-family: var(--font-mono); }
.chapter[data-dim="mirror"] h2 { font-family: var(--font-display); font-style: italic; }
.chapter[data-dim="debris"] h2 .line:nth-child(1) { display: inline-block; transform: rotate(-1.15deg) translateX(-2px); }
.chapter[data-dim="debris"] h2 .line:nth-child(2) { display: inline-block; transform: rotate(0.75deg) translateX(4px); }
.chapter[data-dim="fractal"] h2 { font-family: var(--font-display); font-weight: 700; letter-spacing: 0.02em; }
```

The debris rules target `.line` children, but `src/Overlay.tsx:120-126` renders `.title-word` spans — those two rules match nothing. The ink rule sets body-size serif scale on a monospace face, which reads oversized and loose.

```css
/* src/nexus.css:417-424 — current body: semibold 600 at low contrast */
.chapter p {
  font-size: 1.08rem;
  line-height: 1.6;
  color: #cbd5e1;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0.6rem 0 0;
}
```

`600`-weight Grotesk at `#cbd5e1` on near-black vibrates against the glowing 3D frame instead of sitting under it; no measure cap, so lines run full `520px` at all sizes.

```css
/* src/nexus.css:390-396 — current eyebrow */
.chapter-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.22em;
  color: var(--dim-color, #7dd3fc);
  opacity: 0.85;
}
```

Eyebrow-to-title gap is `0.5rem` while title-to-body is `0.65rem` — rhythm is inverted (kicker should breathe less than the title it introduces... here the title crowds its kicker and floats from its body).

## Target

One fluid scale, kickers that whisper, titles that own the frame, bodies that sit quiet. Exact end state:

```css
/* target hero */
.hero-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(3rem, 11vw, 6.5rem);
  letter-spacing: -0.02em;
  line-height: 0.92;
  margin: 0 auto;
  max-width: 14ch;
  color: #f8fafc;
  text-wrap: balance;
}
```

```css
/* target chapter titles — one scale, per-dim voices kept, dead rules gone */
.chapter h2 {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(2.4rem, 4.6vw, 3.6rem);
  line-height: 1.0;
  letter-spacing: -0.02em;
  margin: 0.75rem 0 0.75rem;
  color: #f8fafc;
  text-wrap: balance;
}
.chapter[data-dim="paint"] h2 { font-family: var(--font-display); font-style: italic; }
.chapter[data-dim="ink"] h2 { font-family: var(--font-mono); font-size: clamp(1.8rem, 3.6vw, 2.6rem); letter-spacing: -0.01em; }
.chapter[data-dim="mirror"] h2 { font-family: var(--font-display); font-style: italic; }
.chapter[data-dim="fractal"] h2 { font-family: var(--font-display); font-weight: 700; letter-spacing: 0; }
```

```css
/* target body — lighter weight, lifted color, capped measure */
.chapter p {
  font-size: 1.05rem;
  line-height: 1.65;
  color: #dbe3ee;
  font-weight: 500;
  letter-spacing: -0.005em;
  margin: 0.75rem 0 0;
  max-width: 42ch;
}
```

```css
/* target eyebrow — slightly larger, wider tracking, calmer */
.chapter-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.26em;
  color: var(--dim-color, #7dd3fc);
  opacity: 0.9;
}
```

## Repo conventions to follow

- Font loading stays exactly as-is (`src/index.html:12-17`, `display=swap`, four families) — this plan uses the existing `--font-display/--font-sans/--font-mono` tokens (`src/nexus.css:10-12`), adds no families, no weights.
- Per-dimension title voices (paint/mirror italic, ink mono) are deliberate art direction — preserve them, only fix their scale. The fractal/mandala geometry is untouched.
- Entrance timing belongs to plan 004 (`.chapter-inner` transition, GSAP staggers) — this plan owns static type only.

## Steps

1. `src/nexus.css:295-304` — replace the `.hero-title` rule with the target block verbatim.
2. `src/nexus.css:401-409` — replace the `.chapter h2` rule with the target block verbatim (adds `text-wrap: balance`, evens the margins).
3. `src/nexus.css:410-415` — replace the whole per-dim override group with the target group verbatim: keep paint/mirror italic lines identical, extend the ink line with the mono scale, delete both dead debris `.line` rules, set fractal `letter-spacing: 0`.
4. `src/nexus.css:417-424` — replace the `.chapter p` rule with the target block verbatim.
5. `src/nexus.css:390-396` — replace the `.chapter-eyebrow` rule with the target block verbatim. Leave `.chapter.in-view .chapter-eyebrow` (lines 397-399) untouched.

## Boundaries

- Do NOT touch `src/Overlay.tsx` copy, markup, or chapter order — CSS only.
- Do NOT touch entrance timing (plan 004), colors of titles/eyebrows, the CTA, tracker, nav island, loader, or cursor.
- Do NOT add font families, weights, or dependencies. Do NOT rename tokens.
- Body color `#dbe3ee` is a contrast lift that assumes plan 002's darker grade; if 002 is not executed, keep the color change anyway (it still passes on today's background) — do not improvise further lightening.
- If a step doesn't match the code you find (drift since the commit stamp), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run build` passes; `npm run dev`, open `http://localhost:5173/`.
- **Feel check**: at 1440px, 1024px, 390px widths confirm the hero reads as one composed block (eyebrow → title → thread → hint) with no awkward single-word wrap and no collision between title descenders and the thread line.
- Scroll all nine chapters and confirm titles feel like one family with three deliberate accents (paint/mirror italic, ink mono at a visibly smaller optical size), bodies sit quiet gray under white titles, and kickers whisper above — never louder than the title.
- Confirm no visual regression on debris/fractal titles (dead-rule deletion changes nothing by construction — verify with before/after screenshots).
- Toggle `prefers-reduced-motion`; type must read identically (this plan changes no motion).
- **Done when**: hero, titles, kickers, and bodies feel like a single editorial system across desktop and mobile, with contrast comfortable over the live 3D frame.
