type Props = {
  tagline?: boolean;
  className?: string;
};

/**
 * sanblueᵈᵒᵗ wordmark — real <sup> superscript (accessible: screen readers
 * read the aria-label "sanbluedot"). dot is always brand blue #7CB3E8;
 * "sanblue" inherits currentColor so it adapts to light/dark backgrounds.
 */
export default function SanblueWordmark({ tagline = false, className = '' }: Props) {
  return (
    <a
      href="https://github.com/sanbluedot"
      target="_blank"
      rel="noreferrer"
      className={`sanblue-wm ${className}`.trim()}
      aria-label="sanbluedot — retro dev-station"
    >
      sanblue<sup className="sanblue-wm__dot">dot</sup>
      {tagline && <span className="sanblue-wm__tag"> — retro dev-station</span>}
    </a>
  );
}
