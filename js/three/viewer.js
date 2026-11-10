// 3D viewer: scene + rig + props + animation loop + muscle tapping.
import * as THREE from '../../vendor/three.module.min.js';
import { OrbitControls } from '../../vendor/OrbitControls.js';
import { Rig } from './rig.js';
import { MOTIONS, sample, lerpPose } from './poses.js';

const M = {
  steel: new THREE.MeshStandardMaterial({ color: 0xb8bec8, metalness: 0.85, roughness: 0.3 }),
  plate: new THREE.MeshStandardMaterial({ color: 0x23262d, metalness: 0.2, roughness: 0.6 }),
  pad: new THREE.MeshStandardMaterial({ color: 0x2b2f38, roughness: 0.8 }),
  frame: new THREE.MeshStandardMaterial({ color: 0x4a505c, metalness: 0.6, roughness: 0.4 }),
  cable: new THREE.MeshStandardMaterial({ color: 0x0d0e11, roughness: 0.5 }),
  mat: new THREE.MeshStandardMaterial({ color: 0x1f3b4d, roughness: 0.9 }),
  belt: new THREE.MeshStandardMaterial({ color: 0x17191e, roughness: 0.9 }),
};

const box = (w, h, d, mt, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mt); m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true; return m;
};
const cyl = (r, len, mt, axis = 'y', seg = 16) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mt);
  if (axis === 'x') m.rotation.z = Math.PI / 2; if (axis === 'z') m.rotation.x = Math.PI / 2;
  m.castShadow = true; return m;
};

