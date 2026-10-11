import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Painted } from '../components/Brand';
import Icon from '../components/Icon';
import { pantry } from '../data/demoCafe';
import { api } from '../lib/api';
import { session, useSession } from '../lib/session';
import { MENU } from '../lib/paths';
import { TableCard } from './CafeTools';
import { byId } from './odes';
import './dashboard.css';
import './cafes.css';

const TABS = [['overview', 'Overview'], ['pantry', 'Pantry'], ['cards', 'Table cards'], ['pilots', 'Pilot requests']];
const pkr = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-PK');
const byName = Object.fromEntries(pantry.map((i) => [i.name, i]));
const ago = (t) => new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// A single-series bar list: one hue, the value written beside each bar.
function Bars({ rows, label }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  if (!rows.length) return <p className="dash__none">Nothing yet. It fills in as orders come in.</p>;
  return (
    <ul className="bars" aria-label={label}>
      {rows.map(([name, n]) => (
        <li key={name} title={`${name}: ${n}`}>
          <span className="bars__name">{byName[name] && <Painted item={byName[name]} size={20} />}{name}</span>
          <span className="bars__track"><i style={{ width: (n / max) * 100 + '%' }} /></span>
          <b>{n}</b>
        </li>
      ))}
    </ul>
  );
}

function Overview() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let live = true;
    const load = () => api.stats().then((x) => live && setS(x)).catch((e) => live && setErr(e.message));
    load();
    const t = setInterval(load, 30000);
    return () => { live = false; clearInterval(t); };
  }, []);
  if (err) return <p className="auth__err">{err}</p>;
  if (!s) return <p className="dash__none">Loading…</p>;
  const hot = s.temperatures.hot || 0, cold = s.temperatures.cold || 0, room = s.temperatures.room || 0, all = hot + cold + room;
  return (
    <>
      <div className="tiles">
        <div className="tile"><small>Orders today</small><b>{s.today.orders}</b></div>
        <div className="tile"><small>Sales today</small><b>{pkr(s.today.revenue)}</b></div>
        <div className="tile"><small>Orders this week</small><b>{s.week.orders}</b><span>{pkr(s.week.revenue)}</span></div>
        <div className="tile"><small>Average rating</small><b>{s.rating.average ? s.rating.average.toFixed(1) : '·'}</b><span>{s.rating.count} rating{s.rating.count === 1 ? '' : 's'}</span></div>
      </div>
      <div className="dash__grid">
        <section className="dash__card">
          <h3>How your customers feel</h3>
          <p className="dash__sub">Moods behind this week’s orders</p>
          <Bars rows={s.moods} label="Moods this week" />
        </section>
        <section className="dash__card">
          <h3>Your busiest ingredients</h3>
          <p className="dash__sub">Keep these well stocked</p>
          <Bars rows={s.ingredients} label="Ingredients this week" />
        </section>
        <section className="dash__card">
          <h3>Warm or iced</h3>
          <p className="dash__sub">This week</p>
          {all ? (
            <>
              <div className="split-bar" role="img" aria-label={`${hot} warm, ${cold} iced, ${room} room temperature`}>
                {hot > 0 && <i style={{ flex: hot, background: '#B85A35' }} />}
                {cold > 0 && <i style={{ flex: cold, background: '#2F7FB5' }} />}
                {room > 0 && <i style={{ flex: room, background: '#A07D2A' }} />}
              </div>
              <ul className="legend">
                <li><i style={{ background: '#B85A35' }} />warm <b>{hot}</b></li>
                <li><i style={{ background: '#2F7FB5' }} />iced <b>{cold}</b></li>
                {room > 0 && <li><i style={{ background: '#A07D2A' }} />room <b>{room}</b></li>}
              </ul>
            </>
          ) : <p className="dash__none">No orders this week yet.</p>}
        </section>
        <section className="dash__card">
          <h3>What they said</h3>
          <p className="dash__sub">Latest ratings</p>
          {s.recent.length ? (
            <ul className="said">
              {s.recent.map((r, i) => (
                <li key={i}><b>{r.name}</b><span className="said__stars" aria-label={r.rating + ' out of 5'}>{'★'.repeat(r.rating)}<em>{'★'.repeat(5 - r.rating)}</em></span>{r.chips.length > 0 && <small>{r.chips.join(' · ')}</small>}</li>
              ))}
            </ul>
          ) : <p className="dash__none">Ratings appear here once customers rate their odes.</p>}
        </section>
      </div>
    </>
  );
}

function Pantry() {
  const [out, setOut] = useState(null);
  useEffect(() => { api.cafe().then((c) => setOut(c.out)).catch(() => setOut([])); }, []);
  const flip = async (id) => { const r = await api.stock(null, id, !out.includes(id)); setOut(r.out); };
  if (!out) return <p className="dash__none">Loading…</p>;
  return (
    <>
      <p className="dash__lede">Tap to switch an ingredient out of stock. New drinks stop using it straight away; tap again when it is back.</p>
      <div className="pd__shelf dash__shelf">
        {pantry.map((i) => (
          <button key={i.id} type="button" className={out.includes(i.id) ? 'out' : ''} aria-pressed={!out.includes(i.id)} onClick={() => flip(i.id)}>
            <Painted item={byId[i.id]} size={30} /><span>{i.name}</span><small>{out.includes(i.id) ? 'out of stock' : 'in stock · ' + i.unit}</small>
          </button>
        ))}
      </div>
    </>
  );
}

function Pilots() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.leads().then((r) => setRows(r.leads)).catch((e) => setErr(e.message)); }, []);
  if (err) return <p className="auth__err">{err}</p>;
  if (!rows) return <p className="dash__none">Loading…</p>;
  if (!rows.length) return <p className="dash__none">No pilot requests yet. They arrive from the Get ode page.</p>;
  return (
    <div className="leads">
      {rows.map((l, i) => (
        <article key={i} className="lead">
          <div><b>{l.cafe_name}</b><small>{l.city} · {ago(l.createdAt)}</small></div>
          <p>{l.name} · <a href={l.contact.includes('@') ? 'mailto:' + l.contact : 'tel:' + l.contact.replace(/[^\d+]/g, '')}>{l.contact}</a></p>
          {l.message && <p className="lead__msg">{l.message}</p>}
        </article>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const team = useSession('team');
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  if (!team) return <Navigate to="/login?as=team" replace />;
  const tabs = TABS.filter(([id]) => id !== 'pilots' || team.admin);
  const out = () => { session.clear('team'); navigate('/login?as=team'); };

  return (
    <div className="dash">
      <aside className="dash__side">
        <p className="dash__cafe"><span>{team.cafe.name[0]}</span>{team.cafe.name}</p>
        <nav>
          {tabs.map(([id, label]) => <button key={id} type="button" className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>)}
          <a href="/barista" target="_blank" rel="noreferrer">Order board <Icon name="share" size={15} /></a>
          <a href={MENU} target="_blank" rel="noreferrer">Customer menu <Icon name="share" size={15} /></a>
        </nav>
        <button type="button" className="dash__out" onClick={out}>Sign out</button>
      </aside>
      <main className="dash__main">
        <header className="dash__head">
          <h1 className="display">{tabs.find(([id]) => id === tab)[1].toLowerCase()}</h1>
          <span className="pill">{team.admin ? 'owner' : 'café team'}</span>
        </header>
        {tab === 'overview' && <Overview />}
        {tab === 'pantry' && <Pantry />}
        {tab === 'cards' && <TableCard />}
        {tab === 'pilots' && team.admin && <Pilots />}
      </main>
    </div>
  );
}
