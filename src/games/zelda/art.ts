/**
 * Legend of the Mushroom Kingdom — procedural pixel art.
 * Every sprite and tile is drawn in code: bitmap strings for characters,
 * painterly-modern touches (soft shadows, glow, weather) layered on top
 * of crisp '80s pixels. No image assets anywhere.
 */

export const TILE = 32;

/* ---------- level themes (inspired by BOTW / Bowser's Fury / Odyssey shots) ---------- */

export interface Theme {
  name: string;
  floorA: string;
  floorB: string;
  wall: string;
  wallLight: string;
  mortar: string;
  water1: string;
  water2: string;
  tint: string; // rgba overlay for mood
  weather: 'petals' | 'sand' | 'leaves' | 'rain' | 'snow' | 'embers';
  decor: 'bush' | 'cactus' | 'rubble' | 'torch' | 'crystal' | 'skull';
}

export const THEMES: Theme[] = [
  {
    name: 'VERDANT PLAINS',
    floorA: '#79c860', floorB: '#6cb954',
    wall: '#9a6b48', wallLight: '#b5825c', mortar: '#6e4a30',
    water1: '#3fa9d9', water2: '#6cc6ec',
    tint: 'rgba(110, 231, 183, 0.05)',
    weather: 'petals', decor: 'bush',
  },
  {
    name: 'SANDSTONE BAZAAR',
    floorA: '#e8cf9a', floorB: '#dfc288',
    wall: '#cfa86a', wallLight: '#e4c084', mortar: '#a37e48',
    water1: '#3fb9c9', water2: '#7adce6',
    tint: 'rgba(247, 201, 72, 0.08)',
    weather: 'sand', decor: 'cactus',
  },
  {
    name: 'SUNSET RUINS',
    floorA: '#8aa15e', floorB: '#7d934f',
    wall: '#7d7a76', wallLight: '#98948e', mortar: '#55524e',
    water1: '#3f86d9', water2: '#6cb1ec',
    tint: 'rgba(255, 123, 107, 0.12)',
    weather: 'leaves', decor: 'rubble',
  },
  {
    name: 'STORMY FORTRESS',
    floorA: '#5d7a6a', floorB: '#52705f',
    wall: '#4a4f63', wallLight: '#5d6378', mortar: '#33374a',
    water1: '#27537a', water2: '#3a6f96',
    tint: 'rgba(19, 26, 67, 0.22)',
    weather: 'rain', decor: 'torch',
  },
  {
    name: 'CRYSTAL TEMPLE',
    floorA: '#9fb8c8', floorB: '#8fa9bb',
    wall: '#6e84a8', wallLight: '#8aa2c4', mortar: '#4a5d7d',
    water1: '#5dc6e8', water2: '#9fe5f5',
    tint: 'rgba(103, 232, 249, 0.10)',
    weather: 'snow', decor: 'crystal',
  },
  {
    name: "BOWSER'S KEEP",
    floorA: '#5a4a4a', floorB: '#4f4040',
    wall: '#3a3038', wallLight: '#4c3f48', mortar: '#241d24',
    water1: '#e85d2a', water2: '#ffa23e',
    tint: 'rgba(255, 93, 93, 0.10)',
    weather: 'embers', decor: 'skull',
  },
];

/* ---------- bitmap sprites ---------- */

type ColorMap = Record<string, string>;

export function drawBitmap(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  colors: ColorMap,
  x: number,
  y: number,
  px: number
) {
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const ch = rows[r][c];
      if (ch === '.') continue;
      const fill = colors[ch];
      if (!fill) continue;
      ctx.fillStyle = fill;
      ctx.fillRect(x + c * px, y + r * px, px + 0.4, px + 0.4);
    }
  }
}

export const HERO_DOWN = [
  '....gggg....',
  '...gggggg...',
  '..gggggggg..',
  '..ffffffff..',
  '..feffffef..',
  '..ffffffff..',
  '.GGGGGGGGGG.',
  'sGGGGGGGGGGs',
  '..kkkkkkkk..',
  '..LL....LL..',
  '..LL....LL..',
  '.bbb....bbb.',
];

export const HERO_UP = [
  '....gggg....',
  '...gggggg...',
  '..gggggggg..',
  '..gggggggg..',
  '..ffffffff..',
  '..ffffffff..',
  '.GGGGGGGGGG.',
  'sGGGGGGGGGGs',
  '..kkkkkkkk..',
  '..LL....LL..',
  '..LL....LL..',
  '.bbb....bbb.',
];

