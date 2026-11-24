/**
 * Generates Axios Station's original illustrations (SVG → WebP via sharp).
 * These are illustrations, not screenshots or photographs — each carries a
 * visible "Illustration" tag so they are never mistaken for real product UI.
 *
 *   node scripts/generate-artwork.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const FONT = "Segoe UI, Inter, Arial, Helvetica, sans-serif";
const C = { bg: "#060913", bg2: "#0b1121", bg3: "#111a30", panel: "#0f172b", line: "#1e2a47", brand: "#2f6bff", brand2: "#22c7ee", deep: "#0a37b5", text: "#e8eefc", muted: "#8a98b8", ok: "#22c55e", warn: "#f59e0b", bad: "#ef4444", violet: "#8b5cf6" };

const defs = `
  <defs>
    <radialGradient id="glowA" cx="0.15" cy="0.1" r="0.9"><stop offset="0" stop-color="${C.brand}" stop-opacity="0.35"/><stop offset="1" stop-color="${C.bg}" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowB" cx="0.95" cy="0.95" r="0.8"><stop offset="0" stop-color="${C.brand2}" stop-opacity="0.22"/><stop offset="1" stop-color="${C.bg}" stop-opacity="0"/></radialGradient>
    <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.brand}"/><stop offset="1" stop-color="${C.brand2}"/></linearGradient>
    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.brand2}"/><stop offset="1" stop-color="${C.brand}" stop-opacity="0.55"/></linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.07"/><stop offset="1" stop-color="#ffffff" stop-opacity="0.02"/></linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#ffffff" stroke-opacity="0.035"/></pattern>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>`;

const backdrop = (w, h) => `
  <rect width="${w}" height="${h}" fill="${C.bg}"/>
  <rect width="${w}" height="${h}" fill="url(#grid)"/>
  <rect width="${w}" height="${h}" fill="url(#glowA)"/>
  <rect width="${w}" height="${h}" fill="url(#glowB)"/>`;

const tag = (w, h, x = w - 196, y = h - 64) => `
  <g transform="translate(${x} ${y})">
    <rect width="164" height="36" rx="18" fill="#000" fill-opacity="0.45" stroke="#fff" stroke-opacity="0.15"/>
    <text x="82" y="24" text-anchor="middle" font-family="${FONT}" font-size="15" font-weight="600" fill="${C.muted}" letter-spacing="1.5">ILLUSTRATION</text>
  </g>`;

/** Stylised fingerprint made of concentric arcs. */
function fingerprint(cx, cy, s, color, opacity = 1) {
  const arcs = [];
  for (let i = 0; i < 6; i++) {
    const rx = (8 + i * 7) * s;
    const ry = (10 + i * 8.5) * s;
    const gap = i % 2 === 0 ? 0.18 : 0.32;
    const a0 = Math.PI * (1 + gap);
    const a1 = Math.PI * (2 + 1 - gap);
    const x0 = cx + rx * Math.cos(a0), y0 = cy + ry * Math.sin(a0);
    const x1 = cx + rx * Math.cos(a1), y1 = cy + ry * Math.sin(a1);
    arcs.push(`<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${rx} ${ry} 0 1 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${2.4 * s}" stroke-linecap="round"/>`);
  }
  return arcs.join("");
}

const text = (x, y, t, { size = 16, weight = 400, fill = C.text, anchor = "start", spacing = 0 } = {}) =>
  `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${spacing}">${t}</text>`;

