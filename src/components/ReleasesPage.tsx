import React, { useState, useEffect } from 'react';
import {
  Plus,
  Check,
  GlobeHemisphereWest,
  FilmSlate,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import type { OTTReleaseItem, WatchlistItem } from '../types';
import { fetchPlatformReleases } from '../services/tmdbApi';
import { useWatchlist } from '../context/WatchlistContext';
import { triggerHaptic } from '../services/nativeService';

export const ReleasesPage: React.FC = () => {
  const { addToWatchlist, isInWatchlist, openDetailModal, getWatchlistItem, region, openSettingsModal } =
    useWatchlist();

  const [selectedPlatform, setSelectedPlatform] = useState<
    'all' | 'netflix' | 'prime' | 'disney' | 'apple' | 'max' | 'theaters'
  >('all');
  const [releases, setReleases] = useState<OTTReleaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadReleases = (platform = selectedPlatform) => {
    setIsLoading(true);
    setHasError(false);
    fetchPlatformReleases(platform)
      .then((data) => {
        setReleases(data);
        setHasError(data.length === 0);
        setIsLoading(false);
      })
      .catch(() => {
        setHasError(true);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadReleases(selectedPlatform);
  }, [selectedPlatform, region]);

  const platforms: {
    id: 'all' | 'netflix' | 'prime' | 'disney' | 'apple' | 'max' | 'theaters';
    label: string;
  }[] = [
    { id: 'all', label: 'ALL' },
    { id: 'netflix', label: 'NETFLIX' },
    { id: 'prime', label: 'PRIME' },
    { id: 'disney', label: 'DISNEY+' },
    { id: 'apple', label: 'APPLE TV+' },
    { id: 'max', label: 'MAX' },
    { id: 'theaters', label: 'THEATERS' },
  ];

  const handleAddRelease = async (item: OTTReleaseItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic('success');
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

  const handleOpenReleaseDetails = (item: OTTReleaseItem) => {
    triggerHaptic('selection');
    const existing = getWatchlistItem(item.id, item.title);
    if (existing) {
      openDetailModal(existing);
      return;
    }

    const previewItem: WatchlistItem = {
      id: `tmdb-${item.id}`,
      tmdbId: item.id,
      title: item.title,
      originalTitle: item.title,
      mediaType: item.mediaType || 'movie',
      posterPath: item.posterPath || '',
      backdropPath: item.backdropPath || '',
      releaseYear: item.releaseDate ? item.releaseDate.split('-')[0] : '2026',
      releaseDate: item.releaseDate,
      genres: item.genres || [],
      overview: item.overview || 'No synopsis available.',
      voteAverage: item.voteAverage || 0,
      status: 'plan_to_watch',
      userRating: 0,
      userNotes: '',
      rewatchCount: 0,
      tags: [],
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      streamingProviders: item.platform ? [{ id: 0, name: item.platform, type: 'stream', logoPath: '' }] : [],
    };

    openDetailModal(previewItem);
  };

  return (
    <div className="releases-view-nothing">
      {/* Nothing Technical Header */}
      <div className="releases-header-bar-nothing">
        <div className="releases-top-meta-nothing">
          <div className="releases-title-badge">
            <span className="live-rec-dot" />
            <span className="releases-title-text">OTT RELEASES // {region}</span>
          </div>
          <button
            className="region-btn-nothing"
            onClick={() => {
              triggerHaptic('light');
              openSettingsModal();
            }}
            title="Change Streaming Region"
          >
            <GlobeHemisphereWest size={13} weight="bold" />
            <span>REGION: {region}</span>
          </button>
        </div>

        {/* Platform Matrix Segmented Control */}
        <div className="platform-matrix-nothing">
          {platforms.map((p) => {
            const isActive = selectedPlatform === p.id;
            return (
              <button
                key={p.id}
                className={`platform-btn-nothing ${isActive ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedPlatform(p.id);
                }}
              >
                {isActive && <span className="tab-active-dot" />}
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Release Cards in Technical List Layout */}
      {isLoading ? (
        <div className="releases-list-nothing">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="release-skeleton-nothing">
              <span className="skeleton-label">[LOADING RELEASES...]</span>
            </div>
          ))}
        </div>
      ) : releases.length > 0 ? (
        <div className="releases-list-nothing">
          {releases.map((item) => {
            const added = isInWatchlist(item.id, item.title);
            return (
              <div
                key={item.id}
                className="release-card-nothing"
                onClick={() => handleOpenReleaseDetails(item)}
              >
                {/* 2:3 Thumbnail */}
                <div className="card-thumb-nothing">
                  {item.posterPath ? (
                    <img
                      src={item.posterPath}
                      alt={item.title}
                      className="card-poster-img-nothing"
                      loading="lazy"
                    />
                  ) : (
                    <div className="card-poster-fallback-nothing">
                      <FilmSlate size={18} color="var(--ink-3)" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="card-info-nothing">
                  <div className="card-title-row-nothing">
                    <h4 className="card-title-nothing" title={item.title}>
                      {item.title}
                    </h4>
                    {item.platform && (
                      <span className="provider-tag-nothing">
                        {item.platform.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="card-meta-nothing">
                    <span className="meta-year-span">
                      {item.releaseDate ? item.releaseDate.split('-')[0] : '2026'}
                    </span>
                    {item.genres?.length > 0 && (
                      <>
                        <span className="meta-sep">//</span>
                        <span className="meta-genres-span" title={item.genres.join(', ')}>
                          {item.genres.slice(0, 2).map((g) => g.trim()).join(' · ').toUpperCase()}
                        </span>
                      </>
                    )}
                  </div>

                  {item.overview && (
                    <p className="card-overview-nothing">{item.overview}</p>
                  )}
                </div>

                {/* Right Group: Score + Action Button */}
                <div className="card-right-group-nothing">
                  {item.voteAverage > 0 && (
                    <div className="card-score-nothing">
                      <span className="score-val">{item.voteAverage}</span>
                      <span className="score-denom">/10</span>
                    </div>
                  )}

                  <div className="card-action-nothing" onClick={(e) => e.stopPropagation()}>
                    {added ? (
                      <button className="btn-add-tech is-added" disabled title="Already in Vault">
                        <Check size={13} weight="bold" />
                        <span>IN VAULT</span>
                      </button>
                    ) : (
                      <button
                        className="btn-add-tech"
                        onClick={(e) => handleAddRelease(item, e)}
                        title="Add to Vault"
                        aria-label="Add to Vault"
                      >
                        <Plus size={13} weight="bold" />
                        <span>ADD</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state-nothing">
          <p className="empty-title-nothing">// {hasError ? 'UNABLE TO LOAD RELEASES' : 'NO RELEASES FOUND'}</p>
          <p className="empty-desc-nothing">
            {hasError
              ? 'TMDB SERVER / NETWORK CONNECTION TIMED OUT. TAP BELOW TO RETRY.'
              : 'TRY SELECTING A DIFFERENT PLATFORM OR REGION.'}
          </p>
          {hasError && (
            <button
              className="btn-retry-nothing"
              onClick={() => {
                triggerHaptic('light');
                loadReleases(selectedPlatform);
              }}
            >
              <ArrowsClockwise size={13} weight="bold" />
              <span>RETRY</span>
            </button>
          )}
        </div>
      )}

      <style>{`
        .releases-view-nothing {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 32px;
        }

        .releases-header-bar-nothing {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .releases-top-meta-nothing {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .releases-title-badge {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .live-rec-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--accent);
          box-shadow: 0 0 6px var(--accent);
        }

        .releases-title-text {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--ink);
        }

        .region-btn-nothing {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--ink-2);
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: all 100ms ease;
        }

        .region-btn-nothing:hover {
          color: var(--ink);
          border-color: var(--ink-2);
        }

        /* Platform Matrix */
        .platform-matrix-nothing {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 3px;
        }

        .platform-btn-nothing {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: var(--ink-2);
          padding: 6px 12px;
          border-radius: 2px;
          background: transparent;
          white-space: nowrap;
          transition: all 100ms ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex: 1 1 auto;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .platform-btn-nothing {
            padding: 6px 4px;
            font-size: 0.625rem;
            flex: 1 1 calc(25% - 4px);
          }
        }

        .platform-btn-nothing:hover {
          color: var(--ink);
          background: var(--surface-2);
        }

        .platform-btn-nothing.is-active {
          color: var(--bg);
          background: var(--ink);
        }

        .tab-active-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background-color: var(--accent);
        }

        /* Release Cards */
        .releases-list-nothing {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .release-card-nothing {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 12px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: border-color 120ms ease;
        }

        .release-card-nothing:hover {
          border-color: var(--ink-2);
        }

        .card-thumb-nothing {
          width: 46px;
          height: 68px;
          aspect-ratio: 2 / 3;
          flex-shrink: 0;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 2px;
          overflow: hidden;
        }

        .card-poster-img-nothing {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .card-poster-fallback-nothing {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-info-nothing {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .card-title-row-nothing {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .card-title-nothing {
          font-family: var(--font-ui);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--ink);
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .provider-tag-nothing {
          font-family: var(--font-mono);
          font-size: 0.5625rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          padding: 1px 4px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 2px;
          color: var(--ink-2);
          flex-shrink: 0;
        }

        .card-meta-nothing {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: var(--ink-2);
          display: flex;
          align-items: center;
          gap: 5px;
          letter-spacing: 0.04em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }

        .meta-year-span {
          flex-shrink: 0;
        }

        .meta-genres-span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }

        .card-overview-nothing {
          font-size: 0.75rem;
          color: var(--ink-3);
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-right-group-nothing {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        @media (max-width: 600px) {
          .card-right-group-nothing {
            flex-direction: column;
            align-items: flex-end;
            justify-content: center;
            gap: 5px;
          }
        }

        .card-score-nothing {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--ink);
          white-space: nowrap;
          padding: 2px 6px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 2px;
          flex-shrink: 0;
        }

        .card-score-nothing .score-denom {
          color: var(--ink-3);
          font-size: 0.625rem;
          font-weight: 400;
        }

        .card-action-nothing {
          flex-shrink: 0;
        }

        .btn-add-tech {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          padding: 5px 9px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--ink);
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 100ms ease;
          white-space: nowrap;
        }

        .btn-add-tech:hover {
          background: var(--ink);
          color: var(--bg);
          border-color: var(--ink);
        }

        .btn-add-tech.is-added {
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.3);
          color: #22c55e;
        }

        /* Empty & Skeleton */
        .release-skeleton-nothing {
          height: 68px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .skeleton-label {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: var(--ink-3);
          letter-spacing: 0.08em;
        }

        .empty-state-nothing {
          padding: 48px 24px;
          text-align: center;
          border: 1px dashed var(--border);
          border-radius: var(--radius-sm);
        }

        .empty-title-nothing {
          font-family: var(--font-mono);
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 4px;
        }

        .empty-desc-nothing {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: var(--ink-3);
          letter-spacing: 0.06em;
          margin-bottom: 12px;
        }

        .btn-retry-nothing {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--ink);
          cursor: pointer;
          transition: all 0.15s ease;
          margin-top: 4px;
        }

        .btn-retry-nothing:hover {
          background: var(--ink);
          color: var(--bg);
          border-color: var(--ink);
        }
      `}</style>
    </div>
  );
};
