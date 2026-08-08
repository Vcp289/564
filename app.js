"use strict";

const STORAGE_KEY = "luckyNumberProV4_5";
const LEGACY_KEYS = ["luckyNumberProV4_4", "luckyNumberProV4_3", "luckyNumberProV4_2", "luckyNumberProV4_1", "luckyNumberProV4", "luckyNumberProV1", "luckyNumberProV3"];
const DAYS_TH = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// V6.5.4 — มาตรฐานน้ำหนัก History กลางสำหรับ AI ที่ใช้ช่วงเวลา 12/30/60 งวด
const AI_HISTORY_WINDOWS = Object.freeze([
  Object.freeze({ size: 12, weight: 0.50 }),
  Object.freeze({ size: 30, weight: 0.30 }),
  Object.freeze({ size: 60, weight: 0.20 })
]);
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
  historyFormulaMode: "compare",
  calculationDate: null,
  analysisSortMode: "score",
  analysisWinWindow: 7,
  analysisWinShowDetails: false,
  analysisWinCalendarMonth: "",
  analysisWinSelectedDate: "",
  profileOrderMode: "default", // V6.2: default | ai (presentation order only)
  rankingConfig: { exactPoints: 1, reversedPoints: 1, weight10: 50, weight30: 30, weightAll: 20 },
  aiFormulaLab: {},
  activeFormulaByProfile: {},
  webSync: { endpoint: "", lastSyncAt: null, lastStatus: "idle", importedCount: 0 },
  backupSettings: { autoDownloadAfterActualSave: false, lastBackupAt: null, lastBackupReason: "", backupCount: 0 },
  masterAISettings: { learning: true, adaptiveWeight: true, backtest: true }
};

let state = loadState();
let currentLResults = [];
let currentLRankLimit = 0; // 0 = แสดงทั้งหมดเหมือน V4.46
let currentLResultMode = "l"; // V6.4: l | independent | master | overlap
const app = document.getElementById("app");

// V6.7.4 — based on V6.7.3 fast/smooth navigation. Cache rendered page HTML while the underlying
// state is unchanged so returning to a tab does not repeat expensive AI/history
// calculations. Full render() invalidates the cache after any state/UI mutation.
const VIEW_HTML_CACHE = new Map();
let viewCacheGeneration = 0;
function invalidateViewCache() {
  VIEW_HTML_CACHE.clear();
  viewCacheGeneration++;
}
function getViewHtml(view = state.currentView) {
  const key = `${viewCacheGeneration}:${view}`;
  if (VIEW_HTML_CACHE.has(key)) return VIEW_HTML_CACHE.get(key);
  const previousView = state.currentView;
  state.currentView = view;
  const html = renderView();
  state.currentView = previousView;
  VIEW_HTML_CACHE.set(key, html);
  return html;
}

// V6.4.5 Performance Fix — cache expensive AI backtests across UI-only renders.
const PERF_CACHE = {
  independentAI: new Map(),
  independentSummary: new Map(),
  masterWeights: new Map(),
  masterAI: new Map(),
  masterSummary: new Map()
};
let activeRenderPerfSignature = "";
const AI_FORMULA_RECOVERY_IN_FLIGHT = new Set(); // V6.4.8: one-time recovery for profiles whose candidate was deleted by V6.4.7

function clearPerformanceCaches() {
  Object.values(PERF_CACHE).forEach(cache => cache.clear());
}

function compactFormulaSignature(formula) {
  if (!Array.isArray(formula)) return "-";
  try { return formula.flat().map(cell => `${cell?.s ?? ""}:${cell?.o ?? ""}`).join(","); }
  catch (_) { return "-"; }
}

function buildPerformanceSignature() {
  const drawSig = (state.actualDraws || []).map(d =>
    `${d.profileId ?? 0}:${d.date || ""}:${d.number || ""}:${d.twoDigit || ""}:${d.updatedAt || d.createdAt || ""}`
  ).join("|");
  const tableSig = (state.dailyTables || []).map(t =>
    `${t.profileId ?? 0}:${t.date || ""}:${(t.inputDigits || t.inputs || []).join?.("") || ""}:${t.updatedAt || t.createdAt || ""}`
  ).join("|");
  const formulaSig = Object.entries(state.aiFormulaLab || {}).map(([id, saved]) =>
    `${id}:${compactFormulaSignature(saved?.formula)}`
  ).join("|");
  const m = state.masterAISettings || {};
  return [
    drawSig,
    tableSig,
    formulaSig,
    `M:${m.learning !== false}:${m.adaptiveWeight !== false}:${m.backtest !== false}`,
    `I:${Array.isArray(state.lastInput) ? state.lastInput.join("") : ""}`
  ].join("§");
}

function ensurePerformanceSignature() {
  const next = buildPerformanceSignature();
  if (activeRenderPerfSignature && activeRenderPerfSignature !== next) clearPerformanceCaches();
  activeRenderPerfSignature = next;
  return next;
}

function performanceKey(prefix, profileId, beforeDate = null, limit = 10, extra = "") {
  const sig = activeRenderPerfSignature || ensurePerformanceSignature();
  return `${prefix}|${sig}|P${Number(profileId)}|D${beforeDate || "NOW"}|L${Number(limit)}|${extra}`;
}

function drawListPerformanceKey(draws) {
  if (!Array.isArray(draws) || !draws.length) return "0";
  const first = draws[0], last = draws[draws.length - 1];
  return `${draws.length}:${first?.id || ""}:${first?.date || ""}:${last?.id || ""}:${last?.date || ""}`;
}


function loadState() {
  try {
    const candidates = [];
    const keys = [
      STORAGE_KEY,
      `${STORAGE_KEY}_shadow`,
      `${STORAGE_KEY}_snapshot_1`,
      `${STORAGE_KEY}_snapshot_2`,
      ...LEGACY_KEYS
    ];
    keys.forEach(key => {
      try {
        const text = localStorage.getItem(key);
        if (text) candidates.push(JSON.parse(text));
      } catch (_) {}
    });
    const raw = candidates.sort((a, b) => stateRecoveryScore(b) - stateRecoveryScore(a))[0] || null;
    const base = typeof structuredClone === "function" ? structuredClone(DEFAULT_STATE) : JSON.parse(JSON.stringify(DEFAULT_STATE));
    const merged = { ...base, ...(raw || {}), profiles: Array.isArray(raw?.profiles) && raw.profiles.length > 0 ? raw.profiles : base.profiles, records: Array.isArray(raw?.records) ? raw.records.filter(r => r && r.status !== "notfound") : [], actualDraws: Array.isArray(raw?.actualDraws) ? raw.actualDraws : [], dailyTables: Array.isArray(raw?.dailyTables) ? raw.dailyTables : [] };
    merged.rankingConfig = { ...base.rankingConfig, ...(raw?.rankingConfig || {}) };
    merged.webSync = { ...base.webSync, ...(raw?.webSync || {}) };
    merged.backupSettings = { ...base.backupSettings, ...(raw?.backupSettings || {}) };
    merged.masterAISettings = { ...base.masterAISettings, ...(raw?.masterAISettings || {}) };
    merged.aiFormulaLab = raw?.aiFormulaLab && typeof raw.aiFormulaLab === "object" ? raw.aiFormulaLab : {};
    merged.activeFormulaByProfile = raw?.activeFormulaByProfile && typeof raw.activeFormulaByProfile === "object" ? raw.activeFormulaByProfile : {};
    merged.profileOrderMode = raw?.profileOrderMode === "ai" ? "ai" : "default";
    return merged;
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

function stateRecoveryScore(candidate) {
  if (!candidate || typeof candidate !== "object") return -1;
  const aiModels = Object.values(candidate.aiFormulaLab || {}).filter(Boolean).length;
  const activeAI = Object.values(candidate.activeFormulaByProfile || {}).filter(v => v === "ai").length;
  return (candidate.actualDraws?.length || 0) * 100000000
    + (candidate.dailyTables?.length || 0) * 1000000
    + (candidate.records?.length || 0) * 10000
    + aiModels * 100
    + activeAI * 10
    + Number(candidate._persistenceUpdatedAt || 0) / 1e13;
}

const IDB_NAME = "LuckyNumberPersistentDB";
const IDB_STORE = "state";
const IDB_KEY = "main";
let persistenceReady = false;
let persistenceWriteTimer = null;

function stateDataScore(candidate) {
  return stateRecoveryScore(candidate);
}

function openPersistenceDB() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("IndexedDB unavailable"));
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
  });
}

async function readIndexedState() {
  try {
    const db = await openPersistenceDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (error) {
    console.warn("IndexedDB read unavailable", error);
    return null;
  }
}

async function writeIndexedState(snapshot) {
  try {
    const db = await openPersistenceDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(snapshot, IDB_KEY);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("IndexedDB write aborted"));
    });
    db.close();
    return true;
  } catch (error) {
    console.warn("IndexedDB write unavailable", error);
    return false;
  }
}

function saveState() {
  state._persistenceUpdatedAt = Date.now();
  // Persist data only; transient OCR previews must never enter localStorage/IndexedDB.
  const serialized = JSON.stringify(makeBackupSafeState(state));
  try {
    const previous = localStorage.getItem(STORAGE_KEY);
    if (previous && previous !== serialized) {
      localStorage.setItem(`${STORAGE_KEY}_snapshot_2`, localStorage.getItem(`${STORAGE_KEY}_snapshot_1`) || previous);
      localStorage.setItem(`${STORAGE_KEY}_snapshot_1`, previous);
    }
    localStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(`${STORAGE_KEY}_shadow`, serialized);
  } catch (error) {
    console.warn("localStorage write unavailable", error);
  }
  clearTimeout(persistenceWriteTimer);
  persistenceWriteTimer = setTimeout(() => writeIndexedState(JSON.parse(serialized)), 80);
}

async function bootstrapPersistentState() {
  const indexed = await readIndexedState();
  if (indexed && stateDataScore(indexed) > stateDataScore(state)) {
    const base = typeof structuredClone === "function" ? structuredClone(DEFAULT_STATE) : JSON.parse(JSON.stringify(DEFAULT_STATE));
    state = { ...base, ...indexed };
    state.rankingConfig = { ...base.rankingConfig, ...(indexed.rankingConfig || {}) };
    state.webSync = { ...base.webSync, ...(indexed.webSync || {}) };
    state.backupSettings = { ...base.backupSettings, ...(indexed.backupSettings || {}) };
    state.masterAISettings = { ...base.masterAISettings, ...(indexed.masterAISettings || {}) };
  }
  persistenceReady = true;
}

