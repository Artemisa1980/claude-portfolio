import { PROFILE } from '../data';
import { sfx } from '../sound';

export default function Footer() {
  return (
    <footer className="footer crt-fx">
      <div>
        <div className="footer__name">✨ {PROFILE.name} • Retro DeV & Business Leader</div>
        <p className="footer__sub">
          Academic Business Administration credentials (UTEL BBA, Expected 2029) combined with an active
          AI Builder path, agile code control versioning pipelines, and Google Prompting
          engineering integration. Built with React, GSAP & Three.js — no placeholders, pure reality.
        </p>
      </div>
      <div className="footer__host">
        Host: AI Studio Cloud Run
        <br />
        Port: 3000 Ingress SSL
      </div>
      <button
        className="footer__top"
        onClick={() => {
          sfx.coin();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        ▲ BACK TO TOP
      </button>
    </footer>
  );
}
