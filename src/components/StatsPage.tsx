import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkle,
  Trophy,
  FilmStrip,
  Clock,
  Plus,
  Quotes,
  Star,
  User,
  CheckCircle,
  Eye,
  BookmarkSimple,
  XCircle,
} from '@phosphor-icons/react';
import { useWatchlist } from '../context/WatchlistContext';
import { triggerHaptic } from '../services/nativeService';

export const StatsPage: React.FC = () => {
  const { stats, watchlist, openDetailModal, openAddModal } = useWatchlist();

  const calculatePct = (count: number) => {
    if (!stats.totalCount) return 0;
    return Math.round((count / stats.totalCount) * 100);
  };

  const formatRuntime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours >= 48) {
      return `${(hours / 24).toFixed(1)} days (${hours}h ${remainingMins}m)`;
    }
    if (hours > 0) {
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins}m`;
  };

  const topRatedItems = [...watchlist]
    .filter((w) => (w.userRating && w.userRating > 0) || w.voteAverage > 0)
    .sort((a, b) => (b.userRating || b.voteAverage) - (a.userRating || a.voteAverage))
    .slice(0, 5);

  const ratedItemsList = [...watchlist].filter((w) => w.userRating && w.userRating > 0);
  const lowestRatedItem = [...ratedItemsList].sort((a, b) => a.userRating - b.userRating)[0];

  const topGenre = stats.topGenres[0]?.genre || 'Auteur Cinema';
  const avgRating = stats.averageUserRating > 0 ? stats.averageUserRating : '8.5';
  const hasFormatMix = stats.moviesCount > 0 && stats.tvCount > 0;

  // Era / Decade Distribution
  const eraStats = React.useMemo(() => {
    const counts: { [key: string]: number } = { '2020s': 0, '2010s': 0, '2000s': 0, 'Classics': 0 };
    watchlist.forEach((w) => {
      const year = parseInt(String(w.releaseYear), 10);
      if (!isNaN(year)) {
        if (year >= 2020) counts['2020s']++;
        else if (year >= 2010) counts['2010s']++;
        else if (year >= 2000) counts['2000s']++;
        else counts['Classics']++;
      }
    });
    return counts;
  }, [watchlist]);

  // Top Director in Collection
  const topDirector = React.useMemo(() => {
    const directorCounts: { [key: string]: number } = {};
    watchlist.forEach((w) => {
      if (w.director && w.director.trim()) {
        directorCounts[w.director] = (directorCounts[w.director] || 0) + 1;
      }
    });
    const sorted = Object.entries(directorCounts).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? { name: sorted[0][0], count: sorted[0][1] } : null;
  }, [watchlist]);

  // Intentional Empty State if no titles exist
  if (stats.totalCount === 0) {
    return (
      <div className="insights-empty-state">
        <div className="empty-insights-card">
          <div className="empty-insights-icon-wrap">
            <Sparkle size={32} weight="fill" />
          </div>
          <span className="empty-insights-eyebrow">CINEMA PULSE</span>
          <h2 className="empty-insights-title">Your Curation Insights Await</h2>
          <p className="empty-insights-subtext">
            Add titles to your vault and rate them to unlock your personalized Taste Profile, Genre Matrix, Era Distribution, and Leaderboard.
          </p>
          <button
            className="btn-accent empty-insights-btn"
            onClick={() => {
              triggerHaptic('selection');
              openAddModal();
            }}
          >
            <Plus size={16} weight="bold" />
            <span>Add First Titles</span>
          </button>
        </div>
      </div>
    );
  }

  // Radial / Donut calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76
  const total = stats.totalCount || 1;

  const completedPct = stats.completedCount / total;
  const watchingPct = stats.watchingCount / total;
  const queuedPct = stats.planToWatchCount / total;
  const droppedPct = stats.droppedCount / total;

  const completedOffset = 0;
  const watchingOffset = -(completedPct * circumference);
  const queuedOffset = -((completedPct + watchingPct) * circumference);
  const droppedOffset = -((completedPct + watchingPct + queuedPct) * circumference);

  const opacityScale = ['1', '0.8', '0.6', '0.45', '0.3'];

  return (
    <div className="insights-container">
      {/* 1. Pull-Quote Hero Card with Gold Highlights & Streamlined Details */}
      <motion.div
        className="editorial-pullquote-hero"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="pullquote-decor">
          <Quotes size={48} weight="fill" className="pullquote-bg-icon" />
        </div>

        <div className="pullquote-content">
          <div className="pullquote-eyebrow-row">
            <span className="pullquote-badge">
              <Sparkle size={13} weight="fill" />
              <span>Taste Profile & Curation Pulse</span>
            </span>
            {stats.totalCount < 5 && (
              <span className="pullquote-unlock-hint">
                <span className="mono-num">{stats.totalCount}/5</span> titles logged to deepen analytics
              </span>
            )}
          </div>

          <h1 className="pullquote-headline">
            &ldquo;{topGenre} & auteur cinema dominate your collection.&rdquo;
          </h1>

          <div className="pullquote-highlights-row">
            <div className="pullquote-pill">
              <Star size={14} weight="fill" className="pill-gold-icon" />
              <span><strong className="mono-num">{avgRating}</strong> /10 Avg Score</span>
            </div>
            <div className="pullquote-pill">
              <FilmStrip size={14} weight="bold" />
              <span>
                <strong className="mono-num">{stats.moviesCount}</strong> Film{stats.moviesCount === 1 ? '' : 's'}
                {stats.tvCount > 0 && (
                  <> · <strong className="mono-num">{stats.tvCount}</strong> Series</>
                )}
              </span>
            </div>
            <div className="pullquote-pill">
              <Clock size={14} weight="bold" />
              <span>
                <strong className="mono-num">{formatRuntime(stats.totalRuntimeMinutes)}</strong> logged{' '}
                <span className="pill-sub-dim">({stats.totalRuntimeMinutes}m total)</span>
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Differentiated Analytical Stat Highlights (No Redundancy) */}
      <div className="stat-cards-trio">
        {/* Card A: Completion Velocity */}
        <div className="stat-card-custom">
          <div className="stat-card-header">
            <span className="stat-card-label">COMPLETION VELOCITY</span>
            <span className="stat-card-badge-pill green mono-num">{calculatePct(stats.completedCount)}%</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-main-number mono-num">
              {stats.completedCount}
              <span className="stat-sub-unit">/ {stats.totalCount} titles done</span>
            </div>
            <div className="stat-mini-progress-track">
              <motion.div
                className="stat-mini-progress-fill green"
                initial={{ width: 0 }}
                animate={{ width: `${calculatePct(stats.completedCount)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
          <span className="stat-card-footnote">
            <span className="mono-num">{stats.watchingCount}</span> currently in active viewing
          </span>
        </div>

        {/* Card B: Format Split (Shown if mix exists, otherwise Rating Index) */}
        {hasFormatMix ? (
          <div className="stat-card-custom">
            <div className="stat-card-header">
              <span className="stat-card-label">FORMAT RATIO</span>
              <span className="stat-card-badge-pill gold mono-num">
                {calculatePct(stats.moviesCount)}% Films
              </span>
            </div>
            <div className="stat-card-body">
              <div className="stat-main-number mono-num">
                {stats.moviesCount} <span className="stat-slash">/</span> {stats.tvCount}
                <span className="stat-sub-unit">films vs series</span>
              </div>
              <div className="stat-segmented-meter">
                <div
                  className="meter-segment movie"
                  style={{ width: `${calculatePct(stats.moviesCount)}%` }}
                  title={`Movies: ${stats.moviesCount}`}
                />
                <div
                  className="meter-segment tv"
                  style={{ width: `${calculatePct(stats.tvCount)}%` }}
                  title={`Series: ${stats.tvCount}`}
                />
              </div>
            </div>
            <span className="stat-card-footnote">
              Episodic TV: <span className="mono-num">{calculatePct(stats.tvCount)}%</span> of vault
            </span>
          </div>
        ) : (
          <div className="stat-card-custom">
            <div className="stat-card-header">
              <span className="stat-card-label">CURATION BENCHMARK</span>
              <span className="stat-card-badge-pill gold mono-num">
                ★ {avgRating}
              </span>
            </div>
            <div className="stat-card-body">
              <div className="stat-main-number mono-num">
                {avgRating} <span className="stat-slash">/</span> 10
                <span className="stat-sub-unit">quality baseline</span>
              </div>
              <div className="stat-rating-indicator-track">
                <div
                  className="stat-rating-indicator-fill"
                  style={{ width: `${Math.min((Number(avgRating) / 10) * 100, 100)}%` }}
                />
              </div>
            </div>
            <span className="stat-card-footnote">
              Across <span className="mono-num">{ratedItemsList.length || stats.totalCount}</span> scored titles
            </span>
          </div>
        )}

        {/* Card C: Pipeline & Momentum */}
        <div className="stat-card-custom">
          <div className="stat-card-header">
            <span className="stat-card-label">VAULT PIPELINE</span>
            <span className="stat-card-badge-pill gold mono-num">
              {stats.planToWatchCount} Queued
            </span>
          </div>
          <div className="stat-card-body">
            <div className="stat-main-number mono-num">
              {stats.watchingCount + stats.planToWatchCount}
              <span className="stat-sub-unit">pending in watchlist</span>
            </div>
            <div className="pipeline-dots-row">
              {Array.from({ length: Math.min(stats.watchingCount, 6) }).map((_, i) => (
                <span key={`w-${i}`} className="pipeline-dot watching" title="Watching" />
              ))}
              {Array.from({ length: Math.min(stats.planToWatchCount, 10) }).map((_, i) => (
                <span key={`q-${i}`} className="pipeline-dot queued" title="Queued" />
              ))}
            </div>
          </div>
          <span className="stat-card-footnote">
            <span className="mono-num">{stats.watchingCount}</span> active · <span className="mono-num">{stats.planToWatchCount}</span> queued
          </span>
        </div>
      </div>

      {/* Main 2-Column Analytical Layout */}
      <div className="insights-view-2col">
        {/* Left Column: Radial Status + Animated Genre Matrix + Era Timeline */}
        <div className="insights-left-col">
          {/* Radial Donut Status Breakdown with Direct Segment Callouts */}
          <div className="insights-panel">
            <div className="panel-header">
              <span className="panel-label">Vault Status Breakdown</span>
              <span className="panel-sublabel mono-num">{stats.totalCount} entries</span>
            </div>

            <div className="radial-status-wrapper">
              <div className="radial-donut-box">
                <svg className="radial-donut-svg" viewBox="0 0 100 100">
                  {/* Base track */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="donut-base-track"
                    strokeWidth="11"
                  />
                  {/* Completed Slice */}
                  {completedPct > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      className="donut-slice completed"
                      strokeWidth="11"
                      strokeDasharray={`${completedPct * circumference} ${circumference}`}
                      strokeDashoffset={completedOffset}
                    />
                  )}
                  {/* Watching Slice */}
                  {watchingPct > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      className="donut-slice watching"
                      strokeWidth="11"
                      strokeDasharray={`${watchingPct * circumference} ${circumference}`}
                      strokeDashoffset={watchingOffset}
                    />
                  )}
                  {/* Queued Slice */}
                  {queuedPct > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      className="donut-slice queued"
                      strokeWidth="11"
                      strokeDasharray={`${queuedPct * circumference} ${circumference}`}
                      strokeDashoffset={queuedOffset}
                    />
                  )}
                  {/* Dropped Slice */}
                  {droppedPct > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      className="donut-slice dropped"
                      strokeWidth="11"
                      strokeDasharray={`${droppedPct * circumference} ${circumference}`}
                      strokeDashoffset={droppedOffset}
                    />
                  )}
                </svg>
                <div className="donut-center-metric">
                  <span className="donut-pct mono-num">{calculatePct(stats.completedCount)}%</span>
                  <span className="donut-caption">DONE</span>
                </div>
              </div>

              {/* Direct Segment Callout Legend (Clean, tight association) */}
              <div className="radial-legend-grid">
                <div className="legend-item">
                  <CheckCircle size={15} weight="fill" className="status-ico green" />
                  <span className="legend-name">Completed</span>
                  <span className="legend-val mono-num">
                    <strong>{stats.completedCount}</strong> <small>({calculatePct(stats.completedCount)}%)</small>
                  </span>
                </div>
                <div className="legend-item">
                  <Eye size={15} weight="fill" className="status-ico gold" />
                  <span className="legend-name">Watching</span>
                  <span className="legend-val mono-num">
                    <strong>{stats.watchingCount}</strong> <small>({calculatePct(stats.watchingCount)}%)</small>
                  </span>
                </div>
                <div className="legend-item">
                  <BookmarkSimple size={15} weight="fill" className="status-ico blue" />
                  <span className="legend-name">Queued</span>
                  <span className="legend-val mono-num">
                    <strong>{stats.planToWatchCount}</strong> <small>({calculatePct(stats.planToWatchCount)}%)</small>
                  </span>
                </div>
                {stats.droppedCount > 0 && (
                  <div className="legend-item">
                    <XCircle size={15} weight="fill" className="status-ico muted" />
                    <span className="legend-name">Dropped</span>
                    <span className="legend-val mono-num">
                      <strong>{stats.droppedCount}</strong> <small>({calculatePct(stats.droppedCount)}%)</small>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Animated Genre Distribution (Accurately Proportional) */}
          <div className="insights-panel">
            <div className="panel-header">
              <span className="panel-label">Genre Distribution</span>
              <span className="panel-sublabel">Proportional volume</span>
            </div>

            <div className="genres-list">
              {stats.topGenres.length > 0 ? (
                stats.topGenres.map((g, idx) => {
                  const maxCount = stats.topGenres[0]?.count || 1;
                  const barWidth = Math.round((g.count / maxCount) * 100);
                  const genrePct = calculatePct(g.count);
                  const opacity = opacityScale[idx] || '0.3';

                  return (
                    <div key={g.genre} className="genre-row">
                      <span className="genre-rank mono-num">#{idx + 1}</span>
                      <span className="genre-name-col" title={g.genre}>
                        {g.genre}
                      </span>
                      <div className="genre-track-col">
                        <motion.div
                          className="genre-fill-animated"
                          style={{ opacity }}
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                      <span className="genre-count-col mono-num">
                        <strong>{g.count}</strong>
                        <span className="genre-count-pct">({genrePct}%)</span>
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="empty-subtext">No genre data logged yet.</p>
              )}
            </div>
          </div>

          {/* Decade & Era Breakdown (Fills dead space intentionally) */}
          <div className="insights-panel">
            <div className="panel-header">
              <span className="panel-label">Chronological Era Split</span>
              <span className="panel-sublabel">Release decades</span>
            </div>

            <div className="era-grid">
              {Object.entries(eraStats).map(([era, count]) => (
                <div key={era} className="era-pill-card">
                  <span className="era-title mono-num">{era}</span>
                  <span className="era-count mono-num">{count}</span>
                  <span className="era-pct mono-num">{calculatePct(count)}%</span>
                </div>
              ))}
            </div>

            {topDirector && topDirector.count > 1 && (
              <div className="curator-highlight-strip">
                <User size={15} className="director-icon" />
                <span>Most collected auteur: <strong>{topDirector.name}</strong> (<span className="mono-num">{topDirector.count}</span> titles)</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Top Ranked Centerpiece Showcase */}
        <div className="insights-right-col">
          <div className="insights-panel">
            <div className="panel-header">
              <span className="panel-label">Curated Leaderboard</span>
              <span className="panel-sublabel">Highest rated in vault</span>
            </div>

            <div className="leaderboard-centerpiece">
              {topRatedItems.length > 0 ? (
                topRatedItems.map((item, idx) => {
                  const rating = item.userRating > 0 ? item.userRating : item.voteAverage;
                  const isNumberOne = idx === 0;

                  if (isNumberOne) {
                    return (
                      <motion.div
                        key={item.id}
                        className="centerpiece-spotlight-card"
                        onClick={() => {
                          triggerHaptic('selection');
                          openDetailModal(item);
                        }}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        <div className="spotlight-crown-row">
                          <span className="spotlight-badge">
                            <Trophy size={14} weight="fill" className="trophy-gold-icon" />
                            <span>#1 Vault Centerpiece</span>
                          </span>
                          <div className="spotlight-score-pill mono-num">
                            <Star size={13} weight="fill" className="star-gold" />
                            <span>{rating} <small>/10</small></span>
                          </div>
                        </div>

                        <div className="spotlight-main-layout">
                          <div className="spotlight-poster-frame">
                            {item.posterPath ? (
                              <img src={item.posterPath} alt={item.title} className="spotlight-img" loading="lazy" />
                            ) : (
                              <div className="spotlight-fallback">
                                <span>{item.title[0]}</span>
                              </div>
                            )}
                          </div>

                          <div className="spotlight-details">
                            <h3 className="spotlight-title">{item.title}</h3>
                            <div className="spotlight-meta">
                              <span className="mono-num">{item.releaseYear || 'TBA'}</span>
                              {item.genres && item.genres.length > 0 && (
                                <>
                                  <span className="sub-dot">·</span>
                                  <span>{item.genres.slice(0, 2).join(', ')}</span>
                                </>
                              )}
                              {item.director && (
                                <>
                                  <span className="sub-dot">·</span>
                                  <span className="spotlight-dir">Dir. {item.director}</span>
                                </>
                              )}
                            </div>

                            {item.userNotes ? (
                              <p className="spotlight-notes">&ldquo;{item.userNotes}&rdquo;</p>
                            ) : item.overview ? (
                              <p className="spotlight-overview">{item.overview}</p>
                            ) : null}
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  // Runners-up #2 to #5
                  return (
                    <div
                      key={item.id}
                      className="runner-up-row"
                      onClick={() => {
                        triggerHaptic('selection');
                        openDetailModal(item);
                      }}
                    >
                      <span className="runner-rank mono-num">#{idx + 1}</span>

                      <div className="runner-thumb">
                        {item.posterPath ? (
                          <img src={item.posterPath} alt={item.title} className="thumb-img" loading="lazy" />
                        ) : (
                          <div className="thumb-fallback">
                            <span>{item.title[0]}</span>
                          </div>
                        )}
                      </div>

                      <div className="runner-info">
                        <h4 className="runner-title">{item.title}</h4>
                        <div className="runner-sub">
                          <span className="mono-num">{item.releaseYear}</span>
                          {item.genres && item.genres.length > 0 && (
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
                      </div>

                      <div className="runner-score mono-num">
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

          {/* Lowest Rated Glance / Contrasting Perspective */}
          {lowestRatedItem && lowestRatedItem.id !== topRatedItems[0]?.id && (
            <div className="insights-panel contrast-panel">
              <div className="panel-header">
                <span className="panel-label">Critical Divergence</span>
                <span className="panel-sublabel">Lowest scored in vault</span>
              </div>
              <div
                className="lowest-row"
                onClick={() => {
                  triggerHaptic('selection');
                  openDetailModal(lowestRatedItem);
                }}
              >
                <div className="lowest-info">
                  <span className="lowest-title">{lowestRatedItem.title}</span>
                  <span className="lowest-meta">
                    <span className="mono-num">{lowestRatedItem.releaseYear}</span> · {lowestRatedItem.genres?.[0] || 'Film'}
                  </span>
                </div>
                <span className="lowest-score mono-num">{lowestRatedItem.userRating} /10</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .insights-container {
          display: flex;
          flex-direction: column;
          gap: 28px;
          width: 100%;
          max-width: 100%;
          padding-bottom: 40px;
          font-family: var(--font-ui);
        }

        .mono-num {
          font-family: var(--font-mono);
          font-feature-settings: 'tnum';
        }

        /* 1. Pull-Quote Hero Card */
        .editorial-pullquote-hero {
          position: relative;
          background: linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%);
          border: 1px solid var(--accent);
          border-color: rgba(212, 160, 23, 0.35);
          border-radius: var(--radius-lg);
          padding: 24px 28px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
        }

        [data-theme="light"] .editorial-pullquote-hero {
          background: linear-gradient(135deg, #ffffff 0%, var(--surface) 100%);
          border-color: rgba(184, 134, 11, 0.35);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
        }

        .pullquote-decor {
          position: absolute;
          right: 20px;
          bottom: 10px;
          pointer-events: none;
          opacity: 0.08;
          color: var(--accent);
        }

        .pullquote-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .pullquote-eyebrow-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }

        .pullquote-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px;
          background: var(--accent-dim);
          border: 1px solid rgba(212, 160, 23, 0.35);
          border-radius: 20px;
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--accent);
        }

        .pullquote-unlock-hint {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: var(--ink-2);
        }

        .pullquote-headline {
          font-family: var(--font-display);
          font-size: clamp(1.35rem, 3.5vw, 1.85rem);
          font-weight: 500;
          color: var(--ink);
          line-height: 1.25;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .pullquote-highlights-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 2px;
        }

        .pullquote-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          color: var(--ink-2);
        }

        .pullquote-pill strong {
          color: var(--ink);
          font-weight: 600;
        }

        .pill-gold-icon {
          color: var(--accent);
        }

        .pill-sub-dim {
          color: var(--ink-2);
          opacity: 0.8;
          font-size: 0.6875rem;
        }

        /* 2. Differentiated Analytical Stat Cards */
        .stat-cards-trio {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        @media (max-width: 800px) {
          .stat-cards-trio {
            grid-template-columns: 1fr;
            gap: 10px;
          }
        }

        .stat-card-custom {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 15px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stat-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .stat-card-label {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--ink-2);
        }

        .stat-card-badge-pill {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
          background: var(--surface-2);
          color: var(--ink);
          border: 1px solid var(--border);
        }

        .stat-card-badge-pill.green {
          background: rgba(111, 214, 138, 0.15);
          color: var(--status-completed);
          border-color: rgba(111, 214, 138, 0.35);
        }

        .stat-card-badge-pill.gold {
          background: var(--accent-dim);
          color: var(--accent);
          border-color: rgba(212, 160, 23, 0.35);
        }

        .stat-main-number {
          font-family: var(--font-display);
          font-size: 1.55rem;
          font-weight: 500;
          color: var(--ink);
          line-height: 1.1;
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .stat-sub-unit {
          font-family: var(--font-ui);
          font-size: 0.75rem;
          color: var(--ink-2);
          font-weight: 400;
        }

        .stat-slash {
          color: var(--border);
          font-size: 0.9em;
        }

        .stat-mini-progress-track {
          height: 4px;
          background: var(--border);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 6px;
        }

        .stat-mini-progress-fill.green {
          height: 100%;
          background: var(--status-completed);
          border-radius: 2px;
        }

        .stat-rating-indicator-track {
          height: 4px;
          background: var(--border);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 6px;
        }

        .stat-rating-indicator-fill {
          height: 100%;
          background: var(--accent);
          border-radius: 2px;
        }

        .stat-segmented-meter {
          height: 4px;
          border-radius: 2px;
          overflow: hidden;
          display: flex;
          gap: 2px;
          margin-top: 6px;
        }

        .meter-segment.movie {
          height: 100%;
          background: var(--accent);
        }

        .meter-segment.tv {
          height: 100%;
          background: var(--status-queued);
        }

        .pipeline-dots-row {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 6px;
          height: 6px;
        }

        .pipeline-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .pipeline-dot.watching {
          background: var(--accent);
        }

        .pipeline-dot.queued {
          background: var(--status-queued);
        }

        .stat-card-footnote {
          font-size: 0.6875rem;
          color: var(--ink-2);
          margin-top: auto;
        }

        /* 3. 2-Column Analytical Layout */
        .insights-view-2col {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 24px;
          width: 100%;
        }

        @media (max-width: 960px) {
          .insights-view-2col {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }

        .insights-left-col,
        .insights-right-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-width: 0;
        }

        .insights-panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
          padding-bottom: 10px;
        }

        .panel-label {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--ink);
        }

        .panel-sublabel {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: var(--ink-2);
        }

        /* Radial Donut Status Chart */
        .radial-status-wrapper {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 4px 0;
        }

        @media (max-width: 480px) {
          .radial-status-wrapper {
            flex-direction: column;
            align-items: center;
            gap: 14px;
          }
        }

        .radial-donut-box {
          position: relative;
          width: 106px;
          height: 106px;
          flex-shrink: 0;
        }

        .radial-donut-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .donut-base-track {
          fill: none;
          stroke: var(--surface-2);
        }

        .donut-slice {
          fill: none;
          stroke-linecap: round;
          transition: stroke-dasharray 400ms ease, stroke-dashoffset 400ms ease;
        }

        .donut-slice.completed {
          stroke: var(--status-completed);
        }

        .donut-slice.watching {
          stroke: var(--status-watching);
        }

        .donut-slice.queued {
          stroke: var(--status-queued);
        }

        .donut-slice.dropped {
          stroke: var(--status-dropped);
        }

        .donut-center-metric {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .donut-pct {
          font-family: var(--font-mono);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--ink);
          line-height: 1;
        }

        .donut-caption {
          font-family: var(--font-mono);
          font-size: 0.5625rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--ink-2);
          margin-top: 3px;
        }

        .radial-legend-grid {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
        }

        .status-ico {
          flex-shrink: 0;
        }

        .status-ico.green {
          color: var(--status-completed);
        }

        .status-ico.gold {
          color: var(--status-watching);
        }

        .status-ico.blue {
          color: var(--status-queued);
        }

        .status-ico.muted {
          color: var(--status-dropped);
        }

        .legend-name {
          color: var(--ink);
          font-weight: 500;
          flex: 1;
        }

        .legend-val {
          color: var(--ink-2);
        }

        .legend-val strong {
          color: var(--ink);
        }

        .legend-val small {
          font-size: 0.6875rem;
          opacity: 0.8;
        }

        /* Animated Genre Rows */
        .genres-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .genre-row {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .genre-rank {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--ink-2);
          width: 18px;
          flex-shrink: 0;
        }

        .genre-name-col {
          width: 86px;
          font-size: 0.75rem;
          color: var(--ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex-shrink: 0;
        }

        .genre-track-col {
          flex: 1;
          height: 6px;
          background: var(--surface-2);
          border-radius: 3px;
          overflow: hidden;
        }

        .genre-fill-animated {
          height: 100%;
          background: var(--accent);
          border-radius: 3px;
        }

        .genre-count-col {
          font-size: 0.75rem;
          color: var(--ink);
          width: 58px;
          text-align: right;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
        }

        .genre-count-pct {
          font-size: 0.6875rem;
          color: var(--ink-2);
        }

        /* Era Grid */
        .era-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        @media (max-width: 540px) {
          .era-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .era-pill-card {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          text-align: center;
        }

        .era-title {
          font-size: 0.6875rem;
          color: var(--ink-2);
          font-weight: 600;
        }

        .era-count {
          font-family: var(--font-mono);
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--ink);
          line-height: 1.1;
        }

        .era-pct {
          font-size: 0.625rem;
          color: var(--accent);
          font-weight: 600;
        }

        .curator-highlight-strip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--surface-2);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          color: var(--ink-2);
          margin-top: 4px;
        }

        .director-icon {
          color: var(--accent);
          flex-shrink: 0;
        }

        /* 4. Leaderboard Centerpiece & Runners-Up */
        .leaderboard-centerpiece {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
        }

        /* #1 Spotlight Centerpiece Card */
        .centerpiece-spotlight-card {
          background: linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%);
          border: 1px solid var(--accent);
          border-color: rgba(212, 160, 23, 0.45);
          border-radius: var(--radius-md);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
          transition: border-color 150ms ease, transform 150ms ease;
        }

        [data-theme="light"] .centerpiece-spotlight-card {
          background: linear-gradient(135deg, #ffffff 0%, var(--surface) 100%);
          border-color: rgba(184, 134, 11, 0.45);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
        }

        .centerpiece-spotlight-card:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
        }

        .spotlight-crown-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .spotlight-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--accent);
        }

        .trophy-gold-icon {
          color: var(--accent);
        }

        .spotlight-score-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          background: var(--accent-dim);
          border: 1px solid rgba(212, 160, 23, 0.35);
          border-radius: 12px;
          color: var(--accent);
          font-size: 0.8125rem;
          font-weight: 700;
        }

        .star-gold {
          color: var(--accent);
        }

        .spotlight-score-pill small {
          font-size: 0.6875rem;
          font-weight: 400;
          opacity: 0.8;
        }

        .spotlight-main-layout {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .spotlight-poster-frame {
          width: 58px;
          height: 87px;
          aspect-ratio: 2 / 3;
          flex-shrink: 0;
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: var(--bg);
          border: 1px solid var(--border);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .spotlight-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .spotlight-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 1.25rem;
          color: var(--ink-2);
        }

        .spotlight-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .spotlight-title {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 500;
          color: var(--ink);
          line-height: 1.25;
          margin: 0;
        }

        .spotlight-meta {
          font-size: 0.75rem;
          color: var(--ink-2);
          display: flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
        }

        .spotlight-dir {
          color: var(--ink);
          font-weight: 500;
        }

        .spotlight-notes {
          font-size: 0.78rem;
          font-style: italic;
          color: var(--accent);
          margin-top: 4px;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .spotlight-overview {
          font-size: 0.75rem;
          color: var(--ink-2);
          line-height: 1.35;
          margin-top: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Runners-Up Rows #2 to #5 */
        .runner-up-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 10px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--surface-2);
          cursor: pointer;
          transition: all 150ms ease;
        }

        .runner-up-row:hover {
          border-color: var(--ink-2);
          background: var(--bg);
          transform: translateX(2px);
        }

        .runner-rank {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--ink-2);
          width: 20px;
          flex-shrink: 0;
        }

        .runner-thumb {
          width: 32px;
          height: 48px;
          aspect-ratio: 2 / 3;
          flex-shrink: 0;
          border-radius: 2px;
          overflow: hidden;
          background: var(--bg);
          border: 1px solid var(--border);
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
          font-size: 0.875rem;
          color: var(--ink-2);
        }

        .runner-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .runner-title {
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
        }

        .runner-sub {
          font-size: 0.6875rem;
          color: var(--ink-2);
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .runner-score {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--ink);
          flex-shrink: 0;
        }

        .sub-dot {
          color: var(--border);
        }

        .dir-tag {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
        }

        /* Contrast Panel */
        .contrast-panel {
          padding: 14px 18px;
        }

        .lowest-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
        }

        .lowest-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .lowest-title {
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--ink-2);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lowest-row:hover .lowest-title {
          color: var(--ink);
        }

        .lowest-meta {
          font-size: 0.6875rem;
          color: var(--ink-2);
        }

        .lowest-score {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--ink-2);
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* Empty State */
        .insights-empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 16px;
        }

        .empty-insights-card {
          max-width: 480px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 36px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
        }

        .empty-insights-icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--accent-dim);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }

        .empty-insights-eyebrow {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--accent);
        }

        .empty-insights-title {
          font-family: var(--font-display);
          font-size: 1.45rem;
          font-weight: 500;
          color: var(--ink);
          margin: 0;
        }

        .empty-insights-subtext {
          font-size: 0.8125rem;
          color: var(--ink-2);
          line-height: 1.55;
          margin: 0 0 8px 0;
        }

        .empty-insights-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
        }

        .empty-subtext {
          font-size: 0.75rem;
          color: var(--ink-2);
        }
      `}</style>
    </div>
  );
};
