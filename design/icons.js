/*
 * Ode icons and ingredient drawings. One style throughout: a soft line drawing with a
 * slightly offset wash of colour behind it, like a hand-printed riso. No stock emojis.
 */
(function (root) {
  'use strict';

  const HONEY = '#F5E3C0', CHERRY = '#EDD5D7', MOSS = '#E2E2CC', SKY = '#DCE9EE';

  // UI icons on a 24 grid: [wash colour, wash shape, line paths]
  const ICONS = {
    home: [HONEY, '<circle cx="15" cy="14" r="5.5"/>', '<path d="M4 11.2 12 4.8l8 6.4V19a1 1 0 0 1-1 1h-4.4v-5.2H9.4V20H5a1 1 0 0 1-1-1z"/>'],
    create: [CHERRY, '<circle cx="9.5" cy="14.5" r="5.5"/>', '<path d="M5 19.5c1.8-.4 4-2.3 6.6-5l6.2-6.6a1.6 1.6 0 0 0-2.3-2.3L9 11.8c-2.7 2.6-4.6 4.8-5 6.6z"/><path d="M14.2 7.1l2.6 2.6"/><path d="M18.5 15.5v3.6M16.7 17.3h3.6"/>'],
    history: [MOSS, '<circle cx="14.5" cy="9.5" r="5.5"/>', '<circle cx="12" cy="12.5" r="7.5"/><path d="M12 8.6v4.1l2.8 1.8"/>'],
    profile: [CHERRY, '<circle cx="9" cy="15.5" r="5.5"/>', '<circle cx="12" cy="8.6" r="3.4"/><path d="M5.4 19.6c1.1-3.2 3.7-4.9 6.6-4.9s5.5 1.7 6.6 4.9"/>'],
    hot: [CHERRY, '<circle cx="12.5" cy="15" r="5.5"/>', '<path d="M5 10.2h11v3.6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 11.2h1.3a2 2 0 0 1 0 4H16"/><path d="M9 3.8c-.9 1.1.9 1.9 0 3.3M12.4 3.8c-.9 1.1.9 1.9 0 3.3"/>'],
    cold: [SKY, '<circle cx="13" cy="14" r="5.5"/>', '<path d="M6.8 5h10.4l-1.5 13.3a2 2 0 0 1-2 1.7h-3.4a2 2 0 0 1-2-1.7z"/><path d="M9.6 10.6l2.4-.9.9 2.4-2.4.9zM12.6 13.7l2.1-.5.5 2.1-2.1.5z"/>'],
    room: [HONEY, '<circle cx="12" cy="13" r="5.5"/>', '<path d="M4 16.5h16"/><path d="M7.2 16.5a4.8 4.8 0 0 1 9.6 0"/><path d="M12 6.2v2M6.6 8.6l1.3 1.3M17.4 8.6l-1.3 1.3"/>'],
    sweet: [CHERRY, '<circle cx="10.5" cy="14" r="5.5"/>', '<path d="M12 4.2l6.8 3.9v7.8L12 19.8l-6.8-3.9V8.1z"/><path d="M5.2 8.1L12 12l6.8-3.9M12 12v7.8"/>'],
    heart: [CHERRY, '<circle cx="13" cy="13" r="5.5"/>', '<path d="M12 19.2s-7-4.3-7-9.1a3.8 3.8 0 0 1 7-2.1 3.8 3.8 0 0 1 7 2.1c0 4.8-7 9.1-7 9.1z"/>'],
    share: [HONEY, '<circle cx="12" cy="15" r="5.5"/>', '<path d="M12 4.2v10.6M8.2 8l3.8-3.8L15.8 8"/><path d="M6 12.6V18a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5.4"/>'],
    star: [HONEY, '<circle cx="13" cy="13.5" r="5.5"/>', '<path d="M12 4.6l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z"/>'],
    order: [MOSS, '<circle cx="14" cy="14" r="5.5"/>', '<path d="M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6z"/><path d="M13.5 13.5h2.4v2.4h-2.4zM17.1 17.1h2.4v2.4h-2.4zM13.5 19.5h2M19.5 13.5v2"/>'],
    sparkle: [HONEY, '<circle cx="12" cy="12.5" r="5.5"/>', '<path d="M12 4c.6 4.2 2 6.6 6 8-4 1.4-5.4 3.8-6 8-.6-4.2-2-6.6-6-8 4-1.4 5.4-3.8 6-8z"/>'],
    back: [MOSS, '<circle cx="13" cy="12.5" r="5"/>', '<path d="M14.5 6.5L9 12l5.5 5.5"/>'],
  };

  function icon(name, { size = 24, color = '#3A3530', wash = true } = {}) {
    const [w, shape, lines] = ICONS[name];
    const washG = wash ? `<g fill="${w}" transform="translate(0.8 0.8)">${shape}</g>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${washG}<g fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${lines}</g></svg>`;
  }

  // Ingredient drawings on a 48 grid: [wash colour, wash shape, line paths]
  const INGREDIENTS = {
    lychee: ['#F4CDD2', '<circle cx="25" cy="27" r="14"/>', '<path d="M24 12.5c3 0 4.4 1.7 6.6 1.5 2.4-.2 3.4 1.6 4.8 3.2 1.6 1.8 3.4 2.6 3.2 5.6-.2 2.4.9 3.6.4 6-.5 2.6-2.2 3.4-3.2 5.6-1.2 2.6-3.4 3.2-5.8 4-2.4.8-3.6 2.2-6.4 1.8-2.6-.4-3.8-1.6-6-2.6-2.4-1.1-3.6-2.8-4.6-5.2-1-2.4-2.6-3.6-2.2-6.4.4-2.6 1.4-3.6 2.4-5.8 1-2.4 2.6-3.8 5-4.8 1.6-.7 2.6-2.9 5.8-2.9z"/><path d="M18 24l1.6 1.4M24 20.5l.6 2M29.5 24.5l1.8-.6M21.5 30l1.6.8M28 31.5l.4 1.8M33 29l1.6.6"/><path d="M24 12.5c.4-2.6 1.6-4.4 3.6-5.6"/><path d="M27.6 6.9c2.6-.6 5.4.2 6.6 2.2-2.6 1-5.2.6-6.6-2.2z"/>'],
    lemon: ['#F7E39A', '<ellipse cx="25" cy="26" rx="15" ry="11" transform="rotate(-25 25 26)"/>', '<path d="M8.5 31.5c-1.6-1.6-1.4-3.4.4-4.4 1-6.8 6.4-12.6 13.6-14 4.4-.9 8.6.2 11.8 2.4 1.6-1.4 3.6-1.2 4.4.6.6 1.4 0 2.6-1.2 3.4 1.4 6.8-2.4 13.8-9.4 16.4-5.8 2.2-12 1-16.2-2.6-1.4.8-2.8.6-3.4-1.8z"/><path d="M17 22.5c1.6-2.6 4.2-4.4 7.4-4.8"/>'],
    mint: ['#C6E0C8', '<ellipse cx="24" cy="25" rx="13" ry="15"/>', '<path d="M24 41V20"/><path d="M24 30c-7.2.2-12.4-4.6-12.6-12.2 7.4-.2 12.4 4.2 12.6 12.2z"/><path d="M24 25.5c6.4.4 11.6-3.6 12.4-10.6-6.8-.6-11.8 3.4-12.4 10.6z"/><path d="M15.5 21.5l5 4.6M32.2 18.6l-4.6 3.8"/>'],
    cinnamon: ['#E9C3A2', '<rect x="9" y="18" width="30" height="13" rx="6" transform="rotate(-35 24 24.5)"/>', '<g transform="rotate(-35 24 24)"><rect x="8" y="16.5" width="32" height="6" rx="3"/><rect x="8" y="25.5" width="32" height="6" rx="3"/><path d="M12 19.5h22M12 28.5h22" stroke-dasharray="3 2.4"/><path d="M38 19.5a1.6 1.6 0 1 1-1.6-1.6M38 28.5a1.6 1.6 0 1 1-1.6-1.6"/></g>'],
    cocoa: ['#D8BBA9', '<rect x="12" y="12" width="24" height="24" rx="5"/>', '<path d="M12 15a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3z"/><path d="M12 24h24M20 12v24M28 12v24"/><path d="M15 15.5h2M23 15.5h2M31 15.5h2"/>'],
    rose: ['#F0C7CF', '<circle cx="24" cy="22" r="13"/>', '<path d="M24 34v8M24 38c-3-.4-5.2-2-6-4.6 3 0 5.2 1.6 6 4.6z"/><path d="M24 34c-6.6 0-11-4.6-11-11.2 0-1.6.3-3 .9-4.2 2.4 1.6 4.4 1.8 5.8.6.8-3 2.6-5.2 4.3-6.2 1.7 1 3.5 3.2 4.3 6.2 1.4 1.2 3.4 1 5.8-.6.6 1.2.9 2.6.9 4.2C35 29.4 30.6 34 24 34z"/><path d="M24 26.8c-2.4 0-4-1.6-4-3.8 0-2 1.6-3.6 3.8-3.6 1.6 0 2.6 1 2.6 2.4 0 1.2-.9 2-2 2"/>'],
    coffee: ['#D9BFA6', '<ellipse cx="24" cy="24" rx="12" ry="15"/>', '<ellipse cx="24" cy="24" rx="10.5" ry="14" transform="rotate(20 24 24)"/><path d="M28.6 11.4c-4.2 3.6-1.4 8.4-4.6 12.6-3.2 4.2-.2 8.6-4.6 12.6"/>'],
    milk: ['#E6EEF2', '<path d="M24 9c6 8.4 11 13.8 11 20a11 11 0 0 1-22 0c0-6.2 5-11.6 11-20z"/>', '<path d="M24 8c6 8.4 11 13.8 11 20a11 11 0 0 1-22 0c0-6.2 5-11.6 11-20z"/><path d="M18.2 29.6c.2 2.6 1.8 4.6 4.2 5.2"/>'],
    ice: ['#DCEBF0', '<rect x="12" y="13" width="22" height="22" rx="5" transform="rotate(8 23 24)"/>', '<path d="M14 14.5l15.4-2.6a3 3 0 0 1 3.4 2.4l2.6 15.4a3 3 0 0 1-2.4 3.4L17.6 35.7a3 3 0 0 1-3.4-2.4L11.6 17.9a3 3 0 0 1 2.4-3.4z"/><path d="M18 19.2l4-.6"/>'],
    honey: ['#F4DCA0', '<rect x="13" y="19" width="22" height="20" rx="7"/>', '<path d="M15 21h18v11a6 6 0 0 1-6 6h-6a6 6 0 0 1-6-6z"/><path d="M14 17.5h20v3.5H14z"/><path d="M20 21v4.2a1.5 1.5 0 0 0 3 0v-2.2"/><path d="M29.5 17.5l5-9"/><ellipse cx="35.6" cy="7.2" rx="2.4" ry="1.8" transform="rotate(-30 35.6 7.2)"/><path d="M19 31h10"/>'],
    cardamom: ['#D7DDB4', '<ellipse cx="24" cy="25" rx="10" ry="15"/>', '<path d="M24 9c5.6 4 8 9.6 7.4 16-.6 6.2-3.4 11-7.4 14-4-3-6.8-7.8-7.4-14C16 18.6 18.4 13 24 9z"/><path d="M24 12v24M20.4 16c1.4 6 1.4 12.4 0 18M27.6 16c-1.4 6-1.4 12.4 0 18"/>'],
    orange: ['#F7CC9A', '<circle cx="24" cy="25" r="14"/>', '<circle cx="24" cy="25" r="12.5"/><circle cx="24" cy="25" r="9.5"/><path d="M24 15.5v19M14.5 25h19M17.3 18.3l13.4 13.4M30.7 18.3L17.3 31.7"/>'],
  };

  function ingredient(name, { size = 48, color = '#3A3530' } = {}) {
    const d = INGREDIENTS[name];
    if (!d) return '';
    const [w, shape, lines] = d;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true"><g fill="${w}" transform="translate(1.6 1.6)">${shape}</g><g fill="none" stroke="${color}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${lines}</g></svg>`;
  }

  const api = { icon, ingredient, ICONS: Object.keys(ICONS), INGREDIENTS: Object.keys(INGREDIENTS) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OdeIcons = api;
})(typeof self !== 'undefined' ? self : this);
