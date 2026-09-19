"use strict";
const { ENG, canon, grid, inputOf, predict, prepare, evaluate, perms, summarize, fnv } = LN;
const KEY = "luckyNumberMin_v1", WFKEY = "luckyNumberMin_wf_v1";
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fmt = d => { const [, m, dd] = d.split("-"); return `${+dd} ${MON[m - 1]}`; };
const fmtFull = d => { const [y, m, dd] = d.split("-"); return `${+dd} ${MON[m - 1]} ${+y + 543}`; };
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (_) { return d; } };

let S = Object.assign({
  profiles: ["Taiwan", "Korea", "Hong", "Profile 4", "Profile 5"], active: 0, draws: [], theme: "auto",
  view: "home", win: 30, mode: "auto", input: ["", "", "", "", ""], pos: 0, upto: "", sel: null, shown: 60
}, load(KEY, {}));
let WF = load(WFKEY, {});
const U = { modal: null, res: null, ai: null };
let rev = 0, PC = new Map(), saveT = 0, paintT = 0;
const running = new Set();

const flush = () => {
  clearTimeout(saveT);
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {}
  try { if (Object.keys(WF).length > 40000) WF = {}; localStorage.setItem(WFKEY, JSON.stringify(WF)); } catch (_) {}
};
const save = () => { clearTimeout(saveT); saveT = setTimeout(flush, 250); };
addEventListener("pagehide", flush);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
const touch = () => { rev++; PC.clear(); U.res = null; U.ai = null; save(); };
const prof = pid => PC.get(pid) || (PC.set(pid, prepare(S.draws.filter(d => d.p === pid))), PC.get(pid));
const rowSt = (pid, i) => WF["1|" + pid + "|" + prof(pid).H[i]] || null;

function stat(pid, ei, n) {
  const list = [];
  for (let i = 1; i < prof(pid).D.length; i++) { const s = rowSt(pid, i); if (s) list.push(s[ei]); }
  return summarize(list.slice(-n));
}
function best(pid) {
  let bi = 0, br = -1;
  for (let ei = 0; ei < 3; ei++) { const s = stat(pid, ei, 30); if (s.total && s.rate > br) { br = s.rate; bi = ei; } }
  return bi;
}

async function ensureWF(pid) {
  if (running.has(pid)) return;
  const p = prof(pid), todo = [];
  for (let i = p.D.length - 1; i >= 1; i--) if (!("1|" + pid + "|" + p.H[i] in WF)) todo.push(i);
  if (!todo.length) return;
  running.add(pid);
  const r0 = rev; let t = Date.now();
  for (const i of todo) {
    if (rev !== r0) break;
    WF["1|" + pid + "|" + p.H[i]] = evaluate(p, i);
    if (Date.now() - t > 16) { await new Promise(r => setTimeout(r)); t = Date.now(); paint(); }
  }
  running.delete(pid); save(); paint();
  if (rev !== r0) ensureWF(pid);
}
const paint = () => { if (paintT) return; paintT = requestAnimationFrame(() => { paintT = 0; render(); }); };

const chips = list => `<div class="chips">${list.map(x => `<span class="chip">${x.number}</span>`).join("")}</div>`;
const tabs = () => `<div class="profile-tabs">${S.profiles.map((n, i) => `<button class="profile-chip ${i === S.active ? "active" : ""}" data-act="prof" data-i="${i}">${esc(n)}</button>`).join("")}</div>`;
const head = (small, title, sub, right = "") => `<div class="head"><div><small>${small}</small><h2>${esc(title)}</h2>${sub ? `<p>${sub}</p>` : ""}</div>${right}</div>`;
const empty = t => `<div class="empty">${t}</div>`;
const badge = s => ({ e: ["hit", "Hit"], r: ["rev", "Rev"], m: ["miss", "Miss"] }[s] || ["none", "—"]);
const gridHtml = (g, hl = []) => { const set = new Set(hl.map(([r, c]) => r + "-" + c));
  return `<div class="number-grid">${g.flatMap((row, r) => row.map((n, c) => `<div class="cell ${c === 4 ? "excluded" : ""} ${set.has(r + "-" + c) ? "highlight" : ""}">${n}</div>`)).join("")}</div>`; };
const betLine = items => `<p class="note">กลับเลขทุกแบบ ${perms(items.map(x => x.number))} ตัว • ${items.length} ชุด</p>`;

