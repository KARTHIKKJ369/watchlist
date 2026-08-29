import React from 'react';
import {
  FilmStrip,
  Broadcast,
  ChartBar,
  Plus,
  Gear,
} from '@phosphor-icons/react';
import { useWatchlist } from '../context/WatchlistContext';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    openAddModal,
    openSettingsModal,
  } = useWatchlist();

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="navbar-bar">
        <div className="navbar-inner">
          {/* Brand Logotype */}
          <div className="navbar-brand" onClick={() => setActiveTab('watchlist')}>
            <span className="brand-logotype">CINEPULSE</span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="navbar-links">
            <button
              className={`nav-text-link ${activeTab === 'watchlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('watchlist')}
            >
              Watchlist
            </button>

            <button
              className={`nav-text-link ${activeTab === 'releases' ? 'active' : ''}`}
              onClick={() => setActiveTab('releases')}
            >
              OTT
            </button>

            <button
              className={`nav-text-link ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              Insights
            </button>
          </nav>

          {/* Actions */}
          <div className="navbar-actions">
            <button
              className="btn-primary-add"
              onClick={() => openAddModal()}
            >
              <Plus size={14} weight="bold" />
              <span>Add</span>
            </button>

            <button
              className="btn-gear"
              onClick={openSettingsModal}
              title="Settings"
              aria-label="Settings"
            >
              <Gear size={18} weight="regular" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (3 icons only, no labels, no pills) */}
      <nav className="mobile-nav">
        <button
          className={`mobile-icon-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('watchlist')}
          aria-label="Watchlist"
        >
          <FilmStrip size={22} weight={activeTab === 'watchlist' ? 'fill' : 'regular'} />
        </button>

        <button
          className={`mobile-icon-btn ${activeTab === 'releases' ? 'active' : ''}`}
          onClick={() => setActiveTab('releases')}
          aria-label="OTT Releases"
        >
          <Broadcast size={22} weight={activeTab === 'releases' ? 'fill' : 'regular'} />
        </button>

        <button
          className={`mobile-icon-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
          aria-label="Insights"
        >
          <ChartBar size={22} weight={activeTab === 'stats' ? 'fill' : 'regular'} />
        </button>
      </nav>

      <style>{`
        .navbar-bar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: var(--bg);
          border-bottom: 1px solid var(--border);
          height: var(--header-height);
        }

        .navbar-inner {
          max-width: 1200px;
          margin: 0 auto;
          height: 100%;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .navbar-brand {
          cursor: pointer;
          user-select: none;
        }

        .brand-logotype {
          font-family: var(--font-display);
          font-size: 1.15rem;
          color: var(--ink);
          letter-spacing: 0.04em;
        }

        .navbar-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        @media (max-width: 768px) {
          .navbar-links {
            display: none;
          }
        }

        .nav-text-link {
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--ink-2);
          padding: 6px 0;
          position: relative;
          background: transparent;
        }

        .nav-text-link:hover {
          color: var(--ink);
        }

        .nav-text-link.active {
          color: var(--ink);
        }

        .nav-text-link.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--accent);
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Prominent primary product action */
        .btn-primary-add {
          background: oklch(68% 0.18 30 / 0.12);
          border: 1px solid var(--accent);
          color: var(--accent);
          padding: 6px 14px;
          font-size: 0.8125rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 150ms ease;
        }

        .btn-primary-add:hover {
          background: var(--accent);
          color: var(--bg);
        }

        .btn-gear {
          color: var(--ink-2);
          padding: 6px;
        }

        .btn-gear:hover {
          color: var(--ink);
        }

        /* Mobile Bottom Nav */
        .mobile-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: var(--bottom-nav-height);
          background: var(--bg);
          border-top: 1px solid var(--border);
          z-index: 60;
          padding: 0 16px;
          justify-content: space-around;
          align-items: center;
        }

        @media (max-width: 768px) {
          .mobile-nav {
            display: flex;
          }
        }

        .mobile-icon-btn {
          color: var(--ink-2);
          padding: 10px;
          background: transparent;
        }

        .mobile-icon-btn.active {
          color: var(--accent);
        }
      `}</style>
    </>
  );
};
