import { Link } from 'react-router-dom';
import useShortlist from './useShortlist.js';
import { formatFees } from '../utils/format.js';

export default function CollegeCard({ college }) {
  const id = String(college.id);
  const { saved, busy, pop, toggle } = useShortlist(id);

  return (
    <article className="card college">
      <div className="card-top">
        <span className={`type type-${college.type.toLowerCase()}`}>{college.type}</span>
        <button
          type="button"
          className={`heart${saved ? ' on' : ''}${pop ? ' pop' : ''}`}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${college.name} from shortlist` : `Save ${college.name} to shortlist`}
          onClick={toggle}
          disabled={busy}
        >
          {saved ? '\u2665' : '\u2661'}
        </button>
      </div>
      <h3><Link to={`/colleges/${id}`} className="stretch">{college.name}</Link></h3>
      <p className="where">{college.city}, {college.state}</p>
      <ul className="chips">
        {college.courses.slice(0, 3).map((c) => <li key={c}>{c}</li>)}
        {college.courses.length > 3 && <li className="more">+{college.courses.length - 3} more</li>}
      </ul>
      <dl className="facts">
        <div><dt>Fees a year</dt><dd>{formatFees(college.fees)}</dd></div>
        <div><dt>Last cutoff</dt><dd>{college.cutoff}</dd></div>
        <div><dt>Rating</dt><dd>&#9733; {Number(college.rating || 0).toFixed(1)}</dd></div>
      </dl>
      {college.isSample && <p className="sample-tag">Sample data</p>}
    </article>
  );
}
