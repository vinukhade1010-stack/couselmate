import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import useShortlist from '../components/useShortlist.js';
import useTitle from '../utils/useTitle.js';
import { formatFees, safeUrl } from '../utils/format.js';

function Detail({ college }) {
  const { saved, busy, pop, toggle } = useShortlist(college.id);
  const site = safeUrl(college.website);

  const askBot = () => window.dispatchEvent(new CustomEvent('counselmate:chat', {
    detail: { prompt: `Tell me about ${college.name}` },
  }));

  return (
    <article className="wrap page-pad detail">
      <Link to="/colleges" className="back">Back to colleges</Link>
      <header className="detail-head">
        <div>
          <span className={`type type-${college.type.toLowerCase()}`}>{college.type}</span>
          <h1>{college.name}</h1>
          <p className="where">{college.city}, {college.state}{college.established ? `. Established ${college.established}` : ''}</p>
        </div>
        <button type="button" className={`btn${saved ? ' btn-saved' : ''}${pop ? ' pop' : ''}`} onClick={toggle} disabled={busy} aria-pressed={saved}>
          {saved ? '\u2665 Saved to shortlist' : '\u2661 Save to shortlist'}
        </button>
      </header>

      <dl className="tiles">
        <div><dt>Fees a year</dt><dd>{formatFees(college.fees)}</dd></div>
        <div><dt>Last year&apos;s cutoff</dt><dd>{college.cutoff}</dd></div>
        <div><dt>Rating</dt><dd>&#9733; {Number(college.rating || 0).toFixed(1)}</dd></div>
        <div><dt>Courses</dt><dd>{college.courses.length}</dd></div>
      </dl>

      <section className="detail-body">
        <div>
          <h2>About</h2>
          <p>{college.description || 'No description added yet.'}</p>
          <h2>Courses offered</h2>
          <ul className="chips big">{college.courses.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
        <aside className="side">
          <h2>Next steps</h2>
          {site ? <a className="btn btn-ghost" href={site} target="_blank" rel="noopener noreferrer">Visit official website</a>
                : <p className="muted">No website added for this college.</p>}
          <button type="button" className="btn btn-ghost" onClick={askBot}>Ask the assistant</button>
          <Link className="btn btn-ghost" to="/guidance">Admission checklist</Link>
        </aside>
      </section>

      <p className="notice">
        {college.isSample ? 'This is sample data made up for demonstration. ' : ''}
        Fees and cutoffs change every year. Confirm them on the college&apos;s official website before you decide.
      </p>
    </article>
  );
}

export default function CollegeDetail() {
  const { id } = useParams();
  const [college, setCollege] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setCollege(null);
    setError('');
    api.get(`/colleges/${id}`)
      .then((r) => { if (!cancelled) setCollege(r.data.college); })
      .catch((e) => { if (!cancelled) setError(errorMessage(e, 'Could not load this college.')); });
    return () => { cancelled = true; };
  }, [id]);

  useTitle(college ? college.name : 'College');

  if (error) {
    return (
      <div className="wrap narrow page-pad">
        <h1>College not found</h1>
        <p className="muted">{error}</p>
        <Link className="btn" to="/colleges">Back to colleges</Link>
      </div>
    );
  }
  if (!college) return <div className="wrap page-pad"><div className="skeleton tall" aria-label="Loading" /></div>;
  return <Detail college={college} />;
}
