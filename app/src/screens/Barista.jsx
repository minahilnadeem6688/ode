import { useEffect, useRef, useState } from 'react';
import { Painted } from '../components/Brand';
import Icon from '../components/Icon';
import { orders, stock } from '../lib/store';
import { api, online } from '../lib/api';
import { cafe, pantry, DIETS } from '../data/demoCafe';
import './barista.css';

const COLUMNS = [['new', 'new', 'Start making'], ['making', 'making', 'Ready'], ['ready', 'ready', 'Collected']];
const NEXT = { new: 'making', making: 'ready', ready: 'collected' };
const ago = (t) => { const m = Math.floor((Date.now() - t) / 60000); return m < 1 ? 'just now' : m + ' min'; };

// A soft two-note chime for new orders.
function chime() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    [660, 880].forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = f; o.type = 'sine';
      g.gain.setValueAtTime(0.0001, ac.currentTime + i * 0.16);
      g.gain.exponentialRampToValueAtTime(0.18, ac.currentTime + i * 0.16 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + i * 0.16 + 0.5);
      o.connect(g).connect(ac.destination); o.start(ac.currentTime + i * 0.16); o.stop(ac.currentTime + i * 0.16 + 0.55);
    });
  } catch { /* no audio */ }
}

const readKey = () => { try { return localStorage.getItem('ode.staff') || ''; } catch { return ''; } };

// Orders and stock, from the API when it is there, otherwise shared between tabs on this device.
function useBoard() {
  const [mode, setMode] = useState(null); // 'online' | 'device'
  const [key, setKey] = useState(readKey);
  const [problem, setProblem] = useState(''); // '' | 'key' | message
  const [list, setList] = useState([]);
  const [out, setOut] = useState([]);
  const seen = useRef(null);

  const take = (all, nextOut) => {
    const codes = all.map((o) => o.code + o.placedAt);
    if (seen.current && codes.some((c) => !seen.current.has(c))) chime();
    seen.current = new Set(codes);
    setList(all);
    if (nextOut) setOut(nextOut);
  };

  useEffect(() => { online().then((on) => setMode(on ? 'online' : 'device')); }, []);

  useEffect(() => {
    if (mode !== 'device') return undefined;
    take(orders.all(), stock.out());
    return orders.subscribe((all) => take(all));
  }, [mode]);

  const refresh = async () => {
    try {
      const b = await api.board(key);
      take(b.orders, b.out);
      setProblem('');
    } catch (e) {
      setProblem(e.status === 401 ? 'key' : e.message);
    }
  };
  useEffect(() => {
    if (mode !== 'online') return undefined;
    let live = true, timer;
    const loop = async () => { await refresh(); if (live) timer = setTimeout(loop, document.hidden ? 15000 : 4000); };
    loop();
    return () => { live = false; clearTimeout(timer); };
  }, [mode, key]);

  const advance = async (o) => {
    if (mode === 'device') { orders.setStatus(o.code, NEXT[o.status]); return setList(orders.all()); }
    setList((l) => l.map((x) => (x.id === o.id ? { ...x, status: NEXT[o.status] } : x)));
    try { await api.advance(key, o.id, NEXT[o.status]); } catch { /* someone else moved it; the refresh shows where it is */ }
    refresh();
  };
  const toggleStock = async (id) => {
    if (mode === 'device') { stock.toggle(id); return setOut(stock.out()); }
    try { setOut((await api.stock(key, id, !out.includes(id))).out); } catch (e) { setProblem(e.status === 401 ? 'key' : e.message); }
  };
  const saveKey = (k) => { try { localStorage.setItem('ode.staff', k); } catch { /* private mode */ } setKey(k); };

  return { mode, list, out, problem, advance, toggleStock, saveKey };
}

export default function Barista() {
  const { mode, list, out, problem, advance, toggleStock, saveKey } = useBoard();
  const [pantryOpen, setPantryOpen] = useState(false);
  const [draftKey, setDraftKey] = useState('');
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(t); }, []);

  const dietLabel = Object.fromEntries(DIETS);

  return (
    <main className="board">
      <header className="board__top">
        <div className="board__brand"><span>{cafe.name} · orders</span></div>
        <button type="button" className="board__pantrybtn" onClick={() => setPantryOpen(!pantryOpen)}>pantry{out.length ? ` · ${out.length} out` : ''}</button>
      </header>

      {pantryOpen && (
        <section className="board__pantry" aria-label="Pantry">
          <p>Tap to mark out of stock. New drinks stop using it straight away.</p>
          <div className="board__pgrid">
            {pantry.map((i) => (
              <button key={i.id} type="button" className={out.includes(i.id) ? 'out' : ''} aria-pressed={!out.includes(i.id)} onClick={() => toggleStock(i.id)}>
                <Painted item={i} size={34} /><span>{i.name}</span><small>{out.includes(i.id) ? 'out' : 'in stock'}</small>
              </button>
            ))}
          </div>
        </section>
      )}

      {problem === 'key' && (
        <form className="board__key" onSubmit={(e) => { e.preventDefault(); saveKey(draftKey.trim()); }}>
          <label htmlFor="staffkey">Sign in to see your orders</label>
          <p><a href="/login?as=team">Sign in as the café team</a>, or type the café key for this screen only.</p>
          <div><input id="staffkey" type="password" autoComplete="off" value={draftKey} onChange={(e) => setDraftKey(e.target.value)} /><button type="submit" className="btn btn--honey">Open board</button></div>
        </form>
      )}
      {problem && problem !== 'key' && <p className="board__problem" role="alert">{problem}</p>}

      {problem !== 'key' && <div className="board__cols">
        {COLUMNS.map(([status, label, action]) => {
          const col = list.filter((o) => o.status === status);
          return (
            <section key={status} className={'board__col board__col--' + status}>
              <h2>{label} <span>{col.length}</span></h2>
              {col.length === 0 && <p className="board__empty">nothing here</p>}
              {col.map((o) => {
                const c = o.creation;
                const flags = [...(c.input.diet || []).map((d) => dietLabel[d]), c.input.notes].filter(Boolean);
                return (
                  <article key={o.id || o.code} className="ticket">
                    <div className="ticket__head"><b className="ticket__code">{o.code}</b><span>{ago(o.placedAt)}</span></div>
                    <h3 className="ticket__name">{c.name}</h3>
                    <p className="ticket__meta">{o.size} · {c.recipe.temperature} · {c.recipe.method} · ~{Math.round(c.recipe.prepSeconds / 60 * 10) / 10} min</p>
                    {flags.length > 0 && <p className="ticket__flags"><Icon name="alert" size={16} /> {flags.join(' · ')}</p>}
                    <ul className="ticket__ings">
                      {c.recipe.ingredients.map((i) => <li key={i.id}><Painted item={i} size={26} /><span>{i.name}</span><small>{i.unit}{o.size === 'large' && i.category !== 'finish' ? ' ×1.5' : ''}</small></li>)}
                    </ul>
                    <ol className="ticket__steps">{c.recipe.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                    <button type="button" className="btn btn--block ticket__go" onClick={() => advance(o)}>{action}</button>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>}
    </main>
  );
}
