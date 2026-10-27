// Run with:  npm run seed
// Safe to run again: it replaces the sample colleges and guidance, and keeps users and real colleges.
import bcrypt from 'bcryptjs';
import '../config/env.js';
import { pool, query, withTransaction } from '../config/db.js';
import * as Colleges from '../models/College.js';
import { colleges } from './colleges.js';
import { guidance } from './guidance.js';

try {
  await query('SELECT 1 FROM colleges LIMIT 1');
} catch (err) {
  console.error('The tables are missing. Run  npm run initdb  first (or run sql/schema.sql in MySQL Workbench).');
  console.error('Details:', err.code || err.message);
  process.exit(1);
}

// 1) sample colleges (their courses and shortlist rows are removed by ON DELETE CASCADE)
await query('DELETE FROM colleges WHERE is_sample = TRUE');
for (const c of colleges) await Colleges.create(c, { isSample: true });

// 2) guidance
await withTransaction(async (conn) => {
  await conn.query('DELETE FROM guidance');
  for (const g of guidance) {
    const [res] = await conn.query('INSERT INTO guidance (category, title, note, sort_order) VALUES (?, ?, ?, ?)',
      [g.category, g.title, g.note || '', g.order || 0]);
    const rows = g.items.map((text, i) => [res.insertId, i + 1, text]);
    await conn.query('INSERT INTO guidance_items (guidance_id, item_order, item_text) VALUES ?', [rows]);
  }
});
console.log(`Added ${colleges.length} sample colleges and ${guidance.length} guidance entries.`);

// 3) first admin account. Email and password come from .env, never from the code.
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.log('No admin created: set ADMIN_EMAIL and ADMIN_PASSWORD in .env, then run the seed again.');
} else if (ADMIN_PASSWORD.length < 10 || !/[A-Za-z]/.test(ADMIN_PASSWORD) || !/\d/.test(ADMIN_PASSWORD)) {
  console.log('No admin created: ADMIN_PASSWORD needs 10+ characters with letters and numbers.');
} else {
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ('CounselMate Admin', ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin'`,
    [email, hash]
  );
  console.log(`Admin account ready: ${email}`);
}

await pool.end();
