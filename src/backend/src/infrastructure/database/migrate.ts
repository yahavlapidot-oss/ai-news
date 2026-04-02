import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool } from './db';

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Running database migrations...');
  await pool.query(sql);
  console.log('Migrations complete.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