function makeBackupSafeState(sourceState) {
  // Remove only transient OCR/image payloads. Preserve all AI/table objects,
  // including repeated references that JSON.stringify normally serializes safely.
  const blockedKeys = new Set([
    "imageData", "imageUrl", "imageURL", "previewUrl", "previewURL",
    "previewUrls", "previewURLs", "canvas", "blob", "objectUrl", "objectURL",
    "ocrImage", "ocrPreview", "base64", "dataUrl", "dataURL"
  ]);
  const json = JSON.stringify(sourceState, (key, value) => {
    if (blockedKeys.has(key)) return undefined;
    if (typeof value === "string" && (/^data:image\//i.test(value) || /^blob:/i.test(value))) return undefined;
    if (typeof Blob !== "undefined" && value instanceof Blob) return undefined;
    if (typeof File !== "undefined" && value instanceof File) return undefined;
    if (typeof HTMLCanvasElement !== "undefined" && value instanceof HTMLCanvasElement) return undefined;
    return value;
  });
  return json ? JSON.parse(json) : {};
}

function buildBackupPayload(reason = "manual") {
  const safeState = makeBackupSafeState(state);
  return {
    format: "LuckyNumberBackup",
    formatVersion: 3,
    appVersion: "6.7.0",
    exportedAt: new Date().toISOString(),
    reason,
    checksumHint: `${safeState.records?.length || 0}-${safeState.actualDraws?.length || 0}-${safeState.dailyTables?.length || 0}`,
    state: safeState
  };
}

async function downloadBackup(reason = "manual", silent = false) {
  try {
    const payload = buildBackupPayload(reason);
    const jsonText = JSON.stringify(payload, null, 2);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `LuckyNumber-Backup-${stamp}.json`;
    const blob = new Blob([jsonText], { type: "application/json" });
    const file = new File([blob], fileName, { type: "application/json" });

    // iPhone/iPad: open native Share Sheet -> Save to Files -> choose folder.
    // A web app cannot silently write into an arbitrary Files folder.
    const canShareFile = !!(navigator.share && navigator.canShare && navigator.canShare({ files: [file] }));
    if (canShareFile && !silent) {
      try {
        await navigator.share({ files: [file], title: "LuckyNumber Backup" });
      } catch (shareError) {
        if (shareError?.name === "AbortError") return false;
        console.warn("Share backup failed; falling back to download", shareError);
        const a = document.createElement("a");
        const url = URL.createObjectURL(blob);
        a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } else {
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    state.backupSettings = { ...(state.backupSettings || {}), lastBackupAt: Date.now(), lastBackupReason: reason, backupCount: Number(state.backupSettings?.backupCount || 0) + 1 };
    saveState();
    if (!silent) showToast(canShareFile ? "✓ เลือก Save to Files แล้วเลือกโฟลเดอร์ที่ต้องการ" : "✓ สร้างไฟล์สำรองแล้ว ตรวจสอบใน Files / Downloads");
    return true;
  } catch (error) {
    console.error("Backup export failed", error);
    if (!silent) alert("สร้างไฟล์สำรองไม่สำเร็จ กรุณาลองอีกครั้ง");
    return false;
  }
}
function unwrapBackup(data) {
  if (data && data.format === "LuckyNumberBackup" && data.state && typeof data.state === "object") return data.state;
  return data;
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

function calculateGrid(values = state.lastInput, profileId = state.activeProfile) {
  if (values.some(v => !/^\d$/.test(String(v)))) return null;
  return formulaGrid(values, getActiveFormula(profileId));
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




function rankLResults(items, profileId = state.activeProfile) {
  const selectedProfileId = Number(profileId);
  const toTime = value => {
    const time = Date.parse(String(value || ""));
    return Number.isFinite(time) ? time : 0;
  };

  // หน้า "ค้นหาเลข L" ใช้ History ทั้งหมดของ Profile นี้
  // actualDraws ใช้นับจำนวนงวดทั้งหมด ส่วน records คือหลักฐาน Pattern/Position ที่เคย Match
  const allDraws = (state.actualDraws || [])
    .filter(draw => Number(draw.profileId ?? 0) === selectedProfileId && draw.date)
    .sort((a, b) => toTime(b.date) - toTime(a.date));
  const uniqueDrawDates = [...new Set(allDraws.map(draw => String(draw.date)))];

  const profileRecords = (state.records || [])
    .filter(record => Number(record.profileId) === selectedProfileId && record.patternId && record.status !== "notfound")
    .sort((a, b) => toTime(b.date) - toTime(a.date));

  // รองรับข้อมูลรุ่นเก่าที่อาจยังไม่มี actualDraws ครบทุกงวด
  const historyDates = uniqueDrawDates.length
    ? uniqueDrawDates
    : [...new Set(profileRecords.map(record => String(record.date || "")).filter(Boolean))];
  const historyCount = historyDates.length;
  const dateIndex = new Map(historyDates.map((date, index) => [date, index]));

  const windowWeights = AI_HISTORY_WINDOWS;

  const weightedWindowRate = (matches, valueSelector) => windowWeights.reduce((total, window) => {
    const available = window.size === Infinity ? historyCount : Math.min(historyCount, window.size);
    if (!available) return total;
    const value = matches.reduce((sum, match) => {
      const index = dateIndex.has(String(match.date || "")) ? dateIndex.get(String(match.date || "")) : match.fallbackIndex;
      return index < available ? sum + valueSelector(match) : sum;
    }, 0);
    return total + (value / available) * window.weight;
  }, 0);

  return items.map(item => {
    const occurrences = item.occurrences || [item];
    const patternIds = new Set(occurrences.map(o => o.patternId));
    const positionKeys = new Set(occurrences.map(o => JSON.stringify(o.cells || [])));

    const matches = profileRecords.map((record, fallbackIndex) => ({
      ...record,
      fallbackIndex,
      patternMatch: patternIds.has(record.patternId),
      positionMatch: positionKeys.has(JSON.stringify(record.cells || [])),
      exactValue: record.status === "exact" ? 1 : 0,
      reverseValue: record.status === "swap" || record.status === "reversed" ? 1 : 0
    }));

    const patternRate = weightedWindowRate(matches, match => match.patternMatch ? 1 : 0);
    const positionRate = weightedWindowRate(matches, match => match.positionMatch ? 1 : 0);
    const exactRate = weightedWindowRate(matches, match => match.patternMatch ? match.exactValue : 0);
    const reverseRate = weightedWindowRate(matches, match => match.patternMatch ? match.reverseValue : 0);

    const totalPatternHits = matches.filter(match => match.patternMatch).length;
    const recent12Hits = matches.filter(match => {
      const index = dateIndex.has(String(match.date || "")) ? dateIndex.get(String(match.date || "")) : match.fallbackIndex;
      return match.patternMatch && index < 12;
    }).length;
    const currentOccurrences = Math.min(occurrences.length, 5);

    // ลดความมั่นใจเมื่อข้อมูลยังน้อย แต่ยังไม่ทำให้เลขหายจากรายการ
    const confidenceFactor = historyCount ? Math.min(1, 0.45 + historyCount / 40) : 0.35;
    const rawScore = (
      patternRate * 420 +
      positionRate * 300 +
      exactRate * 125 +
      reverseRate * 125 +
      currentOccurrences * 2
    ) * confidenceFactor;

    return {
      ...item,
      aiRawScore: rawScore,
      aiReasons: [
        `วิเคราะห์ History ทั้งหมด ${historyCount} งวด`,
        `12 งวดล่าสุด Match ${recent12Hits} ครั้ง`,
        `แพตเทิร์นเคย Match รวม ${totalPatternHits} ครั้ง`,
        `พบในตารางนี้ ${occurrences.length} ตำแหน่ง`
      ],
      aiDataCount: historyCount,
      aiMatchRecordCount: profileRecords.length
    };
  }).sort((a,b) => b.aiRawScore - a.aiRawScore || a.number.localeCompare(b.number))
    .map((item,index) => ({ ...item, aiRank:index + 1, aiScore:Math.round(item.aiRawScore) }));
}

function render() {
  ensurePerformanceSignature();
  invalidateViewCache();
  document.documentElement.dataset.theme = state.theme === "dark" ? "dark" : "light";
  const viewHtml = getViewHtml(state.currentView);
  app.innerHTML = `
    <main class="main">${viewHtml}</main>
    <nav class="bottom-nav">
      ${navButton("home", "⌂", "Calculate")}
      ${navButton("weekly", "✦", "AI")}
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
  if (["weekly", "history"].includes(state.currentView)) scheduleMissingAIFormulaRecovery(state.activeProfile);
  if (["home", "weekly", "history", "analysis"].includes(state.currentView)) {
    requestAnimationFrame(() => {
      const activeTab = document.querySelector('.profile-tabs [data-profile].active');
      const tabStrip = activeTab?.closest('.profile-tabs');
      if (!activeTab || !tabStrip) return;
      const left = activeTab.offsetLeft - (tabStrip.clientWidth - activeTab.offsetWidth) / 2;
      tabStrip.scrollLeft = Math.max(0, left);
    });
  }
}

// V6.4.7: fast iPhone navigation. Keep the app shell mounted and replace only
// the page body when switching bottom tabs. This avoids rebuilding the header,
// bottom navigation, keypad and modal root on every tap.
function bindFastViewContent() {
  document.querySelector("[data-profile-order-toggle]")?.addEventListener("click", () => {
    state.profileOrderMode = state.profileOrderMode === "ai" ? "default" : "ai";
    saveState();
    render();
  });
  document.querySelectorAll("[data-profile]").forEach(btn => btn.addEventListener("click", () => {
    const id = Number(btn.dataset.profile);
    state.activeProfile = id;
    if (state.currentView === "home") {
      const latestDraw = getLatestCompleteActualDraw(id);
      if (latestDraw) {
        state.lastInput = [...String(latestDraw.number), ...String(latestDraw.twoDigit)];
        state.calculationDate = latestDraw.date || isoDate();
        state.grid = calculateGrid(state.lastInput, id);
        state.selectedL = null;
      } else {
        state.lastInput = ["","","","",""];
        state.grid = null;
        state.calculationDate = null;
        state.selectedL = null;
      }
    }
    saveState();
    render();
    if (state.currentView === "home" && !getLatestCompleteActualDraw(id)) {
      showToast(`ยังไม่มีเลขออกจริงล่าสุดของ ${state.profiles[id] || "Profile"}`);
    }
  }));
  document.querySelectorAll("[data-record]").forEach(el => el.addEventListener("click", () => openRecordDetail(el.dataset.record)));
}

function centerActiveProfileTab() {
  if (!["home", "weekly", "history", "analysis"].includes(state.currentView)) return;
  requestAnimationFrame(() => {
    const activeTab = document.querySelector('.profile-tabs [data-profile].active');
    const tabStrip = activeTab?.closest('.profile-tabs');
    if (!activeTab || !tabStrip) return;
    const left = activeTab.offsetLeft - (tabStrip.clientWidth - activeTab.offsetWidth) / 2;
    tabStrip.scrollLeft = Math.max(0, left);
  });
}

function navigateToView(nextView) {
  if (!nextView || nextView === state.currentView) return;
  closeNumericKeypad();
  state.currentView = nextView;
  const main = document.querySelector("main.main");
  if (!main) { render(); return; }

  // Give immediate tactile/visual feedback before any heavy page work.
  document.querySelectorAll(".bottom-nav [data-view]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === state.currentView);
  });
  main.classList.add("view-switching");

  // Cached pages return immediately. First-time pages are rendered once and then
  // retained until a real state/UI change triggers full render().
  const html = getViewHtml(state.currentView);
  main.innerHTML = html;
  bindFastViewContent();
  bindView();
  centerActiveProfileTab();
  if (["weekly", "history"].includes(state.currentView)) scheduleMissingAIFormulaRecovery(state.activeProfile);

  // GPU-friendly opacity/translate transition only — no layout animation.
  main.classList.remove("view-enter-fast", "view-switching");
  requestAnimationFrame(() => {
    main.classList.add("view-enter-fast");
    window.setTimeout(() => main.classList.remove("view-enter-fast"), 150);
  });
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
function getProfileOrderByMode(mode = state.analysisSortMode) {
  const order = state.profiles.map((_, i) => i);
  if (mode === "manual") return order;
  if (mode === "ai") {
    return order.sort((a, b) => {
      const aiA = getProfileAIRecommendation(a);
      const aiB = getProfileAIRecommendation(b);
      return aiB.confidence - aiA.confidence || aiB.statScore - aiA.statScore || aiB.samples - aiA.samples || a - b;
    });
  }
  return order.sort((a, b) => {
    const scoreA = getProfileAnalysisScore(a);
    const scoreB = getProfileAnalysisScore(b);
    return scoreB.score - scoreA.score || scoreB.samples - scoreA.samples || a - b;
  });
}

function getVisibleProfileOrder() {
  // V6.2: presentation-only global order. Never mutates the stored profile array.
  return state.profileOrderMode === "ai"
    ? getProfileOrderByMode("ai")
    : state.profiles.map((_, i) => i);
}

function profileTabs(includeOrderBar = true) {
  const order = getVisibleProfileOrder();
  const aiOrder = state.profileOrderMode === "ai";
  const awards = ["🏆", "🥈", "🥉"];
  return `<div class="profile-nav-block">
    ${includeOrderBar ? `<div class="profile-order-bar">
      <span>Profile Order</span>
      <button type="button" class="profile-order-toggle ${aiOrder ? "ai" : "default"}" data-profile-order-toggle aria-pressed="${aiOrder}">${aiOrder ? "🤖 Profile AI Ranking" : "↕ Default"}</button>
    </div>` : ``}
    <div class="profile-tabs profile-tabs-colored ${aiOrder ? "ai-ranked" : ""}">${order.map((i, rankIndex) => {
      const name = state.profiles[i];
      const rank = rankIndex + 1;
      const award = aiOrder && rank <= 3 ? awards[rankIndex] : "";
      return `<button class="profile-chip profile-chip-colored ${i === Number(state.activeProfile) ? "active" : ""} ${award ? `rank-award rank-${rank}` : ""}" style="--profile-color:${profileColor(i)}" data-profile="${i}"${aiOrder ? ` data-ai-rank="${rank}"` : ""}>${award ? `<span class="profile-award" aria-hidden="true">${award}</span>` : ""}<span class="profile-chip-name">${escapeHtml(name)}</span>${award ? `<small class="profile-rank-mini">#${rank}</small>` : ""}</button>`;
    }).join("")}</div>
  </div>`;
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
      <div class="calculator-top-row">
        <div class="profile-order-bar calculator-profile-order">
          <span>Profile Order</span>
          <button type="button" class="profile-order-toggle ${state.profileOrderMode === "ai" ? "ai" : "default"}" data-profile-order-toggle aria-pressed="${state.profileOrderMode === "ai"}">${state.profileOrderMode === "ai" ? "🤖 Profile AI Ranking" : "↕ Default"}</button>
        </div>
        <div class="calculator-meta-row">
          <button id="themeToggle" class="calculator-theme-toggle" aria-label="Toggle theme" title="Toggle theme">${state.theme === "dark" ? "☀️" : "🌙"}</button>
          <span class="calculator-date">${DAYS_TH[new Date().getDay()]} ${formatDateTH(isoDate())}</span>
        </div>
      </div>
      ${profileTabs(false)}
      <div class="active-formula-banner formula-name-only formula-with-actions ${getActiveFormulaMode()==="ai"?"ai":"original"}">
        <b>${getActiveFormulaLabel()}</b>
        <div class="calculator-icon-actions" aria-label="Result shortcuts">
          <button id="btnBrowseResultCalendar" class="ios-icon-btn ${latestDraw ? "" : "disabled"}" ${latestDraw ? "" : "disabled"} aria-label="Browse history" title="Browse History">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2.75v3M17 2.75v3M3.75 8.25h16.5M5.5 4.75h13a1.75 1.75 0 0 1 1.75 1.75v12a1.75 1.75 0 0 1-1.75 1.75h-13a1.75 1.75 0 0 1-1.75-1.75v-12A1.75 1.75 0 0 1 5.5 4.75Z"/></svg>
          </button>
          <button id="btnLoadLastResult" class="ios-icon-btn ${latestDraw ? "" : "disabled"}" ${latestDraw ? "" : "disabled"} aria-label="Load last result" title="Load Last Result">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.2 8.1V3.9m0 0h4.2m-4.2 0 3.15 3.15A8 8 0 1 1 4.7 14.3"/></svg>
          </button>
        </div>
      </div>
      <div class="input-row">${state.lastInput.map((v, i) => `<input class="digit-input ${i===0?'active':''}" data-index="${i}" maxlength="1" type="text" readonly value="${escapeHtml(v)}" aria-label="Digit ${i+1}">`).join("")}</div>
      <div class="action-row">
        <button id="btnCalc" class="btn primary">CALCULATE</button>
        <button id="btnClear" class="btn secondary">CLEAR</button>
      </div>
    </section>
    ${grid ? `<section class="card result-card-clean">
      <div class="result-badge-row"><div class="table-formula-badge ${getDisplayedGridFormulaMode()==="ai"?"ai":"original"}">${escapeHtml(getDisplayedGridFormulaDetail())}</div></div>
      ${gridHtml(grid)}
      <div class="find-l-icon-wrap"><button id="btnFindL" class="find-l-icon-btn" aria-label="Find L Numbers" title="Find L Numbers"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 5 5"></path></svg></button></div>
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


function getOriginalFormula() {
  return [
    [{s:0,o:0},{s:0,o:-1},{s:0,o:1},{s:3,o:0},{s:3,o:1}],
    [{s:1,o:0},{s:1,o:-1},{s:1,o:1},{s:4,o:0},{s:4,o:-1}],
    [{s:2,o:0},{s:2,o:-1},{s:2,o:1},{s:3,o:-1},{s:4,o:1}]
  ];
}

function getActiveFormulaMode(profileId = state.activeProfile) {
  return state.activeFormulaByProfile?.[Number(profileId)] === "ai" ? "ai" : "original";
}
function getActiveFormula(profileId = state.activeProfile) {
  const id = Number(profileId);
  const saved = state.aiFormulaLab?.[id];
  return getActiveFormulaMode(id) === "ai" && saved?.formula ? saved.formula : getOriginalFormula();
}
function getAIFormulaDisplayName(profileId = state.activeProfile) {
  const saved = state.aiFormulaLab?.[Number(profileId)];
  const version = Number(saved?.version || 1);
  const engine = saved?.engine || "Evolution Ensemble";
  return `AI Champion V${version} • ${engine}`;
}
function getActiveFormulaLabel(profileId = state.activeProfile) {
  const id = Number(profileId);
  if (getActiveFormulaMode(id) !== "ai") return "สูตรดั้งเดิม";
  return getAIFormulaDisplayName(id);
}

function getActiveFormulaDetail(profileId = state.activeProfile) {
  const id = Number(profileId);
  if (getActiveFormulaMode(id) !== "ai") return "Original Formula";
  return getAIFormulaDisplayName(id);
}

// V6.5.2: label the table that is actually being displayed, not just the
// currently selected strategy. This also keeps AI Preview tables correctly marked.
function gridsEqual(a, b) {
  return Array.isArray(a) && Array.isArray(b) && JSON.stringify(a) === JSON.stringify(b);
}
function getDisplayedGridFormulaMode(profileId = state.activeProfile) {
  const id = Number(profileId);
  if (!state.grid || !Array.isArray(state.lastInput) || state.lastInput.length !== 5) return getActiveFormulaMode(id);
  const originalGrid = formulaGrid(state.lastInput, getOriginalFormula());
  const aiFormula = state.aiFormulaLab?.[id]?.formula || null;
  const aiGrid = aiFormula ? formulaGrid(state.lastInput, aiFormula) : null;
  const isOriginal = gridsEqual(state.grid, originalGrid);
  const isAI = aiGrid ? gridsEqual(state.grid, aiGrid) : false;
  if (isAI && !isOriginal) return "ai";
  if (isOriginal && !isAI) return "original";
  return getActiveFormulaMode(id);
}
function getDisplayedGridFormulaDetail(profileId = state.activeProfile) {
  return getDisplayedGridFormulaMode(profileId) === "ai" ? "AI L" : "Original Formula";
}
function formulaEligibility(saved) {
  if (!saved) return {allowed:false, reason:"ยังไม่มีสูตร AI"};
  const delta = Math.round((saved.test.rate - saved.originalTest.rate) * 10) / 10;
  if ((saved.test.total || 0) < 5) return {allowed:false, delta, reason:"ข้อมูลทดสอบยังไม่พอ (ต้องอย่างน้อย 5 งวด)"};
  if (delta < 5) return {allowed:false, delta, reason:`สูตร AI ต้องชนะชุดทดสอบอย่างน้อย 5% (ขณะนี้ ${delta > 0 ? "+" : ""}${delta}%)`};
  return {allowed:true, delta, reason:`ชนะชุดทดสอบ ${delta > 0 ? "+" : ""}${delta}%`};
}




// V6.4.8: AI-L candidates may be kept for History/backtest, but Master AI may
// consume AI-L only after it passes the same eligibility gate used by Activate.
function getMasterEligibleAIFormula(profileId = state.activeProfile) {
  const saved = state.aiFormulaLab?.[Number(profileId)] || null;
  return saved?.formula && formulaEligibility(saved).allowed ? saved.formula : null;
}

function formulaGrid(values, formula) {
  if (!Array.isArray(values) || values.some(v => !/^\d$/.test(String(v)))) return null;
  const nums = values.map(Number);
  return formula.map(row => row.map(cell => w(nums[cell.s] + cell.o)));
}
function formulaText(formula) {
  const names = ["A","B","C","D","E"];
  return formula.map((row,i)=>`แถว ${i+1}: ${row.map(c=>`${names[c.s]}${c.o===0?"":c.o>0?`+${c.o}`:c.o}`).join(" · ")}`).join("<br>");
}
function lMatchedByGrid(actual, grid) {
  if (!grid || !/^\d{3}$/.test(String(actual || ""))) return false;
  const key = canonical3(actual);
  return findLResults(grid).some(x => (x.canonicalNumber || canonical3(x.number)) === key);
}
function getFormulaSamples(profileId) {
  return state.actualDraws
    .filter(d => Number(d.profileId ?? 0) === Number(profileId) && /^\d{3}$/.test(String(d.number || "")))
    .map(draw => {
      const table = getPredictionTable(profileId, draw.date, draw);
      return table && Array.isArray(table.inputDigits) && table.inputDigits.length === 5
        ? {date:draw.date, actual:String(draw.number), inputs:table.inputDigits.map(String)} : null;
    }).filter(Boolean).sort((a,b)=>a.date.localeCompare(b.date));
}
function evaluateFormula(formula, samples) {
  const hit = samples.reduce((n,x)=>n+(lMatchedByGrid(x.actual, formulaGrid(x.inputs, formula))?1:0),0);
  return {hit,total:samples.length,rate:samples.length?Math.round(hit*1000/samples.length)/10:0};
}
function formulaHistoryStatus(actual, inputs, formula) {
  if (!Array.isArray(inputs) || inputs.length !== 5 || inputs.some(v => !/^\d$/.test(String(v)))) return "pending";
  const grid = formulaGrid(inputs.map(String), formula);
  if (!grid || !/^\d{3}$/.test(String(actual || ""))) return "pending";
  const value = String(actual);
  const canonical = canonical3(value);
  const results = findLResults(grid);
  if (results.some(x => String(x.number) === value)) return "exact";
  if (results.some(x => (x.canonicalNumber || canonical3(x.number)) === canonical)) return "reversed";
  return "notfound";
}
function formulaStatusLabel(status) {
  return status === "exact" ? "Match" : status === "reversed" ? "เลขกลับ" : status === "pending" ? "No table" : "Not Found";
}
function compactHistoryStatusLabel(status) {
  return status === "exact" ? "Hit" : status === "reversed" ? "Rev" : status === "pending" ? "—" : "Miss";
}
function compactHistoryWinnerLabel(winner) {
  return ({"เดิม":"CLS", "AI L":"AIL", "AI อิสระ":"IND", "Master AI":"MAI", "เสมอ":"TIE"})[winner] || winner || "—";
}
function compactHistoryDate(date) {
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return date || "—";
  return `${String(d.getDate()).padStart(2,"0")} ${MONTHS_SHORT[d.getMonth()]}`;
}
function formulaStatusScore(status) {
  return status === "exact" || status === "reversed" ? 1 : status === "notfound" ? 0 : -1;
}
function formulaWinner(originalStatus, aiStatus, hasAI = true) {
  if (!hasAI || aiStatus === "pending") return "—";
  const originalScore = formulaStatusScore(originalStatus);
  const aiScore = formulaStatusScore(aiStatus);
  return aiScore > originalScore ? "AI" : originalScore > aiScore ? "เดิม" : "เสมอ";
}
function formulaMatchDetail(actual, inputs, formula) {
  const grid = formulaGrid((inputs || []).map(String), formula);
  if (!grid || !/^\d{3}$/.test(String(actual || ""))) return { status:"pending", matched:"-", grid };
  const value = String(actual);
  const canonical = canonical3(value);
  const results = findLResults(grid);
  const exact = results.find(x => String(x.number) === value);
  if (exact) return { status:"exact", matched:String(exact.number), grid };
  const reversed = results.find(x => (x.canonicalNumber || canonical3(x.number)) === canonical);
  return reversed ? { status:"reversed", matched:String(reversed.number), grid } : { status:"notfound", matched:"-", grid };
}
function formulaHistorySummary(draws, profileId, formula) {
  let hit = 0, total = 0;
  draws.forEach(draw => {
    const table = getPredictionTable(profileId, draw.date, draw);
    if (!table?.inputDigits) return;
    const status = formulaHistoryStatus(draw.number, table.inputDigits, formula);
    if (status === "pending") return;
    total += 1;
    if (status === "exact" || status === "reversed") hit += 1;
  });
  return { hit, total, rate: total ? Math.round(hit * 1000 / total) / 10 : 0 };
}

// V6.0 — AI อิสระ: วิเคราะห์เฉพาะผลจริงย้อนหลัง ไม่อ้างอิงเลข L
function independentHistory(profileId, beforeDate = null) {
  return state.actualDraws
    .filter(d => Number(d.profileId ?? 0) === Number(profileId) && /^\d{3}$/.test(String(d.number || "")) && (!beforeDate || d.date < beforeDate))
    .sort((a,b) => a.date.localeCompare(b.date) || (a.createdAt || 0) - (b.createdAt || 0));
}
function generateIndependentAI(profileId, beforeDate = null, limit = 10) {
  const cacheKey = performanceKey("indAI", profileId, beforeDate, limit);
  if (PERF_CACHE.independentAI.has(cacheKey)) return PERF_CACHE.independentAI.get(cacheKey);
  const draws = independentHistory(profileId, beforeDate);
  if (draws.length < 8) {
    const pending = {items:[], dataCount:draws.length, pending:true};
    PERF_CACHE.independentAI.set(cacheKey, pending);
    return pending;
  }
  const windows = AI_HISTORY_WINDOWS;
  const stats = windows.map(({size,weight})=>{
    const sample=size===Infinity?draws:draws.slice(-size), denom=sample.length||1;
    const pos=Array.from({length:3},()=>Array(10).fill(0));
    const any=Array(10).fill(0), pair01=Array(100).fill(0), pair12=Array(100).fill(0), exact=new Map();
    sample.forEach(d=>{
      const v=String(d.number).padStart(3,"0"), seen=new Set(v.split(""));
      for(let p=0;p<3;p++) pos[p][Number(v[p])]++;
      seen.forEach(ch=>any[Number(ch)]++);
      pair01[Number(v.slice(0,2))]++; pair12[Number(v.slice(1,3))]++; exact.set(v,(exact.get(v)||0)+1);
    });
    return {weight,denom,pos,any,pair01,pair12,exact};
  });
  const last=String(draws.at(-1).number), trans=Array.from({length:3},()=>Array(10).fill(0)), transDen=Array(3).fill(0);
  for(let i=1;i<draws.length;i++){
    const prev=String(draws[i-1].number),cur=String(draws[i].number);
    for(let p=0;p<3;p++) if(prev[p]===last[p]){transDen[p]++;trans[p][Number(cur[p])]++;}
  }
  const items=[];
  for(let n=0;n<1000;n++){
    const number=String(n).padStart(3,"0"), d=number.split("").map(Number); let score=0; const reasons=[];
    stats.forEach((st,wi)=>{
      let positional=0,anywhere=0;
      for(let p=0;p<3;p++){positional+=st.pos[p][d[p]]/st.denom;anywhere+=st.any[d[p]]/st.denom;}
      const pair=(st.pair01[Number(number.slice(0,2))]/st.denom)+(st.pair12[Number(number.slice(1,3))]/st.denom);
      const exact=(st.exact.get(number)||0)/st.denom;
      score+=((positional/3)*58+(pair/2)*24+(anywhere/3)*12+exact*6)*st.weight;
      if(wi===0){if(positional/3>=.16) reasons.push("ตำแหน่งหลักเด่นใน 12 งวดล่าสุด");if(pair/2>=.08)reasons.push("คู่ตัวเลขมีแรงส่งระยะสั้น");}
    });
    let transScore=0,transParts=0;
    for(let p=0;p<3;p++) if(transDen[p]){transScore+=trans[p][d[p]]/transDen[p];transParts++;}
    if(transParts){const t=transScore/transParts;score+=t*10;if(t>=.18)reasons.push("สอดคล้องการเปลี่ยนหลักจากงวดล่าสุด");}
    items.push({number,aiScore:Math.round(score*10)/10,aiReasons:[...new Set(reasons)].slice(0,3)});
  }
  items.sort((a,b)=>b.aiScore-a.aiScore||a.number.localeCompare(b.number));
  const top=items.slice(0,Math.max(1,limit)).map((x,i)=>({...x,aiRank:i+1,aiDataCount:draws.length}));
  const result = {items:top,dataCount:draws.length,pending:false};
  PERF_CACHE.independentAI.set(cacheKey, result);
  return result;
}

function independentHistoryStatus(actual, profileId, date, limit = 10) {
  const prediction=generateIndependentAI(profileId,date,limit);
  if (prediction.pending) return {status:"pending", prediction};
  const value=String(actual || ""), canonical=canonical3(value);
  if (prediction.items.some(x=>x.number===value)) return {status:"exact",prediction};
  if (prediction.items.some(x=>canonical3(x.number)===canonical)) return {status:"reversed",prediction};
  return {status:"notfound",prediction};
}
function independentHistorySummary(draws, profileId, limit = 10) {
  const cacheKey = performanceKey("indSummary", profileId, null, limit, drawListPerformanceKey(draws));
  if (PERF_CACHE.independentSummary.has(cacheKey)) return PERF_CACHE.independentSummary.get(cacheKey);
  let hit=0,total=0;
  draws.forEach(draw=>{
    const result=independentHistoryStatus(draw.number,profileId,draw.date,limit);
    if (result.status==="pending") return;
    total++; if (result.status==="exact" || result.status==="reversed") hit++;
  });
  const summary = {hit,total,rate:total?Math.round(hit*1000/total)/10:0};
  PERF_CACHE.independentSummary.set(cacheKey, summary);
  return summary;
}

// V6.4 — Master AI / Meta Ensemble: เรียนรู้จาก Classic + AI L + AI อิสระ
function masterPriorDraws(profileId, beforeDate = null) {
  return state.actualDraws.filter(d => Number(d.profileId ?? 0) === Number(profileId) && /^\d{3}$/.test(String(d.number || "")) && (!beforeDate || d.date < beforeDate));
}
function masterAIWeights(profileId, beforeDate = null) {
  let targetDate = /^\d{4}-\d{2}-\d{2}$/.test(String(beforeDate || ""))
    ? String(beforeDate)
    : (/^\d{4}-\d{2}-\d{2}$/.test(String(state.calculationDate || "")) ? String(state.calculationDate) : isoDate());
  // Weekend on the live dashboard points to the next Monday because Today AI Weight is designed for Mon-Fri decisions.
  if (!beforeDate && !state.calculationDate) {
    let liveDay = new Date(`${targetDate}T12:00:00`).getDay();
    while (liveDay === 0 || liveDay === 6) {
      targetDate = shiftIsoDate(targetDate, 1);
      liveDay = new Date(`${targetDate}T12:00:00`).getDay();
    }
  }
  const targetDay = new Date(`${targetDate}T12:00:00`).getDay();
  const cacheKey = performanceKey("masterWeights", profileId, beforeDate || targetDate, 10, `weekday:${targetDay}`);
  if (PERF_CACHE.masterWeights.has(cacheKey)) return PERF_CACHE.masterWeights.get(cacheKey);

  const draws = masterPriorDraws(profileId, beforeDate)
    .filter(d => !targetDate || d.date < targetDate)
    .sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const aiFormula = getMasterEligibleAIFormula(profileId);

  const summaryFor = (engine, sample) => {
    if (!sample.length) return {hit:0,total:0,rate:0};
    if (engine === "classic") return formulaHistorySummary(sample, profileId, getOriginalFormula());
    if (engine === "aiL") return aiFormula ? formulaHistorySummary(sample, profileId, aiFormula) : {hit:0,total:0,rate:0};
    return independentHistorySummary(sample, profileId, 10);
  };
  const recentWeightedScore = engine => {
    let totalWeight = 0, score = 0;
    const windows = [];
    AI_HISTORY_WINDOWS.forEach(window => {
      const sample = draws.slice(-window.size);
      const summary = summaryFor(engine, sample);
      if (!summary.total) return;
      score += Number(summary.rate || 0) * window.weight;
      totalWeight += window.weight;
      windows.push({size:window.size, weight:window.weight, ...summary});
    });
    return {score:totalWeight ? score / totalWeight : 0, windows};
  };
  const weekdayScore = engine => {
    const sample = draws.filter(d => new Date(`${d.date}T12:00:00`).getDay() === targetDay).slice(-20);
    const summary = summaryFor(engine, sample);
    return {...summary, sampleCount:sample.length};
  };
  const buildEngine = engine => {
    const recent = recentWeightedScore(engine);
    const weekday = weekdayScore(engine);
    const overall = summaryFor(engine, draws.slice(-60));
    // Shrink weekday performance toward the recent baseline when Monday-Friday samples are still small.
    // This prevents a few lucky draws from taking over the weight too early.
    const weekdayTrust = Math.min(1, weekday.total / 10);
    const weekdayAdjusted = weekday.total
      ? (Number(weekday.rate || 0) * weekdayTrust) + (recent.score * (1 - weekdayTrust))
      : recent.score;
    // 40% weekday/profile behavior + 40% recent 12/30/60 form + 20% broader profile history.
    const score = (weekdayAdjusted * 0.40) + (recent.score * 0.40) + (Number(overall.rate || 0) * 0.20);
    return {score, weekday:{...weekday, adjusted:Math.round(weekdayAdjusted*10)/10}, recent, overall};
  };

  const metrics = {
    classic:buildEngine("classic"),
    aiL:aiFormula ? buildEngine("aiL") : {score:0,weekday:{hit:0,total:0,rate:0,adjusted:0},recent:{score:0,windows:[]},overall:{hit:0,total:0,rate:0}},
    independent:buildEngine("independent")
  };
  const smooth = x => Math.max(5, Number(x || 0));
  let raw = {
    classic:smooth(metrics.classic.score),
    aiL:aiFormula ? smooth(metrics.aiL.score) : 0,
    independent:smooth(metrics.independent.score)
  };
  if (state.masterAISettings?.adaptiveWeight === false) raw = {classic:30, aiL:aiFormula?40:0, independent:30};
  const total = raw.classic + raw.aiL + raw.independent || 1;
  const result = {
    classic:Math.round(raw.classic/total*1000)/10,
    aiL:Math.round(raw.aiL/total*1000)/10,
    independent:Math.round(raw.independent/total*1000)/10,
    samples:draws.length,
    rates:{classic:metrics.classic.overall.rate,aiL:metrics.aiL.overall.rate,independent:metrics.independent.overall.rate},
    targetDate,
    targetDay,
    targetDayName:DAYS_TH[targetDay],
    metrics
  };
  PERF_CACHE.masterWeights.set(cacheKey, result);
  return result;
}
function masterFormulaCandidates(profileId, formula, beforeDate = null, limit = 10) {
  let inputs = null;
  if (beforeDate) {
    const draw=state.actualDraws.find(d=>Number(d.profileId??0)===Number(profileId)&&d.date===beforeDate);
    inputs=getPredictionTable(profileId,beforeDate,draw)?.inputDigits || null;
  } else if (Array.isArray(state.lastInput) && state.lastInput.length===5 && state.lastInput.every(v=>/^\d$/.test(String(v)))) inputs=state.lastInput;
  const grid=inputs?formulaGrid(inputs.map(String),formula):null;
  if(!grid) return [];
  return findLResults(grid).slice(0,limit).map((x,i)=>({number:String(x.number),rank:i+1}));
}
function generateMasterAI(profileId, beforeDate = null, limit = 10) {
  const cacheKey = performanceKey("masterAI", profileId, beforeDate, limit);
  if (PERF_CACHE.masterAI.has(cacheKey)) return PERF_CACHE.masterAI.get(cacheKey);
  const weights=masterAIWeights(profileId,beforeDate);
  if(state.masterAISettings?.learning===false) {
    const pending = {items:[],pending:true,dataCount:weights.samples,weights};
    PERF_CACHE.masterAI.set(cacheKey, pending);
    return pending;
  }
  const free=generateIndependentAI(profileId,beforeDate,10);
  if(weights.samples<8||free.pending) {
    const pending = {items:[],pending:true,dataCount:weights.samples,weights};
    PERF_CACHE.masterAI.set(cacheKey, pending);
    return pending;
  }
  const classic=masterFormulaCandidates(profileId,getOriginalFormula(),beforeDate,10);
  const aiFormula=getMasterEligibleAIFormula(profileId);
  const aiL=aiFormula?masterFormulaCandidates(profileId,aiFormula,beforeDate,10):[];
  const map=new Map();
  const add=(list,key,weight,label)=>list.forEach((item,i)=>{const number=String(item.number),rank=Number(item.aiRank||item.rank||i+1),strength=Math.max(.1,(11-rank)/10);const row=map.get(number)||{number,masterScore:0,sources:[],sourceRanks:{}};row.masterScore+=weight*strength;if(!row.sources.includes(label))row.sources.push(label);row.sourceRanks[key]=rank;map.set(number,row);});
  add(classic,'classic',weights.classic,'Classic'); add(aiL,'aiL',weights.aiL,'AI L'); add(free.items,'independent',weights.independent,'AI อิสระ');
  const items=[...map.values()].sort((a,b)=>b.masterScore-a.masterScore||b.sources.length-a.sources.length||a.number.localeCompare(b.number)).slice(0,limit).map((x,i)=>({...x,masterRank:i+1,masterScore:Math.round(x.masterScore*10)/10,aiRank:i+1,aiScore:Math.round(x.masterScore*10)/10,aiDataCount:weights.samples}));
  const result = {items,pending:false,dataCount:weights.samples,weights};
  PERF_CACHE.masterAI.set(cacheKey, result);
  return result;
}
function masterHistoryStatus(actual, profileId, date, limit=10) {
  if(state.masterAISettings?.backtest===false) return {status:'pending',prediction:{items:[],pending:true}};
  const prediction=generateMasterAI(profileId,date,limit); if(prediction.pending)return {status:'pending',prediction};
  const value=String(actual||''),canonical=canonical3(value);
  if(prediction.items.some(x=>x.number===value))return {status:'exact',prediction};
  if(prediction.items.some(x=>canonical3(x.number)===canonical))return {status:'reversed',prediction};
  return {status:'notfound',prediction};
}
function masterSnapshotHistoryStatus(actual, profileId, date) {
  if(state.masterAISettings?.backtest===false) return {status:'pending',prediction:{items:[],pending:true}};
  const draw = state.actualDraws.find(d => Number(d.profileId ?? 0) === Number(profileId) && d.date === date);
  const table = getPredictionTable(profileId, date, draw);
  const snap = table?.masterPredictionSnapshot;
  if (!snap || snap.targetDate !== date || !Array.isArray(snap.items)) {
    return {status:'pending',prediction:{items:[],pending:true,snapshotMissing:true}};
  }
  const items=snap.items.map(number=>({number:String(number)}));
  const prediction={items,pending:false,snapshot:true,weights:snap.weights||null};
  const value=String(actual||''),canonical=canonical3(value);
  if(items.some(x=>x.number===value))return {status:'exact',prediction};
  if(items.some(x=>canonical3(x.number)===canonical))return {status:'reversed',prediction};
  return {status:'notfound',prediction};
}
function masterHistorySummary(draws, profileId, limit=10) {
  const cacheKey = performanceKey("masterSummary", profileId, null, limit, drawListPerformanceKey(draws));
  if (PERF_CACHE.masterSummary.has(cacheKey)) return PERF_CACHE.masterSummary.get(cacheKey);
  let hit=0,total=0; draws.forEach(draw=>{const r=masterHistoryStatus(draw.number,profileId,draw.date,limit);if(r.status==='pending')return;total++;if(r.status==='exact'||r.status==='reversed')hit++;});
  const summary = {hit,total,rate:total?Math.round(hit*1000/total)/10:0};
  PERF_CACHE.masterSummary.set(cacheKey, summary);
  return summary;
}
function formulaWinner4(originalStatus,aiStatus,independentStatus,masterStatus,hasAI=true){
  const c=[{label:'เดิม',status:originalStatus}];if(hasAI&&aiStatus!=='pending')c.push({label:'AI L',status:aiStatus});if(independentStatus!=='pending')c.push({label:'AI อิสระ',status:independentStatus});if(masterStatus!=='pending')c.push({label:'Master AI',status:masterStatus});
  const best=Math.max(...c.map(x=>formulaStatusScore(x.status)));const w=c.filter(x=>formulaStatusScore(x.status)===best);return w.length===1?w[0].label:'เสมอ';
}
function seededRandom(seed) {
  let x = seed >>> 0;
  return () => ((x = Math.imul(1664525, x) + 1013904223 >>> 0) / 4294967296);
}
function cloneFormula(formula) { return formula.map(row => row.map(cell => ({...cell}))); }
function createCandidateFormula(rand) {
  const base = getOriginalFormula();
  return base.map((row,r)=>row.map((cell,c)=>{
    if ((r===0&&c===0)||(r===1&&c===0)||(r===2&&c===0)) return {...cell};
    return {s: Math.floor(rand()*5), o: [-2,-1,0,1,2][Math.floor(rand()*5)]};
  }));
}
function mutateFormula(formula, rand, strength=0.16) {
  const out=cloneFormula(formula);
  out.forEach((row,r)=>row.forEach((cell,c)=>{
    if ((r===0&&c===0)||(r===1&&c===0)||(r===2&&c===0)) return;
    if (rand()<strength) cell.s=Math.floor(rand()*5);
    if (rand()<strength) cell.o=[-2,-1,0,1,2][Math.floor(rand()*5)];
  }));
  return out;
}
function crossoverFormula(a,b,rand) {
  return a.map((row,r)=>row.map((cell,c)=>((r===0&&c===0)||(r===1&&c===0)||(r===2&&c===0))?{...cell}:{...(rand()<.5?a[r][c]:b[r][c])}));
}
function formulaKey(f) { return f.flat().map(x=>`${x.s}:${x.o}`).join("|"); }
function evaluateFormulaWeighted(formula, samples) {
  const all=evaluateFormula(formula,samples);
  const recent10=evaluateFormula(formula,samples.slice(-10));
  const recent30=evaluateFormula(formula,samples.slice(-30));
  const exactBonus=samples.reduce((n,x)=>n+(formulaHistoryStatus(x.actual,x.inputs,formula)==="exact"?1:0),0);
  const exactRate=samples.length?exactBonus*100/samples.length:0;
  const score=(recent10.rate*.38)+(recent30.rate*.27)+(all.rate*.25)+(exactRate*.10);
  return {score:Math.round(score*10)/10,all,recent10,recent30,exactRate:Math.round(exactRate*10)/10};
}
function generateAIFormula(profileId) {
  const samples=getFormulaSamples(profileId);
  if(samples.length<8) return {error:`ต้องมีข้อมูลที่เชื่อมกับตารางอย่างน้อย 8 งวด (ขณะนี้ ${samples.length} งวด)`};
  const split=Math.max(5,Math.floor(samples.length*.7));
  const train=samples.slice(0,split), test=samples.slice(split);
  const original=getOriginalFormula();
  const seed=(profileId+1)*100003+samples.length*97+Number(samples.at(-1)?.date.replaceAll("-","")||1);
  const rand=seededRandom(seed);
  const populationSize=120, generations=22, eliteSize=18;
  let population=[cloneFormula(original)];
  const previous=state.aiFormulaLab?.[profileId];
  if(previous?.formula) population.push(cloneFormula(previous.formula));
  while(population.length<populationSize) population.push(createCandidateFormula(rand));
  let trials=0, bestEver=null;
  for(let gen=0;gen<generations;gen++){
    const unique=new Map();
    population.forEach(f=>unique.set(formulaKey(f),f));
    const ranked=[...unique.values()].map(formula=>{
      trials++;
      const trainFit=evaluateFormulaWeighted(formula,train);
      const testFit=evaluateFormulaWeighted(formula,test);
      const overfit=Math.max(0,trainFit.score-testFit.score);
      const fitness=(testFit.score*.62)+(trainFit.score*.38)-(overfit*.22);
      return {formula,trainFit,testFit,fitness:Math.round(fitness*10)/10};
    }).sort((a,b)=>b.fitness-a.fitness||b.testFit.score-a.testFit.score||b.trainFit.score-a.trainFit.score);
    if(!bestEver||ranked[0].fitness>bestEver.fitness) bestEver=ranked[0];
    const elite=ranked.slice(0,eliteSize);
    population=elite.map(x=>cloneFormula(x.formula));
    while(population.length<populationSize){
      const pa=elite[Math.floor(rand()*elite.length)].formula;
      const pb=elite[Math.floor(rand()*elite.length)].formula;
      population.push(mutateFormula(crossoverFormula(pa,pb,rand),rand,.12+(gen<6?.08:0)));
    }
  }
  const finalPool=[bestEver.formula,original,...population.slice(0,60)];
  const seen=new Map();
  finalPool.forEach(f=>seen.set(formulaKey(f),f));
  const finalists=[...seen.values()].map(formula=>{
    trials++;
    const trainFit=evaluateFormulaWeighted(formula,train),testFit=evaluateFormulaWeighted(formula,test);
    const overfit=Math.max(0,trainFit.score-testFit.score);
    return {formula,trainFit,testFit,fitness:Math.round(((testFit.score*.65)+(trainFit.score*.35)-(overfit*.25))*10)/10};
  }).sort((a,b)=>b.fitness-a.fitness||b.testFit.score-a.testFit.score);
  const top10=finalists.slice(0,10);
  const winner=top10[0];
  const originalTrain=evaluateFormula(original,train), originalTest=evaluateFormula(original,test);
  const version=Number(previous?.version||0)+1;
  state.aiFormulaLab=state.aiFormulaLab||{};
  state.aiFormulaLab[profileId]={
    formula:winner.formula,createdAt:Date.now(),sampleCount:samples.length,
    train:evaluateFormula(winner.formula,train),test:evaluateFormula(winner.formula,test),
    originalTrain,originalTest,trials,version,engine:"Evolution Ensemble",
    windows:{all:winner.testFit.all,recent10:winner.testFit.recent10,recent30:winner.testFit.recent30,exactRate:winner.testFit.exactRate},
    topCandidates:top10.map((x,i)=>({rank:i+1,formula:x.formula,fitness:x.fitness,train:x.trainFit.score,test:x.testFit.score})),
    autoLearnedAt:Date.now()
  };
  saveState();
  return state.aiFormulaLab[profileId];
}

function autoEvolveAfterActualSave(profileId) {
  const id = Number(profileId);
  const previous = state.aiFormulaLab?.[id] ? JSON.parse(JSON.stringify(state.aiFormulaLab[id])) : null;
  const previousMode = getActiveFormulaMode(id);
  const previousCheck = formulaEligibility(previous);
  const result = generateAIFormula(id);
  if (result?.error) return {trained:false, reason:result.error};

  const check = formulaEligibility(result);
  const previousScore = previous?.test?.rate ?? result.originalTest?.rate ?? 0;
  const newScore = result?.test?.rate ?? 0;
  const improvement = Math.round((newScore - previousScore) * 10) / 10;

  // Approved model: keep the existing rule. It is offered only when it passes
  // eligibility and improves on the model that was already stored.
  if (check.allowed && improvement > 0) {
    result.deploymentStatus = "approved";
    saveState();
    clearPerformanceCaches();
    activeRenderPerfSignature = "";
    return {trained:true, recommended:true, result, improvement, previousScore, newScore, previousMode};
  }

  // V6.4.8 bug fix: the first learned AI-L must NOT be deleted merely because
  // it is still below the +5% activation threshold. Keep it as a candidate so
  // History/backtest can show AI-L, while Calculate and Master AI stay protected.
  if (!previous) {
    result.deploymentStatus = "candidate";
    saveState();
    clearPerformanceCaches();
    activeRenderPerfSignature = "";
    return {trained:true, recommended:false, candidate:true, result, reason:check.reason};
  }

  // If both old and new models are candidates and Calculate is still Original,
  // retain an improving candidate for continued learning. Never replace an active
  // or previously approved model with an unapproved candidate.
  if (previousMode !== "ai" && !previousCheck.allowed && !check.allowed && improvement > 0) {
    result.deploymentStatus = "candidate";
    saveState();
    clearPerformanceCaches();
    activeRenderPerfSignature = "";
    return {trained:true, recommended:false, candidate:true, improved:true, result, improvement, previousScore, newScore, reason:check.reason};
  }

  // Otherwise preserve the previous model exactly, preventing quality regression.
  state.aiFormulaLab[id] = previous;
  saveState();
  clearPerformanceCaches();
  activeRenderPerfSignature = "";
  return {trained:true, recommended:false, reason:check.allowed ? "สูตรรุ่นใหม่ยังไม่ดีกว่าสูตรเดิม" : check.reason};
}

// Recover profiles affected by the V6.4.7 deletion bug without changing data,
// formula thresholds, or the active Calculate formula. Runs only when AI/History
// is opened, only when >= 8 usable samples exist, and only if AI-L is missing.
function scheduleMissingAIFormulaRecovery(profileId = state.activeProfile) {
  const id = Number(profileId);
  if (state.aiFormulaLab?.[id]?.formula || AI_FORMULA_RECOVERY_IN_FLIGHT.has(id)) return;
  if (getFormulaSamples(id).length < 8) return;
  AI_FORMULA_RECOVERY_IN_FLIGHT.add(id);
  window.setTimeout(() => {
    let recovered = false;
    try {
      if (!state.aiFormulaLab?.[id]?.formula) {
        const result = generateAIFormula(id);
        if (!result?.error) {
          result.deploymentStatus = formulaEligibility(result).allowed ? "approved" : "candidate";
          saveState();
          clearPerformanceCaches();
          activeRenderPerfSignature = "";
          recovered = true;
        }
      }
    } catch (error) {
      console.error("AI-L recovery failed", error);
    } finally {
      AI_FORMULA_RECOVERY_IN_FLIGHT.delete(id);
      if (recovered && Number(state.activeProfile) === id && ["weekly", "history"].includes(state.currentView)) render();
    }
  }, 120);
}

function renderFormulaGrid(formula, inputs=["1","2","3","4","5"]) {
  return gridHtml(formulaGrid(inputs, formula));
}

function normalizeWebResults(payload) {
  const rows = Array.isArray(payload) ? payload : (payload?.results || payload?.data || payload?.draws || []);
  if (!Array.isArray(rows)) throw new Error("รูปแบบข้อมูลไม่ถูกต้อง: ต้องเป็น Array หรือมี results/data/draws");
  return rows.map((row, index) => {
    const rawDate = row.date || row.drawDate || row.result_date || row.date_iso;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(rawDate || "")) ? String(rawDate) : "";
    const number = String(row.number ?? row.threeDigit ?? row.three_digit ?? row.result3 ?? "").replace(/\D/g, "").slice(-3).padStart(3,"0");
    const twoDigit = String(row.twoDigit ?? row.two_digit ?? row.result2 ?? row.bottom2 ?? "").replace(/\D/g, "").slice(-2).padStart(2,"0");
    if (!date || !/^\d{3}$/.test(number) || !/^\d{2}$/.test(twoDigit)) return null;
    return { date, number, twoDigit, sourceId: String(row.id ?? row.drawId ?? `${date}-${index}`) };
  }).filter(Boolean);
}

function importWebResults(rows, profileId) {
  let added=0, updated=0, skipped=0;
  const profileName=state.profiles[profileId] || `Profile ${profileId+1}`;
  [...rows].sort((a,b)=>a.date.localeCompare(b.date)).forEach(row=>{
    let existing=state.actualDraws.find(x=>Number(x.profileId)===profileId && x.date===row.date);
    if (existing) {
      if (existing.number===row.number && existing.twoDigit===row.twoDigit) { skipped++; return; }
      if (existing.source==="web") {
        existing.number=row.number; existing.twoDigit=row.twoDigit; existing.updatedAt=Date.now(); existing.webSourceId=row.sourceId; updated++;
      } else { skipped++; return; }
    } else {
      existing={id:uid(),profileId,profileName,date:row.date,number:row.number,twoDigit:row.twoDigit,note:"Sync Web",referenceTableId:"",source:"web",webSourceId:row.sourceId,createdAt:Date.now()};
      state.actualDraws.push(existing); added++;
    }
    upsertDailyTableFromActual(existing);
    syncAutoLHistoryForActual(existing);
  });
  syncAutoLHistoryForProfile(profileId);
  state.webSync={...(state.webSync||{}),lastSyncAt:Date.now(),lastStatus:"success",importedCount:Number(state.webSync?.importedCount||0)+added};
  saveState();
  return {added,updated,skipped};
}

async function syncWebResults() {
  const endpoint=(document.getElementById("webSyncEndpoint")?.value || "").trim();
  if (!endpoint) return alert("กรุณาใส่ URL ของ JSON/API ก่อน\n\nเว็บผลหวยทั่วไปอาจบล็อกการดึงตรงจากเบราว์เซอร์ จึงต้องใช้ URL ที่อนุญาต CORS หรือ API ของเราเอง");
  state.webSync={...(state.webSync||{}),endpoint,lastStatus:"syncing"}; saveState(); render();
  try {
    const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),15000);
    const response=await fetch(endpoint,{headers:{Accept:"application/json"},cache:"no-store",signal:controller.signal}); clearTimeout(timer);
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows=normalizeWebResults(await response.json());
    if(!rows.length) throw new Error("ไม่พบรายการที่มี date, เลข 3 ตัว และเลข 2 ตัวครบ");
    const result=importWebResults(rows,Number(state.activeProfile));
    showToast(`✓ Sync สำเร็จ เพิ่ม ${result.added} • อัปเดต ${result.updated} • ข้าม ${result.skipped}`); render();
  } catch(err) {
    state.webSync={...(state.webSync||{}),lastStatus:"error",lastError:String(err?.message||err)}; saveState(); render();
    alert(`Sync ไม่สำเร็จ: ${err?.message||err}\n\nตรวจว่า URL ส่ง JSON และอนุญาต CORS หรือใช้ปุ่มนำเข้าไฟล์ JSON แทน`);
  }
}

async function importWebJsonFile(file) {
  try {
    const rows=normalizeWebResults(JSON.parse(await file.text()));
    const result=importWebResults(rows,Number(state.activeProfile));
    showToast(`✓ นำเข้าสำเร็จ เพิ่ม ${result.added} • อัปเดต ${result.updated} • ข้าม ${result.skipped}`); render();
  } catch(err) { alert(`นำเข้าไม่สำเร็จ: ${err?.message||err}`); }
}

function renderWeekly() {
  const profileId=Number(state.activeProfile), samples=getFormulaSamples(profileId);
  const saved=state.aiFormulaLab?.[profileId] || null;
  const original=getOriginalFormula();
  const allOriginal=evaluateFormula(original,samples);
  const allAI=saved?evaluateFormula(saved.formula,samples):null;
  const eligibility=formulaEligibility(saved);
  const delta=saved?eligibility.delta:0;
  const activeMode=getActiveFormulaMode(profileId);
  return `<section class="card ai-lab">
    <div class="section-head"><h2>AI Table Lab</h2><span>ใช้วิเคราะห์ ${samples.length} งวด</span></div>
    ${profileTabs()}
    ${(()=>{const actualCount=state.actualDraws.filter(x=>Number(x.profileId)===profileId).length;const usableCount=samples.length;const testCount=saved?.trials||0;return `<div class="ai-data-center internal-learning">
      <div class="section-head compact"><div><h3>AI Data Center</h3><p>เรียนรู้จากผลจริงและตาราง History ภายในเครื่อง</p></div><span class="sync-state success">พร้อม</span></div>
      <div class="dataset-counts internal-counts"><div><b>${actualCount}</b><span>ผลจริงทั้งหมด</span></div><div><b>${usableCount}</b><span>ใช้วิเคราะห์</span></div><div><b>${testCount.toLocaleString()}</b><span>ทดสอบสูตร</span></div></div>
      <p class="internal-learning-note">ทุกครั้งที่บันทึกผล 3 ตัว / 2 ตัว ระบบจะเพิ่มข้อมูลให้ AI อัตโนมัติ โดยไม่ต้อง Sync จากเว็บ</p>
    </div>`})()}
    <div class="formula-active-status ${activeMode}"><div><span>สูตรที่กำลังใช้ในหน้า Calculate</span><b>${activeMode === "ai" ? getAIFormulaDisplayName(profileId) : "สูตรดั้งเดิม (Original)"}</b></div><span class="protected-formula">${activeMode === "ai" ? "🤖 AI Active" : "🔒 Original Active"}</span></div>
    <div class="formula-strategy-panel" aria-label="เลือกสูตรที่ใช้คำนวณ">
      <div class="strategy-heading"><div><b>เลือกสูตรสำหรับหน้า Calculate</b><span>เปลี่ยนได้ตลอด และมีผลกับ Profile ${escapeHtml(state.profiles[profileId]||String(profileId))} เท่านั้น</span></div><strong>${activeMode === "ai" ? "AI" : "ORIGINAL"}</strong></div>
      <div class="strategy-options">
        <button type="button" class="strategy-option ${activeMode==='original'?'selected':''}" data-formula-mode="original" aria-pressed="${activeMode==='original'}">
          <span class="strategy-radio">${activeMode==='original'?'●':'○'}</span><span><b>Original Formula</b><small>สูตรดั้งเดิม • คะแนนย้อนหลัง ${allOriginal.rate}%</small></span><em>ปลอดภัย</em>
        </button>
        <button type="button" class="strategy-option ${activeMode==='ai'?'selected':''} ${!saved?.formula||!eligibility.allowed?'disabled':''}" data-formula-mode="ai" aria-pressed="${activeMode==='ai'}" ${!saved?.formula||!eligibility.allowed?'disabled':''}>
          <span class="strategy-radio">${activeMode==='ai'?'●':'○'}</span><span><b>${getAIFormulaDisplayName(profileId)}</b><small>${saved?.formula?`คะแนนย้อนหลัง ${allAI.rate}% • ${eligibility.reason}`:'ยังไม่มีสูตร AI พร้อมใช้งาน'}</small></span><em>${saved?.formula&&eligibility.allowed?'พร้อมใช้':'ยังล็อก'}</em>
        </button>
      </div>
      <p class="strategy-note">ระบบจะไม่เปลี่ยนสูตรเองโดยไม่แจ้งให้ทราบ สูตรที่เลือกจะแสดงบนหน้า Calculate และใช้คำนวณตารางใหม่ทันที</p>
    </div>
    <div class="ai-intro"><b>AI Evolution Engine</b><p>สร้างหลายตารางแล้วให้แข่งขัน ผสมสูตรและ Mutation หลายรุ่น จากนั้นเลือก Top 10 และใช้ตารางที่ผ่านชุดทดสอบดีที่สุด สูตรดั้งเดิมจะถูกเก็บไว้เสมอ</p></div>
    <div class="evolution-flow"><span>120 ตาราง</span><i>→</i><span>22 รุ่น</span><i>→</i><span>Top 10</span><i>→</i><span>ผู้ชนะ</span></div>
    <div class="formula-compare">
      <article class="formula-card ${activeMode==='original'?'currently-active':''}"><div class="formula-title"><span>สูตรดั้งเดิม</span><strong>${allOriginal.rate}%</strong></div>${renderFormulaGrid(original)}<p>${formulaText(original)}</p><small>L Match รวม ${allOriginal.hit}/${allOriginal.total}</small></article>
      <article class="formula-card ai-formula ${saved?'ready':''} ${activeMode==='ai'?'currently-active':''}"><div class="formula-title"><span>สูตร AI</span><strong>${saved?`${allAI.rate}%`:'—'}</strong></div>${saved?renderFormulaGrid(saved.formula):'<div class="ai-empty">ระบบจะสร้างสูตรให้อัตโนมัติเมื่อบันทึกผลจริงครบตามจำนวน</div>'}<p>${saved?formulaText(saved.formula):'ยังไม่มีข้อมูลเพียงพอสำหรับสร้างสูตร AI'}</p><small>${saved?`L Match รวม ${allAI.hit}/${allAI.total}`:'สูตรดั้งเดิมยังคงใช้งานตามปกติ'}</small></article>
    </div>
    ${saved?`<div class="ai-test-result ${delta>0?'better':delta<0?'worse':''}"><div><span>ผลทดสอบ 30%</span><b>${saved.originalTest.rate}% → ${saved.test.rate}%</b></div><strong>${delta>0?'+':''}${delta}%</strong></div>
      <div class="ai-metrics"><div><b>${saved.trials.toLocaleString()}</b><span>สูตรที่ทดลอง</span></div><div><b>${saved.train.rate}%</b><span>Training</span></div><div><b>${saved.test.rate}%</b><span>Test</span></div></div>
      <div class="ai-engine-meta"><b>${escapeHtml(saved.engine||"AI Search")} • V${saved.version||1}</b><span>10 งวด ${saved.windows?.recent10?.rate??saved.test.rate}% • 30 งวด ${saved.windows?.recent30?.rate??saved.test.rate}% • Exact ${saved.windows?.exactRate??0}%</span></div>
      ${saved.topCandidates?.length?`<div class="candidate-list"><div class="candidate-head"><b>Top Candidates</b><span>คะแนนทดสอบ</span></div>${saved.topCandidates.slice(0,5).map(x=>`<div><span>#${x.rank}</span><b>${x.test}%</b><small>Fitness ${x.fitness}</small></div>`).join("")}</div>`:""}
      <div class="formula-decision ${eligibility.allowed?'approved':'locked'}"><b>${eligibility.allowed?'✓ พร้อมใช้งาน':'🔒 ยังไม่แนะนำให้ใช้'}</b><span>${eligibility.reason}</span></div>
      <p class="ai-updated">อัปเดต ${new Date(saved.createdAt).toLocaleString('th-TH')} • ผลที่ได้เป็นสถิติย้อนหลัง ไม่รับประกันงวดถัดไป</p>
      <div class="formula-decision approved"><b>✓ ระบบอัตโนมัติ</b><span>บันทึกผลจริงเพียงครั้งเดียว AI จะเรียนรู้ ทดสอบ และเสนอสูตรใหม่เฉพาะเมื่อดีกว่าสูตรที่ใช้อยู่</span></div>`:'<div class="formula-decision locked"><b>ระบบอัตโนมัติพร้อมทำงาน</b><span>เมื่อมีข้อมูลเชื่อมกับตารางอย่างน้อย 8 งวด ระบบจะเริ่มพัฒนาสูตรให้เอง</span></div>'}
  </section>`;
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
function getLatestAvailableTableBefore(profileId, resultDate) {
  if (!resultDate) return null;
  return (state.dailyTables || [])
    .filter(t => Number(t.profileId) === Number(profileId) && t.date && t.date < resultDate)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || null;
}
function resolveReferenceTable(profileId, resultDate, actualDraw = null) {
  const draw = actualDraw || state.actualDraws.find(x => Number(x.profileId ?? 0) === Number(profileId) && x.date === resultDate);
  if (draw?.referenceTableId) {
    const manualTable = state.dailyTables.find(t => t.id === draw.referenceTableId && Number(t.profileId) === Number(profileId)) || null;
    return { table: manualTable, expectedDate: manualTable?.date || "", mode: "manual", fallback: false };
  }
  const expectedDate = getExpectedReferenceDate(resultDate);
  const exactTable = getDailyTable(profileId, expectedDate);
  if (exactTable) return { table: exactTable, expectedDate, mode: "auto", fallback: false };
  const fallbackTable = getLatestAvailableTableBefore(profileId, resultDate);
  return { table: fallbackTable, expectedDate, mode: "auto", fallback: Boolean(fallbackTable) };
}
function getPredictionTable(profileId, resultDate, actualDraw = null) {
  return resolveReferenceTable(profileId, resultDate, actualDraw).table;
}

// V6.6.9 — Historical AI must use the model/prediction that existed before the result.
// Never fall back to today's AI model for an old draw, because that would rewrite past winners.
function getHistoricalAIFormula(profileId, resultDate, actualDraw = null) {
  const table = getPredictionTable(profileId, resultDate, actualDraw);
  if (!table) return null;
  if (Array.isArray(table.aiFormulaSnapshot)) return table.aiFormulaSnapshot;
  // Older tables only have formulaSnapshot. It is safe as AI-L history only when the table explicitly used AI mode.
  if (table.formulaMode === "ai" && Array.isArray(table.formulaSnapshot)) return table.formulaSnapshot;
  return null;
}
function getNextBusinessDate(date) {
  if (!date) return "";
  const d = new Date(`${date}T12:00:00`);
  do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6);
  return isoDate(d);
}
function saveAIPredictionSnapshotsForTable(table) {
  if (!table) return;
  const profileId = Number(table.profileId ?? 0);
  const aiFormula = state.aiFormulaLab?.[profileId]?.formula || null;
  table.aiFormulaSnapshot = aiFormula ? cloneFormula(aiFormula) : null;
  const targetDate = getNextBusinessDate(table.date);
  table.aiSnapshotTargetDate = targetDate;
  try {
    const master = generateMasterAI(profileId, targetDate, 10);
    table.masterPredictionSnapshot = master?.pending ? null : {
      targetDate,
      items:(master.items || []).map(x => String(x.number)),
      weights: master.weights ? {classic:master.weights.classic, aiL:master.weights.aiL, independent:master.weights.independent} : null,
      createdAt:Date.now()
    };
  } catch (error) {
    console.error("Master snapshot failed", error);
    table.masterPredictionSnapshot = null;
  }
  table.aiSnapshotCreatedAt = Date.now();
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
    updatedAt: Date.now(),
    formulaMode: getActiveFormulaMode(profileId),
    formulaSnapshot: getActiveFormula(profileId)
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
    updatedAt: Date.now(),
    formulaMode: getActiveFormulaMode(profileId),
    formulaSnapshot: getActiveFormula(profileId)
  };
  if (oldIndex >= 0) state.records[oldIndex] = record;
  else state.records.push(record);
}


function tableStatusLabel(status) {
  return ({pending:"Pending", exact:"Exact", swap:"เลขกลับ", notfound:"Not Found"})[status] || status;
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

function buildHistoryChampionSummary(originalSummary, aiSummary, independentSummary, masterSummary) {
  const candidates = [
    { key:"original", label:"Classic", summary:originalSummary },
    ...(aiSummary ? [{ key:"ai", label:"AI L", summary:aiSummary }] : []),
    ...(independentSummary?.total ? [{ key:"independent", label:"AI อิสระ", summary:independentSummary }] : []),
    ...(masterSummary?.total ? [{ key:"master", label:"Master AI", summary:masterSummary }] : [])
  ].filter(x => x.summary && Number(x.summary.total || 0) > 0);
  if (!candidates.length) return { winner:null, items:[] };
  const bestRate = Math.max(...candidates.map(x => Number(x.summary.rate || 0)), 0.1);
  const maxTotal = Math.max(...candidates.map(x => Number(x.summary.total || 0)), 1);
  const items = candidates.map(x => {
    const accuracyPart = (Number(x.summary.rate || 0) / bestRate) * 80;
    const coveragePart = (Number(x.summary.total || 0) / maxTotal) * 20;
    return { ...x, championScore:Math.round(Math.min(100, accuracyPart + coveragePart)) };
  }).sort((a,b) => Number(b.summary.rate||0) - Number(a.summary.rate||0) || Number(b.summary.total||0) - Number(a.summary.total||0));
  return { winner:items[0] || null, items };
}

function getHistoryChampionForProfile(profileId = state.activeProfile) {
  const selectedProfile = Number(profileId);
  const draws = (state.actualDraws || []).filter(d => Number(d.profileId ?? 0) === selectedProfile);
  const originalSummary = formulaHistorySummary(draws, selectedProfile, getOriginalFormula());
  const aiFormula = state.aiFormulaLab?.[selectedProfile]?.formula || null;
  const aiSummary = aiFormula ? formulaHistorySummary(draws, selectedProfile, aiFormula) : null;
  const independentSummary = independentHistorySummary(draws, selectedProfile, 10);
  const masterSummary = masterHistorySummary(draws, selectedProfile, 10);
  return buildHistoryChampionSummary(originalSummary, aiSummary, independentSummary, masterSummary);
}

function renderHistoryChampion(champion) {
  if (!champion?.winner) return "";
  const winner = champion.winner;
  return `<div class="history-champion-card">
    <div class="history-champion-head"><span class="history-champion-trophy">🏆</span><div><small>History Champion</small><b>Winner: ${escapeHtml(winner.label)}</b></div><strong>${winner.summary.rate}%</strong></div>
    <div class="history-champion-scores">${champion.items.map((x,i)=>`<div class="history-champion-score ${i===0?'winner':''}"><span>${i===0?'🥇':i===1?'🥈':'🥉'} ${escapeHtml(x.label)}</span><b>${x.championScore}</b><small>Champion Score</small></div>`).join("")}</div>
    <p>คะแนนนี้ใช้เปรียบเทียบภายใน History ปัจจุบัน โดยให้น้ำหนักความแม่น 80% และจำนวนงวดที่มีข้อมูล 20%</p>
  </div>`;
}

function renderHistory() {
  const selectedProfile = Number(state.activeProfile);
  const selectedName = state.profiles[selectedProfile] || `Profile ${selectedProfile + 1}`;
  const selectedActualDraws = state.actualDraws.filter(r => Number(r.profileId ?? 0) === selectedProfile);
  const selectedRecords = state.records
    .filter(r => Number(r.profileId) === selectedProfile && r.status !== "notfound")
    .sort((a,b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0));
  const activeTab = state.historyTab === "l" ? "l" : "results";
  const formulaMode = ["original", "ai", "independent", "master", "compare"].includes(state.historyFormulaMode) ? state.historyFormulaMode : "compare";
  const aiSaved = state.aiFormulaLab?.[selectedProfile];
  const originalFormula = getOriginalFormula();
  const aiFormula = aiSaved?.formula || null;
  const originalSummary = formulaHistorySummary(selectedActualDraws, selectedProfile, originalFormula);
  const aiSummary = aiFormula ? formulaHistorySummary(selectedActualDraws, selectedProfile, aiFormula) : null;
  const independentSummary = independentHistorySummary(selectedActualDraws, selectedProfile, 10);
  const masterSummary = masterHistorySummary(selectedActualDraws, selectedProfile, 10);
  const champion = buildHistoryChampionSummary(originalSummary, aiSummary, independentSummary, masterSummary);

  const resultRows = [...selectedActualDraws]
    .sort((a,b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0))
    .map(r => {
      const comparison = getHistoryComparisonStatuses(r, selectedProfile);
      const originalStatus = comparison.classic;
      const aiStatus = comparison.aiL;
      const independentStatus = comparison.independent;
      const masterStatus = comparison.master;
      const day = DAYS_SHORT[new Date(`${r.date}T12:00:00`).getDay()];
      const winner = formulaWinner4(originalStatus, aiStatus, independentStatus, masterStatus, Boolean(aiFormula));
      // V6.5.0 UI only: status colors are shared across every model (Hit/Rev/Miss).
      // The winner itself is still calculated exclusively by formulaWinner4 above.
      const winnerKey = ({"เดิม":"classic","AI L":"ail","AI อิสระ":"ind","Master AI":"master"})[winner] || "tie";
      const statusCell = (status, model="") => `<span class="status ${status} model-${model || "neutral"}">${compactHistoryStatusLabel(status)}</span>`;
      const rowWinnerClass = "";
      return `<button class="result-history-row formula-${formulaMode}${rowWinnerClass}" data-actual-draw="${r.id}">
        <span class="result-date"><b>${compactHistoryDate(r.date)}</b><small>${day}</small></span>
        <strong>${escapeHtml(r.number || "---")}</strong>
        <strong>${escapeHtml(r.twoDigit || "--")}</strong>
        ${formulaMode === "original" ? statusCell(originalStatus,"classic") : ""}
        ${formulaMode === "ai" ? (aiFormula ? statusCell(aiStatus,"ail") : '<span class="status pending model-ail">—</span>') : ""}
        ${formulaMode === "independent" ? statusCell(independentStatus,"ind") : ""}
        ${formulaMode === "master" ? statusCell(masterStatus,"master") : ""}
        ${formulaMode === "compare" ? `${statusCell(originalStatus,"classic")}${aiFormula ? statusCell(aiStatus,"ail") : '<span class="status pending model-ail">—</span>'}${statusCell(independentStatus,"ind")}${statusCell(masterStatus,"master")}<span class="formula-winner winner-${winnerKey}">${compactHistoryWinnerLabel(winner)}</span>` : ""}
      </button>`;
    }).join("");

  const lRows = selectedRecords.map(r => `<article class="history-item" data-record="${r.id}">
    <div><small>${formatDateTH(r.date)} • ${DAYS_TH[new Date(`${r.date}T12:00:00`).getDay()]}${r.autoGenerated ? " • Auto Match" : ""}</small>
    <h3>${escapeHtml(r.selectedNumber || "-")} → ${escapeHtml(r.actualResult || "-")}</h3>
    <p>${escapeHtml(r.patternId || "-")} • ${escapeHtml(r.patternName || "-")} • Actual ${escapeHtml(r.actualResult || "-")}</p></div>
    <span class="status ${r.status}">${statusLabel(r.status)}</span>
  </article>`).join("");

  return `<section class="card history-hub">
    <div class="section-head"><h2>History</h2><span>${activeTab === "results" ? `ผลจริงทั้งหมด ${selectedActualDraws.length} • ใช้วิเคราะห์ ${originalSummary.total}` : `History L ${selectedRecords.length} รายการ`}</span></div>
    ${profileTabs()}
    <div class="history-mode-tabs">
      <button class="history-mode-btn ${activeTab === "results" ? "active" : ""}" data-history-tab="results">ผลย้อนหลัง</button>
      <button class="history-mode-btn ${activeTab === "l" ? "active" : ""}" data-history-tab="l">History L</button>
    </div>
    ${activeTab === "results" ? `
      <div class="profile-filter-summary"><b style="color:${profileColor(selectedProfile)}">${escapeHtml(selectedName)}</b><span>เปรียบเทียบ L Match</span></div>
      <div class="formula-summary-grid v6-three-way">
        <div class="formula-summary original"><span>สูตรดั้งเดิม</span><b>${originalSummary.rate}%</b><small>${originalSummary.hit}/${originalSummary.total} งวด</small></div>
        <div class="formula-summary ai"><span>AI L</span><b>${aiSummary ? `${aiSummary.rate}%` : "—"}</b><small>${aiSummary ? `${aiSummary.hit}/${aiSummary.total} งวด` : "ยังไม่มีสูตร AI"}</small></div>
        <div class="formula-summary independent"><span>AI อิสระ Top10</span><b>${independentSummary.total ? `${independentSummary.rate}%` : "—"}</b><small>${independentSummary.total ? `${independentSummary.hit}/${independentSummary.total} งวด` : "ต้องมี History ก่อนหน้า ≥ 8 งวด"}</small></div>
        <div class="formula-summary master"><span>Master AI Top10</span><b>${masterSummary.total ? `${masterSummary.rate}%` : "—"}</b><small>${masterSummary.total ? `${masterSummary.hit}/${masterSummary.total} งวด` : "กำลังเรียนรู้จาก 3 ระบบ"}</small></div>
      </div>
      ${renderHistoryChampion(champion)}
      <div class="formula-view-tabs">
        <button class="formula-view-btn ${formulaMode === "original" ? "active" : ""}" data-formula-mode="original">Classic</button>
        <button class="formula-view-btn ${formulaMode === "ai" ? "active" : ""}" data-formula-mode="ai">AI L</button>
        <button class="formula-view-btn ${formulaMode === "independent" ? "active" : ""}" data-formula-mode="independent">AI อิสระ</button>
        <button class="formula-view-btn ${formulaMode === "master" ? "active" : ""}" data-formula-mode="master">Master AI</button>
        <button class="formula-view-btn ${formulaMode === "compare" ? "active" : ""}" data-formula-mode="compare">Compare</button>
      </div>
      <div class="history-action-grid">
        <button id="btnAddActualDraw" class="btn primary full actual-add-button" style="--profile-color:${profileColor(selectedProfile)}">＋ บันทึกผล</button>
        <button id="btnImportImageSandbox" class="btn secondary full import-image-button">📷 นำเข้ารูป</button>
      </div>
      <input id="importImageInput" type="file" accept="image/*,.heic,.heif" multiple hidden>
      <p class="import-sandbox-note">Import Sandbox: อ่านรูปและให้ตรวจสอบก่อนเท่านั้น ยังไม่เขียนลง History จนกด “ยืนยันบันทึก”</p>
      <div class="result-history-table formula-table-${formulaMode}">
        <div class="result-history-head formula-${formulaMode}"><span>Date</span><span>3D</span><span>2D</span>${formulaMode === "original" ? "<span>CLS</span>" : ""}${formulaMode === "ai" ? "<span>AIL</span>" : ""}${formulaMode === "independent" ? "<span>IND</span>" : ""}${formulaMode === "master" ? "<span>MAI</span>" : ""}${formulaMode === "compare" ? "<span>CLS</span><span>AIL</span><span>IND</span><span>MAI</span><span>Win</span>" : ""}</div>
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
  const matchPoints = num(c.exactPoints, d.exactPoints);
  return {
    exactPoints: matchPoints,
    // Match และ Reverse คือเลขชุดเดียวกัน จึงใช้น้ำหนักเท่ากันเสมอ
    reversedPoints: matchPoints,
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

function getProfileAIDayScore(profileId, days) {
  const windowDays = [7, 14, 30, 90, 180].includes(Number(days)) ? Number(days) : 7;
  const linkedDraws = state.actualDraws
    .filter(d => Number(d.profileId ?? 0) === Number(profileId) && /^\d{4}-\d{2}-\d{2}$/.test(String(d.date || "")) && getPredictionTable(profileId, d.date))
    .sort((a,b) => String(b.date).localeCompare(String(a.date)));
  if (!linkedDraws.length) return { score:0, samples:0, hits:0 };
  const anchorDate = String(linkedDraws[0].date);
  const startDate = shiftIsoDate(anchorDate, -(windowDays - 1));
  const sample = linkedDraws.filter(d => String(d.date) >= startDate && String(d.date) <= anchorDate);
  if (!sample.length) return { score:0, samples:0, hits:0 };
  const hitIds = new Set(
    state.records
      .filter(r => Number(r.profileId) === Number(profileId) && (r.status === "exact" || r.status === "swap"))
      .map(r => r.sourceActualDrawId)
  );
  const hits = sample.reduce((sum, draw) => sum + (hitIds.has(draw.id) ? 1 : 0), 0);
  return { score:(hits * 100) / sample.length, samples:sample.length, hits };
}

function getProfileAIRecommendation(profileId) {
  const stat = getProfileAnalysisScore(profileId);
  const w7 = getProfileAIDayScore(profileId, 7);
  const w14 = getProfileAIDayScore(profileId, 14);
  const w30 = getProfileAIDayScore(profileId, 30);
  const w90 = getProfileAIDayScore(profileId, 90);
  const w180 = getProfileAIDayScore(profileId, 180);
  const windowScores = [w7, w14, w30, w90, w180].filter(x => x.samples > 0).map(x => x.score);
  const mean = windowScores.length ? windowScores.reduce((sum, x) => sum + x, 0) / windowScores.length : 0;
  const variance = windowScores.length ? windowScores.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / windowScores.length : 0;
  const consistency = windowScores.length ? Math.max(0, 100 - Math.sqrt(variance) * 2.5) : 0;
  // จำนวนข้อมูลค่อย ๆ เพิ่มความน่าเชื่อถือจนเต็มที่ราว 180 งวด ไม่เต็ม 100 ตั้งแต่เพียง 20 งวดเหมือนสูตรเดิม
  const sampleConfidence = stat.samples ? Math.min(100, Math.sqrt(Math.min(stat.samples, 180) / 180) * 100) : 0;
  const savedAI = state.aiFormulaLab?.[profileId];
  const aiTestRate = Number(savedAI?.test?.rate);
  const formulaSignal = Number.isFinite(aiTestRate) ? Math.max(0, Math.min(100, aiTestRate)) : stat.score;
  const trend = w7.score - w30.score;
  // แปลงแนวโน้มเป็นสเกล 0-100: 50 = ทรงตัว เพื่อไม่บวก/ลบคะแนนแบบเกิน 100% เหมือนสูตรเดิม
  const trendSignal = Math.max(0, Math.min(100, 50 + (w7.score - w30.score) * 0.90 + (w14.score - w90.score) * 0.35));
  // V6.6.5: น้ำหนักรวม 100% พอดี
  const raw = (w7.score * 0.22) + (w14.score * 0.18) + (w30.score * 0.14) +
    (w90.score * 0.10) + (w180.score * 0.08) + (consistency * 0.08) +
    (sampleConfidence * 0.05) + (formulaSignal * 0.10) + (trendSignal * 0.05);
  const confidence = stat.samples ? Math.max(0, Math.min(99, Math.round(raw))) : 0;
  const trendLabel = stat.samples < 5 ? "ข้อมูลยังน้อย" : trend >= 10 ? "แนวโน้มดีขึ้น" : trend <= -10 ? "แนวโน้มลดลง" : "แนวโน้มคงที่";
  return {
    ...stat,
    statScore: stat.score,
    confidence,
    trend,
    trendLabel,
    hasAIFormula: Boolean(savedAI?.formula),
    aiWindows: { day7:w7, day14:w14, day30:w30, day90:w90, day180:w180 },
    consistency: Math.round(consistency),
    sampleConfidence: Math.round(sampleConfidence),
    formulaSignal: Math.round(formulaSignal),
    trendSignal: Math.round(trendSignal)
  };
}

function renderProfileRanking() {
  const config = getRankingConfig();
  const requestedMode = ["manual", "score", "ai"].includes(state.analysisSortMode) ? state.analysisSortMode : "score";
  const mode = requestedMode;
  let ranking = state.profiles.map((_, i) => mode === "ai" ? getProfileAIRecommendation(i) : getProfileAnalysisScore(i));
  if (mode === "score") ranking.sort((a,b) => b.score - a.score || b.samples - a.samples || a.profileId - b.profileId);
  if (mode === "ai") ranking.sort((a,b) => b.confidence - a.confidence || b.statScore - a.statScore || b.samples - a.samples || a.profileId - b.profileId);
  return `<div class="analysis-ranking">
    <div class="analysis-ranking-head"><h3>อันดับ Profile แบบ Real-time</h3>
      <div class="analysis-sort-toggle">
        <button type="button" class="${mode === "manual" ? "active" : ""}" data-analysis-sort="manual">จัดเอง</button>
        <button type="button" class="${mode === "score" ? "active" : ""}" data-analysis-sort="score">คะแนนสถิติ</button>
        <button type="button" class="${mode === "ai" ? "active ai-active" : ""}" data-analysis-sort="ai">AI แนะนำ</button>
      </div>
    </div>
    <div class="profile-ranking-list">${ranking.map((item,index)=>`
      <button type="button" class="profile-ranking-row ${item.profileId === Number(state.activeProfile) ? "active" : ""} ${mode === "ai" && index === 0 ? "ai-champion" : ""}" data-ranking-profile="${item.profileId}" style="--profile-color:${profileColor(item.profileId)}">
        <span class="rank-number">${mode === "ai" && index === 0 ? `<span class="rank-trophy" aria-label="AI Champion">🏆</span>` : (mode === "manual" ? item.profileId + 1 : index + 1)}</span>
        <span class="rank-profile"><b>${escapeHtml(item.name)}${mode === "ai" && index === 0 ? `<span class="rank-champion-badge">CHAMPION</span>` : ""}</b><small>${mode === "ai" ? `${item.samples} งวด • ${item.trendLabel}${item.hasAIFormula ? " • มีสูตร AI" : ""}` : (item.samples ? `${item.samples} งวด • 10 งวด ${item.score10}% • 30 งวด ${item.score30}%` : "ข้อมูลยังไม่เพียงพอ")}</small></span>
        <span class="rank-score"><strong>${mode === "ai" ? item.confidence : item.score}%</strong><small>${mode === "ai" ? "AI Confidence" : "คะแนนสถิติ"}</small>${mode === "ai" ? `<em>สถิติ ${item.statScore}%</em>` : ""}</span>
      </button>`).join("")}</div>
    <p class="analysis-ranking-note">${mode === "ai" ? "AI Confidence ใช้น้ำหนักรวม 100%: 7/14/30/90/180 วัน = 22/18/14/10/8%, ความสม่ำเสมอ 8%, จำนวนข้อมูล 5%, ผลทดสอบสูตร AI 10%, แนวโน้ม 5% เป็นคะแนนจัดอันดับ ไม่ใช่โอกาสถูกรางวัล" : `คำนวณอัตโนมัติจาก Exact = ${config.exactPoints} คะแนน, Reversed = ${config.reversedPoints} คะแนน โดยให้น้ำหนัก 10 งวดล่าสุด ${config.weight10}%, 30 งวดล่าสุด ${config.weight30}% และข้อมูลทั้งหมด ${config.weightAll}% การจัดอันดับเป็นข้อมูลสถิติ ไม่ใช่การรับประกันผล`}</p>
  </div>`;
}

function getHistoryComparisonStatuses(draw, profileId = Number(draw?.profileId ?? 0)) {
  const selectedProfile = Number(profileId);
  const table = getPredictionTable(selectedProfile, draw?.date, draw);
  const originalFormula = getOriginalFormula();
  const aiFormula = state.aiFormulaLab?.[selectedProfile]?.formula || null;
  return {
    table,
    hasAI: Boolean(aiFormula),
    classic: table ? formulaHistoryStatus(draw.number, table.inputDigits, originalFormula) : "pending",
    aiL: aiFormula && table ? formulaHistoryStatus(draw.number, table.inputDigits, aiFormula) : "pending",
    independent: independentHistoryStatus(draw.number, selectedProfile, draw.date, 10).status,
    master: masterSnapshotHistoryStatus(draw.number, selectedProfile, draw.date).status
  };
}

function getRecentAIWinnerSummary(days = 7) {
  // V6.7.2 — use the exact same comparison statuses as History.
  // Exact/Reversed are both Hits. Every system that Hits gets +1 independently;
  // multiple simultaneous Hits are recorded as a shared Hit, not a score-cancelling tie.
  const allowedDays = [7, 14, 30, 90, 180];
  const windowDays = allowedDays.includes(Number(days)) ? Number(days) : 7;
  const all = (state.actualDraws || [])
    .filter(r => /^\d{3}$/.test(String(r.number || "")) && /^\d{4}-\d{2}-\d{2}$/.test(String(r.date || "")))
    .sort((a,b) => String(a.date).localeCompare(String(b.date)) || Number(a.createdAt || 0) - Number(b.createdAt || 0));
  const emptyCounts = {classic:0, aiL:0, independent:0, master:0};
  if (!all.length) return {windowDays, anchorDate:null, startDate:null, evaluated:0, tie:0, noWinner:0, counts:emptyCounts, profileWins:{classic:{},aiL:{},independent:{},master:{}}, details:[], champion:null};

  const anchorDate = String(all.at(-1).date);
  const startDate = shiftIsoDate(anchorDate, -(windowDays - 1));
  const periodDraws = all.filter(r => String(r.date) >= startDate && String(r.date) <= anchorDate);
  const counts = {...emptyCounts};
  const profileWins = {classic:{}, aiL:{}, independent:{}, master:{}};
  const labels = {classic:"สูตรเดิม", aiL:"AI L", independent:"AI อิสระ", master:"Master AI"};
  const isHit = status => status === "exact" || status === "reversed" || status === "swap";
  let evaluated = 0, tie = 0, noWinner = 0;
  const details = [];

  periodDraws.forEach(r => {
    const profileId = Number(r.profileId ?? 0);
    const comparison = getHistoryComparisonStatuses(r, profileId);
    if (!comparison.table?.inputDigits) return; // match History: only rows with a real historical table
    const statuses = {
      classic: comparison.classic,
      aiL: comparison.aiL,
      independent: comparison.independent,
      master: comparison.master
    };
    const available = Object.entries(statuses).filter(([,status]) => status !== "pending");
    if (!available.length) return;
    evaluated += 1;
    const hitKeys = available.filter(([,status]) => isHit(status)).map(([key]) => key);

    // Independent Hit Count: each Hit earns one point, even when other systems Hit too.
    hitKeys.forEach(key => {
      counts[key] += 1;
      profileWins[key][profileId] = (profileWins[key][profileId] || 0) + 1;
    });

    let resultType = "no-winner", winnerKey = null;
    if (hitKeys.length === 1) {
      resultType = "winner";
      winnerKey = hitKeys[0];
    } else if (hitKeys.length > 1) {
      resultType = "tie"; // informational only; points above are still awarded to every Hit system
      tie += 1;
    } else {
      noWinner += 1;
    }
    details.push({
      id:r.id, date:String(r.date), profileId,
      profileName:state.profiles[profileId] || `Profile ${profileId+1}`,
      number:String(r.number), statuses, hitKeys, resultType, winnerKey,
      winnerLabel:hitKeys.length ? hitKeys.map(key=>labels[key]).join(" + ") : "ไม่มีผู้ชนะ"
    });
  });

  details.sort((a,b) => String(b.date).localeCompare(String(a.date)) || a.profileId - b.profileId);
  const ranking = Object.entries(counts).map(([key,wins]) => ({key,label:labels[key],wins})).sort((a,b)=>b.wins-a.wins || a.label.localeCompare(b.label));
  const bestWins = ranking[0]?.wins || 0;
  const best = ranking.filter(x => x.wins === bestWins && bestWins > 0);
  const champion = best.length === 1 ? best[0] : best.length > 1 ? {key:"tie", label:"คะแนน Hit เท่ากัน", wins:bestWins} : null;
  return {windowDays, anchorDate, startDate, evaluated, tie, noWinner, counts, profileWins, details, ranking, champion};
}

function getDailyAIWinnerView(summary, selectedDate) {
  const details = (summary.details || []).filter(d => d.date === selectedDate).sort((a,b)=>a.profileId-b.profileId);
  const aiDefs = [
    {key:"aiL", label:"AI L"},
    {key:"independent", label:"AI อิสระ"},
    {key:"master", label:"Master AI"}
  ];
  const lines = aiDefs.map(ai => {
    const hits = details.filter(d => Array.isArray(d.hitKeys) && d.hitKeys.includes(ai.key));
    const names = hits.map(d => escapeHtml(d.profileName));
    return `<div class="daily-ai-summary-line ${hits.length ? 'has-win' : ''}">
      <b>${escapeHtml(ai.label)}</b><strong>${hits.length} ชนะ</strong>
      ${hits.length ? `<span>${names.join(" • ")}</span>` : ""}
    </div>`;
  }).join("");
  const dayName = selectedDate ? (DAYS_TH[new Date(`${selectedDate}T12:00:00`).getDay()] || "") : "";
  return `<div class="daily-ai-summary">
    <div class="daily-ai-summary-head"><b>${escapeHtml(dayName)} • ${formatDateTH(selectedDate)}</b><button type="button" data-ai-win-open-calendar>📅 เปลี่ยนวันที่</button></div>
    <div class="daily-ai-summary-lines">${lines}</div>
  </div>`;
}

function openAIWinnerCalendar(windowDays) {
  const s = getRecentAIWinnerSummary(windowDays);
  const detailDates = [...new Set((s.details || []).map(d=>d.date))].sort();
  const defaultDate = detailDates.at(-1) || s.anchorDate || isoDate();
  let selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(String(state.analysisWinSelectedDate || "")) ? String(state.analysisWinSelectedDate) : defaultDate;
  if (detailDates.length && !detailDates.includes(selectedDate)) selectedDate = defaultDate;
  let calendarMonth = /^\d{4}-\d{2}$/.test(String(state.analysisWinCalendarMonth || "")) ? String(state.analysisWinCalendarMonth) : selectedDate.slice(0,7);
  let [year, month] = calendarMonth.split("-").map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    calendarMonth = defaultDate.slice(0,7);
    [year, month] = calendarMonth.split("-").map(Number);
  }
  const firstDow = new Date(year, month - 1, 1, 12).getDay();
  const daysInMonth = new Date(year, month, 0, 12).getDate();
  const dateSet = new Set(detailDates);
  const cells = [];
  for (let i=0;i<firstDow;i++) cells.push('<span class="ai-cal-day blank" aria-hidden="true"></span>');
  for (let day=1; day<=daysInMonth; day++) {
    const date = `${year}-${pad(month)}-${pad(day)}`;
    const hasData = dateSet.has(date);
    cells.push(`<button type="button" class="ai-cal-day ${hasData?'has-data':''} ${selectedDate===date?'selected':''}" data-ai-popup-date="${date}" ${hasData?'':'disabled'}>${day}</button>`);
  }
  const monthLabel = new Date(year, month - 1, 1, 12).toLocaleDateString("th-TH", {month:"long", year:"numeric"});
  showModal(`<div class="modal-head"><div><h2>ข้อมูลรายวัน</h2><p>เลือกวันที่เพื่อดูว่า AI ตัวไหนชนะใน Profile ไหน</p></div><button class="icon-btn" data-close>×</button></div>
    <div class="ai-popup-calendar">
      <div class="ai-cal-head"><button type="button" data-ai-popup-nav="-1" aria-label="เดือนก่อน">‹</button><b>${escapeHtml(monthLabel)}</b><button type="button" data-ai-popup-nav="1" aria-label="เดือนถัดไป">›</button></div>
      <div class="ai-cal-weekdays"><span>อา.</span><span>จ.</span><span>อ.</span><span>พ.</span><span>พฤ.</span><span>ศ.</span><span>ส.</span></div>
      <div class="ai-cal-grid">${cells.join("")}</div>
    </div>`);
  document.querySelectorAll("[data-ai-popup-nav]").forEach(btn => btn.addEventListener("click", () => {
    const delta = Number(btn.dataset.aiPopupNav || 0);
    const d = new Date(`${calendarMonth}-01T12:00:00`);
    d.setMonth(d.getMonth() + delta);
    state.analysisWinCalendarMonth = `${d.getFullYear()}-${pad(d.getMonth()+1)}`;
    saveState();
    openAIWinnerCalendar(windowDays);
  }));
  document.querySelectorAll("[data-ai-popup-date]").forEach(btn => btn.addEventListener("click", () => {
    const date = String(btn.dataset.aiPopupDate || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    state.analysisWinSelectedDate = date;
    state.analysisWinCalendarMonth = date.slice(0,7);
    saveState();
    closeModal();
    render();
  }));
}

function renderRecentAIWinnerCard() {
  const windowDays = [7,14,30,90,180].includes(Number(state.analysisWinWindow)) ? Number(state.analysisWinWindow) : 7;
  const s = getRecentAIWinnerSummary(windowDays);
  const labels = {classic:"สูตรเดิม", aiL:"AI L", independent:"AI อิสระ", master:"Master AI"};
  const rows = ["master","aiL","independent","classic"]
    .map(key => ({key,label:labels[key],wins:Number(s.counts[key] || 0)}))
    .sort((a,b)=>b.wins-a.wins || a.label.localeCompare(b.label));
  const maxWins = Math.max(1, ...rows.map(x=>x.wins));
  const champText = s.champion ? `${s.champion.label} • ${s.champion.wins} ชนะ` : "ยังไม่มีผู้ชนะ";
  const periodText = s.anchorDate ? `${formatDateTH(s.startDate)} – ${formatDateTH(s.anchorDate)}` : "ยังไม่มีผลจริง";
  const profileLine = key => {
    const entries = Object.entries(s.profileWins[key] || {}).map(([id,wins]) => ({id:Number(id), wins:Number(wins), name:state.profiles[Number(id)] || `Profile ${Number(id)+1}`})).sort((a,b)=>b.wins-a.wins || a.name.localeCompare(b.name));
    return entries.length ? entries.map(x=>`${escapeHtml(x.name)} ×${x.wins}`).join(" • ") : "ยังไม่มี Profile ที่ชนะ";
  };

  const detailDates = [...new Set((s.details || []).map(d=>d.date))].sort();
  const defaultDate = detailDates.at(-1) || s.anchorDate || "";
  let selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(String(state.analysisWinSelectedDate || "")) ? String(state.analysisWinSelectedDate) : defaultDate;
  if (detailDates.length && !detailDates.includes(selectedDate)) selectedDate = defaultDate;
  const dailySummary = selectedDate && detailDates.includes(selectedDate) ? getDailyAIWinnerView(s, selectedDate) : "";

  return `<div class="recent-ai-winner-card global-winner-card">
    <div class="recent-ai-winner-head">
      <div><small>RECENT WINNER • ALL PROFILES</small><h3>🏆 ช่วงนี้ใครชนะมากที่สุด?</h3><p>รวมทุก Profile • ${periodText}</p></div>
      <div class="recent-ai-champion"><span>${windowDays} วันล่าสุด</span><b>${escapeHtml(champText)}</b></div>
    </div>
    <div class="recent-ai-window-tabs winner-window-tabs" role="tablist" aria-label="เลือกช่วงเวลาสรุปผู้ชนะ">
      ${[[7,"7 วัน"],[14,"14 วัน"],[30,"1 เดือน"],[90,"3 เดือน"],[180,"6 เดือน"]].map(([day,label])=>`<button type="button" class="${windowDays===day?'active':''}" data-ai-win-window="${day}" aria-pressed="${windowDays===day}">${label}</button>`).join("")}
    </div>
    <div class="recent-ai-winner-list">${rows.map((row,index)=>`<div class="recent-ai-winner-row global ${s.champion?.key===row.key?'winner':''}">
      <span class="recent-ai-rank">${index+1}</span><div class="recent-ai-system"><b>${escapeHtml(row.label)}</b><small>${profileLine(row.key)}</small></div>
      <div class="recent-ai-win-bar"><i style="width:${Math.round(row.wins*100/maxWins)}%"></i></div>
      <strong>${row.wins} ชนะ</strong>
    </div>`).join("")}</div>
    <div class="recent-ai-winner-foot"><span>ประเมิน <b>${s.evaluated}</b> Profile-Draw</span><span>เสมอ <b>${s.tie}</b></span><span>ไม่มีผู้ชนะ <b>${s.noWinner}</b></span></div>
    <button type="button" class="recent-ai-detail-toggle" data-ai-win-open-calendar>ข้อมูลรายวัน</button>
    ${dailySummary}
    <p class="recent-ai-winner-note">Exact และ Reverse ถือว่า Hit เท่ากัน • AI แต่ละตัวที่ Hit ได้ +1 อิสระ แม้ Hit พร้อมกัน • สถานะใช้ชุดเดียวกับหน้า History</p>
  </div>`;
}

function renderTodayAIWeightCard(profileId) {
  const w = masterAIWeights(profileId, null);
  const rows = [
    {key:"classic", label:"Classic", weight:w.classic, available:true},
    {key:"aiL", label:"AI L", weight:w.aiL, available:Boolean(getMasterEligibleAIFormula(profileId))},
    {key:"independent", label:"AI อิสระ", weight:w.independent, available:true}
  ].filter(x => x.available);
  const winner = [...rows].sort((a,b)=>b.weight-a.weight)[0] || null;
  const metric = key => w.metrics?.[key] || {};
  const targetText = `${w.targetDayName || "Today"} ${formatDateTH(w.targetDate || isoDate())}`;
  return `<div class="today-ai-weight-card">
    <div class="today-ai-weight-head">
      <div><small>TODAY AI WEIGHT</small><h3>${escapeHtml(state.profiles[profileId] || `Profile ${profileId+1}`)}</h3><p>${escapeHtml(targetText)} • เรียนรู้แยกตาม Profile + วันในสัปดาห์</p></div>
      ${winner ? `<div class="today-ai-winner"><span>AI Winner</span><b>${escapeHtml(winner.label)}</b><strong>${winner.weight}%</strong></div>` : ``}
    </div>
    <div class="today-ai-weight-list">${rows.map(row=>{
      const m=metric(row.key), weekday=m.weekday || {}, recent=m.recent || {};
      const weekdayText = weekday.total ? `${weekday.rate}% (${weekday.hit}/${weekday.total})` : "ยังไม่มีข้อมูล";
      const recentText = recent.windows?.length ? `${Math.round(Number(recent.score||0)*10)/10}%` : "—";
      return `<div class="today-ai-weight-row ${winner?.key===row.key?'winner':''}">
        <div class="today-ai-weight-label"><b>${escapeHtml(row.label)}</b><small>${escapeHtml(w.targetDayName || "Today")} ${weekdayText} • Recent ${recentText}</small></div>
        <div class="today-ai-weight-bar"><i style="width:${Math.max(0,Math.min(100,row.weight))}%"></i></div>
        <strong>${row.weight}%</strong>
      </div>`;
    }).join("")}</div>
    <div class="today-ai-weight-note"><b>วิธีคิด:</b> วันเดียวกันของโปรไฟล์นี้ 40% + ฟอร์มล่าสุด 12/30/60 งวด 40% + ประวัติ 60 งวด 20% • ถ้าข้อมูลวันนั้นยังน้อย ระบบจะลดความเชื่อมั่นอัตโนมัติเพื่อลด Overfitting</div>
    <div class="today-ai-confidence-note">เปอร์เซ็นต์นี้คือ <b>น้ำหนักที่ Master AI ใช้ตัดสินใจ</b> ไม่ใช่เปอร์เซ็นต์รับประกันว่าเลขจะออก</div>
  </div>`;
}

function renderAnalysis() {
  const profileId = Number(state.activeProfile);
  const draws = state.actualDraws.filter(r => Number(r.profileId ?? 0) === profileId);
  const linkedDraws = draws.filter(d => getPredictionTable(profileId, d.date));
  const allRecords = state.records.filter(r => Number(r.profileId) === profileId && r.status !== "notfound");
  const windowDays = [7,14,30,90,180].includes(Number(state.analysisLWindow)) ? Number(state.analysisLWindow) : 30;
  const latestDate = [...linkedDraws].map(d=>d.date).filter(Boolean).sort().at(-1) || isoDate();
  const cutoff = new Date(`${latestDate}T00:00:00`); cutoff.setDate(cutoff.getDate() - (windowDays - 1));
  const cutoffISO = cutoff.toISOString().slice(0,10);
  const windowDraws = linkedDraws.filter(d => d.date >= cutoffISO && d.date <= latestDate);
  const windowIds = new Set(windowDraws.map(d=>d.id));
  const records = allRecords.filter(r => windowIds.has(r.sourceActualDrawId));
  const exact = records.filter(r => r.status === "exact").length;
  const swap = records.filter(r => r.status === "swap").length;
  const misses = Math.max(0, windowDraws.length - records.length);
  const foundRate = windowDraws.length ? Math.round(records.length * 100 / windowDraws.length) : 0;
  const exactRate = windowDraws.length ? Math.round(exact * 100 / windowDraws.length) : 0;

  const patternRows = L_PATTERNS.map(pattern => {
    const matched = records.filter(r => r.patternId === pattern.id);
    const exactCount = matched.filter(r => r.status === "exact").length;
    const reverseCount = matched.filter(r => r.status === "swap").length;
    return { ...pattern, matched: matched.length, exactCount, reverseCount };
  }).sort((a,b) => b.matched - a.matched || b.exactCount - a.exactCount || a.id.localeCompare(b.id));
  const visiblePatterns = state.analysisLShowAll ? patternRows : patternRows.slice(0,3);

  return `<section class="card">
    <div class="section-head"><h2>Analysis</h2><span>ผลจริงทั้งหมด ${draws.length} • ใช้วิเคราะห์ ${linkedDraws.length} งวด</span></div>${profileTabs()}
    ${renderProfileRanking()}
    ${renderRecentAIWinnerCard()}
    ${renderTodayAIWeightCard(profileId)}
    ${(()=>{const all=state.actualDraws.filter(r=>Number(r.profileId??0)===profileId);const classic=formulaHistorySummary(all,profileId,getOriginalFormula());const aiF=state.aiFormulaLab?.[profileId]?.formula;const aiL=aiF?formulaHistorySummary(all,profileId,aiF):null;const free=independentHistorySummary(all,profileId,10);const master=masterHistorySummary(all,profileId,10);const w=masterAIWeights(profileId,null);return `<div class="master-dashboard">
      <div class="section-head compact"><div><h3>AI Model Dashboard</h3><p>เปรียบเทียบ Classic / AI L / AI อิสระ / Master AI</p></div><span class="master-badge">Master AI</span></div>
      <div class="model-score-grid"><div><span>Classic</span><b>${classic.rate}%</b></div><div><span>AI L</span><b>${aiL?`${aiL.rate}%`:'—'}</b></div><div><span>AI อิสระ</span><b>${free.rate}%</b></div><div class="master"><span>Master AI</span><b>${master.rate}%</b></div></div>
      <div class="adaptive-weight-line"><span>Adaptive Weight</span><b>Classic ${w.classic}% • AI L ${w.aiL}% • Independent ${w.independent}%</b></div>
    </div>`})()}
    <div class="l-pattern-dashboard">
      <div class="section-head compact"><div><h3>L Pattern Analysis</h3><p>ดูภาพรวมและ Pattern ที่ทำผลงานดีที่สุดในช่วงที่เลือก</p></div><span>${windowDays} วัน</span></div>
      <div class="recent-ai-window-tabs l-window-tabs" role="tablist" aria-label="เลือกช่วงเวลา L Pattern">
        ${[7,14,30,90,180].map(day=>`<button type="button" class="${windowDays===day?'active':''}" data-l-window="${day}" aria-pressed="${windowDays===day}">${day}D</button>`).join("")}
      </div>
      <div class="analysis-source-note">ผลจริงแต่ละวันเทียบกับตารางของวันก่อนหน้า • ช่วงเวลานับย้อนหลังจากผลจริงล่าสุดของ Profile</div>
      <div class="stats-grid"><div><b>${records.length}</b><span>Match</span></div><div><b>${exact}</b><span>Exact</span></div><div><b>${swap}</b><span>Reversed</span></div></div>
      ${progressCard("อัตราพบเลข L", foundRate)}
      ${progressCard("อัตราตรงตามลำดับ", exactRate)}
      <div class="pattern-title-row"><h3 class="subhead">Top Pattern</h3><small>${windowDraws.length} งวดในช่วงนี้</small></div>
      <div class="pattern-accuracy-list">${visiblePatterns.map((p,i)=>`<div class="pattern-accuracy-row ${i===0 && p.matched ? 'pattern-winner':''}"><div><b>${i===0 && p.matched?'🏆 ':''}#${i+1} ${p.id}</b><small>${escapeHtml(p.name)}</small></div><div><strong>${p.matched} Match</strong><small>Exact ${p.exactCount} • Reverse ${p.reverseCount}</small></div></div>`).join("")}</div>
      <button type="button" class="pattern-expand-btn" data-l-pattern-toggle>${state.analysisLShowAll ? 'ย่อเหลือ Top 3' : 'ดู Pattern L01–L08 ทั้งหมด'}</button>
    </div>
    <div class="notice ${linkedDraws.length >= 20 ? "success-note" : ""}">${linkedDraws.length >= 20 ? `มีข้อมูลพร้อมวิเคราะห์ ${linkedDraws.length} งวด` : `ควรเก็บตารางและผลจริงเพิ่มอีก ${Math.max(0,20-linkedDraws.length)} งวด เพื่อให้สถิติน่าเชื่อถือขึ้น`}</div>
    <p class="disclaimer">Exact และ Reversed นับเป็น Match เท่ากันในการจัดอันดับ Pattern • สถิตินี้ใช้ช่วยคัดเลือก Pattern ไม่ใช่การรับประกันผล</p>
  </section>`;
}
function progressCard(label, value) {
  return `<div class="progress-card"><div><span>${label}</span><b>${value}%</b></div><div class="progress"><i style="width:${value}%"></i></div></div>`;
}

function renderSettings() {
  return `<section class="card"><div class="section-head"><h2>SettingsรายProfile</h2><span>ปัจจุบัน ${state.profiles.length} Profile</span></div>
    <div class="app-version-card"><div><small>LuckyNumber Pro</small><b>Version 6.7.0</b></div><span>Master AI + Adaptive Ensemble</span></div>
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
        <label><span>Reversed Match</span><input id="rankReversePoints" type="number" inputmode="decimal" min="0" step="0.1" value="${c.reversedPoints}" disabled></label>
        <label><span>10 งวดล่าสุด</span><div class="percent-input"><input id="rankWeight10" type="number" inputmode="decimal" min="0" step="1" value="${c.weight10}"><b>%</b></div></label>
        <label><span>30 งวดล่าสุด</span><div class="percent-input"><input id="rankWeight30" type="number" inputmode="decimal" min="0" step="1" value="${c.weight30}"><b>%</b></div></label>
        <label class="full-row"><span>ข้อมูลทั้งหมด</span><div class="percent-input"><input id="rankWeightAll" type="number" inputmode="decimal" min="0" step="1" value="${c.weightAll}"><b>%</b></div></label>
      </div>
      <div id="rankingConfigMessage" class="ranking-config-message">น้ำหนักรวมต้องเท่ากับ 100%</div>
      <div class="ranking-settings-actions"><button id="btnResetRankingConfig" type="button" class="btn secondary">คืนค่าเริ่มต้น</button><button id="btnSaveRankingConfig" type="button" class="btn primary">บันทึกสูตร</button></div>
    </div>`})()}
    <div class="master-settings-card">
      <div class="ranking-settings-head"><div><h3>AI Settings</h3><p>Master AI เรียนรู้จาก 3 ระบบ โดยไม่เปลี่ยนสูตรเดิม</p></div><span>V6.7.0</span></div>
      <label class="ai-setting-toggle"><span><b>Learning</b><small>Classic + AI L + AI อิสระ</small></span><input id="masterLearning" type="checkbox" ${state.masterAISettings?.learning!==false?'checked':''}></label>
      <label class="ai-setting-toggle"><span><b>Adaptive Weight</b><small>ปรับน้ำหนักตามผลงานย้อนหลังอัตโนมัติ</small></span><input id="masterAdaptive" type="checkbox" ${state.masterAISettings?.adaptiveWeight!==false?'checked':''}></label>
      <label class="ai-setting-toggle"><span><b>Backtest</b><small>History ใช้เฉพาะข้อมูลก่อนงวดนั้น</small></span><input id="masterBacktest" type="checkbox" ${state.masterAISettings?.backtest!==false?'checked':''}></label>
    </div>
    <button id="btnThemeSetting" class="btn secondary full">${state.theme === "dark" ? "☀️ ใช้โหมดสว่าง" : "🌙 ใช้โหมดกลางคืน"}</button>
    <div class="backup-safety-card">
      <h3>ป้องกัน History หาย</h3>
      <p>การลบแอปออกจาก Home Screen อาจลบข้อมูลในเครื่อง กรุณาเก็บไฟล์สำรองไว้ใน Files หรือ iCloud Drive</p>
      <div class="backup-toggle">บน iPhone เมื่อกดสำรอง ระบบจะเปิด Share Sheet ให้เลือก “Save to Files” และเลือกโฟลเดอร์ได้</div>
      <small>${state.backupSettings?.lastBackupAt ? `สำรองล่าสุด ${new Date(state.backupSettings.lastBackupAt).toLocaleString("th-TH")}` : "ยังไม่เคยสร้างไฟล์สำรอง"}</small>
    </div>
    <button id="btnExport" class="btn secondary full">สำรองข้อมูลไป Files / iCloud</button>
    <label class="btn secondary full file-button">กู้คืนจากไฟล์ JSON<input id="importFile" type="file" accept="application/json,.json" hidden></label>
    <button id="btnResetAll" class="btn danger full">Clearข้อมูลทั้งหมด</button>
  </section>`;
}

function bindCommon() {
  document.querySelector("[data-profile-order-toggle]")?.addEventListener("click", () => {
    state.profileOrderMode = state.profileOrderMode === "ai" ? "default" : "ai";
    saveState();
    render();
  });
  document.querySelectorAll("[data-view]").forEach(btn => btn.addEventListener("click", () => {
    navigateToView(btn.dataset.view);
  }));
  document.querySelectorAll("[data-profile]").forEach(btn => btn.addEventListener("click", () => {
    const id = Number(btn.dataset.profile);
    state.activeProfile = id;

    // หน้า Calculate: เปลี่ยน Profile แล้วดึงเลขออกจริงล่าสุด 3 ตัว + 2 ตัวมาใส่ 5 ช่องทันที
    if (state.currentView === "home") {
      const latestDraw = getLatestCompleteActualDraw(id);
      if (latestDraw) {
        state.lastInput = [...String(latestDraw.number), ...String(latestDraw.twoDigit)];
        state.calculationDate = latestDraw.date || isoDate();
        state.grid = calculateGrid(state.lastInput, id);
        state.selectedL = null;
      } else {
        state.lastInput = ["","","","",""];
        state.grid = null;
        state.calculationDate = null;
        state.selectedL = null;
      }
    }

    saveState();
    render();
    if (state.currentView === "home" && !getLatestCompleteActualDraw(id)) {
      showToast(`ยังไม่มีเลขออกจริงล่าสุดของ ${state.profiles[id] || "Profile"}`);
    }
  }));
  document.querySelectorAll("[data-record]").forEach(el => el.addEventListener("click", () => openRecordDetail(el.dataset.record)));
}

function bindView() {
  if (state.currentView === "home") bindHome();
  if (state.currentView === "weekly") {
    document.querySelectorAll("[data-formula-mode]").forEach(button=>button.addEventListener("click",()=>{
      const id=Number(state.activeProfile);
      const mode=button.dataset.formulaMode;
      if (mode === "ai") {
        const saved=state.aiFormulaLab?.[id], check=formulaEligibility(saved);
        if (!saved?.formula || !check.allowed) return alert(check.reason || "ยังไม่มีสูตร AI พร้อมใช้งาน");
      }
      state.activeFormulaByProfile = state.activeFormulaByProfile || {};
      state.activeFormulaByProfile[id] = mode === "ai" ? "ai" : "original";
      state.grid=calculateGrid(state.lastInput,id);
      saveState(); render();
      showToast(mode === "ai" ? "✓ เปลี่ยนเป็น AI Champion แล้ว" : "✓ เปลี่ยนเป็น Original Formula แล้ว");
    }));
    document.getElementById("generateAIFormula")?.addEventListener("click",()=>{
      const result=generateAIFormula(Number(state.activeProfile));
      if (result?.error) return alert(result.error);
      result.deploymentStatus = formulaEligibility(result).allowed ? "approved" : "candidate";
      saveState(); clearPerformanceCaches(); activeRenderPerfSignature = "";
      render();
    });
    document.getElementById("previewAIFormula")?.addEventListener("click",()=>{
      const saved=state.aiFormulaLab?.[Number(state.activeProfile)];
      if (!saved?.formula) return alert("ยังไม่มีสูตร AI");
      const grid=formulaGrid(state.lastInput,saved.formula);
      if (!grid) return alert("กรุณากรอกตัวเลข 5 หลักในหน้า Calculate ก่อน");
      state.grid=grid; saveState(); state.currentView="home"; render();
      showToast("ทดลองคำนวณด้วยสูตร AI ครั้งนี้แล้ว โดยยังไม่เปลี่ยนสูตรหลัก");
    });
    document.getElementById("activateAIFormula")?.addEventListener("click",()=>{
      const id=Number(state.activeProfile), saved=state.aiFormulaLab?.[id], check=formulaEligibility(saved);
      if (!check.allowed) return alert(check.reason);
      if (!confirm(`ใช้สูตร AI เป็นสูตรหลักของ ${state.profiles[id]} หรือไม่?\n\nสูตรดั้งเดิมจะยังถูกเก็บไว้และย้อนกลับได้ตลอด`)) return;
      state.activeFormulaByProfile = state.activeFormulaByProfile || {};
      state.activeFormulaByProfile[id]="ai";
      state.grid=calculateGrid(state.lastInput,id); saveState(); render();
    });
    document.getElementById("restoreOriginalFormula")?.addEventListener("click",()=>{
      const id=Number(state.activeProfile);
      if (!confirm("กลับมาใช้สูตรดั้งเดิมหรือไม่? สูตร AI ทดลองจะยังถูกเก็บไว้")) return;
      state.activeFormulaByProfile = state.activeFormulaByProfile || {};
      state.activeFormulaByProfile[id]="original";
      state.grid=calculateGrid(state.lastInput,id); saveState(); render();
    });
    document.getElementById("discardAIFormula")?.addEventListener("click",()=>{
      if (!confirm("ลบสูตร AI ทดลองของ Profile นี้หรือไม่?")) return;
      const id=Number(state.activeProfile);
      if (state.aiFormulaLab) delete state.aiFormulaLab[id];
      state.activeFormulaByProfile = state.activeFormulaByProfile || {};
      state.activeFormulaByProfile[id]="original";
      state.grid=calculateGrid(state.lastInput,id);
      saveState(); render();
    });
  }
  if (state.currentView === "history") {
    document.querySelectorAll("[data-history-tab]").forEach(btn => btn.addEventListener("click", () => { state.historyTab = btn.dataset.historyTab; render(); }));
    document.querySelectorAll("[data-formula-mode]").forEach(btn => btn.addEventListener("click", () => { state.historyFormulaMode = btn.dataset.formulaMode; render(); }));
    document.getElementById("btnAddActualDraw")?.addEventListener("click", () => openActualDrawForm());
    document.getElementById("btnImportImageSandbox")?.addEventListener("click", () => document.getElementById("importImageInput")?.click());
    document.getElementById("importImageInput")?.addEventListener("change", handleImportImageSelection);
    document.querySelectorAll("[data-actual-draw]").forEach(el => el.addEventListener("click", () => openActualDrawDetail(el.dataset.actualDraw)));
    document.querySelectorAll("[data-daily-table]").forEach(el => el.addEventListener("click", () => openDailyTableDetail(el.dataset.dailyTable)));
  }
  if (state.currentView === "analysis") {
    document.querySelectorAll("[data-analysis-sort]").forEach(btn => btn.addEventListener("click", () => {
      const requested = btn.dataset.analysisSort;
      const nextMode = ["manual", "score", "ai"].includes(requested) ? requested : "score";
      state.analysisSortMode = nextMode;

      // V6.2: AI recommendation controls the global *display order* only.
      // Profile data, formulas and stored profile array remain untouched.
      state.profileOrderMode = nextMode === "ai" ? "ai" : "default";

      // Preserve existing V6.1 behavior: Analysis selects the top-ranked profile.
      const nextOrder = getProfileOrderByMode(nextMode);
      if (nextOrder.length) state.activeProfile = nextOrder[0];

      saveState();
      render();
      requestAnimationFrame(() => {
        document.querySelector(".profile-tabs")?.scrollTo?.({ left: 0, behavior: "smooth" });
      });
    }));
    document.querySelectorAll("[data-ranking-profile]").forEach(btn => btn.addEventListener("click", () => {
      state.activeProfile = Number(btn.dataset.rankingProfile); saveState(); render();
    }));
    document.querySelectorAll("[data-ai-win-window]").forEach(btn => btn.addEventListener("click", () => {
      const days = Number(btn.dataset.aiWinWindow);
      if (![7,14,30,90,180].includes(days)) return;
      state.analysisWinWindow = days;
      saveState(); render();
    }));
    document.querySelectorAll("[data-ai-win-open-calendar]").forEach(btn => btn.addEventListener("click", () => {
      openAIWinnerCalendar([7,14,30,90,180].includes(Number(state.analysisWinWindow)) ? Number(state.analysisWinWindow) : 7);
    }));
    document.querySelectorAll("[data-l-window]").forEach(btn => btn.addEventListener("click", () => {
      const days = Number(btn.dataset.lWindow);
      if (![7,14,30,90,180].includes(days)) return;
      state.analysisLWindow = days; state.analysisLShowAll = false;
      saveState(); render();
    }));
    document.querySelector("[data-l-pattern-toggle]")?.addEventListener("click", () => {
      state.analysisLShowAll = !state.analysisLShowAll;
      saveState(); render();
    });
  }
  if (state.currentView === "settings") bindSettings();
}

function bindHome() {
  document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);
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


function openLResults(searchValue = "", limit = currentLRankLimit, mode = currentLResultMode) {
  currentLRankLimit = Number(limit) || 0;
  currentLResultMode = ["l","independent","master","overlap"].includes(mode) ? mode : "l";
  const ranked = rankLResults(currentLResults);
  // V6.7.4 — L × AI uses the selected AI scope instead of always forcing Top 10.
  // "ทั้งหมด" intentionally uses AI Top 100: wide enough to reveal useful overlap
  // while still representing high-ranked AI candidates rather than all 000–999.
  const overlapAiLimit = currentLResultMode === "overlap"
    ? (currentLRankLimit === 0 ? 100 : currentLRankLimit)
    : 10;
  const independent = generateIndependentAI(Number(state.activeProfile), null, overlapAiLimit);
  const independentItems = independent.items || [];
  const master = generateMasterAI(Number(state.activeProfile), null, 10);
  const masterItems = master.items || [];
  const independentByNumber = new Map(independentItems.map(x=>[x.number,x]));
  const overlap = ranked.filter(x=>independentByNumber.has(x.number)).map(x=>{
    const free=independentByNumber.get(x.number);
    return {...x, independentRank:free?.aiRank, independentScore:free?.aiScore};
  });
  const source = currentLResultMode === "independent" ? independentItems : currentLResultMode === "master" ? masterItems : currentLResultMode === "overlap" ? overlap : ranked;
  // For L × AI the rank buttons define the AI comparison pool, not the number
  // of overlap results shown. Show every intersection found in that pool.
  const effectiveLimit = currentLResultMode === "overlap"
    ? 0
    : ((currentLResultMode === "independent" || currentLResultMode === "master") && currentLRankLimit === 0 ? 10 : currentLRankLimit);
  const visible = effectiveLimit === 0 ? source : source.slice(0, effectiveLimit);
  const profileName = state.profiles[state.activeProfile] || "Profile";
  const dataCount = currentLResultMode === "independent" ? independent.dataCount : currentLResultMode === "master" ? master.dataCount : (ranked[0]?.aiDataCount || 0);
  const title = currentLResultMode === "independent" ? "AI อิสระ" : currentLResultMode === "master" ? "Master AI" : currentLResultMode === "overlap" ? "เลขร่วม L × AI" : "L + AI Ranking";
  const historyChampion = getHistoryChampionForProfile(state.activeProfile);
  const historyWinner = historyChampion?.winner || null;
  const note = currentLResultMode === "independent"
    ? (independent.pending ? `ต้องมี History อย่างน้อย 8 งวด (ขณะนี้ ${independent.dataCount} งวด)` : `วิเคราะห์ผลจริงย้อนหลัง ${independent.dataCount} งวดโดยตรง • น้ำหนัก 12/30/60 = 50/30/20 • ไม่ใช้เลข L • สร้าง Top 10 จาก 000–999`)
    : currentLResultMode === "master"
      ? (master.pending ? `Master AI ต้องมี History อย่างน้อย 8 งวด` : `Adaptive Weight: Classic ${master.weights.classic}% • AI L ${master.weights.aiL}% • AI อิสระ ${master.weights.independent}%`)
    : currentLResultMode === "overlap"
      ? (independent.pending
        ? `AI อิสระต้องมี History อย่างน้อย 8 งวด (ขณะนี้ ${independent.dataCount} งวด)`
        : `L มี ${ranked.length} ชุด • AI อิสระ ${currentLRankLimit === 0 ? "Top 100" : `Top ${currentLRankLimit}`} มี ${independentItems.length} ชุด • จุดร่วม ${overlap.length} ชุด`)
      : (dataCount ? `ข้อมูลทั้งหมด ${dataCount} งวด • 12 งวด 50% • 30 งวด 30% • 60 งวด 20% • คะแนนใช้สำหรับเรียงอันดับ` : `ยังไม่มี History สำหรับ Profile นี้ ลำดับขณะนี้ใช้โครงสร้างตารางเป็นหลัก`);
  showModal(`
    <div class="modal-head"><div><h2>ผลลัพธ์เลข L</h2><p>${escapeHtml(profileName)} • ${escapeHtml(title)}</p></div><button class="icon-btn" data-close>×</button></div>
    <div class="l-engine-tabs">
      <button class="l-engine-tab ${currentLResultMode === "l" ? "active" : ""}" data-l-engine="l">L + AI</button>
      <button class="l-engine-tab ${currentLResultMode === "independent" ? "active" : ""}" data-l-engine="independent">AI อิสระ</button>
      <button class="l-engine-tab ${currentLResultMode === "master" ? "active" : ""}" data-l-engine="master">Master AI</button>
      <button class="l-engine-tab ${currentLResultMode === "overlap" ? "active" : ""}" data-l-engine="overlap">L × AI</button>
    </div>
    ${historyWinner ? `<div class="l-popup-winner"><span>🏆 Historical Champion</span><b>${escapeHtml(historyWinner.label)}</b><strong>${historyWinner.summary.rate}%</strong><small>ใช้ Champion เดียวกับหน้า History • ${historyWinner.summary.total || 0} งวด</small></div>` : `<div class="l-popup-winner pending"><span>🏆 Historical Champion</span><b>ยังไม่มีข้อมูลเพียงพอ</b><small>ต้องมี History เพื่อเปรียบเทียบ</small></div>`}
    <div class="ai-rank-note ${currentLResultMode === "independent" ? "independent-note" : currentLResultMode === "master" ? "master-note" : ""}"><b>${currentLResultMode === "independent" ? "AI คิดเลข 3 ตัวจาก History โดยตรง" : currentLResultMode === "master" ? "Meta AI เรียนรู้จาก 3 ระบบ" : currentLResultMode === "overlap" ? "จุดร่วมของ 2 ระบบ" : "AI วิเคราะห์ History ทั้งหมด และให้น้ำหนักงวดล่าสุดมากกว่า"}</b><span>${escapeHtml(note)}</span></div>
    <div class="l-rank-tabs">
      ${[[0,(currentLResultMode === "independent" || currentLResultMode === "master") ? "Top 10" : "ทั้งหมด"],[10,"Top 10"],[5,"Top 5"],[3,"Top 3"]].map(([n,label],i)=>`<button class="l-rank-tab ${((currentLResultMode === "independent" || currentLResultMode === "master") && currentLRankLimit===0 && i===0) || currentLRankLimit===n?'active':''}" data-rank-limit="${n}">${label}</button>`).join("")}
    </div>
    <div class="l-search-wrap">
      <span>🔎</span>
      <input id="lSearchInput" class="l-search-input" type="text" readonly maxlength="3" data-numeric-keypad="true" placeholder="ค้นหาเลข เช่น 356" value="${escapeHtml(searchValue)}">
      <button id="clearLSearch" class="search-clear" type="button">Clear</button>
    </div>
    <div class="l-result-grid ai-ranked-grid">${visible.map((item,i)=>currentLResultMode === "independent"
      ? `<button class="l-number ai-ranked-number independent-number ${item.aiRank<=3?'top-three':''}" data-independent-number="${item.number}" data-number="${item.number}"><span class="rank-badge">#${item.aiRank}</span><b>${item.number}</b><small>คะแนน AI ${item.aiScore}</small></button>`
      : currentLResultMode === "master"
      ? `<button class="l-number ai-ranked-number master-number ${item.masterRank<=3?'top-three':''}" data-master-number="${item.number}" data-number="${item.number}"><span class="rank-badge">#${item.masterRank}</span><b>${item.number}</b><small>${item.sources.join(' + ')} • ${item.masterScore}</small></button>`
      : `<button class="l-number ai-ranked-number ${(item.aiRank||i+1)<=3?'top-three':''}" data-ranked-number="${item.number}" data-number="${item.number}"><span class="rank-badge">#${item.aiRank||i+1}</span><b>${item.number}</b><small>${currentLResultMode === "overlap" ? `L #${item.aiRank} • Free #${item.independentRank}` : `คะแนน AI ${item.aiScore}`}</small></button>`).join("") || `<div class="empty-card flat visible-empty">${currentLResultMode === "overlap" ? (independent.pending ? `AI อิสระยังคำนวณไม่ได้ • History ${independent.dataCount}/8 งวด` : `คำนวณแล้ว: L ${ranked.length} ชุด × AI ${currentLRankLimit === 0 ? "Top 100" : `Top ${currentLRankLimit}`} ${independentItems.length} ชุด • ยังไม่มีเลขร่วม`) : "ข้อมูล History ยังไม่พอสำหรับ AI อิสระ"}</div>`}</div>
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
    const layer = document.createElement("div"); layer.className = "confetti-layer";
    for (let i=0;i<34;i++) { const piece=document.createElement("i"); piece.style.setProperty("--x",`${(Math.random()-.5)*280}px`); piece.style.setProperty("--y",`${-70-Math.random()*190}px`); piece.style.setProperty("--r",`${Math.random()*720-360}deg`); piece.style.setProperty("--delay",`${Math.random()*.14}s`); piece.style.setProperty("--hue",`${Math.floor(Math.random()*360)}`); layer.appendChild(piece); }
    root.appendChild(layer);
  };
  const showMatchPopup = number => {
    const root = document.getElementById("matchPopupRoot") || (()=>{const el=document.createElement("div");el.id="matchPopupRoot";document.body.appendChild(el);return el;})();
    clearTimeout(popupTimer); root.innerHTML=`<div class="match-number-popup" role="status" aria-live="polite"><button class="match-popup-close" type="button" aria-label="ปิด">×</button><strong>${escapeHtml(number)}</strong></div>`; root.classList.add("active"); createConfetti(root); root.querySelector(".match-popup-close")?.addEventListener("click",closeMatchPopup); requestAnimationFrame(()=>root.querySelector(".match-number-popup")?.classList.add("show")); popupTimer=setTimeout(closeMatchPopup,2200);
  };
  const applySearch = () => {
    const q=searchInput.value.replace(/\D/g,"").slice(0,3); searchInput.value=q; const canonicalQuery=q.length===3?canonical3(q):""; let matchedNumber="";
    document.querySelectorAll(".l-number").forEach(btn=>{ const number=btn.dataset.number; const permutationMatch=q.length===3 && canonical3(number)===canonicalQuery; const partial=q.length>0&&q.length<3&&number.includes(q); btn.classList.toggle("search-match",permutationMatch); btn.classList.toggle("search-partial",!permutationMatch&&partial); btn.classList.toggle("search-dim",q.length>0&&!permutationMatch&&!partial); if(permutationMatch) matchedNumber=number; });
    if(matchedNumber&&canonicalQuery!==lastPopupKey){lastPopupKey=canonicalQuery;showMatchPopup(matchedNumber);} if(q.length<3||!matchedNumber)lastPopupKey="";
  };
  document.querySelectorAll("[data-l-engine]").forEach(btn=>btn.addEventListener("click",()=>openLResults(searchInput.value,currentLRankLimit,btn.dataset.lEngine)));
  document.querySelectorAll("[data-rank-limit]").forEach(btn=>btn.addEventListener("click",()=>openLResults(searchInput.value,Number(btn.dataset.rankLimit),currentLResultMode)));
  document.querySelectorAll("[data-ranked-number]").forEach(btn=>btn.addEventListener("click",()=>{const item=ranked.find(x=>x.number===btn.dataset.rankedNumber);if(item)openLDetail(item);}));
  document.querySelectorAll("[data-independent-number]").forEach(btn=>btn.addEventListener("click",()=>{const item=independentItems.find(x=>x.number===btn.dataset.independentNumber);if(item)openIndependentDetail(item);}));
  document.querySelectorAll("[data-master-number]").forEach(btn=>btn.addEventListener("click",()=>{const item=masterItems.find(x=>x.number===btn.dataset.masterNumber);if(item)openMasterDetail(item,master.weights);}));
  searchInput.addEventListener("input",applySearch); document.getElementById("clearLSearch").addEventListener("click",()=>{searchInput.value="";searchInput.focus();applySearch();}); applySearch(); if(searchValue)searchInput.focus();
}

function openMasterDetail(item,weights){
  showModal(`<div class="modal-head"><div><h2>Master AI #${item.masterRank}</h2><p>Classic + AI L + AI อิสระ</p></div><button class="icon-btn" data-close>×</button></div><div class="hero-number">${escapeHtml(item.number)}</div><div class="ai-number-detail"><div><span>Master Score</span><b>${item.masterScore}</b></div><div><span>สนับสนุน</span><b>${item.sources.length} ระบบ</b></div></div><div class="ai-reason-list"><span>• ${escapeHtml(item.sources.join(' + '))}</span><span>• Weight: Classic ${weights.classic}% • AI L ${weights.aiL}% • AI อิสระ ${weights.independent}%</span></div><button id="btnBackResults" class="btn secondary full">กลับผลลัพธ์</button>`);
  document.getElementById("btnBackResults")?.addEventListener("click",()=>openLResults("",currentLRankLimit,"master"));
}

function openIndependentDetail(item) {
  showModal(`<div class="modal-head"><div><h2>AI อิสระ #${item.aiRank}</h2><p>วิเคราะห์จาก History โดยไม่อ้างอิงเลข L</p></div><button class="icon-btn" data-close>×</button></div>
    <div class="hero-number">${escapeHtml(item.number)}</div>
    <div class="ai-number-detail"><div><span>อันดับ</span><b>#${item.aiRank}</b></div><div><span>คะแนน AI</span><b>${item.aiScore}</b></div></div>
    <div class="ai-reason-list">${(item.aiReasons?.length?item.aiReasons:["คำนวณจากความถี่รายหลัก คู่ตัวเลข ระยะสั้น/กลาง/ยาว และการเปลี่ยนจากงวดล่าสุด"]).map(r=>`<span>• ${escapeHtml(r)}</span>`).join("")}</div>
    <div class="detail-card"><div><span>ข้อมูลที่ใช้</span><b>${item.aiDataCount} งวด</b></div><div><span>จำนวนที่คัด</span><b>Top 10 จาก 000–999</b></div></div>
    <button id="btnBackResults" class="btn secondary full">กลับผลลัพธ์</button>`);
  document.getElementById("btnBackResults")?.addEventListener("click",()=>openLResults("",currentLRankLimit,"independent"));
}

function openLDetail(item) {
  const occurrences = item.occurrences || [item];
  if (occurrences.length > 1) {
    showModal(`
      <div class="modal-head"><div><h2>เลข ${item.number} มีหลายPosition</h2><p>เลือกPositionตัว L ที่ต้องการSave</p></div><button class="icon-btn" data-close>×</button></div>
      <div class="occurrence-list">${occurrences.map((occ,i)=>`<button class="occurrence-card" data-occurrence="${i}"><b>${occ.patternId} • ${escapeHtml(occ.patternName)}</b><span>${escapeHtml(occ.block)}</span><small>${occ.number.split("").join(" → ")}</small></button>`).join("")}</div>
      <button id="btnBackResults" class="btn secondary full">Back to Results</button>
    `);
    document.querySelectorAll("[data-occurrence]").forEach(btn => btn.addEventListener("click", () => openLDetail({ ...occurrences[Number(btn.dataset.occurrence)], aiRank:item.aiRank, aiScore:item.aiScore, aiReasons:item.aiReasons, aiDataCount:item.aiDataCount })));
    document.getElementById("btnBackResults").addEventListener("click", openLResults);
    return;
  }
  state.selectedL = item;
  showModal(`
    <div class="modal-head"><div><h2>รายละเอียดชุด L</h2><p>${item.patternId} • ${escapeHtml(item.patternName)}</p></div><button class="icon-btn" data-close>×</button></div>
    <div class="hero-number">${item.number}</div>
    ${item.aiRank ? `<div class="ai-number-detail"><div><span>อันดับ AI</span><b>#${item.aiRank}</b></div><div><span>คะแนน AI</span><b>${item.aiScore}</b></div></div><div class="ai-reason-list">${(item.aiReasons || []).map(reason=>`<span>• ${escapeHtml(reason)}</span>`).join("")}</div>` : ""}
    <div class="l-detail-formula"><span class="table-formula-badge ${getDisplayedGridFormulaMode()==="ai"?"ai":"original"}">${escapeHtml(getDisplayedGridFormulaDetail())}</span></div>
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


let importSandboxBusy = false;
let importSandboxPreviewUrl = "";
let importSandboxPreviewUrls = [];
let importSandboxRawText = "";
let importSandboxImportStats = { files:0, read:0, failed:0, found:0 };

function loadTesseractSandbox() {
  if (window.Tesseract?.recognize) return Promise.resolve(window.Tesseract);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-import-ocr="tesseract"]');
    if (existing) {
      existing.addEventListener("load", () => window.Tesseract?.recognize ? resolve(window.Tesseract) : reject(new Error("OCR unavailable")), { once:true });
      existing.addEventListener("error", () => reject(new Error("โหลด OCR ไม่สำเร็จ")), { once:true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.async = true;
    script.dataset.importOcr = "tesseract";
    script.onload = () => window.Tesseract?.recognize ? resolve(window.Tesseract) : reject(new Error("OCR unavailable"));
    script.onerror = () => reject(new Error("โหลด OCR ไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ต"));
    document.head.appendChild(script);
  });
}

function normalizeOcrDigits(text) {
  const thai = "๐๑๒๓๔๕๖๗๘๙";
  return String(text || "")
    .replace(/[๐-๙]/g, ch => String(thai.indexOf(ch)))
    .replace(/[Oo]/g, "0")
    .replace(/[Il|]/g, "1")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\u00a0/g, " ");
}

const IMPORT_THAI_MONTHS = {
  "มค":1,"มกราคม":1,"กพ":2,"กุมภาพันธ์":2,"มีค":3,"มีนาคม":3,"เมย":4,"เมษายน":4,
  "พค":5,"พฤษภาคม":5,"มิย":6,"มิถุนายน":6,"กค":7,"กรกฎาคม":7,"สค":8,"สิงหาคม":8,
  "กย":9,"กันยายน":9,"ตค":10,"ตุลาคม":10,"พย":11,"พฤศจิกายน":11,"ธค":12,"ธันวาคม":12
};

function normalizeImportYear(rawYear) {
  let year = Number(normalizeOcrDigits(String(rawYear ?? "")).replace(/\D/g, ""));
  if (!Number.isFinite(year) || year <= 0) return 0;
  const now = new Date();
  const currentCE = now.getFullYear();
  const currentBE = currentCE + 543;
  if (year < 100) {
    // รูปผลรายวันมักใช้ปี พ.ศ. 2 หลัก เช่น 69 = 2569
    const beCentury = Math.floor(currentBE / 100) * 100;
    let beYear = beCentury + year;
    if (beYear > currentBE + 20) beYear -= 100;
    if (beYear < currentBE - 80) beYear += 100;
    return beYear - 543;
  }
  if (year >= 2400) {
    // OCR อาจอ่าน 2569 เป็น 2612/2629 ให้ยึดปีปัจจุบันเมื่อค่าหลุดช่วงมาก
    if (Math.abs(year - currentBE) > 5) year = currentBE;
    return year - 543;
  }
  // ปี ค.ศ. ที่ OCR เพี้ยนไกลจากช่วงใช้งาน ให้ยึดปีปัจจุบัน
  if (year >= 1900 && Math.abs(year - currentCE) > 5) return currentCE;
  return year;
}

function importIsoDate(day, month, year) {
  day = Number(day); month = Number(month); year = normalizeImportYear(year);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return "";
  return `${year}-${pad(month)}-${pad(day)}`;
}


function normalizeThaiMonthToken(token) {
  return normalizeOcrDigits(token)
    .toLowerCase()
    .replace(/[\s._,;:|/\\()[\]{}'"`~!@#$%^&*+=?-]/g, "")
    .replace(/เ/g, "เ")
    .trim();
}

function importMonthFromToken(token) {
  const key = normalizeThaiMonthToken(token);
  if (IMPORT_THAI_MONTHS[key]) return IMPORT_THAI_MONTHS[key];
  const aliases = {
    "มค":1,"มกร":1,"มกราค":1,
    "กพ":2,"กภ":2,"กุมภ":2,
    "มีค":3,"มคี":3,"มนีค":3,
    "เมย":4,"เมษ":4,
    "พค":5,"พฤค":5,"พฤษภ":5,
    "มิย":6,"มยิ":6,"มิถ":6,
    "กค":7,"กรก":7,
    "สค":8,"สงค":8,"สิงห":8,
    "กย":9,"กนย":9,"กันย":9,
    "ตค":10,"ตุล":10,
    "พย":11,"พฤศ":11,
    "ธค":12,"ธนว":12,"ธันว":12
  };
  return aliases[key] || 0;
}

function parseImportDateMatch(text) {
  const clean = normalizeOcrDigits(text).replace(/\s+/g, " ");
  const patterns = [
    /(?:^|\D)(\d{1,2})\s*([ก-๙A-Za-z.]{1,14})\s*(\d{2,4})(?=\D|$)/g,
    /(?:^|\D)(\d{1,2})\s*[\/.-]\s*(\d{1,2})\s*[\/.-]\s*(\d{2,4})(?=\D|$)/g
  ];
  for (const regex of patterns) {
    regex.lastIndex = 0;
    let m;
    while ((m = regex.exec(clean))) {
      const month = regex === patterns[0] ? importMonthFromToken(m[2]) : Number(m[2]);
      const date = importIsoDate(m[1], month, m[3]);
      if (date) return { date, index:m.index, end:regex.lastIndex, raw:m[0] };
    }
  }
  return null;
}

function parseNumbersNearDate(segment, dateRaw = "") {
  let clean = normalizeOcrDigits(segment).replace(/\s+/g, " ");
  if (dateRaw) clean = clean.replace(dateRaw, " ");
  // Remove common years/dates before selecting result columns.
  const groups = [...clean.matchAll(/(?<!\d)(\d{1,5})(?!\d)/g)].map(m => ({ value:m[1], index:m.index }));
  let number = "", twoDigit = "";
  for (const g of groups) {
    if (!number && /^\d{3}$/.test(g.value)) { number = g.value; continue; }
    if (number && !twoDigit && /^\d{2}$/.test(g.value)) { twoDigit = g.value; break; }
  }
  if (!number || !twoDigit) {
    const compact = clean.match(/(?<!\d)(\d{3})\s*[|,;:\-–—]?\s*(\d{2})(?!\d)/);
    if (compact) { number = number || compact[1]; twoDigit = twoDigit || compact[2]; }
  }
  return { number, twoDigit };
}

function parseImportRowsFromText(text) {
  const normalized = normalizeOcrDigits(text);
  const lines = normalized.split(/\r?\n/).map(x => x.replace(/\s+/g, " ").trim()).filter(Boolean);
  const rows = [];
  const seen = new Set();

  // Strategy 1: each OCR line already contains date + 3 digits + 2 digits.
  lines.forEach((line, lineIndex) => {
    const dm = parseImportDateMatch(line);
    if (!dm) return;
    const nums = parseNumbersNearDate(line, dm.raw);
    if (!/^\d{3}$/.test(nums.number) || !/^\d{2}$/.test(nums.twoDigit)) return;
    const key = `${dm.date}|${nums.number}|${nums.twoDigit}`;
    if (!seen.has(key)) {
      seen.add(key);
      rows.push({ id:`import-line-${lineIndex}-${Date.now()}`, date:dm.date, number:nums.number, twoDigit:nums.twoDigit, enabled:true, sourceLine:line, parsePriority:3 });
    }
  });

  // Strategy 2: iPhone screenshots often make OCR split one visual row into 2–3 text lines.
  for (let i = 0; i < lines.length; i++) {
    const joined = lines.slice(i, Math.min(lines.length, i + 4)).join(" ");
    const dm = parseImportDateMatch(joined);
    if (!dm) continue;
    const nums = parseNumbersNearDate(joined, dm.raw);
    if (!/^\d{3}$/.test(nums.number) || !/^\d{2}$/.test(nums.twoDigit)) continue;
    const key = `${dm.date}|${nums.number}|${nums.twoDigit}`;
    if (!seen.has(key)) {
      seen.add(key);
      rows.push({ id:`import-window-${i}-${Date.now()}`, date:dm.date, number:nums.number, twoDigit:nums.twoDigit, enabled:true, sourceLine:joined, parsePriority:2 });
    }
  }

  // Strategy 3: scan the full OCR stream from one date to the next.
  const dateRegex = /(?:^|\D)(\d{1,2})\s*([ก-๙A-Za-z.]{1,14})\s*(\d{2,4})(?=\D|$)|(?:^|\D)(\d{1,2})\s*[\/.-]\s*(\d{1,2})\s*[\/.-]\s*(\d{2,4})(?=\D|$)/g;
  const matches = [];
  let m;
  while ((m = dateRegex.exec(normalized))) {
    const day = m[1] || m[4], month = m[2] ? importMonthFromToken(m[2]) : Number(m[5]), year = m[3] || m[6];
    const date = importIsoDate(day, month, year);
    if (date) matches.push({ date, index:m.index, end:dateRegex.lastIndex, raw:m[0] });
  }
  matches.forEach((dm, idx) => {
    const end = matches[idx + 1]?.index ?? Math.min(normalized.length, dm.end + 180);
    const segment = normalized.slice(dm.index, end);
    const nums = parseNumbersNearDate(segment, dm.raw);
    if (!/^\d{3}$/.test(nums.number) || !/^\d{2}$/.test(nums.twoDigit)) return;
    const key = `${dm.date}|${nums.number}|${nums.twoDigit}`;
    if (!seen.has(key)) {
      seen.add(key);
      rows.push({ id:`import-stream-${idx}-${Date.now()}`, date:dm.date, number:nums.number, twoDigit:nums.twoDigit, enabled:true, sourceLine:segment.replace(/\s+/g," ").trim(), parsePriority:1 });
    }
  });
  return rows;
}

function collectSpatialOcrLines(data) {
  const words = [];
  const visit = node => {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (node.text && node.bbox && Number.isFinite(node.bbox.x0) && Number.isFinite(node.bbox.y0)) {
      const text = String(node.text).trim();
      if (text) words.push({ text, ...node.bbox });
    }
    ["blocks","paragraphs","lines","words","symbols"].forEach(k => node[k] && visit(node[k]));
  };
  visit(data?.blocks || data?.paragraphs || data?.lines || []);
  if (!words.length) return [];
  words.sort((a,b) => ((a.y0+a.y1)/2)-((b.y0+b.y1)/2) || a.x0-b.x0);
  const rows = [];
  words.forEach(w => {
    const cy = (w.y0 + w.y1) / 2;
    const h = Math.max(8, w.y1 - w.y0);
    let row = rows.find(r => Math.abs(r.cy - cy) <= Math.max(12, Math.min(r.h,h) * 0.65));
    if (!row) { row = { cy, h, words:[] }; rows.push(row); }
    row.words.push(w); row.cy = (row.cy * (row.words.length - 1) + cy) / row.words.length; row.h = Math.max(row.h,h);
  });
  return rows.sort((a,b)=>a.cy-b.cy).map(r => r.words.sort((a,b)=>a.x0-b.x0).map(w=>w.text).join(" "));
}

function parseImportSandboxRows(text, ocrData = null) {
  const normalized = normalizeOcrDigits(text);
  const spatialLines = collectSpatialOcrLines(ocrData);
  const candidates = [
    ...parseImportRowsFromText(spatialLines.join("\n")),
    ...parseImportRowsFromText(normalized)
  ];
  // หนึ่งวันควรมีเพียงหนึ่งผล: ให้ Spatial/บรรทัดตรง มีสิทธิ์เหนือ window/stream
  const unique = new Map();
  candidates.forEach(row => {
    const key = row.date;
    const current = unique.get(key);
    const score = Number(row.parsePriority || 0) + (/^\d{3}$/.test(row.number) ? 1 : 0) + (/^\d{2}$/.test(row.twoDigit) ? 1 : 0);
    const currentScore = current ? Number(current.parsePriority || 0) + 2 : -1;
    if (!current || score > currentScore) unique.set(key, row);
  });
  const rows = [...unique.values()].sort((a,b) => a.date.localeCompare(b.date));
  const rawText = `${normalized.trim()}${spatialLines.length ? `\n\n--- Spatial OCR rows ---\n${spatialLines.join("\n")}` : ""}`;
  return { rows, rawText };
}

function prepareImageForOcr(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const maxSide = 2200;
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
        canvas.height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
        const ctx = canvas.getContext("2d", { alpha:false, willReadFrequently:true });
        ctx.fillStyle = "#fff"; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        URL.revokeObjectURL(objectUrl);
        resolve({ canvas, previewUrl: canvas.toDataURL("image/jpeg", 0.88) });
      } catch (error) { URL.revokeObjectURL(objectUrl); reject(error); }
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("iPhone ไม่สามารถเปิดไฟล์ภาพนี้ได้ กรุณาใช้ JPG/PNG หรือ Screenshot")); };
    img.src = objectUrl;
  });
}

async function handleImportImageSelection(event) {
  const inputEl = event.target;
  const files = [...(inputEl.files || [])]; inputEl.value = "";
  if (!files.length || importSandboxBusy) return;
  const validFiles = files.filter(file => (String(file.type || "").startsWith("image/") || /\.(heic|heif|jpg|jpeg|png|webp)$/i.test(file.name || "")) && file.size <= 18 * 1024 * 1024);
  if (!validFiles.length) return alert("กรุณาเลือกไฟล์รูปภาพ JPG/PNG/Screenshot ที่มีขนาดไม่เกิน 18 MB ต่อรูป");
  if (validFiles.length !== files.length && !confirm(`มี ${files.length - validFiles.length} ไฟล์ที่ไม่รองรับหรือใหญ่เกิน 18 MB ระบบจะข้ามและอ่าน ${validFiles.length} รูปที่เหลือ ดำเนินการต่อหรือไม่?`)) return;

  importSandboxBusy = true;
  importSandboxPreviewUrls = [];
  importSandboxRawText = "";
  importSandboxImportStats = { files:validFiles.length, read:0, failed:0, found:0 };
  const allCandidates = [];
  try {
    const Tesseract = await loadTesseractSandbox();
    showImportSandboxReview("", [], true, `กำลังเตรียมอ่าน 0/${validFiles.length} รูป…`);
    for (let fileIndex = 0; fileIndex < validFiles.length; fileIndex++) {
      const file = validFiles[fileIndex];
      try {
        const prepared = await prepareImageForOcr(file);
        importSandboxPreviewUrls.push(prepared.previewUrl);
        importSandboxPreviewUrl = importSandboxPreviewUrls[0] || prepared.previewUrl;
        const result = await Tesseract.recognize(prepared.canvas, "tha+eng", {
          preserve_interword_spaces: "1",
          logger: message => {
            const status = document.getElementById("importOcrStatus");
            if (status && message.status === "recognizing text") status.textContent = `กำลังอ่านรูป ${fileIndex + 1}/${validFiles.length} • ${Math.round((message.progress || 0) * 100)}% • พบแล้ว ${allCandidates.length} รายการ`;
          }
        });
        const parsed = parseImportSandboxRows(result?.data?.text || "", result?.data || null);
        parsed.rows.forEach(row => allCandidates.push({...row, sourceFile:file.name, fileIndex}));
        importSandboxRawText += `${importSandboxRawText ? "\n\n" : ""}===== รูป ${fileIndex + 1}: ${file.name} =====\n${parsed.rawText}`;
        importSandboxImportStats.read++;
        importSandboxImportStats.found = allCandidates.length;
      } catch (error) {
        console.error("Import image failed", file.name, error);
        importSandboxImportStats.failed++;
        importSandboxRawText += `${importSandboxRawText ? "\n\n" : ""}===== รูป ${fileIndex + 1}: ${file.name} =====\nError: ${error?.message || "unknown"}`;
      }
    }

    // รวมผลทุกภาพโดยวันที่ และเก็บแถวที่มีคะแนนการอ่านดีที่สุด ไม่จำกัดจำนวนรายการ
    const byDate = new Map();
    allCandidates.forEach(row => {
      const current = byDate.get(row.date);
      const score = Number(row.parsePriority || 0) + (/^\d{3}$/.test(row.number) ? 2 : 0) + (/^\d{2}$/.test(row.twoDigit) ? 2 : 0);
      const currentScore = current ? Number(current.parsePriority || 0) + 4 : -1;
      if (!current || score > currentScore) byDate.set(row.date, row);
    });
    const rows = [...byDate.values()].sort((a,b) => a.date.localeCompare(b.date));
    importSandboxImportStats.found = rows.length;
    const duplicateCount = Math.max(0, allCandidates.length - rows.length);
    const warning = rows.length
      ? `อ่านสำเร็จ ${importSandboxImportStats.read}/${validFiles.length} รูป • ตรวจพบ ${rows.length} วัน${duplicateCount ? ` • รวมรายการซ้ำ ${duplicateCount}` : ""}${importSandboxImportStats.failed ? ` • อ่านไม่สำเร็จ ${importSandboxImportStats.failed} รูป` : ""}`
      : "ระบบยังแยกรายการไม่ได้ กรุณาเพิ่มแถวและกรอกข้อมูลด้วยตนเอง";
    showImportSandboxReview(importSandboxPreviewUrl, rows, false, warning);
  } catch (error) {
    console.error("Import Sandbox OCR startup failed", error);
    importSandboxRawText = `OCR Error: ${error?.message || "unknown"}`;
    showImportSandboxReview("", [], false, "โหลดระบบ OCR ไม่สำเร็จ แต่ยังเพิ่มแถวและกรอกข้อมูลด้วยตนเองได้");
  } finally { importSandboxBusy = false; }
}

function importRowHtml(row, index) {
  return `<div class="import-multi-row" data-import-row>
    <label class="import-row-check"><input type="checkbox" data-field="enabled" ${row.enabled !== false ? "checked" : ""}><span>${index + 1}</span></label>
    <input type="date" data-field="date" value="${escapeHtml(row.date || isoDate())}" aria-label="วันที่">
    <input inputmode="numeric" maxlength="3" data-field="number" value="${escapeHtml(row.number || "")}" placeholder="3 ตัว" aria-label="เลข 3 ตัว">
    <input inputmode="numeric" maxlength="2" data-field="twoDigit" value="${escapeHtml(row.twoDigit || "")}" placeholder="2 ตัว" aria-label="เลข 2 ตัว">
    <button type="button" class="import-remove-row" data-remove-import-row aria-label="ลบรายการ">×</button>
  </div>`;
}

function showImportSandboxReview(previewUrl, rows = [], loading = false, warning = "") {
  const profiles = state.profiles.map((name, idx) => `<option value="${idx}" ${idx === Number(state.activeProfile) ? "selected" : ""}>${escapeHtml(name)}</option>`).join("");
  const safeRows = rows.length ? rows : [{ id:uid(), date:isoDate(), number:"", twoDigit:"", enabled:true }];
  showModal(`
    <div class="modal-head"><div><h2>Import หลายรูป/หลายวัน</h2><p>อ่านทุกภาพทีละรูป รวมรายการซ้ำ แล้วตรวจสอบก่อนส่งเข้า History และ AI</p></div><button class="icon-btn" data-close>×</button></div>
    ${previewUrl ? `<img class="import-preview import-preview-compact" src="${previewUrl}" alt="ภาพที่นำเข้า">` : ""}
    ${importSandboxPreviewUrls.length > 1 ? `<div class="import-preview-count">เลือกรวม ${importSandboxPreviewUrls.length} รูป • ระบบอ่านทีละรูปเพื่อไม่ให้ iPhone ค้าง</div>` : ""}
    <div id="importOcrStatus" class="import-ocr-status ${warning ? "warning" : ""}">${warning || (loading ? "กำลังเตรียมระบบอ่านข้อมูลหลายวัน…" : `ตรวจพบ ${rows.length} รายการ กรุณาตรวจทุกแถว`)}</div>
    <label class="form-label">Profile<select id="importProfile" class="name-select">${profiles}</select></label>
    <div class="import-multi-head"><span>ใช้</span><span>วันที่</span><span>3 ตัว</span><span>2 ตัว</span><span></span></div>
    <div id="importMultiRows" class="import-multi-rows">${safeRows.map(importRowHtml).join("")}</div>
    <button id="addImportRow" type="button" class="btn secondary full">＋ เพิ่มรายการเอง</button>
    <details class="import-raw"><summary>ข้อความ OCR ที่อ่านได้</summary><pre>${escapeHtml(importSandboxRawText || "กำลังอ่านหรือยังไม่มีข้อความ")}</pre></details>
    <div class="import-safety-box">ไม่มีเพดาน 20 รายการ: ระบบจะบันทึกทุกแถวที่เลือกก่อน จากนั้นอัปเดต Table/History และให้ AI เรียนรู้หนึ่งครั้งหลังข้อมูลครบ เพื่อลดอาการค้างบน iPhone</div>
    <button id="confirmImportSandbox" class="btn primary full import-ai-confirm" ${loading ? "disabled" : ""}>
      <span class="import-ai-confirm-main">✓ ยืนยันทั้งหมดและประมวลผล AI</span>
      <span class="import-ai-confirm-progress" aria-hidden="true"><span></span></span>
      <span class="import-ai-confirm-percent" aria-live="polite"></span>
    </button>
    <button class="btn secondary full" data-close>ยกเลิก</button>
  `);
  bindImportMultiRows();
  document.getElementById("addImportRow")?.addEventListener("click", () => {
    const host = document.getElementById("importMultiRows");
    if (!host) return;
    const count = host.querySelectorAll("[data-import-row]").length;
    host.insertAdjacentHTML("beforeend", importRowHtml({date:isoDate(),number:"",twoDigit:"",enabled:true}, count));
    bindImportMultiRows();
  });
  document.getElementById("confirmImportSandbox")?.addEventListener("click", commitImportSandbox);
}

function bindImportMultiRows() {
  document.querySelectorAll("#importMultiRows [data-import-row]").forEach(row => {
    const date = row.querySelector('[data-field="date"]'); bindOneTapDatePicker(date);
    const n3 = row.querySelector('[data-field="number"]');
    const n2 = row.querySelector('[data-field="twoDigit"]');
    n3?.addEventListener("input", e => e.target.value = e.target.value.replace(/\D/g, "").slice(0,3));
    n2?.addEventListener("input", e => e.target.value = e.target.value.replace(/\D/g, "").slice(0,2));
    row.querySelector("[data-remove-import-row]")?.addEventListener("click", () => row.remove());
  });
}

function collectImportRows() {
  return [...document.querySelectorAll("#importMultiRows [data-import-row]")].map(row => ({
    enabled: row.querySelector('[data-field="enabled"]')?.checked !== false,
    date: row.querySelector('[data-field="date"]')?.value || "",
    number: row.querySelector('[data-field="number"]')?.value || "",
    twoDigit: row.querySelector('[data-field="twoDigit"]')?.value || ""
  })).filter(x => x.enabled);
}

function normalizeImportedHistoryDatesV534() {
  const currentCE = new Date().getFullYear();
  const changed = [];
  (state.actualDraws || []).forEach(item => {
    if (!String(item.source || "").includes("image-import")) return;
    const m = String(item.date || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return;
    const year = Number(m[1]);
    if (Math.abs(year - currentCE) <= 5) return;
    const corrected = `${currentCE}-${m[2]}-${m[3]}`;
    const d = new Date(`${corrected}T12:00:00`);
    if (d.getFullYear() !== currentCE || d.getMonth() + 1 !== Number(m[2]) || d.getDate() !== Number(m[3])) return;
    item.date = corrected;
    item.updatedAt = Date.now();
    item.dateAutoCorrectedV534 = true;
    changed.push(item);
  });
  if (changed.length) {
    // ลบผลนำเข้าซ้ำที่เกิดจาก OCR เดิม โดยเก็บรายการที่แก้ล่าสุดไว้หนึ่งรายการต่อวัน
    const seen = new Set();
    state.actualDraws = [...state.actualDraws].sort((a,b)=>(b.updatedAt||b.createdAt||0)-(a.updatedAt||a.createdAt||0)).filter(item => {
      const key = `${Number(item.profileId||0)}|${item.date}`;
      if (!String(item.source || "").includes("image-import")) return true;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
    changed.forEach(item => { try { upsertDailyTableFromActual(item); } catch (_) {} });
    saveState();
  }
  return changed.length;
}

function updateImportAiProgress(button, percent, message) {
  if (!button) return;
  const safePercent = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
  button.classList.add("processing");
  button.setAttribute("aria-busy", safePercent < 100 ? "true" : "false");
  const main = button.querySelector(".import-ai-confirm-main");
  const bar = button.querySelector(".import-ai-confirm-progress > span");
  const label = button.querySelector(".import-ai-confirm-percent");
  if (main) main.textContent = message || "AI กำลังประมวลผล…";
  if (bar) bar.style.width = `${safePercent}%`;
  if (label) label.textContent = `${safePercent}%`;
}

function waitForImportProgressPaint(ms = 35) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function commitImportSandbox() {
  const button = document.getElementById("confirmImportSandbox");
  const profileId = Number(document.getElementById("importProfile")?.value ?? state.activeProfile);
  const profileName = state.profiles[profileId] || `Profile ${profileId + 1}`;
  const rows = collectImportRows().map(x => ({...x, date: String(x.date || "")}));
  if (!rows.length) return alert("กรุณาเลือกอย่างน้อย 1 รายการ");
  const invalid = rows.find(x => !/^\d{4}-\d{2}-\d{2}$/.test(x.date) || !/^\d{3}$/.test(x.number) || !/^\d{2}$/.test(x.twoDigit));
  if (invalid) return alert("มีข้อมูลไม่ครบ กรุณาตรวจวันที่ เลข 3 ตัว และเลข 2 ตัวทุกแถว");

  // หนึ่ง Profile + หนึ่งวัน = หนึ่งผลจริง ป้องกัน OCR จับเลขข้ามแถว
  const byDate = new Map(); let repeatedInImage = 0;
  rows.sort((a,b)=>a.date.localeCompare(b.date)).forEach(x => {
    if (byDate.has(x.date)) repeatedInImage++;
    else byDate.set(x.date, x);
  });
  const unique = [...byDate.values()];
  const existingByDate = new Map((state.actualDraws || []).filter(x => Number(x.profileId ?? 0) === profileId).map(x => [x.date, x]));
  // Import policy V5.3.9: Profile + date is the unique key.
  // A repeated import updates the existing History record in place regardless
  // of whether that record was originally entered manually or imported.
  // This prevents duplicate History rows while preserving the original id,
  // reference selection, createdAt and any linked records.
  const toInsert = [], toUpdate = []; let skippedSame = 0;
  unique.forEach(x => {
    const existing = existingByDate.get(x.date);
    if (!existing) toInsert.push(x);
    else if (existing.number === x.number && existing.twoDigit === x.twoDigit) skippedSame++;
    else toUpdate.push({existing, row:x});
  });
  const totalChanges = toInsert.length + toUpdate.length;
  if (!totalChanges) return alert("ข้อมูลทั้งหมดมีอยู่ใน History แล้ว จึงไม่ได้บันทึกซ้ำ");
  const skipped = repeatedInImage + skippedSame;
  if ((skipped || toUpdate.length) && !confirm(`ระบบจะเพิ่ม ${toInsert.length} รายการ และอัปเดตทับข้อมูลเดิม ${toUpdate.length} รายการ\nข้ามรายการที่ข้อมูลเหมือนเดิม ${skipped} รายการ\n\nดำเนินการต่อหรือไม่?`)) return;

  button.disabled = true;
  updateImportAiProgress(button, 5, "กำลังเตรียมข้อมูล…");
  await waitForImportProgressPaint();
  const saved = []; const warnings = [];
  for (let index = 0; index < toUpdate.length; index++) {
    const {existing, row} = toUpdate[index];
    updateImportAiProgress(button, 8 + ((index + 1) / Math.max(totalChanges, 1)) * 20, `กำลังบันทึก ${index + 1}/${totalChanges}…`);
    await waitForImportProgressPaint(16);
    // Keep identity/reference metadata so linked Table, History L and Edit state
    // continue to point to the same record. Only the imported result fields and
    // audit metadata are updated.
    Object.assign(existing, {
      number:row.number,
      twoDigit:row.twoDigit,
      profileId,
      profileName,
      note:"นำเข้าจากรูปและอัปเดตทับข้อมูลเดิม (ตรวจสอบแล้ว)",
      updatedAt:Date.now()+index,
      source:"image-import-overwrite-v539",
      importOverwrite:true
    });
    saved.push(existing);
  }
  for (let index = 0; index < toInsert.length; index++) {
    const item = toInsert[index];
    const done = toUpdate.length + index + 1;
    updateImportAiProgress(button, 8 + (done / Math.max(totalChanges, 1)) * 20, `กำลังบันทึก ${done}/${totalChanges}…`);
    await waitForImportProgressPaint(16);
    const savedActual = { id:uid(), profileId, profileName, date:item.date, number:item.number, twoDigit:item.twoDigit, note:"นำเข้าหลายวันจากรูป (ตรวจสอบแล้ว)", referenceTableId:"", source:"image-import-overwrite-v539", createdAt:Date.now() + toUpdate.length + index };
    state.actualDraws.push(savedActual); saved.push(savedActual);
  }
  saveState(); // บันทึกผลจริงก่อนเสมอ
  updateImportAiProgress(button, 30, "✓ บันทึกข้อมูลแล้ว • กำลังสร้างตาราง…");
  await waitForImportProgressPaint();

  // สร้างตารางครบทุกวันก่อน เพื่อให้งวดถัดไปเชื่อมตารางย้อนหลังได้จริง
  saved.sort((a,b)=>a.date.localeCompare(b.date));
  for (let index = 0; index < saved.length; index++) {
    const savedActual = saved[index];
    updateImportAiProgress(button, 30 + ((index + 1) / Math.max(saved.length, 1)) * 35, `กำลังสร้างตาราง ${index + 1}/${saved.length}…`);
    await waitForImportProgressPaint(16);
    try { upsertDailyTableFromActual(savedActual); }
    catch (error) { console.error("Multi import table failed", savedActual.date, error); warnings.push(`Table ${savedActual.date}`); }
  }
  try { syncAutoLHistoryForProfile(profileId); }
  catch (error) { console.error("Multi import L History failed", error); warnings.push("L History"); }
  saveState();
  updateImportAiProgress(button, 72, "✓ Table/History พร้อม • กำลังเตรียม AI…");
  await waitForImportProgressPaint();

  // ฝึก AI เพียงครั้งเดียวหลังมีตารางครบแล้ว ลดอาการค้างบน iPhone และทำให้จำนวน sample ถูกต้อง
  let aiMessage = "AI ยังมีข้อมูลไม่ครบ 8 งวด";
  try {
    updateImportAiProgress(button, 82, `AI กำลังเรียนรู้ ${profileName}…`);
    await waitForImportProgressPaint(60);
    const aiResult = generateAIFormula(profileId);
    if (aiResult?.error) aiMessage = aiResult.error;
    else {
      aiMessage = `AI V${aiResult.version || 1} เรียนรู้ ${aiResult.sampleCount || 0} งวดแล้ว`;
      // เก็บสูตร AI ไว้เพื่อหน้า Compare แม้ยังคงสูตรดั้งเดิมเป็นสูตรหลัก
      (state.dailyTables || []).filter(t => Number(t.profileId) === profileId).forEach(t => {
        t.aiFormulaSnapshot = aiResult.formula;
        t.aiFormulaVersion = aiResult.version || 1;
        t.updatedAt = Date.now();
      });
    }
  } catch (error) {
    console.error("Multi import AI failed", error); warnings.push("AI"); aiMessage = "AI ประมวลผลไม่สำเร็จ แต่ History ถูกบันทึกแล้ว";
  }
  try { syncAutoLHistoryForProfile(profileId); } catch (_) {}
  saveState();
  updateImportAiProgress(button, 100, "✓ ประมวลผลสำเร็จ");
  await waitForImportProgressPaint(550);
  importSandboxPreviewUrl = "";
  importSandboxPreviewUrls = [];
  closeModal(); state.activeProfile = profileId; state.currentView = "history"; saveState(); render();
  const suffix = skipped ? ` • ข้าม/รวมซ้ำ ${skipped}` : "";
  showToast(warnings.length ? `✓ บันทึก ${saved.length} รายการแล้ว${suffix} • ${aiMessage} • มีบางส่วนต้องตรวจสอบ` : `✓ นำเข้า ${saved.length} วันแล้ว • Table/History พร้อม • ${aiMessage}${suffix}`);
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
    <button id="btnSaveActualDraw" class="btn primary full actual-draw-progress-btn">
      <span class="actual-draw-progress-main">Saveเลขออกจริง</span>
      <span class="actual-draw-progress-track" aria-hidden="true"><span></span></span>
      <span class="actual-draw-progress-percent" aria-live="polite"></span>
    </button>
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
  function updateActualDrawProgress(percent, message) {
    const safePercent = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
    saveBtn.classList.add("processing");
    saveBtn.setAttribute("aria-busy", safePercent < 100 ? "true" : "false");
    const main = saveBtn.querySelector(".actual-draw-progress-main");
    const bar = saveBtn.querySelector(".actual-draw-progress-track > span");
    const label = saveBtn.querySelector(".actual-draw-progress-percent");
    if (main) main.textContent = message || "กำลังบันทึกและประมวลผล…";
    if (bar) bar.style.width = `${safePercent}%`;
    if (label) label.textContent = `${safePercent}%`;
  }

  const waitForActualDrawProgressPaint = (ms = 45) => new Promise(resolve => setTimeout(resolve, ms));

  saveBtn.addEventListener("click", async () => {
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

    // ป้องกันการกดซ้ำ + แสดงสถานะจริงของขั้นตอนเฉพาะปุ่มนี้บน iPhone/PWA
    saveBtn.disabled = true;
    updateActualDrawProgress(8, "กำลังเตรียมข้อมูล…");
    await waitForActualDrawProgressPaint(70);

    let savedActual;
    try {
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
        // อนุญาตให้บันทึกมากกว่าหนึ่งรายการใน Profile/วันที่เดียวกันหลังผู้ใช้กดยืนยัน
        savedActual = { id: uid(), profileId, profileName, date, number, twoDigit, note, referenceTableId:"", source:"manual", createdAt: Date.now() };
        state.actualDraws.push(savedActual);
      }

      // บันทึกข้อมูลหลักก่อนเสมอ เพื่อไม่ให้ขั้นตอนสร้างตาราง/AI ทำให้ข้อมูลผลจริงสูญหาย
      saveState();
      updateActualDrawProgress(30, "✓ บันทึกผลจริงแล้ว • กำลังอัปเดต History…");
      await waitForActualDrawProgressPaint(70);

      let autoTable = null;
      let aiUpdate = null;
      const warnings = [];

      try {
        autoTable = upsertDailyTableFromActual(savedActual);
        syncAutoLHistoryForActual(savedActual);
        // กรณีมีผลวันถัดไปถูกบันทึกไว้ก่อนแล้ว ให้คำนวณใหม่ทันทีหลังตารางวันนี้พร้อม
        syncAutoLHistoryForProfile(profileId);
      } catch (historyError) {
        console.error("Actual result saved, but history/table sync failed", historyError);
        warnings.push("History/Table");
      }

      updateActualDrawProgress(65, warnings.includes("History/Table") ? "บันทึกแล้ว • กำลังประมวลผล AI…" : "✓ History/Table พร้อม • กำลังประมวลผล AI…");
      await waitForActualDrawProgressPaint(70);

      try {
        // AI เรียนรู้และพัฒนาสูตรอัตโนมัติหลังบันทึกผลจริง
        aiUpdate = autoEvolveAfterActualSave(profileId);
        // Lock AI-L + Master predictions for the next business draw before that result exists.
        if (autoTable) saveAIPredictionSnapshotsForTable(autoTable);
      } catch (aiError) {
        console.error("Actual result saved, but AI update failed", aiError);
        warnings.push("AI");
      }

      // เก็บผลจากการ Sync/AI ที่ทำสำเร็จอีกครั้ง
      updateActualDrawProgress(88, warnings.includes("AI") ? "กำลังบันทึกผลสุดท้าย…" : "✓ AI อัปเดตแล้ว • กำลังบันทึกผลสุดท้าย…");
      await waitForActualDrawProgressPaint(70);
      saveState();
      updateActualDrawProgress(100, warnings.length ? "✓ บันทึกสำเร็จ • มีบางส่วนให้ตรวจสอบ" : "✓ ประมวลผลสำเร็จ");
      await waitForActualDrawProgressPaint(450);
      closeModal();
      state.currentView = "history";
      render();

      if (warnings.length) {
        showToast(`✓ บันทึกผลจริงแล้ว • ตรวจสอบ ${warnings.join(" / ")} ภายหลัง`);
      } else {
        showToast(autoTable ? "✓ บันทึกผลแล้ว • History Updated • Next Table Ready • AI Updated" : "✓ บันทึกผลแล้ว • AI Updated");
      }

    if (aiUpdate?.recommended) {
      setTimeout(() => {
        const useNew = confirm(`พบสูตร AI รุ่นใหม่ที่ดีกว่า\n\nคะแนนเดิม ${aiUpdate.previousScore}% → สูตรใหม่ ${aiUpdate.newScore}%\nดีขึ้น +${aiUpdate.improvement}%\n\nต้องการใช้สูตรใหม่นี้เป็นสูตรหลักหรือไม่?`);
        if (useNew) {
          state.activeFormulaByProfile = state.activeFormulaByProfile || {};
          state.activeFormulaByProfile[profileId] = "ai";
          state.grid = calculateGrid(state.lastInput, profileId);
          saveState();
          render();
          showToast("✓ เปลี่ยนเป็นสูตร AI รุ่นใหม่แล้ว");
        } else {
          showToast("เก็บสูตรใหม่ไว้แล้ว • ยังไม่เปลี่ยนสูตรหลัก");
        }
      }, 150);
    }
    } catch (saveError) {
      console.error("Save actual result failed", saveError);
      saveBtn.disabled = false;
      saveBtn.classList.remove("processing");
      saveBtn.removeAttribute("aria-busy");
      const main = saveBtn.querySelector(".actual-draw-progress-main");
      const bar = saveBtn.querySelector(".actual-draw-progress-track > span");
      const label = saveBtn.querySelector(".actual-draw-progress-percent");
      if (main) main.textContent = "Saveเลขออกจริง";
      if (bar) bar.style.width = "0%";
      if (label) label.textContent = "";
      alert("บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง โดยข้อมูลเดิมยังไม่ถูกลบ");
    }
  });
}

function openActualDrawDetail(id) {
  const r = state.actualDraws.find(x => x.id === id); if (!r) return;
  const profileId = Number(r.profileId ?? 0);
  const profileName = r.profileName || state.profiles[profileId] || state.profiles[0] || "Profile 1";
  const t = getPredictionTable(profileId, r.date, r);
  const expected = getExpectedReferenceDate(r.date);
  const aiSaved = state.aiFormulaLab?.[profileId];
  const aiFormula = getHistoricalAIFormula(profileId, r.date, r);

  let comparisonHtml = `<div class="detail-card"><div><span>Profile</span><b>${escapeHtml(profileName)}</b></div><div><span>วันที่ผลจริง</span><b>${formatDateTH(r.date)}</b></div><div><span>ต้องใช้ตารางวันที่</span><b>${formatDateTH(expected)}</b></div><div><span>สถานะตาราง</span><b>ยังไม่บันทึกตาราง</b></div><div><span>สถานะ</span><b>ยังไม่คำนวณ L</b></div><div><span>Note</span><b>${escapeHtml(r.note || "-")}</b></div></div>`;

  if (t) {
    const inputs = Array.isArray(t.inputDigits) && t.inputDigits.length === 5 ? t.inputDigits : [];
    const original = formulaMatchDetail(r.number, inputs, getOriginalFormula());
    const ai = aiFormula ? formulaMatchDetail(r.number, inputs, aiFormula) : {status:"pending", matched:"-", grid:null};
    const winner = formulaWinner(original.status, ai.status, Boolean(aiFormula));
    const winnerText = winner === "AI" ? "AI ชนะ — ตาราง AI ให้ผลดีกว่า" : winner === "เดิม" ? "สูตรเดิมชนะ" : winner === "เสมอ" ? "ผลเท่ากัน" : "ยังไม่มีสูตร AI";
    const statusBox = (title, detail, kind) => `<section class="formula-detail-panel ${kind}"><div class="formula-detail-title"><div><small>${title}</small><b>${formulaStatusLabel(detail.status)}</b></div><span class="status ${detail.status} ${kind === "ai" ? "ai-status" : ""}">${formulaStatusLabel(detail.status)}</span></div>${detail.grid ? gridHtml(detail.grid) : '<div class="ai-empty compact">ยังไม่มีตาราง AI</div>'}<div class="formula-detail-meta"><span>ผลจากรูปแบบ L</span><b>${escapeHtml(detail.matched || "-")}</b></div></section>`;
    comparisonHtml = `<div class="comparison-winner ${winner === "AI" ? "ai" : winner === "เดิม" ? "original" : "tie"}"><small>ผลการเปรียบเทียบ</small><strong>${winnerText}</strong><span>Exact = Hit • เลขกลับ = Hit • Not Found = Miss</span></div>
      <div class="formula-detail-stack">
        ${statusBox("ตารางดั้งเดิม", original, "original")}
        ${statusBox("ตาราง AI", ai, "ai")}
      </div>
      <div class="detail-card"><div><span>Profile</span><b>${escapeHtml(profileName)}</b></div><div><span>วันที่ผลจริง</span><b>${formatDateTH(r.date)}</b></div><div><span>ใช้ตารางวันที่</span><b>${formatDateTH(t.date)}${r.referenceTableId ? " (เลือกเอง)" : " (อัตโนมัติ)"}</b></div><div><span>สูตรเดิม</span><b>${formulaStatusLabel(original.status)}${original.matched !== "-" ? ` • ${escapeHtml(original.matched)}` : ""}</b></div><div><span>สูตร AI</span><b>${aiFormula ? `${formulaStatusLabel(ai.status)}${ai.matched !== "-" ? ` • ${escapeHtml(ai.matched)}` : ""}` : "ยังไม่มีสูตร AI"}</b></div><div><span>ผู้ชนะ</span><b>${winner}</b></div><div><span>Note</span><b>${escapeHtml(r.note || "-")}</b></div></div>`;
  }

  showModal(`<div class="modal-head"><div><h2>เลขออกจริง 3 หลัก</h2><p>${formatDateTH(r.date)} • ${DAYS_TH[new Date(`${r.date}T12:00:00`).getDay()]}</p></div><button class="icon-btn" data-close>×</button></div>
    <div class="actual-result-pair"><div><small>3 ตัว</small><strong>${escapeHtml(r.number)}</strong></div><div><small>2 ตัว</small><strong>${escapeHtml(r.twoDigit || "--")}</strong></div></div>
    ${comparisonHtml}
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
  [["masterLearning","learning"],["masterAdaptive","adaptiveWeight"],["masterBacktest","backtest"]].forEach(([id,key])=>document.getElementById(id)?.addEventListener("change",e=>{state.masterAISettings={...DEFAULT_STATE.masterAISettings,...(state.masterAISettings||{}),[key]:Boolean(e.target.checked)};saveState();render();}));
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
    const reversedPoints = exactPoints;
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
  document.getElementById("btnExport")?.addEventListener("click", () => downloadBackup("manual"));
  document.getElementById("importFile")?.addEventListener("change", async e => {
    try {
      const parsed = JSON.parse(await e.target.files[0].text());
      const data = unwrapBackup(parsed);
      if (!data || typeof data !== "object") throw new Error("Invalid backup");
      const existingCount = (state.records?.length || 0) + (state.actualDraws?.length || 0) + (state.dailyTables?.length || 0);
      if (existingCount > 0 && !confirm("การกู้คืนจะใช้ข้อมูลจากไฟล์แทนข้อมูลปัจจุบัน ต้องการดำเนินการต่อหรือไม่?")) return;
      state={...DEFAULT_STATE,...data};
      state.actualDraws=Array.isArray(data.actualDraws)?data.actualDraws:[];
      state.dailyTables=Array.isArray(data.dailyTables)?data.dailyTables:[];
      state.records=Array.isArray(data.records)?data.records:[];
      state.profiles=Array.isArray(data.profiles)&&data.profiles.length?data.profiles:[...DEFAULT_STATE.profiles];
      state.activeProfile=Math.min(Number(state.activeProfile)||0,state.profiles.length-1);
      state.backupSettings={...DEFAULT_STATE.backupSettings,...(data.backupSettings||{})};
      saveState(); render(); alert(`กู้คืนเรียบร้อย\nHistory ${state.records.length} รายการ\nผลจริง ${state.actualDraws.length} รายการ\nตาราง ${state.dailyTables.length} รายการ`);
    }
    catch (error) { console.error(error); alert("ไฟล์ไม่ถูกต้องหรือไฟล์เสียหาย"); }
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
async function startApplication() {
  await bootstrapPersistentState();
  // ทำ migration หลังจากเลือก State ที่สมบูรณ์ที่สุดแล้วเท่านั้น
  state.records = Array.isArray(state.records) ? state.records.filter(r => r && r.status !== "notfound") : [];
  state.actualDraws = Array.isArray(state.actualDraws) ? state.actualDraws : [];
  state.dailyTables = Array.isArray(state.dailyTables) ? state.dailyTables : [];
  normalizeImportedHistoryDatesV534();
  state.actualDraws.forEach(syncAutoLHistoryForActual);
  saveState();
  render();
  bindGlobalKeypad();
}

window.addEventListener("pagehide", () => {
  try { saveState(); } catch {}
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    try { saveState(); } catch {}
  }
});
startApplication().catch(error => {
  console.error("Application bootstrap failed", error);
  render();
  bindGlobalKeypad();
});

// LuckyNumber V6.7.4: L × AI overlap scope fixed; All=AI Top100, Top10/5/3 compare their true AI rank pools.
// LuckyNumber V4.25: simple result entry; reference-table selection is available only in Edit.
