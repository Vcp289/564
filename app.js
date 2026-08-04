"use strict";

const STORAGE_KEY = "luckyNumberProV4_5";
const LEGACY_KEYS = ["luckyNumberProV4_4", "luckyNumberProV4_3", "luckyNumberProV4_2", "luckyNumberProV4_1", "luckyNumberProV4", "luckyNumberProV1", "luckyNumberProV3"];
const DAYS_TH = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULT_STATE = {
  profiles: ["Taiwan", "Korea", "Hong", "Profile 4", "Profile 5"],
  activeProfile: 0,
  lastInput: ["", "", "", "", ""],
  grid: null,
  records: [],
  actualDraws: [],
  dailyTables: [],
  selectedL: null,
  currentView: "home",
  weekOffset: 0,
  theme: "light"
};

let state = loadState();
let currentLResults = [];
const app = document.getElementById("app");

function loadState() {
  try {
    let saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      for (const key of LEGACY_KEYS) {
        saved = localStorage.getItem(key);
        if (saved) break;
      }
    }
    const raw = saved ? JSON.parse(saved) : null;
    const base = typeof structuredClone === "function" ? structuredClone(DEFAULT_STATE) : JSON.parse(JSON.stringify(DEFAULT_STATE));
    return { ...base, ...(raw || {}), profiles: Array.isArray(raw?.profiles) && raw.profiles.length > 0 ? raw.profiles : base.profiles, records: Array.isArray(raw?.records) ? raw.records : [], actualDraws: Array.isArray(raw?.actualDraws) ? raw.actualDraws : [], dailyTables: Array.isArray(raw?.dailyTables) ? raw.dailyTables : [] };
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function w(n) { return (n + 10) % 10; }
function pad(n) { return String(n).padStart(2, "0"); }
function isoDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function formatDateTH(value) {
  const d = new Date(`${value}T12:00:00`);
  return d.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}
function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[ch]);
}
function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

function calculateGrid(values = state.lastInput) {
  if (values.some(v => !/^\d$/.test(v))) return null;
  const [A, B, C, D, E] = values.map(Number);
  return [
    [A, w(A - 1), w(A + 1), D, w(D + 1)],
    [B, w(B - 1), w(B + 1), E, w(E - 1)],
    [C, w(C - 1), w(C + 1), w(D - 1), w(E + 1)]
  ];
}

const L_PATTERNS = [
  { id:"L01", name:"ลงแล้วขวา", offsets:[[0,0],[1,0],[1,1]] },
  { id:"L02", name:"ลงแล้วซ้าย", offsets:[[0,0],[1,0],[1,-1]] },
  { id:"L03", name:"ขึ้นแล้วขวา", offsets:[[0,0],[-1,0],[-1,1]] },
  { id:"L04", name:"ขึ้นแล้วซ้าย", offsets:[[0,0],[-1,0],[-1,-1]] },
  { id:"L05", name:"ขวาแล้วลง", offsets:[[0,0],[0,1],[1,1]] },
  { id:"L06", name:"ขวาแล้วขึ้น", offsets:[[0,0],[0,1],[-1,1]] },
  { id:"L07", name:"ซ้ายแล้วลง", offsets:[[0,0],[0,-1],[1,-1]] },
  { id:"L08", name:"ซ้ายแล้วขึ้น", offsets:[[0,0],[0,-1],[-1,-1]] }
];

function findLResults(grid) {
  if (!grid) return [];
  const H = 3, W = 4; // ไม่ใช้คอลัมน์ที่ 5
  const results = [];
  for (const pattern of L_PATTERNS) {
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const cells = pattern.offsets.map(([dr, dc]) => [r + dr, c + dc]);
        if (!cells.every(([rr, cc]) => rr >= 0 && rr < H && cc >= 0 && cc < W)) continue;
        const number = cells.map(([rr, cc]) => grid[rr][cc]).join("");
        results.push({
          id: `${pattern.id}-R${r+1}C${c+1}`,
          number,
          patternId: pattern.id,
          patternName: pattern.name,
          cells,
          startRow: r,
          startCol: c,
          block: `แถว ${Math.min(...cells.map(x=>x[0])) + 1}-${Math.max(...cells.map(x=>x[0])) + 1} • คอลัมน์ ${Math.min(...cells.map(x=>x[1])) + 1}-${Math.max(...cells.map(x=>x[1])) + 1}`
        });
      }
    }
  }
  // V4.1: เลขที่ใช้ตัวเลขชุดเดียวกันถือเป็นกลุ่มเดียวกัน
  // เช่น 356, 365, 536, 563, 635 และ 653 จะแสดงเป็น 356 เพียงชุดเดียว
  const grouped = new Map();
  for (const item of results) {
    const canonicalNumber = [...item.number].sort().join("");
    if (!grouped.has(canonicalNumber)) {
      grouped.set(canonicalNumber, {
        ...item,
        number: canonicalNumber,
        canonicalNumber,
        occurrences: [item]
      });
    } else {
      grouped.get(canonicalNumber).occurrences.push(item);
    }
  }
  return [...grouped.values()];
}

function patternStats(profileId = state.activeProfile) {
  const records = state.records.filter(r => r.profileId === profileId && r.patternId && r.status !== "notfound");
  const counts = Object.fromEntries(L_PATTERNS.map(p => [p.id, 0]));
  const positions = {};
  records.forEach(r => {
    counts[r.patternId] = (counts[r.patternId] || 0) + (r.status === "exact" ? 3 : 1);
    (r.cells || []).forEach(([row,col]) => positions[`${row}-${col}`] = (positions[`${row}-${col}`] || 0) + 1);
  });
  return { records, counts, positions };
}

function getLScore(item) {
  const records = state.records.filter(r => r.profileId === state.activeProfile);
  if (!records.length) return 0;
  let score = 0;
  records.forEach((r, index) => {
    const ageWeight = Math.max(1, 3 - Math.floor(index / 10));
    if (r.patternId === item.patternId) score += (r.status === "exact" ? 6 : 2) * ageWeight;
    const samePosition = JSON.stringify(r.cells || []) === JSON.stringify(item.cells);
    if (samePosition) score += (r.status === "exact" ? 4 : 1) * ageWeight;
    const digits = new Set(item.number.split(""));
    score += [...digits].filter(d => String(r.actualResult || "").includes(d)).length * 0.3;
  });
  return Math.round(score);
}