// ---------------------------------------------------------------------------
// 1. Employee management dashboard (illustrative mock-up)
// ---------------------------------------------------------------------------
function dashboard() {
  const W = 1600, H = 1000;
  const X = 80, Y = 64, WW = 1440, WH = 872;
  const side = 250;
  const menu = ["Dashboard", "Employees", "Attendance", "Shifts &amp; Rosters", "Leave", "Devices", "Reports"];
  const kpis = [
    { l: "Present today", v: "86", c: C.ok },
    { l: "Late arrivals", v: "7", c: C.warn },
    { l: "On leave", v: "5", c: C.brand2 },
    { l: "Absent", v: "4", c: C.bad },
  ];
  const days = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
  const vals = [0.82, 0.78, 0.9, 0.86, 0.93, 0.88, 0.74];
  const punches = [
    ["Front Office", "07:56", "IN", C.ok],
    ["Housekeeping", "08:02", "IN", C.ok],
    ["Food &amp; Beverage", "08:11", "IN", C.warn],
    ["Security", "08:14", "OUT", C.brand2],
    ["Maintenance", "08:19", "IN", C.ok],
    ["Kitchen", "08:23", "IN", C.warn],
  ];
  const mx = X + side + 40, mw = WW - side - 80;

  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${backdrop(W, H)}`;
  // glow behind window
  s += `<rect x="${X + 60}" y="${Y + 60}" width="${WW - 120}" height="${WH - 120}" rx="40" fill="${C.brand}" opacity="0.18" filter="url(#soft)"/>`;
  // window
  s += `<rect x="${X}" y="${Y}" width="${WW}" height="${WH}" rx="26" fill="${C.panel}" stroke="#fff" stroke-opacity="0.09"/>`;
  s += `<path d="M${X} ${Y + 56}H${X + WW}" stroke="#fff" stroke-opacity="0.07"/>`;
  ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => (s += `<circle cx="${X + 30 + i * 22}" cy="${Y + 28}" r="7" fill="${c}" opacity="0.85"/>`));
  s += `<rect x="${X + WW / 2 - 200}" y="${Y + 14}" width="400" height="28" rx="14" fill="#fff" fill-opacity="0.05"/>`;
  s += text(X + WW / 2, Y + 33, "Employee Management · Attendance", { size: 14, fill: C.muted, anchor: "middle" });

  // sidebar
  s += `<rect x="${X}" y="${Y + 56}" width="${side}" height="${WH - 56}" fill="#0b1224"/>`;
  s += `<path d="M${X + side} ${Y + 56}V${Y + WH}" stroke="#fff" stroke-opacity="0.06"/>`;
  s += `<rect x="${X + 28}" y="${Y + 84}" width="40" height="40" rx="11" fill="url(#brandGrad)"/>`;
  s += fingerprint(X + 48, Y + 106, 0.42, "#fff");
  s += text(X + 82, Y + 104, "Workforce", { size: 18, weight: 700 });
  s += text(X + 82, Y + 122, "HR &amp; attendance", { size: 12, fill: C.muted });
  menu.forEach((m, i) => {
    const yy = Y + 170 + i * 52;
    if (i === 0) s += `<rect x="${X + 16}" y="${yy - 26}" width="${side - 32}" height="42" rx="11" fill="${C.brand}" fill-opacity="0.18" stroke="${C.brand}" stroke-opacity="0.4"/>`;
    s += `<rect x="${X + 34}" y="${yy - 13}" width="16" height="16" rx="5" fill="${i === 0 ? C.brand2 : C.muted}" opacity="${i === 0 ? 1 : 0.5}"/>`;
    s += text(X + 64, yy, m, { size: 16, weight: i === 0 ? 600 : 400, fill: i === 0 ? C.text : C.muted });
  });

  // header
  s += text(mx, Y + 112, "Attendance overview", { size: 30, weight: 700 });
  s += text(mx, Y + 140, "Fingerprint punches synced from biometric terminals", { size: 15, fill: C.muted });
  s += `<g transform="translate(${mx + mw - 300} ${Y + 92})"><rect width="300" height="40" rx="20" fill="${C.ok}" fill-opacity="0.12" stroke="${C.ok}" stroke-opacity="0.45"/><circle cx="24" cy="20" r="6" fill="${C.ok}"/>${text(40, 26, "Fingerprint devices · synced", { size: 15, weight: 600, fill: "#86efac" })}</g>`;

  // KPI cards
  const kw = (mw - 3 * 20) / 4;
  kpis.forEach((k, i) => {
    const kx = mx + i * (kw + 20), ky = Y + 172;
    s += `<rect x="${kx}" y="${ky}" width="${kw}" height="118" rx="18" fill="url(#glass)" stroke="#fff" stroke-opacity="0.08"/>`;
    s += `<rect x="${kx + 20}" y="${ky + 22}" width="10" height="10" rx="5" fill="${k.c}"/>`;
    s += text(kx + 40, ky + 32, k.l, { size: 15, fill: C.muted });
    s += text(kx + 20, ky + 88, k.v, { size: 44, weight: 700 });
  });

  // chart card
  const cx = mx, cy = Y + 314, cw = mw * 0.58, ch = 520;
  s += `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="18" fill="url(#glass)" stroke="#fff" stroke-opacity="0.08"/>`;
  s += text(cx + 26, cy + 44, "Weekly attendance rate", { size: 19, weight: 600 });
  s += text(cx + 26, cy + 68, "Share of rostered staff who punched in", { size: 14, fill: C.muted });
  const baseY = cy + ch - 64, top = cy + 110, bw = 44, step = (cw - 80) / days.length;
  for (let g = 0; g <= 4; g++) {
    const gy = baseY - ((baseY - top) * g) / 4;
    s += `<path d="M${cx + 26} ${gy}H${cx + cw - 26}" stroke="#fff" stroke-opacity="0.06" stroke-dasharray="4 6"/>`;
  }
  days.forEach((d, i) => {
    const bx = cx + 50 + i * step, bh = (baseY - top) * vals[i];
    s += `<rect x="${bx}" y="${baseY - bh}" width="${bw}" height="${bh}" rx="10" fill="url(#barGrad)" opacity="${i === 4 ? 1 : 0.78}"/>`;
    s += text(bx + bw / 2, baseY + 30, d, { size: 14, fill: C.muted, anchor: "middle" });
  });

  // live punches
  const px = cx + cw + 20, pw = mw - cw - 20;
  s += `<rect x="${px}" y="${cy}" width="${pw}" height="${ch}" rx="18" fill="url(#glass)" stroke="#fff" stroke-opacity="0.08"/>`;
  s += text(px + 24, cy + 44, "Live punches", { size: 19, weight: 600 });
  s += `<circle cx="${px + pw - 34}" cy="${cy + 38}" r="6" fill="${C.ok}"/><circle cx="${px + pw - 34}" cy="${cy + 38}" r="12" fill="none" stroke="${C.ok}" stroke-opacity="0.4"/>`;
  punches.forEach(([dept, time, dir, col], i) => {
    const ry = cy + 80 + i * 70;
    s += `<rect x="${px + 16}" y="${ry}" width="${pw - 32}" height="58" rx="14" fill="#fff" fill-opacity="${i === 0 ? 0.06 : 0.025}"/>`;
    s += `<circle cx="${px + 46}" cy="${ry + 29}" r="19" fill="${C.brand}" fill-opacity="0.18"/>`;
    s += fingerprint(px + 46, ry + 31, 0.3, C.brand2);
    s += text(px + 78, ry + 26, dept, { size: 15, weight: 600 });
    s += text(px + 78, ry + 46, `Verified by fingerprint · ${time}`, { size: 13, fill: C.muted });
    s += `<rect x="${px + pw - 84}" y="${ry + 17}" width="52" height="24" rx="12" fill="${col}" fill-opacity="0.16"/>`;
    s += text(px + pw - 58, ry + 34, dir, { size: 12, weight: 700, fill: col, anchor: "middle" });
  });

  s += tag(W, H, X + WW - 190, Y + 10) + "</svg>";
  return { name: "portfolio/sea-paradise-employee-management.webp", svg: s };
}

// ---------------------------------------------------------------------------
// 2. ZKTeco fingerprint attendance → EMS integration flow
// ---------------------------------------------------------------------------
function attendanceFlow() {
  const W = 1600, H = 1000;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${backdrop(W, H)}`;
  s += text(W / 2, 110, "BIOMETRIC ATTENDANCE INTEGRATION", { size: 16, weight: 700, fill: C.brand2, anchor: "middle", spacing: 4 });
  s += text(W / 2, 160, "From fingerprint terminal to employee records", { size: 40, weight: 700, anchor: "middle" });

  // terminal device
  const dx = 150, dy = 300;
  s += `<rect x="${dx + 30}" y="${dy + 40}" width="260" height="420" rx="40" fill="${C.brand}" opacity="0.25" filter="url(#soft)"/>`;
  s += `<rect x="${dx}" y="${dy}" width="300" height="460" rx="36" fill="#121b33" stroke="#fff" stroke-opacity="0.14" stroke-width="2"/>`;
  s += `<rect x="${dx + 30}" y="${dy + 34}" width="240" height="150" rx="14" fill="#07101f" stroke="${C.brand2}" stroke-opacity="0.35"/>`;
  s += text(dx + 150, dy + 92, "08:02", { size: 46, weight: 700, anchor: "middle" });
  s += text(dx + 150, dy + 126, "Punch accepted ✓", { size: 16, weight: 600, fill: "#86efac", anchor: "middle" });
  s += text(dx + 150, dy + 156, "Front Office · IN", { size: 14, fill: C.muted, anchor: "middle" });
  s += `<rect x="${dx + 90}" y="${dy + 218}" width="120" height="150" rx="56" fill="#0a1222" stroke="${C.brand2}" stroke-opacity="0.55" stroke-width="2"/>`;
  s += fingerprint(dx + 150, dy + 296, 1.05, C.brand2);
  s += text(dx + 150, dy + 420, "ZKTeco fingerprint terminal", { size: 16, weight: 600, fill: C.muted, anchor: "middle" });

  // arrow 1
  const flowY = dy + 230;
  s += `<path d="M${dx + 320} ${flowY}H${dx + 440}" stroke="${C.brand2}" stroke-width="4" stroke-dasharray="10 9" stroke-linecap="round"/>`;
  s += `<path d="M${dx + 436} ${flowY - 12}L${dx + 456} ${flowY}L${dx + 436} ${flowY + 12}" fill="none" stroke="${C.brand2}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += text(dx + 385, flowY - 22, "Attendance logs", { size: 15, fill: C.muted, anchor: "middle" });

  // hub
  const hx = 770, hy = flowY;
  s += `<circle cx="${hx}" cy="${hy}" r="180" fill="${C.brand}" opacity="0.22" filter="url(#soft)"/>`;
  s += `<circle cx="${hx}" cy="${hy}" r="150" fill="#0e1830" stroke="url(#brandGrad)" stroke-width="3"/>`;
  s += `<circle cx="${hx}" cy="${hy}" r="178" fill="none" stroke="#fff" stroke-opacity="0.08" stroke-dasharray="3 9"/>`;
  s += `<rect x="${hx - 34}" y="${hy - 70}" width="68" height="68" rx="18" fill="url(#brandGrad)"/>`;
  s += `<path d="M${hx - 16} ${hy - 44}h32M${hx - 16} ${hy - 32}h32M${hx - 16} ${hy - 20}h20" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`;
  s += text(hx, hy + 34, "Employee", { size: 24, weight: 700, anchor: "middle" });
  s += text(hx, hy + 64, "Management Software", { size: 21, weight: 700, anchor: "middle" });

  // outputs
  const outs = [
    { t: "Daily attendance", d: "In/out times, late arrivals and absences", c: C.ok },
    { t: "Employee records", d: "Staff profiles, departments and roles", c: C.brand2 },
    { t: "Management reports", d: "Attendance summaries for HR and owners", c: C.violet },
  ];
  outs.forEach((o, i) => {
    const ox = 1010, oy = hy - 230 + i * 170;
    s += `<path d="M${hx + 152} ${hy}C${hx + 210} ${hy} ${ox - 110} ${oy + 62} ${ox - 6} ${oy + 62}" fill="none" stroke="${o.c}" stroke-opacity="0.7" stroke-width="3" stroke-dasharray="8 8"/>`;
    s += `<rect x="${ox}" y="${oy}" width="440" height="124" rx="20" fill="url(#glass)" stroke="#fff" stroke-opacity="0.1"/>`;
    s += `<rect x="${ox}" y="${oy + 22}" width="5" height="80" rx="2.5" fill="${o.c}"/>`;
    s += text(ox + 34, oy + 54, o.t, { size: 24, weight: 700 });
    s += text(ox + 34, oy + 88, o.d, { size: 17, fill: C.muted });
  });

  s += text(W / 2, H - 92, "Integration, deployment and ongoing support by Axios Station", { size: 18, fill: C.muted, anchor: "middle" });
  s += tag(W, H) + "</svg>";
  return { name: "portfolio/zkteco-fingerprint-attendance-flow.webp", svg: s };
}

// ---------------------------------------------------------------------------
// 3. Brand artwork — connected systems (homepage intro)
// ---------------------------------------------------------------------------
function brandArtwork() {
  const W = 1600, H = 1200;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${backdrop(W, H)}`;
  s += `<circle cx="800" cy="600" r="330" fill="${C.brand}" opacity="0.28" filter="url(#soft)"/>`;
  // orbit rings
  [250, 380, 510].forEach((r, i) => (s += `<ellipse cx="800" cy="600" rx="${r * 1.25}" ry="${r * 0.72}" fill="none" stroke="#fff" stroke-opacity="${0.12 - i * 0.03}" stroke-dasharray="${i === 1 ? "4 10" : "0"}"/>`));

  // satellite nodes
  const nodes = [
    { x: 300, y: 330, t: "AI &amp; Data", d: "Models · Insights", c: C.violet },
    { x: 1300, y: 300, t: "Cloud", d: "Servers · Scaling", c: C.brand2 },
    { x: 260, y: 880, t: "Automation", d: "Workflows · Sync", c: C.ok },
    { x: 1330, y: 900, t: "Software", d: "Web · Mobile · ERP", c: C.brand },
  ];
  nodes.forEach((n) => {
    s += `<path d="M800 600L${n.x} ${n.y}" stroke="${n.c}" stroke-opacity="0.55" stroke-width="3" stroke-dasharray="10 10"/>`;
  });
  // central core
  s += `<rect x="640" y="440" width="320" height="320" rx="64" fill="#0e1830" stroke="url(#brandGrad)" stroke-width="3"/>`;
  s += `<rect x="676" y="476" width="248" height="248" rx="44" fill="url(#brandGrad)" opacity="0.14"/>`;
  // "A"-inspired mark
  s += `<path d="M720 690L800 510L880 690" fill="none" stroke="url(#brandGrad)" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/><path d="M748 632H852" stroke="${C.brand2}" stroke-width="16" stroke-linecap="round"/>`;

  nodes.forEach((n) => {
    s += `<circle cx="${n.x}" cy="${n.y}" r="96" fill="${n.c}" opacity="0.18" filter="url(#soft)"/>`;
    s += `<rect x="${n.x - 150}" y="${n.y - 64}" width="300" height="128" rx="28" fill="#0f172b" fill-opacity="0.92" stroke="#fff" stroke-opacity="0.12"/>`;
    s += `<circle cx="${n.x - 96}" cy="${n.y}" r="28" fill="${n.c}" fill-opacity="0.2" stroke="${n.c}" stroke-width="2"/><circle cx="${n.x - 96}" cy="${n.y}" r="9" fill="${n.c}"/>`;
    s += text(n.x - 52, n.y - 6, n.t, { size: 28, weight: 700 });
    s += text(n.x - 52, n.y + 28, n.d, { size: 19, fill: C.muted });
  });
  // small data packets on links
  [[550, 465], [1050, 450], [530, 740], [1065, 750], [800, 230], [800, 980]].forEach(([x, y], i) =>
    (s += `<circle cx="${x}" cy="${y}" r="${i > 3 ? 5 : 8}" fill="${i % 2 ? C.brand2 : "#fff"}" opacity="0.9"/>`),
  );
  s += "</svg>";
  return { name: "brand/connected-systems.webp", svg: s };
}

