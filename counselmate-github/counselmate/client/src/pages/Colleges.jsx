import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api.js';
import CollegeCard from '../components/CollegeCard.jsx';
import CardSkeleton from '../components/CardSkeleton.jsx';
import useTitle from '../utils/useTitle.js';
import { formatFees } from '../utils/format.js';

/** A slider that waits a moment after you stop moving it before filtering. */
function RangeFilter({ id, label, value, min, max, step, format, onCommit }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  useEffect(() => {
    if (v === value) return undefined;
    const t = setTimeout(() => onCommit(v >= max ? '' : v), 300);   // the far end means "any"
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);
  return (
    <div className="filter">
      <label htmlFor={id}>{label} <output>{v >= max ? 'Any' : format(v)}</output></label>
      <input id={id} type="range" min={min} max={max} step={step} value={v} onChange={(e) => setV(Number(e.target.value))} />
    </div>
  );
}

const FILTER_KEYS = ['search', 'city', 'type', 'course', 'maxFees', 'minRating', 'maxCutoff'];

export default function Colleges() {
  useTitle('Colleges');
  const [params, setParams] = useSearchParams();
  const [meta, setMeta] = useState({ cities: [], courses: [], types: [] });
  const [data, setData] = useState({ items: [], total: 0, pages: 1, page: 1 });
  const [status, setStatus] = useState('loading');
  const [search, setSearch] = useState(params.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);

  const get = (k, fallback = '') => params.get(k) || fallback;

  function set(patch) {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) next.delete(k);
      else next.set(k, String(v));
    });
    if (!('page' in patch)) next.delete('page');       // any filter change goes back to page 1
    setParams(next, { replace: true });
  }

  useEffect(() => { api.get('/colleges/meta').then((r) => setMeta(r.data)).catch(() => {}); }, []);

  // typing in the search box updates the address bar after a short pause
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('search') || '') !== search.trim()) set({ search: search.trim() });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => { setSearch(params.get('search') || ''); }, [params]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    api.get('/colleges', { params: { ...Object.fromEntries(params), limit: 12 } })
      .then((r) => { if (!cancelled) { setData(r.data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [params]);

  const activeFilters = FILTER_KEYS.filter((k) => params.get(k));
  const page = Number(get('page', 1));

  return (
    <div className="wrap page-pad">
      <h1>Colleges</h1>
      <p className="muted lead">Filter by what matters to you. Your filters stay in the address, so you can share the link.</p>

      <div className="listing">
        <aside className={`filters${showFilters ? ' open' : ''}`} aria-label="Filters">
          <div className="filter">
            <label htmlFor="q">Search</label>
            <input id="q" type="search" placeholder="College, city or course" value={search} onChange={(e) => setSearch(e.target.value)} maxLength={60} />
          </div>
          <div className="filter">
            <label htmlFor="city">City</label>
            <select id="city" value={get('city')} onChange={(e) => set({ city: e.target.value })}>
              <option value="">All cities</option>
              {meta.cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="filter">
            <label htmlFor="course">Course</label>
            <select id="course" value={get('course')} onChange={(e) => set({ course: e.target.value })}>
              <option value="">All courses</option>
              {meta.courses.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="filter">
            <label htmlFor="type">Type</label>
            <select id="type" value={get('type')} onChange={(e) => set({ type: e.target.value })}>
              <option value="">Any type</option>
              {meta.types.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <RangeFilter id="maxFees" label="Fees a year, up to" value={Number(get('maxFees', 1200000))} min={30000} max={1200000} step={10000} format={formatFees} onCommit={(v) => set({ maxFees: v })} />
          <RangeFilter id="maxCutoff" label="My percentile" value={Number(get('maxCutoff', 100))} min={40} max={100} step={1} format={(v) => v} onCommit={(v) => set({ maxCutoff: v })} />
          <div className="filter">
            <label htmlFor="minRating">Rating</label>
            <select id="minRating" value={get('minRating')} onChange={(e) => set({ minRating: e.target.value })}>
              <option value="">Any rating</option>
              <option value="4.5">4.5 and above</option>
              <option value="4">4 and above</option>
              <option value="3.5">3.5 and above</option>
            </select>
          </div>
          {activeFilters.length > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setParams({}, { replace: true }); }}>
              Clear all filters
            </button>
          )}
        </aside>

        <section aria-label="Results">
          <div className="results-bar">
            <button type="button" className="btn btn-ghost btn-sm filter-toggle" aria-expanded={showFilters} onClick={() => setShowFilters((s) => !s)}>
              {showFilters ? 'Hide filters' : `Filters${activeFilters.length ? ` (${activeFilters.length})` : ''}`}
            </button>
            <p className="muted" aria-live="polite">
              {status === 'ready' ? `${data.total} ${data.total === 1 ? 'college' : 'colleges'}` : '\u00A0'}
            </p>
            <div className="sort">
              <label htmlFor="sort">Sort by</label>
              <select id="sort" value={get('sort', 'name')} onChange={(e) => set({ sort: e.target.value })}>
                <option value="name">Name</option>
                <option value="rating">Highest rated</option>
                <option value="fees-asc">Fees, low to high</option>
                <option value="fees-desc">Fees, high to low</option>
                <option value="cutoff-asc">Cutoff, low to high</option>
                <option value="cutoff-desc">Cutoff, high to low</option>
              </select>
            </div>
          </div>

          {status === 'error' && (
            <div className="empty">
              <h2>Could not load colleges</h2>
              <p className="muted">Check that the server is running, then try again.</p>
              <button type="button" className="btn" onClick={() => setParams(new URLSearchParams(params))}>Try again</button>
            </div>
          )}

          {status !== 'error' && (
            <div className="grid">
              {status === 'loading' ? <CardSkeleton count={6} /> : data.items.map((c) => <CollegeCard key={c.id} college={c} />)}
            </div>
          )}

          {status === 'ready' && data.items.length === 0 && (
            <div className="empty">
              <h2>No colleges match these filters</h2>
              <p className="muted">Try a higher fee limit, a different city, or clear the filters.</p>
              <button type="button" className="btn" onClick={() => { setSearch(''); setParams({}, { replace: true }); }}>Clear all filters</button>
            </div>
          )}

          {status === 'ready' && data.pages > 1 && (
            <nav className="pager" aria-label="Pages">
              <button type="button" className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => { set({ page: page - 1 }); window.scrollTo({ top: 0 }); }}>Previous</button>
              <span>Page {data.page} of {data.pages}</span>
              <button type="button" className="btn btn-ghost btn-sm" disabled={page >= data.pages} onClick={() => { set({ page: page + 1 }); window.scrollTo({ top: 0 }); }}>Next</button>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
