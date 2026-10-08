/*
 * The ingredients as small 3D objects: coffee beans, rose petals, mint leaves, citrus slices,
 * cinnamon, cardamom, ice and the rest. Shared by the photo studio and the hero cup.
 */
import * as THREE from 'three';

export function rng(seed) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => { h += 0x6d2b79f5; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export const mat = (color, extra = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.55, ...extra });

/* ---------- props: each returns a Group lying on the table (y = 0) ---------- */

function bean(r) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat('#4A2E22', { roughness: 0.38, clearcoat: 0.35 }));
  body.scale.set(0.15, 0.085, 0.11);
  body.position.y = 0.07;
  const crease = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.012, 0.014), mat('#24160F'));
  crease.position.y = 0.152;
  crease.rotation.y = (r() - 0.5) * 0.2;
  g.add(body, crease);
  return g;
}

function petal(color, size = 0.5) {
  const geo = new THREE.PlaneGeometry(1, 1, 14, 18);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i), v = p.getY(i) + 0.5;
    const w = Math.sin(Math.min(1, v * 1.1) * Math.PI) * (0.55 + 0.45 * v);
    p.setXYZ(i, u * w, v, (u * w) ** 2 * 0.9 + Math.pow(v, 2.4) * 0.18);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat(color, { side: THREE.DoubleSide, roughness: 0.6, sheen: 0.8, sheenColor: new THREE.Color('#fff0f2') }));
  m.rotation.x = -Math.PI / 2;
  m.scale.setScalar(size);
  m.position.y = 0.02;
  const g = new THREE.Group();
  g.add(m);
  return g;
}

function leaf(color = '#6E9E68', size = 0.55) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(0.42, 0.42, 0, 1);
  s.quadraticCurveTo(-0.42, 0.42, 0, 0);
  const geo = new THREE.ShapeGeometry(s, 18);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.abs(p.getX(i)) * 0.35 + Math.sin(p.getY(i) * 3) * 0.02);
  geo.computeVertexNormals();
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, mat(color, { side: THREE.DoubleSide, roughness: 0.45, clearcoat: 0.25, sheen: 0.4, sheenColor: new THREE.Color('#d9f0d0') }));
  m.rotation.x = -Math.PI / 2;
  m.scale.setScalar(size);
  m.position.y = 0.03;
  const rib = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.006, 0.9 * size), mat('#B9D6A8'));
  rib.position.set(0, 0.035, -0.45 * size);
  g.add(m, rib);
  return g;
}

function stick(color = '#9A5A33', len = 1.1, rad = 0.06) {
  const g = new THREE.Group();
  for (const [dx, k] of [[-rad * 0.9, 1], [rad * 0.9, 0.92]]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(rad * k, rad * k, len, 20), mat(color, { roughness: 0.85 }));
    c.rotation.z = Math.PI / 2;
    c.position.set(0, rad, dx);
    g.add(c);
  }
  return g;
}

function slice(color, rind) {
  const tex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = rind; x.beginPath(); x.arc(128, 128, 128, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#FFF8E8'; x.beginPath(); x.arc(128, 128, 116, 0, Math.PI * 2); x.fill();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      x.fillStyle = color; x.beginPath(); x.moveTo(128 + Math.cos(a) * 10, 128 + Math.sin(a) * 10);
      x.arc(128, 128, 104, a + 0.06, a + (Math.PI * 2) / 10 - 0.06); x.closePath(); x.fill();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const top = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.3, clearcoat: 0.6 });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.06, 48), [mat(rind, { roughness: 0.5 }), top, top]);
  m.position.y = 0.03;
  const g = new THREE.Group();
  g.add(m);
  return g;
}

function pod(color = '#A9B57A') {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), mat(color, { roughness: 0.7 }));
  m.scale.set(0.17, 0.08, 0.09);
  m.position.y = 0.075;
  g.add(m);
  return g;
}

function chunk(color = '#4B2C20') {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.2), mat(color, { roughness: 0.35, clearcoat: 0.4 }));
  m.position.y = 0.035;
  g.add(m);
  return g;
}

function blob(color, sx = 0.14, sy = 0.05, glossy = true) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat(color, glossy ? { roughness: 0.12, clearcoat: 1 } : { roughness: 0.75 }));
  m.scale.set(sx, sy, sx * 0.9);
  m.position.y = sy;
  g.add(m);
  return g;
}

function bumpy(color, r = 0.17) {
  const geo = new THREE.IcosahedronGeometry(r, 4);
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.multiplyScalar(1 + Math.sin(v.x * 60) * Math.sin(v.y * 60) * Math.sin(v.z * 60) * 0.05); p.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.6 }));
  m.position.y = r * 0.9;
  const g = new THREE.Group();
  g.add(m);
  return g;
}

function berry() {
  const g = new THREE.Group();
  const pts = [[0, 0], [0.1, 0.03], [0.17, 0.12], [0.18, 0.22], [0.12, 0.3], [0, 0.32]].map(([x, y]) => new THREE.Vector2(x, y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), mat('#D5404F', { roughness: 0.3, clearcoat: 0.8 }));
  m.rotation.z = Math.PI / 2;
  m.position.y = 0.17;
  const cap = leaf('#5E8F4E', 0.18);
  cap.position.set(0.3, 0.12, 0);
  g.add(m, cap);
  return g;
}

function sprig(color = '#9F8AC9') {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 8), mat('#7D8F62'));
  stem.rotation.z = Math.PI / 2;
  stem.position.y = 0.02;
  g.add(stem);
  for (let i = 0; i < 14; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), mat(color, { roughness: 0.5 }));
    b.position.set(0.12 + i * 0.026, 0.04, (i % 2 ? 1 : -1) * 0.025);
    g.add(b);
  }
  return g;
}

export function ice(size = 0.32) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.BoxGeometry(size, size, size, 2, 2, 2), new THREE.MeshPhysicalMaterial({ color: '#F4FAFC', roughness: 0.08, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.55, envMapIntensity: 1.6 }));
  m.position.y = size / 2;
  g.add(m);
  return g;
}

// what each ingredient looks like on the table
export const PROP = {
  espresso: (r) => bean(r), cold_brew: (r) => bean(r), hazelnut: () => blob('#9A6A42', 0.12, 0.11, false),
  rose: () => petal('#E7A3B2'), hibiscus: () => petal('#9E2F4C', 0.36), lavender: () => sprig(),
  mint: () => leaf('#6E9E68'), matcha: () => leaf('#8DAF5A', 0.3), black_tea: () => leaf('#5A3E25', 0.22),
  cinnamon: () => stick(), vanilla: () => stick('#3B2618', 0.95, 0.025), cardamom: () => pod(),
  lemon: () => slice('#F4D35E', '#E9C23A'), orange: () => slice('#F2A65A', '#E58A2F'), ginger: () => bumpy('#D9B07A', 0.15),
  strawberry: () => berry(), lychee: () => bumpy('#E8A0A8', 0.16), mango: () => chunk('#F5B841'),
  cocoa: () => chunk(), caramel: () => blob('#C98A3E'), honey: () => blob('#E3A93B'),
  ice: () => ice(), soda: () => ice(0.24),
};
