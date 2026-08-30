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
import { useWatchlist } from '../context/WatchlistContext';
import { triggerHaptic } from '../services/nativeService';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    openAddModal,
    openSettingsModal,
    isSettingsModalOpen,
    resolvedTheme,
    toggleTheme,
  } = useWatchlist();

  const handleTabChange = (tab: 'watchlist' | 'releases' | 'stats') => {
    triggerHaptic('selection');
    setActiveTab(tab);
  };

  return (
    <>
      {/* Nothing Top Navigation Bar */}
      <header className="navbar-bar">
        <div className="navbar-inner">
          {/* Brand Logotype in Doto / Space Mono */}
          <div className="navbar-brand" onClick={() => handleTabChange('watchlist')}>
            <span className="brand-dot-rec" />
            <span className="brand-logotype">FRAME</span>
            <span className="brand-edition">// OS</span>
          </div>

          {/* Desktop Navigation Links (Nothing Monochrome + Active Red Dot) */}
          <nav className="navbar-links">
            <button
              className={`nav-text-link ${activeTab === 'watchlist' ? 'active' : ''}`}
              onClick={() => handleTabChange('watchlist')}
            >
              {activeTab === 'watchlist' && <span className="nav-active-dot" />}
              <span>(01) VAULT</span>
            </button>

            <button
              className={`nav-text-link ${activeTab === 'releases' ? 'active' : ''}`}
              onClick={() => handleTabChange('releases')}
            >
              {activeTab === 'releases' && <span className="nav-active-dot" />}
              <span>(02) OTT</span>
            </button>

            <button
              className={`nav-text-link ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => handleTabChange('stats')}
            >
              {activeTab === 'stats' && <span className="nav-active-dot" />}
              <span>(03) INSIGHTS</span>
            </button>
          </nav>

          {/* Actions */}
          <div className="navbar-actions">
            {/* Theme Toggle Button */}
            <button
              className="btn-icon-tech"
              onClick={toggleTheme}
              title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun size={16} weight="bold" />
              ) : (
                <Moon size={16} weight="bold" />
              )}
            </button>

            {/* Desktop-Only Add Button with Space Mono Keycap [ ⌘K ] */}
            <button
              className="btn-tech-add desktop-only-add"
              onClick={() => {
                triggerHaptic('light');
                openAddModal();
              }}
              title="Add Media to Vault (⌘K or /)"
            >
              <Plus size={14} weight="bold" />
              <span>ADD</span>
              <span className="tech-keycap" aria-hidden="true">
                ⌘K
              </span>
            </button>

            <button
              className={`btn-icon-tech desktop-only-settings ${isSettingsModalOpen ? 'active' : ''}`}
              onClick={() => {
                triggerHaptic('light');
                openSettingsModal();
              }}
              title="Settings & System"
              aria-label="Account Settings"
            >
              <Gear size={16} weight="bold" />
            </button>
          </div>
        </div>
      </header>

      {/* Nothing Mobile Bottom Bar */}
      <nav className="mobile-nav">
        <button
          className={`mobile-icon-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
          onClick={() => handleTabChange('watchlist')}
          aria-label="Vault"
        >
          {activeTab === 'watchlist' && <span className="mobile-active-pip" />}
          <FilmStrip size={20} weight={activeTab === 'watchlist' ? 'bold' : 'regular'} />
          <span className="mobile-label">VAULT</span>
        </button>

        <button
          className={`mobile-icon-btn ${activeTab === 'releases' ? 'active' : ''}`}
          onClick={() => handleTabChange('releases')}
          aria-label="OTT Releases"
        >
          {activeTab === 'releases' && <span className="mobile-active-pip" />}
          <Broadcast size={20} weight={activeTab === 'releases' ? 'bold' : 'regular'} />
          <span className="mobile-label">OTT</span>
        </button>

        <button
          className="mobile-add-btn"
          onClick={() => {
            triggerHaptic('light');
            openAddModal();
          }}
          aria-label="Add Media"
        >
          <Plus size={20} weight="bold" />
        </button>

        <button
          className={`mobile-icon-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => handleTabChange('stats')}
          aria-label="Insights"
        >
          {activeTab === 'stats' && <span className="mobile-active-pip" />}
          <ChartBar size={20} weight={activeTab === 'stats' ? 'bold' : 'regular'} />
          <span className="mobile-label">DATA</span>
        </button>

        <button
          className={`mobile-icon-btn ${isSettingsModalOpen ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            openSettingsModal();
          }}
          aria-label="Settings"
        >
          <Gear size={20} weight={isSettingsModalOpen ? 'bold' : 'regular'} />
          <span className="mobile-label">SYSTEM</span>
        </button>
      </nav>

      <style>{`
        .navbar-bar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: var(--bg);
          border-bottom: 1px solid var(--border);
          padding-top: var(--safe-top);
          height: calc(var(--header-height) + var(--safe-top));
          transition: background-color 150ms ease, border-color 150ms ease;
        }

        .navbar-inner {
          max-width: 1280px;
          margin: 0 auto;
          height: 100%;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        @media (max-width: 768px) {
          .navbar-inner {
            padding: 0 16px;
          }
        }

        .navbar-brand {
          cursor: pointer;
          user-select: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .brand-dot-rec {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: var(--accent);
          box-shadow: 0 0 8px var(--accent);
          flex-shrink: 0;
        }

        .brand-logotype {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: 0.12em;
          line-height: 1;
        }

        .brand-edition {
          font-family: var(--font-mono);
          font-size: 0.625rem;
          color: var(--ink-3);
          letter-spacing: 0.08em;
          font-weight: 600;
        }

        .navbar-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        @media (max-width: 768px) {
          .navbar-links {
            display: none;
          }
        }

        .nav-text-link {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          letter-spacing: 0.06em;
          font-weight: 600;
          color: var(--ink-2);
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 4px;
          position: relative;
          transition: color 120ms ease;
        }

        .nav-text-link:hover {
          color: var(--ink);
        }

        .nav-text-link.active {
          color: var(--ink);
        }

        .nav-active-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: var(--accent);
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-icon-tech {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--ink-2);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 120ms ease;
        }

        .btn-icon-tech:hover,
        .btn-icon-tech.active {
          border-color: var(--ink);
          color: var(--ink);
          background: var(--surface-2);
        }

        .btn-tech-add {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          background: var(--surface);
          color: var(--ink);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 0 12px;
          height: 34px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 120ms ease;
        }

        .btn-tech-add:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: var(--surface-2);
        }

        .tech-keycap {
          font-family: var(--font-mono);
          font-size: 0.625rem;
          padding: 1px 5px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 2px;
          color: var(--ink-2);
        }

        @media (max-width: 768px) {
          .desktop-only-add,
          .desktop-only-settings {
            display: none !important;
          }
        }

        /* Mobile Bottom Nav */
        .mobile-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: var(--bg);
          border-top: 1px solid var(--border);
          padding-bottom: var(--safe-bottom);
          height: calc(var(--bottom-nav-height) + var(--safe-bottom));
          align-items: center;
          justify-content: space-around;
        }

        @media (max-width: 768px) {
          .mobile-nav {
            display: flex;
          }
        }

        .mobile-icon-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          color: var(--ink-2);
          background: transparent;
          height: 100%;
          position: relative;
        }

        .mobile-icon-btn.active {
          color: var(--ink);
        }

        .mobile-active-pip {
          position: absolute;
          top: 6px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background-color: var(--accent);
        }

        .mobile-label {
          font-family: var(--font-mono);
          font-size: 0.5625rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-weight: 600;
        }

        .mobile-add-btn {
          width: 42px;
          height: 34px;
          border-radius: var(--radius-sm);
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--ink);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 4px;
        }

        .mobile-add-btn:active {
          background: var(--accent);
          color: #ffffff;
          border-color: var(--accent);
        }
      `}</style>
    </>
  );
};
