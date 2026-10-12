/*
 * The ode cup: a speckled stoneware cup on its saucer, or a glass tumbler with ice for iced
 * drinks. Milk drinks carry crema and latte art (heart, tulip, rosette or swirl, chosen per
 * drink); teas and coolers have a clear surface. Crafting mode drops the two logo drops in and
 * the art rises as the drink is written; hero mode lets you turn the cup, and hot drinks steam.
 *
 * LIQUID_FRAG (the colour swirl) stays exported for the Wall's photo studio.
 */
import { createStage, dropGeometry, glossy, reducedMotion } from './stage';
import { PROP, ice, rng } from './props';

export const NOISE = `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 7.1; a *= 0.5; } return v; }
`;

export const LIQUID_FRAG = `
  uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
  uniform float uTime; uniform float uIntensity; uniform float uDropT; uniform float uSeed;
  varying vec2 vUv;
  ${NOISE}
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p), a = atan(p.y, p.x);
    float sw = a + r * 2.6 - uTime * 0.12;
    vec2 q = vec2(cos(sw), sin(sw)) * r;
    float n = fbm(q * 2.1 + uSeed + uTime * 0.04);
    float n2 = fbm(q * 3.2 - uTime * 0.03 + uSeed * 1.7);
    vec3 col = mix(uC0, uC1, smoothstep(0.32, 0.72, n));
    col = mix(col, uC2, smoothstep(0.42, 0.8, n2) * 0.85);
    col = mix(col, uC3, smoothstep(0.55, 0.85, n * n2 * 1.7) * 0.7);
    // crema: pale and creamy before the drink is written, deepening as it is
    col = mix(col, vec3(0.94, 0.89, 0.81), (1.0 - uIntensity) * 0.84 + 0.08);
    float since = uTime - uDropT, front = since * 0.55;
    col += sin((r - front) * 42.0) * exp(-pow((r - front) * 6.0, 2.0)) * exp(-since * 1.1) * 0.09;
    col *= 1.0 - smoothstep(0.7, 1.0, r) * 0.16;
    col += smoothstep(0.92, 1.0, r) * 0.07;
    vec2 h = p - vec2(-0.32, 0.36);
    col += exp(-dot(h, h) * 12.0) * 0.1;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// A drink's surface: crema and latte art for milk drinks, a clear surface for the rest.
const SURFACE_FRAG = `
  uniform vec3 uBody; uniform vec3 uFoam; uniform float uMilk; uniform float uArt;
  uniform float uTime; uniform float uIntensity; uniform float uDropT; uniform float uSeed;
  varying vec2 vUv;
  ${NOISE}
  float sdHeart(vec2 p) {
    p.x = abs(p.x);
    if (p.y + p.x > 1.0) return sqrt(dot(p - vec2(0.25, 0.75), p - vec2(0.25, 0.75))) - 0.353553;
    vec2 a = p - vec2(0.0, 1.0), b = p - 0.5 * max(p.x + p.y, 0.0);
    return sqrt(min(dot(a, a), dot(b, b))) * sign(p.x - p.y);
  }
  float heart(vec2 p, vec2 c, float s) { return sdHeart((p - c) / s) * s; }
  float line(vec2 p, float y0, float y1, float w) { return smoothstep(w, 0.0, abs(p.x) - 0.004) * step(y0, p.y) * step(p.y, y1); }
  float crescent(vec2 q, vec2 c, float w, float h, float e) {
    float o = length((q - c) / vec2(w, h)) - 1.0;
    float i = length((q - c - vec2(0.0, h * 0.55)) / vec2(w * 0.9, h * 0.95)) - 1.0;
    return smoothstep(e, -e, o) * smoothstep(-e, e, i);
  }
  float art(vec2 p) {
    float e = 0.03;
    float ang = (fract(uSeed * 0.37) - 0.5) * 0.5;                     // never poured perfectly straight
    p = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * p / 0.9;
    p += vec2(fbm(p * 2.4 + uSeed) - 0.5, fbm(p * 2.4 - uSeed) - 0.5) * 0.07; // poured, not printed
    if (uArt < 0.5) return 0.0;
    if (uArt < 1.5) {
      float d = heart(p, vec2(0.0, -0.46), 0.82);
      return max(smoothstep(e, -e, d), line(p, -0.86, -0.46, 0.02));
    }
    if (uArt < 2.5) {
      float d1 = heart(p, vec2(0.0, -0.64), 0.52), d2 = heart(p, vec2(0.0, -0.3), 0.44), d3 = heart(p, vec2(0.0, 0.02), 0.36);
      float f = smoothstep(e, -e, min(min(d1, d2), d3));
      f -= (smoothstep(0.026, 0.0, abs(d2)) + smoothstep(0.026, 0.0, abs(d3))) * 0.7;
      return clamp(max(f, line(p, -0.9, 0.24, 0.018)), 0.0, 1.0);
    }
    if (uArt < 3.5) {
      vec2 q = vec2(p.x, p.y - p.x * p.x * 0.75);                      // wings curl up at the sides
      float f = 0.0;
      for (int i = 0; i < 8; i++) {
        float k = float(i);
        f = max(f, crescent(q, vec2(0.0, -0.6 + k * 0.145), 0.58 - k * 0.058, 0.13 - k * 0.006, 0.12));
      }
      return max(f * 0.95, line(p, -0.82, 0.42, 0.018));
    }
    float r = length(p), a = atan(p.y, p.x);
    return smoothstep(0.5, 0.85, sin(a + r * 15.0 - uSeed) * 0.5 + 0.5) * smoothstep(0.82, 0.15, r);
  }
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    vec3 col = uBody * (0.93 + 0.09 * smoothstep(0.15, 0.95, r));
    col *= 0.97 + fbm(p * 2.4 + uSeed + uTime * 0.03) * 0.06;
    if (uMilk > 0.5) {
      vec3 crema = mix(uBody, vec3(0.72, 0.48, 0.27), 0.34);
      float ring = smoothstep(0.42, 0.96, r);
      col = mix(col, crema, ring * 0.5);
      col -= smoothstep(0.64, 0.92, noise(p * 72.0 + uSeed)) * 0.07 * ring;
      float a = art(p) * smoothstep(0.35, 1.0, uIntensity);
      vec3 foam = uFoam - smoothstep(0.82, 0.96, noise(p * 150.0 + 3.0)) * 0.05 - (1.0 - fbm(p * 9.0 + uSeed)) * 0.04;
      col = mix(col, mix(col, uFoam, 0.18), smoothstep(0.0, 0.5, art(p * 0.97)) * (1.0 - a) * 0.6); // a soft halo
      col = mix(col, foam, a);
      col = mix(col, uFoam, smoothstep(0.9, 0.99, r) * 0.25); // foam clings to the wall
    } else {
      col += smoothstep(0.56, 0.82, fbm(p * 5.0 + uTime * 0.05 + uSeed)) * 0.05;
    }
    col = mix(col, vec3(0.94, 0.89, 0.81), (1.0 - uIntensity) * 0.84);
    float since = uTime - uDropT, front = since * 0.55;
    col += sin((r - front) * 42.0) * exp(-pow((r - front) * 6.0, 2.0)) * exp(-since * 1.1) * 0.09;
    col += smoothstep(0.93, 0.99, r) * 0.07;
    col *= 1.0 - smoothstep(0.72, 1.0, r) * 0.12 * (0.55 + 0.45 * p.y);
    vec2 h = (p - vec2(-0.38, 0.42)) * vec2(1.0, 1.9);
    col += exp(-dot(h, h) * 9.0) * 0.07;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// The side of an iced drink in its glass: layered when there is milk.
