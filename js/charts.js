// Small dependency-free SVG charts. All return markup strings; colours come from CSS variables.
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const r1 = (n) => Math.round(n * 10) / 10;

export function lineChart(pts, { h = 160, w = 340, unit = '', color = 'var(--acc)', area = true, dots = true, fmt = (v) => r1(v) } = {}) {
  if (!pts.length) return `<div class="empty">ยังไม่มีข้อมูล</div>`;
  const pad = { l: 34, r: 10, t: 14, b: 22 };
  const ys = pts.map((p) => p.y), lo0 = Math.min(...ys), hi0 = Math.max(...ys);
  const span = hi0 - lo0 || Math.max(1, hi0 * 0.1); const lo = lo0 - span * 0.15, hi = hi0 + span * 0.15;
  const X = (i) => pad.l + (pts.length === 1 ? (w - pad.l - pad.r) / 2 : (i / (pts.length - 1)) * (w - pad.l - pad.r));
  const Y = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * (h - pad.t - pad.b);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${r1(X(i))},${r1(Y(p.y))}`).join('');
  const grid = [0, 0.5, 1].map((f) => { const v = lo + (hi - lo) * f, y = Y(v); return `<line x1="${pad.l}" x2="${w - pad.r}" y1="${r1(y)}" y2="${r1(y)}" class="gl"/><text x="${pad.l - 6}" y="${r1(y + 3)}" class="ax" text-anchor="end">${fmt(v)}</text>`; }).join('');
  const step = Math.max(1, Math.ceil(pts.length / 5));
  const xl = pts.map((p, i) => (i % step === 0 || i === pts.length - 1 ? `<text x="${r1(X(i))}" y="${h - 6}" class="ax" text-anchor="middle">${esc(p.x)}</text>` : '')).join('');
  const ar = area ? `<path d="${d}L${r1(X(pts.length - 1))},${h - pad.b}L${r1(X(0))},${h - pad.b}Z" fill="${color}" opacity=".12"/>` : '';
  const dt = dots ? pts.map((p, i) => `<circle cx="${r1(X(i))}" cy="${r1(Y(p.y))}" r="${i === pts.length - 1 ? 4 : 2.5}" fill="${color}"><title>${esc(p.x)}: ${fmt(p.y)} ${unit}</title></circle>`).join('') : '';
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img">${grid}${ar}<path d="${d}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>${dt}${xl}</svg>`;
}

export function radar(axes, { size = 260 } = {}) {
  const c = size / 2, R = size / 2 - 38, n = axes.length;
  const pt = (i, f) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [c + Math.cos(a) * R * f, c + Math.sin(a) * R * f]; };
  const max = Math.max(1, ...axes.map((a) => Math.max(a.value, a.target || 0)));
  const rings = [0.25, 0.5, 0.75, 1].map((f) => `<polygon points="${axes.map((_, i) => pt(i, f).map(r1).join(',')).join(' ')}" class="rg"/>`).join('');
  const spokes = axes.map((_, i) => { const [x, y] = pt(i, 1); return `<line x1="${c}" y1="${c}" x2="${r1(x)}" y2="${r1(y)}" class="rg"/>`; }).join('');
  const tgt = axes.some((a) => a.target) ? `<polygon points="${axes.map((a, i) => pt(i, (a.target || 0) / max).map(r1).join(',')).join(' ')}" class="rt"/>` : '';
  const val = `<polygon points="${axes.map((a, i) => pt(i, a.value / max).map(r1).join(',')).join(' ')}" class="rv"/>`;
  const lbl = axes.map((a, i) => { const [x, y] = pt(i, 1.2); return `<text x="${r1(x)}" y="${r1(y)}" text-anchor="middle" dominant-baseline="middle" class="rl">${esc(a.label)}<tspan x="${r1(x)}" dy="14" class="rn">${r1(a.value)}${a.target ? '/' + a.target : ''}</tspan></text>`; }).join('');
  return `<svg class="radar" viewBox="0 0 ${size} ${size}">${rings}${spokes}${tgt}${val}${lbl}</svg>`;
}

// GitHub-style calendar: weeks columns × 7 rows (Mon..Sun). counts: {date: n}
export function calendar(counts, endIso, weeks = 14, addDays, mondayOf) {
  const start = addDays(mondayOf(endIso), -7 * (weeks - 1));
  const cell = 15, gap = 3, w = weeks * (cell + gap), h = 7 * (cell + gap);
  let out = '';
  for (let wk = 0; wk < weeks; wk++) for (let d = 0; d < 7; d++) {
    const day = addDays(start, wk * 7 + d); if (day > endIso) continue;
    const n = counts[day] || 0;
    out += `<rect x="${wk * (cell + gap)}" y="${d * (cell + gap)}" width="${cell}" height="${cell}" rx="4" class="c${Math.min(n, 2)}${day === endIso ? ' today' : ''}"><title>${day}${n ? ' · ซ้อม' : ''}</title></rect>`;
  }
  return `<svg class="cal" viewBox="0 0 ${w} ${h}">${out}</svg>`;
}

export function bars(items, { h = 120, w = 340, color = 'var(--acc)', fmt = (v) => Math.round(v) } = {}) {
  if (!items.length) return `<div class="empty">ยังไม่มีข้อมูล</div>`;
  const max = Math.max(1, ...items.map((i) => i.y)), bw = (w - 10) / items.length;
  return `<svg class="chart" viewBox="0 0 ${w} ${h}">${items.map((it, i) => {
    const bh = (it.y / max) * (h - 34), x = 5 + i * bw + bw * 0.18;
    return `<rect x="${r1(x)}" y="${r1(h - 20 - bh)}" width="${r1(bw * 0.64)}" height="${r1(Math.max(bh, 1.5))}" rx="4" fill="${it.color || color}" opacity="${it.dim ? 0.35 : 1}"><title>${esc(it.x)}: ${fmt(it.y)}</title></rect>
      <text x="${r1(x + bw * 0.32)}" y="${h - 6}" class="ax" text-anchor="middle">${esc(it.x)}</text>${it.y ? `<text x="${r1(x + bw * 0.32)}" y="${r1(h - 24 - bh)}" class="ax" text-anchor="middle">${fmt(it.y)}</text>` : ''}`;
  }).join('')}</svg>`;
}

export function ring(frac, { size = 64, stroke = 7, color = 'var(--acc)', label = '' } = {}) {
  const r = (size - stroke) / 2, C = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac));
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${r1(C * f)} ${r1(C)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" class="rlab">${esc(label)}</text></svg>`;
}
