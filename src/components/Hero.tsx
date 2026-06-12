import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import RubikCube from './RubikCube';
import { PROFILE } from '../data';
import { sfx } from '../sound';

const TYPE_PHRASES = [
  'From Starbucks Barista to Retro DeV_',
  'UTEL BBA Student & AI Builder Apprentice_',
  '15 yrs hospitality × AI Builder_',
  'Press START to explore_',
];

export default function Hero({ booted }: { booted: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  const starsRef = useRef<HTMLCanvasElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);

  // pixel starfield
  useEffect(() => {
    const canvas = starsRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const stars = Array.from({ length: 140 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: Math.random() * 2.4 + 0.8,
      v: Math.random() * 0.0006 + 0.0001,
      c: ['#f7c948', '#ff6ea9', '#67e8f9', '#5eead4', '#a78bfa', '#f2edda'][
        Math.floor(Math.random() * 6)
      ],
      tw: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = performance.now() / 1000;
      for (const st of stars) {
        st.y += st.v;
        if (st.y > 1) st.y = 0;
        const alpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + st.tw));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = st.c;
        // square pixels — it's the '80s
        ctx.fillRect(st.x * canvas.width, st.y * canvas.height, st.s, st.s);
      }
      ctx.globalAlpha = 1;
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // typewriter loop
  useEffect(() => {
    let phrase = 0;
    let char = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const el = typeRef.current;
      if (!el) return;
      const full = TYPE_PHRASES[phrase];
      char += deleting ? -1 : 1;
      el.textContent = full.slice(0, char);
      let delay = deleting ? 28 : 55;
      if (!deleting && char === full.length) {
        deleting = true;
        delay = 1700;
      } else if (deleting && char === 0) {
        deleting = false;
        phrase = (phrase + 1) % TYPE_PHRASES.length;
        delay = 350;
      }
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, []);

  // GSAP entrance once preloader is gone
  useEffect(() => {
    if (!booted || !rootRef.current) return;
    const q = gsap.utils.selector(rootRef);
    const tl = gsap.timeline();
    tl.fromTo(
      q('.hero__kicker, .hero__title, .hero__type, .hero__tagline, .hero__cta'),
      { y: 46, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out' }
    ).fromTo(
      q('.hero__cube'),
      { scale: 0.4, opacity: 0, rotate: -12 },
      { scale: 1, opacity: 1, rotate: 0, duration: 1, ease: 'back.out(1.6)' },
      0.35
    );
    return () => {
      tl.kill();
    };
  }, [booted]);

  return (
    <section className="hero crt crt-fx" ref={rootRef} id="top">
      <canvas className="hero__stars" ref={starsRef} />
      <div className="hero__content">
        <span className="hero__kicker">★ RETRO DEV-STATION // PLAYER 1 ★</span>
        <h1 className="hero__title">
          SANDY E. <span className="g">QUINTERO</span>
        </h1>
        <div className="hero__type term" ref={typeRef} />
        <p className="hero__tagline">{PROFILE.tagline}</p>
        <div className="hero__cta">
          <a className="btn" href="#arcade" onClick={() => sfx.coin()}>
            🕹️ Insert Coin
          </a>
          <a className="btn btn--ghost" href="#experience" onClick={() => sfx.click()}>
            📼 View Resume
          </a>
        </div>
      </div>
      <div className="hero__cube">
        <RubikCube className="hero__cube-canvas" />
        <div className="hero__cube-hint">CLICK TO TWIST ▪ DRAG TO SPIN</div>
      </div>
      <div className="hero__scroll">▼ SCROLL TO CONTINUE ▼</div>
    </section>
  );
}
