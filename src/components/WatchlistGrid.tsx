import React, { useMemo, useState } from 'react';
import { Plus, Broadcast, FilmStrip } from '@phosphor-icons/react';
import type { FilterState } from '../types';
import { useWatchlist } from '../context/WatchlistContext';
import { WatchlistItemCard } from './WatchlistItemCard';
import { FilterSortBar } from './FilterSortBar';
import { FrameLogo } from './FrameLogo';

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

  // Brand New User / Empty Vault Onboarding Story
  if (watchlist.length === 0) {
    return (
      <div className="onboarding-welcome-hero">
        <div className="onboarding-icon-box">
          <FrameLogo size={36} />
        </div>

        <h2 className="onboarding-headline">Your personal cinema vault.</h2>

        <p className="onboarding-story">
          FRAME is an intentional space to chronicle what you watch, what moved you, and what’s next on your screen — free from algorithmic noise, social feeds, and clutter.
        </p>

        <div className="onboarding-cta-row">
          <button className="btn-primary-hero-add" onClick={() => openAddModal()}>
            <Plus size={16} weight="bold" />
            <span>Add your first title</span>
          </button>

          <button className="btn-outline btn-hero-releases" onClick={() => setActiveTab('releases')}>
            <Broadcast size={16} />
            <span>Explore OTT Releases</span>
          </button>
        </div>

        <div className="quick-suggestions-block">
          <span className="quick-suggestions-label">Or quick-start with a title you love:</span>
          <div className="suggestion-pills-row">
            {['Oppenheimer', 'Interstellar', 'Severance', 'Dune: Part Two', 'Past Lives', 'The Bear'].map((title) => (
              <button
                key={title}
                className="suggestion-chip"
                onClick={() => openAddModal(title)}
              >
                + {title}
              </button>
            ))}
          </div>
        </div>

        <style>{`
          .onboarding-welcome-hero {
            padding: 80px 24px;
            max-width: 680px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 20px;
          }

          @media (max-width: 768px) {
            .onboarding-welcome-hero {
              padding: 40px 16px;
            }
          }

          .onboarding-icon-box {
            width: 56px;
            height: 56px;
            border-radius: var(--radius-sm);
            background: var(--surface);
            border: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 4px;
          }

          .onboarding-headline {
            font-family: var(--font-display);
            font-size: clamp(2rem, 5vw, 2.75rem);
            font-weight: 400;
            color: var(--ink);
            line-height: 1.15;
            letter-spacing: -0.02em;
          }

          .onboarding-story {
            font-family: var(--font-ui);
            font-size: 0.95rem;
            color: var(--ink-2);
            line-height: 1.65;
            max-width: 540px;
          }

          .onboarding-cta-row {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 8px;
            flex-wrap: wrap;
            justify-content: center;
          }

          .btn-primary-hero-add {
            background: var(--accent);
            color: var(--bg);
            font-size: 0.875rem;
            font-weight: 600;
            padding: 10px 20px;
            border-radius: var(--radius-sm);
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: filter 150ms ease;
          }

          .btn-primary-hero-add:hover {
            filter: brightness(1.1);
          }

          .btn-hero-releases {
            font-size: 0.875rem;
            padding: 10px 18px;
          }

          .quick-suggestions-block {
            margin-top: 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            padding-top: 24px;
            border-top: 1px solid var(--border);
            width: 100%;
          }

          .quick-suggestions-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--ink-2);
            font-weight: 600;
          }

          .suggestion-pills-row {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
          }

          .suggestion-chip {
            font-family: var(--font-ui);
            font-size: 0.75rem;
            color: var(--ink-2);
            background: var(--surface);
            border: 1px solid var(--border);
            padding: 4px 10px;
            border-radius: var(--radius-sm);
            transition: all 150ms ease;
          }

          .suggestion-chip:hover {
            color: var(--ink);
            border-color: var(--accent);
            background: var(--surface-2);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="watchlist-container">
      {/* Filter and Search Bar */}
      <FilterSortBar
        filters={filters}
        onFilterChange={handleFilterChange}
        availableGenres={availableGenres}
      />

      {/* Grid Display */}
      {filteredItems.length > 0 ? (
        <div className="poster-grid">
          {filteredItems.map((item) => (
            <WatchlistItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        /* Filtered Empty State */
        <div className="empty-state-minimal">
          <FilmStrip size={28} color="var(--ink-2)" />
          <p className="empty-title">No matching titles found in your vault.</p>
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
            Clear Filters
          </button>
        </div>
      )}

      <style>{`
        .watchlist-container {
          display: flex;
          flex-direction: column;
        }

        .poster-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 32px 20px;
        }

        @media (max-width: 768px) {
          .poster-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px 14px;
          }
        }

        .empty-state-minimal {
          padding: 80px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 14px;
        }

        .empty-title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          color: var(--ink-2);
        }
      `}</style>
    </div>
  );
};
