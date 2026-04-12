# Resizer — Editorial Redesign Specificatie

**Versie:** v1.0-design
**Datum:** 2026-04-12
**Status:** Goedgekeurd na interview + stress-test
**Scope:** Visuele upgrade van v1. Functionaliteit en backend ongewijzigd (zie `SPEC.md`).

---

## 1. Overzicht

Upgrade van de UI van "dark minimalist utility" naar **editorial / magazine-style craft tool**. Doel: een tool die voelt als een goed-verzorgd tijdschrift — precisie, typografische ambitie, ademende whitespace — zonder functionaliteit in te leveren.

**Kern-ingrediënten:**
- **Typografie:** Fraunces (display, italic) als hero + Inter (UI sans) + JetBrains Mono (cijfers)
- **Kleur:** Mono charcoal-on-near-black + single lime accent (`#84CC16`) voor savings
- **Layout:** Editorial hero bij empty-state, card-grid bij populated-state
- **Motion:** Subtiel, 120–250ms easings en springs, count-up numbers bij completion
- **Texture:** SVG feTurbulence grain (3% opacity) + 1px inner-highlights op panels
- **Signature moment:** Count-up + underline-grow bij batch-done

---

## 2. User Stories (visueel)

- **US-D1** — Bij lege staat zie ik een grote "Resize, radically." headline in Fraunces italic die duidelijk maakt dat dit geen generieke tool is.
- **US-D2** — Zodra ik files sleep, verdwijnt de headline en zie ik mijn afbeeldingen als genummerde kaarten in een grid, met originele en geschatte nieuwe grootte per kaart.
- **US-D3** — Bij compress klik ik op één bespoke CTA en zie ik per kaart subtle state-changes (shimmer → lime check).
- **US-D4** — Als de batch klaar is, zie ik onderin een count-up van `0.0 MB → 8.4 MB saved` met een lijn die onder de cijfers doortrekt van links naar rechts.
- **US-D5** — Op een klein window past alles nog steeds dankzij fluide typografie.

---

## 3. Visuele Structuur

### 3.1 Empty-state hero
```
┌──────────────────────────────────────────────┐
│  № 001                      RESIZER · 0.1    │  ← 12px mono, muted
│                                              │
│                                              │
│   Resize,                                    │  ← Fraunces 72pt italic
│   radically.                                 │     tracking -0.02em
│                                              │     line-height 0.95
│   ─────────                                  │  ← 40px rule, muted
│                                              │
│   Drop images anywhere.                      │  ← Inter 16px muted
│   JPEG, PNG. Batch. Parallel.                │
│                                              │
│                                              │
│                            [Balanced ▾]      │  ← bottom-right preset
└──────────────────────────────────────────────┘
```

### 3.2 Populated-state
```
┌──────────────────────────────────────────────┐
│  resizer № 12                [Balanced ▾]    │  ← compact header, Fraunces italic "№"
├──────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│  │ 001    │ │ 002    │ │ 003    │ │ 004    │ │  ← 200×260 cards
│  │ [img]  │ │ [img]  │ │ [img]  │ │ [img]  │ │     thumbnail 200×180
│  │ 4.2MB  │ │ 3.8MB  │ │ 1.2MB  │ │ 2.4MB  │ │
│  │ →820KB │ │ →710KB │ │ →340KB │ │ →480KB │ │
│  │  −81%  │ │  −81%  │ │  −72%  │ │  −80%  │ │  ← lime accent
│  └────────┘ └────────┘ └────────┘ └────────┘ │
│  ...                                         │
├──────────────────────────────────────────────┤
│                                              │
│            8.4 MB saved                      │  ← Fraunces 48pt italic
│            ─────────────                     │  ← underline grows L→R
│                                              │
│  12 files · avg −78%        [Compress →]     │
└──────────────────────────────────────────────┘
```

### 3.3 Signature completion moment
1. Batch start → CTA wordt "Processing" met subtle pulse.
2. Per kaart done → 300ms shimmer sweep → lime check verschijnt met scale 0.8→1.0 spring.
3. Batch done → footer total area expandeert (200ms ease-out).
4. "0.0 MB saved" count-upt naar eindwaarde over 900ms (cubic-bezier 0.22, 1, 0.36, 1).
5. Underline groeit synchroon van `width: 0%` naar `100%` onder de cijfers.
6. Avg savings fade-in 100ms later.

---

## 4. Design Tokens