function viewHome() {
  const pid = S.active, pd = prof(pid), res = U.res && U.res.pid === pid ? U.res.P : null;
  const ready = S.input.every(v => v !== ""), hasDraw = pd.D.some(inputOf);
  const modes = [["auto", "AUTO"], ...ENG.map(e => [e.id, e.id === "cover" ? "Cov" : e.label])];
  let out = `<section class="card">${head("CALCULATE", S.profiles[pid], fmtFull(S.upto || today()),
    `<div class="icons"><button class="icon" data-act="browse" ${hasDraw ? "" : "disabled"} title="เลือกผลย้อนหลัง">📅</button><button class="icon" data-act="latest" ${hasDraw ? "" : "disabled"} title="โหลดผลล่าสุด">↻</button></div>`)}
    ${tabs()}
    <div class="digits">${S.input.map((v, i) => `<button class="digit ${i === S.pos ? "active" : ""}" data-act="pos" data-i="${i}">${v}</button>`).join("")}</div>
    <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-act="key" data-v="${n}">${n}</button>`).join("")}<button data-act="key" data-v="del">⌫</button><button data-act="key" data-v="0">0</button><span></span></div>
    <div class="row"><button class="btn primary" data-act="calc" ${ready ? "" : "disabled"}>CALCULATE</button><button class="btn" data-act="clear">CLEAR</button></div></section>`;
  if (!res) return out + empty(ready ? "กด CALCULATE เพื่อดูผล" : "กรอกเลขให้ครบ 5 หลัก แล้วกด CALCULATE");
  const auto = S.mode === "auto", ei = auto ? best(pid) : Math.max(0, ENG.findIndex(e => e.id === S.mode)), eng = ENG[ei], R = res[eng.id];
  const hl = S.sel != null && R.items[S.sel]?.occ ? R.items[S.sel].occ[0].cells : [];
  out += `<section class="card">${head("RESULT", eng.label, auto ? "AUTO เลือกตามอัตราถูก 30 งวดล่าสุด" : "", `<span class="pill">${R.items.length} ชุด</span>`)}
    <div class="seg">${modes.map(([id, l]) => `<button class="${S.mode === id ? "active" : ""}" data-act="mode" data-v="${id}">${l}</button>`).join("")}</div>
    ${R.grid ? gridHtml(R.grid, hl) : ""}
    ${eng.id === "ai" && !res.ai.used ? `<p class="note">ยังไม่พบสูตร AI ที่ดีกว่า Classic จึงใช้ผลเดียวกับ Classic</p>` : ""}
    <div class="chips">${R.items.map((x, i) => `<button class="chip ${S.sel === i ? "active" : ""}" data-act="sel" data-i="${i}">${x.number}</button>`).join("")}</div>
    ${S.sel != null && R.items[S.sel]?.occ ? `<p class="note">${R.items[S.sel].occ[0].name} • พบ ${R.items[S.sel].occ.length} ตำแหน่ง</p>` : ""}
    ${betLine(R.items)}</section>`;
  return out;
}

function viewAI() {
  const pid = S.active, pd = prof(pid);
  let li = -1; pd.D.forEach((d, i) => { if (inputOf(d)) li = i; });
  let out = `<section class="card">${head("AI CENTER", S.profiles[pid], "", `<span class="pill">${pd.T.length} งวด</span>`)}${tabs()}</section>`;
  if (li < 0) return out + empty("ต้องมีผลที่มีเลข 3 ตัวและ 2 ตัวครบอย่างน้อย 1 งวด");
  const inp = inputOf(pd.D[li]), k = rev + "|" + pid;
  if (!U.ai || U.ai.k !== k) U.ai = { k, P: predict(pd.T, inp, parseInt(fnv("ai" + pd.H[li]), 36)) };
  const P = U.ai.P, bi = best(pid), b = ENG[bi];
  out += `<section class="card">${head("AUTO PICK", b.label, `จากผล ${fmtFull(pd.D[li].date)} • ${inp.join("")}`)}${chips(P[b.id].items.slice(0, 5))}${betLine(P[b.id].items.slice(0, 5))}</section>`;
  ENG.forEach((e, ei) => {
    const s = stat(pid, ei, 30);
    out += `<section class="card">${head(e.label, `${P[e.id].items.length} ชุด`, e.id === "ai" && !P.ai.used ? "ยังใช้ผลเดียวกับ Classic" : "", `<span class="pill">${s.total ? `${s.rate}% • ${s.total} งวด` : "—"}</span>`)}${chips(P[e.id].items)}${betLine(P[e.id].items)}</section>`;
  });
  return out;
}

function viewHistory() {
  const pid = S.active, pd = prof(pid), rows = pd.D.map((d, i) => ({ d, i })).reverse();
  let out = `<section class="card">${head("HISTORY", S.profiles[pid], "", `<button class="btn primary small" data-act="add">+ เพิ่มผล</button>`)}${tabs()}
    <div class="hrow hhead"><span>วันที่</span><span>ผล</span>${ENG.map(e => `<span>${e.id === "cover" ? "Cov" : e.label}</span>`).join("")}</div>`;
  if (!rows.length) return out + empty("ยังไม่มีข้อมูล") + "</section>";
  out += rows.slice(0, S.shown).map(({ d, i }) => { const st = i ? rowSt(pid, i) : null;
    return `<div class="hrow" data-act="edit" data-id="${d.id}"><b>${fmt(d.date)}</b><span class="num">${d.n}${d.t ? "·" + d.t : ""}</span>${ENG.map((_, ei) => { const [c, l] = badge(st && st[ei]); return `<span class="tag ${c}">${l}</span>`; }).join("")}</div>`; }).join("");
  if (rows.length > S.shown) out += `<button class="btn full" data-act="more">แสดงเพิ่ม (${rows.length - S.shown})</button>`;
  return out + "</section>";
}

function viewAnalysis() {
  const pid = S.active, n = S.win || Infinity;
  const rank = S.profiles.map((name, p) => {
    let bs = -1, be = 0;
    for (let ei = 0; ei < 3; ei++) {
      const a = stat(p, ei, 10), b = stat(p, ei, 30), c = stat(p, ei, Infinity);
      const sc = c.total ? (.5 * a.rate + .3 * b.rate + .2 * c.rate) : -1;
      if (sc > bs) { bs = sc; be = ei; }
    }
    return { p, name, eng: ENG[be].label, sc: bs, total: stat(p, be, Infinity).total };
  }).sort((a, b) => b.sc - a.sc);
  return `<section class="card">${head("ANALYSIS", "ผลวิเคราะห์", S.profiles[pid])}${tabs()}
    <div class="seg">${[[10, "10"], [30, "30"], [60, "60"], [0, "All"]].map(([v, l]) => `<button class="${S.win === v ? "active" : ""}" data-act="win" data-v="${v}">${l} งวด</button>`).join("")}</div>
    ${ENG.map((e, ei) => { const s = stat(pid, ei, n); return `<div class="line"><b>${e.label}</b><span>${s.total ? `${s.rate}%` : "—"}</span><small>Exact ${s.exact} • Hit ${s.hit}/${s.total}</small></div>`; }).join("")}</section>
    <section class="card">${head("PROFILE RANKING", "อันดับ Profile", "คะแนน = 50% (10 งวด) + 30% (30 งวด) + 20% (ทั้งหมด) ของ engine ที่ดีที่สุด")}
    ${rank.map((r, i) => `<div class="line ${r.p === pid ? "current" : ""}" data-act="prof" data-i="${r.p}"><b>${i + 1}. ${esc(r.name)}</b><span>${r.sc < 0 ? "—" : r.sc.toFixed(1)}</span><small>${r.sc < 0 ? "ยังไม่มีข้อมูล" : `${r.eng} • ${r.total} งวด`}</small></div>`).join("")}
    <p class="note">Score ใช้ช่วยจัดอันดับเท่านั้น ไม่ใช่เปอร์เซ็นต์รับประกันผล • ทุกผลคำนวณจากข้อมูลก่อนวันผลออกเท่านั้น</p></section>`;
}

function viewSettings() {
  return `<section class="card">${head("SETTINGS", "ตั้งค่า", "")}
    <h3>Profiles</h3>${S.profiles.map((n, i) => `<input class="text" data-rename="${i}" value="${esc(n)}" maxlength="24">`).join("")}
    <button class="btn full" data-act="addprof">+ เพิ่ม Profile</button>
    <h3>Data & Backup</h3>
    <div class="row"><button class="btn" data-act="export">Export JSON</button><button class="btn" data-act="import">Import JSON</button></div>
    <input id="imp" type="file" accept=".json,application/json" hidden>
    <button class="btn danger full" data-act="wipe">ล้างข้อมูลผลทั้งหมด</button>
    <h3>Appearance</h3>
    <div class="seg">${[["auto", "ตาม iPhone"], ["light", "สว่าง"], ["dark", "มืด"]].map(([v, l]) => `<button class="${S.theme === v ? "active" : ""}" data-act="theme" data-v="${v}">${l}</button>`).join("")}</div>
    <p class="note">${S.draws.length} งวด • ${S.profiles.length} Profile</p></section>`;
}

const VIEWS = { home: viewHome, weekly: viewAI, history: viewHistory, analysis: viewAnalysis, settings: viewSettings };
const NAV = [["home", "🧮", "Calculate"], ["weekly", "🤖", "AI"], ["history", "🕘", "History"], ["analysis", "📊", "Analysis"], ["settings", "⚙️", "Settings"]];

function render() {
  document.documentElement.dataset.theme = S.theme;
  if (S.view === "analysis") S.profiles.forEach((_, p) => ensureWF(p));
  else if (S.view !== "settings") ensureWF(S.active);
  $("app").innerHTML = `<header class="topbar"><div class="brand">LuckyNumber</div>${running.size ? `<div class="subtitle">กำลังคำนวณย้อนหลัง…</div>` : ""}</header>
    <main class="main">${VIEWS[S.view]()}</main>
    <nav class="bottom-nav">${NAV.map(([v, i, l]) => `<button class="${S.view === v ? "active" : ""}" data-act="view" data-v="${v}"><span>${i}</span><small>${l}</small></button>`).join("")}</nav>`;
}

function modal(html) { U.modal = html; $("modal").innerHTML = html ? `<div class="backdrop" data-act="close"><div class="sheet">${html}</div></div>` : ""; document.body.classList.toggle("modal-open", !!html); }
const uid = () => "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function openForm(id) {
  const d = S.draws.find(x => x.id === id);
  modal(`<div class="head"><h2>${d ? "แก้ไขผล" : "เพิ่มผล"}</h2><button class="icon" data-act="close">✕</button></div>
    <p class="note">${esc(S.profiles[S.active])}</p>
    <label>วันที่<input id="f-date" class="text" type="date" value="${d ? d.date : today()}"></label>
    <label>เลข 3 ตัว<input id="f-n" class="text" inputmode="numeric" maxlength="3" value="${d ? d.n : ""}"></label>
    <label>เลข 2 ตัว<input id="f-t" class="text" inputmode="numeric" maxlength="2" value="${d ? d.t : ""}"></label>
    <div class="row"><button class="btn primary" data-act="saveform" data-id="${d ? d.id : ""}">บันทึก</button>${d ? `<button class="btn danger" data-act="del" data-id="${d.id}">ลบ</button>` : ""}</div>
    ${d ? `<button class="btn full" data-act="toCalc" data-id="${d.id}">ใช้คำนวณ</button>` : ""}`);
}

function saveForm(id) {
  const date = $("f-date").value, n = $("f-n").value.trim(), t = $("f-t").value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return alert("วันที่ไม่ถูกต้อง");
  if (!/^\d{3}$/.test(n)) return alert("กรอกเลข 3 ตัวให้ครบ");
  if (t && !/^\d{2}$/.test(t)) return alert("เลข 2 ตัวต้องมี 2 หลัก");
  const same = S.draws.find(x => x.p === S.active && x.date === date && x.id !== id);
  if (same && !confirm("มีผลวันนี้อยู่แล้ว ต้องการแทนที่หรือไม่?")) return;
  if (same) S.draws = S.draws.filter(x => x !== same);
  const cur = S.draws.find(x => x.id === id);
  if (cur) Object.assign(cur, { date, n, t }); else S.draws.push({ id: uid(), p: S.active, date, n, t });
  touch(); modal(null); render();
}

function loadDraw(d) {
  if (!inputOf(d)) return alert("ผลวันนี้ยังมีเลข 3 ตัวหรือ 2 ตัวไม่ครบ");
  S.input = [...d.n, ...d.t]; S.upto = d.date; S.pos = 4; S.sel = null; U.res = null; S.view = "home"; modal(null); save(); render();
}
function browse() {
  const list = prof(S.active).D.filter(inputOf).reverse().slice(0, 90);
  modal(`<div class="head"><h2>เลือกผลย้อนหลัง</h2><button class="icon" data-act="close">✕</button></div>${list.map(d => `<div class="line" data-act="toCalc" data-id="${d.id}"><b>${fmt(d.date)}</b><span>${d.n}·${d.t}</span></div>`).join("")}`);
}
function calc() {
  const pd = prof(S.active), inp = S.input.map(Number);
  const T = S.upto ? pd.T.filter(x => pd.D[x.j].date <= S.upto) : pd.T;
  U.res = { pid: S.active, P: predict(T, inp, parseInt(fnv(S.upto + "|" + T.length), 36)) };
  S.sel = null; render();
}

function exportJSON() {
  const payload = { format: "LuckyNumberBackup", formatVersion: 1, exportedAt: new Date().toISOString(),
    state: { profiles: S.profiles, activeProfile: S.active, theme: S.theme, records: [], dailyTables: [],
      actualDraws: S.draws.map(d => ({ id: d.id, profileId: d.p, date: d.date, number: d.n, twoDigit: d.t })) } };
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload)], { type: "application/json" }));
  a.download = `lucky-number-backup-${today()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function importJSON(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const j = JSON.parse(r.result), st = j.state || j, map = new Map();
      (st.actualDraws || []).forEach(x => {
        const d = { id: String(x.id || uid()), p: Number(x.profileId ?? 0), date: String(x.date || "").slice(0, 10), n: String(x.number || ""), t: String(x.twoDigit || "") };
        if (/^\d{4}-\d{2}-\d{2}$/.test(d.date) && /^\d{3}$/.test(d.n) && Number.isInteger(d.p) && d.p >= 0) { if (!/^\d{2}$/.test(d.t)) d.t = ""; map.set(d.p + "|" + d.date, d); }
      });
      const draws = [...map.values()], names = Array.isArray(st.profiles) && st.profiles.length ? st.profiles.map(String) : S.profiles.slice();
      while (names.length <= Math.max(0, ...draws.map(d => d.p))) names.push("Profile " + (names.length + 1));
      if (!confirm(`นำเข้า ${draws.length} งวด / ${names.length} Profile\nข้อมูลปัจจุบันจะถูกแทนที่ ต้องการดำเนินการต่อหรือไม่?`)) return;
      S.draws = draws; S.profiles = names; S.active = Math.min(Number(st.activeProfile) || 0, names.length - 1);
      if (["auto", "light", "dark"].includes(st.theme)) S.theme = st.theme;
      touch(); render();
    } catch (_) { alert("ไฟล์ Backup ไม่ถูกต้อง"); }
  };
  r.readAsText(file);
}

