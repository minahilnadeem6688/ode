import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lockup, Mark, Painted, Portrait, Seal } from '../components/Brand';
import { Cup } from '../components/Three';
import Icon from '../components/Icon';
import { pantry } from '../data/demoCafe';
import { MENU } from '../lib/paths';
import './home.css';

const byId = Object.fromEntries(pantry.map((i) => [i.id, i]));
const sample = (id, name, lines, mood, temperature, ids) => ({
  id, name, lines, mood: { primary: mood }, recipe: { temperature, ingredients: ids.map((x) => byId[x]) },
});

// A few odes from the demo café, for the hero and the gallery.
const HERO = sample('hero-rain', 'Rain on Tin', ['rain on the window,', 'nowhere you’d rather be.'], 'cozy', 'hot', ['black_tea', 'cinnamon', 'cardamom', 'milk']);
const GALLERY = [
  sample('g1', 'Soft Harbour', ['the kind of quiet', 'you can hear yourself in.'], 'calm', 'hot', ['hibiscus', 'lavender', 'rose', 'mint']),
  sample('g2', 'Golden Hour Spritz', ['bubbles, gossip,', 'the sun still up.'], 'playful', 'cold', ['soda', 'mango', 'orange', 'ice']),
  sample('g3', 'Nani’s Window', ['it tastes like a kitchen', 'you can’t go back to.'], 'nostalgic', 'hot', ['black_tea', 'cardamom', 'honey', 'milk']),
  sample('g4', 'First Light', ['the first good idea', 'of the day, in a glass.'], 'energetic', 'cold', ['cold_brew', 'orange', 'ice']),
  sample('g5', 'Slow Dance', ['sweet at first,', 'and then it stays.'], 'romantic', 'cold', ['strawberry', 'rose', 'milk', 'ice']),
  sample('g6', 'Fog Over Monday', ['for the hour', 'when everything is too much.'], 'tired', 'hot', ['espresso', 'cocoa', 'caramel', 'oat_milk']),
  sample('g7', 'Open Window', ['one sip,', 'and the room gets bigger.'], 'stressed', 'hot', ['matcha', 'honey', 'oat_milk']),
  sample('g8', 'Paper Kites', ['light, fleeting,', 'exactly like the last good day of july.'], 'nostalgic', 'cold', ['lychee', 'lemon', 'soda', 'mint']),
];
const NAMES = ['Rain on Tin', 'Soft Harbour', 'Paper Kites', 'Golden Hour Spritz', 'Nani’s Window', 'Fog Over Monday', 'First Light', 'Slow Dance', 'Open Window', 'Blanket Fort', 'Quiet Hour', 'Kite Season'];

const STEPS = [
  ['They say how they feel', 'A sentence or a few taps: mood, temperature, sweetness, flavours, and anything they must avoid.'],
  ['We write it from your shelf', 'Only what you stock, only what is safe for them. A name, two lines and a recipe your barista can follow.'],
  ['You make it, they share it', 'The order lands on your board with a soft chime. They pay at the counter as usual, and leave with a card worth posting.'],
];

const FEATURES = [
  ['No new menu to print', 'One QR code per table. Change your pantry and every drink changes with it.'],
  ['Only what you stock', 'Mark an ingredient out of stock and new drinks stop using it straight away.'],
  ['Allergies are rules', 'Dairy, nuts, caffeine and sugar are removed before a drink is written, and your barista sees them in red.'],
  ['Prices from your costs', 'Each drink is priced from your ingredient costs and your margin, rounded to a proper café price.'],
  ['A calm order board', 'New, making, ready. Every ticket shows ingredients, portions and steps, on any tablet or laptop.'],
  ['Marketing that makes itself', 'Every customer gets a story card with your café’s name and handle. People post what is beautiful.'],
];

const FAQ = [
  ['Do customers need to download an app?', 'No. They scan the QR code on the table and ode opens in their browser. No account, no sign-up.'],
  ['How do payments work?', 'Exactly as they do now. Customers show their order code at the counter and pay there.'],
  ['What about allergies?', 'Customers mark what they must avoid before anything is written. Those ingredients are filtered out completely, and the barista sees the note in red on the ticket.'],
  ['What if we run out of something?', 'Tap it out of stock on the order board. New drinks stop using it immediately, and it comes back with one more tap.'],
  ['Does it replace our menu?', 'No. ode sits beside your regular menu for the customers who want something made for them.'],
  ['What do we need to run it?', 'Nothing new. Customers use their own phones, and the order board runs in a browser on any tablet or laptop you already have.'],
];

function Contact() {
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  async function submit(e) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    setState('sending');
    try {
      const r = await fetch('/api/leads', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      setState(r.ok ? 'sent' : 'error');
    } catch {
      setState('error');
    }
  }
  if (state === 'sent') {
    return (
      <div className="home__sent">
        <Seal size={84} />
        <p className="display">thank <em>you.</em></p>
        <p className="muted">We’ll be in touch within two working days to set up your pilot.</p>
      </div>
    );
  }
  return (
    <form className="home__form" onSubmit={submit}>
      <label>Café name<input className="field" name="cafe_name" required minLength={2} maxLength={80} autoComplete="organization" /></label>
      <label>Your name<input className="field" name="name" required minLength={2} maxLength={60} autoComplete="name" /></label>
      <label>City<input className="field" name="city" required minLength={2} maxLength={40} autoComplete="address-level2" /></label>
      <label>Phone or email<input className="field" name="contact" required minLength={5} maxLength={80} /></label>
      <label className="home__wide">Anything we should know? <span className="muted">(optional)</span><textarea className="field" name="message" rows={3} maxLength={600} /></label>
      <input className="home__trap" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button type="submit" className="btn btn--honey home__wide" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Ask for a free pilot'}</button>
      {state === 'error' && <p className="home__err home__wide" role="alert">That did not go through. Please try again in a moment.</p>}
    </form>
  );
}

