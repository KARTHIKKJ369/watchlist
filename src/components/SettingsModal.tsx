import React, { useState, useEffect } from 'react';
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

    // Save region preference
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
      showToast(`Welcome back, @${res.user.username}`, 'success');
      // Auto-sync current watchlist
      syncWatchlistToCloud(watchlist);
    } else {
      showToast(res.error || 'Authentication failed', 'error');
    }
  };

  const handleCloudLogout = () => {
    logoutCloudUser();
    setCloudUser(null);
    showToast('Signed out of cloud vault', 'info');
  };

  const handlePushToCloud = async () => {
    setIsSyncing(true);
    const res = await syncWatchlistToCloud(watchlist);
    setIsSyncing(false);
    if (res.success) {
      showToast(`Synced ${watchlist.length} titles to your cloud account`, 'success');
    } else {
      showToast(res.error || 'Sync failed', 'error');
    }
  };

  const handlePullFromCloud = async () => {
    setIsSyncing(true);
    const res = await fetchWatchlistFromCloud();
    setIsSyncing(false);
    if (res.success && res.items) {
      importWatchlistFromJSON(JSON.stringify(res.items));
      showToast(`Restored ${res.items.length} titles from cloud account`, 'success');
    } else {
      showToast(res.error || 'Fetch failed', 'error');
    }
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

  const handleRegionChange = (newReg: string) => {
    setRegion(newReg);
    setSelectedRegionInput(newReg);
  };

  return (
    <div className="modal-overlay" onClick={closeSettingsModal}>
      <div className="modal-sheet settings-modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-header">
          <h2 className="settings-title">Account & Vault</h2>
          <button className="btn-minimal modal-close-btn" onClick={closeSettingsModal} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="settings-content">
          {/* Streaming Region & Localization */}
          <div className="settings-block">
            <div className="region-header-row">
              <span className="settings-label">Streaming Region & Country</span>
              <GlobeHemisphereWest size={16} color="var(--accent)" />
            </div>
            <p className="settings-desc">
              Select your country to see accurate where-to-watch streaming releases (OTT) and local certification.
            </p>
            <div className="region-select-wrapper">
              <select
                value={region}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="region-dropdown"
              >
                {SUPPORTED_REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divider-line" />

          {/* Cloud Account & Multi-Device Sync */}
          <div className="settings-block">
            <span className="settings-label">Cloud Sync & Account</span>
            <p className="settings-desc">
              Sign in with a simple ID and password to access and sync your personal cinema vault across your phone, tablet, and desktop.
            </p>

            {cloudUser ? (
              <div className="cloud-session-box">
                <div className="session-user-line">
                  <div className="user-profile-info">
                    <User size={18} color="var(--accent)" weight="bold" />
                    <span className="user-badge">@{cloudUser.username}</span>
                  </div>
                  <button className="btn-minimal logout-btn" onClick={handleCloudLogout}>
                    <SignOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>

                <div className="sync-actions-row">
                  <button className="btn-outline sync-btn" onClick={handlePushToCloud} disabled={isSyncing}>
                    <ArrowClockwise size={14} className={isSyncing ? 'spinning' : ''} />
                    <span>Sync Vault ({watchlist.length} titles)</span>
                  </button>
                  <button className="btn-minimal restore-cloud-btn" onClick={handlePullFromCloud} disabled={isSyncing}>
                    <span>Restore from cloud</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="cloud-auth-form">
                <div className="auth-mode-toggle">
                  <button
                    type="button"
                    className={`auth-mode-btn ${authMode === 'login' ? 'active' : ''}`}
                    onClick={() => setAuthMode('login')}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className={`auth-mode-btn ${authMode === 'register' ? 'active' : ''}`}
                    onClick={() => setAuthMode('register')}
                  >
                    Create Free Account
                  </button>
                </div>

                <div className="auth-inputs-grid">
                  <input
                    type="text"
                    placeholder="User ID / Username"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="api-input"
                    autoComplete="username"
                  />
                  <div className="password-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="api-input password-input"
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      className="btn-show-password"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="auth-region-field">
                  <label className="auth-field-label">Your Region / Country</label>
                  <select
                    value={selectedRegionInput}
                    onChange={(e) => setSelectedRegionInput(e.target.value)}
                    className="region-dropdown"
                  >
                    {SUPPORTED_REGIONS.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn-primary-auth" disabled={isAuthLoading}>
                  {isAuthLoading
                    ? 'Connecting...'
                    : authMode === 'login'
                    ? 'Sign In & Sync'
                    : 'Create Account'}
                </button>
              </form>
            )}
          </div>

          <div className="divider-line" />

          {/* Backup & Portability */}
          <div className="settings-block">
            <span className="settings-label">Offline Backup & Export</span>
            <p className="settings-desc">
              Export an offline JSON vault file or restore from a previously downloaded backup.
            </p>
            <div className="backup-row">
              <button className="btn-outline" onClick={exportWatchlistAsJSON}>
                <DownloadSimple size={14} />
                <span>Export JSON ({watchlist.length})</span>
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

        </div>
      </div>

      <style>{`
        .settings-modal-sheet {
          max-width: 480px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 64px oklch(0% 0 0 / 0.8);
        }

        .settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          background: var(--bg);
          z-index: 10;
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
          gap: 20px;
        }

        .settings-block {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .region-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
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

        .region-dropdown {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--ink);
          font-size: 0.8125rem;
          height: 38px;
          padding: 0 12px;
          cursor: pointer;
          width: 100%;
        }

        .region-dropdown:focus {
          border-color: var(--accent);
        }

        .auth-region-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .auth-field-label {
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--ink-2);
          font-weight: 600;
        }

        .divider-line {
          height: 1px;
          background: var(--border);
          margin: 2px 0;
        }

        /* Cloud Session Box */
        .cloud-session-box {
          padding: 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .session-user-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .user-profile-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .user-badge {
          font-family: var(--font-display);
          font-size: 1.1rem;
          color: var(--ink);
        }

        .logout-btn {
          color: var(--ink-2);
          font-size: 0.75rem;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .logout-btn:hover {
          color: oklch(65% 0.2 25);
        }

        .sync-actions-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }

        .sync-btn {
          font-size: 0.8125rem;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .restore-cloud-btn {
          font-size: 0.75rem;
          color: var(--ink-2);
        }

        .restore-cloud-btn:hover {
          color: var(--ink);
        }

        /* Cloud Auth Form */
        .cloud-auth-form {
          padding: 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .auth-mode-toggle {
          display: flex;
          gap: 16px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
        }

        .auth-mode-btn {
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--ink-2);
          background: transparent;
          position: relative;
          padding: 2px 0;
        }

        .auth-mode-btn.active {
          color: var(--accent);
          font-weight: 600;
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
          font-size: 0.8125rem;
          height: 36px;
        }

        .password-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .password-input {
          padding-right: 36px;
          width: 100%;
        }

        .btn-show-password {
          position: absolute;
          right: 4px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--ink-2);
          padding: 6px;
          border-radius: var(--radius-sm);
          background: transparent;
          cursor: pointer;
          transition: color 150ms ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-show-password:hover {
          color: var(--ink);
        }

        .btn-primary-auth {
          background: var(--accent);
          color: #ffffff;
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 9px 14px;
          border-radius: var(--radius-sm);
          transition: filter 150ms ease;
          width: 100%;
        }

        .btn-primary-auth:hover {
          filter: brightness(1.1);
        }

        .backup-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .file-label-btn {
          cursor: pointer;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
