import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mark, Portrait } from '../components/Brand';
import { api, online } from '../lib/api';
import { session } from '../lib/session';
import { WALL } from './odes';
import './account.css';

function Field({ label, ...rest }) {
  return <label className="auth__field"><span>{label}</span><input className="field" {...rest} /></label>;
}

function Customer() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('in'); // in | up
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function submit(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true); setErr('');
    try {
      if (!(await online())) throw new Error('Accounts need the ode service, which is not reachable right now.');
      const r = mode === 'up' ? await api.signup(f.name, f.email, f.password) : await api.login(f.email, f.password);
      session.set('customer', r);
      navigate('/account');
    } catch (x) { setErr(x.message); setBusy(false); }
  }
  return (
    <section className="auth__side auth__side--customer">
      <p className="eyebrow">for customers</p>
      <h1 className="display">{mode === 'in' ? <>welcome <em>back.</em></> : <>keep your <em>odes.</em></>}</h1>
      <p className="auth__lede">{mode === 'in' ? 'Sign in to see the drinks you saved and everything you ordered.' : 'An account keeps every ode you love, on any phone, at any ode café. Ordering never needs one.'}</p>
      <div className="auth__tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'in'} onClick={() => { setMode('in'); setErr(''); }}>Sign in</button>
        <button type="button" role="tab" aria-selected={mode === 'up'} onClick={() => { setMode('up'); setErr(''); }}>Create account</button>
      </div>
      <form className="auth__form" onSubmit={submit} key={mode}>
        {mode === 'up' && <Field label="Your name" name="name" required maxLength={60} autoComplete="given-name" />}
        <Field label="Email" name="email" type="email" required maxLength={200} autoComplete="email" />
        <Field label="Password" name="password" type="password" required minLength={mode === 'up' ? 8 : 1} maxLength={200} autoComplete={mode === 'up' ? 'new-password' : 'current-password'} />
        {mode === 'up' && <p className="auth__hint">At least 8 characters.</p>}
        {err && <p className="auth__err" role="alert">{err}</p>}
        <button type="submit" className="btn btn--honey" disabled={busy}>{busy ? 'One moment…' : mode === 'in' ? 'Sign in' : 'Create my account'}</button>
      </form>
    </section>
  );
}

function Team() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function submit(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true); setErr('');
    try {
      if (!(await online())) throw new Error('The café tools need the ode service, which is not reachable right now.');
      session.set('team', await api.team(f.cafe, f.key));
      navigate('/dashboard');
    } catch (x) { setErr(x.message); setBusy(false); }
  }
  return (
    <section className="auth__side auth__side--team">
      <span className="auth__art" aria-hidden="true">
        {WALL.slice(3, 6).map((o, i) => <span key={o.id} style={{ '--i': i }}><Portrait creation={o} width={160} height={200} id={'la' + i} /></span>)}
      </span>
      <p className="eyebrow">for the café team</p>
      <h2 className="display">open <em>your café.</em></h2>
      <p className="auth__lede">Your dashboard, order board and pantry. Use the café key from your ode setup.</p>
      <form className="auth__form" onSubmit={submit}>
        <Field label="Café ID" name="cafe" required defaultValue="demo" maxLength={40} autoComplete="organization" />
        <Field label="Café key" name="key" type="password" required maxLength={200} autoComplete="current-password" />
        {err && <p className="auth__err" role="alert">{err}</p>}
        <button type="submit" className="btn btn--cream" disabled={busy}>{busy ? 'Opening…' : 'Open the dashboard'}</button>
      </form>
      <p className="auth__small">Not on ode yet? <Link to="/get-ode">Start a free pilot</Link></p>
    </section>
  );
}

export default function Login() {
  const [params] = useSearchParams();
  const [side, setSide] = useState(params.get('as') === 'team' ? 'team' : 'customer');
  return (
    <div className="auth">
      <div className="auth__switch" role="tablist" aria-label="Who are you signing in as?">
        <Mark size={22} />
        <button type="button" role="tab" aria-selected={side === 'customer'} onClick={() => setSide('customer')}>I’m a customer</button>
        <button type="button" role="tab" aria-selected={side === 'team'} onClick={() => setSide('team')}>I run a café</button>
      </div>
      <div className={'auth__grid show-' + side}>
        <Customer />
        <Team />
      </div>
    </div>
  );
}
