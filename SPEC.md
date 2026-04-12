# Resizer — Feature Specificatie Document

**Versie:** v1.0-spec
**Datum:** 2026-04-12
**Status:** Goedgekeurd na interview + stress-test

---

## 1. Overzicht

**Resizer** is een performante Windows desktop-applicatie voor het verkleinen van bestandsformaatgrootte van afbeeldingen (JPEG, PNG) met maximaal behoud van visuele kwaliteit.

**Core value proposition:** drag-and-drop batch-compressie met slimme presets, realtime before/after preview en native Rust-performance.

**Tech stack (finaal):**
- **Framework:** Tauri v2 (Rust backend + webview frontend)
- **Frontend:** React + TypeScript + Tailwind CSS (dark-first, minimalist)
- **Image pipeline (Rust):**
  - JPEG: `mozjpeg` (via `mozjpeg-sys` of `turbojpeg` crate)
  - PNG lossy: `imagequant` (pngquant library) + `oxipng` finisher
  - PNG lossless: `oxipng`
  - Resize: `image` crate (Lanczos3 filter)
- **Concurrency:** `rayon` thread pool, configureerbaar (default = num_cpus)
- **Distributie:** GitHub Releases → NSIS installer + auto-update via `tauri-plugin-updater`
- **Signing v1:** self-signed (EV cert later)

---

## 2. User Stories

- **US-1** — Als gebruiker sleep ik een map met 50 JPEG's op de app en krijg binnen seconden dezelfde bestanden 60-80% kleiner naast de originelen.
- **US-2** — Als gebruiker kies ik het preset "Web" en zie ik per bestand live de geschatte filesize-besparing voor ik op Compress druk.
- **US-3** — Als gebruiker selecteer ik één bestand uit de lijst en zie ik een before/after split-preview om kwaliteitsverlies visueel te beoordelen.
- **US-4** — Als power-user open ik het advanced panel en stel ik quality=82, max-width=1920px, strip EXIF, in.
- **US-5** — Als gebruiker herstart ik de app en krijg ik automatisch een update-notificatie als er een nieuwe versie op GitHub staat.

---

## 3. Gedetailleerde Flow

### 3.1 Happy path (batch compress)
1. App start → lege drop-zone met preset-selector (default: **Balanced**).
2. User sleept bestanden/folder op drop-zone.
3. Frontend valideert extensies (`.jpg .jpeg .png`), itereert folders recursief.
4. Per file: Rust backend leest dimensies + filesize, genereert **estimate** (heuristic, geen volledige encode) voor huidige preset.
5. File-lijst toont: naam, originele size, estimate, preview-thumbnail.
6. User kan preset wisselen → estimates updaten live.
7. User klikt **Compress** → rayon pool verwerkt files parallel.
8. Per completed file: resultaat in-place in lijst vervangen (origineel KB → nieuwe KB + % saved + groene check).
9. Footer toont totale besparing: `12 files • saved 8.4 MB`.

### 3.2 Single-file preview flow
1. User klikt op file in lijst → detail-view opent.
2. Split-view: left origineel, right preview met huidige preset toegepast.
3. Slider-overlay om before/after te vergelijken.
4. Advanced panel accordion: quality slider (0-100), max-width/height, lossless toggle (PNG), strip metadata toggle.
5. Wijzigingen → debounced re-encode van preview (niet van output-file).

### 3.3 Output handling
- Default: `photo.jpg` → `photo-compressed.jpg` naast origineel.
- Conflict: `photo-compressed.jpg` bestaat → `photo-compressed-2.jpg`, incrementeel.
- Origineel blijft **altijd** ongewijzigd.

---

## 4. Datamodel

### 4.1 In-memory (frontend state)
```ts
type ImageJob = {
  id: string;               // uuid
  path: string;             // absoluut pad naar origineel
  name: string;
  format: 'jpeg' | 'png';
  originalSize: number;     // bytes
  dimensions: { w: number; h: number };
  estimatedSize: number | null;
  status: 'queued' | 'processing' | 'done' | 'error' | 'skipped';
  outputPath?: string;
  outputSize?: number;
  errorMessage?: string;
  thumbnailDataUrl?: string; // 200px preview
}

type Preset = 'web' | 'balanced' | 'max-quality' | 'custom';

type Settings = {
  preset: Preset;
  custom: {
    jpegQuality: number;       // 50-95
    pngLossy: boolean;         // default true
    pngQuality: [number, number]; // pngquant min/max (e.g. [65, 80])
    maxWidth: number | null;
    maxHeight: number | null;
    stripMetadata: boolean;    // default true
  };
  concurrency: number;         // default = num_cpus
}
```

