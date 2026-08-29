-- FRAME Cloudflare D1 Database Schema
-- Run: npx wrangler d1 execute frame_db --file=./schema.sql

-- 1. Users Table (Lightweight ID + Password authentication)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Watchlist Items Table
CREATE TABLE IF NOT EXISTS watchlist_items (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tmdb_id INTEGER,
  title TEXT NOT NULL,
  media_type TEXT NOT NULL,
  status TEXT NOT NULL,
  user_rating REAL DEFAULT 0,
  user_notes TEXT,
  rewatch_count INTEGER DEFAULT 0,
  tags_json TEXT DEFAULT '[]',
  data_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Indexes for ultra-fast query performance
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_status ON watchlist_items(user_id, status);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
