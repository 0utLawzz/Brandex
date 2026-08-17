/**
 * Safe migration: adds client_name and case_type columns to trademarks table.
 * These are nullable, so existing data is unaffected.
 */
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const dbUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!dbUrl) throw new Error('DATABASE_URL is not set');

const client = new pg.Client({ connectionString: dbUrl });
await client.connect();

const sql = `
  ALTER TABLE trademarks
    ADD COLUMN IF NOT EXISTS client_name TEXT,
    ADD COLUMN IF NOT EXISTS case_type   TEXT;
`;

console.log('Running migration...');
await client.query(sql);
console.log('✅ Columns client_name and case_type added (or already existed).');
await client.end();
