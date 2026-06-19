// src/components/Analytics.tsx
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CompoundCalculator from './CompoundCalculator';
import FinancialDashboard from './FinancialDashboard';
import ResearchLogRow from './ResearchLogRow';
import { researchLogs } from '../data/researchLogs';

gsap.registerPlugin(ScrollTrigger);

export default function Analytics() {
  const rootRef = useRef<HTMLElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const selectedLog = selectedLogId
    ? researchLogs.find((l) => l.id === selectedLogId) ?? null
    : null;

  const swapTo = (next: () => void) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !leftPanelRef.current) {
      next();
      return;
    }
    gsap.to(leftPanelRef.current, {
      opacity: 0,
      y: -16,
      duration: 0.25,
      ease: 'power1.in',
      onComplete: () => {
        next();
        gsap.fromTo(
          leftPanelRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
        );
      },
    });
  };

  const handleSelect = (id: string) => swapTo(() => setSelectedLogId(id));
  const handleBack = () => swapTo(() => setSelectedLogId(null));

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
        <div ref={leftPanelRef}>
          {selectedLog ? (
            <FinancialDashboard log={selectedLog} onBack={handleBack} />
          ) : (
            <CompoundCalculator />
          )}
        </div>

        <div className="card">
          <h3 className="gh__title" style={{ marginBottom: 22 }}>📚 Study Files & Research Logs</h3>
          <div className="research-list">
            {researchLogs.map((log) => (
              <ResearchLogRow key={log.id} log={log} onSelect={handleSelect} />
            ))}
          </div>
        </div>
      </div>

      <p className="analytics__note">
        “Financial modeling matches operational predictability. As I advance in my BBA path at UTEL, I will
        keep growing this dashboard with new research logs and the financial models behind each one.”
      </p>
    </section>
  );
}
