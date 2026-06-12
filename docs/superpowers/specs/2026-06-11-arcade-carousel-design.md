# Arcade Station v2 — Spotlight Carousel Design

**Date:** 2026-06-11
**Status:** Approved by Sandy
**Decisions made during brainstorming:**
- Layout: Spotlight Carousel (3D, focused center cabinet) — chosen over grid and horizontal aisle
- Launch: zoom into the cabinet screen — chosen over CRT overlay and in-cabinet play
- Tech: CSS 3D transforms + GSAP (Approach A) — chosen over full Three.js scene
- Slots 5 & 6: Starbucks Retro Barista + GitHub Octo-Catcher (Coming Soon)

## Goal

Replace the static 4-cabinet grid in `src/components/Arcade.tsx` with a 6-cabinet 3D spotlight carousel. Keep the coin-drop + Rubik's cube boot sequence. Make game launch/exit cinematic (zoom into/out of the cabinet screen) and build the loader as a reusable component so future games can use it for level transitions. Fully responsive.

## Components

### 1. `ArcadeCarousel` (new: `src/components/ArcadeCarousel.tsx`)

The 3D cabinet floor. Renders all entries from `GAMES` as DOM cabinets (existing `.cab` markup/styles reused) positioned in 3D:

- Container has CSS `perspective`; each cabinet gets `rotateY` + `translateX/Z` + brightness based on its offset from the focused index.
- Focused cabinet: front-and-center, scale 1, glowing marquee (CSS class `cab--focused`), full color.
- Neighbors: receded (`translateZ` negative), rotated toward center, dimmed (`brightness(0.5)`), clickable to focus.
- Navigation: ← → arrow buttons, keyboard arrows (when section in view), horizontal swipe/drag (pointer events with threshold ~40px), clicking any side cabinet.
- Every focus change: GSAP tween (~0.55s, `power3.inOut`) + `sfx.hover()` blip.
- Focused locked cabinet + START → existing shake + `sfx.locked()` buzz.
- Focused ready cabinet + START (click cabinet or START button) → launch flow.
- A `▸ START` button appears under the focused cabinet (also the tap target on mobile).
- Position indicator: 6 pixel-dots under the carousel, gold = current.

### 2. `GameShell` (new: `src/components/GameShell.tsx`)

Shared wrapper for every game launch. Owns the boot/play/exit lifecycle:

- **Phase `zoomIn`:** GSAP scales/translates a clone-overlay of the focused cabinet screen until it fills the viewport (~0.7s); page scroll locked (`overflow: hidden` on body).
- **Phase `booting`:** existing boot sequence — coin drop bounce, "INSERT COIN ▸ LOADING CARTRIDGE", `<CartridgeLoader>` (frantic Rubik cube + stepped progress bar to 100%).
- **Phase `playing`:** mounts the game component from the registry inside the CRT frame (`.crt-fx`).
- **Exit (button or ESC):** reverse zoom back to the arcade floor, same cabinet focused, scroll unlocked, `setPhase('idle')`.

### 3. `CartridgeLoader` (new: `src/components/CartridgeLoader.tsx`)

Extracted from the current inline boot overlay in `Arcade.tsx`. Props:

```ts
interface CartridgeLoaderProps {
  label?: string;        // default "INSERT COIN ▸ LOADING CARTRIDGE"
  duration?: number;     // default 3.4s, shorter (~1.2s) for level transitions
  withCoin?: boolean;    // default true; false for level transitions
  onDone: () => void;
}
```

Future games import this for level-to-level transitions — this is the reusable smooth-transition system.

### 4. Game registry (new: `src/games/registry.ts`)

```ts
import { lazy } from 'react';
export const GAME_REGISTRY: Record<string, React.LazyExoticComponent<React.ComponentType<{ onExit: () => void }>>> = {
  'pac-toe': lazy(() => import('../components/PacToe')),
  // future: 'stranger-pac', 'space-race', 'zelda-mario', 'barista', 'octo-catcher'
};
```

Lazy imports keep the main bundle lean as games are added. `GameShell` looks up the focused game's id; ids without a registry entry are unreachable (those cabinets are `ready: false`).

## Data changes (`src/data.ts`)

`GAMES` grows to 6 entries in this order:

1. `pac-toe` — Pac-Toe: Neon Arcade — ready: true (existing)
2. `stranger-pac` — Stranger Pac-Man — "Guide Eleven through the Upside Down. Demogorgons hunt in the dark." — ready: false
3. `space-race` — Galactic Speedway — "Race starfighters through asteroid fields in a galaxy far, far away." — ready: false
4. `zelda-mario` — Legend of the Mushroom Kingdom — "A hero's quest through warp pipes and dungeons." — ready: false
5. `barista` — Starbucks Retro Barista — ready: false (existing)
6. `octo-catcher` — GitHub Octo-Catcher — ready: false (existing)

(`commit-quest` is removed from the visible roster; its data can stay commented or deleted.)

Subheading text: "CLASSIC '80s ARCADE CABINETS • 6 CARTRIDGE SLOTS • INSERT COIN".

## Responsive behavior

- **Desktop (>1000px):** 5 cabinets visible (focused + 2 each side), arrows shown.
- **Tablet (601–1000px):** 3 visible (focused + 1 each side).
- **Phone (≤600px):** focused cabinet ~80vw, side cabinets peek ~10% at edges; swipe is primary navigation; arrows hidden, dots remain.
- **`prefers-reduced-motion`:** carousel focus changes and zoom become simple opacity fades; coin/cube animations skipped (progress bar only).

## Edge cases & rules

- Page scroll locks during `playing`, restores on exit.
- ESC key exits the game (same path as EXIT button).
- Keyboard arrows only steer the carousel while the Arcade section is in the viewport and no game is playing.
- Only `pac-toe` is in the registry today; all other cabinets are `ready: false` so the launch path can't hit a missing component.
- ScrollTrigger entrance animation (cabinets rising) is kept, retargeted to the carousel container.

## Verification

1. `tsc --noEmit` clean
2. `npm run build` succeeds
3. Manual check at 375px / 768px / 1280px widths: carousel navigation, launch zoom, Pac-Toe playable, exit zoom, locked shake
4. Browser console clean
5. Brutal Critic review (code correctness, stakes: PROFESSIONAL) before deploy
