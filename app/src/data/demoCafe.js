/*
 * The demo café: its look, pantry and pricing. In the real product each café sets this up
 * in the owner dashboard; here it lets the whole flow run before the backend exists.
 * Costs are in PKR per unit (unit = what one drink uses).
 */
export const cafe = {
  id: 'demo',
  name: 'Demo Café',
  handle: '@democafe',
  accent: '#6B4A3A',
  margin: 3.2, // price = ingredient cost × margin, rounded
  minPrice: 490,
  maxPrice: 1200,
  maxIngredients: 5,
};

// category: base, milk, flavour, fruit, spice, sweet, fizz, finish
// temps: which temperatures it works in. families: flavour families from the flavour map.
export const pantry = [
  { id: 'espresso', name: 'Espresso', category: 'base', color: '#6B4A3A', cost: 70, unit: 'double shot', temps: ['hot', 'cold'], families: ['chocolate', 'nutty', 'earthy'], caffeine: true },
  { id: 'cold_brew', name: 'Cold brew', category: 'base', color: '#5A3B2C', cost: 80, unit: '120 ml', temps: ['cold'], families: ['chocolate', 'earthy'], caffeine: true },
  { id: 'black_tea', name: 'Black tea', category: 'base', color: '#B07A45', cost: 25, unit: '1 bag, steeped', temps: ['hot', 'cold', 'room'], families: ['earthy', 'spicy'], caffeine: true },
  { id: 'matcha', name: 'Matcha', category: 'base', color: '#9DB86B', cost: 110, unit: '2 g', temps: ['hot', 'cold'], families: ['earthy', 'herbal'], caffeine: true },
  { id: 'hibiscus', name: 'Hibiscus tea', category: 'base', color: '#C95B78', cost: 35, unit: '1 bag, steeped', temps: ['hot', 'cold', 'room'], families: ['floral', 'fruity'] },
  { id: 'soda', name: 'Sparkling water', category: 'fizz', color: '#CFE3EC', cost: 30, unit: '120 ml', temps: ['cold'], families: ['citrus', 'fruity'] },
  { id: 'milk', name: 'Whole milk', category: 'milk', color: '#F3EADB', cost: 40, unit: '180 ml', temps: ['hot', 'cold'], families: ['nutty', 'caramel', 'chocolate'], allergens: ['dairy'] },
  { id: 'oat_milk', name: 'Oat milk', category: 'milk', color: '#E9DCC3', cost: 90, unit: '180 ml', temps: ['hot', 'cold'], families: ['nutty', 'earthy', 'caramel'] },
  { id: 'coconut_milk', name: 'Coconut milk', category: 'milk', color: '#F4EEE2', cost: 80, unit: '150 ml', temps: ['hot', 'cold'], families: ['tropical', 'nutty'] },
  { id: 'cocoa', name: 'Dark cocoa', category: 'flavour', color: '#7A4E3A', cost: 45, unit: '15 g', temps: ['hot', 'cold'], families: ['chocolate'] },
  { id: 'caramel', name: 'Salted caramel', category: 'sweet', color: '#D49A55', cost: 35, unit: '20 ml', temps: ['hot', 'cold'], families: ['caramel'], allergens: ['dairy'] },
  { id: 'vanilla', name: 'Vanilla', category: 'sweet', color: '#F1E3C2', cost: 30, unit: '15 ml', temps: ['hot', 'cold', 'room'], families: ['caramel', 'floral'] },
  { id: 'honey', name: 'Honey', category: 'sweet', color: '#E3B04B', cost: 30, unit: '15 ml', temps: ['hot', 'cold', 'room'], families: ['floral', 'earthy'], notVegan: true },
  { id: 'rose', name: 'Rose syrup', category: 'flavour', color: '#E3A3B0', cost: 30, unit: '15 ml', temps: ['hot', 'cold', 'room'], families: ['floral'] },
  { id: 'lavender', name: 'Lavender', category: 'flavour', color: '#B8A6D9', cost: 35, unit: '10 ml', temps: ['hot', 'cold'], families: ['floral', 'herbal'] },
  { id: 'cardamom', name: 'Cardamom', category: 'spice', color: '#A9B57A', cost: 15, unit: '2 pods, crushed', temps: ['hot', 'cold', 'room'], families: ['spicy', 'earthy'] },
  { id: 'cinnamon', name: 'Cinnamon', category: 'spice', color: '#B7703F', cost: 10, unit: 'a pinch', temps: ['hot', 'cold', 'room'], families: ['spicy', 'caramel'] },
  { id: 'ginger', name: 'Fresh ginger', category: 'spice', color: '#E2B36A', cost: 15, unit: '3 thin slices', temps: ['hot', 'cold', 'room'], families: ['spicy', 'citrus'] },
  { id: 'lychee', name: 'Lychee', category: 'fruit', color: '#F2C6CC', cost: 70, unit: '4 lychees', temps: ['cold', 'room'], families: ['fruity', 'floral', 'tropical'] },
  { id: 'lemon', name: 'Lemon', category: 'fruit', color: '#F4D35E', cost: 15, unit: 'half, squeezed', temps: ['hot', 'cold', 'room'], families: ['citrus'] },
  { id: 'orange', name: 'Orange', category: 'fruit', color: '#F2A65A', cost: 25, unit: 'half, squeezed', temps: ['cold', 'room'], families: ['citrus', 'fruity'] },
  { id: 'strawberry', name: 'Strawberry', category: 'fruit', color: '#E87A86', cost: 60, unit: '4 berries', temps: ['cold', 'room'], families: ['fruity'] },
  { id: 'mango', name: 'Mango', category: 'fruit', color: '#F5B841', cost: 60, unit: '60 g', temps: ['cold'], families: ['tropical', 'fruity'] },
  { id: 'mint', name: 'Mint', category: 'finish', color: '#9CC9A4', cost: 10, unit: '6 leaves', temps: ['hot', 'cold', 'room'], families: ['herbal', 'citrus'] },
  { id: 'ice', name: 'Ice', category: 'finish', color: '#DCEBF0', cost: 5, unit: 'a glass', temps: ['cold'], families: [] },
  { id: 'hazelnut', name: 'Hazelnut', category: 'sweet', color: '#B98559', cost: 40, unit: '15 ml', temps: ['hot', 'cold'], families: ['nutty'], allergens: ['nuts'] },
];

export const MOODS = ['calm', 'nostalgic', 'energetic', 'tired', 'romantic', 'cozy', 'playful', 'stressed'];
export const FLAVOURS = ['chocolate', 'citrus', 'floral', 'nutty', 'earthy', 'fruity', 'spicy', 'herbal', 'caramel', 'tropical'];
export const DIETS = [
  ['vegan', 'vegan'], ['dairy', 'dairy-free'], ['nuts', 'nut-free'], ['caffeine', 'caffeine-free'], ['sugar', 'sugar-free'],
];
export const EXAMPLES = ['rainy mornings', 'late night drive', 'lazy sunday', 'sweet but not childish', 'first day of summer', 'missing home'];
