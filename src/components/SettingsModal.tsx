import React, { useState } from 'react';
import {
  X,
  DownloadSimple,
  UploadSimple,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import { setCustomApiKey } from '../services/tmdbApi';
import { useWatchlist } from '../context/WatchlistContext';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    closeSettingsModal,
    exportWatchlistAsJSON,
    importWatchlistFromJSON,
    resetToDefaultWatchlist,
    watchlist,
    showToast,
  } = useWatchlist();

  const [customKey, setCustomKey] = useState(
    localStorage.getItem('watchlist_tmdb_api_key') || ''
  );
  const [keySaved, setKeySaved] = useState(false);

  if (!isSettingsModalOpen) return null;

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomApiKey(customKey);
    setKeySaved(true);
    showToast('API Key saved', 'success');
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        if (event.target?.result) {
          const success = importWatchlistFromJSON(event.target.result as string);
          if (success) closeSettingsModal();
        }
      };
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset watchlist to the default curated titles? Current changes will be overwritten.')) {
      resetToDefaultWatchlist();
      closeSettingsModal();
    }
  };

  return (
    <div className="modal-overlay" onClick={closeSettingsModal}>
      <div className="modal-sheet settings-modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button className="btn-minimal modal-close-btn" onClick={closeSettingsModal} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="settings-content">
          {/* TMDB API Key */}
          <div className="settings-block">
            <span className="settings-label">The Movie Database (TMDB) API</span>
            <p className="settings-desc">
              Connected out-of-the-box using the built-in free client. You may supply your personal TMDB API v3 key below.
            </p>
            <form onSubmit={handleSaveApiKey} className="api-key-row">
              <input
                type="text"
                placeholder="Custom API Key (optional)"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="api-input"
              />
              <button type="submit" className="btn-outline">
                {keySaved ? 'Saved' : 'Save'}
              </button>
            </form>
          </div>

          {/* Backup & Portability */}
          <div className="settings-block">
            <span className="settings-label">Data & Backup</span>
            <p className="settings-desc">
              Your collection is saved locally in your browser. Export a JSON backup to transfer data across devices.
            </p>
            <div className="backup-row">
              <button className="btn-outline" onClick={exportWatchlistAsJSON}>
                <DownloadSimple size={14} />
                <span>Export ({watchlist.length} titles)</span>
              </button>

              <label className="btn-outline file-label-btn">
                <UploadSimple size={14} />
                <span>Import JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* Reset */}
          <div className="settings-block">
            <span className="settings-label">Curated Vault</span>
            <p className="settings-desc">
              Reset your watchlist to default sample titles.
            </p>
            <button className="btn-minimal reset-action-btn" onClick={handleReset}>
              <ArrowsClockwise size={14} />
              <span>Restore default sample vault</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .settings-modal-sheet {
          max-width: 540px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
        }

        .settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }

        .settings-title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 400;
          color: var(--ink);
        }

        .settings-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .settings-block {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .settings-label {
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--ink-2);
          font-weight: 600;
        }

        .settings-desc {
          font-size: 0.8125rem;
          color: var(--ink-2);
          line-height: 1.5;
        }

        .api-key-row {
          display: flex;
          gap: 8px;
        }

        .api-input {
          font-size: 0.8125rem;
          height: 36px;
        }

        .backup-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .file-label-btn {
          cursor: pointer;
        }

        .reset-action-btn {
          align-self: flex-start;
          color: var(--ink-2);
          font-size: 0.75rem;
        }

        .reset-action-btn:hover {
          color: var(--accent);
        }
      `}</style>
    </div>
  );
};
