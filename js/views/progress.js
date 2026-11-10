import { S, finished, weekSessions, last7, mondayOf, addDays, today, thDate, muscleSets, ex, history, e1rm, toKg, fmtW, avg7, streakWeeks, program } from '../store.js';
import { GROUPS } from '../../data/exercises.js';
import { h, icon, $ } from '../ui.js';
import { lineChart, radar, calendar, bars } from '../charts.js';
import { bodySheet } from './today.js';

const GROUP_TARGET = { chest: 10, back: 14, shoulders: 12, arms: 12, legs: 18, core: 6 };

export function renderProgress(root) {
  const all = finished();
  const counts = {}; for (const s of all) counts[s.date] = (counts[s.date] || 0) + 1;
  const ms = muscleSets(last7());
  const axes = Object.entries(GROUPS).map(([k, g]) => ({ label: g.th, value: Math.round(g.muscles.reduce((a, m) => a + (ms[m] || 0), 0) * 10) / 10, target: GROUP_TARGET[k] }));
  const weeks = Array.from({ length: 8 }, (_, i) => addDays(mondayOf(), -7 * (7 - i)));
  const vol = weeks.map((w) => ({ x: thDate(w).split(' ')[0] + '/' + (+w.slice(5, 7)), y: weekSessions(w).reduce((a, s) => a + ((s.summary && s.summary.volumeKg) || 0), 0) / 1000, dim: w === mondayOf() }));
  const bw = S.body.filter((b) => b.weight).slice(-30).map((b) => ({ x: thDate(b.date), y: +b.weight }));
  const waist = S.body.filter((b) => b.waist).slice(-30).map((b) => ({ x: thDate(b.date), y: +b.waist }));
  const firstW = S.body.find((b) => b.weight), a7 = avg7('weight');

  // best e1RM per exercise
  const best = {};
  for (const s of all) for (const it of s.items) {
    const e = ex(it.ex); if (e.kind === 'time' || e.kind === 'cardio') continue;
    for (const st of it.sets) { const v = e1rm(toKg(+st.w || 0, it.unit || e.unit), +st.r || 0); if (!best[it.ex] || v > best[it.ex].v) best[it.ex] = { v, date: s.date, w: st.w, r: st.r, unit: it.unit }; }
  }
  const prList = Object.entries(best).filter(([, b]) => b.v > 0).sort((a, b) => b[1].v - a[1].v);
  const month = today().slice(0, 7);

  root.innerHTML = `
  <header class="top"><div><div class="mute small">${h(program().name)}</div><h1>พัฒนาการ</h1></div></header>
  <div class="pad">
    <div class="stats3">
      <div class="stat"><b>${all.filter((s) => s.date.startsWith(month)).length}</b><span>ครั้งเดือนนี้</span></div>
      <div class="stat"><b>${streakWeeks(3)}</b><span>สัปดาห์ติด</span></div>
      <div class="stat"><b>${prList.length}</b><span>ท่าที่มีสถิติ</span></div>
    </div>
    <section class="card"><h3>ปฏิทินการซ้อม</h3>${calendar(counts, today(), 14, addDays, mondayOf)}<div class="mute tiny">14 สัปดาห์ล่าสุด · แถว = จันทร์ → อาทิตย์</div></section>

    <section class="card"><div class="row between"><h3>น้ำหนักตัว</h3><button class="btn mini ghost" id="addbw">${icon('plus', 'inline')} บันทึก</button></div>
      ${a7 ? `<div class="row gap"><div><b class="big-num">${a7.toFixed(1)}</b> <span class="mute">kg เฉลี่ย 7 วัน</span></div>${firstW ? `<div class="${a7 - firstW.weight <= 0 ? 'good' : 'warnc'} small">${a7 - firstW.weight <= 0 ? '▼' : '▲'} ${Math.abs(a7 - firstW.weight).toFixed(1)} kg ตั้งแต่ ${thDate(firstW.date)}</div>` : ''}</div>` : ''}
      ${lineChart(bw, { unit: 'kg', color: 'var(--blue)' })}
      ${waist.length ? `<h4>รอบเอว (ซม.)</h4>${lineChart(waist, { unit: 'cm', color: 'var(--pink)', h: 120 })}` : ''}
      <p class="mute small">ลดไขมันที่ดี ≈ 0.5–0.75% ของน้ำหนักตัวต่อสัปดาห์ · ถ้าน้ำหนักลดแต่แรงตกทุกท่า = ลดเร็วเกิน</p>
    </section>

    <section class="card"><h3>สมดุลกล้าม 7 วันล่าสุด</h3><div class="center">${radar(axes)}</div><div class="mute tiny">เส้นประ = เป้า (เซ็ต/สัปดาห์) · กล้ามรองนับครึ่งเซ็ต</div></section>
    <section class="card"><h3>Volume รายสัปดาห์ (ตัน)</h3>${bars(vol, { fmt: (v) => v.toFixed(1) })}</section>

    <section class="card"><h3>${icon('trophy', 'inline')} สถิติสูงสุด (e1RM)</h3>
      ${prList.length ? `<div class="list">${prList.map(([id, b]) => `<a class="li" href="#/progress/ex/${id}"><span class="grow"><b>${h(ex(id).name)}</b><span class="mute small"> ${fmtW(+b.w)}${b.unit === 'lb' ? 'lb' : 'kg'}×${b.r} · ${thDate(b.date)}</span></span><b class="mono">${b.v.toFixed(1)}</b><span class="mute small">kg ›</span></a>`).join('')}</div>` : '<div class="empty">ซ้อมครั้งแรกเสร็จแล้วสถิติจะขึ้นที่นี่</div>'}
      <p class="mute tiny">e1RM = น้ำหนักที่น่าจะยกได้ 1 ครั้ง คำนวณจากเซ็ตที่ทำ (สูตร Epley) ใช้เทียบพัฒนาการโดยไม่ต้องยกสุดแรงจริง</p>
    </section>

    <section class="card"><h3>ประวัติทั้งหมด</h3>${all.length ? `<div class="list">${all.slice().reverse().map((s) => `<a class="li" href="#/session/${s.id}"><span class="dotc" style="--c:${(program(s.programId).days.find((d) => d.id === s.dayId) || {}).color || '#888'}"></span><span class="grow"><b>${h(s.dayName)}</b><span class="mute small"> · ${thDate(s.date, true)}${s.imported ? ' · นำเข้า' : ''}</span></span><span class="mute small">${s.summary ? s.summary.sets + ' เซ็ต' : ''} ›</span></a>`).join('')}</div>` : '<div class="empty">ยังไม่มี</div>'}</section>
  </div>`;
  $('#addbw', root).onclick = bodySheet;
}

