import { Link, useNavigate } from 'react-router-dom';
import { CafeBar, Mark, Portrait } from '../components/Brand';
import { Ambient } from '../components/Three';
import Icon from '../components/Icon';
import { creations } from '../lib/store';
import './mine.css';

const when = (t) => {
  const d = Math.floor((Date.now() - t) / 864e5);
  return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
};

export default function Mine() {
  const navigate = useNavigate();
  const all = creations.all();

  return (
    <main className="screen mine" style={{ '--bg': 'linear-gradient(160deg, #FAF6F0, #F2EBE0)' }}>
      <Ambient variant="quiet" />
      <CafeBar left={<button type="button" className="iconbtn" aria-label="Back" onClick={() => navigate('/')}><Icon name="back" /></button>} />
      <h1 className="display mine__title rise">my <em className="cherry">odes</em></h1>
      <p className="muted rise" style={{ '--d': '.06s', margin: '8px 0 0' }}>{all.length ? `${all.length} drink${all.length === 1 ? '' : 's'} written for you.` : 'Nothing saved yet.'}</p>

      {all.length ? (
        <div className="mine__grid">
          {all.map((c, i) => (
            <Link key={c.id} to={'/ode/' + c.id} className="mine__item rise" style={{ '--d': 0.08 + i * 0.05 + 's' }}>
              <span className="mine__art"><Portrait creation={c} width={240} height={280} id={'m' + i} /></span>
              <b>{c.name}</b>
              <small>{c.mood.primary} · {when(c.savedAt || c.createdAt)}{c.rating ? ` · ${'★'.repeat(c.rating)}` : ''}</small>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mine__empty rise">
          <Mark size={70} />
          <p className="poem">every ode you love<br />will wait for you here.</p>
          <Link to="/" className="btn btn--honey">Write your first</Link>
        </div>
      )}
    </main>
  );
}
