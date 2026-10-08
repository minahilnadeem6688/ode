/*
 * A small photo studio: renders an ode as a top-down flat-lay, the way drinks are shot for
 * Pinterest. Cup or glass on a saucer, the drink's own colours swirling on top, its real
 * ingredients scattered around, soft window light and real shadows.
 *
 * Used once to bake the Wall's photos (see /kit/stills), so visitors get plain images.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LIQUID_FRAG } from './cup';
import { PROP, ice, mat, rng } from './props';

/* ---------- vessels ---------- */

function liquid(colors, seed, radius) {
  const pal = [...colors, ...colors, ...colors].slice(0, 4).map((c) => new THREE.Color(c));
  const u = {
    uC0: { value: pal[0] }, uC1: { value: pal[1] }, uC2: { value: pal[2] }, uC3: { value: pal[3] },
    uTime: { value: 8 + seed * 13 }, uIntensity: { value: 1 }, uDropT: { value: -10 }, uSeed: { value: seed * 10 },
  };
  const m = new THREE.Mesh(new THREE.CircleGeometry(radius, 96), new THREE.ShaderMaterial({
    uniforms: u, fragmentShader: LIQUID_FRAG,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

function cupOnSaucer(colors, glaze, seed) {
  const g = new THREE.Group();
  const m = mat(glaze, { roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  const prof = [[0.0, 0.02], [0.45, 0.02], [0.5, 0.05], [0.62, 0.3], [0.74, 0.62], [0.8, 0.78], [0.8, 0.8], [0.775, 0.8], [0.73, 0.64], [0.6, 0.32], [0.46, 0.1], [0.0, 0.1]];
  const cup = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 96), m);
  cup.castShadow = true;
  cup.position.y = 0.08;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 16, 40, Math.PI * 1.1), m);
  handle.position.set(0.8, 0.52, 0);
  handle.rotation.z = -Math.PI * 0.55;
  handle.castShadow = true;
  const saucer = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.7, 0], [1.18, 0.05], [1.24, 0.09], [1.21, 0.1], [1.1, 0.075], [0.72, 0.04], [0, 0.04]].map(([x, y]) => new THREE.Vector2(x, y)), 96), m);
  saucer.castShadow = true; saucer.receiveShadow = true;
  const top = liquid(colors, seed, 0.755);
  top.position.y = 0.8;
  const spoon = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.85, 6, 12), mat('#D7CFC2', { metalness: 1, roughness: 0.25 }));
  spoon.rotation.set(Math.PI / 2, 0, 0.9);
  spoon.position.set(-0.55, 0.12, 0.72);
  spoon.castShadow = true;
  g.add(saucer, cup, handle, top, spoon);
  return g;
}

function glassWithDrink(colors, seed, r) {
  const g = new THREE.Group();
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry([[0, 0], [0.55, 0], [0.62, 1.55], [0.6, 1.55], [0.53, 0.06], [0, 0.06]].map(([x, y]) => new THREE.Vector2(x, y)), 96),
    new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: 0.04, clearcoat: 1, transparent: true, opacity: 0.28, envMapIntensity: 2, side: THREE.DoubleSide, depthWrite: false }),
  );
  glass.castShadow = true;
  glass.renderOrder = 2;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.565, 0.53, 1.04, 64, 1, true), mat(colors[0], { roughness: 0.25, side: THREE.DoubleSide }));
  body.position.y = 0.6;
  const top = liquid(colors, seed, 0.565);
  top.position.y = 1.16;
  g.add(body, top, glass);
  for (let i = 0; i < 3; i++) {
    const c = ice(0.26);
    c.position.set((r() - 0.5) * 0.45, 1.02, (r() - 0.5) * 0.45);
    c.rotation.set(r() * 0.6, r() * 3, r() * 0.6);
    g.add(c);
  }
  const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 16), mat('#FFFFFF', { roughness: 0.3 }));
  straw.rotation.set(0.5, 0, 0.35);
  straw.position.set(0.2, 1.5, 0.25);
  straw.castShadow = true;
  g.add(straw);
  return g;
}

/* ---------- surfaces: linen, marble and wood, drawn rather than photographed ---------- */

