import type { WatchlistItem } from '../types';

const AUTH_TOKEN_KEY = 'frame_auth_token';
const AUTH_USER_KEY = 'frame_auth_user';
const LOCAL_USERS_KEY = 'frame_local_vault_users';
const LOCAL_VAULT_KEY = 'frame_local_cloud_vault_';

export const getWorkerApiUrl = (): string => {
  return (
    (import.meta as any).env?.VITE_API_URL ||
    localStorage.getItem('frame_worker_api_url') ||
    ''
  ).replace(/\/+$/, ''); // trim trailing slash
};

export const setWorkerApiUrl = (url: string) => {
  if (url.trim()) {
    localStorage.setItem('frame_worker_api_url', url.trim().replace(/\/+$/, ''));
  } else {
    localStorage.removeItem('frame_worker_api_url');
  }
};

export const getAuthToken = (): string => {
  return localStorage.getItem(AUTH_TOKEN_KEY) || '';
};

export const getAuthUser = (): { id: string; username: string; isLocal?: boolean } | null => {
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

// Local Web Crypto SHA-256 for local offline authentication
async function hashLocalPassword(pass: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(pass + 'FRAME_LOCAL_VAULT_SALT');
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function getStoredLocalUsers(): Record<string, { id: string; username: string; hash: string }> {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Safe JSON parser for HTTP responses
async function parseResponseSafe(res: Response): Promise<{ ok: boolean; status: number; data: any; error?: string }> {
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || `Server returned status ${res.status}` };
  }
  return { ok: res.ok, status: res.status, data, error: data?.error };
}

export const registerCloudUser = async (
  username: string,
  pass: string
): Promise<{ success: boolean; error?: string; user?: { id: string; username: string; isLocal?: boolean } }> => {
  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 2 || pass.length < 4) {
    return { success: false, error: 'Username (min 2 chars) and Password (min 4 chars) required' };
  }

  const apiUrl = getWorkerApiUrl();

  // If a live Cloudflare Worker URL is configured, use it
  if (apiUrl) {
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
  }

  // Local Offline Account Fallback (Zero Setup)
  try {
    const localUsers = getStoredLocalUsers();
    if (localUsers[cleanUsername]) {
      return { success: false, error: 'User ID is already registered locally' };
    }

    const passHash = await hashLocalPassword(pass);
    const userId = 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const userObj = { id: userId, username: cleanUsername, isLocal: true };

    localUsers[cleanUsername] = { id: userId, username: cleanUsername, hash: passHash };
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));

    localStorage.setItem(AUTH_TOKEN_KEY, 'local_token_' + userId);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userObj));

    return { success: true, user: userObj };
  } catch (err: any) {
    return { success: false, error: err.message || 'Local registration failed' };
  }
};

export const loginCloudUser = async (
  username: string,
  pass: string
): Promise<{ success: boolean; error?: string; user?: { id: string; username: string; isLocal?: boolean } }> => {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername || !pass) {
    return { success: false, error: 'Please enter both User ID and Password' };
  }

  const apiUrl = getWorkerApiUrl();

  // If a live Cloudflare Worker URL is configured, use it
  if (apiUrl) {
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
  }

  // Local Offline Account Fallback (Zero Setup)
  try {
    const localUsers = getStoredLocalUsers();
    const existing = localUsers[cleanUsername];
    if (!existing) {
      return { success: false, error: 'User ID not found. Click "Create New Account" to register.' };
    }

    const passHash = await hashLocalPassword(pass);
    if (existing.hash !== passHash) {
      return { success: false, error: 'Invalid password. Please try again.' };
    }

    const userObj = { id: existing.id, username: existing.username, isLocal: true };
    localStorage.setItem(AUTH_TOKEN_KEY, 'local_token_' + existing.id);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userObj));

    return { success: true, user: userObj };
  } catch (err: any) {
    return { success: false, error: err.message || 'Local sign in failed' };
  }
};

export const syncWatchlistToCloud = async (
  items: WatchlistItem[]
): Promise<{ success: boolean; error?: string; count?: number }> => {
  const apiUrl = getWorkerApiUrl();
  const token = getAuthToken();
  const user = getAuthUser();
  if (!token || !user) return { success: false, error: 'Please sign in to sync your vault.' };

  // If live Cloudflare Worker is connected:
  if (apiUrl) {
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
  }

  // Local sync fallback
  try {
    localStorage.setItem(LOCAL_VAULT_KEY + user.id, JSON.stringify(items));
    return { success: true, count: items.length };
  } catch (err: any) {
    return { success: false, error: err.message || 'Local vault sync error' };
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

  // If live Cloudflare Worker is connected:
  if (apiUrl) {
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
  }

  // Local fetch fallback
  try {
    const raw = localStorage.getItem(LOCAL_VAULT_KEY + user.id);
    const items = raw ? JSON.parse(raw) : [];
    return { success: true, items };
  } catch (err: any) {
    return { success: false, error: err.message || 'Local restore error' };
  }
};
