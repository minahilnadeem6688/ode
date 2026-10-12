import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Painted } from '../components/Brand';
import { pantry } from '../data/demoCafe';
import { readMood, serveHouse, writeOde } from '../lib/craft';
import { byId } from './odes';
import { BoardDemo, PantryDemo, PriceCalc, TableCard } from './CafeTools';
import './cafes.css';

const FEATURES = [
  ['Only drinks you approve', 'Every guest gets one of your own drinks. ode picks which one and names it for them; the recipe and price stay yours.'],
  ['No menu to print', 'Add a drink in your dashboard and it can be served the same minute, with no reprint.'],
  ['Allergies are rules', 'Dairy, nuts, caffeine and sugar are never guessed. Dairy-free guests get oat milk, and the ticket says so.'],
  ['Portions you set', 'Every ingredient has your standard portion. The ticket shows it, so every cup comes out the same.'],
  ['Pay as you do now', 'Customers pay at the counter with their order code. Nothing changes in your till.'],
  ['Any screen works', 'The board runs in a browser on a tablet or laptop you already own. No new hardware.'],
  ['Story cards with your name', 'Every customer can download a beautiful card with your café’s name and handle.'],
];
const SOON = [
  ['Insights', 'The moods, flavours and hours your customers order most.'],
  ['Make it a special', 'Turn a much-loved ode into a permanent item with one tap.'],
  ['Café wall', 'Your best odes on a screen in the café, updating as they are ordered.'],
];

const PROMPTS = ['rainy evening, missing home', 'first day of summer', 'exam tomorrow, stressed', 'date night'];
const item = Object.fromEntries(pantry.map((i) => [i.id, i]));

// What the Menu tab does, in miniature: the café's own drinks, matched to how a guest feels.
function MenuDemo() {
  const [k, setK] = useState(0);
  const [sugg, setSugg] = useState('waiting');
  const pick = useMemo(() => {
    const mood = readMood({ text: PROMPTS[k] });
    const r = serveHouse(mood, PROMPTS[k], []);
    return { r, ode: writeOde(mood, r, PROMPTS[k]) };
  }, [k]);
  return (
    <div className="mdemo">
      <div className="mdemo__card card">
        <small className="mdemo__label">a guest says</small>
        <div className="mdemo__chips">{PROMPTS.map((p, i) => <button key={p} type="button" aria-pressed={k === i} onClick={() => setK(i)}>{p}</button>)}</div>
        <div className="mdemo__result" key={k}>
          <small className="mdemo__label">ode serves, from your menu</small>
          <b>{pick.r.house.name}</b>
          <span>{pick.r.temperature === 'hot' ? 'warm' : 'iced'} · Rs {pick.r.price} · your recipe, your price</span>
          <i>named “{pick.ode.name}” for this guest</i>
        </div>
      </div>
      <div className="mdemo__card mdemo__sugg card">
        <small className="mdemo__label">suggested by ode</small>
        <b>Lavender Honey Hibiscus Tea</b>
        <span className="mdemo__why">No warm drink for playful guests yet</span>
        <span className="mdemo__ings">{['hibiscus', 'lavender', 'honey'].map((id) => <span key={id}><Painted item={byId[id] || item[id]} size={22} />{item[id].name}</span>)}</span>
        {sugg === 'waiting' ? (
          <span className="mdemo__btns">
            <button type="button" className="btn btn--roast" onClick={() => setSugg('approved')}>Approve</button>
            <button type="button" className="btn btn--ghost" onClick={() => setSugg('dismissed')}>Dismiss</button>
          </span>
        ) : <p className="mdemo__done">{sugg === 'approved' ? 'On your menu. Playful guests can get it from now.' : 'Dismissed. Nothing changes on your menu.'} <button type="button" onClick={() => setSugg('waiting')}>Undo</button></p>}
      </div>
    </div>
  );
}

