/*
 * Ode flavour portrait: a soft, glowing artwork made from a drink's ingredient colours and mood.
 * Same drink, same seed: same picture. Returns an SVG string, so it works in the page,
 * in share cards and on the server.
 */
(function (root) {
  'use strict';

  // Small seeded random generator, so a drink always draws the same way.
  function rng(seed) {
    let h = 2166136261;
    for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return () => {
      h += 0x6d2b79f5;
      let t = Math.imul(h ^ (h >>> 15), 1 | h);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const toHex = (c) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));

  // How each mood shapes the picture: spread of the glow, ring count, warmth.
  const MOODS = {
    calm: { spread: 0.9, rings: 3, warm: 0.0 },
    nostalgic: { spread: 0.75, rings: 4, warm: 0.25 },
    energetic: { spread: 0.55, rings: 5, warm: 0.1 },
    tired: { spread: 1.0, rings: 2, warm: 0.2 },
    romantic: { spread: 0.8, rings: 3, warm: 0.15 },
    cozy: { spread: 0.7, rings: 3, warm: 0.35 },
    playful: { spread: 0.6, rings: 5, warm: 0.05 },
    stressed: { spread: 0.95, rings: 2, warm: 0.1 },
  };
  const CREAM = '#FAF6F0';

  function portrait({ colors, mood = 'calm', seed = 'ode', width = 400, height = 500, id = 'p' } = {}) {
    const r = rng(seed + mood + colors.join(''));
    const m = MOODS[mood] || MOODS.calm;
    const cols = colors.length ? colors : ['#D4A55A', '#C4858C'];
    const W = width, H = height, cx = W / 2, cy = H * 0.47;
    const R = W * 0.36; // the cup, seen from above
    const u = id + Math.floor(r() * 1e6).toString(36); // unique ids when several portraits share a page
    const bg1 = mix(cols[0], CREAM, 0.86), bg2 = mix(cols[cols.length - 1], CREAM, 0.78);
    const warm = mix('#D4A55A', CREAM, 0.9 - m.warm * 0.4);

    // The drink: saturated colour fields swirling inside the cup
    let blobs = `<rect x="${cx - R}" y="${cy - R}" width="${2 * R}" height="${2 * R}" fill="${mix(cols[0], CREAM, 0.35)}"/>`;
    const n = 5 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const c = cols[(i + 1) % cols.length];
      const ang = r() * Math.PI * 2;
      const dist = (0.15 + r() * 0.55) * R * m.spread;
      const rad = (0.35 + r() * 0.35) * R;
      blobs += `<ellipse cx="${(cx + Math.cos(ang) * dist).toFixed(1)}" cy="${(cy + Math.sin(ang) * dist).toFixed(1)}" rx="${rad.toFixed(1)}" ry="${(rad * (0.7 + r() * 0.5)).toFixed(1)}" transform="rotate(${Math.floor(r() * 180)} ${cx} ${cy})" fill="${mix(c, '#FFFFFF', r() * 0.18)}" opacity="${(0.75 + r() * 0.25).toFixed(2)}"/>`;
    }
    // a pale crema swirl near the centre
    blobs += `<ellipse cx="${(cx + (r() - 0.5) * R * 0.3).toFixed(1)}" cy="${(cy + (r() - 0.5) * R * 0.3).toFixed(1)}" rx="${(R * 0.32).toFixed(1)}" ry="${(R * 0.22).toFixed(1)}" fill="#FFF8EE" opacity="0.55"/>`;

    // Ripples on the surface
    let rings = '';
    const rx0 = cx + (r() - 0.5) * R * 0.5, ry0 = cy + (r() - 0.5) * R * 0.5; // where the drop landed
    for (let i = 0; i < m.rings; i++) {
      const rr = R * (0.18 + i * (0.5 / m.rings)) * (0.92 + r() * 0.16);
      rings += `<circle cx="${rx0.toFixed(1)}" cy="${ry0.toFixed(1)}" r="${rr.toFixed(1)}" fill="none" stroke="#FFFFFF" stroke-width="${(0.7 + r() * 0.6).toFixed(2)}" opacity="${(0.3 - i * 0.045).toFixed(2)}"/>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Flavour portrait">
  <defs>
    <linearGradient id="${u}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="0.55" stop-color="${warm}"/><stop offset="1" stop-color="${bg2}"/></linearGradient>
    <clipPath id="${u}cup"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>
    <filter id="${u}swirl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${(R * 0.16).toFixed(1)}"/></filter>
    <filter id="${u}halo" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${(R * 0.3).toFixed(1)}"/></filter>
    <filter id="${u}shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${(R * 0.09).toFixed(1)}"/></filter>
    <radialGradient id="${u}shine" cx="0.32" cy="0.28" r="0.75"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.45"/><stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
    <filter id="${u}grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${Math.floor(r() * 99)}"/><feColorMatrix values="0 0 0 0 0.23  0 0 0 0 0.21  0 0 0 0 0.19  0 0 0 0.11 0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#${u}bg)"/>
  <circle cx="${cx}" cy="${cy}" r="${(R * 1.25).toFixed(1)}" fill="${mix(cols[0], CREAM, 0.2)}" opacity="0.55" filter="url(#${u}halo)"/>
  <ellipse cx="${cx + R * 0.06}" cy="${cy + R * 0.1}" rx="${R * 1.02}" ry="${R * 1.02}" fill="#3A3530" opacity="0.13" filter="url(#${u}shadow)"/>
  <circle cx="${cx}" cy="${cy}" r="${(R * 1.07).toFixed(1)}" fill="#FFFDF9"/>
  <g clip-path="url(#${u}cup)"><g filter="url(#${u}swirl)">${blobs}</g>${rings}<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${u}shine)"/></g>
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#3A3530" stroke-opacity="0.08" stroke-width="1"/>
  <rect width="${W}" height="${H}" filter="url(#${u}grain)"/>
</svg>`;
  }

  // Colours for common ingredients; cafés can set their own.
  const INGREDIENT_COLORS = {
    lychee: '#F2C6CC', lemon: '#F4D35E', mint: '#9CC9A4', soda: '#CFE3EC', ice: '#DCEBF0',
    espresso: '#6B4A3A', cocoa: '#7A4E3A', milk: '#F3EADB', oat_milk: '#E9DCC3', caramel: '#D49A55',
    cinnamon: '#B7703F', cardamom: '#A9B57A', rose: '#E3A3B0', lavender: '#B8A6D9', honey: '#E3B04B',
    orange: '#F2A65A', strawberry: '#E87A86', matcha: '#9DB86B', ginger: '#E2B36A', vanilla: '#F1E3C2',
    hibiscus: '#C95B78', mango: '#F5B841', coconut: '#F4EEE2', blueberry: '#7D86C7', tea: '#C99A5B',
  };

  const api = { portrait, INGREDIENT_COLORS, mix };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OdePortrait = api;
})(typeof self !== 'undefined' ? self : this);
