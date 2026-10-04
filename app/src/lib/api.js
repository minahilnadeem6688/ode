/*
 * The ode API. If it is not there (a plain static deploy, or offline), every screen falls back
 * to the on-device demo, so the app always works.
 */
export const CAFE = 'demo';

let health;
export function online() {
  health ??= fetch('/api/health', { signal: AbortSignal.timeout(3500) })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => j?.ok === true)
    .catch(() => false);
  return health;
}

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function call(path, { method = 'GET', body, staff } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (staff) headers['x-ode-staff'] = staff;
  const r = await fetch('/api' + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(r.status, data.detail || 'something went wrong');
  return data;
}

// Writes an ode. The server streams one line per finished stage, then the drink.
export async function craft(input, onStage) {
  const r = await fetch(`/api/cafes/${CAFE}/craft`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) });
  if (!r.ok || !r.body) throw new ApiError(r.status, 'could not write this one');
  const reader = r.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const msg = JSON.parse(buf.slice(0, nl));
      buf = buf.slice(nl + 1);
      if (msg.stage) onStage(msg.stage);
      if (msg.error) throw new ApiError(500, msg.error);
      if (msg.creation) return msg.creation;
    }
  }
  throw new ApiError(500, 'the connection closed early');
}

export const api = {
  cafe: () => call(`/cafes/${CAFE}`),
  order: (creationId, size) => call(`/cafes/${CAFE}/orders`, { method: 'POST', body: { creationId, size } }),
  orderStatus: (id) => call(`/orders/${id}`),
  rate: (id, rating, chips) => call(`/creations/${id}/rating`, { method: 'POST', body: { rating, chips } }),
  board: (staff) => call(`/cafes/${CAFE}/board`, { staff }),
  advance: (staff, id, status) => call(`/cafes/${CAFE}/orders/${id}`, { method: 'PATCH', body: { status }, staff }),
  stock: (staff, item, out) => call(`/cafes/${CAFE}/stock/${item}`, { method: 'PUT', body: { out }, staff }),
};