const ACT = {
  view: e => { S.view = e.v; S.sel = null; save(); render(); scrollTo(0, 0); },
  prof: e => { S.active = +e.i; S.sel = null; U.res = null; save(); render(); },
  pos: e => { S.pos = +e.i; render(); },
  key: e => {
    if (e.v === "del") { if (S.input[S.pos]) S.input[S.pos] = ""; else if (S.pos > 0) S.input[--S.pos] = ""; }
    else { S.input[S.pos] = e.v; if (S.pos < 4) S.pos++; }
    S.upto = ""; U.res = null; save(); render();
  },
  clear: () => { S.input = ["", "", "", "", ""]; S.pos = 0; S.upto = ""; S.sel = null; U.res = null; save(); render(); },
  calc, browse, add: () => openForm(""),
  latest: () => { const D = prof(S.active).D.filter(inputOf); if (D.length) loadDraw(D[D.length - 1]); },
  toCalc: e => loadDraw(S.draws.find(d => d.id === e.id)),
  mode: e => { S.mode = e.v; S.sel = null; save(); render(); },
  sel: e => { S.sel = S.sel === +e.i ? null : +e.i; render(); },
  win: e => { S.win = +e.v; save(); render(); },
  more: () => { S.shown += 60; render(); },
  edit: e => openForm(e.id),
  saveform: e => saveForm(e.id),
  del: e => { if (confirm("ลบผลนี้หรือไม่?")) { S.draws = S.draws.filter(d => d.id !== e.id); touch(); modal(null); render(); } },
  close: (e, el, ev) => { if (ev.target === el || el.classList.contains("icon")) modal(null); },
  theme: e => { S.theme = e.v; save(); render(); },
  addprof: () => { S.profiles.push("Profile " + (S.profiles.length + 1)); save(); render(); },
  export: exportJSON,
  import: () => $("imp").click(),
  wipe: () => { if (confirm("ล้างข้อมูลผลทั้งหมด? (ชื่อ Profile จะยังอยู่)")) { S.draws = []; WF = {}; touch(); render(); } }
};

document.addEventListener("click", ev => {
  const el = ev.target.closest("[data-act]");
  if (el && ACT[el.dataset.act]) ACT[el.dataset.act](el.dataset, el, ev);
});
document.addEventListener("change", ev => {
  const t = ev.target;
  if (t.id === "imp" && t.files[0]) { importJSON(t.files[0]); t.value = ""; }
  else if (t.dataset.rename != null) { S.profiles[+t.dataset.rename] = t.value.trim() || "Profile " + (+t.dataset.rename + 1); save(); render(); }
});

S.profiles = Array.isArray(S.profiles) && S.profiles.length ? S.profiles : ["Profile 1"];
S.draws = Array.isArray(S.draws) ? S.draws : [];
S.active = Math.min(Math.max(0, S.active | 0), S.profiles.length - 1);
if (!VIEWS[S.view]) S.view = "home";
render();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
