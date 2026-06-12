import { useState } from 'react';
import { sfx } from '../sound';

type Cell = 'P' | 'G' | null;

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function winnerOf(board: Cell[]): { who: Cell; line: number[] } | null {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { who: board[a], line };
    }
  }
  return null;
}

/** Ghost AI: win if possible, block if needed, take center, else random. */
function ghostMove(board: Cell[]): number {
  const empty = board.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  for (const who of ['G', 'P'] as const) {
    for (const i of empty) {
      const copy = [...board];
      copy[i] = who;
      if (winnerOf(copy)?.who === who) return i;
    }
  }
  if (board[4] === null) return 4;
  return empty[Math.floor(Math.random() * empty.length)];
}

export default function PacToe({ onExit }: { onExit: () => void }) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [score, setScore] = useState({ player: 0, ghost: 0, draws: 0 });
  const [over, setOver] = useState(false);

  const win = winnerOf(board);
  const full = board.every(Boolean);

  const status = win
    ? win.who === 'P'
      ? '🏆 PAC WINS! GHOSTS DEFEATED!'
      : '👻 GHOST WINS! TRY AGAIN!'
    : full
      ? '🤝 DRAW! NOBODY CHOMPS!'
      : 'YOUR MOVE, PLAYER 1 — CHOMP A CELL';

  function play(i: number) {
    if (board[i] || win || over) return;
    sfx.pop();
    const next = [...board];
    next[i] = 'P';

    const playerWin = winnerOf(next);
    if (playerWin || next.every(Boolean)) {
      finish(next, playerWin?.who ?? null);
      return;
    }

    // ghost replies after a beat
    setBoard(next);
    setOver(true);
    setTimeout(() => {
      const g = ghostMove(next);
      const after = [...next];
      after[g] = 'G';
      const ghostWin = winnerOf(after);
      if (ghostWin || after.every(Boolean)) {
        finish(after, ghostWin?.who ?? null);
      } else {
        setBoard(after);
        setOver(false);
      }
    }, 420);
  }

  function finish(finalBoard: Cell[], who: Cell) {
    setBoard(finalBoard);
    setOver(true);
    if (who === 'P') {
      sfx.win();
      setScore((s) => ({ ...s, player: s.player + 1 }));
    } else if (who === 'G') {
      sfx.lose();
      setScore((s) => ({ ...s, ghost: s.ghost + 1 }));
    } else {
      sfx.locked();
      setScore((s) => ({ ...s, draws: s.draws + 1 }));
    }
  }

  function restart() {
    sfx.coin();
    setBoard(Array(9).fill(null));
    setOver(false);
  }

  return (
    <div className="game" role="dialog" aria-label="Pac-Toe Neon Arcade">
      <div className="game__crt crt-fx">
        <div className="game__head">
          <span className="game__title">🕹️ PAC-TOE: NEON ARCADE</span>
          <button className="game__close" onClick={onExit}>
            ✕ EXIT
          </button>
        </div>
        <div className="game__score">
          <span>🟡 PAC <b>{score.player}</b></span>
          <span>👻 GHOST <b>{score.ghost}</b></span>
          <span>🤝 DRAW <b>{score.draws}</b></span>
        </div>
        <div className="game__board">
          {board.map((cell, i) => (
            <button
              key={i}
              className={`game__cell ${win?.line.includes(i) ? 'game__cell--win' : ''}`}
              onClick={() => play(i)}
              disabled={!!cell || !!win || over}
              aria-label={`cell ${i + 1}`}
            >
              {cell === 'P' ? '🟡' : cell === 'G' ? '👻' : ''}
            </button>
          ))}
        </div>
        <div className="game__status">{status}</div>
        <div className="game__actions">
          {(win || full) && (
            <button className="btn btn--mint" onClick={restart}>
              ↻ Play Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
