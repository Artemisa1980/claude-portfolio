import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PROFILE, CERTIFICATIONS, EDUCATION } from '../data';
import { sfx } from '../sound';

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.about__grid > *',
        { y: 70, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.about__grid', start: 'top 78%' },
        }
      );
      gsap.fromTo(
        '.cert',
        { x: 60, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.09,
          ease: 'power2.out',
          scrollTrigger: { trigger: '.certs__list', start: 'top 80%' },
        }
      );
      gsap.fromTo(
        '.edu',
        { y: 50, opacity: 0, rotate: -2 },
        {
          y: 0,
          opacity: 1,
          rotate: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'back.out(1.5)',
          scrollTrigger: { trigger: '.edu__grid', start: 'top 85%' },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="section" id="reception" ref={rootRef}>
      <div className="section-tag" style={{ background: 'var(--pink)' }}>
        🌸 RECEPTION DESK // BIOGRAPHY
      </div>

      <div className="about__grid">
        <div className="card">
          <span className="about__label">Professional Identity</span>
          <h2 className="about__name">{PROFILE.name} ☕️👾</h2>
          <div className="about__role">{PROFILE.title}</div>
          <div className="about__meta">
            <span>📍 {PROFILE.location}</span>
            <span>✉️ {PROFILE.email}</span>
          </div>
          <p className="about__bio">“{PROFILE.bio}”</p>
          <div className="about__langs">
            {PROFILE.languages.map((l) => (
              <div className="about__lang" key={l.name}>
                <span>🌐 {l.name}</span>
                <span className="chip">{l.level}</span>
              </div>
            ))}
          </div>
          <a
            className="btn"
            href={PROFILE.linkedin}
            target="_blank"
            rel="noreferrer"
            onClick={() => sfx.click()}
            style={{ marginBottom: 24 }}
          >
            in LinkedIn Network ↗
          </a>
          <div className="about__quote">💼 “{PROFILE.quote}” — {PROFILE.name}</div>
        </div>

        <div>
          <h3 className="gh__title" style={{ marginBottom: 20 }}>
            🏅 CERTIFICATION VAULT
          </h3>
          <div className="certs__list">
            {CERTIFICATIONS.map((c) => (
              <div className="cert" key={c.id} onMouseEnter={() => sfx.hover()}>
                <span className="cert__icon">{c.icon}</span>
                <div>
                  <div className="cert__name">{c.name}</div>
                  <div className="cert__issuer">{c.issuer}</div>
                </div>
                <span className="cert__year">{c.year}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="edu__grid">
        {EDUCATION.map((e) => (
          <div className="edu" key={e.id}>
            <div className="edu__deg">🎓 {e.degree}</div>
            <div className="edu__inst">{e.institution}</div>
            <div className="edu__period">{e.period}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
