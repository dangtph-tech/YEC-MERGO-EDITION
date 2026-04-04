import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDb() {
  const db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject TEXT,
      content TEXT,
      delay INTEGER DEFAULT 1000,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER,
      email TEXT NOT NULL,
      name TEXT,
      placeholders TEXT,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      subject TEXT,
      content TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    await db.exec("ALTER TABLE campaigns ADD COLUMN attachments TEXT;");
  } catch (err) {
    // Column may already exist, ignore error
  }

  return db;
}

export { setupDb };
