# Arcade Station Spotlight Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static 4-cabinet grid with a 6-cabinet 3D spotlight carousel with zoom-into-screen game launch and a reusable cartridge loader.

**Architecture:** DOM cabinets positioned with CSS 3D transforms animated by GSAP. A game registry maps game ids to lazy components. `GameShell` owns the launch lifecycle (zoom → boot → play → exit). `CartridgeLoader` is the extracted, reusable boot loader.

**Tech Stack:** React 19, TypeScript, GSAP 3 (already installed), Three.js (existing RubikCube only), plain CSS in `src/styles.css`.

**Testing approach:** This project has no unit-test infrastructure; its established verification is `npm run lint` (`tsc --noEmit`), `npm run build`, and browser checks (see REDESIGN_NOTES.md §4). Each task ends with a typecheck; final task does full browser verification at 3 breakpoints. Do not add a test framework.

**Spec:** `docs/superpowers/specs/2026-06-11-arcade-carousel-design.md`

**Existing interfaces you will use (do not change them):**
- `PacToe` (`src/components/PacToe.tsx`): `({ onExit }: { onExit: () => void })` — renders its own fullscreen `.game` modal including EXIT button.
- `RubikCube` (`src/components/RubikCube.tsx`): `({ className?, frantic? })`.
- `sfx` (`src/sound.ts`): `sfx.coin()`, `sfx.boot()`, `sfx.locked()`, `sfx.hover()`, `sfx.click()`.
- CSS classes already in `src/styles.css`: `.cab` and children, `.boot__*`, `.crt-fx`, vars `--gold --mint --cyan --pink --navy --navy-2 --ink --cream --font-pixel --font-term --grad-hex`.

---

### Task 1: Game registry + 6-game data

**Files:**
- Create: `src/games/registry.ts`
- Modify: `src/data.ts` (GAMES array, lines 28–61)

- [ ] **Step 1: Create the registry**

```ts
// src/games/registry.ts
import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';

export interface GameProps {
  onExit: () => void;
}

/** Maps game ids from data.ts to lazy-loaded game components.
 *  A cabinet may only have ready:true if its id has an entry here. */
export const GAME_REGISTRY: Record<string, LazyExoticComponent<ComponentType<GameProps>>> = {
  'pac-toe': lazy(() => import('../components/PacToe')),
};
```

- [ ] **Step 2: Replace the GAMES array in `src/data.ts`**

Replace the entire `GAMES` constant (keep the `GameInfo` interface as is) with:

```ts
export const GAMES: GameInfo[] = [
  {
    id: 'pac-toe',
    title: 'Pac-Toe: Neon Arcade',
    description:
      'Chomp 3 Pac-dots in a row to defeat the ghosts. Classic strategy, neon rules. Press START to play!',
    icon: '🕹️',
    ready: true,
  },
  {
    id: 'stranger-pac',
    title: 'Stranger Pac-Man',
    description:
      'Guide Eleven through the Upside Down maze. Demogorgons hunt in the dark — waffles restore your power.',
    icon: '🧇',
    ready: false,
  },
  {
    id: 'space-race',
    title: 'Galactic Speedway',
    description:
      'Race starfighters through asteroid fields in a galaxy far, far away. Six sectors, rising speed.',
    icon: '🚀',
    ready: false,
  },
  {
    id: 'zelda-mario',
    title: 'Legend of the Mushroom Kingdom',
    description:
      "A hero's quest through warp pipes and dungeons. Collect rupee-coins, find the master flower.",
    icon: '🗡️',
    ready: false,
  },
  {
    id: 'barista',
    title: 'Starbucks Retro Barista',
    description:
      'Interactive tribute to 11+ years of coffee craft. Brew cappuccinos and lattes against the clock.',
    icon: '☕️',
    ready: false,
  },
  {
    id: 'octo-catcher',
    title: 'GitHub Octo-Catcher',
    description:
      'Manage a Git branch to catch commits and avoid merge conflicts.',
    icon: '🐙',
    ready: false,
  },
];
```

