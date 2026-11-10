// Backup: share a JSON file (iOS share sheet → Files / Google Drive) or download it; import back.
import { exportData, importData, saveSettings, today } from './store.js';
import { toast } from './ui.js';

export async function doBackup() {
  const data = JSON.stringify(exportData());
  const name = `gymlog3d-backup-${today()}.json`;
  const file = new File([data], name, { type: 'application/json' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'GymLog 3D backup' });
      await saveSettings({ lastBackup: Date.now() });
      toast('สำรองแล้ว — เก็บไฟล์ไว้ใน Files หรือ Google Drive');
      return true;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return false;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  await saveSettings({ lastBackup: Date.now() });
  toast('ดาวน์โหลดไฟล์สำรองแล้ว');
  return true;
}

// The old Football log app lives on the same origin (…github.io/gymlog/), so its data is readable here.
export async function findOldAppData() {
  let best = null;
  const take = (st) => { if (st && Array.isArray(st.sessions) && (!best || st.sessions.length > best.sessions.length)) best = st; };
  try { take(JSON.parse(localStorage.getItem('ftlog.v1') || 'null')); } catch (e) { /* none */ }
  try {
    const exists = indexedDB.databases ? (await indexedDB.databases()).some((d) => d.name === 'ftlog') : true;
    if (exists) {
      const db = await new Promise((res, rej) => { const r = indexedDB.open('ftlog'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
      if (db.objectStoreNames.contains('kv')) {
        take(await new Promise((res) => { const g = db.transaction('kv').objectStore('kv').get('state'); g.onsuccess = () => res(g.result); g.onerror = () => res(null); }));
      }
      db.close();
    }
  } catch (e) { /* none */ }
  if (!best) return null;
  const n = best.sessions.filter((s) => (s.entries || []).some((e) => e.kg || e.reps)).length;
  return n ? { data: best, sessions: n } : null;
}

export async function importOldApp() {
  const f = await findOldAppData(); if (!f) { toast('ไม่พบข้อมูลแอปเก่าในเครื่องนี้'); return null; }
  try { const r = await importData(f.data); toast(`นำเข้าจากแอปเก่าแล้ว ${r.sessions} ครั้งการซ้อม`); return r; }
  catch (e) { toast('นำเข้าไม่ได้: ' + e.message); return null; }
}

export function pickImport() {
  return new Promise((res) => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return res(null);
      try { const r = await importData(JSON.parse(await f.text())); toast(`นำเข้าแล้ว ${r.sessions} ครั้งการซ้อม${r.body ? ` · ร่างกาย ${r.body} รายการ` : ''}`); res(r); }
      catch (e) { toast('นำเข้าไม่ได้: ' + e.message); res(null); }
    };
    inp.click();
  });
}
