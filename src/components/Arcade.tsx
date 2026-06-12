import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import RubikCube from './RubikCube';
import PacToe from './PacToe';
import { GAMES } from '../data';
import { sfx } from '../sound';

gsap.registerPlugin(ScrollTrigger);

type Phase = 'idle' | 'booting' | 'playing';

export default function Arcade() {
  const rootRef = useRef<HTMLElement>(null);
  const bootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');

  // cabinets rise from below as you scroll in
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.cab',
        { y: 90, opacity: 0, rotateX: 18 },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.8,
          stagger: 0.14,
          ease: 'back.out(1.3)',
          scrollTrigger: { trigger: '.arcade__grid', start: 'top 80%' },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  // arcade boot sequence: coin drop → rubik cube cartridge loader → game
  useEffect(() => {
    if (phase !== 'booting') return;
    sfx.coin();
    const q = gsap.utils.selector(bootRef);
    const progress = { v: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        sfx.boot();
        setPhase('playing');
      },
    });
    tl.fromTo(
      q('.boot__coin'),
      { y: -240, rotate: 0, opacity: 0 },
      { y: 0, rotate: 720, opacity: 1, duration: 0.8, ease: 'bounce.out' }
    )
      .fromTo(q('.boot__title'), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4 }, '-=0.2')
      .fromTo(q('.boot__cube'), { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' })
      .to(progress, {
        v: 100,
        duration: 3.4,
        ease: 'steps(34)',
        onUpdate: () => {
          const pct = Math.round(progress.v);
          if (barRef.current) barRef.current.style.width = `${pct}%`;
          if (pctRef.current) pctRef.current.textContent = `${pct}%`;
        },
      })
      .to(bootRef.current, { opacity: 0, duration: 0.3 });
    return () => {
      tl.kill();
    };
  }, [phase]);

  function onCabinet(ready: boolean, el: HTMLElement) {
    if (ready) {
      setPhase('booting');
    } else {
      sfx.locked();
      gsap.fromTo(el, { x: -8 }, { x: 8, duration: 0.07, repeat: 5, yoyo: true, clearProps: 'x' });
    }
  }

  return (
    <section className="section crt crt-fx" id="arcade" ref={rootRef}>
      <div className="arcade__head">
        <div className="section-tag" style={{ background: 'var(--gold)' }}>
          🕹️ ARCADE STATION 🕹️
        </div>
        <h2 className="section-title" style={{ color: 'var(--cream)' }}>
          SANDY'S <span style={{ color: 'var(--mint)' }}>DEV-STATION</span>
        </h2>
        <p className="arcade__sub">CLASSIC '80s ARCADE CABINETS • 4 CARTRIDGE SLOTS • INSERT COIN</p>
      </div>

      <div className="arcade__grid">
        {GAMES.map((g) => (
          <article
            key={g.id}
            className={`cab ${g.ready ? '' : 'cab--locked'}`}
            onClick={(e) => onCabinet(g.ready, e.currentTarget)}
            onMouseEnter={() => sfx.hover()}
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

      {phase === 'booting' && (
        <div className="boot crt-fx" ref={bootRef}>
          <div className="boot__coin">🪙</div>
          <div className="boot__title">INSERT COIN ▸ LOADING CARTRIDGE</div>
          <div className="boot__cube">
            <RubikCube frantic />
          </div>
          <div className="boot__hint">SOLVING THE LOAD-CUBE… CLICK IT TO HELP!</div>
          <div className="boot__bar">
            <div className="boot__bar-fill" ref={barRef} />
          </div>
          <span className="boot__pct" ref={pctRef}>0%</span>
        </div>
      )}

      {phase === 'playing' && <PacToe onExit={() => { sfx.click(); setPhase('idle'); }} />}
    </section>
  );
}
