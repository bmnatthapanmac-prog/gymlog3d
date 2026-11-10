import { S, last7, muscleSets, xpTotals, level, levelProgress, allExercises, buildSession, startSession, saveActive, suggest, scheme, currentWeek, ex } from '../store.js';
import { MUSCLES } from '../three/rig.js';
import { h, icon, sheet, toast, mountViewer, $, $$ } from '../ui.js';
import { EQ_TH } from '../../data/exercises.js';
import { keepAwake } from '../timer.js';

const TARGET = 10; // sets per muscle per week that counts as "fully trained"

export function renderBody(root) {
  const ms = muscleSets(last7()), tot = xpTotals();
  const heat = Object.fromEntries(Object.keys(MUSCLES).map((k) => [k, Math.min(1, (ms[k] || 0) / TARGET)]));
  const rows = Object.keys(MUSCLES).map((k) => ({ k, v: ms[k] || 0 })).sort((a, b) => b.v - a.v);
  const neglected = rows.filter((r) => r.v === 0).map((r) => MUSCLES[r.k].th);

  root.innerHTML = `
  <header class="top"><div><div class="mute small">แตะกล้ามเพื่อดูท่า</div><h1>ร่างกาย</h1></div></header>
  <div class="bodystage"><div class="v3host tall"></div>
    <div class="legend-heat"><span>ยังไม่ได้เล่น</span><i></i><span>${TARGET}+ เซ็ต/สัปดาห์</span></div>
    <div class="viewbtns"><button data-v="front">หน้า</button><button data-v="side">ข้าง</button><button data-v="back">หลัง</button><button data-v="spin" class="on">หมุน</button></div>
  </div>
  <div class="pad">
    ${neglected.length && last7().length ? `<div class="banner info small"><b>7 วันที่ผ่านมายังไม่ได้เล่น:</b> ${h(neglected.slice(0, 6).join(' · '))}</div>` : ''}
    <section class="card"><h3>ปริมาณงาน 7 วันล่าสุด (เซ็ต)</h3>
      <div class="mbars">${rows.map((r) => `<button class="mbar" data-m="${r.k}"><span class="lbl">${MUSCLES[r.k].th}</span><span class="track"><i style="width:${Math.min(100, (r.v / TARGET) * 100)}%"></i></span><span class="mono v">${r.v % 1 ? r.v.toFixed(1) : r.v}</span><span class="lv">Lv${level(tot[r.k])}</span></button>`).join('')}</div>
      <p class="mute small">กล้ามรองนับครึ่งเซ็ต · ช่วงลดไขมัน 8–12 เซ็ต/สัปดาห์ต่อกล้ามก็พอรักษากล้ามได้</p>
    </section>
  </div>`;

  let v = null;
  mountViewer($('.v3host', root), { motion: 'stand', heat, autoRotate: true, onTap: (m) => m && muscleSheet(m) }).then((x) => { v = x; });
  $$('.viewbtns button', root).forEach((b) => (b.onclick = () => {
    if (!v) return;
    $$('.viewbtns button', root).forEach((x) => x.classList.toggle('on', x === b));
    const d = b.dataset.v;
    v.setAutoRotate(d === 'spin');
    if (d === 'front') v.view([0, 1.2, 3.3], [0, 0.95, 0]);
    if (d === 'back') v.view([0, 1.2, -3.3], [0, 0.95, 0]);
    if (d === 'side') v.view([3.3, 1.2, 0], [0, 0.95, 0]);
  }));
  $$('.mbar', root).forEach((b) => (b.onclick = () => muscleSheet(b.dataset.m)));
}

export function muscleSheet(m) {
  const ms = muscleSets(last7()), tot = xpTotals();
  const list = allExercises().filter((e) => e.primary.includes(m) && e.kind !== 'cardio');
  const second = allExercises().filter((e) => !e.primary.includes(m) && e.secondary.includes(m) && e.kind !== 'cardio');
  const li = (e) => `<div class="li"><a class="grow" href="#/library/${e.id}" data-close><b>${h(e.name)}</b><span class="mute small"> ${h(e.th)} · ${EQ_TH[e.eq] || ''}</span></a><button class="mini" data-add="${e.id}">${icon('plus')}</button></div>`;
  sheet(`<div class="row between"><h3>${MUSCLES[m].th} <span class="mute small">${MUSCLES[m].en}</span></h3><span class="chip acc">Lv ${level(tot[m])}</span></div>
    <div class="lvbar"><i style="width:${Math.round(levelProgress(tot[m] || 0) * 100)}%"></i></div>
    <p class="mute small">7 วันล่าสุด ${ms[m] || 0} เซ็ต · XP สะสม ${tot[m] || 0}</p>
    <h4>ท่าหลักของกล้ามนี้</h4><div class="list">${list.map(li).join('') || '<p class="mute">—</p>'}</div>
    ${second.length ? `<h4 class="mute">ท่าที่ช่วยด้วย</h4><div class="list">${second.slice(0, 6).map(li).join('')}</div>` : ''}
    <p class="mute small">กด ${icon('plus', 'inline')} เพื่อเพิ่มท่าเข้าการซ้อมตอนนี้ (หรือเริ่มซ้อมแบบเลือกท่าเอง)</p>`, {
    onOpen: (el, close) => el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-add]'); if (!b) return;
      await addExercise(b.dataset.add); close();
    }),
  });
}

export async function addExercise(exId) {
  const e = ex(exId);
  if (S.active) {
    const sch = scheme({ role: 'acc' }, currentWeek());
    const sug = suggest(exId, sch, 0, S.active.id);
    S.active.items.push({ ex: exId, origEx: exId, role: 'acc', ss: null, note: '', planNote: '', scheme: sch, unit: e.unit, perSide: e.perSide, suggest: sug,
      sets: Array.from({ length: sch.sets }, () => ({ w: sug.w === 0 ? '' : sug.w, r: '', rpe: '', done: false })) });
    saveActive(true); toast(`เพิ่ม ${e.name} แล้ว`); location.hash = '#/workout';
  } else {
    const s = buildSession(null, { custom: [exId] });
    await startSession(s); keepAwake(true); location.hash = '#/workout';
  }
}
