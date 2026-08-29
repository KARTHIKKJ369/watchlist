/**
 * FRAME — Cloudflare Worker Serverless Backend
 * Features: Lightweight username + password authentication, Cloudflare D1 database storage, self-initializing schema, and vault syncing.
 */

export interface Env {
  DB?: D1Database;
  frame_db?: D1Database;
  watchlist?: D1Database;
  JWT_SECRET?: string;
  [key: string]: any;
}

// Auto-initialize tables and indexes on first request (Self-healing schema)
let tablesInitialized = false;
async function ensureTablesExist(db: D1Database) {
  if (tablesInitialized) return;
  try {
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS user_vaults (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        media_type TEXT NOT NULL,
        release_year TEXT,
        release_date TEXT,
        poster_path TEXT,
        backdrop_path TEXT,
        genres TEXT,
        overview TEXT,
        director TEXT,
        writers TEXT,
        cinematographer TEXT,
        composer TEXT,
        production_companies TEXT,
        certification TEXT,
        tagline TEXT,
        runtime INTEGER,
        number_of_seasons INTEGER,
        number_of_episodes INTEGER,
        vote_average REAL,
        vote_count INTEGER,
        status TEXT NOT NULL DEFAULT 'plan_to_watch',
        user_rating INTEGER DEFAULT 0,
        user_notes TEXT,
        rewatch_count INTEGER DEFAULT 0,
        tags TEXT,
        is_custom INTEGER DEFAULT 0,
        tmdb_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_user_vaults_user_id ON user_vaults(user_id)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`),
    ]);
    tablesInitialized = true;
  } catch (err) {
    console.warn('Auto table initialization warning (may already exist):', err);
  }
}

// Simple Web Crypto SHA-256 password hashing
async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password + 'FRAME_CINEMA_SALT_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Lightweight Token generator / validator (HMAC-SHA256 signature)
async function generateToken(userId: string, username: string, secret = 'FRAME_JWT_SECRET'): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      userId,
      username,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90, // 90 days validity
    })
  );
  const data = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${data}.${sigBase64}`;
}

async function verifyToken(
  token: string,
  secret = 'FRAME_JWT_SECRET'
): Promise<{ userId: string; username: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, sig] = parts;
    const data = `${header}.${payload}`;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
      c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data));
    if (!valid) return null;

    const decodedPayload = JSON.parse(atob(payload));
    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) return null;

    return { userId: decodedPayload.userId, username: decodedPayload.username };
  } catch {
    return null;
  }
}

