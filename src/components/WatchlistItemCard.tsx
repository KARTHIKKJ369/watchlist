import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  ArrowSquareOut,
} from '@phosphor-icons/react';
import type { WatchlistItem, WatchStatus } from '../types';
import { useWatchlist } from '../context/WatchlistContext';
import { triggerHaptic } from '../services/nativeService';

interface WatchlistItemCardProps {
  item: WatchlistItem;
}

export const WatchlistItemCard: React.FC<WatchlistItemCardProps> = ({ item }) => {
  const { openDetailModal, updateWatchlistItem } = useWatchlist();
  const [imgError, setImgError] = useState(false);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'watching':
        return (
          <span className="status-badge-nothing watching">
            <span className="rec-dot-active" />
            <span>WATCHING</span>
          </span>
        );
      case 'plan_to_watch':
        return <span className="status-badge-nothing queued">QUEUED</span>;
      case 'completed':
        return <span className="status-badge-nothing completed">DONE</span>;
      case 'dropped':
        return <span className="status-badge-nothing dropped">DROPPED</span>;
      default:
        return <span className="status-badge-nothing">{status.toUpperCase()}</span>;
    }
  };

  const getStreamBadge = (providerName: string) => {
    const name = providerName.toLowerCase();
    if (name.includes('vi') || name.includes('vodafone') || name.includes('idea')) return 'VI';
    if (name.includes('netflix')) return 'NETFLIX';
    if (name.includes('prime')) return 'PRIME';
    if (name.includes('disney') || name.includes('hotstar')) return 'DISNEY+';
    if (name.includes('apple')) return 'APPLE TV+';
    if (name.includes('max') || name.includes('hbo')) return 'MAX';
    if (name.includes('jio')) return 'JIO';
    return providerName.length > 8 ? providerName.slice(0, 6).toUpperCase() : providerName.toUpperCase();
  };

  const handleCardClick = () => {
    triggerHaptic('selection');
    openDetailModal(item);
  };

  const handleQuickCompleteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('success');
    const newStatus: WatchStatus = item.status === 'completed' ? 'watching' : 'completed';
    updateWatchlistItem(item.id, { status: newStatus });
  };

  const ratingValue = item.userRating > 0 ? item.userRating : item.voteAverage;
  const primaryStreamProvider =
    item.streamingProviders && item.streamingProviders.length > 0
      ? getStreamBadge(item.streamingProviders[0].name)
      : null;

  return (
    <div
      className="card-root-nothing"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Poster Frame (2:3 Aspect Ratio with Technical 1px Border) */}
      <div className="poster-frame-nothing">
        <motion.div className="poster-inner-nothing" layoutId={`poster-${item.id}`}>
          {item.posterPath && !imgError ? (
            <img
              src={item.posterPath}
              alt={item.title}
              className={`poster-image-nothing ${item.status === 'completed' ? 'completed-img' : ''}`}
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="poster-fallback-nothing">
              <span className="fallback-title-nothing">{item.title}</span>
            </div>
          )}

          {/* Desktop Hover Quick Action Overlay */}
          <div className="poster-hover-overlay-nothing">
            <button
              className={`quick-action-tech ${item.status === 'completed' ? 'active-done' : ''}`}
              onClick={handleQuickCompleteToggle}
              title={item.status === 'completed' ? 'Mark as In Progress' : 'Mark as Done'}
              aria-label="Toggle Complete"
            >
              <Check size={14} weight="bold" />
            </button>

            <button
              className="quick-action-tech"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              title="Open Cinema Details"
              aria-label="Open Details"
            >
              <ArrowSquareOut size={14} weight="bold" />
            </button>
          </div>

          {/* Top-Left Floating Status Indicator */}
          <div className="poster-status-anchor-nothing">
            {getStatusDisplay(item.status)}
          </div>

          {/* Bottom-Left Streaming Provider Tag */}
          {primaryStreamProvider && (
            <div className="poster-stream-anchor-nothing">
              <span className="stream-badge-nothing">{primaryStreamProvider}</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Technical Caption */}
      <div className="card-caption-nothing">
        <div className="caption-primary-row-nothing">
          <h3 className="card-title-nothing" title={item.title}>
            {item.title}
          </h3>
          {ratingValue > 0 ? (
            <div className="card-rating-nothing">
              <span className="rating-val">{ratingValue}</span>
              <span className="rating-denom">/10</span>
            </div>
          ) : null}
        </div>

        <div className="caption-secondary-row-nothing">
          <span>{item.releaseYear || 'TBA'}</span>
          {item.genres?.length > 0 && (
            <>
              <span className="meta-sep">//</span>
              <span className="meta-genre">{item.genres[0].toUpperCase()}</span>
            </>
          )}
        </div>
      </div>

      <style>{`
        .card-root-nothing {
          display: flex;
          flex-direction: column;
          cursor: pointer;
          user-select: none;
          outline: none;
          background: transparent;
          transition: transform 100ms ease;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .card-root-nothing:active {
          transform: scale(0.97);
        }

        /* 2:3 Aspect Ratio Technical Poster Frame */
        .poster-frame-nothing {
          position: relative;
          width: 100%;
          aspect-ratio: 2 / 3;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          overflow: hidden;
          transition: border-color 120ms ease;
        }

        .card-root-nothing:hover .poster-frame-nothing {
          border-color: var(--ink-2);
        }

        .poster-inner-nothing {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .poster-image-nothing {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 150ms ease;
        }

        .card-root-nothing:hover .poster-image-nothing {
          transform: scale(1.02);
        }

        .poster-image-nothing.completed-img {
          filter: grayscale(0.35) contrast(0.95);
        }

        .poster-fallback-nothing {
          width: 100%;
          height: 100%;
          background: var(--surface-2);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 14px;
          text-align: center;
        }

        .fallback-title-nothing {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          color: var(--ink-2);
          text-transform: uppercase;
        }

        /* Top-Left Status Badge */
        .poster-status-anchor-nothing {
          position: absolute;
          top: 8px;
          left: 8px;
          z-index: 10;
        }

        .status-badge-nothing {
          font-family: var(--font-mono);
          font-size: 0.5625rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 2px 6px;
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .status-badge-nothing.watching {
          border-color: rgba(215, 25, 33, 0.6);
        }

        .rec-dot-active {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: var(--accent);
          box-shadow: 0 0 6px var(--accent);
        }

        .status-badge-nothing.completed {
          border-color: rgba(34, 197, 94, 0.5);
          color: #22c55e;
        }

        .status-badge-nothing.dropped {
          color: #71717a;
          border-color: #3f3f46;
        }

        /* Bottom-Left Stream Badge */
        .poster-stream-anchor-nothing {
          position: absolute;
          bottom: 8px;
          left: 8px;
          z-index: 10;
        }

        .stream-badge-nothing {
          font-family: var(--font-mono);
          font-size: 0.5625rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          padding: 2px 5px;
          background: rgba(0, 0, 0, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 2px;
          color: #d4d4d8;
        }

        /* Quick Action Hover */
        .poster-hover-overlay-nothing {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          opacity: 0;
          transition: opacity 120ms ease;
          z-index: 15;
        }

        .card-root-nothing:hover .poster-hover-overlay-nothing {
          opacity: 1;
        }

        .quick-action-tech {
          width: 28px;
          height: 28px;
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 2px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 100ms ease;
        }

        .quick-action-tech:hover {
          background: var(--ink);
          color: var(--bg);
          border-color: var(--ink);
        }

        .quick-action-tech.active-done {
          background: #22c55e;
          color: #000000;
          border-color: #22c55e;
        }

        /* Caption */
        .card-caption-nothing {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .caption-primary-row-nothing {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }

        .card-title-nothing {
          font-family: var(--font-ui);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--ink);
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 2.2em;
        }

        .card-rating-nothing {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--ink);
          white-space: nowrap;
        }

        .card-rating-nothing .rating-denom {
          color: var(--ink-3);
          font-size: 0.625rem;
          font-weight: 400;
        }

        .caption-secondary-row-nothing {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: var(--ink-2);
          display: flex;
          align-items: center;
          gap: 5px;
          letter-spacing: 0.04em;
        }

        .meta-sep {
          color: var(--border);
        }

        .meta-genre {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
};
