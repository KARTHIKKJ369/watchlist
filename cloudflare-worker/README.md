# FRAME — Cloudflare Workers & D1 Database Setup

This folder contains the complete serverless backend for **FRAME**, providing:
- Simple username + password authentication (no OAuth or complex signup needed).
- Cloudflare D1 serverless database for multi-device watchlist syncing.
- Instant cloud vault backup and sync.

---

## 🚀 Quick Setup (3 Minutes)

### 1. Create your Cloudflare D1 Database
From this `cloudflare-worker` directory (or workspace root), run:
```bash
npx wrangler d1 create frame_db
```
Wrangler will output something like:
```toml
[[d1_databases]]
binding = "DB"
database_name = "frame_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 2. Update `wrangler.toml`
Paste the `database_id` from step 1 into `cloudflare-worker/wrangler.toml`.

### 3. Initialize the Database Schema
Run:
```bash
npx wrangler d1 execute frame_db --file=./schema.sql
```

### 4. Deploy your Worker
Run:
```bash
npx wrangler deploy
```
You will receive your live worker URL (e.g. `https://frame-api.your-account.workers.dev`).

### 5. Connect to Frontend
Open **FRAME** in your browser, go to **Settings** (`⚙` icon), and enter your Worker URL (or paste it into your local storage config). You can now register a simple ID + password and sync your vault from any device!
