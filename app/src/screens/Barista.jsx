import { useEffect, useRef, useState } from 'react';
import { Lockup, Painted } from '../components/Brand';
import Icon from '../components/Icon';
import { orders, stock } from '../lib/store';
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

export default function Barista() {
  const [list, setList] = useState(orders.all);
  const [out, setOut] = useState(stock.out);
  const [pantryOpen, setPantryOpen] = useState(false);
  const [, tick] = useState(0);
  const seen = useRef(new Set(orders.all().map((o) => o.code)));

  useEffect(() => orders.subscribe((all) => {
    if (all.some((o) => !seen.current.has(o.code))) chime();
    all.forEach((o) => seen.current.add(o.code));
    setList(all);
  }), []);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(t); }, []);

  const advance = (o) => { orders.setStatus(o.code, NEXT[o.status]); setList(orders.all()); };
  const toggleStock = (id) => { stock.toggle(id); setOut(stock.out()); };
  const dietLabel = Object.fromEntries(DIETS);

  return (
    <main className="board">
      <header className="board__top">
        <div className="board__brand"><Lockup size={20} color="var(--cream)" /><span>{cafe.name} · orders</span></div>
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

      <div className="board__cols">
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
                  <article key={o.code} className="ticket">
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
      </div>
    </main>
  );
}
