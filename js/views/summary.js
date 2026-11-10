import { S, ex, thDate, fmtW, muscleSets, xpTotals, level, levelProgress, program, deleteSession, LB } from '../store.js';
import { MUSCLES } from '../three/rig.js';
import { h, icon, mountViewer, confirmBox, $ } from '../ui.js';
import { doBackup } from '../backup.js';

export function renderSummary(root, id) {
  const s = S.sessions.find((x) => x.id === id);
  if (!s) { location.hash = '#/today'; return; }
  const sm = s.summary, tot = xpTotals();
  const ms = muscleSets([s]), max = Math.max(1, ...Object.values(ms));
  const heat = Object.fromEntries(Object.entries(ms).map(([k, v]) => [k, 0.25 + 0.75 * (v / max)]));
  const xpRows = Object.entries(sm.xp).sort((a, b) => b[1] - a[1]).slice(0, 8);
  root.innerHTML = `
  <div class="pad summary">
    <div class="center-col"><div class="burst">${icon('check')}</div><h1>ซ้อมเสร็จแล้ว!</h1><div class="mute">${h(s.dayName)} · ${thDate(s.date, true)}</div></div>
    <div class="stats3">
      <div class="stat"><b>${sm.durationMin}</b><span>นาที</span></div>
      <div class="stat"><b>${sm.sets}</b><span>เซ็ต</span></div>
      <div class="stat"><b>${(sm.volumeKg / 1000).toFixed(1)}</b><span>ตัน (volume)</span></div>
    </div>
    ${(() => { const real = sm.prs.filter((p) => !p.first), firsts = sm.prs.length - real.length; return `
    ${real.length ? `<section class="card pr"><h3>${icon('trophy', 'inline')} สถิติใหม่ ${real.length} ท่า</h3>${real.map((p) => `<div class="row between"><span>${h(ex(p.ex).name)}</span><b class="mono">${fmtW(p.w)} ${p.unit} × ${p.r}</b></div><div class="mute small">e1RM ≈ ${p.e1rm} kg</div>`).join('')}</section>` : ''}
    ${firsts ? `<div class="banner info small">บันทึกครั้งแรก ${firsts} ท่า — ครั้งหน้าแอปจะเทียบกับวันนี้และแนะนำน้ำหนักให้</div>` : ''}`; })()}
    <section class="card"><h3>กล้ามที่ได้ XP</h3>
      <div class="sumgrid"><div class="v3host small"></div>
      <div class="xp">${xpRows.map(([m, x]) => { const t = tot[m] || 0; return `<div class="xprow"><div class="row between"><span>${MUSCLES[m] ? MUSCLES[m].th : m}</span><span class="acc mono">+${x}</span></div><div class="lvbar"><i style="width:${Math.round(levelProgress(t) * 100)}%"></i></div><div class="mute tiny">Lv ${level(t)}</div></div>`; }).join('')}</div></div>
    </section>
    <section class="card"><h3>สำรองข้อมูล</h3><p class="mute small">ข้อมูลอยู่ในเครื่องนี้ กดสำรองแล้วเลือกบันทึกลง Files หรือ Google Drive ไว้ก่อน ทำทุก 1–2 สัปดาห์ก็พอ</p>
      <button class="btn ghost" id="bk">${icon('share', 'inline')} สำรองตอนนี้</button></section>
    <a href="#/today" class="btn big">กลับหน้าแรก</a>
    <a href="#/session/${s.id}" class="btn ghost big">ดูรายละเอียด</a>
  </div>`;
  mountViewer($('.v3host', root), { motion: 'stand', heat, autoRotate: true });
  $('#bk', root).onclick = doBackup;
}

export function renderSessionDetail(root, id) {
  const s = S.sessions.find((x) => x.id === id);
  if (!s) { location.hash = '#/progress'; return; }
  const sm = s.summary || {};
  root.innerHTML = `
  <header class="top sticky"><a href="#/progress" class="icon-btn">${icon('back')}</a><div class="grow"><div class="mute small">${thDate(s.date, true)} · สัปดาห์ ${s.week || '-'}</div><h2>${h(s.dayName)}</h2></div></header>
  <div class="pad">
    <div class="stats3"><div class="stat"><b>${sm.durationMin || '-'}</b><span>นาที</span></div><div class="stat"><b>${sm.sets || 0}</b><span>เซ็ต</span></div><div class="stat"><b>${((sm.volumeKg || 0) / 1000).toFixed(1)}</b><span>ตัน</span></div></div>
    ${s.readiness ? `<div class="mute small">ความพร้อม: นอน ${s.readiness.sleep}/5 · พลังงาน ${s.readiness.energy}/5 · ปวดเมื่อย ${s.readiness.sore}/5${s.light ? ' · โหมดเบา' : ''}</div>` : ''}
    ${s.items.map((it) => { const e = ex(it.ex); return `<section class="card"><div class="row between"><a href="#/progress/ex/${e.id}"><b>${h(e.name)}</b></a><span class="mute small">${h(e.th)}</span></div>
      <div class="setchips">${it.sets.map((x) => `<span class="mono">${e.kind === 'time' ? '' : fmtW(+x.w || 0) + (it.unit === 'lb' ? 'lb' : '') + '×'}${x.r}${x.rpe ? ` @${x.rpe}` : ''}</span>`).join('')}</div>
      ${it.note ? `<div class="mute small">📝 ${h(it.note)}</div>` : ''}</section>`; }).join('')}
    ${s.cardio ? `<section class="card"><b>${h(ex(s.cardio.ex).th)}</b> · ${s.cardio.min} นาที ${s.cardio.done ? '✓' : '(ไม่ได้ทำ)'}</section>` : ''}
    ${s.note ? `<section class="card"><b>โน้ต</b><p>${h(s.note)}</p></section>` : ''}
    <button class="btn ghost danger big" id="del">ลบการซ้อมนี้</button>
  </div>`;
  $('#del', root).onclick = async () => { if (await confirmBox('ลบการซ้อมนี้?', 'ลบแล้วกู้คืนไม่ได้ (ยกเว้นมีไฟล์สำรอง)', 'ลบ', true)) { await deleteSession(s.id); location.hash = '#/progress'; } };
}