const COLUMN_FRAG = `
  uniform vec3 uBody; uniform vec3 uFoam; uniform float uMilk; uniform float uTime;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  ${NOISE}
  void main() {
    float y = vUv.y;
    vec3 col = uBody;
    if (uMilk > 0.5) {
      float edge = 0.42 + (fbm(vec2(vUv.x * 6.0, uTime * 0.05)) - 0.5) * 0.18;
      col = mix(uFoam * 0.97, uBody, smoothstep(edge - 0.12, edge + 0.12, y));
    }
    col *= 0.86 + 0.14 * y;
    float facing = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
    col *= 0.78 + 0.22 * facing;
    col += pow(1.0 - facing, 3.0) * 0.12;
    gl_FragColor = vec4(col, 0.94);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const STEAM_FRAG = `
  uniform float uTime; uniform float uSeed; varying vec2 vUv;
  ${NOISE}
  void main() {
    vec2 p = vUv;
    float x = p.x - 0.5 + sin(p.y * 4.5 + uTime * 0.7 + uSeed) * 0.11 * p.y + (fbm(vec2(uSeed, p.y * 1.5 - uTime * 0.2)) - 0.5) * 0.12;
    float wisp = exp(-x * x * 70.0) * fbm(vec2(p.x * 4.0 + uSeed, p.y * 2.4 - uTime * 0.32));
    float fade = smoothstep(0.0, 0.22, p.y) * (1.0 - smoothstep(0.5, 1.0, p.y));
    gl_FragColor = vec4(vec3(1.0, 0.985, 0.96), wisp * fade * 0.5);
  }
