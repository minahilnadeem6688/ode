import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MENU } from '../lib/paths';
import { CafeBar } from '../components/Brand';
import { Ambient } from '../components/Three';
import Icon from '../components/Icon';
import { draft } from '../lib/store';
import { MOODS, FLAVOURS, DIETS } from '../data/demoCafe';
import './tune.css';

const TEMPS = [
  ['hot', 'hot', 'linear-gradient(160deg,#F7E0D6,#EDC6B8)'],
  ['cold', 'iced', 'linear-gradient(160deg,#E4EEF2,#CFE0E8)'],
  ['room', 'neither', 'linear-gradient(160deg,#F5EDDC,#E9DCC3)'],
];
const SWEET = ['barely', 'a little', 'just right', 'sweet', 'dessert'];

export default function Tune() {
  const navigate = useNavigate();
  const [d, setD] = useState(draft.get);
  const update = (patch) => setD((cur) => { const next = { ...cur, ...patch }; draft.set(next); return next; });
  const toggle = (key, value, max = 99) => {
    const list = d[key];
    if (list.includes(value)) return update({ [key]: list.filter((x) => x !== value) });
    if (list.length < max) update({ [key]: [...list, value] });
  };

  return (
    <main className="screen tune" style={{ '--bg': 'linear-gradient(160deg, #FAF6F0, #F2EBE0)' }}>
      <Ambient variant="tune" />
      <CafeBar left={<button type="button" className="iconbtn" aria-label="Back" onClick={() => navigate(MENU)}><Icon name="back" /></button>} />

      <h1 className="display tune__title rise">a little <em>more</em><br />about you</h1>
      {d.text && <p className="tune__quote rise" style={{ '--d': '.06s' }}>“{d.text}”</p>}
      <p className="muted tune__sub rise" style={{ '--d': '.1s' }}>All optional, except anything we must avoid.</p>

      <section className="tune__group rise" style={{ '--d': '.14s' }}>
        <h2 className="eyebrow">how you feel</h2>
        <div className="chips">
          {MOODS.map((m, i) => (
            <button key={m} type="button" className={'chip' + (i % 2 ? ' chip--cherry' : '')} aria-pressed={d.moods.includes(m)} onClick={() => toggle('moods', m, 2)}>{m}</button>
          ))}
        </div>
      </section>

      <section className="tune__group rise" style={{ '--d': '.2s' }}>
        <h2 className="eyebrow">temperature</h2>
        <div className="tune__temps">
          {TEMPS.map(([id, label, bg]) => (
            <button key={id} type="button" className="tune__temp" aria-pressed={d.temp === id} style={{ '--tbg': bg }} onClick={() => update({ temp: d.temp === id ? null : id })}>
              <span className={'tune__glyph tune__glyph--' + id} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="tune__group rise" style={{ '--d': '.26s' }}>
        <h2 className="eyebrow">sweetness · <span className="tune__sweetword">{SWEET[Math.min(4, Math.floor((d.sweetness - 1) / 2))]}</span></h2>
        <input className="tune__slider" type="range" min="1" max="10" value={d.sweetness} style={{ '--v': ((d.sweetness - 1) / 9) * 100 + '%' }} onChange={(e) => update({ sweetness: +e.target.value })} aria-label="Sweetness" />
      </section>

      <section className="tune__group rise" style={{ '--d': '.32s' }}>
        <h2 className="eyebrow">flavours you're drawn to <span className="tune__hint">up to 3</span></h2>
        <div className="chips">
          {FLAVOURS.map((f) => (
            <button key={f} type="button" className="chip" aria-pressed={d.flavours.includes(f)} onClick={() => toggle('flavours', f, 3)}>{f}</button>
          ))}
        </div>
      </section>

      <section className="tune__group tune__safety rise" style={{ '--d': '.38s' }}>
        <h2 className="eyebrow"><Icon name="alert" size={15} /> anything we must avoid</h2>
        <div className="chips">
          {DIETS.map(([id, label]) => (
            <button key={id} type="button" className="chip chip--alert" aria-pressed={d.diet.includes(id)} onClick={() => toggle('diet', id)}>{label}</button>
          ))}
        </div>
        <input className="field tune__notes" value={d.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="other allergies or dislikes" maxLength={120} />
        <p className="tune__fine">These are rules, not suggestions. The barista sees them in red.</p>
      </section>

      <div className="tune__cta">
        <button type="button" className="btn btn--honey btn--block btn--split" onClick={() => navigate('/crafting')}>
          <span>Write my ode</span><span aria-hidden="true">→</span>
        </button>
      </div>
    </main>
  );
}
