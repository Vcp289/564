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
  theme: "light",
  historyTab: "results",
  calculationDate: null,
  analysisSortMode: "score",
  rankingConfig: { exactPoints: 1, reversedPoints: 0.6, weight10: 50, weight30: 30, weightAll: 20 }
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
    const merged = { ...base, ...(raw || {}), profiles: Array.isArray(raw?.profiles) && raw.profiles.length > 0 ? raw.profiles : base.profiles, records: Array.isArray(raw?.records) ? raw.records.filter(r => r && r.status !== "notfound") : [], actualDraws: Array.isArray(raw?.actualDraws) ? raw.actualDraws : [], dailyTables: Array.isArray(raw?.dailyTables) ? raw.dailyTables : [] };
    merged.rankingConfig = { ...base.rankingConfig, ...(raw?.rankingConfig || {}) };
    return merged;
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
function getVisibleProfileOrder() {
  const manualOrder = state.profiles.map((_, i) => i);
  if (state.currentView !== "analysis" || state.analysisSortMode !== "score") return manualOrder;
  return manualOrder.sort((a, b) => {
    const scoreA = getProfileAnalysisScore(a);
    const scoreB = getProfileAnalysisScore(b);
    return scoreB.score - scoreA.score || scoreB.samples - scoreA.samples || a - b;
  });
}

function profileTabs() {
  const order = getVisibleProfileOrder();
  return `<div class="profile-tabs profile-tabs-colored">${order.map(i => {
    const name = state.profiles[i];
    return `<button class="profile-chip profile-chip-colored ${i === Number(state.activeProfile) ? "active" : ""}" style="--profile-color:${profileColor(i)}" data-profile="${i}">${escapeHtml(name)}</button>`;
  }).join("")}</div>`;
}

function getLatestCompleteActualDraw(profileId = state.activeProfile) {
  return state.actualDraws
    .filter(r => Number(r.profileId ?? 0) === Number(profileId) && /^\d{3}$/.test(String(r.number || "")) && /^\d{2}$/.test(String(r.twoDigit || "")))
    .sort((a, b) => {
      const dateCompare = String(b.date || "").localeCompare(String(a.date || ""));
      return dateCompare || Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0);
    })[0] || null;
}

function renderHome() {
  const grid = state.grid;
  const latestDraw = getLatestCompleteActualDraw();
  return `
    <section class="card calculator-card">
      <div class="section-head"><h2>New Calculation</h2><span>${DAYS_TH[new Date().getDay()]} ${formatDateTH(isoDate())}</span></div>
      ${profileTabs()}
      <div class="result-load-actions">
        <button id="btnLoadLastResult" class="last-result-button ${latestDraw ? "" : "disabled"}" ${latestDraw ? "" : "disabled"}>
          <span>↩ LOAD LAST RESULT</span>
          <small>${latestDraw ? `${formatDateTH(latestDraw.date)} • ${escapeHtml(latestDraw.number)} · ${escapeHtml(latestDraw.twoDigit)}` : `ยังไม่มีผล 3 ตัวและ 2 ตัวของ ${escapeHtml(state.profiles[state.activeProfile] || "Profile")}`}</small>
        </button>
        <button id="btnBrowseResultCalendar" class="browse-result-button ${latestDraw ? "" : "disabled"}" ${latestDraw ? "" : "disabled"}>
          <span>📅 BROWSE HISTORY</span>
          <small>เลือกวันที่ที่บันทึกเลขออกจริงของชื่อนี้</small>
        </button>
      </div>
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
      <div class="auto-table-note">ตาราง 15 ช่องจะบันทึกอัตโนมัติเมื่อกรอกเลขออกจริงครบ 3 ตัวและ 2 ตัว</div>
    </section>` : ``}
  `;
}


function loadActualDrawIntoCalculator(draw) {
  if (!draw || !/^\d{3}$/.test(String(draw.number || "")) || !/^\d{2}$/.test(String(draw.twoDigit || ""))) {
    return alert("ข้อมูลวันที่นี้ยังมีเลข 3 ตัวหรือ 2 ตัวไม่ครบ");
  }
  state.lastInput = [...String(draw.number), ...String(draw.twoDigit)];
  state.calculationDate = draw.date || isoDate();
  state.grid = calculateGrid(state.lastInput);
  state.selectedL = null;
  saveState();
  closeModal();
  render();
}

function getCompleteActualDraws(profileId = state.activeProfile) {
  return state.actualDraws
    .filter(r => Number(r.profileId ?? 0) === Number(profileId) && /^\d{3}$/.test(String(r.number || "")) && /^\d{2}$/.test(String(r.twoDigit || "")))
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0));
}

function openResultCalendar(initialDate = isoDate()) {
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(String(initialDate || "")) ? new Date(`${initialDate}T12:00:00`) : new Date();
  let cursorYear = parsed.getFullYear();
  let cursorMonth = parsed.getMonth();

  const drawByDate = new Map();
  getCompleteActualDraws().forEach(draw => {
    if (!drawByDate.has(draw.date)) drawByDate.set(draw.date, draw);
  });

  const paint = () => {
    const monthStart = new Date(cursorYear, cursorMonth, 1, 12);
    const daysInMonth = new Date(cursorYear, cursorMonth + 1, 0, 12).getDate();
    const firstDay = monthStart.getDay();
    const mondayIndex = firstDay === 0 ? 6 : firstDay - 1;
    const monthLabel = monthStart.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
    const today = isoDate();
    const cells = [];
    for (let i = 0; i < mondayIndex; i++) cells.push('<span class="calendar-empty"></span>');
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${cursorYear}-${pad(cursorMonth + 1)}-${pad(day)}`;
      const draw = drawByDate.get(date);
      const future = date > today;
      const className = ["calendar-day", draw ? "has-result" : "", date === today ? "today" : "", future ? "future" : ""].filter(Boolean).join(" ");
      cells.push(`<button class="${className}" data-calendar-date="${date}" ${draw && !future ? "" : "disabled"}><b>${day}</b>${draw ? `<small>${escapeHtml(draw.number)}·${escapeHtml(draw.twoDigit)}</small><i></i>` : ""}</button>`);
    }

    showModal(`
      <div class="modal-head"><div><h2>Browse History</h2><p>${escapeHtml(state.profiles[state.activeProfile] || "Profile")} • วันที่สีน้ำเงินมีข้อมูลครบ</p></div><button class="icon-btn" data-close>×</button></div>
      <div class="calendar-toolbar"><button id="calendarPrev" class="icon-square">‹</button><strong>${escapeHtml(monthLabel)}</strong><button id="calendarNext" class="icon-square">›</button></div>
      <div class="calendar-weekdays">${["จ","อ","พ","พฤ","ศ","ส","อา"].map(d=>`<span>${d}</span>`).join("")}</div>
      <div class="result-calendar">${cells.join("")}</div>
      <div class="calendar-legend"><span><i class="legend-dot complete"></i>มีเลข 3 ตัวและ 2 ตัวครบ</span><span><i class="legend-dot empty"></i>ยังไม่มีข้อมูล</span></div>
    `);

    document.getElementById("calendarPrev")?.addEventListener("click", () => {
      cursorMonth--;
      if (cursorMonth < 0) { cursorMonth = 11; cursorYear--; }
      paint();
    });
    document.getElementById("calendarNext")?.addEventListener("click", () => {
      cursorMonth++;
      if (cursorMonth > 11) { cursorMonth = 0; cursorYear++; }
      paint();
    });
    document.querySelectorAll("[data-calendar-date]").forEach(button => button.addEventListener("click", () => {
      const draw = drawByDate.get(button.dataset.calendarDate);
      if (draw) loadActualDrawIntoCalculator(draw);
    }));
  };

  paint();
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
function shiftIsoDate(date, days) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}
// V4.25: วันผลจริงต้องอ้างอิงวันทำการก่อนหน้า และแก้ตารางอ้างอิงในหน้า Edit
// จันทร์ -> ศุกร์, อังคาร -> จันทร์ และข้ามเสาร์/อาทิตย์
function getExpectedReferenceDate(resultDate) {
  if (!resultDate) return "";
  const d = new Date(`${resultDate}T12:00:00`);
  do { d.setDate(d.getDate() - 1); } while (d.getDay() === 0 || d.getDay() === 6);
  return isoDate(d);
}
function getPredictionTable(profileId, resultDate, actualDraw = null) {
  const draw = actualDraw || state.actualDraws.find(x => Number(x.profileId ?? 0) === Number(profileId) && x.date === resultDate);
  if (draw?.referenceTableId) {
    return state.dailyTables.find(t => t.id === draw.referenceTableId && Number(t.profileId) === Number(profileId)) || null;
  }
  return getDailyTable(profileId, getExpectedReferenceDate(resultDate));
}
function getReferenceStatus(profileId, resultDate, actualDraw = null) {
  const expectedDate = getExpectedReferenceDate(resultDate);
  const table = getPredictionTable(profileId, resultDate, actualDraw);
  return { expectedDate, table, manual: Boolean(actualDraw?.referenceTableId) };
}

