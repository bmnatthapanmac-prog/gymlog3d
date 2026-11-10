// Motion library: each motion = two key poses (start → end) + timing + props + camera.
// Pose fields: root{p,r} · spine · chest · head (euler arrays) · hands{L,R:{p,pole,frame}} · feet{L,R:{p,pole}}
// arms/legs (FK euler [upper, lower]) · footFlat · footPitch. Metres, world frame unless `frame` is set.
// World: Y up, the lifter faces +Z, lifter's left = +X.
import { DIM } from './rig.js';

const SY = DIM.standY;              // pelvis height when standing
const PI = Math.PI;
const A = DIM.ankleH;
const TORSO = DIM.spineY + DIM.chestY + DIM.shoulderY;   // pelvis → shoulder line

// Missing numbers / euler arrays on either side count as neutral (0), so a key that only
// exists in one pose blends in smoothly instead of snapping.
export function lerpPose(a, b, t) {
  if (a === undefined) a = neutral(b);
  if (b === undefined) b = neutral(a);
  if (typeof a === 'number') return a + ((typeof b === 'number' ? b : a) - a) * t;
  if (Array.isArray(a)) return a.map((v, i) => (typeof v === 'number' ? v + ((b[i] ?? v) - v) * t : lerpPose(v, b[i], t)));
  if (a && typeof a === 'object') {
    const o = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b || {})])) o[k] = lerpPose(a[k], b ? b[k] : undefined, t);
    return o;
  }
  return t < 0.5 ? a : b;
}
function neutral(v) {
  if (typeof v === 'number') return 0;
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'number' ? 0 : x));
  return v;   // objects (hands/feet targets) and flags: copy the other side
}

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function phase(motion, t) {
  const { down = 1.4, hold = 0.25, up = 0.9, rest = 0.6 } = motion.timing || {};
  const T = down + hold + up + rest; let x = t % T;
  if (x < down) return ease(x / down); x -= down;
  if (x < hold) return 1; x -= hold;
  if (x < up) return 1 - ease(x / up);
  return 0;
}

export function sample(motion, t) { return lerpPose(motion.start, motion.end, phase(motion, t)); }

// ---- helpers ----------------------------------------------------------------
const pair = (x, y, z, frame, pole) => ({
  L: { p: [x, y, z], frame, pole: pole && [pole[0], pole[1], pole[2]] },
  R: { p: [-x, y, z], frame, pole: pole && [-pole[0], pole[1], pole[2]] },
});
const stance = (w = 0.15, z = 0.02, pole = [0.3, 0, 1]) => pair(w, A, z, 'world', pole);
const S = (pose) => ({ ...pose });                      // readability
const hang = (z = 0.04) => pair(0.235, -0.29, z, 'chest', [0.2, 0, -1]);   // arms hanging (chest frame)

// seated upright on a seat of height h (thighs ~horizontal, feet on the floor)
const SEAT = 0.47;
const seatRoot = (h = SEAT, z = 0, lean = 0) => ({ p: [0, h + 0.09, z], r: [lean, 0, 0] });
const seatFeet = (z = 0.46, w = 0.2) => pair(w, A, z, 'world', [0.2, 1, 0.6]);
const seatedShoulderY = (h = SEAT) => h + 0.09 + TORSO;

// lying supine on a flat bench (head toward -Z)
const BENCH = 0.46;
const lieRoot = { p: [0, BENCH + 0.1, 0.05], r: [-PI / 2, 0, 0] };
const lieShY = BENCH + 0.1, lieShZ = 0.05 - TORSO;
const lieFeet = pair(0.3, A, 0.52, 'world', [0.3, 1, 0.4]);

// incline bench (~30°)
const INC = -PI / 2 + 0.55;
const incRoot = { p: [0, 0.53, 0.15], r: [INC, 0, 0] };
const incShY = 0.53 + TORSO * Math.cos(INC), incShZ = 0.15 + TORSO * Math.sin(INC);

const legsSeated = (knee = PI / 2, abd = 0) => ({ L: [[-PI / 2, 0, abd], [knee, 0, 0]], R: [[-PI / 2, 0, -abd], [knee, 0, 0]] });

