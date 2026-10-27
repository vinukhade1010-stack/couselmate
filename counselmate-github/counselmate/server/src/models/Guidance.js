import { query } from '../config/db.js';

/** Guidance entries with their points, e.g. { category:'documents', title, note, items:[...] }. */
async function withItems(rows) {
  if (!rows.length) return [];
  const itemRows = await query(
    'SELECT guidance_id, item_text FROM guidance_items WHERE guidance_id IN (?) ORDER BY guidance_id, item_order',
    [rows.map((r) => r.id)]
  );
  const byGuidance = new Map();
  for (const i of itemRows) {
    if (!byGuidance.has(i.guidance_id)) byGuidance.set(i.guidance_id, []);
    byGuidance.get(i.guidance_id).push(i.item_text);
  }
  return rows.map((r) => ({
    id: r.id, category: r.category, title: r.title, note: r.note, items: byGuidance.get(r.id) || [],
  }));
}

export async function all() {
  return withItems(await query('SELECT * FROM guidance ORDER BY category, sort_order, id'));
}

export async function byCategories(categories) {
  if (!categories.length) return [];
  return withItems(await query('SELECT * FROM guidance WHERE category IN (?) ORDER BY sort_order, id LIMIT 6', [categories]));
}
