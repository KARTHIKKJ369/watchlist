import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  X,
  MagnifyingGlass,
  Plus,
  Check,
  SpinnerGap,
} from '@phosphor-icons/react';
import type { MediaSearchResult, MediaType, WatchStatus } from '../types';
import { fetchTrending, searchMedia } from '../services/tmdbApi';
import { useWatchlist } from '../context/WatchlistContext';

export const AddMediaModal: React.FC = () => {
  const {
    isAddModalOpen,
    closeAddModal,
    addModalPrefill,
    addToWatchlist,
    isInWatchlist,
    openDetailModal,
    getWatchlistItem,
  } = useWatchlist();

  const [activeTab, setActiveTab] = useState<'search' | 'manual'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaSearchResult[]>([]);
  const [trendingList, setTrendingList] = useState<MediaSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddStatus, setSelectedAddStatus] = useState<WatchStatus>('plan_to_watch');

  // Manual Form State
  const [manualTitle, setManualTitle] = useState('');
  const [manualType, setManualType] = useState<MediaType>('movie');
  const [manualYear, setManualYear] = useState(new Date().getFullYear().toString());
  const [manualGenres, setManualGenres] = useState('');
  const [manualPosterUrl, setManualPosterUrl] = useState('');
  const [manualDirector, setManualDirector] = useState('');
  const [manualRuntime, setManualRuntime] = useState('');
  const [manualOverview, setManualOverview] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualRating, setManualRating] = useState<number>(0);
  const [manualStatus, setManualStatus] = useState<WatchStatus>('plan_to_watch');

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddModalOpen) {
      fetchTrending('week').then((items: MediaSearchResult[]) => setTrendingList(items.slice(0, 8)));
      if (addModalPrefill) {
        setSearchQuery(addModalPrefill);
      }
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isAddModalOpen, addModalPrefill]);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const handler = setTimeout(() => {
      searchMedia(searchQuery)
        .then((res) => {
          setSearchResults(res);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }, 350);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAddModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeAddModal]);

  if (!isAddModalOpen) return null;

  const handleAddSearchResult = async (item: MediaSearchResult, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await addToWatchlist(
      {
        tmdbId: item.id,
        title: item.title,
        originalTitle: item.originalTitle,
        mediaType: item.mediaType,
        posterPath: item.posterPath || '',
        backdropPath: item.backdropPath || '',
        releaseYear: item.releaseYear,
        releaseDate: item.releaseDate,
        genres: item.genres || [],
        overview: item.overview,
        voteAverage: item.voteAverage,
        voteCount: item.voteCount,
      },
      selectedAddStatus
    );
  };

  const handleOpenSearchResultDetail = (item: MediaSearchResult) => {
    closeAddModal();
    const existing = getWatchlistItem(item.id, item.title);
    if (existing) {
      openDetailModal(existing);
    } else {
      const previewItem: any = {
        id: `search_preview_${item.id || Date.now()}`,
        tmdbId: item.id,
        title: item.title,
        originalTitle: item.originalTitle,
        mediaType: item.mediaType,
        releaseYear: item.releaseYear || (item.releaseDate ? item.releaseDate.split('-')[0] : ''),
        releaseDate: item.releaseDate,
        posterPath: item.posterPath || '',
        backdropPath: item.backdropPath || '',
        genres: item.genres || [],
        overview: item.overview,
        voteAverage: item.voteAverage,
        voteCount: item.voteCount,
        status: selectedAddStatus,
        addedAt: new Date().toISOString(),
        userRating: 0,
        rewatchCount: 0,
        isCustom: false,
      };
      openDetailModal(previewItem);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const genreArray = manualGenres
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);

    await addToWatchlist(
      {
        title: manualTitle.trim(),
        mediaType: manualType,
        releaseYear: manualYear.trim() || new Date().getFullYear().toString(),
        genres: genreArray.length > 0 ? genreArray : ['Custom'],
        posterPath: manualPosterUrl.trim(),
        director: manualDirector.trim(),
        runtime: manualRuntime ? parseInt(manualRuntime, 10) : undefined,
        overview: manualOverview.trim() || 'Custom entry.',
        userNotes: manualNotes.trim(),
        userRating: manualRating,
        isCustom: true,
      },
      manualStatus
    );

    setManualTitle('');
    setManualPosterUrl('');
    setManualNotes('');
    setManualDirector('');
    setManualRuntime('');
    setManualOverview('');
    setManualRating(0);
    closeAddModal();
  };

  return (
    <div className="modal-overlay" onClick={closeAddModal}>
      <motion.div
        className="modal-sheet add-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 32, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      >
        {/* Header */}
        <div className="add-modal-header">
          <div className="add-tabs-strip">
            <button
              className={`add-tab-link ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              Search
            </button>
            <span className="add-tab-sep">·</span>
            <button
              className={`add-tab-link ${activeTab === 'manual' ? 'active' : ''}`}
              onClick={() => setActiveTab('manual')}
            >
              Manual Entry
            </button>
          </div>
          <button className="btn-minimal modal-close-btn" onClick={closeAddModal} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Tab 1: Live MovieDB Search */}
        {activeTab === 'search' && (
          <div className="search-tab-content">
            {/* Search Input Line */}
            <div className="search-add-bar">
              <div className="search-input-wrap">
                <MagnifyingGlass size={16} className="search-lead-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search titles (e.g. Inception, Succession)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-text-field"
                />
                {isLoading && <SpinnerGap size={16} className="spin-icon" />}
                {searchQuery && !isLoading && (
                  <button className="clear-text-btn" onClick={() => setSearchQuery('')}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status preset */}
              <div className="status-preset-group">
                <span className="preset-label">Add as:</span>
                <select
                  value={selectedAddStatus}
                  onChange={(e) => setSelectedAddStatus(e.target.value as WatchStatus)}
                  className="preset-select"
                >
                  <option value="plan_to_watch">Queued</option>
                  <option value="watching">Watching</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Results / Trending List */}
            <div className="search-scroll-list">
              {searchQuery.trim().length >= 2 ? (
                searchResults.length > 0 ? (
                  <div className="add-results-column">
                    {searchResults.map((item) => {
                      const alreadyAdded = isInWatchlist(item.id, item.title);
                      return (
                        <div
                          key={item.id}
                          className="search-item-row"
                          onClick={() => handleOpenSearchResultDetail(item)}
                          title={`View ${item.title} details`}
                        >
                          <div className="search-item-thumb">
                            {item.posterPath ? (
                              <img src={item.posterPath} alt={item.title} />
                            ) : (
                              <span>{item.title[0]}</span>
                            )}
                          </div>
                          <div className="search-item-info">
                            <h4 className="search-item-title">{item.title}</h4>
                            <div className="search-item-meta">
                              <span>{item.releaseYear || 'TBA'}</span>
                              {Boolean(item.genres && item.genres.length > 0) && (
                                <>
                                  <span>·</span>
                                  <span>{item.genres?.slice(0, 2).join(', ')}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {item.voteAverage > 0 && (
                            <div className="rating-num">
                              {item.voteAverage}
                              <span className="rating-suffix">/10</span>
                            </div>
                          )}
                          <div className="search-item-action" onClick={(e) => e.stopPropagation()}>
                            {alreadyAdded ? (
                              <span className="added-tag">
                                <Check size={14} />
                              </span>
                            ) : (
                              <button
                                className="btn-outline btn-quick-add"
                                onClick={(e) => handleAddSearchResult(item, e)}
                                title="Add to collection"
                              >
                                <Plus size={14} />
                                <span>Add</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : isLoading ? (
                  <div className="search-loading-state">
                    <SpinnerGap size={24} className="spin-icon-large" />
                    <span className="search-status-text">Searching cinema vault...</span>
                  </div>
                ) : (
                  <div className="empty-search-state">
                    <p className="empty-search-msg">No titles found for &ldquo;{searchQuery}&rdquo;</p>
                    <button className="btn-outline btn-switch-manual" onClick={() => setActiveTab('manual')}>
                      + Add manually
                    </button>
                  </div>
                )
              ) : (
                <div className="trending-column">
                  <span className="trending-heading">Trending this week</span>
                  <div className="add-results-column">
                    {trendingList.map((item) => {
                      const alreadyAdded = isInWatchlist(item.id, item.title);
                      return (
                        <div
                          key={item.id}
                          className="search-item-row"
                          onClick={() => handleOpenSearchResultDetail(item)}
                          title={`View ${item.title} details`}
                        >
                          <div className="search-item-thumb">
                            {item.posterPath ? (
                              <img src={item.posterPath} alt={item.title} />
                            ) : (
                              <span>{item.title[0]}</span>
                            )}
                          </div>
                          <div className="search-item-info">
                            <h4 className="search-item-title">{item.title}</h4>
                            <div className="search-item-meta">
                              <span>{item.releaseYear || 'TBA'}</span>
                              {Boolean(item.genres && item.genres.length > 0) && (
                                <>
                                  <span>·</span>
                                  <span>{item.genres?.slice(0, 2).join(', ')}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {item.voteAverage > 0 && (
                            <div className="rating-num">
                              {item.voteAverage}
                              <span className="rating-suffix">/10</span>
                            </div>
                          )}
                          <div className="search-item-action" onClick={(e) => e.stopPropagation()}>
                            {alreadyAdded ? (
                              <span className="added-tag">
                                <Check size={14} />
                              </span>
                            ) : (
                              <button
                                className="btn-outline btn-quick-add"
                                onClick={(e) => handleAddSearchResult(item, e)}
                                title="Add to collection"
                              >
                                <Plus size={14} />
                                <span>Add</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Manual Entry Form */}
        {activeTab === 'manual' && (
          <form className="manual-form-content" onSubmit={handleManualSubmit}>
            <div className="form-fields-grid">
              <div className="form-row full">
                <label className="input-label">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Title"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="input-clean"
                />
              </div>

              <div className="form-row">
                <label className="input-label">Type</label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value as MediaType)}
                  className="input-clean"
                >
                  <option value="movie">Film</option>
                  <option value="tv">Series</option>
                </select>
              </div>

              <div className="form-row">
                <label className="input-label">Release Year</label>
                <input
                  type="number"
                  placeholder="2026"
                  value={manualYear}
                  onChange={(e) => setManualYear(e.target.value)}
                  className="input-clean"
                />
              </div>

              <div className="form-row">
                <label className="input-label">Genres (Comma separated)</label>
                <input
                  type="text"
                  placeholder="Sci-Fi, Drama"
                  value={manualGenres}
                  onChange={(e) => setManualGenres(e.target.value)}
                  className="input-clean"
                />
              </div>

              <div className="form-row">
                <label className="input-label">Director / Creator</label>
                <input
                  type="text"
                  placeholder="Director"
                  value={manualDirector}
                  onChange={(e) => setManualDirector(e.target.value)}
                  className="input-clean"
                />
              </div>

              <div className="form-row">
                <label className="input-label">Runtime (Minutes)</label>
                <input
                  type="number"
                  placeholder="120"
                  value={manualRuntime}
                  onChange={(e) => setManualRuntime(e.target.value)}
                  className="input-clean"
                />
              </div>

              <div className="form-row full">
                <label className="input-label">Poster Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={manualPosterUrl}
                  onChange={(e) => setManualPosterUrl(e.target.value)}
                  className="input-clean"
                />
              </div>

              <div className="form-row">
                <label className="input-label">Status</label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value as WatchStatus)}
                  className="input-clean"
                >
                  <option value="plan_to_watch">Queued</option>
                  <option value="watching">Watching</option>
                  <option value="completed">Completed</option>
                  <option value="dropped">Dropped</option>
                </select>
              </div>

              <div className="form-row">
                <label className="input-label">Rating (0-10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  placeholder="0"
                  value={manualRating || ''}
                  onChange={(e) => setManualRating(parseInt(e.target.value, 10) || 0)}
                  className="input-clean"
                />
              </div>

              <div className="form-row full">
                <label className="input-label">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Personal notes..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="input-clean"
                />
              </div>
            </div>

            <div className="manual-form-actions">
              <button type="button" className="btn-minimal" onClick={closeAddModal}>
                Cancel
              </button>
              <button type="submit" className="btn-accent">
                Save
              </button>
            </div>
          </form>
        )}
      </motion.div>

      <style>{`
        .add-modal-sheet {
          max-width: 680px;
          width: 100%;
          height: 82vh;
          max-height: 620px;
          min-height: 480px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 24px 64px oklch(0% 0 0 / 0.7);
        }

        @media (max-width: 768px) {
          .add-modal-sheet {
            height: 100vh;
            max-height: 100vh;
            width: 100vw;
            border-radius: 0;
            border: none;
          }

          .add-modal-header {
            padding-top: max(14px, calc(10px + var(--safe-top)));
          }
        }

        .add-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          background: var(--bg);
        }

        .add-tabs-strip {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .add-tab-link {
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--ink-2);
          background: transparent;
          cursor: pointer;
          transition: color 150ms ease;
        }

        .add-tab-link:hover,
        .add-tab-link.active {
          color: var(--ink);
        }

        .add-tab-sep {
          color: var(--border);
        }

        .search-tab-content {
          display: flex;
          flex-direction: column;
          flex: 1 1 auto;
          overflow: hidden;
          min-height: 0;
        }

        .search-add-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          border-bottom: 1px solid var(--border);
          background: var(--bg);
          flex-shrink: 0;
        }

        @media (max-width: 600px) {
          .search-add-bar {
            padding: 12px 16px;
            gap: 8px;
          }
        }

        .search-input-wrap {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
          min-width: 0;
        }

        .search-lead-icon {
          position: absolute;
          left: 10px;
          color: var(--ink-2);
          pointer-events: none;
        }

        .search-text-field {
          padding-left: 32px;
          padding-right: 32px;
          height: 38px;
          background: var(--surface);
          border: 1px solid var(--border);
          font-size: 0.875rem;
          border-radius: var(--radius-sm);
          width: 100%;
        }

        .search-text-field:focus {
          border-color: var(--accent);
        }

        .spin-icon {
          position: absolute;
          right: 10px;
          color: var(--accent);
          animation: spin 1s linear infinite;
        }

        .spin-icon-large {
          color: var(--accent);
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .clear-text-btn {
          position: absolute;
          right: 10px;
          color: var(--ink-2);
          cursor: pointer;
        }

        .clear-text-btn:hover {
          color: var(--ink);
        }

        .status-preset-group {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .preset-label {
          font-size: 0.75rem;
          color: var(--ink-2);
          white-space: nowrap;
        }

        .preset-select {
          height: 38px;
          font-size: 0.8125rem;
          background: var(--surface);
          border: 1px solid var(--border);
          width: auto;
          cursor: pointer;
        }

        .search-scroll-list {
          flex: 1 1 auto;
          overflow-y: auto;
          padding: 14px 20px 24px;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        @media (max-width: 768px) {
          .search-scroll-list {
            padding: 12px 16px 20px;
          }
        }

        .search-loading-state {
          padding: 48px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .search-status-text {
          font-size: 0.8125rem;
          color: var(--ink-2);
        }

        .empty-search-state {
          padding: 48px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 12px;
        }

        .empty-search-msg {
          font-size: 0.875rem;
          color: var(--ink-2);
        }

        .btn-switch-manual {
          font-size: 0.75rem;
          padding: 6px 12px;
        }

        .trending-heading {
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--ink-2);
          font-weight: 600;
          margin-bottom: 8px;
          display: block;
        }

        .add-results-column {
          display: flex;
          flex-direction: column;
        }

        .search-item-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 8px;
          border-bottom: 1px solid var(--border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background 150ms ease;
        }

        .search-item-row:hover {
          background: var(--surface);
        }

        .search-item-thumb {
          width: 36px;
          height: 54px;
          aspect-ratio: 2 / 3;
          flex-shrink: 0;
          background: var(--surface);
          border-radius: var(--radius-sm);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          color: var(--ink-2);
        }

        .search-item-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .search-item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .search-item-title {
          font-family: var(--font-display);
          font-size: 0.95rem;
          color: var(--ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .search-item-meta {
          font-size: 0.75rem;
          color: var(--ink-2);
          display: flex;
          gap: 6px;
        }

        .btn-quick-add {
          padding: 4px 10px;
          font-size: 0.75rem;
        }

        .added-tag {
          color: var(--accent);
          padding: 4px 8px;
        }

        /* Manual Form */
        .manual-form-content {
          flex: 1 1 auto;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-height: 0;
        }

        .form-fields-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        @media (max-width: 600px) {
          .form-fields-grid {
            grid-template-columns: 1fr;
          }
        }

        .form-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-row.full {
          grid-column: 1 / -1;
        }

        .input-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--ink-2);
        }

        .input-clean {
          background: var(--surface);
        }

        .manual-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: auto;
          padding-top: 8px;
        }
      `}</style>
    </div>
  );
};
