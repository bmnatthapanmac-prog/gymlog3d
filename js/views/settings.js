import { S, PROGRAMS, program, saveSettings, currentWeek, today, mondayOf, finished, resetAll, thDate, logBody } from '../store.js';
import { h, icon, confirmBox, toast, mountViewer, $, $$ } from '../ui.js';
import { doBackup, pickImport, findOldAppData, importOldApp } from '../backup.js';

export function renderSettings(root) {
  const p = program(), st = S.settings;
  const lastBk = st.lastBackup ? new Date(st.lastBackup) : null;
  root.innerHTML = `
  <header class="top sticky"><a href="#/today" class="icon-btn">${icon('back')}</a><div class="grow"><h2>ตั้งค่า</h2></div></header>
  <div class="pad">
    <section class="card"><h3>โปรแกรม</h3>
      <div class="list">${Object.values(PROGRAMS).map((x) => `<button class="li prog ${x.id === p.id ? 'on' : ''}" data-p="${x.id}"><span class="grow"><b>${h(x.name)}</b><span class="mute small"> · ${h(x.th)} · ${x.days.length} วัน/สัปดาห์</span></span>${x.id === p.id ? icon('check') : ''}</button>`).join('')}</div>
      <p class="mute small">สลับโปรแกรมได้ตลอด ประวัติไม่หาย — ท่าที่ซ้ำกันใช้สถิติร่วมกัน</p>
      <div class="grid2">
        <label class="field"><span>วันเริ่มโปรแกรม</span><input type="date" id="sd" value="${st.startDate}"></label>
        <label class="field"><span>สัปดาห์ปัจจุบัน</span><select id="wk"><option value="">อัตโนมัติ (${currentWeek()})</option>${Array.from({ length: p.weeks }, (_, i) => `<option value="${i + 1}" ${st.weekOverride === i + 1 ? 'selected' : ''}>สัปดาห์ ${i + 1}</option>`).join('')}</select></label>
      </div>
      <label class="field"><span>เป้าหมายครั้ง/สัปดาห์</span><input type="number" id="wt" min="1" max="7" value="${st.weeklyTarget}"></label>
    </section>

    <section class="card"><h3>กฎของโปรแกรม ${h(p.name)}</h3><ul class="cues">${(p.rules || []).map((r) => `<li>${h(r)}</li>`).join('')}</ul></section>

    <section class="card"><h3>การแสดงผล</h3>
      <div class="row between"><span>สไตล์หุ่น 3D</span><div class="seg" id="sty"><button data-st="mannequin" class="${st.style === 'mannequin' ? 'on' : ''}">หุ่นขาว</button><button data-st="anatomy" class="${st.style === 'anatomy' ? 'on' : ''}">กล้ามเนื้อ</button></div></div>
      <label class="toggle"><input type="checkbox" id="snd" ${st.sound ? 'checked' : ''}><span>เสียงเตือนเมื่อพักครบ</span></label>
      <div class="grid2">
        <label class="field"><span>น้ำหนักบาร์เปล่า (kg)</span><input type="number" id="bar" value="${st.barKg}"></label>
        <label class="field"><span>ส่วนสูง (ซม.)</span><input type="number" id="ht" value="${st.height || ''}"></label>
      </div>
    </section>

    <section class="card"><h3>สำรองข้อมูล</h3>
      <p class="mute small">ข้อมูลเก็บในเครื่องนี้ (IndexedDB${S.persisted ? ' · ระบบล็อกไม่ให้ลบอัตโนมัติแล้ว ✓' : ''}) · ${finished().length} ครั้งการซ้อม · ${S.body.length} บันทึกร่างกาย<br>
      สำรองล่าสุด: ${lastBk ? thDate(lastBk.toISOString().slice(0, 10)) : 'ยังไม่เคย'}</p>
      <div class="row gap wrap"><button class="btn" id="bk">${icon('share', 'inline')} สำรอง (Files / Drive)</button><button class="btn ghost" id="imp">นำเข้าไฟล์</button></div>
      <div id="oldapp"></div>
      <p class="mute tiny">นำเข้าได้ทั้งไฟล์สำรองของแอปนี้ และไฟล์ JSON จากแอป Football log ตัวเก่า (ข้อมูลไม่ซ้ำ ไม่ทับของเดิม)</p>
    </section>

    <section class="card"><h3>ติดตั้งบน iPhone</h3><ol class="cues ol"><li>เปิดลิงก์แอปใน <b>Safari</b></li><li>แตะปุ่มแชร์ ${icon('share', 'inline')}</li><li>เลือก “เพิ่มไปยังหน้าจอโฮม”</li><li>เปิดจากไอคอนบนหน้าจอเสมอ — ใช้ออฟไลน์ในยิมได้</li></ol></section>

    <section class="card"><h3>อันตราย</h3><button class="btn ghost danger" id="reset">ลบข้อมูลทั้งหมด</button></section>
    <p class="mute tiny center">GymLog 3D · v1.0</p>
  </div>`;

  $$('.prog', root).forEach((b) => (b.onclick = async () => {
    if (b.dataset.p === p.id) return;
    if (S.active) return toast('จบการซ้อมที่ค้างอยู่ก่อนสลับโปรแกรม');
    await saveSettings({ programId: b.dataset.p, weekOverride: null });
    toast(`เปลี่ยนเป็น ${PROGRAMS[b.dataset.p].name}`);
  }));
  $('#sd', root).onchange = (e) => saveSettings({ startDate: e.target.value || today() });
  $('#wk', root).onchange = (e) => saveSettings({ weekOverride: e.target.value ? +e.target.value : null });
  $('#wt', root).onchange = (e) => saveSettings({ weeklyTarget: Math.max(1, Math.min(7, +e.target.value || 5)) });
  $('#snd', root).onchange = (e) => saveSettings({ sound: e.target.checked });
  $('#bar', root).onchange = (e) => saveSettings({ barKg: +e.target.value || 20 });
  $('#ht', root).onchange = (e) => saveSettings({ height: +e.target.value || null });
  $('#sty', root).onclick = async (e) => {
    const b = e.target.closest('[data-st]'); if (!b) return;
    const { getViewer } = await import('../ui.js'); (await getViewer()).setStyle(b.dataset.st);
    saveSettings({ style: b.dataset.st });
  };
  $('#bk', root).onclick = doBackup;
  $('#imp', root).onclick = pickImport;
  findOldAppData().then((f) => { const el = $('#oldapp', root); if (!f || !el) return;
    el.innerHTML = `<div class="banner info small">พบข้อมูลแอป Football log ตัวเก่าในเครื่องนี้ <b>${f.sessions} ครั้ง</b> <button class="btn mini" id="oldimp">นำเข้า</button></div>`;
    $('#oldimp', root).onclick = importOldApp; });
  $('#reset', root).onclick = async () => {
    if (!(await confirmBox('ลบข้อมูลทั้งหมด?', `การซ้อม ${finished().length} ครั้งและบันทึกร่างกายจะหายถาวร — สำรองไว้ก่อนถ้ายังไม่ได้ทำ`, 'ลบทั้งหมด', true))) return;
    await resetAll(); location.hash = '#/onboard';
  };
}

