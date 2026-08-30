import React, { useState } from 'react';
import {
  MagnifyingGlass,
  Funnel,
  X,
  SlidersHorizontal,
} from '@phosphor-icons/react';
import type { FilterState, SortOption, WatchStatus, MediaType } from '../types';
import { triggerHaptic } from '../services/nativeService';

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

  const statusTabs: {
    id: 'all' | WatchStatus;
    label: string;
  }[] = [
    { id: 'all', label: 'ALL' },
    { id: 'watching', label: 'WATCHING' },
    { id: 'plan_to_watch', label: 'QUEUED' },
    { id: 'completed', label: 'DONE' },
    { id: 'dropped', label: 'DROPPED' },
  ];

  const handleTabSelect = (statusId: 'all' | WatchStatus) => {
    triggerHaptic('selection');
    onFilterChange({ status: statusId });
  };

  const isFilterActive =
    filters.selectedGenre !== 'all' ||
    filters.mediaType !== 'all' ||
    filters.sortBy !== 'date_added_desc';

  return (
    <div className="filter-sort-container-nothing">
      {/* Nothing Segmented Matrix Filter Bar */}
      <div className="segmented-track-nothing">
        {statusTabs.map((tab) => {
          const isActive = filters.status === tab.id;
          return (
            <button
              key={tab.id}
              className={`segmented-btn-nothing ${isActive ? 'is-active' : ''}`}
              onClick={() => handleTabSelect(tab.id)}
            >
              {isActive && tab.id === 'watching' && <span className="tab-rec-dot" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Input Bar + Technical Filter Toggle */}
      <div className="search-filter-line">
        <div className="search-box-nothing">
          <MagnifyingGlass size={15} className="search-icon-nothing" />
          <input
            type="text"
            placeholder="SEARCH // TITLES, DIRECTORS, NOTES..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="search-input-nothing"
          />
          {filters.searchQuery && (
            <button
              className="clear-btn-nothing"
              onClick={() => {
                triggerHaptic('light');
                onFilterChange({ searchQuery: '' });
              }}
              aria-label="Clear search"
            >
              <X size={13} weight="bold" />
            </button>
          )}
        </div>

        <button
          className={`filter-btn-nothing ${isDrawerOpen || isFilterActive ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('selection');
            setIsDrawerOpen(!isDrawerOpen);
          }}
          title="Filter and Sort Options"
          aria-label="Filter Options"
        >
          {isFilterActive ? (
            <Funnel size={15} weight="fill" />
          ) : (
            <SlidersHorizontal size={15} weight="bold" />
          )}
          {isFilterActive && <span className="active-dot-nothing" />}
        </button>
      </div>

      {/* Nothing Technical Filter Drawer */}
      {isDrawerOpen && (
        <div className="filter-drawer-nothing">
          {/* Format */}
          <div className="drawer-item-nothing">
            <span className="drawer-label-nothing">FORMAT:</span>
            <div className="drawer-types-nothing">
              <button
                className={`drawer-type-btn-nothing ${filters.mediaType === 'all' ? 'active' : ''}`}
                onClick={() => {
                  triggerHaptic('selection');
                  onFilterChange({ mediaType: 'all' });
                }}
              >
                ALL
              </button>
              <button
                className={`drawer-type-btn-nothing ${filters.mediaType === 'movie' ? 'active' : ''}`}
                onClick={() => {
                  triggerHaptic('selection');
                  onFilterChange({ mediaType: 'movie' as MediaType });
                }}
              >
                FILMS
              </button>
              <button
                className={`drawer-type-btn-nothing ${filters.mediaType === 'tv' ? 'active' : ''}`}
                onClick={() => {
                  triggerHaptic('selection');
                  onFilterChange({ mediaType: 'tv' as MediaType });
                }}
              >
                SERIES
              </button>
            </div>
          </div>

          {/* Genre Dropdown */}
          {availableGenres.length > 0 && (
            <div className="drawer-item-nothing">
              <span className="drawer-label-nothing">GENRE:</span>
              <select
                value={filters.selectedGenre}
                onChange={(e) => onFilterChange({ selectedGenre: e.target.value })}
                className="drawer-select-nothing"
              >
                <option value="all">ALL GENRES</option>
                {availableGenres.map((g) => (
                  <option key={g} value={g}>
                    {g.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort Order Dropdown */}
          <div className="drawer-item-nothing">
            <span className="drawer-label-nothing">ORDER:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as SortOption })}
              className="drawer-select-nothing"
            >
              <option value="date_added_desc">RECENTLY ADDED</option>
              <option value="date_added_asc">OLDEST ADDED</option>
              <option value="rating_desc">HIGHEST RATED</option>
              <option value="rating_asc">LOWEST RATED</option>
              <option value="release_date_desc">NEWEST RELEASE</option>
              <option value="release_date_asc">OLDEST RELEASE</option>
              <option value="title_asc">TITLE (A - Z)</option>
            </select>
          </div>

          {/* Reset Action */}
          {isFilterActive && (
            <button
              className="btn-reset-nothing"
              onClick={() => {
                triggerHaptic('selection');
                onFilterChange({
                  selectedGenre: 'all',
                  mediaType: 'all',
                  sortBy: 'date_added_desc',
                });
              }}
            >
              [RESET ALL]
            </button>
          )}
        </div>
      )}

      <style>{`
        .filter-sort-container-nothing {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        /* Nothing Segmented Track */
        .segmented-track-nothing {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 2px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          max-width: max-content;
        }

        @media (max-width: 768px) {
          .segmented-track-nothing {
            display: flex;
            width: 100%;
            max-width: 100%;
            justify-content: space-between;
          }
        }

        .segmented-btn-nothing {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--ink-2);
          padding: 6px 12px;
          border-radius: 2px;
          background: transparent;
          white-space: nowrap;
          transition: all 100ms ease;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          flex: 0 0 auto;
        }

        @media (max-width: 768px) {
          .segmented-btn-nothing {
            flex: 1 1 0;
            padding: 6px 2px;
            font-size: 0.625rem;
            justify-content: center;
          }
        }

        .segmented-btn-nothing:hover {
          color: var(--ink);
          background: var(--surface-2);
        }

        .segmented-btn-nothing.is-active {
          color: var(--bg);
          background: var(--ink);
        }

        .tab-rec-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: var(--accent);
        }

        /* Search + Filter Line */
        .search-filter-line {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .search-box-nothing {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }

        .search-icon-nothing {
          position: absolute;
          left: 12px;
          color: var(--ink-3);
          pointer-events: none;
        }

        .search-input-nothing {
          padding-left: 36px;
          padding-right: 32px;
          height: 38px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          letter-spacing: 0.04em;
          color: var(--ink);
          transition: border-color 100ms ease;
        }

        .search-input-nothing:focus {
          border-color: var(--ink);
        }

        .clear-btn-nothing {
          position: absolute;
          right: 8px;
          color: var(--ink-2);
          padding: 4px;
          border-radius: 2px;
        }

        .clear-btn-nothing:hover {
          color: var(--ink);
          background: var(--surface-2);
        }

        .filter-btn-nothing {
          position: relative;
          width: 38px;
          height: 38px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--surface);
          color: var(--ink-2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 100ms ease;
        }

        .filter-btn-nothing:hover,
        .filter-btn-nothing.active {
          border-color: var(--ink);
          color: var(--ink);
          background: var(--surface-2);
        }

        .active-dot-nothing {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent);
        }

        /* Filter Drawer */
        .filter-drawer-nothing {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 14px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--surface);
          flex-wrap: wrap;
        }

        .drawer-item-nothing {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .drawer-label-nothing {
          font-family: var(--font-mono);
          font-size: 0.625rem;
          font-weight: 700;
          color: var(--ink-3);
          letter-spacing: 0.08em;
        }

        .drawer-types-nothing {
          display: flex;
          border: 1px solid var(--border);
          border-radius: 2px;
          overflow: hidden;
          background: var(--bg);
        }

        .drawer-type-btn-nothing {
          font-family: var(--font-mono);
          padding: 4px 8px;
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--ink-2);
          background: transparent;
        }

        .drawer-type-btn-nothing.active {
          background: var(--ink);
          color: var(--bg);
        }

        .drawer-select-nothing {
          height: 28px;
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          padding: 2px 6px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 2px;
          width: auto;
          color: var(--ink);
        }

        .btn-reset-nothing {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: var(--accent);
          font-weight: 700;
          letter-spacing: 0.04em;
          margin-left: auto;
        }
      `}</style>
    </div>
  );
};
