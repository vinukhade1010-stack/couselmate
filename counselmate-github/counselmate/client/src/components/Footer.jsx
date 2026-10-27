import { Link } from 'react-router-dom';
import BrandMark from './BrandMark.jsx';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-in">
        <div className="footer-brand">
          <Link to="/" className="brand"><BrandMark size={26} /> <span>CounselMate</span></Link>
          <p className="muted">Colleges, cutoffs and admission help in one place. College records here are sample data for demonstration. Always confirm details on the college&apos;s official website.</p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/colleges">Find colleges</Link>
          <Link to="/guidance">Admission guidance</Link>
          <Link to="/register">Create an account</Link>
        </nav>
      </div>
      <div className="wrap footer-bottom">
        <p>&copy; {new Date().getFullYear()} CounselMate. All rights reserved by Leo.</p>
      </div>
    </footer>
  );
}
