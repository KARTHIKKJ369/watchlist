import React, { useState } from 'react';
import {
  MagnifyingGlass,
  Funnel,
  X,
} from '@phosphor-icons/react';
import type { FilterState, SortOption, WatchStatus, MediaType } from '../types';

interface FilterSortBarProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  availableGenres: string[];
}

export const FilterSortBar: React.FC<FilterSortBarProps> = ({
  filters,
  onFilterChange,
  availableGenres,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const statusTabs: { id: 'all' | WatchStatus; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'watching', label: 'Watching' },
    { id: 'plan_to_watch', label: 'Queued' },
    { id: 'completed', label: 'Completed' },
    { id: 'dropped', label: 'Dropped' },
  ];

  return (
    <div className="filter-sort-container">
      {/* Top Row: Status Text Tabs separated by vertical dividers */}
      <div className="status-tabs-strip">
        {statusTabs.map((tab, idx) => (
          <React.Fragment key={tab.id}>
            <button
              className={`status-link ${filters.status === tab.id ? 'active' : ''}`}
              onClick={() => onFilterChange({ status: tab.id })}
            >
              {tab.label}
            </button>
            {idx < statusTabs.length - 1 && <span className="tab-divider">|</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Single Search + Filter Row */}
      <div className="search-filter-line">
        <div className="search-box">
          <MagnifyingGlass size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search titles, directors, notes..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="search-input-minimal"
          />
          {filters.searchQuery && (
            <button
              className="clear-btn"
              onClick={() => onFilterChange({ searchQuery: '' })}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          className={`filter-drawer-toggle ${isDrawerOpen || filters.selectedGenre !== 'all' || filters.mediaType !== 'all' || filters.sortBy !== 'date_added_desc' ? 'active' : ''}`}
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          title="Filter and Sort Options"
          aria-label="Filter Options"
        >
          <Funnel size={18} weight={isDrawerOpen ? 'fill' : 'regular'} />
        </button>
      </div>

      {/* Slide-Down Filter & Sort Drawer */}
      {isDrawerOpen && (
        <div className="filter-drawer">
          {/* Media Type */}
          <div className="drawer-item">
            <label className="drawer-label">Type</label>
            <div className="drawer-types">
              <button
                className={`drawer-type-btn ${filters.mediaType === 'all' ? 'active' : ''}`}
                onClick={() => onFilterChange({ mediaType: 'all' })}
              >
                All
              </button>
              <button
                className={`drawer-type-btn ${filters.mediaType === 'movie' ? 'active' : ''}`}
                onClick={() => onFilterChange({ mediaType: 'movie' as MediaType })}
              >
                Films
              </button>
              <button
                className={`drawer-type-btn ${filters.mediaType === 'tv' ? 'active' : ''}`}
                onClick={() => onFilterChange({ mediaType: 'tv' as MediaType })}
              >
                Series
              </button>
            </div>
          </div>

          {/* Genre */}
          {availableGenres.length > 0 && (
            <div className="drawer-item">
              <label className="drawer-label">Genre</label>
              <select
                value={filters.selectedGenre}
                onChange={(e) => onFilterChange({ selectedGenre: e.target.value })}
                className="drawer-select"
              >
                <option value="all">All Genres</option>
                {availableGenres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort By */}
          <div className="drawer-item">
            <label className="drawer-label">Sort</label>
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as SortOption })}
              className="drawer-select"
            >
              <option value="date_added_desc">Recently Added</option>
              <option value="date_added_asc">Oldest Added</option>
              <option value="rating_desc">Highest Rated</option>
              <option value="rating_asc">Lowest Rated</option>
              <option value="release_date_desc">Newest Release</option>
              <option value="release_date_asc">Oldest Release</option>
              <option value="title_asc">Title (A - Z)</option>
            </select>
          </div>

          {/* Reset Action */}
          <div className="drawer-actions">
            <button
              className="btn-minimal"
              onClick={() =>
                onFilterChange({
                  selectedGenre: 'all',
                  mediaType: 'all',
                  sortBy: 'date_added_desc',
                })
              }
            >
              Reset
            </button>
          </div>
        </div>
      )}

      <style>{`
        .filter-sort-container {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-bottom: 32px;
        }

        /* Plain text tabs with vertical dividers */
        .status-tabs-strip {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .status-link {
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--ink-2);
          padding: 4px 0;
          position: relative;
          background: transparent;
          white-space: nowrap;
        }

        .status-link:hover {
          color: var(--ink);
        }

        .status-link.active {
          color: var(--ink);
        }

        .status-link.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--accent);
        }

        .tab-divider {
          color: var(--border);
          font-size: 0.75rem;
          user-select: none;
        }

        /* Search + Filter Line */
        .search-filter-line {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .search-box {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--ink-2);
          pointer-events: none;
        }

        .search-input-minimal {
          padding-left: 36px;
          padding-right: 32px;
          height: 38px;
          background: transparent;
          border: 1px solid var(--border);
          font-size: 0.875rem;
          color: var(--ink);
          border-radius: var(--radius-sm);
        }

        .search-input-minimal:focus {
          border-color: var(--accent);
        }

        .clear-btn {
          position: absolute;
          right: 10px;
          color: var(--ink-2);
        }

        .clear-btn:hover {
          color: var(--ink);
        }

        .filter-drawer-toggle {
          width: 38px;
          height: 38px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--ink-2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .filter-drawer-toggle:hover,
        .filter-drawer-toggle.active {
          border-color: var(--accent);
          color: var(--accent);
        }

        /* Drawer */
        .filter-drawer {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 14px 16px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--surface);
          flex-wrap: wrap;
        }

        .drawer-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .drawer-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--ink-2);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .drawer-types {
          display: flex;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
        }

        .drawer-type-btn {
          padding: 4px 10px;
          font-size: 0.75rem;
          color: var(--ink-2);
          background: transparent;
        }

        .drawer-type-btn.active {
          background: var(--surface-2);
          color: var(--ink);
        }

        .drawer-select {
          height: 32px;
          font-size: 0.8125rem;
          padding: 4px 8px;
          background: var(--bg);
          border: 1px solid var(--border);
          width: auto;
        }

        .drawer-actions {
          margin-left: auto;
        }
      `}</style>
    </div>
  );
};
