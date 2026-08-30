import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  DownloadSimple,
  UploadSimple,
  User,
  SignOut,
  ArrowClockwise,
  GlobeHemisphereWest,
  Eye,
  EyeSlash,
  Cloud,
} from '@phosphor-icons/react';
import {
  getAuthUser,
  loginCloudUser,
  registerCloudUser,
  logoutCloudUser,
  syncWatchlistToCloud,
  fetchWatchlistFromCloud,
} from '../services/cloudSync';
import { useWatchlist } from '../context/WatchlistContext';
import { triggerHaptic } from '../services/nativeService';

export const SUPPORTED_REGIONS = [
  { code: 'US', name: 'United States (US)' },
  { code: 'IN', name: 'India (IN)' },
  { code: 'GB', name: 'United Kingdom (GB)' },
  { code: 'CA', name: 'Canada (CA)' },
  { code: 'AU', name: 'Australia (AU)' },
  { code: 'DE', name: 'Germany (DE)' },
  { code: 'FR', name: 'France (FR)' },
  { code: 'JP', name: 'Japan (JP)' },
  { code: 'BR', name: 'Brazil (BR)' },
  { code: 'MX', name: 'Mexico (MX)' },
  { code: 'KR', name: 'South Korea (KR)' },
  { code: 'ES', name: 'Spain (ES)' },
  { code: 'IT', name: 'Italy (IT)' },
];

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    closeSettingsModal,
    exportWatchlistAsJSON,
    importWatchlistFromJSON,
    watchlist,
    setWatchlist,
    showToast,
    region,
    setRegion,
  } = useWatchlist();

  // Cloud Account State
  const [cloudUser, setCloudUser] = useState<{ id: string; username: string } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRegionInput, setSelectedRegionInput] = useState(region);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (isSettingsModalOpen) {
      setCloudUser(getAuthUser());
      setSelectedRegionInput(region);
    }
  }, [isSettingsModalOpen, region]);

  if (!isSettingsModalOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) {
      showToast('Please enter your user ID and password', 'error');
      return;
    }

    if (selectedRegionInput) {
      setRegion(selectedRegionInput);
    }

    setIsAuthLoading(true);

    const res =
      authMode === 'register'
        ? await registerCloudUser(usernameInput, passwordInput)
        : await loginCloudUser(usernameInput, passwordInput);

    setIsAuthLoading(false);

    if (res.success && res.user) {
      setCloudUser(res.user);
      setUsernameInput('');
      setPasswordInput('');

      const cloudRes = await fetchWatchlistFromCloud();
      if (cloudRes.success && cloudRes.items && cloudRes.items.length > 0) {
        const cloudItems = cloudRes.items;
        setWatchlist((localList) => {
          const map = new Map();
          localList.forEach((item) => map.set(item.tmdbId ? `tmdb-${item.tmdbId}` : item.id, item));
          cloudItems.forEach((item) => map.set(item.tmdbId ? `tmdb-${item.tmdbId}` : item.id, item));
          return Array.from(map.values());
        });
      }

      showToast(
        authMode === 'register' ? 'Account created & synced!' : 'Signed in successfully',
        'success'
      );
    } else {
      showToast(res.error || 'Authentication failed', 'error');
    }
  };

  const handleCloudLogout = () => {
    logoutCloudUser();
    setCloudUser(null);
    showToast('Signed out of cloud account', 'info');
  };

  const handlePushToCloud = async () => {
    setIsSyncing(true);
    triggerHaptic('light');
    const res = await syncWatchlistToCloud(watchlist);
    setIsSyncing(false);
    if (res.success) {
      showToast(`Cloud vault synced (${watchlist.length} titles)`, 'success');
    } else {
      showToast(res.error || 'Sync failed', 'error');
    }
  };

  const handlePullFromCloud = async () => {
    setIsSyncing(true);
    triggerHaptic('light');
    const res = await fetchWatchlistFromCloud();
    setIsSyncing(false);
    if (res.success && res.items) {
      setWatchlist(res.items);
      showToast(`Restored ${res.items.length} titles from cloud`, 'success');
    } else {
      showToast(res.error || 'Fetch failed', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const success = importWatchlistFromJSON(content);
          if (success) {
            showToast('Successfully imported titles into Vault', 'success');
          }
        }
      };
    }
  };

  const handleRegionChange = (newReg: string) => {
    setRegion(newReg);
    setSelectedRegionInput(newReg);
    triggerHaptic('selection');
  };

  return (
    <div className="modal-overlay" onClick={closeSettingsModal}>
      <motion.div
        className="modal-sheet settings-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.99 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="settings-header">
          <div className="settings-title-wrap">
            <span className="rec-dot-title" />
            <h2 className="settings-title">SYSTEM // SETTINGS</h2>
          </div>
          <button className="modal-close-btn-tech" onClick={closeSettingsModal} aria-label="Close">
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Content Body */}
        <div className="settings-content">
          {/* 1. Streaming Region & Localization */}
          <div className="settings-block">
            <div className="block-header-row">
              <span className="settings-label">// STREAMING REGION & LOCALIZATION</span>
              <GlobeHemisphereWest size={15} color="var(--accent)" weight="bold" />
            </div>
            <p className="settings-desc">
              Select your region to see accurate where-to-watch streaming releases (OTT) and local certification.
            </p>
            <div className="select-wrap-tech">
              <select
                value={selectedRegionInput}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="region-dropdown-tech"
              >
                {SUPPORTED_REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Cloud Sync & Multi-Device */}
          <div className="settings-block">
            <div className="block-header-row">
              <span className="settings-label">// CLOUD SYNC & MULTI-DEVICE</span>
              <Cloud size={15} color="var(--accent)" weight="bold" />
            </div>
            <p className="settings-desc">
              Sign in to automatically synchronize your personal cinema vault across your mobile phone, tablet, and desktop browser.
            </p>

            {cloudUser ? (
              <div className="cloud-session-box">
                <div className="session-user-line">
                  <div className="user-profile-info">
                    <User size={16} weight="bold" color="var(--accent)" />
                    <span className="user-badge">@{cloudUser.username}</span>
                  </div>
                  <button className="logout-btn-tech" onClick={handleCloudLogout}>
                    <SignOut size={14} weight="bold" />
                    <span>[SIGN OUT]</span>
                  </button>
                </div>

                <div className="peer-actions-grid">
                  <button
                    className="btn-action-tech primary"
                    onClick={handlePushToCloud}
                    disabled={isSyncing}
                  >
                    <ArrowClockwise size={14} weight="bold" className={isSyncing ? 'spinning' : ''} />
                    <span>SYNC ({watchlist.length})</span>
                  </button>

                  <button
                    className="btn-action-tech"
                    onClick={handlePullFromCloud}
                    disabled={isSyncing}
                  >
                    <DownloadSimple size={14} weight="bold" />
                    <span>RESTORE CLOUD</span>
                  </button>
                </div>
              </div>
            ) : (
              <form className="cloud-auth-form" onSubmit={handleAuthSubmit}>
                <div className="auth-mode-toggle">
                  <button
                    type="button"
                    className={`auth-mode-btn ${authMode === 'login' ? 'active' : ''}`}
                    onClick={() => setAuthMode('login')}
                  >
                    [SIGN IN]
                  </button>
                  <button
                    type="button"
                    className={`auth-mode-btn ${authMode === 'register' ? 'active' : ''}`}
                    onClick={() => setAuthMode('register')}
                  >
                    [CREATE ACCOUNT]
                  </button>
                </div>

                <div className="auth-inputs-grid">
                  <input
                    type="text"
                    placeholder="USERNAME"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="api-input"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                  <div className="password-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="PASSWORD"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="api-input password-input"
                    />
                    <button
                      type="button"
                      className="btn-show-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeSlash size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary-auth"
                  disabled={isAuthLoading}
                >
                  {isAuthLoading ? (
                    <ArrowClockwise size={15} className="spinning" />
                  ) : authMode === 'register' ? (
                    'CREATE CLOUD VAULT'
                  ) : (
                    'SIGN IN & SYNC'
                  )}
                </button>
              </form>
            )}
          </div>

          {/* 3. Offline Backup & Portability */}
          <div className="settings-block">
            <div className="block-header-row">
              <span className="settings-label">// OFFLINE BACKUP & DATA PORTABILITY</span>
              <DownloadSimple size={15} color="var(--ink-2)" weight="bold" />
            </div>
            <p className="settings-desc">
              Export an offline JSON vault file or restore from a previously downloaded backup at any time.
            </p>

            <div className="peer-actions-grid">
              <button
                className="btn-action-tech"
                onClick={() => exportWatchlistAsJSON()}
                title="Export your entire watchlist as a JSON file"
              >
                <DownloadSimple size={14} weight="bold" />
                <span>EXPORT JSON ({watchlist.length})</span>
              </button>

              <label className="btn-action-tech file-label-btn">
                <UploadSimple size={14} weight="bold" />
                <span>IMPORT JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        .settings-modal-sheet {
          max-width: 580px;
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow-y: auto;
          max-height: 88vh;
        }

        @media (max-width: 768px) {
          .settings-modal-sheet {
            height: 100vh;
            max-height: 100vh;
            max-width: 100vw;
            border-radius: 0;
            border: none;
          }

          .settings-header {
            padding-top: max(16px, calc(12px + var(--safe-top)));
          }
        }

        .settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          background: var(--surface);
          z-index: 10;
        }

        .settings-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rec-dot-title {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--accent);
          box-shadow: 0 0 6px var(--accent);
        }

        .settings-title {
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: 0.04em;
          margin: 0;
        }

        .modal-close-btn-tech {
          width: 30px;
          height: 30px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--surface-2);
          color: var(--ink-2);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 100ms ease;
        }

        .modal-close-btn-tech:hover {
          color: var(--ink);
          border-color: var(--ink-2);
        }

        .settings-content {
          padding: 20px 20px calc(24px + var(--safe-bottom)) 20px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .settings-block {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }

        .settings-block:last-child {
          padding-bottom: 0;
          border-bottom: none;
        }

        .block-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .settings-label {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          letter-spacing: 0.06em;
          color: var(--ink-2);
          font-weight: 700;
        }

        .settings-desc {
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          color: var(--ink-2);
          line-height: 1.45;
        }

        .select-wrap-tech {
          margin-top: 4px;
        }

        .region-dropdown-tech {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--ink);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          height: 40px;
          padding: 0 12px;
          cursor: pointer;
          width: 100%;
        }

        .region-dropdown-tech:focus {
          border-color: var(--ink-2);
        }

        /* Unified High-Contrast Action Buttons */
        .peer-actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 6px;
        }

        .btn-action-tech {
          height: 38px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--surface-2);
          color: var(--ink);
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 100ms ease;
          user-select: none;
        }

        .btn-action-tech:hover {
          border-color: var(--ink-2);
          background: var(--surface-3);
        }

        .btn-action-tech.primary {
          background: var(--ink);
          color: var(--bg);
          border-color: var(--ink);
        }

        .btn-action-tech.primary:hover {
          filter: brightness(0.9);
        }

        .file-label-btn {
          margin: 0;
        }

        /* Cloud Session Box */
        .cloud-session-box {
          padding: 12px 14px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .session-user-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .user-profile-info {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .user-badge {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: 0.02em;
        }

        .logout-btn-tech {
          font-family: var(--font-mono);
          color: var(--ink-3);
          font-size: 0.6875rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .logout-btn-tech:hover {
          color: var(--accent);
        }

        /* Cloud Auth Form */
        .cloud-auth-form {
          padding: 14px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .auth-mode-toggle {
          display: flex;
          gap: 12px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
        }

        .auth-mode-btn {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--ink-3);
          background: transparent;
          padding: 2px 0;
        }

        .auth-mode-btn.active {
          color: var(--ink);
        }

        .auth-inputs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        @media (max-width: 480px) {
          .auth-inputs-grid {
            grid-template-columns: 1fr;
          }
        }

        .api-input {
          height: 36px;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 0 10px;
          color: var(--ink);
        }

        .api-input:focus {
          border-color: var(--ink-2);
        }

        .password-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-input {
          padding-right: 32px;
          width: 100%;
        }

        .btn-show-password {
          position: absolute;
          right: 6px;
          color: var(--ink-3);
          padding: 4px;
          background: transparent;
          border: none;
        }

        .btn-primary-auth {
          height: 36px;
          font-family: var(--font-mono);
          background: var(--ink);
          color: var(--bg);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          border: none;
          transition: filter 100ms ease;
        }

        .btn-primary-auth:hover {
          filter: brightness(0.9);
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