### 4.2 Preset waarden (concreet)
| Preset | JPEG q | PNG lossy q | Resize | Metadata |
|---|---|---|---|---|
| Web | 75 | [60, 75] | max 1920px | strip |
| Balanced (default) | 82 | [70, 85] | none | strip |
| Max quality | 92 | lossless (oxipng) | none | keep |

### 4.3 Persistente config
- Locatie: `%APPDATA%/Resizer/config.json` via `tauri-plugin-store`.
- Inhoud: laatste gekozen preset, custom-overrides, concurrency-setting, window-size.
- Geen user-data/history (v1 scope).

---

## 5. Business Rules

- **BR-1** Origineel wordt nooit overschreven of verplaatst.
- **BR-2** Bij output-conflict: auto-increment suffix, nooit dialog onderbreken.
- **BR-3** Preset "Max quality" voor PNG → altijd lossless (oxipng), lossy-toggle wordt genegeerd.
- **BR-4** Files >50MB of >4000×4000px → categorized als "heavy"; max 2 heavy files tegelijk verwerken, rest queued (OOM-protectie).
- **BR-5** Onondersteund format (gif, webp, bmp, tiff, raw) → skip met duidelijke error in lijst, batch gaat door.
- **BR-6** Corrupt/unreadable file → status `error`, originele file blijft, batch gaat door.
- **BR-7** Output-file wordt alleen geschreven als nieuwe size < originele size; anders status `skipped` met reason "already optimal".
- **BR-8** EXIF/ICC: default strip. Toggle "Preserve metadata" in advanced panel behoudt ICC-profile én EXIF-orientatie (cruciaal).

---

## 6. Edge Cases

| # | Case | Gedrag |
|---|---|---|
| EC-1 | Drop van folder met 10.000 files | Progressive load, UI blijft responsive; virtualized list (react-window). |
| EC-2 | File wordt verwijderd tijdens processing | Status `error` met "file no longer exists". |
| EC-3 | Output-pad niet schrijfbaar (readonly folder) | Status `error` met pad + OS-error. |
| EC-4 | Disk full tijdens batch | Stop batch, melding, reeds-verwerkte files blijven. |
| EC-5 | Zeer kleine file (<5KB) | Skip met "already small enough". |
| EC-6 | PNG met alpha-channel + lossy | imagequant behoudt alpha; geen flattening. |
| EC-7 | Animated PNG (APNG) | Detecteer, skip met duidelijke melding (v1 geen APNG-support). |
| EC-8 | CMYK JPEG | Convert naar sRGB voor encoding, waarschuw in tooltip. |
| EC-9 | EXIF-orientation tag | Bij strip: apply rotation to pixels eerst, dan strip. |
| EC-10 | Duplicate files in drop | Dedupe op absoluut pad; toon waarschuwing count. |

---

## 7. UI/UX Specificatie

### 7.1 Design philosophy
**Dark-first, mono accent, intentional minimalism.** Drop-zone is het hero-element. Geen chrome, geen sidebar, geen toolbar-clutter. Alles wat niet actief bijdraagt wordt verborgen tot het nodig is.

### 7.2 Layout (hoofdscherm)
```
┌─────────────────────────────────────┐
│  resizer              [Balanced ▾] │  ← 64px header, logo links, preset rechts
│                                     │
│   ╭─────────────────────────────╮   │  ← drop-zone, 2px dashed border
│   │                             │   │     bij hover: solid + subtle glow
│   │      drop images here       │   │
│   │   or click to browse        │   │
│   │                             │   │
│   ╰─────────────────────────────╯   │
│                                     │
│   [file list appears here]          │
│                                     │
│  12 files • saved 8.4 MB   [✱]     │  ← footer, rechts settings-gear
└─────────────────────────────────────┘
```

