import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { GAMES, GameInfo } from '../data';
import { sfx } from '../sound';

/**
 * Phantom.land-style inside-a-sphere gallery, retro edition.
 * Tiles are curved patches on the inner surface of a sphere; the camera sits
 * at the center. Drag to look around (lenis-style damped easing + inertia),
 * tap a game cartridge to launch it through the existing GameShell flow.
 * Every card texture is drawn programmatically — zero image assets.
 */

interface SphereGalleryProps {
  /** True while a game is open — pauses rendering and input. */
  paused: boolean;
  onLaunch: (gameId: string, screenEl: HTMLElement) => void;
}

type ArtStyle = 'stars' | 'grid' | 'maze' | 'plain';

interface CardDesign {
  brand: string;
  title: string;
  emoji: string;
  accent: string;
  art: ArtStyle;
  year: string;
  tags: string[];
  badge?: 'READY' | 'COMING SOON';
}

interface TileInfo {
  kind: 'game' | 'filler';
  game?: GameInfo;
}

/* '80s-inspired filler cartridges that wrap the rest of the sphere */
const FILLERS: CardDesign[] = [
  { brand: 'RETRO-VAULT', title: 'SPACE INVADERZ', emoji: '👾', accent: '#67e8f9', art: 'stars', year: '1981', tags: ['ARCADE', '8-BIT'] },
  { brand: 'RETRO-VAULT', title: 'MUSHROOM KINGDOM', emoji: '🍄', accent: '#ff7b6b', art: 'grid', year: '1985', tags: ['PLATFORM'] },
  { brand: 'RETRO-VAULT', title: 'GHOST MAZE', emoji: '👻', accent: '#a78bfa', art: 'maze', year: '1980', tags: ['MAZE', 'CLASSIC'] },
  { brand: 'RETRO-VAULT', title: 'PIXEL GALAXY', emoji: '🌌', accent: '#f7c948', art: 'stars', year: '1983', tags: ['SHOOTER'] },
  { brand: 'RETRO-VAULT', title: 'ALIEN AMBUSH', emoji: '👽', accent: '#5eead4', art: 'stars', year: '1982', tags: ['INVASION'] },
  { brand: 'RETRO-VAULT', title: 'CHERRY BONUS', emoji: '🍒', accent: '#ff6ea9', art: 'plain', year: '1980', tags: ['+500 PTS'] },
  { brand: 'RETRO-VAULT', title: 'HIGH SCORE', emoji: '⭐', accent: '#f7c948', art: 'grid', year: '1984', tags: ['RANK #1'] },
  { brand: 'RETRO-VAULT', title: 'TURBO RACER', emoji: '🏎️', accent: '#ff7b6b', art: 'grid', year: '1987', tags: ['RACING'] },
  { brand: 'RETRO-VAULT', title: 'DRAGON CASTLE', emoji: '🐉', accent: '#5eead4', art: 'maze', year: '1983', tags: ['QUEST'] },
  { brand: 'RETRO-VAULT', title: 'EXTRA LIFE', emoji: '❤️', accent: '#ff6ea9', art: 'plain', year: '1985', tags: ['1-UP'] },
  { brand: 'RETRO-VAULT', title: 'CASSETTE LOADER', emoji: '📼', accent: '#a78bfa', art: 'plain', year: '1987', tags: ['SIDE A'] },
  { brand: 'RETRO-VAULT', title: 'FLOPPY SAVE', emoji: '💾', accent: '#67e8f9', art: 'plain', year: '1986', tags: ['1.44 MB'] },
  { brand: 'RETRO-VAULT', title: 'SYNTH SUNSET', emoji: '🌴', accent: '#ff6ea9', art: 'grid', year: '1984', tags: ['OUTRUN'] },
  { brand: 'RETRO-VAULT', title: 'UFO CHASE', emoji: '🛸', accent: '#5eead4', art: 'stars', year: '1982', tags: ['BONUS'] },
];

const GAME_ACCENTS = ['#f7c948', '#ff6ea9', '#67e8f9', '#5eead4', '#a78bfa', '#ff7b6b'];

