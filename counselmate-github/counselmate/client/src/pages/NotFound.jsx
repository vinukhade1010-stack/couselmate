import { Link } from 'react-router-dom';
import useTitle from '../utils/useTitle.js';

export default function NotFound() {
  useTitle('Page not found');
  return (
    <div className="wrap narrow page-pad">
      <h1>This page does not exist</h1>
      <p className="muted">The link may be old or mistyped.</p>
      <div className="hero-actions">
        <Link className="btn" to="/">Go to the home page</Link>
        <Link className="btn btn-ghost" to="/colleges">Browse colleges</Link>
      </div>
    </div>
  );
}