### 7.3 File-list item
- Row height: 56px.
- Thumbnail 40×40 links, naam + dimensions midden, `3.2MB → 640KB · 80%` rechts.
- Status-indicator: spinner (processing), groene check (done), rode dot + tooltip (error).
- Click → opent detail/preview overlay.

### 7.4 Kleuren & typografie
- **Background:** `#0A0A0A` (near-black, niet pure black voor OLED comfort)
- **Surface:** `#141414`
- **Border:** `#262626`
- **Text primary:** `#FAFAFA`
- **Text muted:** `#737373`
- **Accent (mono):** `#FFFFFF` op interactieve elementen; savings-indicator in `#84CC16` (lime-500, enig kleuraccent).
- **Error:** `#F87171`
- **Font:** **Inter** variable (400/500/600) voor UI; **JetBrains Mono** voor filesizes/getallen.

### 7.5 Micro-interactions
- Drop-zone: border-dash animeert subtiel op hover.
- File-item "done": subtle scale 1.0→1.02→1.0 + lime-border flash (200ms).
- Preset-switch: estimates fade-in (150ms stagger per row).
- Preview slider: native pointer, geen lag (requestAnimationFrame throttled).

### 7.6 Icons
**Lucide React** (`lucide-react`). Specifiek: `Upload`, `Settings`, `ChevronDown`, `Check`, `AlertCircle`, `Image`, `X`, `Plus`, `Minus`.

### 7.7 Accessibility
- Alle interactieve elementen keyboard-reachable (tab order logisch).
- Drop-zone heeft fallback **Browse** button.
- Contrast WCAG AA minimum (mono-palette haalt AAA voor primary text).
- Screen-reader labels op alle icon-only buttons.
- `prefers-reduced-motion` → skip scale/flash animaties.

---

## 8. Technische Vereisten

### 8.1 Project structuur
```
resizer/
├── src-tauri/            # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands.rs   # #[tauri::command] endpoints
│   │   ├── pipeline/
│   │   │   ├── jpeg.rs   # mozjpeg encode
│   │   │   ├── png.rs    # imagequant + oxipng
│   │   │   ├── resize.rs
│   │   │   └── estimate.rs
│   │   ├── scheduler.rs  # rayon pool + heavy-file gating
│   │   └── output.rs     # conflict-resolution, atomic write
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                  # React frontend
│   ├── App.tsx
│   ├── components/
│   ├── state/            # Zustand store
│   ├── lib/
│   └── styles/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── .github/workflows/
│   └── release.yml       # build + sign + draft release
├── README.md
├── LICENSE (MIT)
└── SPEC.md               # dit document
```

### 8.2 Rust crates (hoofdzaken)
```toml
[dependencies]
tauri = { version = "2", features = ["updater"] }
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
tauri-plugin-store = "2"
tauri-plugin-updater = "2"
mozjpeg = "0.10"
imagequant = "4"
oxipng = "9"
image = { version = "0.25", default-features = false, features = ["png", "jpeg"] }
rayon = "1"
rexiv2 = "0.10"          # EXIF read/strip
serde = { version = "1", features = ["derive"] }
uuid = { version = "1", features = ["v4"] }
thiserror = "1"
```

### 8.3 Frontend dependencies
```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "@tauri-apps/api": "^2",
    "zustand": "^4",
    "react-window": "^1",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "vite": "^5",
    "@vitejs/plugin-react": "^4",
    "typescript": "^5",
    "tailwindcss": "^3",
    "@tauri-apps/cli": "^2"
  }
}
```

### 8.4 Performance targets
- **Cold start:** <800ms op moderne hardware.
- **JPEG 12MP → quality 82:** <500ms single-threaded, <150ms avg op 8-core batch.
- **PNG 12MP → lossy:** <1200ms single-threaded.
- **Idle RAM:** <80MB.
- **Peak RAM tijdens batch van 50 × 12MP:** <1.5GB (door heavy-file gating).
- **UI frame rate tijdens batch:** ≥55fps (processing volledig off main thread via Rust).

### 8.5 Concurrency model
- Rayon `ThreadPoolBuilder` met `num_threads = settings.concurrency`.
- **Heavy-file gate:** `Semaphore(2)` voor files >50MB of >4000×4000; lichte files geen cap.
- Progress reporting via Tauri events (`emit("job-progress", { id, status })`) — throttled op 30Hz.
- Preview-encodes draaien op **aparte** single-threaded pool om batch niet te vertragen.

