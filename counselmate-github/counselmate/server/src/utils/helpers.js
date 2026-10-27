/** Express 4 does not catch errors thrown inside async handlers. This wrapper forwards them. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Treat user text as plain text inside a regex, not as regex code (stops regex injection). */
export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** In a SQL LIKE, % and _ are wildcards. Escape them so "50%" searches for the text "50%". */
export const escapeLike = (s) => String(s).replace(/[\\%_]/g, '\\$&');

/** URL ids must be whole numbers above zero. Returns the number, or null. */
export const parseId = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null;
};

/** Query values can arrive as arrays or objects (?city[a]=b). Only accept real strings. */
export const asString = (v, max = 100) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const asNumber = (v) => {
  if (typeof v !== 'string' || v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Copy only the listed keys. Stops "mass assignment" (a user sending role:"admin"). */
export const pick = (obj, keys) =>
  keys.reduce((out, k) => (obj[k] !== undefined ? ((out[k] = obj[k]), out) : out), {});
