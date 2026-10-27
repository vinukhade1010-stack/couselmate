/**
 * Builds the WHERE part of the college search from the filters a student chose.
 * Pure function: no database in here, so it can be tested (npm test).
 *
 * The rule that keeps it safe: user text NEVER goes into the SQL string.
 * Only fixed pieces of SQL are added, and the values go in the params list.
 * Each ? in the SQL is later matched with one value from params.
 */
import { escapeLike } from './helpers.js';

export const TYPES = ['Government', 'Private', 'Autonomous'];

// Only these ORDER BY texts are ever used. A sort key from the URL picks one; it is never pasted in.
export const SORTS = {
  name: 'c.name ASC',
  rating: 'c.rating DESC, c.name ASC',
  'fees-asc': 'c.fees ASC, c.name ASC',
  'fees-desc': 'c.fees DESC, c.name ASC',
  'cutoff-asc': 'c.cutoff ASC, c.name ASC',
  'cutoff-desc': 'c.cutoff DESC, c.name ASC',
};

const hasCourse = 'EXISTS (SELECT 1 FROM college_courses cc WHERE cc.college_id = c.id AND cc.course LIKE ?)';

/**
 * filters: { search, city, state, type, course, maxFees, minRating, maxCutoff,
 *            cities[], states[], courses[] }      (every field is optional)
 * returns: { where: 'WHERE ...' or '', params: [...] }
 */
export function buildCollegeWhere(filters = {}) {
  const parts = [];
  const params = [];

  if (filters.search) {
    const like = `%${escapeLike(filters.search)}%`;
    parts.push(`(c.name LIKE ? OR c.city LIKE ? OR ${hasCourse})`);
    params.push(like, like, like);
  }
  if (filters.city) { parts.push('c.city = ?'); params.push(filters.city); }
  if (filters.state) { parts.push('c.state = ?'); params.push(filters.state); }
  if (filters.type && TYPES.includes(filters.type)) { parts.push('c.type = ?'); params.push(filters.type); }
  if (filters.course) { parts.push(hasCourse); params.push(`%${escapeLike(filters.course)}%`); }
  if (Number.isFinite(filters.maxFees)) { parts.push('c.fees <= ?'); params.push(filters.maxFees); }
  if (Number.isFinite(filters.minRating)) { parts.push('c.rating >= ?'); params.push(filters.minRating); }
  if (Number.isFinite(filters.maxCutoff)) { parts.push('c.cutoff <= ?'); params.push(filters.maxCutoff); }

  // lists used by the chatbot: "city is one of ..." (mysql2 expands an array into a, b, c)
  if (filters.cities?.length) { parts.push('c.city IN (?)'); params.push(filters.cities); }
  if (filters.states?.length) { parts.push('c.state IN (?)'); params.push(filters.states); }
  if (filters.courses?.length) {
    parts.push(`(${filters.courses.map(() => hasCourse).join(' OR ')})`);
    filters.courses.forEach((p) => params.push(`%${escapeLike(p)}%`));
  }

  return { where: parts.length ? `WHERE ${parts.join(' AND ')}` : '', params };
}
