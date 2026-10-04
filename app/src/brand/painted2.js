/*
 * More painted ingredients, same light as painted.js: a soft key light from the top left,
 * a contact shadow underneath, gradients instead of outlines. 200 × 200 grid.
 */
import { lemonSlice } from './painted';

const sh = (id, cx = 100, cy = 170, rx = 64) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.15}" fill="#3A3530" opacity=".15" filter="url(#${id}s)"/>`;
const blur = (id) => `<filter id="${id}s" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="5"/></filter>`;
const svg = (id, defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs>${blur(id)}${defs}</defs>${body}</svg>`;

export function orangeSlice(id = 'or') {
  const map = { '#FFF6C8': '#FFE6C4', '#F9DE6A': '#F8A955', '#EEC23F': '#E9822E', '#F8DA4E': '#F49A3A', '#D9A51F': '#D06A1E', '#C99A1C': '#B65A18', '#FFF7DE': '#FFF0DD', '#FFFBE0': '#FFF3E2' };
  return lemonSlice(id).replace(/#[0-9A-F]{6}/g, (h) => map[h] || h);
}

export function cinnamon(id = 'ci') {
  const stick = (y, rot, s) => `<g transform="translate(100 ${y}) rotate(${rot}) scale(${s})">
    <rect x="-70" y="-11" width="140" height="22" rx="11" fill="url(#${id}b)"/>
    <path d="M-62 -4h124M-62 4h124" stroke="#7A3F1C" stroke-width="1.2" opacity=".35"/>
    <ellipse cx="70" cy="0" rx="7" ry="11" fill="#8E4A22"/><path d="M70 -6a5 5 0 1 1 -4 8" fill="none" stroke="#D99A62" stroke-width="2"/>
    <rect x="-64" y="-9" width="124" height="5" rx="2.5" fill="#FFFFFF" opacity=".22"/></g>`;
  return svg(id, `<linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D08A55"/><stop offset=".5" stop-color="#A9612F"/><stop offset="1" stop-color="#7C401C"/></linearGradient>`,
    `${sh(id)}${stick(122, -18, 1)}${stick(100, -26, 0.92)}`);
}

export function ginger(id = 'gi') {
  return svg(id, `<radialGradient id="${id}g" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#F3D6A2"/><stop offset=".6" stop-color="#D9AE6C"/><stop offset="1" stop-color="#AE7E41"/></radialGradient>`,
    `${sh(id)}<path d="M42 132c-12-14 0-34 18-30 4-16 22-24 34-12 10-14 32-14 40 2 18-4 30 14 22 30 12 8 8 28-8 30-8 14-30 16-42 6-14 10-36 8-44-6-12 2-22-8-20-20z" fill="url(#${id}g)"/>
    <path d="M70 112c8 4 16 2 22-4M118 100c4 8 12 10 20 8M86 140c8-2 14 2 18 8" fill="none" stroke="#9E7038" stroke-width="2" stroke-linecap="round" opacity=".55"/>
    <ellipse cx="72" cy="104" rx="14" ry="6" fill="#FFFFFF" opacity=".35" transform="rotate(-20 72 104)"/>`);
}

export function strawberry(id = 'st') {
  let seeds = '';
  for (let i = 0; i < 26; i++) {
    const a = i * 2.4, r = 8 + (i % 7) * 7;
    const x = 100 + Math.cos(a) * r * 0.9, y = 112 + Math.sin(a) * r * 0.75 + r * 0.35;
    seeds += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="1.6" ry="2.6" fill="#FFE7A8" opacity=".9"/>`;
  }
  return svg(id, `<radialGradient id="${id}r" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#FF9AA0"/><stop offset=".5" stop-color="#E5404F"/><stop offset="1" stop-color="#A41E30"/></radialGradient>`,
    `${sh(id)}<path d="M100 166C70 150 46 122 50 94c3-22 24-30 50-26 26-4 47 4 50 26 4 28-20 56-50 72z" fill="url(#${id}r)"/>${seeds}
    <path d="M100 74c-14-12-34-10-44 0 14 2 24 6 30 12-14 2-24 10-28 20 16-6 30-8 42-6 12-2 26 0 42 6-4-10-14-18-28-20 6-6 16-10 30-12-10-10-30-12-44 0z" fill="#6FA35A"/>
    <path d="M100 74v-20" stroke="#5E8A4A" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="74" cy="104" rx="10" ry="16" fill="#FFFFFF" opacity=".35" transform="rotate(25 74 104)"/>`);
}

