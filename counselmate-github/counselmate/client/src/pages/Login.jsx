import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { errorMessage } from '../api.js';
import useTitle from '../utils/useTitle.js';

export default function Login() {
  useTitle('Log in');
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError('Enter a valid email address.');
    if (!password) return setError('Enter your password.');
    setBusy(true);
    try {
      const user = await login(email.trim(), password);
      toast(`Welcome back, ${user.name.split(' ')[0]}.`);
      navigate(user.role === 'admin' && from === '/' ? '/admin' : from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="wrap auth page-pad">
      <form className="auth-card" onSubmit={onSubmit} noValidate>
        <h1>Log in</h1>
        {error && <p className="alert" role="alert">{error}</p>}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <div className="pw">
            <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" className="link" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? 'Hide' : 'Show'}</button>
          </div>
        </div>
        <button className="btn btn-block" type="submit" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
        <p className="muted center">New here? <Link className="link" to="/register" state={location.state}>Create an account</Link></p>
      </form>
    </div>
  );
}