const PROPS = {
  barbell(p) {
    const g = new THREE.Group(), L = p.short ? 1.2 : 2.0;
    g.add(cyl(0.014, L, M.steel, 'x', 10));
    if (!p.short) for (const x of [-0.78, 0.78]) {
      for (const [r, w, dx] of [[0.225, 0.045, 0], [0.17, 0.035, 0.045]]) { const c = cyl(r, w, M.plate, 'x', 28); c.position.x = x + Math.sign(x) * dx; g.add(c); }
      const c = cyl(0.03, 0.03, M.steel, 'x', 12); c.position.x = x - Math.sign(x) * 0.04; g.add(c);
    }
    return g;
  },
  dumbbell(p) {
    const g = new THREE.Group();
    g.add(cyl(0.015, 0.16, M.steel, 'x', 8));
    for (const x of [-0.1, 0.1]) { const c = cyl(0.06, 0.05, M.plate, 'x', 6); c.position.x = x; g.add(c); }
    if (p && p.vertical) g.rotation.z = Math.PI / 2;
    return g;
  },
  bench(p) {
    const g = new THREE.Group(), y = p.y ?? 0.46, z0 = p.z0 ?? -0.95, z1 = p.z1 ?? 0.3;
    g.add(box(0.3, 0.07, z1 - z0, M.pad, 0, y - 0.035, (z0 + z1) / 2));
    for (const z of [z0 + 0.12, z1 - 0.12]) { g.add(box(0.06, y - 0.07, 0.06, M.frame, 0, (y - 0.07) / 2, z)); g.add(box(0.36, 0.03, 0.06, M.frame, 0, 0.015, z)); }
    if (p.rotY) g.rotation.y = p.rotY;
    return g;
  },
  incline(p) {
    const g = new THREE.Group(), y = p.y ?? 0.46, a = p.angle ?? 0.55;
    g.add(box(0.3, 0.07, 0.42, M.pad, 0, y - 0.035, 0.2));                    // seat
    const back = box(0.3, 0.07, 0.95, M.pad); back.position.set(0, y + 0.2, -0.36); back.rotation.x = a; g.add(back);
    g.add(box(0.06, y, 0.06, M.frame, 0, y / 2, 0.3)); g.add(box(0.06, y + 0.3, 0.06, M.frame, 0, (y + 0.3) / 2, -0.55));
    g.add(box(0.4, 0.03, 1.0, M.frame, 0, 0.015, -0.1));
    return g;
  },
  seat(p) {
    const g = new THREE.Group(), h = p.h ?? 0.47;
    g.add(box(0.36, 0.07, 0.38, M.pad, 0, h - 0.035, 0.04));
    g.add(box(0.07, h - 0.07, 0.07, M.frame, 0, (h - 0.07) / 2, 0));
    g.add(box(0.45, 0.03, 0.45, M.frame, 0, 0.015, 0));
    if (p.back) {
      const b = box(0.34, p.upright ? 0.62 : 0.55, 0.07, M.pad); b.position.set(0, h + 0.33, -0.17); b.rotation.x = p.upright ? -0.05 : -0.18; g.add(b);
      g.add(box(0.05, h + 0.3, 0.05, M.frame, 0, (h + 0.3) / 2, -0.22));
    }
    return g;
  },
  roller() { return cyl(0.05, 0.42, M.pad, 'x', 14); },
  sled() {
    const g = new THREE.Group();
    g.add(box(0.4, 0.06, 0.3, M.pad, 0, 0.39, 0.08));                              // seat
    const back = box(0.4, 0.06, 0.7, M.pad); back.position.set(0, 0.62, -0.3); back.rotation.x = 0.52; g.add(back);
    g.add(box(0.06, 0.36, 0.06, M.frame, 0, 0.18, 0.05));
    g.add(box(0.06, 0.5, 0.06, M.frame, 0, 0.25, -0.5));
    for (const x of [-0.42, 0.42]) { const r = box(0.05, 0.05, 1.25); r.material = M.frame; r.position.set(x, 0.92, 0.62); r.rotation.x = -0.785; g.add(r); }
    g.add(box(0.95, 0.03, 1.9, M.frame, 0, 0.015, 0.3));
    return g;
  },
  plate45() { const g = new THREE.Group(); const pl = box(0.75, 0.55, 0.04, M.frame); pl.rotation.x = -0.785; pl.position.set(0, 0.03, 0.09); g.add(pl); return g; },
  box(p) { return box(0.55, p.h ?? 0.45, 0.45, M.pad, 0, (p.h ?? 0.45) / 2, 0); },
  tower() {
    const g = new THREE.Group();
    g.add(box(0.5, 2.3, 0.12, M.frame, 0, 1.15, 0)); g.add(box(0.7, 0.04, 0.5, M.frame, 0, 0.02, 0));
    return g;
  },
  pullbar(p) {
    const g = new THREE.Group(), y = p.y ?? 2.24;
    const b = cyl(0.016, 1.4, M.steel, 'x', 10); b.position.y = y; g.add(b);
    for (const x of [-0.7, 0.7]) { g.add(box(0.07, y + 0.1, 0.07, M.frame, x, (y + 0.1) / 2, -0.12)); g.add(box(0.07, 0.03, 0.8, M.frame, x, 0.015, -0.12)); }
    return g;
  },
  dipbars(p) {
    const g = new THREE.Group(), y = p.y ?? 1.12;
    for (const x of [-0.27, 0.27]) {
      const b = cyl(0.02, 0.6, M.steel, 'z', 10); b.position.set(x, y, 0.05); g.add(b);
      g.add(box(0.06, y, 0.06, M.frame, x * 1.25, y / 2, -0.3)); g.add(box(0.06, y, 0.06, M.frame, x * 1.25, y / 2, 0.4));
    }
    return g;
  },
  footplate() { const g = new THREE.Group(); const b = box(0.5, 0.35, 0.05, M.frame, 0, 0.2, 0); b.rotation.x = 0.3; g.add(b); g.add(box(0.6, 0.03, 1.4, M.frame, 0, 0.015, -0.5)); return g; },
  handles() {
    const g = new THREE.Group();
    for (const x of [-0.75, 0.75]) { g.add(box(0.1, 1.9, 0.1, M.frame, x, 0.95, -0.2)); }
    g.add(box(1.6, 0.08, 0.1, M.frame, 0, 1.9, -0.2));
    return g;
  },
  mat() { return box(0.7, 0.012, 1.9, M.mat, 0, 0.006, -0.3); },
  treadmill() {
    const g = new THREE.Group();
    g.add(box(0.75, 0.12, 1.7, M.frame, 0, 0.06, 0)); g.add(box(0.55, 0.01, 1.55, M.belt, 0, 0.125, 0));
    for (const x of [-0.36, 0.36]) { const u = box(0.05, 1.1, 0.05, M.frame); u.position.set(x, 0.65, 0.78); g.add(u); }
    g.add(box(0.8, 0.25, 0.12, M.frame, 0, 1.2, 0.8));
    return g;
  },
  rack() {
    const g = new THREE.Group();
    for (const x of [-0.62, 0.62]) {
      g.add(box(0.06, 2.2, 0.06, M.frame, x, 1.1, -0.55));
      g.add(box(0.05, 0.04, 0.55, M.frame, x, 0.62, -0.3));
      g.add(box(0.05, 0.08, 0.1, M.frame, x, 1.38, -0.5));
    }
    g.add(box(1.3, 0.05, 0.06, M.frame, 0, 2.2, -0.55));
    return g;
  },
};

