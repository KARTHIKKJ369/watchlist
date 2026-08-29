import React from 'react';
import { useWatchlist } from '../context/WatchlistContext';

export const StatsHeader: React.FC = () => {
  const { stats } = useWatchlist();

  const hours = Math.round(stats.totalRuntimeMinutes / 60);

  if (stats.totalCount === 0) {
    return null; // The onboarding hero in WatchlistGrid carries the visual weight
  }

  return (
    <div className="stats-header-minimal">
      <h1 className="stats-headline">
        {hours > 0 ? `${hours} hrs` : `${stats.totalCount} titles`} across {stats.totalCount} title{stats.totalCount === 1 ? '' : 's'}.
      </h1>
      <p className="stats-subline">
        {stats.completedCount} completed · {stats.watchingCount} watching · {stats.planToWatchCount} queued
      </p>

      <style>{`
        .stats-header-minimal {
          margin-bottom: 32px;
        }

        .stats-headline {
          font-family: var(--font-display);
          font-size: 2.5rem;
          font-weight: 400;
          color: var(--ink);
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }

        @media (max-width: 768px) {
          .stats-headline {
            font-size: 1.75rem;
          }
        }

        .stats-subline {
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          color: var(--ink-2);
          letter-spacing: 0.02em;
        }
      `}</style>
    </div>
  );
};
