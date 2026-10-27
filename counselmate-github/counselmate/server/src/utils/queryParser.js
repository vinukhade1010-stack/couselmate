/**
 * Turns a student's sentence into database filters. No database or network in this file,
 * so it is easy to test (npm test).
 *   "engineering colleges in Pune under 1.5 lakh"  ->  { cities:['Pune'], courses:['B\\.Tech'], maxFees:150000 }
 */
import { escapeRegex } from './helpers.js';

// words a student might type  ->  text that appears in our course names (used with SQL LIKE)
const COURSE_WORDS = [
  { words: ['engineering', 'btech', 'b.tech', 'b tech'], pattern: 'B.Tech' },
  { words: ['computer', 'cse', 'software', 'coding', 'computer science'], pattern: 'Computer' },
  { words: ['information technology'], pattern: 'Information Technology' },
  { words: ['mechanical'], pattern: 'Mechanical' },
  { words: ['civil'], pattern: 'Civil' },
  { words: ['electronics', 'entc', 'e&tc'], pattern: 'Electronics' },
  { words: ['mba', 'management'], pattern: 'MBA' },
  { words: ['bba'], pattern: 'BBA' },
  { words: ['bca'], pattern: 'BCA' },
  { words: ['bsc', 'b.sc'], pattern: 'B.Sc' },
  { words: ['pharmacy', 'pharm', 'b.pharm'], pattern: 'Pharm' },
  { words: ['commerce', 'bcom', 'b.com'], pattern: 'B.Com' },
  { words: ['mbbs', 'medical', 'doctor', 'medicine'], pattern: 'MBBS' },
  { words: ['law', 'llb'], pattern: 'LLB' },
  { words: ['architecture', 'barch', 'b.arch'], pattern: 'B.Arch' },
];

const TYPE_WORDS = [
  { words: ['government', 'govt'], type: 'Government' },
  { words: ['private'], type: 'Private' },
  { words: ['autonomous'], type: 'Autonomous' },
];

function hasWord(text, word) {
  return new RegExp(`(^|[^a-z0-9])${escapeRegex(word)}([^a-z0-9]|$)`).test(text);
}

function toRupees(numText, unit = '') {
  const n = parseFloat(numText.replace(/,/g, ''));
  if (!Number.isFinite(n)) return null;
  if (/^(lakhs?|lacs?|l)$/.test(unit)) return Math.round(n * 100000);
  if (/^(k|thousand)$/.test(unit)) return Math.round(n * 1000);
  return n >= 10000 ? Math.round(n) : null;      // a bare small number like "2" is too unclear to trust
}

const NUM = '(\\d[\\d,]*(?:\\.\\d+)?)';
const LESS = '(?:under|below|less than|within|upto|up to|max(?:imum)?|not more than)';
const CUTOFF_A = new RegExp(`(?:cut-?off|percentile|score)\\D{0,15}?${LESS}?\\s*${NUM}`, 'i');
const CUTOFF_B = /(\d{1,3}(?:\.\d+)?)\s*(?:%|percent|percentile)/i;
const FEES_A = new RegExp(`(?:${LESS}|budget(?: of)?|around|fees? of)\\s*(?:rs\\.?|inr|₹)?\\s*${NUM}\\s*(lakhs?|lacs?|l\\b|k\\b|thousand)?`, 'i');
const FEES_B = new RegExp(`${NUM}\\s*(lakhs?|lacs?)`, 'i');

export function parseQuery(message, { cities = [], states = [] } = {}) {
  let text = ` ${message.toLowerCase()} `;
  const out = { cities: [], states: [], courses: [], type: null, maxFees: null, maxCutoff: null };

  // Longest names first, and blank out each match, so "Navi Mumbai" does not also match "Mumbai".
  const byLength = (a, b) => b.length - a.length;
  for (const list of [{ names: cities, into: out.cities }, { names: states, into: out.states }]) {
    for (const name of [...list.names].sort(byLength)) {
      if (hasWord(text, name.toLowerCase())) {
        list.into.push(name);
        text = text.replace(name.toLowerCase(), ' ');
      }
    }
  }
  for (const { words, pattern } of COURSE_WORDS) {
    if (words.some((w) => hasWord(text, w)) && !out.courses.includes(pattern)) out.courses.push(pattern);
  }
  for (const { words, type } of TYPE_WORDS) if (words.some((w) => hasWord(text, w))) out.type = type;

  // cutoff first, then remove it from the text so its number is not mistaken for fees
  let rest = message;
  const c = rest.match(CUTOFF_A) || rest.match(CUTOFF_B);
  if (c) {
    const v = parseFloat(c[1]);
    if (v >= 0 && v <= 100) out.maxCutoff = v;
    rest = rest.replace(c[0], ' ');
  }
  const f = rest.match(FEES_A);
  if (f) out.maxFees = toRupees(f[1], (f[2] || '').toLowerCase());
  if (out.maxFees === null) {
    const g = rest.match(FEES_B);
    if (g) out.maxFees = toRupees(g[1], g[2].toLowerCase());
  }
  return out;
}

export function detectIntent(message, filters) {
  const t = message.toLowerCase();
  const guidance = [];
  if (/document|certificate|paperwork|checklist/.test(t)) guidance.push('documents');
  if (/deadline|last date|\bdates?\b|timeline|schedule/.test(t)) guidance.push('deadlines');
  if (/\bprocess\b|\bsteps?\b|procedure|how (do|can|to) (i )?(apply|get admission)|counsell?ing/.test(t)) guidance.push('steps');
  if (/what is|what's|meaning|explain|difference/.test(t)) guidance.push('faq');

  const hasFilters = Boolean(
    filters.cities.length || filters.states.length || filters.courses.length ||
    filters.type || filters.maxFees !== null || filters.maxCutoff !== null
  );
  return {
    guidance,
    shortlist: /shortlist|saved|my list/.test(t),
    colleges: hasFilters || /college|university|institute|suggest|recommend|best|top|find|compare/.test(t),
    hasFilters,
  };
}

export function formatFees(n) {
  if (n >= 100000) {
    const lakh = n / 100000;
    return `${Number.isInteger(lakh) ? lakh : lakh.toFixed(2).replace(/0$/, '')} lakh`;
  }
  return `Rs. ${Number(n).toLocaleString('en-IN')}`;
}

/** A readable summary of what we understood, e.g. "city Pune, fees up to 1.5 lakh". */
export function describeFilters(f) {
  const parts = [];
  if (f.cities.length) parts.push(`city ${f.cities.join(' or ')}`);
  if (f.states.length) parts.push(`state ${f.states.join(' or ')}`);
  if (f.courses.length) parts.push(`course matching ${f.courses.map((p) => p).join(', ')}`);
  if (f.type) parts.push(`${f.type.toLowerCase()} colleges`);
  if (f.maxFees !== null) parts.push(`yearly fees up to ${formatFees(f.maxFees)}`);
  if (f.maxCutoff !== null) parts.push(`last year's cutoff up to ${f.maxCutoff}`);
  return parts.join(', ');
}
