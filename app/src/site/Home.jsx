import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mark, Painted } from '../components/Brand';
import { Cup, drinkColors } from '../components/Three';
import { readMood, buildRecipe, writeOde, priceOf } from '../lib/craft';
import { MENU } from '../lib/paths';
import Icon from '../components/Icon';
import { HERO, WALL } from './odes';
import { STILLS } from './stills';
import Film from './Film';
import './home.css';

const IDEAS = ['rainy afternoon, missing home', 'first day of summer', 'exam tomorrow', 'lazy sunday', 'late night drive', 'date night'];

// The hero's live demo: the same engine the café menu uses, run in the browser.
function write(text) {
  const mood = readMood({ text });
  const seed = text + 'site';
  const recipe = buildRecipe(mood, seed);
  return { id: 'try-' + seed, ...writeOde(mood, recipe, seed), mood, recipe, price: priceOf(recipe) };
}

function TryIt() {
  const [text, setText] = useState('');
  const [drink, setDrink] = useState(HERO);
  const [n, setN] = useState(0); // bumps to replay the reveal animation
  const go = (t) => { const v = (t ?? text).trim(); if (!v) return; setText(v); setDrink(write(v)); setN((x) => x + 1); };
  const moodWord = drink.mood.primary + (drink.recipe.temperature === 'hot' ? ' · warm' : drink.recipe.temperature === 'cold' ? ' · iced' : '');

  return (
    <div className="try">
      <form className="try__ask" onSubmit={(e) => { e.preventDefault(); go(); }}>
        <label htmlFor="try" className="try__label">try it: how do you feel right now?</label>
        <div className="try__row">
          <input id="try" className="try__input" value={text} onChange={(e) => setText(e.target.value)} placeholder="rainy afternoon, missing home…" maxLength={120} autoComplete="off" />
          <button type="submit" className="btn btn--honey try__go" disabled={!text.trim()}>Write it</button>
        </div>
        <div className="try__ideas">
          {IDEAS.map((i) => <button key={i} type="button" className="chip" onClick={() => go(i)}>{i}</button>)}
        </div>
      </form>

      <div className="try__stage">
        <span className="try__halo" aria-hidden="true" />
        <Cup creation={drink} intro className="try__cup" />
        <figure key={n} className="try__card">
          <small>{moodWord}</small>
          <b>{drink.name}</b>
          <i>{drink.lines[0]}<br />{drink.lines[1]}</i>
          <span className="try__ings">
            {drink.recipe.ingredients.map((x, k) => <span key={x.id} style={{ '--k': k }} title={x.name}><Painted item={x} size={30} /></span>)}
          </span>
          <span className="try__price">Rs {drink.price.toLocaleString('en-PK')}</span>
        </figure>
      </div>
    </div>
  );
}

