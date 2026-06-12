import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TV_CHANNELS } from '../data';
import { sfx } from '../sound';

gsap.registerPlugin(ScrollTrigger);

export default function TVStudio() {
  const rootRef = useRef<HTMLElement>(null);
  const noiseRef = useRef<HTMLCanvasElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const programRef = useRef<HTMLDivElement>(null);
  const [channel, setChannel] = useState(0);
  const [power, setPower] = useState(true);
  const [staticBurst, setStaticBurst] = useState(false);

  const active = TV_CHANNELS[channel];

  // CRT static noise
  useEffect(() => {
    const canvas = noiseRef.current!;
    const ctx = canvas.getContext('2d')!;
    canvas.width = 220;
    canvas.height = 140;
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const img = ctx.createImageData(canvas.width, canvas.height);
      const d = img.data;
      // heavy snow during channel change / power off, faint film grain otherwise
      const intensity = !power || staticBurst ? 255 : 26;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * intensity;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = !power || staticBurst ? 255 : 60;
      }
      ctx.putImageData(img, 0, 0);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [power, staticBurst]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.tvset',
        { y: 90, opacity: 0, rotate: -2 },
        {
          y: 0,
          opacity: 1,
          rotate: 0,
          duration: 0.9,
          ease: 'back.out(1.4)',
          scrollTrigger: { trigger: '.tv__grid', start: 'top 78%' },
        }
      );
      gsap.fromTo(
        '.channel',
        { x: 70, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: { trigger: '.tv__channels', start: 'top 80%' },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  function tune(i: number) {
    if (i === channel || !power) return;
    sfx.channel();
    setStaticBurst(true);
    gsap.to(knobRef.current, { rotate: i * 90, duration: 0.45, ease: 'back.out(2)' });
    gsap.fromTo(programRef.current, { opacity: 0, scaleY: 0.05 }, { opacity: 1, scaleY: 1, duration: 0.4, delay: 0.25 });
    setTimeout(() => {
      setChannel(i);
      setStaticBurst(false);
    }, 260);
  }

  function togglePower() {
    sfx.click();
    setPower((p) => !p);
  }

  return (
    <section className="section" id="tv" ref={rootRef}>
      <div className="section-tag" style={{ background: 'var(--purple)' }}>
        🎬 TV BROADCASTING STUDIO 🎬
      </div>

      <div className="tv__grid">
        <div className="tvset">
          <span className="tvset__antenna">⋁</span>
          <div className="tvset__brand">📺 SANDY CINE-VISION 16:9 ✨</div>
          <div className="tvset__screen-wrap">
            <div className="tvset__screen">
              <canvas className="tvset__noise" ref={noiseRef} />
              {power && (
                <div className="tvset__program" ref={programRef}>
                  <span className="tvset__prog-icon">{active.icon}</span>
                  <div className="tvset__prog-title">CH_{String(active.id).padStart(2, '0')} ▸ {active.title}</div>
                  <div className="tvset__prog-meta">{active.genre} • {active.length}</div>
                </div>
              )}
              {!power && <div className="tvset__off">⏻ CINE_OFF — PRESS POWER</div>}
            </div>
          </div>
          <div className="tvset__panel">
            <span className="tvset__panel-label">CHANNEL</span>
            <div className="tvset__knob" ref={knobRef} />
            <span className="tvset__panel-label">CH SELECT</span>
            <div style={{ flex: 1 }} />
            <span className="tvset__panel-label">POWER<br />CINE_ON</span>
            <button
              className={`tvset__power ${power ? '' : 'tvset__power--off'}`}
              onClick={togglePower}
              aria-label="TV power"
            />
          </div>
        </div>

        <div className="tv__channels">
          <div className="tv__channels-label">📡 SELECT TRANSMISSION CHANNEL</div>
          {TV_CHANNELS.map((ch, i) => (
            <button
              key={ch.id}
              className={`channel ${i === channel ? 'channel--active' : ''}`}
              onClick={() => tune(i)}
              onMouseEnter={() => sfx.hover()}
            >
              <span className="channel__num">{String(ch.id).padStart(2, '0')}</span>
              <span>
                <span className="channel__title">{ch.icon} {ch.title}</span>
                <br />
                <span className="channel__meta">{ch.genre} • Length: {ch.length}</span>
              </span>
            </button>
          ))}
          <div className="tv__synopsis">
            <div className="tv__synopsis-label">✨ CHANNEL SYNOPSIS</div>
            <div className="tv__synopsis-title">{active.icon} {active.title}</div>
            <p>{active.synopsis}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