export default function Home() {
  return (
    <div className="home">
      <nav className="home__nav">
        <Link to="/" aria-label="ode home"><Lockup size={22} /></Link>
        <div className="home__links">
          <a href="#how">How it works</a>
          <a href="#cafes">For cafés</a>
          <a href="#pilot">Pilot</a>
          <a href="#faq">FAQ</a>
        </div>
        <Link to={MENU} className="btn btn--roast home__try">Try the menu</Link>
      </nav>

      <header className="home__hero">
        <div className="home__heroText">
          <p className="eyebrow rise">a mood menu for cafés</p>
          <h1 className="display rise" style={{ '--d': '.06s' }}>the menu<br />is <em>you.</em></h1>
          <p className="home__lede rise" style={{ '--d': '.12s' }}>Your customers scan a QR code, say how they feel, and get a drink written only for them: a name, two lines and its own artwork, made from the ingredients on your shelf.</p>
          <div className="home__ctas rise" style={{ '--d': '.18s' }}>
            <a href="#contact" className="btn btn--honey">Bring ode to your café</a>
            <Link to={MENU} className="btn btn--ghost">Try it as a customer</Link>
          </div>
          <p className="home__small rise" style={{ '--d': '.24s' }}>Free 30-day pilot · Prices in PKR · Nothing new to install</p>
        </div>
        <div className="home__heroArt rise" style={{ '--d': '.1s' }}>
          <span className="home__halo" aria-hidden="true" />
          <Cup creation={HERO} className="home__cup" />
          <figure className="home__card">
            <span className="home__cardArt"><Portrait creation={HERO} width={120} height={120} id="hc" /></span>
            <figcaption>
              <small>cozy · warm</small>
              <b>{HERO.name}</b>
              <i>{HERO.lines[0]} {HERO.lines[1]}</i>
            </figcaption>
          </figure>
        </div>
      </header>

      <div className="home__marquee" aria-hidden="true">
        <div>{[...NAMES, ...NAMES].map((n, i) => <span key={i}><Mark size={16} />{n}</span>)}</div>
      </div>

      <section id="how" className="home__section">
        <p className="eyebrow">how it works</p>
        <h2 className="display">three moments, <em>one drink.</em></h2>
        <ol className="home__steps">
          {STEPS.map(([t, d], i) => (
            <li key={t}>
              <div className={'home__stepArt home__stepArt--' + (i + 1)}>
                {i === 0 && <p className="home__quote">“rainy afternoon, missing home, something warm but not too sweet”</p>}
                {i === 1 && <div className="home__ings">{['black_tea', 'cardamom', 'honey', 'milk'].map((x) => <span key={x}><Painted item={byId[x]} size={54} /></span>)}</div>}
                {i === 2 && <span className="home__mini"><Portrait creation={GALLERY[2]} width={160} height={200} id="step3" /></span>}
              </div>
              <span className="home__num">0{i + 1}</span>
              <h3>{t}</h3>
              <p className="muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="home__section home__gallerySec">
        <p className="eyebrow">from the demo café</p>
        <h2 className="display">no two people get <em className="cherry">the same drink.</em></h2>
        <div className="home__gallery">
          {GALLERY.map((c, i) => (
            <figure key={c.id} className="home__pin">
              <span className="home__pinArt"><Portrait creation={c} width={300} height={[375, 300, 400][i % 3]} id={'pin' + i} /></span>
              <figcaption><b>{c.name}</b><i>{c.lines[0]} {c.lines[1]}</i></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="cafes" className="home__section">
        <p className="eyebrow">for cafés</p>
        <h2 className="display">built for the way <em>cafés work.</em></h2>
        <div className="home__features">
          {FEATURES.map(([t, d], i) => (
            <article key={t} className="home__feature">
              <span className="home__dot" style={{ background: i % 2 ? 'var(--cherry-pale)' : 'var(--honey-pale)' }}><Mark size={18} /></span>
              <h3>{t}</h3>
              <p className="muted">{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home__band">
        <p className="display">nobody screenshots a menu.<br /><em>they screenshot this.</em></p>
      </section>

      <section id="pilot" className="home__section home__pilot">
        <div>
          <p className="eyebrow">the pilot</p>
          <h2 className="display">start with a <em>free month.</em></h2>
          <p className="home__lede">We set up your pantry, prices and table QR cards with you, walk your team through the order board, and run ode for 30 days at no cost. If your customers love it, stay on one simple monthly plan in PKR. If not, you have lost nothing.</p>
        </div>
        <ul className="home__checks">
          {['Setup done with you', 'A QR card for every table', 'Order board on any tablet or laptop', 'No new hardware, no change to payments'].map((x) => (
            <li key={x}><Icon name="check" size={18} width={2.4} />{x}</li>
          ))}
        </ul>
      </section>

      <section id="faq" className="home__section">
        <p className="eyebrow">questions</p>
        <h2 className="display">good to <em>know.</em></h2>
        <div className="home__faq">
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p className="muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="contact" className="home__section home__contact">
        <div>
          <p className="eyebrow">get started</p>
          <h2 className="display">bring ode to <em>your café.</em></h2>
          <p className="home__lede">Tell us a little about your café and we will set up a free 30-day pilot with you.</p>
        </div>
        <Contact />
      </section>

      <footer className="home__foot">
        <Lockup size={20} />
        <p className="poem">the menu is you.</p>
        <div><Link to={MENU}>Try the menu</Link><a href="#contact">Contact</a></div>
        <small>© 2026 ode</small>
      </footer>
    </div>
  );
}
