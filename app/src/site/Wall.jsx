import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Painted, Portrait } from '../components/Brand';
import Icon from '../components/Icon';
import { MENU } from '../lib/paths';
import { WALL, MOOD_TINT } from './odes';
import './pages.css';

const MOODS = ['all', ...new Set(WALL.map((o) => o.mood.primary))];
const SHAPES = [375, 300, 420, 340];

// Cards lean towards the pointer, like picking up a photo.
const lean = (e) => {
  const el = e.currentTarget, r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
  el.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
};
const settle = (e) => { e.currentTarget.style.transform = ''; };

export default function Wall() {
  const [mood, setMood] = useState('all');
  const [open, setOpen] = useState(null);
  const list = WALL.filter((o) => mood === 'all' || o.mood.primary === mood);
  useEffect(() => {
    if (!open) return undefined;
    const k = (e) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);

  return (
    <>
      <header className="phead" style={{ '--tint': 'rgba(184,166,217,.24)' }}>
        <p className="eyebrow">the wall</p>
        <h1 className="display">no two <em className="cherry">alike.</em></h1>
        <p className="lede">Every ode is written for one person and one moment. Here are some from our demo café. Tap one to see what went into it.</p>
      </header>

      <div className="wall__filters wrap" role="radiogroup" aria-label="Filter by mood">
        {MOODS.map((m) => <button key={m} type="button" role="radio" aria-checked={mood === m} className="chip" onClick={() => setMood(m)} style={{ '--tint': MOOD_TINT[m] }}>{m}</button>)}
      </div>

      <section className="wall wrap">
        {list.map((o, i) => (
          <button key={o.id + mood} type="button" className="wall__pin" style={{ '--i': i }} onPointerMove={lean} onPointerLeave={settle} onClick={() => setOpen(o)}>
            <span className="wall__art"><Portrait creation={o} width={300} height={SHAPES[i % 4]} id={'wl' + o.id} /></span>
            <span className="wall__cap"><b>{o.name}</b><i>{o.lines[0]} {o.lines[1]}</i><small>{o.mood.primary} · {o.recipe.temperature === 'hot' ? 'warm' : 'iced'}</small></span>
          </button>
        ))}
      </section>

      {open && createPortal(
        <div className="lb" role="dialog" aria-modal="true" aria-label={open.name} onClick={() => setOpen(null)}>
          <div className="lb__card" onClick={(e) => e.stopPropagation()} style={{ '--tint': MOOD_TINT[open.mood.primary] }}>
            <button type="button" className="iconbtn lb__x" aria-label="Close" onClick={() => setOpen(null)}><Icon name="close" /></button>
            <span className="lb__art"><Portrait creation={open} width={460} height={460} id="lbart" /></span>
            <div className="lb__body">
              <small>{open.mood.primary} · {open.recipe.temperature === 'hot' ? 'warm' : 'iced'}</small>
              <h2 className="display">{open.name}</h2>
              <p className="poem">{open.lines[0]}<br />{open.lines[1]}</p>
              <div className="lb__ings">{open.recipe.ingredients.map((x) => <span key={x.id}><Painted item={x} size={40} /><em>{x.name.toLowerCase()}</em></span>)}</div>
              <div className="lb__foot"><b>Rs {open.price}</b><Link to={MENU} className="btn btn--honey">Write your own</Link></div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
