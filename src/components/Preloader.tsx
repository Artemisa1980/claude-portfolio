import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const BOOT_LINES = [
  'SANDY_OS v2.0 // BIOS CHECK ............ <span class="ok">OK</span>',
  'LOADING HOSPITALITY.DLL (15 YRS) ....... <span class="ok">OK</span>',
  'MOUNTING AI_BUILDER.SYS ................ <span class="ok">OK</span>',
  'CALIBRATING CRT PHOSPHORS .............. <span class="ok">OK</span>',
  'INSERT COIN TO CONTINUE ▸',
];

export default function Preloader({ onDone }: { onDone: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(rootRef.current, {
          yPercent: -100,
          duration: 0.7,
          ease: 'power3.inOut',
          onComplete: () => doneRef.current(),
        });
      },
    });

    BOOT_LINES.forEach((line, i) => {
      tl.call(
        () => {
          if (!linesRef.current) return;
          const el = document.createElement('div');
          el.innerHTML = line;
          linesRef.current.appendChild(el);
        },
        [],
        i * 0.42
      );
    });

    tl.to(barRef.current, { width: '100%', duration: 2.3, ease: 'steps(24)' }, 0.1);
    tl.to({}, { duration: 0.35 }); // hold

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div className="preloader crt-fx" ref={rootRef}>
      <img src="/sanblue-logo-m13.png" alt="sanblue" className="preloader__logo" />
      <div className="preloader__lines" ref={linesRef} />
      <div className="preloader__bar">
        <div className="preloader__bar-fill" ref={barRef} />
      </div>
      <div className="preloader__hint">RETRO DEV-STATION BOOTING…</div>
    </div>
  );
}
