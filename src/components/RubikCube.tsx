import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { sfx } from '../sound';

/**
 * Interactive Rubik's cube rendered in the sanblue palette.
 * Drag to spin the whole cube; click (no drag) to twist a random layer.
 */

const FACE_COLORS = {
  px: 0xf7c948, // gold
  nx: 0xff6ea9, // pink
  py: 0x5eead4, // mint
  ny: 0xa78bfa, // purple
  pz: 0x67e8f9, // cyan
  nz: 0xff7b6b, // coral
  inner: 0x131a43, // navy
};

interface Props {
  className?: string;
  /** spins idly and reacts slower — used on the boot screen */
  frantic?: boolean;
}

export default function RubikCube({ className, frantic = false }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(4.6, 3.6, 6.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(5, 8, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x67e8f9, 0.8);
    rim.position.set(-6, -3, -5);
    scene.add(rim);

    const cubeGroup = new THREE.Group();
    scene.add(cubeGroup);

    const GAP = 1.06;
    const geo = new THREE.BoxGeometry(0.96, 0.96, 0.96);
    const mat = (hex: number) =>
      new THREE.MeshStandardMaterial({ color: hex, roughness: 0.35, metalness: 0.08 });

    const cubelets: THREE.Mesh[] = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const mats = [
            mat(x === 1 ? FACE_COLORS.px : FACE_COLORS.inner),
            mat(x === -1 ? FACE_COLORS.nx : FACE_COLORS.inner),
            mat(y === 1 ? FACE_COLORS.py : FACE_COLORS.inner),
            mat(y === -1 ? FACE_COLORS.ny : FACE_COLORS.inner),
            mat(z === 1 ? FACE_COLORS.pz : FACE_COLORS.inner),
            mat(z === -1 ? FACE_COLORS.nz : FACE_COLORS.inner),
          ];
          const cubelet = new THREE.Mesh(geo, mats);
          cubelet.position.set(x * GAP, y * GAP, z * GAP);
          cubeGroup.add(cubelet);
          cubelets.push(cubelet);

          const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(geo),
            new THREE.LineBasicMaterial({ color: 0x0b0f2e })
          );
          cubelet.add(edges);
        }
      }
    }

    cubeGroup.rotation.set(0.45, -0.65, 0);

    // ----- layer twisting -----
    const pivot = new THREE.Group();
    scene.add(pivot);
    let twisting = false;

    const AXES = ['x', 'y', 'z'] as const;
    function twistRandomLayer() {
      if (twisting) return;
      twisting = true;
      sfx.twist();

      const axis = AXES[Math.floor(Math.random() * 3)];
      const layer = [-1, 0, 1][Math.floor(Math.random() * 3)] * GAP;
      const dir = Math.random() > 0.5 ? 1 : -1;

      pivot.rotation.set(0, 0, 0);
      pivot.updateMatrixWorld();

      const members = cubelets.filter(
        (c) => Math.abs(c.position[axis] - layer) < 0.01
      );
      members.forEach((c) => pivot.attach(c));

      gsap.to(pivot.rotation, {
        [axis]: (dir * Math.PI) / 2,
        duration: frantic ? 0.32 : 0.5,
        ease: 'back.out(1.4)',
        onComplete: () => {
          pivot.updateMatrixWorld();
          members.forEach((c) => {
            cubeGroup.attach(c);
            c.position.set(
              Math.round(c.position.x / GAP) * GAP,
              Math.round(c.position.y / GAP) * GAP,
              Math.round(c.position.z / GAP) * GAP
            );
            const e = new THREE.Euler().setFromQuaternion(c.quaternion);
            const snap = (r: number) => Math.round(r / (Math.PI / 2)) * (Math.PI / 2);
            c.rotation.set(snap(e.x), snap(e.y), snap(e.z));
          });
          twisting = false;
        },
      });
    }

    // pivot must rotate around cube center even while the whole cube spins,
    // so the pivot lives inside cubeGroup space
    cubeGroup.add(pivot);

    // ----- pointer interaction: drag = orbit, click = twist -----
    let dragging = false;
    let moved = 0;
    let lastX = 0;
    let lastY = 0;
    let velX = 0;
    let velY = 0;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      mount.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      lastX = e.clientX;
      lastY = e.clientY;
      cubeGroup.rotation.y += dx * 0.008;
      cubeGroup.rotation.x += dy * 0.008;
      velX = dx * 0.008;
      velY = dy * 0.008;
    };
    const onUp = () => {
      if (dragging && moved < 8) twistRandomLayer();
      dragging = false;
    };
    mount.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    // frantic boot mode: auto-twist on an interval
    let autoTwist: ReturnType<typeof setInterval> | undefined;
    if (frantic) {
      autoTwist = setInterval(twistRandomLayer, 600);
    }

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!dragging) {
        // inertia + gentle idle spin
        cubeGroup.rotation.y += velX + 0.004;
        cubeGroup.rotation.x += velY;
        velX *= 0.94;
        velY *= 0.94;
        cubeGroup.position.y = Math.sin(performance.now() / 1100) * 0.12;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      if (autoTwist) clearInterval(autoTwist);
      ro.disconnect();
      mount.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      gsap.killTweensOf(pivot.rotation);
      geo.dispose();
      cubelets.forEach((c) => {
        (c.material as THREE.Material[]).forEach((m) => m.dispose());
        c.children.forEach((child) => {
          const line = child as THREE.LineSegments;
          line.geometry?.dispose();
          (line.material as THREE.Material)?.dispose();
        });
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [frantic]);

  return <div ref={mountRef} className={className} style={{ touchAction: 'none' }} />;
}
