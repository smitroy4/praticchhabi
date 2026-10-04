import { readFileSync } from 'node:fs';
import pg from 'pg';

const url = readFileSync('.env.local', 'utf8').match(/DATABASE_URL="([^"]+)"/)[1];
const client = new pg.Client({ connectionString: url });
try {
  await client.connect();
  const res = await client.query('select current_database() as db, version() as v');
  console.log('CONNECTED to', res.rows[0].db, '|', res.rows[0].v.slice(0, 50));
  const tables = await client.query(
    "select table_name from information_schema.tables where table_schema='public' order by 1"
  );
  console.log('existing tables:', tables.rows.map((r) => r.table_name).join(', ') || '(none)');
} catch (e) {
  console.error('DB ERROR:', e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
