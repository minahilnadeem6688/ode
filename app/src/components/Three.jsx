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

// The 3D cup. In crafting mode `stage` drives the drops and the colour; without WebGL the portrait stands in.
export function Cup({ creation, colors, mode = 'hero', stage = 0, hot, intro = false, className }) {
  const ref = useRef(null);
  const api = useRef(null);
  const [fallback] = useState(() => !canWebGL());
  const cols = colors || (creation ? drinkColors(creation) : undefined);
  const colorKey = (cols || []).join();
  const isHot = hot ?? creation?.recipe.temperature === 'hot';

  useEffect(() => {
    if (fallback) return undefined;
    let cancelled = false;
    import('../three/cup').then(({ mountCup }) => {
      if (cancelled || !ref.current) return;
      api.current = mountCup(ref.current, { colors: cols, mode, hot: isHot, intro });
      api.current.setStage(stage);
    });
    return () => { cancelled = true; api.current?.dispose(); api.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, fallback]);

  // a new drink in the same cup: the colours glide over, the steam follows the temperature
  useEffect(() => { if (cols) api.current?.setColors(cols); }, [colorKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { api.current?.setHot(isHot); }, [isHot]);

  useEffect(() => { api.current?.setStage(stage); }, [stage]);

  if (fallback) return creation ? <Portrait creation={creation} width={420} height={420} id="cupfb" className={className} /> : null;
  return <canvas ref={ref} className={className} aria-label={creation ? `${creation.name}, in its cup` : 'Your drink being made'} role="img" style={{ touchAction: mode === 'hero' ? 'pan-y' : 'auto' }} />;
}
