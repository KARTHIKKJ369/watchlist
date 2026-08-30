import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Play,
  ArrowClockwise,
  Trash,
  Plus,
  PencilSimple,
  Image as ImageIcon,
} from '@phosphor-icons/react';
import type { WatchStatus } from '../types';
import { useWatchlist } from '../context/WatchlistContext';
import { triggerHaptic } from '../services/nativeService';

export const DetailModal: React.FC = () => {
  const {
    selectedItem,
    closeDetailModal,
    updateWatchlistItem,
    removeFromWatchlist,
    addToWatchlist,
    isInWatchlist,
    showToast,
  } = useWatchlist();

  const [status, setStatus] = useState<WatchStatus>(selectedItem?.status || 'plan_to_watch');
  const [userRating, setUserRating] = useState<number>(selectedItem?.userRating || 0);
  const [userNotes, setUserNotes] = useState<string>(selectedItem?.userNotes || '');
  const [rewatchCount, setRewatchCount] = useState<number>(selectedItem?.rewatchCount || 0);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>(selectedItem?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [isRatingPickerOpen, setIsRatingPickerOpen] = useState(false);
  const [backdropFailed, setBackdropFailed] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [showAllCast, setShowAllCast] = useState(false);
  const [isEditingArtwork, setIsEditingArtwork] = useState(false);
  const [customPosterInput, setCustomPosterInput] = useState(selectedItem?.posterPath || '');
  const [customBackdropInput, setCustomBackdropInput] = useState(selectedItem?.backdropPath || '');

  useEffect(() => {
    if (!selectedItem) return;
    setStatus(selectedItem.status);
    setUserRating(selectedItem.userRating || 0);
    setUserNotes(selectedItem.userNotes || '');
    setRewatchCount(selectedItem.rewatchCount || 0);
    setTags(selectedItem.tags || []);
    setIsPlayingTrailer(false);
    setIsRatingPickerOpen(false);
    setBackdropFailed(false);
    setIsConfirmingDelete(false);
    setShowAllCast(false);
    setIsEditingArtwork(false);
    setCustomPosterInput(selectedItem.posterPath || '');
    setCustomBackdropInput(selectedItem.backdropPath || '');
  }, [selectedItem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDetailModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeDetailModal]);

  if (!selectedItem) return null;

  const handleStatusChange = (newStatus: WatchStatus) => {
    setStatus(newStatus);
    if (newStatus === 'completed') {
      triggerHaptic('success');
    } else {
      triggerHaptic('selection');
    }
    updateWatchlistItem(selectedItem.id, { status: newStatus });
  };

  const handleRatingSelect = (rating: number) => {
    triggerHaptic('selection');
    setUserRating(rating);
    updateWatchlistItem(selectedItem.id, { userRating: rating });
    setIsRatingPickerOpen(false);
  };

  const handleSaveNotes = () => {
    updateWatchlistItem(selectedItem.id, { userNotes });
  };

  const handleIncrementRewatch = () => {
    triggerHaptic('light');
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

  const handleConfirmDelete = () => {
    triggerHaptic('warning');
    removeFromWatchlist(selectedItem.id);
    closeDetailModal();
  };

  const isAlreadyInCollection = isInWatchlist(selectedItem.tmdbId, selectedItem.title);

  const handleAddToCollection = async () => {
    await addToWatchlist(
      {
        tmdbId: selectedItem.tmdbId,
        title: selectedItem.title,
        originalTitle: selectedItem.originalTitle,
        mediaType: selectedItem.mediaType,
        posterPath: selectedItem.posterPath,
        backdropPath: selectedItem.backdropPath,
        releaseYear: selectedItem.releaseYear,
        releaseDate: selectedItem.releaseDate,
        genres: selectedItem.genres,
        overview: selectedItem.overview,
        voteAverage: selectedItem.voteAverage,
        director: selectedItem.director,
        writers: selectedItem.writers,
        cinematographer: selectedItem.cinematographer,
        composer: selectedItem.composer,
        productionCompanies: selectedItem.productionCompanies,
        certification: selectedItem.certification,
        tagline: selectedItem.tagline,
        budget: selectedItem.budget,
        revenue: selectedItem.revenue,
        language: selectedItem.language,
        runtime: selectedItem.runtime,
        numberOfSeasons: selectedItem.numberOfSeasons,
        numberOfEpisodes: selectedItem.numberOfEpisodes,
        cast: selectedItem.cast,
        streamingProviders: selectedItem.streamingProviders,
        trailerKey: selectedItem.trailerKey,
      },
      status
    );
  };

  const handleSaveArtwork = async () => {
    const newPoster = customPosterInput.trim();
    const newBackdrop = customBackdropInput.trim();

    if (!isAlreadyInCollection) {
      await addToWatchlist(
        {
          ...selectedItem,
          posterPath: newPoster,
          backdropPath: newBackdrop,
        },
        status
      );
    } else {
      updateWatchlistItem(selectedItem.id, {
        posterPath: newPoster,
        backdropPath: newBackdrop,
      });
    }

    setIsEditingArtwork(false);
    setBackdropFailed(false);
    showToast('Artwork updated successfully', 'success');
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
        initial={{ opacity: 0, y: 32, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
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
                <div className="backdrop-empty-slate">
                  <span className="empty-slate-title">{selectedItem.title}</span>
                  <button
                    className="btn-add-artwork-cta"
                    onClick={() => setIsEditingArtwork(true)}
                  >
                    <Plus size={14} />
                    <span>Add Custom Poster / Artwork</span>
                  </button>
                </div>
              )}
              <div className="backdrop-vignette" />

              {/* Edit Artwork Quick Trigger */}
              <button
                className="btn-backdrop-edit-artwork"
                onClick={() => setIsEditingArtwork(!isEditingArtwork)}
                title="Edit poster or backdrop image URL"
              >
                <PencilSimple size={12} weight="bold" />
                <span>
                  {selectedItem.posterPath || selectedItem.backdropPath ? 'Edit Artwork' : 'Set Artwork'}
                </span>
              </button>

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

            {/* Custom Artwork Editor Card if active */}
            {isEditingArtwork && (
              <div className="artwork-editor-card">
                <div className="artwork-editor-header">
                  <div className="artwork-editor-title-group">
                    <ImageIcon size={16} color="var(--accent)" />
                    <span className="artwork-editor-title">Custom Poster & Backdrop Artwork</span>
                  </div>
                  <button className="btn-minimal" onClick={() => setIsEditingArtwork(false)}>
                    <X size={14} />
                  </button>
                </div>
                <p className="artwork-editor-desc">
                  Paste any direct image URL (JPEG, PNG, WebP) to update or add missing artwork for this movie.
                </p>
                <div className="artwork-inputs-stack">
                  <div className="artwork-input-group">
                    <label className="artwork-input-label">Poster URL (2:3 aspect ratio)</label>
                    <input
                      type="url"
                      placeholder="https://example.com/poster.jpg"
                      value={customPosterInput}
                      onChange={(e) => setCustomPosterInput(e.target.value)}
                      className="artwork-text-input"
                    />
                  </div>
                  <div className="artwork-input-group">
                    <label className="artwork-input-label">Backdrop / Landscape URL (16:9 aspect ratio)</label>
                    <input
                      type="url"
                      placeholder="https://example.com/backdrop.jpg"
                      value={customBackdropInput}
                      onChange={(e) => setCustomBackdropInput(e.target.value)}
                      className="artwork-text-input"
                    />
                  </div>
                </div>
                <div className="artwork-editor-actions">
                  <button className="btn-primary-artwork-save" onClick={handleSaveArtwork}>
                    Save Artwork
                  </button>
                  <button className="btn-minimal" onClick={() => setIsEditingArtwork(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

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

              {/* Streaming Availability */}
              {streamingText && (
                <div className="detail-streaming-muted">
                  {streamingText}
                </div>
              )}

              {/* Accent-Filled Trailer Button */}
              {selectedItem.trailerKey && !isPlayingTrailer && (
                <button
                  className="btn-accent-trailer"
                  onClick={() => setIsPlayingTrailer(true)}
                >
                  <Play size={15} weight="fill" />
                  <span>Watch Official Trailer</span>
                </button>
              )}

              {/* Section Divider */}
              <div className="section-divider" />

              {/* Filmmakers & Key Crew */}
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

              {/* Section Divider */}
              {selectedItem.cast && selectedItem.cast.length > 0 && (
                <div className="section-divider" />
              )}

              {/* Cast & Characters (Strict 2-Column Grid) */}
              {selectedItem.cast && selectedItem.cast.length > 0 && (
                <div className="cast-section">
                  <div className="cast-header-row">
                    <span className="block-label">Cast & Characters</span>
                    <span className="cast-count-badge">
                      {selectedItem.cast.length} actor{selectedItem.cast.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="cast-grid-2col">
                    {(showAllCast ? selectedItem.cast : selectedItem.cast.slice(0, 8)).map((actor) => (
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
                  {selectedItem.cast.length > 8 && (
                    <button
                      className="btn-minimal btn-toggle-cast"
                      onClick={() => setShowAllCast(!showAllCast)}
                    >
                      {showAllCast ? 'Show fewer actors' : `+ View all ${selectedItem.cast.length} actors`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Personal Log */}
          <div className="detail-col-log">
            {/* Prominent Top Action: Add to Collection OR In-Vault Indicator */}
            {!isAlreadyInCollection ? (
              <div className="hero-add-collection-block">
                <button className="btn-hero-add-collection" onClick={handleAddToCollection}>
                  <Plus size={18} weight="bold" />
                  <span>Add to Collection</span>
                </button>
              </div>
            ) : (
              <div className="in-vault-banner">
                <span className="vault-indicator-dot">●</span>
                <span className="vault-indicator-text">In Your Collection</span>
              </div>
            )}

            {/* Status Section */}
            <div className="log-section">
              <span className="log-label">Your Status</span>
              <div className="status-selector-row">
                <button
                  className={`status-btn ${status === 'watching' ? 'active-select' : ''}`}
                  onClick={() => handleStatusChange('watching')}
                >
                  Watching
                </button>
                <button
                  className={`status-btn ${status === 'plan_to_watch' ? 'active-select' : ''}`}
                  onClick={() => handleStatusChange('plan_to_watch')}
                >
                  Queued
                </button>
                <button
                  className={`status-btn ${status === 'completed' ? 'active-select' : ''}`}
                  onClick={() => handleStatusChange('completed')}
                >
                  Completed
                </button>
                <button
                  className={`status-btn ${status === 'dropped' ? 'active-select' : ''}`}
                  onClick={() => handleStatusChange('dropped')}
                >
                  Dropped
                </button>
              </div>
            </div>

            {/* Rating Section */}
            <div className="log-section">
              <span className="log-label">Your Rating</span>
              <div
                className="rating-display-large"
                onClick={() => {
                  triggerHaptic('selection');
                  setIsRatingPickerOpen(!isRatingPickerOpen);
                }}
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

            {/* Tags */}
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

            {/* Notes */}
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

            {/* Actions: In-Place Minimalist Remove Button (Zero Scroll, In-Place Confirmation) */}
            {isAlreadyInCollection && (
              <div className="log-footer">
                {isConfirmingDelete ? (
                  <div className="delete-confirm-inline-bar">
                    <button
                      className="btn-delete-cancel"
                      onClick={() => {
                        triggerHaptic('light');
                        setIsConfirmingDelete(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-delete-execute"
                      onClick={handleConfirmDelete}
                    >
                      <Trash size={14} weight="fill" />
                      <span>Confirm Remove</span>
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn-remove-vault"
                    onClick={() => {
                      triggerHaptic('warning');
                      setIsConfirmingDelete(true);
                    }}
                  >
                    <Trash size={14} weight="regular" />
                    <span>Remove from Vault</span>
                  </button>
                )}
              </div>
            )}
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
          color: var(--ink);
          padding: 8px;
          border-radius: var(--radius-sm);
          background: var(--surface);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 150ms ease;
          box-shadow: 0 2px 8px oklch(0% 0 0 / 0.1);
        }

        .modal-close-trigger:hover {
          color: var(--accent);
          border-color: var(--accent);
          background: var(--surface-2);
        }

        @media (max-width: 768px) {
          .detail-sheet {
            height: 100vh;
            max-height: 100vh;
            width: 100vw;
            border-radius: 0;
            border: none;
          }

          .modal-close-trigger {
            top: max(20px, calc(14px + var(--safe-top)));
            right: 14px;
            background: rgba(0, 0, 0, 0.7);
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(8px);
          }

          .btn-backdrop-edit-artwork {
            top: max(20px, calc(14px + var(--safe-top)));
            left: 14px;
          }
        }

        .detail-layout {
          display: grid;
          grid-template-columns: 60% 40%;
          min-height: 500px;
          align-items: start;
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

        .btn-backdrop-edit-artwork {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 10;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: var(--radius-sm);
          color: #ffffff;
          font-family: var(--font-ui);
          font-size: 0.6875rem;
          font-weight: 500;
          padding: 5px 10px;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .btn-backdrop-edit-artwork:hover {
          color: var(--accent);
          border-color: var(--accent);
          background: rgba(0, 0, 0, 0.9);
        }

        .backdrop-empty-slate {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%);
          padding: 24px;
          text-align: center;
        }

        .empty-slate-title {
          font-family: var(--font-display);
          font-size: 1.4rem;
          color: var(--ink-2);
          opacity: 0.5;
        }

        .btn-add-artwork-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--surface-2);
          border: 1px dashed var(--accent);
          color: var(--accent);
          font-size: 0.75rem;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background 150ms ease;
        }

        .btn-add-artwork-cta:hover {
          background: oklch(68% 0.18 30 / 0.15);
        }

        /* Artwork Editor Card */
        .artwork-editor-card {
          margin: 16px 24px 0 24px;
          padding: 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 8px 24px oklch(0% 0 0 / 0.3);
        }

        .artwork-editor-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .artwork-editor-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .artwork-editor-title {
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--ink);
        }

        .artwork-editor-desc {
          font-size: 0.75rem;
          color: var(--ink-2);
          line-height: 1.4;
        }

        .artwork-inputs-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .artwork-input-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .artwork-input-label {
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--ink-2);
          font-weight: 600;
        }

        .artwork-text-input {
          font-size: 0.8125rem;
          height: 34px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 0 10px;
          color: var(--ink);
        }

        .artwork-text-input:focus {
          border-color: var(--accent);
        }

        .artwork-editor-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
        }

        .btn-primary-artwork-save {
          background: var(--accent);
          color: var(--bg);
          font-size: 0.75rem;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: filter 150ms ease;
        }

        .btn-primary-artwork-save:hover {
          filter: brightness(1.1);
        }

        .backdrop-vignette {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.12) 0%,
            rgba(0, 0, 0, 0.45) 45%,
            rgba(11, 12, 16, 0.88) 78%,
            var(--surface) 100%
          );
        }

        .backdrop-caption {
          position: absolute;
          bottom: 16px;
          left: 20px;
          right: 20px;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .detail-title {
          font-family: var(--font-display);
          font-size: clamp(1.25rem, 4vw, 1.85rem);
          font-weight: 500;
          color: #ffffff;
          line-height: 1.2;
          letter-spacing: -0.01em;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.85);
          margin: 0;
        }

        .detail-tagline {
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-style: italic;
          color: var(--accent);
          line-height: 1.3;
          text-shadow: 0 1px 8px rgba(0, 0, 0, 0.7);
        }

        .detail-meta-line {
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.85);
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
        }

        .meta-chip {
          color: #ffffff;
          font-weight: 600;
        }

        .meta-cert {
          border: 1px solid rgba(255, 255, 255, 0.4);
          padding: 1px 6px;
          font-size: 0.6875rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
          color: #ffffff;
          background: rgba(0, 0, 0, 0.35);
        }

        .discovery-body {
          padding: 20px 24px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .discovery-body {
            padding: 16px;
          }
        }

        /* Specs Strip with Consistent Rounded Language */
        .specs-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: 12px;
          padding: 12px 16px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
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

        .detail-streaming-muted {
          font-size: 0.8125rem;
          color: var(--ink-2);
          line-height: 1.5;
        }

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

        /* Crew Section */
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

        /* Cast Section */
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

        .btn-toggle-cast {
          align-self: flex-start;
          font-size: 0.75rem;
          color: var(--accent);
          margin-top: 4px;
          padding: 4px 0;
          cursor: pointer;
        }

        .btn-toggle-cast:hover {
          text-decoration: underline;
        }

        /* Right Column (Personal Log - Sticky with clearance for modal close button) */
        .detail-col-log {
          padding: 58px 24px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: var(--bg);
          position: sticky;
          top: 0;
          height: fit-content;
          max-height: 90vh;
          overflow-y: auto;
        }

        @media (max-width: 768px) {
          .detail-col-log {
            padding: 24px;
          }
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
          gap: 8px;
          flex-wrap: wrap;
        }

        .status-btn {
          font-family: var(--font-ui);
          font-size: 0.6875rem;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--ink-2);
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 5px 10px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 150ms ease;
        }

        .status-btn:hover {
          color: var(--ink);
          border-color: var(--ink-2);
        }

        .status-btn.active-select {
          color: var(--accent);
          background: var(--surface-2);
          border-color: var(--accent);
          font-weight: 700;
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

        .hero-add-collection-block {
          padding-bottom: 4px;
        }

        .btn-hero-add-collection {
          background: var(--accent);
          color: #ffffff;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 10px 18px;
          border-radius: var(--radius-sm);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          justify-content: center;
          transition: filter 150ms ease, transform 150ms ease;
          box-shadow: 0 4px 16px oklch(56% 0.2 30 / 0.25);
        }

        .btn-hero-add-collection:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .in-vault-banner {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          align-self: flex-start;
        }

        .vault-indicator-dot {
          color: var(--accent);
          font-size: 0.6875rem;
        }

        .vault-indicator-text {
          font-family: var(--font-ui);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--ink);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .log-footer {
          margin-top: 8px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .btn-remove-vault {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 14px;
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--ink-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: transparent;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .btn-remove-vault:hover {
          color: oklch(62% 0.22 25);
          border-color: oklch(62% 0.22 25 / 0.4);
          background: oklch(62% 0.22 25 / 0.06);
        }

        .btn-remove-vault:active {
          transform: scale(0.98);
        }

        /* In-Place Sleek Delete Confirmation Bar (Zero Shift, Zero Scroll) */
        .delete-confirm-inline-bar {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 8px;
          width: 100%;
          height: 38px;
          animation: fadeIn 140ms ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        .btn-delete-cancel {
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--ink-2);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 140ms ease;
          touch-action: manipulation;
        }

        .btn-delete-cancel:hover {
          color: var(--ink);
          border-color: var(--ink-2);
          background: var(--surface-2);
        }

        .btn-delete-cancel:active {
          transform: scale(0.98);
        }

        .btn-delete-execute {
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          font-weight: 600;
          color: #ffffff;
          background: oklch(58% 0.22 25);
          border: 1px solid oklch(58% 0.22 25);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: filter 140ms ease, transform 120ms ease;
          box-shadow: 0 2px 10px oklch(58% 0.22 25 / 0.35);
          touch-action: manipulation;
        }

        .btn-delete-execute:hover {
          filter: brightness(1.1);
        }

        .btn-delete-execute:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
};
