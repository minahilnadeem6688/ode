import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CafeBar, Mark } from '../components/Brand';
import { Ambient } from '../components/Three';
import { draft } from '../lib/store';
import { useSession } from '../lib/session';
import { EXAMPLES } from '../data/demoCafe';
import './welcome.css';

export default function Welcome() {
  const navigate = useNavigate();
  const [text, setText] = useState(() => draft.get().text);
  const [picked, setPicked] = useState(null);
  const me = useSession('customer');

  function go(path) {
    draft.set({ ...draft.get(), text: text.trim() });
    navigate(path);
  }

  function example(e) {
    setPicked(e);
    setText(e);
  }

  return (
    <main className="screen welcome" style={{ '--bg': 'linear-gradient(165deg, #FBF7F1 0%, #F4EDE2 60%, #EEE3D4 100%)' }}>
      <span className="blob" style={{ width: 240, height: 240, right: -70, top: 40, background: 'rgba(212,165,90,.18)' }} />
      <span className="blob" style={{ width: 200, height: 200, left: -80, bottom: 120, background: 'rgba(196,133,140,.16)' }} />

      <Ambient variant="welcome" />
      <CafeBar />

      <section className="welcome__hero">
        <div className="welcome__mark rise"><Mark size={92} /></div>
        <h1 className="display rise" style={{ '--d': '.08s' }}>
          tell us how<br />you <em>feel.</em>
        </h1>
        <p className="muted rise" style={{ '--d': '.16s' }}>Say it any way you like. We'll pick the drink on our menu that fits, and write it a name just for you.</p>
      </section>

      <section className="welcome__ask rise" style={{ '--d': '.24s' }}>
        <label htmlFor="feel" className="eyebrow">right now, I feel…</label>
        <textarea
          id="feel"
          className="field"
          rows={3}
          maxLength={240}
          value={text}
          onChange={(e) => { setText(e.target.value); setPicked(null); }}
          placeholder="rainy afternoon, missing home, something warm but not too sweet"
        />
        <div className="chips welcome__examples">
          {EXAMPLES.map((e) => (
            <button key={e} type="button" className="chip" aria-pressed={picked === e} onClick={() => example(e)}>{e}</button>
          ))}
        </div>
      </section>

      <div className="welcome__cta rise" style={{ '--d': '.32s' }}>
        <button type="button" className="btn btn--honey btn--block btn--split" disabled={!text.trim()} onClick={() => go('/tune')}>
          <span>Write my ode</span><span aria-hidden="true">→</span>
        </button>
        <p className="welcome__foot"><Link to="/me">my odes</Link><span>·</span>{me ? <Link to="/account">{me.user.name.split(' ')[0].toLowerCase()}’s account</Link> : <Link to="/login">sign in</Link>}<span>·</span><span>pay at the counter</span></p>
      </div>
    </main>
  );
}