export function renderExStats(root, id) {
  const e = ex(id), hs = history(id);
  const pts = hs.map((x) => ({ x: thDate(x.session.date), y: Math.max(...x.sets.map((st) => e1rm(toKg(+st.w || 0, x.item.unit || e.unit), +st.r || 0))) }));
  const vol = hs.slice(-10).map((x) => ({ x: thDate(x.session.date).split(' ')[0], y: x.sets.reduce((a, st) => a + toKg(+st.w || 0, x.item.unit || e.unit) * (x.item.perSide ? 2 : 1) * (+st.r || 0), 0) }));
  const reps = hs.map((x) => ({ x: thDate(x.session.date), y: x.sets.reduce((a, st) => a + (+st.r || 0), 0) }));
  const isLoad = e.kind === 'weight' || hs.some((x) => x.sets.some((s) => +s.w > 0));
  root.innerHTML = `
  <header class="top sticky"><a href="javascript:history.back()" class="icon-btn">${icon('back')}</a><div class="grow"><div class="mute small">${h(e.th)}</div><h2>${h(e.name)}</h2></div><a href="#/library/${e.id}" class="btn mini ghost">ดูท่า</a></header>
  <div class="pad">
    ${hs.length ? `
    <div class="stats3"><div class="stat"><b>${hs.length}</b><span>ครั้ง</span></div>
      <div class="stat"><b>${isLoad ? Math.max(...pts.map((p) => p.y)).toFixed(1) : Math.max(...reps.map((p) => p.y))}</b><span>${isLoad ? 'e1RM สูงสุด (kg)' : 'ครั้งรวมสูงสุด'}</span></div>
      <div class="stat"><b>${fmtW(Math.max(...hs.flatMap((x) => x.sets.map((s) => +s.w || 0))))}</b><span>หนักสุด (${e.unit})</span></div></div>
    <section class="card"><h3>${isLoad ? 'e1RM (kg)' : 'จำนวนครั้งรวม'}</h3>${lineChart(isLoad ? pts : reps, { unit: isLoad ? 'kg' : '' })}</section>
    ${isLoad ? `<section class="card"><h3>Volume ต่อครั้ง (kg)</h3>${bars(vol)}</section>` : ''}
    <section class="card"><h3>ทุกครั้งที่ทำ</h3>${hs.slice().reverse().map((x) => `<div class="hrow"><a href="#/session/${x.session.id}" class="mute small">${thDate(x.session.date, true)}</a><div class="setchips">${x.sets.map((st) => `<span class="mono">${e.kind === 'time' ? '' : fmtW(+st.w || 0) + '×'}${st.r}</span>`).join('')}</div></div>`).join('')}</section>`
    : '<div class="empty">ยังไม่เคยบันทึกท่านี้</div>'}
  </div>`;
}
