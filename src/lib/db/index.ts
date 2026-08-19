import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type { Link, Hit, CountRow } from "./types";

export * from "./types";

declare global {
  var __db: Database.Database | undefined;
}

export const DB_PATH = path.join(process.cwd(), "data", "app.db");

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: Database.Database;
if (globalThis.__db) {
  db = globalThis.__db;
} else {
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  globalThis.__db = db;
}

db.exec(`
  CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    destination_url TEXT NOT NULL,
    redirect_mode TEXT NOT NULL DEFAULT 'direct',
    status_code INTEGER NOT NULL DEFAULT 302,
    expires_at INTEGER,
    show_ip INTEGER NOT NULL DEFAULT 0,
    hit_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS hits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    referer TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE INDEX IF NOT EXISTS idx_links_code ON links (code);
  CREATE INDEX IF NOT EXISTS idx_links_expires_at ON links (expires_at);
  CREATE INDEX IF NOT EXISTS idx_hits_link_id ON hits (link_id);
  CREATE INDEX IF NOT EXISTS idx_hits_created_at ON hits (created_at);
`);

db.exec("DROP TABLE IF EXISTS users");

export { db };

export interface Statements {
  createLink: Database.Statement<
    [string, string, string, number, number | null, number],
    void
  >;
  getLinkByCode: Database.Statement<[string], Link | undefined>;
  getLinkById: Database.Statement<[number], Link | undefined>;
  getAllLinks: Database.Statement<[], Link>;
  deleteLink: Database.Statement<[number], void>;
  deleteExpiredLinks: Database.Statement<[], void>;
  updateLinkShowIp: Database.Statement<[number, number], void>;
  updateLinkExpiresAt: Database.Statement<[number | null, number], void>;
  incrementHitCount: Database.Statement<[number], void>;

  createHit: Database.Statement<[number, string | null, string | null, string | null], void>;
  getHitsForLink: Database.Statement<[number, number, number], Hit>;
  countHitsForLink: Database.Statement<[number], CountRow>;
}

export const statements = {
  createLink: db.prepare<
    [string, string, string, number, number | null, number],
    void
  >(
    "INSERT INTO links (code, destination_url, redirect_mode, status_code, expires_at, show_ip) VALUES (?, ?, ?, ?, ?, ?)"
  ),
  getLinkByCode: db.prepare<[string], Link>("SELECT * FROM links WHERE code = ?"),
  getLinkById: db.prepare<[number], Link>("SELECT * FROM links WHERE id = ?"),
  getAllLinks: db.prepare<[], Link>(
    "SELECT * FROM links ORDER BY created_at DESC"
  ),
  deleteLink: db.prepare<[number], void>("DELETE FROM links WHERE id = ?"),
  deleteExpiredLinks: db.prepare<[], void>(
    "DELETE FROM links WHERE expires_at IS NOT NULL AND expires_at <= strftime('%s', 'now')"
  ),
  updateLinkShowIp: db.prepare<[number, number], void>(
    "UPDATE links SET show_ip = ? WHERE id = ?"
  ),
  updateLinkExpiresAt: db.prepare<[number | null, number], void>(
    "UPDATE links SET expires_at = ? WHERE id = ?"
  ),
  incrementHitCount: db.prepare<[number], void>(
    "UPDATE links SET hit_count = hit_count + 1 WHERE id = ?"
  ),

  createHit: db.prepare<[number, string | null, string | null, string | null], void>(
    "INSERT INTO hits (link_id, ip_address, user_agent, referer) VALUES (?, ?, ?, ?)"
  ),
  getHitsForLink: db.prepare<[number, number, number], Hit>(
    "SELECT * FROM hits WHERE link_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
  ),
  countHitsForLink: db.prepare<[number], CountRow>(
    "SELECT COUNT(*) as count FROM hits WHERE link_id = ?"
  )
} satisfies Statements;
