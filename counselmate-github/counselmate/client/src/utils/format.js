/** 185000 -> "1.85 L", 85000 -> "85,000" (rupees per year) */
export function formatFees(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '-';
  const v = Number(n);
  if (v >= 100000) {
    const lakh = (v / 100000).toFixed(2).replace(/\.?0+$/, '');
    return `\u20B9${lakh} L`;
  }
  return `\u20B9${v.toLocaleString('en-IN')}`;
}

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

/** Only allow web links. Defence in depth: the server checks too. */
export const safeUrl = (u) => (typeof u === 'string' && /^https?:\/\//i.test(u) ? u : null);
