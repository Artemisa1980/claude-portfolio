# SANDY.SYSDEV v2.0 — Retro Dev-Station

Awwwards-style retro arcade portfolio for **Sandy E. Quintero**, rebuilt from the ground up
with **React 19 + GSAP (ScrollTrigger) + Three.js**, themed on the sanblue logo palette
(navy, gold, pink, mint, cyan, purple) fused with '80s CRT arcade aesthetics.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production bundle in dist/
```

## What's inside

| Section | Interaction |
| --- | --- |
| Preloader | CRT boot sequence (SANDY_OS BIOS check + progress bar) |
| Hero | Pixel starfield canvas, typewriter, **interactive 3D Rubik's cube** — drag to spin, click to twist a layer |
| Arcade Station | Click the READY cabinet → coin drop → **Rubik's cube cartridge loader** → playable **Pac-Toe** vs ghost AI. Locked cabinets shake. |
| Reception Desk | Bio, languages, certification vault, education cards — GSAP scroll reveals |
| Analytics Desk | Compound interest calculator with animated counters + live SVG growth chart |
| Career Timeline | Scroll-scrubbed gradient rail, alternating XP cards |
| Skill Matrix | Animated dashed-gradient power bars with count-up scores |
| TV Studio | Working CRT static (canvas noise), rotating channel knob, power switch, 4 channels |
| System Room | GitHub contribution grid (staggered pop-in), typed commit console, **Mail Room Terminal** with typed STDOUT + mailto |

All sound effects are synthesized WebAudio chiptune beeps (no assets); mute toggle in the header.
