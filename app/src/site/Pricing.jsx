import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import './pages.css';

const INCLUDED = ['Only drinks you approve, from your own menu', 'Suggestions for new drinks from your pantry', 'Order board for any tablet or laptop', 'Pantry, portions and stock switches', 'Printable QR cards for every table', 'Story cards with your café’s name', 'Setup done with you'];

const FAQ = [
  ['Do customers need to download an app?', 'No. They scan the QR code on the table and ode opens in their browser. No account, no sign-up.'],
  ['Can ode serve a drink we have not approved?', 'No. Every guest gets one of your own drinks, made to your recipe and your price. ode can suggest new ones, but they only reach guests once you approve them.'],
  ['Do you take a cut of our orders?', 'No. One flat monthly price, no commission on any order, ever.'],
  ['How do payments work?', 'Exactly as they do now. Customers show their order code at the counter and pay there.'],
  ['What happens after the pilot?', 'If ode is working for you, you continue as a founding café at Rs 4,500 a month, locked for a year. If not, you stop, and you owe nothing.'],
  ['What about allergies?', 'Customers mark what they must avoid before anything is chosen. Those drinks are filtered out, dairy-free guests get oat milk, and the barista sees the note in red.'],
  ['Does it replace our menu?', 'No. ode sits beside your regular menu for the customers who want something chosen for them.'],
  ['What do we need to run it?', 'Nothing new. Customers use their own phones, and the order board runs in a browser on any tablet or laptop you already have.'],
];

export default function Pricing() {
  return (
    <>
      <header className="phead">
        <p className="eyebrow">pricing</p>
        <h1 className="display">start free. <em>stay if you love it.</em></h1>
        <p className="lede">Simple monthly plans in PKR, after a free month with your real customers. No commission, ever.</p>
      </header>

      <section className="plans wrap">
        <article className="plan card" data-reveal>
          <span className="pill">first 30 days</span>
          <h2 className="display">Pilot</h2>
          <p className="plan__price"><b>Free</b><small>set up with you, live with your real customers</small></p>
          <p className="plan__sub">Everything in ode for a month. We agree up front what success looks like, and you decide at the end. No card, no contract.</p>
          <Link to="/get-ode" className="btn btn--roast">Start a free pilot</Link>
        </article>
        <article className="plan plan--main card" data-reveal style={{ '--d': '.06s' }}>
          <span className="pill">founding cafés · first 5</span>
          <h2 className="display">Founding</h2>
          <p className="plan__price"><b>Rs 4,500</b><small>per month, locked for 12 months. About Rs 150 a day.</small></p>
          <ul>{INCLUDED.map((x) => <li key={x}><Icon name="check" size={18} width={2.4} />{x}</li>)}</ul>
          <Link to="/get-ode" className="btn btn--honey">Become a founding café</Link>
        </article>
        <article className="plan card" data-reveal style={{ '--d': '.12s' }}>
          <span className="pill">standard</span>
          <h2 className="display">Café</h2>
          <p className="plan__price"><b>Rs 7,500</b><small>per month, per café</small></p>
          <p className="plan__sub">Everything in Founding, for every café after the first five. Pay yearly and get 12 months for the price of 10.</p>
          <Link to="/get-ode" className="btn btn--ghost">Talk to us</Link>
        </article>
        <article className="plan card" data-reveal style={{ '--d': '.18s' }}>
          <span className="pill">more than one café</span>
          <h2 className="display">Group</h2>
          <p className="plan__price"><b>Custom</b><small>for multi-branch cafés</small></p>
          <p className="plan__sub">One menu across branches or a different one for each, with every branch’s board and numbers in one place.</p>
          <Link to="/get-ode" className="btn btn--ghost">Talk to us</Link>
        </article>
      </section>
      <p className="plans__note wrap" data-reveal>No commission on orders · No setup fee · Cancel any month</p>

      <section className="section">
        <p className="eyebrow" data-reveal>questions</p>
        <h2 className="display h2" data-reveal style={{ '--d': '.06s' }}>good to <em>know.</em></h2>
        <div className="faq" data-reveal style={{ '--d': '.1s' }}>
          {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
        </div>
      </section>
    </>
  );
}
