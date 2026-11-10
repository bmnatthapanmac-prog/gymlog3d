import { S, program, currentWeek, blockOf, isDeload, nextDay, scheme, ex, weekSessions, mondayOf, addDays, today, thDate, finished,
  streakWeeks, avg7, buildSession, startSession, doneToday, logBody, thDow } from '../store.js';
import { h, icon, sheet, toast, $, $$ } from '../ui.js';
import { ring } from '../charts.js';
import { keepAwake, unlockAudio } from '../timer.js';

export function estMinutes(day, week) {
  let sec = 0;
  for (const it of day.items) { const s = scheme(it, week); sec += s.sets * (s.rest + 45); }
  return Math.round(sec / 60 + (day.cardio ? day.cardio[blockOf(week).id] || 10 : 0));
}

export function renderToday(root) {
  const p = program(), week = currentWeek(), block = blockOf(week), deload = isDeload(week);
  let pick = nextDay().id;
  const mon = mondayOf(), ws = weekSessions(mon);
  const done = doneToday();
  const target = S.settings.weeklyTarget || p.daysPerWeek;
  const lastBk = S.settings.lastBackup ? Math.floor((Date.now() - S.settings.lastBackup) / 864e5) : null;
  const needBackup = finished().length >= 2 && (lastBk === null || lastBk >= 7);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const bw = avg7('weight');
  const hour = new Date().getHours();
  const greet = hour < 11 ? 'อรุณสวัสดิ์' : hour < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';

  const draw = () => {
    const day = p.days.find((d) => d.id === pick);
    const mins = estMinutes(day, week);
    root.innerHTML = `
    <header class="top">
      <div><div class="mute small">${thDate(today(), true)}</div><h1>${greet}</h1></div>
      <a href="#/settings" class="icon-btn" aria-label="ตั้งค่า">${icon('gear')}</a>
    </header>
    <div class="pad">
      <div class="chips">
        <span class="chip acc">${h(p.name)}</span>
        <span class="chip">สัปดาห์ ${week}/${p.weeks}</span>
        <span class="chip">${h(block.name)}</span>
        ${deload ? '<span class="chip warn">Deload</span>' : ''}
      </div>

      ${!standalone ? `<div class="banner info"><b>ติดตั้งเป็นแอป</b> — ข้อมูลจะอยู่ถาวรกว่าเปิดในเบราว์เซอร์<br><span class="small">Safari → ปุ่มแชร์ ${icon('share', 'inline')} → “เพิ่มไปยังหน้าจอโฮม”</span></div>` : ''}
      ${needBackup ? `<div class="banner warn"><b>ถึงเวลาสำรองข้อมูล</b> ${lastBk === null ? 'ยังไม่เคยสำรอง' : `สำรองล่าสุด ${lastBk} วันก่อน`}<br><a href="#/settings" class="small">ไปที่ตั้งค่า → สำรองข้อมูล ›</a></div>` : ''}

      ${S.active ? `<a href="#/workout" class="card resume"><div><div class="mute small">ซ้อมค้างอยู่</div><h2>${h(S.active.dayName)}</h2></div><span class="btn">ทำต่อ ›</span></a>` : ''}

      <section class="card hero" style="--day:${day.color}">
        <div class="row between">
          <div>
            <div class="mute small">${done.length ? 'ซ้อมไปแล้ววันนี้ ✓ · เลือกวันอื่นได้' : 'วันนี้ซ้อม'}</div>
            <h2 class="dayname">${h(day.name)}</h2>
            <div class="mute">${h(day.th)}</div>
          </div>
          <div class="est"><b>${mins}</b><span>นาที</span></div>
        </div>
        <div class="daypick">${p.days.map((d) => `<button data-day="${d.id}" class="${d.id === pick ? 'on' : ''}" style="--c:${d.color}">${h(d.short)}</button>`).join('')}</div>
        <ol class="plan">
          ${day.items.map((it) => {
            const sw = S.settings.subs[`${p.id}|${day.id}|${it.ex}`] || it.ex, e = ex(sw), sc = scheme(it, week);
            return `<li><span class="nm">${it.ss ? `<i class="ss">${it.ss}</i>` : ''}${h(e.name)}</span><span class="mono">${sc.sets}×${h(sc.reps)}</span></li>`;
          }).join('')}
          ${day.cardio ? `<li class="cardio"><span class="nm">${icon('flame', 'inline')} ${h(ex(day.cardio.ex).th)}</span><span class="mono">${day.cardio[block.id] || 10} นาที</span></li>` : ''}
        </ol>
        <button class="btn big" id="start" ${S.active ? 'disabled' : ''}>${icon('play')} เริ่มซ้อม</button>
      </section>

      <section class="card">
        <div class="row between"><h3>สัปดาห์นี้</h3><a href="#/progress" class="small">ดูทั้งหมด ›</a></div>
        <div class="row gap center">
          ${ring(ws.length / target, { size: 70, label: `${ws.length}/${target}` })}
          <div class="week">${[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const d = addDays(mon, i), s = ws.filter((x) => x.date === d);
            const pd = s[0] && p.days.find((x) => x.id === s[0].dayId);
            return `<div class="wd ${s.length ? 'done' : ''} ${d === today() ? 'today' : ''}" style="${pd ? `--c:${pd.color}` : ''}"><span>${thDow(d)}</span><b>${s.length ? (pd ? pd.short[0] : '✓') : parseInt(d.slice(8))}</b></div>`;
          }).join('')}</div>
        </div>
      </section>

      <div class="stats3">
        <div class="stat"><b>${streakWeeks(3)}</b><span>สัปดาห์ติด</span></div>
        <div class="stat"><b>${finished().length}</b><span>ครั้งทั้งหมด</span></div>
        <button class="stat" id="bw"><b>${bw ? bw.toFixed(1) : '—'}</b><span>น้ำหนัก (เฉลี่ย 7 วัน) ${icon('plus', 'inline')}</span></button>
      </div>

      <section class="card">
        <h3>${h(block.name)}</h3>
        <p><b>โฟกัส:</b> ${h(block.focus)}</p>
        <p class="mute small">${h(block.why)}</p>
      </section>

      ${finished().length ? `<section class="card"><div class="row between"><h3>ล่าสุด</h3></div>
        <div class="list">${finished().slice(-5).reverse().map((s) => `<a class="li" href="#/session/${s.id}">
          <span class="dotc" style="--c:${(program(s.programId).days.find((d) => d.id === s.dayId) || {}).color || '#888'}"></span>
          <span class="grow"><b>${h(s.dayName)}</b><span class="mute small"> · ${thDate(s.date, true)}</span></span>
          <span class="mute small">${s.summary ? `${s.summary.sets} เซ็ต · ${s.summary.durationMin} น.` : ''}</span></a>`).join('')}</div></section>` : ''}
    </div>`;

    $$('.daypick button', root).forEach((b) => (b.onclick = () => { pick = b.dataset.day; draw(); }));
    $('#start', root).onclick = () => readiness(pick);
    $('#bw', root).onclick = bodySheet;
  };
  draw();
}

