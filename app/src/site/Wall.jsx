import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Mark, Painted } from '../components/Brand';
import Icon from '../components/Icon';
import { INGREDIENT_COLORS } from '../brand/portrait';
import { MENU } from '../lib/paths';
import { WALL, MOOD_TINT } from './odes';
import { STILLS } from './stills';
import './wall.css';
import './pages.css';

const shot = Object.fromEntries(STILLS.map((s) => [s.id, s]));

// Boards: moments people actually search for, each a filter on the wall.
const BOARDS = [
  ['rainy days', (o) => ['cozy', 'nostalgic'].includes(o.mood.primary), 'w9'],
  ['golden hour', (o) => ['playful', 'energetic'].includes(o.mood.primary), 'w2'],
  ['slow mornings', (o) => ['calm', 'tired'].includes(o.mood.primary), 'w14'],
  ['date night', (o) => o.mood.primary === 'romantic', 'w5'],
  ['iced', (o) => o.recipe.temperature === 'cold', 'w19'],
  ['deep breaths', (o) => o.mood.primary === 'stressed', 'w12'],
];

const read = () => { try { return JSON.parse(localStorage.getItem('ode.wall') || '[]'); } catch { return []; } };

// The wall is mostly photographs, with a typographic pin or a palette now and then, like a real board.
function pins(list) {
  const out = [];
  list.forEach((o, i) => {
    out.push({ kind: 'photo', o });
    if (i % 6 === 2) out.push({ kind: 'quote', o });
    if (i % 9 === 6) out.push({ kind: 'palette', o });
  });
  return out;
}

function Photo({ o, saved, onSave, onOpen }) {
  const s = shot[o.id];
  const [loaded, setLoaded] = useState(false);
  return (
    <article className="pin">
      <button type="button" className="pin__img" style={{ aspectRatio: `${s.width} / ${s.height}`, background: s.table }} onClick={onOpen} aria-label={`Open ${o.name}`}>
        <img src={s.src} alt={`${o.name}: ${o.recipe.ingredients.map((i) => i.name.toLowerCase()).join(', ')}`} loading="lazy" decoding="async" className={loaded ? 'in' : ''} onLoad={() => setLoaded(true)} />
        <span className="pin__shade" />
        <span className="pin__ings">{o.recipe.ingredients.slice(0, 3).map((x) => <span key={x.id}>{x.name.toLowerCase()}</span>)}</span>
      </button>
      <button type="button" className={'pin__save' + (saved ? ' on' : '')} onClick={onSave}>{saved ? 'Saved' : 'Save'}</button>
      <div className="pin__cap">
        <b>{o.name}</b>
        <span className="pin__by"><i style={{ background: MOOD_TINT[o.mood.primary] }}>D</i>Demo Café · {o.mood.primary}</span>
      </div>
    </article>
  );
}

function Quote({ o, onOpen }) {
  return (
    <button type="button" className="pin pin--quote" style={{ '--tint': MOOD_TINT[o.mood.primary] }} onClick={onOpen}>
      <Mark size={26} />
      <p>{o.lines[0]}<br />{o.lines[1]}</p>
      <small>{o.name}</small>
    </button>
  );
}

function Palette({ o, onOpen }) {
  const cols = o.recipe.ingredients.filter((x) => x.id !== 'ice');
  return (
    <button type="button" className="pin pin--palette" onClick={onOpen}>
      <span className="pin__swatches">{cols.map((x) => <i key={x.id} style={{ background: INGREDIENT_COLORS[x.id] || x.color }} />)}</span>
      <span className="pin__palcap"><b>the colours of {o.name}</b><small>{cols.map((x) => x.name.toLowerCase()).join(' · ')}</small></span>
    </button>
  );
}

export default function Wall() {
  const [q, setQ] = useState('');
  const [board, setBoard] = useState(null);
  const [open, setOpen] = useState(null);
  const [saved, setSaved] = useState(read);
  const toggle = (id) => setSaved((s) => {
    const next = s.includes(id) ? s.filter((x) => x !== id) : [...s, id];
    try { localStorage.setItem('ode.wall', JSON.stringify(next)); } catch { /* private mode */ }
    return next;
  });

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const b = BOARDS.find(([name]) => name === board);
    return WALL.filter((o) => (!b || b[1](o)) && (!term || [o.name, ...o.lines, o.mood.primary, o.recipe.temperature === 'hot' ? 'warm hot' : 'iced cold', ...o.recipe.ingredients.map((i) => i.name)].join(' ').toLowerCase().includes(term)));
  }, [q, board]);

  useEffect(() => {
    if (!open) return undefined;
    const k = (e) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);

  return (
    <div className="wallpage">
      <header className="wallhead wrap">
        <h1 className="display">the <em className="cherry">wall</em></h1>
        <label className="search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search moods, flavours, ingredients…" aria-label="Search the wall" />
          {q && <button type="button" onClick={() => setQ('')} aria-label="Clear search"><Icon name="close" size={16} /></button>}
        </label>
      </header>

      <nav className="boards wrap" aria-label="Boards">
        {BOARDS.map(([name, , cover]) => (
          <button key={name} type="button" className={board === name ? 'on' : ''} aria-pressed={board === name} onClick={() => setBoard(board === name ? null : name)}>
            <span><img src={shot[cover].src} alt="" loading="lazy" /></span>
            {name}
          </button>
        ))}
      </nav>

      <section className="masonry wrap" key={board + q}>
        {list.length === 0 && <p className="wall__nothing">Nothing here yet. <Link to={MENU}>Write the first one</Link>.</p>}
        {pins(list).map((p, i) => (
          <div key={p.kind + p.o.id} className="masonry__cell" style={{ '--i': Math.min(i, 14) }}>
            {p.kind === 'photo' && <Photo o={p.o} saved={saved.includes(p.o.id)} onSave={() => toggle(p.o.id)} onOpen={() => setOpen(p.o)} />}
            {p.kind === 'quote' && <Quote o={p.o} onOpen={() => setOpen(p.o)} />}
            {p.kind === 'palette' && <Palette o={p.o} onOpen={() => setOpen(p.o)} />}
          </div>
        ))}
      </section>

      {open && createPortal(
        <div className="lb" role="dialog" aria-modal="true" aria-label={open.name} onClick={() => setOpen(null)}>
          <div className="lb__card lb__card--photo" onClick={(e) => e.stopPropagation()} style={{ '--tint': MOOD_TINT[open.mood.primary] }}>
            <button type="button" className="iconbtn lb__x" aria-label="Close" onClick={() => setOpen(null)}><Icon name="close" /></button>
            <span className="lb__photo"><img src={shot[open.id].src} alt={open.name} /></span>
            <div className="lb__body">
              <small>{open.mood.primary} · {open.recipe.temperature === 'hot' ? 'warm' : 'iced'}</small>
              <h2 className="display">{open.name}</h2>
              <p className="poem">{open.lines[0]}<br />{open.lines[1]}</p>
              <div className="lb__ings">{open.recipe.ingredients.map((x) => <span key={x.id}><Painted item={x} size={40} /><em>{x.name.toLowerCase()}</em></span>)}</div>
              <div className="lb__foot">
                <b>Rs {open.price}</b>
                <span className="lb__btns">
                  <button type="button" className={'btn btn--ghost' + (saved.includes(open.id) ? ' is-saved' : '')} onClick={() => toggle(open.id)}>{saved.includes(open.id) ? 'Saved' : 'Save'}</button>
                  <Link to={MENU} className="btn btn--honey">Write one like this</Link>
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
