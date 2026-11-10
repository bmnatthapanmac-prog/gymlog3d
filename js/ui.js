// UI helpers: escaping, toast, bottom sheet, confirm, shared 3D viewer, icons.
export const h = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function toast(msg, ms = 2200) {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.innerHTML = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), ms);
}

// bottom sheet. returns close()
export function sheet(html, { onOpen, cls = '' } = {}) {
  const wrap = document.createElement('div'); wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet ${cls}" role="dialog"><div class="grab"></div>${html}</div>`;
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('open'));
  const close = () => { wrap.classList.remove('open'); setTimeout(() => wrap.remove(), 250); };
  wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('[data-close]')) close(); });
  if (onOpen) onOpen(wrap.querySelector('.sheet'), close);
  return close;
}

export function confirmBox(title, body, okLabel = 'ยืนยัน', danger = false) {
  return new Promise((res) => {
    let done = false;
    const close = sheet(`<h3>${title}</h3><p class="mute">${body}</p><div class="row gap"><button class="btn ghost grow" data-close>ยกเลิก</button><button class="btn grow ${danger ? 'danger' : ''}" id="cfOk">${okLabel}</button></div>`,
      { onOpen: (el, c) => { el.querySelector('#cfOk').onclick = () => { done = true; c(); res(true); }; } });
    const iv = setInterval(() => { if (!document.querySelector('.sheet-wrap')) { clearInterval(iv); if (!done) res(false); } }, 300);
    return close;
  });
}

// ---------- one shared WebGL viewer, moved between screens
let viewerP = null, viewerEl = null, viewer = null;
export async function getViewer() {
  if (!viewerP) {
    viewerEl = document.createElement('div'); viewerEl.className = 'viewer3d';
    viewerP = import('./three/viewer.js').then(({ createViewer }) => {
      const { S } = window.__store;
      viewer = createViewer(viewerEl, { style: S.settings.style });
      return viewer;
    });
  }
  return viewerP;
}
export async function mountViewer(host, { motion = 'stand', highlight = null, heat = null, autoRotate = false, onTap = null } = {}) {
  const v = await getViewer();
  if (!host.isConnected) return v;
  host.appendChild(viewerEl);
  v.setMotion(motion, highlight);
  if (heat) v.setHeat(heat);
  v.setAutoRotate(autoRotate);
  v.setSpeed(1); v.setPlaying(true);
  v.onTap(onTap);
  return v;
}

export const ICON = {
  today: '<svg viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/></svg>',
  body: '<svg viewBox="0 0 24 24"><circle cx="12" cy="4.5" r="2.5"/><path d="M7 8h10l-1.5 6H14l-.5 7h-3l-.5-7H8.5z"/></svg>',
  progress: '<svg viewBox="0 0 24 24"><path d="M4 19h16M6 16l4-5 3 3 5-7" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  library: '<svg viewBox="0 0 24 24"><path d="M2 10h3v4H2zM19 10h3v4h-3zM5 8h3v8H5zM16 8h3v8h-3zM8 11h8v2H8z"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8.4 4.6-.1-2.2 2-1.6-2-3.4-2.4.9-1.8-1.1L15.7 3h-4l-.4 2.6-1.9 1-2.4-.9-2 3.4 2 1.6v2.2l-2 1.6 2 3.4 2.4-.9 1.9 1 .4 2.6h4l.4-2.6 1.8-1 2.4.9 2-3.4z"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" fill="none" stroke-width="2.6" stroke-linecap="round"/></svg>',
  swap: '<svg viewBox="0 0 24 24"><path d="M7 7h11l-3-3M17 17H6l3 3" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  timer: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8" fill="none" stroke-width="2.2"/><path d="M12 9v4l2.5 2M9.5 2.5h5" fill="none" stroke-width="2.2" stroke-linecap="round"/></svg>',
  trophy: '<svg viewBox="0 0 24 24"><path d="M7 4h10v3a5 5 0 0 1-10 0zM5 5H3v2a3 3 0 0 0 3 3M19 5h2v2a3 3 0 0 1-3 3M12 12v4M8 20h8M9.5 16h5v4h-5z"/></svg>',
  note: '<svg viewBox="0 0 24 24"><path d="M5 4h14v12l-4 4H5zM15 20v-4h4" fill="none" stroke-width="2" stroke-linejoin="round"/></svg>',
  video: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/></svg>',
  flame: '<svg viewBox="0 0 24 24"><path d="M12 2s5 4.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 1.5-4S9 11 11 11c0-4 1-9 1-9Z"/></svg>',
  dots: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  scale: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="4" fill="none" stroke-width="2"/><path d="M8.5 9.5a4 4 0 0 1 7 0L12 12z"/></svg>',
};
export const icon = (k, cls = '') => `<i class="ic ${cls}">${ICON[k] || ''}</i>`;

export function fmtDur(sec) { const m = Math.floor(sec / 60), s = Math.floor(sec % 60); return `${m}:${String(s).padStart(2, '0')}`; }
export function fmtClock(ms) { const s = Math.floor(ms / 1000), hh = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return hh ? `${hh}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${m}:${String(s % 60).padStart(2, '0')}`; }
