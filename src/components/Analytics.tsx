import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sfx } from '../sound';

gsap.registerPlugin(ScrollTrigger);

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Analytics() {
  const rootRef = useRef<HTMLElement>(null);
  const fvRef = useRef<HTMLDivElement>(null);
  const intRef = useRef<HTMLDivElement>(null);
  const shown = useRef({ fv: 0, int: 0 });

  const [principal, setPrincipal] = useState(5000);
  const [rate, setRate] = useState(6.5);
  const [years, setYears] = useState(5);

  const fv = principal * Math.pow(1 + rate / 100, years);
  const interest = fv - principal;

  // animated counters whenever inputs change
  useEffect(() => {
    const target = { fv: shown.current.fv, int: shown.current.int };
    const tween = gsap.to(target, {
      fv,
      int: interest,
      duration: 0.7,
      ease: 'power2.out',
      onUpdate: () => {
        shown.current = { fv: target.fv, int: target.int };
        if (fvRef.current) fvRef.current.textContent = `$${fmt(target.fv)}`;
        if (intRef.current) intRef.current.textContent = `+$${fmt(target.int)}`;
      },
    });
    return () => {
      tween.kill();
    };
  }, [fv, interest]);

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

  // growth curve for the SVG chart
  const chart = useMemo(() => {
    const W = 560;
    const H = 220;
    const PAD = 26;
    const points: Array<[number, number]> = [];
    const max = principal * Math.pow(1 + rate / 100, years);
    for (let y = 0; y <= years; y++) {
      const v = principal * Math.pow(1 + rate / 100, y);
      const px = PAD + (y / years) * (W - PAD * 2);
      const py = H - PAD - ((v - 0) / max) * (H - PAD * 2);
      points.push([px, py]);
    }
    const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const area = `${line} L${points[points.length - 1][0].toFixed(1)},${H - PAD} L${PAD},${H - PAD} Z`;
    return { W, H, PAD, line, area, points };
  }, [principal, rate, years]);

  return (
    <section className="section analytics" id="analytics" ref={rootRef}>
      <div className="section-tag" style={{ background: 'var(--mint)' }}>
        📊 EXECUTIVE ANALYTICS DESK WITH CLAUDI/GIM PM
      </div>

      <div className="analytics__grid">
        <div className="card">
          <h3 className="gh__title" style={{ marginBottom: 6 }}>🧮 BBA Compound Interest Calculator</h3>
          <p className="gh__sub" style={{ marginBottom: 26 }}>
            ACADEMIC_TRACK // UTEL_BBA_2029 — drag the sliders, watch money grow
          </p>

          <div className="calc__row">
            <div className="calc__field">
              <label>Principal (USD)</label>
              <div className="calc__value">${principal.toLocaleString()}</div>
              <input
                type="range"
                min={500}
                max={50000}
                step={500}
                value={principal}
                onChange={(e) => { setPrincipal(+e.target.value); sfx.hover(); }}
              />
            </div>
            <div className="calc__field">
              <label>Annual Rate (%)</label>
              <div className="calc__value">{rate.toFixed(1)} %</div>
              <input
                type="range"
                min={0.5}
                max={15}
                step={0.5}
                value={rate}
                onChange={(e) => { setRate(+e.target.value); sfx.hover(); }}
              />
            </div>
            <div className="calc__field">
              <label>Period (Years)</label>
              <div className="calc__value">{years} Years</div>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={years}
                onChange={(e) => { setYears(+e.target.value); sfx.hover(); }}
              />
            </div>
          </div>

          <div className="calc__result">
            <div>
              <span className="calc__fv-label">FUTURE VALUE (ACCRUED)</span>
              <div className="calc__fv" ref={fvRef}>${fmt(fv)}</div>
            </div>
            <div>
              <span className="calc__int-label">INTEREST EARNED</span>
              <div className="calc__int" ref={intRef}>+${fmt(interest)}</div>
            </div>
          </div>

          <svg
            className="calc__chart"
            viewBox={`0 0 ${chart.W} ${chart.H}`}
            role="img"
            aria-label="Compound growth curve"
          >
            <defs>
              <linearGradient id="growFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5eead4" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#5eead4" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((g) => (
              <line
                key={g}
                x1={chart.PAD}
                x2={chart.W - chart.PAD}
                y1={chart.PAD + g * (chart.H - chart.PAD * 2)}
                y2={chart.PAD + g * (chart.H - chart.PAD * 2)}
                stroke="rgba(242,237,218,0.12)"
                strokeDasharray="4 6"
              />
            ))}
            <path d={chart.area} fill="url(#growFill)" />
            <path d={chart.line} fill="none" stroke="#5eead4" strokeWidth="3.5" strokeLinecap="round" />
            {chart.points.map(([x, y], i) => (
              <rect key={i} x={x - 3.5} y={y - 3.5} width="7" height="7" fill="#f7c948" />
            ))}
            <text x={chart.PAD} y={chart.H - 8} fill="#67e8f9" fontSize="13" fontFamily="VT323">
              YEAR 0
            </text>
            <text x={chart.W - chart.PAD} y={chart.H - 8} fill="#67e8f9" fontSize="13" fontFamily="VT323" textAnchor="end">
              YEAR {years}
            </text>
          </svg>
        </div>

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
