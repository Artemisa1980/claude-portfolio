import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SKILLS } from '../data';

gsap.registerPlugin(ScrollTrigger);

export default function Skills() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.skill').forEach((el, i) => {
        const fill = el.querySelector<HTMLElement>('.skill__fill')!;
        const pct = el.querySelector<HTMLElement>('.skill__pct')!;
        const level = Number(fill.dataset.level);
        const counter = { v: 0 };
        gsap.fromTo(el, { opacity: 0, y: 30 }, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay: (i % 2) * 0.1,
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
        gsap.fromTo(
          fill,
          { width: '0%' },
          {
            width: `${level}%`,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%' },
          }
        );
        gsap.to(counter, {
          v: level,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
          onUpdate: () => {
            pct.textContent = `${Math.round(counter.v)}/100`;
          },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="section" id="skills" ref={rootRef}>
      <div className="section-tag" style={{ background: 'var(--purple)' }}>
        ⚡ SKILL MATRIX // POWER-UPS
      </div>
      <div className="skills__grid">
        {SKILLS.map((s) => (
          <div className="skill" key={s.name}>
            <div className="skill__head">
              <span className="skill__name">{s.name}</span>
              <span
                className={`skill__cat ${
                  s.category === 'Soft Skills' ? 'skill__cat--soft' : `skill__cat--${s.category}`
                }`}
              >
                {s.category}
              </span>
              <span className="skill__pct">0/100</span>
            </div>
            <div className="skill__bar">
              <div className="skill__fill" data-level={s.level} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
