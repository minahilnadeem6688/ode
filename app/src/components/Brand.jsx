import { quoteMark, sealMark, printMark } from '../brand/marks';
import { portrait, INGREDIENT_COLORS } from '../brand/portrait';
import { paintedFor } from '../brand/painted';
import { cafe } from '../data/demoCafe';

// Renders one of the brand's SVG strings.
export function Svg({ html, className, style, label }) {
  return <span className={className} style={{ display: 'inline-flex', ...style }} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Mark({ size = 28, a = '#D4A55A', b = '#C4858C', style }) {
  return <Svg html={quoteMark({ size, a, b })} style={style} />;
}

export function Lockup({ size = 22, color = 'var(--roast)', a, b }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: size * 0.08 }} aria-label="ode">
      <Mark size={size * 0.95} a={a} b={b} style={{ marginTop: -size * 0.2 }} />
      <span className="wordmark" style={{ fontSize: size * 1.3, color }}>ode</span>
    </span>
  );
}

export function Seal({ size = 64 }) { return <Svg html={sealMark({ size, id: 'seal' + size })} />; }
export function Print({ size = 64, ...rest }) { return <Svg html={printMark({ size, ...rest })} />; }

// The drink's own artwork, from its ingredient colours and mood.
export function Portrait({ creation, width = 400, height = 480, id = 'p', className, style }) {
  const colors = creation.recipe.ingredients.filter((i) => i.id !== 'ice').map((i) => INGREDIENT_COLORS[i.id] || i.color);
  return <Svg className={className} style={style} label={`Artwork for ${creation.name}`} html={portrait({ colors, mood: creation.mood.primary, seed: creation.id, width, height, id })} />;
}

export function Painted({ item, size = 56 }) {
  return <Svg html={paintedFor(item, 'pi-' + item.id + size)} style={{ width: size, height: size }} />;
}

// The café's own name sits on top; ode stays quiet beside it.
export function CafeBar({ left, right }) {
  const chip = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, font: '600 14.5px var(--sans)' }}>
      <span style={{ width: 30, height: 30, borderRadius: '50%', background: cafe.accent, display: 'grid', placeItems: 'center', color: '#FAF6F0', font: '600 13px var(--serif)' }}>{cafe.name[0]}</span>
      {cafe.name}
    </span>
  );
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0 10px', minHeight: 72 }}>
      {left || chip}
      {right || (left ? chip : null)}
    </header>
  );
}
