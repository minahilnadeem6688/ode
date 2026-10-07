/*
 * The floating layer behind most screens: the two logo drops in glossy honey and cherry,
 * and a few pearls, drifting slowly and leaning towards the pointer. Kept to the edges so
 * text stays clear.
 */
import { createStage, dropGeometry, glossy } from './stage';

// x, y in screen fractions (-1…1), z depth, s size
const LAYOUTS = {
  welcome: [
    { k: 'drop', c: '#D4A55A', x: 0.86, y: 0.5, z: -0.4, s: 0.5, r: -0.35 },
    { k: 'drop', c: '#C4858C', x: 1.02, y: 0.3, z: -1.2, s: 0.42, r: -0.15 },
    { k: 'pearl', c: '#F7EFE3', x: -1.03, y: 0.06, z: 0.2, s: 0.16 },
    { k: 'pearl', c: '#F1D4D8', x: 1.0, y: -0.3, z: -0.6, s: 0.11 },
    { k: 'pearl', c: '#EED6C2', x: -0.98, y: -0.42, z: -1.4, s: 0.09 },
  ],
  tune: [
    { k: 'drop', c: '#D4A55A', x: 1.0, y: 0.62, z: -0.4, s: 0.55, r: -0.3 },
    { k: 'pearl', c: '#F1D4D8', x: 1.0, y: 0.36, z: 0.2, s: 0.16 },
  ],
  order: [
    { k: 'drop', c: '#D4A55A', x: -0.98, y: 0.62, z: -0.8, s: 0.7, r: 0.4 },
    { k: 'drop', c: '#C4858C', x: 0.98, y: 0.5, z: -0.5, s: 0.62, r: -0.4 },
    { k: 'pearl', c: '#F7EFE3', x: 0.8, y: -0.7, z: 0.3, s: 0.2 },
  ],
  quiet: [
    { k: 'pearl', c: '#F7EFE3', x: 0.95, y: 0.86, z: -0.4, s: 0.22 },
    { k: 'pearl', c: '#F1D4D8', x: -0.95, y: -0.85, z: -0.2, s: 0.18 },
    { k: 'drop', c: '#C4858C', x: 1.02, y: -0.55, z: -1.2, s: 0.5, r: -0.5 },
  ],
};

export function mountAmbient(canvas, variant = 'welcome') {
  const st = createStage(canvas, { fov: 30 });
  const { THREE, scene, camera } = st;
  camera.position.set(0, 0, 10);

  const dropG = dropGeometry();
  const pearlG = new THREE.SphereGeometry(1, 48, 32);
  const items = (LAYOUTS[variant] || LAYOUTS.quiet).map((d, i) => {
    const mesh = d.k === 'drop'
      ? new THREE.Mesh(dropG, glossy(d.c))
      : new THREE.Mesh(pearlG, glossy(d.c, { roughness: 0.18, iridescence: 0.55, iridescenceIOR: 1.4, sheen: 0.2 }));
    mesh.scale.setScalar(d.s);
    scene.add(mesh);
    return { mesh, d, phase: i * 1.7 };
  });

  // Where a screen fraction lands at a given depth, so the layout holds on any screen shape.
  const place = () => {
    const h = 2 * Math.tan((camera.fov * Math.PI) / 360);
    for (const it of items) {
      const dist = camera.position.z - it.d.z;
      it.base = new THREE.Vector3(it.d.x * (h * dist * camera.aspect) / 2, it.d.y * (h * dist) / 2, it.d.z);
    }
  };
  place();
  const ro = new ResizeObserver(place);
  ro.observe(canvas);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e) => {
    const p = e.touches ? e.touches[0] : e;
    pointer.tx = (p.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (p.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });

  st.setFrame((t) => {
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    for (const { mesh, d, phase, base } of items) {
      const depth = 1 + d.z * 0.15;
      mesh.position.set(
        base.x + Math.sin(t * 0.32 + phase) * 0.07 + pointer.x * 0.12 * depth,
        base.y + Math.sin(t * 0.45 + phase) * 0.12 - pointer.y * 0.1 * depth,
        base.z,
      );
      mesh.rotation.set(
        Math.sin(t * 0.3 + phase) * 0.18 + pointer.y * 0.15,
        (d.k === 'drop' ? -0.35 : 0) + Math.sin(t * 0.22 + phase) * 0.35 + pointer.x * 0.2,
        (d.r || 0) + Math.sin(t * 0.18 + phase) * 0.06,
      );
    }
  });

  return () => {
    ro.disconnect();
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('touchmove', onMove);
    st.dispose();
  };
}
