import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CompoundCalculator from './CompoundCalculator';

gsap.registerPlugin(ScrollTrigger);

export default function Analytics() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.analytics__grid > *',
        { y: 70, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.analytics__grid', start: 'top 78%' },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="section analytics" id="analytics" ref={rootRef}>
      <div className="section-tag" style={{ background: 'var(--mint)' }}>
        📊 EXECUTIVE ANALYTICS DESK WITH CLAUDI/GIM PM
      </div>

      <div className="analytics__grid">
        <CompoundCalculator />

        <div className="card">
          <h3 className="gh__title" style={{ marginBottom: 22 }}>📚 Study Files & Research Logs</h3>
          <div className="studyfile">
            <span style={{ fontSize: 26 }}>📊</span>
            <div>
              <div className="studyfile__name">Coming Soon Research and Showcases</div>
              <div className="studyfile__fmt">Format: PDF Analysis • Operations & Logistics</div>
            </div>
            <span className="cert__year">SOON</span>
          </div>
          <div className="studyfile">
            <span style={{ fontSize: 26 }}>📈</span>
            <div>
              <div className="studyfile__name">Coming Soon Research and Showcases</div>
              <div className="studyfile__fmt">Format: Compound Excel • Revenue & Audit</div>
            </div>
            <span className="cert__year">SOON</span>
          </div>
          <div className="studyfile">
            <span style={{ fontSize: 26 }}>🧾</span>
            <div>
              <div className="studyfile__name">Coming Soon Research and Showcases</div>
              <div className="studyfile__fmt">Format: Interactive Sheet • Unit Economics</div>
            </div>
            <span className="cert__year">SOON</span>
          </div>
        </div>
      </div>

      <p className="analytics__note">
        “Financial modeling matches operational predictability. As I advance in my BBA path at UTEL, I will
        update this dashboard with real-time hotel audits, Starbucks layout analyses, and interactive cash
        flow spreadsheets.”
      </p>
    </section>
  );
}