### 4.1 Kleur
```css
--bg:              #0A0A0A;   /* page */
--bg-elev-1:       #121212;   /* panels */
--bg-elev-2:       #181818;   /* cards */
--border:          #262626;
--border-soft:     #1F1F1F;
--highlight-inner: rgba(255,255,255,0.04);  /* 1px inner top-highlight */
--fg:              #FAFAFA;
--fg-muted:        #A3A3A3;
--fg-subtle:       #737373;
--fg-faint:        #525252;
--accent:          #84CC16;   /* lime-500 */
--accent-glow:     rgba(132,204,22,0.15);
--danger:          #F87171;
```

### 4.2 Typografie

**Families:**
- **Fraunces** (variable, italic axis) — display, hero, count-up numbers, `№` markers
- **Inter** (variable) — all UI sans
- **JetBrains Mono** (variable) — tabular numbers, filepaths, sizes

**Type scale (fluid):**
```css
--t-hero:    clamp(2.25rem, 8vw, 4.5rem);    /* Fraunces italic 72pt target */
--t-display: clamp(1.75rem, 5vw, 3rem);      /* Fraunces italic 48pt */
--t-title:   1.25rem;    /* 20px Inter 500 */
--t-body:    0.9375rem;  /* 15px Inter 400 */
--t-label:   0.75rem;    /* 12px Inter 500 uppercase, tracking 0.08em */
--t-mono:    0.8125rem;  /* 13px JetBrains Mono 450 */
```

**Feature settings:**
- Fraunces: `font-variation-settings: 'SOFT' 50, 'WONK' 1; font-style: italic;` op hero/display
- Inter: `font-feature-settings: 'cv11','ss01','ss03';`
- JetBrains Mono: `font-feature-settings: 'tnum','zero';`

**Font loading (bundle):**
- Self-hosted woff2, subset Latin.
- Preload Fraunces italic 400+600 (~90KB after subsetting), Inter 400+500+600, JetBrains Mono 400+500.
- `font-display: swap`.

### 4.3 Spacing & radii
```css
--r-card:   14px;
--r-panel:  20px;
--r-btn:    8px;
--r-chip:   6px;

--gap-xs: 4px;  --gap-sm: 8px;
--gap:    12px; --gap-md: 16px;
--gap-lg: 24px; --gap-xl: 40px;
--gap-2x: 64px;
```

### 4.4 Texture
**Film-grain** via inline SVG fixed over viewport:
```html
<svg class="grain" aria-hidden="true">
  <filter id="g">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.03 0"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#g)"/>
</svg>
```
```css
.grain { position: fixed; inset: 0; pointer-events: none; mix-blend-mode: overlay; z-index: 9999; }
```

**Inner-highlight** op elevated panels:
```css
.panel {
  background: var(--bg-elev-1);
  border: 1px solid var(--border-soft);
  box-shadow: inset 0 1px 0 0 var(--highlight-inner);
}
```

### 4.5 Motion tokens
```css
--e-out:    cubic-bezier(0.22, 1, 0.36, 1);
--e-in-out: cubic-bezier(0.65, 0, 0.35, 1);
--e-spring: linear(0, 0.2 8%, 0.6 18%, 0.95 35%, 1.02 50%, 1);

--d-xs: 120ms; --d-sm: 180ms; --d: 240ms; --d-lg: 420ms; --d-count: 900ms;
```

Respect `prefers-reduced-motion`: alle durations collapsen naar 0.001ms.

---

## 5. Components (spec-level)

### 5.1 `<Hero>` (empty state)
- Volledige flex-center van drop area.
- `№ 001` label links-boven (12px mono muted, tabular).
- `RESIZER · 0.1` rechts-boven (12px mono muted).
- Hero type: twee regels, Fraunces italic `var(--t-hero)`, line-height 0.95, tracking -0.02em.
- 40px horizontal rule in `--fg-faint` onder het statement.
- Subtiele 1s fade-in bij mount (opacity 0→1).
- Drop-gesture: bij hover-over entire window, de hele hero krijgt inner-border highlight (`inset 0 0 0 1px var(--fg-faint)`) + headline shift 2px omhoog via transform.

### 5.2 `<FileCard>` (grid tile)
- 200×260 vast, rounded `--r-card`, `--bg-elev-2`.
- Layout:
  - Header row: `№ 001` (Fraunces italic 14pt) + status dot rechts.
  - Thumbnail 200×180 (object-cover), filter `saturate(1.05) contrast(1.02)` voor levendigheid.
  - Body: filename truncated (13px Inter), dimensions (11px mono muted).
  - Size-row: `4.2 MB → 820 KB` (mono tabular), savings `−81%` in accent, right-aligned.
