import { query, withTransaction } from '../config/db.js';
import { buildCollegeWhere, SORTS } from '../utils/sqlFilters.js';

// Turn a database row (snake_case) into the object the API sends (camelCase).
const toCollege = (r, courses = []) => ({
  id: r.id,
  name: r.name,
  city: r.city,
  state: r.state,
  type: r.type,
  courses,
  fees: r.fees,
  cutoff: r.cutoff,
  rating: r.rating,
  established: r.established,
  website: r.website,
  description: r.description,
  isSample: Boolean(r.is_sample),
});

/** One extra query fetches the courses for a whole page of colleges (instead of one query per college). */
async function attachCourses(rows) {
  if (!rows.length) return [];
  const courseRows = await query(
    'SELECT college_id, course FROM college_courses WHERE college_id IN (?) ORDER BY course',
    [rows.map((r) => r.id)]
  );
  const byCollege = new Map();
  for (const c of courseRows) {
    if (!byCollege.has(c.college_id)) byCollege.set(c.college_id, []);
    byCollege.get(c.college_id).push(c.course);
  }
  return rows.map((r) => toCollege(r, byCollege.get(r.id) || []));
}

/**
 * Search with filters, sorting and paging.
 * `sort` must be a key of SORTS. limit and page are whole numbers chosen by our own code,
 * so they are safe to place in the SQL text. Everything the student typed is a ? parameter.
 */
export async function list(filters, { sort = 'name', page = 1, limit = 12 } = {}) {
  const { where, params } = buildCollegeWhere(filters);
  const orderBy = SORTS[sort] || SORTS.name;
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 24);
  const offset = (Math.max(Math.trunc(page), 1) - 1) * safeLimit;

  const [rows, countRows] = await Promise.all([
    query(`SELECT c.* FROM colleges c ${where} ORDER BY ${orderBy} LIMIT ${safeLimit} OFFSET ${offset}`, params),
    query(`SELECT COUNT(*) AS total FROM colleges c ${where}`, params),
  ]);
  return { items: await attachCourses(rows), total: countRows[0].total };
}

/** Top matches for the chatbot, best rated first. */
export async function searchForChat(filters, limit = 5) {
  return list(filters, { sort: 'rating', page: 1, limit });
}

export async function findById(id) {
  const rows = await query('SELECT * FROM colleges WHERE id = ? LIMIT 1', [id]);
  if (!rows.length) return null;
  return (await attachCourses(rows))[0];
}

export async function exists(id) {
  return (await query('SELECT 1 FROM colleges WHERE id = ? LIMIT 1', [id])).length > 0;
}

/** Values for the filter dropdowns. */
export async function meta() {
  const [cities, states, courses, total] = await Promise.all([
    query('SELECT DISTINCT city FROM colleges ORDER BY city'),
    query('SELECT DISTINCT state FROM colleges ORDER BY state'),
    query('SELECT DISTINCT course FROM college_courses ORDER BY course'),
    query('SELECT COUNT(*) AS total FROM colleges'),
  ]);
  return {
    cities: cities.map((r) => r.city),
    states: states.map((r) => r.state),
    courses: courses.map((r) => r.course),
    totalColleges: total[0].total,
  };
}

const cleanCourses = (courses) => [...new Set(courses.map((c) => c.trim()).filter(Boolean))];

function insertCourses(conn, collegeId, courses) {
  const rows = cleanCourses(courses).map((c) => [collegeId, c]);
  return conn.query('INSERT INTO college_courses (college_id, course) VALUES ?', [rows]);
}

const columns = (d) => [
  d.name, d.city, d.state, d.type, d.fees, d.cutoff, d.rating ?? 0,
  d.established ?? null, d.website || null, d.description || '',
];

/** The college row and its courses are saved together, or not at all. */
export function create(d, { isSample = false } = {}) {
  return withTransaction(async (conn) => {
    const [res] = await conn.query(
      `INSERT INTO colleges (name, city, state, type, fees, cutoff, rating, established, website, description, is_sample)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [...columns(d), isSample]
    );
    await insertCourses(conn, res.insertId, d.courses);
    return res.insertId;
  });
}

export function update(id, d) {
  return withTransaction(async (conn) => {
    const [res] = await conn.query(
      `UPDATE colleges SET name = ?, city = ?, state = ?, type = ?, fees = ?, cutoff = ?, rating = ?,
              established = ?, website = ?, description = ? WHERE id = ?`,
      [...columns(d), id]
    );
    if (res.affectedRows === 0 && !(await exists(id))) return false;
    await conn.query('DELETE FROM college_courses WHERE college_id = ?', [id]);
    await insertCourses(conn, id, d.courses);
    return true;
  });
}

/** Courses and shortlist entries disappear automatically (ON DELETE CASCADE in the schema). */
export async function remove(id) {
  const res = await query('DELETE FROM colleges WHERE id = ?', [id]);
  return res.affectedRows > 0;
}

// ---------- shortlist ----------

export async function shortlistFor(userId) {
  const rows = await query(
    `SELECT c.* FROM shortlist s JOIN colleges c ON c.id = s.college_id
     WHERE s.user_id = ? ORDER BY s.created_at DESC`,
    [userId]
  );
  return attachCourses(rows);
}

export async function shortlistCount(userId) {
  const rows = await query('SELECT COUNT(*) AS n FROM shortlist WHERE user_id = ?', [userId]);
  return rows[0].n;
}

/** Returns true if the college is now saved, false if it was removed. */
export async function toggleShortlist(userId, collegeId) {
  const removed = await query('DELETE FROM shortlist WHERE user_id = ? AND college_id = ?', [userId, collegeId]);
  if (removed.affectedRows > 0) return false;
  await query('INSERT IGNORE INTO shortlist (user_id, college_id) VALUES (?, ?)', [userId, collegeId]);
  return true;
}

export async function distinctLookups() {
  const [cities, states] = await Promise.all([
    query('SELECT DISTINCT city FROM colleges'),
    query('SELECT DISTINCT state FROM colleges'),
  ]);
  return { cities: cities.map((r) => r.city), states: states.map((r) => r.state) };
}
