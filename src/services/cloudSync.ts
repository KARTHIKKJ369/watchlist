import type { WatchlistItem } from '../types';

const AUTH_TOKEN_KEY = 'frame_auth_token';
const AUTH_USER_KEY = 'frame_auth_user';

// In production hosted on Cloudflare Workers/Pages, API is at relative root /api or custom env
export const getWorkerApiUrl = (): string => {
  return (
    (import.meta as any).env?.VITE_API_URL ||
    localStorage.getItem('frame_worker_api_url') ||
    ''
  );
};

export const getAuthToken = (): string => {
  return localStorage.getItem(AUTH_TOKEN_KEY) || '';
};

export const getAuthUser = (): { id: string; username: string } | null => {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const logoutCloudUser = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

export const registerCloudUser = async (
  username: string,
  pass: string
): Promise<{ success: boolean; error?: string; user?: { id: string; username: string } }> => {
  const apiUrl = getWorkerApiUrl();

  try {
    const res = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: pass }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Registration failed' };
    }

    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    return { success: true, user: data.user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unable to connect to server' };
  }
};

export const loginCloudUser = async (
  username: string,
  pass: string
): Promise<{ success: boolean; error?: string; user?: { id: string; username: string } }> => {
  const apiUrl = getWorkerApiUrl();

  try {
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: pass }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Invalid ID or password' };
    }

    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    return { success: true, user: data.user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unable to connect to server' };
  }
};

export const syncWatchlistToCloud = async (
  items: WatchlistItem[]
): Promise<{ success: boolean; error?: string; count?: number }> => {
  const apiUrl = getWorkerApiUrl();
  const token = getAuthToken();
  if (!token) return { success: false, error: 'Please sign in to sync.' };

  try {
    const res = await fetch(`${apiUrl}/api/watchlist/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Sync failed' };
    }
    return { success: true, count: data.syncedCount };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network sync error' };
  }
};

export const fetchWatchlistFromCloud = async (): Promise<{
  success: boolean;
  items?: WatchlistItem[];
  error?: string;
}> => {
  const apiUrl = getWorkerApiUrl();
  const token = getAuthToken();
  if (!token) return { success: false, error: 'Please sign in to fetch.' };

  try {
    const res = await fetch(`${apiUrl}/api/watchlist`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Fetch failed' };
    }
    return { success: true, items: data.items };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
};
