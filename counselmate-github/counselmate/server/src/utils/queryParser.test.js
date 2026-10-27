import assert from 'node:assert/strict';
import { parseQuery, detectIntent, formatFees } from './queryParser.js';

const lookups = { cities: ['Pune', 'Mumbai', 'Nagpur', 'Navi Mumbai'], states: ['Maharashtra', 'Karnataka'] };
let n = 0;
const t = (name, fn) => { fn(); n += 1; console.log('ok -', name); };

t('city, course and fees in lakh', () => {
  const r = parseQuery('Engineering colleges in Pune under 1.5 lakh fees?', lookups);
  assert.deepEqual(r.cities, ['Pune']);
  assert.ok(r.courses.includes('B.Tech'));
  assert.equal(r.maxFees, 150000);
});
t('fees in thousands with rupee sign', () => {
  assert.equal(parseQuery('colleges below ₹80,000', lookups).maxFees, 80000);
  assert.equal(parseQuery('budget of 90k', lookups).maxFees, 90000);
});
t('cutoff is not mistaken for fees', () => {
  const r = parseQuery('MBA colleges with cutoff under 90', lookups);
  assert.equal(r.maxCutoff, 90);
  assert.equal(r.maxFees, null);
});
t('percentile phrasing', () => {
  assert.equal(parseQuery('I scored 88 percentile, what can I get', lookups).maxCutoff, 88);
});
t('both cutoff and fees', () => {
  const r = parseQuery('private colleges cutoff below 85 and fees under 2 lakh', lookups);
  assert.equal(r.maxCutoff, 85);
  assert.equal(r.maxFees, 200000);
  assert.equal(r.type, 'Private');
});
t('a bare small number is not treated as money', () => {
  assert.equal(parseQuery('top 5 colleges', lookups).maxFees, null);
});
t('word boundaries: "it" or partial words do not match cities', () => {
  assert.deepEqual(parseQuery('communicate with a punekar', lookups).cities, []);
});
t('multi-word city', () => {
  assert.deepEqual(parseQuery('colleges in Navi Mumbai', lookups).cities, ['Navi Mumbai']);
});
t('guidance intents', () => {
  const f = parseQuery('what documents do I need', lookups);
  assert.deepEqual(detectIntent('what documents do I need', f).guidance, ['documents']);
  assert.ok(detectIntent('when is the last date to apply', parseQuery('x', lookups)).guidance.includes('deadlines'));
});
t('shortlist intent', () => {
  assert.equal(detectIntent('compare my shortlist', parseQuery('x', lookups)).shortlist, true);
});
t('regex characters in the message do not crash', () => {
  parseQuery('colleges (.*+?^${}|[]\\) in Pune', lookups);
});
t('fee formatting', () => {
  assert.equal(formatFees(150000), '1.5 lakh');
  assert.equal(formatFees(200000), '2 lakh');
  assert.equal(formatFees(85000), 'Rs. 85,000');
});
console.log(`\n${n} tests passed`);
