import { useEffect, useState } from 'react';
import { PROFILE } from '../data';
import { sfx, setMuted, isMuted } from '../sound';
import SanblueWordmark from './SanblueWordmark';

const NAV = [
  { href: '#arcade', label: './arcade' },
  { href: '#reception', label: './about' },
  { href: '#experience', label: './resume' },
  { href: '#analytics', label: './analytics' },
  { href: '#tv', label: './tv' },
  { href: '#mail', label: './mail' },
];

export default function Header() {
  const [now, setNow] = useState(new Date());
  const [shrunk, setShrunk] = useState(false);
  const [mute, setMute] = useState(isMuted());

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 1000);
    const onScroll = () => setShrunk(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearInterval(clock);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const clock = now.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <header className={`header ${shrunk ? 'header--shrunk' : ''}`}>
      <img src="/sanblue-logo-m13.png" alt="sanblue logo" className="header__logo" />
      <div className="header__id">
        <span className="header__name">
          {PROFILE.handle} <span className="header__ver">{PROFILE.version}</span>
        </span>
        <span className="header__sub">{PROFILE.subtitle}</span>
        <SanblueWordmark className="header__brand" />
      </div>
      <nav className="header__nav">
        {NAV.map((n) => (
          <a key={n.href} href={n.href} className="header__link term" onClick={() => sfx.click()}>
            {n.label}
          </a>
        ))}
        <span className="header__clock">🗓 {clock}</span>
        <a
          className="header__icon-btn"
          href={PROFILE.linkedin}
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
          onClick={() => sfx.click()}
        >
          in
        </a>
        <button
          className="header__icon-btn"
          aria-label={mute ? 'Unmute sounds' : 'Mute sounds'}
          onClick={() => {
            const next = !mute;
            setMuted(next);
            setMute(next);
            if (!next) sfx.coin();
          }}
        >
          {mute ? '🔇' : '🔊'}
        </button>
      </nav>
    </header>
  );
}
