import assert from 'node:assert/strict';
import { buildCollegeWhere, SORTS } from './sqlFilters.js';
import { escapeLike, parseId } from './helpers.js';

let n = 0;
const t = (name, fn) => { fn(); n += 1; console.log('ok -', name); };
const count = (s, ch) => s.split(ch).length - 1;

t('no filters gives no WHERE', () => {
  assert.deepEqual(buildCollegeWhere({}), { where: '', params: [] });
});
t('placeholder count always equals parameter count', () => {
  const f = { search: 'pune', city: 'Pune', state: 'Maharashtra', type: 'Private', course: 'MBA',
              maxFees: 100000, minRating: 4, maxCutoff: 90, cities: ['Pune', 'Mumbai'], courses: ['B.Tech', 'MBA'] };
  const { where, params } = buildCollegeWhere(f);
  assert.equal(count(where, '?'), params.length);
});
t('user text is never placed inside the SQL string', () => {
  const evil = "'; DROP TABLE users; --";
  const { where, params } = buildCollegeWhere({ search: evil, city: evil, course: evil, cities: [evil] });
  assert.ok(!where.includes('DROP'));
  assert.ok(!where.includes(evil));
  assert.ok(params.some((p) => String(p).includes('DROP')));   // it travels as a value
});
t('LIKE wildcards in the search are escaped', () => {
  assert.equal(escapeLike('50%_off\\'), '50\\%\\_off\\\\');
  const { params } = buildCollegeWhere({ search: '100%' });
  assert.equal(params[0], '%100\\%%');
});
t('unknown type is ignored, known type is used', () => {
  assert.equal(buildCollegeWhere({ type: 'Hacker' }).where, '');
  assert.equal(buildCollegeWhere({ type: 'Private' }).where, 'WHERE c.type = ?');
});
t('non-numbers are ignored for numeric filters', () => {
  assert.equal(buildCollegeWhere({ maxFees: NaN, minRating: undefined, maxCutoff: null }).where, '');
  assert.deepEqual(buildCollegeWhere({ maxFees: 0 }).params, [0]);
});
t('chatbot course patterns become OR-ed LIKEs', () => {
  const { where, params } = buildCollegeWhere({ courses: ['B.Tech', 'MBA'] });
  assert.equal(count(where, ' OR '), 1);
  assert.deepEqual(params, ['%B.Tech%', '%MBA%']);
});
t('sort whitelist contains only fixed text', () => {
  Object.values(SORTS).forEach((s) => assert.match(s, /^[a-z.\s,]+(ASC|DESC)/i));
  assert.equal(SORTS['1; DROP TABLE x'], undefined);
});
t('parseId accepts only positive whole numbers', () => {
  assert.equal(parseId('12'), 12);
  for (const bad of ['0', '-3', '1.5', 'abc', '1; DROP', '', undefined, null, '99999999999']) assert.equal(parseId(bad), null);
});
console.log(`\n${n} tests passed`);
