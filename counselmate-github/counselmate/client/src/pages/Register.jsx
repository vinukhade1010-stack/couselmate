import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { errorMessage } from '../api.js';
import useTitle from '../utils/useTitle.js';

const score = (v) =>
  (v.length >= 8 ? 1 : 0) + (/[a-z]/.test(v) && /[A-Z]/.test(v) ? 1 : 0) + (/\d/.test(v) ? 1 : 0) + (/[^A-Za-z0-9]/.test(v) ? 1 : 0);
const LABELS = ['', 'Weak', 'Okay', 'Good', 'Strong'];

export default function Register() {
  useTitle('Create account');
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/colleges';

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [touched, setTouched] = useState({});
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  // one place that decides what is wrong with each field
  const problems = {
    name: form.name.trim().length < 2 ? 'Enter your name (at least 2 letters).' : '',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()) ? '' : 'Enter a valid email, like name@example.com.',
    password:
      form.password.length < 8 ? 'Use at least 8 characters.'
      : !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password) ? 'Add at least one letter and one number.' : '',
    confirm: form.confirm !== form.password ? 'The two passwords do not match.' : '',
  };
  const s = score(form.password);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (Object.values(problems).some(Boolean)) return;
    setBusy(true);
    try {
      const user = await register(form.name.trim(), form.email.trim(), form.password);
      toast(`Account created. Welcome, ${user.name.split(' ')[0]}.`);
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  const msg = (k) => (touched[k] && problems[k] ? <small className="field-msg error">{problems[k]}</small> : null);
  const cls = (k) => (touched[k] ? (problems[k] ? 'invalid' : 'valid') : '');

  return (
    <div className="wrap auth page-pad">
      <form className="auth-card" onSubmit={onSubmit} noValidate>
        <h1>Create your account</h1>
        {error && <p className="alert" role="alert">{error}</p>}

        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" className={cls('name')} autoComplete="name" maxLength={60} value={form.name} onChange={set('name')} onBlur={blur('name')} />
          {msg('name')}
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" className={cls('email')} autoComplete="email" maxLength={120} value={form.email} onChange={set('email')} onBlur={blur('email')} />
          {msg('email')}
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <div className="pw">
            <input id="password" type={show ? 'text' : 'password'} className={cls('password')} autoComplete="new-password" maxLength={72} value={form.password} onChange={set('password')} onBlur={blur('password')} />
            <button type="button" className="link" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? 'Hide' : 'Show'}</button>
          </div>
          <div className="strength" data-score={form.password ? s : 0} aria-hidden="true"><span /><span /><span /><span /></div>
          {msg('password') || <small className="field-msg">{form.password ? `Password strength: ${LABELS[Math.max(s, 1)]}` : 'Use 8 or more characters with letters and numbers.'}</small>}
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm password</label>
          <input id="confirm" type={show ? 'text' : 'password'} className={cls('confirm')} autoComplete="new-password" maxLength={72} value={form.confirm} onChange={set('confirm')} onBlur={blur('confirm')} />
          {msg('confirm')}
        </div>

        <button className="btn btn-block" type="submit" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
        <p className="muted center">Already registered? <Link className="link" to="/login" state={location.state}>Log in</Link></p>
      </form>
    </div>
  );
}
