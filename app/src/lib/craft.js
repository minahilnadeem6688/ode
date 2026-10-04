/*
 * Demo crafting engine. Mirrors the three stages of the real pipeline (read the mood, build a
 * recipe from the café's pantry, write the two lines) with hand-written rules, so the whole
 * flow works before the backend and the AI are connected. Same input, same drink.
 */
import { cafe, pantry } from '../data/demoCafe';
import { stock } from './store';

function seeded(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, list) => list[Math.floor(r() * list.length)];

// Words that hint at a mood, temperature or flavour when nothing is tagged.
const CUES = {
  mood: {
    tired: ['tired', 'exhausted', 'long day', 'sleepy', 'drained', 'monday', 'slow'],
    nostalgic: ['miss', 'home', 'childhood', 'old', 'grandmother', 'nani', 'dadi', 'remember', 'memory'],
    energetic: ['energy', 'excited', 'gym', 'busy', 'focus', 'deadline', 'wake'],
    romantic: ['date', 'love', 'crush', 'romantic', 'soft'],
    cozy: ['rain', 'rainy', 'cold', 'winter', 'blanket', 'cozy', 'cosy', 'book'],
    playful: ['fun', 'party', 'friends', 'summer', 'sunny', 'weekend', 'friday'],
    stressed: ['stress', 'anxious', 'exam', 'overwhelmed', 'work'],
    calm: ['calm', 'quiet', 'peace', 'sunday', 'lazy', 'chill'],
  },
  hot: ['rain', 'rainy', 'cold', 'winter', 'warm', 'cozy', 'cosy', 'chai', 'night'],
  cold: ['summer', 'hot day', 'heat', 'sunny', 'iced', 'refresh', 'cool'],
  flavour: {
    chocolate: ['chocolate', 'cocoa', 'mocha'], citrus: ['lemon', 'citrus', 'zesty', 'orange', 'fresh'],
    floral: ['floral', 'rose', 'flower', 'lavender'], fruity: ['fruit', 'fruity', 'berry', 'strawberry', 'lychee'],
    spicy: ['spice', 'spicy', 'ginger', 'cinnamon', 'chai'], caramel: ['caramel', 'sweet', 'dessert'],
    tropical: ['mango', 'tropical', 'coconut', 'beach'], earthy: ['earthy', 'matcha', 'grounding'], nutty: ['nutty', 'hazelnut'],
  },
};

const MOOD_LEAN = {
  calm: { temp: 'hot', families: ['floral', 'herbal'] }, nostalgic: { temp: 'hot', families: ['spicy', 'caramel'] },
  energetic: { temp: 'cold', families: ['citrus', 'chocolate'] }, tired: { temp: 'hot', families: ['chocolate', 'caramel'] },
  romantic: { temp: 'cold', families: ['floral', 'fruity'] }, cozy: { temp: 'hot', families: ['spicy', 'chocolate'] },
  playful: { temp: 'cold', families: ['fruity', 'tropical'] }, stressed: { temp: 'hot', families: ['herbal', 'floral'] },
};

// Stage 1: read the mood
export function readMood({ text = '', moods = [], temp, sweetness = 5, flavours = [], diet = [] }) {
  const t = text.toLowerCase();
  const found = Object.entries(CUES.mood).filter(([, w]) => w.some((x) => t.includes(x))).map(([m]) => m);
  const all = [...new Set([...moods, ...found])];
  const primary = all[0] || 'calm';
  const temperature = temp || (CUES.hot.some((x) => t.includes(x)) ? 'hot' : CUES.cold.some((x) => t.includes(x)) ? 'cold' : MOOD_LEAN[primary].temp);
  const fromText = Object.entries(CUES.flavour).filter(([, w]) => w.some((x) => t.includes(x))).map(([f]) => f);
  const fam = [...new Set([...flavours, ...fromText, ...MOOD_LEAN[primary].families])].slice(0, 3);
  return { primary, secondary: all[1] || null, temperature, sweetness, families: fam, asked: [...new Set([...flavours, ...fromText])], diet, keywords: t.split(/\W+/).filter((w) => w.length > 3).slice(0, 6) };
}

