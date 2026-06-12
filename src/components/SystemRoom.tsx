import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COMMITS, PROFILE } from '../data';
import { sfx } from '../sound';

gsap.registerPlugin(ScrollTrigger);

const GH_COLORS = ['rgba(19,26,67,0.08)', '#bbf7d0', '#6ee7b7', '#34d399', '#0d9488'];

export default function SystemRoom() {
  const rootRef = useRef<HTMLElement>(null);
  const stdoutRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  // deterministic-ish contribution heatmap (seeded so it doesn't reshuffle per render)
  const cells = useMemo(() => {
    let seed = 20260611;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    return Array.from({ length: 112 }, () => {
      const r = rand();
      if (r < 0.52) return 0;
      if (r < 0.7) return 1;
      if (r < 0.84) return 2;
      if (r < 0.94) return 3;
      return 4;
    });
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.gh__cell', {
        scale: 1,
        duration: 0.4,
        stagger: { each: 0.008, from: 'random' },
        ease: 'back.out(2.5)',
        scrollTrigger: { trigger: '.gh__cells', start: 'top 82%' },
      });
      gsap.to('.console__line', {
        opacity: 1,
        duration: 0.05,
        stagger: 0.3,
        scrollTrigger: { trigger: '.console', start: 'top 80%' },
      });
      gsap.fromTo(
        '.mail',
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.mail', start: 'top 82%' },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  function typeStdout(lines: string[]) {
    const el = stdoutRef.current;
    if (!el) return;
    el.textContent = '';
    let li = 0;
    let ci = 0;
    const tick = () => {
      if (li >= lines.length) return;
      const line = lines[li];
      ci++;
      el.textContent = lines.slice(0, li).join('\n') + (li ? '\n' : '') + line.slice(0, ci);
      if (ci >= line.length) {
        li++;
        ci = 0;
      }
      setTimeout(tick, 12);
    };
    tick();
  }

  function onSend(e: FormEvent) {
    e.preventDefault();
    if (!name || !message) {
      sfx.locked();
      typeStdout(['SYS: ERROR — missing fields.', 'SYS: ENTER_NAME and ENTER_MESSAGE are required.']);
      return;
    }
    sfx.send();
    typeStdout([
      `SYS: Handshake accepted — ${name}`,
      'SYS: Compiling message packet… OK',
      'SYS: Opening mail client via SMTP_RETRO…',
      'SYS: Transmission ready. 📡',
    ]);
    const subject = encodeURIComponent(`[RETRO DEV-STATION] Connection request from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}${email ? ` (${email})` : ''}`);
    setTimeout(() => {
      window.location.href = `mailto:${PROFILE.email}?subject=${subject}&body=${body}`;
    }, 900);
  }

  return (
    <section className="section" id="mail" ref={rootRef}>
      <div className="section-tag" style={{ background: 'var(--cyan)' }}>
        🛰 SYSTEM ROOM // GIT + MAIL
      </div>

      <div className="sysroom__grid">
        <div className="card">
          <div className="gh__head">
            <div>
              <div className="gh__title">🐙 GitHub Log Activity Grid</div>
              <div className="gh__sub">{PROFILE.name} • get-github-certificate.sh</div>
            </div>
            <span className="gh__branch">⎇ branch: main</span>
          </div>

          <div className="gh__cells">
            {cells.map((level, i) => (
              <i key={i} className="gh__cell" style={{ background: GH_COLORS[level] }} />
            ))}
          </div>
          <div className="gh__legend">
            Less {GH_COLORS.map((c, i) => <i key={i} style={{ background: c }} />)} More
          </div>

          <div className="console">
            <div className="console__dots">
              <i style={{ background: '#ff5f57' }} />
              <i style={{ background: '#febc2e' }} />
              <i style={{ background: '#28c840' }} />
            </div>
            {COMMITS.map((c) => (
              <div className="console__line" key={c.hash}>
                <span className="t">[{c.date}]</span> <span className="b">main</span>{' '}
                <span className="h">{c.hash}:</span> {c.msg}
              </div>
            ))}
          </div>
        </div>

        <form className="mail crt-fx" onSubmit={onSend}>
          <div className="mail__title">✉️ MAIL ROOM TERMINAL ✉️</div>

          <div className="mail__prompt">
            GUEST@SANDY.SYS:~$ <b>ENTER_NAME</b>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name or Company"
            aria-label="Your name"
          />

          <div className="mail__prompt">
            GUEST@SANDY.SYS:~$ <b>ENTER_EMAIL</b>
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="recruiter@company.com"
            aria-label="Your email"
          />

          <div className="mail__prompt">
            GUEST@SANDY.SYS:~$ <b>ENTER_MESSAGE</b>
          </div>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your connection request or greeting here…"
            aria-label="Your message"
          />

          <button className="mail__send" type="submit">
            📡 RUN CONNECT_MAIL
          </button>

          <div className="mail__stdout" ref={stdoutRef}>
            {`SYS: Awaiting guest handshake…\nSYS: Execute 'send_mail --interactive' or click shortcuts below.`}
          </div>

          <div className="mail__shortcuts">
            <button
              type="button"
              className="mail__shortcut"
              onClick={() => {
                navigator.clipboard?.writeText(PROFILE.email);
                sfx.pop();
                typeStdout([`SYS: ${PROFILE.email} copied to clipboard. 📋`]);
              }}
            >
              ⧉ COPY YAHOO EMAIL
            </button>
            <a className="mail__shortcut" href={`mailto:${PROFILE.email}`} onClick={() => sfx.click()}>
              ✉ OPEN EMAIL CLIENT
            </a>
            <a className="mail__shortcut" href={PROFILE.linkedin} target="_blank" rel="noreferrer" onClick={() => sfx.click()}>
              in LINKEDIN
            </a>
          </div>
        </form>
      </div>
    </section>
  );
}
