import React from 'react';
import {
  FilmStrip,
  Broadcast,
  ChartBar,
  Plus,
  Gear,
  Sun,
  Moon,
} from '@phosphor-icons/react';
import { FrameLogo } from './FrameLogo';
import { useWatchlist } from '../context/WatchlistContext';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    openAddModal,
    openSettingsModal,
    resolvedTheme,
    toggleTheme,
  } = useWatchlist();

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="navbar-bar">
        <div className="navbar-inner">
          {/* Brand Logotype */}
          <div className="navbar-brand" onClick={() => setActiveTab('watchlist')}>
            <FrameLogo size={22} className="brand-icon" />
            <span className="brand-logotype">FRAME</span>
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
            {/* Theme Toggle Button */}
            <button
              className="btn-icon-action"
              onClick={toggleTheme}
              title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun size={18} weight="regular" />
              ) : (
                <Moon size={18} weight="regular" />
              )}
            </button>

            <button
              className="btn-primary-add"
              onClick={() => openAddModal()}
            >
              <Plus size={14} weight="bold" />
              <span>Add</span>
            </button>

            <button
              className="btn-icon-action"
              onClick={openSettingsModal}
              title="Account & Vault"
              aria-label="Account Settings"
            >
              <Gear size={18} weight="regular" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (3 tab icons + theme toggle) */}
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
          transition: background-color 200ms ease, border-color 200ms ease;
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
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-icon {
          flex-shrink: 0;
        }

        .brand-logotype {
          font-family: var(--font-display);
          font-size: 1.25rem;
          color: var(--ink);
          letter-spacing: 0.08em;
          font-weight: 400;
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
          gap: 10px;
        }

        .btn-icon-action {
          color: var(--ink-2);
          padding: 7px;
          border-radius: var(--radius-sm);
          transition: color 150ms ease, background-color 150ms ease;
        }

        .btn-icon-action:hover {
          color: var(--ink);
          background: var(--surface);
        }

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

        [data-theme="light"] .btn-primary-add {
          background: oklch(56% 0.19 35 / 0.1);
        }

        .btn-primary-add:hover {
          background: var(--accent);
          color: var(--bg);
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
          transition: background-color 200ms ease, border-color 200ms ease;
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
