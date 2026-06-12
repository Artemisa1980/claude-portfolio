import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EXPERIENCE } from '../data';

gsap.registerPlugin(ScrollTrigger);

export default function Experience() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // gradient rail draws itself as you scroll the timeline
      gsap.to('.xp__rail-fill', {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.xp__items',
          start: 'top 70%',
          end: 'bottom 60%',
          scrub: 0.6,
        },
      });
      gsap.utils.toArray<HTMLElement>('.xp__item').forEach((item, i) => {
        gsap.fromTo(
          item,
          { x: i % 2 === 0 ? -90 : 90, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: { trigger: item, start: 'top 82%' },
          }
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="section crt crt-fx xp" id="experience" ref={rootRef}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-tag" style={{ background: 'var(--cyan)' }}>
          📼 CAREER TIMELINE // SAVE FILES
        </div>
        <h2 className="section-title" style={{ color: 'var(--cream)', marginBottom: 64 }}>
          15 YEARS OF <span style={{ color: 'var(--gold)' }}>XP POINTS</span>
        </h2>
      </div>

      <div className="xp__rail">
        <div className="xp__rail-fill" />
      </div>

      <div className="xp__items">
        {EXPERIENCE.map((job) => (
          <article className="xp__item" key={job.id}>
            <span className="xp__dot" />
            <div className="xp__card">
              <div className="xp__role">{job.icon} {job.role}</div>
              <div className="xp__company">{job.company}</div>
              <div className="xp__meta">
                <span>🗓 {job.period}</span>
                <span>⏳ {job.duration}</span>
                <span>📍 {job.location}</span>
              </div>
              <ul className="xp__bullets">
                {job.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
