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

/** Owns the launch lifecycle: zoom into the cabinet screen → cartridge boot → game → exit. */
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
