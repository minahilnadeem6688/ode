// The Wall's photos: one flat-lay per ode, baked from the 3D studio (src/three/still.js)
// at /kit/stills into public/wall/. Each shot keeps its own glaze, table and shape.
import { INGREDIENT_COLORS } from '../brand/portrait';
import { WALL } from './odes';

const GLAZE = ['#FBF7F1', '#E3EBE1', '#F2DEE1', '#3A3530', '#F1E3C8', '#DCE3EC'];
const TABLE = {
  calm: '#E9E4EC', nostalgic: '#C9A887', energetic: '#EEEBE6', tired: '#B99A7E',
  romantic: '#F0DDDF', cozy: '#B48D6C', playful: '#F1EEEA', stressed: '#DDE5DE',
};
const SHAPES = [[720, 900], [720, 1080], [720, 760], [720, 960]];
const CLOTH = {
  calm: '#F4F1F6', nostalgic: '#F5EDE2', energetic: '#F3E3B8', tired: '#EFE7DE',
  romantic: '#F5E1E4', cozy: '#F2E8DC', playful: '#F6DCC6', stressed: '#E5EEE7',
};
const SURFACE = {
  calm: 'linen', nostalgic: 'wood', energetic: 'marble', tired: 'wood',
  romantic: 'linen', cozy: 'wood', playful: 'marble', stressed: 'linen',
};

export const STILLS = WALL.map((o, i) => ({
  id: o.id,
  src: `/wall/${o.id}.webp`,
  width: SHAPES[i % 4][0],
  height: SHAPES[i % 4][1],
  colors: o.recipe.ingredients.filter((x) => x.id !== 'ice').map((x) => INGREDIENT_COLORS[x.id] || x.color),
  ingredients: o.recipe.ingredients.map((x) => x.id).filter((id) => !['milk', 'oat_milk', 'coconut_milk'].includes(id)),
  temperature: o.recipe.temperature,
  glaze: GLAZE[i % GLAZE.length],
  table: TABLE[o.mood.primary],
  cloth: CLOTH[o.mood.primary],
  surfaceKind: SURFACE[o.mood.primary],
  seed: o.id + o.name,
}));
