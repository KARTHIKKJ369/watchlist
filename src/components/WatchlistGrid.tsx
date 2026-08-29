import React, { useMemo, useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import type { FilterState } from '../types';
import { useWatchlist } from '../context/WatchlistContext';
import { WatchlistItemCard } from './WatchlistItemCard';
import { FilterSortBar } from './FilterSortBar';

export const WatchlistGrid: React.FC = () => {
  const { watchlist, openAddModal } = useWatchlist();

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
        /* Empty State */
        <div className="empty-state-minimal">
          <p className="empty-title">
            {filters.searchQuery || filters.status !== 'all' || filters.mediaType !== 'all'
              ? 'No matching titles found.'
              : 'Your watchlist is empty.'}
          </p>

          <div className="empty-actions">
            {filters.searchQuery || filters.status !== 'all' || filters.mediaType !== 'all' ? (
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
            ) : (
              <button className="btn-outline" onClick={() => openAddModal()}>
                <Plus size={14} />
                <span>Add Title</span>
              </button>
            )}
          </div>
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
          gap: 16px;
        }

        .empty-title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          color: var(--ink-2);
        }

        .empty-actions {
          display: flex;
          gap: 12px;
        }
      `}</style>
    </div>
  );
};