// JSON response helper with CORS
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const secret = env.JWT_SECRET || 'FRAME_CINEMA_APP_2026';
    const db: D1Database | undefined =
      env.DB ||
      env.frame_db ||
      env.watchlist ||
      (Object.values(env).find(
        (val) => val && typeof val === 'object' && typeof (val as any).prepare === 'function'
      ) as D1Database | undefined);

    if (!db && path.startsWith('/api/')) {
      return jsonResponse({ error: 'D1 Database binding missing. Please attach your D1 database in Cloudflare Settings -> Bindings.' }, 500);
    }

    // Auto-ensure D1 tables exist on any API call
    if (path.startsWith('/api/') && db) {
      await ensureTablesExist(db);
    }

    // Favicon handler
    if (path === '/favicon.ico') {
      return new Response(null, { status: 204 });
    }

    // Health / Root check
    if (path === '/' || path === '/health') {
      return jsonResponse({
        status: 'online',
        service: 'FRAME Serverless Cinema Vault API',
        time: new Date().toISOString(),
      });
    }

    // 1. Authentication: Register
    if (path === '/api/auth/register' && request.method === 'POST') {
      try {
        const { username, password } = (await request.json()) as any;
        if (!username || !password || username.trim().length < 2 || password.length < 4) {
          return jsonResponse({ error: 'Username (min 2 chars) and Password (min 4 chars) required' }, 400);
        }

        const cleanUsername = username.trim().toLowerCase();
        const existing = await db!.prepare('SELECT id FROM users WHERE username = ?')
          .bind(cleanUsername)
          .first();

        if (existing) {
          return jsonResponse({ error: 'Username is already taken' }, 409);
        }

        const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const passHash = await hashPassword(password);

        await db!.prepare(
          'INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)'
        )
          .bind(userId, cleanUsername, passHash)
          .run();

        const token = await generateToken(userId, cleanUsername, secret);
        return jsonResponse({
          success: true,
          token,
          user: { id: userId, username: cleanUsername },
        });
      } catch (err: any) {
        return jsonResponse({ error: err.message || 'Registration failed' }, 500);
      }
    }

    // 2. Authentication: Login
    if (path === '/api/auth/login' && request.method === 'POST') {
      try {
        const { username, password } = (await request.json()) as any;
        if (!username || !password) {
          return jsonResponse({ error: 'Username and Password required' }, 400);
        }

        const cleanUsername = username.trim().toLowerCase();
        const user = (await db!.prepare(
          'SELECT id, username, password_hash FROM users WHERE username = ?'
        )
          .bind(cleanUsername)
          .first()) as any;

        if (!user) {
          return jsonResponse({ error: 'Invalid username or password' }, 401);
        }

        const passHash = await hashPassword(password);
        if (user.password_hash !== passHash) {
          return jsonResponse({ error: 'Invalid username or password' }, 401);
        }

        const token = await generateToken(user.id, user.username, secret);
        return jsonResponse({
          success: true,
          token,
          user: { id: user.id, username: user.username },
        });
      } catch (err: any) {
        return jsonResponse({ error: err.message || 'Login failed' }, 500);
      }
    }

    // Auth Middleware for Vault Routes
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Unauthorized: Bearer token required' }, 401);
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const session = await verifyToken(token, secret);
    if (!session) {
      return jsonResponse({ error: 'Unauthorized: Invalid or expired token' }, 401);
    }

    // 3. Vault: Sync (Push full watchlist)
    if (path === '/api/vault/sync' && request.method === 'POST') {
      try {
        const { items } = (await request.json()) as any;
        if (!Array.isArray(items)) {
          return jsonResponse({ error: 'Invalid payload: items array required' }, 400);
        }

        // Use transaction/batch for clean replacement
        const deleteStmt = db!.prepare('DELETE FROM user_vaults WHERE user_id = ?').bind(session.userId);
        const insertStmts = items.map((item: any) =>
          db!.prepare(`
            INSERT INTO user_vaults (
              id, user_id, title, media_type, release_year, release_date, poster_path, backdrop_path,
              genres, overview, director, writers, cinematographer, composer, production_companies,
              certification, tagline, runtime, number_of_seasons, number_of_episodes,
              vote_average, vote_count, status, user_rating, user_notes, rewatch_count,
              tags, is_custom, tmdb_id, updated_at
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?,
              ?, ?, ?, CURRENT_TIMESTAMP
            )
          `).bind(
            item.id || 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            session.userId,
            item.title || 'Untitled',
            item.mediaType || 'movie',
            item.releaseYear || '',
            item.releaseDate || '',
            item.posterPath || '',
            item.backdropPath || '',
            JSON.stringify(item.genres || []),
            item.overview || '',
            item.director || '',
            item.writers || '',
            item.cinematographer || '',
            item.composer || '',
            JSON.stringify(item.productionCompanies || []),
            item.certification || '',
            item.tagline || '',
            item.runtime || null,
            item.numberOfSeasons || null,
            item.numberOfEpisodes || null,
            item.voteAverage || 0,
            item.voteCount || 0,
            item.status || 'plan_to_watch',
            item.userRating || 0,
            item.userNotes || '',
            item.rewatchCount || 0,
            JSON.stringify(item.tags || []),
            item.isCustom ? 1 : 0,
            item.tmdbId || null
          )
        );

        await db!.batch([deleteStmt, ...insertStmts]);

        return jsonResponse({
          success: true,
          syncedCount: items.length,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        return jsonResponse({ error: err.message || 'Sync failed' }, 500);
      }
    }

    // 4. Vault: Fetch all saved items for authenticated user
    if (path === '/api/vault' && request.method === 'GET') {
      try {
        const { results } = await db!.prepare(
          'SELECT * FROM user_vaults WHERE user_id = ? ORDER BY created_at DESC'
        )
          .bind(session.userId)
          .all();

        const items = (results || []).map((row: any) => ({
          id: row.id,
          title: row.title,
          mediaType: row.media_type,
          releaseYear: row.release_year,
          releaseDate: row.release_date,
          posterPath: row.poster_path,
          backdropPath: row.backdrop_path,
          genres: row.genres ? JSON.parse(row.genres) : [],
          overview: row.overview,
          director: row.director,
          writers: row.writers,
          cinematographer: row.cinematographer,
          composer: row.composer,
          productionCompanies: row.production_companies ? JSON.parse(row.production_companies) : [],
          certification: row.certification,
          tagline: row.tagline,
          runtime: row.runtime,
          numberOfSeasons: row.number_of_seasons,
          numberOfEpisodes: row.number_of_episodes,
          voteAverage: row.vote_average,
          voteCount: row.vote_count,
          status: row.status,
          userRating: row.user_rating,
          userNotes: row.user_notes,
          rewatchCount: row.rewatch_count,
          tags: row.tags ? JSON.parse(row.tags) : [],
          isCustom: Boolean(row.is_custom),
          tmdbId: row.tmdb_id,
          addedAt: row.created_at,
        }));

        return jsonResponse({ success: true, items });
      } catch (err: any) {
        return jsonResponse({ error: err.message || 'Fetch failed' }, 500);
      }
    }

      return jsonResponse({ error: 'Endpoint not found' }, 404);
    } catch (err: any) {
      return jsonResponse({ error: err?.message || 'Internal Worker Error' }, 500);
    }
  },
};
