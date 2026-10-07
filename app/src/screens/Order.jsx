import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { MENU } from '../lib/paths';
import { CafeBar, Portrait } from '../components/Brand';
import { Ambient } from '../components/Three';
import Icon from '../components/Icon';
import { creations, orders } from '../lib/store';
import { api } from '../lib/api';
import './order.css';

const STEPS = [['new', 'received'], ['making', 'being made'], ['ready', 'ready for you']];
const CHIPS = ['perfect', 'too sweet', 'not sweet enough', 'too strong', 'would order again'];

export default function Order() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const local = /^\d{3}$/.test(code); // on-device orders use their code; online ones a private id
  const [o, setO] = useState(() => (local ? orders.get(code) : state));
  const [missing, setMissing] = useState(false);
  const [rating, setRating] = useState(0);
  const [chips, setChips] = useState([]);
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    if (local) return orders.subscribe(() => setO(orders.get(code)));
    let live = true, timer;
    const poll = async () => {
      try {
        const next = await api.orderStatus(code);
        if (!live) return;
        setO(next);
        if (next.status === 'collected') return;
      } catch (e) {
        if (e.status === 404) return live && setMissing(true);
      }
      timer = setTimeout(poll, document.hidden ? 15000 : 4000);
    };
    poll();
    return () => { live = false; clearTimeout(timer); };
  }, [code, local]);

  if (!o && !local && !missing) return <main className="screen screen--narrow order" style={{ '--bg': 'linear-gradient(160deg, #FBF7F1, #F1E9DC)' }}><Ambient variant="order" /><CafeBar /></main>;
  if (!o) return <main className="screen"><CafeBar /><p className="muted">We couldn't find that order. <Link to={MENU}>Start again</Link>.</p></main>;
  const at = o.status === 'collected' ? STEPS.length - 1 : STEPS.findIndex((s) => s[0] === o.status);

  function submit() {
    creations.rate(o.creationId, rating, chips);
    if (!local) api.rate(o.creationId, rating, chips).catch(() => {});
    setThanks(true);
  }

  return (
    <main className="screen screen--narrow order" style={{ '--bg': 'linear-gradient(160deg, #FBF7F1, #F1E9DC)' }}>
      <Ambient variant="order" />
      <CafeBar left={<button type="button" className="iconbtn" aria-label="Home" onClick={() => navigate(MENU)}><Icon name="close" /></button>} />

      <p className="eyebrow order__lbl rise">your order code</p>
      <p className="order__code rise" style={{ '--d': '.05s' }}>{o.code}</p>
      <p className="muted order__pay rise" style={{ '--d': '.1s' }}>Show this at the counter to pay. We'll call it out when it's ready.</p>

      <div className="order__card card rise" style={{ '--d': '.16s' }}>
        <span className="order__thumb"><Portrait creation={o.creation} width={120} height={120} id="ot" /></span>
        <div><b className="order__name">{o.creation.name}</b><small>{o.size} · Rs {(o.price ?? o.creation.price + (o.size === 'large' ? 150 : 0)).toLocaleString('en-PK')}</small></div>
      </div>

      <ol className="order__steps rise" style={{ '--d': '.22s' }} aria-live="polite">
        {STEPS.map(([id, label], i) => (
          <li key={id} className={i < at ? 'done' : i === at ? 'now' : ''}><i>{i < at || o.status === 'ready' || o.status === 'collected' ? <Icon name="check" size={14} width={2.4} /> : null}</i>{label}</li>
        ))}
      </ol>

      {(o.status === 'ready' || o.status === 'collected') && !thanks && (
        <section className="order__rate card rise">
          <p className="display order__ask">how did it <em className="cherry">feel?</em></p>
          <div className="order__stars" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={n + ' stars'} onClick={() => setRating(n)} className={n <= rating ? 'on' : ''}><Icon name="star" size={30} fill={n <= rating ? 'currentColor' : 'none'} /></button>
            ))}
          </div>
          {rating > 0 && (
            <>
              <div className="chips" style={{ justifyContent: 'center' }}>
                {CHIPS.map((c) => <button key={c} type="button" className="chip" aria-pressed={chips.includes(c)} onClick={() => setChips(chips.includes(c) ? chips.filter((x) => x !== c) : [...chips, c])}>{c}</button>)}
              </div>
              <button type="button" className="btn btn--roast btn--block" onClick={submit}>Send</button>
            </>
          )}
        </section>
      )}
      {thanks && <p className="poem order__thanks rise">thank you. the next one will know you better.</p>}

      <div className="order__foot">
        <button type="button" className="btn btn--ghost btn--block" onClick={() => navigate('/share/' + o.creationId)}><Icon name="share" size={20} /> Share your ode</button>
      </div>
    </main>
  );
}
