// App shell: boot, router, tab bar, floating "workout in progress" pill.
import * as store from './store.js';
import { S, load, onChange } from './store.js';
import { requestPersist } from './db.js';
import { icon, h, fmtDur, $ } from './ui.js';
import { onTimer, resumeTimer, remaining, restState, keepAwake } from './timer.js';
window.__store = store;

import { renderToday } from './views/today.js';
import { renderWorkout } from './views/workout.js';
import { renderSummary, renderSessionDetail } from './views/summary.js';
import { renderBody } from './views/body.js';
import { renderProgress, renderExStats } from './views/progress.js';
import { renderLibrary, renderExDetail } from './views/library.js';
import { renderSettings, renderOnboard } from './views/settings.js';

const routes = [
  [/^#\/today$/, renderToday, 'today'],
  [/^#\/workout$/, renderWorkout, 'workout'],
  [/^#\/summary\/(.+)$/, renderSummary, 'today'],
  [/^#\/session\/(.+)$/, renderSessionDetail, 'progress'],
  [/^#\/body$/, renderBody, 'body'],
  [/^#\/progress$/, renderProgress, 'progress'],
  [/^#\/progress\/ex\/(.+)$/, renderExStats, 'progress'],
  [/^#\/library$/, renderLibrary, 'library'],
  [/^#\/library\/(.+)$/, renderExDetail, 'library'],
  [/^#\/settings$/, renderSettings, 'today'],
  [/^#\/onboard$/, renderOnboard, 'none'],
];

const view = $('#view');
let cleanup = null, curTab = '';

function route() {
  let hash = location.hash || '#/today';
  if (!S.settings.onboarded && hash !== '#/onboard') { location.replace('#/onboard'); return; }
  const r = routes.find(([re]) => re.test(hash)) || routes[0];
  const params = (hash.match(r[0]) || []).slice(1).map(decodeURIComponent);
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  document.querySelectorAll('.sheet-wrap').forEach((el) => el.remove());
  curTab = r[2];
  document.body.dataset.route = curTab;
  view.scrollTop = 0; window.scrollTo(0, 0);
  try { cleanup = r[1](view, ...params) || null; } catch (e) { console.error(e); view.innerHTML = `<div class="pad"><h2>เกิดข้อผิดพลาด</h2><pre class="mute">${h(e.stack || e)}</pre></div>`; }
  renderTabs(); renderPill();
}

function renderTabs() {
  const tabs = [['today', 'วันนี้'], ['body', 'ร่างกาย'], ['progress', 'พัฒนาการ'], ['library', 'คลังท่า']];
  $('#tabs').innerHTML = tabs.map(([k, t]) => `<a href="#/${k}" class="${curTab === k ? 'on' : ''}">${icon(k)}<span>${t}</span></a>`).join('');
  $('#tabs').hidden = curTab === 'workout' || curTab === 'none';
}

function renderPill() {
  const p = $('#pill');
  if (!S.active || curTab === 'workout' || curTab === 'none') { p.hidden = true; return; }
  p.hidden = false;
  const left = remaining();
  p.innerHTML = `<span class="dot"></span><b>กำลังซ้อม ${h(S.active.dayName)}</b><span class="mono">${fmtDur((Date.now() - S.active.startedAt) / 1000)}</span>${left ? `<span class="rest">${icon('timer')} ${fmtDur(left)}</span>` : ''}<span class="go">กลับไป ›</span>`;
}

let rr = null;
onChange(() => { if (curTab !== 'workout') { clearTimeout(rr); rr = setTimeout(route, 30); } });
onTimer(() => renderPill());
setInterval(() => { if (S.active && curTab !== 'workout') renderPill(); }, 1000);
$('#pill').onclick = () => { location.hash = '#/workout'; };
window.addEventListener('hashchange', route);

(async function boot() {
  try {
    await load();
  } catch (e) {
    view.innerHTML = `<div class="pad"><h2>เปิดฐานข้อมูลไม่ได้</h2><p class="mute">${h(e.message)}</p><p>ถ้าเปิดในโหมดส่วนตัว (Private) ให้เปิดหน้าปกติแทน</p></div>`;
    return;
  }
  requestPersist().then((ok) => { store.S.persisted = ok; });
  if (S.active) { resumeTimer(); keepAwake(true); }
  route();
  // offline cache — skipped on localhost during development unless ?sw is in the URL
  const dev = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && !location.search.includes('sw');
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !dev) navigator.serviceWorker.register('./sw.js').catch(() => {});
})();
