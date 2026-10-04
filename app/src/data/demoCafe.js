/*
 * The demo café: its look, pantry and pricing. In the real product each café sets this up
 * in the owner dashboard. The data lives in one JSON file that the server reads too, so the
 * app and the API never disagree about what is in the pantry.
 *
 * category: base, milk, flavour, fruit, spice, sweet, fizz, finish
 * temps: which temperatures it works in. families: flavour families from the flavour map.
 * Costs are in PKR per unit (unit = what one drink uses). price = cost × margin, rounded.
 */
import data from '../../api/_ode/demo_cafe.json';

export const cafe = data.cafe;
export const pantry = data.pantry;
export const MOODS = data.moods;
export const FLAVOURS = data.flavours;
export const DIETS = [
  ['vegan', 'vegan'], ['dairy', 'dairy-free'], ['nuts', 'nut-free'], ['caffeine', 'caffeine-free'], ['sugar', 'sugar-free'],
];
export const EXAMPLES = ['rainy mornings', 'late night drive', 'lazy sunday', 'sweet but not childish', 'first day of summer', 'missing home'];