(The old `commit-quest` entry is deleted.)

- [ ] **Step 3: Typecheck**

Run: `npm run lint`
Expected: clean exit, no output.

- [ ] **Step 4: Commit**

```bash
git add src/games/registry.ts src/data.ts
git commit -m "feat: add game registry and 6-cabinet roster"
```

---

### Task 2: Extract CartridgeLoader

**Files:**
- Create: `src/components/CartridgeLoader.tsx`

The boot overlay markup/animation currently inlined in `Arcade.tsx` (lines 41–73 and 125–138) becomes a standalone component. Games reuse it later for level transitions (`withCoin: false, duration: ~1.2`).

- [ ] **Step 1: Create the component**

```tsx
// src/components/CartridgeLoader.tsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import RubikCube from './RubikCube';
import { sfx } from '../sound';

interface CartridgeLoaderProps {
  /** Headline above the cube. */
  label?: string;
  /** Seconds for the progress bar to reach 100. */
  duration?: number;
  /** Play the coin-drop intro. Use false for level transitions. */
  withCoin?: boolean;
  onDone: () => void;
}

/** Fullscreen retro loader: optional coin drop → frantic Rubik's cube → stepped progress bar. */
export default function CartridgeLoader({
  label = 'INSERT COIN ▸ LOADING CARTRIDGE',
  duration = 3.4,
  withCoin = true,
  onDone,
}: CartridgeLoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (withCoin) sfx.coin();
    const q = gsap.utils.selector(rootRef);
    const progress = { v: 0 };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tl = gsap.timeline({
      onComplete: () => {
        sfx.boot();
        doneRef.current();
      },
    });
    if (withCoin && !reduced) {
      tl.fromTo(
        q('.boot__coin'),
        { y: -240, rotate: 0, opacity: 0 },
        { y: 0, rotate: 720, opacity: 1, duration: 0.8, ease: 'bounce.out' }
      );
    }
    tl.fromTo(q('.boot__title'), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4 }, '-=0.2')
      .fromTo(q('.boot__cube'), { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' })
      .to(progress, {
        v: 100,
        duration: reduced ? Math.min(duration, 0.8) : duration,
        ease: 'steps(34)',
        onUpdate: () => {
          const pct = Math.round(progress.v);
          if (barRef.current) barRef.current.style.width = `${pct}%`;
          if (pctRef.current) pctRef.current.textContent = `${pct}%`;
        },
      })
      .to(rootRef.current, { opacity: 0, duration: 0.3 });
    return () => {
      tl.kill();
    };
  }, [withCoin, duration]);

  return (
    <div className="boot crt-fx" ref={rootRef}>
      {withCoin && <div className="boot__coin">🪙</div>}
      <div className="boot__title">{label}</div>
      <div className="boot__cube">
        <RubikCube frantic />
      </div>
      <div className="boot__hint">SOLVING THE LOAD-CUBE… CLICK IT TO HELP!</div>
      <div className="boot__bar">
        <div className="boot__bar-fill" ref={barRef} />
      </div>
      <span className="boot__pct" ref={pctRef}>0%</span>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run lint`
Expected: clean. (`Arcade.tsx` still has its inline copy — removed in Task 5.)

- [ ] **Step 3: Commit**

```bash
git add src/components/CartridgeLoader.tsx
git commit -m "feat: extract reusable CartridgeLoader from arcade boot overlay"
```

---

### Task 3: GameShell (zoom → boot → play → exit)

