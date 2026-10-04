/*
 * ode painted ingredients: rich, lit illustrations (soft gradients, translucency, highlights,
 * contact shadows) instead of line icons. Each returns an SVG string on a 200 grid.
 */
(function (root) {
  'use strict';

  const shadow = (cx, cy, rx, id) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.16}" fill="#3A3530" opacity=".16" filter="url(#${id}s)"/>`;
  const defsShadow = (id) => `<filter id="${id}s" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="5"/></filter>`;

  function lychee(id = 'ly') {
    // bumpy shell: scales laid in rings
    let scales = '';
    for (let ring = 0; ring < 6; ring++) {
      const n = 6 + ring * 4, rr = ring * 9.5;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ring * 0.4;
        const x = 82 + Math.cos(a) * rr, y = 96 + Math.sin(a) * rr * 1.05;
        if ((x - 82) ** 2 + ((y - 96) / 1.05) ** 2 > 52 ** 2) continue;
        scales += `<path d="M${x - 5},${y + 1} q5,-7 10,0 q-5,5 -10,0z" fill="url(#${id}sc)" opacity="${0.55 + (ring % 2) * 0.2}"/><circle cx="${x}" cy="${y - 2.4}" r="1" fill="#FFE7EA" opacity=".7"/>`;
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs>${defsShadow(id)}
      <radialGradient id="${id}sh" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#F7B9C1"/><stop offset=".55" stop-color="#D9667A"/><stop offset="1" stop-color="#9C3448"/></radialGradient>
      <linearGradient id="${id}sc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9C9CF"/><stop offset="1" stop-color="#B9465B"/></linearGradient>
      <radialGradient id="${id}fl" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#F5F1EC"/><stop offset="1" stop-color="#DCD3CA"/></radialGradient>
      <radialGradient id="${id}gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
      <clipPath id="${id}c"><ellipse cx="82" cy="96" rx="52" ry="55"/></clipPath></defs>
      ${shadow(100, 168, 74, id)}
      <ellipse cx="82" cy="96" rx="52" ry="55" fill="url(#${id}sh)"/>
      <g clip-path="url(#${id}c)">${scales}</g>
      <path d="M80 42c-2-10 2-18 10-22" fill="none" stroke="#7A5A3A" stroke-width="3" stroke-linecap="round"/>
      <path d="M90 20c12-6 26-2 32 8-12 6-25 3-32-8z" fill="#8DB580"/><path d="M90 20c10 2 20 5 32 8" fill="none" stroke="#5E8A57" stroke-width="1.2"/>
      <!-- peeled half, translucent flesh -->
      <ellipse cx="138" cy="132" rx="38" ry="34" fill="#C24E62"/>
      <ellipse cx="138" cy="129" rx="34" ry="30" fill="url(#${id}fl)"/>
      <ellipse cx="138" cy="129" rx="34" ry="30" fill="#EADFF0" opacity=".25"/>
      <path d="M116 126c6-12 18-17 30-14" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".85"/>
      <ellipse cx="142" cy="134" rx="9" ry="7" fill="#6B4430" opacity=".9"/><ellipse cx="140" cy="132" rx="3" ry="2" fill="#B9896A"/>
      <ellipse cx="62" cy="72" rx="16" ry="11" fill="url(#${id}gl)" transform="rotate(-30 62 72)" opacity=".75"/>
    </svg>`;
  }

  function lemonSlice(id = 'le') {
    let seg = '';
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 + 0.06, a1 = ((i + 1) / n) * Math.PI * 2 - 0.06;
      const r = 54, cx = 100, cy = 96;
      seg += `<path d="M${cx + Math.cos(a0) * 7},${cy + Math.sin(a0) * 7} L${cx + Math.cos(a0) * r},${cy + Math.sin(a0) * r} A${r},${r} 0 0 1 ${cx + Math.cos(a1) * r},${cy + Math.sin(a1) * r} L${cx + Math.cos(a1) * 7},${cy + Math.sin(a1) * 7}Z" fill="url(#${id}pu)"/>`;
      // juice sacs
      for (let k = 0; k < 4; k++) {
        const am = (a0 + a1) / 2 + (k % 2 ? 0.08 : -0.08), rr = 18 + k * 9;
        seg += `<ellipse cx="${cx + Math.cos(am) * rr}" cy="${cy + Math.sin(am) * rr}" rx="${2 + k * 0.6}" ry="${1.2 + k * 0.3}" transform="rotate(${(am * 180) / Math.PI} ${cx + Math.cos(am) * rr} ${cy + Math.sin(am) * rr})" fill="#FFFBE0" opacity=".75"/>`;
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs>${defsShadow(id)}
      <radialGradient id="${id}pu" cx=".5" cy=".5" r=".55"><stop offset="0" stop-color="#FFF6C8"/><stop offset=".6" stop-color="#F9DE6A"/><stop offset="1" stop-color="#EEC23F"/></radialGradient>
      <linearGradient id="${id}ri" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F8DA4E"/><stop offset="1" stop-color="#D9A51F"/></linearGradient></defs>
      ${shadow(100, 166, 70, id)}
      <circle cx="100" cy="100" r="66" fill="#C99A1C"/>
      <circle cx="100" cy="96" r="66" fill="url(#${id}ri)"/>
      <circle cx="100" cy="96" r="59" fill="#FFF7DE"/>
      ${seg}
      <circle cx="100" cy="96" r="7" fill="#FFF7DE"/>
      <path d="M58 70c10-16 26-24 44-25" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".7"/>
      <circle cx="132" cy="122" r="3" fill="#FFFFFF" opacity=".9"/><circle cx="72" cy="118" r="2" fill="#FFFFFF" opacity=".8"/>
    </svg>`;
  }

  function mintSprig(id = 'mi') {
    const leaf = (x, y, rot, s, g) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
      <path d="M0 0C14-18 38-22 58-12 44 6 20 12 0 0z" fill="url(#${id}${g})"/>
      <path d="M0 0C18-6 36-10 58-12" fill="none" stroke="#3F7A4F" stroke-width="1.6" opacity=".6"/>
      ${[12, 24, 36, 46].map((v) => `<path d="M${v} ${-v * 0.2}l7 -9M${v} ${-v * 0.2}l5 7" stroke="#3F7A4F" stroke-width="1" opacity=".45" fill="none"/>`).join('')}
      <path d="M8-7c10-8 22-11 34-9" stroke="#E8F7E2" stroke-width="2" opacity=".55" fill="none" stroke-linecap="round"/></g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs>${defsShadow(id)}
      <linearGradient id="${id}a" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5E9C68"/><stop offset=".6" stop-color="#8CC58E"/><stop offset="1" stop-color="#B9DFAE"/></linearGradient>
      <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4B8456"/><stop offset="1" stop-color="#9ACF97"/></linearGradient></defs>
      ${shadow(104, 172, 56, id)}
      <path d="M104 170C100 130 98 90 102 40" stroke="#6E9A5A" stroke-width="4" fill="none" stroke-linecap="round"/>
      ${leaf(102, 150, -150, 1.05, 'b')}${leaf(103, 140, -30, 1.0, 'a')}
      ${leaf(101, 112, -160, 0.95, 'a')}${leaf(102, 104, -20, 0.92, 'b')}
      ${leaf(101, 76, -145, 0.82, 'b')}${leaf(102, 70, -38, 0.8, 'a')}
      ${leaf(102, 46, -112, 0.62, 'a')}${leaf(102, 44, -68, 0.6, 'b')}
    </svg>`;
  }

  function coffeeBeans(id = 'cb') {
    const bean = (x, y, rot, s) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><ellipse rx="26" ry="36" fill="url(#${id}b)"/><path d="M-2 -32C10 -14 -12 6 2 32" stroke="#2A1810" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="-10" cy="-14" rx="6" ry="12" fill="#FFFFFF" opacity=".22"/></g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs>${defsShadow(id)}
      <radialGradient id="${id}b" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#9B6A4C"/><stop offset=".55" stop-color="#5C3524"/><stop offset="1" stop-color="#2E1A12"/></radialGradient></defs>
      ${shadow(100, 166, 70, id)}${bean(76, 112, -30, 1.05)}${bean(128, 104, 24, 1)}${bean(102, 64, 80, 0.8)}
    </svg>`;
  }

  const api = { lychee, lemonSlice, mintSprig, coffeeBeans };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OdePainted = api;
})(typeof self !== 'undefined' ? self : this);