export function createViewer(container, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 50);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.enablePan = false; controls.enableZoom = opts.zoom !== false;
  controls.minDistance = 1.2; controls.maxDistance = 6.5; controls.maxPolarAngle = Math.PI * 0.55;

  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a1c22, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(2.5, 4, 3); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = key.shadow.camera.bottom = -2.2;
  key.shadow.camera.right = key.shadow.camera.top = 2.2; key.shadow.radius = 4; key.shadow.bias = -0.0005;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff9a50, 1.0); rim.position.set(-3, 2, -3); scene.add(rim);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(2.4, 64), new THREE.ShadowMaterial({ opacity: 0.35 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.17, 96), new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.35 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.002; scene.add(ring);
  const grid = new THREE.PolarGridHelper(2.2, 12, 6, 64, 0x2c313b, 0x2c313b); grid.position.y = 0.001; scene.add(grid);

  const rig = new Rig(opts.style || 'mannequin');
  scene.add(rig.root);

  let motion = null, props = [], speed = 1, playing = true, t = 0, last = performance.now();
  let tapCb = null, visible = true, raf = 0, frozen = null;

  function clearProps() { for (const p of props) p.obj.parent && p.obj.parent.remove(p.obj); props = []; }

  function addProp(spec, side) {
    const make = PROPS[spec.type === 'dumbbells' ? 'dumbbell' : spec.type];
    if (!make) return;
    const obj = make(spec);
    const node = spec.attach && !['hands', 'feet'].includes(spec.attach) ? rig.root.getObjectByName(spec.attach) || (spec.attach === 'pelvis' && rig.root) : null;
    if (node) { node.add(obj); if (spec.at) obj.position.fromArray(spec.at); }
    else { scene.add(obj); if (spec.at) obj.position.fromArray(spec.at); }
    props.push({ obj, spec, side });
  }

  function setMotion(nameOrSpec, highlight) {
    motion = typeof nameOrSpec === 'string' ? (MOTIONS[nameOrSpec] || MOTIONS.stand) : nameOrSpec;
    clearProps();
    for (const pr of motion.props || []) {
      if (pr.type === 'dumbbells') { addProp(pr, 'L'); addProp(pr, 'R'); }
      else if (pr.type === 'cable') {
        const line = cyl(0.006, 1, M.cable, 'y', 6); scene.add(line); props.push({ obj: line, spec: pr });
        const pulley = cyl(0.04, 0.03, M.steel, 'x', 14); pulley.position.fromArray(pr.anchor); scene.add(pulley); props.push({ obj: pulley, spec: { type: 'static' } });
      } else addProp(pr);
    }
    if (highlight) rig.setHighlight(highlight.primary, highlight.secondary);
    const c = motion.camera || MOTIONS.stand.camera;
    if (!opts.keepCamera) { camera.position.fromArray(c.pos); controls.target.fromArray(c.target); }
    t = 0; frozen = null; draw(0);
  }

  const hL = new THREE.Vector3(), hR = new THREE.Vector3(), mid = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  function draw(dt) {
    if (motion && playing) t += dt * speed;
    if (motion) {
      rig.apply(frozen != null ? lerpPose(motion.start, motion.end, frozen) : sample(motion, t));
      rig.handWorld('L', hL); rig.handWorld('R', hR); mid.copy(hL).add(hR).multiplyScalar(0.5);
      for (const p of props) {
        const s = p.spec;
        if (s.type === 'dumbbells') p.obj.position.copy(p.side === 'L' ? hL : hR);
        else if (s.attach === 'hands') p.obj.position.copy(mid);
        else if (s.attach === 'feet') {
          rig.leg.L.foot.getWorldPosition(hL); rig.leg.R.foot.getWorldPosition(hR);
          p.obj.position.copy(hL).add(hR).multiplyScalar(0.5);
        } else if (s.type === 'cable') {
          const a = new THREE.Vector3().fromArray(s.anchor), d = mid.clone().sub(a), len = d.length();
          p.obj.position.copy(a).addScaledVector(d, 0.5); p.obj.scale.set(1, len, 1);
          p.obj.quaternion.setFromUnitVectors(up, d.normalize());
        }
      }
    }
    controls.update();
    renderer.render(scene, camera);
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!visible || document.hidden) return;
    draw(dt);
  }

  function resize() {
    const w = container.clientWidth || 300, h = container.clientHeight || 300;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(container); resize();
  const io = new IntersectionObserver((e) => { visible = e[0].isIntersecting; }); io.observe(container);

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!tapCb || !down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(rig.muscleMeshes.map((m) => m.mesh), false)[0];
    tapCb(hit ? hit.object.userData.muscle : null);
  });

  raf = requestAnimationFrame(loop);
  setMotion(opts.motion || 'stand', opts.highlight);

  return {
    rig, setMotion,
    setStyle: (s) => rig.setStyle(s),
    setHighlight: (p, s) => rig.setHighlight(p, s),
    setHeat: (h) => rig.setHeat(h),
    setSpeed: (s) => { speed = s; },
    setPlaying: (p) => { playing = p; },
    freeze: (b) => { frozen = b; draw(0); },
    setAutoRotate: (on) => { controls.autoRotate = on; controls.autoRotateSpeed = 1.5; },
    view: (pos, target) => { camera.position.fromArray(pos); if (target) controls.target.fromArray(target); draw(0); },
    onTap: (cb) => { tapCb = cb; },
    dispose: () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); controls.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); },
  };
}
