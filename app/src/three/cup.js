/*
 * The ode cup: a glazed ceramic cup on a saucer, its drink a slow living swirl of the drink's
 * own ingredient colours. Crafting mode drops the two logo drops in, one per stage, and the
 * colour deepens; hero mode lets you turn the cup, and hot drinks steam.
 */
import { createStage, dropGeometry, glossy, reducedMotion } from './stage';

const NOISE = `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 7.1; a *= 0.5; } return v; }
`;

const LIQUID_FRAG = `
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

const STEAM_FRAG = `
  uniform float uTime; uniform float uSeed; varying vec2 vUv;
  ${NOISE}
  void main() {
    vec2 p = vUv;
    float x = p.x - 0.5 + sin(p.y * 5.0 + uTime * 0.8 + uSeed) * 0.12 * p.y;
    float wisp = exp(-x * x * 40.0) * fbm(vec2(p.x * 3.0 + uSeed, p.y * 2.0 - uTime * 0.35));
    float fade = smoothstep(0.0, 0.25, p.y) * (1.0 - smoothstep(0.55, 1.0, p.y));
    gl_FragColor = vec4(vec3(1.0, 0.98, 0.95), wisp * fade * 0.55);
  }
`;

export function mountCup(canvas, { colors = ['#D4A55A', '#C4858C'], mode = 'hero', hot = false } = {}) {
  const st = createStage(canvas, { fov: 30 });
  const { THREE, scene, camera } = st;
  camera.position.set(0, mode === 'hero' ? 3.5 : 3.2, mode === 'hero' ? 4.9 : 4.4);
  camera.lookAt(0, 0.38, 0);

  const cup = new THREE.Group();
  scene.add(cup);

  const glaze = new THREE.MeshPhysicalMaterial({ color: '#FFFCF6', roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.2, sheen: 0.3, sheenColor: new THREE.Color('#FFF1E2') });
  // cup wall: outside up to the rim, over the lip, then down the inside
  const prof = [[0.0, 0.02], [0.5, 0.02], [0.56, 0.04], [0.6, 0.1], [0.72, 0.38], [0.84, 0.66], [0.92, 0.86], [0.96, 0.95], [0.955, 0.985], [0.93, 0.99], [0.905, 0.95], [0.86, 0.8], [0.76, 0.52], [0.63, 0.22], [0.52, 0.1], [0.0, 0.1]];
  const wall = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 96), glaze);
  cup.add(wall);

  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.055, 20, 48, Math.PI * 1.15), glaze);
  handle.position.set(0.86, 0.52, 0);
  handle.rotation.z = -Math.PI * 0.575;
  cup.add(handle);

  const saucerProf = [[0, 0], [0.9, 0], [1.38, 0.05], [1.45, 0.1], [1.42, 0.12], [1.3, 0.09], [0.92, 0.05], [0, 0.05]];
  const saucer = new THREE.Mesh(new THREE.LatheGeometry(saucerProf.map(([x, y]) => new THREE.Vector2(x, y)), 96), glaze);
  saucer.position.y = -0.05;
  scene.add(saucer);

  // soft contact shadow under the saucer
  const shadowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); const grd = g.createRadialGradient(64, 64, 10, 64, 64, 54);
    grd.addColorStop(0, 'rgba(58,53,48,.35)'); grd.addColorStop(1, 'rgba(58,53,48,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.06;
  scene.add(shadow);

  const toLinear = (c) => new THREE.Color(c);
  const pal = [...colors, ...colors, ...colors].slice(0, 4);
  const uniforms = {
    uC0: { value: toLinear(pal[0]) }, uC1: { value: toLinear(pal[1]) }, uC2: { value: toLinear(pal[2]) }, uC3: { value: toLinear(pal[3]) },
    uTime: { value: 0 }, uIntensity: { value: mode === 'crafting' ? 0 : 1 }, uDropT: { value: -10 }, uSeed: { value: Math.random() * 10 },
  };
  const liquid = new THREE.Mesh(new THREE.CircleGeometry(0.83, 96), new THREE.ShaderMaterial({
    uniforms, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: LIQUID_FRAG,
  }));
  liquid.rotation.x = -Math.PI / 2;
  liquid.position.y = 0.8;
  cup.add(liquid);

  const steam = [];
  if (hot && mode === 'hero') {
    for (let i = 0; i < 2; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.6), new THREE.ShaderMaterial({
        uniforms: { uTime: uniforms.uTime, uSeed: { value: i * 3.3 } }, transparent: true, depthWrite: false,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: STEAM_FRAG,
      }));
      m.position.set(i ? 0.18 : -0.15, 1.65, i ? -0.1 : 0.1);
      scene.add(m);
      steam.push(m);
    }
  }

  // crafting: the two logo drops fall in turn
  const drops = [];
  if (mode === 'crafting') {
    const g = dropGeometry(6);
    ['#D4A55A', '#C4858C'].forEach((c, i) => {
      const m = new THREE.Mesh(g, glossy(c));
      m.scale.setScalar(0.42);
      m.visible = false;
      scene.add(m);
      drops.push({ m, i });
    });
  }
  let stage = 0, target = mode === 'crafting' ? 0 : 1;

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

  const still = reducedMotion();
  st.setFrame((t) => {
    uniforms.uTime.value = t;
    uniforms.uIntensity.value += (target - uniforms.uIntensity.value) * 0.03;
    if (still) uniforms.uIntensity.value = target;
    if (mode === 'hero') {
      if (!dragging) { vel *= 0.94; spin += vel + 0.0018; }
      cup.rotation.y = -0.7 + spin;
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
    cup.position.y = mode === 'crafting' ? Math.sin(t * 0.8) * 0.01 : 0;
  });

  return {
    setStage(n) { stage = n; target = Math.min(1, n / 3); },
    dispose() {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      shadowTex.dispose();
      st.dispose();
    },
  };
}
