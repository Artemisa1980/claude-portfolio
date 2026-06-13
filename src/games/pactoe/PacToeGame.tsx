import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import CartridgeLoader from '../../components/CartridgeLoader';
import { sfx } from '../../sound';
import { Cell, chooseMove, findWin, isFull } from './ai';
import { PacSprite, GhostSprite, SpriteStyle, Mood } from './sprites';

/**
 * PAC-TOE: NEON ARCADE — full redesign.
 * Three sectors (3×3 / 5×5 / 7×7) share one dynamic: K-in-a-row.
 * Six levels per sector, win to advance. Pac is customizable; coins are war trophies:
 * Pac wins  → you capture GHOST COINS 👻
 * Ghost wins → Ghosty hoards PAC COINS 🟡
 */

type Sector = 3 | 5 | 7;
type Phase = 'play' | 'cpu' | 'won' | 'lost' | 'draw' | 'loading' | 'champion';

const SECTORS: Record<Sector, { k: number; name: string; legend: string; bonus: number }> = {
  3: {
    k: 3,
    name: 'CLASSIC SECTOR',
    legend: 'Line up 3 pac-dots — any row, column or diagonal — before Ghosty does.',
    bonus: 0,
  },
  5: {
    k: 4,
    name: 'STRATEGY SECTOR',
    legend: 'Bigger grid, bigger brain: same rules, but now you need 4 in a row to win.',
    bonus: 15,
  },
  7: {
    k: 5,
    name: 'GAUNTLET SECTOR',
    legend: 'The full arena: chain 5 in a row to dethrone Ghosty. Watch the diagonals!',
    bonus: 30,
  },
};

const LEVEL_NAMES = ['ROOKIE', 'PLAYER', 'PRO', 'EXPERT', 'MASTER', 'ARCADE GOD'];
const PALETTE = ['#f7c948', '#ff6ea9', '#67e8f9', '#5eead4', '#a78bfa', '#ff7b6b'];
const STYLES: SpriteStyle[] = ['classic', 'neon', 'pixel'];

interface SaveData {
  coins: { ghost: number; pac: number };
  skin: { style: SpriteStyle; colorIdx: number };
  /** Next level to play per sector (1-6; 7 = sector mastered). */
  progress: Record<Sector, number>;
}

const SAVE_KEY = 'pactoe-v2';

function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SaveData;
      if (parsed.coins && parsed.skin && parsed.progress) return parsed;
    }
  } catch {
    /* fresh save */
  }
  return { coins: { ghost: 0, pac: 0 }, skin: { style: 'classic', colorIdx: 0 }, progress: { 3: 1, 5: 1, 7: 1 } };
}

