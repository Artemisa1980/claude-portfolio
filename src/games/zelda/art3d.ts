/**
 * Legend of the Mushroom Kingdom — 3D environment kit.
 * Voxel-sprite characters extruded from the 8-bit bitmaps, procedural
 * textures, GLSL water/lava, gradient sky domes and per-world lighting.
 * Modern engine feel ('Unreal-style' light + fog + shadows) wrapped
 * around honest '80s pixels.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/* ---------- per-world environment (lighting / sky / fog / weather) ---------- */

export interface Env {
  name: string;
  skyTop: string;
  skyBottom: string;
  fog: string;
  fogDensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  sunColor: string;
  sunIntensity: number;
  sunPos: [number, number, number];
  floorA: string;
  floorB: string;
  brick: { base: string; mortar: string };
  water1: string;
  water2: string;
  weather: 'petals' | 'sand' | 'leaves' | 'rain' | 'snow' | 'embers';
  weatherColor: string;
  decor: 'bush' | 'cactus' | 'rubble' | 'torch' | 'crystal' | 'skull';
}

export const ENVS: Env[] = [
  {
    name: 'VERDANT PLAINS',
    skyTop: '#7ec8e8', skyBottom: '#d8f0d0', fog: '#bfe3c8', fogDensity: 0.022,
    hemiSky: '#cfe8ff', hemiGround: '#6fae5e', hemiIntensity: 0.9,
    sunColor: '#fff2cf', sunIntensity: 2.6, sunPos: [12, 18, 8],
    floorA: '#79c860', floorB: '#67b350',
    brick: { base: '#a87454', mortar: '#74503a' },
    water1: '#2f88c9', water2: '#7adcec',
    weather: 'petals', weatherColor: '#ff9ec4', decor: 'bush',
  },
  {
    name: 'SANDSTONE BAZAAR',
    skyTop: '#8fd4e8', skyBottom: '#f4e3b2', fog: '#ecd9a8', fogDensity: 0.024,
    hemiSky: '#fff4d8', hemiGround: '#caa05e', hemiIntensity: 1.0,
    sunColor: '#ffeebb', sunIntensity: 3.0, sunPos: [-10, 20, 6],
    floorA: '#e8cf9a', floorB: '#d9bd80',
    brick: { base: '#d9b274', mortar: '#a37e48' },
    water1: '#28a0b8', water2: '#8ce8ee',
    weather: 'sand', weatherColor: '#e0c27e', decor: 'cactus',
  },
  {
    name: 'SUNSET RUINS',
    skyTop: '#ff9a56', skyBottom: '#ffd9a0', fog: '#e8a070', fogDensity: 0.028,
    hemiSky: '#ffc098', hemiGround: '#7a6a48', hemiIntensity: 0.75,
    sunColor: '#ffb070', sunIntensity: 2.6, sunPos: [-14, 8, -6],
    floorA: '#8aa15e', floorB: '#79904e',
    brick: { base: '#8a8682', mortar: '#5c5854' },
    water1: '#3a6fb0', water2: '#7ab0e0',
    weather: 'leaves', weatherColor: '#ff8a5c', decor: 'rubble',
  },
  {
    name: 'STORMY FORTRESS',
    skyTop: '#2a3550', skyBottom: '#4a5a70', fog: '#3a4458', fogDensity: 0.035,
    hemiSky: '#5a6a88', hemiGround: '#2c3848', hemiIntensity: 0.55,
    sunColor: '#9fb4d8', sunIntensity: 1.2, sunPos: [8, 16, -10],
    floorA: '#5d7a6a', floorB: '#4e6a5b',
    brick: { base: '#525870', mortar: '#33374a' },
    water1: '#1d4060', water2: '#3a6f96',
    weather: 'rain', weatherColor: '#a8d2f0', decor: 'torch',
  },
  {
    name: 'CRYSTAL TEMPLE',
    skyTop: '#9fd4f0', skyBottom: '#e8f6ff', fog: '#cfe8f4', fogDensity: 0.026,
    hemiSky: '#e8f8ff', hemiGround: '#8aa6c0', hemiIntensity: 0.95,
    sunColor: '#dff2ff', sunIntensity: 2.2, sunPos: [10, 18, 10],
    floorA: '#a8c0d0', floorB: '#94aec2',
    brick: { base: '#7a92b8', mortar: '#4a5d7d' },
    water1: '#4ab8e0', water2: '#bff0fa',
    weather: 'snow', weatherColor: '#f4faff', decor: 'crystal',
  },
  {
    name: "BOWSER'S KEEP",
    skyTop: '#1a0f1c', skyBottom: '#5c2018', fog: '#38161a', fogDensity: 0.034,
    hemiSky: '#6a3030', hemiGround: '#241418', hemiIntensity: 0.5,
    sunColor: '#ff8a50', sunIntensity: 1.3, sunPos: [0, 14, -12],
    floorA: '#5a4a4a', floorB: '#4a3c3c',
    brick: { base: '#463844', mortar: '#241d24' },
    water1: '#ff5d2a', water2: '#ffc23e', // lava
    weather: 'embers', weatherColor: '#ffa23e', decor: 'skull',
  },
];

