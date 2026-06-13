import { useCallback, useEffect, useRef, useState } from 'react';
import CartridgeLoader from '../../components/CartridgeLoader';
import { sfx } from '../../sound';
import { LEVELS, MAP_W, MAP_H } from './levels';
import {
  TILE, THEMES, Theme,
  drawBitmap, drawFloor, drawWall, drawWater, drawQBlock, drawUsedBlock,
  drawSpike, drawPipe, drawChest, drawDecor, drawCoin, drawKey,
  HERO_DOWN, HERO_UP, HERO_SIDE, HERO_COLORS,
  GOOMBA, GOOMBA_COLORS, TURTLE, TURTLE_COLORS, PIRANHA, PIRANHA_COLORS, BOSS, BOSS_COLORS,
  HEART_PICKUP,
} from './art';

/**
 * LEGEND OF THE MUSHROOM KINGDOM
 * Top-down '86-style action-adventure in Mario's world: slash goombas,
 * loot ?-blocks, grab the key, warp-pipe to the next land. Six themed
 * levels with living weather; the Shell Dragon waits at the end.
 */

const VIEW_W = 20 * TILE; // 640
const VIEW_H = 13 * TILE; // 416
const SAVE_KEY = 'zelda-v1';

type Dir = 'up' | 'down' | 'left' | 'right';
type Phase = 'play' | 'dead' | 'cleared' | 'victory';

interface Enemy {
  kind: 'goomba' | 'turtle' | 'piranha' | 'boss';
  x: number; y: number; vx: number; vy: number;
  hp: number; t: number; hurt: number;
}
interface Pickup { kind: 'coin' | 'heart' | 'key'; x: number; y: number; }
interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number; color: string; grav: number;
}
interface Fireball { x: number; y: number; vx: number; vy: number; life: number; }

interface GameState {
  level: number;
  theme: Theme;
  grid: string[][];
  hero: { x: number; y: number; dir: Dir; hp: number; invuln: number; slash: number; cd: number; moving: boolean };
  enemies: Enemy[];
  pickups: Pickup[];
  fireballs: Fireball[];
  particles: Particle[];
  weather: Particle[];
  hasKey: boolean;
  camX: number; camY: number;
  time: number; shake: number; flash: number; lockToast: number;
  intro: number;
  phase: Phase;
}

const SOLID = new Set(['#', '~', 'B', 'b', 'K', 'k']);

function loadSave(): { coins: number; unlocked: number } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (typeof p.coins === 'number' && typeof p.unlocked === 'number') return p;
    }
  } catch { /* fresh */ }
  return { coins: 0, unlocked: 1 };
}

