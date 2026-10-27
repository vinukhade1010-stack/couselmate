import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import CountUp from '../components/CountUp.jsx';
import CollegeCard from '../components/CollegeCard.jsx';
import CardSkeleton from '../components/CardSkeleton.jsx';
import Reveal from '../components/Reveal.jsx';
import useTitle from '../utils/useTitle.js';
import { formatFees } from '../utils/format.js';

const MIN_PCT = 40;
const MAX_PCT = 100;
const MIN_FEES = 30000;
const MAX_FEES = 300000;

/**
 * The live finder: move a slider and the answer changes right away.
 * "Percentile" means the score you expect. We show colleges whose last cutoff was at or below it.
 */
function Finder() {
  const [pct, setPct] = useState(85);
  const [fees, setFees] = useState(150000);
  const [result, setResult] = useState({ total: null, items: [] });
  const [status, setStatus] = useState('loading');

  const anyBudget = fees >= MAX_FEES;

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    const timer = setTimeout(async () => {
      try {
        const params = { maxCutoff: pct, sort: 'rating', limit: 3 };
        if (!anyBudget) params.maxFees = fees;
        const { data } = await api.get('/colleges', { params });
        if (!cancelled) { setResult({ total: data.total, items: data.items }); setStatus('ready'); }
      } catch {
        if (!cancelled) setStatus('error');
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [pct, fees, anyBudget]);

  const link = `/colleges?maxCutoff=${pct}${anyBudget ? '' : `&maxFees=${fees}`}`;

  return (
    <div className="finder" aria-label="College finder">
      <div className="finder-row">
        <label htmlFor="pct">My expected percentile <output>{pct}</output></label>
        <input id="pct" type="range" min={MIN_PCT} max={MAX_PCT} step="1" value={pct} onChange={(e) => setPct(Number(e.target.value))} />
      </div>
      <div className="finder-row">
        <label htmlFor="fees">Fees a year, up to <output>{anyBudget ? 'any budget' : formatFees(fees)}</output></label>
        <input id="fees" type="range" min={MIN_FEES} max={MAX_FEES} step="10000" value={fees} onChange={(e) => setFees(Number(e.target.value))} />
      </div>

      <div className={`finder-count${status === 'loading' ? ' is-loading' : ''}`} aria-live="polite">
        {status === 'error' ? (
          <p className="error-text">Could not load colleges. Check that the server is running.</p>
        ) : (
          <>
            <strong><CountUp value={result.total} /></strong>
            <span>{result.total === 1 ? 'college is' : 'colleges are'} open to you</span>
          </>
        )}
      </div>

      {status !== 'error' && (
        <ul className="finder-list">
          {result.items.map((c, i) => (
            <li key={c.id} style={{ animationDelay: `${i * 70}ms` }}>
              <Link to={`/colleges/${c.id}`}>
                <span className="name">{c.name}</span>
                <span className="meta">{c.city}, {formatFees(c.fees)} a year</span>
              </Link>
            </li>
          ))}
          {status === 'ready' && result.items.length === 0 && (
            <li className="finder-empty">No colleges match yet. Raise the percentile or the budget.</li>
          )}
        </ul>
      )}

      <Link className="btn finder-go" to={link}>
        {result.total ? `See all ${result.total}` : 'Open the full list'}
      </Link>
    </div>
  );
}

export default function Home() {
  useTitle('Find colleges that fit your score and budget');
  const [top, setTop] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/colleges', { params: { sort: 'rating', limit: 6 } })
      .then((r) => setTop(r.data.items))
      .catch(() => setTop([]))
      .finally(() => setLoading(false));
  }, []);

  const askBot = () => window.dispatchEvent(new CustomEvent('counselmate:chat', {
    detail: { prompt: 'Engineering colleges in Pune under 2 lakh' },
  }));

  return (
    <>
      <section className="hero">
        <div className="wrap hero-in">
          <div className="hero-copy">
            <h1>Find colleges that fit your score and your budget.</h1>
            <p className="lead">
              Slide to your expected percentile and what your family can spend each year.
              The list on the right changes as you move. Then save the ones you like and ask the assistant anything about admissions.
            </p>
            <div className="hero-actions">
              <Link className="btn" to="/colleges">Browse all colleges</Link>
              <button type="button" className="btn btn-ghost" onClick={askBot}>Ask the assistant</button>
            </div>
          </div>
          <Finder />
        </div>
      </section>

      <section className="wrap section">
        <h2>How it works</h2>
        <ol className="steps">
          <Reveal as="li" delay={0}><h3>Set your score and budget</h3><p>Tell us the percentile you expect and the yearly fees you can manage.</p></Reveal>
          <Reveal as="li" delay={120}><h3>Compare and save</h3><p>Filter by city, course and type. Tap the heart to build a shortlist you can compare side by side.</p></Reveal>
          <Reveal as="li" delay={240}><h3>Follow the checklist</h3><p>See the documents to keep ready and the admission steps, in the order you will need them.</p></Reveal>
        </ol>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <h2>Highest rated right now</h2>
          <Link className="link" to="/colleges?sort=rating">See all colleges</Link>
        </div>
        <div className="grid">
          {loading ? <CardSkeleton count={3} /> : top.map((c) => <CollegeCard key={c.id} college={c} />)}
        </div>
        {!loading && top.length === 0 && (
          <p className="muted">No colleges to show yet. Run <code>npm run seed</code> in the server folder to add sample colleges.</p>
        )}
      </section>

      <section className="wrap section">
        <div className="callout">
          <div>
            <h2>New to admissions?</h2>
            <p>Start with the checklist of documents and the step-by-step process. It takes two minutes to read.</p>
          </div>
          <Link className="btn btn-light" to="/guidance">Open the guidance</Link>
        </div>
        <p className="notice">The colleges shown here are sample data made up for demonstration. Fees, cutoffs and ratings are not real.</p>
      </section>
    </>
  );
}