// ---------------------------------------------------------------------------
// Shared helpers for the homepage set
// ---------------------------------------------------------------------------

/** Lucide icon shapes (ISC licence) read from the installed package. */
async function lucide(name) {
  const file = path.resolve(`node_modules/lucide-react/dist/esm/icons/${name}.mjs`);
  const src = await fs.readFile(file, "utf8");
  const alias = src.match(/export \{ default \} from '\.\/(.+)\.mjs'/);
  if (alias) return lucide(alias[1]);
  // Multi-line arrays close at two-space indent; single-shape icons are written on one line.
  const m = src.match(/node: (\[[\s\S]*?\n {2}\])/) ?? src.match(/node: (\[\[.*\]\])\s*$/m);
  if (!m) throw new Error(`Cannot read lucide icon ${name}`);
  const nodes = Function(`return ${m[1]}`)();
  return nodes
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== "key").map(([k, v]) => `${k}="${v}"`).join(" ")}/>`)
    .join("");
}

const icon = (shapes, x, y, size, color, width = 1.6) =>
  `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${shapes}</g>`;

/** A floating glass "chip" with a coloured dot and a label. */
const chipWidth = (label, size) => label.replace(/&amp;/g, "&").length * size * 0.56 + size * 2.6;

function chip(x, y, label, color, size = 30) {
  const w = label.replace(/&amp;/g, "&").length * size * 0.56 + size * 2.6;
  const h = size * 2.1;
  return `<g transform="translate(${x} ${y})">
    <rect width="${w}" height="${h}" rx="${h / 2}" fill="#0c1428" fill-opacity="0.82" stroke="#fff" stroke-opacity="0.14"/>
    <circle cx="${h / 2}" cy="${h / 2}" r="${size * 0.28}" fill="${color}"/>
    <circle cx="${h / 2}" cy="${h / 2}" r="${size * 0.5}" fill="none" stroke="${color}" stroke-opacity="0.4"/>
    ${text(h * 0.95, h / 2 + size * 0.36, label, { size, weight: 600 })}
  </g>`;
}

const svgOpen = (w, h, extraDefs = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs}${extraDefs}`;

