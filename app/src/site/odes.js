// Drinks from the demo café, used across the website.
import { pantry } from '../data/demoCafe';

export const byId = Object.fromEntries(pantry.map((i) => [i.id, i]));

const ode = (id, name, lines, mood, temperature, ids, price) => ({
  id, name, lines, price, mood: { primary: mood }, recipe: { temperature, ingredients: ids.map((x) => byId[x]) },
});

export const HERO = ode('hero', 'Rain on Tin', ['rain on the window,', 'nowhere you’d rather be.'], 'cozy', 'hot', ['black_tea', 'cinnamon', 'cardamom', 'milk'], 490);

export const WALL = [
  ode('w1', 'Soft Harbour', ['the kind of quiet', 'you can hear yourself in.'], 'calm', 'hot', ['hibiscus', 'lavender', 'rose', 'mint'], 490),
  ode('w2', 'Golden Hour Spritz', ['bubbles, gossip,', 'the sun still up.'], 'playful', 'cold', ['soda', 'mango', 'orange', 'ice'], 540),
  ode('w3', 'Nani’s Window', ['it tastes like a kitchen', 'you can’t go back to.'], 'nostalgic', 'hot', ['black_tea', 'cardamom', 'honey', 'milk'], 490),
  ode('w4', 'First Light', ['the first good idea', 'of the day, in a glass.'], 'energetic', 'cold', ['cold_brew', 'orange', 'ice'], 590),
  ode('w5', 'Slow Dance', ['sweet at first,', 'and then it stays.'], 'romantic', 'cold', ['strawberry', 'rose', 'milk', 'ice'], 540),
  ode('w6', 'Fog Over Monday', ['for the hour', 'when everything is too much.'], 'tired', 'hot', ['espresso', 'cocoa', 'caramel', 'oat_milk'], 790),
  ode('w7', 'Open Window', ['one sip,', 'and the room gets bigger.'], 'stressed', 'hot', ['matcha', 'honey', 'oat_milk'], 740),
  ode('w8', 'Paper Kites', ['light, fleeting,', 'like the last good day of july.'], 'nostalgic', 'cold', ['lychee', 'lemon', 'soda', 'mint'], 490),
  ode('w9', 'Blanket Fort', ['bitter at the edges,', 'soft in the middle.'], 'cozy', 'hot', ['espresso', 'cinnamon', 'vanilla', 'milk'], 590),
  ode('w10', 'Live Wire', ['loud colours,', 'clear head.'], 'energetic', 'cold', ['espresso', 'orange', 'soda', 'ice'], 590),
  ode('w11', 'Rose Hour', ['the pause', 'before you say it.'], 'romantic', 'hot', ['rose', 'vanilla', 'milk'], 490),
  ode('w12', 'Exhale', ['put it down for a minute.', 'it will still be there.'], 'stressed', 'hot', ['hibiscus', 'honey', 'ginger', 'lemon'], 490),
  ode('w13', 'Kite Season', ['a little reckless,', 'entirely worth it.'], 'playful', 'cold', ['strawberry', 'lychee', 'soda', 'ice'], 590),
  ode('w14', 'Linen Morning', ['nothing to fix,', 'nowhere to be.'], 'calm', 'hot', ['matcha', 'vanilla', 'oat_milk'], 740),
  ode('w15', 'Heavy Lids', ['the kind of warmth that arrives', 'before you knew you needed it.'], 'tired', 'hot', ['espresso', 'hazelnut', 'cocoa', 'milk'], 640),
  ode('w16', 'Sepia', ['old songs,', 'warm hands.'], 'nostalgic', 'hot', ['black_tea', 'ginger', 'honey', 'milk'], 490),
  ode('w17', 'Gold Rush', ['all the lights', 'turned on at once.'], 'energetic', 'cold', ['cold_brew', 'caramel', 'milk', 'ice'], 640),
  ode('w18', 'Quiet Hour', ['the kind of quiet', 'that knows your name.'], 'calm', 'hot', ['black_tea', 'lavender', 'honey', 'milk'], 490),
  ode('w19', 'Fizz & Gossip', ['bubbles, secrets,', 'one more round.'], 'playful', 'cold', ['soda', 'strawberry', 'lemon', 'mint'], 540),
  ode('w20', 'Ember', ['the last warm coal', 'of a long night.'], 'cozy', 'hot', ['espresso', 'cocoa', 'cinnamon', 'oat_milk'], 740),
  ode('w21', 'Second Glance', ['you were not looking,', 'and then you were.'], 'romantic', 'cold', ['lychee', 'rose', 'soda', 'ice'], 540),
  ode('w22', 'Unclench', ['shoulders down,', 'the day can wait.'], 'stressed', 'hot', ['hibiscus', 'ginger', 'honey', 'lemon'], 490),
  ode('w23', 'Soft Landing', ['wherever you were going,', 'you are here now.'], 'tired', 'hot', ['matcha', 'vanilla', 'milk'], 640),
  ode('w24', 'Kite Tail', ['summer, still', 'pretending to be over.'], 'playful', 'cold', ['mango', 'orange', 'coconut_milk', 'ice'], 590),
];

export const MOOD_TINT = {
  calm: '#E9E4F2', nostalgic: '#F3E3CC', energetic: '#F7E7B8', tired: '#E8DCCF',
  romantic: '#F4D9DD', cozy: '#EFD9C4', playful: '#F8E0C8', stressed: '#DDE9E1',
};