function render() {
  document.documentElement.dataset.theme = state.theme === "dark" ? "dark" : "light";
  app.innerHTML = `
    <header class="topbar topbar-minimal">
      <div class="minimal-mark" aria-label="LuckyNumber">🎯</div>
      <button id="themeToggle" class="theme-toggle" aria-label="Toggle theme">${state.theme === "dark" ? "☀️" : "🌙"}</button>
    </header>
    <main class="main">${renderView()}</main>
    <nav class="bottom-nav">
      ${navButton("home", "⌂", "Calculate")}
      ${navButton("weekly", "▦", "Weekly")}
      ${navButton("history", "✓", "History")}
      ${navButton("analysis", "▥", "Analysis")}
      ${navButton("settings", "⚙", "Settings")}
    </nav>
    <div id="modalRoot"></div>
    <div id="globalKeypad" class="modern-keypad" aria-hidden="true">
      <div class="keypad-sheet">
        <div class="keypad-topbar">
          <div class="keypad-handle"></div>
          <button id="keypadDone" class="keypad-done" type="button">DONE</button>
        </div>
        <div class="keypad-grid">
          ${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="keypad-key" data-key="${n}" type="button">${n}</button>`).join("")}
          <button class="keypad-key keypad-zero" data-key="0" type="button">0</button>
          <button class="keypad-key keypad-delete" data-key="delete" type="button" aria-label="Delete">⌫</button>
        </div>
      </div>
    </div>
  `;
  bindCommon();
  bindView();
}

function navButton(view, icon, label) {
  return `<button class="nav-item ${state.currentView === view ? "active" : ""}" data-view="${view}"><span>${icon}</span><small>${label}</small></button>`;
}

function renderView() {
  switch (state.currentView) {
    case "weekly": return renderWeekly();
    case "history": return renderHistory();
    case "analysis": return renderAnalysis();
    case "settings": return renderSettings();
    default: return renderHome();
  }
}

const PROFILE_COLORS = ["#168BFF", "#22A55A", "#F28C18", "#8A3FFC", "#F72585"];
function profileColor(index) { return PROFILE_COLORS[index % PROFILE_COLORS.length]; }
function profileTabs() {
  return `<div class="profile-tabs profile-tabs-colored">${state.profiles.map((name, i) => `<button class="profile-chip profile-chip-colored ${i === state.activeProfile ? "active" : ""}" style="--profile-color:${profileColor(i)}" data-profile="${i}">${escapeHtml(name)}</button>`).join("")}</div>`;
}

function renderHome() {
  const grid = state.grid;
  return `
    <section class="card calculator-card">
      <div class="section-head"><h2>New Calculation</h2><span>${DAYS_TH[new Date().getDay()]} ${formatDateTH(isoDate())}</span></div>
      ${profileTabs()}
      <div class="input-row">${state.lastInput.map((v, i) => `<input class="digit-input ${i===0?'active':''}" data-index="${i}" maxlength="1" type="text" readonly value="${escapeHtml(v)}" aria-label="Digit ${i+1}">`).join("")}</div>
      <div class="action-row">
        <button id="btnCalc" class="btn primary">CALCULATE</button>
        <button id="btnClear" class="btn secondary">CLEAR</button>
      </div>
    </section>
    ${grid ? `<section class="card">
      <div class="section-head"><h2>Results</h2><span>Column 5 is excluded from L search</span></div>
      ${gridHtml(grid)}
      <button id="btnFindL" class="btn primary full">🔍 FIND L NUMBERS</button>
      <button id="btnSaveDailyTable" class="btn secondary full">💾 SAVE THIS 15-CELL TABLE</button>
    </section>` : ``}
  `;
}

function gridHtml(grid, highlighted = []) {
  const keys = new Set(highlighted.map(([r,c]) => `${r}-${c}`));
  return `<div class="number-grid">${grid.flatMap((row, r) => row.map((n, c) => `<div class="grid-cell ${c === 4 ? "excluded" : ""} ${keys.has(`${r}-${c}`) ? "highlight" : ""}">${n}</div>`)).join("")}</div>`;
}

function getWeekRange(base = new Date()) {
  const d = new Date(base); d.setHours(12,0,0,0);
  const offset = d.getDay() === 0 ? -6 : 1 - d.getDay();
  const start = new Date(d); start.setDate(d.getDate() + offset);
  const end = new Date(start); end.setDate(start.getDate() + 6);
  return { start, end };
}

function renderWeekly() {
  const base = new Date();
  base.setDate(base.getDate() + (state.weekOffset || 0) * 7);
  const { start, end } = getWeekRange(base);
  const profileId = state.activeProfile;
  const records = state.records.filter(r => r.profileId === profileId && r.date >= isoDate(start) && r.date <= isoDate(end));
  const rows = Array.from({length:7}, (_,i) => {
    const d = new Date(start); d.setDate(start.getDate()+i);
    const dayRecords = records.filter(r => r.date === isoDate(d));
    return `<div class="week-row">
      <div><strong>${DAYS_TH[d.getDay()]}</strong><small>${formatDateTH(isoDate(d))}</small></div>
      ${dayRecords.length ? `<div class="day-records">${dayRecords.map(rec=>`<button class="record-mini" data-record="${rec.id}"><b>${escapeHtml(rec.actualResult)}</b><span class="status ${rec.status}">${statusLabel(rec.status)}</span></button>`).join("")}</div>` : `<span class="missing">ยังไม่Save</span>`}
    </div>`;
  }).join("");
  const summary = state.profiles.map((name, idx) => {
    const list = state.records.filter(r=>r.profileId===idx && r.date>=isoDate(start) && r.date<=isoDate(end));
    return `<button class="summary-person ${idx===state.activeProfile?'active':''}" data-profile="${idx}"><b>${escapeHtml(name)}</b><span>${list.length}/7 วัน</span><small>Exact ${list.filter(r=>r.status==='exact').length} • Reversed ${list.filter(r=>r.status==='swap').length}</small></button>`;
  }).join("");
  return `<section class="card"><div class="section-head"><h2>Weekly Table</h2><span>${formatDateTH(isoDate(start))}–${formatDateTH(isoDate(end))}</span></div>
    <div class="week-controls"><button id="prevWeek" class="icon-square">‹</button><button id="thisWeek" class="btn secondary compact">This Week</button><button id="nextWeek" class="icon-square">›</button></div>
    <div class="all-person-summary">${summary}</div>${profileTabs()}<div class="week-list">${rows}</div></section>`;
}


function canonical3(value) { return [...String(value || "")].sort().join(""); }
function getDailyTable(profileId, date) {
  return state.dailyTables.find(t => Number(t.profileId) === Number(profileId) && t.date === date);
}
function compareActualWithTable(actualNumber, table) {
  if (!table || !/^\d{3}$/.test(String(actualNumber || ""))) return { status:"pending", matched:"" };
  const results = Array.isArray(table.lResults) ? table.lResults : findLResults(table.grid || []);
  const query = String(actualNumber);
  const exactOccurrence = results.flatMap(x => x.occurrences || [x]).find(x => x.number === query);
  if (exactOccurrence) return { status:"exact", matched:query };
  const canonical = canonical3(query);
  const group = results.find(x => (x.canonicalNumber || canonical3(x.number)) === canonical);
  return group ? { status:"swap", matched:group.number } : { status:"notfound", matched:"" };
}
function tableStatusLabel(status) {
  return ({pending:"Pending", exact:"Exact", swap:"เลขกลับ", notfound:"Not Found"})[status] || status;
}
function saveDailyTableForm() {
  if (!state.grid) return alert("กรุณาคำนวณตารางก่อนSave");
  const profileName = state.profiles[state.activeProfile] || `Profile ${state.activeProfile + 1}`;
  showModal(`<div class="modal-head"><div><h2>Saveตาราง 15 ช่อง</h2><p>${escapeHtml(profileName)}</p></div><button class="icon-btn" data-close>×</button></div>
    ${gridHtml(state.grid)}
    <label class="form-label">Dateของตาราง<input id="dailyTableDate" type="date" value="${isoDate()}"></label>
    <label class="form-label">Note (ไม่บังคับ)<textarea id="dailyTableNote" rows="3" placeholder="รายละเอียดของตารางวันนี้"></textarea></label>
    <button id="confirmDailyTable" class="btn primary full">Saveตารางนี้</button>`);
  document.getElementById("confirmDailyTable").addEventListener("click", () => {
    const date = document.getElementById("dailyTableDate").value;
    if (!date) return alert("กรุณาเลือกDate");
    const existing = getDailyTable(state.activeProfile, date);
    if (existing && !confirm("Profileนี้มีตารางในDateดังกล่าวแล้ว ต้องการแทนที่ตารางเดิมหรือไม่?")) return;
    const payload = {
      id: existing?.id || uid(), profileId: state.activeProfile, profileName,
      date, inputDigits:[...state.lastInput], inputNumber:state.lastInput.join(""),
      grid:state.grid.map(row => [...row]), lResults:findLResults(state.grid),
      note:document.getElementById("dailyTableNote").value.trim(),
      createdAt:existing?.createdAt || Date.now(), updatedAt:Date.now()
    };
    if (existing) Object.assign(existing, payload); else state.dailyTables.push(payload);
    saveState(); closeModal(); state.currentView="history"; render();
  });
}
function openDailyTableDetail(id) {
  const t = state.dailyTables.find(x => x.id === id); if (!t) return;
  const actual = state.actualDraws.find(x => Number(x.profileId) === Number(t.profileId) && x.date === t.date);
  const result = compareActualWithTable(actual?.number, t);
  showModal(`<div class="modal-head"><div><h2>ตาราง 15 ช่องย้อนหลัง</h2><p>${escapeHtml(state.profiles[t.profileId] || t.profileName)}</p></div><button class="icon-btn" data-close>×</button></div>
    ${gridHtml(t.grid || [])}
    <label class="form-label">แก้ไขวันที่ของตาราง<input id="editDailyTableDate" type="date" value="${escapeHtml(t.date || isoDate())}"></label>
    <button id="saveDailyTableDate" class="btn primary full">Save วันที่ใหม่</button>
    <div class="detail-card"><div><span>เลขตั้งต้น</span><b>${escapeHtml(t.inputNumber || "-")}</b></div><div><span>เลขจริง</span><b>${escapeHtml(actual?.number || "ยังไม่กรอก")}</b></div><div><span>ผลเปรียบเทียบ</span><b>${tableStatusLabel(result.status)}</b></div><div><span>ชุดที่Exact</span><b>${escapeHtml(result.matched || "-")}</b></div><div><span>เลข L ทั้งหมด</span><b>${(t.lResults || []).length} ชุด</b></div></div>
    <button id="deleteDailyTable" class="btn danger full">Deleteตารางนี้</button>`);
  document.getElementById("saveDailyTableDate").addEventListener("click", () => {
    const newDate = document.getElementById("editDailyTableDate").value;
    if (!newDate) return alert("กรุณาเลือกวันที่ใหม่");
    if (newDate === t.date) return alert("วันที่ยังเหมือนเดิม");
    const duplicate = state.dailyTables.find(x => x.id !== id && Number(x.profileId) === Number(t.profileId) && x.date === newDate);
    if (duplicate) return alert("Profile นี้มีตารางในวันที่เลือกอยู่แล้ว กรุณาเลือกวันอื่น");
    t.date = newDate;
    t.updatedAt = Date.now();
    saveState();
    closeModal();
    render();
  });
  document.getElementById("deleteDailyTable").addEventListener("click", () => {
    if (!confirm("ConfirmDeleteตาราง 15 ช่องนี้?")) return;
    state.dailyTables = state.dailyTables.filter(x => x.id !== id); saveState(); closeModal(); render();
  });
}

function renderHistory() {
  const selectedProfile = Number(state.activeProfile);
  const selectedName = state.profiles[selectedProfile] || `Profile ${selectedProfile + 1}`;
  const selectedTables = state.dailyTables.filter(t => Number(t.profileId) === selectedProfile);
  const tableRows = [...selectedTables].sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||0)-(a.createdAt||0)).map(t=>{ const actual=state.actualDraws.find(x=>Number(x.profileId)===Number(t.profileId)&&x.date===t.date); const result=compareActualWithTable(actual?.number,t); const name=state.profiles[t.profileId]||t.profileName||`Profile ${Number(t.profileId)+1}`; return `<article class="history-item profile-history-item" style="--profile-color:${profileColor(t.profileId)}" data-daily-table="${t.id}"><div><small>${formatDateTH(t.date)} • ${escapeHtml(name)}</small><h3>${escapeHtml(t.inputNumber||"-----")}</h3><p>เลขจริง ${escapeHtml(actual?.number||"ยังไม่กรอก")} • ${tableStatusLabel(result.status)}</p></div><span class="status ${result.status}">${tableStatusLabel(result.status)}</span></article>`; }).join("");
  const selectedActualDraws = state.actualDraws.filter(r => Number(r.profileId ?? 0) === selectedProfile);
  const actualRows = [...selectedActualDraws]
    .sort((a,b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0))
    .map(r => {
      const profileId = Number(r.profileId ?? 0);
      const profileName = state.profiles[profileId] || r.profileName || `Profile ${profileId + 1}`;
      return `<article class="history-item actual-draw-item profile-history-item" style="--profile-color:${profileColor(profileId)}" data-actual-draw="${r.id}">
        <div><small>${formatDateTH(r.date)} • ${DAYS_TH[new Date(`${r.date}T12:00:00`).getDay()]} • ${escapeHtml(profileName)}</small><h3 class="actual-three-number">${escapeHtml(r.number)}</h3><p>${escapeHtml(r.note || "เลขออกจริง 3 หลัก")}</p></div>
        <span class="status actual profile-status" style="--profile-color:${profileColor(profileId)}">${escapeHtml(profileName)}</span>
      </article>`;
    }).join("");
  const rows = state.records
    .filter(r => r.profileId === state.activeProfile)
    .sort((a,b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .map(r => `<article class="history-item" data-record="${r.id}">
      <div><small>${formatDateTH(r.date)} • ${DAYS_TH[new Date(`${r.date}T12:00:00`).getDay()]}</small><h3>${escapeHtml(r.actualResult)}</h3><p>${r.status === "notfound" ? "Not Foundในชุด L" : `${escapeHtml(r.patternId || "-")} • ${escapeHtml(r.patternName || "-")} • ชุดที่เลือก ${escapeHtml(r.selectedNumber || "-")}`}</p></div>
      <span class="status ${r.status}">${statusLabel(r.status)}</span>
    </article>`).join("");
  return `<section class="card"><div class="section-head"><h2>ตาราง 15 ช่องย้อนหลัง</h2><span>${selectedTables.length} ตาราง</span></div>${profileTabs()}<div class="profile-filter-summary"><b style="color:${profileColor(selectedProfile)}">เฉพาะ${escapeHtml(selectedName)}</b><span>ทั้งหมด ${selectedTables.length} รายการ</span></div><div class="history-list">${tableRows || `<div class="empty-card flat">ยังไม่มีตารางของ ${escapeHtml(selectedName)}</div>`}</div></section>
  <section class="card actual-draw-card"><div class="section-head"><h2>เลขออกจริง 3 หลัก แยกตามProfile</h2><span>${selectedActualDraws.length} รายการ</span></div>
    ${profileTabs()}
    <div class="profile-filter-summary"><b style="color:${profileColor(selectedProfile)}">เฉพาะ${escapeHtml(selectedName)}</b><span>ทั้งหมด ${selectedActualDraws.length} รายการ</span></div>
    <button id="btnAddActualDraw" class="btn primary full actual-add-button" style="--profile-color:${profileColor(selectedProfile)}">＋ Saveเลขออกจริง 3 หลัก สำหรับ ${escapeHtml(selectedName)}</button>
    <div class="history-list actual-draw-list">${actualRows || `<div class="empty-card flat">ยังไม่มีเลขออกจริง 3 หลักของ ${escapeHtml(selectedName)}</div>`}</div>
  </section>
  <section class="card"><div class="section-head"><h2>Historyผล L 3 ตัว</h2><span>${state.records.filter(r=>r.profileId===state.activeProfile).length} รายการ</span></div>${profileTabs()}<div class="history-list">${rows || `<div class="empty-card flat">ยังไม่มีข้อมูลSave</div>`}</div></section>`;
}

function renderAnalysis() {
  const records = state.records.filter(r => r.profileId === state.activeProfile);
  const exact = records.filter(r=>r.status==="exact").length;
  const swap = records.filter(r=>r.status==="swap").length;
  const miss = records.filter(r=>r.status==="notfound").length;
  const foundRate = records.length ? Math.round((exact+swap)*100/records.length) : 0;
  const exactRate = records.length ? Math.round(exact*100/records.length) : 0;
  const { counts, positions } = patternStats();
  const ranking = L_PATTERNS.map(p=>({ ...p, score: counts[p.id] || 0 })).sort((a,b)=>b.score-a.score);
  const maxPosition = Math.max(1, ...Object.values(positions));
  const heat = Array.from({length:3},(_,r)=>Array.from({length:4},(_,c)=>{
    const value=positions[`${r}-${c}`]||0;
    const opacity=value ? (0.15 + 0.75*value/maxPosition) : 0.05;
    return `<div class="heat-cell" style="--heat:${opacity}"><b>${value}</b><small>R${r+1}C${c+1}</small></div>`;
  }).join("")).join("");
  const allProfiles = state.profiles.map((name,i)=>{
    const list=state.records.filter(r=>r.profileId===i);
    return `<div class="profile-stat"><b>${escapeHtml(name)}</b><span>${list.length} งวด</span><small>Exact ${list.filter(r=>r.status==='exact').length} • พบ ${list.filter(r=>r.status!=='notfound').length}</small></div>`;
  }).join("");
  return `<section class="card">
    <div class="section-head"><h2>Pattern Center</h2><span>ข้อมูลสะสม ${records.length}/20 งวด</span></div>${profileTabs()}
    <div class="stats-grid"><div><b>${exact}</b><span>Exact</span></div><div><b>${swap}</b><span>Reversed</span></div><div><b>${miss}</b><span>Not Found</span></div></div>
    ${progressCard("อัตราพบเลขครบ (Exact + Reversed)", foundRate)}
    ${progressCard("อัตราExactตามลำดับ", exactRate)}
    <h3 class="subhead">อันดับPattern L</h3>
    <div class="ranking">${ranking.map((p,i)=>`<div><b>${i+1}. ${p.id} • ${escapeHtml(p.name)}</b><span>${p.score} คะแนน</span></div>`).join("")}</div>
    <h3 class="subhead">Heat Map Positionที่เคยออก</h3>
    <div class="heat-map">${heat}</div>
    <h3 class="subhead">ภาพรวมทุกProfile</h3><div class="profile-stats">${allProfiles}</div>
    ${records.length < 20 ? `<div class="notice">เก็บข้อมูลเพิ่มอีก ${20-records.length} งวด เพื่อเปิดคะแนนจัดอันดับที่น่าเProfileถือขึ้น</div>` : `<div class="notice success-note">ครบ 20 งวดแล้ว ระบบจัดอันดับใช้ข้อมูลย้อนหลังเต็มPattern</div>`}
    <p class="disclaimer">คะแนนเป็นสถิติจากข้อมูลที่Save ไม่ใช่เปอร์เซ็นต์รับประกันผล</p>
  </section>`;
}

function progressCard(label, value) {
  return `<div class="progress-card"><div><span>${label}</span><b>${value}%</b></div><div class="progress"><i style="width:${value}%"></i></div></div>`;
}

function renderSettings() {
  return `<section class="card"><div class="section-head"><h2>SettingsรายProfile</h2><span>ปัจจุบัน ${state.profiles.length} Profile</span></div>
    <div class="settings-list">${state.profiles.map((name,i)=>`<label><span>Profile ${i+1}</span><input class="name-input" data-name-index="${i}" value="${escapeHtml(name)}" maxlength="30"></label>`).join("")}</div>
    <button id="btnAddProfile" class="btn secondary full">＋ เพิ่มProfileใหม่</button>
    <button id="btnSaveNames" class="btn primary full">SaveProfile</button>
    <button id="btnThemeSetting" class="btn secondary full">${state.theme === "dark" ? "☀️ ใช้โหมดสว่าง" : "🌙 ใช้โหมดกลางคืน"}</button>
    <button id="btnExport" class="btn secondary full">สำรองข้อมูล JSON</button>
    <label class="btn secondary full file-button">นำเข้าข้อมูล JSON<input id="importFile" type="file" accept="application/json" hidden></label>
    <button id="btnResetAll" class="btn danger full">Clearข้อมูลทั้งหมด</button>
  </section>`;
}

function bindCommon() {
  document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);
  document.querySelectorAll("[data-view]").forEach(btn => btn.addEventListener("click", () => { state.currentView = btn.dataset.view; saveState(); render(); }));
  document.querySelectorAll("[data-profile]").forEach(btn => btn.addEventListener("click", () => { state.activeProfile = Number(btn.dataset.profile); saveState(); render(); }));
  document.querySelectorAll("[data-record]").forEach(el => el.addEventListener("click", () => openRecordDetail(el.dataset.record)));
}

function bindView() {
  if (state.currentView === "home") bindHome();
  if (state.currentView === "weekly") {
    document.getElementById("prevWeek")?.addEventListener("click",()=>{state.weekOffset=(state.weekOffset||0)-1;saveState();render();});
    document.getElementById("nextWeek")?.addEventListener("click",()=>{state.weekOffset=(state.weekOffset||0)+1;saveState();render();});
    document.getElementById("thisWeek")?.addEventListener("click",()=>{state.weekOffset=0;saveState();render();});
  }
  if (state.currentView === "history") {
    document.getElementById("btnAddActualDraw")?.addEventListener("click", () => openActualDrawForm());
    document.querySelectorAll("[data-actual-draw]").forEach(el => el.addEventListener("click", () => openActualDrawDetail(el.dataset.actualDraw)));
    document.querySelectorAll("[data-daily-table]").forEach(el => el.addEventListener("click", () => openDailyTableDetail(el.dataset.dailyTable)));
  }
  if (state.currentView === "settings") bindSettings();
}

function bindHome() {
  const inputs = [...document.querySelectorAll(".digit-input")];
  let activeIndex = Math.min(state.lastInput.findIndex(v => !v), 4);
  if (activeIndex < 0) activeIndex = 0;

  const setActive = (index) => {
    activeIndex = Math.max(0, Math.min(4, index));
    inputs.forEach((input, i) => input.classList.toggle("active", i === activeIndex));
  };

  inputs.forEach((input, index) => {
    input.dataset.numericKeypad = "true";
    input.addEventListener("click", () => { setActive(index); openNumericKeypad(input); });
  });
  setActive(activeIndex);

  document.getElementById("btnCalc")?.addEventListener("click", () => {
    const grid = calculateGrid();
    if (!grid) return alert("Please enter all 5 digits");
    state.grid = grid; saveState(); render();
  });
  document.getElementById("btnClear")?.addEventListener("click", () => {
    state.lastInput = ["","","","",""]; state.grid = null; state.selectedL = null; saveState(); render();
  });
  document.getElementById("btnSaveDailyTable")?.addEventListener("click", saveDailyTableForm);
  document.getElementById("btnFindL")?.addEventListener("click", () => {
    currentLResults = findLResults(state.grid);
    openLResults();
  });
}

function openLResults(searchValue = "") {
  showModal(`
    <div class="modal-head"><div><h2>ผลลัพธ์เลข L</h2><p>พบ ${currentLResults.length} ชุด</p></div><button class="icon-btn" data-close>×</button></div>
    <div class="l-search-wrap">
      <span>🔎</span>
      <input id="lSearchInput" class="l-search-input" type="text" readonly maxlength="3" data-numeric-keypad="true" placeholder="ค้นหาเลข เช่น 356" value="${escapeHtml(searchValue)}">
      <button id="clearLSearch" class="search-clear" type="button">Clear</button>
    </div>
    <div class="l-result-grid">${currentLResults.map((item,i)=>`<button class="l-number" data-l-index="${i}" data-number="${item.number}" aria-label="เลข ${item.number}"><b>${item.number}</b></button>`).join("")}</div>
    <button id="btnNotFound" class="btn secondary full">Not FoundActual Resultในชุด L</button>
  `);

  const searchInput = document.getElementById("lSearchInput");
  let popupTimer = null;
  let lastPopupKey = "";

  const closeMatchPopup = () => {
    clearTimeout(popupTimer);
    const root = document.getElementById("matchPopupRoot");
    const popup = root?.querySelector(".match-number-popup");
    popup?.classList.remove("show");
    root?.classList.remove("active");
    setTimeout(() => { if (root) root.innerHTML = ""; }, 220);
  };

  const createConfetti = root => {
    const layer = document.createElement("div");
    layer.className = "confetti-layer";
    for (let i = 0; i < 34; i++) {
      const piece = document.createElement("i");
      piece.style.setProperty("--x", `${(Math.random() - 0.5) * 280}px`);
      piece.style.setProperty("--y", `${-70 - Math.random() * 190}px`);
      piece.style.setProperty("--r", `${Math.random() * 720 - 360}deg`);
      piece.style.setProperty("--delay", `${Math.random() * 0.14}s`);
      piece.style.setProperty("--hue", `${Math.floor(Math.random() * 360)}`);
      layer.appendChild(piece);
    }
    root.appendChild(layer);
  };

  const showMatchPopup = number => {
    const root = document.getElementById("matchPopupRoot") || (() => {
      const el = document.createElement("div");
      el.id = "matchPopupRoot";
      document.body.appendChild(el);
      return el;
    })();
    clearTimeout(popupTimer);
    root.innerHTML = `<div class="match-number-popup" role="status" aria-live="polite"><button class="match-popup-close" type="button" aria-label="ปิด">×</button><strong>${escapeHtml(number)}</strong></div>`;
    root.classList.add("active");
    createConfetti(root);
    root.querySelector(".match-popup-close")?.addEventListener("click", closeMatchPopup);
    requestAnimationFrame(() => root.querySelector(".match-number-popup")?.classList.add("show"));
    popupTimer = setTimeout(closeMatchPopup, 2200);
  };

  const applySearch = () => {
    const q = searchInput.value.replace(/\D/g, "").slice(0,3);
    searchInput.value = q;
    const canonicalQuery = q.length === 3 ? [...q].sort().join("") : "";
    let matchedNumber = "";

    document.querySelectorAll(".l-number").forEach(btn => {
      const number = btn.dataset.number;
      const permutationMatch = q.length === 3 && number === canonicalQuery;
      const partial = q.length > 0 && q.length < 3 && number.includes(q);
      btn.classList.toggle("search-match", permutationMatch);
      btn.classList.toggle("search-partial", !permutationMatch && partial);
      btn.classList.toggle("search-dim", q.length > 0 && !permutationMatch && !partial);
      if (permutationMatch) matchedNumber = number;
    });

    if (matchedNumber && canonicalQuery !== lastPopupKey) {
      lastPopupKey = canonicalQuery;
      showMatchPopup(matchedNumber);
    }
    if (q.length < 3 || !matchedNumber) lastPopupKey = "";
  };

  document.querySelectorAll("[data-l-index]").forEach(btn => btn.addEventListener("click", () => openLDetail(currentLResults[Number(btn.dataset.lIndex)])));
  document.getElementById("btnNotFound").addEventListener("click", () => openSaveForm(null));
  searchInput.addEventListener("input", applySearch);
  document.getElementById("clearLSearch").addEventListener("click", () => { searchInput.value = ""; searchInput.focus(); applySearch(); });
  applySearch();
  if (searchValue) searchInput.focus();
}

function openLDetail(item) {
  const occurrences = item.occurrences || [item];
  if (occurrences.length > 1) {
    showModal(`
      <div class="modal-head"><div><h2>เลข ${item.number} มีหลายPosition</h2><p>เลือกPositionตัว L ที่ต้องการSave</p></div><button class="icon-btn" data-close>×</button></div>
      <div class="occurrence-list">${occurrences.map((occ,i)=>`<button class="occurrence-card" data-occurrence="${i}"><b>${occ.patternId} • ${escapeHtml(occ.patternName)}</b><span>${escapeHtml(occ.block)}</span><small>${occ.number.split("").join(" → ")}</small></button>`).join("")}</div>
      <button id="btnBackResults" class="btn secondary full">Back to Results</button>
    `);
    document.querySelectorAll("[data-occurrence]").forEach(btn => btn.addEventListener("click", () => openLDetail(occurrences[Number(btn.dataset.occurrence)])));
    document.getElementById("btnBackResults").addEventListener("click", openLResults);
    return;
  }
  state.selectedL = item;
  showModal(`
    <div class="modal-head"><div><h2>รายละเอียดชุด L</h2><p>${item.patternId} • ${escapeHtml(item.patternName)}</p></div><button class="icon-btn" data-close>×</button></div>
    <div class="hero-number">${item.number}</div>
    ${gridHtml(state.grid, item.cells)}
    <div class="detail-card"><div><span>Position</span><b>${escapeHtml(item.block)}</b></div><div><span>Direction</span><b>${escapeHtml(item.patternName)}</b></div><div><span>Reading Order</span><b>${item.number.split("").join(" → ")}</b></div></div>
    <button id="btnSaveThis" class="btn primary full">✓ Saveผลชุดนี้</button>
    <button id="btnBackResults" class="btn secondary full">กลับไปดูชุดอื่น</button>
  `);
  document.getElementById("btnSaveThis").addEventListener("click", () => openSaveForm(item));
  document.getElementById("btnBackResults").addEventListener("click", openLResults);
}

function openSaveForm(item) {
  const today = isoDate();
  showModal(`
    <div class="modal-head"><div><h2>SaveActual Result</h2><p>${escapeHtml(state.profiles[state.activeProfile])}</p></div><button class="icon-btn" data-close>×</button></div>
    <label class="form-label">Date<input id="recordDate" type="date" value="${today}"></label>
    <label class="form-label">เลขActual Result 3 ตัว<input id="actualResult" class="result-input" type="text" readonly maxlength="3" data-numeric-keypad="true" placeholder="เช่น 768"></label>
    ${item ? `<div class="selected-card"><span>ชุด L ที่เลือก</span><b>${item.number}</b><small>${item.patternId} • ${escapeHtml(item.patternName)} • ${escapeHtml(item.block)}</small></div>
      <div class="status-choice"><button class="choice active" data-status="exact">✓ Exact</button><button class="choice" data-status="swap">↻ Reversed</button></div>` : `<div class="selected-card miss"><span>สถานะ</span><b>Not Foundในชุด L</b></div>`}
    <label class="form-label">Note (ไม่บังคับ)<textarea id="recordNote" rows="3" placeholder="เช่น เลขซ้ำ หรือรายละเอียดเพิ่มเติม"></textarea></label>
    <button id="btnConfirmSave" class="btn primary full">ConfirmและSave</button>
  `);
  let status = item ? "exact" : "notfound";
  document.querySelectorAll("[data-status]").forEach(btn => btn.addEventListener("click", () => {
    status = btn.dataset.status;
    document.querySelectorAll("[data-status]").forEach(x => x.classList.toggle("active", x === btn));
  }));
  const actual = document.getElementById("actualResult");
  if (item) actual.value = item.number;
  actual.addEventListener("input", e => e.target.value = e.target.value.replace(/\D/g, "").slice(0,3));
  document.getElementById("btnConfirmSave").addEventListener("click", () => saveRecord(item, status));
}

function saveRecord(item, status) {
  const date = document.getElementById("recordDate").value;
  const actualResult = document.getElementById("actualResult").value;
  if (!date || !/^\d{3}$/.test(actualResult)) return alert("กรุณากรอกDateและเลขActual Result 3 ตัวให้ครบ");
  const existing = state.records.find(r => r.profileId === state.activeProfile && r.date === date);
  if (existing && !confirm("Profileนี้มีข้อมูลในวันดังกล่าวแล้ว ต้องการSaveเพิ่มอีกหนึ่งรายการหรือไม่?")) return;
  const record = {
    id: uid(), profileId: state.activeProfile, profileName: state.profiles[state.activeProfile], date,
    dayOfWeek: DAYS_TH[new Date(`${date}T12:00:00`).getDay()], inputNumber: state.lastInput.join(""), grid: state.grid,
    actualResult, selectedNumber: item?.number || "", status,
    patternId: item?.patternId || "", patternName: item?.patternName || "", cells: item?.cells || [], block: item?.block || "",
    note: document.getElementById("recordNote").value.trim(), createdAt: Date.now()
  };
  state.records.push(record); saveState();
  showModal(`<div class="success"><div class="success-icon">✓</div><h2>Saveผลเรียบร้อย</h2><div class="detail-card"><div><span>Actual Result</span><b>${actualResult}</b></div><div><span>สถานะ</span><b>${statusLabel(status)}</b></div><div><span>Pattern</span><b>${item ? `${item.patternId} • ${escapeHtml(item.patternName)}` : "Not Found"}</b></div></div><p>Saveสะสมของ ${escapeHtml(state.profiles[state.activeProfile])} แล้ว ${state.records.filter(r=>r.profileId===state.activeProfile).length} งวด</p><button id="goHistory" class="btn primary full">ดูHistory</button><button class="btn secondary full" data-close>กลับหน้าคำนวณ</button></div>`);
  document.getElementById("goHistory").addEventListener("click", () => { closeModal(); state.currentView="history"; saveState(); render(); });
}

function statusLabel(status) {
  return ({ exact:"Exact", swap:"Reversed", notfound:"Not Found" })[status] || status;
}

function openRecordDetail(id) {
  const r = state.records.find(x=>x.id===id); if (!r) return;
  showModal(`<div class="modal-head"><div><h2>รายละเอียดSave</h2><p>${formatDateTH(r.date)} • ${escapeHtml(r.profileName)}</p></div><button class="icon-btn" data-close>×</button></div>
    <div class="hero-number">${escapeHtml(r.actualResult)}</div>
    ${r.grid ? gridHtml(r.grid, r.cells || []) : ""}
    <div class="detail-card"><div><span>สถานะ</span><b>${statusLabel(r.status)}</b></div><div><span>ชุดที่เลือก</span><b>${escapeHtml(r.selectedNumber || "-")}</b></div><div><span>Pattern</span><b>${escapeHtml(r.patternId || "-")} ${escapeHtml(r.patternName || "")}</b></div><div><span>Position</span><b>${escapeHtml(r.block || "-")}</b></div><div><span>เลขตั้งต้น</span><b>${escapeHtml(r.inputNumber || "-")}</b></div></div>
    <button id="deleteRecord" class="btn danger full">DeleteSaveนี้</button>`);
  document.getElementById("deleteRecord").addEventListener("click", () => {
    if (!confirm("ConfirmDeleteSaveนี้?")) return;
    state.records = state.records.filter(x=>x.id!==id); saveState(); closeModal(); render();
  });
}

function openActualDrawForm(existingId = null) {
  const existing = existingId ? state.actualDraws.find(x => x.id === existingId) : null;
  const fiveProfiles = state.profiles.slice(0, 5);
  while (fiveProfiles.length < 5) fiveProfiles.push(`Profile ${fiveProfiles.length + 1}`);
  const selectedProfileId = Number.isInteger(existing?.profileId) ? existing.profileId : Math.min(state.activeProfile, 4);
  const profileOptions = fiveProfiles.map((name, idx) => `<option value="${idx}" ${idx === selectedProfileId ? "selected" : ""}>${escapeHtml(name)}</option>`).join("");
  showModal(`
    <div class="modal-head"><div><h2>${existing ? "Edit" : "Save"}เลขออกจริง 3 หลัก</h2><p>เลือกProfileเจ้าของข้อมูลจาก 5 Profile แล้วเก็บไว้ดูย้อนหลัง</p></div><button class="icon-btn" data-close>×</button></div>
    <label class="form-label">Profile<select id="actualDrawProfile" class="name-select">${profileOptions}</select></label>
    <label class="form-label">Dateออก<input id="actualDrawDate" type="date" value="${existing?.date || isoDate()}"></label>
    <label class="form-label">เลขออกจริง 3 หลัก<input id="actualDrawNumber" class="result-input actual-three-input" type="text" readonly maxlength="3" data-numeric-keypad="true" placeholder="เช่น 768" value="${escapeHtml(existing?.number || "")}"></label>
    <label class="form-label">Note (ไม่บังคับ)<textarea id="actualDrawNote" rows="3" placeholder="เช่น งวดเช้า หรือรายละเอียดเพิ่มเติม">${escapeHtml(existing?.note || "")}</textarea></label>
    <button id="btnSaveActualDraw" class="btn primary full">Saveเลขออกจริง</button>
  `);
  const input = document.getElementById("actualDrawNumber");
  input.addEventListener("input", e => e.target.value = e.target.value.replace(/\D/g, "").slice(0,3));
  input.focus();
  document.getElementById("btnSaveActualDraw").addEventListener("click", () => {
    const profileId = Number(document.getElementById("actualDrawProfile").value);
    const profileName = fiveProfiles[profileId] || `Profile ${profileId + 1}`;
    const date = document.getElementById("actualDrawDate").value;
    const number = input.value;
    const note = document.getElementById("actualDrawNote").value.trim();
    if (!date || !/^\d{3}$/.test(number)) return alert("กรุณาเลือกProfile กรอกDate และเลขออกจริงให้ครบ 3 หลัก");
    const duplicate = state.actualDraws.find(x => x.date === date && Number(x.profileId ?? 0) === profileId && x.id !== existingId);
    if (duplicate && !confirm(`${profileName} มีเลขออกจริงในวันนี้แล้ว ต้องการSaveเพิ่มอีกหนึ่งรายการหรือไม่?`)) return;
    if (existing) {
      existing.profileId = profileId; existing.profileName = profileName; existing.date = date; existing.number = number; existing.note = note; existing.updatedAt = Date.now();
    } else {
      state.actualDraws.push({ id: uid(), profileId, profileName, date, number, note, createdAt: Date.now() });
    }
    saveState(); closeModal(); state.currentView = "history"; render();
  });
}

function openActualDrawDetail(id) {
  const r = state.actualDraws.find(x => x.id === id); if (!r) return;
  const profileName = r.profileName || state.profiles[r.profileId] || state.profiles[0] || "Profile 1";
  showModal(`<div class="modal-head"><div><h2>เลขออกจริง 3 หลัก</h2><p>${formatDateTH(r.date)} • ${DAYS_TH[new Date(`${r.date}T12:00:00`).getDay()]}</p></div><button class="icon-btn" data-close>×</button></div>
    <div class="hero-number actual-three-hero">${escapeHtml(r.number)}</div>
    ${(()=>{const t=getDailyTable(r.profileId,r.date);const cmp=compareActualWithTable(r.number,t);return t?`${gridHtml(t.grid||[])}<div class="detail-card"><div><span>Profile</span><b>${escapeHtml(profileName)}</b></div><div><span>Date</span><b>${formatDateTH(r.date)}</b></div><div><span>ผลเทียบตาราง</span><b>${tableStatusLabel(cmp.status)}</b></div><div><span>ชุดที่Exact</span><b>${escapeHtml(cmp.matched||"-")}</b></div><div><span>Note</span><b>${escapeHtml(r.note || "-")}</b></div></div>`:`<div class="detail-card"><div><span>Profile</span><b>${escapeHtml(profileName)}</b></div><div><span>Date</span><b>${formatDateTH(r.date)}</b></div><div><span>ตารางวันนั้น</span><b>ยังไม่ได้Save</b></div><div><span>Note</span><b>${escapeHtml(r.note || "-")}</b></div></div>`})()}
    <button id="editActualDraw" class="btn secondary full">Editข้อมูล</button>
    <button id="deleteActualDraw" class="btn danger full">Deleteเลขออกจริงนี้</button>`);
  document.getElementById("editActualDraw").addEventListener("click", () => openActualDrawForm(id));
  document.getElementById("deleteActualDraw").addEventListener("click", () => {
    if (!confirm("ConfirmDeleteเลขออกจริง 3 หลักนี้?")) return;
    state.actualDraws = state.actualDraws.filter(x => x.id !== id); saveState(); closeModal(); render();
  });
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  saveState();
  render();
}

function bindSettings() {
  document.getElementById("btnThemeSetting")?.addEventListener("click", toggleTheme);
  document.getElementById("btnAddProfile")?.addEventListener("click", () => {
    const currentNames = [...document.querySelectorAll(".name-input")].map((x,i)=>x.value.trim() || `Profile ${i+1}`);
    state.profiles = [...currentNames, `Profile ${currentNames.length + 1}`];
    state.activeProfile = state.profiles.length - 1;
    saveState();
    render();
    setTimeout(() => {
      const inputs = document.querySelectorAll(".name-input");
      const last = inputs[inputs.length - 1];
      if (last) { last.focus(); last.select(); last.scrollIntoView({behavior:"smooth", block:"center"}); }
    }, 0);
  });
  document.getElementById("btnSaveNames")?.addEventListener("click", () => {
    const names = [...document.querySelectorAll(".name-input")].map((x,i)=>x.value.trim() || `Profile ${i+1}`);
    state.profiles = names; saveState(); alert("SaveProfileเรียบร้อย"); render();
  });
  document.getElementById("btnExport")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state,null,2)], {type:"application/json"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`LuckyNumber-V4.3-${isoDate()}.json`; a.click(); URL.revokeObjectURL(a.href);
  });
  document.getElementById("importFile")?.addEventListener("change", async e => {
    try { const data=JSON.parse(await e.target.files[0].text()); state={...DEFAULT_STATE,...data}; state.actualDraws=Array.isArray(data.actualDraws)?data.actualDraws:[]; state.dailyTables=Array.isArray(data.dailyTables)?data.dailyTables:[]; state.profiles=Array.isArray(data.profiles)&&data.profiles.length?data.profiles:[...DEFAULT_STATE.profiles]; state.activeProfile=Math.min(Number(state.activeProfile)||0,state.profiles.length-1); saveState(); render(); alert("นำเข้าข้อมูลเรียบร้อย"); }
    catch { alert("ไฟล์ไม่ถูกต้อง"); }
  });
  document.getElementById("btnResetAll")?.addEventListener("click", () => {
    if (!confirm("Clearข้อมูลทั้งหมด รวมHistoryทุกProfileหรือไม่?")) return;
    state=typeof structuredClone === "function" ? structuredClone(DEFAULT_STATE) : JSON.parse(JSON.stringify(DEFAULT_STATE)); saveState(); render();
  });
}


let keypadTarget = null;

function isNumericKeypadInput(el) {
  return el instanceof HTMLInputElement &&
    (el.dataset.numericKeypad === "true" || el.classList.contains("digit-input") || el.classList.contains("result-input") || el.classList.contains("l-search-input"));
}

function openNumericKeypad(input) {
  if (!isNumericKeypadInput(input)) return;
  keypadTarget = input;
  input.readOnly = true;
  document.querySelectorAll(".numeric-keypad-active").forEach(el => el.classList.remove("numeric-keypad-active"));
  input.classList.add("numeric-keypad-active");
  const keypad = document.getElementById("globalKeypad");
  if (!keypad) return;
  keypad.classList.add("show");
  keypad.setAttribute("aria-hidden", "false");
  document.body.classList.add("keypad-open");

  // Reserve exactly the keypad height and scroll the selected field into view.
  requestAnimationFrame(() => {
    const sheet = keypad.querySelector(".keypad-sheet");
    const keypadHeight = Math.ceil(sheet?.getBoundingClientRect().height || 520);
    document.body.style.setProperty("--popup-keypad-height", `${keypadHeight}px`);

    requestAnimationFrame(() => {
      const panel = input.closest(".modal-panel");
      if (panel) {
        const inputTop = input.offsetTop;
        const targetTop = Math.max(0, inputTop - 105);
        panel.scrollTo({ top: targetTop, behavior: "smooth" });
      } else {
        input.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });
  });
}

function closeNumericKeypad() {
  keypadTarget?.classList.remove("numeric-keypad-active");
  keypadTarget = null;
  const keypad = document.getElementById("globalKeypad");
  keypad?.classList.remove("show");
  keypad?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("keypad-open");
  document.body.style.removeProperty("--popup-keypad-height");
}

function applyNumericKey(value) {
  const input = keypadTarget;
  if (!input || !document.body.contains(input)) return closeNumericKeypad();

  if (input.classList.contains("digit-input")) {
    let index = Number(input.dataset.index || 0);
    if (value === "delete") {
      if (state.lastInput[index]) state.lastInput[index] = "";
      else if (index > 0) { index--; state.lastInput[index] = ""; }
    } else {
      state.lastInput[index] = value;
      if (index < 4) index++;
    }
    state.grid = null;
    saveState();
    const inputs = [...document.querySelectorAll(".digit-input")];
    inputs.forEach((el, i) => {
      el.value = state.lastInput[i];
      el.classList.toggle("active", i === index);
      el.classList.remove("numeric-keypad-active");
    });
    keypadTarget = inputs[index] || input;
    keypadTarget.classList.add("numeric-keypad-active");

    // V4.13: After the fifth digit is entered, close the keypad and calculate automatically.
    if (value !== "delete" && state.lastInput.every(v => /^\d$/.test(v))) {
      state.grid = calculateGrid(state.lastInput);
      saveState();
      closeNumericKeypad();
      render();
    }
    return;
  }

  const maxLength = Number(input.maxLength) > 0 ? Number(input.maxLength) : 99;
  if (value === "delete") input.value = input.value.slice(0, -1);
  else if (input.value.length < maxLength) input.value += value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function bindGlobalKeypad() {
  document.addEventListener("click", event => {
    const input = event.target.closest?.("input");
    if (isNumericKeypadInput(input)) {
      event.preventDefault();
      openNumericKeypad(input);
    }
  });
  document.addEventListener("click", event => {
    const key = event.target.closest?.("#globalKeypad [data-key]");
    if (key) { event.preventDefault(); applyNumericKey(key.dataset.key); return; }
    if (event.target.closest?.("#keypadDone")) { event.preventDefault(); closeNumericKeypad(); }
  });
}

function showModal(content) {
  document.getElementById("modalRoot").innerHTML = `<div class="modal show"><div class="modal-panel">${content}</div></div>`;
  document.body.classList.add("modal-open");
  document.querySelectorAll('input[data-numeric-keypad="true"], .result-input, .l-search-input').forEach(input => input.readOnly = true);
  document.querySelectorAll("[data-close]").forEach(btn=>btn.addEventListener("click", closeModal));
  document.querySelector(".modal")?.addEventListener("click", e=>{ if(e.target.classList.contains("modal")) closeModal(); });
}
function closeModal() { closeNumericKeypad(); document.getElementById("modalRoot").innerHTML=""; document.body.classList.remove("modal-open"); }

document.addEventListener("keydown", e => { if(e.key==="Escape") closeModal(); });
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(()=>{}));
render();
bindGlobalKeypad();
