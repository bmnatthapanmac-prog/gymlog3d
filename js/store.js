// App state + all training logic (week/block, schemes, progression, PRs, muscle volume).
import { db } from './db.js';
import { EX as LIB, EXERCISES } from '../data/exercises.js';
import { LEAN5D } from '../data/programs/lean5d.js';
import { FOOTBALL } from '../data/programs/football.js';

export const PROGRAMS = { lean5d: LEAN5D, football: FOOTBALL };
export const LB = 0.45359237;

const DEFAULTS = {
  programId: 'lean5d', startDate: null, weekOverride: null, style: 'mannequin', sound: true,
  bodyweight: null, height: null, lastBackup: null, onboarded: false, barKg: 20,
  plates: [25, 20, 15, 10, 5, 2.5, 1.25], subs: {}, weeklyTarget: 5, stepsGoal: 9000,
};

export const S = { settings: { ...DEFAULTS }, sessions: [], body: [], active: null };
const listeners = new Set();
export const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach((f) => f());

// ---------- dates
const pad = (n) => String(n).padStart(2, '0');
export const iso = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => iso();
export const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s, n) => { const d = parseDate(s); d.setDate(d.getDate() + n); return iso(d); };
export const daysBetween = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 864e5);
export const mondayOf = (s = today()) => { const d = parseDate(s); const k = (d.getDay() + 6) % 7; d.setDate(d.getDate() - k); return iso(d); };
const TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const TH_DAY = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
export const thDate = (s, withDay = false) => { const d = parseDate(s); return `${withDay ? TH_DAY[d.getDay()] + ' ' : ''}${d.getDate()} ${TH_MONTH[d.getMonth()]}`; };
export const thDow = (s) => TH_DAY[parseDate(s).getDay()];

// ---------- load / save
export async function load() {
  const [settings, sessions, body, active] = await Promise.all([db.get('settings'), db.all('sessions'), db.all('body'), db.get('active')]);
  S.settings = { ...DEFAULTS, ...(settings || {}) };
  if (!S.settings.startDate) S.settings.startDate = today();
  S.sessions = (sessions || []).sort((a, b) => (a.date + (a.startedAt || 0) < b.date + (b.startedAt || 0) ? -1 : 1));
  S.body = (body || []).sort((a, b) => (a.date < b.date ? -1 : 1));
  S.active = active || null;
}
export async function saveSettings(patch) { Object.assign(S.settings, patch); await db.set('settings', S.settings); emit(); }

let activeT = null;
export function saveActive(now = false) {
  clearTimeout(activeT);
  const run = () => (S.active ? db.set('active', S.active) : db.del('active'));
  if (now) return run();
  activeT = setTimeout(run, 250);
}

// ---------- program helpers
export const program = (id = S.settings.programId) => PROGRAMS[id] || LEAN5D;
const customMap = () => Object.fromEntries(Object.values(PROGRAMS).flatMap((p) => (p.customExercises || []).map((e) => [e.id, { unit: 'kg', inc: 2.5, kind: 'bw', alts: [], cues: [], mistakes: [], secondary: [], ...e }])));
let _custom = null;
export const ex = (id) => LIB[id] || (_custom ||= customMap())[id] || { id, name: id, th: id, motion: 'stand', primary: [], secondary: [], unit: 'kg', inc: 2.5, kind: 'weight', cues: [], mistakes: [], alts: [] };
export const allExercises = () => EXERCISES;

export function currentWeek() {
  const p = program();
  if (S.settings.weekOverride) return Math.min(p.weeks, Math.max(1, S.settings.weekOverride));
  const w = Math.floor(daysBetween(S.settings.startDate, today()) / 7) + 1;
  return Math.min(p.weeks, Math.max(1, w));
}
export const blockOf = (week, p = program()) => p.blocks.find((b) => b.weeks.includes(week)) || p.blocks[p.blocks.length - 1];
export const isDeload = (week, p = program()) => blockOf(week, p).deload === week;

export function scheme(item, week, { light = false, p = program() } = {}) {
  const b = blockOf(week, p).id;
  const base = (item.schemes && item.schemes[b]) || (p.roles[item.role] && p.roles[item.role][b]) || { sets: 3, reps: '8-12', rpe: '8', rest: 90 };
  const s = { ...base };
  if (isDeload(week, p)) { s.sets = Math.max(1, s.sets - 1); s.rpe = '6'; s.deload = true; }
  if (light) { s.sets = Math.max(1, s.sets - 1); s.light = true; }
  return s;
}

export function repRange(reps) {
  const m = String(reps).match(/(\d+)\s*-\s*(\d+)/); if (m) return [+m[1], +m[2]];
  const n = String(reps).match(/^(\d+)/); return n ? [+n[1], +n[1]] : null;
}

