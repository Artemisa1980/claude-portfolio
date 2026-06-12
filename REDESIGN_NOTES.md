# Redesign Notes — SANDY.SYSDEV v2.0

**Date:** June 11, 2026
**Built with:** Claude Code (Fable 5)
**Location:** `claude-portfolio/` (the original site in `../retro-arcade-portfolio/` was left untouched)

---

## 1. What was asked

> "Redesign this website, create an awwwards-worthy retro profile, make it interactive and engaging,
> created by a UI/UX designer using GSAP and/or Three.js to create a visually captivating experience.
> Enhance the retro vibe. Combine the logo's colors and the website with retro palette colors.
> When people click on Arcade Station, make it feel like a real arcade game that loads, starting with
> a Rubik's cube with interaction when you click. Make every section wow and awesome to interact with."

Broken into concrete requirements:

| # | Requirement | Status |
| --- | --- | --- |
| 1 | Full redesign of the existing retro portfolio | ✅ Done |
| 2 | Awwwards-style, interactive and engaging | ✅ Done |
| 3 | Use GSAP and/or Three.js | ✅ Both used |
| 4 | Enhance the retro vibe | ✅ CRT effects, pixel fonts, chiptune sfx |
| 5 | Combine the sanblue logo colors with a retro palette | ✅ Palette extracted from logo |
| 6 | Arcade Station click = real arcade boot/loading experience | ✅ Coin drop → cartridge loader → game |
| 7 | Rubik's cube with click interaction | ✅ Two interactive 3D cubes |
| 8 | Every section interactive ("wow") | ✅ See section list below |

---

## 2. What existed before

The previous version lives in `../retro-arcade-portfolio/`:
React 19 + Tailwind 4 + Vite, deployed to Firebase Hosting. It had a header with live clock,
an Arcade Station with 4 static game cards (only Pac-Toe active), a Reception Desk biography,
an Executive Analytics Desk (compound interest calculator), a TV Broadcasting Studio with
4 channels, a GitHub activity grid with commit console, a Mail Room Terminal, and a footer.
Its `designs/` folder holds the sanblue logo PNGs and reference screenshots.

---

## 3. What was built (this project)

### Stack

- **React 19 + Vite 6 + TypeScript** — fresh scaffold, no Tailwind; all CSS handcrafted in `src/styles.css`
- **GSAP 3 + ScrollTrigger** — entrances, scroll-scrubbed timeline, counters, marquee, boot sequence
- **Three.js** — the interactive Rubik's cubes (`src/components/RubikCube.tsx`)
- **WebAudio chiptune engine** (`src/sound.ts`) — every sound is synthesized, zero audio assets; mute toggle in header

### Design system (from the sanblue logo)

| Token | Value | Source |
| --- | --- | --- |
| Navy | `#131a43` | Logo background |
| Cream | `#f2edda` | Original site paper background |
| Gold | `#f7c948` | "sanblue" wordmark |
| Pink | `#ff6ea9` | "RETRO DEV-STATION" text / hexagon gradient |
| Mint | `#5eead4` | Sprout / hexagon gradient |
| Cyan | `#67e8f9` | "dot" / hexagon gradient |
| Purple | `#a78bfa` | Hexagon gradient |

Typography: **Press Start 2P** (pixel headings), **VT323** (terminal text), **Space Grotesk** (body).
Shared retro treatments: scanline + vignette CRT overlays (`.crt-fx`), hard offset shadows, pixel-step easings.

### Sections & interactions

1. **Preloader** — SANDY_OS BIOS boot: typed system checks, striped progress bar, slide-up reveal.
2. **Header** — fixed, shrinks on scroll, live clock, anchor nav, LinkedIn link, sound mute toggle.
3. **Hero** — pixel starfield (2D canvas), gradient pixel headline, looping typewriter, and the
   **interactive Three.js Rubik's cube**: drag to spin with inertia, click to twist a random layer
   (real 90° layer rotation with snap-back math), painted in the 6 brand colors.
4. **Marquee strip** — infinite GSAP ticker with career highlights.
5. **Arcade Station** — 4 CSS-built arcade cabinets that rise in on scroll.
   Clicking the READY cabinet triggers the **arcade boot sequence**:
   coin drops & bounces → "INSERT COIN ▸ LOADING CARTRIDGE" → a second, frantically
   auto-twisting Rubik's cube as the loader (clickable "to help") → stepped progress bar to 100%
   → **Pac-Toe** opens in a CRT frame. Locked cabinets shake with a buzz sound.
6. **Pac-Toe game** — playable tic-tac-toe vs a ghost AI (wins when possible, blocks threats,
   prefers center), win-line glow, score tracking across rounds, victory/defeat jingles.
7. **Reception Desk** — bio card, languages, quote, certification vault (slide-in cards),
   education grid; all GSAP scroll-revealed.
8. **Executive Analytics Desk** — compound interest calculator with three sliders,
   GSAP-animated money counters, and a **live SVG growth curve** that redraws on input;
   study files list preserved from v1.
9. **Career Timeline** — gradient rail that draws itself as you scroll (scrubbed), alternating
   XP cards for Starbucks / JW Marriott / Hilton / Pax.
10. **Skill Matrix** — dashed-gradient power bars that fill on scroll with count-up `/100` scores.
11. **TV Broadcasting Studio** — wooden CRT set with **real static noise** (per-frame canvas),
    channel knob that physically rotates per channel, working power switch, 4 channels + synopsis.
12. **System Room** — GitHub contribution grid (112 cells popping in with random stagger),
    typed commit console, and the **Mail Room Terminal**: terminal-styled form with typed STDOUT
    feedback that opens the visitor's mail client; copy-email / LinkedIn shortcuts.
13. **Footer** — credits, host info, chiptune back-to-top.

### Content

All real data carried over from the original `data.ts`: profile, bio, languages, 4 games,
4 jobs, 6 certifications, 4 education entries, 8 skills, 4 TV channels, commit history
(plus one new commit entry for the v2 launch).

---

## 4. Verification performed

- `tsc --noEmit` — clean, no type errors
- `npm run build` — production build succeeds (~241 kB gzipped JS)
- Dev server run via preview on port 3000; screenshot-verified: hero + cube, arcade cabinets,
  boot sequence, Pac-Toe gameplay, Reception Desk, Analytics chart, Skill Matrix
- DOM-checked remaining sections (TV noise canvas, 4 channels, 112 grid cells, console lines,
  mail form, footer); browser console clean — zero errors/warnings

---

## 5. Ideas for next steps

- Build out a locked cabinet as a real minigame (Starbucks Retro Barista would be a signature piece)
- Deploy `dist/` to the existing Firebase Hosting setup from v1
- Wire the GitHub grid to the real GitHub contributions API
- Add an Easter egg: Konami code unlocks a secret channel on the TV
