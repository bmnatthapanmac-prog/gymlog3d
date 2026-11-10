import { S, allExercises, ex, history, e1rm, toKg, fmtW, thDate } from '../store.js';
import { MUSCLES } from '../three/rig.js';
import { GROUPS, EQ_TH } from '../../data/exercises.js';
import { h, icon, mountViewer, $, $$ } from '../ui.js';
import { addExercise } from './body.js';

let q = '', gf = 'all', ef = 'all';
const EQ_SHORT = { barbell: 'BB', dumbbell: 'DB', machine: 'MC', cable: 'CB', bodyweight: 'BW', cardio: '♥' };

export function renderLibrary(root) {
  const draw = () => {
    const list = allExercises().filter((e) =>
      (gf === 'all' || e.primary.some((m) => GROUPS[gf].muscles.includes(m)) || (gf === 'cardio' && e.eq === 'cardio')) &&
      (ef === 'all' || e.eq === ef) &&
      (!q || (e.name + ' ' + e.th + ' ' + e.primary.map((m) => MUSCLES[m] ? MUSCLES[m].th : '').join(' ')).toLowerCase().includes(q.toLowerCase())));
    $('#exlist', root).innerHTML = list.length ? list.map((e) => `<a class="exrow" href="#/library/${e.id}">
      <span class="eqi eq-${e.eq}">${EQ_SHORT[e.eq] || '?'}</span>
      <span class="grow"><b>${h(e.name)}</b><span class="mute small">${h(e.th)}</span>
      <span class="mtags">${e.primary.map((m) => `<i class="mtag p">${MUSCLES[m] ? MUSCLES[m].th : m}</i>`).join('')}</span></span><span class="mute">›</span></a>`).join('') : '<div class="empty">ไม่พบท่า</div>';
  };
  root.innerHTML = `
  <header class="top"><div><div class="mute small">${allExercises().length} ท่า · ทุกท่ามีหุ่น 3D</div><h1>คลังท่า</h1></div></header>
  <div class="pad">
    <input class="search" id="q" type="search" placeholder="ค้นหา เช่น squat, อก, ไหล่" value="${h(q)}">
    <div class="chips scroll" id="gf">${[['all', 'ทั้งหมด'], ...Object.entries(GROUPS).map(([k, g]) => [k, g.th]), ['cardio', 'คาร์ดิโอ']].map(([k, t]) => `<button data-g="${k}" class="chip ${gf === k ? 'acc' : ''}">${t}</button>`).join('')}</div>
    <div class="chips scroll" id="ef">${[['all', 'อุปกรณ์ทั้งหมด'], ...Object.entries(EQ_TH).filter(([k]) => k !== 'cardio')].map(([k, t]) => `<button data-e="${k}" class="chip ${ef === k ? 'acc' : ''}">${t}</button>`).join('')}</div>
    <div id="exlist" class="exlist"></div>
  </div>`;
  $('#q', root).oninput = (e) => { q = e.target.value; draw(); };
  $('#gf', root).onclick = (e) => { const b = e.target.closest('[data-g]'); if (!b) return; gf = b.dataset.g; $$('#gf .chip', root).forEach((x) => x.classList.toggle('acc', x === b)); draw(); };
  $('#ef', root).onclick = (e) => { const b = e.target.closest('[data-e]'); if (!b) return; ef = b.dataset.e; $$('#ef .chip', root).forEach((x) => x.classList.toggle('acc', x === b)); draw(); };
  draw();
}

