/**
 * Pac-Toe engine — generic K-in-a-row on an N×N board.
 * One engine powers every sector: 3×3 (k=3), 5×5 (k=4), 7×7 (k=5),
 * so the game dynamic stays identical as the grid grows.
 * Six difficulty levels, from coin-flip rookie to ARCADE GOD.
 */

export type Cell = 'P' | 'G' | null;

export interface WinResult {
  who: 'P' | 'G';
  line: number[];
}

const DIRS: Array<[number, number]> = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

export function findWin(board: Cell[], size: number, k: number): WinResult | null {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const who = board[y * size + x];
      if (!who) continue;
      for (const [dx, dy] of DIRS) {
        const px = x - dx;
        const py = y - dy;
        // only evaluate from the start of a run
        if (px >= 0 && px < size && py >= 0 && py < size && board[py * size + px] === who) continue;
        const line = [y * size + x];
        let nx = x + dx;
        let ny = y + dy;
        while (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny * size + nx] === who) {
          line.push(ny * size + nx);
          nx += dx;
          ny += dy;
        }
        if (line.length >= k) return { who, line: line.slice(0, k) };
      }
    }
  }
  return null;
}

export function isFull(board: Cell[]): boolean {
  return board.every(Boolean);
}

function emptyIndices(board: Cell[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < board.length; i++) if (!board[i]) out.push(i);
  return out;
}

/** Empty cells within Chebyshev distance 1 of any piece (keeps big boards fast). */
function candidates(board: Cell[], size: number): number[] {
  const set = new Set<number>();
  let hasPiece = false;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!board[y * size + x]) continue;
      hasPiece = true;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
          const i = ny * size + nx;
          if (!board[i]) set.add(i);
        }
      }
    }
  }
  if (!hasPiece) {
    const c = Math.floor(size / 2);
    return [c * size + c];
  }
  return [...set];
}

/** Value of placing `who` at `idx`: best resulting run through that cell per direction. */
function placementScore(board: Cell[], size: number, k: number, idx: number, who: 'P' | 'G'): number {
  const x0 = idx % size;
  const y0 = Math.floor(idx / size);
  let total = 0;
  for (const [dx, dy] of DIRS) {
    let count = 1;
    let open = 0;
    // forward
    let nx = x0 + dx;
    let ny = y0 + dy;
    while (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny * size + nx] === who) {
      count++;
      nx += dx;
      ny += dy;
    }
    if (nx >= 0 && nx < size && ny >= 0 && ny < size && !board[ny * size + nx]) open++;
    // backward
    nx = x0 - dx;
    ny = y0 - dy;
    while (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny * size + nx] === who) {
      count++;
      nx -= dx;
      ny -= dy;
    }
    if (nx >= 0 && nx < size && ny >= 0 && ny < size && !board[ny * size + nx]) open++;

    if (count >= k) total += 1_000_000;
    else if (count === k - 1 && open === 2) total += 120_000;
    else if (count === k - 1 && open === 1) total += 12_000;
    else if (count === k - 2 && open === 2) total += 3_000;
    else if (count === k - 2 && open === 1) total += 300;
    else if (count === k - 3 && open === 2) total += 60;
    else total += count * 8 + open * 2;
  }
  return total;
}

function moveScore(board: Cell[], size: number, k: number, idx: number, cpu: 'P' | 'G'): number {
  const opp: 'P' | 'G' = cpu === 'G' ? 'P' : 'G';
  return placementScore(board, size, k, idx, cpu) + placementScore(board, size, k, idx, opp) * 0.88;
}

function findImmediate(board: Cell[], size: number, k: number, who: 'P' | 'G'): number | null {
  for (const i of emptyIndices(board)) {
    board[i] = who;
    const win = findWin(board, size, k);
    board[i] = null;
    if (win) return i;
  }
  return null;
}

function topCandidates(board: Cell[], size: number, k: number, cpu: 'P' | 'G', n: number): number[] {
  return candidates(board, size)
    .map((i) => ({ i, s: moveScore(board, size, k, i, cpu) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((e) => e.i);
}

/** Negamax with alpha-beta over pruned candidates; heuristic leaf eval. */
function search(
  board: Cell[],
  size: number,
  k: number,
  who: 'P' | 'G',
  depth: number,
  alpha: number,
  beta: number
): number {
  const win = findWin(board, size, k);
  if (win) return win.who === who ? 1_000_000 + depth : -(1_000_000 + depth);
  if (isFull(board)) return 0;
  if (depth === 0) {
    const opp: 'P' | 'G' = who === 'G' ? 'P' : 'G';
    const mine = Math.max(0, ...candidates(board, size).map((i) => placementScore(board, size, k, i, who)));
    const theirs = Math.max(0, ...candidates(board, size).map((i) => placementScore(board, size, k, i, opp)));
    return mine - theirs * 0.95;
  }
  const opp: 'P' | 'G' = who === 'G' ? 'P' : 'G';
  let best = -Infinity;
  for (const i of topCandidates(board, size, k, who, 7)) {
    board[i] = who;
    const v = -search(board, size, k, opp, depth - 1, -beta, -alpha);
    board[i] = null;
    if (v > best) best = v;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best === -Infinity ? 0 : best;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Choose the ghost's move. Levels 1-6:
 * 1 ROOKIE      — mostly random, sometimes sees wins/blocks
 * 2 PLAYER      — always wins/blocks, otherwise wanders near pieces
 * 3 PRO         — heuristic scoring with a little noise
 * 4 EXPERT      — best heuristic move
 * 5 MASTER      — 2-ply search
 * 6 ARCADE GOD  — 3-ply search (with a 7% mercy blunder so victory stays possible)
 */
export function chooseMove(board: Cell[], size: number, k: number, level: number, cpu: 'P' | 'G' = 'G'): number {
  const empties = emptyIndices(board);
  if (empties.length === 0) return -1;
  if (empties.length === board.length) {
    const c = Math.floor(size / 2);
    return level <= 2 ? pick(empties.filter((i) => i !== c * size + c).concat(c * size + c)) : c * size + c;
  }

  const opp: 'P' | 'G' = cpu === 'G' ? 'P' : 'G';
  const winNow = findImmediate(board, size, k, cpu);
  const blockNow = findImmediate(board, size, k, opp);
  const cands = candidates(board, size);

  switch (level) {
    case 1: {
      if (winNow !== null && Math.random() < 0.65) return winNow;
      if (blockNow !== null && Math.random() < 0.4) return blockNow;
      return pick(cands);
    }
    case 2: {
      if (winNow !== null) return winNow;
      if (blockNow !== null) return blockNow;
      return pick(cands);
    }
    case 3: {
      if (winNow !== null) return winNow;
      if (blockNow !== null) return blockNow;
      return pick(topCandidates(board, size, k, cpu, 3));
    }
    case 4: {
      if (winNow !== null) return winNow;
      if (blockNow !== null) return blockNow;
      return topCandidates(board, size, k, cpu, 1)[0];
    }
    default: {
      if (winNow !== null) return winNow;
      if (blockNow !== null) return blockNow;
      // mercy blunder keeps the top level beatable
      if (level === 6 && Math.random() < 0.07) return pick(topCandidates(board, size, k, cpu, 4));
      const depth = level === 5 ? 2 : 3;
      let best = -Infinity;
      let bestMove = cands[0];
      for (const i of topCandidates(board, size, k, cpu, 8)) {
        board[i] = cpu;
        const v = -search(board, size, k, opp, depth - 1, -Infinity, Infinity);
        board[i] = null;
        if (v > best) {
          best = v;
          bestMove = i;
        }
      }
      return bestMove;
    }
  }
}
