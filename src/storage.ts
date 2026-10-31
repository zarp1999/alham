import * as SQLite from 'expo-sqlite';
import { backup, emptyData, parseBackup, type Data } from './domain';

let db: SQLite.SQLiteDatabase;
export async function initialize(): Promise<{ data: Data; onboarded: boolean }> {
  db = await SQLite.openDatabaseAsync('habit-app.db');
  db.execSync(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK (id=1), payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
  const row = db.getFirstSync<{ payload: string }>('SELECT payload FROM state WHERE id=1');
  const onboarded = !!db.getFirstSync("SELECT value FROM preferences WHERE key='onboarded'");
  return { data: row ? parseBackup(row.payload) : emptyData(), onboarded };
}
export function persist(data: Data) {
  db.runSync('INSERT INTO state(id,payload) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload', backup(data));
}
export function finishOnboarding() {
  db.runSync("INSERT OR REPLACE INTO preferences(key,value) VALUES('onboarded','1')");
}

// Commit the first habit and onboarding flag together so an interrupted save cannot skip setup.
export function persistFirstHabit(data: Data) {
  db.withTransactionSync(() => { persist(data); finishOnboarding(); });
}
export function readPreference(key: string) { return db.getFirstSync<{ value: string }>('SELECT value FROM preferences WHERE key=?', key)?.value ?? null; }
export function writePreference(key: string, value: string) { db.runSync('INSERT OR REPLACE INTO preferences(key,value) VALUES(?,?)', key, value); }

export function persistTimerRecord(data: Data) { db.withTransactionSync(() => { persist(data); writePreference('timer', 'null'); }); }
