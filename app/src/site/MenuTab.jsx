import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Painted } from '../components/Brand';
import Icon from '../components/Icon';
import { cafe, pantry, MOODS } from '../data/demoCafe';
import { api } from '../lib/api';
import { byId } from './odes';
import './menu.css';

const pkr = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-PK');
const TEMP = { hot: 'warm', cold: 'iced', room: 'room' };
const item = Object.fromEntries(pantry.map((i) => [i.id, i]));
// the automatic price, the same rule the server uses: cost × margin, rounded like a café menu
const autoPrice = (ids) => {
  const cost = ids.reduce((s, id) => s + (item[id]?.cost || 0), 0);
  const raw = Math.min(cafe.maxPrice, Math.max(cafe.minPrice, cost * cafe.margin));
  return Math.ceil(raw / 50) * 50 - 10;
};

function Chips({ ids, size = 24 }) {
  return (
    <span className="mn__ings">
      {ids.map((id) => item[id] && <span key={id} title={item[id].name}><Painted item={byId[id] || item[id]} size={size} />{item[id].name}</span>)}
    </span>
  );
}

// Add or edit a drink. Only ingredients that work at the chosen temperature can be picked.
function Editor({ start, onClose, onSaved }) {
  const [f, setF] = useState(() => ({ name: '', temperature: 'hot', ingredients: [], moods: [], price: '', steps: '', ...start, steps: (start?.steps || []).join('\n'), price: start?.priceSet ? String(start.price) : '' }));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const fits = pantry.filter((i) => i.temps.includes(f.temperature));
  const setTemp = (t) => setF((x) => ({ ...x, temperature: t, ingredients: x.ingredients.filter((id) => item[id].temps.includes(t)) }));
  const toggle = (k, v) => setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));
  const auto = autoPrice(f.ingredients);
  const cost = f.ingredients.reduce((s, id) => s + item[id].cost, 0);
  const price = Number(f.price) || auto;

  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    const body = {
      name: f.name.trim(), temperature: f.temperature, ingredients: f.ingredients, moods: f.moods,
      price: f.price ? Number(f.price) : (start?.id ? 0 : null), steps: f.steps.split('\n').map((s) => s.trim()).filter(Boolean),
    };
    if (body.price === null) delete body.price;
    try {
      const saved = start?.id ? await api.editRecipe(start.id, { ...body, ...(start.status === 'suggested' ? { status: 'approved' } : {}) }) : await api.addRecipe(body);
      onSaved(saved);
    } catch (x) { setErr(x.message); setBusy(false); }
  };

  return createPortal(
    <div className="mn__sheet" role="dialog" aria-modal="true" aria-label={start?.id ? 'Edit drink' : 'Add a drink'} onClick={onClose}>
      <form className="mn__editor" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <header>
          <h3>{start?.id ? (start.status === 'suggested' ? 'Review and approve' : 'Edit drink') : 'Add a drink'}</h3>
          <button type="button" className="iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" /></button>
        </header>

        <label className="mn__field"><span>Name on your menu</span>
          <input className="field" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Cardamom Honey Latte" maxLength={40} required />
        </label>

        <div className="mn__field"><span>Served</span>
          <div className="mn__seg" role="radiogroup" aria-label="Temperature">
            {['hot', 'cold'].map((t) => <button key={t} type="button" role="radio" aria-checked={f.temperature === t} onClick={() => setTemp(t)}>{TEMP[t]}</button>)}
          </div>
        </div>

        <div className="mn__field"><span>Ingredients <small>{f.ingredients.length}/6 · only what works {TEMP[f.temperature]}</small></span>
          <div className="mn__pick">
            {fits.map((i) => {
              const on = f.ingredients.includes(i.id);
              return (
                <button key={i.id} type="button" className={on ? 'on' : ''} aria-pressed={on} disabled={!on && f.ingredients.length >= 6} onClick={() => toggle('ingredients', i.id)}>
                  <Painted item={byId[i.id] || i} size={22} />{i.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mn__field"><span>Moods it suits <small>{f.moods.length ? '' : 'leave empty and ode chooses from its flavours'}</small></span>
          <div className="mn__pick mn__pick--moods">
            {MOODS.map((m) => <button key={m} type="button" className={f.moods.includes(m) ? 'on' : ''} aria-pressed={f.moods.includes(m)} disabled={!f.moods.includes(m) && f.moods.length >= 4} onClick={() => toggle('moods', m)}>{m}</button>)}
          </div>
        </div>

        <div className="mn__row">
          <label className="mn__field"><span>Price <small>automatic: {pkr(auto)}</small></span>
            <input className="field" inputMode="numeric" value={f.price} onChange={(e) => set('price', e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder={String(auto)} />
          </label>
          <div className="mn__cost"><small>Ingredient cost</small><b>{pkr(cost)}</b><small>{cost ? `${(price / cost).toFixed(1)}× margin` : 'pick ingredients'}</small></div>
        </div>

        <label className="mn__field"><span>Steps for your barista <small>optional, one per line</small></span>
          <textarea className="field" rows={4} value={f.steps} onChange={(e) => set('steps', e.target.value)} placeholder={'Pull a double shot over the cardamom and honey.\nSteam the milk and pour over.'} />
        </label>

        {err && <p className="auth__err" role="alert">{err}</p>}
        <footer>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--roast" disabled={busy || f.ingredients.length === 0 || f.name.trim().length < 2}>
            {busy ? 'Saving…' : start?.status === 'suggested' ? 'Approve drink' : start?.id ? 'Save changes' : 'Add to menu'}
          </button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}

function Preview() {
  const [text, setText] = useState('');
  const [temp, setTemp] = useState(null);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const run = async (t) => {
    const v = (t ?? text).trim();
    if (!v) return;
    setText(v); setBusy(true);
    try { setRes(await api.preview({ text: v, ...(temp ? { temp } : {}) })); } finally { setBusy(false); }
  };
  return (
    <section className="dash__card mn__preview">
      <h3>Try a mood</h3>
      <p className="dash__sub">See exactly which of your drinks a guest would get. Nothing is made.</p>
      <form onSubmit={(e) => { e.preventDefault(); run(); }} className="mn__ask">
        <input className="field" value={text} onChange={(e) => setText(e.target.value)} placeholder="rainy evening, missing home" maxLength={120} />
        <div className="mn__seg mn__seg--small" role="radiogroup" aria-label="Temperature">
          {[[null, 'any'], ['hot', 'warm'], ['cold', 'iced']].map(([t, l]) => <button key={l} type="button" role="radio" aria-checked={temp === t} onClick={() => setTemp(t)}>{l}</button>)}
        </div>
        <button type="submit" className="btn btn--roast" disabled={busy || !text.trim()}>{busy ? 'Looking…' : 'Preview'}</button>
      </form>
      <div className="mn__ideas">{['long day, need something gentle', 'first day of summer', 'date night', 'exam tomorrow'].map((x) => <button key={x} type="button" onClick={() => run(x)}>{x}</button>)}</div>
      {res && (
        res.picks.length ? (
          <ol className="mn__picks">
            <li className="mn__mood">reads as <b>{res.mood.primary}</b>{res.mood.secondary ? ` and ${res.mood.secondary}` : ''} · {TEMP[res.mood.temperature]}</li>
            {res.picks.map((p, i) => (
              <li key={p.id} className={i === 0 ? 'first' : ''}>
                <span>{i === 0 ? 'They get' : 'Next best'}</span>
                <b>{p.name}</b>
                <small>{TEMP[p.temperature]} · {pkr(p.price)}{p.because.length ? ' · ' + p.because.join(', ') : ''}{p.swaps.length ? ' · ' + p.swaps.map((s) => s.to.toLowerCase()).join(', ') : ''}</small>
              </li>
            ))}
          </ol>
        ) : <p className="mn__none">Nothing on your menu fits that right now. Add a drink for it, or check what is out of stock.</p>
      )}
    </section>
  );
}

function Coverage({ cells, onSuggest, busy }) {
  const gaps = Object.values(cells).reduce((n, c) => n + (c.hot === 0) + (c.cold === 0), 0);
  return (
    <section className="dash__card mn__cover">
      <h3>Every mood covered?</h3>
      <p className="dash__sub">{gaps ? `${gaps} gap${gaps === 1 ? '' : 's'}. Guests in those moods get your next closest drink.` : 'Every mood has a warm and an iced drink.'}</p>
      <table>
        <thead><tr><th scope="col">mood</th><th scope="col">warm</th><th scope="col">iced</th></tr></thead>
        <tbody>
          {Object.entries(cells).map(([m, c]) => (
            <tr key={m}>
              <th scope="row">{m}</th>
              {['hot', 'cold'].map((t) => <td key={t}><span className={'mn__cell n' + Math.min(2, c[t])}>{c[t] || 'gap'}</span></td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="btn btn--ghost mn__suggestbtn" onClick={onSuggest} disabled={busy}>{busy ? 'Thinking…' : gaps ? 'Suggest drinks for the gaps' : 'Suggest new drinks'}</button>
    </section>
  );
}

function Drink({ r, onToggle, onEdit, onRemove }) {
  return (
    <article className={'mn__drink' + (r.status === 'off' ? ' is-off' : '')}>
      <header>
        <div><b>{r.name}</b><span className={'mn__temp t-' + r.temperature}>{TEMP[r.temperature]}</span></div>
        <span className="mn__price">{pkr(r.price)}</span>
      </header>
      <Chips ids={r.ingredients} size={22} />
      <p className="mn__moods">{r.moods.join(' · ')}</p>
      {r.outOfStock.length > 0 && r.status === 'approved' && <p className="mn__warn"><Icon name="alert" size={14} /> {r.outOfStock.join(', ')} out of stock. Paused until it is back.</p>}
      <footer>
        <label className="mn__switch"><input type="checkbox" checked={r.status === 'approved'} onChange={() => onToggle(r)} /><i />{r.status === 'approved' ? 'on the menu' : 'switched off'}</label>
        <small>cost {pkr(r.cost)} · {r.margin}×</small>
        <span className="mn__acts">
          <button type="button" onClick={() => onEdit(r)}>Edit</button>
          <button type="button" onClick={() => onRemove(r)} aria-label={`Remove ${r.name}`}>Remove</button>
        </span>
      </footer>
    </article>
  );
}

export default function MenuTab() {
  const [m, setM] = useState(null);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [edit, setEdit] = useState(null); // {} for a new drink, a recipe to edit
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const load = () => api.menu().then(setM).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  useEffect(() => { if (!note) return undefined; const t = setTimeout(() => setNote(''), 3500); return () => clearTimeout(t); }, [note]);

  const act = async (fn, msg) => {
    setErr('');
    try { await fn(); await load(); if (msg) setNote(msg); } catch (x) { setErr(x.message); }
  };
  const suggested = useMemo(() => (m ? m.recipes.filter((r) => r.status === 'suggested') : []), [m]);
  const list = useMemo(() => (m ? m.recipes.filter((r) => r.status !== 'suggested').filter((r) =>
    filter === 'all' ? true : filter === 'off' ? r.status === 'off' : r.temperature === filter && r.status === 'approved') : []), [m, filter]);

  if (err && !m) return <p className="auth__err">{err}</p>;
  if (!m) return <p className="dash__none">Loading…</p>;
  const live = m.recipes.filter((r) => r.status === 'approved').length;

  return (
    <div className="mn">
      <p className="dash__lede">Your drinks, your recipes, your prices. ode chooses which one fits each guest and writes its name and lines. Nothing reaches a guest unless it is on here.</p>

      <section className="dash__card mn__mode">
        <h3>How ode serves</h3>
        <div className="mn__modes" role="radiogroup" aria-label="How ode serves">
          {[['approved', 'Only my approved drinks', 'Every guest gets one of your drinks. ode picks the one that fits their mood.', 'recommended'],
            ['open', 'Let ode create', 'ode combines anything in your pantry. Good for testing new ideas; your barista still sees every recipe.']].map(([v, t, d, tag]) => (
            <button key={v} type="button" role="radio" aria-checked={m.mode === v} className={m.mode === v ? 'on' : ''} onClick={() => m.mode !== v && act(() => api.menuMode(v), v === 'approved' ? 'Only approved drinks are served now.' : 'ode can now create from your pantry.')}>
              <span className="mn__dot" />
              <b>{t}{tag && <em>{tag}</em>}</b>
              <small>{d}</small>
            </button>
          ))}
        </div>
      </section>

      <div className="mn__two">
        <Preview />
        <Coverage cells={m.coverage} busy={busy} onSuggest={async () => { setBusy(true); await act(() => api.suggest(), 'Fresh suggestions are below.'); setBusy(false); }} />
      </div>

      {suggested.length > 0 && (
        <section className="mn__sugg">
          <div className="mn__head"><h3>Suggested by ode</h3><p className="dash__sub">Made only from your pantry. Approve the ones you would serve.</p></div>
          <div className="mn__grid">
            {suggested.map((r) => (
              <article key={r.id} className="mn__drink mn__drink--sugg">
                <header><div><b>{r.name}</b><span className={'mn__temp t-' + r.temperature}>{TEMP[r.temperature]}</span></div><span className="mn__price">{pkr(r.price)}</span></header>
                <p className="mn__why">{r.why}</p>
                <Chips ids={r.ingredients} size={22} />
                <p className="mn__moods">{r.moods.join(' · ')}</p>
                <footer>
                  <button type="button" className="btn btn--roast" onClick={() => act(() => api.editRecipe(r.id, { status: 'approved' }), `${r.name} is on your menu.`)}>Approve</button>
                  <button type="button" className="btn btn--ghost" onClick={() => setEdit(r)}>Edit first</button>
                  <button type="button" className="mn__dismiss" onClick={() => act(() => api.removeRecipe(r.id))}>Dismiss</button>
                </footer>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mn__menu">
        <div className="mn__head">
          <div><h3>Your menu</h3><p className="dash__sub">{live} drink{live === 1 ? '' : 's'} served · tap the switch to pause one</p></div>
          <button type="button" className="btn btn--roast" onClick={() => setEdit({})}>Add a drink</button>
        </div>
        <div className="mn__filters" role="tablist" aria-label="Show">
          {[['all', 'All'], ['hot', 'Warm'], ['cold', 'Iced'], ['off', 'Switched off']].map(([v, l]) => <button key={v} type="button" role="tab" aria-selected={filter === v} onClick={() => setFilter(v)}>{l}</button>)}
        </div>
        {list.length ? (
          <div className="mn__grid">
            {list.map((r) => (
              <Drink key={r.id} r={r}
                onToggle={(x) => act(() => api.editRecipe(x.id, { status: x.status === 'approved' ? 'off' : 'approved' }), x.status === 'approved' ? `${x.name} is paused.` : `${x.name} is back on the menu.`)}
                onEdit={setEdit}
                onRemove={(x) => window.confirm(`Remove ${x.name} from your menu?`) && act(() => api.removeRecipe(x.id), `${x.name} removed.`)} />
            ))}
          </div>
        ) : <p className="dash__none">Nothing here.</p>}
      </section>

      {(err || note) && <p className={'mn__toast' + (err ? ' bad' : '')} role="status">{err || note}</p>}
      {edit && <Editor start={edit.id ? edit : null} onClose={() => setEdit(null)} onSaved={(r) => { setEdit(null); load(); setNote(`${r.name} saved.`); }} />}
    </div>
  );
}
