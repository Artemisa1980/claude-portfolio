/**
 * Pac & Ghosty — the stars of Pac-Toe.
 * Three switchable styles (classic vector, neon outline, 8-bit pixel),
 * any brand color, and moods so the characters react to the match.
 */

export type SpriteStyle = 'classic' | 'neon' | 'pixel';
export type Mood = 'idle' | 'happy' | 'ko';

interface SpriteProps {
  color: string;
  style?: SpriteStyle;
  mood?: Mood;
  /** Adds the CSS chomp/float animation (used for the big side characters). */
  animated?: boolean;
  className?: string;
}

/* ---------- 8-bit bitmaps ( . empty / # body / o eye-white / p pupil ) ---------- */

const PAC_PIXELS = [
  '....####....',
  '..########..',
  '.##########.',
  '.#####.###..',
  '.########...',
  '.######.....',
  '.####.......',
  '.######.....',
  '.########...',
  '.##########.',
  '..########..',
  '....####....',
];

const GHOST_PIXELS = [
  '....####....',
  '..########..',
  '.##########.',
  '.#oo####oo#.',
  '.#pp####pp#.',
  '.##########.',
  '.##########.',
  '.##########.',
  '.##########.',
  '.##########.',
  '.#.##..##.#.',
  '............',
];

function PixelRects({ rows, color }: { rows: string[]; color: string }) {
  const rects = [];
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (ch === '.') continue;
      const fill = ch === '#' ? color : ch === 'o' ? '#f2edda' : '#131a43';
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.05} height={1.05} fill={fill} />);
    }
  }
  return <g shapeRendering="crispEdges">{rects}</g>;
}

/* ---------- Pac ---------- */

export function PacSprite({ color, style = 'classic', mood = 'idle', animated = false, className }: SpriteProps) {
  const cls = `sprite ${animated ? 'sprite--chomp' : ''} ${className ?? ''}`;
  if (style === 'pixel') {
    return (
      <svg viewBox="0 0 12 12" className={cls} aria-hidden="true">
        <PixelRects rows={PAC_PIXELS} color={color} />
        {mood === 'ko' && <PixelKO />}
      </svg>
    );
  }
  const isNeon = style === 'neon';
  // wedge mouth: arc from 36° to -36° (pointing right)
  const mouthOpen = 'M50,50 L93,24 A50,50 0 1,0 93,76 Z';
  const mouthShut = 'M50,50 L98,42 A50,50 0 1,0 98,58 Z';
  return (
    <svg viewBox="0 0 100 100" className={cls} aria-hidden="true">
      <g
        fill={isNeon ? 'transparent' : color}
        stroke={isNeon ? color : 'none'}
        strokeWidth={isNeon ? 5 : 0}
        style={isNeon ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
      >
        <path className="sprite__mouth-open" d={mouthOpen} />
        <path className="sprite__mouth-shut" d={mouthShut} />
      </g>
      {mood === 'ko' ? (
        <g stroke="#131a43" strokeWidth="6" strokeLinecap="round">
          <path d="M40,22 l12,12 M52,22 l-12,12" />
        </g>
      ) : (
        <circle cx="46" cy="26" r={mood === 'happy' ? 8 : 6} fill={isNeon ? color : '#131a43'} />
      )}
    </svg>
  );
}

/* ---------- Ghosty ---------- */

interface GhostProps extends SpriteProps {
  /** Pupil direction, each -1..1 (looks toward the last move). */
  look?: { x: number; y: number };
}

export function GhostSprite({ color, style = 'classic', mood = 'idle', look = { x: 0, y: 0 }, animated = false, className }: GhostProps) {
  const cls = `sprite ${animated ? 'sprite--float' : ''} ${className ?? ''}`;
  if (style === 'pixel') {
    return (
      <svg viewBox="0 0 12 12" className={cls} aria-hidden="true">
        <PixelRects rows={GHOST_PIXELS} color={color} />
        {mood === 'ko' && <PixelKO />}
      </svg>
    );
  }
  const isNeon = style === 'neon';
  const px = look.x * 4;
  const py = look.y * 4;
  return (
    <svg viewBox="0 0 100 100" className={cls} aria-hidden="true">
      <path
        d="M50,6 C26,6 12,24 12,48 L12,92 L24,80 L36,92 L50,80 L64,92 L76,80 L88,92 L88,48 C88,24 74,6 50,6 Z"
        fill={isNeon ? 'transparent' : color}
        stroke={isNeon ? color : 'none'}
        strokeWidth={isNeon ? 5 : 0}
        style={isNeon ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
      />
      {mood === 'ko' ? (
        <g stroke={isNeon ? color : '#f2edda'} strokeWidth="6" strokeLinecap="round">
          <path d="M30,36 l14,14 M44,36 l-14,14 M58,36 l14,14 M72,36 l-14,14" />
        </g>
      ) : (
        <>
          <ellipse cx="36" cy="42" rx="11" ry="13" fill="#f2edda" />
          <ellipse cx="64" cy="42" rx="11" ry="13" fill="#f2edda" />
          <circle cx={36 + px} cy={42 + py} r="5.5" fill="#131a43" />
          <circle cx={64 + px} cy={42 + py} r="5.5" fill="#131a43" />
          {mood === 'happy' && (
            <path d="M36,62 Q50,74 64,62" stroke="#131a43" strokeWidth="5" fill="none" strokeLinecap="round" />
          )}
        </>
      )}
    </svg>
  );
}

function PixelKO() {
  return (
    <g stroke="#ff5d5d" strokeWidth="0.8" strokeLinecap="square">
      <path d="M3,3 l2,2 M5,3 l-2,2 M7,3 l2,2 M9,3 l-2,2" />
    </g>
  );
}