// Hard rules first: only what this café has, in this temperature, safe for this person.
export function allowedPantry(mood) {
  const d = new Set(mood.diet);
  const out = new Set(stock.out());
  return pantry.filter((i) => !out.has(i.id) && i.temps.includes(mood.temperature)
    && !(d.has('vegan') && (i.allergens?.includes('dairy') || i.notVegan))
    && !(d.has('dairy') && i.allergens?.includes('dairy'))
    && !(d.has('nuts') && i.allergens?.includes('nuts'))
    && !(d.has('caffeine') && i.caffeine)
    && !(d.has('sugar') && i.category === 'sweet'));
}

// Stage 2: build the recipe
export function buildRecipe(mood, seed) {
  const r = seeded(seed);
  const ok = allowedPantry(mood);
  const score = (i) => i.families.filter((f) => mood.families.includes(f)).length + r() * 0.6;
  const best = (cat) => ok.filter((i) => cat.includes(i.category)).sort((a, b) => score(b) - score(a));

  const parts = [];
  const bases = best(['base']);
  const fizzFirst = mood.temperature === 'cold' && mood.families.some((f) => ['citrus', 'fruity', 'tropical', 'floral'].includes(f)) && r() > 0.3;
  const base = fizzFirst ? best(['fizz'])[0] || bases[0] : bases[0];
  if (base) parts.push(base);
  // flavours the customer asked for come first, including a sweet one (caramel, honey…) they named
  // every flavour the customer named gets at least one ingredient (caramel, honey… included)
  for (const fam of mood.asked || []) {
    if (parts.length >= 4) break;
    const hit = ok.filter((i) => ['fruit', 'flavour', 'spice', 'sweet'].includes(i.category) && i.families.includes(fam) && !parts.includes(i)).sort((a, b) => score(b) - score(a))[0];
    if (hit) parts.push(hit);
  }
  for (const i of best(['fruit', 'flavour', 'spice'])) { if (parts.length >= 3) break; if (score(i) >= 1 && !parts.includes(i)) parts.push(i); }
  if (base && base.category === 'base' && ['espresso', 'matcha', 'black_tea'].includes(base.id) && !fizzFirst) {
    const milk = best(['milk'])[0];
    if (milk) parts.push(milk);
  }
  if (mood.sweetness >= 6 && parts.length < cafe.maxIngredients && !parts.some((p) => p.category === 'sweet')) { const s = best(['sweet'])[0]; if (s) parts.push(s); }
  if (parts.length < cafe.maxIngredients) {
    // ice for cold drinks; mint only where it belongs (fresh, herbal or citrus drinks)
    if (mood.temperature === 'cold' && ok.find((i) => i.id === 'ice')) parts.push(ok.find((i) => i.id === 'ice'));
    else if (mood.families.some((f) => ['herbal', 'citrus'].includes(f)) && ok.find((i) => i.id === 'mint')) parts.push(ok.find((i) => i.id === 'mint'));
  }
  const ingredients = [...new Map(parts.map((p) => [p.id, p])).values()].slice(0, cafe.maxIngredients);

  const method = mood.temperature === 'hot' ? (ingredients.some((i) => i.category === 'milk') ? 'steam' : 'hot brew')
    : ingredients.some((i) => i.category === 'fruit') ? 'muddle' : ingredients.some((i) => i.category === 'fizz') ? 'layer' : 'shake';
  const steps = recipeSteps(ingredients, method, mood.temperature);
  return { ingredients, method, temperature: mood.temperature, steps, prepSeconds: 90 + ingredients.length * 25 };
}

