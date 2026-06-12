import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Preloader from './components/Preloader';
import Header from './components/Header';
import Hero from './components/Hero';
import Arcade from './components/Arcade';
import About from './components/About';
import Analytics from './components/Analytics';
import Experience from './components/Experience';
import Skills from './components/Skills';
import TVStudio from './components/TVStudio';
import SystemRoom from './components/SystemRoom';
import Footer from './components/Footer';

gsap.registerPlugin(ScrollTrigger);

const MARQUEE_ITEMS = [
  '★ INSERT COIN TO EXPLORE',
  '☕️ 11+ YEARS OF COFFEE CRAFT',
  '🎓 UTEL BBA 2029',
  '💻 AI BUILDER PATH',
  '🐙 GIT VERSION CONTROL',
  '🧠 PROMPT ENGINEERING',
  '🕹️ 4 ARCADE CARTRIDGES',
];

function Marquee() {
  // duplicated track loops seamlessly via CSS-less GSAP tween in App
  return (
    <div className="marquee">
      <div className="marquee__track" id="marquee-track">
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
          <span key={i}>{item}</span>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const track = document.getElementById('marquee-track');
    if (!track) return;
    const tween = gsap.to(track, {
      xPercent: -50,
      duration: 22,
      ease: 'none',
      repeat: -1,
    });
    return () => {
      tween.kill();
    };
  }, []);

  // ScrollTrigger measures while the preloader covers the page; refresh once revealed
  useEffect(() => {
    if (booted) ScrollTrigger.refresh();
  }, [booted]);

  return (
    <>
      {!booted && <Preloader onDone={() => setBooted(true)} />}
      <Header />
      <main>
        <Hero booted={booted} />
        <Marquee />
        <Arcade />
        <About />
        <Experience />
        <Analytics />
        <Skills />
        <TVStudio />
        <SystemRoom />
      </main>
      <Footer />
    </>
  );
}
