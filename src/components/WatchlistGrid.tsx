import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Broadcast, FilmStrip } from '@phosphor-icons/react';
import type { FilterState } from '../types';
import { useWatchlist } from '../context/WatchlistContext';
import { WatchlistItemCard } from './WatchlistItemCard';
import { FilterSortBar } from './FilterSortBar';

export const WatchlistGrid: React.FC = () => {
  const { watchlist, openAddModal, setActiveTab } = useWatchlist();

  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    mediaType: 'all',
    searchQuery: '',
    sortBy: 'date_added_desc',
    selectedGenre: 'all',
  });

  const handleFilterChange = (updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    watchlist.forEach((item) => {
      (item.genres || []).forEach((g) => genreSet.add(g));
    });
    return Array.from(genreSet).sort();
  }, [watchlist]);

  const filteredItems = useMemo(() => {
    return watchlist
      .filter((item) => {
        if (filters.status !== 'all' && item.status !== filters.status) {
          return false;
        }
        if (filters.mediaType !== 'all' && item.mediaType !== filters.mediaType) {
          return false;
        }
        if (
          filters.selectedGenre !== 'all' &&
          !item.genres?.includes(filters.selectedGenre)
        ) {
          return false;
        }
        if (filters.searchQuery.trim()) {
          const query = filters.searchQuery.toLowerCase().trim();
          const matchTitle = item.title.toLowerCase().includes(query);
          const matchNotes = item.userNotes?.toLowerCase().includes(query);
          const matchTags = item.tags?.some((t) => t.toLowerCase().includes(query));
          const matchDirector = item.director?.toLowerCase().includes(query);
          if (!matchTitle && !matchNotes && !matchTags && !matchDirector) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'date_added_desc':
            return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
          case 'date_added_asc':
            return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
          case 'rating_desc':
            return (b.userRating || b.voteAverage || 0) - (a.userRating || a.voteAverage || 0);
          case 'rating_asc':
            return (a.userRating || a.voteAverage || 0) - (b.userRating || b.voteAverage || 0);
          case 'release_date_desc':
            return (
              new Date(b.releaseDate || b.releaseYear.toString()).getTime() -
              new Date(a.releaseDate || a.releaseYear.toString()).getTime()
            );
          case 'release_date_asc':
            return (
              new Date(a.releaseDate || a.releaseYear.toString()).getTime() -
              new Date(b.releaseDate || b.releaseYear.toString()).getTime()
            );
          case 'title_asc':
            return a.title.localeCompare(b.title);
          case 'title_desc':
            return b.title.localeCompare(a.title);
          default:
            return 0;
        }
      });
  }, [watchlist, filters]);

  // Nothing Design Onboarding Hero
  if (watchlist.length === 0) {
    return (
      <div className="onboarding-nothing-hero">
        <div className="onboarding-rec-pip" />
        <h2 className="onboarding-title-nothing">YOUR PERSONAL CINEMA VAULT.</h2>

        <p className="onboarding-desc-nothing">
          AN INTENTIONAL, MONOCHROME CINEMA LOG. TRACK WHAT YOU WATCH, RATE FILMS, AND DISCOVER OTT RELEASES WITH ZERO DISTRACTIONS.
        </p>

        <div className="onboarding-actions-nothing">
          <button className="btn-nothing-hero-primary" onClick={() => openAddModal()}>
            <Plus size={16} weight="bold" />
            <span>ADD FIRST TITLE</span>
          </button>

          <button
            className="btn-nothing-hero-secondary"
            onClick={() => setActiveTab('releases')}
          >
            <Broadcast size={16} weight="bold" />
            <span>DISCOVER OTT</span>
          </button>
        </div>

        <div className="suggestions-block-nothing">
          <span className="suggestions-label-nothing">// POPULAR SUGGESTIONS:</span>
          <div className="suggestions-grid-nothing">
            {['Oppenheimer', 'Dune: Part Two', 'Severance', 'Past Lives', 'Succession'].map((title) => (
              <button
                key={title}
                className="suggestion-chip-nothing"
                onClick={() => openAddModal(title)}
              >
                + {title.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <style>{`
          .onboarding-nothing-hero {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 64px 20px;
            max-width: 620px;
            margin: 40px auto;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            background: var(--surface);
          }

          .onboarding-rec-pip {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: var(--accent);
            box-shadow: 0 0 12px var(--accent);
            margin-bottom: 20px;
          }

          .onboarding-title-nothing {
            font-family: var(--font-display);
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--ink);
            letter-spacing: -0.02em;
            margin-bottom: 12px;
            line-height: 1.2;
          }

          .onboarding-desc-nothing {
            font-family: var(--font-mono);
            font-size: 0.75rem;
            color: var(--ink-2);
            line-height: 1.6;
            margin-bottom: 28px;
            max-width: 480px;
            letter-spacing: 0.04em;
          }

          .onboarding-actions-nothing {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            justify-content: center;
            width: 100%;
          }

          .btn-nothing-hero-primary {
            font-family: var(--font-mono);
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.06em;
            background: var(--accent);
            color: #ffffff;
            padding: 10px 20px;
            border-radius: var(--radius-sm);
            box-shadow: 0 2px 10px var(--accent-glow);
          }

          .btn-nothing-hero-primary:hover {
            filter: brightness(1.1);
          }

          .btn-nothing-hero-secondary {
            font-family: var(--font-mono);
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.06em;
            background: var(--surface-2);
            color: var(--ink);
            border: 1px solid var(--border);
            padding: 10px 18px;
            border-radius: var(--radius-sm);
          }

          .btn-nothing-hero-secondary:hover {
            border-color: var(--ink-2);
          }

          .suggestions-block-nothing {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px dashed var(--border);
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }

          .suggestions-label-nothing {
            font-family: var(--font-mono);
            font-size: 0.6875rem;
            color: var(--ink-3);
            letter-spacing: 0.08em;
          }

          .suggestions-grid-nothing {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
          }

          .suggestion-chip-nothing {
            font-family: var(--font-mono);
            font-size: 0.6875rem;
            color: var(--ink-2);
            background: var(--surface-2);
            border: 1px solid var(--border);
            padding: 4px 10px;
            border-radius: 2px;
            transition: all 100ms ease;
          }

          .suggestion-chip-nothing:hover {
            color: var(--ink);
            border-color: var(--ink-2);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="watchlist-container-nothing">
      {/* Filter and Search Bar */}
      <FilterSortBar
        filters={filters}
        onFilterChange={handleFilterChange}
        availableGenres={availableGenres}
      />

      {/* Grid Display */}
      {filteredItems.length > 0 ? (
        <div className="poster-grid-nothing">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.2,
                delay: Math.min(index * 0.03, 0.25),
              }}
            >
              <WatchlistItemCard item={item} />
            </motion.div>
          ))}
        </div>
      ) : (
        /* Filtered Empty State */
        <div className="empty-state-nothing">
          <FilmStrip size={24} color="var(--ink-3)" />
          <p className="empty-title-nothing">// NO MATCHING TITLES IN VAULT</p>
          <button
            className="btn-outline"
            onClick={() =>
              setFilters({
                status: 'all',
                mediaType: 'all',
                searchQuery: '',
                sortBy: 'date_added_desc',
                selectedGenre: 'all',
              })
            }
          >
            [CLEAR FILTERS]
          </button>
        </div>
      )}

      <style>{`
        .watchlist-container-nothing {
          display: flex;
          flex-direction: column;
        }

        .poster-grid-nothing {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 28px 16px;
        }

        @media (max-width: 768px) {
          .poster-grid-nothing {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px 12px;
          }
        }

        .empty-state-nothing {
          padding: 80px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
          border: 1px dashed var(--border);
          border-radius: var(--radius-sm);
          margin-top: 16px;
        }

        .empty-title-nothing {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          color: var(--ink-2);
          letter-spacing: 0.06em;
        }
      `}</style>
    </div>
  );
};
