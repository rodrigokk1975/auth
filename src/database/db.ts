import Database, { type Database as DatabaseType } from "better-sqlite3";
import path from "node:path";

let dbInstance: DatabaseType | null = null;

export function initTables(db: DatabaseType): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
  `);
}

export function getDatabase(dbPath?: string): DatabaseType {
  if (!dbInstance) {
    const targetPath = dbPath ?? path.resolve(process.cwd(), "database.sqlite");
    dbInstance = new Database(targetPath);
    dbInstance.pragma("journal_mode = WAL");
    dbInstance.pragma("foreign_keys = ON");
    initTables(dbInstance);
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
