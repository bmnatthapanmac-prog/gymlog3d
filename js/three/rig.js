// Mannequin rig: low-poly body + named muscle meshes + two-bone IK.
// Conventions: Y up, character faces +Z, character's LEFT = +X. Bones hang along -Y.
import * as THREE from '../../vendor/three.module.min.js';

export const DIM = {
  ankleH: 0.08, thigh: 0.44, shin: 0.43, hipDrop: 0.06, hipX: 0.095,
  upperArm: 0.29, foreArm: 0.26, shoulderX: 0.2, shoulderY: 0.23,
  spineY: 0.02, chestY: 0.24, neckY: 0.27,
};
DIM.standY = DIM.ankleH + DIM.thigh + DIM.shin + DIM.hipDrop - 0.01;

export const MUSCLES = {
  chest:      { th: 'อก', en: 'Chest' },
  frontDelts: { th: 'ไหล่หน้า', en: 'Front delts' },
  sideDelts:  { th: 'ไหล่ข้าง', en: 'Side delts' },
  rearDelts:  { th: 'ไหล่หลัง', en: 'Rear delts' },
  biceps:     { th: 'ต้นแขนหน้า', en: 'Biceps' },
  triceps:    { th: 'ต้นแขนหลัง', en: 'Triceps' },
  forearms:   { th: 'แขนท่อนล่าง', en: 'Forearms' },
  abs:        { th: 'หน้าท้อง', en: 'Abs' },
  obliques:   { th: 'ท้องด้านข้าง', en: 'Obliques' },
  traps:      { th: 'บ่า', en: 'Traps' },
  upperBack:  { th: 'หลังกลาง', en: 'Upper back' },
  lats:       { th: 'ปีก', en: 'Lats' },
  lowerBack:  { th: 'หลังล่าง', en: 'Lower back' },
  glutes:     { th: 'ก้น', en: 'Glutes' },
  abductors:  { th: 'สะโพกด้านข้าง', en: 'Abductors' },
  quads:      { th: 'ต้นขาหน้า', en: 'Quads' },
  hamstrings: { th: 'ต้นขาหลัง', en: 'Hamstrings' },
  adductors:  { th: 'ขาหนีบ', en: 'Adductors' },
  calves:     { th: 'น่อง', en: 'Calves' },
};

export const STYLES = {
  // A: white low-poly mannequin, orange joints, only targeted muscles glow
  mannequin: { body: 0xe9ecf2, muscle: 0xe9ecf2, joint: 0xff7a1a, showJoints: true,
               primary: 0xff3b30, secondary: 0xff9a8a, emissive: 0.55 },
  // B: anatomy look, every muscle visible
  anatomy:   { body: 0x5b6474, muscle: 0x9c4a45, joint: 0x5b6474, showJoints: false,
               primary: 0xff3b30, secondary: 0xe0785f, emissive: 0.5 },
};

const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4();

function mat(color, flat = true) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, flatShading: flat });
}

function capsule(r, len, mt, seg = 6) {
  const g = new THREE.CapsuleGeometry(r, len, 3, seg);
  const m = new THREE.Mesh(g, mt);
  m.position.y = -len / 2; m.castShadow = true;
  return m;
}

function ellipsoid(sx, sy, sz, mt, detail = 1) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, detail), mt);
  m.scale.set(sx, sy, sz); m.castShadow = true;
  return m;
}

export class Rig {
  constructor(styleName = 'mannequin') {
    this.style = STYLES[styleName];
    this.root = new THREE.Group(); this.root.name = 'pelvis';
    this.bodyMat = mat(this.style.body);
    this.jointMat = mat(this.style.joint, false);
    this.muscleMeshes = [];                  // {mesh, name}
    this.joints = [];
    this._build();
    this.setStyle(styleName);
  }

  _node(parent, x, y, z, name) {
    const n = new THREE.Group(); n.name = name; n.position.set(x, y, z); parent.add(n); return n;
  }

