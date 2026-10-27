import { query } from '../config/db.js';

// A user as the API shows it. The password hash is never part of this.
const publicFields = (u, shortlist = []) => ({
  id: u.id, name: u.name, email: u.email, role: u.role, shortlist,
});

export async function getShortlistIds(userId) {
  const rows = await query('SELECT college_id FROM shortlist WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows.map((r) => r.college_id);
}

/** Row with the hash, for login checks only. */
export async function findByEmailWithHash(email) {
  const rows = await query('SELECT id, name, email, role, password_hash FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] || null;
}

export async function findById(id) {
  const rows = await query('SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function emailExists(email) {
  const rows = await query('SELECT 1 FROM users WHERE email = ? LIMIT 1', [email]);
  return rows.length > 0;
}

/** Role is always 'student' here. Admins are made only by the seed script. */
export async function createStudent({ name, email, passwordHash }) {
  const result = await query(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'student')",
    [name, email, passwordHash]
  );
  return result.insertId;
}

export async function toPublicUser(row) {
  return publicFields(row, await getShortlistIds(row.id));
}