function readiness(dayId) {
  unlockAudio();
  const Q = [['sleep', 'นอนเมื่อคืน', ['แย่มาก', '', 'ปกติ', '', 'ดีมาก']], ['energy', 'พลังงานตอนนี้', ['หมดแรง', '', 'ปกติ', '', 'เต็มที่']], ['sore', 'ปวดเมื่อย', ['ปวดมาก', '', 'นิดหน่อย', '', 'ไม่ปวด']]];
  const v = { sleep: 3, energy: 3, sore: 3 };
  sheet(`<h3>เช็กความพร้อมก่อนซ้อม</h3><p class="mute small">ใช้ตัดสินว่าวันนี้ควรซ้อมเต็มหรือเบาลง — ซ้อมเบาบ้างไม่ได้ทำให้ถอยหลัง แต่ฝืนตอนร่างกายไม่พร้อมทำให้เจ็บ</p>
    ${Q.map(([k, t, labels]) => `<div class="q"><div class="row between"><b>${t}</b><span class="mute small" id="l_${k}">${labels[2]}</span></div>
      <div class="scale" data-k="${k}">${[1, 2, 3, 4, 5].map((n) => `<button data-n="${n}" class="${n === 3 ? 'on' : ''}">${n}</button>`).join('')}</div></div>`).join('')}
    <label class="toggle"><input type="checkbox" id="light"><span>โหมดเบา — ลดท่าละ 1 เซ็ต</span></label>
    <div id="advice" class="banner info small"></div>
    <button class="btn big" id="go">${icon('play')} เริ่มเลย</button>`, {
    onOpen: (el, close) => {
      const upd = () => {
        const avg = (v.sleep + v.energy + v.sore) / 3;
        const light = avg <= 2.34;
        el.querySelector('#light').checked = light;
        el.querySelector('#advice').innerHTML = light ? '<b>แนะนำโหมดเบา</b> วันนี้ร่างกายยังฟื้นไม่เต็มที่ ทำท่าหลักให้ครบแต่ลดเซ็ต' : avg >= 4 ? '<b>พร้อมเต็มที่</b> ลองดันน้ำหนักตามที่แอปแนะนำ' : 'พร้อมปกติ ซ้อมตามแผน';
      };
      el.querySelectorAll('.scale').forEach((sc) => sc.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return; const k = sc.dataset.k; v[k] = +b.dataset.n;
        sc.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
        const lab = Q.find((q) => q[0] === k)[2]; el.querySelector('#l_' + k).textContent = lab[v[k] - 1] || v[k];
        upd();
      }));
      upd();
      el.querySelector('#go').onclick = async () => {
        const s = buildSession(dayId, { light: el.querySelector('#light').checked, readiness: { ...v } });
        await startSession(s); keepAwake(true); close(); location.hash = '#/workout';
      };
    },
  });
}

export function bodySheet() {
  const last = S.body[S.body.length - 1] || {};
  sheet(`<h3>บันทึกร่างกาย</h3><p class="mute small">ชั่งตอนเช้าหลังเข้าห้องน้ำ ก่อนกิน — ตัวเลขรายวันแกว่ง ±1 kg เป็นปกติ ให้ดูค่าเฉลี่ย 7 วัน</p>
    <div class="grid2">
      <label class="field"><span>น้ำหนัก (kg)</span><input id="bw_w" type="number" inputmode="decimal" step="0.1" placeholder="${last.weight || ''}"></label>
      <label class="field"><span>รอบเอว (ซม.)</span><input id="bw_waist" type="number" inputmode="decimal" step="0.5" placeholder="${last.waist || ''}"></label>
    </div>
    <label class="field"><span>วันที่</span><input id="bw_d" type="date" value="${today()}"></label>
    <button class="btn big" id="bw_save">บันทึก</button>`, {
    onOpen: (el, close) => {
      el.querySelector('#bw_w').focus();
      el.querySelector('#bw_save').onclick = async () => {
        const w = parseFloat(el.querySelector('#bw_w').value), wa = parseFloat(el.querySelector('#bw_waist').value);
        if (!w && !wa) return toast('ใส่อย่างน้อย 1 ค่า');
        const e = { date: el.querySelector('#bw_d').value || today() }; if (w) e.weight = w; if (wa) e.waist = wa;
        await logBody(e); close(); toast('บันทึกแล้ว');
      };
    },
  });
}