function surface(kind, base, r) {
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 1024, 1024);
  if (kind === 'linen') {
    for (let i = 0; i < 1024; i += 2) {
      x.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '90,70,50'},${0.025 + r() * 0.03})`;
      x.fillRect(0, i, 1024, 1); x.fillRect(i, 0, 1, 1024);
    }
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(90,70,50,${r() * 0.05})`; x.fillRect(r() * 1024, r() * 1024, 1 + r() * 6, 1); }
  } else if (kind === 'marble') {
    x.filter = 'blur(2px)';
    for (let v = 0; v < 7; v++) {
      x.strokeStyle = `rgba(110,100,96,${0.16 + r() * 0.2})`; x.lineWidth = 1.5 + r() * 3.5;
      x.beginPath(); let px = r() * 1024, py = -20; x.moveTo(px, py);
      while (py < 1060) { px += (r() - 0.5) * 90; py += 30 + r() * 50; x.lineTo(px, py); }
      x.stroke();
    }
    x.filter = 'blur(40px)';
    for (let i = 0; i < 6; i++) { x.fillStyle = `rgba(255,255,255,${0.25 * r()})`; x.beginPath(); x.arc(r() * 1024, r() * 1024, 120 + r() * 200, 0, 7); x.fill(); }
    x.filter = 'none';
  } else if (kind === 'wood') {
    const plank = 205;
    for (let p = 0; p < 5; p++) {
      x.fillStyle = `rgba(${p % 2 ? '255,240,220' : '80,50,30'},${0.04 + r() * 0.05})`; x.fillRect(0, p * plank, 1024, plank);
      for (let g = 0; g < 26; g++) {
        x.strokeStyle = `rgba(90,55,30,${0.04 + r() * 0.07})`; x.lineWidth = 1 + r() * 2;
        x.beginPath(); const y0 = p * plank + r() * plank; x.moveTo(0, y0);
        for (let xx = 0; xx <= 1024; xx += 64) x.lineTo(xx, y0 + Math.sin(xx / 140 + g) * 6 + (r() - 0.5) * 3);
        x.stroke();
      }
      x.fillStyle = 'rgba(60,35,20,.18)'; x.fillRect(0, p * plank, 1024, 2);
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// The last touch of a photograph: light falling off at the edges and a little grain.
function develop(src, w, h, seed) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0, w, h);
  const v = x.createRadialGradient(w * 0.42, h * 0.38, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(255,248,238,0.06)'); v.addColorStop(1, 'rgba(60,40,25,0.16)');
  x.fillStyle = v; x.fillRect(0, 0, w, h);
  const img = x.getImageData(0, 0, w, h), d = img.data, r = rng(seed + 'grain');
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 9; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}

/* ---------- the shot ---------- */

let renderer;
export function renderStill({ colors, ingredients = [], temperature = 'hot', glaze = '#FBF7F1', table = '#EFE6DA', cloth = '#F7F1E8', surfaceKind = 'linen', seed = 'x', width = 720, height = 900, tilt = 0.16 }) {
  const r = rng(seed);
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(table);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  pm.dispose();

  // window light from the upper left, low enough to throw a proper shadow
  const sun = new THREE.DirectionalLight('#FFF3E4', 2.6);
  sun.position.set(-6, 7.5, -3.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 20 });
  scene.add(sun, new THREE.AmbientLight('#FFF4EA', 0.25));

  const tex = surface(surfaceKind, table, r);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ map: tex, roughness: surfaceKind === 'marble' ? 0.45 : 0.95 }));
  ground.rotation.x = -Math.PI / 2;
  ground.rotation.z = r() * 0.3;
  ground.receiveShadow = true;
  scene.add(ground);
  if (surfaceKind !== 'linen') {
    // a linen napkin, part under the cup
    const ntex = surface('linen', cloth, r);
    const napkin = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.02, 2.6, 1, 1, 1), new THREE.MeshStandardMaterial({ map: ntex, roughness: 1 }));
    napkin.position.set(-0.9 + (r() - 0.5) * 0.6, 0.01, 0.7 + (r() - 0.5) * 0.6);
    napkin.rotation.y = 0.5 + r() * 0.5;
    napkin.receiveShadow = true;
    scene.add(napkin);
  }

  const vessel = temperature === 'cold' ? glassWithDrink(colors, r(), r) : cupOnSaucer(colors, glaze, r());
  vessel.rotation.y = r() * Math.PI * 2;
  vessel.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(vessel);

  // the ingredients, scattered the way a stylist would: a few clusters, never in a ring
  const kinds = ingredients.filter((id) => PROP[id]).slice(0, 3);
  const aspect = width / height;
  kinds.forEach((id, k) => {
    const n = 2 + Math.floor(r() * 3);
    const base = r() * Math.PI * 2 + k * 2.1;
    for (let i = 0; i < n; i++) {
      const p = PROP[id](r);
      const a = base + (r() - 0.5) * 0.9;
      const d = 1.6 + r() * 0.75;
      p.position.set(Math.cos(a) * d * Math.max(1, aspect), 0, Math.sin(a) * d / Math.max(1, aspect) * 1.25);
      p.rotation.y = r() * Math.PI * 2;
      p.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      scene.add(p);
    }
  });

  const cam = new THREE.PerspectiveCamera(28, aspect, 0.1, 60);
  const dist = 7.4 / Math.min(1, aspect) * (aspect > 1 ? 0.9 : 1);
  cam.position.set(0, dist, dist * tilt);
  cam.lookAt(0, 0.3, 0);

  renderer.render(scene, cam);
  const url = develop(renderer.domElement, width, height, seed);
  scene.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.map?.dispose(); m.dispose(); }); } });
  scene.environment.dispose();
  tex.dispose();
  return url;
}
