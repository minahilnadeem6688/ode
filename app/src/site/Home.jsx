import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Painted } from '../components/Brand';
import { Cup } from '../components/Three';
import { readMood, buildRecipe, serveHouse, writeOde, priceOf } from '../lib/craft';
import { HERO, WALL } from './odes';
import { STILLS } from './stills';
import Film from './Film';
import './home.css';

const IDEAS = ['rainy afternoon, missing home', 'first day of summer', 'exam tomorrow', 'lazy sunday'];

const STEPS = [
  ['Scan', 'A small QR card on the table opens your menu in the browser. No app, no account.'],
  ['Say how you feel', 'A few words, or a tap on a suggestion. Allergies and dislikes are optional.'],
  ['Sip something written for you', 'A drink from your own shelf, with a name, two lines and its own artwork.'],
];

const COUNTER = [
  ['Every order, exactly', 'Ingredients, portions and steps arrive on the board with a soft chime.'],
  ['Allergies in red', 'What a customer avoids is removed before the drink is written, and flagged.'],
  ['Out of mint? One tap', 'New drinks stop using it right away. Nothing to reprint.'],
  ['Payments stay yours', 'Customers pay at your counter, the way they do today.'],
];

// The live demo: the same engine the café menu uses, run in the browser.
function write(text) {
  const mood = readMood({ text });
  const seed = text + 'site';
  const recipe = serveHouse(mood, seed, []) || buildRecipe(mood, seed, []);
  mood.temperature = recipe.temperature;
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
      <div className="try__left">
        <p className="eyebrow" data-reveal>try it</p>
        <h2 className="display h2" data-reveal style={{ '--d': '.08s' }}>write one <em>yourself.</em></h2>
        <p className="lede" data-reveal style={{ '--d': '.14s' }}>The same engine your customers use. Type a feeling and a drink is written for it.</p>
        <form className="try__ask" data-reveal style={{ '--d': '.2s' }} onSubmit={(e) => { e.preventDefault(); go(); }}>
          <label htmlFor="try" className="sr-only">How do you feel right now?</label>
          <div className="try__row">
            <input id="try" className="try__input" value={text} onChange={(e) => setText(e.target.value)} placeholder="how do you feel right now?" maxLength={120} autoComplete="off" />
            <button type="submit" className="btn btn--roast try__go" disabled={!text.trim()}>Write it</button>
          </div>
          <div className="try__ideas">
            {IDEAS.map((i) => <button key={i} type="button" onClick={() => go(i)}>{i}</button>)}
          </div>
        </form>
      </div>

      <div className="try__stage" data-reveal="zoom">
        <Cup creation={drink} className="try__cup" />
        <figure key={n} className="try__card">
          <small>{moodWord}</small>
          <b>{drink.name}</b>
          <i>{drink.lines[0]}<br />{drink.lines[1]}</i>
          {drink.recipe.house && <span className="try__house">{drink.recipe.house.name}, from the café’s own menu</span>}
          <span className="try__foot">
            <span className="try__ings">
              {drink.recipe.ingredients.map((x, k) => <span key={x.id} style={{ '--k': k }} title={x.name}><Painted item={x} size={26} /></span>)}
            </span>
            <span className="try__price">Rs {drink.price.toLocaleString('en-PK')}</span>
          </span>
        </figure>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Film>
        <p className="eyebrow">a mood menu for cafés</p>
        <h1 className="display hero__title"><span>the menu</span><span>is <em>you.</em></span></h1>
        <p className="lede">Your customers scan a QR code, say how they feel, and get a drink written only for them, from the ingredients on your shelf.</p>
        <div className="hero__ctas">
          <Link to="/get-ode" className="btn btn--roast">Start a free pilot</Link>
          <Link to="/how-it-works" className="btn btn--ghost">See how it works</Link>
        </div>
        <p className="hero__note">Free for 30 days. No card, no contract, no new hardware.</p>
      </Film>

      <section className="section">
        <p className="eyebrow" data-reveal>how it works</p>
        <h2 className="display h2" data-reveal style={{ '--d': '.08s' }}>three small <em>moments.</em></h2>
        <ol className="steps">
          {STEPS.map(([t, d], i) => (
            <li key={t} data-reveal style={{ '--d': 0.08 * i + 's' }}>
              <span className="steps__n">{String(i + 1).padStart(2, '0')}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section">
        <TryIt />
      </section>

      <section className="section split counter">
        <div>
          <p className="eyebrow" data-reveal>for your counter</p>
          <h2 className="display h2" data-reveal style={{ '--d': '.08s' }}>calm for <em>your barista.</em></h2>
          <dl className="counter__list">
            {COUNTER.map(([t, d], i) => (
              <div key={t} data-reveal style={{ '--d': 0.1 + 0.06 * i + 's' }}><dt>{t}</dt><dd>{d}</dd></div>
            ))}
          </dl>
          <Link to="/for-cafes" className="btn btn--ghost home__cta" data-reveal>Everything for cafés</Link>
        </div>
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
      </section>

      <section className="section">
        <div className="wallstrip__head">
          <div>
            <p className="eyebrow" data-reveal>from the wall</p>
            <h2 className="display h2" data-reveal style={{ '--d': '.08s' }}>made to be <em>saved.</em></h2>
            <p className="lede" data-reveal style={{ '--d': '.14s' }}>Every drink comes with a story card carrying your café’s name. Your customers post it for you.</p>
          </div>
          <Link to="/wall" className="btn btn--ghost" data-reveal>See the Wall</Link>
        </div>
        <div className="wallstrip" data-reveal style={{ '--d': '.12s' }}>
          {STILLS.slice(10, 18).map((s, i) => (
            <Link key={s.id} to="/wall" className="wallstrip__pin">
              <img src={s.src} alt={WALL[10 + i].name} loading="lazy" style={{ aspectRatio: `${s.width} / ${s.height}` }} />
              <span>{WALL[10 + i].name}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