// ---------- history queries
const doneSets = (it) => (it.sets || []).filter((s) => s.done && (+s.r > 0 || +s.w > 0));
export const finished = () => S.sessions.filter((s) => s.endedAt);

export function history(exId) {
  const out = [];
  for (const s of finished()) for (const it of s.items) if (it.ex === exId) { const d = doneSets(it); if (d.length) out.push({ session: s, item: it, sets: d }); }
  return out;
}
export function lastPerf(exId, exceptId) {
  for (let i = S.sessions.length - 1; i >= 0; i--) {
    const s = S.sessions[i]; if (!s.endedAt || s.id === exceptId) continue;
    const it = s.items.find((x) => x.ex === exId); if (it && doneSets(it).length) return { session: s, item: it, sets: doneSets(it) };
  }
  return null;
}

export const toKg = (w, unit) => (unit === 'lb' ? w * LB : w);
export const e1rm = (w, r) => (r <= 0 ? 0 : r === 1 ? w : w * (1 + Math.min(r, 15) / 30));
export const fmtW = (w) => (Math.round(w * 100) / 100).toString();

// Double progression suggestion for an exercise in a scheme
export function suggest(exId, sch, start, exceptId) {
  const e = ex(exId), rr = repRange(sch.reps), last = lastPerf(exId, exceptId);
  if (e.kind === 'time' || e.kind === 'cardio') return { w: '', r: rr ? rr[1] : '', why: '' };
  if (!last) return { w: start || '', r: rr ? rr[0] : '', why: start ? 'น้ำหนักเริ่มจากโปรแกรม' : '' };
  const top = Math.max(...last.sets.map((s) => +s.w || 0));
  const work = last.sets.filter((s) => (+s.w || 0) === top);
  if (!rr) return { w: top, r: '', why: 'เท่าครั้งก่อน' };
  const planned = (last.item.scheme && last.item.scheme.sets) || sch.sets;
  const hitTop = work.length > 0 && work.every((s) => +s.r >= rr[1]) && last.sets.length >= planned;
  const prev2 = (() => { const h = history(exId).filter((x) => x.session.id !== exceptId); return h.slice(-2); })();
  const missed = prev2.length === 2 && prev2.every((h) => h.sets.some((s) => +s.r < rr[0]));
  if (sch.deload) return { w: top, r: rr[0], why: 'Deload — น้ำหนักเดิม ทำสบายๆ' };
  if (hitTop && top > 0) return { w: +(top + e.inc).toFixed(2), r: rr[0], why: `ครั้งก่อนครบ ${rr[1]} ทุกเซ็ต → เพิ่ม ${e.inc} ${e.unit}`, up: true };
  if (hitTop && e.kind === 'bw') return { w: top, r: rr[1], why: 'ครบแล้ว — ลองเพิ่มเรพ หรือถ่วงน้ำหนัก', up: true };
  if (missed && top > 0) return { w: +(Math.round(top * 0.9 / e.inc) * e.inc).toFixed(2), r: rr[0], why: 'ต่ำกว่าเป้า 2 ครั้งติด → ลด 10% แล้วไต่ใหม่', down: true };
  return { w: top, r: Math.min(rr[1], Math.max(...work.map((s) => +s.r || 0)) + 1), why: 'น้ำหนักเดิม เพิ่มให้ได้ +1 เรพ' };
}

// best e1RM (kg) before a given session
export function bestE1rm(exId, beforeSessionId) {
  let best = 0; const e = ex(exId);
  for (const s of finished()) {
    if (s.id === beforeSessionId) break;
    for (const it of s.items) if (it.ex === exId) for (const st of doneSets(it)) best = Math.max(best, e1rm(toKg(+st.w || 0, it.unit || e.unit), +st.r || 0));
  }
  return best;
}

// ---------- muscles
export function muscleSets(sessions) {
  const m = {};
  for (const s of sessions) for (const it of s.items) {
    const e = ex(it.ex), n = doneSets(it).length; if (!n) continue;
    for (const k of e.primary) m[k] = (m[k] || 0) + n;
    for (const k of e.secondary) m[k] = (m[k] || 0) + n * 0.5;
  }
  return m;
}
export const last7 = () => finished().filter((s) => daysBetween(s.date, today()) < 7);
export const weekSessions = (monday = mondayOf()) => finished().filter((s) => s.date >= monday && s.date <= addDays(monday, 6));
export function xpTotals() { const m = muscleSets(finished()); for (const k in m) m[k] = Math.round(m[k] * 10); return m; }
export const level = (xp) => Math.floor(Math.sqrt((xp || 0) / 40)) + 1;
export const levelProgress = (xp) => { const l = level(xp), a = 40 * (l - 1) ** 2, b = 40 * l ** 2; return (xp - a) / (b - a); };

