import { S, ex, saveActive, lastPerf, finishActive, discardActive, saveSettings, thDate, LB, fmtW, allExercises, repRange, suggest, program, emit } from '../store.js';
import { MUSCLES } from '../three/rig.js';
import { h, icon, sheet, toast, confirmBox, mountViewer, $, $$, fmtDur, fmtClock } from '../ui.js';
import { startRest, addRest, stopRest, onTimer, remaining, restState, keepAwake, unlockAudio } from '../timer.js';
import { EQ_TH } from '../../data/exercises.js';

let openIdx = 0, showCues = false;

export function renderWorkout(root) {
  const s = S.active;
  if (!s) { root.innerHTML = `<div class="pad center-col"><h2>ไม่มีการซ้อมที่ค้างอยู่</h2><a class="btn" href="#/today">กลับหน้าแรก</a></div>`; return; }
  openIdx = Math.min(openIdx, s.items.length - 1);
  const firstOpen = s.items.findIndex((it) => it.sets.some((x) => !x.done));
  if (!s.items[openIdx] || s.items[openIdx].sets.every((x) => x.done)) openIdx = firstOpen >= 0 ? firstOpen : 0;

  root.innerHTML = `
  <header class="top sticky wk">
    <a href="#/today" class="icon-btn" aria-label="กลับ">${icon('back')}</a>
    <div class="grow"><div class="mute small">สัปดาห์ ${s.week}${s.deload ? ' · Deload' : ''}${s.light ? ' · โหมดเบา' : ''}</div><h2>${h(s.dayName)}</h2></div>
    <span class="clock mono" id="clock">0:00</span>
    <button class="icon-btn" id="menu" aria-label="เมนู">${icon('dots')}</button>
  </header>
  <div class="progress-line"><i id="pbar"></i></div>
  <div class="pad" id="items"></div>
  <div class="pad">
    <label class="field"><span>โน้ตของวันนี้</span><textarea id="snote" rows="2" placeholder="รู้สึกยังไง เจ็บตรงไหน นอนน้อย ฯลฯ">${h(s.note || '')}</textarea></label>
    <button class="btn big" id="finish">${icon('check')} จบการซ้อม</button>
    <div style="height:120px"></div>
  </div>
  <div id="restbar" hidden></div>`;

  const items = $('#items', root);
  const clock = $('#clock', root);
  const tick = () => { clock.textContent = fmtClock(Date.now() - s.startedAt); };
  tick(); const clockId = setInterval(tick, 1000);

  function progress() {
    const all = s.items.reduce((a, it) => a + it.sets.length, 0), d = s.items.reduce((a, it) => a + it.sets.filter((x) => x.done).length, 0);
    $('#pbar', root).style.width = (all ? (d / all) * 100 : 0) + '%';
  }

  function drawItems() {
    items.innerHTML = s.items.map((it, i) => card(it, i)).join('') + cardioCard();
    progress();
    const host = $('.v3host', items);
    if (host) {
      const it = s.items[openIdx], e = ex(it.ex);
      mountViewer(host, { motion: e.motion, highlight: { primary: e.primary, secondary: e.secondary } });
    }
  }

  function card(it, i) {
    const e = ex(it.ex), open = i === openIdx, nd = it.sets.filter((x) => x.done).length;
    const complete = nd === it.sets.length && nd > 0;
    const last = lastPerf(it.ex, s.id);
    const unitLbl = e.kind === 'bw' ? '+kg' : e.kind === 'time' ? '' : it.unit;
    const repLbl = e.kind === 'time' ? 'วินาที' : 'ครั้ง';
    const sug = it.suggest || {};
    if (!open) return `<section class="card ex-card collapsed ${complete ? 'complete' : ''}" data-i="${i}">
      <div class="ex-head"><span class="num">${complete ? icon('check') : i + 1}</span><div class="grow"><b>${it.ss ? `<i class="ss">${it.ss}</i>` : ''}${h(e.name)}</b><div class="mute small">${h(e.th)} · ${it.scheme.sets}×${h(it.scheme.reps)}</div></div><span class="badge">${nd}/${it.sets.length}</span></div></section>`;
    return `<section class="card ex-card open" data-i="${i}">
      <div class="ex-head"><span class="num">${i + 1}</span><div class="grow"><b>${it.ss ? `<i class="ss">${it.ss}</i>` : ''}${h(e.name)}</b><div class="mute small">${h(e.th)}${it.ex !== it.origEx ? ` · แทน ${h(ex(it.origEx).name)}` : ''}</div></div><span class="badge">${nd}/${it.sets.length}</span></div>
      <div class="v3wrap"><div class="v3host"></div>
        <div class="v3tags">${e.primary.map((m) => `<span class="mtag p">${MUSCLES[m] ? MUSCLES[m].th : m}</span>`).join('')}${e.secondary.slice(0, 3).map((m) => `<span class="mtag">${MUSCLES[m] ? MUSCLES[m].th : m}</span>`).join('')}</div>
        <button class="v3cue" data-act="cues">${showCues ? 'ซ่อนวิธีทำ' : 'วิธีทำ'}</button>
      </div>
      ${showCues ? `<ul class="cues">${e.cues.map((c) => `<li>${h(c)}</li>`).join('')}${e.mistakes.length ? `<li class="bad">ระวัง: ${h(e.mistakes.join(' · '))}</li>` : ''}</ul>` : ''}
      <div class="plan-line"><span>${it.scheme.sets} เซ็ต × ${h(it.scheme.reps)}</span>${it.scheme.rpe && it.scheme.rpe !== '-' ? `<span>RPE ${h(it.scheme.rpe)}</span>` : ''}<span>${icon('timer', 'inline')} ${fmtDur(it.scheme.rest)}</span></div>
      ${sug.why ? `<div class="suggest ${sug.up ? 'up' : sug.down ? 'down' : ''}">${sug.up ? '▲' : sug.down ? '▼' : '●'} ${h(sug.why)}</div>` : ''}
      ${it.planNote ? `<div class="mute small note-plan">${h(it.planNote)}</div>` : ''}
      ${last ? `<div class="last mute small">ครั้งก่อน ${thDate(last.session.date)}: ${last.sets.map((x) => `${fmtW(+x.w || 0)}×${x.r}`).join(', ')}</div>` : ''}
      <table class="sets"><thead><tr><th>เซ็ต</th><th>ครั้งก่อน</th>${e.kind === 'time' ? '' : `<th>${h(unitLbl)}</th>`}<th>${repLbl}</th><th>RPE</th><th></th></tr></thead><tbody>
      ${it.sets.map((st, j) => {
        const pv = last && last.sets[j];
        return `<tr class="${st.done ? 'done' : ''}" data-j="${j}"><td class="sn">${j + 1}</td>
          <td class="pv mono">${pv ? `${e.kind === 'time' ? '' : fmtW(+pv.w || 0) + '×'}${pv.r}` : '—'}</td>
          ${e.kind === 'time' ? '' : `<td><input class="in w" type="number" inputmode="decimal" step="any" value="${st.w ?? ''}" placeholder="${sug.w ?? ''}" data-f="w"></td>`}
          <td><input class="in r" type="number" inputmode="numeric" value="${st.r ?? ''}" placeholder="${sug.r ?? (repRange(it.scheme.reps) || [''])[0]}" data-f="r"></td>
          <td><input class="in rpe" type="number" inputmode="decimal" step="0.5" min="5" max="10" value="${st.rpe ?? ''}" placeholder="-" data-f="rpe"></td>
          <td><button class="tick" data-act="tick" aria-label="เสร็จเซ็ต">${icon('check')}</button></td></tr>`;
      }).join('')}</tbody></table>
      ${it.unit === 'lb' && it.sets.some((x) => +x.w) ? `<div class="mute small conv">${fmtW(+(it.sets.find((x) => +x.w) || {}).w)} lb ≈ ${(+(it.sets.find((x) => +x.w) || {}).w * LB).toFixed(1)} kg</div>` : ''}
      ${it.perSide ? '<div class="mute small conv">น้ำหนักต่อข้าง</div>' : ''}
      <div class="ex-actions">
        <button data-act="addset">${icon('plus', 'inline')} เซ็ต</button>
        <button data-act="rmset">− เซ็ต</button>
        ${last ? '<button data-act="same">เท่าครั้งก่อน</button>' : ''}
        ${e.eq === 'barbell' ? '<button data-act="plates">แผ่นบาร์</button>' : ''}
        <button data-act="swap">${icon('swap', 'inline')} สลับท่า</button>
        <button data-act="note">${icon('note', 'inline')} โน้ต</button>
        <a href="#/library/${e.id}" class="lnk">รายละเอียด</a>
      </div>
      ${it.note ? `<div class="mute small">📝 ${h(it.note)}</div>` : ''}
    </section>`;
  }

  function cardioCard() {
    const c = s.cardio; if (!c) return '';
    const e = ex(c.ex);
    return `<section class="card cardio-card ${c.done ? 'complete' : ''}"><div class="ex-head"><span class="num">${icon('flame')}</span>
      <div class="grow"><b>ปิดท้าย: ${h(e.th)}</b><div class="mute small">${h(c.note || '')}</div></div></div>
      <div class="row gap center"><label class="field grow"><span>นาที</span><input type="number" inputmode="numeric" id="cmin" value="${c.min}"></label>
      <button class="btn ${c.done ? 'ok' : 'ghost'}" id="cdone">${c.done ? '✓ เสร็จแล้ว' : 'ทำเสร็จ'}</button></div></section>`;
  }

  // ---------- events
  items.addEventListener('click', (ev) => {
    const cardEl = ev.target.closest('.ex-card'); if (!cardEl) return;
    const i = +cardEl.dataset.i, it = s.items[i];
    const act = ev.target.closest('[data-act]');
    if (!act) { if (cardEl.classList.contains('collapsed')) { openIdx = i; drawItems(); cardEl.scrollIntoView({ block: 'start', behavior: 'smooth' }); } return; }
    const a = act.dataset.act, row = ev.target.closest('tr');
    if (a === 'tick') tickSet(i, +row.dataset.j);
    else if (a === 'cues') { showCues = !showCues; drawItems(); }
    else if (a === 'addset') { const lastSet = it.sets[it.sets.length - 1] || {}; it.sets.push({ w: lastSet.w ?? '', r: '', rpe: '', done: false }); saveActive(); drawItems(); }
    else if (a === 'rmset') { const k = it.sets.map((x) => x.done).lastIndexOf(false); if (k >= 0 && it.sets.length > 1) { it.sets.splice(k, 1); saveActive(); drawItems(); } }
    else if (a === 'same') { const last = lastPerf(it.ex, s.id); it.sets.forEach((st, j) => { const pv = last.sets[j] || last.sets[last.sets.length - 1]; if (!st.done) { st.w = pv.w; st.r = pv.r; } }); saveActive(); drawItems(); }
    else if (a === 'plates') plateSheet(it);
    else if (a === 'swap') swapSheet(i);
    else if (a === 'note') noteSheet(it);
  });

  items.addEventListener('input', (ev) => {
    const inp = ev.target.closest('input.in'); if (!inp) return;
    const i = +inp.closest('.ex-card').dataset.i, j = +inp.closest('tr').dataset.j, f = inp.dataset.f;
    const it = s.items[i]; it.sets[j][f] = inp.value === '' ? '' : +inp.value;
    if (f === 'w') for (let k = j + 1; k < it.sets.length; k++) if (!it.sets[k].done) { it.sets[k].w = it.sets[j][f]; const el = $(`.ex-card[data-i="${i}"] tr[data-j="${k}"] input.w`, items); if (el) el.value = it.sets[k].w; }
    saveActive();
  });
  items.addEventListener('focusin', (ev) => { if (ev.target.matches('input.in')) setTimeout(() => ev.target.select && ev.target.select(), 0); });
  items.addEventListener('change', (ev) => {
    if (ev.target.id === 'cmin') { s.cardio.min = +ev.target.value; saveActive(); }
  });
  items.addEventListener('click', (ev) => {
    if (ev.target.closest('#cdone')) { s.cardio.done = !s.cardio.done; saveActive(); drawItems(); }
  });

  function tickSet(i, j) {
    unlockAudio();
    const it = s.items[i], st = it.sets[j], e = ex(it.ex), sug = it.suggest || {};
    if (st.done) { st.done = false; saveActive(); drawItems(); return; }
    if (e.kind !== 'time' && (st.w === '' || st.w == null)) st.w = sug.w === '' || sug.w == null ? 0 : +sug.w;
    if (st.r === '' || st.r == null) { const ph = sug.r || (repRange(it.scheme.reps) || [0])[0]; if (!ph) return toast('ใส่จำนวนครั้งก่อน'); st.r = +ph; }
    st.done = true; st.at = Date.now();
    if (navigator.vibrate) navigator.vibrate(30);
    for (let k = j + 1; k < it.sets.length; k++) if (!it.sets[k].done && (it.sets[k].w === '' || it.sets[k].w == null)) it.sets[k].w = st.w;
    saveActive();
    const allDone = it.sets.every((x) => x.done);
    const partner = it.ss ? s.items.findIndex((x, k) => k !== i && x.ss === it.ss && x.sets.some((y) => !y.done)) : -1;
    const lastOfAll = s.items.every((x) => x.sets.every((y) => y.done));
    if (partner >= 0) { openIdx = partner; startRest(20, `ต่อท่าคู่ ${it.ss}: ${ex(s.items[partner].ex).name}`); }
    else if (!lastOfAll) {
      if (allDone) { const nx = s.items.findIndex((x) => x.sets.some((y) => !y.done)); if (nx >= 0) openIdx = nx; }
      const nextIt = s.items[openIdx];
      startRest(it.scheme.rest, allDone ? `ต่อไป: ${ex(nextIt.ex).name}` : `เซ็ตที่ ${j + 2} · ${e.name}`);
    } else { stopRest(); toast('ครบทุกเซ็ตแล้ว 💪 อย่าลืม cardio ปิดท้าย'); }
    drawItems();
    if (allDone || partner >= 0) setTimeout(() => { const el = $(`.ex-card[data-i="${openIdx}"]`, items); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 60);
  }

  function swapSheet(i) {
    const it = s.items[i], cur = ex(it.ex), orig = ex(it.origEx);
    const alts = [...new Set([...(orig.alts || []), ...(cur.alts || []), it.origEx])].filter((x) => x !== it.ex);
    const same = allExercises().filter((x) => x.id !== it.ex && !alts.includes(x.id) && x.primary.some((m) => cur.primary.includes(m)));
    const li = (x) => `<button class="li" data-id="${x.id}"><span class="grow"><b>${h(x.name)}</b><span class="mute small"> ${h(x.th)} · ${EQ_TH[x.eq] || ''}</span></span>›</button>`;
    sheet(`<h3>สลับท่า</h3><p class="mute small">เครื่องไม่ว่าง หรือเจ็บท่านี้ เลือกท่าที่ใช้กล้ามเดียวกัน</p>
      <div class="list">${alts.map((id) => li(ex(id))).join('')}</div>
      ${same.length ? `<h4 class="mute">กล้ามเดียวกัน</h4><div class="list">${same.slice(0, 8).map(li).join('')}</div>` : ''}
      <label class="toggle"><input type="checkbox" id="remember"><span>ใช้ท่านี้แทนถาวรในวันนี้ของโปรแกรม</span></label>`, {
      onOpen: (el, close) => el.addEventListener('click', async (e2) => {
        const b = e2.target.closest('[data-id]'); if (!b) return;
        const nx = ex(b.dataset.id);
        it.ex = nx.id; it.unit = nx.unit; it.perSide = nx.perSide;
        it.suggest = suggest(nx.id, it.scheme, nx.id === it.origEx ? (program().days.find((d) => d.id === s.dayId)?.items.find((x) => x.ex === it.origEx) || {}).start : 0, s.id);
        it.sets.forEach((st) => { if (!st.done) st.w = it.suggest.w; });
        if (el.querySelector('#remember').checked) { const subs = { ...S.settings.subs, [`${s.programId}|${s.dayId}|${it.origEx}`]: nx.id }; if (nx.id === it.origEx) delete subs[`${s.programId}|${s.dayId}|${it.origEx}`]; await saveSettings({ subs }); }
        saveActive(); close(); drawItems();
      }),
    });
  }

  function noteSheet(it) {
    sheet(`<h3>โน้ตท่านี้</h3><textarea id="nt" rows="3" placeholder="เช่น ไหล่ซ้ายตึง · ใช้เครื่องตัวที่ 2 · ที่นั่งช่อง 4">${h(it.note || '')}</textarea><button class="btn big" id="ntok">บันทึก</button>`,
      { onOpen: (el, close) => { el.querySelector('#nt').focus(); el.querySelector('#ntok').onclick = () => { it.note = el.querySelector('#nt').value.trim(); saveActive(); close(); drawItems(); }; } });
  }

  function plateSheet(it) {
    const st = it.sets.find((x) => !x.done) || it.sets[it.sets.length - 1];
    const calc = (total) => {
      let side = (total - S.settings.barKg) / 2; const out = [];
      if (side < 0) return { out, rest: side };
      for (const p of S.settings.plates) while (side >= p - 1e-6) { out.push(p); side -= p; }
      return { out, rest: side };
    };
    sheet(`<h3>คำนวณแผ่นบาร์</h3><label class="field"><span>น้ำหนักรวม (kg) · บาร์ ${S.settings.barKg} kg</span><input id="pt" type="number" inputmode="decimal" value="${+st.w || ''}"></label><div id="pout" class="plates"></div>`, {
      onOpen: (el) => {
        const upd = () => {
          const t = +el.querySelector('#pt').value || 0, r = calc(t);
          el.querySelector('#pout').innerHTML = t < S.settings.barKg ? '<p class="mute">น้อยกว่าน้ำหนักบาร์เปล่า</p>' :
            `<div class="mute small">ใส่ข้างละ</div><div class="barviz">${r.out.map((p) => `<span class="pl" style="--s:${0.5 + p / 25 * 0.6}">${p}</span>`).join('') || '<span class="mute">บาร์เปล่า</span>'}</div>${r.rest > 0.01 ? `<p class="mute small">เหลือเศษ ${r.rest.toFixed(2)} kg ต่อข้าง — ไม่มีแผ่นขนาดนี้</p>` : ''}`;
        };
        el.querySelector('#pt').oninput = upd; upd();
      },
    });
  }

  // ---------- rest bar
  const bar = $('#restbar', root);
  const drawRest = (left, r, fin) => {
    if (!r) { bar.hidden = true; return; }
    bar.hidden = false;
    const f = r.total ? left / r.total : 0;
    bar.className = left <= 0 || fin ? 'rest-done' : '';
    bar.innerHTML = `<div class="rest-ring" style="--f:${f}"><span class="mono">${left > 0 ? fmtDur(left) : 'ไปต่อ!'}</span></div>
      <div class="grow"><div class="small mute">พัก</div><div class="rest-label">${h(r.label || '')}</div></div>
      <button data-r="-15">−15</button><button data-r="15">+15</button><button data-r="skip" class="skip">ข้าม</button>`;
  };
  bar.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.r === 'skip') stopRest(); else addRest(+b.dataset.r); });
  const offTimer = onTimer(drawRest);
  drawRest(remaining(), restState());

  $('#snote', root).oninput = (e) => { s.note = e.target.value; saveActive(); };
  $('#finish', root).onclick = async () => {
    const left = s.items.reduce((a, it) => a + it.sets.filter((x) => !x.done).length, 0);
    const doneN = s.items.reduce((a, it) => a + it.sets.filter((x) => x.done).length, 0);
    if (!doneN) return toast('ยังไม่ได้บันทึกเซ็ตไหนเลย');
    if (left && !(await confirmBox('จบการซ้อม?', `ยังเหลือ ${left} เซ็ตที่ไม่ได้ติ๊ก — เซ็ตพวกนั้นจะไม่ถูกบันทึก`, 'จบเลย'))) return;
    stopRest(); keepAwake(false);
    const done = await finishActive();
    location.hash = '#/summary/' + done.id;
  };
  $('#menu', root).onclick = () => sheet(`<h3>${h(s.dayName)}</h3><div class="list">
      <button class="li" id="mDiscard"><span class="grow" style="color:var(--bad)">ยกเลิกการซ้อมนี้ (ไม่บันทึก)</span></button></div>`,
    { onOpen: (el, close) => { el.querySelector('#mDiscard').onclick = async () => { close(); if (await confirmBox('ยกเลิกการซ้อม?', 'ข้อมูลที่จดไว้ในครั้งนี้จะหายทั้งหมด', 'ยกเลิกการซ้อม', true)) { stopRest(); keepAwake(false); await discardActive(); location.hash = '#/today'; } }; } });

  drawItems();
  keepAwake(true);
  return () => { clearInterval(clockId); offTimer(); };
}
