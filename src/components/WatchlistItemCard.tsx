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

  const getStreamBadge = (providerName: string) => {
    const name = providerName.toLowerCase();
    if (name.includes('netflix')) return 'Netflix';
    if (name.includes('prime')) return 'Prime';
    if (name.includes('disney')) return 'Disney+';
    if (name.includes('apple')) return ' TV+';
    if (name.includes('max') || name.includes('hbo')) return 'MAX';
    if (name.includes('hulu')) return 'Hulu';
    if (name.includes('paramount')) return 'Paramount+';
    if (name.includes('peacock')) return 'Peacock';
    return providerName;
  };

  const ratingValue = item.userRating > 0 ? item.userRating : item.voteAverage;
  const primaryStreamProvider =
    item.streamingProviders && item.streamingProviders.length > 0
      ? getStreamBadge(item.streamingProviders[0].name)
      : null;

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

          {/* Floating Status Indicator on Poster Top-Left */}
          <div className="poster-status-anchor">
            <span className={`poster-status-tag ${item.status}`}>
              {getStatusLabel(item.status)}
            </span>
          </div>

          {/* Floating Stream Tag (Top-Right of Poster) */}
          {primaryStreamProvider && (
            <div className="poster-stream-anchor">
              <span className="stream-badge-tag">{primaryStreamProvider}</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Caption: Title + Rating Row (Strongest), Year + Genre + Stream (Secondary) */}
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
          {primaryStreamProvider && (
            <>
              <span className="meta-sep">·</span>
              <span className="meta-stream-label">{primaryStreamProvider}</span>
            </>
          )}
        </div>
      </div>

      <style>{`
        .card-root {
          display: flex;
          flex-direction: column;
          min-width: 0;
          width: 100%;
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
          border-color: var(--accent);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
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
          background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%);
        }

        .fallback-title {
          position: relative;
          z-index: 2;
          font-family: var(--font-display);
          font-size: 1.05rem;
          color: #ffffff;
          line-height: 1.3;
        }

        /* Top-Left Floating Status Badge */
        .poster-status-anchor {
          position: absolute;
          top: 6px;
          left: 6px;
          z-index: 2;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(8px);
          padding: 2.5px 7px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(255, 255, 255, 0.18);
          line-height: 1;
        }

        .poster-status-tag {
          font-family: var(--font-ui);
          font-size: 0.625rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #ffffff;
        }

        .poster-status-tag.watching {
          color: var(--accent);
        }

        /* Top-Right Floating Stream Badge */
        .poster-stream-anchor {
          position: absolute;
          top: 6px;
          right: 6px;
          z-index: 2;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(8px);
          padding: 2.5px 7px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(255, 255, 255, 0.18);
          line-height: 1;
        }

        .stream-badge-tag {
          font-family: var(--font-ui);
          font-size: 0.625rem;
          font-weight: 600;
          color: #ffffff;
          letter-spacing: 0.02em;
        }

        /* Caption Structure */
        .card-caption {
          padding-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          width: 100%;
        }

        .caption-primary-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 6px;
          min-width: 0;
          width: 100%;
        }

        .card-title {
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-weight: 400;
          color: var(--ink);
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
          transition: color 150ms ease;
        }

        .card-root:hover .card-title {
          color: var(--ink);
        }

        .card-rating-val {
          font-size: 0.75rem;
          font-weight: 600;
          flex-shrink: 0;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
          transition: color 150ms ease;
        }

        .card-root:hover .card-rating-val {
          color: var(--accent);
        }

        .caption-secondary-row {
          font-family: var(--font-ui);
          font-size: 0.6875rem;
          color: var(--ink-2);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }

        .meta-sep {
          color: var(--border);
          flex-shrink: 0;
        }

        .meta-genre {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .meta-stream-label {
          color: var(--accent);
          font-weight: 600;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};