/* ---------- gradient sky dome ---------- */

export function makeSky(env: Env): THREE.Mesh {
  const geo = new THREE.SphereGeometry(60, 16, 12);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Color(env.skyTop) },
      bottom: { value: new THREE.Color(env.skyBottom) },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 top;
      uniform vec3 bottom;
      varying vec3 vPos;
      void main() {
        float h = normalize(vPos).y * 0.5 + 0.5;
        gl_FragColor = vec4(mix(bottom, top, smoothstep(0.15, 0.8, h)), 1.0);
      }
    `,
  });
  return new THREE.Mesh(geo, mat);
}

/* ---------- GLSL water / lava ---------- */

export function makeLiquidMaterial(env: Env): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      c1: { value: new THREE.Color(env.water1) },
      c2: { value: new THREE.Color(env.water2) },
      fogColor: { value: new THREE.Color(env.fog) },
      fogDensity: { value: env.fogDensity },
    },
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorld;
      void main() {
        vec3 p = position;
        vec4 w = modelMatrix * vec4(p, 1.0);
        w.y += sin(uTime * 2.2 + w.x * 2.6 + w.z * 1.8) * 0.045;
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 c1;
      uniform vec3 c2;
      uniform vec3 fogColor;
      uniform float fogDensity;
      varying vec3 vWorld;
      void main() {
        float w = sin(vWorld.x * 6.0 + uTime * 2.4) * sin(vWorld.z * 6.0 - uTime * 1.9);
        float sparkle = step(0.93, fract(sin(dot(floor(vWorld.xz * 8.0), vec2(12.98, 78.23))) * 43758.5) + 0.06 * sin(uTime * 3.0));
        vec3 col = mix(c1, c2, smoothstep(-0.35, 0.7, w));
        col += sparkle * 0.35;
        float dist = length(vWorld - cameraPosition);
        float f = 1.0 - exp(-fogDensity * fogDensity * dist * dist);
        gl_FragColor = vec4(mix(col, fogColor, f), 0.94);
      }
    `,
  });
}

/* ---------- procedural textures ---------- */

const texCache = new Map<string, THREE.CanvasTexture>();

function canvasTex(key: string, draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 128): THREE.CanvasTexture {
  const hit = texCache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d')!, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  texCache.set(key, tex);
  return tex;
}

export function brickTexture(env: Env): THREE.CanvasTexture {
  return canvasTex(`brick-${env.brick.base}`, (ctx, S) => {
    ctx.fillStyle = env.brick.base;
    ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = env.brick.mortar;
    const rows = 4;
    for (let r = 0; r < rows; r++) {
      ctx.fillRect(0, (r * S) / rows, S, 4);
      const off = r % 2 === 0 ? S / 4 : (S * 3) / 8 + S / 4;
      ctx.fillRect(off, (r * S) / rows, 4, S / rows);
      ctx.fillRect((off + S / 2) % S, (r * S) / rows, 4, S / rows);
    }
    // bevel light
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(0, 0, S, 5);
  });
}

