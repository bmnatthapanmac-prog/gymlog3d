/* GymLog 3D — service worker: precache the whole app, then stale-while-revalidate.
   Bump VERSION on every deploy so phones pick up the new files on next launch. */
const VERSION = 'gymlog3d-v1';
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './css/app.css',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
  './vendor/three.module.min.js', './vendor/OrbitControls.js',
  './js/app.js', './js/db.js', './js/store.js', './js/ui.js', './js/timer.js', './js/charts.js', './js/backup.js',
  './js/three/rig.js', './js/three/poses.js', './js/three/viewer.js',
  './js/views/today.js', './js/views/workout.js', './js/views/summary.js', './js/views/body.js',
  './js/views/progress.js', './js/views/library.js', './js/views/settings.js',
  './data/exercises.js', './data/programs/lean5d.js', './data/programs/football.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async (c) => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    return hit || (await net) || (req.mode === 'navigate' ? c.match('./index.html') : Response.error());
  }));
});
