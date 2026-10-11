import { Link } from 'react-router-dom';
import { BoardDemo, PantryDemo, PriceCalc, TableCard } from './CafeTools';
import './cafes.css';

const FEATURES = [
  ['No menu to print', 'Your pantry is the menu. Add a syrup and it is in tomorrow’s drinks, with no reprint.'],
  ['Allergies are rules', 'Dairy, nuts, caffeine and sugar are removed before a drink is written. Notes show in red.'],
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

export default function Cafes() {
  return (
    <>
      <header className="phead">
        <p className="eyebrow">for cafés</p>
        <h1 className="display">everything your counter <em>needs.</em></h1>
        <p className="lede">A menu your customers remember, a calm board for your team, and prices that follow your costs. Play with each part below: these are the real thing.</p>
        <nav className="jump">
          {[['#board', 'Order board'], ['#pantry', 'Pantry'], ['#pricing', 'Pricing calculator'], ['#card', 'Table cards']].map(([h, l]) => <a key={h} href={h}>{l}</a>)}
        </nav>
      </header>

      <section id="board" className="section split cafes__first">
        <div>
          <p className="eyebrow" data-reveal>01 · the order board</p>
          <h2 className="display h2" data-reveal style={{ '--d': '.06s' }}>new, making, <em>ready.</em></h2>
          <p className="lede" data-reveal style={{ '--d': '.12s' }}>Orders arrive with a soft chime and move along with one tap. Each ticket has the ingredients, your portions and the steps, so a new barista can make any ode on their first day.</p>
          <Link to="/barista" className="btn btn--ghost cafes__cta" data-reveal style={{ '--d': '.18s' }}>Open the real board</Link>
        </div>
        <div data-reveal="zoom"><BoardDemo /></div>
      </section>

      <section id="pantry" className="section">
        <p className="eyebrow" data-reveal>02 · your pantry</p>
        <h2 className="display h2" data-reveal style={{ '--d': '.06s' }}>ran out of milk? <em>one tap.</em></h2>
        <div data-reveal style={{ '--d': '.12s' }}><PantryDemo /></div>
      </section>

      <section id="pricing" className="section">
        <p className="eyebrow" data-reveal>03 · prices</p>
        <h2 className="display h2" data-reveal style={{ '--d': '.06s' }}>priced from <em>your costs.</em></h2>
        <p className="lede" data-reveal style={{ '--d': '.1s' }}>You tell ode what each ingredient costs you and the margin you want. Every drink is priced automatically and rounded to a proper café price, within the floor and ceiling you choose.</p>
        <div data-reveal style={{ '--d': '.14s' }}><PriceCalc /></div>
      </section>

      <section id="card" className="section">
        <p className="eyebrow" data-reveal>04 · table cards</p>
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
