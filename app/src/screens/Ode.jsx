import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CafeBar, Painted } from '../components/Brand';
import { Cup } from '../components/Three';
import Icon from '../components/Icon';
import { creations, orders } from '../lib/store';
import './ode.css';

const SIZES = [['regular', 'regular', 0], ['large', 'large', 150]];

export default function Ode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const c = creations.get(id);
  const [saved, setSaved] = useState(() => creations.isSaved(id));
  const [size, setSize] = useState('regular');

  if (!c) return <main className="screen"><CafeBar /><p className="muted">This ode isn't on this device. <Link to="/">Write a new one</Link>.</p></main>;

  const extra = SIZES.find((s) => s[0] === size)[2];
  const price = c.price + extra;
  const moods = [c.mood.primary, c.mood.secondary, c.mood.temperature === 'hot' ? 'warm' : c.mood.temperature === 'cold' ? 'cool' : null].filter(Boolean);

  function toggleSave() {
    if (saved) creations.unsave(c.id); else creations.save(c);
    setSaved(!saved);
  }
  function order() {
    if (!saved) creations.save(c);
    const o = orders.place(c, size);
    navigate('/order/' + o.code);
  }

  return (
    <main className="screen ode" style={{ '--bg': 'linear-gradient(165deg, #F8EEF0 0%, #F1E1E3 55%, #EAD8DA 100%)' }}>
      <span className="blob" style={{ width: 230, height: 230, right: -80, top: 120, background: 'rgba(196,133,140,.2)' }} />
      <CafeBar
        left={<button type="button" className="iconbtn" aria-label="Write another" onClick={() => navigate('/')}><Icon name="close" /></button>}
        right={
          <span style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="iconbtn" aria-label="Share" onClick={() => navigate('/share/' + c.id)}><Icon name="share" /></button>
            <button type="button" className={'iconbtn ode__heart' + (saved ? ' on' : '')} aria-label={saved ? 'Saved' : 'Save'} aria-pressed={saved} onClick={toggleSave}><Icon name="heart" fill={saved ? 'currentColor' : 'none'} /></button>
          </span>
        }
      />

      <div className="ode__art fade"><Cup creation={c} className="ode__cup" /><span className="ode__hint">drag to turn</span></div>

      <p className="eyebrow ode__label rise" style={{ '--d': '.15s' }}>your ode</p>
      <h1 className="display ode__name rise" style={{ '--d': '.22s' }}>{c.name}</h1>
      <p className="poem ode__poem rise" style={{ '--d': '.3s' }}>{c.lines[0]}<br />{c.lines[1]}</p>

      <div className="ode__match rise" style={{ '--d': '.38s' }}>
        <span className="ode__ring" style={{ '--p': c.match + '%' }}><b>{c.match}%</b></span>
        <span><small>mood match</small>{moods.join(' · ')}</span>
      </div>

      <div className="ode__ings rise" style={{ '--d': '.44s' }}>
        {c.recipe.ingredients.map((i) => (
          <div key={i.id}><span className="ode__ing"><Painted item={i} size={50} /></span>{i.name.toLowerCase()}</div>
        ))}
      </div>

      <div className="ode__order rise" style={{ '--d': '.5s' }}>
        <div className="ode__sizes" role="radiogroup" aria-label="Size">
          {SIZES.map(([sid, label, add]) => (
            <button key={sid} type="button" role="radio" aria-checked={size === sid} onClick={() => setSize(sid)}>{label}{add ? <small> +{add}</small> : null}</button>
          ))}
        </div>
        <button type="button" className="btn btn--cherry btn--block btn--split" onClick={order}>
          <span>Order this</span><span>Rs {price.toLocaleString('en-PK')}</span>
        </button>
        <button type="button" className="ode__again" onClick={() => navigate('/')}>not quite you? write another</button>
      </div>
    </main>
  );
}
