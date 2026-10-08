/*
 * Who is signed in on this device. Customers and the café team have separate sessions,
 * so a barista's tablet and a customer's phone never get mixed up.
 */
import { useEffect, useState } from 'react';

const KEYS = { customer: 'ode.me', team: 'ode.team' };
const read = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const tokenAlive = (t) => {
  try { return JSON.parse(atob(t.split('.')[0].replace(/-/g, '+').replace(/_/g, '/'))).exp * 1000 > Date.now(); } catch { return false; }
};

export const session = {
  get(kind) { const s = read(KEYS[kind]); return s && tokenAlive(s.token) ? s : null; },
  set(kind, value) { try { localStorage.setItem(KEYS[kind], JSON.stringify(value)); } catch { /* private mode */ } window.dispatchEvent(new Event('ode-session')); },
  clear(kind) { try { localStorage.removeItem(KEYS[kind]); } catch { /* private mode */ } window.dispatchEvent(new Event('ode-session')); },
};

// Re-renders when someone signs in or out, in this tab or another.
export function useSession(kind) {
  const [s, setS] = useState(() => session.get(kind));
  useEffect(() => {
    const on = () => setS(session.get(kind));
    window.addEventListener('ode-session', on);
    window.addEventListener('storage', on);
    return () => { window.removeEventListener('ode-session', on); window.removeEventListener('storage', on); };
  }, [kind]);
  return s;
}