export default function ZeldaGame({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const touchRef = useRef({ jx: 0, jy: 0, attack: false });
  const padRef = useRef<HTMLDivElement>(null);

  const [save, setSave] = useState(loadSave);
  const [ui, setUi] = useState({ hp: 3, maxHp: 3, hasKey: false, level: 1, phase: 'play' as Phase, coins: loadSave().coins });
  const [loading, setLoading] = useState(false);
  const isTouch = useRef(
    typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)
  ).current;

  useEffect(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* private mode */ }
  }, [save]);

  /* ---------- level setup ---------- */

  const startLevel = useCallback((lvl: number) => {
    const def = LEVELS[lvl - 1];
    const grid = def.map.map((row) => row.split(''));
    const st: GameState = {
      level: lvl,
      theme: THEMES[lvl - 1],
      grid,
      hero: { x: 0, y: 0, dir: 'down', hp: 3, invuln: 0, slash: 0, cd: 0, moving: false },
      enemies: [],
      pickups: [],
      fireballs: [],
      particles: [],
      weather: [],
      hasKey: false,
      camX: 0, camY: 0,
      time: 0, shake: 0, flash: 0, lockToast: 0,
      intro: 3,
      phase: 'play',
    };
    const speed = 1 + (lvl - 1) * 0.12; // enemies get faster per level
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const ch = grid[y][x];
        const cx = x * TILE + TILE / 2;
        const cy = y * TILE + TILE / 2;
        if (ch === '@') {
          st.hero.x = cx; st.hero.y = cy; grid[y][x] = '.';
        } else if (ch === 'E') {
          st.enemies.push({ kind: 'goomba', x: cx, y: cy, vx: 0, vy: 0, hp: 1, t: Math.random() * 2, hurt: 0 });
          grid[y][x] = '.';
        } else if (ch === 'T') {
          st.enemies.push({ kind: 'turtle', x: cx, y: cy, vx: 70 * speed, vy: 0, hp: 2, t: 0, hurt: 0 });
          grid[y][x] = '.';
        } else if (ch === 'F') {
          st.enemies.push({ kind: 'piranha', x: cx, y: cy, vx: 0, vy: 0, hp: 2, t: Math.random() * 3, hurt: 0 });
          grid[y][x] = '.';
        } else if (ch === 'D') {
          st.enemies.push({ kind: 'boss', x: cx, y: cy, vx: 0, vy: 0, hp: 10, t: 0, hurt: 0 });
          grid[y][x] = '.';
        } else if (ch === 'C') {
          st.pickups.push({ kind: 'coin', x: cx, y: cy });
          grid[y][x] = '.';
        } else if (ch === 'H') {
          st.pickups.push({ kind: 'heart', x: cx, y: cy });
          grid[y][x] = '.';
        }
      }
    }
    stateRef.current = st;
    setUi((u) => ({ ...u, hp: 3, maxHp: 3, hasKey: false, level: lvl, phase: 'play' }));
  }, []);

  useEffect(() => {
    startLevel(1);
  }, [startLevel]);

  /* ---------- helpers ---------- */

  const burst = (st: GameState, x: number, y: number, color: string, n: number, spread = 130) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = Math.random() * spread + 30;
      st.particles.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40,
        life: 0.6, max: 0.6, size: 2 + Math.random() * 3, color, grav: 260,
      });
    }
  };

  const solidAt = (st: GameState, px: number, py: number) => {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return true;
    return SOLID.has(st.grid[ty][tx]);
  };

  const moveBox = (st: GameState, e: { x: number; y: number }, vx: number, vy: number, dt: number, half: number) => {
    let blocked = false;
    const nx = e.x + vx * dt;
    if (
      !solidAt(st, nx - half, e.y - half) && !solidAt(st, nx + half, e.y - half) &&
      !solidAt(st, nx - half, e.y + half) && !solidAt(st, nx + half, e.y + half)
    ) e.x = nx; else blocked = true;
    const ny = e.y + vy * dt;
    if (
      !solidAt(st, e.x - half, ny - half) && !solidAt(st, e.x + half, ny - half) &&
      !solidAt(st, e.x - half, ny + half) && !solidAt(st, e.x + half, ny + half)
    ) e.y = ny; else blocked = true;
    return blocked;
  };

  const hurtHero = (st: GameState, fromX: number, fromY: number) => {
    if (st.hero.invuln > 0 || st.phase !== 'play') return;
    st.hero.hp -= 1;
    st.hero.invuln = 1.2;
    st.shake = 0.35;
    sfx.hurt();
    const dx = st.hero.x - fromX;
    const dy = st.hero.y - fromY;
    const len = Math.hypot(dx, dy) || 1;
    moveBox(st, st.hero, (dx / len) * 900, (dy / len) * 900, 0.08, 10);
    burst(st, st.hero.x, st.hero.y, '#ff5d5d', 10);
    if (st.hero.hp <= 0) {
      st.phase = 'dead';
      sfx.lose();
    }
    setUi((u) => ({ ...u, hp: Math.max(0, st.hero.hp), phase: st.phase }));
  };

  /* ---------- input ---------- */

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      keysRef.current[e.key.toLowerCase()] = true;
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // virtual joystick (touch)
  useEffect(() => {
    const pad = padRef.current;
    if (!pad || !isTouch) return;
    const onMove = (e: PointerEvent) => {
      const r = pad.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const len = Math.hypot(dx, dy);
      const dead = len < 0.25 ? 0 : 1;
      touchRef.current.jx = len > 0 ? (dx / Math.max(len, 1)) * dead : 0;
      touchRef.current.jy = len > 0 ? (dy / Math.max(len, 1)) * dead : 0;
    };
    const onDown = (e: PointerEvent) => {
      pad.setPointerCapture(e.pointerId);
      onMove(e);
      pad.addEventListener('pointermove', onMove);
    };
    const onUp = () => {
      touchRef.current.jx = 0;
      touchRef.current.jy = 0;
      pad.removeEventListener('pointermove', onMove);
    };
    pad.addEventListener('pointerdown', onDown);
    pad.addEventListener('pointerup', onUp);
    pad.addEventListener('pointercancel', onUp);
    return () => {
      pad.removeEventListener('pointerdown', onDown);
      pad.removeEventListener('pointerup', onUp);
      pad.removeEventListener('pointercancel', onUp);
      pad.removeEventListener('pointermove', onMove);
    };
  }, [isTouch]);

  /* ---------- game loop ---------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    let last = performance.now();

    const update = (st: GameState, dt: number) => {
      st.time += dt;
      st.shake = Math.max(0, st.shake - dt);
      st.flash = Math.max(0, st.flash - dt);
      st.lockToast = Math.max(0, st.lockToast - dt);
      st.intro = Math.max(0, st.intro - dt);

      /* hero */
      const k = keysRef.current;
      let ix = (k['arrowright'] || k['d'] ? 1 : 0) - (k['arrowleft'] || k['a'] ? 1 : 0) + touchRef.current.jx;
      let iy = (k['arrowdown'] || k['s'] ? 1 : 0) - (k['arrowup'] || k['w'] ? 1 : 0) + touchRef.current.jy;
      const ilen = Math.hypot(ix, iy);
      if (ilen > 1) { ix /= ilen; iy /= ilen; }
      const h = st.hero;
      h.moving = ilen > 0.1 && st.phase === 'play';
      if (st.phase === 'play' && h.moving) {
        moveBox(st, h, ix * 150, iy * 150, dt, 10);
        if (Math.abs(ix) > Math.abs(iy)) h.dir = ix > 0 ? 'right' : 'left';
        else if (Math.abs(iy) > 0.1) h.dir = iy > 0 ? 'down' : 'up';
      }
      h.invuln = Math.max(0, h.invuln - dt);
      h.cd = Math.max(0, h.cd - dt);
      h.slash = Math.max(0, h.slash - dt);

      const wantAttack = k[' '] || k['j'] || k['k'] || touchRef.current.attack;
      if (st.phase === 'play' && wantAttack && h.cd <= 0) {
        h.cd = 0.35;
        h.slash = 0.16;
        sfx.slash();
        // slash hit zone in front of the hero
        const zx = h.x + (h.dir === 'right' ? 26 : h.dir === 'left' ? -26 : 0);
        const zy = h.y + (h.dir === 'down' ? 26 : h.dir === 'up' ? -26 : 0);
        const ZH = 24;
        // enemies
        for (const e of st.enemies) {
          if (e.kind === 'piranha' && (e.t % 3.3) < 1.9) continue; // hidden = safe underground
          if (Math.abs(e.x - zx) < ZH + 8 && Math.abs(e.y - zy) < ZH + 8) {
            e.hp -= 1;
            e.hurt = 0.18;
            burst(st, e.x, e.y, '#f2edda', 8);
            const dx = e.x - h.x; const dy = e.y - h.y;
            const len = Math.hypot(dx, dy) || 1;
            moveBox(st, e, (dx / len) * 700, (dy / len) * 700, 0.06, 10);
          }
        }
        // ?-blocks & chests within reach
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const tx = Math.floor(zx / TILE) + ox;
            const ty = Math.floor(zy / TILE) + oy;
            if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) continue;
            const ch = st.grid[ty][tx];
            const px = tx * TILE + TILE / 2;
            const py = ty * TILE + TILE / 2;
            if (Math.abs(px - zx) > 30 || Math.abs(py - zy) > 30) continue;
            if (ch === 'B') {
              st.grid[ty][tx] = 'b';
              sfx.pop();
              burst(st, px, py, '#f7c948', 12);
              st.pickups.push({ kind: Math.random() < 0.3 ? 'heart' : 'coin', x: px, y: py - 6 });
            } else if (ch === 'K') {
              st.grid[ty][tx] = 'k';
              sfx.pop();
              burst(st, px, py, '#f7c948', 14);
              st.pickups.push({ kind: 'key', x: px, y: py - 8 });
            }
          }
        }
      }

      /* touching a chest also opens it */
      {
        const tx = Math.floor(h.x / TILE);
        const ty = Math.floor(h.y / TILE);
        for (const [ox, oy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const ax = tx + ox; const ay = ty + oy;
          if (ax >= 0 && ax < MAP_W && ay >= 0 && ay < MAP_H && st.grid[ay][ax] === 'K') {
            const px = ax * TILE + TILE / 2; const py = ay * TILE + TILE / 2;
            if (Math.abs(px - h.x) < 26 && Math.abs(py - h.y) < 26) {
              st.grid[ay][ax] = 'k';
              sfx.pop();
              burst(st, px, py, '#f7c948', 14);
              st.pickups.push({ kind: 'key', x: px, y: py - 8 });
            }
          }
        }
      }

      /* tile triggers under the hero */
      if (st.phase === 'play') {
        const ch = st.grid[Math.floor(h.y / TILE)]?.[Math.floor(h.x / TILE)];
        if (ch === 'S') hurtHero(st, h.x + 4, h.y + 6);
        if (ch === 'P') {
          if (st.hasKey) {
            st.phase = 'cleared';
            sfx.pipe();
            setTimeout(() => sfx.win(), 350);
            burst(st, h.x, h.y, '#5eead4', 26, 200);
            setSave((s) => ({
              coins: s.coins,
              unlocked: Math.max(s.unlocked, Math.min(st.level + 1, 6)),
            }));
            setUi((u) => ({ ...u, phase: 'cleared' }));
          } else if (st.lockToast <= 0) {
            st.lockToast = 1.6;
            sfx.locked();
          }
        }
      }

      /* pickups */
      for (let i = st.pickups.length - 1; i >= 0; i--) {
        const p = st.pickups[i];
        if (Math.abs(p.x - h.x) < 20 && Math.abs(p.y - h.y) < 20 && st.phase === 'play') {
          st.pickups.splice(i, 1);
          if (p.kind === 'coin') {
            sfx.coin();
            burst(st, p.x, p.y, '#f7c948', 8, 90);
            setSave((s) => ({ ...s, coins: s.coins + 1 }));
            setUi((u) => ({ ...u, coins: u.coins + 1 }));
          } else if (p.kind === 'heart') {
            sfx.pop();
            burst(st, p.x, p.y, '#ff6ea9', 8, 90);
            h.hp = Math.min(3, h.hp + 1);
            setUi((u) => ({ ...u, hp: h.hp }));
          } else {
            sfx.key();
            st.hasKey = true;
            burst(st, p.x, p.y, '#f7c948', 18, 160);
            setUi((u) => ({ ...u, hasKey: true }));
          }
        }
      }

      /* enemies */
      for (let i = st.enemies.length - 1; i >= 0; i--) {
        const e = st.enemies[i];
        e.t += dt;
        e.hurt = Math.max(0, e.hurt - dt);
        if (e.hp <= 0) {
          burst(st, e.x, e.y, '#f2edda', 16, 150);
          sfx.pop();
          if (e.kind === 'boss') {
            sfx.fanfare();
            st.pickups.push({ kind: 'key', x: e.x, y: e.y });
            st.shake = 0.6;
            burst(st, e.x, e.y, '#f7c948', 36, 240);
          }
          st.enemies.splice(i, 1);
          continue;
        }
        const dxh = h.x - e.x;
        const dyh = h.y - e.y;
        const dist = Math.hypot(dxh, dyh);
        const lvlSpeed = 1 + (st.level - 1) * 0.12;

        if (e.kind === 'goomba') {
          if (dist < TILE * 4.5) {
            e.vx = (dxh / dist) * 55 * lvlSpeed;
            e.vy = (dyh / dist) * 55 * lvlSpeed;
          } else if (e.t > 1.6) {
            e.t = 0;
            const a = Math.random() * Math.PI * 2;
            e.vx = Math.cos(a) * 38;
            e.vy = Math.sin(a) * 38;
          }
          if (moveBox(st, e, e.vx, e.vy, dt, 10)) { e.vx *= -1; e.vy *= -1; }
        } else if (e.kind === 'turtle') {
          if (e.vx === 0 && e.vy === 0) e.vx = 70 * lvlSpeed;
          if (moveBox(st, e, e.vx, e.vy, dt, 10)) {
            // bounce and occasionally turn 90°
            if (Math.random() < 0.35) {
              const swap = e.vx;
              e.vx = e.vy === 0 ? 0 : -e.vy;
              e.vy = swap === 0 ? 70 * lvlSpeed : swap;
            } else {
              e.vx *= -1; e.vy *= -1;
            }
          }
        } else if (e.kind === 'boss') {
          if (dist > 40) {
            moveBox(st, e, (dxh / dist) * 42, (dyh / dist) * 42, dt, 18);
          }
          if (e.t > 2.1) {
            e.t = 0;
            sfx.laugh();
            for (const spread of [-0.3, 0, 0.3]) {
              const a = Math.atan2(dyh, dxh) + spread;
              st.fireballs.push({ x: e.x, y: e.y, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, life: 2.6 });
            }
          }
        }
        // piranha: stationary cycle handled in render/contact via e.t

        const up = e.kind !== 'piranha' || (e.t % 3.3) >= 1.9;
        const reach = e.kind === 'boss' ? 26 : 16;
        if (up && dist < reach + 10) hurtHero(st, e.x, e.y);
      }

      /* fireballs */
      for (let i = st.fireballs.length - 1; i >= 0; i--) {
        const f = st.fireballs[i];
        f.life -= dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        if (f.life <= 0 || solidAt(st, f.x, f.y)) {
          burst(st, f.x, f.y, '#ffa23e', 6, 80);
          st.fireballs.splice(i, 1);
          continue;
        }
        if (Math.abs(f.x - h.x) < 14 && Math.abs(f.y - h.y) < 14) {
          hurtHero(st, f.x, f.y);
          st.fireballs.splice(i, 1);
        }
      }

      /* particles */
      for (let i = st.particles.length - 1; i >= 0; i--) {
        const p = st.particles[i];
        p.life -= dt;
        if (p.life <= 0) { st.particles.splice(i, 1); continue; }
        p.vy += p.grav * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }

      /* weather */
      const W = st.theme.weather;
      const spawnRate = W === 'rain' ? 14 : W === 'snow' ? 4 : 2;
      if (st.weather.length < (W === 'rain' ? 130 : 60) && Math.random() < spawnRate * dt) {
        const n = W === 'rain' ? 6 : 1;
        for (let i = 0; i < n; i++) {
          st.weather.push({
            x: st.camX + Math.random() * VIEW_W,
            y: st.camY - 10,
            vx: W === 'rain' ? -60 : W === 'sand' ? 70 + Math.random() * 50 : (Math.random() - 0.5) * 26,
            vy: W === 'rain' ? 430 : W === 'embers' ? -28 - Math.random() * 26 : 26 + Math.random() * 22,
            life: 6, max: 6,
            size: W === 'rain' ? 1.6 : 2 + Math.random() * 2.5,
            color:
              W === 'petals' ? '#ff9ec4' : W === 'sand' ? '#e0c27e' : W === 'leaves' ? '#ff8a5c' :
              W === 'rain' ? 'rgba(160,210,255,0.7)' : W === 'snow' ? '#eef6ff' : '#ffa23e',
            grav: 0,
          });
        }
      }
      for (let i = st.weather.length - 1; i >= 0; i--) {
        const p = st.weather[i];
        p.life -= dt;
        p.x += p.vx * dt + (W === 'petals' || W === 'snow' || W === 'leaves' ? Math.sin(st.time * 2 + p.y * 0.02) * 26 * dt : 0);
        p.y += p.vy * dt;
        if (W === 'embers') p.x += Math.sin(st.time * 3 + p.y * 0.05) * 18 * dt;
        if (p.life <= 0 || p.y > st.camY + VIEW_H + 20 || (W === 'embers' && p.y < st.camY - 20)) st.weather.splice(i, 1);
      }
      // lightning on the stormy level
      if (W === 'rain' && Math.random() < dt / 6.5) st.flash = 0.22;

      /* camera follows hero, clamped to map */
      const targX = Math.max(0, Math.min(MAP_W * TILE - VIEW_W, h.x - VIEW_W / 2));
      const targY = Math.max(0, Math.min(MAP_H * TILE - VIEW_H, h.y - VIEW_H / 2));
      st.camX += (targX - st.camX) * Math.min(1, dt * 6);
      st.camY += (targY - st.camY) * Math.min(1, dt * 6);
    };

    const render = (st: GameState) => {
      const shakeX = st.shake > 0 ? (Math.random() - 0.5) * st.shake * 26 : 0;
      const shakeY = st.shake > 0 ? (Math.random() - 0.5) * st.shake * 26 : 0;
      const cx = Math.round(st.camX + shakeX);
      const cy = Math.round(st.camY + shakeY);

      ctx.save();
      ctx.translate(-cx, -cy);

      const tx0 = Math.max(0, Math.floor(cx / TILE) - 1);
      const ty0 = Math.max(0, Math.floor(cy / TILE) - 1);
      const tx1 = Math.min(MAP_W - 1, Math.ceil((cx + VIEW_W) / TILE) + 1);
      const ty1 = Math.min(MAP_H - 1, Math.ceil((cy + VIEW_H) / TILE) + 1);

      for (let y = ty0; y <= ty1; y++) {
        for (let x = tx0; x <= tx1; x++) {
          const ch = st.grid[y][x];
          const px = x * TILE;
          const py = y * TILE;
          if (ch === '#') { drawWall(ctx, st.theme, px, py); continue; }
          drawFloor(ctx, st.theme, x, y, px, py);
          if (ch === '~') drawWater(ctx, st.theme, x, y, px, py, st.time);
          else if (ch === 'B') drawQBlock(ctx, px, py, st.time);
          else if (ch === 'b') drawUsedBlock(ctx, px, py);
          else if (ch === 'S') drawSpike(ctx, st.theme, px, py);
          else if (ch === 'P') drawPipe(ctx, px, py, st.time, st.hasKey);
          else if (ch === 'K') drawChest(ctx, px, py, false, st.time);
          else if (ch === 'k') drawChest(ctx, px, py, true, st.time);
          else if (ch === 'd') drawDecor(ctx, st.theme, px, py, st.time);
        }
      }

      /* pickups */
      for (const p of st.pickups) {
        if (p.kind === 'coin') drawCoin(ctx, p.x - TILE / 2, p.y - TILE / 2, st.time);
        else if (p.kind === 'heart') {
          ctx.save();
          ctx.shadowColor = '#ff6ea9';
          ctx.shadowBlur = 8;
          drawBitmap(ctx, HEART_PICKUP, { h: '#ff5d7e' }, p.x - 10, p.y - 8 + Math.sin(st.time * 3) * 2, 3);
          ctx.restore();
        } else drawKey(ctx, p.x, p.y, st.time);
      }

      const shadow = (x: number, y: number, r: number) => {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      };

      /* enemies */
      for (const e of st.enemies) {
        const bob = Math.sin(st.time * 7 + e.x) * 1.5;
        if (e.kind === 'piranha') {
          const cycle = e.t % 3.3;
          const out = cycle >= 1.9 ? Math.min(1, (cycle - 1.9) / 0.35) : Math.max(0, 1 - (cycle - 1.55) / 0.35);
          if (out <= 0.02) continue;
          shadow(e.x, e.y + 14, 10);
          ctx.save();
          ctx.globalAlpha = e.hurt > 0 ? 0.55 : 1;
          drawBitmap(ctx, PIRANHA, PIRANHA_COLORS, e.x - 12, e.y - 12 + (1 - out) * 16, 2);
          ctx.restore();
          continue;
        }
        shadow(e.x, e.y + (e.kind === 'boss' ? 22 : 12), e.kind === 'boss' ? 20 : 10);
        ctx.save();
        ctx.globalAlpha = e.hurt > 0 ? 0.55 : 1;
        if (e.kind === 'goomba') drawBitmap(ctx, GOOMBA, GOOMBA_COLORS, e.x - 10, e.y - 10 + bob, 2);
        else if (e.kind === 'turtle') drawBitmap(ctx, TURTLE, TURTLE_COLORS, e.x - 10, e.y - 10 + bob, 2);
        else drawBitmap(ctx, BOSS, BOSS_COLORS, e.x - 21, e.y - 21 + bob, 3);
        ctx.restore();
      }

      /* fireballs */
      for (const f of st.fireballs) {
        ctx.save();
        ctx.shadowColor = '#ffa23e';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffa23e';
        ctx.beginPath();
        ctx.arc(f.x, f.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffe08a';
        ctx.beginPath();
        ctx.arc(f.x, f.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      /* hero */
      const hb = st.hero;
      if (st.phase !== 'dead') {
        shadow(hb.x, hb.y + 13, 11);
        const blink = hb.invuln > 0 && Math.floor(st.time * 14) % 2 === 0;
        if (!blink) {
          const bobh = hb.moving ? Math.sin(st.time * 11) * 1.6 : 0;
          ctx.save();
          if (hb.dir === 'left') {
            ctx.translate(hb.x + 12, hb.y - 12 + bobh);
            ctx.scale(-1, 1);
            drawBitmap(ctx, HERO_SIDE, HERO_COLORS, 0, 0, 2);
          } else {
            const rows = hb.dir === 'up' ? HERO_UP : hb.dir === 'right' ? HERO_SIDE : HERO_DOWN;
            drawBitmap(ctx, rows, HERO_COLORS, hb.x - 12, hb.y - 12 + bobh, 2);
          }
          ctx.restore();
        }
        // sword slash arc
        if (hb.slash > 0) {
          const prog = 1 - hb.slash / 0.16;
          const base =
            hb.dir === 'right' ? 0 : hb.dir === 'down' ? Math.PI / 2 : hb.dir === 'left' ? Math.PI : -Math.PI / 2;
          ctx.save();
          ctx.strokeStyle = '#f2edda';
          ctx.shadowColor = '#67e8f9';
          ctx.shadowBlur = 9;
          ctx.lineWidth = 4;
          ctx.globalAlpha = 1 - prog * 0.6;
          ctx.beginPath();
          ctx.arc(hb.x, hb.y, 26, base - 1.1 + prog * 0.9, base + 0.2 + prog * 0.9);
          ctx.stroke();
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.arc(hb.x, hb.y, 20, base - 1.1 + prog * 0.9, base + 0.2 + prog * 0.9);
          ctx.stroke();
          ctx.restore();
        }
      }

      /* particles */
      for (const p of st.particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      /* weather (world space) */
      for (const p of st.weather) {
        ctx.fillStyle = p.color;
        if (st.theme.weather === 'rain') ctx.fillRect(p.x, p.y, 1.6, 11);
        else ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      ctx.restore();

      /* mood tint + vignette + lightning (screen space) */
      ctx.fillStyle = st.theme.tint;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      const vg = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H / 2.4, VIEW_W / 2, VIEW_H / 2, VIEW_H);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(5,8,25,0.42)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      if (st.flash > 0) {
        ctx.fillStyle = `rgba(220,235,255,${st.flash * 1.6})`;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }

      /* toasts */
      if (st.intro > 0 || st.lockToast > 0) {
        const text = st.lockToast > 0 ? '🔒 THE PIPE IS LOCKED — FIND THE KEY!' : LEVELS[st.level - 1].intro;
        ctx.font = '13px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const tw = ctx.measureText(text).width + 36;
        ctx.fillStyle = 'rgba(5,8,25,0.78)';
        ctx.fillRect(VIEW_W / 2 - tw / 2, VIEW_H - 64, tw, 38);
        ctx.fillStyle = st.lockToast > 0 ? '#ff9e9e' : '#f7c948';
        ctx.fillText(text, VIEW_W / 2, VIEW_H - 45);
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const st = stateRef.current;
      if (!st) return;
      update(st, dt);
      render(st);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- flow buttons ---------- */

  const nextLevel = () => {
    const st = stateRef.current!;
    if (st.level >= 6) {
      sfx.fanfare();
      setUi((u) => ({ ...u, phase: 'victory' }));
      if (stateRef.current) stateRef.current.phase = 'victory';
      return;
    }
    sfx.boot();
    setLoading(true);
  };

  const st = stateRef.current;
  const themeName = THEMES[ui.level - 1].name;

  return (
    <div className="zelda crt-fx" role="application" aria-label="Legend of the Mushroom Kingdom">
      <header className="zl-head">
        <span className="zl-title pixel">🗡️ LEGEND OF THE MUSHROOM KINGDOM</span>
        <div className="zl-pips">
          {[1, 2, 3, 4, 5, 6].map((l) => (
            <button
              key={l}
              className={`zl-pip pixel ${l === ui.level ? 'zl-pip--now' : ''} ${l < save.unlocked ? 'zl-pip--done' : ''}`}
              disabled={l > save.unlocked}
              onClick={() => { sfx.click(); setLoading(false); startLevel(l); }}
              aria-label={`Level ${l}`}
            >
              {l > save.unlocked ? '🔒' : l}
            </button>
          ))}
        </div>
        <div className="zl-stats term">
          <span className="zl-hearts" aria-label={`${ui.hp} of ${ui.maxHp} hearts`}>
            {Array.from({ length: ui.maxHp }, (_, i) => (
              <em key={i} className={i < ui.hp ? '' : 'zl-heart--off'}>❤</em>
            ))}
          </span>
          <span>🪙 {ui.coins}</span>
          <span className={ui.hasKey ? 'zl-key--on' : 'zl-key--off'}>🔑</span>
        </div>
        <button className="pt-exit pixel" onClick={onExit}>✕ EXIT</button>
      </header>

      <div className="zl-stage">
        <span className="zl-world term">WORLD {ui.level}-{themeName}</span>
        <canvas ref={canvasRef} className="zl-canvas" />
        {!isTouch && (
          <span className="zl-hint term">WASD / ARROWS — MOVE · SPACE / J — SWORD · OPEN THE CHEST, UNLOCK THE PIPE</span>
        )}

        {ui.phase === 'dead' && (
          <div className="pt-banner">
            <span className="pt-banner__big pixel">💀 GAME OVER, HERO…</span>
            <div className="pt-banner__actions">
              <button className="btn" onClick={() => { sfx.coin(); startLevel(ui.level); }}>↻ RETRY WORLD {ui.level}</button>
            </div>
          </div>
        )}
        {ui.phase === 'cleared' && (
          <div className="pt-banner pt-banner--win">
            <span className="pt-banner__big pixel">🍄 WORLD {ui.level} CLEARED!</span>
            <div className="pt-banner__actions">
              <button className="btn btn--mint" onClick={nextLevel}>
                {ui.level >= 6 ? '🏆 CLAIM THE TRIFORCE-SHROOM' : '▸ ENTER THE PIPE'}
              </button>
            </div>
          </div>
        )}
        {ui.phase === 'victory' && (
          <div className="pt-champion">
            <span className="pt-champion__trophy">🍄</span>
            <h2 className="pixel">THE KINGDOM IS SAVED!</h2>
            <p className="term">
              You conquered all 6 worlds and defeated the Shell Dragon. Rupee-coins collected: {ui.coins} 🪙
            </p>
            <div className="pt-champion__actions">
              <button className="btn btn--mint" onClick={() => { sfx.coin(); startLevel(1); }}>↻ NEW QUEST</button>
              <button className="btn" onClick={onExit}>✕ BACK TO ARCADE</button>
            </div>
          </div>
        )}
      </div>

      {isTouch && (
        <div className="zl-touch">
          <div className="zl-joy" ref={padRef} aria-label="Move joystick">
            <span className="zl-joy__nub" />
          </div>
          <button
            className="zl-atk pixel"
            onPointerDown={() => { touchRef.current.attack = true; }}
            onPointerUp={() => { touchRef.current.attack = false; }}
            onPointerCancel={() => { touchRef.current.attack = false; }}
            aria-label="Sword attack"
          >
            ⚔️
          </button>
        </div>
      )}

      {loading && st && (
        <CartridgeLoader
          withCoin={false}
          duration={1.2}
          label={`WORLD ${st.level + 1} ▸ ${THEMES[st.level].name}`}
          onDone={() => { setLoading(false); startLevel(st.level + 1); }}
        />
      )}
    </div>
  );
}
