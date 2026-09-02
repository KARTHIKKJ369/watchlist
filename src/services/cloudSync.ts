import type { WatchlistItem } from '../types';

const AUTH_TOKEN_KEY = 'frame_auth_token';
const AUTH_USER_KEY = 'frame_auth_user';

const DEFAULT_WORKER_URL = 'https://watchlist.klkarthik369.workers.dev';

export const getWorkerApiUrl = (): string => {
  let url = (
    (import.meta as any).env?.VITE_API_URL ||
    localStorage.getItem('frame_worker_url') ||
    ''
  ).trim().replace(/\/+$/, '');

  if (!url && typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    if (!origin.includes('localhost') && !origin.startsWith('capacitor://') && !origin.startsWith('http://localhost')) {
      return origin;
    }
  }

  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  return url || DEFAULT_WORKER_URL;
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

// Safe JSON parser for HTTP responses
async function parseResponseSafe(res: Response): Promise<{ ok: boolean; status: number; data: any; error?: string }> {
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || `Server returned HTTP ${res.status}` };
  }
  return { ok: res.ok, status: res.status, data, error: data?.error };
}

export const registerCloudUser = async (
  username: string,
  pass: string
): Promise<{ success: boolean; error?: string; user?: { id: string; username: string } }> => {
  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 2 || pass.length < 4) {
    return { success: false, error: 'Username (min 2 chars) and Password (min 4 chars) required' };
  }

  const apiUrl = getWorkerApiUrl();
  if (!apiUrl) {
    return { success: false, error: 'Worker API URL not set in VITE_API_URL' };
  }

  try {
    const res = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanUsername, password: pass }),
    });
    const parsed = await parseResponseSafe(res);
    if (!parsed.ok) {
      return { success: false, error: parsed.data?.error || `Registration failed (${parsed.status})` };
    }

    localStorage.setItem(AUTH_TOKEN_KEY, parsed.data.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(parsed.data.user));
    return { success: true, user: parsed.data.user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unable to connect to Cloudflare Worker API' };
  }
};

export const loginCloudUser = async (
  username: string,
  pass: string
): Promise<{ success: boolean; error?: string; user?: { id: string; username: string } }> => {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername || !pass) {
    return { success: false, error: 'Please enter both User ID and Password' };
  }

  const apiUrl = getWorkerApiUrl();
  if (!apiUrl) {
    return { success: false, error: 'Worker API URL not set in VITE_API_URL' };
  }

  try {
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanUsername, password: pass }),
    });
    const parsed = await parseResponseSafe(res);
    if (!parsed.ok) {
      return { success: false, error: parsed.data?.error || 'Invalid User ID or Password' };
    }

    localStorage.setItem(AUTH_TOKEN_KEY, parsed.data.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(parsed.data.user));
    return { success: true, user: parsed.data.user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unable to connect to Cloudflare Worker API' };
  }
};

export const syncWatchlistToCloud = async (
  items: WatchlistItem[]
): Promise<{ success: boolean; error?: string; count?: number }> => {
  const apiUrl = getWorkerApiUrl();
  const token = getAuthToken();
  const user = getAuthUser();
  if (!token || !user) return { success: false, error: 'Please sign in to sync your vault.' };
  if (!apiUrl) return { success: false, error: 'Worker API URL not set in VITE_API_URL' };

  try {
    const res = await fetch(`${apiUrl}/api/vault/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items }),
    });
    const parsed = await parseResponseSafe(res);
    if (!parsed.ok) {
      return { success: false, error: parsed.data?.error || 'Sync failed' };
    }
    return { success: true, count: parsed.data.syncedCount || items.length };
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
  const user = getAuthUser();
  if (!token || !user) return { success: false, error: 'Please sign in to restore your vault.' };
  if (!apiUrl) return { success: false, error: 'Worker API URL not set in VITE_API_URL' };

  try {
    const res = await fetch(`${apiUrl}/api/vault`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const parsed = await parseResponseSafe(res);
    if (!parsed.ok) {
      return { success: false, error: parsed.data?.error || 'Fetch failed' };
    }
    return { success: true, items: parsed.data.items || [] };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
};
