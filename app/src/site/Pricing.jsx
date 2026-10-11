import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import './pages.css';

const INCLUDED = ['Unlimited odes for your customers', 'Order board for any tablet or laptop', 'Pantry, portions and stock switches', 'Automatic prices from your costs', 'Printable QR cards for every table', 'Story cards with your café’s name', 'Setup done with you'];

const FAQ = [
  ['Do customers need to download an app?', 'No. They scan the QR code on the table and ode opens in their browser. No account, no sign-up.'],
  ['How do payments work?', 'Exactly as they do now. Customers show their order code at the counter and pay there.'],
  ['What happens after the pilot?', 'If ode is working for you, you move to the monthly plan. If not, you stop, and you owe nothing.'],
  ['What about allergies?', 'Customers mark what they must avoid before anything is written. Those ingredients are filtered out completely, and the barista sees the note in red.'],
  ['Does it replace our menu?', 'No. ode sits beside your regular menu for the customers who want something made for them.'],
  ['What do we need to run it?', 'Nothing new. Customers use their own phones, and the order board runs in a browser on any tablet or laptop you already have.'],
];

export default function Pricing() {
  return (
    <>
      <header className="phead">
        <p className="eyebrow">pricing</p>
        <h1 className="display">start free. <em>stay if you love it.</em></h1>
        <p className="lede">One simple plan in PKR, after a free month with your real customers.</p>
      </header>

      <section className="plans wrap">
        <article className="plan card" data-reveal>
          <span className="pill">first 30 days</span>
          <h2 className="display">Pilot</h2>
          <p className="plan__price"><b>Free</b></p>
          <p className="plan__sub">Everything in ode, set up with you, live in your café for a month. No card, no contract.</p>
          <Link to="/get-ode" className="btn btn--roast">Start a free pilot</Link>
        </article>
        <article className="plan plan--main card" data-reveal style={{ '--d': '.08s' }}>
          <span className="pill">after the pilot</span>
          <h2 className="display">Café</h2>
          <p className="plan__price"><b>Rs 9,999</b><small>per month, per café</small></p>
          <ul>{INCLUDED.map((x) => <li key={x}><Icon name="check" size={18} width={2.4} />{x}</li>)}</ul>
          <Link to="/get-ode" className="btn btn--honey">Talk to us</Link>
        </article>
        <article className="plan card" data-reveal style={{ '--d': '.16s' }}>
          <span className="pill pill--soon">coming soon</span>
          <h2 className="display">Café Plus</h2>
          <p className="plan__price"><b>More</b><small>for busy and multi-branch cafés</small></p>
          <p className="plan__sub">Insights on what your customers feel and order, specials from your best odes, a live café wall for your screen, and more than one location.</p>
          <Link to="/get-ode" className="btn btn--ghost">Join the list</Link>
        </article>
      </section>

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