export function qBlockTexture(): THREE.CanvasTexture {
  return canvasTex('qblock', (ctx, S) => {
    ctx.fillStyle = '#f7c948';
    ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = '#b07c1f';
    [[10, 10], [S - 22, 10], [10, S - 22], [S - 22, S - 22]].forEach(([x, y]) => ctx.fillRect(x, y, 12, 12));
    ctx.fillStyle = '#fff8e1';
    ctx.font = `bold ${S * 0.55}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', S / 2, S / 2 + 6);
  });
}

export function usedBlockTexture(): THREE.CanvasTexture {
  return canvasTex('usedblock', (ctx, S) => {
    ctx.fillStyle = '#8a6a4a';
    ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = '#6e4f33';
    [[14, 14], [S - 26, 14], [14, S - 26], [S - 26, S - 26]].forEach(([x, y]) => ctx.fillRect(x, y, 12, 12));
  });
}

/* ---------- voxel sprites from pixel bitmaps ---------- */

/** Extrude a bitmap into a standing voxel panel: one merged geometry per color. */
export function buildVoxelSprite(rows: string[], colors: Record<string, string>, px = 0.115, depth = 0.115): THREE.Group {
  const group = new THREE.Group();
  const byColor = new Map<string, THREE.BoxGeometry[]>();
  const H = rows.length;
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const ch = rows[r][c];
      if (ch === '.' || !colors[ch]) continue;
      const g = new THREE.BoxGeometry(px, px, depth);
      g.translate((c - rows[r].length / 2) * px, (H - r) * px, 0);
      const list = byColor.get(colors[ch]) ?? [];
      list.push(g);
      byColor.set(colors[ch], list);
    }
  }
  for (const [color, geos] of byColor) {
    const merged = mergeGeometries(geos);
    geos.forEach((g) => g.dispose());
    const mesh = new THREE.Mesh(
      merged,
      new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.05 })
    );
    mesh.castShadow = true;
    group.add(mesh);
  }
  return group;
}

export function disposeObject(obj: THREE.Object3D) {
  obj.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else if (mat && !(mat as THREE.Material & { __shared?: boolean }).__shared) mat.dispose();
  });
}

/* ---------- small prop builders ---------- */

export function makeCoin(): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.06, 14),
    new THREE.MeshStandardMaterial({ color: '#f7c948', emissive: '#a87814', emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.6 })
  );
  mesh.rotation.z = Math.PI / 2;
  mesh.castShadow = true;
  return mesh;
}

export function makeKey(): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#f7c948', emissive: '#b8860b', emissiveIntensity: 1.1, roughness: 0.25, metalness: 0.7 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.045, 8, 14), mat);
  ring.position.y = 0.26;
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.34, 0.07), mat);
  shaft.position.y = -0.02;
  const tooth1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.07), mat);
  tooth1.position.set(0.08, -0.12, 0);
  const tooth2 = tooth1.clone();
  tooth2.position.y = -0.02;
  g.add(ring, shaft, tooth1, tooth2);
  g.traverse((o) => { (o as THREE.Mesh).castShadow = true; });
  return g;
}

export function makeHeart(): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#ff5d7e', emissive: '#8a1030', emissiveIntensity: 0.9, roughness: 0.4 });
  const a = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), mat);
  a.position.set(-0.08, 0.06, 0);
  const b = a.clone();
  b.position.x = 0.08;
  const c = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.26, 4), mat);
  c.rotation.y = Math.PI / 4;
  c.rotation.x = Math.PI;
  c.position.y = -0.1;
  g.add(a, b, c);
  return g;
}

export function makePipe(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 0.55, 16),
    new THREE.MeshStandardMaterial({ color: '#2fbf71', roughness: 0.45 })
  );
  body.position.y = 0.27;
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.22, 16),
    new THREE.MeshStandardMaterial({ color: '#27a35f', roughness: 0.4 })
  );
  rim.position.y = 0.6;
  const hole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16),
    new THREE.MeshStandardMaterial({ color: '#08260f', roughness: 1 })
  );
  hole.position.y = 0.72;
  g.add(body, rim, hole);
  g.traverse((o) => { (o as THREE.Mesh).castShadow = true; });
  return g;
}

export function makeChest(): { group: THREE.Group; lid: THREE.Mesh } {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: '#8a5a2b', roughness: 0.7 });
  const gold = new THREE.MeshStandardMaterial({ color: '#f7c948', emissive: '#7a5a10', emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.3 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.3, 0.44), wood);
  base.position.y = 0.15;
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.18, 0.44), wood);
  lid.position.set(0, 0.39, 0);
  lid.geometry.translate(0, 0.09, -0.22); // hinge at the back
  lid.position.z = 0.22;
  lid.position.y = 0.3;
  const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.05), gold);
  clasp.position.set(0, 0.3, 0.23);
  g.add(base, lid, clasp);
  g.traverse((o) => { (o as THREE.Mesh).castShadow = true; });
  return { group: g, lid };
}

export function makeDecor(env: Env): THREE.Group {
  const g = new THREE.Group();
  switch (env.decor) {
    case 'bush': {
      const mat = new THREE.MeshStandardMaterial({ color: '#2fa05a', roughness: 0.8 });
      [[-0.14, 0.16, 0, 0.18], [0.14, 0.16, 0.04, 0.18], [0, 0.28, -0.02, 0.2]].forEach(([x, y, z, r]) => {
        const s = new THREE.Mesh(new THREE.SphereGeometry(r, 9, 8), mat);
        s.position.set(x, y, z);
        s.castShadow = true;
        g.add(s);
      });
      break;
    }
    case 'cactus': {
      const mat = new THREE.MeshStandardMaterial({ color: '#3da963', roughness: 0.7 });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.7, 8), mat);
      trunk.position.y = 0.35;
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 8), mat);
      arm.position.set(0.2, 0.45, 0);
      arm.rotation.z = -0.5;
      trunk.castShadow = arm.castShadow = true;
      g.add(trunk, arm);
      break;
    }
    case 'rubble': {
      const mat = new THREE.MeshStandardMaterial({ color: '#8a8682', roughness: 0.9 });
      [[-0.15, 0.1, 0.1, 0.2], [0.15, 0.08, -0.08, 0.16], [0, 0.2, 0, 0.13]].forEach(([x, y, z, s]) => {
        const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), mat);
        m.position.set(x, y, z);
        m.castShadow = true;
        g.add(m);
      });
      break;
    }
    case 'torch': {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.06, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: '#5b3a1e', roughness: 0.8 })
      );
      pole.position.y = 0.4;
      pole.castShadow = true;
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 8, 8),
        new THREE.MeshStandardMaterial({ color: '#ffa23e', emissive: '#ff7a1e', emissiveIntensity: 2.4 })
      );
      flame.position.y = 0.92;
      flame.name = 'flame';
      g.add(pole, flame);
      break;
    }
    case 'crystal': {
      const mat = new THREE.MeshStandardMaterial({
        color: '#9fe5f5', emissive: '#3ab8d8', emissiveIntensity: 0.9, roughness: 0.15, metalness: 0.1,
      });
      const big = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), mat);
      big.position.y = 0.3;
      big.scale.y = 1.7;
      const small = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), mat);
      small.position.set(0.2, 0.16, 0.1);
      small.scale.y = 1.6;
      big.castShadow = small.castShadow = true;
      g.add(big, small);
      break;
    }
    case 'skull': {
      const bone = new THREE.MeshStandardMaterial({ color: '#d8d2c4', roughness: 0.7 });
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.26, 0.26), bone);
      head.position.y = 0.2;
      const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.2), bone);
      jaw.position.y = 0.06;
      const eyeMat = new THREE.MeshStandardMaterial({ color: '#241d24' });
      const e1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.05), eyeMat);
      e1.position.set(-0.07, 0.22, 0.13);
      const e2 = e1.clone();
      e2.position.x = 0.07;
      head.castShadow = true;
      g.add(head, jaw, e1, e2);
      break;
    }
  }
  return g;
}