/* ---------- canvas card painting ---------- */

/** Render an emoji small, then upscale without smoothing → chunky pixel-art look. */
function pixelEmoji(emoji: string, cell = 14, scale = 14): HTMLCanvasElement {
  const small = document.createElement('canvas');
  small.width = small.height = cell;
  const sctx = small.getContext('2d')!;
  sctx.font = `${cell - 2}px serif`;
  sctx.textAlign = 'center';
  sctx.textBaseline = 'middle';
  sctx.fillText(emoji, cell / 2, cell / 2 + 1);
  const big = document.createElement('canvas');
  big.width = big.height = cell * scale;
  const bctx = big.getContext('2d')!;
  bctx.imageSmoothingEnabled = false;
  bctx.drawImage(small, 0, 0, big.width, big.height);
  return big;
}

function drawArt(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, style: ArtStyle, accent: string) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, '#1d2766');
  grad.addColorStop(1, '#0b0f2e');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  if (style === 'stars') {
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = [accent, '#f2edda', '#f7c948'][i % 3];
      ctx.globalAlpha = 0.35 + Math.random() * 0.65;
      const s = Math.random() < 0.85 ? 3 : 6;
      ctx.fillRect(x + Math.random() * w, y + Math.random() * h, s, s);
    }
    ctx.globalAlpha = 1;
  } else if (style === 'grid') {
    // synthwave sun + perspective floor
    const cx = x + w / 2;
    const horizon = y + h * 0.58;
    const sun = ctx.createRadialGradient(cx, horizon - 40, 8, cx, horizon - 40, 90);
    sun.addColorStop(0, accent);
    sun.addColorStop(1, 'transparent');
    ctx.fillStyle = sun;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 2;
    for (let i = 0; i <= 8; i++) {
      const gy = horizon + (i / 8) * (h * 0.42) * (i / 8);
      ctx.beginPath();
      ctx.moveTo(x, y + (gy - y));
      ctx.lineTo(x + w, y + (gy - y));
      ctx.stroke();
    }
    for (let i = -5; i <= 5; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 22, horizon);
      ctx.lineTo(cx + i * 90, y + h);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (style === 'maze') {
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 4;
    const step = 34;
    for (let gy = y + step / 2; gy < y + h; gy += step) {
      for (let gx = x + step / 2; gx < x + w; gx += step) {
        ctx.beginPath();
        if (Math.random() > 0.5) {
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx + step, gy + step);
        } else {
          ctx.moveTo(gx + step, gy);
          ctx.lineTo(gx, gy + step);
        }
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  } else {
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 10;
    for (let i = -h; i < w + h; i += 42) {
      ctx.beginPath();
      ctx.moveTo(x + i, y + h);
      ctx.lineTo(x + i + h, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.toUpperCase().split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const probe = line ? `${line} ${word}` : word;
    if (ctx.measureText(probe).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = probe;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function drawCard(design: CardDesign): HTMLCanvasElement {
  const W = 512;
  const H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#181f4f');
  bg.addColorStop(1, '#0b0f2e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // scanlines
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);

  // frame
  ctx.strokeStyle = design.accent;
  ctx.lineWidth = 5;
  ctx.globalAlpha = 0.9;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.globalAlpha = 0.25;
  ctx.strokeRect(16, 16, W - 32, H - 32);
  ctx.globalAlpha = 1;

  // header — brand left, title right
  ctx.fillStyle = design.accent;
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText(design.brand, 32, 38);

  ctx.fillStyle = '#f2edda';
  ctx.textAlign = 'right';
  ctx.font = '13px "Press Start 2P", monospace';
  const titleLines = wrapText(ctx, design.title, 300);
  titleLines.forEach((line, i) => ctx.fillText(line, W - 32, 64 + i * 22));

  // art window
  const ax = 56;
  const ay = 140;
  const aw = W - 112;
  const ah = 250;
  drawArt(ctx, ax, ay, aw, ah, design.art, design.accent);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.strokeRect(ax, ay, aw, ah);

  const sprite = pixelEmoji(design.emoji);
  const ss = 180;
  ctx.save();
  ctx.shadowColor = design.accent;
  ctx.shadowBlur = 30;
  ctx.drawImage(sprite, ax + aw / 2 - ss / 2, ay + ah / 2 - ss / 2, ss, ss);
  ctx.restore();

  // status badge for game cartridges
  if (design.badge) {
    const ready = design.badge === 'READY';
    ctx.font = '11px "Press Start 2P", monospace';
    const tw = ctx.measureText(design.badge).width;
    ctx.fillStyle = ready ? '#5eead4' : 'rgba(242,237,218,0.22)';
    ctx.beginPath();
    ctx.roundRect(ax + 10, ay + 10, tw + 26, 32, 8);
    ctx.fill();
    ctx.fillStyle = ready ? '#131a43' : 'rgba(242,237,218,0.75)';
    ctx.textAlign = 'left';
    ctx.fillText(design.badge, ax + 23, ay + 21);
  }

  // footer — tag chips left, year right
  let tx = 32;
  ctx.font = '24px "VT323", monospace';
  ctx.textBaseline = 'middle';
  for (const tag of design.tags) {
    const tw = ctx.measureText(tag).width;
    ctx.strokeStyle = design.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(tx, H - 74, tw + 22, 36, 10);
    ctx.stroke();
    ctx.fillStyle = '#f2edda';
    ctx.textAlign = 'left';
    ctx.fillText(tag, tx + 11, H - 74 + 19);
    tx += tw + 34;
  }
  ctx.fillStyle = design.accent;
  ctx.font = '13px "Press Start 2P", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(design.year, W - 32, H - 54);

  return canvas;
}

/* ---------- the gallery ---------- */

const ROWS = 5;
const COLS = 14;
const RADIUS = 10;

export default function SphereGallery({ paused, onLaunch }: SphereGalleryProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const proxyRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const onLaunchRef = useRef(onLaunch);
  onLaunchRef.current = onLaunch;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 50);
    camera.rotation.order = 'YXZ';

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x0b0f2e, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    wrap.appendChild(renderer.domElement);

    const resize = () => {
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // ambient pixel stars floating between camera and the tile wall
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(280 * 3);
    for (let i = 0; i < 280; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(4 + Math.random() * 4.5);
      starPos.set([v.x, v.y, v.z], i * 3);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xf2edda, size: 0.045, transparent: true, opacity: 0.65 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    const tileMeshes: THREE.Mesh[] = [];
    const materials: THREE.MeshBasicMaterial[] = [];
    const textures: THREE.CanvasTexture[] = [];
    const haloGeos: THREE.SphereGeometry[] = [];
    // READY cartridges get a pulsing gold halo + a gentle bounce toward the camera
    const readyTiles: Array<{
      mesh: THREE.Mesh;
      dir: THREE.Vector3;
      phase: number;
      haloMat: THREE.MeshBasicMaterial;
    }> = [];
    const isReadyTile = (m: THREE.Mesh) => {
      const info = m.userData.info as TileInfo;
      return info.kind === 'game' && !!info.game?.ready;
    };
    let disposed = false;

    // build everything once the pixel fonts are ready so card text renders correctly
    let initialAimed = false;
    document.fonts.ready.then(() => {
      if (disposed) return;

      // unique textures: one per game + one per filler design (shared by repeats)
      const gameMats = GAMES.map((g, i) => {
        const design: CardDesign = {
          brand: 'SANDY-DEV',
          title: g.title,
          emoji: g.icon,
          accent: GAME_ACCENTS[i % GAME_ACCENTS.length],
          art: (['stars', 'grid', 'maze', 'plain'] as ArtStyle[])[i % 4],
          year: '2026',
          tags: ['CARTRIDGE', g.ready ? '1P MODE' : 'LOCKED'],
          badge: g.ready ? 'READY' : 'COMING SOON',
        };
        const tex = new THREE.CanvasTexture(drawCard(design));
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        textures.push(tex);
        const mat = new THREE.MeshBasicMaterial({ map: tex });
        materials.push(mat);
        return mat;
      });
      const fillerMats = FILLERS.map((design) => {
        const tex = new THREE.CanvasTexture(drawCard(design));
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        textures.push(tex);
        const mat = new THREE.MeshBasicMaterial({ map: tex });
        materials.push(mat);
        return mat;
      });

      const phiStep = (Math.PI * 2) / COLS;
      const thetaStep = 0.33;
      let fillerCounter = 0;

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const idx = r * COLS + c;
          // every 5th tile is a game cartridge, de-clustered so each game
          // appears on opposite sides of the sphere; (row 2, col 0) = Pac-Toe
          let info: TileInfo;
          if (r === 2 && c === 0) {
            info = { kind: 'game', game: GAMES[0] };
          } else if (idx % 5 === 0) {
            const placement = Math.floor(idx / 5);
            info = { kind: 'game', game: GAMES[(placement * 5 + r) % GAMES.length] };
          } else {
            info = { kind: 'filler' };
          }

          const thetaCenter = Math.PI / 2 + (r - (ROWS - 1) / 2) * thetaStep;
          const geo = new THREE.SphereGeometry(
            RADIUS,
            10,
            8,
            c * phiStep + phiStep * 0.07,
            phiStep * 0.86,
            thetaCenter - thetaStep * 0.44,
            thetaStep * 0.88
          );
          geo.scale(-1, 1, 1); // face inward, texture unmirrored

          const mat =
            info.kind === 'game'
              ? gameMats[GAMES.indexOf(info.game!)]
              : fillerMats[fillerCounter++ % fillerMats.length];

          const mesh = new THREE.Mesh(geo, mat);
          geo.computeBoundingBox();
          const center = new THREE.Vector3();
          geo.boundingBox!.getCenter(center);
          const corners: THREE.Vector3[] = [];
          const bb = geo.boundingBox!;
          for (const x of [bb.min.x, bb.max.x])
            for (const y of [bb.min.y, bb.max.y])
              for (const z of [bb.min.z, bb.max.z]) corners.push(new THREE.Vector3(x, y, z));
          mesh.userData = { info, dir: center.clone().normalize(), corners };
          scene.add(mesh);
          tileMeshes.push(mesh);

          // gold frame halo behind READY cartridges (slightly larger patch, additive)
          if (info.kind === 'game' && info.game?.ready) {
            const haloGeo = new THREE.SphereGeometry(
              RADIUS + 0.06,
              10,
              8,
              c * phiStep + phiStep * 0.02,
              phiStep * 0.96,
              thetaCenter - thetaStep * 0.48,
              thetaStep * 0.96
            );
            haloGeo.scale(-1, 1, 1);
            haloGeos.push(haloGeo);
            const haloMat = new THREE.MeshBasicMaterial({
              color: 0xf7c948,
              transparent: true,
              opacity: 0.4,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            });
            materials.push(haloMat);
            scene.add(new THREE.Mesh(haloGeo, haloMat));
            readyTiles.push({
              mesh,
              dir: mesh.userData.dir as THREE.Vector3,
              phase: idx * 1.7,
              haloMat,
            });
          }

          // aim the camera at the guaranteed Pac-Toe tile on first build
          if (r === 2 && c === 0 && !initialAimed) {
            initialAimed = true;
            camera.lookAt(center);
            targetYaw = yaw = camera.rotation.y;
            targetPitch = pitch = camera.rotation.x;
          }
        }
      }
    });

    /* ---------- input: damped look-around with inertia ---------- */

    let yaw = 0;
    let pitch = 0;
    let targetYaw = 0;
    let targetPitch = 0;
    let velYaw = 0;
    let dragging = false;
    let moved = 0;
    let lastX = 0;
    let lastY = 0;
    let lastInteract = 0;
    const PITCH_MAX = 0.55;

    const pointerNdc = new THREE.Vector2(99, 99);
    const raycaster = new THREE.Raycaster();
    let hovered: THREE.Mesh | null = null;

    const canvas = renderer.domElement;

    const updateNdc = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerNdc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
    };

    const onDown = (e: PointerEvent) => {
      if (pausedRef.current) return;
      updateNdc(e); // a tap never fires pointermove — capture coords here too
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      lastInteract = performance.now();
      wrap.classList.add('sphere--dragging');
      canvas.setPointerCapture?.(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      updateNdc(e);
      if (!dragging || pausedRef.current) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      lastX = e.clientX;
      lastY = e.clientY;
      targetYaw += dx * 0.0032;
      targetPitch = THREE.MathUtils.clamp(targetPitch + dy * 0.0028, -PITCH_MAX, PITCH_MAX);
      velYaw = dx * 0.0032;
      lastInteract = performance.now();
    };

    const launchFromMesh = (mesh: THREE.Mesh) => {
      const proxy = proxyRef.current;
      const { info, corners } = mesh.userData as { info: TileInfo; corners: THREE.Vector3[] };
      if (info.kind !== 'game' || !info.game) {
        // filler: playful pop toward the camera
        sfx.hover();
        const dir = (mesh.userData.dir as THREE.Vector3).clone();
        gsap.fromTo(
          mesh.position,
          { x: 0, y: 0, z: 0 },
          { x: -dir.x * 0.5, y: -dir.y * 0.5, z: -dir.z * 0.5, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' }
        );
        return;
      }
      if (!info.game.ready) {
        sfx.locked();
        const dir = (mesh.userData.dir as THREE.Vector3).clone();
        gsap.fromTo(
          mesh.position,
          { x: 0, y: 0, z: 0 },
          {
            x: dir.z * 0.25,
            y: 0,
            z: -dir.x * 0.25,
            duration: 0.07,
            yoyo: true,
            repeat: 5,
            ease: 'none',
            onComplete: () => mesh.position.set(0, 0, 0),
          }
        );
        return;
      }
      // project the tile's bounding corners to a screen rect for GameShell's zoom
      if (proxy) {
        const rect = canvas.getBoundingClientRect();
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const corner of corners) {
          const p = corner.clone().project(camera);
          const sx = rect.left + ((p.x + 1) / 2) * rect.width;
          const sy = rect.top + ((1 - p.y) / 2) * rect.height;
          minX = Math.min(minX, sx);
          minY = Math.min(minY, sy);
          maxX = Math.max(maxX, sx);
          maxY = Math.max(maxY, sy);
        }
        proxy.style.left = `${minX}px`;
        proxy.style.top = `${minY}px`;
        proxy.style.width = `${maxX - minX}px`;
        proxy.style.height = `${maxY - minY}px`;
      }
      sfx.pop();
      onLaunchRef.current(info.game.id, proxy ?? canvas);
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      wrap.classList.remove('sphere--dragging');
      if (moved < 9 && !pausedRef.current) {
        raycaster.setFromCamera(pointerNdc, camera);
        const hit = raycaster.intersectObjects(tileMeshes)[0];
        if (hit) launchFromMesh(hit.object as THREE.Mesh);
      }
    };

    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    if (import.meta.env.DEV) {
      (window as { __sphere?: unknown }).__sphere = {
        camera,
        tileMeshes,
        raycaster,
        launch: (i: number) => launchFromMesh(tileMeshes[i]),
      };
    }

    // keyboard support: arrows look around, Enter launches the centered tile
    const onKey = (e: KeyboardEvent) => {
      if (pausedRef.current) return;
      const step = 0.3;
      if (e.key === 'ArrowLeft') { targetYaw += step; lastInteract = performance.now(); }
      else if (e.key === 'ArrowRight') { targetYaw -= step; lastInteract = performance.now(); }
      else if (e.key === 'ArrowUp') { targetPitch = Math.min(targetPitch + step / 2, PITCH_MAX); }
      else if (e.key === 'ArrowDown') { targetPitch = Math.max(targetPitch - step / 2, -PITCH_MAX); }
      else if (e.key === 'Enter') {
        const forward = camera.getWorldDirection(new THREE.Vector3());
        let best: THREE.Mesh | null = null;
        let bestDot = -2;
        for (const mesh of tileMeshes) {
          const dot = (mesh.userData.dir as THREE.Vector3).dot(forward);
          if (dot > bestDot) { bestDot = dot; best = mesh; }
        }
        if (best) launchFromMesh(best);
      } else return;
      e.preventDefault();
    };
    wrap.addEventListener('keydown', onKey);

    /* ---------- render loop ---------- */

    let raf = 0;
    const ease = reduced ? 1 : 0.075;
    const scratch = new THREE.Vector3();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (pausedRef.current) return;

      // gentle idle drift after a few seconds without input
      if (!reduced && !dragging && performance.now() - lastInteract > 3000) {
        targetYaw += 0.00055;
      }
      // inertia after release
      if (!dragging && Math.abs(velYaw) > 0.0001) {
        targetYaw += velYaw;
        velYaw *= 0.94;
      }

      yaw += (targetYaw - yaw) * ease;
      pitch += (targetPitch - pitch) * ease;
      camera.rotation.set(pitch, yaw, 0);

      stars.rotation.y += 0.0004;

      // READY cartridges: pulsing gold frame + soft bounce toward the camera
      const t = performance.now() / 1000;
      for (const rt of readyTiles) {
        rt.haloMat.opacity = 0.22 + 0.32 * (0.5 + 0.5 * Math.sin(t * 2.6 + rt.phase));
        const bounce = reduced ? 0 : 0.09 + 0.11 * Math.max(0, Math.sin(t * 2.1 + rt.phase));
        const target = rt.mesh === hovered ? 0.5 : bounce;
        scratch.set(-rt.dir.x * target, -rt.dir.y * target, -rt.dir.z * target);
        rt.mesh.position.lerp(scratch, 0.14);
      }

      // hover highlight (desktop): pop the tile under the pointer toward the camera
      raycaster.setFromCamera(pointerNdc, camera);
      const hit = raycaster.intersectObjects(tileMeshes)[0];
      const next = (hit?.object as THREE.Mesh) ?? null;
      if (next !== hovered) {
        // ready tiles are driven by the bounce lerp above — gsap only handles the rest
        if (hovered && !isReadyTile(hovered)) {
          gsap.to(hovered.position, { x: 0, y: 0, z: 0, duration: 0.4, ease: 'power2.out' });
        }
        hovered = next;
        if (hovered && !dragging && !isReadyTile(hovered)) {
          const dir = (hovered.userData.dir as THREE.Vector3).clone();
          gsap.to(hovered.position, {
            x: -dir.x * 0.35,
            y: -dir.y * 0.35,
            z: -dir.z * 0.35,
            duration: 0.4,
            ease: 'power2.out',
          });
        }
        canvas.style.cursor = hovered ? 'pointer' : 'grab';
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      wrap.removeEventListener('keydown', onKey);
      tileMeshes.forEach((m) => {
        gsap.killTweensOf(m.position);
        m.geometry.dispose();
      });
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      haloGeos.forEach((g) => g.dispose());
      starGeo.dispose();
      starMat.dispose();
      renderer.dispose();
      wrap.removeChild(canvas);
    };
  }, []);

  return (
    <div
      className="sphere crt-fx"
      ref={wrapRef}
      tabIndex={0}
      role="application"
      aria-label="Spherical game gallery. Drag or use arrow keys to look around, Enter or tap to launch a game."
    >
      <span className="sphere__hud sphere__hud--tl term">SANDY_OS // GAME_VAULT.SPHERE</span>
      <span className="sphere__hud sphere__hud--tr term">● ONLINE — {GAMES.length} CARTRIDGES</span>
      <span className="sphere__hud sphere__hud--br term">COINS: ∞ // FREE PLAY</span>
      <div className="sphere__hint pixel">
        <span className="sphere__hint-long">DRAG TO LOOK AROUND ▪ TAP A CARTRIDGE TO PLAY</span>
        <span className="sphere__hint-short">DRAG ▪ TAP TO PLAY</span>
      </div>
      <div className="sphere__proxy" ref={proxyRef} aria-hidden="true" />
    </div>
  );
}
