import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import useTitle from '../utils/useTitle.js';
import { formatFees } from '../utils/format.js';

export default function Shortlist() {
  useTitle('My shortlist');
  const { toggleShortlist } = useAuth();
  const { toast } = useToast();
  const [colleges, setColleges] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    api.get('/users/shortlist')
      .then((r) => { setColleges(r.data.colleges); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, []);

  async function remove(c) {
    try {
      await toggleShortlist(c.id);
      setColleges((list) => list.filter((x) => x.id !== c.id));
      toast(`${c.name} removed from your shortlist.`);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  if (status === 'loading') return <div className="wrap page-pad"><div className="skeleton tall" aria-label="Loading" /></div>;
  if (status === 'error') return <div className="wrap narrow page-pad"><h1>Could not load your shortlist</h1><p className="muted">Check that the server is running and try again.</p></div>;

  // highlight the best value in each column, so comparing is quick
  const best = {
    fees: Math.min(...colleges.map((c) => c.fees)),
    rating: Math.max(...colleges.map((c) => c.rating || 0)),
    cutoff: Math.min(...colleges.map((c) => c.cutoff)),
  };

  return (
    <div className="wrap page-pad">
      <h1>My shortlist</h1>
      {colleges.length === 0 ? (
        <div className="empty">
          <h2>Nothing saved yet</h2>
          <p className="muted">Tap the heart on a college and it will appear here, so you can compare them side by side.</p>
          <Link className="btn" to="/colleges">Find colleges</Link>
        </div>
      ) : (
        <>
          <p className="muted lead">{colleges.length} saved. The best value in each column is highlighted: lowest fees, lowest cutoff, highest rating.</p>
          <div className="table-wrap">
            <table className="compare">
              <thead>
                <tr><th>College</th><th>City</th><th>Type</th><th>Fees a year</th><th>Last cutoff</th><th>Rating</th><th><span className="sr-only">Remove</span></th></tr>
              </thead>
              <tbody>
                {colleges.map((c) => (
                  <tr key={c.id}>
                    <td><Link to={`/colleges/${c.id}`}>{c.name}</Link></td>
                    <td>{c.city}</td>
                    <td>{c.type}</td>
                    <td className={colleges.length > 1 && c.fees === best.fees ? 'best' : ''}>{formatFees(c.fees)}</td>
                    <td className={colleges.length > 1 && c.cutoff === best.cutoff ? 'best' : ''}>{c.cutoff}</td>
                    <td className={colleges.length > 1 && (c.rating || 0) === best.rating ? 'best' : ''}>&#9733; {Number(c.rating || 0).toFixed(1)}</td>
                    <td><button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(c)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