// Big numbers that count up when they come into view.
function Count({ to, suffix = '' }) {
  const ref = useRef(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t) => { const p = Math.min(1, (t - t0) / 1400); setV(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{v}{suffix}</span>;
}

export default function Home() {
  const names = WALL.map((o) => o.name);

  return (
    <>
      <Film>
        <p className="eyebrow">a mood menu for cafés</p>
        <h1 className="display hero__title"><span>the menu</span><span>is <em>you.</em></span></h1>
        <p className="lede">Your customers scan a QR code, say how they feel, and get a drink written only for them, from the ingredients on your shelf. A name, two lines, its own artwork, ready for your barista.</p>
        <div className="hero__ctas">
          <Link to="/get-ode" className="btn btn--roast">Start a free pilot</Link>
          <Link to="/how-it-works" className="btn btn--ghost">See how it works</Link>
        </div>
      </Film>

      <section className="section tryzone">
        <p className="eyebrow" data-reveal>try it</p>
        <h2 className="display h2" data-reveal style={{ '--d': '.08s' }}>write one <em>yourself.</em></h2>
        <p className="lede" data-reveal style={{ '--d': '.14s' }}>The same engine your customers use, right here. Type a feeling and watch a drink get written for it.</p>
        <TryIt />
      </section>

      <div className="marquee" aria-hidden="true">
        <div>{[...names, ...names].map((x, i) => <span key={i}><Mark size={16} />{x}</span>)}</div>
      </div>

      <section className="section">
        <p className="eyebrow" data-reveal>why cafés choose ode</p>
        <h2 className="display h2" data-reveal style={{ '--d': '.08s' }}>a menu people <em>talk about.</em></h2>
        <div className="stats">
          <div className="stat card" data-reveal style={{ '--d': '.1s' }}><b><Count to={0} /></b><span>new menus to print. Your pantry is the menu.</span></div>
          <div className="stat card" data-reveal style={{ '--d': '.18s' }}><b><Count to={1} /></b><span>QR code per table. No app, no account for customers.</span></div>
          <div className="stat card" data-reveal style={{ '--d': '.26s' }}><b><Count to={30} /></b><span>days free to try it with your real customers.</span></div>
        </div>
      </section>

      <section className="section split">
        <div>
          <p className="eyebrow" data-reveal>for your customers</p>
          <h2 className="display h2" data-reveal style={{ '--d': '.08s' }}>a drink that <em className="cherry">gets them.</em></h2>
          <p className="lede" data-reveal style={{ '--d': '.14s' }}>They type a feeling, tap a few choices, and watch their drink being written. Every one gets a name, two lines and its own artwork, so ordering feels like a small gift instead of a decision.</p>
          <Link to={MENU} className="btn btn--ghost home__cta" data-reveal style={{ '--d': '.2s' }}>Try the customer menu</Link>
        </div>
        <div className="fan" data-reveal="zoom">
          {WALL.slice(0, 3).map((o, i) => (
            <figure key={o.id} className="fan__card" style={{ '--i': i - 1 }}>
              <span className="fan__art"><img src={STILLS[i].src} alt={o.name} loading="lazy" /></span>
              <figcaption><b>{o.name}</b><i>{o.lines[0]} {o.lines[1]}</i></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="section split split--flip">
        <div className="mini-board card" data-reveal="zoom">
          <div className="mini-board__head"><b>Orders</b><span>3 today</span></div>
          {[WALL[2], WALL[5], WALL[1]].map((o, i) => (
            <div key={o.id} className="mini-board__ticket" style={{ '--i': i }}>
              <span className="mini-board__code">{[118, 204, 377][i]}</span>
              <div><b>{o.name}</b><small>{o.recipe.ingredients.map((x) => x.name).join(' · ')}</small></div>
              <span className={'mini-board__status s' + i}>{['new', 'making', 'ready'][i]}</span>
            </div>
          ))}
        </div>
        <div>
          <p className="eyebrow" data-reveal>for your counter</p>
          <h2 className="display h2" data-reveal style={{ '--d': '.08s' }}>calm for <em>your barista.</em></h2>
          <p className="lede" data-reveal style={{ '--d': '.14s' }}>Every order arrives with a soft chime, the exact ingredients and portions, and steps to follow. Allergies show in red. Run out of mint? One tap, and new drinks stop using it.</p>
          <Link to="/for-cafes" className="btn btn--ghost home__cta" data-reveal style={{ '--d': '.2s' }}>Everything for cafés</Link>
        </div>
      </section>

      <section className="band">
        <div className="band__float" aria-hidden="true">
          {WALL.slice(6, 10).map((o, i) => <span key={o.id} className={'band__p p' + i}><img src={STILLS[6 + i].src} alt="" loading="lazy" /></span>)}
        </div>
        <p className="display" data-reveal>nobody screenshots a menu.<br /><em>they screenshot this.</em></p>
        <p className="band__sub" data-reveal style={{ '--d': '.1s' }}>Every drink comes with a story card carrying your café’s name and handle. Your customers do the marketing.</p>
        <Link to="/wall" className="btn btn--honey" data-reveal style={{ '--d': '.16s' }}>Visit the Wall</Link>
      </section>

      <section className="section">
        <div className="wallstrip__head">
          <div>
            <p className="eyebrow" data-reveal>from the wall</p>
            <h2 className="display h2" data-reveal style={{ '--d': '.08s' }}>made to be <em className="cherry">saved.</em></h2>
          </div>
          <Link to="/wall" className="btn btn--ghost" data-reveal>See the Wall</Link>
        </div>
        <div className="wallstrip" data-reveal style={{ '--d': '.12s' }}>
          {STILLS.slice(10, 20).map((s, i) => (
            <Link key={s.id} to="/wall" className="wallstrip__pin" style={{ '--i': i }}>
              <img src={s.src} alt={WALL[10 + i].name} loading="lazy" style={{ aspectRatio: `${s.width} / ${s.height}` }} />
              <span>{WALL[10 + i].name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <p className="eyebrow" data-reveal>built to be trusted</p>
        <h2 className="display h2" data-reveal style={{ '--d': '.08s' }}>quietly <em>careful.</em></h2>
        <div className="trust">
          {[
            ['Allergies are never guessed', 'What a customer must avoid is removed before a drink is written, and shown to your barista in red.'],
            ['No account needed to order', 'Customers scan and order. Accounts are optional, and passwords are stored only as secure hashes.'],
            ['Payments stay yours', 'Customers pay at your counter, the way they do today. ode never touches your money.'],
            ['Your café’s data is yours', 'Orders, ratings and your pantry belong to your café. Your team signs in with its own key.'],
          ].map(([t, d], i) => (
            <article key={t} className="trust__item" data-reveal style={{ '--d': 0.06 * i + 's' }}>
              <Icon name="check" size={18} width={2.2} />
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
