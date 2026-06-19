import type { KeyboardEvent } from 'react';
import type { ResearchLog } from '../data/researchLogs';
import { sfx } from '../sound';

interface ResearchLogRowProps {
  log: ResearchLog;
  onSelect: (id: string) => void;
}

export default function ResearchLogRow({ log, onSelect }: ResearchLogRowProps) {
  const isLive = log.status === 'live';

  const activate = () => {
    sfx.hover();
    onSelect(log.id);
  };

  return (
    <div
      className={`research-row${isLive ? '' : ' research-row--soon'}`}
      onClick={() => {
        if (!isLive) return;
        activate();
      }}
      {...(isLive
        ? {
            role: 'button' as const,
            tabIndex: 0,
            'aria-label': `Open research log: ${log.title}`,
            onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
              if (e.key === 'Enter') {
                activate();
              } else if (e.key === ' ') {
                e.preventDefault();
                activate();
              }
            },
          }
        : {})}
    >
      <div className="research-row__head">
        <span className="research-row__num">{log.number}</span>
        <div>
          <div className="research-row__title">{log.title}</div>
          <div className="research-row__legend">{log.legend}</div>
        </div>
        {!isLive && <span className="cert__year">SOON</span>}
      </div>

      {isLive && log.links && (
        <div className="research-row__links">
          <a
            className="research-row__btn"
            href={log.links.html}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            🌐 READ ONLINE
          </a>
          <a
            className="research-row__btn"
            href={log.links.pdf}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            📄 PDF
          </a>
          <a
            className="research-row__btn"
            href={log.links.doi}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            🎓 CITE
          </a>
          {log.links.video && (
            <a
              className="research-row__btn"
              href={log.links.video}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              🎬 VIDEO
            </a>
          )}
        </div>
      )}
    </div>
  );
}
