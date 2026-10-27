import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import BrandMark from './BrandMark.jsx';

export default function Navbar() {
  const { user, logout, shortlistIds } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);   // close the phone menu after tapping a link

  return (
    <header className="topbar">
      <a className="skip" href="#main">Skip to content</a>
      <div className="wrap topbar-in">
        <Link to="/" className="brand" aria-label="CounselMate home">
          <BrandMark /> <span>CounselMate</span>
        </Link>
        <button
          type="button"
          className="menu-btn"
          aria-expanded={open}
          aria-controls="nav"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
        <nav id="nav" className={`nav${open ? ' open' : ''}`} aria-label="Main">
          <NavLink to="/colleges">Colleges</NavLink>
          <NavLink to="/guidance">Guidance</NavLink>
          {user && (
            <NavLink to="/shortlist">
              Shortlist
              {shortlistIds.length > 0 && <span className="count">{shortlistIds.length}</span>}
            </NavLink>
          )}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          <div className="nav-auth">
            {user ? (
              <>
                <span className="hello">Hi, {user.name.split(' ')[0]}</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>Log out</button>
              </>
            ) : (
              <>
                <Link className="btn btn-ghost btn-sm" to="/login">Log in</Link>
                <Link className="btn btn-sm" to="/register">Sign up</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