// ---------------------------------------------------------------------------
// 4. Industry covers — one consistent card style, a colour pair per sector
// ---------------------------------------------------------------------------
const INDUSTRIES = [
  { slug: "hospitality", icon: "hotel", a: "#2f6bff", b: "#22c7ee", chips: ["Reservations", "Staff attendance"] },
  { slug: "healthcare", icon: "heart-pulse", a: "#0ea5e9", b: "#34d399", chips: ["Patient records", "Appointments"] },
  { slug: "education", icon: "graduation-cap", a: "#6366f1", b: "#a78bfa", chips: ["Student portal", "Results"] },
  { slug: "banking-financial-services", icon: "landmark", a: "#0a37b5", b: "#38bdf8", chips: ["Secure ledgers", "Compliance"] },
  { slug: "retail-ecommerce", icon: "shopping-bag", a: "#7c3aed", b: "#f472b6", chips: ["POS &amp; inventory", "Online orders"] },
  { slug: "real-estate", icon: "building-2", a: "#0891b2", b: "#2dd4bf", chips: ["Listings", "Leases"] },
  { slug: "manufacturing", icon: "factory", a: "#2563eb", b: "#f59e0b", chips: ["Production", "Stock control"] },
  { slug: "logistics", icon: "truck", a: "#1d4ed8", b: "#22d3ee", chips: ["Fleet tracking", "Deliveries"] },
  { slug: "corporate-enterprise", icon: "briefcase", a: "#334bd6", b: "#818cf8", chips: ["ERP", "Workflows"] },
  { slug: "startups-smes", icon: "rocket", a: "#8b5cf6", b: "#22c7ee", chips: ["MVP", "Scale-up"] },
];