export function streakWeeks(target = 3) {
  let n = 0, mon = mondayOf();
  if (weekSessions(mon).length < target) mon = addDays(mon, -7);   // current week still in progress
  while (weekSessions(mon).length >= target) { n++; mon = addDays(mon, -7); }
  return n;
}

// ---------- day rotation
export function nextDay() {
  const p = program();
  const mine = finished().filter((s) => s.programId === p.id);
  if (!mine.length) return p.days[0];
  const last = mine[mine.length - 1];
  const i = p.days.findIndex((d) => d.id === last.dayId);
  return p.days[(i + 1) % p.days.length];
}
export const doneToday = () => finished().filter((s) => s.date === today());

// ---------- session lifecycle
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function buildSession(dayId, { light = false, readiness = null, date = today(), custom = null } = {}) {
  const p = program(), week = currentWeek(), day = p.days.find((d) => d.id === dayId);
  const id = uid();
  const srcItems = custom ? custom.map((exId) => ({ ex: exId, role: 'acc', start: 0 })) : day.items;
  const items = srcItems.map((it) => {
    const swapped = S.settings.subs[`${p.id}|${dayId}|${it.ex}`] || it.ex;
    const e = ex(swapped), sch = scheme(it, week, { light, p });
    const sug = suggest(swapped, sch, swapped === it.ex ? it.start : 0, id);
    return { ex: swapped, origEx: it.ex, role: it.role, ss: it.ss || null, note: '', planNote: it.note || '', scheme: sch, unit: e.unit, perSide: e.perSide, suggest: sug,
      sets: Array.from({ length: sch.sets }, () => ({ w: sug.w === 0 ? '' : sug.w, r: '', rpe: '', done: false })) };
  });
  const cardio = !custom && day.cardio ? { ex: day.cardio.ex, min: day.cardio[blockOf(week, p).id] || 10, note: day.cardio.note, done: false } : null;
  return { id, date, programId: p.id, dayId: custom ? 'custom' : dayId, dayName: custom ? 'Custom' : day.name, week, block: blockOf(week, p).id,
    deload: isDeload(week, p), light, readiness, startedAt: Date.now(), endedAt: null, items, cardio, note: '' };
}

export async function startSession(s) { S.active = s; await saveActive(true); emit(); }
export async function discardActive() { S.active = null; await saveActive(true); emit(); }

export function summarize(s) {
  let sets = 0, vol = 0; const prs = [];
  for (const it of s.items) {
    const e = ex(it.ex), d = doneSets(it); sets += d.length;
    let best = null;
    for (const st of d) {
      const kg = toKg(+st.w || 0, it.unit || e.unit) * (it.perSide ? 2 : 1);
      vol += kg * (+st.r || 0);
      const one = e1rm(toKg(+st.w || 0, it.unit || e.unit), +st.r || 0);
      if (!best || one > best.e1) best = { e1: one, w: +st.w, r: +st.r };
    }
    if (best && best.e1 > 0 && e.kind !== 'time' && e.kind !== 'cardio') {
      const prev = bestE1rm(it.ex, s.id);
      if (best.e1 > prev + 0.01) prs.push({ ex: it.ex, e1rm: Math.round(best.e1 * 10) / 10, w: best.w, r: best.r, unit: it.unit, first: prev === 0 });
    }
  }
  const ms = muscleSets([s]); const xp = {}; for (const k in ms) xp[k] = Math.round(ms[k] * 10);
  return { durationMin: Math.max(1, Math.round(((s.endedAt || Date.now()) - s.startedAt) / 60000)), sets, volumeKg: Math.round(vol), prs, xp };
}

export async function finishActive() {
  const s = S.active; if (!s) return null;
  s.endedAt = Date.now();
  // keep only sets that were logged; drop empty exercises
  s.items = s.items.map((it) => ({ ...it, sets: it.sets.filter((x) => x.done) })).filter((it) => it.sets.length || it.note);
  S.sessions.push(s); S.sessions.sort((a, b) => (a.date + a.startedAt < b.date + b.startedAt ? -1 : 1));
  s.summary = summarize(s);
  await db.put('sessions', s);
  S.active = null; await saveActive(true); emit();
  return s;
}
export async function deleteSession(id) { S.sessions = S.sessions.filter((s) => s.id !== id); await db.remove('sessions', id); emit(); }

