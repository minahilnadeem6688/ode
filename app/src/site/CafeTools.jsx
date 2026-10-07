/*
 * The interactive pieces on the For cafés page: a live order board, a pantry you can switch
 * out of stock, a price calculator and a table card designer with a real QR code.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Painted } from '../components/Brand';
import { quoteMark } from '../brand/marks';
import { cafe, pantry } from '../data/demoCafe';
import { readMood, buildRecipe } from '../lib/craft';
import { canvasBlob, roundRect, svgImage } from '../lib/shareCard';
import { MENU } from '../lib/paths';
import { WALL, byId } from './odes';

/* A board that fills itself: a new order every few seconds, moving along to ready. */
export function BoardDemo() {
  const [tickets, setTickets] = useState(() => [
    { k: 0, o: WALL[0], code: 118, s: 2 }, { k: 1, o: WALL[5], code: 204, s: 1 },
  ]);
  const [ding, setDing] = useState(0);
  const next = useRef(2);
  useEffect(() => {
    const t = setInterval(() => {
      setTickets((list) => {
        const moved = list.map((x) => ({ ...x, s: x.s + 1 })).filter((x) => x.s < 3);
        const k = next.current++;
        setDing((d) => d + 1);
        return [...moved, { k, o: WALL[(k * 5) % WALL.length], code: 100 + ((k * 137) % 900), s: 0 }];
      });
    }, 3200);
    return () => clearInterval(t);
  }, []);
  const cols = [['new', 'New'], ['making', 'Making'], ['ready', 'Ready']];
  return (
    <div className="bd">
      <div className="bd__top"><b>Demo Café · orders</b><span key={ding} className="bd__ding">new order</span></div>
      <div className="bd__cols">
        {cols.map(([id, label], s) => (
          <div key={id} className="bd__col">
            <h4>{label} <span>{tickets.filter((x) => x.s === s).length}</span></h4>
            {tickets.filter((x) => x.s === s).map((x) => (
              <article key={x.k} className="bd__t">
                <div className="bd__th"><b>{x.code}</b><small>{x.o.recipe.temperature}</small></div>
                <p>{x.o.name}</p>
                <ul>{x.o.recipe.ingredients.slice(0, 3).map((i) => <li key={i.id}><Painted item={i} size={18} />{i.name}<small>{i.unit}</small></li>)}</ul>
              </article>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* Switch ingredients off and watch the next drink change. */
const SHELF = ['black_tea', 'espresso', 'milk', 'oat_milk', 'cinnamon', 'cardamom', 'caramel', 'cocoa', 'honey', 'ginger'];
export function PantryDemo() {
  const [out, setOut] = useState(['espresso']);
  const mood = useMemo(() => readMood({ text: 'cozy rainy evening, something warm', moods: ['cozy'], temp: 'hot' }), []);
  const recipe = useMemo(() => buildRecipe(mood, 'pantry-demo', out), [mood, out]);
  const flip = (id) => setOut((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  return (
    <div className="pd">
      <div className="pd__shelf">
        {SHELF.map((id) => (
          <button key={id} type="button" className={out.includes(id) ? 'out' : ''} aria-pressed={!out.includes(id)} onClick={() => flip(id)}>
            <Painted item={byId[id]} size={30} /><span>{byId[id].name}</span><small>{out.includes(id) ? 'out' : 'in stock'}</small>
          </button>
        ))}
      </div>
      <div className="pd__next card">
        <small>next “cozy, rainy evening” drink</small>
        <div className="pd__ings">
          {recipe.ingredients.map((i) => <span key={i.id} className="pd__ing"><Painted item={i} size={40} /><em>{i.name}</em></span>)}
        </div>
        <p>Tap any ingredient to switch it out of stock. The next drink is rebuilt from what is left, instantly.</p>
      </div>
    </div>
  );
}

/* Price from cost and margin, rounded the way cafés price things. */
const PRICEABLE = pantry.filter((i) => i.id !== 'ice');
export function PriceCalc() {
  const [picked, setPicked] = useState(['espresso', 'oat_milk', 'caramel']);
  const [margin, setMargin] = useState(3.2);
  const cost = picked.reduce((s, id) => s + byId[id].cost, 0);
  const raw = Math.min(cafe.maxPrice, Math.max(cafe.minPrice, cost * margin));
  const price = Math.ceil(raw / 50) * 50 - 10;
  const flip = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 5 ? [...p, id] : p));
  return (
    <div className="pc">
      <div className="pc__chips">
        {PRICEABLE.map((i) => (
          <button key={i.id} type="button" className="chip" aria-pressed={picked.includes(i.id)} onClick={() => flip(i.id)}>{i.name} <small>Rs {i.cost}</small></button>
        ))}
      </div>
      <div className="pc__out card">
        <label>Your margin <b>× {margin.toFixed(1)}</b>
          <input type="range" min="2" max="5" step="0.1" value={margin} onChange={(e) => setMargin(+e.target.value)} style={{ '--v': ((margin - 2) / 3) * 100 + '%' }} />
        </label>
        <dl>
          <div><dt>Ingredient cost</dt><dd>Rs {cost}</dd></div>
          <div><dt>Cost × margin</dt><dd>Rs {Math.round(cost * margin)}</dd></div>
          <div><dt>Your floor and ceiling</dt><dd>Rs {cafe.minPrice} to {cafe.maxPrice}</dd></div>
        </dl>
        <p className="pc__price"><small>menu price</small>Rs {price.toLocaleString('en-PK')}</p>
        <p className="pc__note">Up to 5 ingredients. Every drink is priced this way, automatically.</p>
      </div>
    </div>
  );
}

/* A printable table card with a working QR code. */
const ACCENTS = ['#6B4A3A', '#3A3530', '#A86870', '#7C8A6A', '#B9893F', '#4A5A7A'];
export function TableCard() {
  const [name, setName] = useState('Your Café');
  const [table, setTable] = useState('4');
  const [accent, setAccent] = useState(ACCENTS[0]);
  const canvas = useRef(null);
  const url = typeof window !== 'undefined' ? window.location.origin + MENU : MENU;

  useEffect(() => {
    let live = true;
    (async () => {
      const W = 1200, H = 1680, c = canvas.current;
      if (!c) return;
      c.width = W; c.height = H;
      const x = c.getContext('2d');
      await Promise.all([document.fonts.load('340 120px Fraunces'), document.fonts.load('italic 300 60px Fraunces'), document.fonts.load('600 40px Figtree')]).catch(() => {});
      const qr = await QRCode.toDataURL(url, { margin: 0, width: 560, color: { dark: '#3A3530', light: '#00000000' } });
      const mark = await svgImage(quoteMark({ size: 200, a: '#D4A55A', b: '#C4858C' }));
      const q = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = qr; });
      if (!live) return;
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#FBF7F1'); g.addColorStop(1, '#F1E8DB');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.fillStyle = accent; x.fillRect(0, 0, W, 18);
      x.drawImage(mark, 90, 120, 150, 150);
      x.fillStyle = '#3A3530';
      x.font = '340 128px Fraunces';
      x.fillText('tell us how', 90, 420);
      x.fillText('you', 90, 552);
      x.fillStyle = '#B9893F';
      x.font = 'italic 300 128px Fraunces';
      x.fillText('feel.', 310, 552);
      x.fillStyle = '#6E6E58';
      x.font = '400 40px Figtree';
      x.fillText('Scan for a drink written only for you.', 90, 640);
      x.save(); roundRect(x, 90, 720, 640, 640, 48); x.fillStyle = '#FFFFFF'; x.fill(); x.restore();
      x.drawImage(q, 130, 760, 560, 560);
      x.fillStyle = accent;
      x.save(); roundRect(x, 800, 720, 310, 640, 48); x.fill(); x.restore();
      x.fillStyle = '#FAF6F0';
      x.font = '600 34px Figtree';
      x.textAlign = 'center';
      x.fillText('TABLE', 955, 960);
      x.font = '300 220px Fraunces';
      x.fillText(table || '·', 955, 1170);
      x.textAlign = 'left';
      x.fillStyle = '#3A3530';
      x.font = '400 64px Fraunces';
      x.fillText(name || 'Your Café', 90, 1480, 1020);
      x.fillStyle = '#8A8A72';
      x.font = '500 32px Figtree';
      x.fillText('pay at the counter as usual  ·  powered by ode', 90, 1560);
    })();
    return () => { live = false; };
  }, [name, table, accent, url]);

  async function download() {
    const blob = await canvasBlob(canvas.current);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ode-table-${table || 'card'}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  return (
    <div className="tc">
      <div className="tc__form card">
        <label>Café name<input className="field" value={name} maxLength={28} onChange={(e) => setName(e.target.value)} /></label>
        <label>Table number<input className="field" value={table} maxLength={3} onChange={(e) => setTable(e.target.value.replace(/[^\w]/g, ''))} /></label>
        <div className="tc__swatches" role="radiogroup" aria-label="Accent colour">
          {ACCENTS.map((c) => <button key={c} type="button" role="radio" aria-checked={accent === c} aria-label={c} style={{ background: c }} onClick={() => setAccent(c)} />)}
        </div>
        <button type="button" className="btn btn--honey" onClick={download}>Download this card</button>
        <p className="tc__note">The QR code is real: scan it with your phone and it opens the demo menu.</p>
      </div>
      <div className="tc__preview"><canvas ref={canvas} aria-label={`Table card for ${name}, table ${table}`} /></div>
    </div>
  );
}