async function industryCover(ind) {
  const W = 1200, H = 900;
  const shapes = await lucide(ind.icon);
  const extra = `<defs>
    <radialGradient id="ia" cx="0.72" cy="0.22" r="0.75"><stop offset="0" stop-color="${ind.a}" stop-opacity="0.55"/><stop offset="1" stop-color="${C.bg}" stop-opacity="0"/></radialGradient>
    <radialGradient id="ib" cx="0.08" cy="1" r="0.8"><stop offset="0" stop-color="${ind.b}" stop-opacity="0.3"/><stop offset="1" stop-color="${C.bg}" stop-opacity="0"/></radialGradient>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${ind.a}"/><stop offset="1" stop-color="${ind.b}"/></linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs>`;
  const cx = 600, cy = 400, t = 300;
  let s = svgOpen(W, H, extra);
  s += `<rect width="${W}" height="${H}" fill="${C.bg}"/><rect width="${W}" height="${H}" fill="url(#grid)"/><rect width="${W}" height="${H}" fill="url(#ia)"/><rect width="${W}" height="${H}" fill="url(#ib)"/>`;
  // orbit rings + floor glow
  s += `<ellipse cx="${cx}" cy="${cy + 210}" rx="330" ry="70" fill="${ind.a}" opacity="0.35" filter="url(#soft)"/>`;
  [260, 360, 460].forEach((r, i) => (s += `<ellipse cx="${cx}" cy="${cy + 40}" rx="${r}" ry="${r * 0.42}" fill="none" stroke="#fff" stroke-opacity="${0.13 - i * 0.035}" ${i === 1 ? 'stroke-dasharray="5 11"' : ""}/>`));
  // tile with depth
  s += `<rect x="${cx - t / 2 + 22}" y="${cy - t / 2 + 30}" width="${t}" height="${t}" rx="72" fill="#000" opacity="0.45" filter="url(#soft)"/>`;
  s += `<rect x="${cx - t / 2}" y="${cy - t / 2 + 16}" width="${t}" height="${t}" rx="72" fill="${ind.a}" opacity="0.55"/>`;
  s += `<rect x="${cx - t / 2}" y="${cy - t / 2}" width="${t}" height="${t}" rx="72" fill="url(#tile)"/>`;
  s += `<rect x="${cx - t / 2}" y="${cy - t / 2}" width="${t}" height="${t}" rx="72" fill="url(#shine)"/>`;
  s += `<rect x="${cx - t / 2 + 1}" y="${cy - t / 2 + 1}" width="${t - 2}" height="${t - 2}" rx="71" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="2"/>`;
  s += icon(shapes, cx - 80, cy - 80, 160, "#fff", 1.5);
  // chips
  s += chip(110, 190, ind.chips[0], ind.b, 30);
  s += chip(760, 600, ind.chips[1], ind.a === "#0a37b5" ? C.brand2 : ind.a, 30);
  // particles
  [[180, 620, 6], [1010, 180, 7], [960, 420, 4], [300, 120, 4], [880, 760, 5], [240, 420, 3]].forEach(
    ([x, y, r], i) => (s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? ind.b : "#fff"}" opacity="0.85"/>`),
  );
  s += "</svg>";
  return { name: `industries/${ind.slug}.webp`, svg: s };
}

// ---------------------------------------------------------------------------
// 5. Showcase — laptop with the EMS dashboard + fingerprint terminal, by the sea
// ---------------------------------------------------------------------------
async function showcase() {
  const W = 1600, H = 1200;
  const dash = (await fs.readFile(path.resolve("public/images/portfolio/sea-paradise-employee-management.webp"))).toString("base64");
  const png = await sharp(Buffer.from(dash, "base64")).extract({ left: 80, top: 64, width: 1440, height: 872 }).png().toBuffer(); // window only
  const extra = `<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050816"/><stop offset="0.55" stop-color="#0b1f4d"/><stop offset="0.78" stop-color="#11407a"/><stop offset="1" stop-color="#0b2a4a"/></linearGradient>
    <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#7dd3fc" stop-opacity="0.9"/><stop offset="0.4" stop-color="#38bdf8" stop-opacity="0.35"/><stop offset="1" stop-color="#38bdf8" stop-opacity="0"/></radialGradient>
    <linearGradient id="bezel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3550"/><stop offset="1" stop-color="#151d31"/></linearGradient>
    <linearGradient id="deck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4766"/><stop offset="1" stop-color="#1a2238"/></linearGradient>
    <clipPath id="screen"><rect x="248" y="232" width="1000" height="625" rx="8"/></clipPath>
  </defs>`;
  let s = svgOpen(W, H, extra);
  s += `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  s += `<circle cx="800" cy="880" r="520" fill="url(#sun)"/>`;
  // stars
  for (let i = 0; i < 46; i++) {
    const x = (i * 337) % W, y = (i * 211) % 520;
    s += `<circle cx="${x}" cy="${y}" r="${i % 5 === 0 ? 2.2 : 1.3}" fill="#fff" opacity="${0.25 + (i % 4) * 0.12}"/>`;
  }
  // sea: layered wave lines
  for (let i = 0; i < 12; i++) {
    const y = 930 + i * 24, amp = 6 + i * 1.5;
    let d = `M0 ${y}`;
    for (let x = 0; x <= W; x += 100) d += ` Q${x + 50} ${y - amp} ${x + 100} ${y}`;
    s += `<path d="${d}" fill="none" stroke="${i % 3 === 0 ? C.brand2 : "#fff"}" stroke-opacity="${0.22 - i * 0.012}" stroke-width="2"/>`;
  }
  // laptop
  s += `<rect x="260" y="300" width="980" height="640" rx="30" fill="${C.brand}" opacity="0.35" filter="url(#soft)"/>`;
  s += `<rect x="226" y="210" width="1044" height="670" rx="30" fill="url(#bezel)" stroke="#fff" stroke-opacity="0.18"/>`;
  s += `<image x="248" y="232" width="1000" height="625" preserveAspectRatio="xMidYMid slice" clip-path="url(#screen)" href="data:image/png;base64,${png.toString("base64")}"/>`;
  s += `<circle cx="748" cy="221" r="4" fill="#0b1121"/>`;
  s += `<path d="M150 896H1346L1300 950Q1294 958 1280 958H216Q202 958 196 950Z" fill="url(#deck)" stroke="#fff" stroke-opacity="0.16"/>`;
  s += `<rect x="668" y="896" width="160" height="12" rx="6" fill="#0b1121" opacity="0.7"/>`;
  // fingerprint terminal in front
  const dx = 1196, dy = 560;
  s += `<rect x="${dx + 20}" y="${dy + 40}" width="270" height="460" rx="40" fill="#000" opacity="0.55" filter="url(#soft)"/>`;
  s += `<rect x="${dx}" y="${dy}" width="280" height="440" rx="38" fill="#111a30" stroke="#fff" stroke-opacity="0.22" stroke-width="2"/>`;
  s += `<rect x="${dx + 26}" y="${dy + 30}" width="228" height="140" rx="16" fill="#060d1c" stroke="${C.brand2}" stroke-opacity="0.45"/>`;
  s += text(dx + 140, dy + 92, "08:02", { size: 44, weight: 700, anchor: "middle" });
  s += text(dx + 140, dy + 128, "Verified ✓", { size: 19, weight: 600, fill: "#86efac", anchor: "middle" });
  s += `<rect x="${dx + 82}" y="${dy + 206}" width="116" height="150" rx="56" fill="#0a1222" stroke="${C.brand2}" stroke-opacity="0.7" stroke-width="2"/>`;
  s += `<circle cx="${dx + 140}" cy="${dy + 282}" r="70" fill="${C.brand2}" opacity="0.18" filter="url(#soft)"/>`;
  s += fingerprint(dx + 140, dy + 284, 1, C.brand2);
  s += text(dx + 140, dy + 402, "Fingerprint attendance", { size: 15, weight: 600, fill: C.muted, anchor: "middle" });
  // floating chips
  s += chip(70, 110, "Live at Hotel Sea Paradise", C.ok, 26);
  s += chip(1010, 120, "ZKTeco devices synced", C.brand2, 26);
  s += tag(W, H, 40, H - 64);
  s += "</svg>";
  return { name: "home/showcase-sea-paradise.webp", svg: s };
}

