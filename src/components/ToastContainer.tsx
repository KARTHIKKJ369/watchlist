import React from 'react';
import { CheckCircle, Info, WarningCircle, X } from '@phosphor-icons/react';
import { useWatchlist } from '../context/WatchlistContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useWatchlist();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast-minimal">
          <div className="toast-lead-icon">
            {toast.type === 'success' && <CheckCircle size={16} weight="fill" className="icon-accent" />}
            {toast.type === 'info' && <Info size={16} weight="fill" />}
            {toast.type === 'error' && <WarningCircle size={16} weight="fill" />}
          </div>
          <span className="toast-text">{toast.message}</span>
          <button
            className="toast-dismiss"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
          >
            <X size={12} />
          </button>
        </div>
      ))}

      <style>{`
        .toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 120;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 320px;
          width: calc(100% - 48px);
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .toast-container {
            bottom: calc(var(--bottom-nav-height) + 16px);
            right: 16px;
            left: 16px;
            width: auto;
          }
        }

        .toast-minimal {
          padding: 10px 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          box-shadow: 0 8px 24px oklch(0% 0 0 / 0.5);
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.8125rem;
          color: var(--ink);
          pointer-events: auto;
        }

        .icon-accent {
          color: var(--accent);
        }

        .toast-text {
          flex: 1;
        }

        .toast-dismiss {
          color: var(--ink-2);
          padding: 2px;
        }

        .toast-dismiss:hover {
          color: var(--ink);
        }
      `}</style>
    </div>
  );
};
