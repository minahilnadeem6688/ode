import { useEffect, useRef, useState } from 'react';
import { INGREDIENT_COLORS } from '../brand/portrait';
import { Portrait } from './Brand';

const canWebGL = (() => {
  let ok;
  return () => {
    if (ok === undefined) {
      try { const c = document.createElement('canvas'); ok = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { ok = false; }
    }
    return ok;
  };
})();

// Floating drops and pearls behind a screen. Loads three.js only when shown.
export function Ambient({ variant = 'welcome' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!canWebGL()) return undefined;
    let stop = () => {}, cancelled = false;
    import('../three/ambient').then(({ mountAmbient }) => { if (!cancelled && ref.current) stop = mountAmbient(ref.current, variant); });
    return () => { cancelled = true; stop(); };
  }, [variant]);
  return <canvas ref={ref} className="ambient" aria-hidden="true" />;
}

export const drinkColors = (c) => c.recipe.ingredients.filter((i) => i.id !== 'ice').map((i) => INGREDIENT_COLORS[i.id] || i.color);

// What the drink looks like in the cup: its colour, whether there is milk (crema and latte art),
// which art the barista pours, and whether it comes iced in a glass.
const BODY = { espresso: '#4A2C1E', cold_brew: '#3E2518', black_tea: '#8A4E22', matcha: '#7FA14A', hibiscus: '#9E2F4C', soda: '#F3EBD6', cocoa: '#4E2F22', coconut_milk: '#F4EFE6' };
const mixHex = (a, b, t) => '#' + [0, 2, 4].map((i) => Math.round(parseInt(a.slice(1 + i, 3 + i), 16) * (1 - t) + parseInt(b.slice(1 + i, 3 + i), 16) * t).toString(16).padStart(2, '0')).join('');
const hash = (s) => [...String(s)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
export function drinkSurface(c) {
  const ings = c.recipe.ingredients.filter((i) => i.id !== 'ice');
  const milk = ings.some((i) => i.category === 'milk');
  const base = ings.find((i) => BODY[i.id]) || ings[0];
  const flavour = ings.find((i) => !['base', 'fizz', 'milk', 'finish'].includes(i.category));
  let body = BODY[base?.id] || INGREDIENT_COLORS[base?.id] || base?.color || '#B98A5E';
  if (ings.some((i) => i.id === 'cocoa') && base?.id === 'espresso') body = mixHex(body, BODY.cocoa, 0.5);
  if (flavour) body = mixHex(body, INGREDIENT_COLORS[flavour.id] || flavour.color, milk ? 0.12 : 0.3);
  if (milk) body = mixHex(body, '#E4CBA8', base?.id === 'matcha' ? 0.35 : 0.52);
  const mood = c.mood?.primary;
  const art = !milk ? 0 : mood === 'romantic' ? 1 : mood === 'playful' ? 4 : mood === 'calm' ? 3 : [1, 2, 3][hash(c.id || c.name) % 3];
  return { body, foam: mixHex('#FBF5EC', body, 0.06), milk, art, cold: c.recipe.temperature === 'cold', seed: (hash(c.id || c.name) % 1000) / 100 };
}

// The 3D cup. In crafting mode `stage` drives the drops and the colour; without WebGL the portrait stands in.
export function Cup({ creation, colors, mode = 'hero', stage = 0, hot, intro = false, className }) {
  const ref = useRef(null);
  const api = useRef(null);
  const [fallback] = useState(() => !canWebGL());
  const cols = colors || (creation ? drinkColors(creation) : undefined);
  const surface = creation ? drinkSurface(creation) : undefined;
  const look = surface ? [surface.body, surface.foam, surface.milk, surface.art].join() : (cols || []).join();
  const glassy = !!surface?.cold;
  const isHot = hot ?? creation?.recipe.temperature === 'hot';

  useEffect(() => {
    if (fallback) return undefined;
    let cancelled = false;
    import('../three/cup').then(({ mountCup }) => {
      if (cancelled || !ref.current) return;
      api.current = mountCup(ref.current, { colors: cols, mode, hot: isHot, intro, surface });
      api.current.setStage(stage);
    });
    return () => { cancelled = true; api.current?.dispose(); api.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, fallback, glassy]); // an iced drink comes in a glass, so the scene is rebuilt

  // a new drink in the same cup: the colours glide over and the art changes, the steam follows the temperature
  useEffect(() => { if (surface) api.current?.setSurface(surface); else if (cols) api.current?.setColors(cols); }, [look]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { api.current?.setHot(isHot); }, [isHot]);

  useEffect(() => { api.current?.setStage(stage); }, [stage]);

  if (fallback) return creation ? <Portrait creation={creation} width={420} height={420} id="cupfb" className={className} /> : null;
  return <canvas ref={ref} className={className} aria-label={creation ? `${creation.name}, in its cup` : 'Your drink being made'} role="img" style={{ touchAction: mode === 'hero' ? 'pan-y' : 'auto' }} />;
}