// ---------------------------------------------------------------------------
// 6. "Why Axios Station" — secure, layered platform
// ---------------------------------------------------------------------------
async function whyArtwork() {
  const W = 1200, H = 1400;
  const shield = await lucide("shield-check");
  const extra = `<defs><linearGradient id="layer" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.brand}" stop-opacity="0.55"/><stop offset="1" stop-color="${C.brand2}" stop-opacity="0.25"/></linearGradient></defs>`;
  let s = svgOpen(W, H, extra) + backdrop(W, H);
  const cx = 600;
  // isometric stacked layers
  const labels = [];
  const layers = [
    { y: 1010, label: "Infrastructure", c: C.violet },
    { y: 850, label: "Data &amp; security", c: C.brand },
    { y: 690, label: "Your software", c: C.brand2 },
  ];
  layers.forEach((l, i) => {
    const w = 440 - i * 30, h = w * 0.5;
    const pts = `${cx},${l.y - h} ${cx + w},${l.y} ${cx},${l.y + h} ${cx - w},${l.y}`;
    s += `<polygon points="${cx},${l.y - h + 30} ${cx + w},${l.y + 30} ${cx},${l.y + h + 30} ${cx - w},${l.y + 30}" fill="${l.c}" opacity="0.25"/>`;
    s += `<polygon points="${pts}" fill="#0f1a33" stroke="${l.c}" stroke-opacity="0.8" stroke-width="2.5"/>`;
    s += `<polygon points="${pts}" fill="url(#layer)" opacity="${0.35 + i * 0.15}"/>`;
    labels.push({ y: [1125, 950, 680][i], label: l.label, c: l.c });
  });
  labels.forEach((l) => (s += chip(cx - chipWidth(l.label, 26) / 2, l.y, l.label, l.c, 26)));
  // shield floating above
  s += `<circle cx="${cx}" cy="420" r="210" fill="${C.brand}" opacity="0.35" filter="url(#soft)"/>`;
  s += `<path d="M${cx} 560V650" stroke="${C.brand2}" stroke-opacity="0.6" stroke-width="3" stroke-dasharray="8 10"/>`;
  s += `<rect x="${cx - 150}" y="270" width="300" height="300" rx="80" fill="url(#brandGrad)"/>`;
  s += `<rect x="${cx - 150}" y="270" width="300" height="300" rx="80" fill="none" stroke="#fff" stroke-opacity="0.4" stroke-width="2"/>`;
  s += icon(shield, cx - 90, 330, 180, "#fff", 1.5);
  s += chip(110, 180, "Access control", C.ok, 26);
  s += chip(780, 330, "Audit trails", C.warn, 26);
  [[160, 560, 6], [1060, 600, 5], [980, 160, 4], [220, 1300, 5], [1000, 1280, 6]].forEach(
    ([x, y, r], i) => (s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? C.brand2 : "#fff"}" opacity="0.8"/>`),
  );
  s += "</svg>";
  return { name: "home/why-secure-platform.webp", svg: s };
}

// ---------------------------------------------------------------------------
// 7. CTA background — flowing light ribbons
// ---------------------------------------------------------------------------
function ctaBackground() {
  const W = 2400, H = 900;
  let s = svgOpen(W, H) + `<rect width="${W}" height="${H}" fill="${C.bg2}"/>`;
  s += `<rect width="${W}" height="${H}" fill="url(#glowA)"/><rect width="${W}" height="${H}" fill="url(#glowB)"/>`;
  for (let i = 0; i < 28; i++) {
    const y0 = 120 + i * 24, k = i / 28;
    const d = `M-50 ${y0 + 200} C ${600} ${y0 - 260 + k * 120}, ${1300} ${y0 + 420 - k * 200}, ${2450} ${y0 - 60}`;
    s += `<path d="${d}" fill="none" stroke="${i % 4 === 0 ? C.brand2 : C.brand}" stroke-opacity="${0.08 + (i % 5) * 0.035}" stroke-width="${i % 4 === 0 ? 2.5 : 1.5}"/>`;
  }
  for (let i = 0; i < 60; i++) {
    const x = (i * 397) % W, y = (i * 151) % H;
    s += `<circle cx="${x}" cy="${y}" r="${i % 6 === 0 ? 3 : 1.6}" fill="#fff" opacity="${0.15 + (i % 4) * 0.1}"/>`;
  }
  s += "</svg>";
  return { name: "home/cta-ribbons.webp", svg: s };
}