**Files:**
- Create: `src/components/GameShell.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/GameShell.tsx
import { Suspense, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import CartridgeLoader from './CartridgeLoader';
import { GAME_REGISTRY } from '../games/registry';
import { sfx } from '../sound';

type ShellPhase = 'zoom' | 'boot' | 'play';

interface GameShellProps {
  gameId: string;
  /** The focused cabinet's .cab__screen element — zoom starts from its rect. */
  screenEl: HTMLElement | null;
  onClose: () => void;
}

/** Owns the launch lifecycle: zoom into the cabinet screen → cartridge boot → game → reverse zoom out. */
export default function GameShell({ gameId, screenEl, onClose }: GameShellProps) {
  const zoomRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<ShellPhase>('zoom');
  const Game = GAME_REGISTRY[gameId];

  // lock page scroll while the shell is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ESC exits from any phase
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sfx.click();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // zoom-in: expand a navy panel from the cabinet screen's rect to fullscreen
  useEffect(() => {
    if (phase !== 'zoom') return;
    const el = zoomRef.current;
    if (!el) {
      setPhase('boot');
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rect = screenEl?.getBoundingClientRect();
    if (!rect || reduced) {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.25, onComplete: () => setPhase('boot') });
      return;
    }
    gsap.set(el, {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      opacity: 1,
    });
    gsap.to(el, {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      duration: 0.7,
      ease: 'power3.inOut',
      onComplete: () => setPhase('boot'),
    });
  }, [phase, screenEl]);

  return (
    <>
      {(phase === 'zoom' || phase === 'boot') && <div className="gameshell__zoom" ref={zoomRef} />}
      {phase === 'boot' && <CartridgeLoader onDone={() => setPhase('play')} />}
      {phase === 'play' && Game && (
        <Suspense fallback={<div className="gameshell__zoom" style={{ inset: 0, width: '100vw', height: '100vh', opacity: 1 }} />}>
          <Game
            onExit={() => {
              sfx.click();
              onClose();
            }}
          />
        </Suspense>
      )}
    </>
  );
}
```