// ---------- body log
export async function logBody(entry) {
  const i = S.body.findIndex((b) => b.date === entry.date);
  const v = { ...(i >= 0 ? S.body[i] : {}), ...entry };
  if (i >= 0) S.body[i] = v; else S.body.push(v);
  S.body.sort((a, b) => (a.date < b.date ? -1 : 1));
  await db.put('body', v);
  if (entry.weight) await saveSettings({ bodyweight: entry.weight }); else emit();
}
export function avg7(key, until = today()) {
  const xs = S.body.filter((b) => b[key] && b.date <= until && daysBetween(b.date, until) < 7).map((b) => +b[key]);
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

// ---------- backup
export function exportData() {
  return { app: 'gymlog3d', v: 1, exportedAt: new Date().toISOString(), settings: S.settings, sessions: S.sessions, body: S.body, active: S.active };
}

function mapOldName(name) {
  const n = (name || '').toLowerCase();
  const hit = EXERCISES.find((e) => n.includes(e.name.toLowerCase()) || e.name.toLowerCase().includes(n.replace(/\(.*\)/, '').trim()));
  if (hit) return hit.id;
  const keys = [['bench', 'benchPress'], ['pull-up', 'pullUp'], ['ดึงข้อ', 'pullUp'], ['squat', 'backSquat'], ['romanian', 'rdl'], ['rdl', 'rdl'], ['row', 'seatedCableRow'], ['pulldown', 'latPulldown'], ['curl', 'bbCurl'], ['pushdown', 'ropePushdown'], ['lateral', 'lateralRaise'], ['shoulder press', 'seatedDbPress'], ['hip thrust', 'hipThrust'], ['leg press', 'legPress'], ['leg curl', 'seatedLegCurl'], ['leg extension', 'legExtension'], ['calf', 'standingCalfRaise'], ['face pull', 'facePull'], ['fly', 'cableFly'], ['pec', 'pecDeck']];
  const k = keys.find(([a]) => n.includes(a)); return k ? k[1] : null;
}

// accepts this app's export or the old Football log export
export async function importData(data) {
  let sessions = [], body = [], settings = null, kind = 'gymlog3d';
  if (data && data.app === 'gymlog3d') { sessions = data.sessions || []; body = data.body || []; settings = data.settings; }
  else if (data && Array.isArray(data.sessions)) {
    kind = 'football-log';
    for (const s of data.sessions) {
      const entries = (s.entries || []).filter((e) => e.kg || e.reps); if (!entries.length) continue;
      const by = new Map();
      for (const en of entries) {
        const id = mapOldName(en.ex) || 'fb_' + String(en.ex).slice(0, 20);
        if (!by.has(id)) by.set(id, []);
        const lb = /lb|ibs/i.test(String(en.unit || '')) ;
        by.get(id).push({ w: +en.kg || 0, r: +en.reps || 0, rpe: en.rpe || '', done: true, lb });
      }
      const t = parseDate(s.date).getTime() + 18 * 3600e3;
      sessions.push({ id: 'old_' + (s.id || s.date + s.dayId), date: s.date, programId: 'football', dayId: String(s.dayId || '').toLowerCase(), dayName: s.dayId || 'เดิม', week: s.week || 0, block: 'b1',
        startedAt: t, endedAt: t + 3600e3, imported: true, note: s.note || '',
        items: [...by].map(([id, sets]) => ({ ex: id, origEx: id, role: 'main', unit: 'kg', perSide: false, scheme: { sets: sets.length, reps: '', rpe: '', rest: 90 }, sets })) });
    }
  } else throw new Error('ไม่ใช่ไฟล์สำรองของแอปนี้');
  const have = new Set(S.sessions.map((s) => s.id));
  const fresh = sessions.filter((s) => !have.has(s.id));
  for (const s of fresh) if (!s.summary) s.summary = summarize(s);
  await db.bulk('sessions', fresh); S.sessions.push(...fresh);
  S.sessions.sort((a, b) => (a.date + a.startedAt < b.date + b.startedAt ? -1 : 1));
  const bodyNew = body.filter((b) => !S.body.some((x) => x.date === b.date));
  await db.bulk('body', bodyNew); S.body.push(...bodyNew); S.body.sort((a, b) => (a.date < b.date ? -1 : 1));
  if (settings && !S.settings.onboarded) await saveSettings({ ...settings });
  emit();
  return { kind, sessions: fresh.length, body: bodyNew.length };
}

export async function resetAll() {
  await Promise.all([db.clear('sessions'), db.clear('body'), db.del('active'), db.del('settings')]);
  S.sessions = []; S.body = []; S.active = null; S.settings = { ...DEFAULTS, startDate: today() }; emit();
}
export { emit };
