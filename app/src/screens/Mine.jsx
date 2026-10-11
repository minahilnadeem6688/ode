import { Link, useNavigate } from 'react-router-dom';
import { MENU } from '../lib/paths';
import { CafeBar, Mark, Portrait } from '../components/Brand';
import Icon from '../components/Icon';
import { creations } from '../lib/store';
import { useSession } from '../lib/session';
import './mine.css';

const when = (t) => {
  const d = Math.floor((Date.now() - t) / 864e5);
  return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
};

export default function Mine() {
  const navigate = useNavigate();
  const all = creations.all();
  const me = useSession('customer');

  return (
    <main className="screen mine" style={{ '--bg': 'linear-gradient(160deg, #FAF6F0, #F2EBE0)' }}>
      <CafeBar left={<button type="button" className="iconbtn" aria-label="Back" onClick={() => navigate(MENU)}><Icon name="back" /></button>} />
      <h1 className="display mine__title rise">my <em className="cherry">odes</em></h1>
      <p className="muted rise" style={{ '--d': '.06s', margin: '8px 0 0' }}>{all.length ? `${all.length} drink${all.length === 1 ? '' : 's'} saved on this phone.` : 'Nothing saved yet.'} {me ? <Link to="/account">See your account</Link> : <Link to="/login">Sign in to keep them on any phone</Link>}</p>

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
          <Link to={MENU} className="btn btn--honey">Write your first</Link>
        </div>
      )}
    </main>
  );
}
