import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Mark, Painted, Portrait } from '../components/Brand';
import Icon from '../components/Icon';
import { INGREDIENT_COLORS } from '../brand/portrait';
import { api } from '../lib/api';
import { session, useSession } from '../lib/session';
import { MENU } from '../lib/paths';
import { MOOD_TINT } from './odes';
import './account.css';
import './pages.css';

const when = (t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const STATUS = { new: 'received', making: 'being made', ready: 'ready', collected: 'collected' };

// What their odes say about them: moods, warm or iced, and the colours they keep coming back to.
function taste(odes) {
  const count = (list) => Object.entries(list.reduce((m, k) => ({ ...m, [k]: (m[k] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
  const moods = count(odes.map((c) => c.mood.primary));
  const temps = count(odes.map((c) => c.recipe.temperature));
  const ings = count(odes.flatMap((c) => c.recipe.ingredients.filter((i) => i.id !== 'ice').map((i) => i.id)));
  return { moods, temps, ings, total: odes.length };
}

export default function Account() {
  const me = useSession('customer');
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (!me) return;
    api.me().then(setData).catch((e) => { if (e.status === 401) { session.clear('customer'); } else setErr(e.message); });
  }, [me]);

  const profile = useMemo(() => {
    if (!data) return null;
    const seen = new Map();
    [...data.saved, ...data.orders.map((o) => o.creation).filter(Boolean)].forEach((c) => seen.set(c.id, c));
    return taste([...seen.values()]);
  }, [data]);

  if (!me) return <Navigate to="/login" replace />;
  const out = () => { session.clear('customer'); navigate('/'); };

  return (
    <div className="acct wrap">
      <header className="acct__head">
        <div>
          <p className="eyebrow">your account</p>
          <h1 className="display">hello, <em>{me.user.name.split(' ')[0].toLowerCase()}.</em></h1>
          <p className="auth__lede">Member since {when(me.user.createdAt)} · {me.user.email}</p>
        </div>
        <div className="acct__actions">
          <Link to={MENU} className="btn btn--honey">Write a new ode</Link>
          <button type="button" className="btn btn--ghost" onClick={out}>Sign out</button>
        </div>
      </header>

      {err && <p className="auth__err">{err}</p>}
      {!data && !err && <div className="acct__loading"><Mark size={40} /></div>}

      {data && (
        <>
          {profile.total > 0 && (
            <section className="taste card">
              <div>
                <p className="eyebrow">your taste</p>
                <h2 className="display">{profile.moods[0] ? <>mostly <em>{profile.moods[0][0]}</em></> : 'still learning'}{profile.temps[0] ? <>, usually <em>{profile.temps[0][0] === 'hot' ? 'warm' : profile.temps[0][0] === 'cold' ? 'iced' : 'room temperature'}.</em></> : '.'}</h2>
                <div className="taste__moods">
                  {profile.moods.slice(0, 5).map(([m, n]) => <span key={m} className="pill" style={{ background: MOOD_TINT[m] }}>{m} · {n}</span>)}
                </div>
              </div>
              <div className="taste__palette" aria-label="The colours of your odes">
                {profile.ings.slice(0, 6).map(([id, n], i) => <span key={id} style={{ '--c': INGREDIENT_COLORS[id] || '#E8DCCB', '--n': n, '--i': i }} title={id.replace('_', ' ')} />)}
              </div>
            </section>
          )}

          <section className="acct__sec">
            <div className="acct__secHead"><h2 className="display">saved <em className="cherry">odes</em></h2><span>{data.saved.length}</span></div>
            {data.saved.length ? (
              <div className="wall acct__wall">
                {data.saved.map((c, i) => (
                  <button key={c.id} type="button" className="wall__pin" style={{ '--i': i }} onClick={() => setOpen(c)}>
                    <span className="wall__art"><Portrait creation={c} width={300} height={[360, 300, 400][i % 3]} id={'ac' + i} /></span>
                    <span className="wall__cap"><b>{c.name}</b><i>{c.lines[0]} {c.lines[1]}</i><small>saved {when(c.savedAt)}</small></span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="acct__empty">Tap the heart on any ode and it will wait for you here. <Link to={MENU}>Write one now</Link>.</p>
            )}
          </section>

          <section className="acct__sec">
            <div className="acct__secHead"><h2 className="display">your <em>orders</em></h2><span>{data.orders.length}</span></div>
            {data.orders.length ? (
              <ul className="orders">
                {data.orders.map((o) => (
                  <li key={o.id}>
                    {o.creation && <span className="orders__art"><Portrait creation={o.creation} width={80} height={80} id={'or' + o.id} /></span>}
                    <div><b>{o.creation?.name || 'An ode'}</b><small>{when(o.placedAt)} · {o.size} · code {o.code}</small></div>
                    <span className={'orders__st s-' + o.status}>{STATUS[o.status]}</span>
                    <b className="orders__price">Rs {o.price.toLocaleString('en-PK')}</b>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="acct__empty">Orders you place while signed in will appear here.</p>
            )}
          </section>
        </>
      )}

      {open && createPortal(
        <div className="lb" role="dialog" aria-modal="true" aria-label={open.name} onClick={() => setOpen(null)}>
          <div className="lb__card" onClick={(e) => e.stopPropagation()} style={{ '--tint': MOOD_TINT[open.mood.primary] }}>
            <button type="button" className="iconbtn lb__x" aria-label="Close" onClick={() => setOpen(null)}><Icon name="close" /></button>
            <span className="lb__art"><Portrait creation={open} width={460} height={460} id="aclb" /></span>
            <div className="lb__body">
              <small>{open.mood.primary} · {open.recipe.temperature === 'hot' ? 'warm' : 'iced'}</small>
              <h2 className="display">{open.name}</h2>
              <p className="poem">{open.lines[0]}<br />{open.lines[1]}</p>
              <div className="lb__ings">{open.recipe.ingredients.map((x) => <span key={x.id}><Painted item={x} size={40} /><em>{x.name.toLowerCase()}</em></span>)}</div>
              <div className="lb__foot"><b>Rs {open.price}</b>
                <button type="button" className="btn btn--ghost" onClick={async () => { await api.save(open.id, false); setData((d) => ({ ...d, saved: d.saved.filter((x) => x.id !== open.id) })); setOpen(null); }}>Remove</button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