const CAM_SIDE = { pos: [3.0, 1.45, 2.4], target: [0, 0.85, -0.05] };
const CAM_FRONT = { pos: [1.6, 1.4, 3.2], target: [0, 1.0, 0] };
const CAM_BENCH = { pos: [2.5, 1.7, 1.5], target: [0, 0.6, -0.25] };
const CAM_SEAT = { pos: [2.6, 1.5, 2.3], target: [0, 0.9, 0] };
const CAM_CABLE = { pos: [3.3, 1.5, -0.9], target: [0, 1.05, 0.25] };
const CAM_FLOOR = { pos: [2.6, 1.3, 1.2], target: [0, 0.3, -0.2] };

const DB = [{ type: 'dumbbells' }];
const BB = [{ type: 'barbell', attach: 'hands' }];

// ---- motions ----------------------------------------------------------------
export const MOTIONS = {
  stand: {
    timing: { down: 2, hold: 0, up: 2, rest: 0 },
    start: { root: { p: [0, SY, 0] }, feet: stance(0.11), hands: hang(0.03) },
    end: { root: { p: [0, SY - 0.006, 0] }, chest: [-0.02, 0, 0], feet: stance(0.11), hands: hang(0.04) },
    camera: { pos: [0, 1.15, 3.2], target: [0, 0.95, 0] },
  },

  // ---------- squat family
  backSquat: {
    timing: { down: 1.5, hold: 0.25, up: 0.95, rest: 0.6 },
    start: { root: { p: [0, SY, 0], r: [0.06, 0, 0] }, spine: [0.02, 0, 0], head: [-0.05, 0, 0], feet: stance(0.17), hands: pair(0.36, 0.25, -0.13, 'chest', [0.3, -1, -0.5]) },
    end: { root: { p: [0, 0.6, -0.2], r: [0.42, 0, 0] }, spine: [0.12, 0, 0], chest: [0.05, 0, 0], head: [-0.42, 0, 0], feet: stance(0.17), hands: pair(0.36, 0.25, -0.13, 'chest', [0.3, -1, -0.5]) },
    props: [{ type: 'barbell', attach: 'chest', at: [0, 0.27, -0.14] }, { type: 'rack' }],
    camera: CAM_SIDE,
  },
  frontSquat: {
    timing: { down: 1.5, hold: 0.25, up: 0.95, rest: 0.6 },
    start: { root: { p: [0, SY, 0] }, feet: stance(0.16), hands: pair(0.2, 0.25, 0.2, 'chest', [0.3, -0.2, 1]) },
    end: { root: { p: [0, 0.58, -0.12], r: [0.25, 0, 0] }, spine: [0.05, 0, 0], head: [-0.25, 0, 0], feet: stance(0.16), hands: pair(0.2, 0.25, 0.2, 'chest', [0.3, -0.2, 1]) },
    props: [{ type: 'barbell', attach: 'chest', at: [0, 0.25, 0.13] }, { type: 'rack' }],
    camera: CAM_SIDE,
  },
  gobletSquat: {
    timing: { down: 1.5, hold: 0.25, up: 0.95, rest: 0.6 },
    start: { root: { p: [0, SY, 0] }, feet: stance(0.17), hands: pair(0.05, 0.12, 0.22, 'chest', [0.4, -1, 0]) },
    end: { root: { p: [0, 0.56, -0.12], r: [0.3, 0, 0] }, spine: [0.05, 0, 0], head: [-0.3, 0, 0], feet: stance(0.17), hands: pair(0.05, 0.12, 0.22, 'chest', [0.4, -1, 0]) },
    props: [{ type: 'dumbbell', attach: 'hands', vertical: true }],
    camera: CAM_SIDE,
  },
  legPress: {
    timing: { down: 1.5, hold: 0.2, up: 0.9, rest: 0.5 },
    start: { root: { p: [0, 0.48, 0], r: [-1.05, 0, 0] }, head: [0.5, 0, 0], footFlat: false, footPitch: -0.9,
      feet: pair(0.15, 0.98, 0.72, 'world', [0.3, 1, 0]), hands: pair(0.26, -0.02, 0.12, 'pelvis', [0.4, 0, -1]) },
    end: { root: { p: [0, 0.48, 0], r: [-1.05, 0, 0] }, head: [0.5, 0, 0], footFlat: false, footPitch: -0.2,
      feet: pair(0.15, 0.74, 0.42, 'world', [0.3, 1, 0]), hands: pair(0.26, -0.02, 0.12, 'pelvis', [0.4, 0, -1]) },
    props: [{ type: 'sled' }, { type: 'plate45', attach: 'feet' }],
    camera: { pos: [3.3, 1.3, 0.6], target: [0, 0.65, 0.25] },
  },
  hipThrust: {
    timing: { down: 1.2, hold: 0.2, up: 0.8, rest: 0.8 },
    start: { root: { p: [0, 0.3, -0.04], r: [-PI / 2 + 0.6, 0, 0] }, head: [0.6, 0, 0], feet: pair(0.2, A, 0.44, 'world', [0.3, 1, 0.5]), hands: pair(0.27, -0.01, 0.17, 'pelvis', [1, 0.6, 0]) },
    end: { root: { p: [0, 0.58, 0], r: [-PI / 2 + 0.02, 0, 0] }, head: [0.9, 0, 0], feet: pair(0.2, A, 0.44, 'world', [0.3, 1, 0.5]), hands: pair(0.27, -0.01, 0.17, 'pelvis', [1, 0.6, 0]) },
    props: [{ type: 'barbell', attach: 'pelvis', at: [0, -0.02, 0.16] }, { type: 'bench', y: 0.42, rotY: PI / 2, z0: -0.6, z1: 0.6, at: [0, 0, -0.62] }],
    camera: { pos: [2.6, 1.2, 1.6], target: [0, 0.45, -0.1] },
  },
  splitSquat: {
    timing: { down: 1.4, hold: 0.2, up: 0.9, rest: 0.5 },
    start: { root: { p: [0, 0.93, 0] }, footFlat: false,
      feet: { L: { p: [0.13, A, 0.36], pole: [0.2, 0, 1] }, R: { p: [-0.13, 0.5, -0.5], pole: [0, -1, 1] } }, hands: hang(0.03) },
    end: { root: { p: [0, 0.6, -0.02], r: [0.12, 0, 0] }, footFlat: false,
      feet: { L: { p: [0.13, A, 0.36], pole: [0.2, 0, 1] }, R: { p: [-0.13, 0.5, -0.5], pole: [0, -1, 1] } }, hands: hang(0.03) },
    props: [...DB, { type: 'bench', y: 0.46, z0: -0.85, z1: -0.25 }],
    camera: CAM_SIDE,
  },
  lunge: {
    timing: { down: 1.2, hold: 0.15, up: 0.8, rest: 0.4 },
    start: { root: { p: [0, SY - 0.03, -0.05] }, feet: { L: { p: [0.12, A, 0.38], pole: [0.2, 0, 1] }, R: { p: [-0.12, A, -0.42], pole: [0, 0, 1] } }, footPitch: 0, hands: hang(0.03) },
    end: { root: { p: [0, 0.55, -0.02] }, feet: { L: { p: [0.12, A, 0.38], pole: [0.2, 0, 1] }, R: { p: [-0.12, A, -0.42], pole: [0, -1, 1] } }, hands: hang(0.03) },
    props: DB, camera: CAM_SIDE,
  },
  stepUp: {
    timing: { down: 1.1, hold: 0.3, up: 1.1, rest: 0.3 },
    start: { root: { p: [0, SY - 0.02, -0.12] }, feet: { L: { p: [0.12, 0.45 + A, 0.28], pole: [0.2, 0, 1] }, R: { p: [-0.12, A, -0.1], pole: [0, 0, 1] } }, hands: hang(0.03) },
    end: { root: { p: [0, 0.45 + SY - 0.02, 0.25] }, feet: { L: { p: [0.12, 0.45 + A, 0.28], pole: [0.2, 0, 1] }, R: { p: [-0.12, 0.45 + A + 0.06, 0.2], pole: [0, 0, 1] } }, hands: hang(0.03) },
    props: [...DB, { type: 'box', h: 0.45, at: [0, 0, 0.3] }],
    camera: CAM_SIDE,
  },
  legExtension: {
    timing: { down: 0.9, hold: 0.4, up: 1.4, rest: 0.4 },
    start: { root: seatRoot(0.5), chest: [-0.12, 0, 0], legs: legsSeated(PI / 2), footFlat: false, hands: pair(0.27, -0.02, 0.08, 'pelvis', [0.3, 0, -1]) },
    end: { root: seatRoot(0.5), chest: [-0.12, 0, 0], legs: legsSeated(0.08), footFlat: false, hands: pair(0.27, -0.02, 0.08, 'pelvis', [0.3, 0, -1]) },
    props: [{ type: 'seat', h: 0.5, back: true }, { type: 'roller', attach: 'kneeL', at: [-0.095, -0.36, 0.07] }],
    camera: CAM_SEAT,
  },
  legCurl: {
    timing: { down: 0.9, hold: 0.4, up: 1.4, rest: 0.4 },
    start: { root: seatRoot(0.5), chest: [-0.15, 0, 0], legs: legsSeated(0.1), footFlat: false, hands: pair(0.27, -0.02, 0.08, 'pelvis', [0.3, 0, -1]) },
    end: { root: seatRoot(0.5), chest: [-0.15, 0, 0], legs: legsSeated(1.75), footFlat: false, hands: pair(0.27, -0.02, 0.08, 'pelvis', [0.3, 0, -1]) },
    props: [{ type: 'seat', h: 0.5, back: true }, { type: 'roller', attach: 'kneeL', at: [-0.095, -0.36, -0.07] }],
    camera: CAM_SEAT,
  },
  calfRaise: {
    timing: { down: 0.8, hold: 0.6, up: 1.2, rest: 0.3 },
    start: { root: { p: [0, SY, 0] }, feet: stance(0.12), hands: hang(0.03) },
    end: { root: { p: [0, SY + 0.085, 0] }, feet: pair(0.12, A + 0.085, 0.02, 'world', [0.3, 0, 1]), footPitch: 0.62, hands: hang(0.03) },
    props: DB, camera: CAM_SIDE,
  },
  seatedCalfRaise: {
    timing: { down: 0.8, hold: 0.6, up: 1.2, rest: 0.3 },
    start: { root: seatRoot(), feet: seatFeet(0.4, 0.14), hands: pair(0.12, -0.05, 0.38, 'pelvis', [0.4, 0, -1]) },
    end: { root: seatRoot(), feet: pair(0.14, A + 0.07, 0.4, 'world', [0.2, 1, 0.6]), footPitch: 0.55, hands: pair(0.12, 0.02, 0.38, 'pelvis', [0.4, 0, -1]) },
    props: [{ type: 'seat', h: SEAT }], camera: CAM_SEAT,
  },
  adductor: {
    timing: { down: 1.2, hold: 0.4, up: 1.0, rest: 0.4 },
    start: { root: seatRoot(0.5), chest: [-0.15, 0, 0], legs: legsSeated(PI / 2, 0.62), footFlat: false, hands: pair(0.27, -0.02, 0.08, 'pelvis', [0.3, 0, -1]) },
    end: { root: seatRoot(0.5), chest: [-0.15, 0, 0], legs: legsSeated(PI / 2, 0.06), footFlat: false, hands: pair(0.27, -0.02, 0.08, 'pelvis', [0.3, 0, -1]) },
    props: [{ type: 'seat', h: 0.5, back: true }], camera: { pos: [0.6, 1.9, 3.0], target: [0, 0.6, 0.2] },
  },
  abductor: {
    timing: { down: 1.2, hold: 0.4, up: 1.0, rest: 0.4 },
    start: { root: seatRoot(0.5), chest: [-0.15, 0, 0], legs: legsSeated(PI / 2, 0.06), footFlat: false, hands: pair(0.27, -0.02, 0.08, 'pelvis', [0.3, 0, -1]) },
    end: { root: seatRoot(0.5), chest: [-0.15, 0, 0], legs: legsSeated(PI / 2, 0.62), footFlat: false, hands: pair(0.27, -0.02, 0.08, 'pelvis', [0.3, 0, -1]) },
    props: [{ type: 'seat', h: 0.5, back: true }], camera: { pos: [0.6, 1.9, 3.0], target: [0, 0.6, 0.2] },
  },

  // ---------- hinge
  rdl: {
    timing: { down: 1.6, hold: 0.2, up: 1.0, rest: 0.5 },
    start: { root: { p: [0, SY - 0.01, 0] }, feet: stance(0.12), hands: pair(0.24, 0.78, 0.1, 'world', [0.2, 0, -1]) },
    end: { root: { p: [0, 0.93, -0.22], r: [1.05, 0, 0] }, head: [-0.6, 0, 0], feet: stance(0.12), hands: pair(0.24, 0.6, 0.23, 'world', [0.2, 0, -1]) },
    props: BB, camera: CAM_SIDE,
  },
  dbRdl: null, // filled below (same motion with dumbbells)

  // ---------- presses
  benchPress: {
    timing: { down: 1.4, hold: 0.3, up: 0.8, rest: 0.6 },
    start: { root: lieRoot, feet: lieFeet, hands: pair(0.38, lieShY + 0.5, lieShZ + 0.03, 'world', [1, -0.8, 0.15]) },
    end: { root: lieRoot, feet: lieFeet, hands: pair(0.38, lieShY + 0.17, lieShZ + 0.12, 'world', [1, -0.8, 0.15]) },
    props: [...BB, { type: 'bench', y: BENCH }], camera: CAM_BENCH,
  },
  dbBench: {
    timing: { down: 1.4, hold: 0.3, up: 0.8, rest: 0.6 },
    start: { root: lieRoot, feet: lieFeet, hands: pair(0.22, lieShY + 0.52, lieShZ + 0.03, 'world', [1, -0.8, 0.15]) },
    end: { root: lieRoot, feet: lieFeet, hands: pair(0.36, lieShY + 0.15, lieShZ + 0.1, 'world', [1, -0.8, 0.15]) },
    props: [...DB, { type: 'bench', y: BENCH }], camera: CAM_BENCH,
  },
  inclinePress: {
    timing: { down: 1.4, hold: 0.3, up: 0.8, rest: 0.6 },
    start: { root: incRoot, feet: pair(0.28, A, 0.62, 'world', [0.3, 1, 0.4]), hands: pair(0.2, incShY + 0.5, incShZ + 0.05, 'world', [1, -0.8, 0]) },
    end: { root: incRoot, feet: pair(0.28, A, 0.62, 'world', [0.3, 1, 0.4]), hands: pair(0.34, incShY + 0.12, incShZ + 0.14, 'world', [1, -0.8, 0]) },
    props: [...DB, { type: 'incline', y: BENCH, angle: 0.55 }], camera: CAM_BENCH,
  },
  shoulderPress: {
    timing: { down: 1.3, hold: 0.2, up: 0.9, rest: 0.5 },
    start: { root: seatRoot(), feet: seatFeet(), hands: pair(0.32, seatedShoulderY() + 0.06, 0.05, 'world', [1, -1, 0]) },
    end: { root: seatRoot(), feet: seatFeet(), hands: pair(0.18, seatedShoulderY() + 0.52, 0.02, 'world', [1, -0.3, 0]) },
    props: [...DB, { type: 'seat', h: SEAT, back: true, upright: true }], camera: CAM_FRONT,
  },
  arnoldPress: {
    timing: { down: 1.5, hold: 0.2, up: 1.1, rest: 0.5 },
    start: { root: seatRoot(), feet: seatFeet(), hands: pair(0.13, seatedShoulderY() + 0.1, 0.14, 'world', [0.2, -1, 0.6]) },
    end: { root: seatRoot(), feet: seatFeet(), hands: pair(0.18, seatedShoulderY() + 0.52, 0.02, 'world', [1, -0.3, 0]) },
    props: [...DB, { type: 'seat', h: SEAT, back: true, upright: true }], camera: CAM_FRONT,
  },
  lateralRaise: {
    timing: { down: 1.0, hold: 0.3, up: 1.4, rest: 0.3 },
    start: { root: { p: [0, SY, 0] }, feet: stance(0.12), hands: pair(0.27, 0.98, 0.07, 'world', [0.3, 0, -1]) },
    end: { root: { p: [0, SY, 0] }, feet: stance(0.12), hands: pair(0.72, 1.44, 0.1, 'world', [0, 1, -0.3]) },
    props: DB, camera: CAM_FRONT,
  },
  fly: {
    timing: { down: 1.2, hold: 0.4, up: 1.4, rest: 0.3 },
    start: { root: seatRoot(), feet: seatFeet(), hands: pair(0.66, seatedShoulderY() - 0.06, 0.08, 'world', [0.2, -0.3, -1]) },
    end: { root: seatRoot(), feet: seatFeet(), hands: pair(0.09, seatedShoulderY() - 0.06, 0.48, 'world', [1, -0.3, -0.2]) },
    props: [{ type: 'seat', h: SEAT, back: true, upright: true }, { type: 'handles' }], camera: { pos: [1.4, 1.9, 2.8], target: [0, 1.0, 0.1] },
  },
  dip: {
    timing: { down: 1.3, hold: 0.2, up: 0.9, rest: 0.4 },
    start: { root: { p: [0, 1.15, 0], r: [0.12, 0, 0] }, legs: { L: [[-0.3, 0, 0], [1.2, 0, 0]], R: [[-0.3, 0, 0], [1.2, 0, 0]] }, footFlat: false, hands: pair(0.27, 1.12, 0.05, 'world', [0.2, 0, -1]) },
    end: { root: { p: [0, 0.85, 0.06], r: [0.35, 0, 0] }, legs: { L: [[-0.3, 0, 0], [1.2, 0, 0]], R: [[-0.3, 0, 0], [1.2, 0, 0]] }, footFlat: false, hands: pair(0.27, 1.12, 0.05, 'world', [0.2, 0.2, -1]) },
    props: [{ type: 'dipbars', y: 1.12 }], camera: CAM_SIDE,
  },

  // ---------- arms
  curl: {
    timing: { down: 0.9, hold: 0.3, up: 1.4, rest: 0.3 },
    start: { root: { p: [0, SY, 0] }, feet: stance(0.12), hands: pair(0.22, 0.96, 0.09, 'world', [0.1, 0, -1]) },
    end: { root: { p: [0, SY, 0] }, feet: stance(0.12), hands: pair(0.21, 1.33, 0.24, 'world', [0.1, -0.3, -1]) },
    props: BB, camera: CAM_SIDE,
  },
  dbCurl: null, // filled below
  pushdown: {
    timing: { down: 0.9, hold: 0.3, up: 1.3, rest: 0.3 },
    start: { root: { p: [0, SY - 0.02, 0], r: [0.12, 0, 0] }, feet: stance(0.13), hands: pair(0.07, 1.22, 0.3, 'world', [0.1, 0, -1]) },
    end: { root: { p: [0, SY - 0.02, 0], r: [0.12, 0, 0] }, feet: stance(0.13), hands: pair(0.1, 0.86, 0.26, 'world', [0.1, 0, -1]) },
    props: [{ type: 'cable', anchor: [0, 2.1, 0.55] }, { type: 'tower', at: [0, 0, 0.62] }], camera: CAM_CABLE,
  },
  overheadTriceps: {
    timing: { down: 1.3, hold: 0.3, up: 0.9, rest: 0.3 },
    start: { root: { p: [0, SY, 0] }, feet: stance(0.13), hands: pair(0.05, 2.0, 0.03, 'world', [0.25, 1, 0.2]) },
    end: { root: { p: [0, SY, 0] }, feet: stance(0.13), hands: pair(0.05, 1.5, -0.2, 'world', [0.25, 1, 0.2]) },
    props: [{ type: 'dumbbell', attach: 'hands', vertical: true }], camera: CAM_SIDE,
  },

  // ---------- pulls
  latPulldown: {
    timing: { down: 1.0, hold: 0.3, up: 1.4, rest: 0.4 },
    start: { root: seatRoot(), chest: [-0.05, 0, 0], feet: seatFeet(0.36), hands: pair(0.5, 1.96, 0.08, 'world', [1, -0.3, -0.2]) },
    end: { root: seatRoot(), chest: [-0.2, 0, 0], head: [0.1, 0, 0], feet: seatFeet(0.36), hands: pair(0.4, 1.14, 0.2, 'world', [1, -1, -0.3]) },
    props: [{ type: 'barbell', attach: 'hands', short: true }, { type: 'cable', anchor: [0, 2.5, 0.12], to: 'hands' }, { type: 'seat', h: SEAT }, { type: 'tower', at: [0, 0, -0.35] }],
    camera: CAM_SEAT,
  },
  pullUp: {
    timing: { down: 1.0, hold: 0.3, up: 1.5, rest: 0.4 },
    start: { root: { p: [0, 2.24 - 0.53 - TORSO, -0.02] }, legs: { L: [[-0.25, 0, 0], [0.6, 0, 0]], R: [[-0.25, 0, 0], [0.6, 0, 0]] }, footFlat: false, hands: pair(0.4, 2.24, 0, 'world', [1, -0.2, 0]) },
    end: { root: { p: [0, 2.24 - 0.2 - TORSO, -0.06], r: [-0.08, 0, 0] }, head: [-0.15, 0, 0], legs: { L: [[-0.3, 0, 0], [0.7, 0, 0]], R: [[-0.3, 0, 0], [0.7, 0, 0]] }, footFlat: false, hands: pair(0.4, 2.24, 0, 'world', [1, -1, 0]) },
    props: [{ type: 'pullbar', y: 2.24 }], camera: { pos: [3.0, 1.8, 2.6], target: [0, 1.5, 0] },
  },
  cableRow: {
    timing: { down: 1.0, hold: 0.4, up: 1.4, rest: 0.3 },
    start: { root: seatRoot(0.42, -0.1, 0.25), spine: [0.15, 0, 0], feet: pair(0.15, 0.24, 0.55, 'world', [0.3, 1, 0.3]), footFlat: false, footPitch: -0.9, hands: pair(0.12, 0.92, 0.72, 'world', [0.2, -1, -0.3]) },
    end: { root: seatRoot(0.42, -0.1, -0.05), spine: [-0.02, 0, 0], feet: pair(0.15, 0.24, 0.55, 'world', [0.3, 1, 0.3]), footFlat: false, footPitch: -0.9, hands: pair(0.13, 0.9, 0.18, 'world', [0.2, 0, -1]) },
    props: [{ type: 'cable', anchor: [0, 0.9, 1.15], to: 'hands' }, { type: 'seat', h: 0.42, at: [0, 0, -0.1] }, { type: 'footplate', at: [0, 0, 0.62] }],
    camera: CAM_SEAT,
  },
  bentRow: {
    timing: { down: 0.9, hold: 0.3, up: 1.3, rest: 0.3 },
    start: { root: { p: [0, 0.9, -0.14], r: [0.85, 0, 0] }, head: [-0.5, 0, 0], feet: stance(0.14), hands: pair(0.22, 0.68, 0.22, 'world', [0.2, 0, -1]) },
    end: { root: { p: [0, 0.9, -0.14], r: [0.85, 0, 0] }, head: [-0.5, 0, 0], feet: stance(0.14), hands: pair(0.22, 0.98, 0.0, 'world', [0.2, 0.6, -1]) },
    props: DB, camera: CAM_SIDE,
  },
  facePull: {
    timing: { down: 1.0, hold: 0.5, up: 1.3, rest: 0.3 },
    start: { root: { p: [0, SY, 0] }, feet: stance(0.14), hands: pair(0.1, 1.55, 0.6, 'world', [1, 0, -0.2]) },
    end: { root: { p: [0, SY, 0] }, feet: stance(0.14), hands: pair(0.24, 1.66, 0.14, 'world', [1, 0.3, -0.4]) },
    props: [{ type: 'cable', anchor: [0, 1.65, 1.2], to: 'hands' }, { type: 'tower', at: [0, 0, 1.25] }], camera: CAM_CABLE,
  },

  // ---------- core & cardio
  deadBug: {
    timing: { down: 1.2, hold: 0.4, up: 1.2, rest: 0.3 },
    start: { root: { p: [0, 0.11, 0.1], r: [-PI / 2, 0, 0] }, head: [0.15, 0, 0], footFlat: false,
      legs: { L: [[-PI / 2, 0, 0], [PI / 2, 0, 0]], R: [[-PI / 2, 0, 0], [PI / 2, 0, 0]] },
      hands: pair(0.2, 0.62, -0.38, 'world', [0, 0, -1]) },
    end: { root: { p: [0, 0.11, 0.1], r: [-PI / 2, 0, 0] }, head: [0.15, 0, 0], footFlat: false,
      legs: { L: [[-PI / 2, 0, 0], [PI / 2, 0, 0]], R: [[-0.25, 0, 0], [0.05, 0, 0]] },
      hands: { L: { p: [0.22, 0.14, -0.98], pole: [0, 1, 0] }, R: { p: [-0.2, 0.62, -0.38], pole: [0, 0, -1] } } },
    props: [{ type: 'mat' }], camera: CAM_FLOOR,
  },
  plank: {
    timing: { down: 2, hold: 0.5, up: 2, rest: 0.5 },
    start: { root: { p: [0, 0.33, -0.2], r: [PI / 2 - 0.08, 0, 0] }, head: [-0.2, 0, 0], footFlat: false, footPitch: 1.2,
      feet: pair(0.1, 0.09, -1.05, 'world', [0, -1, 0]), hands: pair(0.12, 0.05, 0.45, 'world', [0.2, -1, -0.2]) },
    end: { root: { p: [0, 0.335, -0.2], r: [PI / 2 - 0.09, 0, 0] }, head: [-0.2, 0, 0], footFlat: false, footPitch: 1.2,
      feet: pair(0.1, 0.09, -1.05, 'world', [0, -1, 0]), hands: pair(0.12, 0.05, 0.45, 'world', [0.2, -1, -0.2]) },
    props: [{ type: 'mat' }], camera: { pos: [2.6, 1.0, 0.6], target: [0, 0.3, -0.25] },
  },
  pallof: {
    timing: { down: 1.0, hold: 1.0, up: 1.0, rest: 0.4 },
    start: { root: { p: [0, SY - 0.04, 0] }, feet: stance(0.17), hands: pair(0.03, 1.22, 0.16, 'world', [0.3, -1, 0]) },
    end: { root: { p: [0, SY - 0.04, 0] }, feet: stance(0.17), hands: pair(0.03, 1.24, 0.55, 'world', [0.3, -1, 0]) },
    props: [{ type: 'cable', anchor: [1.1, 1.22, 0.2], to: 'hands' }, { type: 'tower', at: [1.2, 0, 0.2] }], camera: CAM_FRONT,
  },
  walk: {
    timing: { down: 0.55, hold: 0, up: 0.55, rest: 0 },
    start: { root: { p: [0, SY - 0.03, 0], r: [0.04, 0, 0] }, footFlat: true,
      feet: { L: { p: [0.1, A, 0.3], pole: [0, 0, 1] }, R: { p: [-0.1, A + 0.03, -0.28], pole: [0, 0, 1] } },
      hands: { L: { p: [0.24, -0.27, -0.14], frame: 'chest', pole: [0, 0, -1] }, R: { p: [-0.24, -0.25, 0.18], frame: 'chest', pole: [0, 0, -1] } } },
    end: { root: { p: [0, SY - 0.03, 0], r: [0.04, 0, 0] }, footFlat: true,
      feet: { L: { p: [0.1, A + 0.03, -0.28], pole: [0, 0, 1] }, R: { p: [-0.1, A, 0.3], pole: [0, 0, 1] } },
      hands: { L: { p: [0.24, -0.25, 0.18], frame: 'chest', pole: [0, 0, -1] }, R: { p: [-0.24, -0.27, -0.14], frame: 'chest', pole: [0, 0, -1] } } },
    props: [{ type: 'treadmill' }], camera: CAM_SIDE,
  },
};

MOTIONS.dbRdl = { ...MOTIONS.rdl, props: DB };
MOTIONS.dbCurl = { ...MOTIONS.curl, props: DB };
MOTIONS.bbRow = { ...MOTIONS.bentRow, props: BB, start: { ...MOTIONS.bentRow.start, hands: pair(0.26, 0.68, 0.22, 'world', [0.3, 0, -1]) }, end: { ...MOTIONS.bentRow.end, hands: pair(0.26, 0.98, 0.02, 'world', [0.3, 0.6, -1]) } };
MOTIONS.hammerCurl = MOTIONS.dbCurl;
MOTIONS.smithBench = MOTIONS.benchPress;
MOTIONS.hackSquat = MOTIONS.backSquat;

export const MOTION_IDS = Object.keys(MOTIONS);
