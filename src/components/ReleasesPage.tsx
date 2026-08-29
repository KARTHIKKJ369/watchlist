import React, { useState, useEffect } from 'react';
import {
  Plus,
  Check,
} from '@phosphor-icons/react';
import type { OTTReleaseItem } from '../types';
import { fetchPlatformReleases } from '../services/tmdbApi';
import { useWatchlist } from '../context/WatchlistContext';

export const ReleasesPage: React.FC = () => {
  const { addToWatchlist, isInWatchlist } = useWatchlist();

  const [selectedPlatform, setSelectedPlatform] = useState<
    'all' | 'netflix' | 'prime' | 'disney' | 'apple' | 'max' | 'theaters'
  >('all');
  const [releases, setReleases] = useState<OTTReleaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchPlatformReleases(selectedPlatform)
      .then((data) => {
        setReleases(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [selectedPlatform]);

  const platforms: {
    id: 'all' | 'netflix' | 'prime' | 'disney' | 'apple' | 'max' | 'theaters';
    label: string;
  }[] = [
    { id: 'all', label: 'All' },
    { id: 'netflix', label: 'Netflix' },
    { id: 'prime', label: 'Prime' },
    { id: 'disney', label: 'Disney+' },
    { id: 'apple', label: 'Apple TV+' },
    { id: 'max', label: 'HBO Max' },
    { id: 'theaters', label: 'Theaters' },
  ];

  const handleAddRelease = async (item: OTTReleaseItem) => {
    await addToWatchlist({
      tmdbId: item.id,
      title: item.title,
      mediaType: item.mediaType,
      posterPath: item.posterPath || '',
      backdropPath: item.backdropPath || '',
      releaseYear: item.releaseDate ? item.releaseDate.split('-')[0] : new Date().getFullYear().toString(),
      releaseDate: item.releaseDate,
      genres: item.genres || [],
      overview: item.overview,
      voteAverage: item.voteAverage,
    });
  };

  const getPlatformBadge = (platformName: string) => {
    switch (platformName.toLowerCase()) {
      case 'netflix':
        return <span className="provider-tag netflix">N</span>;
      case 'prime video':
      case 'prime':
        return <span className="provider-tag prime">Prime</span>;
      case 'disney+':
      case 'disney':
        return <span className="provider-tag disney">Disney+</span>;
      case 'apple tv+':
      case 'apple':
        return <span className="provider-tag apple"> TV+</span>;
      case 'hbo max':
      case 'max':
        return <span className="provider-tag max">MAX</span>;
      default:
        return <span className="provider-tag default">{platformName}</span>;
    }
  };

  return (
    <div className="releases-view">
      {/* Platform Tabs (Typographic with Dividers, No Pills) */}
      <div className="platform-tabs-strip">
        {platforms.map((p, idx) => (
          <React.Fragment key={p.id}>
            <button
              className={`platform-link ${selectedPlatform === p.id ? 'active' : ''}`}
              onClick={() => setSelectedPlatform(p.id)}
            >
              {p.label}
            </button>
            {idx < platforms.length - 1 && <span className="tab-divider">|</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Horizontal List of Releases */}
      {isLoading ? (
        <div className="releases-list">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="release-row-skeleton" />
          ))}
        </div>
      ) : releases.length > 0 ? (
        <div className="releases-list">
          {releases.map((item) => {
            const added = isInWatchlist(item.id, item.title);
            return (
              <div key={item.id} className="release-row">
                {/* 60x90 Thumbnail */}
                <div className="row-thumb">
                  {item.posterPath ? (
                    <img src={item.posterPath} alt={item.title} className="row-poster-img" loading="lazy" />
                  ) : (
                    <div className="row-poster-fallback">
                      <span>{item.title[0]}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="row-info">
                  <div className="row-title-line">
                    <h4 className="row-title">{item.title}</h4>
                    {item.platform && getPlatformBadge(item.platform)}
                  </div>
                  <div className="row-meta">
                    <span>{item.releaseDate ? item.releaseDate.split('-')[0] : '2026'}</span>
                    {item.genres?.length > 0 && (
                      <>
                        <span className="row-sep">·</span>
                        <span>{item.genres.slice(0, 2).join(', ')}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Rating */}
                {item.voteAverage > 0 && (
                  <div className="rating-num row-rating">
                    {item.voteAverage}
                    <span className="rating-suffix">/10</span>
                  </div>
                )}

                {/* Minimal + icon button */}
                <div className="row-action">
                  {added ? (
                    <button className="btn-release-added" disabled title="In Watchlist">
                      <Check size={18} weight="bold" />
                    </button>
                  ) : (
                    <button
                      className="btn-release-add"
                      onClick={() => handleAddRelease(item)}
                      title="Add to Watchlist"
                      aria-label="Add to Watchlist"
                    >
                      <Plus size={20} weight="regular" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state-minimal">
          <p className="empty-title">No releases available for this platform.</p>
        </div>
      )}

      <style>{`
        .releases-view {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* Plain text tabs with vertical dividers */
        .platform-tabs-strip {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .platform-link {
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--ink-2);
          padding: 4px 0;
          position: relative;
          background: transparent;
          white-space: nowrap;
        }

        .platform-link:hover {
          color: var(--ink);
        }

        .platform-link.active {
          color: var(--ink);
        }

        .platform-link.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--accent);
        }

        .tab-divider {
          color: var(--border);
          font-size: 0.75rem;
          user-select: none;
        }

        /* Horizontal List Layout */
        .releases-list {
          display: flex;
          flex-direction: column;
        }

        .release-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
          transition: background-color 150ms ease;
        }

        .release-row:hover {
          background: oklch(14% 0.012 265 / 0.5);
        }

        .row-thumb {
          width: 54px;
          height: 80px;
          aspect-ratio: 2 / 3;
          flex-shrink: 0;
          background: var(--surface);
          border-radius: var(--radius-sm);
          overflow: hidden;
          border: 1px solid var(--border);
        }

        .row-poster-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .row-poster-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          color: var(--ink-2);
        }

        .row-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .row-title-line {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .row-title {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 400;
          color: var(--ink);
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .provider-tag {
          font-family: var(--font-ui);
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 2px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--ink-2);
          letter-spacing: 0.02em;
          flex-shrink: 0;
        }

        .provider-tag.netflix {
          color: #ff334b;
          border-color: rgba(255, 51, 75, 0.25);
        }

        .provider-tag.prime {
          color: #00a8e1;
          border-color: rgba(0, 168, 225, 0.25);
        }

        .provider-tag.apple {
          color: var(--ink);
        }

        .provider-tag.max {
          color: #a855f7;
          border-color: rgba(168, 85, 247, 0.25);
        }

        .row-meta {
          font-family: var(--font-ui);
          font-size: 0.75rem;
          color: var(--ink-2);
          display: flex;
          align-items: center;
          gap: 6px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .row-sep {
          color: var(--border);
        }

        .row-rating {
          font-size: 0.8125rem;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }

        .row-action {
          flex-shrink: 0;
          padding-right: 8px;
        }

        .btn-release-add {
          color: var(--ink-2);
          padding: 8px;
          background: transparent;
          border-radius: var(--radius-sm);
        }

        .btn-release-add:hover {
          color: var(--accent);
        }

        .btn-release-added {
          color: var(--ink-2);
          opacity: 0.4;
          padding: 8px;
        }

        .release-row-skeleton {
          height: 104px;
          border-bottom: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
};
