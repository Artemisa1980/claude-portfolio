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
  const didDrag = useRef(false);

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
    const step = (dir: number) => {
      setFocused((f) => {
        const next = Math.max(0, Math.min(GAMES.length - 1, f + dir));
        if (next !== f) sfx.hover();
        return next;
      });
    };
    const onKey = (e: KeyboardEvent) => {
      if (!inView) return;
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      io.disconnect();
      window.removeEventListener('keydown', onKey);
    };
  }, [paused]);

  const shake = (el: HTMLElement) => {
    sfx.locked();
    gsap.fromTo(el, { x: '-=8' }, { x: '+=16', duration: 0.07, repeat: 5, yoyo: true, clearProps: 'x' });
  };

  const onCabClick = (i: number, el: HTMLElement) => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
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
        onPointerDown={(e) => { didDrag.current = false; dragX.current = e.clientX; }}
        onPointerUp={(e) => {
          if (dragX.current === null) return;
          const dx = e.clientX - dragX.current;
          dragX.current = null;
          if (Math.abs(dx) > 40) {
            didDrag.current = true;
            focus(dx < 0 ? focused + 1 : focused - 1);
          } else {
            didDrag.current = false;
          }
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