function recipeSteps(ing, method, temp) {
  const names = (cat) => ing.filter((i) => cat.includes(i.category)).map((i) => i.name.toLowerCase());
  const s = [];
  const muddle = names(['fruit', 'spice']);
  if (method === 'muddle' && muddle.length) s.push(`Muddle ${muddle.join(' and ')} in the glass.`);
  const base = ing.find((i) => i.category === 'base' || i.category === 'fizz');
  if (base) s.push(temp === 'hot' ? `Brew the ${base.name.toLowerCase()} (${base.unit}).` : `Prepare ${base.unit} of ${base.name.toLowerCase()}, chilled.`);
  const flav = names(['flavour', 'sweet']);
  if (flav.length) s.push(`Stir in ${flav.join(' and ')}.`);
  if (method !== 'muddle' && muddle.length) s.push(`Add ${muddle.join(' and ')}.`);
  const milk = names(['milk']);
  if (milk.length) s.push(temp === 'hot' ? `Steam the ${milk[0]} and pour slowly over the top.` : `Pour the ${milk[0]} over ice.`);
  if (ing.find((i) => i.id === 'ice') && !milk.length) s.push('Fill with ice and give it one slow stir.');
  if (ing.find((i) => i.id === 'mint')) s.push('Finish with mint, lightly clapped.');
  return s;
}

// Stage 3: the name and the two lines
const NAMES = {
  calm: ['Still Water', 'Quiet Hour', 'Soft Harbour', 'Linen Morning'], nostalgic: ['Old Letters', 'Nani’s Window', 'Sepia', 'Paper Kites'],
  energetic: ['Bright Start', 'Live Wire', 'Gold Rush', 'First Light'], tired: ['Fog Over Monday', 'Slow Return', 'Heavy Lids', 'Soft Landing'],
  romantic: ['Rose Hour', 'Second Glance', 'Blush', 'Slow Dance'], cozy: ['Rain on Tin', 'Blanket Fort', 'Ember', 'Wool & Smoke'],
  playful: ['Golden Hour Spritz', 'Sunday Cartwheel', 'Fizz & Gossip', 'Kite Season'], stressed: ['Exhale', 'Open Window', 'Unclench', 'Long Breath'],
};
const LINES = {
  calm: [['nothing to fix,', 'nowhere to be.'], ['the kind of quiet', 'you can hear yourself in.']],
  nostalgic: [['it tastes like a kitchen', 'you can’t go back to.'], ['light, fleeting,', 'exactly like the last good day of july.']],
  energetic: [['the first good idea', 'of the day, in a glass.'], ['loud colours,', 'clear head.']],
  tired: [['the kind of warmth that arrives', 'before you knew you needed it.'], ['for the hour', 'when everything is too much.']],
  romantic: [['sweet at first,', 'and then it stays.'], ['the pause', 'before you say it.']],
  cozy: [['rain on the window,', 'nowhere you’d rather be.'], ['bitter at the edges,', 'soft in the middle, like most good things.']],
  playful: [['bubbles, gossip,', 'the sun still up.'], ['a little reckless,', 'entirely worth it.']],
  stressed: [['put it down for a minute.', 'it will still be there.'], ['one sip,', 'and the room gets bigger.']],
};

export function writeOde(mood, recipe, seed) {
  const r = seeded(seed + 'ode');
  const name = pick(r, NAMES[mood.primary] || NAMES.calm);
  const lines = pick(r, LINES[mood.primary] || LINES.calm);
  return { name, lines };
}

export function priceOf(recipe) {
  const cost = recipe.ingredients.reduce((s, i) => s + i.cost, 0);
  const raw = Math.min(cafe.maxPrice, Math.max(cafe.minPrice, cost * cafe.margin));
  return Math.ceil(raw / 50) * 50 - 10; // 590, 640, 690: café-style prices
}

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

// The whole pipeline, reporting each stage as it finishes (the crafting screen lights up on these).
export async function craft(input, onStage = () => {}) {
  const seed = JSON.stringify(input) + Date.now().toString(36).slice(0, -3); // same request in the same minute, same drink
  await wait(700);
  const mood = readMood(input); onStage(1);
  await wait(800);
  const recipe = buildRecipe(mood, seed); onStage(2);
  await wait(700);
  const ode = writeOde(mood, recipe, seed); onStage(3);
  await wait(600);
  onStage(4);
  const r = seeded(seed + 'm');
  return {
    id: Math.random().toString(36).slice(2, 10),
    createdAt: Date.now(),
    cafe: cafe.id,
    input, mood, recipe, ...ode,
    price: priceOf(recipe),
    match: 86 + Math.floor(r() * 11),
  };
}