export const HERO_SIDE = [
  '....gggg....',
  '...gggggg...',
  '..gggggggg..',
  '..ffffffff..',
  '..fffffeff..',
  '..ffffffff..',
  '.GGGGGGGGG..',
  '.GGGGGGGGGs.',
  '..kkkkkkkk..',
  '...LL..LL...',
  '...LL..LL...',
  '..bbb..bbb..',
];

export const HERO_COLORS: ColorMap = {
  g: '#2fbf71', // cap
  f: '#f6c89f', // skin
  e: '#131a43', // eyes
  G: '#27a35f', // tunic
  s: '#f6c89f', // arms
  k: '#5b3a1e', // belt
  L: '#8a5a2b', // legs
  b: '#6e4520', // boots
};

export const GOOMBA = [
  '...bbbb...',
  '..bbbbbb..',
  '.bbbbbbbb.',
  '.bwbbbbwb.',
  '.bpbbbbpb.',
  'bbbbbbbbbb',
  '.ffffffff.',
  '..ffffff..',
  '.ll....ll.',
  '.ll....ll.',
];

export const GOOMBA_COLORS: ColorMap = {
  b: '#9a6b48',
  w: '#f2edda',
  p: '#131a43',
  f: '#e8cf9a',
  l: '#5b3a1e',
};

export const TURTLE = [
  '...hhhh...',
  '..hwhhwh..',
  '..hhhhhh..',
  '.SSSSSSSS.',
  'SSsSSsSSsS',
  'SSSSSSSSSS',
  'SsSSsSSsSS',
  '.SSSSSSSS.',
  '.ff....ff.',
  '.ff....ff.',
];

export const TURTLE_COLORS: ColorMap = {
  h: '#9ed75f',
  w: '#131a43',
  S: '#2fa05a',
  s: '#1d7a40',
  f: '#e8cf9a',
};

export const PIRANHA = [
  '...rrrrrr...',
  '..rwrrrrwr..',
  '.rrrrrrrrrr.',
  '.rWWWWWWWWr.',
  '.rWtWWtWWWr.',
  '.rrrrrrrrrr.',
  '..rwrrrrwr..',
  '...rrrrrr...',
  '.....GG.....',
  '....lGGl....',
  '.....GG.....',
  '....GGGG....',
];

export const PIRANHA_COLORS: ColorMap = {
  r: '#e8482f',
  w: '#f2edda',
  W: '#f2edda',
  t: '#131a43',
  G: '#2fa05a',
  l: '#9ed75f',
};

export const BOSS = [
  '..hh......hh..',
  '.hhhh....hhhh.',
  '.hhhhhhhhhhhh.',
  '..gggggggggg..',
  '.gwwgggggwwgg.',
  '.gppgggggppgg.',
  '.gggggggggggg.',
  '.ggrrrrrrrggg.',
  'SSSSSSSSSSSSSS',
  'SsSSsSSsSSsSSS',
  'SSSSSSSSSSSSSS',
  'SsSSsSSsSSsSSS',
  '.SSSSSSSSSSSS.',
  '.ff..ff..ff...',
];

export const BOSS_COLORS: ColorMap = {
  h: '#ffa23e', // horns
  g: '#6fae3e', // head
  w: '#f2edda',
  p: '#e8482f', // angry pupils
  r: '#f2edda', // teeth
  S: '#3a5f2a', // shell
  s: '#7fd75f', // shell studs
  f: '#e8cf9a',
};

export const HEART_PICKUP = [
  '.hh.hh.',
  'hhhhhhh',
  'hhhhhhh',
  '.hhhhh.',
  '..hhh..',
  '...h...',
];

/* ---------- tiles ---------- */

function hash2(x: number, y: number) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

export function drawFloor(ctx: CanvasRenderingContext2D, theme: Theme, tx: number, ty: number, px: number, py: number) {
  ctx.fillStyle = theme.floorA;
  ctx.fillRect(px, py, TILE, TILE);
  // deterministic speckle so the ground feels hand-placed, not noisy
  for (let i = 0; i < 3; i++) {
    const r1 = hash2(tx * 7 + i, ty * 13 + i);
    const r2 = hash2(tx * 17 + i * 3, ty * 5 + i * 7);
    if (r1 > 0.45) {
      ctx.fillStyle = theme.floorB;
      ctx.fillRect(px + Math.floor(r1 * 7) * 4, py + Math.floor(r2 * 7) * 4, 4, 4);
    }
  }
}

