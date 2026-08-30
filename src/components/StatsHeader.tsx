import React from 'react';
import { useWatchlist } from '../context/WatchlistContext';

export const StatsHeader: React.FC = () => {
  const { stats } = useWatchlist();

  const formatHeaderRuntime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0 && remainingMins > 0) return `${hours}H ${remainingMins.toString().padStart(2, '0')}M`;
    if (hours > 0) return `${hours}H 00M`;
    return `${mins}M`;
  };

  if (stats.totalCount === 0) {
    return null;
  }

  const timeStr = stats.totalRuntimeMinutes > 0 ? formatHeaderRuntime(stats.totalRuntimeMinutes) : null;
  const countPadded = stats.totalCount.toString().padStart(2, '0');

  return (
    <div className="stats-header-nothing">
      <div className="stats-headline-row">
        <span className="stats-live-dot" />
        <h1 className="stats-headline">
          {timeStr ? `${timeStr} // ${countPadded} TITLES` : `${countPadded} TITLES`}
        </h1>
      </div>
      
      <div className="stats-tech-subline">
        <span className="tech-stat-item">
          <span className="tech-stat-val">{stats.completedCount.toString().padStart(2, '0')}</span> COMPLETED
        </span>
        <span className="tech-stat-sep">//</span>
        <span className="tech-stat-item">
          <span className="tech-stat-val">{stats.watchingCount.toString().padStart(2, '0')}</span> WATCHING
        </span>
        <span className="tech-stat-sep">//</span>
        <span className="tech-stat-item">
          <span className="tech-stat-val">{stats.planToWatchCount.toString().padStart(2, '0')}</span> QUEUED
        </span>
        {stats.droppedCount > 0 && (
          <>
            <span className="tech-stat-sep">//</span>
            <span className="tech-stat-item muted">
              <span className="tech-stat-val">{stats.droppedCount.toString().padStart(2, '0')}</span> DROPPED
            </span>
          </>
        )}
      </div>

      <style>{`
        .stats-header-nothing {
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .stats-headline-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .stats-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--accent);
          box-shadow: 0 0 10px var(--accent);
          flex-shrink: 0;
        }

        .stats-headline {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 700;
          color: var(--ink);
          line-height: 1.15;
          letter-spacing: -0.02em;
        }

        @media (max-width: 768px) {
          .stats-headline {
            font-size: 1.6rem;
          }
        }

        .stats-tech-subline {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: var(--ink-2);
          letter-spacing: 0.06em;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tech-stat-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .tech-stat-item.muted {
          color: var(--ink-3);
        }

        .tech-stat-val {
          color: var(--ink);
          font-weight: 700;
        }

        .tech-stat-sep {
          color: var(--border);
        }
      `}</style>
    </div>
  );
};