export function iceCubes(id = 'ic') {
  const cube = (x, y, s, r) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">
    <path d="M-30 -14l30-16 30 16v34l-30 16-30-16z" fill="url(#${id}c)" opacity=".92"/>
    <path d="M-30 -14l30 16 30-16M0 2v34" fill="none" stroke="#FFFFFF" stroke-width="1.6" opacity=".8"/>
    <path d="M-22 -12l22-11" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".7"/></g>`;
  return svg(id, `<linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4FBFE"/><stop offset=".55" stop-color="#C9E2EC"/><stop offset="1" stop-color="#9CC3D3"/></linearGradient>`,
    `${sh(id, 100, 168, 60)}${cube(74, 124, 1.05, -8)}${cube(128, 120, 0.95, 10)}${cube(102, 80, 0.85, 4)}`);
}

export function milk(id = 'mk') {
  return svg(id, `<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E7EEF2"/><stop offset=".35" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D5DEE3"/></linearGradient>
    <linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F1EADF"/><stop offset=".4" stop-color="#FFFDF8"/><stop offset="1" stop-color="#E6DCCB"/></linearGradient>`,
    `${sh(id, 100, 172, 46)}<path d="M80 26h40v18c0 10 14 18 14 34v76a12 12 0 0 1-12 12H78a12 12 0 0 1-12-12V78c0-16 14-24 14-34z" fill="url(#${id}g)" opacity=".9"/>
    <path d="M70 86h60v68a8 8 0 0 1-8 8H78a8 8 0 0 1-8-8z" fill="url(#${id}m)"/>
    <rect x="78" y="18" width="44" height="12" rx="4" fill="#C4858C"/>
    <path d="M78 96v52" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".8"/>`);
}

export function teaLeaves(id = 'tl') {
  const leaf = (x, y, r, s, g) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 0C10-26 40-34 62-22 50 2 24 12 0 0z" fill="url(#${id}${g})"/><path d="M0 0C20-10 40-18 62-22" stroke="#2F5A35" stroke-width="1.4" fill="none" opacity=".6"/></g>`;
  return svg(id, `<linearGradient id="${id}a" x1="0" x2="1"><stop offset="0" stop-color="#3D7A49"/><stop offset="1" stop-color="#8CC27F"/></linearGradient><linearGradient id="${id}b" x1="0" x2="1"><stop offset="0" stop-color="#2F6239"/><stop offset="1" stop-color="#6FAE6A"/></linearGradient>`,
    `${sh(id)}<path d="M98 168C96 136 98 104 104 70" stroke="#6E8A4A" stroke-width="4" fill="none" stroke-linecap="round"/>
    ${leaf(100, 130, -150, 1.1, 'b')}${leaf(101, 112, -24, 1.05, 'a')}${leaf(103, 84, -110, 0.7, 'a')}
    <path d="M104 70c-6-14-2-28 6-34 6 10 4 24-6 34z" fill="#A9D49A"/>`);
}

export function cardamom(id = 'ca') {
  const pod = (x, y, r, s) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><ellipse rx="20" ry="36" fill="url(#${id}g)"/><path d="M0 -34v68M-9 -30c4 20 4 40 0 60M9 -30c-4 20-4 40 0 60" stroke="#6E7F3E" stroke-width="1.4" fill="none" opacity=".6"/><path d="M0 -36l-3-6h6z" fill="#8C9A55"/><ellipse cx="-7" cy="-12" rx="4" ry="12" fill="#FFFFFF" opacity=".3"/></g>`;
  return svg(id, `<radialGradient id="${id}g" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#D4DEA4"/><stop offset=".6" stop-color="#A3B465"/><stop offset="1" stop-color="#768A3E"/></radialGradient>`,
    `${sh(id)}${pod(76, 112, -35, 1)}${pod(124, 110, 30, 0.95)}${pod(100, 84, 85, 0.8)}`);
}

