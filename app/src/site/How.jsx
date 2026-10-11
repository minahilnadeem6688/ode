import { useEffect, useRef, useState } from 'react';
import { Painted } from '../components/Brand';
import Icon from '../components/Icon';
import { MENU } from '../lib/paths';
import { byId } from './odes';
import './how.css';

const STEPS = [
  ['Scan the table', 'Each table has a small ode card with a QR code. The menu opens in the browser. Nothing to download, no account.'],
  ['Say how you feel', 'A sentence in their own words, or one of the examples. “Rainy afternoon, missing home” is a perfectly good order.'],
  ['Tune it, if they like', 'Mood, hot or iced, sweetness and flavours are all optional. Allergies and diets are not suggestions: they are rules.'],
  ['Watch it being written', 'A cup fills while ode reads the mood, picks from your pantry, balances the drink and writes its two lines.'],
  ['Order and pay as usual', 'They pick a size and get a three-digit code. It lands on your barista board, and they pay at the counter.'],
  ['Keep it, share it', 'They rate it, save it, and save or share a story card with your café’s name on it. That is where the word spreads.'],
];

const PIPE = [
  ['Read the mood', 'What they wrote and tapped becomes a mood, a temperature and the flavours they want.'],
  ['Check your shelf', 'Only ingredients you have in stock, that suit the temperature and are safe for this person, make it through.'],
  ['Build the recipe', 'A balanced drink from that list, with portions from your own pantry and a price from your costs.'],
  ['Write the lines', 'A name and two lines in the ode voice. Every answer is checked before anyone sees it.'],
];

export default function How() {
  const [at, setAt] = useState(0);
  const refs = useRef([]);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setAt(+e.target.dataset.i); }), { rootMargin: '-45% 0px -45% 0px' });
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <header className="phead">
        <p className="eyebrow">how it works</p>
        <h1 className="display">from a feeling <em>to a cup.</em></h1>
        <p className="lede">Six small moments for your customer, and nothing new for your team to learn. Try the real menu on the phone as you read.</p>
      </header>

      <section className="how wrap">
        <ol className="how__steps">
          {STEPS.map(([t, d], i) => (
            <li key={t} ref={(el) => { refs.current[i] = el; }} data-i={i} className={at === i ? 'on' : ''}>
              <span className="how__n">{String(i + 1).padStart(2, '0')}</span>
              <h2>{t}</h2>
              <p>{d}</p>
            </li>
          ))}
        </ol>
        <div className="how__phoneWrap">
          <div className="how__phone">
            <span className="how__notch" />
            <iframe title="The ode customer menu, live" src={MENU} loading="lazy" />
          </div>
          <p className="how__caption"><span>{String(at + 1).padStart(2, '0')}</span> {STEPS[at][0]} · <em>this is the real menu, tap around</em></p>
        </div>
      </section>

      <section className="section">
        <p className="eyebrow" data-reveal>behind the cup</p>
        <h2 className="display h2" data-reveal style={{ '--d': '.08s' }}>creative words, <em>strict rules.</em></h2>
        <p className="lede" data-reveal style={{ '--d': '.12s' }}>The writing is free to be poetic. Everything that matters to your café is decided by rules: what is in stock, what is safe, how much goes in, and what it costs.</p>
        <div className="pipe">
          {PIPE.map(([t, d], i) => (
            <article key={t} className="pipe__step card" data-reveal style={{ '--d': 0.1 + i * 0.1 + 's' }}>
              <span className="pipe__n">{i + 1}</span>
              <h3>{t}</h3>
              <p>{d}</p>
              {i === 1 && (
                <div className="pipe__filter">
                  {['milk', 'oat_milk', 'hazelnut', 'cocoa', 'mint'].map((id, k) => (
                    <span key={id} className={id === 'milk' || id === 'hazelnut' ? 'out' : ''} style={{ '--k': k }}><Painted item={byId[id]} size={26} /></span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
        <div className="how__safe card" data-reveal>
          <Icon name="alert" size={22} />
          <p><b>Allergies are never left to chance.</b> Dairy-free means no dairy ingredient is even offered to the recipe. The barista sees every note in red on the ticket.</p>
        </div>
      </section>
    </>
  );
}
