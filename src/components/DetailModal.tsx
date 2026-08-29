import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Play,
  ArrowClockwise,
  Trash,
} from '@phosphor-icons/react';
import type { WatchStatus } from '../types';
import { useWatchlist } from '../context/WatchlistContext';

export const DetailModal: React.FC = () => {
  const { selectedItem, closeDetailModal, updateWatchlistItem, removeFromWatchlist } =
    useWatchlist();

  if (!selectedItem) return null;

  const [status, setStatus] = useState<WatchStatus>(selectedItem.status);
  const [userRating, setUserRating] = useState<number>(selectedItem.userRating || 0);
  const [userNotes, setUserNotes] = useState<string>(selectedItem.userNotes || '');
  const [rewatchCount, setRewatchCount] = useState<number>(selectedItem.rewatchCount || 0);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>(selectedItem.tags || []);
  const [newTag, setNewTag] = useState('');
  const [isRatingPickerOpen, setIsRatingPickerOpen] = useState(false);
  const [backdropFailed, setBackdropFailed] = useState(false);

  useEffect(() => {
    setStatus(selectedItem.status);
    setUserRating(selectedItem.userRating || 0);
    setUserNotes(selectedItem.userNotes || '');
    setRewatchCount(selectedItem.rewatchCount || 0);
    setTags(selectedItem.tags || []);
    setIsPlayingTrailer(false);
    setIsRatingPickerOpen(false);
    setBackdropFailed(false);
  }, [selectedItem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDetailModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeDetailModal]);

  const handleStatusChange = (newStatus: WatchStatus) => {
    setStatus(newStatus);
    updateWatchlistItem(selectedItem.id, { status: newStatus });
  };

  const handleRatingSelect = (rating: number) => {
    setUserRating(rating);
    updateWatchlistItem(selectedItem.id, { userRating: rating });
    setIsRatingPickerOpen(false);
  };

  const handleSaveNotes = () => {
    updateWatchlistItem(selectedItem.id, { userNotes });
  };

  const handleIncrementRewatch = () => {
    const next = rewatchCount + 1;
    setRewatchCount(next);
    updateWatchlistItem(selectedItem.id, { rewatchCount: next });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim() && !tags.includes(newTag.trim())) {
      const updated = [...tags, newTag.trim()];
      setTags(updated);
      updateWatchlistItem(selectedItem.id, { tags: updated });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    updateWatchlistItem(selectedItem.id, { tags: updated });
  };

  const handleDelete = () => {
    if (window.confirm(`Remove "${selectedItem.title}" from your collection?`)) {
      removeFromWatchlist(selectedItem.id);
      closeDetailModal();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatCurrency = (val?: number) => {
    if (!val || val === 0) return null;
    if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `$${Math.round(val / 1_000_000)}M`;
    return `$${val.toLocaleString()}`;
  };

  const streamingText =
    selectedItem.streamingProviders && selectedItem.streamingProviders.length > 0
      ? `Available on ${selectedItem.streamingProviders.map((p) => p.name).join(' · ')}`
      : null;

  return (
    <div className="modal-overlay" onClick={closeDetailModal}>
      <motion.div
        className="modal-sheet detail-sheet"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        <button className="modal-close-trigger" onClick={closeDetailModal} aria-label="Close">
          <X size={18} />
        </button>

        <div className="detail-layout">
          {/* Left Column: Cinematic Discovery */}
          <div className="detail-col-discovery">
            {/* Backdrop Hero Area */}
            <div className="backdrop-stage">
              {selectedItem.backdropPath && !backdropFailed ? (
                <img
                  src={selectedItem.backdropPath}
                  alt={selectedItem.title}
                  className="backdrop-hero"
                  onError={() => setBackdropFailed(true)}
                />
              ) : selectedItem.posterPath ? (
                <img
                  src={selectedItem.posterPath}
                  alt={selectedItem.title}
                  className="backdrop-hero fallback"
                />
              ) : (
                <div className="backdrop-empty" />
              )}
              <div className="backdrop-vignette" />

              {/* Title & Headline overlaid on Backdrop */}
              <div className="backdrop-caption">
                <h2 className="detail-title">{selectedItem.title}</h2>
                {selectedItem.tagline && (
                  <p className="detail-tagline">&ldquo;{selectedItem.tagline}&rdquo;</p>
                )}
                <div className="detail-meta-line">
                  <span className="meta-chip">{selectedItem.releaseYear || 'TBA'}</span>
                  {selectedItem.certification && (
                    <>
                      <span>·</span>
                      <span className="meta-cert">{selectedItem.certification}</span>
                    </>
                  )}
                  {selectedItem.runtime ? (
                    <>
                      <span>·</span>
                      <span>{selectedItem.runtime} min</span>
                    </>
                  ) : selectedItem.numberOfSeasons ? (
                    <>
                      <span>·</span>
                      <span>
                        {selectedItem.numberOfSeasons} Season{selectedItem.numberOfSeasons > 1 ? 's' : ''}
                        {selectedItem.numberOfEpisodes ? ` (${selectedItem.numberOfEpisodes} eps)` : ''}
                      </span>
                    </>
                  ) : null}
                  {selectedItem.language && (
                    <>
                      <span>·</span>
                      <span>{selectedItem.language}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Trailer Embed if active */}
            {isPlayingTrailer && selectedItem.trailerKey && (
              <div className="trailer-box">
                <div className="trailer-close-bar">
                  <span>Official Trailer</span>
                  <button className="btn-minimal" onClick={() => setIsPlayingTrailer(false)}>
                    Close
                  </button>
                </div>
                <div className="trailer-iframe-ratio">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${selectedItem.trailerKey}?autoplay=1`}
                    title={`${selectedItem.title} Trailer`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Discovery Body */}
            <div className="discovery-body">
              {/* Specs Grid: TMDB Score, Budget, Revenue, Genres */}
              <div className="specs-strip">
                {selectedItem.voteAverage > 0 && (
                  <div className="spec-item">
                    <span className="spec-label">TMDB Score</span>
                    <div className="spec-val">
                      <span className="rating-num">
                        {selectedItem.voteAverage}
                        <span className="rating-suffix">/10</span>
                      </span>
                      {selectedItem.voteCount ? (
                        <span className="vote-subcount">
                          ({selectedItem.voteCount.toLocaleString()} votes)
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}

                {selectedItem.budget && (
                  <div className="spec-item">
                    <span className="spec-label">Budget</span>
                    <span className="spec-val">{formatCurrency(selectedItem.budget)}</span>
                  </div>
                )}

                {selectedItem.revenue && (
                  <div className="spec-item">
                    <span className="spec-label">Box Office</span>
                    <span className="spec-val">{formatCurrency(selectedItem.revenue)}</span>
                  </div>
                )}

                {selectedItem.genres?.length > 0 && (
                  <div className="spec-item">
                    <span className="spec-label">Genres</span>
                    <span className="spec-val">{selectedItem.genres.join(' · ')}</span>
                  </div>
                )}
              </div>

              {/* Synopsis Section */}
              <div className="synopsis-block">
                <span className="block-label">Overview</span>
                <p className="detail-synopsis">
                  {selectedItem.overview || 'No synopsis available.'}
                </p>
              </div>

              {/* Streaming Availability (Muted ink-2, secondary metadata) */}
              {streamingText && (
                <div className="detail-streaming-muted">
                  {streamingText}
                </div>
              )}

              {/* First-class Accent-Filled Trailer Button */}
              {selectedItem.trailerKey && !isPlayingTrailer && (
                <button
                  className="btn-accent-trailer"
                  onClick={() => setIsPlayingTrailer(true)}
                >
                  <Play size={15} weight="fill" />
                  <span>Watch Official Trailer</span>
                </button>
              )}

              {/* Thin Horizontal Divider */}
              <div className="section-divider" />

              {/* Filmmakers & Key Crew (Tight label gap, wide credential pair gap) */}
              {(selectedItem.director ||
                selectedItem.writers ||
                selectedItem.cinematographer ||
                selectedItem.composer ||
                selectedItem.productionCompanies?.length) && (
                <div className="crew-section">
                  <span className="block-label">Filmmakers & Crew</span>
                  <div className="crew-grid">
                    {selectedItem.director && (
                      <div className="crew-pair">
                        <span className="crew-label">DIRECTED BY</span>
                        <span className="crew-value">{selectedItem.director}</span>
                      </div>
                    )}

                    {selectedItem.writers && (
                      <div className="crew-pair">
                        <span className="crew-label">SCREENPLAY / STORY</span>
                        <span className="crew-value">{selectedItem.writers}</span>
                      </div>
                    )}

                    {selectedItem.cinematographer && (
                      <div className="crew-pair">
                        <span className="crew-label">CINEMATOGRAPHY</span>
                        <span className="crew-value">{selectedItem.cinematographer}</span>
                      </div>
                    )}

                    {selectedItem.composer && (
                      <div className="crew-pair">
                        <span className="crew-label">ORIGINAL SCORE</span>
                        <span className="crew-value">{selectedItem.composer}</span>
                      </div>
                    )}

                    {selectedItem.productionCompanies &&
                      selectedItem.productionCompanies.length > 0 && (
                        <div className="crew-pair full">
                          <span className="crew-label">PRODUCTION</span>
                          <span className="crew-value">
                            {selectedItem.productionCompanies.join(', ')}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Thin Horizontal Divider */}
              {selectedItem.cast && selectedItem.cast.length > 0 && (
                <div className="section-divider" />
              )}

              {/* Cast & Characters (Strict 2-Column Grid to Prevent Truncation) */}
              {selectedItem.cast && selectedItem.cast.length > 0 && (
                <div className="cast-section">
                  <div className="cast-header-row">
                    <span className="block-label">Cast & Characters</span>
                    <span className="cast-count-badge">
                      {selectedItem.cast.length} actor{selectedItem.cast.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="cast-grid-2col">
                    {selectedItem.cast.map((actor) => (
                      <div key={actor.id} className="cast-card-row">
                        <div className="avatar-box">
                          {actor.profilePath ? (
                            <img
                              src={actor.profilePath}
                              alt={actor.name}
                              className="avatar-photo"
                              loading="lazy"
                            />
                          ) : (
                            <span className="avatar-initials-text">{getInitials(actor.name)}</span>
                          )}
                        </div>
                        <div className="cast-text-col">
                          <span className="actor-name-text">{actor.name}</span>
                          <span className="actor-character-text">{actor.character}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Personal Log */}
          <div className="detail-col-log">
            {/* Status Section */}
            <div className="log-section">
              <span className="log-label">Your Status</span>
              <div className="status-selector-row">
                <button
                  className={`status-type watching ${status === 'watching' ? 'active-select' : ''}`}
                  onClick={() => handleStatusChange('watching')}
                >
                  Watching
                </button>
                <button
                  className={`status-type queued ${status === 'plan_to_watch' ? 'active-select' : ''}`}
                  onClick={() => handleStatusChange('plan_to_watch')}
                >
                  Queued
                </button>
                <button
                  className={`status-type completed ${status === 'completed' ? 'active-select' : ''}`}
                  onClick={() => handleStatusChange('completed')}
                >
                  Completed
                </button>
                <button
                  className={`status-type dropped ${status === 'dropped' ? 'active-select' : ''}`}
                  onClick={() => handleStatusChange('dropped')}
                >
                  Dropped
                </button>
              </div>
            </div>

            {/* Rating Section (Large 9 in DM Serif Display + /10) */}
            <div className="log-section">
              <span className="log-label">Your Rating</span>
              <div
                className="rating-display-large"
                onClick={() => setIsRatingPickerOpen(!isRatingPickerOpen)}
                title="Click to rate"
              >
                <span className="rating-value-big">{userRating > 0 ? userRating : '—'}</span>
                <span className="rating-scale-denom">/10</span>
              </div>

              {/* Number Picker Dropdown (1-10) */}
              {isRatingPickerOpen && (
                <div className="rating-picker-strip">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      className={`rating-pick-btn ${userRating === num ? 'active' : ''}`}
                      onClick={() => handleRatingSelect(num)}
                    >
                      {num}
                    </button>
                  ))}
                  <button className="rating-pick-btn clear" onClick={() => handleRatingSelect(0)}>
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Rewatch Count */}
            <div className="log-section">
              <span className="log-label">Rewatches</span>
              <div className="rewatch-inline">
                <span className="rewatch-text">
                  <ArrowClockwise size={14} />
                  <span>
                    {rewatchCount} rewatch{rewatchCount === 1 ? '' : 'es'}
                  </span>
                </span>
                <button className="btn-minimal btn-rewatch-inc" onClick={handleIncrementRewatch}>
                  + Add rewatch
                </button>
              </div>
            </div>

            {/* Tags (Surface-2 chips, no color) */}
            <div className="log-section">
              <span className="log-label">Tags</span>
              <div className="tags-container">
                {tags.map((t) => (
                  <span key={t} className="tag-surface-chip">
                    <span>{t}</span>
                    <button className="tag-remove" onClick={() => handleRemoveTag(t)}>
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="+ Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="tag-inline-input"
                />
              </div>
            </div>

            {/* Notes (Plain textarea, no border, expands) */}
            <div className="log-section">
              <span className="log-label">Notes</span>
              <textarea
                placeholder="Add private thoughts, impressions, or quotes..."
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                onBlur={handleSaveNotes}
                className="notes-plain-textarea"
                rows={4}
              />
            </div>

            {/* Remove Action */}
            <div className="log-footer">
              <button className="btn-minimal delete-link" onClick={handleDelete}>
                <Trash size={14} />
                <span>Remove from collection</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        .detail-sheet {
          max-width: 1020px;
          width: 100%;
          max-height: 90vh;
          border-radius: var(--radius-lg);
          background: var(--bg);
          border: 1px solid var(--border);
          overflow-y: auto;
          position: relative;
          box-shadow: 0 24px 64px oklch(0% 0 0 / 0.7);
        }

        .modal-close-trigger {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 30;
          color: var(--ink-2);
          padding: 8px;
          border-radius: var(--radius-sm);
          background: oklch(10% 0.01 265 / 0.6);
          backdrop-filter: blur(8px);
        }

        .modal-close-trigger:hover {
          color: var(--ink);
        }

        .detail-layout {
          display: grid;
          grid-template-columns: 62% 38%;
          min-height: 600px;
        }

        @media (max-width: 768px) {
          .detail-layout {
            grid-template-columns: 1fr;
          }
        }

        /* Left Column (Discovery) */
        .detail-col-discovery {
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
        }

        @media (max-width: 768px) {
          .detail-col-discovery {
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
        }

        .backdrop-stage {
          position: relative;
          width: 100%;
          min-height: 280px;
          background: var(--surface);
          overflow: hidden;
        }

        .backdrop-hero {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .backdrop-hero.fallback {
          filter: blur(16px);
          opacity: 0.25;
        }

        .backdrop-empty {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%);
        }

        .backdrop-vignette {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            oklch(10% 0.01 265 / 0.1) 0%,
            oklch(10% 0.01 265 / 0.75) 60%,
            var(--bg) 100%
          );
        }

        .backdrop-caption {
          position: absolute;
          bottom: 20px;
          left: 24px;
          right: 24px;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .detail-title {
          font-family: var(--font-display);
          font-size: 2.2rem;
          font-weight: 400;
          color: var(--ink);
          line-height: 1.15;
          letter-spacing: -0.02em;
        }

        .detail-tagline {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-style: italic;
          color: var(--accent);
          opacity: 0.95;
          line-height: 1.3;
        }

        .detail-meta-line {
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          color: var(--ink-2);
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .meta-cert {
          border: 1px solid var(--border);
          padding: 0 4px;
          font-size: 0.6875rem;
          font-weight: 600;
          border-radius: 2px;
          color: var(--ink);
        }

        .discovery-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Specs Strip */
        .specs-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 14px;
          padding: 12px 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
        }

        .spec-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .spec-label {
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--ink-2);
          font-weight: 600;
        }

        .spec-val {
          font-size: 0.8125rem;
          color: var(--ink);
          font-weight: 500;
        }

        .vote-subcount {
          font-size: 0.6875rem;
          color: var(--ink-2);
          margin-left: 4px;
          font-weight: 400;
        }

        .synopsis-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .detail-synopsis {
          font-family: var(--font-ui);
          font-size: 0.875rem;
          color: var(--ink);
          line-height: 1.7;
        }

        /* Muted Streaming Availability */
        .detail-streaming-muted {
          font-size: 0.8125rem;
          color: var(--ink-2);
          line-height: 1.5;
        }

        /* First-Class Accent-Filled Trailer Button */
        .btn-accent-trailer {
          align-self: flex-start;
          background: var(--accent);
          color: var(--bg);
          font-size: 0.875rem;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: filter 150ms ease;
        }

        .btn-accent-trailer:hover {
          filter: brightness(1.1);
        }

        /* Thin Section Divider */
        .section-divider {
          height: 1px;
          background: var(--border);
          margin: 4px 0;
        }

        .trailer-box {
          background: #000;
          border-bottom: 1px solid var(--border);
        }

        .trailer-close-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 16px;
          font-size: 0.75rem;
          color: var(--ink-2);
          background: var(--surface);
        }

        .trailer-iframe-ratio {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
        }

        .trailer-iframe-ratio iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        /* Crew Section (Consistent rhythm: 4px label-to-value, 24px/16px grid gap) */
        .crew-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .crew-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          column-gap: 24px;
          row-gap: 16px;
        }

        @media (max-width: 600px) {
          .crew-grid {
            grid-template-columns: 1fr;
          }
        }

        .crew-pair {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .crew-pair.full {
          grid-column: 1 / -1;
        }

        .crew-label {
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--ink-2);
          font-weight: 600;
        }

        .crew-value {
          font-size: 0.875rem;
          color: var(--ink);
          line-height: 1.35;
        }

        /* Cast Section (Strict 2-Column Grid) */
        .cast-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .cast-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .block-label {
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--ink-2);
          font-weight: 600;
        }

        .cast-count-badge {
          font-size: 0.75rem;
          color: var(--ink-2);
        }

        .cast-grid-2col {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px 18px;
        }

        @media (max-width: 600px) {
          .cast-grid-2col {
            grid-template-columns: 1fr;
          }
        }

        .cast-card-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          min-width: 0;
        }

        .avatar-box {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          background: var(--surface-2);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
          border: 1px solid var(--border);
        }

        .avatar-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-initials-text {
          font-family: var(--font-ui);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--ink);
        }

        .cast-text-col {
          display: flex;
          flex-direction: column;
          min-width: 0;
          gap: 2px;
        }

        .actor-name-text {
          font-size: 0.8125rem;
          color: var(--ink);
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .actor-character-text {
          font-size: 0.75rem;
          color: var(--ink-2);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Right Column (Personal Log) */
        .detail-col-log {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 22px;
          background: var(--bg);
        }

        .log-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .log-label {
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--ink-2);
          font-weight: 600;
        }

        .status-selector-row {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .status-selector-row button {
          cursor: pointer;
          opacity: 0.5;
        }

        .status-selector-row button.active-select {
          opacity: 1;
        }

        /* Large Rating */
        .rating-display-large {
          display: inline-flex;
          align-items: baseline;
          cursor: pointer;
          user-select: none;
        }

        .rating-value-big {
          font-family: var(--font-display);
          font-size: 3rem;
          line-height: 1;
          color: var(--accent);
        }

        .rating-scale-denom {
          font-family: var(--font-ui);
          font-size: 1rem;
          color: var(--ink-2);
          margin-left: 4px;
        }

        .rating-picker-strip {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          padding: 8px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
        }

        .rating-pick-btn {
          width: 28px;
          height: 28px;
          font-size: 0.8125rem;
          color: var(--ink-2);
          border-radius: var(--radius-sm);
        }

        .rating-pick-btn:hover,
        .rating-pick-btn.active {
          background: var(--accent);
          color: var(--bg);
          font-weight: 600;
        }

        .rating-pick-btn.clear {
          width: auto;
          padding: 0 8px;
        }

        /* Rewatch */
        .rewatch-inline {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .rewatch-text {
          font-size: 0.8125rem;
          color: var(--ink-2);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-rewatch-inc {
          font-size: 0.75rem;
          color: var(--accent);
        }

        /* Tags */
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }

        .tag-surface-chip {
          background: var(--surface-2);
          color: var(--ink);
          font-size: 0.75rem;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .tag-remove {
          color: var(--ink-2);
          font-size: 0.875rem;
        }

        .tag-remove:hover {
          color: var(--ink);
        }

        .tag-inline-input {
          width: 100px;
          height: 26px;
          font-size: 0.75rem;
          padding: 2px 6px;
          border: 1px dashed var(--border);
          background: transparent;
        }

        /* Notes Textarea */
        .notes-plain-textarea {
          background: transparent;
          border: 1px solid transparent;
          border-bottom: 1px solid var(--border);
          border-radius: 0;
          padding: 4px 0;
          font-size: 0.8125rem;
          line-height: 1.6;
          color: var(--ink);
          resize: vertical;
        }

        .notes-plain-textarea:focus {
          border-bottom-color: var(--accent);
        }

        .log-footer {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .delete-link {
          color: var(--ink-2);
          font-size: 0.75rem;
        }

        .delete-link:hover {
          color: oklch(65% 0.2 25);
        }
      `}</style>
    </div>
  );
};
