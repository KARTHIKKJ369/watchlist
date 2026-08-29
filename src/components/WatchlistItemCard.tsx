import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { WatchlistItem } from '../types';
import { useWatchlist } from '../context/WatchlistContext';

interface WatchlistItemCardProps {
  item: WatchlistItem;
}

export const WatchlistItemCard: React.FC<WatchlistItemCardProps> = ({ item }) => {
  const { openDetailModal } = useWatchlist();
  const [imgError, setImgError] = useState(false);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'watching':
        return 'Watching';
      case 'plan_to_watch':
        return 'Queued';
      case 'completed':
        return 'Completed';
      case 'dropped':
        return 'Dropped';
      default:
        return status;
    }
  };

  const ratingValue = item.userRating > 0 ? item.userRating : item.voteAverage;

  return (
    <div
      className="card-root"
      onClick={() => openDetailModal(item)}
      role="button"
      tabIndex={0}
    >
      {/* Poster Frame (2:3 Aspect Ratio) */}
      <div className="poster-frame">
        <motion.div className="poster-inner" layoutId={`poster-${item.id}`}>
          {item.posterPath && !imgError ? (
            <img
              src={item.posterPath}
              alt={item.title}
              className={`poster-image ${item.status === 'completed' ? 'completed-img' : ''}`}
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="poster-fallback">
              {item.backdropPath ? (
                <img
                  src={item.backdropPath}
                  alt={item.title}
                  className="poster-fallback-backdrop"
                />
              ) : null}
              <div className="poster-fallback-overlay" />
              <span className="fallback-title">{item.title}</span>
            </div>
          )}

          {/* Floating Status Indicator on Poster Bottom-Left */}
          <div className="poster-status-anchor">
            <span className={`status-type ${item.status}`}>
              {getStatusLabel(item.status)}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Caption: Title + Rating Row (Strongest), Year + Genre (Secondary) */}
      <div className="card-caption">
        <div className="caption-primary-row">
          <h3 className="card-title" title={item.title}>
            {item.title}
          </h3>
          {ratingValue > 0 ? (
            <div className="rating-num card-rating-val">
              {ratingValue}
              <span className="rating-suffix">/10</span>
            </div>
          ) : null}
        </div>

        <div className="caption-secondary-row">
          <span className="meta-year">{item.releaseYear || 'TBA'}</span>
          {item.genres?.length > 0 && (
            <>
              <span className="meta-sep">·</span>
              <span className="meta-genre">{item.genres[0]}</span>
            </>
          )}
        </div>
      </div>

      <style>{`
        .card-root {
          display: flex;
          flex-direction: column;
          cursor: pointer;
          user-select: none;
          transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .card-root:hover {
          transform: translateY(-2px);
        }

        .poster-frame {
          position: relative;
          width: 100%;
          aspect-ratio: 2 / 3;
          background: var(--surface);
          border-radius: var(--radius-sm);
          overflow: hidden;
          border: 1px solid var(--border);
          transition: border-color 200ms ease, box-shadow 200ms ease;
        }

        .poster-inner {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .poster-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1), filter 300ms ease;
        }

        .poster-image.completed-img {
          filter: grayscale(35%);
        }

        .card-root:hover .poster-image {
          transform: scale(1.02);
        }

        .card-root:hover .poster-frame {
          border-color: oklch(68% 0.18 30 / 0.5);
          box-shadow: 0 10px 30px oklch(0% 0 0 / 0.6);
        }

        /* Fallback with subtle blurred artwork treatment */
        .poster-fallback {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          text-align: center;
          background: var(--surface);
          overflow: hidden;
        }

        .poster-fallback-backdrop {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: blur(20px);
          opacity: 0.35;
          transform: scale(1.2);
        }

        .poster-fallback-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 0%, oklch(10% 0.01 265 / 0.8) 100%);
        }

        .fallback-title {
          position: relative;
          z-index: 2;
          font-family: var(--font-display);
          font-size: 1.1rem;
          color: var(--ink);
          line-height: 1.3;
        }

        .poster-status-anchor {
          position: absolute;
          bottom: 8px;
          left: 8px;
          z-index: 2;
          background: oklch(10% 0.01 265 / 0.9);
          backdrop-filter: blur(8px);
          padding: 2px 7px;
          border-radius: 2px;
          border: 1px solid var(--border);
        }

        /* Caption Structure: Row 1 = Title + Rating; Row 2 = Year · Genre */
        .card-caption {
          padding-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .caption-primary-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
        }

        .card-title {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 400;
          color: var(--ink);
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          transition: color 150ms ease;
        }

        .card-root:hover .card-title {
          color: #ffffff;
        }

        .card-rating-val {
          font-size: 0.8125rem;
          font-weight: 600;
          flex-shrink: 0;
          font-variant-numeric: tabular-nums;
          transition: color 150ms ease;
        }

        .card-root:hover .card-rating-val {
          color: var(--accent);
        }

        .caption-secondary-row {
          font-family: var(--font-ui);
          font-size: 0.75rem;
          color: var(--ink-2);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 6px;
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
