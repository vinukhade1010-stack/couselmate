import { useEffect, useState } from 'react';
import api from '../api.js';
import useTitle from '../utils/useTitle.js';

const STORAGE_KEY = 'counselmate-doc-checks';

function loadChecks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

export default function Guidance() {
  useTitle('Admission guidance');
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [checks, setChecks] = useState(loadChecks);

  useEffect(() => {
    api.get('/guidance')
      .then((r) => { setItems(r.data.items); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, []);

  function toggle(key) {
    setChecks((c) => {
      const next = { ...c, [key]: !c[key] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* private mode: ignore */ }
      return next;
    });
  }

  if (status === 'loading') return <div className="wrap page-pad"><div className="skeleton tall" aria-label="Loading" /></div>;
  if (status === 'error') return <div className="wrap narrow page-pad"><h1>Could not load the guidance</h1><p className="muted">Check that the server is running and try again.</p></div>;

  const by = (cat) => items.filter((i) => i.category === cat);

  return (
    <div className="wrap narrow page-pad guidance">
      <h1>Admission guidance</h1>
      <p className="muted lead">What to prepare, what happens in what order, and the questions students ask most. Rules and dates change every year, so confirm them on the official admission portal.</p>

      {by('documents').map((g) => {
        const done = g.items.filter((_, i) => checks[`${g.id}-${i}`]).length;
        const pct = Math.round((done / g.items.length) * 100);
        return (
          <section key={g.id} className="g-block">
            <h2>{g.title}</h2>
            <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Documents ready">
              <span style={{ width: `${pct}%` }} />
            </div>
            <p className="muted">{done} of {g.items.length} ready</p>
            <ul className="checklist">
              {g.items.map((text, i) => {
                const key = `${g.id}-${i}`;
                return (
                  <li key={key}>
                    <label className={checks[key] ? 'done' : ''}>
                      <input type="checkbox" checked={Boolean(checks[key])} onChange={() => toggle(key)} />
                      <span>{text}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {g.note && <p className="notice">{g.note}</p>}
          </section>
        );
      })}

      {by('steps').map((g) => (
        <section key={g.id} className="g-block">
          <h2>{g.title}</h2>
          <ol className="timeline">{g.items.map((t, i) => <li key={i}>{t}</li>)}</ol>
          {g.note && <p className="notice">{g.note}</p>}
        </section>
      ))}

      {by('deadlines').map((g) => (
        <section key={g.id} className="g-block">
          <h2>{g.title}</h2>
          <ul className="plain">{g.items.map((t, i) => <li key={i}>{t}</li>)}</ul>
          {g.note && <p className="notice">{g.note}</p>}
        </section>
      ))}

      <section className="g-block">
        <h2>Common questions</h2>
        {by('faq').map((g) => (
          <details key={g.id} className="faq">
            <summary>{g.title}</summary>
            <p>{g.items.join(' ')}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
