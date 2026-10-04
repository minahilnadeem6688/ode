/*
 * ode marks: the quotation-drop logo, the fingerprint and the wax seal. All return SVG strings.
 */
const ROAST = '#3A3530', HONEY = '#D4A55A', CHERRY = '#C4858C', CREAM = '#FAF6F0';

// Fingerprint ridges: nested egg-shaped loops around an off-centre core, each with a break,
// clipped to a circle so the outer ones become open arcs like a real print.
function printPaths({ cx = 50, cy = 50, R = 44, loops = 8, seed = 7, sw = 2.2 } = {}) {
  let h = seed;
  const rnd = () => { h = (h * 9301 + 49297) % 233280; return h / 233280; };
  let d = '';
  for (let k = 0; k < loops; k++) {
    const r = 2.6 + k * ((R * 0.86) / loops);
    const ox = cx, oy = cy + 2 - k * 0.15; // the core sits a little low, ridges stay evenly spaced
    const gap = -Math.PI / 2 + (rnd() - 0.5) * 1.6 + (k % 2 ? 0.9 : -0.6);
    const gapW = k < 2 ? 0.0 : 0.32 + rnd() * 0.22;
    const pts = [];
    for (let i = 0; i <= 96; i++) {
      const t = (i / 96) * Math.PI * 2;
      let dist = Math.abs(((t - gap + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (gapW && dist < gapW) { if (pts.length) { d += 'M' + pts.join('L'); pts.length = 0; } continue; }
      const wob = 1 + Math.sin(t * 3 + k) * 0.025;
      const x = ox + Math.cos(t) * r * 0.9 * wob;
      const y = oy + Math.sin(t) * r * 1.02 * wob - r * 0.14 * Math.max(0, -Math.sin(t)); // taller arch on top, no jump at the sides
      if ((x - cx) ** 2 + (y - cy) ** 2 > (R - sw) ** 2) { if (pts.length > 1) d += 'M' + pts.join('L'); pts.length = 0; continue; }
      pts.push(x.toFixed(2) + ',' + y.toFixed(2));
    }
    if (pts.length > 1) d += 'M' + pts.join('L');
  }
  return d;
}

function printMark({ size = 100, ink = ROAST, disc = null, ring = true, id = 'pm' } = {}) {
  const grad = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${HONEY}"/><stop offset="1" stop-color="${CHERRY}"/></linearGradient></defs>`;
  const bg = disc ? `<circle cx="50" cy="50" r="48" fill="${disc === 'glow' ? `url(#${id})` : disc}"/>` : '';
  const rim = ring ? `<circle cx="50" cy="50" r="46.5" fill="none" stroke="${ink}" stroke-width="2.4"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">${grad}${bg}${rim}<path d="${printPaths({ R: ring ? 43 : 47 })}" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// One drop of the quotation mark: a round body with a tail flicking up to the right.
const DROP = 'M12,62 C12,43 23,29 44,21 C35,29 31,37 30.5,44 A18,18 0 1 1 12,62 Z';
function quoteMark({ size = 100, a = HONEY, b = CHERRY } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}"><path d="${DROP}" fill="${a}" transform="translate(-2 4)"/><path d="${DROP}" fill="${b}" transform="translate(42 4)"/></svg>`;
}

// Wax seal: a wobbly round blob with a pressed rim and the print inside.
function sealMark({ size = 100, wax = CHERRY, id = 'sm' } = {}) {
  let edge = '';
  for (let i = 0; i <= 40; i++) {
    const t = (i / 40) * Math.PI * 2;
    const r = 46 + Math.sin(t * 7) * 1.6 + Math.sin(t * 3 + 1) * 1.2;
    edge += (i ? 'L' : 'M') + (50 + Math.cos(t) * r).toFixed(2) + ',' + (50 + Math.sin(t) * r).toFixed(2);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
    <defs><radialGradient id="${id}" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#E7A9AF"/><stop offset=".6" stop-color="${wax}"/><stop offset="1" stop-color="#A9636B"/></radialGradient></defs>
    <path d="${edge}Z" fill="url(#${id})"/>
    <circle cx="50" cy="50" r="34" fill="none" stroke="#9E5C64" stroke-width="2.4" opacity=".55"/>
    <circle cx="50.8" cy="50.8" r="34" fill="none" stroke="#F1C9CD" stroke-width="1.2" opacity=".55"/>
    <g transform="translate(23 23) scale(.54)"><path d="${printPaths({ R: 47, loops: 8 })}" fill="none" stroke="#8E4E56" stroke-width="3" stroke-linecap="round" opacity=".8"/><path d="${printPaths({ R: 47, loops: 8 })}" fill="none" stroke="#F3D3D6" stroke-width="1.3" stroke-linecap="round" transform="translate(-1 -1)" opacity=".7"/></g>
  </svg>`;
}

export { printMark, quoteMark, sealMark, printPaths, DROP };
