import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/** Shows the page only to logged-in users (and only to admins when admin is set). */
export default function ProtectedRoute({ admin = false, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="wrap center-text page-pad"><div className="spinner" aria-label="Loading" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (admin && user.role !== 'admin') {
    return (
      <div className="wrap narrow page-pad">
        <h1>Admins only</h1>
        <p className="muted">Your account does not have access to this page.</p>
      </div>
    );
  }
  return children;
}