- Hover: scale(1.01), shadow lift, cursor-pointer.
- Status:
  - queued → dot grijs
  - processing → dot + shimmer sweep (diagonal 45deg gradient, 1.2s linear infinite)
  - done → dot lime, 300ms spring scale-in check
  - error → dot danger, tooltip on hover
- Click → opens `<PreviewOverlay>`.

### 5.3 `<FileGrid>`
- `react-window` `FixedSizeGrid` met `columnCount` derived from container width:
  - Breakpoints: <640px → 2 cols, 640–880 → 3, 880–1200 → 4, >1200 → 5.
  - `columnWidth = (containerWidth - 2×padding - (cols-1)×gap) / cols`.
  - `rowHeight = 260 + gap`.
- ResizeObserver op wrapper drijft re-layout.
- Cell renderer wrapt `<FileCard>`.

### 5.4 `<PresetSelector>`
- Huidige dropdown maar typografisch geüpgraded:
  - Label in small-caps 12px tracking 0.08em: `PRESET`
  - Value in Fraunces italic 18pt: `Balanced`
  - Chevron 3px away.
- Menu: 200×auto, elevated panel, items 36px met Fraunces italic label + tiny mono description (bv. `q 82 · strip exif`).

### 5.5 `<SavingsDisplay>` (footer hero)
- Twee lagen:
  1. Number: Fraunces italic `var(--t-display)`, tabular-num, `tnum` feature on.
  2. Underline: absolute positioned 2px div, `--fg` color, `transform-origin: left`, animates `scaleX(0)→scaleX(1)` over `--d-count`.
- Number logic: gebruik `useSpring`-achtige lerp (eigen rAF loop, geen lib nodig) tussen vorige waarde en nieuwe waarde.
- Format: `8.4 MB saved` waar `8.4 MB` de animerende bytes-waarde is, `saved` statisch in italic.
- Under number: `12 files · avg −78%` (13px mono muted, tabular).

### 5.6 `<CompressButton>`
- Pill-shape, dark fill `--fg`, text `--bg`, rechter arrow `→` in Fraunces italic.
- Hover: micro-translateX(2px) op de arrow.
- Running state: text "Processing" + pulsing dot, disabled click.
- Keyboard: focus-ring 1px `--fg/40` with 2px offset.

### 5.7 `<PreviewOverlay>` (unchanged functionality, styled)
- Glass backdrop: `backdrop-filter: blur(20px)`, 90% opacity `--bg`.
- Top bar: Fraunces italic filename centered, close button top-right.
- Split slider: handle is een dunne 1px `--fg` lijn met circular 24px knob (border only), draggable.
- Bottom status bar: mono numbers links vs rechts, accent savings center.

### 5.8 `<AdvancedPanel>`
- Collapsible footer-above-footer, border-top `--border-soft`.
- Open state: 2-col grid van labeled controls; labels in small-caps 12px, values in mono.
- Slider: native range styled — track `--border`, thumb 12px circle `--fg` with accent glow on focus.

### 5.9 Grain overlay
- `<GrainOverlay />` gerenderd in App root, always-on, `z-index: 9999`, `pointer-events: none`, `mix-blend-mode: overlay`.

---

## 6. Animation Specs (timing tabel)

| Element | Trigger | Duration | Easing |
|---|---|---|---|
| Hero fade-in | mount | 600ms | `--e-out` |
| Hero → populated | first file added | 240ms | `--e-in-out` |
| Card enter | file added | 240ms, stagger 30ms | `--e-out` |
| Card hover lift | hover | 180ms | `--e-out` |
| Shimmer sweep | processing | 1200ms linear infinite | — |
| Done check scale | state=done | 300ms | `--e-spring` |
| Savings count-up | batch done | 900ms | `--e-out` |
| Underline grow | batch done | 900ms (parallel) | `--e-out` |
| Preset menu open | click | 180ms | `--e-out` |
| Preview overlay | select | 240ms | `--e-in-out` |

---

## 7. File-level implementatie-impact

**Nieuw:**
- `src/components/Hero.tsx` — empty-state editorial
- `src/components/FileCard.tsx` — vervangt grote delen van `FileRow.tsx`
- `src/components/FileGrid.tsx` — vervangt `FileList.tsx` (FixedSizeGrid)
- `src/components/SavingsDisplay.tsx` — count-up + underline
- `src/components/GrainOverlay.tsx` — SVG feTurbulence
- `src/components/CompressButton.tsx` — geïsoleerd voor state styling
- `src/lib/useCountUp.ts` — rAF lerp hook, no deps
- `src/lib/useContainerCols.ts` — ResizeObserver → col-count
- `public/fonts/` — Fraunces, Inter, JetBrains Mono woff2 subsets

