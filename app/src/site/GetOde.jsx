import { useState } from 'react';
import { Seal } from '../components/Brand';
import './pages.css';

const NEXT = [
  ['We call you', 'Within two working days, to hear about your café and your menu.'],
  ['We set it up together', 'Your ingredients, portions, costs and prices go into ode with you.'],
  ['Cards on the tables', 'You get print-ready QR cards for every table, in your colours.'],
  ['Thirty days live', 'Your customers use it for real. Your team uses the board on any screen.'],
  ['You decide', 'Keep it on the monthly plan, or stop. No contract either way.'],
];

export default function GetOde() {
  const [state, setState] = useState('idle');
  async function submit(e) {
    e.preventDefault();
    setState('sending');
    try {
      const r = await fetch('/api/leads', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))) });
      setState(r.ok ? 'sent' : 'error');
    } catch { setState('error'); }
  }

  return (
    <>
      <header className="phead">
        <p className="eyebrow">get ode</p>
        <h1 className="display">bring ode to <em>your café.</em></h1>
        <p className="lede">Tell us a little about your café. We will set up a free 30-day pilot with you.</p>
      </header>

      <section className="get wrap">
        {state === 'sent' ? (
          <div className="get__sent card">
            <Seal size={96} />
            <p className="display">thank <em>you.</em></p>
            <p>We will be in touch within two working days to plan your pilot.</p>
          </div>
        ) : (
          <form className="get__form card" onSubmit={submit}>
            <label>Café name<input className="field" name="cafe_name" required minLength={2} maxLength={80} autoComplete="organization" /></label>
            <label>Your name<input className="field" name="name" required minLength={2} maxLength={60} autoComplete="name" /></label>
            <label>City<input className="field" name="city" required minLength={2} maxLength={40} autoComplete="address-level2" /></label>
            <label>Phone or email<input className="field" name="contact" required minLength={5} maxLength={80} /></label>
            <label className="get__wide">Anything we should know? <span>optional</span><textarea className="field" name="message" rows={4} maxLength={600} placeholder="How many tables, what you serve, when you would like to start…" /></label>
            <input className="get__trap" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <button type="submit" className="btn btn--honey get__wide" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Ask for a free pilot'}</button>
            {state === 'error' && <p className="get__err get__wide" role="alert">That did not go through. Please try again in a moment.</p>}
          </form>
        )}

        <ol className="get__next">
          <li className="get__nextHead">what happens next</li>
          {NEXT.map(([t, d], i) => (
            <li key={t} data-reveal style={{ '--d': i * 0.08 + 's' }}><span>{i + 1}</span><div><b>{t}</b><p>{d}</p></div></li>
          ))}
        </ol>
      </section>
    </>
  );
}
