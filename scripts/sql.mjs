/** Run ad-hoc SQL against the app database:  node scripts/sql.mjs "select ..." */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATABASE_URL = readFileSync(path.join(ROOT, '.env.local'), 'utf8').match(/DATABASE_URL="([^"]+)"/)?.[1];
const sql = process.argv.slice(2).join(' ');
if (!sql) {
  console.error('Usage: node scripts/sql.mjs "<sql>"');
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL });
try {
  await client.connect();
  const res = await client.query(sql);
  const results = Array.isArray(res) ? res : [res];
  for (const r of results) {
    if (r?.rows?.length) console.table(r.rows);
    else console.log(`(${r?.rows?.length ?? 0} rows) — ${r?.command ?? ''} ${r?.rowCount ?? ''}`);
  }
} catch (e) {
  console.error('SQL ERROR:', e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
