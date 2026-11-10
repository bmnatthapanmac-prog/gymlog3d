// Rest timer driven by timestamps (survives app switch / screen lock / reload) + audio cue + wake lock.
import { S, saveActive } from './store.js';

let ctx = null, scheduled = [], tickId = null, fired = false;
const subs = new Set();
export const onTimer = (fn) => { subs.add(fn); return () => subs.delete(fn); };

export function unlockAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) { /* no audio */ }
}

function beepAt(when, freq = 880, dur = 0.14, vol = 0.25) {
  if (!ctx) return null;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  o.connect(g).connect(ctx.destination); o.start(when); o.stop(when + dur + 0.02);
  return o;
}
function cancelScheduled() { for (const o of scheduled) { try { o.stop(); } catch (e) { /* already */ } } scheduled = []; }
function schedule(secLeft) {
  cancelScheduled();
  if (!ctx || !S.settings.sound || secLeft <= 0) return;
  const t0 = ctx.currentTime + secLeft;
  scheduled = [beepAt(t0 - 0.6, 660, 0.1, 0.18), beepAt(t0 - 0.3, 660, 0.1, 0.18), beepAt(t0, 990, 0.35, 0.3)].filter(Boolean);
}

export const restState = () => (S.active && S.active.rest) || null;
export const remaining = () => { const r = restState(); return r ? Math.max(0, Math.ceil((r.endAt - Date.now()) / 1000)) : 0; };

export function startRest(sec, label = '') {
  if (!S.active || !sec) return;
  unlockAudio();
  S.active.rest = { endAt: Date.now() + sec * 1000, total: sec, label };
  fired = false; saveActive(); schedule(sec); run();
}
export function addRest(delta) {
  const r = restState(); if (!r) return;
  r.endAt = Math.max(Date.now() + 1000, r.endAt + delta * 1000); r.total = Math.max(r.total + delta, 1);
  fired = false; saveActive(); schedule((r.endAt - Date.now()) / 1000); emit();
}
export function stopRest() { if (S.active) { S.active.rest = null; saveActive(); } cancelScheduled(); emit(); }

function emit() { const left = remaining(), r = restState(); subs.forEach((f) => f(left, r)); }
function run() {
  if (tickId) return;
  tickId = setInterval(() => {
    const r = restState();
    if (!r) { clearInterval(tickId); tickId = null; emit(); return; }
    const left = remaining();
    if (left <= 0 && !fired) {
      fired = true;
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      if (!scheduled.length && S.settings.sound) { unlockAudio(); beepAt(ctx ? ctx.currentTime + 0.01 : 0, 990, 0.35, 0.3); }
      scheduled = [];
      subs.forEach((f) => f(0, r, true));
      setTimeout(() => { if (restState() === r && remaining() <= 0) stopRest(); }, 2500);
    }
    emit();
  }, 250);
}
export function resumeTimer() {
  const r = restState(); if (!r) return;
  if (remaining() <= 0) { S.active.rest = null; return; }
  if (ctx) schedule((r.endAt - Date.now()) / 1000);
  run();
}

// ---------- screen wake lock during workouts
let lock = null;
export async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !lock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); }
    if (!on && lock) { await lock.release(); lock = null; }
  } catch (e) { lock = null; }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { if (S.active) keepAwake(true); if (ctx && ctx.state === 'suspended') ctx.resume(); const r = restState(); if (r && ctx) schedule((r.endAt - Date.now()) / 1000); }
});