// V4.26: กรอกเลขออกจริงครั้งเดียว แล้วสร้าง/อัปเดตตาราง 15 ช่องของวันนั้นอัตโนมัติ
// ตารางวันที่ผลจริงจะถูกใช้เป็นตารางอ้างอิงของวันทำการถัดไป
function upsertDailyTableFromActual(actualDraw) {
  if (!actualDraw) return null;
  const three = String(actualDraw.number || "");
  const two = String(actualDraw.twoDigit || "");
  if (!/^\d{3}$/.test(three) || !/^\d{2}$/.test(two) || !actualDraw.date) return null;

  const profileId = Number(actualDraw.profileId ?? 0);
  const profileName = actualDraw.profileName || state.profiles[profileId] || `Profile ${profileId + 1}`;
  const inputDigits = [...three, ...two];
  const grid = calculateGrid(inputDigits);
  if (!grid) return null;

  const existing = getDailyTable(profileId, actualDraw.date);
  const payload = {
    id: existing?.id || uid(),
    profileId,
    profileName,
    date: actualDraw.date,
    inputDigits,
    inputNumber: inputDigits.join(""),
    grid: grid.map(row => [...row]),
    lResults: findLResults(grid),
    note: existing?.note || "สร้างอัตโนมัติจากเลขออกจริง",
    autoGeneratedFromActual: true,
    sourceActualDrawId: actualDraw.id,
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  if (existing) Object.assign(existing, payload);
  else state.dailyTables.push(payload);
  return existing || payload;
}

function showToast(message) {
  document.querySelector(".app-toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "app-toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 250);
  }, 1800);
}