**Gewijzigd:**
- `src/App.tsx` — conditional Hero vs Grid render, GrainOverlay mount
- `src/components/Footer.tsx` — integreert `<SavingsDisplay>` en `<CompressButton>`
- `src/components/PresetSelector.tsx` — typografische upgrade
- `src/components/PreviewOverlay.tsx` — glass backdrop + style-tweaks
- `src/components/AdvancedPanel.tsx` — small-caps labels + styled slider
- `src/styles.css` — design tokens, font-face declarations, font preloading
- `index.html` — `<link rel="preload">` voor critical font files
- `tailwind.config.js` — kleur-tokens uitbreiden, font-families, custom animations/easings
- `src-tauri/tauri.conf.json` — minWidth 720, minHeight 620 (van 560 → extra ruimte voor hero)

**Verwijderd:**
- `src/components/FileRow.tsx` (vervangen door FileCard + grid rendering)
- `src/components/FileList.tsx` (vervangen door FileGrid)

---

## 8. Performance Budgets

| Metric | Target | Waarom |
|---|---|---|
| Font bundle (subset woff2) | <200KB total | Desktop offline, cold start snel |
| First paint (cold) | <900ms | ~100ms hit t.o.v. v1 door fonts + grain |
| Grid 1000 files render | 60fps scroll | FixedSizeGrid virtualization |
| Grain overlay paint cost | <1ms per frame | GPU composited, fixed positioned |
| Count-up frame budget | 60fps on 4-year-old laptop | rAF, integer interp, no layout thrash |

**Grain guard:** `@media (prefers-reduced-transparency)` → grain verbergen.
**Font guard:** als woff2 load >2s → fallback systeem-serif via `font-display: swap`.

---

## 9. Acceptatiecriteria (visueel)

- [ ] Empty state toont "Resize, radically." in Fraunces italic, fluid clamp tussen 36-72pt.
- [ ] Empty state verdwijnt zodra jobs.length > 0; card-grid slides in.
- [ ] Card-grid heeft 2/3/4/5 kolommen op respectievelijk <640 / 640-880 / 880-1200 / >1200 window-width.
- [ ] 1000-file batch scrollt zichtbaar op 60fps (DevTools perf panel).
- [ ] Savings count-up animeert van vorige naar nieuwe waarde in 900ms; underline groeit parallel.
- [ ] Film-grain overlay zichtbaar op alle schermen, niet interactief, geen performance-hit.
- [ ] Inner-highlight zichtbaar aan bovenrand van elk elevated panel.
- [ ] Alle fonts laden offline (geen CDN-requests in Network tab).
- [ ] `prefers-reduced-motion: reduce` → geen count-up, geen stagger, geen shimmer.
- [ ] Preset-selector toont preset-naam in Fraunces italic.
- [ ] Compress-button arrow schuift 2px bij hover.
- [ ] Min window (720×620) rendert nog steeds hero + drop-zone zonder clipping.
- [ ] Axe-core audit: 0 violations; contrast AAA op primary text.

---

## 10. Risico's & Mitigaties (uit stress-test)

| # | Risico | Mitigatie |
|---|---|---|
| R-D1 | **Card-grid + 1000+ files = performance cliff.** | `react-window` `FixedSizeGrid` + pre-rendered dataURL thumbnails (Rust-side); alleen visible cells in DOM. |
| R-D2 | **Film-grain blend-mode duur op zwakke GPU.** | SVG feTurbulence fixed-position + `mix-blend-mode: overlay`; `prefers-reduced-transparency` → hide; tested pattern (rauno.me, linear.app). |
| R-D3 | **Fraunces variable font inflation (~180KB).** | Subset naar Latin + italic-only axis; self-host in `public/fonts/`; preload kritische weights; `font-display: swap` fallback naar system serif. |
| R-D4 | **72pt headline clipt op min window-height.** | `clamp(2.25rem, 8vw, 4.5rem)` schaalt naar 36pt op kleinste window; min-height verhoogd van 560 → 620 voor extra lucht. |
| R-D5 | **Editorial stijl kan gedateerd voelen bij verkeerde uitvoering.** | Beperk serif-gebruik tot hero + display numbers; UI-chrome blijft Inter + mono; geen ornamenten, alleen strakke typografie en whitespace. |

---

## 11. Open Vragen

Geen blocking vragen. Implementatie kan direct starten na dit document.

Opties voor later (v1.2):
- Subtle parallax op drop-zone bij cursor-beweging (opt-in).
- Custom window-decorations (Tauri custom title bar met editorial branding).
- Theme-switch (light editorial variant met cream + navy accent).

---

**Eind document.** Klaar voor implementatie.