export default function Cafes() {
  return (
    <>
      <header className="phead">
        <p className="eyebrow">for cafés</p>
        <h1 className="display">everything your counter <em>needs.</em></h1>
        <p className="lede">A menu your customers remember, a calm board for your team, and prices that follow your costs. Play with each part below: these are the real thing.</p>
        <nav className="jump">
          {[['#menu', 'Your menu'], ['#board', 'Order board'], ['#pantry', 'Pantry'], ['#pricing', 'Pricing calculator'], ['#card', 'Table cards']].map(([h, l]) => <a key={h} href={h}>{l}</a>)}
        </nav>
      </header>

      <section id="menu" className="section cafes__first">
        <p className="eyebrow" data-reveal>01 · your menu</p>
        <h2 className="display h2" data-reveal style={{ '--d': '.06s' }}>your drinks, <em>your approval.</em></h2>
        <p className="lede" data-reveal style={{ '--d': '.1s' }}>You add the drinks you already serve, with your recipes and prices. ode only ever serves those: it reads how each guest feels, picks the one that fits, and writes its name and two lines. It can suggest new drinks from your pantry, but nothing reaches a guest until you approve it.</p>
        <div data-reveal style={{ '--d': '.14s' }}><MenuDemo /></div>
      </section>

      <section id="board" className="section split">
        <div>
          <p className="eyebrow" data-reveal>02 · the order board</p>
          <h2 className="display h2" data-reveal style={{ '--d': '.06s' }}>new, making, <em>ready.</em></h2>
          <p className="lede" data-reveal style={{ '--d': '.12s' }}>Orders arrive with a soft chime and move along with one tap. Each ticket has the ingredients, your portions and the steps, so a new barista can make any ode on their first day.</p>
          <Link to="/barista" className="btn btn--ghost cafes__cta" data-reveal style={{ '--d': '.18s' }}>Open the real board</Link>
        </div>
        <div data-reveal="zoom"><BoardDemo /></div>
      </section>

      <section id="pantry" className="section">
        <p className="eyebrow" data-reveal>03 · your pantry</p>
        <h2 className="display h2" data-reveal style={{ '--d': '.06s' }}>ran out of milk? <em>one tap.</em></h2>
        <div data-reveal style={{ '--d': '.12s' }}><PantryDemo /></div>
      </section>

      <section id="pricing" className="section">
        <p className="eyebrow" data-reveal>04 · prices</p>
        <h2 className="display h2" data-reveal style={{ '--d': '.06s' }}>priced from <em>your costs.</em></h2>
        <p className="lede" data-reveal style={{ '--d': '.1s' }}>Set your own price for every drink, or tell ode what each ingredient costs and the margin you want, and it prices new drinks for you, rounded to a proper café price.</p>
        <div data-reveal style={{ '--d': '.14s' }}><PriceCalc /></div>
      </section>

      <section id="card" className="section">
        <p className="eyebrow" data-reveal>05 · table cards</p>
        <h2 className="display h2" data-reveal style={{ '--d': '.06s' }}>one card <em>per table.</em></h2>
        <p className="lede" data-reveal style={{ '--d': '.1s' }}>Design yours right here. Type your café’s name, pick a colour and download a print-ready card.</p>
        <div data-reveal style={{ '--d': '.14s' }}><TableCard /></div>
      </section>

      <section className="section">
        <p className="eyebrow" data-reveal>and also</p>
        <h2 className="display h2" data-reveal style={{ '--d': '.06s' }}>the small things <em>that matter.</em></h2>
        <dl className="feats">
          {FEATURES.map(([t, d], i) => (
            <div key={t} className="feat" data-reveal style={{ '--d': 0.04 * i + 's' }}><dt>{t}</dt><dd>{d}</dd></div>
          ))}
        </dl>
        <p className="feats__soon" data-reveal><span className="pill pill--soon">coming soon</span>{SOON.map(([t]) => t).join(' · ')}</p>
      </section>
    </>
  );
}