export function drawWall(ctx: CanvasRenderingContext2D, theme: Theme, px: number, py: number) {
  ctx.fillStyle = theme.wall;
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = theme.mortar;
  for (let row = 0; row < 4; row++) {
    ctx.fillRect(px, py + row * 8 + 6, TILE, 2);
    const off = row % 2 === 0 ? 8 : 20;
    ctx.fillRect(px + off, py + row * 8, 2, 8);
  }
  // modern touch: soft top highlight + bottom shade
  ctx.fillStyle = theme.wallLight;
  ctx.fillRect(px, py, TILE, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(px, py + TILE - 3, TILE, 3);
}

export function drawWater(ctx: CanvasRenderingContext2D, theme: Theme, tx: number, ty: number, px: number, py: number, t: number) {
  ctx.fillStyle = theme.water1;
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = theme.water2;
  const phase = Math.sin(t * 2 + tx * 1.3 + ty * 2.1);
  ctx.fillRect(px + 4, py + 8 + Math.round(phase * 3), 10, 3);
  ctx.fillRect(px + 18, py + 20 - Math.round(phase * 3), 9, 3);
}

export function drawQBlock(ctx: CanvasRenderingContext2D, px: number, py: number, t: number) {
  const glow = 5 + Math.sin(t * 3.2) * 3;
  ctx.save();
  ctx.shadowColor = '#f7c948';
  ctx.shadowBlur = glow;
  ctx.fillStyle = '#f7c948';
  ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
  ctx.restore();
  ctx.fillStyle = '#b07c1f';
  ctx.fillRect(px + 2, py + 2, TILE - 4, 3);
  ctx.fillRect(px + 2, py + TILE - 5, TILE - 4, 3);
  [
    [5, 5],
    [TILE - 9, 5],
    [5, TILE - 9],
    [TILE - 9, TILE - 9],
  ].forEach(([dx, dy]) => {
    ctx.fillStyle = '#8a5e12';
    ctx.fillRect(px + dx, py + dy, 4, 4);
  });
  ctx.fillStyle = '#fff8e1';
  ctx.font = `bold 16px "Press Start 2P", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', px + TILE / 2, py + TILE / 2 + 2);
}

export function drawUsedBlock(ctx: CanvasRenderingContext2D, px: number, py: number) {
  ctx.fillStyle = '#8a6a4a';
  ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
  ctx.fillStyle = '#6e4f33';
  [
    [6, 6],
    [TILE - 10, 6],
    [6, TILE - 10],
    [TILE - 10, TILE - 10],
  ].forEach(([dx, dy]) => ctx.fillRect(px + dx, py + dy, 4, 4));
}

export function drawSpike(ctx: CanvasRenderingContext2D, theme: Theme, px: number, py: number) {
  drawFloor(ctx, theme, 0, 0, px, py);
  ctx.fillStyle = '#7d8294';
  for (let i = 0; i < 3; i++) {
    const sx = px + 4 + i * 9;
    ctx.beginPath();
    ctx.moveTo(sx, py + TILE - 4);
    ctx.lineTo(sx + 4, py + 8);
    ctx.lineTo(sx + 8, py + TILE - 4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#aeb4c8';
  for (let i = 0; i < 3; i++) {
    const sx = px + 4 + i * 9;
    ctx.fillRect(sx + 3, py + 10, 2, 6);
  }
}

export function drawPipe(ctx: CanvasRenderingContext2D, px: number, py: number, t: number, unlocked: boolean) {
  if (unlocked) {
    ctx.save();
    ctx.shadowColor = '#5eead4';
    ctx.shadowBlur = 10 + Math.sin(t * 4) * 5;
  }
  ctx.fillStyle = unlocked ? '#2fbf71' : '#5f7a68';
  ctx.fillRect(px + 4, py + 8, TILE - 8, TILE - 8);
  ctx.fillStyle = unlocked ? '#27a35f' : '#4d6354';
  ctx.fillRect(px + 1, py + 2, TILE - 2, 10);
  ctx.fillStyle = unlocked ? '#7fe7ae' : '#7a937f';
  ctx.fillRect(px + 1, py + 2, TILE - 2, 3);
  ctx.fillRect(px + 7, py + 12, 4, TILE - 14);
  if (unlocked) ctx.restore();
  if (!unlocked) {
    ctx.fillStyle = '#f2edda';
    ctx.font = '11px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔒', px + TILE / 2, py + TILE / 2 + 4);
  }
}

export function drawChest(ctx: CanvasRenderingContext2D, px: number, py: number, opened: boolean, t: number) {
  if (!opened) {
    ctx.save();
    ctx.shadowColor = '#f7c948';
    ctx.shadowBlur = 6 + Math.sin(t * 2.6) * 3;
  }
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(px + 4, py + 8, TILE - 8, TILE - 12);
  ctx.fillStyle = '#6e4520';
  ctx.fillRect(px + 4, py + 8, TILE - 8, 6);
  ctx.fillStyle = '#f7c948';
  ctx.fillRect(px + TILE / 2 - 3, py + 12, 6, 8);
  if (!opened) ctx.restore();
  if (opened) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(px + 7, py + 11, TILE - 14, 8);
  }
}

export function drawDecor(ctx: CanvasRenderingContext2D, theme: Theme, px: number, py: number, t: number) {
  const cx = px + TILE / 2;
  switch (theme.decor) {
    case 'bush': {
      ctx.fillStyle = '#2fa05a';
      ctx.beginPath();
      ctx.arc(cx - 6, py + 22, 8, 0, Math.PI * 2);
      ctx.arc(cx + 6, py + 22, 8, 0, Math.PI * 2);
      ctx.arc(cx, py + 16, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7fd75f';
      ctx.fillRect(cx - 4, py + 14, 3, 3);
      ctx.fillRect(cx + 4, py + 19, 3, 3);
      break;
    }
    case 'cactus': {
      ctx.fillStyle = '#3da963';
      ctx.fillRect(cx - 3, py + 8, 6, 20);
      ctx.fillRect(cx - 11, py + 12, 6, 4);
      ctx.fillRect(cx - 11, py + 12, 4, 10);
      ctx.fillRect(cx + 5, py + 16, 6, 4);
      ctx.fillRect(cx + 7, py + 8, 4, 12);
      break;
    }
    case 'rubble': {
      ctx.fillStyle = '#7d7a76';
      ctx.fillRect(px + 6, py + 18, 10, 8);
      ctx.fillRect(px + 18, py + 22, 8, 6);
      ctx.fillRect(px + 12, py + 10, 7, 7);
      break;
    }
    case 'torch': {
      ctx.fillStyle = '#5b3a1e';
      ctx.fillRect(cx - 2, py + 14, 4, 14);
      const flick = Math.sin(t * 9 + px) * 2;
      ctx.save();
      ctx.shadowColor = '#ffa23e';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffa23e';
      ctx.beginPath();
      ctx.arc(cx, py + 10 + flick * 0.4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe08a';
      ctx.beginPath();
      ctx.arc(cx, py + 11, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'crystal': {
      ctx.save();
      ctx.shadowColor = '#67e8f9';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#9fe5f5';
      ctx.beginPath();
      ctx.moveTo(cx, py + 6);
      ctx.lineTo(cx + 7, py + 20);
      ctx.lineTo(cx, py + 28);
      ctx.lineTo(cx - 7, py + 20);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(cx - 1, py + 10, 2, 8);
      break;
    }
    case 'skull': {
      ctx.fillStyle = '#d8d2c4';
      ctx.fillRect(cx - 6, py + 14, 12, 9);
      ctx.fillRect(cx - 4, py + 23, 8, 4);
      ctx.fillStyle = '#241d24';
      ctx.fillRect(cx - 4, py + 17, 3, 3);
      ctx.fillRect(cx + 1, py + 17, 3, 3);
      break;
    }
  }
}

export function drawCoin(ctx: CanvasRenderingContext2D, px: number, py: number, t: number) {
  const squash = Math.abs(Math.sin(t * 3 + px * 0.3));
  const w = 5 + squash * 4;
  ctx.save();
  ctx.shadowColor = '#f7c948';
  ctx.shadowBlur = 7;
  ctx.fillStyle = '#f7c948';
  ctx.beginPath();
  ctx.ellipse(px + TILE / 2, py + TILE / 2, w, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#b07c1f';
  ctx.fillRect(px + TILE / 2 - 1, py + TILE / 2 - 5, 2, 10);
}

export function drawKey(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const bob = Math.sin(t * 3) * 3;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.shadowColor = '#f7c948';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = '#f7c948';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -4, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#f7c948';
  ctx.fillRect(-1.5, 0, 3, 12);
  ctx.fillRect(0, 7, 5, 3);
  ctx.fillRect(0, 11, 4, 3);
  ctx.restore();
}