export function renderOnboard(root) {
  let step = 0;
  const st = { programId: 'lean5d', startDate: today(), style: 'mannequin', weight: '', waist: '' };
  const draw = () => {
    const steps = [
      `<div class="center-col"><div class="logo">${icon('flame')}</div><h1>GymLog 3D</h1><p class="mute">โปรแกรม · บันทึก · นาฬิกาพัก · ท่าตัวอย่าง 3D<br>ทุกอย่างอยู่ในเครื่อง ใช้ออฟไลน์ในยิมได้</p></div>
       <div class="list">${Object.values(PROGRAMS).map((x) => `<button class="li prog ${x.id === st.programId ? 'on' : ''}" data-p="${x.id}"><span class="grow"><b>${h(x.name)}</b><br><span class="mute small">${h(x.th)} · ${x.days.length} วัน/สัปดาห์ · ${x.weeks} สัปดาห์</span></span>${x.id === st.programId ? icon('check') : ''}</button>`).join('')}</div>
       <label class="field"><span>เริ่มสัปดาห์ที่ 1 วันที่</span><input type="date" id="ob_sd" value="${st.startDate}"></label>`,
      `<h2>เลือกสไตล์หุ่นท่าตัวอย่าง</h2><p class="mute small">เปลี่ยนทีหลังได้ในตั้งค่า</p>
       <div class="v3host ob"></div>
       <div class="seg wide" id="ob_sty"><button data-st="mannequin" class="${st.style === 'mannequin' ? 'on' : ''}">หุ่นขาว (อ่านท่าง่าย)</button><button data-st="anatomy" class="${st.style === 'anatomy' ? 'on' : ''}">กล้ามเนื้อ (เห็นทุกมัด)</button></div>`,
      `<h2>จุดเริ่มต้น</h2><p class="mute small">ใช้ติดตามการลดไขมัน — ข้ามได้ ใส่ทีหลังได้</p>
       <div class="grid2"><label class="field"><span>น้ำหนัก (kg)</span><input id="ob_w" type="number" inputmode="decimal" step="0.1" value="${st.weight}"></label>
       <label class="field"><span>รอบเอว (ซม.)</span><input id="ob_waist" type="number" inputmode="decimal" step="0.5" value="${st.waist}"></label></div>
       <div id="ob_old"></div>
       <div class="banner info small">มีไฟล์สำรองจากแอปเก่า? <button class="btn mini ghost" id="ob_imp">นำเข้าไฟล์</button></div>`,
    ];
    root.innerHTML = `<div class="pad onboard"><div class="dots">${steps.map((_, i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>${steps[step]}
      <div class="row gap">${step ? '<button class="btn ghost grow" id="ob_back">ย้อนกลับ</button>' : ''}<button class="btn grow" id="ob_next">${step === steps.length - 1 ? 'เริ่มใช้งาน' : 'ต่อไป'}</button></div></div>`;
    $$('.prog', root).forEach((b) => (b.onclick = () => { st.programId = b.dataset.p; draw(); }));
    const sd = $('#ob_sd', root); if (sd) sd.onchange = (e) => { st.startDate = e.target.value; };
    if (step === 1) {
      let v; mountViewer($('.v3host', root), { motion: 'backSquat', highlight: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'adductors'] } }).then((x) => { v = x; v.setStyle(st.style); v.setHighlight(['quads', 'glutes'], ['hamstrings', 'adductors']); });
      $('#ob_sty', root).onclick = (e) => { const b = e.target.closest('[data-st]'); if (!b) return; st.style = b.dataset.st; v && (v.setStyle(st.style), v.setHighlight(['quads', 'glutes'], ['hamstrings', 'adductors'])); $$('#ob_sty button', root).forEach((x) => x.classList.toggle('on', x === b)); };
    }
    const imp = $('#ob_imp', root); if (imp) imp.onclick = pickImport;
    if (step === 2) findOldAppData().then((f) => { const el = $('#ob_old', root); if (!f || !el) return;
      el.innerHTML = `<div class="banner warn small"><b>พบข้อมูลจากแอปเก่าในเครื่องนี้ ${f.sessions} ครั้ง</b><br>นำเข้ามาเป็นประวัติได้เลย ไม่ต้อง export <button class="btn mini" id="ob_oldimp">นำเข้า</button></div>`;
      $('#ob_oldimp', root).onclick = async () => { if (await importOldApp()) el.innerHTML = '<div class="banner info small">นำเข้าแล้ว ✓</div>'; }; });
    const back = $('#ob_back', root); if (back) back.onclick = () => { step--; draw(); };
    $('#ob_next', root).onclick = async () => {
      if (step === 2) { st.weight = $('#ob_w', root).value; st.waist = $('#ob_waist', root).value; }
      if (step < 2) { step++; draw(); return; }
      await saveSettings({ programId: st.programId, startDate: st.startDate || today(), style: st.style, onboarded: true });
      if (st.weight || st.waist) { const e = { date: today() }; if (st.weight) e.weight = +st.weight; if (st.waist) e.waist = +st.waist; await logBody(e); }
      location.hash = '#/today';
    };
  };
  draw();
}