// ---------------------------------------------------------------------------
// 8. Blog covers — icon tile + a glass panel with a topic motif + keyword chips
// ---------------------------------------------------------------------------
const BLOG = [
  { slug: "zkteco-fingerprint-attendance-integration", main: "fingerprint-pattern", sats: ["clock", "users", "file-spreadsheet"], a: "#2f6bff", b: "#22c7ee", motif: "fingerprint", chips: ["Punch synced", "Payroll ready"] },
  { slug: "choosing-hotel-management-software", main: "hotel", sats: ["bed-double", "calendar-check", "key-round"], a: "#0891b2", b: "#2dd4bf", motif: "rooms", chips: ["Live availability", "Night audit"] },
  { slug: "practical-ai-for-small-businesses", main: "brain-circuit", sats: ["message-square", "file-text", "sparkles"], a: "#6366f1", b: "#22c7ee", motif: "chat", chips: ["Grounded answers", "Human review"] },
  { slug: "cloud-vs-on-premise-bangladesh", main: "cloud", sats: ["server", "zap", "shield-check"], a: "#1d4ed8", b: "#38bdf8", motif: "racks", chips: ["Off-site backups", "Power-cut ready"] },
  { slug: "facebook-ads-whatsapp-sales-funnel", main: "megaphone", sats: ["message-circle", "target", "trending-up"], a: "#7c3aed", b: "#f472b6", motif: "funnel", chips: ["Leads tracked", "WhatsApp follow-up"] },
  { slug: "server-security-checklist-small-business", main: "shield-check", sats: ["lock", "server", "key-round"], a: "#0a37b5", b: "#22c55e", motif: "checklist", chips: ["MFA on", "Patched"] },
];