export function cocoa(id = 'co') {
  const sq = (x, y) => `<rect x="${x}" y="${y}" width="40" height="40" rx="6" fill="url(#${id}g)"/><rect x="${x + 5}" y="${y + 5}" width="30" height="30" rx="4" fill="none" stroke="#3B2117" stroke-width="2" opacity=".5"/><path d="M${x + 6} ${y + 8}h20" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".18"/>`;
  return svg(id, `<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8B5A40"/><stop offset="1" stop-color="#4A2A1C"/></linearGradient>`,
    `${sh(id)}<g transform="rotate(-12 100 110)">${sq(56, 66)}${sq(100, 66)}${sq(56, 110)}${sq(100, 110)}</g>`);
}

export function honey(id = 'ho') {
  return svg(id, `<linearGradient id="${id}h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE29A"/><stop offset=".5" stop-color="#F0B43E"/><stop offset="1" stop-color="#C7861B"/></linearGradient>
    <linearGradient id="${id}w" x1="0" x2="1"><stop offset="0" stop-color="#C99A62"/><stop offset="1" stop-color="#8E6235"/></linearGradient>`,
    `${sh(id)}<rect x="96" y="20" width="10" height="84" rx="5" fill="url(#${id}w)" transform="rotate(-24 100 60)"/>
    <g transform="rotate(-24 100 120)"><ellipse cx="100" cy="112" rx="24" ry="14" fill="url(#${id}h)"/><ellipse cx="100" cy="124" rx="26" ry="14" fill="url(#${id}h)"/><ellipse cx="100" cy="136" rx="22" ry="12" fill="url(#${id}h)"/>
    <path d="M78 116h44M76 128h48" stroke="#B2761A" stroke-width="2" opacity=".5"/></g>
    <path d="M112 150c0 8-4 12-4 18a5 5 0 0 0 10 0c0-6-4-10-4-18" fill="#F0B43E"/>
    <ellipse cx="90" cy="112" rx="8" ry="4" fill="#FFFFFF" opacity=".5" transform="rotate(-24 90 112)"/>`);
}

export function rose(id = 'ro') {
  const petal = (r, s, c) => `<path d="M0 0c-14-12-24-30-16-44 6-10 22-10 16 4 2-14 18-14 22-2 6 16-6 32-22 42z" fill="${c}" transform="translate(100 104) rotate(${r}) scale(${s})"/>`;
  return svg(id, `<radialGradient id="${id}g" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#C95F78"/><stop offset="1" stop-color="#F2B8C3"/></radialGradient>`,
    `${sh(id)}<circle cx="100" cy="104" r="50" fill="url(#${id}g)" opacity=".35"/>
    ${[0, 72, 144, 216, 288].map((r) => petal(r, 1, '#EBA3B1')).join('')}${[36, 108, 180, 252, 324].map((r) => petal(r, 0.75, '#DA7F93')).join('')}${[0, 120, 240].map((r) => petal(r, 0.45, '#BE5470')).join('')}
    <circle cx="100" cy="104" r="7" fill="#A9405C"/>`);
}

export function mango(id = 'ma') {
  return svg(id, `<radialGradient id="${id}g" cx=".35" cy=".3" r=".95"><stop offset="0" stop-color="#FFE08A"/><stop offset=".45" stop-color="#F7B03A"/><stop offset=".85" stop-color="#E8752C"/><stop offset="1" stop-color="#C9552A"/></radialGradient>`,
    `${sh(id)}<path d="M70 60c30-20 80-8 88 36 8 46-30 76-66 72-36-4-56-40-48-70 4-16 14-28 26-38z" fill="url(#${id}g)"/>
    <path d="M118 46c4-10 12-14 22-12-2 10-10 16-22 12z" fill="#6FA35A"/><path d="M112 52c2-6 4-10 6-6" stroke="#6E5233" stroke-width="3" fill="none"/>
    <ellipse cx="82" cy="86" rx="14" ry="22" fill="#FFFFFF" opacity=".35" transform="rotate(30 82 86)"/>`);
}