  _joint(node, r) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), this.jointMat);
    node.add(s); this.joints.push(s);
  }

  _muscle(node, name, x, y, z, sx, sy, sz) {
    const m = ellipsoid(sx, sy, sz, mat(this.style.muscle), 1);
    m.position.set(x, y, z); m.userData.muscle = name; node.add(m);
    this.muscleMeshes.push({ mesh: m, name });
    return m;
  }

  _build() {
    const D = DIM, B = this.bodyMat, R = this.root;
    // pelvis
    const hips = ellipsoid(0.165, 0.1, 0.11, B); hips.position.y = -0.02; R.add(hips);
    this.spine = this._node(R, 0, D.spineY, 0, 'spine');
    const abd = ellipsoid(0.135, 0.15, 0.095, B); abd.position.y = 0.12; this.spine.add(abd);
    this.chest = this._node(this.spine, 0, D.chestY, 0, 'chest');
    const rib = ellipsoid(0.19, 0.17, 0.115, B); rib.position.y = 0.13; this.chest.add(rib);
    this.neck = this._node(this.chest, 0, D.neckY, 0, 'neck');
    const nk = capsule(0.045, 0.06, B); nk.position.y = 0.04; this.neck.add(nk);
    this.head = this._node(this.neck, 0, 0.09, 0, 'head');
    const hd = ellipsoid(0.095, 0.115, 0.105, B, 2); hd.position.set(0, 0.1, 0.01); this.head.add(hd);
    this._joint(this.neck, 0.03);

    this.arm = {}; this.leg = {};
    for (const side of ['L', 'R']) {
      const s = side === 'L' ? 1 : -1;
      // arm
      const sh = this._node(this.chest, s * D.shoulderX, D.shoulderY, 0, 'shoulder' + side);
      sh.add(capsule(0.043, D.upperArm - 0.06, B));
      const el = this._node(sh, 0, -D.upperArm, 0, 'elbow' + side);
      el.add(capsule(0.036, D.foreArm - 0.05, B));
      const hand = this._node(el, 0, -D.foreArm, 0, 'hand' + side);
      const hm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.075), B); hm.position.y = -0.045; hm.castShadow = true; hand.add(hm);
      this._joint(sh, 0.04); this._joint(el, 0.033); this._joint(hand, 0.026);
      this.arm[side] = { upper: sh, lower: el, hand, s };
      // leg
      const hip = this._node(R, s * D.hipX, -D.hipDrop, 0, 'hip' + side);
      hip.add(capsule(0.072, D.thigh - 0.09, B));
      const kn = this._node(hip, 0, -D.thigh, 0, 'knee' + side);
      kn.add(capsule(0.052, D.shin - 0.07, B));
      const an = this._node(kn, 0, -D.shin, 0, 'ankle' + side);
      const ft = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.06, 0.23), B); ft.position.set(0, -0.045, 0.06); ft.castShadow = true; an.add(ft);
      this._joint(hip, 0.055); this._joint(kn, 0.048); this._joint(an, 0.038);
      this.leg[side] = { upper: hip, lower: kn, foot: an, s };

      // muscles on limbs
      this._muscle(sh, 'frontDelts', 0, -0.03, 0.04, 0.042, 0.07, 0.032);
      this._muscle(sh, 'sideDelts', s * 0.042, -0.035, 0, 0.032, 0.07, 0.04);
      this._muscle(sh, 'rearDelts', 0, -0.03, -0.04, 0.042, 0.065, 0.03);
      this._muscle(sh, 'biceps', 0, -0.155, 0.033, 0.034, 0.095, 0.03);
      this._muscle(sh, 'triceps', 0, -0.14, -0.034, 0.036, 0.11, 0.032);
      this._muscle(el, 'forearms', 0, -0.085, 0.012, 0.04, 0.09, 0.034);
      this._muscle(hip, 'quads', 0, -0.2, 0.048, 0.064, 0.17, 0.045);
      this._muscle(hip, 'hamstrings', 0, -0.22, -0.046, 0.056, 0.16, 0.04);
      this._muscle(hip, 'adductors', -s * 0.045, -0.13, 0.005, 0.03, 0.12, 0.042);
      this._muscle(kn, 'calves', 0, -0.12, -0.042, 0.045, 0.1, 0.038);
      // torso muscles (paired)
      this._muscle(this.chest, 'chest', s * 0.085, 0.17, 0.088, 0.09, 0.065, 0.04);
      this._muscle(this.chest, 'lats', s * 0.125, 0.07, -0.06, 0.055, 0.13, 0.045);
      this._muscle(this.spine, 'obliques', s * 0.105, 0.1, 0.035, 0.035, 0.1, 0.06);
      this._muscle(R, 'glutes', s * 0.07, -0.05, -0.085, 0.08, 0.09, 0.05);
      this._muscle(R, 'abductors', s * 0.145, -0.01, -0.02, 0.04, 0.06, 0.055);
    }
    this._muscle(this.spine, 'abs', 0, 0.12, 0.08, 0.075, 0.12, 0.035);
    this._muscle(this.spine, 'lowerBack', 0, 0.1, -0.08, 0.07, 0.1, 0.03);
    this._muscle(this.chest, 'traps', 0, 0.255, -0.035, 0.13, 0.05, 0.055);
    this._muscle(this.chest, 'upperBack', 0, 0.15, -0.098, 0.1, 0.08, 0.03);
    this._joint(this.root, 0.05);
  }

  setStyle(name) {
    this.styleName = name; this.style = STYLES[name];
    this.bodyMat.color.set(this.style.body);
    this.jointMat.color.set(this.style.joint);
    for (const j of this.joints) j.visible = this.style.showJoints;
    this.setHighlight(this._prim || [], this._sec || []);
  }

  setHighlight(primary = [], secondary = []) {
    this._prim = primary; this._sec = secondary;
    const S = this.style;
    for (const { mesh, name } of this.muscleMeshes) {
      const m = mesh.material;
      let c = S.muscle, e = 0;
      if (primary.includes(name)) { c = S.primary; e = S.emissive; }
      else if (secondary.includes(name)) { c = S.secondary; e = S.emissive * 0.4; }
      m.color.set(c); m.emissive.set(c); m.emissiveIntensity = e;
    }
  }

  // heat: {muscle: 0..1} — used by the body map
  setHeat(heat, base = 0x3a4150, hot = 0xff5a2a) {
    const a = new THREE.Color(base), b = new THREE.Color(hot);
    for (const { mesh, name } of this.muscleMeshes) {
      const t = Math.min(1, heat[name] || 0);
      mesh.material.color.copy(a).lerp(b, t);
      mesh.material.emissive.copy(mesh.material.color); mesh.material.emissiveIntensity = t * 0.45;
    }
  }

  resetPose() {
    this.root.position.set(0, DIM.standY, 0); this.root.rotation.set(0, 0, 0);
    for (const n of [this.spine, this.chest, this.neck, this.head]) n.rotation.set(0, 0, 0);
    for (const s of ['L', 'R']) {
      for (const k of ['upper', 'lower', 'hand']) this.arm[s][k].rotation.set(0, 0, 0);
      for (const k of ['upper', 'lower', 'foot']) this.leg[s][k].rotation.set(0, 0, 0);
    }
    this.arm.L.upper.rotation.z = 0.12; this.arm.R.upper.rotation.z = -0.12;
  }

  // Apply a sampled pose (see poses.js for the format)
  apply(p) {
    this.resetPose();
    if (p.root) {
      if (p.root.p) this.root.position.fromArray(p.root.p);
      if (p.root.r) this.root.rotation.fromArray(p.root.r);
    }
    if (p.spine) this.spine.rotation.fromArray(p.spine);
    if (p.chest) this.chest.rotation.fromArray(p.chest);
    if (p.head) this.neck.rotation.fromArray(p.head);
    this.root.updateMatrixWorld(true);

    for (const s of ['L', 'R']) {
      const a = this.arm[s];
      if (p.arms && p.arms[s]) { a.upper.rotation.fromArray(p.arms[s][0]); if (p.arms[s][1]) a.lower.rotation.fromArray(p.arms[s][1]); }
      if (p.hands && p.hands[s]) this._ik(a, p.hands[s], DIM.upperArm, DIM.foreArm, 1);
      const l = this.leg[s];
      if (p.legs && p.legs[s]) { l.upper.rotation.fromArray(p.legs[s][0]); if (p.legs[s][1]) l.lower.rotation.fromArray(p.legs[s][1]); }
      if (p.feet && p.feet[s]) this._ik(l, p.feet[s], DIM.thigh, DIM.shin, -1);
      this.root.updateMatrixWorld(true);
      if (p.footFlat !== false && p.feet && p.feet[s]) {
        // keep sole parallel to the floor (only yaw from root)
        l.lower.getWorldQuaternion(_q).invert();
        const yaw = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.root.rotation.y, 0));
        l.foot.quaternion.copy(_q.multiply(yaw));
      }
      if (p.footPitch) l.foot.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(p.footPitch, 0, 0)));
    }
    this.root.updateMatrixWorld(true);
  }

  // target spec: {p:[x,y,z], pole:[x,y,z], frame:'world'|'chest'|'pelvis'}
  _ik(limb, spec, a, b, kind) {
    const up = limb.upper, parent = up.parent;
    parent.updateMatrixWorld(true);
    const T = new THREE.Vector3().fromArray(spec.p);
    if (spec.frame === 'chest') this.chest.localToWorld(T);
    else if (spec.frame === 'pelvis') this.root.localToWorld(T);
    else if (spec.frame === 'feet') T.add(this._feetMid || new THREE.Vector3());
    parent.worldToLocal(T).sub(up.position);
    const pq = parent.getWorldQuaternion(new THREE.Quaternion()).invert();
    const pole = new THREE.Vector3().fromArray(spec.pole || [0, 0, kind > 0 ? -1 : 1]).applyQuaternion(pq);

    let d = T.length();
    d = Math.min(Math.max(d, Math.abs(a - b) + 1e-3), a + b - 1e-4);
    const dir = T.clone().normalize();
    const cosA = (a * a + d * d - b * b) / (2 * a * d), sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    const perp = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir)));
    if (perp.lengthSq() < 1e-8) perp.set(0, 0, 1).sub(dir.clone().multiplyScalar(dir.z));
    perp.normalize();
    const u = dir.clone().multiplyScalar(cosA).add(perp.clone().multiplyScalar(sinA));
    const E = u.clone().multiplyScalar(a);
    const l = dir.clone().multiplyScalar(d).sub(E).normalize();

    // upper basis: -Y along bone, +Z = front of limb (biceps / quads side)
    const y = u.clone().negate();
    const z = (kind > 0 ? perp.clone().negate() : perp.clone());
    z.sub(y.clone().multiplyScalar(z.dot(y))).normalize();
    const x = new THREE.Vector3().crossVectors(y, z);
    _m.makeBasis(x, y, z); up.quaternion.setFromRotationMatrix(_m);

    const lLoc = l.applyQuaternion(up.quaternion.clone().invert());
    const y2 = lLoc.negate();
    const z2 = new THREE.Vector3(0, 0, 1); z2.sub(y2.clone().multiplyScalar(z2.dot(y2)));
    if (z2.lengthSq() < 1e-8) z2.set(0, 1, 0);
    z2.normalize();
    const x2 = new THREE.Vector3().crossVectors(y2, z2);
    _m.makeBasis(x2, y2, z2); limb.lower.quaternion.setFromRotationMatrix(_m);
  }

  handWorld(side, out = new THREE.Vector3()) {
    // grip point ≈ middle of the hand
    const h = this.arm[side].hand; h.updateMatrixWorld(true);
    return h.localToWorld(out.set(0, -0.04, 0));
  }
}
