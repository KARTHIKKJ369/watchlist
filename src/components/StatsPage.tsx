import React from 'react';
import { useWatchlist } from '../context/WatchlistContext';

export const StatsPage: React.FC = () => {
  const { stats, watchlist, openDetailModal } = useWatchlist();

  const calculatePct = (count: number) => {
    if (!stats.totalCount) return 0;
    return Math.round((count / stats.totalCount) * 100);
  };

  const topRatedItems = [...watchlist]
    .filter((w) => (w.userRating && w.userRating > 0) || w.voteAverage > 0)
    .sort((a, b) => (b.userRating || b.voteAverage) - (a.userRating || a.userRating))
    .slice(0, 5);

  const ratedItemsList = [...watchlist].filter((w) => w.userRating && w.userRating > 0);
  const lowestRatedItem = [...ratedItemsList].sort((a, b) => a.userRating - b.userRating)[0];

  const opacityScale = ['1', '0.75', '0.55', '0.4', '0.25'];
  const topGenre = stats.topGenres[0]?.genre || 'Drama';
  const totalHours = Math.round(stats.totalRuntimeMinutes / 60);

  return (
    <div className="insights-view-2col">
      {/* Left Column: Personalization & Analytical Metrics */}
      <div className="insights-left-col">
        {/* Editorial Personalization Note */}
        <div className="editorial-taste-block">
          <span className="editorial-eyebrow">FRAME TASTE PROFILE</span>
          <h2 className="editorial-headline">
            {topGenre} & auteur cinema dominate your collection.
          </h2>
          <p className="editorial-subtext">
            You curate selectively across {stats.totalCount} titles with an average rating of{' '}
            <span className="accent-text">{stats.averageUserRating || '9.6'} /10</span>. Over{' '}
            {totalHours} hours logged across films and episodic television.
          </p>
        </div>

        {/* Analytical Metric Row (Typography-led) */}
        <div className="analytical-metrics-strip">
          <div className="analytical-metric-item">
            <span className="metric-label">COMPLETION RATE</span>
            <span className="metric-num">{calculatePct(stats.completedCount)}%</span>
            <span className="metric-sub">{stats.completedCount} of {stats.totalCount} done</span>
          </div>

          <div className="analytical-metric-item">
            <span className="metric-label">FILMS / SERIES</span>
            <span className="metric-num">
              {stats.moviesCount} <span className="metric-slash">/</span> {stats.tvCount}
            </span>
            <span className="metric-sub">
              {calculatePct(stats.moviesCount)}% · {calculatePct(stats.tvCount)}%
            </span>
          </div>

          <div className="analytical-metric-item">
            <span className="metric-label">WATCH TIME</span>
            <span className="metric-num">{totalHours} <span className="metric-unit">hrs</span></span>
            <span className="metric-sub">
              {stats.watchingCount} active
            </span>
          </div>
        </div>

        {/* Status Breakdown Bar: Hard Cuts */}
        <div className="insights-block">
          <span className="insights-label">Status Breakdown</span>
          <div className="status-filmstrip-track">
            <div
              className="filmstrip-seg completed"
              style={{ width: `${calculatePct(stats.completedCount)}%` }}
              title={`Completed: ${stats.completedCount}`}
            />
            <div
              className="filmstrip-seg watching"
              style={{ width: `${calculatePct(stats.watchingCount)}%` }}
              title={`Watching: ${stats.watchingCount}`}
            />
            <div
              className="filmstrip-seg queued"
              style={{ width: `${calculatePct(stats.planToWatchCount)}%` }}
              title={`Queued: ${stats.planToWatchCount}`}
            />
            <div
              className="filmstrip-seg dropped"
              style={{ width: `${calculatePct(stats.droppedCount)}%` }}
              title={`Dropped: ${stats.droppedCount}`}
            />
          </div>

          <div className="filmstrip-legend">
            <span>Completed {calculatePct(stats.completedCount)}%</span>
            <span>·</span>
            <span>Watching {calculatePct(stats.watchingCount)}%</span>
            <span>·</span>
            <span>Queued {calculatePct(stats.planToWatchCount)}%</span>
            {stats.droppedCount > 0 && (
              <>
                <span>·</span>
                <span>Dropped {calculatePct(stats.droppedCount)}%</span>
              </>
            )}
          </div>
        </div>

        {/* Top Genres (Flat accent bars at varying opacity) */}
        <div className="insights-block">
          <span className="insights-label">Genre Distribution</span>
          <div className="genres-list">
            {stats.topGenres.length > 0 ? (
              stats.topGenres.map((g, idx) => {
                const maxCount = stats.topGenres[0]?.count || 1;
                const barWidth = Math.round((g.count / maxCount) * 100);
                const opacity = opacityScale[idx] || '0.2';

                return (
                  <div key={g.genre} className="genre-row">
                    <span className="genre-name-col">{g.genre}</span>
                    <div className="genre-track-col">
                      <div
                        className="genre-fill-flat"
                        style={{
                          width: `${barWidth}%`,
                          opacity: opacity,
                        }}
                      />
                    </div>
                    <span className="genre-count-col">{g.count}</span>
                  </div>
                );
              })
            ) : (
              <p className="empty-subtext">No genre data available yet.</p>
            )}
          </div>
        </div>

        {/* Lowest Rated Glance */}
        {lowestRatedItem && (
          <div className="lowest-rated-glance">
            <span className="insights-label">Lowest Rated Title</span>
            <div className="lowest-row" onClick={() => openDetailModal(lowestRatedItem)}>
              <span className="lowest-title">{lowestRatedItem.title}</span>
              <span className="lowest-score">{lowestRatedItem.userRating} /10</span>
            </div>
          </div>
        )}
      </div>

      {/* Right Column (Centerpiece): Top Ranked Titles with Progressive Emphasis */}
      <div className="insights-right-col">
        <div className="insights-block">
          <span className="insights-label">Top Ranked Centerpiece</span>

          <div className="leaderboard-centerpiece">
            {topRatedItems.length > 0 ? (
              topRatedItems.map((item, idx) => {
                const rating = item.userRating > 0 ? item.userRating : item.voteAverage;
                const isNumberOne = idx === 0;

                return (
                  <div
                    key={item.id}
                    className={`leaderboard-card-row ${isNumberOne ? 'number-one-spot' : ''}`}
                    onClick={() => openDetailModal(item)}
                  >
                    {/* Rank Indicator */}
                    <span className={`rank-tag ${isNumberOne ? 'gold-highlight' : ''}`}>
                      #{idx + 1}
                    </span>

                    {/* Tiny Poster Thumbnail */}
                    <div className={`leader-thumb ${isNumberOne ? 'thumb-large' : ''}`}>
                      {item.posterPath ? (
                        <img src={item.posterPath} alt={item.title} className="thumb-img" loading="lazy" />
                      ) : (
                        <div className="thumb-fallback">
                          <span>{item.title[0]}</span>
                        </div>
                      )}
                    </div>

                    {/* Title + Subtext */}
                    <div className="leader-info">
                      <h4 className={`leader-title ${isNumberOne ? 'title-spotlight' : ''}`}>
                        {item.title}
                      </h4>
                      <div className="leader-sub">
                        <span>{item.releaseYear}</span>
                        {item.genres?.length > 0 && (
                          <>
                            <span className="sub-dot">·</span>
                            <span>{item.genres[0]}</span>
                          </>
                        )}
                        {item.director && (
                          <>
                            <span className="sub-dot">·</span>
                            <span className="dir-tag">Dir. {item.director}</span>
                          </>
                        )}
                      </div>
                      {isNumberOne && item.userNotes && (
                        <p className="leader-quote">&ldquo;{item.userNotes}&rdquo;</p>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="rating-num leader-score">
                      {rating}
                      <span className="rating-suffix">/10</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="empty-subtext">Rate titles in your collection to generate your leaderboard.</p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .insights-view-2col {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 48px;
          width: 100%;
          max-width: 100%;
        }

        @media (max-width: 900px) {
          .insights-view-2col {
            grid-template-columns: 1fr;
            gap: 36px;
          }
        }

        .insights-left-col {
          display: flex;
          flex-direction: column;
          gap: 32px;
          min-width: 0;
        }

        .insights-right-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
          min-width: 0;
        }

        /* Editorial Personalization Note */
        .editorial-taste-block {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .editorial-eyebrow {
          font-family: var(--font-ui);
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--accent);
          font-weight: 600;
        }

        .editorial-headline {
          font-family: var(--font-display);
          font-size: clamp(1.35rem, 4vw, 1.75rem);
          font-weight: 400;
          color: var(--ink);
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        .editorial-subtext {
          font-family: var(--font-ui);
          font-size: 0.84rem;
          color: var(--ink-2);
          line-height: 1.6;
        }

        .accent-text {
          color: var(--accent);
          font-weight: 600;
        }

        /* Typography-led Metrics Strip */
        .analytical-metrics-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 14px 0;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }

        @media (max-width: 480px) {
          .analytical-metrics-strip {
            gap: 8px;
          }
        }

        .analytical-metric-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .metric-label {
          font-size: 0.625rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--ink-2);
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .metric-num {
          font-family: var(--font-display);
          font-size: clamp(1.2rem, 3.5vw, 1.5rem);
          color: var(--ink);
          line-height: 1.2;
          white-space: nowrap;
        }

        .metric-slash {
          color: var(--border);
          font-size: 0.9em;
        }

        .metric-unit {
          font-family: var(--font-ui);
          font-size: 0.75rem;
          color: var(--ink-2);
        }

        .metric-sub {
          font-size: 0.6875rem;
          color: var(--ink-2);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Insights Block */
        .insights-block {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
        }

        .insights-label {
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--ink-2);
          font-weight: 600;
        }

        /* Hard-cut 6px filmstrip track */
        .status-filmstrip-track {
          height: 6px;
          border-radius: 0;
          background: var(--surface);
          overflow: hidden;
          display: flex;
          width: 100%;
        }

        .filmstrip-seg {
          height: 100%;
          border-radius: 0;
        }

        .filmstrip-seg.completed {
          background: var(--accent);
        }
        .filmstrip-seg.watching {
          background: var(--border);
        }
        .filmstrip-seg.queued {
          background: var(--surface-2);
        }
        .filmstrip-seg.dropped {
          background: oklch(55% 0.01 265 / 0.2);
        }

        .filmstrip-legend {
          font-family: var(--font-ui);
          font-size: 0.75rem;
          color: var(--ink-2);
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        /* Genre Distribution */
        .genres-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .genre-row {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .genre-name-col {
          width: 80px;
          font-size: 0.75rem;
          color: var(--ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex-shrink: 0;
        }

        .genre-track-col {
          flex: 1;
          height: 4px;
          background: var(--surface);
          min-width: 40px;
        }

        .genre-fill-flat {
          height: 100%;
          background: var(--accent);
        }

        .genre-count-col {
          width: 20px;
          text-align: right;
          font-size: 0.75rem;
          color: var(--ink-2);
          flex-shrink: 0;
        }

        /* Lowest Rated Glance */
        .lowest-rated-glance {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-top: 14px;
          border-top: 1px solid var(--border);
        }

        .lowest-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
        }

        .lowest-title {
          font-family: var(--font-display);
          font-size: 0.9rem;
          color: var(--ink-2);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lowest-row:hover .lowest-title {
          color: var(--ink);
        }

        .lowest-score {
          font-size: 0.75rem;
          color: var(--ink-2);
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* Centerpiece Leaderboard with Progressive Emphasis */
        .leaderboard-centerpiece {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .leaderboard-card-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--surface);
          cursor: pointer;
          min-width: 0;
          transition: border-color 150ms ease, background-color 150ms ease, transform 150ms ease;
        }

        .leaderboard-card-row:hover {
          border-color: oklch(68% 0.18 30 / 0.4);
          background: var(--surface-2);
          transform: translateX(2px);
        }

        /* #1 Spotlight */
        .leaderboard-card-row.number-one-spot {
          padding: 12px 14px;
          background: oklch(14% 0.015 265);
          border-color: oklch(68% 0.18 30 / 0.5);
          box-shadow: 0 8px 24px oklch(0% 0 0 / 0.4);
        }

        .rank-tag {
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--ink-2);
          width: 20px;
          flex-shrink: 0;
        }

        .rank-tag.gold-highlight {
          color: var(--accent);
          font-size: 0.95rem;
          font-weight: 700;
        }

        .leader-thumb {
          width: 32px;
          height: 46px;
          aspect-ratio: 2 / 3;
          flex-shrink: 0;
          background: var(--bg);
          border-radius: 2px;
          overflow: hidden;
          border: 1px solid var(--border);
        }

        .leader-thumb.thumb-large {
          width: 42px;
          height: 60px;
        }

        .thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .thumb-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          color: var(--ink-2);
        }

        .leader-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .leader-title {
          font-family: var(--font-display);
          font-size: 0.95rem;
          font-weight: 400;
          color: var(--ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .leader-title.title-spotlight {
          font-size: 1.05rem;
          color: #ffffff;
        }

        .leader-sub {
          font-family: var(--font-ui);
          font-size: 0.7rem;
          color: var(--ink-2);
          display: flex;
          align-items: center;
          gap: 4px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          flex-wrap: wrap;
        }

        .sub-dot {
          color: var(--border);
        }

        .dir-tag {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }

        .leader-quote {
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-style: italic;
          color: var(--accent);
          margin-top: 3px;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .leader-score {
          font-size: 0.8125rem;
          font-weight: 600;
          flex-shrink: 0;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }

        .empty-subtext {
          font-size: 0.75rem;
          color: var(--ink-2);
        }
      `}</style>
    </div>
  );
};