function blogMotif(kind, x, y, w, h, a, b) {
  let s = "";
  const cx = x + w / 2, cy = y + h / 2;
  if (kind === "fingerprint") {
    s += fingerprint(cx, cy - 10, 3.1, b, 0.95);
    s += `<rect x="${x + 40}" y="${y + h - 70}" width="${w - 80}" height="10" rx="5" fill="#fff" fill-opacity="0.08"/><rect x="${x + 40}" y="${y + h - 70}" width="${(w - 80) * 0.72}" height="10" rx="5" fill="${b}"/>`;
  } else if (kind === "rooms") {
    const cols = 6, rows = 4, gw = (w - 80) / cols, gh = (h - 80) / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const k = (r * 7 + c * 3) % 5;
      const fill = k === 0 ? C.warn : k < 3 ? b : a;
      s += `<rect x="${x + 40 + c * gw + 5}" y="${y + 40 + r * gh + 5}" width="${gw - 10}" height="${gh - 10}" rx="10" fill="${fill}" fill-opacity="${k < 3 ? 0.85 : 0.35}"/>`;
    }
  } else if (kind === "chat") {
    const bub = (bx, by, bw, col, op, lines) => {
      let o = `<rect x="${bx}" y="${by}" width="${bw}" height="${30 + lines * 22}" rx="22" fill="${col}" fill-opacity="${op}"/>`;
      for (let i = 0; i < lines; i++) o += `<rect x="${bx + 22}" y="${by + 22 + i * 22}" width="${(bw - 44) * (i === lines - 1 ? 0.6 : 1)}" height="8" rx="4" fill="#fff" fill-opacity="0.55"/>`;
      return o;
    };
    s += bub(x + 40, y + 40, w * 0.6, "#ffffff", 0.08, 2);
    s += bub(x + w * 0.32, y + 150, w * 0.6, b, 0.55, 3);
    s += bub(x + 40, y + 300, w * 0.5, "#ffffff", 0.08, 1);
    s += bub(x + w * 0.42, y + 390, w * 0.5, a, 0.6, 1);
  } else if (kind === "racks") {
    for (let i = 0; i < 3; i++) {
      const rx = x + 50 + i * ((w - 100) / 3), rw = (w - 100) / 3 - 24;
      s += `<rect x="${rx}" y="${y + 50}" width="${rw}" height="${h - 100}" rx="14" fill="#fff" fill-opacity="0.05" stroke="#fff" stroke-opacity="0.12"/>`;
      for (let u = 0; u < 6; u++) {
        const uh = (h - 140) / 6 - 12, uy = y + 70 + u * ((h - 140) / 6);
        s += `<rect x="${rx + 14}" y="${uy}" width="${rw - 28}" height="${uh}" rx="6" fill="${a}" fill-opacity="0.35"/>`;
        s += `<circle cx="${rx + rw - 30}" cy="${uy + uh / 2}" r="4" fill="${(u + i) % 4 === 0 ? C.warn : C.ok}"/>`;
      }
    }
  } else if (kind === "funnel") {
    [1, 0.78, 0.56, 0.36].forEach((k, i) => {
      const lw = (w - 80) * k, lh = (h - 100) / 4 - 12;
      s += `<rect x="${cx - lw / 2}" y="${y + 50 + i * (lh + 12)}" width="${lw}" height="${lh}" rx="14" fill="${i % 2 ? b : a}" fill-opacity="${0.35 + i * 0.17}"/>`;
    });
  } else if (kind === "checklist") {
    for (let i = 0; i < 5; i++) {
      const ly = y + 50 + i * ((h - 100) / 5);
      const done = i < 4;
      s += `<rect x="${x + 50}" y="${ly}" width="34" height="34" rx="9" fill="${done ? C.ok : "none"}" stroke="${done ? C.ok : "#fff"}" stroke-opacity="${done ? 1 : 0.4}" stroke-width="2"/>`;
      if (done) s += `<path d="M${x + 59} ${ly + 17} l7 7 l12 -14" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
      s += `<rect x="${x + 104}" y="${ly + 12}" width="${(w - 170) * (0.55 + ((i * 37) % 40) / 100)}" height="10" rx="5" fill="#fff" fill-opacity="${done ? 0.5 : 0.2}"/>`;
    }
  }
  return s;
}

async function blogCover(post) {
  const W = 1600, H = 900;
  const [main, ...sats] = await Promise.all([lucide(post.main), ...post.sats.map((n) => lucide(n))]);
  const extra = `<defs>
    <radialGradient id="ba" cx="0.78" cy="0.25" r="0.75"><stop offset="0" stop-color="${post.a}" stop-opacity="0.55"/><stop offset="1" stop-color="${C.bg}" stop-opacity="0"/></radialGradient>
    <radialGradient id="bb" cx="0.05" cy="1" r="0.8"><stop offset="0" stop-color="${post.b}" stop-opacity="0.28"/><stop offset="1" stop-color="${C.bg}" stop-opacity="0"/></radialGradient>
    <linearGradient id="btile" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${post.a}"/><stop offset="1" stop-color="${post.b}"/></linearGradient>
    <linearGradient id="bshine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs>`;
  let s = svgOpen(W, H, extra);
  s += `<rect width="${W}" height="${H}" fill="${C.bg}"/><rect width="${W}" height="${H}" fill="url(#grid)"/><rect width="${W}" height="${H}" fill="url(#ba)"/><rect width="${W}" height="${H}" fill="url(#bb)"/>`;
  const px = 130, py = 190, pw = 640, ph = 520;
  s += `<rect x="${px + 18}" y="${py + 30}" width="${pw}" height="${ph}" rx="36" fill="#000" opacity="0.4" filter="url(#soft)"/>`;
  s += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="36" fill="${C.panel}" fill-opacity="0.85" stroke="#fff" stroke-opacity="0.12"/>`;
  s += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="36" fill="url(#glass)"/>`;
  s += blogMotif(post.motif, px, py, pw, ph, post.a, post.b);
  const cx = 1130, cy = 430, t = 260;
  s += `<ellipse cx="${cx}" cy="${cy + 200}" rx="300" ry="60" fill="${post.a}" opacity="0.35" filter="url(#soft)"/>`;
  [230, 320].forEach((r, i) => (s += `<ellipse cx="${cx}" cy="${cy + 20}" rx="${r}" ry="${r * 0.62}" fill="none" stroke="#fff" stroke-opacity="${0.12 - i * 0.04}" ${i ? 'stroke-dasharray="5 11"' : ""}/>`));
  s += `<rect x="${cx - t / 2}" y="${cy - t / 2 + 14}" width="${t}" height="${t}" rx="64" fill="${post.a}" opacity="0.55"/>`;
  s += `<rect x="${cx - t / 2}" y="${cy - t / 2}" width="${t}" height="${t}" rx="64" fill="url(#btile)"/>`;
  s += `<rect x="${cx - t / 2}" y="${cy - t / 2}" width="${t}" height="${t}" rx="64" fill="url(#bshine)"/>`;
  s += icon(main, cx - 70, cy - 70, 140, "#fff", 1.5);
  [[cx - 300, cy - 150], [cx + 230, cy - 40], [cx - 150, cy + 210]].forEach(([x, y], i) => {
    s += `<rect x="${x}" y="${y}" width="92" height="92" rx="26" fill="#0c1428" fill-opacity="0.9" stroke="#fff" stroke-opacity="0.16"/>`;
    s += icon(sats[i], x + 24, y + 24, 44, i === 1 ? post.b : "#fff", 1.7);
  });
  s += chip(px - 20, 110, post.chips[0], post.b, 26);
  s += chip(1000, 770, post.chips[1], post.a === "#0a37b5" ? C.ok : post.a, 26);
  [[1480, 150, 6], [880, 140, 4], [1500, 640, 5], [80, 790, 4], [820, 820, 3]].forEach(
    ([x, y, r], i) => (s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? post.b : "#fff"}" opacity="0.8"/>`),
  );
  s += tag(W, H, W - 200, 40);
  s += "</svg>";
  return { name: `blog/${post.slug}.webp`, svg: s };
}

const outDir = path.resolve("public/images");
async function render(art) {
  const file = path.join(outDir, art.name);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const img = sharp(Buffer.from(art.svg));
  const info = await (art.name.endsWith(".png") ? img.png({ compressionLevel: 9 }) : img.webp({ quality: 86 })).toFile(file);
  console.log(`${art.name}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
}
// The dashboard must exist before the showcase embeds it.
for (const art of [dashboard(), attendanceFlow(), brandArtwork(), ctaBackground()]) await render(art);
for (const ind of INDUSTRIES) await render(await industryCover(ind));
await render(await showcase());
await render(await whyArtwork());
for (const post of BLOG) await render(await blogCover(post));

// ---------------------------------------------------------------------------
// 9. Default social share image (Open Graph, 1200x630)
// ---------------------------------------------------------------------------
async function ogDefault() {
  const W = 1200, H = 630;
  const mark = (await fs.readFile(path.resolve("public/images/brand/axios-mark.png"))).toString("base64");
  let s = svgOpen(W, H) + backdrop(W, H);
  for (let i = 0; i < 14; i++) {
    const y0 = 380 + i * 14;
    s += `<path d="M-40 ${y0 + 90} C 400 ${y0 - 120}, 800 ${y0 + 160}, 1260 ${y0 - 40}" fill="none" stroke="${i % 3 ? C.brand : C.brand2}" stroke-opacity="${0.08 + (i % 4) * 0.04}" stroke-width="1.6"/>`;
  }
  s += `<image href="data:image/png;base64,${mark}" x="80" y="92" width="190" height="96"/>`;
  s += text(80, 270, "Axios Station", { size: 76, weight: 800 });
  s += text(80, 334, "Software · AI · Cloud · Automation", { size: 34, weight: 600, fill: C.brand2 });
  s += text(80, 392, "Custom software, ERP, hotel &amp; HR systems and digital growth", { size: 26, fill: C.muted });
  s += text(80, 430, "for businesses in Bangladesh and beyond.", { size: 26, fill: C.muted });
  s += `<rect x="80" y="500" width="250" height="56" rx="28" fill="url(#brandGrad)"/>`;
  s += text(205, 536, "Build Your Dream Here", { size: 20, weight: 700, anchor: "middle" });
  s += "</svg>";
  return { name: "brand/og-default.png", svg: s };
}
await render(await ogDefault());
