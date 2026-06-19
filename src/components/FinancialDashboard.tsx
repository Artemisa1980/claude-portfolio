// src/components/FinancialDashboard.tsx
import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import type { ResearchLog } from '../data/researchLogs';
import { sfx } from '../sound';

const fmtUSD = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

interface FinancialDashboardProps {
  log: ResearchLog;
  onBack: () => void;
}

export default function FinancialDashboard({ log, onBack }: FinancialDashboardProps) {
  const bomRef = useRef<HTMLDivElement>(null);
  const valRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<Array<SVGRectElement | null>>([]);
  const valueRefs = useRef<Array<SVGTextElement | null>>([]);

  // safe: only 'live' logs (which always carry financials) reach this component — gated in ResearchLogRow
  const fin = log.financials!;

  const chart = useMemo(() => {
    const W = 360;
    const H = 200;
    const PAD = 30;
    const BAR_W = 64;
    const GAP = 30;
    const max = Math.max(...fin.valuations.map((v) => v.amountB));
    const bars = fin.valuations.map((v, i) => {
      const h = (v.amountB / max) * (H - PAD * 2);
      const x = PAD + i * (BAR_W + GAP);
      const y = H - PAD - h;
      return { ...v, x, y, h, barW: BAR_W };
    });
    return { W, H, PAD, bars };
  }, [fin.valuations]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tl = gsap.timeline();

    const bomTarget = { v: fin.bomCost.from };
    tl.to(
      bomTarget,
      {
        v: fin.bomCost.to,
        duration: reduced ? 0 : 0.9,
        ease: 'power2.out',
        onUpdate: () => {
          if (bomRef.current) bomRef.current.textContent = fmtUSD(bomTarget.v);
        },
        onComplete: () => {
          if (bomRef.current) bomRef.current.textContent = `< ${fmtUSD(fin.bomCost.to)}`;
        },
      },
      0
    );

    const topValuation = fin.valuations[0];
    const valTarget = { v: 0 };
    tl.to(
      valTarget,
      {
        v: topValuation.amountB,
        duration: reduced ? 0 : 0.9,
        ease: 'power2.out',
        onUpdate: () => {
          if (valRef.current) valRef.current.textContent = `$${valTarget.v.toFixed(1)}B`;
        },
      },
      0
    );

    if (!reduced) {
      barRefs.current.forEach((bar) => {
        if (bar) gsap.set(bar, { transformOrigin: 'bottom', scaleY: 0 });
      });
      gsap.set(valueRefs.current.filter(Boolean), { opacity: 0, y: 8 });

      barRefs.current.forEach((bar, i) => {
        if (!bar) return;
        tl.to(bar, { scaleY: 1, duration: 0.5, ease: 'back.out(1.4)' }, 0.3 + i * 0.12);
      });
      tl.to(
        valueRefs.current.filter(Boolean),
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.12 },
        0.5
      );
    } else {
      barRefs.current.forEach((bar) => bar && gsap.set(bar, { scaleY: 1 }));
      gsap.set(valueRefs.current.filter(Boolean), { opacity: 1, y: 0 });
    }

    return () => {
      tl.kill();
    };
  }, [fin]);

  return (
    <div className="card fin-dash">
      <button
        type="button"
        className="fin-dash__back"
        onClick={() => { sfx.click(); onBack(); }}
        onMouseEnter={() => sfx.hover()}
      >
        ← CALCULATOR
      </button>
      <h3 className="gh__title" style={{ marginBottom: 6 }}>📊 {log.title}</h3>
      <p className="gh__sub" style={{ marginBottom: 22 }}>{log.legend}</p>

      <div className="fin-dash__kpis">
        <div className="kpi-tile">
          <span className="kpi-tile__label">
            BOM COST (CHINA) · {fin.bomCost.fromYear} → {fin.bomCost.toYear}
          </span>
          <div className="kpi-tile__value" ref={bomRef}>{fmtUSD(fin.bomCost.from)}</div>
          <div className="kpi-tile__source">Source: {fin.bomCost.source}</div>
        </div>
        <div className="kpi-tile">
          <span className="kpi-tile__label">TOP US VALUATION · {fin.valuations[0].asOf}</span>
          <div className="kpi-tile__value" ref={valRef}>$0.0B</div>
          <div className="kpi-tile__source">{fin.valuations[0].name} · {fin.valuations[0].source}</div>
        </div>
      </div>

      <svg
        className="fin-dash__chart"
        viewBox={`0 0 ${chart.W} ${chart.H}`}
        role="img"
        aria-label="US humanoid startup valuations comparison"
      >
        {chart.bars.map((b, i) => (
          <g key={b.name}>
            <rect
              ref={(el) => { barRefs.current[i] = el; }}
              x={b.x}
              y={b.y}
              width={b.barW}
              height={b.h}
              fill={i === 0 ? '#f7c948' : '#5eead4'}
              rx={4}
            />
            <text
              ref={(el) => { valueRefs.current[i] = el; }}
              x={b.x + b.barW / 2}
              y={b.y - 8}
              fill="#67e8f9"
              fontSize="13"
              fontFamily="VT323"
              textAnchor="middle"
            >
              ${b.amountB}B
            </text>
            <text
              x={b.x + b.barW / 2}
              y={chart.H - 8}
              fill="#67e8f9"
              fontSize="11"
              fontFamily="VT323"
              textAnchor="middle"
            >
              {b.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