`;

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const VERT_LIT = 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalMatrix * normal; vV = -mv.xyz; gl_Position = projectionMatrix * mv; }';

// Speckled stoneware: an off-white glaze with fine iron flecks, drawn once.
function stoneware(THREE) {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#FBF6EE'; g.fillRect(0, 0, 512, 512);
  const r = rng('stoneware');
  for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,250' : '232,220,204'},${0.25 + r() * 0.3})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 40 + r() * 120, 20 + r() * 60, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 2600; i++) {
    const big = r() < 0.06;
    g.fillStyle = `rgba(${big ? '110,84,62' : '140,112,88'},${0.18 + r() * (big ? 0.45 : 0.3)})`;
    g.beginPath(); g.arc(r() * 512, r() * 512, big ? 0.9 + r() * 1.2 : 0.35 + r() * 0.6, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

export function mountCup(canvas, { colors = ['#D4A55A', '#C4858C'], mode = 'hero', hot = false, intro = false, surface } = {}) {
  const st = createStage(canvas, { fov: 30 });
  const { THREE, scene, camera } = st;
  const still = reducedMotion();
  const show = intro && !still; // the website's opening moment
  const drink = surface || surfaceFromColors(colors);
  const glassy = mode === 'hero' && drink.cold;
  camera.position.set(0, mode === 'hero' ? (show ? 4.3 : glassy ? 3.0 : 3.5) : 3.2, mode === 'hero' ? (show ? 7.2 : glassy ? 5.1 : 4.9) : 4.4);
  camera.lookAt(0, show ? 0.55 : glassy ? 0.62 : 0.38, 0);

  const cup = new THREE.Group();
  scene.add(cup);
  const tex = stoneware(THREE);
  const glaze = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', map: tex, roughness: 0.38, clearcoat: 0.8, clearcoatRoughness: 0.22, sheen: 0.25, sheenColor: new THREE.Color('#FFF1E2') });
  const clay = new THREE.MeshStandardMaterial({ color: '#D8C7B0', roughness: 0.92 });
  const lathe = (pts, m) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 112), m);

  const toLinear = (c) => new THREE.Color(c);
  const uniforms = {
    uBody: { value: toLinear(drink.body) }, uFoam: { value: toLinear(drink.foam) }, uMilk: { value: drink.milk ? 1 : 0 }, uArt: { value: drink.art },
    uTime: { value: 0 }, uIntensity: { value: mode === 'crafting' || show ? 0 : 1 }, uDropT: { value: -10 }, uSeed: { value: drink.seed ?? Math.random() * 10 },
  };
  const surfaceMat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: SURFACE_FRAG });
  let saucer = null;
  let liquidY = 0.8;

  if (!glassy) {
    // stoneware cup: glazed wall over the lip and down inside, an unglazed foot, a sculpted handle
    const prof = [[0.48, 0.06], [0.56, 0.07], [0.6, 0.12], [0.72, 0.38], [0.84, 0.66], [0.92, 0.86], [0.96, 0.95], [0.958, 0.983], [0.935, 0.992], [0.906, 0.95], [0.862, 0.8], [0.762, 0.52], [0.632, 0.22], [0.52, 0.11], [0.0, 0.11]];
    cup.add(lathe(prof, glaze));
    cup.add(lathe([[0.0, 0.0], [0.47, 0.0], [0.5, 0.02], [0.5, 0.06], [0.48, 0.065], [0.0, 0.065]], clay));
    const curve = new THREE.CatmullRomCurve3([[0.86, 0.76], [1.08, 0.82], [1.25, 0.66], [1.2, 0.42], [1.0, 0.3], [0.76, 0.3]].map(([x, y]) => new THREE.Vector3(x, y, 0)));
    const handle = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.052, 16, false), glaze);
    handle.scale.set(1, 1, 1.25);
    cup.add(handle);

    saucer = new THREE.Group();
    saucer.add(lathe([[0.0, 0.03], [0.62, 0.03], [0.9, 0.05], [1.3, 0.085], [1.4, 0.11], [1.445, 0.13], [1.45, 0.145], [1.435, 0.158], [1.4, 0.16], [1.32, 0.14], [0.92, 0.09], [0.6, 0.078], [0.0, 0.078]], glaze));
    saucer.add(lathe([[0.0, 0.0], [0.56, 0.0], [0.6, 0.015], [0.6, 0.035], [0.0, 0.035]], clay));
    saucer.position.y = -0.08;
    scene.add(saucer);

    const liquid = new THREE.Mesh(new THREE.CircleGeometry(0.85, 112), surfaceMat);
    liquid.rotation.x = -Math.PI / 2;
    liquid.position.y = liquidY;
    cup.add(liquid);
  } else {
    // iced: a heavy tumbler, the drink layered inside, ice on top
    liquidY = 1.12;
    const colMat = new THREE.ShaderMaterial({ uniforms: { uBody: uniforms.uBody, uFoam: uniforms.uFoam, uMilk: uniforms.uMilk, uTime: uniforms.uTime }, vertexShader: VERT_LIT, fragmentShader: COLUMN_FRAG, transparent: true });
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.645, 0.565, 1.02, 72, 1, true), colMat);
    column.position.y = 0.61;
    cup.add(column);
    const top = new THREE.Mesh(new THREE.CircleGeometry(0.645, 96), new THREE.ShaderMaterial({ uniforms: { ...uniforms, uMilk: { value: 0 }, uArt: { value: 0 } }, vertexShader: VERT, fragmentShader: SURFACE_FRAG }));
    top.rotation.x = -Math.PI / 2;
    top.position.y = liquidY;
    cup.add(top);
    const r = rng('ice' + (drink.seed || 1));
    for (let i = 0; i < 3; i++) {
      const c = ice(0.27);
      const a = i * 2.2 + r();
      c.position.set(Math.cos(a) * 0.3, liquidY - 0.16 + r() * 0.06, Math.sin(a) * 0.3);
      c.rotation.set(r() * 0.5, r() * 3, r() * 0.5);
      cup.add(c);
    }
    const glass = lathe([[0.0, 0.0], [0.58, 0.0], [0.6, 0.02], [0.7, 1.5], [0.68, 1.52], [0.655, 1.5], [0.57, 0.1], [0.0, 0.1]],
      new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.2, envMapIntensity: 2.2, side: THREE.DoubleSide, depthWrite: false }));
    glass.renderOrder = 3;
    cup.add(glass);
  }

  // soft contact shadow under the cup or glass
  const shadowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); const grd = g.createRadialGradient(64, 64, 8, 64, 64, 56);
    grd.addColorStop(0, 'rgba(58,45,35,.38)'); grd.addColorStop(0.55, 'rgba(58,45,35,.14)'); grd.addColorStop(1, 'rgba(58,45,35,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(glassy ? 2.6 : 3.6, glassy ? 2.6 : 3.6), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0.12, -0.085, 0.1);
  scene.add(shadow);

  const steam = [];
  let isHot = hot && !glassy;
  if (mode === 'hero' && !glassy) {
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.7), new THREE.ShaderMaterial({
        uniforms: { uTime: uniforms.uTime, uSeed: { value: i * 2.7 + 1 } }, transparent: true, depthWrite: false, vertexShader: VERT, fragmentShader: STEAM_FRAG,
      }));
      m.position.set([-0.18, 0.12, 0.02][i], liquidY + 0.9, [0.1, -0.08, 0.16][i]);
      m.visible = isHot && !show;
      scene.add(m);
      steam.push(m);
    }
  }

  // the two logo drops fall in turn (crafting, and the website's opening)
  const drops = [];
  if (mode === 'crafting' || show) {
    const g = dropGeometry(6);
    ['#D4A55A', '#C4858C'].forEach((c, i) => {
      const m = new THREE.Mesh(g, glossy(c));
      m.scale.setScalar(0.42);
      m.visible = false;
      scene.add(m);
      drops.push({ m, i });
    });
  }
  let stage = 0, target = mode === 'crafting' || show ? 0 : 1;
  // the opening: ingredients that drift around the cup once the drink has poured
  const orbit = new THREE.Group();
  const floaters = [];
  if (show) {
    const r = rng('ode-hero');
    const kinds = ['espresso', 'rose', 'mint', 'cardamom', 'honey', 'rose', 'espresso', 'lavender'];
    kinds.forEach((id, i) => {
      const p = PROP[id](r);
      const a = (i / kinds.length) * Math.PI * 2 + r() * 0.3;
      const rad = 1.85 + r() * 0.5;
      const holder = new THREE.Group();
      holder.add(p);
      holder.position.set(Math.cos(a) * rad, 0.35 + r() * 1.3, Math.sin(a) * rad);
      holder.rotation.set(r() * 1.2 - 0.6, r() * 6.28, r() * 1.2 - 0.6);
      holder.scale.setScalar(0);
      orbit.add(holder);
      floaters.push({ holder, size: 0.55 + r() * 0.25, delay: i * 0.12, spin: (r() - 0.5) * 0.6, bob: r() * 6 });
    });
    scene.add(orbit);
  }
  let born = null, landed = 0;
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  const lean = (e) => { tilt.tx = (e.clientY / window.innerHeight - 0.5) * 0.25; tilt.ty = (e.clientX / window.innerWidth - 0.5) * 0.4; st.refresh(); };
  if (show) window.addEventListener('pointermove', lean, { passive: true });
  // colours glide to new ones instead of jumping (the website's live demo changes them)
  const goal = { body: uniforms.uBody.value.clone(), foam: uniforms.uFoam.value.clone() };

  // turning the cup by hand (hero)
  let spin = 0, vel = 0, dragging = false, lastX = 0;
  const down = (e) => { dragging = true; lastX = e.clientX; canvas.setPointerCapture?.(e.pointerId); };
  const move = (e) => { if (!dragging) return; vel = (e.clientX - lastX) * 0.006; spin += vel; lastX = e.clientX; st.refresh(); };
  const up = () => { dragging = false; };
  if (mode === 'hero') {
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
  }

  const ease = (k) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);
  const springy = (k) => { k = Math.min(1, Math.max(0, k)); return 1 + Math.pow(2, -9 * k) * Math.sin((k * 9 - 0.75) * ((2 * Math.PI) / 3)) * -1 * (k < 1 ? 1 : 0); };
  st.setFrame((t) => {
    uniforms.uTime.value = t;
    uniforms.uBody.value.lerp(goal.body, still ? 1 : 0.05);
    uniforms.uFoam.value.lerp(goal.foam, still ? 1 : 0.05);
    uniforms.uIntensity.value += (target - uniforms.uIntensity.value) * 0.03;
    if (still) uniforms.uIntensity.value = target;
    if (mode === 'hero') {
      if (!dragging) { vel *= 0.94; spin += vel + 0.0018; }
      const scroll = show ? window.scrollY * 0.0022 : 0;
      cup.rotation.y = -0.7 + spin + scroll;
      if (show) {
        born ??= t;
        const e = t - born;
        // the cup rises in, then the honey drop and the cherry drop fall into it
        const k = springy(e / 1.1);
        cup.scale.setScalar(0.82 + 0.18 * k);
        saucer?.scale.setScalar(0.82 + 0.18 * k);
        cup.position.y = (1 - ease(e / 0.9)) * -0.35;
        drops.forEach(({ m, i }) => {
          const s0 = 0.55 + i * 0.6, f = (e - s0) / 0.6;
          m.visible = f > 0 && f < 1.15;
          m.position.set(i ? 0.14 : -0.14, 2.5 - Math.pow(Math.min(1, f), 2) * 1.7, 0.05);
          m.rotation.set(0, -0.35, Math.PI);
          m.scale.setScalar(0.42 * (f > 0.9 ? Math.max(0.02, 1 - (f - 0.9) * 4) : 1));
          if (f >= 1 && landed <= i) { landed = i + 1; uniforms.uDropT.value = t; target = landed / 2; }
        });
        // then the ingredients drift in and the steam rises
        tilt.x += (tilt.tx - tilt.x) * 0.05;
        tilt.y += (tilt.ty - tilt.y) * 0.05;
        cup.rotation.x = tilt.x * 0.5;
        cup.rotation.z = -tilt.y * 0.25;
        orbit.rotation.y = t * 0.06 + scroll * 0.6 + tilt.y * 0.4;
        orbit.rotation.x = tilt.x * 0.3;
        floaters.forEach((f, i) => {
          f.holder.scale.setScalar(f.size * springy((e - 1.9 - f.delay) / 1.2));
          f.holder.rotation.y += f.spin * 0.01;
          f.holder.position.y += Math.sin(t * 0.8 + f.bob) * 0.0012;
          f.holder.rotation.z = Math.sin(t * 0.5 + i) * 0.25;
        });
        steam.forEach((m) => { m.visible = isHot && e > 2.2; });
      }
    } else {
      cup.rotation.y = -0.7 + Math.sin(t * 0.25) * 0.15;
      const cycle = 2.4;
      for (const { m, i } of drops) {
        const k = ((t + i * cycle / 2) % cycle) / cycle; // 0…1 per fall
        m.visible = stage < 4 && k < 0.62;
        const y = 1.95 - Math.pow(Math.min(1, k / 0.6), 2) * 1.15;
        m.position.set(i ? 0.12 : -0.12, y, 0.05);
        m.rotation.set(0, -0.35 + Math.sin(t + i) * 0.2, Math.PI);
        const s = 0.42 * (k > 0.52 ? Math.max(0.05, 1 - (k - 0.52) * 9) : 1);
        m.scale.setScalar(s);
        if (k > 0.58 && k < 0.6) uniforms.uDropT.value = t;
      }
    }
    steam.forEach((m) => m.lookAt(camera.position));
    if (mode === 'crafting') cup.position.y = Math.sin(t * 0.8) * 0.01;
  });

  return {
    setStage(n) { if (mode !== 'crafting') return; stage = n; target = Math.min(1, n / 3); },
    setColors(list) { this.setSurface(surfaceFromColors(list)); },
    setSurface(d) {
      goal.body.set(d.body); goal.foam.set(d.foam);
      uniforms.uMilk.value = d.milk ? 1 : 0;
      uniforms.uArt.value = d.art;
      if (d.seed != null) uniforms.uSeed.value = d.seed;
      uniforms.uDropT.value = uniforms.uTime.value; // a ripple as the new drink pours in
      st.refresh();
    },
    setHot(h) { isHot = h; if (!show) steam.forEach((m) => { m.visible = h; }); st.refresh(); },
    dispose() {
      window.removeEventListener('pointermove', lean);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      shadowTex.dispose();
      tex.dispose();
      st.dispose();
    },
  };
}

// Before the drink is known (crafting) or for a bare colour list: a latte look, with a heart.
export function surfaceFromColors(list = []) {
  const mixHex = (a, b, t) => '#' + [0, 2, 4].map((i) => Math.round(parseInt(a.slice(1 + i, 3 + i), 16) * (1 - t) + parseInt(b.slice(1 + i, 3 + i), 16) * t).toString(16).padStart(2, '0')).join('');
  const avg = list.length ? list.reduce((acc, c) => mixHex(acc, c, 1 / 2), list[0]) : '#C9A27A';
  return { body: mixHex(avg, '#8A5A3C', 0.45), foam: '#FBF4EA', milk: true, art: 1, cold: false };
}