### 8.6 Build & release pipeline (GitHub Actions)
```yaml
# .github/workflows/release.yml (essence)
on:
  push:
    tags: ['v*']
jobs:
  build:
    runs-on: windows-latest
    steps:
      - checkout
      - setup-rust (stable)
      - setup-node (20)
      - install mozjpeg build deps (nasm)
      - npm ci
      - npm run tauri build
      - sign MSI (self-signed cert uit secret)
      - create GitHub Release (draft) met .msi + latest.json
```

### 8.7 Auto-update flow
- `tauri-plugin-updater` checkt `https://github.com/<user>/resizer/releases/latest/download/latest.json` bij start.
- Update-found → toast met "Update available · Install on restart".
- Download + verify signature → install on next launch.

---

## 9. Acceptatiecriteria

- [ ] App bouwt op Windows 10/11 x64 via `npm run tauri build` zonder warnings.
- [ ] Installer (.msi) installeert zonder admin-rechten (per-user).
- [ ] Drag-drop van map met 50 gemengde JPEG/PNG's levert 50 compressed outputs naast originelen.
- [ ] Preset-switch update estimates binnen 200ms voor 100-file lijst.
- [ ] Before/after preview toont correct onder quality-wijzigingen.
- [ ] Batch van 100 × 5MP JPEG's voltooit <20s op 8-core machine.
- [ ] Peak RAM <1.5GB bij heavy-batch (50 × 12MP PNG).
- [ ] Cancel-button stopt batch binnen 1s; reeds-verwerkte files blijven, queued files worden niet aangemaakt.
- [ ] Output-conflict resolveert naar `-compressed-N.jpg` zonder user-prompt.
- [ ] Origineel-hash ongewijzigd na complete batch (integrity check in test-suite).
- [ ] EXIF strip default; toggle behoudt EXIF + ICC + orientation correct.
- [ ] Auto-updater detecteert dummy-release en toont prompt.
- [ ] Keyboard-only flow: tab naar drop-zone → enter → file-picker → pijltoetsen door lijst → enter opent preview.
- [ ] Lighthouse-style accessibility audit op frontend: score ≥95.

---

## 10. Risico's & Mitigaties (uit stress-test)

| # | Risico | Mitigatie |
|---|---|---|
| R-1 | **PNG lossless geeft te weinig besparing → user teleurstelling.** | Default lossy (imagequant) + oxipng finisher; lossless alleen in Max-quality preset of via toggle. Tooltip legt trade-off uit. |
| R-2 | **Output-conflict dialogs breken batch-flow bij grote sets.** | Auto-increment suffix (`-compressed-2.jpg`); nooit dialogs, resultaat zichtbaar in lijst. |
| R-3 | **OOM-crash op zware batches (100MP files, low-RAM machines).** | Heavy-file detectie >50MB/>16MP; Semaphore(2) throttle voor heavy-files, streaming decode waar mogelijk. |
| R-4 | **SmartScreen warning schrikt users af (unsigned installer).** | v1 self-signed + README-uitleg + "More info → Run anyway" instructies. EV cert overwegen bij >1k downloads. |
| R-5 | **Tauri webview ≠ garantie voor 60fps bij grote file-lijsten.** | `react-window` virtualized list; event-throttling op 30Hz; preview-encode op aparte pool. |
| R-6 | **mozjpeg build op Windows vereist NASM → CI-friction.** | Pin NASM in GitHub Action setup-step; documenteer voor lokale dev-setup. |
| R-7 | **EXIF-orientation lost data bij naïve strip.** | Pipeline: lees orientation → roteer pixels → strip EXIF. Integration-test met 8 orientation-variants. |

---

## 11. Open Vragen

Geen blocking vragen. Volgende beslissingen verplaatst naar post-v1:
- Context menu in Windows Explorer (v1.1).
- CLI binary (v1.1).
- WebP/AVIF support (v2).
- Mac/Linux builds (v2 — Tauri maakt dit triviaal).
- Animated PNG / GIF support (v2).
- Batch history + undo (v2).

---

**Eind document.** Klaar voor implementatie door coding agent.
