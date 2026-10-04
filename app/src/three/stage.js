/*
 * Shared 3D plumbing: a transparent renderer with soft studio light, sized to its canvas,
 * that only draws while on screen and holds still for people who prefer reduced motion.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

export function createStage(canvas, { fov = 32, near = 0.1, far = 60 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.NeutralToneMapping; // keeps the pastels soft instead of washing them out
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(fov, 1, near, far);
  const key = new THREE.DirectionalLight('#FFF3E2', 1.4);
  key.position.set(-3, 5, 4);
  scene.add(key, new THREE.AmbientLight('#FBEFE6', 0.5));

  let visible = true, running = false, raf = 0, last = 0;
  let onFrame = () => {};
  const still = reducedMotion();

  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); });
  io.observe(canvas);
  const onVis = () => { if (!document.hidden) start(); };
  document.addEventListener('visibilitychange', onVis);

  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) { running = false; return; }
    const t = now / 1000, dt = Math.min(0.05, last ? t - last : 0.016);
    last = t;
    onFrame(still ? 0 : t, still ? 0 : dt);
    renderer.render(scene, camera);
    if (still) { running = false; return; }
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!running) { running = true; last = 0; raf = requestAnimationFrame(frame); } }

  return {
    THREE, scene, camera, renderer,
    setFrame(fn) { onFrame = fn; start(); },
    refresh: start,
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => m.dispose()); });
      renderer.dispose();
    },
  };
}

// The brand's quotation drop as a solid, glossy shape (same outline as the logo).
export function dropGeometry(depth = 7) {
  const s = new THREE.Shape();
  s.moveTo(12, -62);
  s.bezierCurveTo(12, -43, 23, -29, 44, -21);
  s.bezierCurveTo(35, -29, 31, -37, 30.5, -44);
  s.absarc(30, -62, 18, Math.PI / 2, -Math.PI, true);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 3.2, bevelSize: 2.6, bevelSegments: 8, curveSegments: 36 });
  g.center();
  g.scale(1 / 60, 1 / 60, 1 / 60);
  return g;
}

export function glossy(color, extra = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.18, sheen: 0.4, sheenColor: new THREE.Color('#FFFFFF'), ...extra });
}
