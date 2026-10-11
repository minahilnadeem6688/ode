/*
 * Local state for the prototype: the order being composed, saved creations and the order queue.
 * The queue is shared across tabs, so the barista board updates live on the same device.
 * Replaced by the API once the backend is in.
 */
const read = (store, key, fallback) => {
  try { const v = store.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const write = (store, key, value) => { try { store.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked */ } };

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ode-orders') : null;

export const draft = {
  get: () => read(sessionStorage, 'ode.draft', { text: '', moods: [], temp: null, sweetness: 5, flavours: [], diet: [], notes: '' }),
  set: (d) => write(sessionStorage, 'ode.draft', d),
  clear: () => sessionStorage.removeItem('ode.draft'),
};

export const creations = {
  all: () => read(localStorage, 'ode.creations', []),
  // saved drinks first, then the recent ones seen on this device, so a share or order link
  // still finds its drink after a reload or in a new tab
  get: (id) => creations.all().find((c) => c.id === id) || read(localStorage, 'ode.seen', []).find((c) => c.id === id) || null,
  remember: (c) => write(localStorage, 'ode.seen', [c, ...read(localStorage, 'ode.seen', []).filter((x) => x.id !== c.id)].slice(0, 20)),
  save: (c) => { const all = creations.all().filter((x) => x.id !== c.id); write(localStorage, 'ode.creations', [{ ...c, savedAt: Date.now() }, ...all]); },
  unsave: (id) => write(localStorage, 'ode.creations', creations.all().filter((x) => x.id !== id)),
  isSaved: (id) => creations.all().some((c) => c.id === id),
  rate: (id, rating, chips) => {
    const all = creations.all().map((c) => (c.id === id ? { ...c, rating, chips } : c));
    write(localStorage, 'ode.creations', all);
  },
};

export const orders = {
  all: () => read(localStorage, 'ode.orders', []),
  get: (code) => orders.all().find((o) => o.code === code),
  place: (creation, size) => {
    const all = orders.all();
    const code = String(100 + ((all.length * 37 + Math.floor(Math.random() * 30)) % 900));
    const order = { code, creationId: creation.id, creation, size, status: 'new', placedAt: Date.now() };
    write(localStorage, 'ode.orders', [order, ...all].slice(0, 60));
    channel?.postMessage({ type: 'orders' });
    return order;
  },
  setStatus: (code, status) => {
    write(localStorage, 'ode.orders', orders.all().map((o) => (o.code === code ? { ...o, status, [status + 'At']: Date.now() } : o)));
    channel?.postMessage({ type: 'orders' });
  },
  subscribe: (fn) => {
    const onMsg = () => fn(orders.all());
    const onStorage = (e) => { if (e.key === 'ode.orders') fn(orders.all()); };
    channel?.addEventListener('message', onMsg);
    window.addEventListener('storage', onStorage);
    return () => { channel?.removeEventListener('message', onMsg); window.removeEventListener('storage', onStorage); };
  },
};

// Ingredients the barista has marked out of stock. New drinks stop using them immediately.
export const stock = {
  out: () => read(localStorage, 'ode.out', []),
  toggle: (id) => {
    const out = stock.out();
    write(localStorage, 'ode.out', out.includes(id) ? out.filter((x) => x !== id) : [...out, id]);
  },
};