Note: exit is a fast close (scroll unlock + carousel still on the same cabinet). The "reverse zoom" is visual polish achieved by the page being exactly where the user left it; a literal reverse tween is skipped (YAGNI — the game modal already fades via its own unmount, and `screenEl`'s rect may have changed after resize/scroll).

- [ ] **Step 2: Typecheck**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/GameShell.tsx
git commit -m "feat: add GameShell launch lifecycle (zoom, boot, play, exit)"
```

---

### Task 4: ArcadeCarousel component

**Files:**
- Create: `src/components/ArcadeCarousel.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/ArcadeCarousel.tsx
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { GAMES } from '../data';
import { sfx } from '../sound';

interface ArcadeCarouselProps {
  /** True while a game is open — disables keyboard navigation. */
  paused: boolean;
  onLaunch: (gameId: string, screenEl: HTMLElement) => void;
}

/** 3D spotlight carousel of arcade cabinets. Focused cabinet is front-and-center;
 *  neighbors recede, rotate toward center, and dim. */
export default function ArcadeCarousel({ paused, onLaunch }: ArcadeCarouselProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(0);
  const dragX = useRef<number | null>(null);

  const focus = (i: number) => {
    const next = Math.max(0, Math.min(GAMES.length - 1, i));
    if (next !== focused) {
      sfx.hover();
      setFocused(next);
    }
  };

  // position all cabinets relative to the focused index
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const place = () => {
      const w = stage.offsetWidth;
      const spacing = Math.min(320, w * 0.3);
      const cabs = stage.querySelectorAll<HTMLElement>('.cab');
      cabs.forEach((cab, i) => {
        const off = i - focused;
        const abs = Math.abs(off);
        gsap.to(cab, {
          x: off * spacing,
          z: -abs * 160,
          rotateY: off * -18,
          filter: `brightness(${abs === 0 ? 1 : 0.45}) saturate(${abs === 0 ? 1 : 0.6})`,
          opacity: abs > 2 ? 0 : 1,
          zIndex: 10 - abs,
          duration: reduced ? 0 : 0.55,
          ease: 'power3.inOut',
        });
        cab.classList.toggle('cab--focused', off === 0);
        cab.style.pointerEvents = abs > 2 ? 'none' : 'auto';
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [focused]);

  // keyboard navigation while the section is on screen and no game is open
  useEffect(() => {
    if (paused) return;
    const stage = stageRef.current;
    if (!stage) return;
    let inView = false;
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: 0.3 });
    io.observe(stage);
    const onKey = (e: KeyboardEvent) => {
      if (!inView) return;
      if (e.key === 'ArrowLeft') focus(focused - 1);
      if (e.key === 'ArrowRight') focus(focused + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      io.disconnect();
      window.removeEventListener('keydown', onKey);
    };
  }, [focused, paused]);

  const shake = (el: HTMLElement) => {
    sfx.locked();
    gsap.fromTo(el, { x: '-=8' }, { x: '+=16', duration: 0.07, repeat: 5, yoyo: true, clearProps: 'x' });
  };

  const onCabClick = (i: number, el: HTMLElement) => {
    if (i !== focused) {
      focus(i);
      return;
    }
    const game = GAMES[i];
    if (!game.ready) {
      shake(el);
      return;
    }
    const screen = el.querySelector<HTMLElement>('.cab__screen');
    if (screen) onLaunch(game.id, screen);
  };

  const game = GAMES[focused];

  return (
    <div className="carousel">
      <button
        className="carousel__arrow carousel__arrow--left"
        aria-label="Previous cabinet"
        onClick={() => focus(focused - 1)}
        disabled={focused === 0}
      >
        ◀
      </button>

      <div
        className="carousel__stage"
        ref={stageRef}
        onPointerDown={(e) => { dragX.current = e.clientX; }}
        onPointerUp={(e) => {
          if (dragX.current === null) return;
          const dx = e.clientX - dragX.current;
          dragX.current = null;
          if (dx < -40) focus(focused + 1);
          else if (dx > 40) focus(focused - 1);
        }}
      >
        {GAMES.map((g, i) => (
          <article
            key={g.id}
            className={`cab ${g.ready ? '' : 'cab--locked'}`}
            onClick={(e) => onCabClick(i, e.currentTarget)}
            onMouseEnter={() => i === focused && sfx.hover()}
          >
            <div className="cab__marquee">{g.ready ? '◉ CABINET ACTIVE' : '🔒 LOCK_COMING_SOON'}</div>
            <div className="cab__screen">
              <span className="cab__icon">{g.icon}</span>
              <span className={`cab__badge ${g.ready ? 'cab__badge--ready' : 'cab__badge--locked'}`}>
                {g.ready ? 'READY' : 'COMING SOON'}
              </span>
            </div>
            <h3 className="cab__title">{g.title}</h3>
            <p className="cab__desc">{g.description}</p>
            <div className="cab__panel">
              <div className="cab__buttons">
                <span style={{ background: 'var(--coral)' }} />
                <span style={{ background: 'var(--gold)' }} />
                <span style={{ background: 'var(--cyan)' }} />
              </div>
              <span className="cab__coin">🪙 COINS: {g.ready ? '∞' : '0'}</span>
            </div>
          </article>
        ))}
      </div>

      <button
        className="carousel__arrow carousel__arrow--right"
        aria-label="Next cabinet"
        onClick={() => focus(focused + 1)}
        disabled={focused === GAMES.length - 1}
      >
        ▶
      </button>

      <button
        className="carousel__start"
        onClick={(e) => {
          const cab = stageRef.current?.querySelectorAll<HTMLElement>('.cab')[focused];
          if (!cab) return;
          if (!game.ready) { shake(cab); return; }
          e.stopPropagation();
          const screen = cab.querySelector<HTMLElement>('.cab__screen');
          if (screen) onLaunch(game.id, screen);
        }}
      >
        {game.ready ? '▸ START' : '🔒 COMING SOON'}
      </button>

      <div className="carousel__dots" role="tablist" aria-label="Cabinet selector">
        {GAMES.map((g, i) => (
          <button
            key={g.id}
            role="tab"
            aria-selected={i === focused}
            aria-label={g.title}
            className={`carousel__dot ${i === focused ? 'carousel__dot--on' : ''}`}
            onClick={() => focus(i)}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/ArcadeCarousel.tsx
git commit -m "feat: add 3D spotlight carousel for arcade cabinets"
```

---

### Task 5: Rewire Arcade.tsx

**Files:**
- Modify: `src/components/Arcade.tsx` (full rewrite — old grid, inline boot overlay, and `Phase` logic all go away)

- [ ] **Step 1: Replace the file contents**

```tsx
// src/components/Arcade.tsx
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ArcadeCarousel from './ArcadeCarousel';
import GameShell from './GameShell';

gsap.registerPlugin(ScrollTrigger);

interface ActiveGame {
  id: string;
  screenEl: HTMLElement;
}

export default function Arcade() {
  const rootRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<ActiveGame | null>(null);

  // cabinets rise from below as you scroll in
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.cab',
        { y: 90, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'back.out(1.3)',
          scrollTrigger: { trigger: '.carousel', start: 'top 80%' },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="section crt crt-fx" id="arcade" ref={rootRef}>
      <div className="arcade__head">
        <div className="section-tag" style={{ background: 'var(--gold)' }}>
          🕹️ ARCADE STATION 🕹️
        </div>
        <h2 className="section-title" style={{ color: 'var(--cream)' }}>
          SANDY'S <span style={{ color: 'var(--mint)' }}>DEV-STATION</span>
        </h2>
        <p className="arcade__sub">CLASSIC '80s ARCADE CABINETS • 6 CARTRIDGE SLOTS • INSERT COIN</p>
      </div>

      <ArcadeCarousel
        paused={active !== null}
        onLaunch={(id, screenEl) => setActive({ id, screenEl })}
      />

      {active && (
        <GameShell gameId={active.id} screenEl={active.screenEl} onClose={() => setActive(null)} />
      )}
    </section>
  );
}
```

Note: the entrance tween no longer animates `rotateX` (the carousel owns each cabinet's 3D transform; animating rotateX would fight it).

- [ ] **Step 2: Typecheck**

Run: `npm run lint`
Expected: clean. (`RubikCube`/`PacToe` imports moved out of this file; unused-import errors here mean a step was missed.)

- [ ] **Step 3: Commit**

```bash
git add src/components/Arcade.tsx
git commit -m "feat: rewire Arcade section to carousel + GameShell"
```

---

### Task 6: Carousel CSS

**Files:**
- Modify: `src/styles.css` — replace the `.arcade__grid` block (lines 522–528) and append carousel styles next to the existing `.cab` styles.

- [ ] **Step 1: Delete the `.arcade__grid` rule** (lines 522–528) — it is no longer referenced.

- [ ] **Step 2: Add carousel styles** (place where `.arcade__grid` was)

```css
/* ---------- spotlight carousel ---------- */

.carousel {
  position: relative;
  max-width: 1300px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.carousel__stage {
  position: relative;
  width: 100%;
  height: 480px;
  perspective: 1200px;
  touch-action: pan-y;
  user-select: none;
}
.carousel__stage .cab {
  position: absolute;
  left: 50%;
  top: 10px;
  width: min(300px, 78vw);
  margin-left: calc(min(300px, 78vw) / -2);
  will-change: transform;
}
.carousel__stage .cab:hover {
  transform: none; /* GSAP owns transforms; disable the grid-era hover lift */
}
.cab--focused {
  border-color: var(--gold);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.55), 0 0 38px rgba(247, 201, 72, 0.25);
}
.cab--focused .cab__marquee {
  animation: marqueeGlow 1.6s ease-in-out infinite;
}
@keyframes marqueeGlow {
  50% {
    box-shadow: 0 0 18px rgba(247, 201, 72, 0.6);
  }
}
.carousel__arrow {
  position: absolute;
  top: 215px;
  z-index: 30;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 3px solid var(--gold);
  background: rgba(11, 15, 46, 0.85);
  color: var(--gold);
  font-size: 18px;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.carousel__arrow:hover:not(:disabled) {
  transform: scale(1.15);
}
.carousel__arrow:disabled {
  opacity: 0.25;
  cursor: default;
}
.carousel__arrow--left { left: 2px; }
.carousel__arrow--right { right: 2px; }
.carousel__start {
  margin-top: 16px;
  font-family: var(--font-pixel);
  font-size: 13px;
  letter-spacing: 2px;
  padding: 16px 34px;
  border-radius: 12px;
  border: 3px solid var(--navy);
  background: var(--gold);
  color: var(--navy);
  cursor: pointer;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.45);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.carousel__start:hover {
  transform: translateY(-3px);
  box-shadow: 0 9px 0 rgba(0, 0, 0, 0.45);
}
.carousel__start:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.45);
}
.carousel__dots {
  display: flex;
  gap: 12px;
  margin-top: 18px;
}
.carousel__dot {
  width: 14px;
  height: 14px;
  border-radius: 2px; /* pixel-square dots, it's the '80s */
  border: 2px solid var(--gold);
  background: transparent;
  cursor: pointer;
  padding: 0;
}
.carousel__dot--on {
  background: var(--gold);
  box-shadow: 0 0 10px rgba(247, 201, 72, 0.8);
}

/* gameshell zoom panel */
.gameshell__zoom {
  position: fixed;
  z-index: 450;
  background: radial-gradient(circle at 50% 35%, #1d2766 0%, var(--ink) 75%);
  border-radius: 12px;
  opacity: 0;
}

@media (max-width: 900px) {
  .carousel__stage {
    height: 460px;
  }
  .carousel__arrow {
    display: none; /* swipe + dots on small screens */
  }
}
```

- [ ] **Step 3: Typecheck + build**

Run: `npm run lint && npm run build`
Expected: both clean.

- [ ] **Step 4: Commit**

```bash
git add src/styles.css
git commit -m "feat: carousel, start button, dots, and zoom panel styles"
```

---

### Task 7: Browser verification (3 breakpoints)

**Files:** none (verification only)

- [ ] **Step 1: Start dev server**

Run: `npm run dev` (background). Open http://localhost:3000.

- [ ] **Step 2: Desktop (1280px) checks**

- Carousel shows Pac-Toe focused, neighbors receding and dimmed; arrows work; ←/→ keys work when section in view; clicking a side cabinet focuses it.
- START on Pac-Toe → zoom panel expands from cabinet screen → coin drop → cube loader → Pac-Toe playable → EXIT and ESC both return to the arcade floor, scroll restored.
- START on a Coming Soon cabinet → shake + buzz, no launch.

- [ ] **Step 3: Tablet (768px) and phone (375px) checks**

Resize devtools: cabinet ~78vw on phone, swipe left/right changes focus, arrows hidden, dots visible and tappable, launch/exit still work.

- [ ] **Step 4: Console check**

Expected: zero errors/warnings in the browser console.

If any check fails: use superpowers:systematic-debugging before patching.

---

### Task 8: Brutal Critic review, relay-log, deploy

- [ ] **Step 1: Brutal Critic review** — adversarial code-correctness review (stakes: PROFESSIONAL) of the five changed/created files against the spec. Fix any FAILs, re-run Task 7 checks.

- [ ] **Step 2: Update relay-log + project-hub**

Append a relay-log entry (date, model, completed, next step). In `.agents/project-hub.md`, set "Arcade station redesign (6 slots)" to 🟡 Under review (🟢 after Sandy approves the live result).

- [ ] **Step 3: Commit, push, deploy**

```bash
git add -A && git commit -m "docs: arcade carousel handoff notes"
git push
npm run build && firebase deploy --only hosting:claude-portfolio --project retro-arcade-portfolio
```

Expected: deploy succeeds; verify https://sandy-sysdev-v2.web.app shows the new carousel.
