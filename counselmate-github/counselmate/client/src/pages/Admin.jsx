import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import useTitle from '../utils/useTitle.js';
import { formatFees } from '../utils/format.js';

const EMPTY = { name: '', city: '', state: '', type: 'Private', courses: '', fees: '', cutoff: '', rating: '', established: '', website: '', description: '' };

const toForm = (c) => ({
  name: c.name, city: c.city, state: c.state, type: c.type, courses: c.courses.join(', '),
  fees: String(c.fees), cutoff: String(c.cutoff), rating: c.rating === undefined ? '' : String(c.rating),
  established: c.established ? String(c.established) : '', website: c.website || '', description: c.description || '',
});

const toPayload = (f) => ({
  name: f.name.trim(), city: f.city.trim(), state: f.state.trim(), type: f.type,
  courses: f.courses.split(',').map((s) => s.trim()).filter(Boolean),
  fees: Number(f.fees), cutoff: Number(f.cutoff),
  rating: f.rating === '' ? undefined : Number(f.rating),
  established: f.established === '' ? undefined : Number(f.established),
  website: f.website.trim(), description: f.description.trim(),
});

function CollegeForm({ initial, onSaved, onCancel }) {
  const { toast } = useToast();
  const [form, setForm] = useState(initial.data);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (initial.id) await api.put(`/colleges/${initial.id}`, toPayload(form));
      else await api.post('/colleges', toPayload(form));
      toast(initial.id ? 'College updated.' : 'College added.');
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <h2>{initial.id ? 'Edit college' : 'Add a college'}</h2>
      {error && <p className="alert" role="alert">{error}</p>}
      <div className="form-grid">
        <div className="field wide"><label htmlFor="a-name">Name</label><input id="a-name" value={form.name} onChange={set('name')} maxLength={120} required /></div>
        <div className="field"><label htmlFor="a-city">City</label><input id="a-city" value={form.city} onChange={set('city')} maxLength={60} required /></div>
        <div className="field"><label htmlFor="a-state">State</label><input id="a-state" value={form.state} onChange={set('state')} maxLength={60} required /></div>
        <div className="field"><label htmlFor="a-type">Type</label>
          <select id="a-type" value={form.type} onChange={set('type')}><option>Government</option><option>Private</option><option>Autonomous</option></select></div>
        <div className="field wide"><label htmlFor="a-courses">Courses (separate with commas)</label><input id="a-courses" value={form.courses} onChange={set('courses')} placeholder="B.Tech Computer Science, MBA" required /></div>
        <div className="field"><label htmlFor="a-fees">Fees a year (rupees)</label><input id="a-fees" type="number" min="0" max="5000000" value={form.fees} onChange={set('fees')} required /></div>
        <div className="field"><label htmlFor="a-cutoff">Last cutoff (0 to 100)</label><input id="a-cutoff" type="number" min="0" max="100" step="0.1" value={form.cutoff} onChange={set('cutoff')} required /></div>
        <div className="field"><label htmlFor="a-rating">Rating (0 to 5)</label><input id="a-rating" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={set('rating')} /></div>
        <div className="field"><label htmlFor="a-est">Year established</label><input id="a-est" type="number" min="1800" max="2100" value={form.established} onChange={set('established')} /></div>
        <div className="field wide"><label htmlFor="a-web">Official website</label><input id="a-web" type="url" value={form.website} onChange={set('website')} placeholder="https://" maxLength={200} /></div>
        <div className="field wide"><label htmlFor="a-desc">Description</label><textarea id="a-desc" rows="3" value={form.description} onChange={set('description')} maxLength={1500} /></div>
      </div>
      <div className="row-actions">
        <button className="btn" type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save college'}</button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function Admin() {
  useTitle('Admin');
  const { toast } = useToast();
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('loading');
  const [editing, setEditing] = useState(null);   // null = closed, {id, data} = open

  const load = useCallback(() => {
    setStatus('loading');
    api.get('/colleges', { params: { page, search: search.trim() || undefined, limit: 12 } })
      .then((r) => { setData(r.data); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function remove(c) {
    if (!window.confirm(`Delete ${c.name}? This also removes it from students' shortlists.`)) return;
    try {
      await api.delete(`/colleges/${c.id}`);
      toast('College deleted.');
      load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  return (
    <div className="wrap page-pad">
      <div className="section-head">
        <h1>Manage colleges</h1>
        {!editing && <button type="button" className="btn" onClick={() => setEditing({ id: null, data: EMPTY })}>Add a college</button>}
      </div>

      {editing && (
        <CollegeForm
          key={editing.id || 'new'}
          initial={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      <div className="filter admin-search">
        <label htmlFor="admin-q">Search colleges</label>
        <input id="admin-q" type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Name, city or course" maxLength={60} />
      </div>

      {status === 'error' && <p className="alert" role="alert">Could not load colleges. Check that the server is running.</p>}
      {status === 'loading' && <div className="skeleton tall" aria-label="Loading" />}

      {status === 'ready' && (
        <>
          <p className="muted" aria-live="polite">{data.total} {data.total === 1 ? 'college' : 'colleges'}</p>
          <div className="table-wrap">
            <table className="compare">
              <thead><tr><th>College</th><th>City</th><th>Type</th><th>Fees a year</th><th>Cutoff</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {data.items.map((c) => (
                  <tr key={c.id}>
                    <td><Link to={`/colleges/${c.id}`}>{c.name}</Link>{c.isSample && <span className="sample-tag inline">Sample</span>}</td>
                    <td>{c.city}</td><td>{c.type}</td><td>{formatFees(c.fees)}</td><td>{c.cutoff}</td>
                    <td className="row-btns">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditing({ id: c.id, data: toForm(c) }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(c)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.pages > 1 && (
            <nav className="pager" aria-label="Pages">
              <button type="button" className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span>Page {page} of {data.pages}</span>
              <button type="button" className="btn btn-ghost btn-sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