function syncAutoLHistoryForProfile(profileId) {
  state.actualDraws
    .filter(x => Number(x.profileId ?? 0) === Number(profileId))
    .forEach(syncAutoLHistoryForActual);
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


// V4.23: ผลจริงวันที่ X เทียบกับตารางล่าสุดที่มีจริงก่อนวันที่ X
function findBestLMatch(actualNumber, table) {
  if (!table || !/^\d{3}$/.test(String(actualNumber || ""))) return null;
  const results = Array.isArray(table.lResults) && table.lResults.length ? table.lResults : findLResults(table.grid || []);
  const query = String(actualNumber);
  for (const group of results) {
    const occurrences = Array.isArray(group.occurrences) && group.occurrences.length ? group.occurrences : [group];
    const exact = occurrences.find(item => String(item.number) === query);
    if (exact) return { status:"exact", item:exact };
  }
  const canonical = canonical3(query);
  const group = results.find(item => (item.canonicalNumber || canonical3(item.number)) === canonical);
  if (!group) return { status:"notfound", item:null };
  const occurrences = Array.isArray(group.occurrences) && group.occurrences.length ? group.occurrences : [group];
  return { status:"swap", item:occurrences[0] || group };
}

function syncAutoLHistoryForActual(actualDraw) {
  if (!actualDraw) return;
  const profileId = Number(actualDraw.profileId ?? 0);
  const table = getPredictionTable(profileId, actualDraw.date, actualDraw);
  const oldIndex = state.records.findIndex(r => r.autoGenerated === true && r.sourceActualDrawId === actualDraw.id);
  if (!table) {
    if (oldIndex >= 0) state.records.splice(oldIndex, 1);
    return;
  }
  const match = findBestLMatch(actualDraw.number, table);
  const item = match?.item || null;

  // V4.16: History L stores matched patterns only.
  // Remove an older auto-generated Not Found record when the result no longer matches.
  if (!item || match.status === "notfound") {
    if (oldIndex >= 0) state.records.splice(oldIndex, 1);
    return;
  }

  const record = {
    id: oldIndex >= 0 ? state.records[oldIndex].id : uid(),
    autoGenerated: true,
    sourceActualDrawId: actualDraw.id,
    sourceDailyTableId: table.id,
    profileId,
    profileName: actualDraw.profileName || state.profiles[profileId] || table.profileName || `Profile ${profileId + 1}`,
    date: actualDraw.date,
    actualResult: String(actualDraw.number || ""),
    selectedNumber: item?.number || "",
    status: match.status,
    patternId: item?.patternId || "",
    patternName: item?.patternName || "",
    cells: item?.cells || [],
    block: item?.block || "",
    inputNumber: table.inputNumber || "",
    grid: Array.isArray(table.grid) ? table.grid.map(row => [...row]) : [],
    note: actualDraw.note || "",
    createdAt: oldIndex >= 0 ? state.records[oldIndex].createdAt : Date.now(),
    updatedAt: Date.now()
  };
  if (oldIndex >= 0) state.records[oldIndex] = record;
  else state.records.push(record);
}

function syncAutoLHistoryForDate(profileId, resultDate) {
  state.actualDraws
    .filter(x => Number(x.profileId ?? 0) === Number(profileId) && x.date === resultDate)
    .forEach(syncAutoLHistoryForActual);
}

function tableStatusLabel(status) {
  return ({pending:"Pending", exact:"Exact", swap:"เลขกลับ", notfound:"Not Found"})[status] || status;
}
function saveDailyTableForm() {
  if (!state.grid) return alert("กรุณาคำนวณตารางก่อนSave");
  const profileName = state.profiles[state.activeProfile] || `Profile ${state.activeProfile + 1}`;
  showModal(`<div class="modal-head"><div><h2>Saveตาราง 15 ช่อง</h2><p>${escapeHtml(profileName)}</p></div><button class="icon-btn" data-close>×</button></div>
    ${gridHtml(state.grid)}
    <label class="form-label">Dateของตาราง<input id="dailyTableDate" type="date" value="${escapeHtml(state.calculationDate || isoDate())}"></label>
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
    syncAutoLHistoryForProfile(state.activeProfile);
    saveState(); closeModal(); state.currentView="history"; render();
  });
}
function openDailyTableDetail(id) {
  const t = state.dailyTables.find(x => x.id === id); if (!t) return;
  const targetDate = shiftIsoDate(t.date, 1);
  const actual = state.actualDraws.find(x => Number(x.profileId) === Number(t.profileId) && x.date === targetDate);
  const result = compareActualWithTable(actual?.number, t);
  showModal(`<div class="modal-head"><div><h2>ตาราง 15 ช่องย้อนหลัง</h2><p>${escapeHtml(state.profiles[t.profileId] || t.profileName)}</p></div><button class="icon-btn" data-close>×</button></div>
    ${gridHtml(t.grid || [])}
    <label class="form-label">แก้ไขวันที่ของตาราง<input id="editDailyTableDate" type="date" value="${escapeHtml(t.date || isoDate())}"></label>
    <button id="saveDailyTableDate" class="btn primary full">Save วันที่ใหม่</button>
    <div class="detail-card"><div><span>วันที่ตาราง</span><b>${formatDateTH(t.date)}</b></div><div><span>วันที่ผลเป้าหมาย</span><b>${formatDateTH(targetDate)}</b></div><div><span>เลขตั้งต้น</span><b>${escapeHtml(t.inputNumber || "-")}</b></div><div><span>เลขจริงวันถัดไป</span><b>${escapeHtml(actual?.number || "ยังไม่กรอก")}</b></div><div><span>ผลเปรียบเทียบ</span><b>${tableStatusLabel(result.status)}</b></div><div><span>ชุดที่Exact</span><b>${escapeHtml(result.matched || "-")}</b></div><div><span>เลข L ทั้งหมด</span><b>${(t.lResults || []).length} ชุด</b></div></div>
    <button id="deleteDailyTable" class="btn danger full">Deleteตารางนี้</button>`);
  document.getElementById("saveDailyTableDate").addEventListener("click", () => {
    const newDate = document.getElementById("editDailyTableDate").value;
    if (!newDate) return alert("กรุณาเลือกวันที่ใหม่");
    if (newDate === t.date) return alert("วันที่ยังเหมือนเดิม");
    const duplicate = state.dailyTables.find(x => x.id !== id && Number(x.profileId) === Number(t.profileId) && x.date === newDate);
    if (duplicate) return alert("Profile นี้มีตารางในวันที่เลือกอยู่แล้ว กรุณาเลือกวันอื่น");
    const oldDate = t.date;
    t.date = newDate;
    t.updatedAt = Date.now();
    state.records = state.records.filter(r => !(r.autoGenerated === true && r.sourceDailyTableId === t.id));
    syncAutoLHistoryForProfile(t.profileId);
    saveState();
    closeModal();
    render();
  });
  document.getElementById("deleteDailyTable").addEventListener("click", () => {
    if (!confirm("ConfirmDeleteตาราง 15 ช่องนี้?")) return;
    state.dailyTables = state.dailyTables.filter(x => x.id !== id);
    state.records = state.records.filter(r => !(r.autoGenerated === true && r.sourceDailyTableId === id));
    syncAutoLHistoryForProfile(t.profileId);
    saveState(); closeModal(); render();
  });
}

function renderHistory() {
  const selectedProfile = Number(state.activeProfile);
  const selectedName = state.profiles[selectedProfile] || `Profile ${selectedProfile + 1}`;
  const selectedActualDraws = state.actualDraws.filter(r => Number(r.profileId ?? 0) === selectedProfile);
  const selectedRecords = state.records
    .filter(r => Number(r.profileId) === selectedProfile && r.status !== "notfound")
    .sort((a,b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0));
  const activeTab = state.historyTab === "l" ? "l" : "results";

  const resultRows = [...selectedActualDraws]
    .sort((a,b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0))
    .map(r => {
      const table = getPredictionTable(selectedProfile, r.date, r);
      const linkedRecord = state.records.find(x => x.autoGenerated === true && x.sourceActualDrawId === r.id);
      const status = linkedRecord?.status || (table ? "notfound" : "pending");
      const day = DAYS_TH[new Date(`${r.date}T12:00:00`).getDay()];
      return `<button class="result-history-row" data-actual-draw="${r.id}">
        <span class="result-date"><b>${formatDateTH(r.date)}</b><small>${day}</small></span>
        <strong>${escapeHtml(r.number || "---")}</strong>
        <strong>${escapeHtml(r.twoDigit || "--")}</strong>
        <span class="result-day">${day.slice(0,3)}</span>
        <span class="status ${status}">${status === "pending" ? "No table" : tableStatusLabel(status)}</span>
      </button>`;
    }).join("");

  const lRows = selectedRecords.map(r => `<article class="history-item" data-record="${r.id}">
    <div><small>${formatDateTH(r.date)} • ${DAYS_TH[new Date(`${r.date}T12:00:00`).getDay()]}${r.autoGenerated ? " • Auto Match" : ""}</small>
    <h3>${escapeHtml(r.selectedNumber || "-")} → ${escapeHtml(r.actualResult || "-")}</h3>
    <p>${escapeHtml(r.patternId || "-")} • ${escapeHtml(r.patternName || "-")} • Actual ${escapeHtml(r.actualResult || "-")}</p></div>
    <span class="status ${r.status}">${statusLabel(r.status)}</span>
  </article>`).join("");

  return `<section class="card history-hub">
    <div class="section-head"><h2>History</h2><span>${activeTab === "results" ? selectedActualDraws.length : selectedRecords.length} รายการ</span></div>
    ${profileTabs()}
    <div class="history-mode-tabs">
      <button class="history-mode-btn ${activeTab === "results" ? "active" : ""}" data-history-tab="results">ผลย้อนหลัง</button>
      <button class="history-mode-btn ${activeTab === "l" ? "active" : ""}" data-history-tab="l">History L</button>
    </div>
    ${activeTab === "results" ? `
      <div class="profile-filter-summary"><b style="color:${profileColor(selectedProfile)}">${escapeHtml(selectedName)}</b><span>เก็บผลทุกงวด</span></div>
      <button id="btnAddActualDraw" class="btn primary full actual-add-button" style="--profile-color:${profileColor(selectedProfile)}">＋ บันทึกผล 3 ตัว / 2 ตัว</button>
      <div class="result-history-table">
        <div class="result-history-head"><span>วันที่</span><span>3 ตัว</span><span>2 ตัว</span><span>วัน</span><span>ผล L</span></div>
        ${resultRows || `<div class="empty-card flat visible-empty">ยังไม่มีผลย้อนหลังของ ${escapeHtml(selectedName)}</div>`}
      </div>` : `
      <div class="profile-filter-summary"><b style="color:${profileColor(selectedProfile)}">${escapeHtml(selectedName)}</b><span>แสดงเฉพาะรายการ Match</span></div>
      <div class="history-list">${lRows || `<div class="empty-card flat visible-empty">ยังไม่มีรายการที่ Match กับเลข L</div>`}</div>`}
  </section>`;
}
function getRankingConfig() {
  const d = DEFAULT_STATE.rankingConfig;
  const c = state.rankingConfig || {};
  const num = (v, fallback) => Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : fallback;
  return {
    exactPoints: num(c.exactPoints, d.exactPoints),
    reversedPoints: num(c.reversedPoints, d.reversedPoints),
    weight10: num(c.weight10, d.weight10),
    weight30: num(c.weight30, d.weight30),
    weightAll: num(c.weightAll, d.weightAll)
  };
}

function getProfileAnalysisScore(profileId) {
  const config = getRankingConfig();
  const linkedDraws = state.actualDraws
    .filter(d => Number(d.profileId ?? 0) === profileId && getPredictionTable(profileId, d.date))
    .sort((a,b) => b.date.localeCompare(a.date));
  const records = state.records.filter(r => Number(r.profileId) === profileId && r.status !== "notfound");
  const scoreWindow = (limit) => {
    const sample = limit ? linkedDraws.slice(0, limit) : linkedDraws;
    if (!sample.length) return 0;
    const ids = new Set(sample.map(x => x.id));
    let points = 0;
    records.forEach(r => {
      if (!ids.has(r.sourceActualDrawId)) return;
      if (r.status === "exact") points += config.exactPoints;
      else if (r.status === "swap") points += config.reversedPoints;
    });
    return (points / sample.length) * 100;
  };
  const score10 = scoreWindow(10);
  const score30 = scoreWindow(30);
  const scoreAll = scoreWindow(0);
  const weightTotal = config.weight10 + config.weight30 + config.weightAll || 100;
  const weighted = ((score10 * config.weight10) + (score30 * config.weight30) + (scoreAll * config.weightAll)) / weightTotal;
  return {
    profileId,
    name: state.profiles[profileId] || `Profile ${profileId + 1}`,
    score: Math.round(weighted),
    score10: Math.round(score10),
    score30: Math.round(score30),
    scoreAll: Math.round(scoreAll),
    samples: linkedDraws.length
  };
}

function renderProfileRanking() {
  const config = getRankingConfig();
  const mode = state.analysisSortMode === "manual" ? "manual" : "score";
  let ranking = state.profiles.map((_, i) => getProfileAnalysisScore(i));
  if (mode === "score") ranking.sort((a,b) => b.score - a.score || b.samples - a.samples || a.profileId - b.profileId);
  return `<div class="analysis-ranking">
    <div class="analysis-ranking-head"><h3>อันดับ Profile แบบ Real-time</h3>
      <div class="analysis-sort-toggle">
        <button type="button" class="${mode === "manual" ? "active" : ""}" data-analysis-sort="manual">ตามที่จัดเอง</button>
        <button type="button" class="${mode === "score" ? "active" : ""}" data-analysis-sort="score">ตามคะแนนล่าสุด</button>
      </div>
    </div>
    <div class="profile-ranking-list">${ranking.map((item,index)=>`
      <button type="button" class="profile-ranking-row ${item.profileId === Number(state.activeProfile) ? "active" : ""}" data-ranking-profile="${item.profileId}" style="--profile-color:${profileColor(item.profileId)}">
        <span class="rank-number">${mode === "score" ? index + 1 : item.profileId + 1}</span>
        <span class="rank-profile"><b>${escapeHtml(item.name)}</b><small>${item.samples ? `${item.samples} งวด • 10 งวด ${item.score10}% • 30 งวด ${item.score30}%` : "ข้อมูลยังไม่เพียงพอ"}</small></span>
        <span class="rank-score"><strong>${item.score}%</strong><small>คะแนนสถิติ</small></span>
      </button>`).join("")}</div>
    <p class="analysis-ranking-note">คำนวณอัตโนมัติจาก Exact = ${config.exactPoints} คะแนน, Reversed = ${config.reversedPoints} คะแนน โดยให้น้ำหนัก 10 งวดล่าสุด ${config.weight10}%, 30 งวดล่าสุด ${config.weight30}% และข้อมูลทั้งหมด ${config.weightAll}% การจัดอันดับเป็นข้อมูลสถิติ ไม่ใช่การรับประกันผล</p>
  </div>`;
}

function renderAnalysis() {
  const profileId = Number(state.activeProfile);
  const draws = state.actualDraws.filter(r => Number(r.profileId ?? 0) === profileId);
  const linkedDraws = draws.filter(d => getPredictionTable(profileId, d.date));
  const records = state.records.filter(r => Number(r.profileId) === profileId && r.status !== "notfound");
  const exact = records.filter(r => r.status === "exact").length;
  const swap = records.filter(r => r.status === "swap").length;
  const misses = Math.max(0, linkedDraws.length - records.length);
  const foundRate = linkedDraws.length ? Math.round(records.length * 100 / linkedDraws.length) : 0;
  const exactRate = linkedDraws.length ? Math.round(exact * 100 / linkedDraws.length) : 0;

  const patternRows = L_PATTERNS.map(pattern => {
    const matched = records.filter(r => r.patternId === pattern.id);
    const exactCount = matched.filter(r => r.status === "exact").length;
    const reverseCount = matched.filter(r => r.status === "swap").length;
    const rate = linkedDraws.length ? Math.round(matched.length * 100 / linkedDraws.length) : 0;
    return { ...pattern, matched: matched.length, exactCount, reverseCount, rate };
  }).sort((a,b) => b.rate - a.rate || b.exactCount - a.exactCount || a.id.localeCompare(b.id));

  const recentRates = [30, 50, 100].map(limit => {
    const recentDraws = [...linkedDraws].sort((a,b)=>b.date.localeCompare(a.date)).slice(0, limit);
    const ids = new Set(recentDraws.map(x=>x.id));
    const hit = records.filter(r => ids.has(r.sourceActualDrawId)).length;
    return { limit, total: recentDraws.length, rate: recentDraws.length ? Math.round(hit * 100 / recentDraws.length) : 0 };
  });

  return `<section class="card">
    <div class="section-head"><h2>Analysis</h2><span>มีผลจริง ${draws.length} งวด</span></div>${profileTabs()}
    ${renderProfileRanking()}
    <div class="analysis-source-note">ผลจริงแต่ละวันเทียบกับตารางของวันก่อนหน้า และนับ History L เฉพาะรายการที่ Match</div>
    <div class="stats-grid"><div><b>${exact}</b><span>Exact</span></div><div><b>${swap}</b><span>Reversed</span></div><div><b>${misses}</b><span>ไม่พบ</span></div></div>
    ${progressCard("อัตราพบเลข L", foundRate)}
    ${progressCard("อัตราตรงตามลำดับ", exactRate)}
    <h3 class="subhead">แนวโน้มย้อนหลัง</h3>
    <div class="trend-grid">${recentRates.map(x=>`<div><b>${x.rate}%</b><span>${x.total ? `${x.total} งวดล่าสุด` : `ยังไม่มีข้อมูล`}</span><small>เป้าหมาย ${x.limit} งวด</small></div>`).join("")}</div>
    <h3 class="subhead">ความแม่นของ Pattern L01–L08</h3>
    <div class="pattern-accuracy-list">${patternRows.map((p,i)=>`<div class="pattern-accuracy-row"><div><b>${i+1}. ${p.id}</b><small>${escapeHtml(p.name)}</small></div><div><strong>${p.rate}%</strong><small>Match ${p.matched} • Exact ${p.exactCount} • Reverse ${p.reverseCount}</small></div></div>`).join("")}</div>
    <div class="notice ${linkedDraws.length >= 20 ? "success-note" : ""}">${linkedDraws.length >= 20 ? `มีข้อมูลพร้อมวิเคราะห์ ${linkedDraws.length} งวด` : `ควรเก็บตารางและผลจริงเพิ่มอีก ${Math.max(0,20-linkedDraws.length)} งวด เพื่อให้สถิติน่าเชื่อถือขึ้น`}</div>
    <p class="disclaimer">สถิตินี้ใช้ช่วยคัดเลือก Pattern ไม่ใช่การรับประกันผล</p>
  </section>`;
}
function progressCard(label, value) {
  return `<div class="progress-card"><div><span>${label}</span><b>${value}%</b></div><div class="progress"><i style="width:${value}%"></i></div></div>`;
}

function renderSettings() {
  return `<section class="card"><div class="section-head"><h2>SettingsรายProfile</h2><span>ปัจจุบัน ${state.profiles.length} Profile</span></div>
    <p class="profile-gesture-help">กดค้างที่ ☰ แล้วลากขึ้นลงเพื่อสลับลำดับ • ปัดซ้ายเพื่อลบ</p>
    <div class="settings-list profile-sort-list">${state.profiles.map((name,i)=>`
      <div class="profile-swipe-row" data-profile-row="${i}">
        <div class="profile-delete-action"><button type="button" data-delete-profile="${i}">ลบ</button></div>
        <div class="profile-row-content" data-row-content="${i}">
          <input class="name-input profile-name-clean" data-name-index="${i}" value="${escapeHtml(name)}" maxlength="30" aria-label="ชื่อ ${escapeHtml(name)}">
          <button type="button" class="profile-drag-handle" data-drag-handle="${i}" aria-label="กดค้างเพื่อลาก ${escapeHtml(name)}">☰</button>
        </div>
      </div>`).join("")}</div>
    <button id="btnAddProfile" class="btn secondary full">＋ เพิ่มProfileใหม่</button>
    <button id="btnSaveNames" class="btn primary full">SaveProfile</button>
    ${(()=>{const c=getRankingConfig();const total=c.weight10+c.weight30+c.weightAll;return `
    <div class="ranking-settings-card">
      <div class="ranking-settings-head"><div><h3>ตั้งค่าคะแนนความน่าจะเป็น</h3><p>ใช้จัดอันดับ Profile ในหน้า Analysis</p></div><span id="rankingWeightTotal" class="${Math.abs(total-100)<0.001?'valid':'invalid'}">รวม ${total}%</span></div>
      <div class="ranking-settings-grid">
        <label><span>Exact Match</span><input id="rankExactPoints" type="number" inputmode="decimal" min="0" step="0.1" value="${c.exactPoints}"></label>
        <label><span>Reversed Match</span><input id="rankReversePoints" type="number" inputmode="decimal" min="0" step="0.1" value="${c.reversedPoints}"></label>
        <label><span>10 งวดล่าสุด</span><div class="percent-input"><input id="rankWeight10" type="number" inputmode="decimal" min="0" step="1" value="${c.weight10}"><b>%</b></div></label>
        <label><span>30 งวดล่าสุด</span><div class="percent-input"><input id="rankWeight30" type="number" inputmode="decimal" min="0" step="1" value="${c.weight30}"><b>%</b></div></label>
        <label class="full-row"><span>ข้อมูลทั้งหมด</span><div class="percent-input"><input id="rankWeightAll" type="number" inputmode="decimal" min="0" step="1" value="${c.weightAll}"><b>%</b></div></label>
      </div>
      <div id="rankingConfigMessage" class="ranking-config-message">น้ำหนักรวมต้องเท่ากับ 100%</div>
      <div class="ranking-settings-actions"><button id="btnResetRankingConfig" type="button" class="btn secondary">คืนค่าเริ่มต้น</button><button id="btnSaveRankingConfig" type="button" class="btn primary">บันทึกสูตร</button></div>
    </div>`})()}
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
    document.querySelectorAll("[data-history-tab]").forEach(btn => btn.addEventListener("click", () => { state.historyTab = btn.dataset.historyTab; saveState(); render(); }));
    document.getElementById("btnAddActualDraw")?.addEventListener("click", () => openActualDrawForm());
    document.querySelectorAll("[data-actual-draw]").forEach(el => el.addEventListener("click", () => openActualDrawDetail(el.dataset.actualDraw)));
    document.querySelectorAll("[data-daily-table]").forEach(el => el.addEventListener("click", () => openDailyTableDetail(el.dataset.dailyTable)));
  }
  if (state.currentView === "analysis") {
    document.querySelectorAll("[data-analysis-sort]").forEach(btn => btn.addEventListener("click", () => {
      state.analysisSortMode = btn.dataset.analysisSort === "manual" ? "manual" : "score";
      saveState(); render();
    }));
    document.querySelectorAll("[data-ranking-profile]").forEach(btn => btn.addEventListener("click", () => {
      state.activeProfile = Number(btn.dataset.rankingProfile); saveState(); render();
    }));
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

  document.getElementById("btnLoadLastResult")?.addEventListener("click", () => {
    const latestDraw = getLatestCompleteActualDraw();
    if (!latestDraw) return alert("ยังไม่มีผลย้อนหลังที่มีเลข 3 ตัวและ 2 ตัวครบสำหรับชื่อนี้");
    loadActualDrawIntoCalculator(latestDraw);
  });

  document.getElementById("btnBrowseResultCalendar")?.addEventListener("click", () => {
    const latestDraw = getLatestCompleteActualDraw();
    if (!latestDraw) return alert("ยังไม่มีผลย้อนหลังที่มีเลข 3 ตัวและ 2 ตัวครบสำหรับชื่อนี้");
    openResultCalendar(latestDraw.date);
  });

  document.getElementById("btnCalc")?.addEventListener("click", () => {
    const grid = calculateGrid();
    if (!grid) return alert("Please enter all 5 digits");
    state.grid = grid; saveState(); render();
  });
  document.getElementById("btnClear")?.addEventListener("click", () => {
    state.lastInput = ["","","","",""]; state.grid = null; state.selectedL = null; state.calculationDate = null; saveState(); render();
  });
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
  if (!item || status === "notfound") {
    return alert("History L บันทึกเฉพาะรายการที่ Match เท่านั้น");
  }
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
    <div class="hero-number">${r.status === "notfound" ? escapeHtml(r.actualResult) : `${escapeHtml(r.selectedNumber || "-")} → ${escapeHtml(r.actualResult)}`}</div>
    ${r.grid ? gridHtml(r.grid, r.cells || []) : ""}
    <div class="detail-card"><div><span>สถานะ</span><b>${statusLabel(r.status)}</b></div><div><span>ชุดที่เลือก</span><b>${escapeHtml(r.selectedNumber || "-")}</b></div><div><span>Pattern</span><b>${escapeHtml(r.patternId || "-")} ${escapeHtml(r.patternName || "")}</b></div><div><span>Position</span><b>${escapeHtml(r.block || "-")}</b></div><div><span>เลขตั้งต้น</span><b>${escapeHtml(r.inputNumber || "-")}</b></div></div>
    <button id="deleteRecord" class="btn danger full">DeleteSaveนี้</button>`);
  document.getElementById("deleteRecord").addEventListener("click", () => {
    if (!confirm("ConfirmDeleteSaveนี้?")) return;
    state.records = state.records.filter(x=>x.id!==id); saveState(); closeModal(); render();
  });
}

function bindOneTapDatePicker(input) {
  if (!(input instanceof HTMLInputElement) || input.type !== "date") return;

  // iOS Safari may use the first tap only to focus a date field inside a
  // scrollable modal. Opening the native picker from the same user gesture
  // makes the whole field respond on the first tap.
  const openPicker = () => {
    input.focus({ preventScroll: true });
    if (typeof input.showPicker === "function") {
      try { input.showPicker(); } catch (_) { /* Native fallback remains available. */ }
    }
  };

  input.addEventListener("pointerup", event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.stopPropagation();
    openPicker();
  });

  input.addEventListener("click", event => {
    event.stopPropagation();
    openPicker();
  });
}

function openActualDrawForm(existingId = null) {
  const existing = existingId ? state.actualDraws.find(x => x.id === existingId) : null;
  const isEdit = Boolean(existing);
  const availableProfiles = [...state.profiles];
  if (!availableProfiles.length) availableProfiles.push("Profile 1");
  const selectedProfileId = Number.isInteger(existing?.profileId)
    ? Math.min(existing.profileId, availableProfiles.length - 1)
    : Math.min(state.activeProfile, availableProfiles.length - 1);
  const profileOptions = availableProfiles.map((name, idx) => `<option value="${idx}" ${idx === selectedProfileId ? "selected" : ""}>${escapeHtml(name)}</option>`).join("");

  showModal(`
    <div class="modal-head"><div><h2>${isEdit ? "Edit" : "Save"}เลขออกจริง 3 หลัก</h2><p>${isEdit ? "แก้ไขข้อมูลและตารางอ้างอิงได้ที่หน้านี้" : "บันทึกผลจริงได้ทันที ระบบจะตรวจตารางอ้างอิงให้อัตโนมัติ"}</p></div><button class="icon-btn" data-close>×</button></div>
    <label class="form-label">Profile<select id="actualDrawProfile" class="name-select">${profileOptions}</select></label>
    <label class="form-label">Dateออก<input id="actualDrawDate" type="date" value="${existing?.date || isoDate()}"></label>
    <div id="referenceTableBox"></div>
    <label class="form-label">เลขออกจริง 3 หลัก<input id="actualDrawNumber" class="result-input actual-three-input" type="text" readonly maxlength="3" data-numeric-keypad="true" value="${escapeHtml(existing?.number || "")}"></label>
    <label class="form-label">เลขออกจริง 2 ตัว<input id="actualDrawTwoDigit" class="result-input actual-two-input" type="text" readonly maxlength="2" data-numeric-keypad="true" value="${escapeHtml(existing?.twoDigit || "")}"></label>
    <label class="form-label">Note (ไม่บังคับ)<textarea id="actualDrawNote" rows="3" placeholder="เช่น งวดเช้า หรือรายละเอียดเพิ่มเติม">${escapeHtml(existing?.note || "")}</textarea></label>
    <button id="btnSaveActualDraw" class="btn primary full">Saveเลขออกจริง</button>
  `);

  const input = document.getElementById("actualDrawNumber");
  const twoDigitInput = document.getElementById("actualDrawTwoDigit");
  const profileEl = document.getElementById("actualDrawProfile");
  const dateEl = document.getElementById("actualDrawDate");
  bindOneTapDatePicker(dateEl);
  const box = document.getElementById("referenceTableBox");
  const saveBtn = document.getElementById("btnSaveActualDraw");

  function renderReferenceSection() {
    const profileId = Number(profileEl.value);
    const date = dateEl.value;
    const expectedDate = getExpectedReferenceDate(date);
    const autoTable = getDailyTable(profileId, expectedDate);

    // หน้าเพิ่มผลจริงต้องเรียบง่าย: แสดงสถานะสั้น ๆ เท่านั้น
    if (!isEdit) {
      box.dataset.selectedId = "";
      box.innerHTML = `<div class="reference-summary ${autoTable ? "ready" : "missing"}">
        <span>ใช้ตารางวันที่ <b>${expectedDate ? formatDateTH(expectedDate) : "-"}</b></span>
        <strong>${autoTable ? "ตารางพร้อม" : "ยังไม่บันทึกตาราง"}</strong>
      </div>`;
      return;
    }

    // ตัวเลือกตารางอ้างอิงอยู่เฉพาะหน้า Edit
    const tables = state.dailyTables
      .filter(t => Number(t.profileId) === profileId && String(t.date || "") < String(date || ""))
      .sort((a,b) => b.date.localeCompare(a.date));
    const selectedId = box.dataset.selectedId ?? (existing?.referenceTableId || "");
    const manual = Boolean(selectedId);
    const selectedTable = manual ? tables.find(t => t.id === selectedId) : autoTable;
    const options = tables.map(t => `<option value="${t.id}" ${t.id === selectedId ? "selected" : ""}>${formatDateTH(t.date)} • ${escapeHtml(t.inputNumber || "-")}</option>`).join("");

    box.innerHTML = `<div class="reference-card ${selectedTable ? "ready" : "missing"}">
      <div class="reference-title"><b>ตารางที่ใช้อ้างอิง</b><span>${selectedTable ? "ตารางพร้อม" : "ยังไม่บันทึกตาราง"}</span></div>
      <p>อัตโนมัติต้องใช้วันที่ <b>${expectedDate ? formatDateTH(expectedDate) : "-"}</b></p>
      <label class="reference-choice"><input type="radio" name="referenceMode" value="auto" ${!manual ? "checked" : ""}> อัตโนมัติ — วันทำการก่อนหน้า</label>
      <label class="reference-choice"><input type="radio" name="referenceMode" value="manual" ${manual ? "checked" : ""} ${tables.length ? "" : "disabled"}> เลือกตารางเอง</label>
      <select id="manualReferenceTable" class="name-select" ${manual ? "" : "disabled"}>${options || '<option value="">ยังไม่มีตารางที่เลือกได้</option>'}</select>
      ${selectedTable ? `<div class="reference-preview">กำลังใช้ตารางวันที่ <b>${formatDateTH(selectedTable.date)}</b>${manual ? " • เลือกเอง" : " • อัตโนมัติ"}</div>` : `<div class="reference-warning">ยังไม่มีตารางอ้างอิง สามารถบันทึกผลจริงไว้ก่อน แล้วกลับมาเลือกตารางใน Edit ภายหลังได้</div>`}
    </div>`;

    box.querySelectorAll('input[name="referenceMode"]').forEach(radio => radio.addEventListener("change", e => {
      box.dataset.selectedId = e.target.value === "auto" ? "" : (tables[0]?.id || "");
      renderReferenceSection();
    }));
    document.getElementById("manualReferenceTable")?.addEventListener("change", e => {
      box.dataset.selectedId = e.target.value;
      renderReferenceSection();
    });
  }

  box.dataset.selectedId = existing?.referenceTableId || "";
  profileEl.addEventListener("change", () => { box.dataset.selectedId = ""; renderReferenceSection(); });
  dateEl.addEventListener("change", () => { box.dataset.selectedId = ""; renderReferenceSection(); });
  renderReferenceSection();

  input.addEventListener("input", e => e.target.value = e.target.value.replace(/\D/g, "").slice(0,3));
  twoDigitInput.addEventListener("input", e => e.target.value = e.target.value.replace(/\D/g, "").slice(0,2));
  saveBtn.addEventListener("click", () => {
    const profileId = Number(profileEl.value);
    const profileName = availableProfiles[profileId] || `Profile ${profileId + 1}`;
    const date = dateEl.value;
    const number = input.value;
    const twoDigit = twoDigitInput.value;
    const note = document.getElementById("actualDrawNote").value.trim();
    const referenceTableId = isEdit ? (box.dataset.selectedId || "") : "";
    const table = referenceTableId
      ? state.dailyTables.find(t => t.id === referenceTableId && Number(t.profileId) === profileId)
      : getDailyTable(profileId, getExpectedReferenceDate(date));

    if (!date || !/^\d{3}$/.test(number)) return alert("กรุณาเลือก Profile กรอกวันที่ และเลข 3 ตัวให้ครบ");
    if (!/^\d{2}$/.test(twoDigit)) return alert("กรุณากรอกเลขออกจริง 2 ตัวให้ครบ เพื่อสร้างตารางงวดถัดไปอัตโนมัติ");

    const duplicate = state.actualDraws.find(x => x.date === date && Number(x.profileId ?? 0) === profileId && x.id !== existingId);
    if (duplicate && !confirm(`${profileName} มีเลขออกจริงในวันนี้แล้ว ต้องการSaveเพิ่มอีกหนึ่งรายการหรือไม่?`)) return;

    const oldTable = existing ? getPredictionTable(existing.profileId, existing.date, existing) : null;
    if (existing && oldTable?.id !== table?.id) {
      const message = table
        ? `เปลี่ยนตารางอ้างอิงเป็น ${formatDateTH(table.date)} ผล L จะถูกคำนวณใหม่ ต้องการดำเนินการต่อหรือไม่?`
        : "ตารางอ้างอิงยังไม่มี ผลจริงจะถูกบันทึกไว้ก่อนและยังไม่คำนวณ L ต้องการดำเนินการต่อหรือไม่?";
      if (!confirm(message)) return;
    }

    let savedActual;
    if (existing) {
      existing.profileId = profileId;
      existing.profileName = profileName;
      existing.date = date;
      existing.number = number;
      existing.twoDigit = twoDigit;
      existing.note = note;
      existing.referenceTableId = referenceTableId;
      existing.updatedAt = Date.now();
      savedActual = existing;
    } else {
      savedActual = { id: uid(), profileId, profileName, date, number, twoDigit, note, referenceTableId:"", createdAt: Date.now() };
      state.actualDraws.push(savedActual);
    }

    const autoTable = upsertDailyTableFromActual(savedActual);
    syncAutoLHistoryForActual(savedActual);
    // กรณีมีผลวันถัดไปถูกบันทึกไว้ก่อนแล้ว ให้คำนวณใหม่ทันทีหลังตารางวันนี้พร้อม
    syncAutoLHistoryForProfile(profileId);
    saveState();
    closeModal();
    state.currentView = "history";
    render();
    showToast(autoTable ? "✓ บันทึกผลแล้ว • History Updated • Next Table Ready" : "✓ บันทึกผลแล้ว");
  });
}

function openActualDrawDetail(id) {
  const r = state.actualDraws.find(x => x.id === id); if (!r) return;
  const profileName = r.profileName || state.profiles[r.profileId] || state.profiles[0] || "Profile 1";
  showModal(`<div class="modal-head"><div><h2>เลขออกจริง 3 หลัก</h2><p>${formatDateTH(r.date)} • ${DAYS_TH[new Date(`${r.date}T12:00:00`).getDay()]}</p></div><button class="icon-btn" data-close>×</button></div>
    <div class="actual-result-pair"><div><small>3 ตัว</small><strong>${escapeHtml(r.number)}</strong></div><div><small>2 ตัว</small><strong>${escapeHtml(r.twoDigit || "--")}</strong></div></div>
    ${(()=>{const t=getPredictionTable(r.profileId,r.date,r);const cmp=compareActualWithTable(r.number,t);const expected=getExpectedReferenceDate(r.date);return t?`${gridHtml(t.grid||[])}<div class="detail-card"><div><span>Profile</span><b>${escapeHtml(profileName)}</b></div><div><span>วันที่ผลจริง</span><b>${formatDateTH(r.date)}</b></div><div><span>ใช้ตารางวันที่</span><b>${formatDateTH(t.date)}${r.referenceTableId ? " (เลือกเอง)" : " (อัตโนมัติ)"}</b></div><div><span>ผลเทียบตาราง</span><b>${tableStatusLabel(cmp.status)}</b></div><div><span>ชุดที่Exact</span><b>${escapeHtml(cmp.matched||"-")}</b></div><div><span>Note</span><b>${escapeHtml(r.note || "-")}</b></div></div>`:`<div class="detail-card"><div><span>Profile</span><b>${escapeHtml(profileName)}</b></div><div><span>วันที่ผลจริง</span><b>${formatDateTH(r.date)}</b></div><div><span>ต้องใช้ตารางวันที่</span><b>${formatDateTH(expected)}</b></div><div><span>สถานะตาราง</span><b>ยังไม่บันทึกตาราง</b></div><div><span>สถานะ</span><b>ยังไม่คำนวณ L</b></div><div><span>Note</span><b>${escapeHtml(r.note || "-")}</b></div></div>`})()}
    <button id="editActualDraw" class="btn secondary full">Editข้อมูล</button>
    <button id="deleteActualDraw" class="btn danger full">Deleteเลขออกจริงนี้</button>`);
  document.getElementById("editActualDraw").addEventListener("click", () => openActualDrawForm(id));
  document.getElementById("deleteActualDraw").addEventListener("click", () => {
    if (!confirm("ConfirmDeleteเลขออกจริง 3 หลักนี้?")) return;
    state.actualDraws = state.actualDraws.filter(x => x.id !== id);
    state.records = state.records.filter(x => !(x.autoGenerated === true && x.sourceActualDrawId === id));
    saveState(); closeModal(); render();
  });
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  saveState();
  render();
}

function saveVisibleProfileNames() {
  const inputs = [...document.querySelectorAll(".name-input")];
  inputs.forEach(input => {
    const index = Number(input.dataset.nameIndex);
    if (Number.isInteger(index) && state.profiles[index] !== undefined) {
      state.profiles[index] = input.value.trim() || `Profile ${index + 1}`;
    }
  });
}

function remapProfileIds(indexMap) {
  [state.records, state.actualDraws, state.dailyTables].forEach(collection => {
    (collection || []).forEach(item => {
      const oldId = Number(item.profileId);
      if (indexMap.has(oldId)) item.profileId = indexMap.get(oldId);
      if (state.profiles[item.profileId]) item.profileName = state.profiles[item.profileId];
    });
  });
}

function moveProfile(fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= state.profiles.length || toIndex >= state.profiles.length) return;
  saveVisibleProfileNames();
  const oldOrder = state.profiles.map((_, index) => index);
  const [movedOldIndex] = oldOrder.splice(fromIndex, 1);
  oldOrder.splice(toIndex, 0, movedOldIndex);
  const oldProfiles = [...state.profiles];
  state.profiles = oldOrder.map(oldIndex => oldProfiles[oldIndex]);
  const indexMap = new Map(oldOrder.map((oldIndex, newIndex) => [oldIndex, newIndex]));
  remapProfileIds(indexMap);
  state.activeProfile = indexMap.get(Number(state.activeProfile)) ?? 0;
  saveState();
  render();
}

function deleteProfile(index) {
  if (state.profiles.length <= 1) {
    alert("ต้องเหลืออย่างน้อย 1 Profile");
    return;
  }
  saveVisibleProfileNames();
  const name = state.profiles[index] || `Profile ${index + 1}`;
  if (!confirm(`ลบ Profile “${name}” พร้อมตารางและHistoryทั้งหมดหรือไม่?`)) return;

  const oldCount = state.profiles.length;
  state.profiles.splice(index, 1);
  state.records = (state.records || []).filter(item => Number(item.profileId) !== index);
  state.actualDraws = (state.actualDraws || []).filter(item => Number(item.profileId) !== index);
  state.dailyTables = (state.dailyTables || []).filter(item => Number(item.profileId) !== index);
  const indexMap = new Map();
  for (let oldIndex = 0; oldIndex < oldCount; oldIndex++) {
    if (oldIndex !== index) indexMap.set(oldIndex, oldIndex > index ? oldIndex - 1 : oldIndex);
  }
  remapProfileIds(indexMap);
  const active = Number(state.activeProfile) || 0;
  state.activeProfile = active === index ? Math.min(index, state.profiles.length - 1) : (active > index ? active - 1 : active);
  saveState();
  render();
}

function bindProfileGestures() {
  const rows = [...document.querySelectorAll("[data-profile-row]")];
  let openRow = null;
  const closeRows = except => rows.forEach(row => {
    if (row !== except) {
      row.classList.remove("swiped-open");
      const content = row.querySelector(".profile-row-content");
      if (content) content.style.transform = "";
    }
  });

  rows.forEach(row => {
    const content = row.querySelector(".profile-row-content");
    let startX = 0, startY = 0, deltaX = 0, swiping = false;
    content.addEventListener("pointerdown", event => {
      if (event.target.closest(".profile-drag-handle")) return;
      startX = event.clientX; startY = event.clientY; deltaX = 0; swiping = true;
      content.setPointerCapture?.(event.pointerId);
      closeRows(row);
    });
    content.addEventListener("pointermove", event => {
      if (!swiping) return;
      const dx = event.clientX - startX, dy = event.clientY - startY;
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { swiping = false; content.style.transform = ""; return; }
      deltaX = Math.max(-92, Math.min(0, dx));
      if (Math.abs(deltaX) > 5) event.preventDefault();
      content.style.transform = `translateX(${deltaX}px)`;
    });
    const finishSwipe = () => {
      if (!swiping) return;
      swiping = false;
      const shouldOpen = deltaX < -42;
      row.classList.toggle("swiped-open", shouldOpen);
      content.style.transform = shouldOpen ? "translateX(-84px)" : "";
      openRow = shouldOpen ? row : null;
    };
    content.addEventListener("pointerup", finishSwipe);
    content.addEventListener("pointercancel", finishSwipe);
  });

  document.querySelectorAll("[data-delete-profile]").forEach(button => button.addEventListener("click", () => deleteProfile(Number(button.dataset.deleteProfile))));

  let draggingIndex = null;
  document.querySelectorAll("[data-drag-handle]").forEach(handle => {
    handle.addEventListener("pointerdown", event => {
      draggingIndex = Number(handle.dataset.dragHandle);
      const row = handle.closest("[data-profile-row]");
      row?.classList.add("dragging");
      handle.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    });
    handle.addEventListener("pointermove", event => {
      if (draggingIndex === null) return;
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-profile-row]");
      rows.forEach(row => row.classList.toggle("drag-target", row === target && Number(row.dataset.profileRow) !== draggingIndex));
    });
    const finishDrag = event => {
      if (draggingIndex === null) return;
      const from = draggingIndex;
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-profile-row]");
      const to = target ? Number(target.dataset.profileRow) : from;
      draggingIndex = null;
      rows.forEach(row => row.classList.remove("dragging", "drag-target"));
      if (Number.isInteger(to) && to !== from) moveProfile(from, to);
    };
    handle.addEventListener("pointerup", finishDrag);
    handle.addEventListener("pointercancel", () => {
      draggingIndex = null;
      rows.forEach(row => row.classList.remove("dragging", "drag-target"));
    });
  });

  document.addEventListener("pointerdown", event => {
    if (openRow && !event.target.closest(".profile-swipe-row")) closeRows();
  }, { once:true });
}

function bindSettings() {
  bindProfileGestures();
  document.getElementById("btnThemeSetting")?.addEventListener("click", toggleTheme);
  document.getElementById("btnAddProfile")?.addEventListener("click", () => {
    saveVisibleProfileNames();
    state.profiles = [...state.profiles, `Profile ${state.profiles.length + 1}`];
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
    saveVisibleProfileNames(); saveState(); alert("SaveProfileเรียบร้อย"); render();
  });
  const rankingInputs = ["rankExactPoints","rankReversePoints","rankWeight10","rankWeight30","rankWeightAll"].map(id=>document.getElementById(id)).filter(Boolean);
  const updateRankingTotal = () => {
    const weights = ["rankWeight10","rankWeight30","rankWeightAll"].map(id=>Math.max(0, Number(document.getElementById(id)?.value || 0)));
    const total = weights.reduce((a,b)=>a+b,0);
    const totalEl = document.getElementById("rankingWeightTotal");
    if (totalEl) { totalEl.textContent = `รวม ${total}%`; totalEl.className = Math.abs(total-100)<0.001 ? "valid" : "invalid"; }
    return total;
  };
  rankingInputs.forEach(input => input.addEventListener("input", updateRankingTotal));
  document.getElementById("btnSaveRankingConfig")?.addEventListener("click", () => {
    const exactPoints = Number(document.getElementById("rankExactPoints")?.value);
    const reversedPoints = Number(document.getElementById("rankReversePoints")?.value);
    const weight10 = Number(document.getElementById("rankWeight10")?.value);
    const weight30 = Number(document.getElementById("rankWeight30")?.value);
    const weightAll = Number(document.getElementById("rankWeightAll")?.value);
    const values = [exactPoints,reversedPoints,weight10,weight30,weightAll];
    if (values.some(v=>!Number.isFinite(v)||v<0)) return alert("กรุณาใส่ตัวเลขตั้งแต่ 0 ขึ้นไป");
    if (Math.abs(weight10+weight30+weightAll-100)>0.001) return alert("น้ำหนัก 10 งวด + 30 งวด + ข้อมูลทั้งหมด ต้องรวมเท่ากับ 100%");
    state.rankingConfig = { exactPoints, reversedPoints, weight10, weight30, weightAll };
    saveState(); render(); alert("บันทึกสูตรคะแนนเรียบร้อย");
  });
  document.getElementById("btnResetRankingConfig")?.addEventListener("click", () => {
    state.rankingConfig = { ...DEFAULT_STATE.rankingConfig }; saveState(); render();
  });
  document.getElementById("btnExport")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state,null,2)], {type:"application/json"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`LuckyNumber-V4.30-${isoDate()}.json`; a.click(); URL.revokeObjectURL(a.href);
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
    // เมื่อผู้ใช้แก้เลขเอง ให้กลับมาใช้วันที่ปัจจุบันในการบันทึกตาราง
    state.calculationDate = null;
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

  // V4.22: กรอกเลขจริง 3 หลักครบแล้ว เลื่อนไปช่องเลขจริง 2 ตัวทันที
  // โดยใช้แป้นตัวเลขเดิมต่อเนื่อง ไม่ต้องกด DONE
  if (value !== "delete" && input.id === "actualDrawNumber" && input.value.length === 3) {
    const nextInput = document.getElementById("actualDrawTwoDigit");
    if (nextInput) {
      openNumericKeypad(nextInput);
      requestAnimationFrame(() => nextInput.scrollIntoView({ block: "center", behavior: "smooth" }));
    }
    return;
  }

  // V4.28: เมื่อกรอกเลขจริง 2 ตัวครบ ให้ปิดแป้นตัวเลขทันที
  // และเลื่อนไปยังปุ่ม Save เพื่อยืนยัน โดยไม่ต้องกด DONE
  if (value !== "delete" && input.id === "actualDrawTwoDigit" && input.value.length === 2) {
    closeNumericKeypad();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const saveButton = document.getElementById("btnSaveActualDraw");
        saveButton?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
    });
  }
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
// สร้าง Auto Match ให้ข้อมูลเก่าที่มีอยู่แล้วทันทีหลังอัปเดตเวอร์ชัน
// V4.16 migration: remove old Not Found entries, then rebuild linked auto matches.
state.records = state.records.filter(r => r && r.status !== "notfound");
state.actualDraws.forEach(syncAutoLHistoryForActual);
saveState();
render();
bindGlobalKeypad();

// LuckyNumber V4.25: simple result entry; reference-table selection is available only in Edit.