export function renderExDetail(root, id) {
  const e = ex(id), hs = history(id);
  let best = null;
  for (const x of hs) for (const st of x.sets) { const v = e1rm(toKg(+st.w || 0, x.item.unit || e.unit), +st.r || 0); if (!best || v > best.v) best = { v, st, date: x.session.date }; }
  const last = hs[hs.length - 1];
  const yt = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(e.name + ' proper form');
  root.innerHTML = `
  <header class="top sticky"><a href="javascript:history.back()" class="icon-btn">${icon('back')}</a><div class="grow"><div class="mute small">${h(e.th)} · ${EQ_TH[e.eq] || ''}</div><h2>${h(e.name)}</h2></div></header>
  <div class="detail-stage"><div class="v3host tall"></div>
    <div class="v3ctl"><button id="pp">${icon('pause')}</button>
      <div class="seg" id="spd"><button data-s="0.5">0.5×</button><button data-s="1" class="on">1×</button><button data-s="1.5">1.5×</button></div>
      <div class="seg" id="sty"><button data-st="mannequin" class="${S.settings.style === 'mannequin' ? 'on' : ''}">หุ่น</button><button data-st="anatomy" class="${S.settings.style === 'anatomy' ? 'on' : ''}">กล้าม</button></div></div>
  </div>
  <div class="pad">
    <div class="mtags big">${e.primary.map((m) => `<i class="mtag p">${MUSCLES[m] ? MUSCLES[m].th : m}</i>`).join('')}${e.secondary.map((m) => `<i class="mtag">${MUSCLES[m] ? MUSCLES[m].th : m}</i>`).join('')}</div>
    <section class="card"><h3>วิธีทำ</h3><ol class="cues ol">${e.cues.map((c) => `<li>${h(c)}</li>`).join('')}</ol>
      ${e.mistakes.length ? `<h4 class="bad">ข้อผิดพลาดที่เจอบ่อย</h4><ul class="cues">${e.mistakes.map((c) => `<li>${h(c)}</li>`).join('')}</ul>` : ''}
      <a class="btn ghost" href="${yt}" target="_blank" rel="noopener">${icon('video', 'inline')} ดูคลิปคนจริงบน YouTube</a></section>
    ${hs.length ? `<a class="card statlink" href="#/progress/ex/${e.id}"><div class="stats3 flat">
      <div class="stat"><b>${hs.length}</b><span>ครั้งที่ทำ</span></div>
      <div class="stat"><b>${best ? best.v.toFixed(1) : '-'}</b><span>e1RM (kg)</span></div>
      <div class="stat"><b>${last ? last.sets.map((s) => s.r).join('/') : '-'}</b><span>ครั้งล่าสุด (reps)</span></div></div><div class="mute small">ดูกราฟและประวัติ ›</div></a>` : ''}
    ${e.alts.length ? `<section class="card"><h3>ท่าทดแทน</h3><div class="list">${e.alts.map((a) => `<a class="li" href="#/library/${a}"><span class="grow"><b>${h(ex(a).name)}</b><span class="mute small"> ${h(ex(a).th)}</span></span>›</a>`).join('')}</div></section>` : ''}
    ${e.kind !== 'cardio' ? `<button class="btn big" id="addnow">${icon('plus', 'inline')} ${S.active ? 'เพิ่มเข้าการซ้อมตอนนี้' : 'ซ้อมท่านี้เลย'}</button>` : ''}
  </div>`;
  let playing = true, v = null;
  mountViewer($('.v3host', root), { motion: e.motion, highlight: { primary: e.primary, secondary: e.secondary } }).then((x) => { v = x; });
  $('#pp', root).onclick = () => { playing = !playing; v && v.setPlaying(playing); $('#pp', root).innerHTML = icon(playing ? 'pause' : 'play'); };
  $('#spd', root).onclick = (ev) => { const b = ev.target.closest('[data-s]'); if (!b || !v) return; v.setSpeed(+b.dataset.s); $$('#spd button', root).forEach((x) => x.classList.toggle('on', x === b)); };
  $('#sty', root).onclick = async (ev) => {
    const b = ev.target.closest('[data-st]'); if (!b || !v) return;
    const { saveSettings } = await import('../store.js');
    v.setStyle(b.dataset.st); v.setHighlight(e.primary, e.secondary); saveSettings({ style: b.dataset.st });
    $$('#sty button', root).forEach((x) => x.classList.toggle('on', x === b));
  };
  const add = $('#addnow', root); if (add) add.onclick = () => addExercise(e.id);
}