export default function PacToeGame({ onExit }: { onExit: () => void }) {
  const [save, setSave] = useState<SaveData>(loadSave);
  const [sector, setSector] = useState<Sector>(3);
  const [level, setLevel] = useState(() => Math.min(loadSave().progress[3], 6));
  const [board, setBoard] = useState<Cell[]>(() => Array(9).fill(null));
  const [phase, setPhase] = useState<Phase>('play');
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [lastMove, setLastMove] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const ghostHudRef = useRef<HTMLDivElement>(null);
  const pacHudRef = useRef<HTMLDivElement>(null);
  const cpuTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reduced = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current;

  const { k, name, legend, bonus } = SECTORS[sector];
  const size = sector;
  const ghostServes = level % 2 === 0;
  const pacColor = PALETTE[save.skin.colorIdx];
  const ghostColor = PALETTE[(save.skin.colorIdx + 3) % PALETTE.length];

  // persist save data
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      /* private mode */
    }
  }, [save]);

  /* ---------- juice helpers ---------- */

  const spawnConfetti = useCallback(
    (count: number) => {
      if (reduced || !rootRef.current || !boardRef.current) return;
      const host = rootRef.current;
      const rect = boardRef.current.getBoundingClientRect();
      for (let i = 0; i < count; i++) {
        const piece = document.createElement('span');
        piece.className = 'pt-confetti';
        piece.style.background = PALETTE[i % PALETTE.length];
        piece.style.left = `${rect.left + rect.width / 2}px`;
        piece.style.top = `${rect.top + rect.height / 3}px`;
        host.appendChild(piece);
        gsap.to(piece, {
          x: (Math.random() - 0.5) * rect.width * 1.6,
          y: rect.height * (0.4 + Math.random() * 0.8),
          rotation: Math.random() * 720 - 360,
          opacity: 0,
          duration: 1.1 + Math.random() * 0.7,
          ease: 'power1.out',
          onComplete: () => piece.remove(),
        });
      }
    },
    [reduced]
  );

  const flyCoins = useCallback(
    (emoji: string, target: HTMLElement | null, count: number) => {
      if (reduced || !rootRef.current || !boardRef.current || !target) return;
      const host = rootRef.current;
      const from = boardRef.current.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      for (let i = 0; i < count; i++) {
        const coin = document.createElement('span');
        coin.className = 'pt-coin-fly';
        coin.textContent = emoji;
        coin.style.left = `${from.left + from.width / 2}px`;
        coin.style.top = `${from.top + from.height / 2}px`;
        host.appendChild(coin);
        gsap.to(coin, {
          left: to.left + to.width / 2 + (Math.random() - 0.5) * 20,
          top: to.top + to.height / 2,
          scale: 0.5,
          duration: 0.7 + i * 0.09,
          ease: 'power2.in',
          onComplete: () => {
            coin.remove();
            sfx.coin();
          },
        });
      }
    },
    [reduced]
  );

  /* ---------- game flow ---------- */

  const finishRound = useCallback(
    (finalBoard: Cell[], result: 'P' | 'G' | 'draw', line: number[] | null) => {
      setBoard(finalBoard);
      setWinLine(line);
      if (result === 'P') {
        setPhase('won');
        sfx.win();
        const reward = level * 10 + bonus;
        setSave((s) => ({
          ...s,
          coins: { ...s.coins, ghost: s.coins.ghost + reward },
          progress:
            level < 6
              ? { ...s.progress, [sector]: Math.max(s.progress[sector], level + 1) }
              : { ...s.progress, [sector]: 7 },
        }));
        spawnConfetti(46);
        flyCoins('👻', ghostHudRef.current, 6);
      } else if (result === 'G') {
        setPhase('lost');
        sfx.laugh();
        const stash = level * 5 + Math.floor(bonus / 2);
        setSave((s) => ({ ...s, coins: { ...s.coins, pac: s.coins.pac + stash } }));
        flyCoins('🟡', pacHudRef.current, 4);
        if (boardRef.current && !reduced) {
          gsap.fromTo(boardRef.current, { x: -10 }, { x: 10, duration: 0.06, repeat: 7, yoyo: true, clearProps: 'x' });
        }
      } else {
        setPhase('draw');
        sfx.locked();
      }
    },
    [level, sector, bonus, spawnConfetti, flyCoins, reduced]
  );

  const ghostMove = useCallback(
    (current: Cell[], lvl: number, sec: Sector) => {
      setPhase('cpu');
      clearTimeout(cpuTimer.current);
      cpuTimer.current = setTimeout(() => {
        const idx = chooseMove([...current], sec, SECTORS[sec].k, lvl);
        if (idx < 0) return;
        const next = [...current];
        next[idx] = 'G';
        setLastMove(idx);
        sfx.pop();
        const win = findWin(next, sec, SECTORS[sec].k);
        if (win) finishRound(next, 'G', win.line);
        else if (isFull(next)) finishRound(next, 'draw', null);
        else {
          setBoard(next);
          setPhase('play');
        }
      }, 380 + lvl * 90 + Math.random() * 220);
    },
    [finishRound]
  );

  const startLevel = useCallback(
    (sec: Sector, lvl: number) => {
      clearTimeout(cpuTimer.current);
      const fresh = Array(sec * sec).fill(null) as Cell[];
      setBoard(fresh);
      setWinLine(null);
      setLastMove(-1);
      if (lvl % 2 === 0) ghostMove(fresh, lvl, sec);
      else setPhase('play');
    },
    [ghostMove]
  );

  const playCell = (i: number) => {
    if (phase !== 'play' || board[i]) return;
    sfx.waka();
    const next = [...board];
    next[i] = 'P';
    setLastMove(i);
    const win = findWin(next, size, k);
    if (win) finishRound(next, 'P', win.line);
    else if (isFull(next)) finishRound(next, 'draw', null);
    else {
      setBoard(next);
      ghostMove(next, level, sector);
    }
  };

  const switchSector = (sec: Sector) => {
    if (sec === sector && phase !== 'champion') return;
    sfx.click();
    const lvl = Math.min(save.progress[sec], 6);
    setSector(sec);
    setLevel(lvl);
    startLevel(sec, lvl);
  };

  const advance = () => {
    if (level >= 6) {
      sfx.fanfare();
      setPhase('champion');
      return;
    }
    sfx.boot();
    setPhase('loading');
  };

  const onLoaderDone = () => {
    const lvl = level + 1;
    setLevel(lvl);
    startLevel(sector, lvl);
  };

  // kick off the first level (handles "ghost serves first" on even saved levels)
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    startLevel(sector, level);
  }, [sector, level, startLevel]);

  useEffect(() => () => clearTimeout(cpuTimer.current), []);

  /* ---------- derived view state ---------- */

  const pacMood: Mood = phase === 'won' || phase === 'champion' ? 'happy' : phase === 'lost' ? 'ko' : 'idle';
  const ghostMood: Mood = phase === 'lost' ? 'happy' : phase === 'won' || phase === 'champion' ? 'ko' : 'idle';

  const ghostLook = useMemo(() => {
    if (lastMove < 0) return { x: 0, y: 0 };
    const cx = (lastMove % size) / (size - 1) - 0.5;
    const cy = Math.floor(lastMove / size) / (size - 1) - 0.5;
    return { x: Math.max(-1, Math.min(1, cx * 2)), y: Math.max(-1, Math.min(1, cy * 2)) };
  }, [lastMove, size]);

  const winLineCoords = useMemo(() => {
    if (!winLine || winLine.length < 2) return null;
    const first = winLine[0];
    const last = winLine[winLine.length - 1];
    const cellPt = (i: number) => ({ x: (i % size) + 0.5, y: Math.floor(i / size) + 0.5 });
    return { a: cellPt(first), b: cellPt(last) };
  }, [winLine, size]);

  const statusText =
    phase === 'play'
      ? 'YOUR MOVE, PLAYER 1'
      : phase === 'cpu'
        ? 'GHOSTY IS SCHEMING…'
        : phase === 'won'
          ? level >= 6
            ? `SECTOR MASTERED! +${level * 10 + bonus} 👻`
            : `LEVEL ${level} CLEARED! +${level * 10 + bonus} 👻`
          : phase === 'lost'
            ? `GHOSTY WINS THE ROUND… +${level * 5 + Math.floor(bonus / 2)} 🟡 TO ITS STASH`
            : phase === 'draw'
              ? 'A DRAW — NOBODY CHOMPS. RUN IT BACK!'
              : '';

  const mastered = save.progress[sector] === 7;

  return (
    <div className="pactoe crt-fx" ref={rootRef} role="application" aria-label="Pac-Toe Neon Arcade">
      {/* header */}
      <header className="pt-head">
        <span className="pt-title pixel">🕹️ PAC-TOE: NEON ARCADE</span>
        <div className="pt-coins">
          <div className="pt-coins__box" ref={ghostHudRef} title="Ghost coins you captured by winning">
            <span className="pt-coins__icon">👻</span>
            <span className="pt-coins__val term">{save.coins.ghost}</span>
            <span className="pt-coins__label">GHOST COINS — YOUR CAPTURES</span>
          </div>
          <div className="pt-coins__box pt-coins__box--ghost" ref={pacHudRef} title="Pac coins Ghosty hoarded from its wins">
            <span className="pt-coins__icon">🟡</span>
            <span className="pt-coins__val term">{save.coins.pac}</span>
            <span className="pt-coins__label">PAC COINS — GHOSTY'S STASH</span>
          </div>
        </div>
        <button className="pt-exit pixel" onClick={onExit}>✕ EXIT</button>
      </header>

      {/* sector tabs + legend */}
      <nav className="pt-tabs" aria-label="Sector select">
        {(Object.keys(SECTORS) as unknown as Sector[]).map((sec) => {
          const s = Number(sec) as Sector;
          return (
            <button
              key={s}
              className={`pt-tab pixel ${s === sector ? 'pt-tab--on' : ''}`}
              onClick={() => switchSector(s)}
              aria-pressed={s === sector}
            >
              {s}×{s}
              <span className="pt-tab__sub term">
                {save.progress[s] === 7 ? '★ MASTERED' : `LVL ${Math.min(save.progress[s], 6)}/6`}
              </span>
            </button>
          );
        })}
      </nav>
      <p className="pt-legend term">📜 {name}: {legend}</p>

      <div className="pt-arena">
        {/* PAC corner */}
        <aside className="pt-side">
          <div className="pt-char">
            <PacSprite color={pacColor} style={save.skin.style} mood={pacMood} animated />
            <span className="pt-char__name pixel">PAC</span>
            <span className="pt-char__tag term">PLAYER 1</span>
          </div>
          <div className="pt-skin">
            <span className="pt-skin__label pixel">PAC SKIN</span>
            <div className="pt-skin__styles">
              {STYLES.map((st) => (
                <button
                  key={st}
                  className={`pt-skin__style ${save.skin.style === st ? 'pt-skin__style--on' : ''}`}
                  onClick={() => {
                    sfx.click();
                    setSave((s) => ({ ...s, skin: { ...s.skin, style: st } }));
                  }}
                  aria-label={`${st} style`}
                  title={st.toUpperCase()}
                >
                  <PacSprite color={pacColor} style={st} />
                </button>
              ))}
            </div>
            <div className="pt-skin__colors">
              {PALETTE.map((c, i) => (
                <button
                  key={c}
                  className={`pt-skin__color ${save.skin.colorIdx === i ? 'pt-skin__color--on' : ''}`}
                  style={{ background: c }}
                  onClick={() => {
                    sfx.pop();
                    setSave((s) => ({ ...s, skin: { ...s.skin, colorIdx: i } }));
                  }}
                  aria-label={`Pac color ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* board column */}
        <div className="pt-center">
          <div className="pt-levels">
            {LEVEL_NAMES.map((lname, i) => {
              const lvl = i + 1;
              const done = save.progress[sector] > lvl || mastered;
              const current = lvl === level;
              return (
                <span
                  key={lname}
                  className={`pt-pip ${done ? 'pt-pip--done' : ''} ${current ? 'pt-pip--now' : ''}`}
                  title={`Level ${lvl}: ${lname}`}
                >
                  {lvl}
                </span>
              );
            })}
            <span className="pt-level-name pixel">
              LVL {level} — {LEVEL_NAMES[level - 1]}
              {ghostServes && <em className="term"> · GHOST SERVES FIRST</em>}
            </span>
          </div>

          <div className="pt-board-wrap">
            <div
              className={`pt-board ${phase === 'cpu' ? 'pt-board--waiting' : ''}`}
              ref={boardRef}
              style={{ ['--n' as string]: size }}
            >
              {board.map((cell, i) => (
                <button
                  key={i}
                  className={`pt-cell ${winLine?.includes(i) ? 'pt-cell--win' : ''} ${i === lastMove ? 'pt-cell--last' : ''}`}
                  onClick={() => playCell(i)}
                  disabled={phase !== 'play' || !!cell}
                  aria-label={`Cell ${(i % size) + 1},${Math.floor(i / size) + 1}${cell ? ` — ${cell === 'P' ? 'Pac' : 'Ghost'}` : ''}`}
                >
                  {cell === 'P' && <PacSprite color={pacColor} style={save.skin.style} className="pt-piece" />}
                  {cell === 'G' && (
                    <GhostSprite color={ghostColor} style={save.skin.style} className="pt-piece" />
                  )}
                </button>
              ))}
              {winLineCoords && (
                <svg className="pt-winline" viewBox={`0 0 ${size} ${size}`} preserveAspectRatio="none" aria-hidden="true">
                  <line
                    x1={winLineCoords.a.x}
                    y1={winLineCoords.a.y}
                    x2={winLineCoords.b.x}
                    y2={winLineCoords.b.y}
                    pathLength={1}
                    stroke={winLine && board[winLine[0]] === 'P' ? pacColor : ghostColor}
                  />
                </svg>
              )}
            </div>

            {(phase === 'won' || phase === 'lost' || phase === 'draw') && (
              <div className={`pt-banner ${phase === 'won' ? 'pt-banner--win' : ''}`}>
                <span className="pt-banner__big pixel">
                  {phase === 'won' ? (level >= 6 ? '🏆 SECTOR MASTERED!' : '🎉 PAC WINS!') : phase === 'lost' ? '👻 GHOSTY WINS!' : '🤝 DRAW!'}
                </span>
                <div className="pt-banner__actions">
                  {phase === 'won' && (
                    <button className="btn btn--mint" onClick={advance}>
                      {level >= 6 ? '🏆 CLAIM TROPHY' : '▸ NEXT LEVEL'}
                    </button>
                  )}
                  {(phase === 'lost' || phase === 'draw') && (
                    <button className="btn" onClick={() => { sfx.coin(); startLevel(sector, level); }}>
                      ↻ {phase === 'lost' ? 'RETRY LEVEL' : 'REMATCH'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-status pixel" role="status">{statusText}</div>
        </div>

        {/* GHOSTY corner */}
        <aside className="pt-side">
          <div className="pt-char">
            <GhostSprite color={ghostColor} style={save.skin.style} mood={ghostMood} look={ghostLook} animated />
            <span className="pt-char__name pixel">GHOSTY</span>
            <span className="pt-char__tag term">CPU · {LEVEL_NAMES[level - 1]}</span>
          </div>
          <div className="pt-stash term">
            <span>👻 CAPTURED: <b>{save.coins.ghost}</b></span>
            <span>🟡 STASH: <b>{save.coins.pac}</b></span>
            <span className="pt-stash__hint">Beat Ghosty to capture ghost coins. Lose, and it hoards pac coins!</span>
          </div>
        </aside>
      </div>

      {/* level transition */}
      {phase === 'loading' && (
        <CartridgeLoader
          withCoin={false}
          duration={1.2}
          label={`LEVEL ${level + 1} ▸ ${LEVEL_NAMES[level]}`}
          onDone={onLoaderDone}
        />
      )}

      {/* sector champion */}
      {phase === 'champion' && (
        <div className="pt-champion">
          <span className="pt-champion__trophy">🏆</span>
          <h2 className="pixel">SECTOR CHAMPION!</h2>
          <p className="term">
            You conquered all 6 levels of the {name} ({sector}×{sector}). Ghost coins captured: {save.coins.ghost} 👻
          </p>
          <div className="pt-champion__actions">
            {sector !== 7 && (
              <button className="btn btn--mint" onClick={() => switchSector(sector === 3 ? 5 : 7)}>
                ▸ NEXT SECTOR ({sector === 3 ? '5×5' : '7×7'})
              </button>
            )}
            <button className="btn" onClick={() => { setLevel(6); startLevel(sector, 6); }}>
              ↻ REPLAY ARCADE GOD
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
