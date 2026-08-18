"use strict";

const APP_VERSION = "7.09.60-IMPORT-HISTORY-DURABILITY-GUARD";
const APP_DISPLAY_VERSION = "V7.09.60 • Import History Durability Guard";
const MASTER_AI_PAUSED = true; // Legacy Master is permanently paused. Old stored history is preserved only for backward compatibility.
const MASTER_BASIC_TEST = true; // R48: Basic V1.2 Exact Mirror. Selector stays simple Prior-only; Walk-Forward BASIC result is mirrored 1:1 from the engine selected on that draw.
const MASTER_BASIC_MIN_PRIOR = 8;
const MASTER_AI_V1_ACTIVE = true; // V7.08: production Master AI with separate internal Safety Proof and Pick Proof gates.
const MASTER_AI_V1_MIN_PRIOR = 8;
const MASTER_AI_V1_WINDOWS = Object.freeze([
  Object.freeze({size:7,weight:0.28,label:"7"}),
  Object.freeze({size:14,weight:0.22,label:"14"}),
  Object.freeze({size:30,weight:0.20,label:"30"}),
  Object.freeze({size:60,weight:0.18,label:"60"}),
  Object.freeze({size:Infinity,weight:0.12,label:"All"})
]);
const BACKUP_FORMAT_VERSION = 4;
const MASTER_MIN_EVIDENCE = 8;
const PROFILE_AI_MIN_TRUSTED_EVIDENCE = 8; // Profile AI Confidence: Verified Live / strict WF only
const ML_SELECT_MIN_PRIOR = 8;
const ML_SELECT_ENGINES = ["classic","aiL","gl","independent","pair"];

const STORAGE_KEY = "luckyNumberProV4_5";
const WF_JOB_KEY = "luckyNumberProV4_5_wf_job";
const WF_COMPLETION_KEY = "luckyNumberProV6_10_40_wf_completion";
const PROFILE_JOURNAL_KEY = "luckyNumberProV4_5_profile_journal_v1";
const BOOT_STATE_KEY = "luckyNumberProV4_5_boot_v61031";
const LEGACY_BOOT_STATE_KEYS = ["luckyNumberProV4_5_boot_v61030", "luckyNumberProV4_5_boot_v61029", "luckyNumberProV4_5_boot_v61028", "luckyNumberProV4_5_boot_v61027"];
const WF_CACHE_SCHEMA = 4;
const WF_ENGINE_VERSION = "7.09.28-ai-gl-hybrid-strict-prior-only-v35";
const LEGACY_KEYS = ["luckyNumberProV4_4", "luckyNumberProV4_3", "luckyNumberProV4_2", "luckyNumberProV4_1", "luckyNumberProV4", "luckyNumberProV1", "luckyNumberProV3"];
const DAYS_TH = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// V6.9.8 — reference-table durability hotfix on top of V6.9.7 durable resumable WF: preserves the exact WF algorithm/output while checkpointing
// partial progress in IndexedDB. Interrupted Full Backtests resume from the last committed draw,
// and completed WF state is durably committed before a job is considered finished.
// Keeps V6.9.2 modal safety, V6.9.1 compact L Results, and V6.9.0 Dashboard UX.
// Core AI/WF methodology remains unchanged from V6.8.7; this release reorganizes the interface for faster daily use.
// Recent evidence stays strongest, while older History is never discarded completely.
const AI_HISTORY_WINDOWS = Object.freeze([
  Object.freeze({ size: 10,       weight: 0.32, label: "10" }),
  Object.freeze({ size: 20,       weight: 0.26, label: "20" }),
  Object.freeze({ size: 60,       weight: 0.18, label: "60" }),
  Object.freeze({ size: 120,      weight: 0.14, label: "120" }),
  Object.freeze({ size: Infinity, weight: 0.10, label: "All" })
]);
const DEFAULT_STATE = {
  profiles: ["Taiwan", "Korea", "Hong", "Profile 4", "Profile 5"],
  activeProfile: 0,
  _profileRevision: 0,
  lastInput: ["", "", "", "", ""],
  grid: null,
  records: [],
  actualDraws: [],
  dailyTables: [],
  selectedL: null,
  currentView: "home",
  weekOffset: 0,
  theme: "auto",
  historyTab: "results",
  historyFormulaMode: "compare",
  calculationDate: null,
  analysisSortMode: "ai",
  analysisWinWindow: 7,
  analysisWinShowDetails: false,
  analysisWinCalendarMonth: "",
  analysisWinSelectedDate: "",
  profileOrderMode: "default", // V6.2: default | ai (presentation order only)
  rankingConfig: { exactPoints: 1, reversedPoints: 1, weight10: 50, weight30: 30, weightAll: 20 },
  aiFormulaLab: {},
  aiLearningStatus: {},
  aiGLFormulaLab: {},
  aiGLLearningStatus: {},
  walkForwardBacktests: {},
  walkForwardRebuildJob: null,
  activeFormulaByProfile: {},
  formulaStrategyVersion: 3, // V7.09.28: AUTO / Classic / AI L / AI GL per profile
  webSync: { endpoint: "", lastSyncAt: null, lastStatus: "idle", importedCount: 0 },
  backupSettings: { autoDownloadAfterActualSave: false, lastBackupAt: null, lastBackupReason: "", backupCount: 0 },
  masterAISettings: { learning: true, adaptiveWeight: true, backtest: true }
};

// V6.10.33 — History header cleanup + visible version update; Deep History Rescue preserved.
// V6.10.33 — History Edit 3D/2D column separation is CSS-only; History storage/rescue remains unchanged.
// V6.10.40 — Analysis anti-leak audit moved to bottom + collapsible/readable UI; anti-leak/storage/rescue logic unchanged.
// The boot snapshot is UI-only. It must NEVER participate in deciding which full
// persistence source is newest, because it intentionally omits History / AI / WF data.
function readBootStatePatch() {
  const keys = [BOOT_STATE_KEY, ...LEGACY_BOOT_STATE_KEYS];
  for (const key of keys) {
    try {
      const raw = JSON.parse(localStorage.getItem(key) || "null");
      if (raw && typeof raw === "object") return raw;
    } catch (_) {}
  }
  return null;
}

function bootStateTimestamp(patch) {
  // V6.10.27 used _persistenceUpdatedAt inside the compact snapshot. Read it only
  // as the snapshot's own age for migration; never copy it into the full state.
  return Number(patch?._bootSnapshotAt || patch?._persistenceUpdatedAt || 0);
}

function normalizeProfileNameKey(name) {
  return String(name || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function resolveBootActiveProfile(target, patch) {
  const profiles = Array.isArray(target?.profiles) ? target.profiles : [];
  const legacyProfiles = Array.isArray(patch?.profiles) ? patch.profiles : [];
  const legacyIndex = Number(patch?.activeProfile || 0);
  const wantedName = String(patch?.activeProfileName || legacyProfiles[legacyIndex] || "").trim();
  if (wantedName) {
    const key = normalizeProfileNameKey(wantedName);
    const found = profiles.findIndex(name => normalizeProfileNameKey(name) === key);
    if (found >= 0) return found;
  }
  return Number.isInteger(legacyIndex) && legacyIndex >= 0 && legacyIndex < profiles.length ? legacyIndex : Number(target?.activeProfile || 0);
}

function applyBootStatePatch(target, patch) {
  if (!patch || !target) return target;
  const targetTs = Number(target?._persistenceUpdatedAt || 0);
  const patchTs = bootStateTimestamp(patch);
  // Do not let an older UI mirror overwrite newer UI fields from a newer full state.
  if (targetTs && patchTs && patchTs < targetTs) return target;

  const next = { ...target };
  const simpleKeys = [
    "selectedL", "currentView", "theme", "historyTab",
    "historyFormulaMode", "calculationDate", "profileOrderMode", "formulaStrategyVersion"
  ];
  simpleKeys.forEach(key => { if (Object.prototype.hasOwnProperty.call(patch, key)) next[key] = patch[key]; });
  // V6.10.31: NEVER copy patch.profiles. A compact UI mirror must not redefine
  // Profile identity/order because History is keyed by profileId. Resolve only the
  // active Profile by its saved name against the full state's Profile list.
  next.activeProfile = resolveBootActiveProfile(next, patch);
  if (Array.isArray(patch.lastInput)) next.lastInput = patch.lastInput;
  if (Object.prototype.hasOwnProperty.call(patch, "grid")) next.grid = patch.grid;
  if (patch.activeFormulaByProfile && typeof patch.activeFormulaByProfile === "object") next.activeFormulaByProfile = patch.activeFormulaByProfile;
  // IMPORTANT: never assign patch._persistenceUpdatedAt to next._persistenceUpdatedAt.
  return next;
}

function writeBootStateSnapshot(source = state) {
  try {
    const boot = {
      _bootSnapshotAt: Number(source?._persistenceUpdatedAt || Date.now()),
      activeProfile: Number(source?.activeProfile || 0),
      activeProfileName: Array.isArray(source?.profiles) ? String(source.profiles[Number(source?.activeProfile || 0)] || "") : "",
      lastInput: Array.isArray(source?.lastInput) ? source.lastInput : ["","","",""],
      grid: source?.grid ?? null,
      selectedL: source?.selectedL ?? null,
      currentView: source?.currentView || "home",
      theme: source?.theme || "auto",
      historyTab: source?.historyTab || "results",
      historyFormulaMode: source?.historyFormulaMode || "compare",
      calculationDate: source?.calculationDate ?? null,
      profileOrderMode: source?.profileOrderMode === "ai" ? "ai" : "default",
      formulaStrategyVersion: Number(source?.formulaStrategyVersion || 3),
      activeFormulaByProfile: source?.activeFormulaByProfile && typeof source.activeFormulaByProfile === "object"
        ? source.activeFormulaByProfile : {}
    };
    localStorage.setItem(BOOT_STATE_KEY, JSON.stringify(boot));
    // Remove the V6.10.27 mirror after a successful migration so its timestamp can
    // never influence future startup behavior, even if old code is briefly cached.
    LEGACY_BOOT_STATE_KEYS.forEach(key => { try { localStorage.removeItem(key); } catch (_) {} });
    return true;
  } catch (error) {
    console.warn("Boot snapshot write unavailable", error);
    return false;
  }
}

const initialBootStatePatch = readBootStatePatch();
let state = applyBootStatePatch(loadState(), initialBootStatePatch);
// V7.09.17 — Analysis always opens on AI Recommend. Users can still inspect other tabs during the current visit.
if (state.currentView === "analysis") { state.analysisSortMode = "ai"; state.profileOrderMode = "ai"; }
let currentLResults = [];
let currentLRankLimit = 0; // 0 = แสดงทั้งหมดเหมือน V4.46
let currentLResultMode = "l"; // V7.09.49: AUTO owns BLEND internally; visible modes = l | ai | gl | independent | master | overlap
// V6.10.10 — view-only Independent table preview in Calculate.
// This is intentionally ephemeral and never changes the active AUTO / Classic / AI formula strategy.
let independentCalculatePreviewProfile = null;
let calculatorTableViewMode = "original"; // V7.09.35 single Calculator table tabs: Classic / AI L / AI GL
// V7.09.19 — view-only ML Select table preview. It never changes AUTO/formula, History,
// snapshots, WF evidence, or saved calculator state. The table is rebuilt from strict prior-only
// ML selection plus the latest completed source draw strictly before the ML target.
let mlCalculatePreviewProfile = null;
// V6.10.16 — History Edit/Done toggles in-place; no scroll jump on Edit or Delete reveal.
// They are never persisted and therefore cannot affect AI/WF calculations or saved results.
let historyEditMode = false;
let historyDeleteRevealId = null;
// V6.10.38: keep the detailed History manager collapsed by default so the new History dashboard remains the primary view.
// This is UI-only and does not change/delete/migrate any saved History data.
let historyManagerOpen = false;
const app = document.getElementById("app");

// V6.8.2 — JSON restore rebuilds fair walk-forward backtests + universal pre-result prediction snapshots; based on V6.7.4 navigation. Cache rendered page HTML while the underlying
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
  pairAI: new Map(),
  pairSummary: new Map(),
  masterWeights: new Map(),
  masterAI: new Map(),
  masterSummary: new Map(),
  wfVerify: new Map(),
  mlSelect: new Map()
};
let activeRenderPerfSignature = "";
const AI_FORMULA_RECOVERY_IN_FLIGHT = new Set(); // V6.4.8: one-time recovery for profiles whose candidate was deleted by V6.4.7
const WF_BOOTSTRAP_IN_FLIGHT = new Set(); // V6.9.5: first missing WF cache builds once in background after a fast save

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
  const glFormulaSig = Object.entries(state.aiGLFormulaLab || {}).map(([id, saved]) =>
    `${id}:${compactFormulaSignature(saved?.formula)}:${compactFormulaSignature(saved?.parentAIFormula)}`
  ).join("|");
  const m = state.masterAISettings || {};
  return [
    drawSig,
    tableSig,
    formulaSig,
    glFormulaSig,
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



// V6.10.40-R9 Profile durable transaction guard.
// Profile delete operations are journaled synchronously in a tiny localStorage entry
// before the large app state is committed. If iOS kills the PWA before IndexedDB
// catches up, startup replays only the missing Profile mutations instead of reviving
// deleted Profiles from an older full-state snapshot.
function readProfileJournal() {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILE_JOURNAL_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter(x => x && typeof x === "object").slice(-24) : [];
  } catch (_) { return []; }
}
function writeProfileJournal(entries) {
  try {
    localStorage.setItem(PROFILE_JOURNAL_KEY, JSON.stringify((Array.isArray(entries) ? entries : []).slice(-24)));
    return true;
  } catch (error) {
    console.warn("Profile journal write unavailable", error);
    return false;
  }
}
function sameProfileList(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (String(a[i] || "") !== String(b[i] || "")) return false;
  return true;
}
function remapCandidateAfterProfileDelete(candidate, op) {
  if (!candidate || !op || op.type !== "delete") return candidate;
  const revision = Number(op.revision || 0);
  if (!revision || Number(candidate._profileRevision || 0) >= revision) return candidate;

  const before = Array.isArray(op.beforeProfiles) ? op.beforeProfiles.map(x => String(x || "")) : [];
  const after = Array.isArray(op.afterProfiles) ? op.afterProfiles.map(x => String(x || "")) : [];
  if (!after.length) return candidate;

  // Already has the post-delete list but missed only the revision marker.
  if (sameProfileList(candidate.profiles, after)) {
    return { ...candidate, _profileRevision: revision, _persistenceUpdatedAt: Math.max(Number(candidate._persistenceUpdatedAt || 0), Number(op.updatedAt || 0)) };
  }

  let deleteIndex = -1;
  const profiles = Array.isArray(candidate.profiles) ? candidate.profiles.map(x => String(x || "")) : [];
  const wantedKey = normalizeProfileNameKey(op.deletedName);
  const matches = profiles.map((name, i) => normalizeProfileNameKey(name) === wantedKey ? i : -1).filter(i => i >= 0);
  if (matches.length === 1) deleteIndex = matches[0];
  if (deleteIndex < 0 && Number.isInteger(Number(op.deletedIndex))) {
    const idx = Number(op.deletedIndex);
    const expected = before[idx];
    if (idx >= 0 && idx < profiles.length && (!expected || normalizeProfileNameKey(profiles[idx]) === normalizeProfileNameKey(expected))) deleteIndex = idx;
  }
  if (deleteIndex < 0) return candidate;

  const indexMap = new Map();
  for (let oldIndex = 0; oldIndex < profiles.length; oldIndex++) {
    if (oldIndex !== deleteIndex) indexMap.set(oldIndex, oldIndex > deleteIndex ? oldIndex - 1 : oldIndex);
  }
  const remapRows = rows => (Array.isArray(rows) ? rows : []).filter(item => Number(item?.profileId) !== deleteIndex).map(item => {
    const oldId = Number(item?.profileId);
    if (!indexMap.has(oldId)) return item;
    const newId = indexMap.get(oldId);
    return { ...item, profileId: newId, profileName: after[newId] || item.profileName };
  });
  const remapObject = (source, transform = value => value) => {
    const out = {};
    Object.entries(source || {}).forEach(([key, value]) => {
      const oldId = Number(key);
      if (!indexMap.has(oldId)) return;
      const newId = indexMap.get(oldId);
      out[newId] = transform(value, newId);
    });
    return out;
  };

  const next = {
    ...candidate,
    profiles: after,
    records: remapRows(candidate.records),
    actualDraws: remapRows(candidate.actualDraws),
    dailyTables: remapRows(candidate.dailyTables),
    aiFormulaLab: remapObject(candidate.aiFormulaLab),
    aiLearningStatus: remapObject(candidate.aiLearningStatus),
    aiGLFormulaLab: remapObject(candidate.aiGLFormulaLab),
    aiGLLearningStatus: remapObject(candidate.aiGLLearningStatus),
    activeFormulaByProfile: remapObject(candidate.activeFormulaByProfile),
    walkForwardBacktests: remapObject(candidate.walkForwardBacktests, (bucket, newId) => {
      if (!bucket || typeof bucket !== "object") return bucket;
      const nextBucket = { ...bucket, profileId: newId };
      if (Array.isArray(bucket.records)) nextBucket.records = bucket.records.map(r => r && typeof r === "object" ? { ...r, profileId: newId } : r);
      return nextBucket;
    }),
    // A journal replay means the full snapshot was stale. Do not resume a rebuild
    // job that was created against the pre-delete Profile indexes. Startup can create
    // a fresh safe job from the remapped History if needed.
    walkForwardRebuildJob: null,
    _profileRevision: revision,
    _persistenceUpdatedAt: Math.max(Number(candidate._persistenceUpdatedAt || 0), Number(op.updatedAt || 0))
  };
  const active = Number(candidate.activeProfile || 0);
  next.activeProfile = active === deleteIndex ? Math.min(deleteIndex, after.length - 1) : (active > deleteIndex ? active - 1 : active);
  return next;
}
function applyProfileJournalToCandidate(candidate) {
  let next = candidate;
  for (const op of readProfileJournal().sort((a,b) => Number(a.revision || 0) - Number(b.revision || 0))) {
    if (op.type === "delete") next = remapCandidateAfterProfileDelete(next, op);
  }
  return next;
}
function nextProfileRevision() {
  state._profileRevision = Math.max(0, Number(state._profileRevision || 0)) + 1;
  return state._profileRevision;
}
function journalProfileDelete(beforeProfiles, deletedIndex, deletedName, afterProfiles, revision) {
  const entries = readProfileJournal();
  entries.push({
    type: "delete",
    revision: Number(revision || 0),
    updatedAt: Date.now(),
    deletedIndex: Number(deletedIndex),
    deletedName: String(deletedName || ""),
    beforeProfiles: Array.isArray(beforeProfiles) ? [...beforeProfiles] : [],
    afterProfiles: Array.isArray(afterProfiles) ? [...afterProfiles] : []
  });
  writeProfileJournal(entries);
}

function finalizeLoadedState(raw) {
  const base = typeof structuredClone === "function" ? structuredClone(DEFAULT_STATE) : JSON.parse(JSON.stringify(DEFAULT_STATE));
  const merged = { ...base, ...(raw || {}), profiles: Array.isArray(raw?.profiles) && raw.profiles.length > 0 ? raw.profiles : base.profiles, records: Array.isArray(raw?.records) ? raw.records.filter(r => r && r.status !== "notfound") : [], actualDraws: Array.isArray(raw?.actualDraws) ? raw.actualDraws : [], dailyTables: Array.isArray(raw?.dailyTables) ? raw.dailyTables : [] };
  merged.rankingConfig = { ...base.rankingConfig, ...(raw?.rankingConfig || {}) };
  merged.webSync = { ...base.webSync, ...(raw?.webSync || {}) };
  merged.backupSettings = { ...base.backupSettings, ...(raw?.backupSettings || {}) };
  merged.masterAISettings = { ...base.masterAISettings, ...(raw?.masterAISettings || {}) };
  merged.aiFormulaLab = raw?.aiFormulaLab && typeof raw.aiFormulaLab === "object" ? raw.aiFormulaLab : {};
  merged.aiLearningStatus = raw?.aiLearningStatus && typeof raw.aiLearningStatus === "object" ? raw.aiLearningStatus : {};
  merged.aiGLFormulaLab = raw?.aiGLFormulaLab && typeof raw.aiGLFormulaLab === "object" ? raw.aiGLFormulaLab : {};
  merged.aiGLLearningStatus = raw?.aiGLLearningStatus && typeof raw.aiGLLearningStatus === "object" ? raw.aiGLLearningStatus : {};
  merged.walkForwardBacktests = raw?.walkForwardBacktests && typeof raw.walkForwardBacktests === "object" ? raw.walkForwardBacktests : {};
  merged.walkForwardRebuildJob = raw?.walkForwardRebuildJob && typeof raw.walkForwardRebuildJob === "object" ? raw.walkForwardRebuildJob : null;
  merged.activeFormulaByProfile = raw?.activeFormulaByProfile && typeof raw.activeFormulaByProfile === "object" ? raw.activeFormulaByProfile : {};
  if (Number(raw?.formulaStrategyVersion || 0) < 2) {
    const migrated = {};
    for (let i = 0; i < merged.profiles.length; i++) {
      const oldMode = merged.activeFormulaByProfile?.[i];
      migrated[i] = oldMode === "ai" ? "ai" : "auto";
    }
    merged.activeFormulaByProfile = migrated;
  }
  // V3 adds manual AI GL while preserving every existing AUTO / Classic / AI L choice.
  Object.keys(merged.activeFormulaByProfile).forEach(key => {
    const mode=merged.activeFormulaByProfile[key];
    if(!["auto","original","ai","gl"].includes(mode)) merged.activeFormulaByProfile[key]="auto";
  });
  merged.formulaStrategyVersion = 3;
  merged.profileOrderMode = raw?.profileOrderMode === "ai" ? "ai" : "default";
  return repairExistingHistoryProfileMapping(merged);
}

function loadState() {
  try {
    // R54 Performance Cleanup: MAIN is the synchronous durability authority because
    // saveState() commits it before returning. On a normal launch with healthy History,
    // parse only this one large payload. Shadow/snapshots/legacy copies remain fully
    // intact and are parsed only when MAIN is missing, corrupt, explicitly empty, or
    // needs History rescue. This removes several redundant multi-hundred-KB JSON.parse
    // calls from every iPhone cold start without weakening recovery safety.
    try {
      const mainText = localStorage.getItem(STORAGE_KEY);
      if (mainText) {
        const main = applyProfileJournalToCandidate(JSON.parse(mainText));
        if (main && typeof main === "object" && (stateHasHistoryPayload(main) || Number(main._historyResetAt || 0) > 0)) {
          return finalizeLoadedState(main);
        }
      }
    } catch (_) {
      // Fall through to the full recovery scan below.
    }

    const candidates = [];
    const keys = [
      STORAGE_KEY,
      `${STORAGE_KEY}_shadow`,
      `${STORAGE_KEY}_snapshot_1`,
      `${STORAGE_KEY}_snapshot_2`,
      ...LEGACY_KEYS
    ];
    keys.forEach((key, priority) => {
      try {
        const text = localStorage.getItem(key);
        if (text) candidates.push({ key, priority, data: applyProfileJournalToCandidate(JSON.parse(text)) });
      } catch (_) {}
    });
    const stamped = candidates.filter(x => Number(x.data?._persistenceUpdatedAt || 0) > 0);
    let selected = stamped.length
      ? stamped.sort((a,b) => Number(b.data._persistenceUpdatedAt || 0) - Number(a.data._persistenceUpdatedAt || 0) || a.priority - b.priority)[0]
      : candidates.sort((a,b) => stateRecoveryScore(b.data) - stateRecoveryScore(a.data) || a.priority - b.priority)[0];

    if (selected?.data && !stateHasHistoryPayload(selected.data) && !Number(selected.data?._historyResetAt || 0)) {
      const recovery = candidates
        .filter(x => stateHasHistoryPayload(x.data) && !explicitHistoryResetWins(selected.data, x.data))
        .sort((a,b) => stateRecoveryScore(b.data) - stateRecoveryScore(a.data) || a.priority - b.priority)[0];
      if (recovery?.data) {
        selected = { ...selected, data: mergeRecoveredHistory(selected.data, recovery.data, `localStorage:${recovery.key}`) };
      }
    }
    return finalizeLoadedState(selected?.data || null);
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

function stateRecoveryScore(candidate) {
  if (!candidate || typeof candidate !== "object") return -1;
  const aiModels = Object.values(candidate.aiFormulaLab || {}).filter(Boolean).length;
  const glModels=Object.values(candidate.aiGLFormulaLab||{}).filter(Boolean).length;
  const activeAI = Object.values(candidate.activeFormulaByProfile || {}).filter(v => v === "ai"||v==="gl").length;
  return (candidate.actualDraws?.length || 0) * 100000000
    + (candidate.dailyTables?.length || 0) * 1000000
    + (candidate.records?.length || 0) * 10000
    + aiModels * 100
    + glModels*100
    + activeAI * 10
    + Number(candidate._persistenceUpdatedAt || 0) / 1e13;
}

// V6.10.29 — zero-cost History rescue. loadState() already reads every localStorage
// recovery layer, so we reuse those same parsed candidates instead of adding another
// startup scan. This restores an older complete History only when the newest state is
// unexpectedly empty and there is no explicit Reset-All marker.
function historyPayloadCount(candidate) {
  if (!candidate || typeof candidate !== "object") return 0;
  return (Array.isArray(candidate.actualDraws) ? candidate.actualDraws.length : 0)
    + (Array.isArray(candidate.dailyTables) ? candidate.dailyTables.length : 0)
    + (Array.isArray(candidate.records) ? candidate.records.filter(r => r && r.status !== "notfound").length : 0);
}
function stateHasHistoryPayload(candidate) { return historyPayloadCount(candidate) > 0; }
function explicitHistoryResetWins(emptyState, recoveryState) {
  const resetAt = Number(emptyState?._historyResetAt || 0);
  const recoveryTs = Number(recoveryState?._persistenceUpdatedAt || 0);
  return resetAt > 0 && resetAt >= recoveryTs;
}
function cloneForRecovery(value) {
  if (value == null) return value;
  try { return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value)); }
  catch (_) { return value; }
}

function buildRecoveryProfileContext(current, recovery) {
  const profiles = Array.isArray(current?.profiles) ? [...current.profiles] : [];
  const nameToIndex = new Map();
  profiles.forEach((name, index) => {
    const key = normalizeProfileNameKey(name);
    if (key && !nameToIndex.has(key)) nameToIndex.set(key, index);
  });

  const recoveryProfiles = Array.isArray(recovery?.profiles) ? recovery.profiles : [];
  const oldIdToNewId = new Map();
  const ensureName = (name, oldId = null) => {
    const clean = String(name || "").trim();
    if (!clean) return null;
    const key = normalizeProfileNameKey(clean);
    if (nameToIndex.has(key)) {
      const id = nameToIndex.get(key);
      if (Number.isInteger(oldId) && !oldIdToNewId.has(oldId)) oldIdToNewId.set(oldId, id);
      return id;
    }
    // Missing Profile names from the recovered payload are appended instead of being
    // silently attached to a different current Profile. This preserves all History.
    const id = profiles.length;
    profiles.push(clean);
    nameToIndex.set(key, id);
    if (Number.isInteger(oldId)) oldIdToNewId.set(oldId, id);
    return id;
  };

  recoveryProfiles.forEach((name, oldId) => ensureName(name, oldId));
  for (const collection of [recovery?.actualDraws, recovery?.dailyTables, recovery?.records]) {
    for (const item of (Array.isArray(collection) ? collection : [])) {
      const oldId = Number(item?.profileId);
      if (!Number.isInteger(oldId)) continue;
      const explicitName = String(item?.profileName || "").trim();
      if (explicitName) ensureName(explicitName, oldId);
      else if (!oldIdToNewId.has(oldId) && recoveryProfiles[oldId]) ensureName(recoveryProfiles[oldId], oldId);
    }
  }
  return { profiles, nameToIndex, oldIdToNewId, recoveryProfiles, ensureName };
}

function remapRecoveredHistory(current, recovery) {
  const ctx = buildRecoveryProfileContext(current, recovery);
  const actualIdToProfile = new Map();
  const mapItem = (item, kind = "generic") => {
    if (!item || typeof item !== "object") return item;
    const next = { ...item };
    const oldId = Number(item.profileId);
    const explicitName = String(item.profileName || "").trim();
    let newId = null;
    if (explicitName) {
      const key = normalizeProfileNameKey(explicitName);
      newId = ctx.nameToIndex.has(key) ? ctx.nameToIndex.get(key) : ctx.ensureName(explicitName, Number.isInteger(oldId) ? oldId : null);
    }
    if (!Number.isInteger(newId) && Number.isInteger(oldId)) newId = ctx.oldIdToNewId.get(oldId);
    if (!Number.isInteger(newId) && Number.isInteger(oldId) && ctx.recoveryProfiles[oldId]) newId = ctx.ensureName(ctx.recoveryProfiles[oldId], oldId);
    if (Number.isInteger(newId)) {
      next.profileId = newId;
      next.profileName = ctx.profiles[newId] || explicitName || next.profileName;
    }
    if (kind === "actual" && next.id) actualIdToProfile.set(String(next.id), Number(next.profileId));
    return next;
  };

  const actualDraws = (Array.isArray(recovery?.actualDraws) ? recovery.actualDraws : []).map(x => mapItem(x, "actual"));
  const dailyTables = (Array.isArray(recovery?.dailyTables) ? recovery.dailyTables : []).map(x => mapItem(x, "table"));
  const records = (Array.isArray(recovery?.records) ? recovery.records : []).filter(r => r && r.status !== "notfound").map(item => {
    let next = mapItem(item, "record");
    const linked = next?.actualDrawId ? actualIdToProfile.get(String(next.actualDrawId)) : null;
    if (Number.isInteger(linked)) {
      next = { ...next, profileId: linked, profileName: ctx.profiles[linked] || next.profileName };
    }
    return next;
  });
  return { ...ctx, actualDraws, dailyTables, records };
}

function remapRecoveredKeyedObject(source, oldIdToNewId, transform = value => value) {
  const out = {};
  Object.entries(source || {}).forEach(([key, value]) => {
    const oldId = Number(key);
    const newId = oldIdToNewId.get(oldId);
    if (!Number.isInteger(newId)) return;
    out[newId] = transform(cloneForRecovery(value), newId);
  });
  return out;
}

function repairExistingHistoryProfileMapping(candidate) {
  if (!candidate || !stateHasHistoryPayload(candidate)) return candidate;
  const recovery = cloneForRecovery(candidate);
  const mapped = remapRecoveredHistory(candidate, recovery);
  let changed = mapped.profiles.length !== (candidate.profiles || []).length;
  const mappingChanged = (a, b) => {
    const left = Array.isArray(a) ? a : [], right = Array.isArray(b) ? b : [];
    if (left.length !== right.length) return true;
    for (let i = 0; i < left.length; i++) {
      if (Number(left[i]?.profileId) !== Number(right[i]?.profileId)) return true;
      if (String(left[i]?.profileName || "") !== String(right[i]?.profileName || "")) return true;
    }
    return false;
  };
  if (mappingChanged(candidate.actualDraws, mapped.actualDraws) || mappingChanged(candidate.dailyTables, mapped.dailyTables) || mappingChanged(candidate.records, mapped.records)) changed = true;
  if (!changed) return candidate;
  const next = { ...candidate, profiles: mapped.profiles, actualDraws: mapped.actualDraws, dailyTables: mapped.dailyTables, records: mapped.records };
  const activeName = candidate.profiles?.[Number(candidate.activeProfile || 0)] || "";
  const activeKey = normalizeProfileNameKey(activeName);
  const activeId = mapped.profiles.findIndex(name => normalizeProfileNameKey(name) === activeKey);
  if (activeId >= 0) next.activeProfile = activeId;
  next._historyProfileMappingRepairedAt = Date.now();
  return next;
}

function mergeRecoveredHistory(current, recovery, source = "recovery") {
  if (!current || !recovery) return current;
  // R5: every recovery source, including legacy/deep IndexedDB snapshots, must obey
  // the synchronous Profile delete journal before contributing History/Profile data.
  recovery = applyProfileJournalToCandidate(recovery);
  if (!stateHasHistoryPayload(recovery)) return current;
  const mapped = remapRecoveredHistory(current, recovery);
  const next = { ...current };
  next.profiles = mapped.profiles;
  next.records = mapped.records;
  next.actualDraws = mapped.actualDraws;
  next.dailyTables = mapped.dailyTables;
  // History-dependent caches must be remapped with the same Profile identity map.
  const recoveredFormula = remapRecoveredKeyedObject(recovery.aiFormulaLab, mapped.oldIdToNewId);
  const recoveredLearning = remapRecoveredKeyedObject(recovery.aiLearningStatus, mapped.oldIdToNewId);
  const recoveredGLFormula=remapRecoveredKeyedObject(recovery.aiGLFormulaLab,mapped.oldIdToNewId);
  const recoveredGLLearning=remapRecoveredKeyedObject(recovery.aiGLLearningStatus,mapped.oldIdToNewId);
  const recoveredWF = remapRecoveredKeyedObject(recovery.walkForwardBacktests, mapped.oldIdToNewId, (bucket, newId) => {
    if (!bucket || typeof bucket !== "object") return bucket;
    const b = { ...bucket, profileId: newId };
    if (Array.isArray(b.records)) b.records = b.records.map(r => r && typeof r === "object" ? { ...r, profileId: newId } : r);
    return b;
  });
  const recoveredActiveFormula = remapRecoveredKeyedObject(recovery.activeFormulaByProfile, mapped.oldIdToNewId);
  if (Object.keys(recoveredFormula).length) next.aiFormulaLab = { ...(next.aiFormulaLab || {}), ...recoveredFormula };
  if (Object.keys(recoveredLearning).length) next.aiLearningStatus = { ...(next.aiLearningStatus || {}), ...recoveredLearning };
  if(Object.keys(recoveredGLFormula).length) next.aiGLFormulaLab={...(next.aiGLFormulaLab||{}),...recoveredGLFormula};
  if(Object.keys(recoveredGLLearning).length) next.aiGLLearningStatus={...(next.aiGLLearningStatus||{}),...recoveredGLLearning};
  if (Object.keys(recoveredWF).length) next.walkForwardBacktests = { ...(next.walkForwardBacktests || {}), ...recoveredWF };
  if (recovery.walkForwardRebuildJob && typeof recovery.walkForwardRebuildJob === "object") next.walkForwardRebuildJob = recovery.walkForwardRebuildJob;
  if (Object.keys(recoveredActiveFormula).length) next.activeFormulaByProfile = { ...(next.activeFormulaByProfile || {}), ...recoveredActiveFormula };
  // Preserve the currently selected Profile by name after mapping/appending Profiles.
  const selectedName = current.profiles?.[Number(current.activeProfile || 0)] || "";
  const selectedKey = normalizeProfileNameKey(selectedName);
  const selectedId = next.profiles.findIndex(name => normalizeProfileNameKey(name) === selectedKey);
  if (selectedId >= 0) next.activeProfile = selectedId;
  next._historyRecoveredAt = Date.now();
  next._historyRecoveredFrom = source;
  next._historyProfileMappingRepairedAt = Date.now();
  delete next._historyResetAt;
  // R5 final tombstone pass: recovery mapping can append Profiles from an older
  // richer snapshot. Deleted Profiles must never be resurrected by that rescue.
  return applyProfileJournalToCandidate(next);
}

const IDB_NAME = "LuckyNumberPersistentDB";
const IDB_STORE = "state";
const IDB_KEY = "main";
// V7.09.61 — iOS History Source Checkpoint.
// Keep a second, small recovery authority for History source data so a stale/empty
// full-state snapshot restored by iOS cannot erase a completed image import.
const HISTORY_SOURCE_CHECKPOINT_KEY = "history-source-v70961";

function makeHistorySourceCheckpoint(source = state) {
  const savedAt = Date.now();
  return {
    version: 1,
    savedAt,
    _persistenceUpdatedAt: Math.max(savedAt, Number(source?._persistenceUpdatedAt || 0)),
    _historyResetAt: Number(source?._historyResetAt || 0),
    _profileRevision: Number(source?._profileRevision || 0),
    profiles: Array.isArray(source?.profiles) ? source.profiles.map(x => String(x || "")) : [],
    activeProfile: Number(source?.activeProfile || 0),
    actualDraws: Array.isArray(source?.actualDraws) ? cloneForRecovery(source.actualDraws) : [],
    dailyTables: Array.isArray(source?.dailyTables) ? cloneForRecovery(source.dailyTables) : [],
    records: Array.isArray(source?.records) ? cloneForRecovery(source.records) : []
  };
}

async function writeHistorySourceCheckpoint(source = state) {
  try { return await writeIndexedValue(HISTORY_SOURCE_CHECKPOINT_KEY, makeHistorySourceCheckpoint(source)); }
  catch (error) { console.warn("History source checkpoint write failed", error); return false; }
}

async function recoverHistorySourceCheckpointIfNeeded() {
  let checkpoint = null;
  try { checkpoint = await readIndexedValue(HISTORY_SOURCE_CHECKPOINT_KEY); }
  catch (_) { checkpoint = null; }
  if (!checkpoint || typeof checkpoint !== "object") return false;
  const checkpointHasHistory = stateHasHistoryPayload(checkpoint);
  if (!checkpointHasHistory) return false;
  if (explicitHistoryResetWins(state, checkpoint)) return false;

  const currentCount = historyPayloadCount(state);
  const checkpointCount = historyPayloadCount(checkpoint);
  const currentDraws = Array.isArray(state?.actualDraws) ? state.actualDraws.length : 0;
  const checkpointDraws = Array.isArray(checkpoint?.actualDraws) ? checkpoint.actualDraws.length : 0;
  // Recover when current state is empty OR clearly missing imported source rows.
  if (currentCount > 0 && currentDraws >= checkpointDraws && currentCount >= checkpointCount) return false;
  state = mergeRecoveredHistory(state, checkpoint, "IndexedDB:history-source-v70961");
  state._historySourceCheckpointRecoveredAt = Date.now();
  return true;
}
let persistenceReady = false;
let persistenceWriteTimer = null;
let redundancyWriteTimer = null;
let lastMainSerialized = null;
let lastSnapshotRotationAt = 0;
const SNAPSHOT_ROTATE_INTERVAL_MS = 30000;

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


// V6.10.31 — Deep History Rescue.
// This fallback is intentionally NOT part of normal startup. It runs only when the
// already-fast localStorage + main IndexedDB recovery paths still report zero History.
// That keeps normal navigation/startup speed identical while giving old deployments,
// renamed storage keys and legacy IndexedDB stores one last safe recovery path.
function unwrapPossibleHistoryState(value) {
  const seen = new Set();
  const queue = [value];
  let best = null;
  let bestScore = -1;
  while (queue.length) {
    const item = queue.shift();
    if (!item || typeof item !== "object" || seen.has(item)) continue;
    seen.add(item);
    const score = stateRecoveryScore(item);
    if (stateHasHistoryPayload(item) && score > bestScore) {
      best = item;
      bestScore = score;
    }
    // Common backup/import wrappers used by earlier LuckyNumber builds.
    for (const key of ["state", "data", "payload", "snapshot", "backup", "appState"]) {
      const child = item[key];
      if (child && typeof child === "object") queue.push(child);
    }
  }
  return best;
}

function findDeepLocalStorageHistoryCandidate() {
  let best = null;
  let bestScore = -1;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || key === BOOT_STATE_KEY || LEGACY_BOOT_STATE_KEYS.includes(key)) continue;
      let parsed = null;
      try {
        const text = localStorage.getItem(key);
        if (!text || (text[0] !== "{" && text[0] !== "[")) continue;
        parsed = JSON.parse(text);
      } catch (_) { continue; }
      const candidate = unwrapPossibleHistoryState(parsed);
      if (!candidate) continue;
      const score = stateRecoveryScore(candidate);
      if (score > bestScore) {
        best = { source: `localStorage-deep:${key}`, data: candidate };
        bestScore = score;
      }
    }
  } catch (error) {
    console.warn("Deep localStorage History scan unavailable", error);
  }
  return best;
}

async function readAllValuesFromObjectStore(db, storeName) {
  return await new Promise(resolve => {
    const values = [];
    let tx;
    try { tx = db.transaction(storeName, "readonly"); }
    catch (_) { resolve(values); return; }
    const store = tx.objectStore(storeName);
    if (typeof store.getAll === "function") {
      const req = store.getAll();
      req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
      req.onerror = () => resolve([]);
      return;
    }
    const req = store.openCursor();
    req.onsuccess = event => {
      const cursor = event.target.result;
      if (!cursor) { resolve(values); return; }
      values.push(cursor.value);
      cursor.continue();
    };
    req.onerror = () => resolve(values);
  });
}

async function findDeepIndexedDBHistoryCandidate() {
  if (!("indexedDB" in window)) return null;
  const dbNames = new Set([IDB_NAME]);
  // Modern Safari/Chrome can enumerate old DB names. If unsupported, the current
  // LuckyNumber DB is still scanned completely (all stores, all values).
  try {
    if (typeof indexedDB.databases === "function") {
      const infos = await indexedDB.databases();
      (infos || []).forEach(info => { if (info?.name) dbNames.add(info.name); });
    }
  } catch (_) {}

  let best = null;
  let bestScore = -1;
  for (const dbName of dbNames) {
    let db = null;
    try {
      db = await new Promise((resolve, reject) => {
        const req = indexedDB.open(dbName);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        // Never create schema during rescue for a database that does not exist.
        req.onupgradeneeded = () => { try { req.transaction.abort(); } catch (_) {} };
      });
    } catch (_) { continue; }
    if (!db) continue;
    try {
      for (const storeName of Array.from(db.objectStoreNames || [])) {
        const values = await readAllValuesFromObjectStore(db, storeName);
        for (const value of values) {
          const candidate = unwrapPossibleHistoryState(value);
          if (!candidate) continue;
          const score = stateRecoveryScore(candidate);
          if (score > bestScore) {
            best = { source: `IndexedDB-deep:${dbName}/${storeName}`, data: candidate };
            bestScore = score;
          }
        }
      }
    } catch (error) {
      console.warn("Deep IndexedDB store scan unavailable", dbName, error);
    } finally {
      try { db.close(); } catch (_) {}
    }
  }
  return best;
}

async function deepHistoryRescueIfNeeded() {
  if (stateHasHistoryPayload(state) || Number(state?._historyResetAt || 0) > 0) return false;

  let best = findDeepLocalStorageHistoryCandidate();
  const indexedBest = await findDeepIndexedDBHistoryCandidate();
  if (indexedBest && (!best || stateRecoveryScore(indexedBest.data) > stateRecoveryScore(best.data))) best = indexedBest;
  if (!best?.data || !stateHasHistoryPayload(best.data) || explicitHistoryResetWins(state, best.data)) return false;

  state = mergeRecoveredHistory(state, best.data, best.source);
  state._deepHistoryRescueAt = Date.now();
  state._deepHistoryRescueSource = best.source;
  return true;
}

let indexedStateWriteChain = Promise.resolve();
async function writeIndexedState(snapshot) {
  const work = async () => {
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
  };
  indexedStateWriteChain = indexedStateWriteChain.then(work, work);
  return indexedStateWriteChain;
}

// V6.9.7: WF progress is stored under a separate IndexedDB key so an interrupted
// Full Backtest can resume without polluting the live/verified WF bucket.
const WF_PROGRESS_PREFIX = "wf-progress-v697-";
const WF_PROGRESS_COMMIT_EVERY = 4;
function wfProgressKey(profileId) { return `${WF_PROGRESS_PREFIX}${Number(profileId)}`; }
async function readIndexedValue(key) {
  try {
    const db = await openPersistenceDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(String(key));
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (error) { console.warn("IndexedDB value read unavailable", key, error); return null; }
}
async function writeIndexedValue(key, value) {
  try {
    const db = await openPersistenceDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(value, String(key));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("IndexedDB value write aborted"));
    });
    db.close(); return true;
  } catch (error) { console.warn("IndexedDB value write unavailable", key, error); return false; }
}
async function deleteIndexedValue(key) {
  try {
    const db = await openPersistenceDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete(String(key));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("IndexedDB value delete aborted"));
    });
    db.close(); return true;
  } catch (error) { console.warn("IndexedDB value delete unavailable", key, error); return false; }
}
// V6.10.40-R9 — durable WF/AI completion marker.
// A tiny synchronous marker prevents an older 91–99% full-state snapshot from
// reviving a completed JSON Restore after iOS suspends/kills the PWA.
function currentWfDatasetSignature(job=state.walkForwardRebuildJob) {
  const ids=Array.isArray(job?.profileIds)?job.profileIds.map(Number).filter(Number.isInteger):restoreJobProfileIds();
  const draws=validRestoreDrawsSorted();
  const last=draws[draws.length-1]||null;
  return [
    Number(job?.totalDraws||draws.length||0),
    ids.join(','),
    String(last?.date||''),
    String(last?.number||''),
    Number(state._profileRevision||0)
  ].join('|');
}
function readWfCompletionMarker() {
  try {
    const marker=JSON.parse(localStorage.getItem(WF_COMPLETION_KEY)||'null');
    return marker&&typeof marker==='object'?marker:null;
  } catch (_) { return null; }
}
function writeWfCompletionMarkerSync(marker) {
  try { localStorage.setItem(WF_COMPLETION_KEY, JSON.stringify(marker)); return true; }
  catch (error) { console.warn('WF completion marker write unavailable',error); return false; }
}
// V6.10.40-R9 — authoritative input fingerprint for completed WF/AI work.
// IMPORTANT: this hashes the INPUTS that make WF valid (History + resolved tables +
// engine/settings) rather than re-checking every persisted WF row on every launch.
// Once a 100% state was durably committed, an unchanged input fingerprint means a
// normal iOS suspend/relaunch must stay at 100% and must not create a new rebuild job.
function currentWfCompletionInputFingerprint(profileIds=null) {
  const ids=(Array.isArray(profileIds)?profileIds:restoreJobProfileIds())
    .map(Number).filter(Number.isInteger)
    .sort((a,b)=>a-b);
  const pieces=ids.map(id=>{
    const fp=buildWalkForwardCacheFingerprint(id);
    return [id,fp.hash,fp.drawCount,fp.resolvedTableCount,fp.firstDate,fp.lastDate].join(':');
  });
  return hashWalkForwardText([
    'WF-COMPLETE-R9', WF_CACHE_SCHEMA, WF_ENGINE_VERSION,
    Number(state._profileRevision||0), ids.join(','), ...pieces
  ].join('§'));
}
function completionMarkerMatchesCurrentDataset(marker) {
  if(!marker||typeof marker!=="object"||Number(marker.completedAt||0)<=0) return false;
  if(Number(marker.profileRevision||0)!==Number(state._profileRevision||0)) return false;
  const ids=Array.isArray(marker.profileIds)?marker.profileIds.map(Number).filter(Number.isInteger).sort((a,b)=>a-b):[];
  const currentIds=restoreJobProfileIds().map(Number).sort((a,b)=>a-b);
  if(ids.join(',')!==currentIds.join(',')) return false;
  if(Number(marker.totalDraws||0)!==Number(validRestoreDrawsSorted().length)) return false;
  const pseudoJob={profileIds:ids,totalDraws:Number(marker.totalDraws||0)};
  if(!marker.signature || marker.signature!==currentWfDatasetSignature(pseudoJob)) return false;
  if(marker.inputFingerprint) return marker.inputFingerprint===currentWfCompletionInputFingerprint(ids);
  return true; // legacy R8 marker: caller performs one-time bucket validation + upgrade.
}
function completionMarkerCanSkipStartupRecovery(marker) {
  if(!completionMarkerMatchesCurrentDataset(marker)) return false;
  const ids=Array.isArray(marker.profileIds)?marker.profileIds.map(Number).filter(Number.isInteger):[];
  if(!ids.length) return false;

  // R9 markers are authoritative after a successful durable commit. Do NOT call
  // walkForwardBucketCoversCurrentHistory() here on every app launch; that old R8
  // revalidation path was what caused 100% -> 90–99% reload loops after iOS killed
  // the PWA in background.
  if(marker.inputFingerprint){
    return marker.inputFingerprint===currentWfCompletionInputFingerprint(ids);
  }

  // One-time migration for an existing R8 completion marker. Validate the old
  // buckets once, then promote the marker to R9 so later launches are O(inputs),
  // stable, and do not restart JSON/WF/AI work.
  if(!ids.every(id=>walkForwardBucketCoversCurrentHistory(id))) return false;
  const upgraded={...marker,version:3,inputFingerprint:currentWfCompletionInputFingerprint(ids),upgradedAt:Date.now()};
  writeWfCompletionMarkerSync(upgraded);
  void writeIndexedValue(WF_COMPLETION_KEY, upgraded);
  return true;
}
// V6.10.40-R10 — dual-store 100% authority.
// iOS/PWA can occasionally restore an older localStorage snapshot while IndexedDB
// still contains the newer completion marker (or vice versa). Read both tiny markers
// before any startup recovery decision, accept only a marker that matches the CURRENT
// WF input fingerprint, and heal localStorage from the newest valid copy.
async function readAuthoritativeWfCompletionMarker() {
  const local = readWfCompletionMarker();
  // R54: the local completion marker is tiny, synchronous, and written as the startup
  // authority. If it already matches this exact dataset, use it immediately and heal
  // IndexedDB opportunistically later instead of blocking first paint on IDB.open().
  if (local && typeof local === "object" && completionMarkerCanSkipStartupRecovery(local)) {
    void readIndexedValue(WF_COMPLETION_KEY).then(indexed => {
      if (!indexed || Number(indexed.completedAt||0) !== Number(local.completedAt||0))
        return writeIndexedValue(WF_COMPLETION_KEY, local);
    }).catch(()=>{});
    return local;
  }
  const indexed = await readIndexedValue(WF_COMPLETION_KEY);
  const candidates = [indexed]
    .filter(x => x && typeof x === "object")
    .filter(x => completionMarkerCanSkipStartupRecovery(x))
    .sort((a,b) => Number(b.completedAt||0) - Number(a.completedAt||0));
  const best = candidates[0] || null;
  if (!best) return null;
  writeWfCompletionMarkerSync(best);
  return best;
}

function forceCompletedWfStartupState(marker) {
  if (!marker) return false;
  try { localStorage.removeItem(WF_JOB_KEY); } catch (_) {}
  const ids = Array.isArray(marker.profileIds) ? marker.profileIds.map(Number).filter(Number.isInteger) : [];
  state.walkForwardRebuildJob = {
    ...(state.walkForwardRebuildJob || {}),
    version: 2, status: "done", phase: "done",
    profileIds: [...ids], wfProfileIds: [], invalidProfileIds: [],
    reusedProfileIds: [...ids],
    totalDraws: Number(marker.totalDraws||0),
    liveProfileIndex: ids.length, wfProfileIndex: ids.length,
    finishedAt: Number(marker.completedAt||Date.now()),
    updatedAt: Number(marker.completedAt||Date.now()),
    profileRevision: Number(marker.profileRevision||state._profileRevision||0),
    lastMessage: `✓ WF/AI พร้อม 100% • เปิดแอปไม่คำนวณซ้ำ`
  };
  return true;
}

function completionMarkerMatchesJob(marker, job) {
  if(!marker||!job) return false;
  if(!completionMarkerMatchesCurrentDataset(marker)) return false;
  const jobIds=Array.isArray(job.profileIds)?job.profileIds.map(Number).filter(Number.isInteger).sort((a,b)=>a-b):[];
  const markerIds=Array.isArray(marker.profileIds)?marker.profileIds.map(Number).filter(Number.isInteger).sort((a,b)=>a-b):[];
  return jobIds.join(',')===markerIds.join(',') && Number(job.totalDraws||0)===Number(marker.totalDraws||0);
}
async function commitCompletedWfJobDurably(reusedCount, rebuiltCount) {
  const completedAt=Date.now();
  updateWalkForwardJob({phase:'done',status:'done',finishedAt:completedAt,lastMessage:`✓ WF พร้อม • Cache ${reusedCount} • Rebuild ${rebuiltCount}`});

  // 1) Commit the full 100% state synchronously to MAIN localStorage.
  // 2) Await the serialized IndexedDB write before exposing 100% READY.
  saveState();
  clearTimeout(persistenceWriteTimer);
  persistenceWriteTimer=null;
  const durableOk=await commitStateDurably();

  // The marker is intentionally tiny and synchronous. Even if IndexedDB later lags,
  // startup can prove that this exact data/profile set already reached 100%.
  const marker={
    version:3,
    completedAt,
    signature:currentWfDatasetSignature(state.walkForwardRebuildJob),
    profileRevision:Number(state._profileRevision||0),
    totalDraws:Number(state.walkForwardRebuildJob?.totalDraws||0),
    profileIds:[...(state.walkForwardRebuildJob?.profileIds||[])],
    inputFingerprint:currentWfCompletionInputFingerprint(state.walkForwardRebuildJob?.profileIds||[]),
    reusedCount:Number(reusedCount||0),
    rebuiltCount:Number(rebuiltCount||0),
    durableIndexedDB:Boolean(durableOk)
  };
  writeWfCompletionMarkerSync(marker);
  // Secondary copy for diagnostics/redundancy; localStorage marker is the startup authority.
  void writeIndexedValue(WF_COMPLETION_KEY, marker);

  // Only now is it safe to remove the resumable in-progress checkpoint.
  try { localStorage.removeItem(WF_JOB_KEY); } catch (_) {}
  return {marker,durableOk};
}

// V6.10.40-R9 — incremental Profile mutation completion refresh.
// Add/delete/reorder changes Profile metadata/indexes, but after remap the surviving
// WF buckets remain valid. Refresh the tiny completion authority in-place instead of
// invalidating the whole dataset and forcing JSON/WF/AI to run again.
function refreshWfCompletionAfterProfileMutation(reason = "profile-mutation") {
  const activeJob = state.walkForwardRebuildJob;
  if (activeJob && activeJob.status !== "done") return false;

  const allIds = restoreJobProfileIds();
  const wfIds = allIds.filter(id => walkForwardProfileDraws(id).length >= 8);
  if (wfIds.some(id => !walkForwardBucketCoversCurrentHistory(id))) return false;

  const completedAt = Date.now();
  const totalDraws = validRestoreDrawsSorted().length;
  const pseudoJob = { profileIds: allIds, totalDraws };
  const marker = {
    version: 3,
    completedAt,
    signature: currentWfDatasetSignature(pseudoJob),
    profileRevision: Number(state._profileRevision || 0),
    totalDraws,
    profileIds: [...allIds],
    inputFingerprint: currentWfCompletionInputFingerprint(allIds),
    reusedCount: wfIds.length,
    rebuiltCount: 0,
    durableIndexedDB: false,
    mutationReason: String(reason || "profile-mutation")
  };

  writeWfCompletionMarkerSync(marker);
  void writeIndexedValue(WF_COMPLETION_KEY, marker);
  try { localStorage.removeItem(WF_JOB_KEY); } catch (_) {}

  state.walkForwardRebuildJob = {
    ...(activeJob || {}),
    version: 2, status: "done", phase: "done",
    profileIds: [...allIds],
    wfProfileIds: [], invalidProfileIds: [], reusedProfileIds: [...wfIds],
    totalDraws,
    liveProfileIndex: allIds.length,
    finishedAt: completedAt, updatedAt: completedAt,
    profileRevision: Number(state._profileRevision || 0),
    lastMessage: `✓ WF พร้อม • Profile ${allIds.length} • ไม่ Rebuild ซ้ำ`
  };
  return true;
}
async function commitStateDurably() {
  state._persistenceUpdatedAt = Date.now();
  let snapshot;
  try { snapshot = JSON.parse(serializeBackupSafeState(state) || "{}"); }
  catch (error) { console.warn("Durable state serialization failed", error); return false; }
  const ok = await writeIndexedState(snapshot);
  if (ok) persistenceReady = true;
  return ok;
}
function saveProfileMutationDurably() {
  const mainSaved = saveState();
  // Do not wait for the normal 80 ms IndexedDB coalescing window after a Profile
  // mutation. Queue the newest snapshot immediately; writeIndexedState serializes
  // all writes so an older in-flight snapshot can never finish after this one.
  clearTimeout(persistenceWriteTimer);
  persistenceWriteTimer = null;
  void commitStateDurably();
  return mainSaved;
}

const BACKUP_BLOCKED_KEYS = new Set([
  "imageData", "imageUrl", "imageURL", "previewUrl", "previewURL",
  "previewUrls", "previewURLs", "canvas", "blob", "objectUrl", "objectURL",
  "ocrImage", "ocrPreview", "base64", "dataUrl", "dataURL"
]);
function backupSafeReplacer(key, value) {
  if (BACKUP_BLOCKED_KEYS.has(key)) return undefined;
  if (typeof value === "string" && (/^data:image\//i.test(value) || /^blob:/i.test(value))) return undefined;
  if (typeof Blob !== "undefined" && value instanceof Blob) return undefined;
  if (typeof File !== "undefined" && value instanceof File) return undefined;
  if (typeof HTMLCanvasElement !== "undefined" && value instanceof HTMLCanvasElement) return undefined;
  return value;
}
function serializeBackupSafeState(sourceState) {
  return JSON.stringify(sourceState, backupSafeReplacer);
}

function saveState() {
  state._persistenceUpdatedAt = Date.now();
  // V6.10.29: keep a tiny synchronous UI-only boot mirror so the last visible Calculate
  // state can paint immediately even when the full localStorage payload is too large.
  writeBootStateSnapshot(state);
  // V6.10.11 Performance Core: serialize once and keep the previous main payload in
  // memory. Reading a large localStorage value on every UI tap was a synchronous
  // main-thread cost that grew with History/WF size.
  const serialized = serializeBackupSafeState(state) || "{}";
  let previous = lastMainSerialized;
  if (previous == null) {
    try { previous = localStorage.getItem(STORAGE_KEY); } catch (_) { previous = null; }
  }

  // Durability rule is unchanged: the newest MAIN state is committed synchronously
  // before saveState returns. Only redundant copies are deferred off the tap path.
  let mainSaved = false;
  try {
    localStorage.setItem(STORAGE_KEY, serialized);
    lastMainSerialized = serialized;
    mainSaved = true;
  } catch (error) { console.warn("localStorage main write unavailable", error); }

  // Shadow + rotating snapshots are redundancy, not the primary commit. Deferring
  // them a few ms removes a second full localStorage write from profile/settings taps
  // while preserving the same recovery layers. Rapid saves coalesce to the newest state.
  clearTimeout(redundancyWriteTimer);
  redundancyWriteTimer = setTimeout(() => {
    try { localStorage.setItem(`${STORAGE_KEY}_shadow`, serialized); }
    catch (error) { console.warn("localStorage shadow write unavailable", error); }

    const now = Date.now();
    if (previous && previous !== serialized && (!lastSnapshotRotationAt || now - lastSnapshotRotationAt >= SNAPSHOT_ROTATE_INTERVAL_MS)) {
      try {
        const snap1 = localStorage.getItem(`${STORAGE_KEY}_snapshot_1`) || previous;
        localStorage.setItem(`${STORAGE_KEY}_snapshot_2`, snap1);
        localStorage.setItem(`${STORAGE_KEY}_snapshot_1`, previous);
        lastSnapshotRotationAt = now;
      } catch (error) {
        console.warn("localStorage snapshot rotation unavailable", error);
      }
    }
  }, 32);

  clearTimeout(persistenceWriteTimer);
  // IndexedDB remains an async durable copy, coalesced to the newest state.
  persistenceWriteTimer = setTimeout(() => {
    try { writeIndexedState(JSON.parse(serialized)); } catch (error) { console.warn("IndexedDB snapshot parse failed", error); }
  }, 80);

  return mainSaved;
}

async function bootstrapPersistentState() {
  // R54: a healthy timestamped MAIN state is already the newest synchronous commit.
  // Do not block first paint on opening/parsing the redundant IndexedDB copy. Full
  // IndexedDB/deep rescue remains unchanged for missing/empty/corrupt MAIN states.
  if (stateHasHistoryPayload(state) && Number(state?._persistenceUpdatedAt || 0) > 0) {
    persistenceReady = true;
    return false;
  }
  let replacedFromIndexedDB = false;
  const indexedRaw = await readIndexedState();
  // R5: IndexedDB can lag behind a synchronous Profile delete when iOS suspends
  // the app. Replay the tombstone journal before comparing revisions/timestamps.
  const indexed = indexedRaw ? applyProfileJournalToCandidate(indexedRaw) : null;
  if (indexed) {
    const indexedTs = Number(indexed._persistenceUpdatedAt || 0);
    const currentTs = Number(state._persistenceUpdatedAt || 0);
    const currentHasHistory = stateHasHistoryPayload(state);
    const indexedHasHistory = stateHasHistoryPayload(indexed);

    // V6.10.29 History rescue/protection:
    // 1) If local is unexpectedly empty but IndexedDB still has History, recover it
    //    even when the bad empty state has a newer timestamp.
    // 2) If local has recovered History but IndexedDB contains a newer empty state
    //    from the V6.10.27/28 bug, never let that empty copy erase the rescue.
    // 3) A deliberate Reset All marker still has absolute priority.
    if (!currentHasHistory && indexedHasHistory && !explicitHistoryResetWins(state, indexed)) {
      state = mergeRecoveredHistory(state, indexed, "IndexedDB:main");
      replacedFromIndexedDB = true;
    } else {
      const indexedExplicitReset = !indexedHasHistory && Number(indexed?._historyResetAt || 0) > 0;
      const protectedRecoveredHistory = currentHasHistory && !indexedHasHistory && !indexedExplicitReset;
      const indexedProfileRev = Number(indexed?._profileRevision || 0);
      const currentProfileRev = Number(state?._profileRevision || 0);
      // Never let a full-state copy from before the latest Profile transaction
      // overwrite a newer local Profile revision, even if its generic timestamp is newer.
      const indexedProfileIsCurrentEnough = indexedProfileRev >= currentProfileRev;
      const shouldUseIndexed = !protectedRecoveredHistory && indexedProfileIsCurrentEnough && (indexedTs && currentTs
        ? indexedTs > currentTs
        : (!currentTs && (indexedTs || stateDataScore(indexed) > stateDataScore(state))));
      if (shouldUseIndexed) {
        const base = typeof structuredClone === "function" ? structuredClone(DEFAULT_STATE) : JSON.parse(JSON.stringify(DEFAULT_STATE));
        // Profile guard: a newer but empty/corrupt IndexedDB snapshot must never erase
        // a valid Profile list already recovered from localStorage.
        const indexedProfiles = Array.isArray(indexed.profiles)
          ? indexed.profiles.map(name => String(name || "").trim()).filter(Boolean)
          : [];
        const currentProfiles = Array.isArray(state.profiles)
          ? state.profiles.map(name => String(name || "").trim()).filter(Boolean)
          : [];
        const safeProfiles = indexedProfiles.length ? indexedProfiles : (currentProfiles.length ? currentProfiles : [...base.profiles]);
        state = { ...base, ...indexed, profiles: safeProfiles };
        state.activeProfile = Math.min(Math.max(Number(state.activeProfile) || 0, 0), state.profiles.length - 1);
        state.rankingConfig = { ...base.rankingConfig, ...(indexed.rankingConfig || {}) };
        state.webSync = { ...base.webSync, ...(indexed.webSync || {}) };
        state.backupSettings = { ...base.backupSettings, ...(indexed.backupSettings || {}) };
        state.masterAISettings = { ...base.masterAISettings, ...(indexed.masterAISettings || {}) };
        replacedFromIndexedDB = true;
      }
    }
  }
  // V7.09.61: source-level recovery runs before the broad legacy scan. It is intentionally
  // separate from the full-state IndexedDB key, so an iOS-restored empty full snapshot
  // cannot win over an already-confirmed image import.
  const sourceCheckpointRecovered = await recoverHistorySourceCheckpointIfNeeded();

  // V6.10.31: only if the fast paths above still have zero History, perform a one-time
  // deep rescue across unknown localStorage keys and legacy IndexedDB stores.
  const deepRescued = await deepHistoryRescueIfNeeded();
  const beforeRepairStamp = Number(state?._historyProfileMappingRepairedAt || 0);
  state = repairExistingHistoryProfileMapping(state);
  // R5: deep/legacy rescue can surface a pre-delete snapshot. Tombstones have the
  // final say immediately before the recovered state is committed.
  state = applyProfileJournalToCandidate(state);
  const mappingRepaired = Number(state?._historyProfileMappingRepairedAt || 0) > beforeRepairStamp;
  persistenceReady = true;
  if (replacedFromIndexedDB || sourceCheckpointRecovered || deepRescued || mappingRepaired || Number(state?._historyRecoveredAt || 0)) {
    try { saveState(); } catch (error) { console.warn("Recovered History commit failed", error); }
    if (stateHasHistoryPayload(state)) void writeHistorySourceCheckpoint(state);
  }
  return replacedFromIndexedDB || sourceCheckpointRecovered || deepRescued || mappingRepaired;
}

function makeBackupSafeState(sourceState) {
  // Remove only transient OCR/image payloads. Preserve all AI/table objects.
  const json = serializeBackupSafeState(sourceState);
  return json ? JSON.parse(json) : {};
}

function backupCoreCounts(safeState) {
  return {
    profiles: Array.isArray(safeState?.profiles) ? safeState.profiles.length : 0,
    records: Array.isArray(safeState?.records) ? safeState.records.length : 0,
    actualDraws: Array.isArray(safeState?.actualDraws) ? safeState.actualDraws.length : 0,
    dailyTables: Array.isArray(safeState?.dailyTables) ? safeState.dailyTables.length : 0
  };
}

function bytesToHex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function fallbackFNV1a32(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

async function hashBackupState(safeState, requestedAlgorithm = "SHA-256") {
  const text = JSON.stringify(safeState);
  if (requestedAlgorithm === "SHA-256" && globalThis.crypto?.subtle && typeof TextEncoder !== "undefined") {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return { algorithm: "SHA-256", value: bytesToHex(digest) };
  }
  return { algorithm: "FNV-1a-32", value: fallbackFNV1a32(text) };
}

async function buildBackupPayload(reason = "manual") {
  const safeState = makeBackupSafeState(state);
  const checksum = await hashBackupState(safeState);
  const profileIds = (safeState.profiles || []).map((_, i) => i);
  let datasetFingerprint = "";
  try { datasetFingerprint = currentWfCompletionInputFingerprint(profileIds); } catch (_) {}
  return {
    format: "LuckyNumberBackup",
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    reason,
    counts: backupCoreCounts(safeState),
    wf: { schema: WF_CACHE_SCHEMA, engineVersion: WF_ENGINE_VERSION, datasetFingerprint },
    checksum,
    state: safeState
  };
}

function validateBackupStructure(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Backup ไม่มีข้อมูล State ที่ถูกต้อง");
  if (!Array.isArray(data.profiles) || !data.profiles.length) throw new Error("Backup ไม่มี Profile");
  for (const key of ["records", "actualDraws", "dailyTables"]) {
    if (!Array.isArray(data[key])) throw new Error(`Backup field ${key} ไม่ถูกต้อง`);
  }
  return true;
}

async function validateBackupEnvelope(parsed) {
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid backup");
  if (parsed.format !== "LuckyNumberBackup") {
    validateBackupStructure(parsed); // legacy raw-state JSON
    return { data: parsed, legacy: true };
  }
  const data = parsed.state;
  validateBackupStructure(data);
  const version = Number(parsed.formatVersion || 0);
  if (version >= 4) {
    const expectedCounts = parsed.counts || {};
    const actualCounts = backupCoreCounts(data);
    for (const key of Object.keys(actualCounts)) {
      if (Number(expectedCounts[key]) !== Number(actualCounts[key])) throw new Error(`Backup count ไม่ตรง (${key})`);
    }
    const expected = parsed.checksum;
    if (!expected || !expected.algorithm || !expected.value) throw new Error("Backup ไม่มี checksum");
    const actual = await hashBackupState(data, expected.algorithm);
    if (String(actual.algorithm) !== String(expected.algorithm) || String(actual.value) !== String(expected.value)) {
      throw new Error("Backup checksum ไม่ตรง ไฟล์อาจเสียหายหรือถูกแก้ไข");
    }
  }
  return { data, legacy: version < 4, envelope: parsed };
}

async function downloadBackup(reason = "manual", silent = false) {
  try {
    const payload = await buildBackupPayload(reason);
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
function formatDateIOS(value = isoDate()) {
  const d = new Date(`${value}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[ch]);
}
function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

// V7.09.7 — Historical Calculate must never borrow today's AI formula.
// When a saved result date is loaded into Calculate, that row is the source table
// for the NEXT business draw. Reuse only the AI-L snapshot that was locked before
// that target result. If no trusted historical AI snapshot exists, fall back to
// stable Classic L instead of synthesizing a retrospective AI table.
function getHistoricalCalculateFormulaContext(profileId = state.activeProfile, sourceDate = state.calculationDate) {
  const id = Number(profileId);
  const date = String(sourceDate || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const table = getDailyTable(id, date);
  if (!table) return { historical:true, mode:'original', formula:getOriginalFormula(), trustedAI:false, reason:'no-table' };

  const targetDate = String(table.predictionSnapshot?.targetDate || table.aiSnapshotTargetDate || getNextBusinessDate(date) || '').slice(0,10);
  const targetDraw = (state.actualDraws || []).find(x => Number(x?.profileId ?? 0) === id && String(x?.date || '').slice(0,10) === targetDate) || null;

  // Strongest source: Universal Prediction Lock validated against the target draw.
  if (targetDraw) {
    const snap = getUniversalPredictionSnapshot(id, targetDate, targetDraw);
    if (snap && snap.autoMode === "gl" && Array.isArray(snap.glFormula)) {
      return { historical:true, mode:'gl', formula:snap.glFormula, trustedGL:true, trustedAI:true, targetDate, source:'universal' };
    }
    if (snap && Array.isArray(snap.aiLFormula)) {
      return { historical:true, mode:'ai', formula:snap.aiLFormula, trustedAI:true, targetDate, source:'universal' };
    }
    const formula = getHistoricalAIFormula(id, targetDate, targetDraw);
    if (Array.isArray(formula)) {
      return { historical:true, mode:'ai', formula, trustedAI:true, targetDate, source:'legacy-lock' };
    }
  }

  // Do not use state.aiFormulaLab/current AI for historical rows.
  return { historical:true, mode:'original', formula:getOriginalFormula(), trustedAI:false, targetDate, source:'classic-fallback' };
}

function getCalculateFormulaContext(profileId = state.activeProfile) {
  const date = String(state.calculationDate || '').slice(0,10);
  if (date) {
    const historical = getHistoricalCalculateFormulaContext(profileId, date);
    if (historical) return historical;
  }
  return { historical:false, mode:getActiveFormulaMode(profileId), formula:getActiveFormula(profileId), trustedAI:true,trustedGL:true, source:'live' };
}

function calculateGrid(values = state.lastInput, profileId = state.activeProfile) {
  if (values.some(v => !/^\d$/.test(String(v)))) return null;
  const ctx = getCalculateFormulaContext(profileId);
  return formulaGrid(values, ctx.formula);
}

// V7.09.35 — Single-table Calculator engine tabs.
// Classic L / AI L / AI GL are calculated independently from the same 5-digit input.
// Historical rows never borrow today's AI models: only locked prior-only snapshots may appear.
function getCalculatorEngineTables(profileId = state.activeProfile) {
  const id=Number(profileId);
  const inputs=Array.isArray(state.lastInput)?state.lastInput.map(String):[];
  const valid=inputs.length===5&&inputs.every(v=>/^\d$/.test(v));
  if(!valid) return [];
  const sourceDate=String(state.calculationDate||'').slice(0,10);
  let historical=false, aiFormula=null, glFormula=null, aiStatus='NOT READY', glStatus='TEST / LEARNING';
  if(/^\d{4}-\d{2}-\d{2}$/.test(sourceDate)) {
    const table=getDailyTable(id,sourceDate);
    if(table){
      historical=true;
      const targetDate=String(table.predictionSnapshot?.targetDate||table.aiSnapshotTargetDate||getNextBusinessDate(sourceDate)||'').slice(0,10);
      const targetDraw=(state.actualDraws||[]).find(x=>Number(x?.profileId??0)===id&&String(x?.date||'').slice(0,10)===targetDate)||null;
      if(targetDraw){
        const snap=getUniversalPredictionSnapshot(id,targetDate,targetDraw);
        if(Array.isArray(snap?.aiLFormula)){ aiFormula=snap.aiLFormula; aiStatus='PRIOR-ONLY'; }
        else {
          const legacy=getHistoricalAIFormula(id,targetDate,targetDraw);
          if(Array.isArray(legacy)){ aiFormula=legacy; aiStatus='PRIOR-ONLY'; }
        }
        if(Array.isArray(snap?.glFormula)){ glFormula=snap.glFormula; glStatus='PRIOR-ONLY'; }
      }
    }
  }
  if(!historical){
    const aiSaved=state.aiFormulaLab?.[id]||null, glSaved=state.aiGLFormulaLab?.[id]||null;
    if(Array.isArray(aiSaved?.formula)){ aiFormula=aiSaved.formula; aiStatus=formulaEligibility(aiSaved).allowed?'READY':'TEST / LEARNING'; }
    if(Array.isArray(glSaved?.formula)){ glFormula=glSaved.formula; glStatus=glFormulaEligibility(glSaved, id).allowed?'READY':'TEST / LEARNING'; }
  }
  const active=getActiveFormulaMode(id);
  const make=(key,label,formula,status)=>{
    const grid=Array.isArray(formula)?formulaGrid(inputs,formula):null;
    const results=grid?findLResults(grid):[];
    return {key,label,grid,status,active:active===key,results,historical};
  };
  return [
    make('original','Classic L',getOriginalFormula(),historical?'STABLE':'READY'),
    make('ai','AI L',aiFormula,aiStatus),
    make('gl','AI GL',glFormula,glStatus)
  ];
}

function getCalculatorSelectedTable(profileId = state.activeProfile) {
  const tables=getCalculatorEngineTables(profileId);
  return tables.find(t=>t.key===calculatorTableViewMode) || tables[0] || null;
}

function calculatorEngineTabsHtml(profileId = state.activeProfile) {
  const tables=getCalculatorEngineTables(profileId);
  if(!tables.length) return '';
  const configuredAuto=getConfiguredFormulaMode(profileId)==="auto";
  const activeMode=getActiveFormulaMode(profileId);
  // Calculator stays intentionally simple: AUTO may blend behind the scenes, but this
  // table is only a visual 3x5 base. Keep the Calculator label simply AUTO.
  const autoVisualKey=activeMode==="blend"?"ai":activeMode;
  return `<div class="calculator-engine-tabs" role="tablist" aria-label="Calculator formula table">${tables.map(t=>{
    const selected=t.key===calculatorTableViewMode;
    const unavailable=!t.grid;
    const autoMark=configuredAuto && t.key===autoVisualKey;
    return `<button type="button" class="calculator-engine-tab ${selected?'selected':''} ${unavailable?'unavailable':''}" data-calc-engine="${escapeHtml(t.key)}" role="tab" aria-selected="${selected?'true':'false'}"><b>${escapeHtml(t.label)}</b>${autoMark?'<small>AUTO</small>':''}</button>`;
  }).join('')}</div>`;
}

// Build a view-only 3x5 matrix directly from Independent AI Top 5 predictions.
// Each column is one predicted 3-digit number (hundreds / tens / units by row).
// It is NOT an L-formula table and therefore never replaces state.grid or daily-table generation.
function getIndependentPreviewTable(profileId = state.activeProfile) {
  const result = generateIndependentAI(Number(profileId), null, 5);
  if (result?.pending || !Array.isArray(result?.items) || result.items.length < 5) {
    return { grid:null, items:result?.items || [], dataCount:Number(result?.dataCount || 0), pending:true };
  }
  const items = result.items.slice(0,5);
  const numbers = items.map(x => String(x.number || "").padStart(3,"0"));
  const grid = [0,1,2].map(pos => numbers.map(n => Number(n[pos])));
  return { grid, items, dataCount:Number(result.dataCount || 0), pending:false };
}

// V7.09.19 — ML Select table preview in the same 3x5 visual language as AI L.
// IMPORTANT: this is presentation-only. It does not persist a grid and it never changes the
// active formula. Classic/AI L use the latest completed 5-digit source strictly before target;
// Independent/Pair display their strict-prior Top 5 as five 3-digit columns.
function getMLSelectPreviewTable(profileId = state.activeProfile) {
  const id = Number(profileId);
  const targetDate = getMLSelectTargetDate();
  const prediction = getMLSelectPrediction(id, targetDate);
  const labels = {classic:"Classic L", aiL:"AI L",gl:"AI GL", independent:"AI อิสระ", pair:"AI Pair"};
  if (!prediction?.ready || !prediction?.leakPass) {
    return {grid:null,pending:true,reason:prediction?.reason||"ML Select ยังไม่พร้อม",prediction,targetDate,engine:prediction?.selected||"classic",engineLabel:labels[prediction?.selected]||"Classic L"};
  }

  // Source input must be a completed draw strictly earlier than the ML target.
  const source = (state.actualDraws || [])
    .filter(r => Number(r?.profileId ?? 0) === id
      && String(r?.date || "").slice(0,10) < targetDate
      && /^\d{3}$/.test(String(r?.number || ""))
      && /^\d{2}$/.test(String(r?.twoDigit || "")))
    .sort(compareActualDrawRecency)[0] || null;
  if (!source) return {grid:null,pending:true,reason:"ยังไม่มีผลก่อน Target สำหรับสร้างตาราง ML",prediction,targetDate,engine:prediction.selected,engineLabel:labels[prediction.selected]||prediction.selected};

  const inputDigits = [...String(source.number), ...String(source.twoDigit)];
  const engine = prediction.selected;
  let grid = null, items = [], tableKind = "formula";

  if (engine === "classic") {
    grid = formulaGrid(inputDigits, getOriginalFormula());
  } else if (engine === "aiL") {
    const saved = state.aiFormulaLab?.[id];
    if (!saved?.formula || !prediction.availability?.aiL) return {grid:null,pending:true,reason:"AI L ยังไม่พร้อมสำหรับ Target นี้",prediction,targetDate,source,inputDigits,engine,engineLabel:labels[engine]};
    grid = formulaGrid(inputDigits, saved.formula);
  } else if(engine === "gl") {
    const saved=state.aiGLFormulaLab?.[id];
    if(!saved?.formula||!prediction.availability?.gl) return {grid:null,pending:true,reason:"AI GL ยังไม่พร้อมสำหรับ Target นี้",prediction,targetDate,source,inputDigits,engine,engineLabel:labels[engine]};
    grid=formulaGrid(inputDigits,saved.formula);
  } else {
    const generated = engine === "pair" ? generatePairAI(id, targetDate, 5) : generateIndependentAI(id, targetDate, 5);
    if (generated?.pending || !Array.isArray(generated?.items) || generated.items.length < 5) {
      return {grid:null,pending:true,reason:`${labels[engine]} ยังมี candidate ไม่ครบ 5 ชุด`,prediction,targetDate,source,inputDigits,engine,engineLabel:labels[engine]};
    }
    items = generated.items.slice(0,5);
    const numbers = items.map(x=>String(x?.number || "").padStart(3,"0"));
    grid = [0,1,2].map(pos=>numbers.map(n=>Number(n[pos])));
    tableKind = "top5";
  }

  return {
    grid, pending:!grid, prediction, targetDate, source, sourceDate:String(source.date||"").slice(0,10),
    inputDigits, engine, engineLabel:labels[engine]||engine, weight:Number(prediction.probabilities?.[engine]||0),
    items, tableKind, leakPass:Boolean(prediction.leakPass), trainedThrough:prediction.trainedThrough||"", examples:Number(prediction.examples||0)
  };
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

// V6.10.40-R3 — Cold-import WF hot path.
// Precompute the valid L cell triples once. The normal UI still uses findLResults(),
// but the evolutionary scorer can compare the same canonical 3-digit groups without
// allocating result objects/occurrence arrays for every candidate × sample.
const WF_L_CELL_PATHS = (() => {
  const H=3, W=4, paths=[];
  for (const pattern of L_PATTERNS) {
    for (let r=0;r<H;r++) for (let c=0;c<W;c++) {
      const cells=pattern.offsets.map(([dr,dc])=>[r+dr,c+dc]);
      if (!cells.every(([rr,cc])=>rr>=0&&rr<H&&cc>=0&&cc<W)) continue;
      paths.push(cells.map(([rr,cc])=>rr*5+cc));
    }
  }
  return paths;
})();

function formulaHistoryStatusFast(actual, inputs, formula) {
  if (!Array.isArray(inputs) || inputs.length!==5 || inputs.some(v=>!/^[0-9]$/.test(String(v)))) return "pending";
  const value=String(actual||"");
  if (!/^\d{3}$/.test(value)) return "pending";
  const grid=formulaGrid(inputs,formula);
  if (!grid) return "pending";
  const flat=[...grid[0],...grid[1],...grid[2]];
  const canonical=canonical3(value);
  const canBeExact=value===canonical;
  for (let i=0;i<WF_L_CELL_PATHS.length;i++) {
    const path=WF_L_CELL_PATHS[i];
    const key=[String(flat[path[0]]),String(flat[path[1]]),String(flat[path[2]])].sort().join("");
    if (key!==canonical) continue;
    return canBeExact ? "exact" : "reversed";
  }
  return "notfound";
}

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




function rankLResults(items, profileId = state.activeProfile, beforeDate = null) {
  const selectedProfileId = Number(profileId);
  const toTime = value => {
    const time = Date.parse(String(value || ""));
    return Number.isFinite(time) ? time : 0;
  };

  // หน้า "ค้นหาเลข L" ใช้ History ทั้งหมดของ Profile นี้
  // actualDraws ใช้นับจำนวนงวดทั้งหมด ส่วน records คือหลักฐาน Pattern/Position ที่เคย Match
  const strictBeforeDate = /^\d{4}-\d{2}-\d{2}$/.test(String(beforeDate || "")) ? String(beforeDate) : "";
  const allDraws = (state.actualDraws || [])
    .filter(draw => Number(draw.profileId ?? 0) === selectedProfileId && draw.date && (!strictBeforeDate || String(draw.date) < strictBeforeDate))
    .sort((a, b) => toTime(b.date) - toTime(a.date));
  const uniqueDrawDates = [...new Set(allDraws.map(draw => String(draw.date)))];

  const profileRecords = (state.records || [])
    .filter(record => Number(record.profileId) === selectedProfileId && record.patternId && record.status !== "notfound" && (!strictBeforeDate || String(record.date || "") < strictBeforeDate))
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
    refreshCurrentView();
  });
  document.querySelectorAll("[data-profile]").forEach(btn => btn.addEventListener("click", () => {
    const id = Number(btn.dataset.profile);
    independentCalculatePreviewProfile = null;
    mlCalculatePreviewProfile = null;
    state.activeProfile = id;
    if (state.currentView === "home") {
      syncCalculatorTableViewToActiveFormula(id, true);
      loadLatestProfileResultIntoCalculator(id);
    }
    saveState();
    refreshCurrentView();
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

// V6.10.11 Performance Core — refresh only the current page body for UI-only
// mutations (Profile/order/window changes). The app shell, bottom nav, keypad and
// modal stay mounted, and expensive global performance caches remain reusable.
function refreshCurrentView() {
  const main = document.querySelector("main.main");
  if (!main) { render(); return; }
  invalidateViewCache();
  const html = getViewHtml(state.currentView);
  main.innerHTML = html;
  bindFastViewContent();
  bindView();
  centerActiveProfileTab();
  if (["weekly", "history"].includes(state.currentView)) scheduleMissingAIFormulaRecovery(state.activeProfile);
}

let navigationRenderToken = 0;
function applyFastViewHtml(main, html) {
  main.innerHTML = html;
  bindFastViewContent();
  bindView();
  centerActiveProfileTab();
  if (["weekly", "history"].includes(state.currentView)) scheduleMissingAIFormulaRecovery(state.activeProfile);
}
function navigateToView(nextView) {
  if (!nextView || nextView === state.currentView) return;
  closeNumericKeypad();
  // V7.09.17 — every fresh entry to Analysis starts from AI Recommend.
  if (nextView === "analysis") {
    state.analysisSortMode = "ai";
    state.profileOrderMode = "ai";
  }
  if (nextView === "home") syncCalculatorTableViewToActiveFormula(state.activeProfile, true);
  state.currentView = nextView;
  const main = document.querySelector("main.main");
  if (!main) { render(); return; }

  document.querySelectorAll(".bottom-nav [data-view]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === state.currentView);
  });

  const token = ++navigationRenderToken;
  const targetView = state.currentView;
  const cacheKey = `${viewCacheGeneration}:${targetView}`;
  const cachedHtml = VIEW_HTML_CACHE.get(cacheKey);

  // V7.09.39 — cached tabs swap immediately with no opacity/transform animation.
  // This removes the iOS white blink and avoids an unnecessary extra paint.
  if (cachedHtml != null) {
    applyFastViewHtml(main, cachedHtml);
    return;
  }

  // First visit: keep the old page fully painted for one frame, then render once.
  // Never clear/fade the main container while the expensive page is being built.
  main.classList.add("view-switching");
  requestAnimationFrame(() => {
    if (token !== navigationRenderToken || targetView !== state.currentView) return;
    const html = getViewHtml(targetView);
    if (token !== navigationRenderToken || targetView !== state.currentView) return;
    applyFastViewHtml(main, html);
    main.classList.remove("view-switching", "view-enter-fast");
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
      return Number(aiB.evidenceReady) - Number(aiA.evidenceReady) || aiB.confidence - aiA.confidence || aiB.trustedSamples - aiA.trustedSamples || aiB.trustedRate - aiA.trustedRate || a - b;
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

// V7.09.14 — Profile Auto-5 latest-result lock.
// Compare History dates by a deterministic calendar key instead of relying on
// raw string order. This also tolerates older/imported date representations.
function actualDrawDateOrderKey(value) {
  const raw = String(value || "").trim();
  if (!raw) return 0;

  let m = raw.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if (m) {
    const y=Number(m[1]), mo=Number(m[2]), d=Number(m[3]);
    if (mo>=1 && mo<=12 && d>=1 && d<=31) return y*10000 + mo*100 + d;
  }

  // Legacy/manual rows can occasionally be DD/MM/YYYY.
  m = raw.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
  if (m) {
    const d=Number(m[1]), mo=Number(m[2]), y=Number(m[3]);
    if (mo>=1 && mo<=12 && d>=1 && d<=31) return y*10000 + mo*100 + d;
  }

  const parsed = Date.parse(raw);
  if (Number.isFinite(parsed)) {
    const dt = new Date(parsed);
    return dt.getFullYear()*10000 + (dt.getMonth()+1)*100 + dt.getDate();
  }
  return 0;
}

function compareActualDrawRecency(a, b) {
  const dateDiff = actualDrawDateOrderKey(b?.date) - actualDrawDateOrderKey(a?.date);
  if (dateDiff) return dateDiff;
  return Number(b?.updatedAt || b?.createdAt || 0) - Number(a?.updatedAt || a?.createdAt || 0);
}

function getLatestActualDraw(profileId = state.activeProfile) {
  return [...(state.actualDraws || [])]
    .filter(r => Number(r?.profileId ?? 0) === Number(profileId) && actualDrawDateOrderKey(r?.date) > 0)
    .sort(compareActualDrawRecency)[0] || null;
}

function getLatestCompleteActualDraw(profileId = state.activeProfile) {
  return [...(state.actualDraws || [])]
    .filter(r => Number(r?.profileId ?? 0) === Number(profileId)
      && actualDrawDateOrderKey(r?.date) > 0
      && /^\d{3}$/.test(String(r?.number || ""))
      && /^\d{2}$/.test(String(r?.twoDigit || "")))
    .sort(compareActualDrawRecency)[0] || null;
}

function loadLatestProfileResultIntoCalculator(profileId = state.activeProfile) {
  const id = Number(profileId);
  const latest = getLatestActualDraw(id);
  const complete = latest && /^\d{3}$/.test(String(latest.number || "")) && /^\d{2}$/.test(String(latest.twoDigit || ""));

  // Important: never silently fall back to an older complete row. If the true
  // latest row is incomplete, clear Auto-5 so an old draw cannot look current.
  if (!complete) {
    state.lastInput = ["","","","",""];
    state.grid = null;
    state.calculationDate = latest?.date || null;
    state.selectedL = null;
    return { loaded:false, latest };
  }

  state.lastInput = [...String(latest.number), ...String(latest.twoDigit)];
  state.calculationDate = latest.date || isoDate();
  state.grid = calculateGrid(state.lastInput, id);
  state.selectedL = null;
  return { loaded:true, latest };
}

function renderHome() {
  const profileId = Number(state.activeProfile);
  const independentPreview = independentCalculatePreviewProfile === profileId;
  const mlPreview = mlCalculatePreviewProfile === profileId;
  const independentTable = independentPreview ? getIndependentPreviewTable(profileId) : null;
  const mlTable = mlPreview ? getMLSelectPreviewTable(profileId) : null;
  const calculatorSelected = (!mlPreview && !independentPreview) ? getCalculatorSelectedTable(profileId) : null;
  const grid = mlPreview ? mlTable?.grid : (independentPreview ? independentTable?.grid : (calculatorSelected?.grid || state.grid));
  const latestDraw = getLatestCompleteActualDraw();
  const profileName = state.profiles[profileId] || `Profile ${profileId+1}`;
  const calcDate = mlPreview ? (mlTable?.sourceDate || state.calculationDate || isoDate()) : (state.calculationDate || isoDate());
  const independentNumbers = independentTable?.items?.map(x=>String(x.number)).join(" • ") || "";
  const mlNumbers = mlTable?.items?.map(x=>String(x.number)).join(" • ") || "";
  const configuredAuto = getConfiguredFormulaMode(profileId)==="auto";
  const resultBadge = mlPreview ? `ML Select • ${mlTable?.engineLabel || "Waiting"}` : (independentPreview ? "AI อิสระ • TOP 5" : (configuredAuto ? "AUTO" : (calculatorSelected?.label || getDisplayedGridFormulaDetail())));
  const resultBadgeClass = mlPreview ? "ml" : (independentPreview ? "independent" : (getActiveFormulaMode(profileId)==="blend"?"blend":calculatorSelected?.key==="gl"?"gl":calculatorSelected?.key==="ai"?"ai":"original"));
  const displayInput = mlPreview && Array.isArray(mlTable?.inputDigits) ? mlTable.inputDigits : state.lastInput;
  return `
    <section class="card calculator-card ux-page-card">
      <div class="ux-page-head">
        <div><small>CALCULATE</small><h2>${escapeHtml(profileName)}</h2><p>${formatDateTH(calcDate)} • ${mlPreview ? `ML Select → ${escapeHtml(mlTable?.engineLabel || "กำลังรอ")} • Target ${escapeHtml(mlTable?.targetDate || getMLSelectTargetDate())}` : (independentPreview ? "AI อิสระจาก History โดยตรง" : escapeHtml(getCalculateFormulaContext(profileId)?.historical ? getDisplayedGridFormulaDetail(profileId) : (configuredAuto ? "AUTO" : getActiveFormulaLabel())))}</p></div>
        <div class="calculator-icon-actions" aria-label="Result shortcuts">
          <button id="btnBrowseResultCalendar" class="ios-icon-btn ${latestDraw ? "" : "disabled"}" ${latestDraw ? "" : "disabled"} aria-label="เลือกผลย้อนหลัง" title="เลือกผลย้อนหลัง">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2.75v3M17 2.75v3M3.75 8.25h16.5M5.5 4.75h13a1.75 1.75 0 0 1 1.75 1.75v12a1.75 1.75 0 0 1-1.75 1.75h-13a1.75 1.75 0 0 1-1.75-1.75v-12A1.75 1.75 0 0 1 5.5 4.75Z"/></svg>
          </button>
          <button id="btnLoadLastResult" class="ios-icon-btn ${latestDraw ? "" : "disabled"}" ${latestDraw ? "" : "disabled"} aria-label="โหลดผลล่าสุด" title="โหลดผลล่าสุด">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.2 8.1V3.9m0 0h4.2m-4.2 0 3.15 3.15A8 8 0 1 1 4.7 14.3"/></svg>
          </button>
        </div>
      </div>
      ${profileTabs(false)}
      ${mlPreview ? `<div class="ml-preview-note"><div><b>Machine Learning Select • ดูอย่างเดียว</b><span>${escapeHtml(mlTable?.engineLabel || "Waiting")} ${mlTable?.weight!=null?`• ${Number(mlTable.weight).toFixed(1)}%`:``} • Strict Prior-only</span></div><small>Source ${escapeHtml(mlTable?.sourceDate || "—")} → Target ${escapeHtml(mlTable?.targetDate || getMLSelectTargetDate())} • Anti-Leak ${mlTable?.leakPass?'PASS':'BLOCKED'}</small></div>` : (independentPreview ? `<div class="independent-preview-note"><b>AI อิสระ • ดูอย่างเดียว</b><span>ตารางนี้สร้างจาก Top 5 ของ AI อิสระโดยตรง ไม่เปลี่ยน AUTO / Classic L / AI L และไม่เขียนทับตาราง History</span></div>` : ``)}
      <div class="input-row ux-digit-row">${displayInput.map((v, i) => `<input class="digit-input ${i===0?'active':''}" data-index="${i}" maxlength="1" type="text" readonly value="${escapeHtml(v)}" aria-label="Digit ${i+1}">`).join("")}</div>
      <div class="action-row ux-primary-actions">
        ${mlPreview ? `<button id="btnExitMLPreview" class="btn primary">กลับตารางสูตรหลัก</button>` : (independentPreview ? `<button id="btnExitIndependentPreview" class="btn primary">กลับตารางสูตรหลัก</button>` : `<button id="btnCalc" class="btn primary">CALCULATE</button>`)}
        <button id="btnClear" class="btn secondary">CLEAR</button>
      </div>
    </section>
    ${grid ? `<section class="card result-card-clean ux-result-card">
      <div class="ux-result-head"><div><small>TABLE RESULT</small></div><span class="table-formula-badge ${resultBadgeClass}">${escapeHtml(resultBadge)}</span></div>
      ${(!mlPreview && !independentPreview) ? calculatorEngineTabsHtml(profileId) : ''}
      ${mlPreview && mlTable?.tableKind==="top5" ? `<div class="ml-top5-line"><span>ML Top 5</span><b>${escapeHtml(mlNumbers)}</b><small>แต่ละคอลัมน์ = เลข 3 ตัว 1 ชุด • ${escapeHtml(mlTable.engineLabel)}</small></div>` : (independentPreview ? `<div class="independent-top5-line"><span>Top 5</span><b>${escapeHtml(independentNumbers)}</b><small>แต่ละคอลัมน์ = เลข 3 ตัว 1 ชุด</small></div>` : ``)}
      ${gridHtml(grid)}
      ${mlPreview ? `<button id="btnMLPreviewDetails" class="btn primary full ux-find-l-btn ml-preview-action"><span>✦</span> ML SELECT • ${escapeHtml(mlTable?.engineLabel || "DETAIL")}</button>` : (independentPreview ? `<button id="btnIndependentResults" class="btn primary full ux-find-l-btn"><span>✦</span> ดูอันดับ AI อิสระ Top 10</button>` : `<button id="btnFindL" class="btn primary full ux-find-l-btn">${configuredAuto ? "AUTO" : (calculatorSelected?.label || (getDisplayedGridFormulaMode() === "gl" ? "AI GL" : getDisplayedGridFormulaMode() === "ai" ? "AI L" : "Classic L"))}</button>`)}
    </section>` : mlPreview ? `<section class="ux-empty-state ml-empty"><b>ML Select Table ยังไม่พร้อม</b><span>${escapeHtml(mlTable?.reason || "รอ Strict Walk-Forward ที่ผ่าน Audit")}</span><button id="btnExitMLPreview" class="btn secondary">กลับตารางสูตรหลัก</button></section>` : (independentPreview ? `<section class="ux-empty-state"><b>AI อิสระยังไม่พร้อม</b><span>ต้องมี History อย่างน้อย 8 งวด (ขณะนี้ ${independentTable?.dataCount || 0} งวด)</span><button id="btnExitIndependentPreview" class="btn secondary">กลับตารางสูตรหลัก</button></section>` : `<section class="ux-empty-state"><b>พร้อมคำนวณ</b><span>กรอกเลขให้ครบ 5 หลัก แล้วกด “คำนวณตาราง”</span></section>`)}
  `;
}

function loadActualDrawIntoCalculator(draw) {
  independentCalculatePreviewProfile = null;
  mlCalculatePreviewProfile = null;
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
    .sort(compareActualDrawRecency);
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

function getConfiguredFormulaMode(profileId = state.activeProfile) {
  const raw = state.activeFormulaByProfile?.[Number(profileId)];
  return raw === "ai" || raw === "gl" || raw === "original" || raw === "auto" ? raw : "auto";
}
// V7.09.37 — one global formula selection state across AI + Calculator.
// AUTO resolves once from the shared live selector; Calculator follows that resolved engine
// when entering Calculate, changing profile, calculating, or changing strategy on the AI page.
// The Calculator tabs remain viewable manually after entry, but AUTO never requires a second tap.
function syncCalculatorTableViewToActiveFormula(profileId = state.activeProfile, forceConfigured = false) {
  const id = Number(profileId);
  const configured = getConfiguredFormulaMode(id);
  if (configured === "auto") {
    const resolved = getAutoFormulaDecision(id)?.mode;
    // BLEND is an L-result fusion, not a fourth 3x5 formula grid.
    // Calculator keeps AI L as the visible base grid while the shared AUTO state
    // remains BLEND and the result button opens the fused AI L + AI GL ranking.
    calculatorTableViewMode = resolved === "blend" ? "ai" : (["original","ai","gl"].includes(resolved) ? resolved : "original");
  } else if (forceConfigured && ["original","ai","gl"].includes(configured)) {
    calculatorTableViewMode = configured;
  }
  return calculatorTableViewMode;
}
function getAutoFormulaDecision(profileId = state.activeProfile) {
  // V7.09.52 — ONE TRUSTED SCORE SOURCE FOR LIVE AUTO.
  // The AI page, AUTO selector and result popup must compare the exact same
  // Verified Live / strict Walk-Forward history. No hidden recent-window rate
  // is allowed to disagree with the percentages shown to the user.
  // Classic is always admitted. AI L / AI GL are admitted only when READY.
  // Highest Trusted rate wins. BLEND is allowed only when BOTH AI engines are
  // READY, close to each other (<=2pp), and neither is below Classic; therefore
  // BLEND can never override a Classic L score that is visibly higher.
  const id = Number(profileId);
  const saved = state.aiFormulaLab?.[id] || null;
  const glSaved = state.aiGLFormulaLab?.[id] || null;
  const gate = 5, minSamples = 14;

  const profileDraws = (state.actualDraws || [])
    .filter(d => Number(d.profileId ?? 0) === id)
    .sort((a,b) => String(a.date || "").localeCompare(String(b.date || "")));
  const classic = trustedHistorySummary(profileDraws,id,"classic");
  const ai = trustedHistorySummary(profileDraws,id,"aiL");
  const gl = trustedHistorySummary(profileDraws,id,"gl");
  const samples = Math.min(Number(classic.total||0), Number(ai.total||0));
  const margin = Math.round((Number(ai.rate||0)-Number(classic.rate||0))*10)/10;
  const glVsClassic = Math.round((Number(gl.rate||0)-Number(classic.rate||0))*10)/10;
  const glVsAI = Math.round((Number(gl.rate||0)-Number(ai.rate||0))*10)/10;
  const aiActivationReady = Boolean(saved?.formula && formulaEligibility(saved).allowed);
  const glActivationReady = Boolean(glSaved?.formula && glFormulaEligibility(glSaved,id).allowed);
  const blendGap = Math.round(Math.abs(Number(ai.rate||0)-Number(gl.rate||0))*10)/10;

  const selector = {
    samples, glSamples:Number(gl.total||0),
    classicRate:Number(classic.rate||0), aiRate:Number(ai.rate||0), glRate:Number(gl.rate||0),
    margin, glVsClassic, glVsAI,
    aiActivationReady, glActivationReady, trustedOnly:true,
    classicTrustedAll:Number(classic.total||0), aiTrustedAll:Number(ai.total||0), glTrustedAll:Number(gl.total||0),
    classicTrustedAllRate:Number(classic.rate||0), aiTrustedAllRate:Number(ai.rate||0), glTrustedAllRate:Number(gl.rate||0),
    blendGapAll:blendGap
  };

  if (!saved?.formula) {
    return {...selector, mode:"original", reason:`ยังไม่มีสูตร AI • Classic L Trusted ${classic.rate}%`, gate, minSamples, ready:false, candidatePool:["original"]};
  }
  if (Number(classic.total||0) < minSamples) {
    return {...selector, mode:"original", reason:`รอข้อมูล Trusted ${classic.total}/${minSamples} งวด • ใช้ Classic L`, gate, minSamples, ready:false, candidatePool:["original"]};
  }

  const candidates=[{key:"original",name:"Classic L",rate:Number(classic.rate||0),total:Number(classic.total||0),ready:true}];
  if(aiActivationReady && Number(ai.total||0)>=minSamples) candidates.push({key:"ai",name:"AI L",rate:Number(ai.rate||0),total:Number(ai.total||0),ready:true});
  if(glActivationReady && Number(gl.total||0)>=minSamples) candidates.push({key:"gl",name:"AI GL",rate:Number(gl.rate||0),total:Number(gl.total||0),ready:true});

  // BLEND is a special AUTO winner only when BOTH AI engines themselves are
  // at least as strong as Classic on the same Trusted evidence.
  const blendReady = Boolean(
    aiActivationReady && glActivationReady &&
    Number(ai.total||0)>=minSamples && Number(gl.total||0)>=minSamples &&
    blendGap<=2.0 && Number(ai.rate||0)>=Number(classic.rate||0) && Number(gl.rate||0)>=Number(classic.rate||0)
  );
  if(blendReady){
    return {...selector,mode:"blend",
      reason:`AI L ${ai.rate}% + AI GL ${gl.rate}% • ต่างกัน ${blendGap.toFixed(1)} จุดเปอร์เซ็นต์ • ทั้งคู่ ≥ Classic ${classic.rate}% • AUTO BLEND`,
      gate,minSamples,ready:true,blendReady:true,blendGap,recentBlendGap:blendGap,blendSources:["ai","gl"],candidatePool:candidates.map(x=>x.key)};
  }

  const topRate=Math.max(...candidates.map(x=>Number(x.rate||0)));
  const tied=candidates.filter(x=>Math.abs(Number(x.rate||0)-topRate)<0.0001);
  if(tied.length===1){
    const top=tied[0];
    const compare = top.key === "original"
      ? ` • AI L ${ai.rate}% • AI GL ${gl.rate}%`
      : top.key === "gl"
        ? ` • เหนือ Classic ${glVsClassic>0?"+":""}${glVsClassic}%`
        : ` • เหนือ Classic ${margin>0?"+":""}${margin}%`;
    return {...selector,mode:top.key,reason:`${top.name} สูงสุด Trusted ${top.rate}%${compare} • READY`,gate,minSamples,ready:true,candidatePool:candidates.map(x=>x.key)};
  }

  const champion=getHistoryChampionForProfile(id);
  const championByKey=new Map((champion?.items||[]).map(x=>[x.key,Number(x.championScore||0)]));
  const rankedTie=tied.map(x=>({...x,championScore:championByKey.get(x.key)||0})).sort((a,b)=>b.championScore-a.championScore||b.total-a.total);
  const top=rankedTie[0]||null,second=rankedTie[1]||null;
  if(top && Number(top.championScore)>Number(second?.championScore??-1)){
    return {...selector,mode:top.key,reason:`Trusted เสมอ ${top.rate}% • Champion Score เลือก ${top.name} (${top.championScore})`,gate,minSamples,ready:true,candidatePool:candidates.map(x=>x.key),championTieBreak:true};
  }
  return {...selector,mode:"original",reason:"Trusted + Champion Score ยังเสมอ • Safety fallback → Classic L",gate,minSamples,ready:true,candidatePool:candidates.map(x=>x.key),championTieBreak:true};
}
// V7.09.8 — Historical AUTO choice for each History row.
// Strict anti-leak rule: the decision for targetDate may consume only trusted rows with date < targetDate.
// A recorded snapshot wins; older rows without one are reconstructed from the same trusted Prior-only evidence.
function getHistoricalAutoFormulaDecision(profileId = state.activeProfile, targetDate = "", maxRows = 30) {
  const id = Number(profileId), cutoff = String(targetDate || "");
  const gate = 5, minSamples = 14;
  const rows = (state.actualDraws || [])
    .filter(d => Number(d.profileId ?? 0) === id && (!cutoff || String(d.date || "") < cutoff))
    .sort((a,b) => String(a.date || "").localeCompare(String(b.date || "")))
    .map(d => {
      const c = getHistoryComparisonStatuses(d, id);
      if (!c?.trusted || c.classic === "pending" || c.aiL === "pending") return null;
      return {date:String(d.date || ""), classic:c.classic, aiL:c.aiL,gl:c.gl||"pending"};
    }).filter(Boolean).slice(-Math.max(1, Number(maxRows) || 30));
  const hitRate = key => {
    const valid = rows.filter(r => r[key] !== "pending");
    const hit = valid.filter(r => r[key] === "exact" || r[key] === "reversed").length;
    return valid.length ? hit * 100 / valid.length : 0;
  };
  const classicRate = hitRate("classic"), aiRate = hitRate("aiL"),glRate=hitRate("gl");
  const margin = Math.round((aiRate - classicRate) * 10) / 10;
  const glRows=rows.filter(r=>r.gl!=="pending").length,glVsClassic=Math.round((glRate-classicRate)*10)/10,glVsAI=Math.round((glRate-aiRate)*10)/10;
  let mode=glRows>=minSamples&&glVsClassic>=gate&&glVsAI>0?"gl":rows.length>=minSamples&&margin>=gate?"ai":"original";
  let championTieBreak=false;
  if(rows.length>=minSamples&&margin===0&&mode==="original"){
    const cTotal=rows.filter(r=>r.classic!=="pending").length, aTotal=rows.filter(r=>r.aiL!=="pending").length;
    const bestRate=Math.max(classicRate,aiRate,.1),maxTotal=Math.max(cTotal,aTotal,1);
    const cScore=Math.round(Math.min(100,(classicRate/bestRate)*80+(cTotal/maxTotal)*20));
    const aScore=Math.round(Math.min(100,(aiRate/bestRate)*80+(aTotal/maxTotal)*20));
    if(aScore>cScore) mode="ai";
    championTieBreak=true;
  }
  return {mode, label:mode === "gl"?"GL":mode === "ai" ? "AIL" : "CLS", samples:rows.length, classicRate:Math.round(classicRate*10)/10, aiRate:Math.round(aiRate*10)/10,glRate:Math.round(glRate*10)/10,margin,glVsClassic,glVsAI,gate,minSamples,trustedOnly:true,reconstructed:true,championTieBreak};
}
function getHistoryAutoChoice(draw, profileId = Number(draw?.profileId ?? 0)) {
  const saved = draw?.autoDecisionSnapshot;
  if (saved && (saved.mode === "ai" || saved.mode === "gl" || saved.mode === "original")) {
    return {...saved, label:saved.mode === "gl"?"GL":saved.mode === "ai" ? "AIL" : "CLS", reconstructed:false};
  }
  return getHistoricalAutoFormulaDecision(profileId, draw?.date || "", 30);
}

function getActiveFormulaMode(profileId = state.activeProfile) {
  const configured = getConfiguredFormulaMode(profileId);
  return configured === "auto" ? getAutoFormulaDecision(profileId).mode : configured;
}
function getActiveFormula(profileId = state.activeProfile) {
  const id = Number(profileId);
  const saved = state.aiFormulaLab?.[id];
  const glSaved=state.aiGLFormulaLab?.[id],mode=getActiveFormulaMode(id);
  if(mode==="gl"&&glSaved?.formula) return glSaved.formula;
  if(mode==="blend"&&saved?.formula) return saved.formula; // visual base grid only; fused L result is built separately
  return mode === "ai" && saved?.formula ? saved.formula : getOriginalFormula();
}
function getAIFormulaDisplayName(profileId = state.activeProfile) {
  const saved = state.aiFormulaLab?.[Number(profileId)];
  const version = Number(saved?.version || 1);
  const engine = saved?.engine || "Evolution Ensemble";
  return `AI Champion V${version} • ${engine}`;
}
function getActiveFormulaLabel(profileId = state.activeProfile) {
  const id = Number(profileId);
  if(getActiveFormulaMode(id)==="blend") return "BLEND • AI L + AI GL";
  if(getActiveFormulaMode(id)==="gl") return `AI GL V${Number(state.aiGLFormulaLab?.[id]?.version||1)} • Hybrid Refiner`;
  if (getActiveFormulaMode(id) !== "ai") return "Classic L";
  return getAIFormulaDisplayName(id);
}

function getActiveFormulaDetail(profileId = state.activeProfile) {
  const id = Number(profileId);
  if(getActiveFormulaMode(id)==="blend") return "AUTO BLEND • AI L + AI GL • DEDUP + CONSENSUS";
  if(getActiveFormulaMode(id)==="gl") return `AI GL V${Number(state.aiGLFormulaLab?.[id]?.version||1)} • Classic + AI L`;
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
  const calcCtx = getCalculateFormulaContext(id);
  if (calcCtx?.historical) return calcCtx.mode;
  if (!state.grid || !Array.isArray(state.lastInput) || state.lastInput.length !== 5) return getActiveFormulaMode(id);
  const originalGrid = formulaGrid(state.lastInput, getOriginalFormula());
  const aiFormula = state.aiFormulaLab?.[id]?.formula || null;
  const glFormula = state.aiGLFormulaLab?.[id]?.formula || null;
  const aiGrid = aiFormula ? formulaGrid(state.lastInput, aiFormula) : null;
  const glGrid = glFormula ? formulaGrid(state.lastInput, glFormula) : null;
  const isOriginal = gridsEqual(state.grid, originalGrid);
  const isAI = aiGrid ? gridsEqual(state.grid, aiGrid) : false;
  const isGL = glGrid ? gridsEqual(state.grid, glGrid) : false;
  if(isGL&&!isOriginal&&!isAI) return "gl";
  if (isAI && !isOriginal) return "ai";
  if (isOriginal && !isAI) return "original";
  return getActiveFormulaMode(id);
}
function getDisplayedGridFormulaDetail(profileId = state.activeProfile) {
  const id = Number(profileId);
  const calcCtx = getCalculateFormulaContext(id);
  if (calcCtx?.historical) {
    if (calcCtx.mode === 'gl' && calcCtx.trustedGL) return 'AI GL • Historical Snapshot';
    if (calcCtx.mode === 'ai' && calcCtx.trustedAI) return 'AI L • Historical Snapshot';
    return 'Classic L • ไม่มี AI Snapshot';
  }
  const displayedMode = getDisplayedGridFormulaMode(id);
  const configuredMode = getConfiguredFormulaMode(id);
  const activeMode = getActiveFormulaMode(id);

  // V6.10.9: make AUTO visible on the Calculate result itself.
  // Only mark the table as AUTO when the displayed grid is the grid AUTO
  // currently resolves to. One-off AI Preview results keep a plain AI L label
  // so the badge never claims AUTO selected a preview that it did not choose.
  if (configuredMode === "auto" && activeMode === "blend") {
    return "🤖 AUTO → BLEND • AI L + AI GL";
  }
  if (configuredMode === "auto" && displayedMode === activeMode) {
    return displayedMode === "gl"?"🤖 AUTO → AI GL":displayedMode === "ai" ? "🤖 AUTO → AI L" : "🤖 AUTO → Classic L";
  }
  return displayedMode === "gl"?"AI GL":displayedMode === "ai" ? "AI L" : "Classic L";
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
  return ({"เดิม":"CLS", "AI L":"AIL", "AI อิสระ":"IND", "AI Pair":"PAIR", "Master AI":"MAI", "เสมอ":"TIE"})[winner] || winner || "—";
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
// V6.10.1 — Imported-photo History has no pre-result live AI snapshot by design.
// When a fair prior-only Walk-Forward record exists, render its stored AI grid instead
// of showing "No table". This is display-only and never rebuilds the past with today's AI.
function gridMatchDetail(actual, grid) {
  if (!Array.isArray(grid) || !/^\d{3}$/.test(String(actual || ""))) return {status:"pending", matched:"-", grid:null};
  const value=String(actual), canonical=canonical3(value), results=findLResults(grid);
  const exact=results.find(x=>String(x.number)===value);
  if(exact) return {status:"exact",matched:String(exact.number),grid};
  const reversed=results.find(x=>(x.canonicalNumber||canonical3(x.number))===canonical);
  return reversed ? {status:"reversed",matched:String(reversed.number),grid} : {status:"notfound",matched:"-",grid};
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

function snapshotItemsStatus(actual, items) {
  if (!Array.isArray(items) || !items.length || !/^\d{3}$/.test(String(actual || ""))) return "pending";
  const value = String(actual), canonical = canonical3(value);
  const numbers = items.map(x => String(typeof x === "string" ? x : x?.number || "")).filter(x => /^\d{3}$/.test(x));
  if (numbers.includes(value)) return "exact";
  if (numbers.some(x => canonical3(x) === canonical)) return "reversed";
  return "notfound";
}
function getUniversalPredictionSnapshot(profileId, resultDate, actualDraw = null) {
  const draw = actualDraw || state.actualDraws.find(x => Number(x.profileId ?? 0) === Number(profileId) && x.date === resultDate) || null;
  const table = getPredictionTable(profileId, resultDate, draw);
  const snap = table?.predictionSnapshot || null;
  if (!table || !draw || !snap) return null;
  const targetDate = String(snap.targetDate || "");
  const snapshotAt = Number(snap.createdAt || 0);
  const resultSavedAt = Number(draw.createdAt || draw.updatedAt || 0);
  if (targetDate !== String(resultDate || "")) return null;
  if (!snapshotAt || !resultSavedAt || snapshotAt >= resultSavedAt) return null;
  // Reject legacy/tampered snapshots whose source table is not strictly before the target result.
  const sourceTableDate = String(snap.sourceTableDate || table.date || "").slice(0,10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sourceTableDate) || sourceTableDate >= String(resultDate || "")) return null;
  return snap;
}
function independentHistoryStatus(actual, profileId, date, limit = 10) {
  const draw = state.actualDraws.find(x => Number(x.profileId ?? 0) === Number(profileId) && x.date === date) || null;
  const snap = getUniversalPredictionSnapshot(profileId, date, draw);
  if (!snap) return {status:"pending", prediction:{items:[],pending:true,snapshotMissing:true}};
  const items=(snap.independentItems || []).slice(0,Math.max(1,limit)).map((number,i)=>({number:String(number),aiRank:i+1}));
  return {status:snapshotItemsStatus(actual,items), prediction:{items,pending:false,snapshot:true,createdAt:snap.createdAt}};
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

// V6.10.40-R13 TEST — AI Pair Relationship. Strict prior-only.
function generatePairAI(profileId, beforeDate = null, limit = 10) {
  const cacheKey = performanceKey("pairAI", profileId, beforeDate, limit);
  if (PERF_CACHE.pairAI.has(cacheKey)) return PERF_CACHE.pairAI.get(cacheKey);
  const draws = independentHistory(profileId, beforeDate);
  if (draws.length < 8) { const pending={items:[],dataCount:draws.length,pending:true}; PERF_CACHE.pairAI.set(cacheKey,pending); return pending; }
  const stats=AI_HISTORY_WINDOWS.map(({size,weight})=>{
    const sample=size===Infinity?draws:draws.slice(-size), denom=sample.length||1;
    const any=Array(10).fill(0), pair01=Array(100).fill(0), pair12=Array(100).fill(0), together=Array(100).fill(0);
    sample.forEach(d=>{
      const v=String(d.number).padStart(3,"0"), digits=v.split("").map(Number), seen=[...new Set(digits)];
      seen.forEach(x=>any[x]++); pair01[Number(v.slice(0,2))]++; pair12[Number(v.slice(1,3))]++;
      for(let a=0;a<seen.length;a++) for(let b=a+1;b<seen.length;b++){const lo=Math.min(seen[a],seen[b]),hi=Math.max(seen[a],seen[b]);together[lo*10+hi]++;}
    });
    return {weight,denom,any,pair01,pair12,together};
  });
  const items=[];
  for(let n=0;n<1000;n++){
    const number=String(n).padStart(3,"0"), d=number.split("").map(Number); let score=0; const reasons=[];
    stats.forEach((st,wi)=>{
      const adjacent=(st.pair01[Number(number.slice(0,2))]/st.denom + st.pair12[Number(number.slice(1,3))]/st.denom)/2;
      const pairs=[]; [[d[0],d[1]],[d[1],d[2]],[d[0],d[2]]].forEach(([a,b])=>{if(a===b)return;const lo=Math.min(a,b),hi=Math.max(a,b),key=lo*10+hi;if(pairs.some(x=>x.key===key))return;const observed=st.together[key]/st.denom,expected=(st.any[lo]/st.denom)*(st.any[hi]/st.denom),lift=expected>0?Math.min(3,observed/expected):0;pairs.push({key,lift,observed});});
      const liftAvg=pairs.length?pairs.reduce((a,x)=>a+x.lift,0)/pairs.length:0, observedAvg=pairs.length?pairs.reduce((a,x)=>a+x.observed,0)/pairs.length:0;
      score += ((adjacent*55)+(Math.min(1,liftAvg/2)*30)+(observedAvg*15))*st.weight;
      if(wi===0){if(adjacent>=.08)reasons.push("คู่ตำแหน่ง 1→2 / 2→3 เด่นช่วงล่าสุด");if(liftAvg>=1.35)reasons.push("คู่เลขเกิดร่วมกันมากกว่าความถี่ปกติ");}
    });
    items.push({number,aiScore:Math.round(score*10)/10,aiReasons:[...new Set(reasons)].slice(0,3)});
  }
  items.sort((a,b)=>b.aiScore-a.aiScore||a.number.localeCompare(b.number));
  const top=items.slice(0,Math.max(1,limit)).map((x,i)=>({...x,aiRank:i+1,aiDataCount:draws.length}));
  const result={items:top,dataCount:draws.length,pending:false,experimental:true}; PERF_CACHE.pairAI.set(cacheKey,result); return result;
}
function pairHistoryStatus(actual, profileId, date, limit=10) {
  const draw=state.actualDraws.find(x=>Number(x.profileId??0)===Number(profileId)&&x.date===date)||null, snap=getUniversalPredictionSnapshot(profileId,date,draw);
  if(!snap)return {status:"pending",prediction:{items:[],pending:true,snapshotMissing:true}};
  const items=(snap.pairItems||[]).slice(0,Math.max(1,limit)).map((number,i)=>({number:String(number),aiRank:i+1}));
  return {status:snapshotItemsStatus(actual,items),prediction:{items,pending:!items.length,snapshot:true,createdAt:snap.createdAt}};
}
function pairHistorySummary(draws, profileId, limit=10) {
  const cacheKey=performanceKey("pairSummary",profileId,null,limit,drawListPerformanceKey(draws)); if(PERF_CACHE.pairSummary.has(cacheKey))return PERF_CACHE.pairSummary.get(cacheKey);
  let hit=0,total=0;(draws||[]).forEach(draw=>{
    let status=pairHistoryStatus(draw.number,profileId,draw.date,limit).status;
    if(status==="pending"){const wf=getWalkForwardRecord(profileId,draw);status=wf?.statuses?.pair||"pending";}
    if(status==="pending")return;total++;if(status==="exact"||status==="reversed")hit++;
  });
  const summary={hit,total,rate:total?Math.round(hit*1000/total)/10:0};PERF_CACHE.pairSummary.set(cacheKey,summary);return summary;
}

// V6.4 — Master AI / Meta Ensemble: เรียนรู้จาก Classic + AI L + AI อิสระ
function masterPriorDraws(profileId, beforeDate = null) {
  return state.actualDraws.filter(d => Number(d.profileId ?? 0) === Number(profileId) && /^\d{3}$/.test(String(d.number || "")) && (!beforeDate || d.date < beforeDate));
}
function liveMasterTargetDate() {
  let targetDate = isoDate();
  let day = new Date(`${targetDate}T12:00:00`).getDay();
  while (day === 0 || day === 6) {
    targetDate = shiftIsoDate(targetDate, 1);
    day = new Date(`${targetDate}T12:00:00`).getDay();
  }
  return targetDate;
}

function todayMasterAIWeights(profileId) {
  // Today cards must never inherit a historical date left in Calculate.
  // Passing an explicit target also enforces strict prior-only data: draw.date < targetDate.
  return masterAIWeights(profileId, liveMasterTargetDate());
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
    if (engine === "aiL") return aiLHistorySummary(sample, profileId);
    if (engine === "pair") return pairHistorySummary(sample, profileId, 10);
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
    independent:buildEngine("independent"),
    pair:buildEngine("pair")
  };
  // R35 Master Weight Evidence-Rank Guard (FAST):
  // Long-run verified evidence is the anchor. Recent/weekday form is allowed to tilt
  // close engines, but it cannot make a materially weaker mature engine jump above a
  // stronger one just because of a short streak. O(1) arithmetic only; no extra scans.
  const allHistory = metric => {
    const windows=metric?.recent?.windows||[];
    return windows.find(w=>w.size===Infinity) || windows[windows.length-1] || metric?.overall || {hit:0,total:0,rate:0};
  };
  const evidenceScore = (metric, engine) => {
    const all=allHistory(metric);
    const total=Number(all?.total||0), hit=Number(all?.hit||0), rate=Number(all?.rate||0);
    const dynamic=Number(metric?.score||0);
    if (!total) return {score:0.12,rate:0,total:0,hit:0};

    // Small samples may move more; mature samples (>60) only allow a controlled tilt.
    const confidence=Math.min(1,total/60);
    const adaptive=0.55-(confidence*0.35); // 55% small sample -> 20% mature sample
    const delta=Math.max(-8,Math.min(8,dynamic-rate));
    let score=rate + delta*adaptive;

    // Keep a small evidence-sensitive floor without making all engines equal.
    const floor=Math.max(0.12,Math.min(1.20,rate*0.18));
    score=Math.max(floor,score);

    // Experimental/no-hit engines cannot receive a meaningful share before proving a hit.
    if(total>=8 && hit===0) score=Math.min(score,engine==="pair"?0.25:0.40);
    return {score:Math.max(0.12,score),rate,total,hit};
  };
  const evidence={
    classic:evidenceScore(metrics.classic,"classic"),
    aiL:aiFormula?evidenceScore(metrics.aiL,"aiL"):{score:0,rate:0,total:0,hit:0},
    independent:evidenceScore(metrics.independent,"independent"),
    pair:evidenceScore(metrics.pair,"pair")
  };
  let raw={classic:evidence.classic.score,aiL:evidence.aiL.score,independent:evidence.independent.score,pair:evidence.pair.score};

  // Mature historical ranking guard. If two engines both have >=30 verified samples and
  // their long-run rates differ by >=1pp, the weaker one may approach but not overtake
  // the stronger one from short-term form alone. Engines within <1pp remain free to flip.
  const keys=["classic","aiL","independent","pair"].filter(k=>raw[k]>0);
  keys.sort((a,b)=>evidence[b].rate-evidence[a].rate || evidence[b].total-evidence[a].total);
  for(let i=0;i<keys.length;i++){
    const strong=keys[i];
    for(let j=i+1;j<keys.length;j++){
      const weak=keys[j];
      const a=evidence[strong], b=evidence[weak];
      if(a.total<30 || b.total<30 || (a.rate-b.rate)<1.0) continue;
      raw[weak]=Math.min(raw[weak],Math.max(0.12,raw[strong]*0.92));
    }
  }
  if (state.masterAISettings?.adaptiveWeight === false) raw = {classic:25, aiL:aiFormula?30:0, independent:25, pair:20};
  const total = raw.classic + raw.aiL + raw.independent + raw.pair || 1;
  const result = {
    classic:Math.round(raw.classic/total*1000)/10,
    aiL:Math.round(raw.aiL/total*1000)/10,
    independent:Math.round(raw.independent/total*1000)/10,
    pair:Math.round(raw.pair/total*1000)/10,
    samples:draws.length,
    rates:{classic:metrics.classic.overall.rate,aiL:metrics.aiL.overall.rate,independent:metrics.independent.overall.rate,pair:metrics.pair.overall.rate},
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
  if (MASTER_AI_PAUSED) return {items:[],pending:true,dataCount:0,weights:null,paused:true};
  const cacheKey = performanceKey("masterAI", profileId, beforeDate, limit);
  if (PERF_CACHE.masterAI.has(cacheKey)) return PERF_CACHE.masterAI.get(cacheKey);
  const weights=masterAIWeights(profileId,beforeDate);
  if(state.masterAISettings?.learning===false) {
    const pending = {items:[],pending:true,dataCount:weights.samples,weights};
    PERF_CACHE.masterAI.set(cacheKey, pending);
    return pending;
  }
  const free=generateIndependentAI(profileId,beforeDate,10);
  const pair=generatePairAI(profileId,beforeDate,10);
  if(weights.samples<8||free.pending||pair.pending) {
    const pending = {items:[],pending:true,dataCount:weights.samples,weights};
    PERF_CACHE.masterAI.set(cacheKey, pending);
    return pending;
  }
  const classic=masterFormulaCandidates(profileId,getOriginalFormula(),beforeDate,10);
  const aiFormula=getMasterEligibleAIFormula(profileId);
  const aiL=aiFormula?masterFormulaCandidates(profileId,aiFormula,beforeDate,10):[];
  const map=new Map();
  const add=(list,key,weight,label)=>list.forEach((item,i)=>{const number=String(item.number),rank=Number(item.aiRank||item.rank||i+1),strength=Math.max(.1,(11-rank)/10);const row=map.get(number)||{number,masterScore:0,sources:[],sourceRanks:{}};row.masterScore+=weight*strength;if(!row.sources.includes(label))row.sources.push(label);row.sourceRanks[key]=rank;map.set(number,row);});
  add(classic,'classic',weights.classic,'Classic'); add(aiL,'aiL',weights.aiL,'AI L'); add(free.items,'independent',weights.independent,'AI อิสระ'); add(pair.items,'pair',weights.pair,'AI Pair');
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
  const draw = state.actualDraws.find(x => Number(x.profileId ?? 0) === Number(profileId) && x.date === date) || null;
  const universal = getUniversalPredictionSnapshot(profileId, date, draw);
  if (universal) {
    const items=(universal.masterItems || []).map((number,i)=>({number:String(number),aiRank:i+1}));
    return {status:snapshotItemsStatus(actual,items),prediction:{items,pending:false,snapshot:true,weights:universal.masterWeights||null}};
  }
  // Legacy V6.7.5 snapshots remain valid only if their timestamp proves they existed before the target result.
  const table = getPredictionTable(profileId, date, draw);
  const snap = table?.masterPredictionSnapshot;
  const resultSavedAt = Number(draw?.createdAt || draw?.updatedAt || 0);
  if (!isStrictPriorReferenceTable(table, date, profileId) || !snap || String(snap.targetDate || "") !== String(date || "") || !Number(snap.createdAt || 0) || !resultSavedAt || Number(snap.createdAt) >= resultSavedAt) {
    return {status:'pending',prediction:{items:[],pending:true,snapshotMissing:true}};
  }
  const items=(snap.items || []).map((number,i)=>({number:String(number),aiRank:i+1}));
  return {status:snapshotItemsStatus(actual,items),prediction:{items,pending:false,snapshot:true,weights:snap.weights||null}};
}

function masterSnapshotHistorySummary(draws, profileId) {
  let hit=0,total=0;
  (draws || []).forEach(draw=>{
    const r=masterSnapshotHistoryStatus(draw.number, profileId, draw.date);
    if(r.status==='pending') return;
    total++; if(r.status==='exact'||r.status==='reversed') hit++;
  });
  return {hit,total,rate:total?Math.round(hit*1000/total)/10:0};
}
function masterHistorySummary(draws, profileId, limit=10) {
  const cacheKey = performanceKey("masterSummary", profileId, null, limit, drawListPerformanceKey(draws));
  if (PERF_CACHE.masterSummary.has(cacheKey)) return PERF_CACHE.masterSummary.get(cacheKey);
  let hit=0,total=0; draws.forEach(draw=>{const r=masterHistoryStatus(draw.number,profileId,draw.date,limit);if(r.status==='pending')return;total++;if(r.status==='exact'||r.status==='reversed')hit++;});
  const summary = {hit,total,rate:total?Math.round(hit*1000/total)/10:0};
  PERF_CACHE.masterSummary.set(cacheKey, summary);
  return summary;
}
function formulaWinner5(originalStatus,aiStatus,independentStatus,pairStatus,masterStatus,hasAI=true){
  const c=[{label:'เดิม',status:originalStatus}];if(hasAI&&aiStatus!=='pending')c.push({label:'AI L',status:aiStatus});if(independentStatus!=='pending')c.push({label:'AI อิสระ',status:independentStatus});if(pairStatus!=='pending')c.push({label:'AI Pair',status:pairStatus});if(masterStatus!=='pending')c.push({label:'Master AI',status:masterStatus});
  const best=Math.max(...c.map(x=>formulaStatusScore(x.status)));
  // R20: Miss is always Miss. A round only has a winner/tie when at least one model actually Hits/Rev.
  if(best<=0) return '—';
  const w=c.filter(x=>formulaStatusScore(x.status)===best);
  return w.length===1?w[0].label:'เสมอ';
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
function adaptiveWindowSlice(samples, size) {
  if (!Array.isArray(samples)) return [];
  return size === Infinity ? samples : samples.slice(-Math.max(1, Number(size)||1));
}
function evaluateFormulaWeighted(formula, samples) {
  // V6.10.40-R2 — WF Fast Batch optimization (exact-result preserving).
  // Older code rebuilt the same 3x5 formula grid once for EACH memory window
  // (10/20/60/120/All) and then once more for the exact-hit bonus. During a
  // 15-day image import this is the hottest loop inside the 48x8 WF evolution.
  // Compute every sample status exactly once, then aggregate those immutable
  // statuses into the same windows. No population/generation/weight/methodology
  // setting is reduced, so WF Prior-only and the resulting score math stay the same.
  const safeSamples = Array.isArray(samples) ? samples : [];
  const statuses = new Array(safeSamples.length);
  let exactBonus = 0;
  for (let i = 0; i < safeSamples.length; i++) {
    const x = safeSamples[i];
    const status = formulaHistoryStatusFast(x?.actual, x?.inputs, formula);
    statuses[i] = status;
    if (status === "exact") exactBonus++;
  }
  const summarizeTail = size => {
    const total = size === Infinity ? statuses.length : Math.min(statuses.length, Math.max(1, Number(size) || 1));
    if (!total) return {hit:0,total:0,rate:0};
    const start = statuses.length - total;
    let hit = 0;
    for (let i = start; i < statuses.length; i++) {
      const status = statuses[i];
      if (status === "exact" || status === "reversed") hit++;
    }
    return {hit,total,rate:Math.round(hit*1000/total)/10};
  };
  const windows = {};
  let weightedRate = 0, totalWeight = 0;
  AI_HISTORY_WINDOWS.forEach(w => {
    const summary = summarizeTail(w.size);
    windows[w.label] = summary;
    if (summary.total) { weightedRate += summary.rate * w.weight; totalWeight += w.weight; }
  });
  const exactRate=safeSamples.length?exactBonus*100/safeSamples.length:0;
  const memoryScore=totalWeight?weightedRate/totalWeight:0;
  const score=(memoryScore*.92)+(exactRate*.08);
  const all=windows.All || summarizeTail(Infinity);
  return {
    score:Math.round(score*10)/10, all, exactRate:Math.round(exactRate*10)/10,
    recent10:windows["10"]||{hit:0,total:0,rate:0},
    recent20:windows["20"]||{hit:0,total:0,rate:0},
    recent60:windows["60"]||{hit:0,total:0,rate:0},
    recent120:windows["120"]||{hit:0,total:0,rate:0},
    windows, memoryScore:Math.round(memoryScore*10)/10
  };
}
function trustedFormulaSelector(profileId, maxRows=30) {
  // V7.08: AUTO consumes the same runtime-validated trusted gate as History/Analysis.
  // getHistoryComparisonStatuses() already enforces Verified Live first, otherwise strict WF,
  // including quarantine/fingerprint/date anti-leak checks. Legacy is therefore unreachable here.
  const id=Number(profileId);
  const rows=(state.actualDraws||[])
    .filter(d=>Number(d.profileId??0)===id)
    .sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")))
    .map(d=>{
      const c=getHistoryComparisonStatuses(d,id);
      if(!c?.trusted || c.classic==="pending" || c.aiL==="pending") return null;
      return {date:String(d.date||""),statuses:{classic:c.classic,aiL:c.aiL},verified:Boolean(c.verified),walkForward:Boolean(c.walkForward)};
    }).filter(Boolean).slice(-Math.max(1,Number(maxRows)||30));
  const rate=engine=>{
    const valid=rows.filter(r=>r.statuses?.[engine]!=="pending");
    const hit=valid.filter(r=>r.statuses[engine]==="exact"||r.statuses[engine]==="reversed").length;
    return valid.length?hit*100/valid.length:0;
  };
  const classicRate=rate("classic"), aiRate=rate("aiL"), margin=aiRate-classicRate;
  return {mode:rows.length>=14&&margin>=5?"ai":"original",reason:rows.length<14?"need-more-evidence":margin>=5?"ai-beats-classic-5pp":"classic-safety-fallback",samples:rows.length,classicRate:Math.round(classicRate*10)/10,aiRate:Math.round(aiRate*10)/10,margin:Math.round(margin*10)/10,trustedOnly:true};
}
function classicRelativeAIFitness(formula, train, test, original, trainFit=null, testFit=null, originalTrainFit=null, originalTestFit=null) {
  // V6.10.6: AI-L is a challenger to Classic. Classic baselines may be supplied by
  // callers so a population can compare hundreds of candidates without recalculating
  // the unchanged Classic formula for every candidate. This keeps the stronger
  // Classic-relative objective effectively free in the hot evolution loops.
  trainFit = trainFit || evaluateFormulaWeighted(formula, train);
  testFit = testFit || evaluateFormulaWeighted(formula, test);
  originalTrainFit = originalTrainFit || evaluateFormulaWeighted(original,train);
  originalTestFit = originalTestFit || evaluateFormulaWeighted(original,test);
  const testDelta=testFit.score-originalTestFit.score;
  const trainDelta=trainFit.score-originalTrainFit.score;
  const recent20Delta=(testFit.recent20?.rate||0)-(originalTestFit.recent20?.rate||0);
  const recent10Delta=(testFit.recent10?.rate||0)-(originalTestFit.recent10?.rate||0);
  const overfit=Math.max(0,trainFit.score-testFit.score);
  const losingPenalty=Math.max(0,-testDelta)*0.90 + Math.max(0,-recent20Delta)*0.35;
  const relativeBonus=(testDelta*0.72)+(trainDelta*0.12)+(recent20Delta*0.18)+(recent10Delta*0.08);
  const base=(testFit.score*.62)+(trainFit.score*.38)-(overfit*.22);
  return {
    fitness:Math.round((base+relativeBonus-losingPenalty)*10)/10,
    trainFit,testFit,originalTrainFit,originalTestFit,
    testDelta:Math.round(testDelta*10)/10,
    trainDelta:Math.round(trainDelta*10)/10,
    recent20Delta:Math.round(recent20Delta*10)/10,
    recent10Delta:Math.round(recent10Delta*10)/10
  };
}

function generateAIFormula(profileId, options = {}) {
  const samples=getFormulaSamples(profileId);
  if(samples.length<8) return {error:`ต้องมีข้อมูลที่เชื่อมกับตารางอย่างน้อย 8 งวด (ขณะนี้ ${samples.length} งวด)`};
  const split=Math.max(5,Math.floor(samples.length*.7));
  const train=samples.slice(0,split), test=samples.slice(split);
  const original=getOriginalFormula();
  // V6.10.6 performance: Classic is constant for this run, so score it once.
  const originalTrainWeighted=evaluateFormulaWeighted(original,train);
  const originalTestWeighted=evaluateFormulaWeighted(original,test);
  const seed=(profileId+1)*100003+samples.length*97+Number(samples.at(-1)?.date.replaceAll("-","")||1);
  const rand=seededRandom(seed);
  const previous=state.aiFormulaLab?.[profileId];
  // V6.9.4: Auto-save uses a compact refinement around the previous winner/top candidates.
  // It still scores candidates against ALL available History, but avoids a fresh 120x22
  // global search after every single new draw. Manual Generate AI keeps the full budget.
  const incremental = Boolean(options?.incremental && previous?.formula);
  const populationSize = incremental ? 42 : 120;
  const generations = incremental ? 7 : 22;
  const eliteSize = incremental ? 10 : 18;
  let population=[cloneFormula(original)];
  if(previous?.formula) population.push(cloneFormula(previous.formula));
  if(incremental && Array.isArray(previous?.topCandidates)) {
    previous.topCandidates.slice(0,8).forEach(x => { if (Array.isArray(x?.formula)) population.push(cloneFormula(x.formula)); });
    // Focus the search near proven formulas; deterministic mutations keep learning responsive
    // to the newly-added draw while remaining much cheaper on iPhone/PWA.
    const seeds=population.slice();
    while(population.length<Math.min(populationSize, 24)) {
      const base=seeds[Math.floor(rand()*seeds.length)] || original;
      population.push(mutateFormula(cloneFormula(base),rand,.10));
    }
  }
  while(population.length<populationSize) population.push(createCandidateFormula(rand));
  let trials=0, bestEver=null;
  for(let gen=0;gen<generations;gen++){
    const unique=new Map();
    population.forEach(f=>unique.set(formulaKey(f),f));
    const ranked=[...unique.values()].map(formula=>{
      trials++;
      const trainFit=evaluateFormulaWeighted(formula,train);
      const testFit=evaluateFormulaWeighted(formula,test);
      const rel=classicRelativeAIFitness(formula,train,test,original,trainFit,testFit,originalTrainWeighted,originalTestWeighted);
      return {formula,...rel};
    }).sort((a,b)=>b.fitness-a.fitness||b.testDelta-a.testDelta||b.testFit.score-a.testFit.score||b.trainFit.score-a.trainFit.score);
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
    const rel=classicRelativeAIFitness(formula,train,test,original,trainFit,testFit,originalTrainWeighted,originalTestWeighted);
    // Final round puts slightly more emphasis on held-out Classic advantage.
    const finalFitness=Math.round((rel.fitness + rel.testDelta*.22 + rel.recent20Delta*.10)*10)/10;
    return {formula,...rel,fitness:finalFitness};
  }).sort((a,b)=>b.fitness-a.fitness||b.testDelta-a.testDelta||b.testFit.score-a.testFit.score);
  const top10=finalists.slice(0,10);
  const winner=top10[0];
  const originalTrain=evaluateFormula(original,train), originalTest=evaluateFormula(original,test);
  const version=Number(previous?.version||0)+1;
  state.aiFormulaLab=state.aiFormulaLab||{};
  state.aiFormulaLab[profileId]={
    formula:winner.formula,createdAt:Date.now(),sampleCount:samples.length,
    train:evaluateFormula(winner.formula,train),test:evaluateFormula(winner.formula,test),
    originalTrain,originalTest,trials,version,engine:"Adaptive Memory Evolution",
    windows:{all:winner.testFit.all,recent10:winner.testFit.recent10,recent20:winner.testFit.recent20,recent60:winner.testFit.recent60,recent120:winner.testFit.recent120,exactRate:winner.testFit.exactRate,memoryScore:winner.testFit.memoryScore},
    memoryPolicy:{windows:AI_HISTORY_WINDOWS.map(w=>({size:w.size===Infinity?"All":w.size,weight:w.weight})),usesAllHistory:true},
    topCandidates:top10.map((x,i)=>({rank:i+1,formula:x.formula,fitness:x.fitness,train:x.trainFit.score,test:x.testFit.score,testDelta:x.testDelta,recent20Delta:x.recent20Delta})),
    classicRelative:{testDelta:winner.testDelta,trainDelta:winner.trainDelta,recent10Delta:winner.recent10Delta,recent20Delta:winner.recent20Delta,policy:"AI challenger must beat Classic"},
    autoLearnedAt:Date.now(),
    evolutionMode: incremental ? "incremental-save" : "full",
    evolutionBudget:{populationSize,generations}
  };
  const selector=trustedFormulaSelector(profileId,30);
  state.aiFormulaLab[profileId].selector=selector;
  if(selector.mode){
    // Keep the user's strategy (AUTO / manual Classic / manual AI) intact.
    // AUTO resolves dynamically through trustedFormulaSelector without rewriting state.
    state.aiFormulaLab[profileId].autoSelectedMode=selector.mode;
  }
  if (!options?.deferSave) saveState();
  return state.aiFormulaLab[profileId];
}

// V7.09.28 — AI GL (Generation L) is a constrained child of Classic L + AI L.
// Safety invariants:
// 1) the first cell of every row stays A/B/C, 2) column 5 is always Classic,
// 3) only columns 2–4 may inherit/mutate, 4) activation must beat BOTH parents.
function normalizeAIGLFormula(formula, classic=getOriginalFormula()) {
  const source=Array.isArray(formula)?formula:classic;
  return classic.map((row,r)=>row.map((classicCell,c)=>{
    if(c===0 || c===4) return {...classicCell};
    const cell=source?.[r]?.[c]||classicCell;
    return {s:Math.max(0,Math.min(4,Number(cell.s)||0)),o:Math.max(-2,Math.min(2,Number(cell.o)||0))};
  }));
}
function createAIGLCandidate(classic, aiFormula, rand) {
  const ai=Array.isArray(aiFormula)?aiFormula:classic;
  const candidate=classic.map((row,r)=>row.map((cell,c)=>{
    if(c===0 || c===4) return {...cell};
    const parent=rand()<.64?(ai?.[r]?.[c]||cell):cell;
    const out={...parent};
    if(rand()<.18) out.s=Math.floor(rand()*5);
    if(rand()<.28) out.o=Math.max(-2,Math.min(2,Number(out.o||0)+(rand()<.5?-1:1)));
    return out;
  }));
  return normalizeAIGLFormula(candidate,classic);
}
function mutateAIGLFormula(formula, classic, aiFormula, rand, strength=.12) {
  const out=normalizeAIGLFormula(formula,classic), ai=Array.isArray(aiFormula)?aiFormula:classic;
  for(let r=0;r<out.length;r++) for(let c=1;c<=3;c++){
    if(rand()<strength*.55) out[r][c]={...(rand()<.58?(ai?.[r]?.[c]||classic[r][c]):classic[r][c])};
    if(rand()<strength) out[r][c].s=Math.floor(rand()*5);
    if(rand()<strength*1.35) out[r][c].o=Math.max(-2,Math.min(2,Number(out[r][c].o||0)+(rand()<.5?-1:1)));
  }
  return normalizeAIGLFormula(out,classic);
}
function crossoverAIGLFormula(a,b,classic,rand) {
  return normalizeAIGLFormula(classic.map((row,r)=>row.map((cell,c)=>c===0||c===4?{...cell}:{...(rand()<.5?a[r][c]:b[r][c])})),classic);
}
function aiGLRelativeFitness(formula,train,test,classic,aiFormula,baseline={}) {
  const trainFit=evaluateFormulaWeighted(formula,train), testFit=evaluateFormulaWeighted(formula,test);
  const classicTrain=baseline.classicTrain||evaluateFormulaWeighted(classic,train);
  const classicTest=baseline.classicTest||evaluateFormulaWeighted(classic,test);
  const aiTrain=baseline.aiTrain||evaluateFormulaWeighted(aiFormula,train);
  const aiTest=baseline.aiTest||evaluateFormulaWeighted(aiFormula,test);
  const testDeltaClassic=testFit.score-classicTest.score, testDeltaAI=testFit.score-aiTest.score;
  const trainDeltaClassic=trainFit.score-classicTrain.score, trainDeltaAI=trainFit.score-aiTrain.score;
  const minTestDelta=Math.min(testDeltaClassic,testDeltaAI);
  const recentDeltaClassic=(testFit.recent20?.rate||0)-(classicTest.recent20?.rate||0);
  const recentDeltaAI=(testFit.recent20?.rate||0)-(aiTest.recent20?.rate||0);
  const losingPenalty=Math.max(0,-testDeltaClassic)*1.05+Math.max(0,-testDeltaAI)*1.18+
    Math.max(0,-recentDeltaClassic)*.24+Math.max(0,-recentDeltaAI)*.30;
  const overfit=Math.max(0,trainFit.score-testFit.score)*.20;
  const relative=(testDeltaClassic*.46)+(testDeltaAI*.62)+(Math.min(trainDeltaClassic,trainDeltaAI)*.12)+
    (Math.min(recentDeltaClassic,recentDeltaAI)*.12)+(minTestDelta*.34);
  const base=testFit.score*.66+trainFit.score*.34;
  return {formula,fitness:Math.round((base+relative-losingPenalty-overfit)*10)/10,trainFit,testFit,
    classicTrain,classicTest,aiTrain,aiTest,
    testDeltaClassic:Math.round(testDeltaClassic*10)/10,testDeltaAI:Math.round(testDeltaAI*10)/10,
    trainDeltaClassic:Math.round(trainDeltaClassic*10)/10,trainDeltaAI:Math.round(trainDeltaAI*10)/10,
    minTestDelta:Math.round(minTestDelta*10)/10};
}
function runAIGLEvolution(profileId,samples,aiFormula,previousFormula,targetDate,{incremental=false}={}) {
  if(!Array.isArray(samples)||samples.length<8||!Array.isArray(aiFormula)) return null;
  const split=Math.max(5,Math.floor(samples.length*.7)), train=samples.slice(0,split), test=samples.slice(split);
  const classic=getOriginalFormula();
  const baseline={classicTrain:evaluateFormulaWeighted(classic,train),classicTest:evaluateFormulaWeighted(classic,test),aiTrain:evaluateFormulaWeighted(aiFormula,train),aiTest:evaluateFormulaWeighted(aiFormula,test)};
  const seed=(Number(profileId)+1)*700001+samples.length*131+Number(String(targetDate||samples.at(-1)?.date||"1").replaceAll("-","")||1);
  const rand=seededRandom(seed), populationSize=incremental?34:72, generations=incremental?6:14, eliteSize=incremental?8:12;
  let population=[normalizeAIGLFormula(classic,classic),normalizeAIGLFormula(aiFormula,classic)];
  if(previousFormula) population.push(normalizeAIGLFormula(previousFormula,classic));
  while(population.length<populationSize) population.push(createAIGLCandidate(classic,aiFormula,rand));
  let best=null,trials=0;
  for(let gen=0;gen<generations;gen++){
    const unique=new Map(); population.forEach(f=>unique.set(formulaKey(f),f));
    const ranked=[...unique.values()].map(f=>{trials++;return aiGLRelativeFitness(f,train,test,classic,aiFormula,baseline);})
      .sort((a,b)=>b.fitness-a.fitness||b.minTestDelta-a.minTestDelta||b.testDeltaAI-a.testDeltaAI||b.testFit.score-a.testFit.score);
    if(!best||ranked[0].fitness>best.fitness) best=ranked[0];
    const elite=ranked.slice(0,eliteSize); population=elite.map(x=>cloneFormula(x.formula));
    while(population.length<populationSize){
      const a=elite[Math.floor(rand()*elite.length)].formula,b=elite[Math.floor(rand()*elite.length)].formula;
      population.push(mutateAIGLFormula(crossoverAIGLFormula(a,b,classic,rand),classic,aiFormula,rand,.12+(gen<4?.05:0)));
    }
  }
  const finalists=[best?.formula,classic,aiFormula,previousFormula,...population.slice(0,30)].filter(Array.isArray);
  const unique=new Map(); finalists.forEach(f=>unique.set(formulaKey(normalizeAIGLFormula(f,classic)),normalizeAIGLFormula(f,classic)));
  const ranked=[...unique.values()].map(f=>{trials++;return aiGLRelativeFitness(f,train,test,classic,aiFormula,baseline);})
    .sort((a,b)=>b.minTestDelta-a.minTestDelta||b.fitness-a.fitness||b.testDeltaAI-a.testDeltaAI||b.testFit.score-a.testFit.score);
  return {winner:ranked[0],top:ranked.slice(0,10),train,test,trials,populationSize,generations};
}
function glFormulaEligibility(saved, profileId = state.activeProfile) {
  if(!saved?.formula) return {allowed:false,reason:"ยังไม่มีสูตร AI GL"};

  // V7.09.50 — AI GL deployment uses the same Trusted / prior-only evidence shown
  // on the AI page. The old hidden +5% Classic test gate could leave AI GL as
  // CANDIDATE even while its visible Trusted rate was already >= AI L. READY now
  // means: enough comparable Trusted rows, no untrusted rows in the comparison,
  // and AI GL is at least tied with AI L. Classic / Independent / Pair are NOT
  // deployment gates for GL; they remain separate engines for AUTO comparison.
  const id=Number(profileId);
  const draws=(state.actualDraws||[]).filter(d=>Number(d.profileId??0)===id);
  const ai=trustedHistorySummary(draws,id,"aiL");
  const gl=trustedHistorySummary(draws,id,"gl");
  const comparable=Math.min(Number(ai.total||0),Number(gl.total||0));
  const deltaAI=Math.round((Number(gl.rate||0)-Number(ai.rate||0))*10)/10;
  const minTrusted=8;

  if(comparable<minTrusted){
    return {allowed:false,deltaAI,total:comparable,minTrusted,reason:`AI GL รอ Trusted ${comparable}/${minTrusted} งวด`};
  }
  if(deltaAI<0){
    return {allowed:false,deltaAI,total:comparable,minTrusted,reason:`AI GL ยังตาม AI L ${Math.abs(deltaAI).toFixed(1)} จุดเปอร์เซ็นต์`};
  }
  return {allowed:true,deltaAI,total:comparable,minTrusted,reason:deltaAI>0?`Trusted ${gl.rate}% • นำ AI L +${deltaAI.toFixed(1)} จุดเปอร์เซ็นต์ • READY`:`Trusted ${gl.rate}% • เสมอ AI L • READY`};
}
function generateAIGLFormula(profileId,options={}) {
  const id=Number(profileId),samples=getFormulaSamples(id),aiSaved=state.aiFormulaLab?.[id];
  if(samples.length<8) return {error:`ต้องมีข้อมูลที่เชื่อมกับตารางอย่างน้อย 8 งวด (ขณะนี้ ${samples.length} งวด)`};
  if(!aiSaved?.formula) return {error:"ต้องสร้าง AI L ก่อน เพื่อใช้เป็น Learning Parent ของ AI GL"};
  const previous=state.aiGLFormulaLab?.[id]||null;
  const evolved=runAIGLEvolution(id,samples,aiSaved.formula,previous?.formula,samples.at(-1)?.date,{incremental:Boolean(options.incremental)});
  if(!evolved?.winner) return {error:"AI GL ยังสร้างสูตรไม่ได้"};
  const w=evolved.winner,version=Number(previous?.version||0)+1;
  state.aiGLFormulaLab=state.aiGLFormulaLab||{};
  state.aiGLFormulaLab[id]={formula:normalizeAIGLFormula(w.formula),createdAt:Date.now(),sampleCount:samples.length,
    train:evaluateFormula(w.formula,evolved.train),test:evaluateFormula(w.formula,evolved.test),
    classicTrain:evaluateFormula(getOriginalFormula(),evolved.train),classicTest:evaluateFormula(getOriginalFormula(),evolved.test),
    aiLTrain:evaluateFormula(aiSaved.formula,evolved.train),aiLTest:evaluateFormula(aiSaved.formula,evolved.test),
    parentAIFormula:cloneFormula(aiSaved.formula),parentAIVersion:Number(aiSaved.version||0),parentAISignature:compactFormulaSignature(aiSaved.formula),
    trials:evolved.trials,version,engine:"Classic + AI L Hybrid Refiner",autoLearnedAt:Date.now(),
    evolutionMode:options.incremental?"incremental-save":"full",evolutionBudget:{populationSize:evolved.populationSize,generations:evolved.generations},
    constraintPolicy:{anchorsLocked:true,column5Classic:true,mutableColumns:[2,3,4],parents:["Classic L","AI L"]},
    topCandidates:evolved.top.map((x,i)=>({rank:i+1,formula:x.formula,fitness:x.fitness,test:x.testFit.score,deltaClassic:x.testDeltaClassic,deltaAI:x.testDeltaAI}))};
  state.aiGLFormulaLab[id].deploymentStatus=glFormulaEligibility(state.aiGLFormulaLab[id], id).allowed?"approved":"candidate";
  if(!options.deferSave) saveState();
  return state.aiGLFormulaLab[id];
}
function evolveWalkForwardAIGLFormula(profileId,samples,aiFormula,previousFormula,targetDate) {
  const working=samples.length>180?[...samples.slice(0,-120).filter((_,i,a)=>i%Math.max(1,Math.floor(a.length/60))===0).slice(-60),...samples.slice(-120)]:samples;
  const result=runAIGLEvolution(Number(profileId),working,aiFormula,previousFormula,targetDate,{incremental:true});
  return result?.winner?.formula?normalizeAIGLFormula(result.winner.formula):null;
}
function buildStrictPriorAIGLFormula(profileId,targetDate,strictPriorAIFormula=null) {
  const date=String(targetDate||""); if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const samples=walkForwardFormulaSamples(profileId,date); if(samples.length<8) return null;
  const aiFormula=strictPriorAIFormula||buildStrictPriorAIFormula(profileId,date);
  return aiFormula?evolveWalkForwardAIGLFormula(Number(profileId),samples,aiFormula,null,date):null;
}


// V6.7.8 — Historical Walk-Forward Backtest (WF)
// Reconstructs each target draw in chronological order. Every prediction may use only
// draws with date < targetDate. WF is fair historical evidence, but is kept separate
// from Verified Live snapshots because it was reconstructed after the fact.
function getWalkForwardBucket(profileId) {
  return state.walkForwardBacktests?.[Number(profileId)] || null;
}
function invalidateWalkForwardBacktest(profileId) {
  const id=Number(profileId);
  if(state.walkForwardBacktests && Object.prototype.hasOwnProperty.call(state.walkForwardBacktests,id)) delete state.walkForwardBacktests[id];
}
function walkForwardAffectedStartDate(profileId, changedDate) {
  const id=Number(profileId), date=String(changedDate||"");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const bucket=getWalkForwardBucket(id);
  return bucket && Array.isArray(bucket.records) && bucket.records.length ? date : "";
}
function walkForwardBucketCoversCurrentHistory(profileId, bucket=getWalkForwardBucket(profileId)) {
  const id=Number(profileId), draws=walkForwardProfileDraws(id);
  const records=Array.isArray(bucket?.records)?bucket.records:[];
  if(!bucket || Number(bucket.version||0)<4 || String(bucket.engineVersion||"")!==WF_ENGINE_VERSION) return false;
  if(String(bucket.methodology||"")!=="walk-forward-adaptive-memory-prior-only") return false;
  if(records.length!==draws.length) return false;
  if(!draws.length) return true;
  const firstDraw=draws[0], lastDraw=draws[draws.length-1], firstRow=records[0], lastRow=records[records.length-1];
  return Boolean(firstRow && lastRow
    && Number(firstRow.profileId)===id && Number(lastRow.profileId)===id
    && String(firstRow.actualDrawId||"")===String(firstDraw.id||"")
    && String(lastRow.actualDrawId||"")===String(lastDraw.id||"")
    && String(firstRow.date||"")===String(firstDraw.date||"")
    && String(lastRow.date||"")===String(lastDraw.date||""));
}
function scheduleMissingWalkForwardBootstrap(profileId, delay=350) {
  const id=Number(profileId);
  if(!Number.isInteger(id) || id<0 || id>=state.profiles.length) return false;
  const currentBucket=getWalkForwardBucket(id);
  // V6.9.6: a completed cache is authoritative for normal app startup/save.
  // Do not start a full bootstrap again merely because an old job/checkpoint exists.
  if(walkForwardBucketCoversCurrentHistory(id,currentBucket)) return false;
  if(currentBucket) return false;
  const historyCount=walkForwardProfileDraws(id).length;
  if(historyCount<8 || WF_BOOTSTRAP_IN_FLIGHT.has(id)) return false;
  WF_BOOTSTRAP_IN_FLIGHT.add(id);
  const run=async()=>{
    try {
      // Never compete with the restore worker. If it is actively rebuilding, retry shortly.
      if(backgroundWfWorkerRunning){ setTimeout(run,800); return; }
      if(getWalkForwardBucket(id)) return;
      await rebuildWalkForwardBacktest(id);
      clearPerformanceCaches(); activeRenderPerfSignature=""; invalidateViewCache(); saveState();
      if(document.visibilityState!=="hidden") setTimeout(()=>render(),80);
      console.info(`WF bootstrap complete: ${state.profiles[id]||`Profile ${id+1}`} (${historyCount} History)`);
    } catch(error) {
      console.error("Background first-WF bootstrap failed", state.profiles[id]||id, error);
    } finally {
      // Keep the guard while a retry is queued because the restore worker is active.
      if(!backgroundWfWorkerRunning || getWalkForwardBucket(id)) WF_BOOTSTRAP_IN_FLIGHT.delete(id);
    }
  };
  setTimeout(run,Math.max(0,Number(delay)||0));
  return true;
}
// V6.10.40-R3 History-safe WF recovery hotfix.
// An invalid cache is quarantined from trusted scoring while its replacement is built,
// but the already-saved prior-only rows may remain visible in History as DISPLAY-ONLY.
// This avoids the temporary AI "—" flash without allowing stale/fingerprint-failed data
// into Champion / Analysis / AI learning.
function walkForwardRecoveryQuarantined(profileId) {
  const job = state.walkForwardRebuildJob;
  if (!job || job.status === "done") return false;
  return (job.invalidProfileIds || []).map(Number).includes(Number(profileId));
}
function getWalkForwardRecordFromBucket(bucket, profileId, draw) {
  if (!bucket || !draw) return null;
  // Runtime anti-leak gate: even DISPLAY-ONLY recovery rows must prove strict prior-only dates.
  if (Number(bucket.version || 0) < 4) return null;
  if (String(bucket.engineVersion || "") !== WF_ENGINE_VERSION) return null;
  if (String(bucket.methodology || "") !== "walk-forward-adaptive-memory-prior-only") return null;
  const row = (bucket.records || []).find(r => r.actualDrawId === draw.id || (r.date === draw.date && Number(r.profileId) === Number(profileId))) || null;
  if (!row) return null;
  const hasScoredOutput = Object.values(row.statuses || {}).some(v => v && v !== "pending");
  if (!hasScoredOutput) return row;
  const targetDate = String(row.date || draw.date || "").slice(0,10);
  const sourceDate = String(row.sourceTableDate || "").slice(0,10);
  const trainedThrough = String(row.trainedThrough || sourceDate || "").slice(0,10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sourceDate) || sourceDate >= targetDate) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trainedThrough) || trainedThrough >= targetDate) return null;
  if (String(row.methodology || "") !== "walk-forward-adaptive-memory-prior-only") return null;
  return row;
}
function walkForwardRuntimeTrust(profileId) {
  const id=Number(profileId), bucket=getWalkForwardBucket(id);
  if(!bucket) return {valid:false,reason:"missing-cache"};
  // Re-run the full fingerprint + row-integrity proof after any persisted state mutation.
  // During ordinary renders the result is cached, so History does not repeatedly rescan WF.
  const key=[id,Number(bucket.generatedAt||0),String(bucket.cacheFingerprint?.hash||""),Number(state._persistenceUpdatedAt||0)].join(":");
  const cached=PERF_CACHE.wfVerify.get(key);
  if(cached) return cached;
  const check=verifyWalkForwardCache(id,bucket);
  PERF_CACHE.wfVerify.clear();
  PERF_CACHE.wfVerify.set(key,check);
  return check;
}
function getWalkForwardRecord(profileId, draw) {
  // Fingerprint-failed/recovery cache is never trusted while a rebuild is pending.
  if (walkForwardRecoveryQuarantined(profileId)) return null;
  // V7.09.18: a bucket cannot become trusted merely because no rebuild job is active.
  // It must pass the current History/table fingerprint AND every strict prior-only row invariant.
  if (!walkForwardRuntimeTrust(profileId).valid) return null;
  return getWalkForwardRecordFromBucket(getWalkForwardBucket(profileId), profileId, draw);
}
function getWalkForwardRecoveryDisplayRecord(profileId, draw) {
  if (!walkForwardRecoveryQuarantined(profileId)) return null;
  return getWalkForwardRecordFromBucket(getWalkForwardBucket(profileId), profileId, draw);
}
// V6.8.6 — A restored WF bucket may be reused only when it proves that it was built
// from exactly the same History + reference-table inputs + WF engine/settings.
// Old backups without this fingerprint are intentionally rebuilt once, then future V6.8.6
// backups can restore almost instantly without sacrificing prior-only correctness.
function hashWalkForwardText(text) {
  const value=String(text||"");
  let h1=0x811c9dc5>>>0, h2=0x9e3779b9>>>0;
  for(let i=0;i<value.length;i++){
    const c=value.charCodeAt(i);
    h1=Math.imul((h1^c)>>>0,16777619)>>>0;
    h2=Math.imul((h2^c)>>>0,2246822519)>>>0;
    h2=(h2^(h2>>>13))>>>0;
  }
  return `${h1.toString(16).padStart(8,"0")}${h2.toString(16).padStart(8,"0")}`;
}
function walkForwardProfileDraws(profileId) {
  const id=Number(profileId);
  return (state.actualDraws||[])
    .filter(d=>Number(d.profileId??0)===id && /^\d{3}$/.test(String(d.number||"")) && /^\d{4}-\d{2}-\d{2}$/.test(String(d.date||"")))
    .slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))||Number(a.createdAt||0)-Number(b.createdAt||0));
}
function buildWalkForwardCacheFingerprint(profileId) {
  const id=Number(profileId), draws=walkForwardProfileDraws(id);
  let resolvedTables=0;
  const rows=draws.map(draw=>{
    const table=getPredictionTable(id,draw.date,draw);
    const inputs=Array.isArray(table?.inputDigits)?table.inputDigits.map(String):[];
    if(table && inputs.length===5) resolvedTables++;
    return [
      String(draw.id||""),String(draw.date||""),String(draw.number||""),String(draw.twoDigit||""),String(draw.referenceTableId||""),
      String(table?.id||""),String(table?.date||""),inputs.join("")
    ].join("|");
  });
  const adaptive=state.masterAISettings?.adaptiveWeight===false?"fixed":"adaptive";
  const formulaSig=compactFormulaSignature(getOriginalFormula());
  const hash=hashWalkForwardText([WF_CACHE_SCHEMA,WF_ENGINE_VERSION,id,adaptive,formulaSig,...rows].join("§"));
  return {
    schema:WF_CACHE_SCHEMA,engineVersion:WF_ENGINE_VERSION,profileId:id,hash,
    drawCount:draws.length,resolvedTableCount:resolvedTables,
    firstDate:draws[0]?.date||"",lastDate:draws.at(-1)?.date||"",adaptiveWeight:adaptive
  };
}
function walkForwardFingerprintMatches(saved,current) {
  if(!saved||!current) return false;
  return Number(saved.schema)===Number(current.schema)
    && String(saved.engineVersion||"")===String(current.engineVersion||"")
    && Number(saved.profileId)===Number(current.profileId)
    && String(saved.hash||"")===String(current.hash||"")
    && Number(saved.drawCount)===Number(current.drawCount)
    && Number(saved.resolvedTableCount)===Number(current.resolvedTableCount)
    && String(saved.firstDate||"")===String(current.firstDate||"")
    && String(saved.lastDate||"")===String(current.lastDate||"");
}
function verifyWalkForwardCache(profileId, bucket=getWalkForwardBucket(profileId)) {
  const id=Number(profileId), draws=walkForwardProfileDraws(id);
  if(!bucket || Number(bucket.version||0)<4) return {valid:false,reason:"legacy-or-missing-cache",profileId:id};
  if(String(bucket.engineVersion||"")!==WF_ENGINE_VERSION) return {valid:false,reason:"engine-version",profileId:id};
  if(String(bucket.methodology||"")!=="walk-forward-adaptive-memory-prior-only") return {valid:false,reason:"methodology",profileId:id};
  const current=buildWalkForwardCacheFingerprint(id);
  if(!walkForwardFingerprintMatches(bucket.cacheFingerprint,current)) return {valid:false,reason:"history-table-fingerprint",profileId:id,current};
  const records=Array.isArray(bucket.records)?bucket.records:[];
  if(records.length!==draws.length) return {valid:false,reason:"record-count",profileId:id,current};
  for(let i=0;i<draws.length;i++){
    const draw=draws[i], row=records[i];
    if(!row || Number(row.profileId)!==id || String(row.actualDrawId||"")!==String(draw.id||"") || String(row.date||"")!==String(draw.date||""))
      return {valid:false,reason:`row-identity-${i}`,profileId:id,current};
    const table=getPredictionTable(id,draw.date,draw);
    if(String(row.sourceTableId||"")!==String(table?.id||"") || String(row.sourceTableDate||"")!==String(table?.date||""))
      return {valid:false,reason:`table-link-${i}`,profileId:id,current};
    if (row.sourceTableDate && String(row.sourceTableDate) >= String(draw.date))
      return {valid:false,reason:`source-table-not-prior-${i}`,profileId:id,current};
    const hasScoredOutput=Object.values(row.statuses||{}).some(v=>v && v!=="pending");
    if(hasScoredOutput){
      const targetDate=String(draw.date||"").slice(0,10);
      const sourceDate=String(row.sourceTableDate||"").slice(0,10);
      const trainedThrough=String(row.trainedThrough||"").slice(0,10);
      if(String(row.methodology||"")!=="walk-forward-adaptive-memory-prior-only")
        return {valid:false,reason:`row-methodology-${i}`,profileId:id,current};
      if(!/^\d{4}-\d{2}-\d{2}$/.test(sourceDate) || sourceDate>=targetDate)
        return {valid:false,reason:`source-date-${i}`,profileId:id,current};
      if(!/^\d{4}-\d{2}-\d{2}$/.test(trainedThrough) || trainedThrough>=targetDate)
        return {valid:false,reason:`trained-through-${i}`,profileId:id,current};
    }
    const engines=["classic","aiL","gl","independent","pair","master","masterBasic"];
    for(const engine of engines){
      const items=Array.isArray(row.items?.[engine])?row.items[engine]:[];
      const savedStatus=String(row.statuses?.[engine]||"pending");
      const recomputed=items.length?snapshotItemsStatus(draw.number,items):"pending";
      if(savedStatus!==recomputed) return {valid:false,reason:`status-${engine}-${i}`,profileId:id,current};
    }
    if(row.statuses?.masterBasic && row.statuses.masterBasic!=="pending"){
      const selected=String(row.masterBasicSelected||"classic");
      if(!ML_SELECT_ENGINES.includes(selected) || row.statuses.masterBasic!==row.statuses?.[selected])
        return {valid:false,reason:`basic-mirror-${i}`,profileId:id,current};
    }
  }
  return {valid:true,reason:"verified",profileId:id,current,reusedRecords:records.length};
}
function walkForwardFormulaSamples(profileId, beforeDate) {
  return (state.actualDraws || [])
    .filter(d => Number(d.profileId ?? 0) === Number(profileId) && /^\d{3}$/.test(String(d.number || "")) && String(d.date || "") < String(beforeDate || ""))
    .map(draw => {
      const table = getPredictionTable(profileId, draw.date, draw);
      return table && Array.isArray(table.inputDigits) && table.inputDigits.length === 5
        ? {date:draw.date, actual:String(draw.number), inputs:table.inputDigits.map(String)} : null;
    }).filter(Boolean).sort((a,b)=>a.date.localeCompare(b.date));
}
function evolveWalkForwardAIFormula(profileId, samples, previousFormula, targetDate) {
  // V6.10.6 — WF uses the same Classic-relative challenger objective as Live AI-L.
  // The evolution budget is intentionally unchanged (48 x 8) and Classic baselines
  // are precomputed once, so this improves methodology without making WF slower.
  if (!Array.isArray(samples) || samples.length < 8) return null;
  // Keep all recent evidence plus an evenly spaced long-memory sample. No future row
  // can enter working because callers pass only samples strictly before targetDate.
  const maxWorking=180;
  let working=samples;
  if(samples.length>maxWorking){
    const recent=samples.slice(-120), older=samples.slice(0,-120), keep=Math.max(1,maxWorking-recent.length), stride=Math.max(1,Math.floor(older.length/keep));
    const longMemory=[]; for(let i=0;i<older.length && longMemory.length<keep;i+=stride) longMemory.push(older[i]);
    working=[...longMemory,...recent].sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  }
  const split = Math.max(5, Math.floor(working.length * .7));
  const train = working.slice(0, split), test = working.slice(split);
  const original = getOriginalFormula();
  // Critical performance guard: these values never change within this target draw.
  const originalTrainWeighted=evaluateFormulaWeighted(original,train);
  const originalTestWeighted=evaluateFormulaWeighted(original,test);
  const seed = (Number(profileId)+1)*100003 + working.length*97 + Number(String(targetDate||"1").replaceAll("-","")||1);
  const rand = seededRandom(seed);
  const populationSize = 48, generations = 8, eliteSize = 10;
  // R3: elites survive across generations, so the same immutable formula can otherwise
  // be rescored 2-8 times against identical train/test samples. Memoize by formulaKey
  // for this target draw only. Search budget and deterministic ranking are unchanged.
  const fitnessCache = new Map();
  const scoreCandidate = formula => {
    const key=formulaKey(formula);
    const cached=fitnessCache.get(key);
    if (cached) return cached;
    const trainFit=evaluateFormulaWeighted(formula,train), testFit=evaluateFormulaWeighted(formula,test);
    const rel=classicRelativeAIFitness(formula,train,test,original,trainFit,testFit,originalTrainWeighted,originalTestWeighted);
    const scored={formula,...rel};
    fitnessCache.set(key,scored);
    return scored;
  };
  let population=[cloneFormula(original)];
  if (previousFormula) population.push(cloneFormula(previousFormula));
  while (population.length < populationSize) population.push(createCandidateFormula(rand));
  let best = null;
  for (let gen=0; gen<generations; gen++) {
    const unique = new Map(); population.forEach(f=>unique.set(formulaKey(f),f));
    const ranked=[...unique.values()].map(scoreCandidate)
      .sort((a,b)=>b.fitness-a.fitness||b.testDelta-a.testDelta||b.testFit.score-a.testFit.score||b.trainFit.score-a.trainFit.score);
    if (!best || ranked[0].fitness > best.fitness) best=ranked[0];
    const elite=ranked.slice(0,eliteSize);
    population=elite.map(x=>cloneFormula(x.formula));
    while(population.length<populationSize){
      const pa=elite[Math.floor(rand()*elite.length)].formula, pb=elite[Math.floor(rand()*elite.length)].formula;
      population.push(mutateFormula(crossoverFormula(pa,pb,rand),rand,.14));
    }
  }
  return best ? cloneFormula(best.formula) : cloneFormula(previousFormula || original);
}
function buildStrictPriorAIFormula(profileId, targetDate) {
  const date = String(targetDate || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const samples = walkForwardFormulaSamples(profileId, date);
  if (samples.length < 8) return null;
  // Never seed from state.aiFormulaLab here: that formula may have been trained after targetDate.
  return evolveWalkForwardAIFormula(Number(profileId), samples, null, date);
}
function buildStrictPriorMasterPrediction(profileId, targetDate, inputs, aiFormula, limit = 10) {
  if (MASTER_AI_PAUSED) return {items:[],pending:true,dataCount:0,weights:null,paused:true};
  const date = String(targetDate || "");
  const classicItems = findLResults(formulaGrid(inputs, getOriginalFormula()) || []).map(x => String(x.number));
  const aiLItems = aiFormula ? findLResults(formulaGrid(inputs, aiFormula) || []).map(x => String(x.number)) : [];
  const independent = generateIndependentAI(profileId, date, 10);
  const pair = generatePairAI(profileId, date, 10);
  if (independent.pending || pair.pending) return {items:[],pending:true,weights:null};
  const priorRecords = (getWalkForwardBucket(profileId)?.records || []).filter(r => String(r?.date || "") < date);
  let weights = walkForwardMasterWeights(priorRecords, date, Boolean(aiFormula));
  // If a verified WF cache has not been built yet, fall back to deterministic fixed weights
  // using only the count of strictly-prior samples; never borrow current/future performance.
  if ((weights.samples || 0) < 8) {
    const priorCount = walkForwardFormulaSamples(profileId, date).length;
    const raw = aiFormula ? {classic:25, aiL:30, independent:25, pair:20} : {classic:35, aiL:0, independent:35, pair:30};
    weights = {...raw, samples:priorCount, targetDate:date, strictFallback:true};
  }
  const independentItems = (independent.items || []).slice(0,10).map(x=>String(x.number));
  const pairItems = (pair.items || []).slice(0,10).map(x=>String(x.number));
  const items = (weights.samples >= 8) ? buildWalkForwardMasterItems(classicItems, aiLItems, independentItems, pairItems, weights, limit) : [];
  return {items,pending:!items.length,weights};
}

function walkForwardEngineRate(records, engine, sample) {
  const rows=(sample||records||[]).filter(r => r?.statuses && r.statuses[engine] && r.statuses[engine] !== "pending");
  if (!rows.length) return {hit:0,total:0,rate:0};
  const hit=rows.filter(r => r.statuses[engine] === "exact" || r.statuses[engine] === "reversed").length;
  return {hit,total:rows.length,rate:Math.round(hit*1000/rows.length)/10};
}

// R45 — Master Basic V1 Walk-Forward TEST.
// Basic rule only: before each target draw, look at strictly-prior WF results and select
// the engine with the highest historical Top10 hit rate. No weights, windows, guards,
// blending, safety envelopes, weekday modifiers, or future data. If evidence is not ready,
// or the selected engine has no candidates for the target draw, fall back to Classic.
function masterBasicEvidenceFromPriorRecords(priorRecords, targetDate) {
  const rows=(priorRecords||[]).filter(r=>String(r?.date||"")<String(targetDate||""));
  const engines=["classic","aiL","independent","pair"], stats={};
  engines.forEach(key=>stats[key]=walkForwardEngineRate(rows,key,rows));
  const eligible=engines.filter(key=>stats[key].total>=MASTER_BASIC_MIN_PRIOR);
  let selected="classic";
  if(eligible.length){
    selected=eligible.slice().sort((a,b)=>{
      const rateDiff=stats[b].rate-stats[a].rate;
      if(Math.abs(rateDiff)>1e-9) return rateDiff;
      const totalDiff=stats[b].total-stats[a].total;
      if(totalDiff) return totalDiff;
      return engines.indexOf(a)-engines.indexOf(b); // ties prefer Classic, then AI L, Independent, Pair
    })[0];
  }
  return {targetDate,priorCount:rows.length,stats,eligible,selected,ready:stats[selected]?.total>=MASTER_BASIC_MIN_PRIOR};
}
function buildStrictPriorMasterBasicPrediction(priorRecords,targetDate,classicItems,aiLItems,independentItems,pairItems,limit=10){
  const evidence=masterBasicEvidenceFromPriorRecords(priorRecords,targetDate);
  const lists={classic:classicItems||[],aiL:aiLItems||[],independent:independentItems||[],pair:pairItems||[]};
  let selected=evidence.selected;
  let source=(lists[selected]||[]).slice(0,limit).map(x=>String(typeof x==="string"?x:x?.number||"")).filter(x=>/^\d{3}$/.test(x));
  let fallback=false;
  if(!evidence.ready || !source.length){
    selected="classic"; fallback=true;
    source=(lists.classic||[]).slice(0,limit).map(x=>String(typeof x==="string"?x:x?.number||"")).filter(x=>/^\d{3}$/.test(x));
  }
  const labels={classic:"Classic",aiL:"AI L",independent:"AI อิสระ",pair:"AI Pair"};
  const items=source.map((number,i)=>({number,rank:i+1,sources:[labels[selected]],selectedEngine:selected}));
  return {pending:!items.length,items,evidence,selectedEngine:selected,fallback};
}
function masterBasicWalkForwardSummary(profileId){
  const bucket=getWalkForwardBucket(profileId);
  if(!bucket || String(bucket.engineVersion||"")!==WF_ENGINE_VERSION || String(bucket.methodology||"")!=="walk-forward-adaptive-memory-prior-only") return {ready:false,hit:0,total:0,rate:0};
  const rows=(bucket.records||[]).filter(r=>r?.statuses?.masterBasic && r.statuses.masterBasic!=="pending");
  const hit=rows.filter(r=>r.statuses.masterBasic==="exact"||r.statuses.masterBasic==="reversed").length;
  return {ready:true,hit,total:rows.length,rate:rows.length?Math.round(hit*1000/rows.length)/10:0};
}
function masterBasicWalkForwardCompare(profileId){
  const bucket=getWalkForwardBucket(profileId);
  if(!bucket || String(bucket.engineVersion||"")!==WF_ENGINE_VERSION || String(bucket.methodology||"")!=="walk-forward-adaptive-memory-prior-only") return {ready:false,windows:[]};
  const engines=["masterBasic","classic","aiL","independent","pair"];
  const rows=(bucket.records||[]).filter(r=>r?.statuses?.masterBasic && r.statuses.masterBasic!=="pending");
  const stat=(sample,key)=>{
    const valid=sample.filter(r=>r?.statuses?.[key] && r.statuses[key]!=="pending");
    const hit=valid.filter(r=>r.statuses[key]==="exact"||r.statuses[key]==="reversed").length;
    return {hit,total:valid.length,rate:valid.length?Math.round(hit*1000/valid.length)/10:0};
  };
  const defs=[["7",7],["30",30],["60",60],["All",null]];
  return {ready:true,total:rows.length,windows:defs.map(([label,size])=>{
    const sample=size?rows.slice(-size):rows, stats={}; engines.forEach(k=>stats[k]=stat(sample,k));
    return {label,total:sample.length,stats};
  })};
}
function renderMasterBasicWalkForwardCompare(profileId){
  const c=masterBasicWalkForwardCompare(profileId);
  if(!c.ready) return `<p class="score-explainer"><b>WF Compare:</b> กำลังสร้างข้อมูล Basic Prior-only ใหม่</p>`;
  const label={masterBasic:"BASIC",classic:"CLS",aiL:"AIL",independent:"IND",pair:"PAIR"};
  return `<div class="score-explainer"><b>WF Compare • ชุดงวดเดียวกัน</b>
    ${c.windows.map(w=>`<div style="margin-top:6px"><b>${w.label}${w.total?` (${w.total})`:""}</b> • ${Object.keys(label).map(k=>`${label[k]} ${w.stats[k].total?w.stats[k].rate+"%":"—"}`).join(" • ")}</div>`).join("")}
  </div>`;
}

// R48 — Basic V1.2 Exact Mirror diagnostic helpers. BASIC mirrors the selected engine 1:1;
// the audit remains as an invariant check and must report Error 0 after a fresh WF rebuild.
function masterBasicAudit(profileId){
  const bucket=getWalkForwardBucket(Number(profileId));
  if(!bucket || String(bucket.engineVersion||"")!==WF_ENGINE_VERSION || !Array.isArray(bucket.records)) return {ready:false,total:0,ok:0,errors:0};
  const rows=bucket.records.filter(r=>r?.statuses?.masterBasic && r.statuses.masterBasic!=="pending");
  let ok=0,errors=0;
  rows.forEach(r=>{
    const selected=String(r.masterBasicSelected||"classic");
    const expected=r?.statuses?.[selected]||"pending";
    const matched=r.statuses.masterBasic===expected;
    if(matched) ok++; else errors++;
  });
  return {ready:true,total:rows.length,ok,errors};
}
function getMasterBasicWalkForwardRecord(profileId,date){
  const bucket=getWalkForwardBucket(Number(profileId));
  if(!bucket || String(bucket.engineVersion||"")!==WF_ENGINE_VERSION || !Array.isArray(bucket.records)) return null;
  return bucket.records.find(r=>String(r?.date||"")===String(date||""))||null;
}
function masterBasicHistoryCell(profileId,date){
  const rec=getMasterBasicWalkForwardRecord(profileId,date);
  if(!rec || !rec?.statuses?.masterBasic || rec.statuses.masterBasic==="pending") return {status:"pending",selected:"—",count:0,audit:true,title:"Basic: รอข้อมูล"};
  const selected=String(rec.masterBasicSelected||"classic");
  const labels={classic:"CLS",aiL:"AIL",independent:"IND",pair:"PAIR"};
  const count=Array.isArray(rec?.items?.masterBasic)?rec.items.masterBasic.length:0;
  const expected=rec?.statuses?.[selected]||"pending";
  const audit=rec.statuses.masterBasic===expected;
  return {status:audit?rec.statuses.masterBasic:"pending",selected:labels[selected]||selected,count,audit,title:audit?`Basic: ${labels[selected]||selected} • ${count} candidates`:`IMPLEMENTATION ERROR • Basic ${rec.statuses.masterBasic} ≠ ${labels[selected]||selected} ${expected}`};
}


// V7.04 — Master AI V1 ACTIVE 100% (12/12 strict prior-only implementation).
// This engine is intentionally derived from the already verified per-engine Walk-Forward rows.
// It does NOT change Calculate/AUTO, does NOT overwrite History snapshots, and does NOT change
// WF_ENGINE_VERSION. Therefore the existing WF cache remains reusable while Master can still be
// evaluated strictly draw-by-draw using only rows dated before each target draw.
function masterV1NormalizeItems(items, limit=10){
  const seen=new Set(), out=[];
  for(const item of (items||[])){
    const number=String(typeof item==="string"?item:item?.number||"");
    if(!/^\d{3}$/.test(number)||seen.has(number)) continue;
    seen.add(number); out.push(number); if(out.length>=limit) break;
  }
  return out;
}
function masterV1CandidateLists(raw={}){
  return {
    classic:masterV1NormalizeItems(raw.classic,10),
    aiL:masterV1NormalizeItems(raw.aiL,10),
    independent:masterV1NormalizeItems(raw.independent,10),
    pair:masterV1NormalizeItems(raw.pair,10)
  };
}
function masterV1EngineMetric(priorRecords,engine,targetDate){
  const prior=(priorRecords||[]).filter(r=>String(r?.date||"")<String(targetDate||""));
  let weighted=0,totalWeight=0; const windows=[];
  MASTER_AI_V1_WINDOWS.forEach(w=>{
    const sample=w.size===Infinity?prior:prior.slice(-w.size), stat=walkForwardEngineRate(prior,engine,sample);
    windows.push({label:w.label,size:w.size,weight:w.weight,...stat});
    if(stat.total){weighted+=stat.rate*w.weight;totalWeight+=w.weight;}
  });
  const recent=totalWeight?weighted/totalWeight:0;
  const overall=walkForwardEngineRate(prior,engine,prior);
  const targetDay=new Date(`${targetDate}T12:00:00`).getDay();
  const weekdayRows=prior.filter(r=>new Date(`${r.date}T12:00:00`).getDay()===targetDay).slice(-20);
  const weekday=walkForwardEngineRate(prior,engine,weekdayRows);
  const weekdayTrust=Math.min(1,weekday.total/8);
  const weekdayAdjusted=weekday.total?weekday.rate*weekdayTrust+recent*(1-weekdayTrust):recent;
  const posterior=(overall.hit+1)/(overall.total+2)*100; // small-sample shrinkage
  const evidenceTrust=Math.min(1,overall.total/30);
  const dynamic=recent*.50+weekdayAdjusted*.25+posterior*.25;
  const score=posterior*(1-evidenceTrust)+dynamic*evidenceTrust;
  const validRates=windows.filter(x=>x.total>=Math.min(7,MASTER_AI_V1_MIN_PRIOR)).map(x=>x.rate);
  const mean=validRates.length?validRates.reduce((a,b)=>a+b,0)/validRates.length:0;
  const variance=validRates.length?validRates.reduce((a,b)=>a+Math.pow(b-mean,2),0)/validRates.length:0;
  const stability=Math.max(0,Math.min(100,100-Math.sqrt(variance)*3));
  return {engine,score:Math.round(score*10)/10,recent:Math.round(recent*10)/10,overall,weekday:{...weekday,adjusted:Math.round(weekdayAdjusted*10)/10},windows,stability:Math.round(stability),targetDay};
}
function masterV1NormalizeWeights(raw, keys){
  if(!keys.length) return {};
  if(keys.length===1) return {[keys[0]]:100};
  const baseTotal=keys.reduce((a,k)=>a+Math.max(.01,Number(raw[k]||0)),0)||1;
  let w={}; keys.forEach(k=>w[k]=Math.max(.01,Number(raw[k]||0))/baseTotal*100);
  // V7.02: allow the proven WF champion to dominate. Do not force weak models to keep an 8% vote.
  // This fixes the V7.01 dilution problem where a weak engine could displace a valid Champion Top10 item.
  for(let pass=0;pass<2;pass++){
    keys.forEach(k=>w[k]=Math.max(2,Math.min(82,w[k])));
    const sum=keys.reduce((a,k)=>a+w[k],0)||1; keys.forEach(k=>w[k]=w[k]/sum*100);
  }
  const rounded={}; keys.forEach(k=>rounded[k]=Math.round(w[k]*10)/10);
  const diff=Math.round((100-keys.reduce((a,k)=>a+rounded[k],0))*10)/10;
  rounded[keys[0]]=Math.round((rounded[keys[0]]+diff)*10)/10;
  return rounded;
}
function masterV1Weights(priorRecords,targetDate,candidates){
  const lists=masterV1CandidateLists(candidates), metrics={};
  const engines=["classic","aiL","independent","pair"];
  engines.forEach(k=>metrics[k]=masterV1EngineMetric(priorRecords,k,targetDate));
  let eligible=engines.filter(k=>lists[k].length&&metrics[k].overall.total>=MASTER_AI_V1_MIN_PRIOR);
  if(!eligible.length&&lists.classic.length) eligible=["classic"];
  const basicEvidence=masterBasicEvidenceFromPriorRecords(priorRecords,targetDate);
  let champion=eligible.includes(basicEvidence.selected)?basicEvidence.selected:(eligible.includes("classic")?"classic":eligible[0]);
  const raw={}; eligible.forEach(k=>{
    const m=metrics[k], overall=Number(m.overall?.rate||0), recent=Number(m.recent||0), stable=Math.max(.35,Number(m.stability||0)/100);
    // WF is the primary signal. Weekday can tilt only a little and stability damps short noisy streaks.
    raw[k]=Math.max(.01,(overall*.62+recent*.28+Number(m.weekday?.adjusted||0)*.10)*stable);
  });
  // Champion prior: preserve the Basic winner unless a challenger has materially stronger prior-only proof.
  if(champion&&raw[champion]!=null) raw[champion]*=1.35;
  const c=metrics[champion]||{};
  const challengers=eligible.filter(k=>k!==champion).filter(k=>{
    const m=metrics[k]||{};
    const enough=Number(m.overall?.total||0)>=30 && Number(c.overall?.total||0)>=30;
    const allEdge=Number(m.overall?.rate||0)-Number(c.overall?.rate||0);
    const recentEdge=Number(m.recent||0)-Number(c.recent||0);
    return enough && allEdge>=3 && recentEdge>=4 && Number(m.stability||0)>=55;
  });
  // V7.03 Safe Blend Gate: a challenger being individually strong is NOT enough to blend.
  // Until the blended selector itself has strictly-prior proof of non-inferiority versus BASIC,
  // Champion Guard remains an exact BASIC mirror. This establishes a safe baseline first.
  // Future blend experiments can set blendProof.proven=true only from prior derived rows; never from the target draw.
  const blendProof={proven:false,samples:0,edge:0,reason:"รอหลักฐาน Prior-only ของ Blend เทียบ BASIC"};
  const blendAllowed=Boolean(challengers.length && blendProof.proven);
  return {weights:masterV1NormalizeWeights(raw,eligible),metrics,eligible,lists,samples:(priorRecords||[]).filter(r=>String(r?.date||"")<String(targetDate||"")).length,champion,blendAllowed,challengers,basicEvidence,blendProof};
}
function masterV1QualityAgreement(row,pack){
  const keys=Object.keys(row.sourceRanks||{}), champion=pack.champion;
  if(keys.length<2) return 1;
  const championRate=Number(pack.metrics?.[champion]?.overall?.rate||0);
  let quality=0;
  keys.forEach(k=>{
    const m=pack.metrics?.[k]||{}, rate=Number(m.overall?.rate||0), trust=Math.min(1,Number(m.overall?.total||0)/30);
    const relative=championRate?Math.max(.25,Math.min(1.15,rate/championRate)):1;
    quality += (Number(pack.weights?.[k]||0)/100)*trust*relative;
  });
  // Max +20%; agreement from weak/low-evidence engines cannot create a large bonus.
  return 1+Math.min(.20,quality*.20);
}
function buildMasterV1Prediction(priorRecords,targetDate,rawCandidates,limit=10){
  const date=String(targetDate||""), prior=(priorRecords||[]).filter(r=>String(r?.date||"")<date);
  const pack=masterV1Weights(prior,date,rawCandidates), {weights,metrics,eligible,lists,champion}=pack;
  if(!eligible.length) return {pending:true,items:[],final3:[],confidence:"LOW",confidenceScore:0,weights,metrics,eligible,priorCount:pack.samples,maxEvidenceDate:prior.at(-1)?.date||"",reason:"ยังไม่มี candidate สำหรับ BASIC mirror",guardMode:true,champion};
  // V7.03: Guard mode is valid from the first draw. BASIC itself falls back to Classic before
  // minimum evidence is ready, so MASTER must mirror that same behavior instead of becoming pending.
  const map=new Map(), labels={classic:"Classic",aiL:"AI L",independent:"AI อิสระ",pair:"AI Pair"};
  eligible.forEach(key=>lists[key].forEach((number,i)=>{
    const strength=Math.max(.10,(10-i)/10), row=map.get(number)||{number,baseScore:0,sources:[],sourceRanks:{}};
    row.baseScore+=Number(weights[key]||0)*strength;
    row.sources.push(labels[key]); row.sourceRanks[key]=i+1; map.set(number,row);
  }));
  let blended=[...map.values()].map(row=>{
    const qualityBonus=masterV1QualityAgreement(row,pack);
    return {...row,masterScore:row.baseScore*qualityBonus,agreement:row.sources.length};
  }).sort((a,b)=>b.masterScore-a.masterScore||b.agreement-a.agreement||a.number.localeCompare(b.number));

  let ranked, guardMode=!pack.blendAllowed;
  if(guardMode){
    // Champion Guard: exact Top10 mirror of the strictly-prior Basic champion. This guarantees the
    // Master test cannot be made worse merely by dilution from weaker engines while evidence is weak.
    ranked=(lists[champion]||[]).slice(0,Math.max(3,limit)).map((number,i)=>{
      const blendRow=blended.find(x=>x.number===number);
      return {number,rank:i+1,masterScore:Math.round(Number(weights[champion]||100)*(10-i)/10*10)/10,sources:blendRow?.sources||[labels[champion]],sourceRanks:blendRow?.sourceRanks||{[champion]:i+1},agreement:blendRow?.agreement||1,guarded:true};
    });
  }else{
    ranked=blended.slice(0,Math.max(3,limit)).map((x,i)=>({...x,rank:i+1,masterScore:Math.round(x.masterScore*10)/10,guarded:false}));
  }
  const top=ranked[0], second=ranked[1];
  const topPicks=eligible.map(k=>lists[k][0]).filter(Boolean), distinctTop=new Set(topPicks).size;
  const conflict=eligible.length>=3&&distinctTop===eligible.length;
  const agreementFactor=top?Math.max(0,(top.agreement-1)/Math.max(1,eligible.length-1)):0;
  const championMetric=metrics[champion]||{};
  const evidenceFactor=Math.min(1,Number(championMetric.overall?.total||0)/60);
  const stabilityFactor=Math.max(0,Math.min(1,Number(championMetric.stability||0)/100));
  const marginFactor=top&&second?Math.min(1,Math.max(0,(top.masterScore-second.masterScore)/Math.max(1,top.masterScore))*3):.5;
  const qualityAgreement=Math.min(1,(top?.sources||[]).reduce((sum,label)=>{
    const key=Object.keys(labels).find(k=>labels[k]===label); if(!key) return sum;
    const m=metrics[key]||{}, rel=Number(championMetric.overall?.rate||0)?Number(m.overall?.rate||0)/Number(championMetric.overall.rate):1;
    return sum+Math.min(1,Math.max(0,rel))*Math.min(1,Number(m.overall?.total||0)/30);
  },0)/Math.max(1,top?.sources?.length||1));
  let confidenceScore=18+evidenceFactor*22+stabilityFactor*18+qualityAgreement*18+marginFactor*12+agreementFactor*12-(conflict?10:0);
  // A guarded/mirrored prediction is deliberately capped at MEDIUM until the Master proves an edge.
  if(guardMode) confidenceScore=Math.min(confidenceScore,64);
  confidenceScore=Math.round(Math.max(0,Math.min(100,confidenceScore)));
  const confidence=confidenceScore>=70?"HIGH":confidenceScore>=50?"MEDIUM":"LOW";
  const leader=eligible.slice().sort((a,b)=>Number(weights[b]||0)-Number(weights[a]||0))[0]||champion||"classic";
  const reasons=[];
  if(guardMode) reasons.push(`Champion Guard: Mirror ${labels[champion]} จนกว่าการ Blend จะมี Prior-only edge ชัดเจน`);
  else if(top?.agreement>=2) reasons.push(`${top.agreement} AI เห็นเลข #1 ตรงกันแบบถ่วงคุณภาพ`);
  reasons.push(`${labels[leader]} น้ำหนักสูงสุด ${Number(weights[leader]||0).toFixed(1)}%`);
  if(metrics[leader]?.weekday?.total) reasons.push(`${DAYS_SHORT[metrics[leader].targetDay]} evidence ${metrics[leader].weekday.adjusted}%`);
  if(conflict) reasons.push("Top pick ขัดกันหลายโมเดล จึงลด Confidence");
  return {pending:!ranked.length,items:ranked.slice(0,limit),final3:ranked.slice(0,3),confidence,confidenceScore,weights,metrics,eligible,priorCount:pack.samples,maxEvidenceDate:prior.at(-1)?.date||"",conflict,reason:reasons.join(" • "),guardMode,champion,blendAllowed:pack.blendAllowed,challengers:pack.challengers};
}
function masterV1DerivedWalkForward(profileId){
  const id=Number(profileId), bucket=getWalkForwardBucket(id);
  if(!bucket||String(bucket.engineVersion||"")!==WF_ENGINE_VERSION||String(bucket.methodology||"")!=="walk-forward-adaptive-memory-prior-only"||!Array.isArray(bucket.records)) return {ready:false,rows:[],audit:{errors:0,leakErrors:0,weightErrors:0,shapeErrors:0}};
  const base=bucket.records.slice().sort((a,b)=>String(a?.date||"").localeCompare(String(b?.date||"")));
  const drawsById=new Map((state.actualDraws||[]).filter(d=>Number(d.profileId??0)===id).map(d=>[String(d.id||""),d]));
  const drawsByDate=new Map((state.actualDraws||[]).filter(d=>Number(d.profileId??0)===id).map(d=>[String(d.date||""),d]));
  const rows=[]; let leakErrors=0,weightErrors=0,shapeErrors=0,mirrorErrors=0;
  for(let i=0;i<base.length;i++){
    const r=base[i], date=String(r?.date||""), prior=base.slice(0,i).filter(x=>String(x?.date||"")<date);
    const candidates=masterV1CandidateLists(r?.items||{}), prediction=buildMasterV1Prediction(prior,date,candidates,10);
    const draw=drawsById.get(String(r?.actualDrawId||""))||drawsByDate.get(date)||null;
    const basicStatus=String(r?.statuses?.masterBasic||"pending");
    // V7.03 invariant: Guard means exact BASIC behavior 1:1. BASIC's stored status is the source
    // of truth because its selected engine may contain more candidates than the UI Top10 display.
    // This is not future leakage: basicStatus was produced by the same strictly-prior WF row.
    const status=prediction.pending?"pending":(prediction.guardMode?basicStatus:snapshotItemsStatus(draw?.number,prediction.items));
    const weightSum=Object.values(prediction.weights||{}).reduce((a,b)=>a+Number(b||0),0);
    if(prediction.maxEvidenceDate&&prediction.maxEvidenceDate>=date) leakErrors++;
    if(!prediction.pending&&Math.abs(weightSum-100)>.2) weightErrors++;
    if(!prediction.pending&&(!prediction.final3.length||prediction.final3.some(x=>!/^\d{3}$/.test(String(x.number||""))))) shapeErrors++;
    if(!prediction.pending&&prediction.guardMode&&status!==basicStatus) mirrorErrors++;
    rows.push({date,status,prediction,basicStatus,base:r});
  }
  return {ready:true,rows,audit:{errors:leakErrors+weightErrors+shapeErrors+mirrorErrors,leakErrors,weightErrors,shapeErrors,mirrorErrors}};
}
function masterV1WindowStat(rows,key){
  const valid=(rows||[]).filter(r=>String(r?.[key]||"pending")!=="pending"), hit=valid.filter(r=>["exact","reversed"].includes(String(r?.[key]))).length;
  return {hit,total:valid.length,rate:valid.length?Math.round(hit*1000/valid.length)/10:0};
}
function masterV1ProofsFromReport(report){
  // V7.08: Safety Proof and Pick Proof are independent gates.
  // Safety proves strict prior-only integrity + non-inferiority. Pick proves the Master's own
  // non-guard choices have enough prior-only evidence and a durable edge over BASIC.
  const pending={state:"PENDING",pass:false};
  if(!report?.ready) return {safety:{...pending,reason:"wf-not-ready"},pick:{...pending,reason:"wf-not-ready"},autoEligible:false};
  const auditErrors=Number(report?.audit?.errors||0), aligned=Number(report?.aligned||0);
  let safety;
  if(auditErrors>0) safety={state:"FAIL",pass:false,reason:"audit"};
  else if(aligned<30) safety={...pending,reason:"evidence"};
  else if(!report.performancePass) safety={state:"FAIL",pass:false,reason:"non-inferiority"};
  else safety={state:"PASS",pass:true,reason:"strict-prior-safe"};

  let pick;
  if(safety.state==="FAIL") pick={state:"FAIL",pass:false,reason:"safety"};
  else if(!safety.pass) pick={...pending,reason:"safety-pending"};
  else {
    const pickRows=(report.rows||[]).filter(r=>r?.status!=="pending"&&r?.basicStatus!=="pending"&&!r?.prediction?.guardMode);
    const allMaster=masterV1WindowStat(pickRows,"status"), allBasic=masterV1WindowStat(pickRows,"basicStatus");
    const recent=pickRows.slice(-30), recentMaster=masterV1WindowStat(recent,"status"), recentBasic=masterV1WindowStat(recent,"basicStatus");
    const enough=allMaster.total>=30&&allBasic.total>=30;
    const edge=allMaster.rate-allBasic.rate;
    const recentSafe=!recentMaster.total||recentMaster.rate>=recentBasic.rate;
    if(!enough) pick={...pending,reason:"pick-evidence",samples:allMaster.total,edge:Math.round(edge*10)/10};
    else if(edge>=2&&recentSafe) pick={state:"PASS",pass:true,reason:"prior-only-edge",samples:allMaster.total,edge:Math.round(edge*10)/10};
    else pick={state:"FAIL",pass:false,reason:"pick-edge",samples:allMaster.total,edge:Math.round(edge*10)/10};
  }
  return {safety,pick,autoEligible:Boolean(safety.pass&&pick.pass)};
}

function masterV1WalkForwardReport(profileId){
  const d=masterV1DerivedWalkForward(profileId); if(!d.ready) return {ready:false,windows:[],audit:d.audit,implementation:12};
  const aligned=d.rows.filter(r=>r.status!=="pending"&&r.basicStatus!=="pending"), defs=[["7",7],["30",30],["60",60],["All",null]];
  const windows=defs.map(([label,size])=>{
    const sample=size?aligned.slice(-size):aligned;
    return {label,total:sample.length,master:masterV1WindowStat(sample,"status"),basic:masterV1WindowStat(sample,"basicStatus")};
  });
  const all=windows.find(x=>x.label==="All")||{master:{rate:0,total:0},basic:{rate:0,total:0}};
  const w30=windows.find(x=>x.label==="30"), w60=windows.find(x=>x.label==="60"), w7=windows.find(x=>x.label==="7");
  // V7.03 Acceptance: first prove non-inferiority safely. A +2pp edge is tracked as PASS+, but is not
  // required to leave TEST once Master is demonstrably no worse than Basic on All/30/60.
  const nonInferiorAll=all.master.total>=30&&all.master.rate>=all.basic.rate;
  const recentPass=(!w30?.master.total||w30.master.rate>=w30.basic.rate)&&(!w60?.master.total||w60.master.rate>=w60.basic.rate);
  const shortSafety=!w7?.master.total||w7.master.rate+5>=w7.basic.rate;
  const performancePass=nonInferiorAll&&recentPass&&shortSafety;
  const superior=all.master.total>=30&&all.master.rate>=all.basic.rate+2;
  const stabilityPass=recentPass&&shortSafety;
  const base={ready:true,rows:d.rows,aligned:aligned.length,windows,audit:d.audit,implementation:12,performancePass,stabilityPass,superior};
  const proofs=masterV1ProofsFromReport(base);
  return {...base,proofs,safetyProof:proofs.safety,pickProof:proofs.pick,autoEligible:proofs.autoEligible,promote:proofs.autoEligible};
}
function masterV1LivePrediction(profileId){
  const id=Number(profileId), targetDate=liveMasterTargetDate(), input=Array.isArray(state.lastInput)?state.lastInput.map(String):[];
  if(input.length!==5||input.some(x=>!/^\d$/.test(x))) return {pending:true,items:[],final3:[],confidence:"LOW",confidenceScore:0,reason:"กรอก/โหลดเลขตั้งต้น 5 หลักก่อน"};
  const saved=state.aiFormulaLab?.[id]||null, aiFormula=(saved?.formula&&formulaEligibility(saved).allowed)?saved.formula:null;
  const classic=findLResults(formulaGrid(input,getOriginalFormula())||[]).map(x=>String(x.number));
  const aiL=aiFormula?findLResults(formulaGrid(input,aiFormula)||[]).map(x=>String(x.number)):[];
  const independent=generateIndependentAI(id,targetDate,10), pair=generatePairAI(id,targetDate,10);
  const bucket=getWalkForwardBucket(id), prior=(bucket&&String(bucket.engineVersion||"")===WF_ENGINE_VERSION&&Array.isArray(bucket.records))?bucket.records.filter(r=>String(r?.date||"")<targetDate):[];
  return buildMasterV1Prediction(prior,targetDate,{classic,aiL,independent:independent.items||[],pair:pair.items||[]},10);
}
function renderMasterV1WalkForward(profileId){
  const report=masterV1WalkForwardReport(profileId);
  if(!report.ready) return `<p class="score-explainer"><b>Master WF:</b> รอ Walk-Forward cache เดิมให้พร้อม</p>`;
  return `<div class="score-explainer"><b>Master vs Basic • Strict Prior-only</b>${report.windows.map(w=>`<div style="margin-top:6px"><b>${w.label}${w.total?` (${w.total})`:""}</b> • MASTER ${w.master.total?w.master.rate+"%":"—"} • BASIC ${w.basic.total?w.basic.rate+"%":"—"}</div>`).join("")}<div style="margin-top:7px"><b>Audit:</b> Error ${report.audit.errors} • Leakage ${report.audit.leakErrors} • Weight ${report.audit.weightErrors} • Shape ${report.audit.shapeErrors} • Mirror ${report.audit.mirrorErrors||0}</div><div style="margin-top:4px"><b>12/12 Implementation:</b> 100% • Promotion: ${report.promote?(report.superior?"MASTER 100% • PASS+":"MASTER 100% • PASS SAFE"):"LOCKED • ยังไม่ผ่าน"}</div></div>`;
}
function renderMasterV1TestCard(profileId){
  if(!MASTER_AI_V1_ACTIVE) return "";
  const id=Number(profileId), p=masterV1LivePrediction(id), report=masterV1WalkForwardReport(id), labels={classic:"CLS",aiL:"AIL",independent:"IND",pair:"PAIR"};
  const weights=p.weights||{};
  const promote=report.ready&&report.promote;
  const allPerf=report?.windows?.find?.(x=>x.label==="All");
  let shownScore=Number(p.confidenceScore||0), shownConfidence=String(p.confidence||"LOW");
  if(allPerf?.master?.total>=30 && allPerf.master.rate<allPerf.basic.rate){ shownScore=Math.min(shownScore,49); shownConfidence="LOW"; }
  else if(p.guardMode){ shownScore=Math.min(shownScore,64); shownConfidence=shownScore>=50?"MEDIUM":"LOW"; }
  return `<div class="today-recommend-card ${p.pending?'pending':''}">
    <div class="ux-card-head"><div><h3>Master AI</h3><p>${escapeHtml(state.profiles[id]||`Profile ${id+1}`)} • Confidence ${escapeHtml(shownConfidence)} ${Number.isFinite(shownScore)?`(${Number(shownScore)}%)`:""}</p></div></div>
    ${p.final3?.length?`<div class="today-top3">${p.final3.map((x,i)=>`<div class="today-number ${i===0?'winner':''}"><span>#${i+1}</span><b>${escapeHtml(x.number)}</b><small>${escapeHtml((x.sources||[]).join(' + ')||'Master')}</small></div>`).join('')}</div>`:`<div class="today-empty">${escapeHtml(p.reason||'ยังไม่มี candidate สำหรับงวดนี้')}</div>`}
    <div class="master-weight-compact">${["classic","aiL","independent","pair"].map(k=>`<span>${labels[k]} <b>${weights[k]!==undefined?Number(weights[k]).toFixed(1)+'%':'—'}</b></span>`).join('')}</div>
  </div>`;
}

function walkForwardMasterWeights(priorRecords, targetDate, hasAI) {
  const targetDay = new Date(`${targetDate}T12:00:00`).getDay();
  const build = engine => {
    let weighted=0,totalWeight=0;
    AI_HISTORY_WINDOWS.forEach(w=>{
      const summary=walkForwardEngineRate(priorRecords,engine,priorRecords.slice(-w.size));
      if(summary.total){weighted += summary.rate*w.weight; totalWeight += w.weight;}
    });
    const recent=totalWeight?weighted/totalWeight:0;
    const weekdayRows=priorRecords.filter(r=>new Date(`${r.date}T12:00:00`).getDay()===targetDay).slice(-20);
    const weekday=walkForwardEngineRate(priorRecords,engine,weekdayRows);
    const weekdayTrust=Math.min(1,weekday.total/10);
    const weekdayAdjusted=weekday.total ? weekday.rate*weekdayTrust + recent*(1-weekdayTrust) : recent;
    const overall=walkForwardEngineRate(priorRecords,engine,priorRecords.slice(-60));
    return weekdayAdjusted*.40 + recent*.40 + overall.rate*.20;
  };
  // R35 mirror of the live Evidence-Rank Guard. Uses priorRecords already in memory;
  // no extra persistence/network/background work and keeps strict prior-only behavior.
  const allEvidence = engine => walkForwardEngineRate(priorRecords,engine,priorRecords);
  const evidenceScore = engine => {
    const dynamic=build(engine), all=allEvidence(engine);
    const total=Number(all.total||0), hit=Number(all.hit||0), rate=Number(all.rate||0);
    if(!total) return {score:0.12,rate:0,total:0,hit:0};
    const confidence=Math.min(1,total/60);
    const adaptive=0.55-(confidence*0.35);
    const delta=Math.max(-8,Math.min(8,dynamic-rate));
    let score=rate + delta*adaptive;
    const floor=Math.max(0.12,Math.min(1.20,rate*0.18));
    score=Math.max(floor,score);
    if(total>=8 && hit===0) score=Math.min(score,engine==="pair"?0.25:0.40);
    return {score:Math.max(0.12,score),rate,total,hit};
  };
  const ev={classic:evidenceScore("classic"),aiL:hasAI?evidenceScore("aiL"):{score:0,rate:0,total:0,hit:0},independent:evidenceScore("independent"),pair:evidenceScore("pair")};
  const raw={classic:ev.classic.score,aiL:ev.aiL.score,independent:ev.independent.score,pair:ev.pair.score};
  const keys=["classic","aiL","independent","pair"].filter(k=>raw[k]>0).sort((a,b)=>ev[b].rate-ev[a].rate||ev[b].total-ev[a].total);
  for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++){
    const strong=keys[i],weak=keys[j],a=ev[strong],b=ev[weak];
    if(a.total>=30&&b.total>=30&&(a.rate-b.rate)>=1.0) raw[weak]=Math.min(raw[weak],Math.max(0.12,raw[strong]*0.92));
  }
  if(state.masterAISettings?.adaptiveWeight===false) Object.assign(raw,{classic:25,aiL:hasAI?30:0,independent:25,pair:20});
  const total=raw.classic+raw.aiL+raw.independent+raw.pair||1;
  return {classic:Math.round(raw.classic/total*1000)/10,aiL:Math.round(raw.aiL/total*1000)/10,independent:Math.round(raw.independent/total*1000)/10,pair:Math.round(raw.pair/total*1000)/10,samples:priorRecords.length};
}
function buildWalkForwardMasterItems(classicItems, aiLItems, independentItems, pairItems, weights, limit=10) {
  if (MASTER_AI_PAUSED) return [];
  const map=new Map();
  const add=(items,key,weight)=> (items||[]).slice(0,10).forEach((item,i)=>{
    const number=String(typeof item === "string" ? item : item?.number || ""); if(!/^\d{3}$/.test(number)) return;
    const strength=Math.max(.1,(11-(i+1))/10), row=map.get(number)||{number,score:0,sources:0};
    row.score += Number(weight||0)*strength; row.sources++; map.set(number,row);
  });
  add(classicItems,"classic",weights.classic); add(aiLItems,"aiL",weights.aiL); add(independentItems,"independent",weights.independent); add(pairItems,"pair",weights.pair);
  return [...map.values()].sort((a,b)=>b.score-a.score||b.sources-a.sources||a.number.localeCompare(b.number)).slice(0,limit).map(x=>x.number);
}
async function rebuildWalkForwardBacktest(profileId, progressCallback = null, options = {}) {
  const id=Number(profileId), draws=(state.actualDraws||[])
    .filter(d=>Number(d.profileId??0)===id && /^\d{3}$/.test(String(d.number||"")) && /^\d{4}-\d{2}-\d{2}$/.test(String(d.date||"")))
    .sort((a,b)=>String(a.date).localeCompare(String(b.date))||Number(a.createdAt||0)-Number(b.createdAt||0));

  // V6.9.7 keeps the exact V6.9.6 prediction/evolution path. The only change is
  // durable checkpoint/resume for a Full WF rebuild so completed work is not repeated.
  const requestedStartDate=/^\d{4}-\d{2}-\d{2}$/.test(String(options?.startDate||"")) ? String(options.startDate) : "";
  const oldBucket=getWalkForwardBucket(id);
  let startIndex=0, records=[], previousFormula=null, previousGLFormula=null, formulaSamples=[];
  let pendingSampleDate="", pendingSameDateSamples=[], resumedFromCheckpoint=false;
  const fingerprint=buildWalkForwardCacheFingerprint(id);
  const progressKey=wfProgressKey(id);

  if(requestedStartDate && oldBucket && Array.isArray(oldBucket.records) && oldBucket.records.length){
    const requestedIndex=draws.findIndex(d=>String(d.date)>=requestedStartDate);
    startIndex=requestedIndex<0?draws.length:requestedIndex;
    const oldById=new Map((oldBucket.records||[]).filter(Boolean).map(r=>[String(r.actualDrawId||""),r]));
    const oldByDate=new Map((oldBucket.records||[]).filter(Boolean).map(r=>[String(r.date||""),r]));
    const prefix=[];
    for(let i=0;i<startIndex;i++){
      const draw=draws[i];
      const cached=oldById.get(String(draw.id||"")) || oldByDate.get(String(draw.date||""));
      if(!cached || Number(cached.profileId)!==id || String(cached.date)!==String(draw.date)){
        startIndex=i; break;
      }
      prefix.push(cached);
    }
    records=prefix.slice(0,startIndex);
  }

  // Full rebuild only: resume a prior partial checkpoint if and only if the complete
  // History/table fingerprint and engine methodology are unchanged.
  if(!requestedStartDate && startIndex===0){
    const checkpoint=await readIndexedValue(progressKey);
    const cpNext=Number(checkpoint?.nextIndex||0);
    const cpValid=Boolean(checkpoint
      && Number(checkpoint.profileId)===id
      && String(checkpoint.engineVersion||"")===WF_ENGINE_VERSION
      && String(checkpoint.methodology||"")==="walk-forward-adaptive-memory-prior-only"
      && String(checkpoint.fingerprintHash||"")===String(fingerprint.hash||"")
      && Number(checkpoint.totalHistoryDraws||0)===draws.length
      && cpNext>0 && cpNext<=draws.length
      && Array.isArray(checkpoint.records) && checkpoint.records.length===cpNext);
    if(cpValid){
      startIndex=cpNext;
      records=checkpoint.records;
      previousFormula=checkpoint.previousFormula?cloneFormula(checkpoint.previousFormula):null;
      previousGLFormula=checkpoint.previousGLFormula?cloneFormula(checkpoint.previousGLFormula):null;
      formulaSamples=Array.isArray(checkpoint.formulaSamples)?checkpoint.formulaSamples:[];
      pendingSampleDate=String(checkpoint.pendingSampleDate||"");
      pendingSameDateSamples=Array.isArray(checkpoint.pendingSameDateSamples)?checkpoint.pendingSameDateSamples:[];
      resumedFromCheckpoint=true;
      console.info(`WF resume ${state.profiles[id]||id}: ${startIndex}/${draws.length}`);
    } else if(checkpoint) {
      await deleteIndexedValue(progressKey);
    }
  }

  // For incremental prefix reuse, reconstruct the exact prior-only training memory.
  // A resumed full rebuild already restored this memory from its checkpoint.
  if(!resumedFromCheckpoint){
    formulaSamples=[]; pendingSampleDate=""; pendingSameDateSamples=[];
    for(let i=0;i<startIndex;i++){
      const draw=draws[i], table=getPredictionTable(id,draw.date,draw);
      if(table && Array.isArray(table.inputDigits) && table.inputDigits.length===5){
        formulaSamples.push({date:draw.date,actual:String(draw.number),inputs:table.inputDigits.map(String)});
      }
    }
    if(!previousFormula){
      for(let i=records.length-1;i>=0;i--){
        if(Array.isArray(records[i]?.aiLFormula)){ previousFormula=cloneFormula(records[i].aiLFormula); break; }
      }
    }
    if(!previousGLFormula){
      for(let i=records.length-1;i>=0;i--){
        if(Array.isArray(records[i]?.glFormula)){ previousGLFormula=cloneFormula(records[i].glFormula); break; }
      }
    }
  }

  const originalStartIndex=startIndex;
  const rebuildTotal=Math.max(0,draws.length-startIndex);
  const persistProgress=async(nextIndex, force=false)=>{
    if(requestedStartDate || nextIndex<=0 || nextIndex>draws.length) return true;
    if(!force && (nextIndex>=draws.length || nextIndex%WF_PROGRESS_COMMIT_EVERY!==0)) return true;
    return writeIndexedValue(progressKey,{
      version:1,profileId:id,engineVersion:WF_ENGINE_VERSION,methodology:"walk-forward-adaptive-memory-prior-only",
      fingerprintHash:fingerprint.hash,totalHistoryDraws:draws.length,nextIndex,updatedAt:Date.now(),
      records,previousFormula:previousFormula?cloneFormula(previousFormula):null,previousGLFormula:previousGLFormula?cloneFormula(previousGLFormula):null,formulaSamples,
      pendingSampleDate,pendingSameDateSamples
    });
  };

  const progressEvery=Math.max(1,Number(options?.progressEvery||1));
  const yieldEvery=Math.max(1,Number(options?.yieldEvery||4));
  for(let i=startIndex;i<draws.length;i++){
    const draw=draws[i], table=getPredictionTable(id,draw.date,draw), relativeIndex=i-originalStartIndex;
    if(pendingSampleDate && String(draw.date)!==pendingSampleDate){
      formulaSamples.push(...pendingSameDateSamples); pendingSameDateSamples=[]; pendingSampleDate="";
    }
    if(progressCallback && (relativeIndex===0 || relativeIndex===rebuildTotal-1 || relativeIndex%progressEvery===0))
      progressCallback(relativeIndex,rebuildTotal,draw.date,{reused:originalStartIndex,totalHistory:draws.length,resumed:originalStartIndex>0&&!requestedStartDate});
    if(relativeIndex%yieldEvery===0) await new Promise(resolve=>setTimeout(resolve,0));
    if(!table?.inputDigits){
      records.push({version:1,profileId:id,actualDrawId:draw.id,date:draw.date,sourceTableDate:null,statuses:{classic:"pending",aiL:"pending",gl:"pending",independent:"pending",pair:"pending",master:"pending",masterBasic:"pending"},sampleCount:formulaSamples.length});
      await persistProgress(i+1);
      continue;
    }
    const inputs=table.inputDigits.map(String), actual=String(draw.number), samples=formulaSamples;
    const classicGrid=formulaGrid(inputs,getOriginalFormula());
    const classicResults=findLResults(classicGrid||[]), classicItems=classicResults.map(x=>String(x.number));
    let aiFormula=null, aiLItems=[], aiGrid=null, glFormula=null, glItems=[], glGrid=null;
    if(samples.length>=8){aiFormula=evolveWalkForwardAIFormula(id,samples,previousFormula,draw.date); if(aiFormula) previousFormula=cloneFormula(aiFormula);}
    if(aiFormula){ aiGrid=formulaGrid(inputs,aiFormula); aiLItems=findLResults(aiGrid||[]).map(x=>String(x.number)); }
    if(aiFormula&&samples.length>=8){ glFormula=evolveWalkForwardAIGLFormula(id,samples,aiFormula,previousGLFormula,draw.date); if(glFormula) previousGLFormula=cloneFormula(glFormula); }
    if(glFormula){ glGrid=formulaGrid(inputs,glFormula); glItems=findLResults(glGrid||[]).map(x=>String(x.number)); }
    let independent={items:[],pending:true}; try{independent=generateIndependentAI(id,draw.date,10);}catch(_){}
    let pair={items:[],pending:true}; try{pair=generatePairAI(id,draw.date,10);}catch(_){}
    const independentItems=(independent.items||[]).slice(0,10).map(x=>String(x.number));
    const pairItems=(pair.items||[]).slice(0,10).map(x=>String(x.number));
    const weights=MASTER_AI_PAUSED ? null : walkForwardMasterWeights(records,draw.date,Boolean(aiFormula));
    const masterItems=(!MASTER_AI_PAUSED && weights?.samples>=8 && !independent.pending && !pair.pending) ? buildWalkForwardMasterItems(classicItems,aiLItems,independentItems,pairItems,weights,10) : [];
    const masterBasic=MASTER_BASIC_TEST
      ? buildStrictPriorMasterBasicPrediction(records,draw.date,classicItems,aiLItems,independentItems,pairItems,10)
      : {pending:true,items:[],evidence:null,selectedEngine:"classic",fallback:true};
    const basicSelected=String(masterBasic.selectedEngine||"classic");
    const selectedLists={classic:classicItems,aiL:aiLItems,independent:independentItems,pair:pairItems};
    // R48 Exact Mirror: store the exact candidate list of the engine BASIC selected.
    // Do not re-score a separately truncated BASIC list, because that can disagree with the selected engine.
    const masterBasicItems=((selectedLists[basicSelected]||[])).map(x=>String(typeof x==="string"?x:x?.number||"")).filter(x=>/^\d{3}$/.test(x));
    const wfStatuses={classic:snapshotItemsStatus(actual,classicItems),aiL:aiFormula?snapshotItemsStatus(actual,aiLItems):"pending",gl:glFormula?snapshotItemsStatus(actual,glItems):"pending",independent:independent.pending?"pending":snapshotItemsStatus(actual,independentItems),pair:pair.pending?"pending":snapshotItemsStatus(actual,pairItems),master:masterItems.length?snapshotItemsStatus(actual,masterItems):"pending",masterBasic:"pending"};
    const basicExpectedStatus=wfStatuses[basicSelected]||"pending";
    // BASIC means "use the selected engine". Its WF outcome therefore mirrors that engine 1:1.
    wfStatuses.masterBasic=basicExpectedStatus;
    const basicAuditMatched=wfStatuses.masterBasic===basicExpectedStatus;
    const priorTrainingDates=draws.slice(0,i).map(x=>String(x?.date||"")).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d) && d<String(draw.date||""));
    const trainedThrough=priorTrainingDates.at(-1) || String(table.date||"");
    records.push({
      version:1,profileId:id,actualDrawId:draw.id,date:draw.date,sourceTableId:table.id,sourceTableDate:table.date,
      trainedThrough,sampleCount:samples.length,createdAt:Date.now(),
      statuses:wfStatuses,
      items:{classic:classicItems,aiL:aiLItems,gl:glItems,independent:independentItems,pair:pairItems,master:masterItems,masterBasic:masterBasicItems},grids:{classic:classicGrid,aiL:aiGrid,gl:glGrid},aiLFormula:aiFormula?cloneFormula(aiFormula):null,glFormula:glFormula?cloneFormula(glFormula):null,masterWeights:weights,masterBasicSelected:basicSelected,masterBasicFallback:Boolean(masterBasic.fallback),masterBasicCandidateCount:masterBasicItems.length,masterBasicAuditMatched:basicAuditMatched,masterBasicExpectedStatus:basicExpectedStatus,
      methodology:"walk-forward-adaptive-memory-prior-only",verifiedLive:false
    });
    if(!pendingSampleDate) pendingSampleDate=String(draw.date);
    pendingSameDateSamples.push({date:draw.date,actual,inputs});
    await persistProgress(i+1);
  }

  state.walkForwardBacktests=state.walkForwardBacktests||{};
  state.walkForwardBacktests[id]={
    version:4,engineVersion:WF_ENGINE_VERSION,profileId:id,generatedAt:Date.now(),methodology:"walk-forward-adaptive-memory-prior-only",
    rebuildMode:originalStartIndex>0?"incremental":"full",reusedRecords:originalStartIndex,recalculatedRecords:rebuildTotal,
    incrementalFrom:originalStartIndex<draws.length?draws[originalStartIndex].date:"",totalHistoryDraws:draws.length,
    cacheFingerprint:buildWalkForwardCacheFingerprint(id),
    memoryPolicy:{windows:AI_HISTORY_WINDOWS.map(w=>({size:w.size===Infinity?"All":w.size,weight:w.weight}))},records
  };
  clearPerformanceCaches(); activeRenderPerfSignature=""; saveState();

  // Critical durability boundary: a WF profile is complete only after the finished bucket
  // is committed to IndexedDB. This prevents iOS/PWA suspension from losing yesterday's WF.
  const durable=await commitStateDurably();
  if(durable && !requestedStartDate) await deleteIndexedValue(progressKey);
  else if(!requestedStartDate && draws.length) await persistProgress(draws.length,true);
  return state.walkForwardBacktests[id];
}

function trustedHistorySummary(draws, profileId, engine) {
  let hit=0,total=0;
  (draws||[]).forEach(draw=>{const c=getHistoryComparisonStatuses(draw,profileId);const status=c?.[engine]||"pending";if(status==="pending")return;total++;if(status==="exact"||status==="reversed")hit++;});
  return {hit,total,rate:total?Math.round(hit*1000/total)/10:0};
}

function writeAILearningStatus(profileId, payload = {}) {
  const id = Number(profileId);
  state.aiLearningStatus = state.aiLearningStatus || {};
  const prior = state.aiLearningStatus[id] || {};
  state.aiLearningStatus[id] = {
    ...prior, version:1, profileId:id, trainedAt:Date.now(),
    historyCount:getFormulaSamples(id).length,
    ...payload
  };
  return state.aiLearningStatus[id];
}

function autoEvolveAfterActualSave(profileId) {
  const id = Number(profileId);
  const previous = state.aiFormulaLab?.[id] ? JSON.parse(JSON.stringify(state.aiFormulaLab[id])) : null;
  const previousMode = getActiveFormulaMode(id);
  const previousCheck = formulaEligibility(previous);
  const previousSignature = compactFormulaSignature(previous?.formula);
  const result = generateAIFormula(id, {incremental:true, deferSave:true});
  if (result?.error) {
    writeAILearningStatus(id,{outcome:"error",accepted:false,formulaChanged:false,previousScore:previous?.test?.rate ?? null,newScore:null,improvement:null,reason:String(result.error)});
    saveState();
    return {trained:false, reason:result.error};
  }

  const check = formulaEligibility(result);
  const previousScore = previous?.test?.rate ?? result.originalTest?.rate ?? 0;
  const newScore = result?.test?.rate ?? 0;
  const improvement = Math.round((newScore - previousScore) * 10) / 10;
  const attemptedSignature = compactFormulaSignature(result?.formula);
  const attemptedChanged = attemptedSignature !== previousSignature;
  const logLearning = (outcome, accepted, reason) => writeAILearningStatus(id,{
    outcome, accepted:Boolean(accepted), formulaChanged:Boolean(accepted && attemptedChanged), attemptedChanged,
    previousScore, newScore, improvement, reason:reason || "",
    testTotal:result?.test?.total || 0, deploymentStatus:result?.deploymentStatus || "candidate"
  });

  // Approved model: keep the existing rule. It is offered only when it passes
  // eligibility and improves on the model that was already stored.
  if (check.allowed && improvement > 0) {
    result.deploymentStatus = "approved";
    logLearning("approved",true,`ผ่านเกณฑ์และดีขึ้น ${improvement > 0 ? "+" : ""}${improvement}%`);
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
    logLearning("first-candidate",true,check.reason || "สร้างสูตร AI รุ่นแรกเพื่อเรียนรู้ต่อ");
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
    logLearning("candidate-improved",true,check.reason || `Candidate ดีขึ้น ${improvement > 0 ? "+" : ""}${improvement}%`);
    saveState();
    clearPerformanceCaches();
    activeRenderPerfSignature = "";
    return {trained:true, recommended:false, candidate:true, improved:true, result, improvement, previousScore, newScore, reason:check.reason};
  }

  // Otherwise preserve the previous model exactly, preventing quality regression.
  state.aiFormulaLab[id] = previous;
  const protectedReason = check.allowed ? "สูตรรุ่นใหม่ยังไม่ดีกว่าสูตรเดิม" : check.reason;
  logLearning("protected",false,protectedReason);
  saveState();
  clearPerformanceCaches();
  activeRenderPerfSignature = "";
  return {trained:true, recommended:false, reason:protectedReason};
}

function writeAIGLLearningStatus(profileId,payload={}){
  const id=Number(profileId);state.aiGLLearningStatus=state.aiGLLearningStatus||{};
  state.aiGLLearningStatus[id]={...(state.aiGLLearningStatus[id]||{}),version:1,profileId:id,trainedAt:Date.now(),historyCount:getFormulaSamples(id).length,...payload};
  return state.aiGLLearningStatus[id];
}
function autoEvolveAIGLAfterActualSave(profileId){
  const id=Number(profileId),previous=state.aiGLFormulaLab?.[id]?JSON.parse(JSON.stringify(state.aiGLFormulaLab[id])):null;
  const result=generateAIGLFormula(id,{incremental:true,deferSave:true});
  if(result?.error){writeAIGLLearningStatus(id,{outcome:"error",accepted:false,reason:String(result.error)});saveState();return {trained:false,reason:result.error};}
  const previousRate=Number(previous?.test?.rate||0),newRate=Number(result?.test?.rate||0),improvement=Math.round((newRate-previousRate)*10)/10;
  const check=glFormulaEligibility(result,id),previousCheck=glFormulaEligibility(previous,id);
  if(!previous||improvement>0||(check.allowed&&!previousCheck.allowed)){
    result.deploymentStatus=check.allowed?"approved":"candidate";
    writeAIGLLearningStatus(id,{outcome:check.allowed?"approved":"candidate",accepted:true,formulaChanged:compactFormulaSignature(previous?.formula)!==compactFormulaSignature(result.formula),previousScore:previousRate,newScore:newRate,improvement,reason:check.reason});
    saveState();clearPerformanceCaches();activeRenderPerfSignature="";
    return {trained:true,recommended:check.allowed,result,improvement};
  }
  state.aiGLFormulaLab[id]=previous;
  writeAIGLLearningStatus(id,{outcome:"protected",accepted:false,formulaChanged:false,previousScore:previousRate,newScore:newRate,improvement,reason:"สูตร GL รุ่นใหม่ยังไม่ดีกว่าสูตรเดิม"});
  saveState();clearPerformanceCaches();activeRenderPerfSignature="";
  return {trained:true,recommended:previousCheck.allowed,reason:"protected"};
}

// Recover profiles affected by the V6.4.7 deletion bug without changing data,
// formula thresholds, or the active Calculate formula. Runs only when AI/History
// is opened, only when >= 8 usable samples exist, and only if AI-L is missing.
function scheduleMissingAIFormulaRecovery(profileId = state.activeProfile) {
  const id = Number(profileId);
  const missingAI=!state.aiFormulaLab?.[id]?.formula,missingGL=!state.aiGLFormulaLab?.[id]?.formula;
  if ((!missingAI&&!missingGL) || AI_FORMULA_RECOVERY_IN_FLIGHT.has(id)) return;
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
      if(state.aiFormulaLab?.[id]?.formula&&!state.aiGLFormulaLab?.[id]?.formula){
        const gl=generateAIGLFormula(id);
        if(!gl?.error){recovered=true;saveState();clearPerformanceCaches();activeRenderPerfSignature="";}
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

function getAIReadiness(profileId) {
  const id=Number(profileId), samples=getFormulaSamples(id), saved=state.aiFormulaLab?.[id] || null,glSaved=state.aiGLFormulaLab?.[id]||null;
  const actualCount=(state.actualDraws||[]).filter(d=>Number(d.profileId??0)===id && /^\d{3}$/.test(String(d.number||""))).length;
  const wf=getWalkForwardBucket(id), wfRecords=Array.isArray(wf?.records)?wf.records.length:0;
  const wfPercent=actualCount ? Math.min(100,Math.round(wfRecords*100/actualCount)) : 0;
  const independentCount=independentHistory(id).length;
  const aiEligibility=formulaEligibility(saved);
  const aiLReady=Boolean(saved?.formula && aiEligibility.allowed);
  const glEligibility=glFormulaEligibility(glSaved,id),glReady=Boolean(glSaved?.formula&&glEligibility.allowed);
  const independentReady=independentCount>=8;
  const pairCount=independentCount, pairReady=pairCount>=8;
  const masterReport=MASTER_AI_V1_ACTIVE?masterV1WalkForwardReport(id):{ready:false,aligned:0,promote:false};
  const masterReady=Boolean(masterReport.ready && masterReport.aligned>=MASTER_AI_V1_MIN_PRIOR);
  return {id,samples:samples.length,actualCount,wfRecords,wfPercent,saved,aiEligibility,aiLReady,glSaved,glEligibility,glReady,independentCount,independentReady,pairCount,pairReady,masterReady,masterReport};
}
function renderAIReadinessDashboard(profileId) {
  const r=getAIReadiness(profileId);
  const wfState=r.wfPercent>=100?"ready":r.wfPercent>0?"working":"pending";
  const chip=(label,stateText,kind,detail)=>`<div class="ai-ready-cell ${kind}"><span>${escapeHtml(label)}</span><b>${escapeHtml(stateText)}</b><small>${escapeHtml(detail)}</small></div>`;
  return `<div class="ai-readiness-card">
    <div class="ux-card-head"><div><small>AI LEARNING</small><h3>สถานะการเรียนรู้</h3></div><strong>${r.samples} งวด</strong></div>
    <div class="ai-ready-grid">
      ${chip("History",r.samples?"พร้อม":"รอข้อมูล",r.samples?"ready":"pending",`${r.samples} ตารางที่ใช้เรียนรู้`)}
      ${chip("Walk-Forward",`${r.wfPercent}%`,wfState,`${r.wfRecords}/${r.actualCount||0} งวด`)}
      ${chip("AI L",r.aiLReady?"READY":(r.saved?.formula?"CANDIDATE":"PENDING"),r.aiLReady?"ready":"pending",r.saved?.formula?r.aiEligibility.reason:"เริ่มเมื่อข้อมูล ≥ 8 งวด")}
      ${chip("AI GL",r.glReady?"READY":(r.glSaved?.formula?"CANDIDATE":"PENDING"),r.glReady?"ready":"pending",r.glSaved?.formula?r.glEligibility.reason:"สร้างต่อจาก AI L เมื่อข้อมูล ≥ 8 งวด")}
      ${chip("AI อิสระ",r.independentReady?"READY":"PENDING",r.independentReady?"ready":"pending",`${r.independentCount}/8+ งวด`)}
      ${chip("AI Pair • TEST",r.pairReady?"READY":"PENDING",r.pairReady?"ready":"pending",`${r.pairCount}/8+ งวด • Pair Relationship`)}
    </div>
  </div>`;
}
// R46 — Master Basic V1.1 Diagnostic live TEST card.
// Uses the same single rule as Walk-Forward: highest strictly-prior overall hit rate;
// < 8 prior results => Classic. This card is TEST-only and never changes AUTO/Calculate.
function masterBasicLiveEvidence(profileId){
  const id=Number(profileId), targetDate=isoDate(), bucket=getWalkForwardBucket(id);
  const prior=(bucket && String(bucket.engineVersion||"")===WF_ENGINE_VERSION && Array.isArray(bucket.records))
    ? bucket.records.filter(r=>String(r?.date||"")<targetDate) : [];
  return masterBasicEvidenceFromPriorRecords(prior,targetDate);
}
function generateMasterBasicTest(profileId,limit=3){
  const id=Number(profileId), evidence=masterBasicLiveEvidence(id);
  const saved=state.aiFormulaLab?.[id], aiFormula=(saved?.formula&&formulaEligibility(saved).allowed)?saved.formula:null;
  const classic=masterFormulaCandidates(id,getOriginalFormula(),null,10);
  const aiL=aiFormula?masterFormulaCandidates(id,aiFormula,null,10):[];
  const independent=generateIndependentAI(id,null,10), pair=generatePairAI(id,null,10);
  const result=buildStrictPriorMasterBasicPrediction(
    (getWalkForwardBucket(id)?.records||[]).filter(r=>String(r?.date||"")<isoDate()),
    isoDate(),classic,aiL,independent.items||[],pair.items||[],10
  );
  return {...result,items:(result.items||[]).slice(0,limit),evidence};
}
function renderTodayRecommendation(profileId){
  if(!MASTER_BASIC_TEST) return "";
  const id=Number(profileId), basic=generateMasterBasicTest(id,3), evidence=basic.evidence||{stats:{},selected:"classic",priorCount:0};
  const labels={classic:"Classic L",aiL:"AI L",independent:"AI อิสระ",pair:"AI Pair"};
  const selectedLabel=labels[basic.selectedEngine]||"Classic L";
  const wf=masterBasicWalkForwardSummary(id);
  const wfText=wf.ready?(wf.total?`Walk-Forward Basic: ${wf.rate}% • ${wf.hit}/${wf.total} งวด • Prior-only`:`Walk-Forward Basic: กำลังสะสมข้อมูล`):`Walk-Forward Basic: กำลังสร้างใหม่`;
  const stats=evidence.stats||{};
  return `<div class="today-recommend-card ${basic.pending?'pending':''}">
    <div class="ux-card-head"><div><small>MASTER BASIC V1.2 • EXACT MIRROR • PRIOR-ONLY</small><h3>${basic.pending?'กำลังรอข้อมูล':'Master Basic V1.2 ทดลอง'}</h3><p>${escapeHtml(state.profiles[id]||`Profile ${id+1}`)} • เลือก: ${escapeHtml(selectedLabel)}</p></div><span class="master-pill">BASIC 1.2 TEST</span></div>
    ${basic.items.length?`<div class="today-top3">${basic.items.map((x,i)=>`<div class="today-number ${i===0?'winner':''}"><span>#${i+1}</span><b>${escapeHtml(x.number)}</b><small>${escapeHtml((x.sources||[selectedLabel]).join(' + '))}</small></div>`).join('')}</div>`:`<div class="today-empty">ยังไม่มี candidate สำหรับงวดนี้</div>`}
    <div class="master-weight-compact"><span>CLS <b>${stats.classic?.total?stats.classic.rate+'%':'—'}</b></span><span>AIL <b>${stats.aiL?.total?stats.aiL.rate+'%':'—'}</b></span><span>IND <b>${stats.independent?.total?stats.independent.rate+'%':'—'}</b></span><span>PAIR <b>${stats.pair?.total?stats.pair.rate+'%':'—'}</b></span></div>
    <p class="score-explainer"><b>กติกา Basic:</b> ดูผล Walk-Forward ก่อนงวดนี้เท่านั้น แล้วเลือกเครื่องยนต์ที่ % ถูกย้อนหลังสูงสุด • ต้องมีอย่างน้อย ${MASTER_BASIC_MIN_PRIOR} งวด • ถ้าข้อมูลไม่พอหรือ candidate ไม่มี ใช้ Classic • BASIC Mirror ผลของ Engine ที่เลือก 1:1 • ไม่มี Weight / Guard / Blend / Selector หลายชั้น</p>
    <p class="score-explainer"><b>${escapeHtml(wfText)}</b></p>
    ${renderMasterBasicWalkForwardCompare(id)}
    ${(()=>{const a=masterBasicAudit(id);return `<p class="score-explainer"><b>Diagnostic Audit:</b> ${a.ready?`${a.ok}/${a.total} งวดตรงกับ Engine ที่เลือก • Error ${a.errors}`:'กำลังสร้าง WF ใหม่'}${a.errors?' • ⚠️ IMPLEMENTATION ERROR':''}</p>`;})()}
    <p class="score-explainer">Prior evidence: ${evidence.priorCount||0} งวด • Selected: <b>${escapeHtml(selectedLabel)}</b>${basic.fallback?' • Classic fallback':''}</p>
  </div>`;
}


// V7.09.18 — Machine Learning Select.
// The model is deliberately trained from STRICT historical WF rows only. For a target date D:
//   features(row D) use rows with date < D, and labels come from that completed historical row.
// Live prediction for D is then trained only on rows with date < D. Same-day/future outcomes are unreachable.
function mlSelectIsHit(status){ return status==="exact" || status==="reversed"; }
function mlSelectSigmoid(x){ const z=Math.max(-18,Math.min(18,Number(x)||0)); return 1/(1+Math.exp(-z)); }
function mlSelectDay(date){ try{return new Date(`${String(date)}T12:00:00`).getDay();}catch(_){return -1;} }
function mlSelectCompetitionRate(history,targetDate,engine){
  // V7.09.23 Total Score feature. This is calculated ONLY from rows before targetDate.
  // Each trusted WF row awards +1 to every engine sharing the best positive Hit/Rev score.
  const rows=(history||[]).filter(r=>String(r?.date||"")<String(targetDate||""));
  let points=0,evaluated=0;
  rows.forEach(r=>{
    const available=ML_SELECT_ENGINES.filter(k=>r?.statuses?.[k] && r.statuses[k]!=="pending");
    if(!available.length) return;
    evaluated++;
    const best=Math.max(...available.map(k=>formulaStatusScore(r.statuses[k])));
    if(best>0 && available.includes(engine) && formulaStatusScore(r.statuses[engine])===best) points++;
  });
  // Laplace smoothing keeps tiny samples from looking artificially perfect.
  return {points,evaluated,rate:(points+1)/(evaluated+2)};
}
function mlSelectFeatureVector(history,targetDate,engine){
  const prior=(history||[]).filter(r=>String(r?.date||"")<String(targetDate||"") && r?.statuses?.[engine] && r.statuses[engine]!=="pending");
  const smoothed=rows=>{const hit=rows.filter(r=>mlSelectIsHit(r.statuses[engine])).length;return (hit+1)/(rows.length+2);};
  const overall=smoothed(prior), recent7=smoothed(prior.slice(-7)), recent14=smoothed(prior.slice(-14)), recent30=smoothed(prior.slice(-30));
  const day=mlSelectDay(targetDate), weekdayRows=prior.filter(r=>mlSelectDay(r.date)===day).slice(-12), weekday=smoothed(weekdayRows);
  const momentum=smoothed(prior.slice(-3));
  const evidence=Math.min(1,prior.length/30);
  const totalScore=mlSelectCompetitionRate(history,targetDate,engine).rate;
  // Total Score is ONE learned signal, never a direct selector. AUTO remains unchanged (Shadow Mode).
  return [1,overall,recent7,recent14,recent30,weekday,momentum,evidence,totalScore];
}
function mlSelectTrainingExamples(records,targetDate){
  const rows=(records||[]).filter(r=>String(r?.date||"")<String(targetDate||"")).slice().sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")));
  const examples=[];
  for(let i=0;i<rows.length;i++){
    const row=rows[i], date=String(row?.date||"");
    // Critical same-day rule: only dates strictly earlier than this training label may form its features.
    const history=rows.slice(0,i).filter(x=>String(x?.date||"")<date);
    if(history.length<4) continue;
    ML_SELECT_ENGINES.forEach(engine=>{
      const status=row?.statuses?.[engine];
      if(!status || status==="pending") return;
      examples.push({x:mlSelectFeatureVector(history,date,engine),y:mlSelectIsHit(status)?1:0,engine,date});
    });
  }
  return examples;
}
function mlSelectTrain(records,targetDate){
  const examples=mlSelectTrainingExamples(records,targetDate), dims=9, w=[-0.35,0,0,0,0,0,0,0,0];
  if(!examples.length) return {weights:w,examples:0};
  const lr=.18, lambda=.012;
  for(let epoch=0;epoch<140;epoch++){
    const grad=Array(dims).fill(0);
    examples.forEach(ex=>{const p=mlSelectSigmoid(ex.x.reduce((sum,v,j)=>sum+v*w[j],0)), err=p-ex.y;for(let j=0;j<dims;j++)grad[j]+=err*ex.x[j];});
    for(let j=0;j<dims;j++){const reg=j===0?0:lambda*w[j];w[j]-=lr*(grad[j]/examples.length+reg);}
  }
  return {weights:w,examples:examples.length};
}
function mlSelectCurrentAvailability(profileId,targetDate){
  const id=Number(profileId), saved=state.aiFormulaLab?.[id],glSaved=state.aiGLFormulaLab?.[id];
  const aiReady=Boolean(saved?.formula && formulaEligibility(saved).allowed);
  const glReady=Boolean(glSaved?.formula&&glFormulaEligibility(glSaved, id).allowed);
  let independentReady=false,pairReady=false;
  try{independentReady=!generateIndependentAI(id,targetDate,10).pending;}catch(_){}
  try{pairReady=!generatePairAI(id,targetDate,10).pending;}catch(_){}
  return {classic:true,aiL:aiReady,gl:glReady,independent:independentReady,pair:pairReady};
}
function getMLSelectTargetDate(){
  const today=isoDate();
  const latest=(state.actualDraws||[]).map(d=>String(d?.date||"")).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).sort().at(-1)||"";
  // Never call a completed draw a live ML target. If the newest saved result is today or later,
  // advance to the next business day so current learned state remains strictly prior to the target.
  return latest && latest>=today ? getNextBusinessDate(latest) : today;
}
function getMLSelectPrediction(profileId,targetDate=getMLSelectTargetDate()){
  const id=Number(profileId), date=String(targetDate||isoDate()).slice(0,10), bucket=getWalkForwardBucket(id);
  const trust=walkForwardRuntimeTrust(id);
  if(!bucket || !trust.valid) return {ready:false,profileId:id,targetDate:date,reason:`WF not verified: ${trust.reason||"missing"}`,probabilities:{},selected:"classic",examples:0,priorCount:0,leakPass:false};
  const prior=(bucket.records||[]).filter(r=>String(r?.date||"")<date).slice().sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")));
  const leakPass=prior.every(r=>String(r?.date||"")<date && (!r.trainedThrough || String(r.trainedThrough)<date) && (!r.sourceTableDate || String(r.sourceTableDate)<date));
  if(!leakPass) return {ready:false,profileId:id,targetDate:date,reason:"Prior-only audit failed",probabilities:{},selected:"classic",examples:0,priorCount:prior.length,leakPass:false};
  const model=mlSelectTrain(prior,date), availability=mlSelectCurrentAvailability(id,date), logits={};
  ML_SELECT_ENGINES.forEach(engine=>{
    if(!availability[engine]) return;
    const x=mlSelectFeatureVector(prior,date,engine);
    logits[engine]=x.reduce((sum,v,j)=>sum+v*model.weights[j],0);
  });
  const keys=Object.keys(logits);
  if(!keys.length) return {ready:false,profileId:id,targetDate:date,reason:"No engine available",probabilities:{},selected:"classic",examples:model.examples,priorCount:prior.length,leakPass:true};
  // Softmax converts learned relative scores to a transparent 100% selection distribution.
  const max=Math.max(...keys.map(k=>logits[k])), exps={};let total=0;
  keys.forEach(k=>{exps[k]=Math.exp(logits[k]-max);total+=exps[k];});
  const probabilities={};keys.forEach(k=>probabilities[k]=Math.round(exps[k]/Math.max(total,1e-9)*1000)/10);
  const selected=keys.slice().sort((a,b)=>probabilities[b]-probabilities[a]||ML_SELECT_ENGINES.indexOf(a)-ML_SELECT_ENGINES.indexOf(b))[0]||"classic";
  return {ready:prior.length>=ML_SELECT_MIN_PRIOR && model.examples>0,profileId:id,targetDate:date,reason:prior.length<ML_SELECT_MIN_PRIOR?`Need ${ML_SELECT_MIN_PRIOR} prior WF rows`:"Strict WF model ready",probabilities,selected,examples:model.examples,priorCount:prior.length,leakPass:true,weights:model.weights,trainedThrough:prior.at(-1)?.date||"",availability};
}
function getMLSelectTopProfiles(targetDate=getMLSelectTargetDate(),limit=3){
  const date=String(targetDate||isoDate()).slice(0,10), rows=state.profiles.map((_,id)=>getMLSelectPrediction(id,date));
  return rows.filter(x=>x.leakPass).map(x=>({...x,score:Number(x.probabilities?.[x.selected]||0)}))
    .sort((a,b)=>Number(b.ready)-Number(a.ready)||b.score-a.score||b.priorCount-a.priorCount||a.profileId-b.profileId).slice(0,limit);
}
// V7.09.22 — Global Background ML Monitor.
// ML scans EVERY profile and ALL four engines (Classic L / AI L / AI อิสระ / AI Pair)
// from verified STRICT prior-only WF evidence. The UI stays quiet unless a profile has
// a meaningful edge. Internal probabilities are intentionally hidden from the main UI.
const ML_SELECT_WATCH_MIN_PP = 0.8;
const ML_SELECT_EDGE_MIN_PP = 1.5;
const ML_SELECT_STRONG_MIN_PP = 2.5;
const ML_GLOBAL_ALERT_LIMIT = 3;
function getMLSelectInsight(profileId,targetDate=getMLSelectTargetDate()){
  const current=getMLSelectPrediction(profileId,targetDate);
  const labels={classic:"Classic L",aiL:"AI L",gl:"AI GL",independent:"AI อิสระ",pair:"AI Pair"};
  const ranked=ML_SELECT_ENGINES.filter(k=>Number.isFinite(Number(current.probabilities?.[k])))
    .sort((a,b)=>Number(current.probabilities[b])-Number(current.probabilities[a])||ML_SELECT_ENGINES.indexOf(a)-ML_SELECT_ENGINES.indexOf(b));
  const first=ranked[0]||current.selected||"classic", second=ranked[1]||null;
  const lead=second?Number(current.probabilities?.[first]||0)-Number(current.probabilities?.[second]||0):0;
  const validEdge=Boolean(current.ready&&current.leakPass&&second);
  const level=!validEdge?'none':lead>=ML_SELECT_STRONG_MIN_PP?'strong':lead>=ML_SELECT_EDGE_MIN_PP?'edge':lead>=ML_SELECT_WATCH_MIN_PP?'watch':'none';
  const edge=level==='edge'||level==='strong';
  const watch=level==='watch';
  return {current,labels,ranked,first,second,lead,edge,watch,level,label:labels[first]||"Classic L"};
}
function getMLGlobalMonitor(targetDate=getMLSelectTargetDate()){
  const date=String(targetDate||isoDate()).slice(0,10);
  const scans=(state.profiles||[]).map((name,id)=>{
    const insight=getMLSelectInsight(id,date);
    return {...insight,profileId:id,profileName:String(name||`Profile ${id+1}`),targetDate:date};
  });
  const alerts=scans.filter(x=>x.edge)
    .sort((a,b)=>(b.level==='strong')-(a.level==='strong')||b.lead-a.lead||Number(b.current?.examples||0)-Number(a.current?.examples||0)||a.profileId-b.profileId)
    .slice(0,ML_GLOBAL_ALERT_LIMIT);
  const watches=scans.filter(x=>x.watch)
    .sort((a,b)=>b.lead-a.lead||Number(b.current?.examples||0)-Number(a.current?.examples||0)||a.profileId-b.profileId)
    .slice(0,ML_GLOBAL_ALERT_LIMIT);
  const valid=scans.filter(x=>x.current?.leakPass);
  const ready=valid.filter(x=>x.current?.ready);
  const blocked=scans.length-valid.length;
  const latestTrain=valid.map(x=>String(x.current?.trainedThrough||'')).filter(Boolean).sort().at(-1)||'';
  const evidence=valid.reduce((sum,x)=>sum+Number(x.current?.examples||0),0);
  return {date,scans,alerts,watches,total:scans.length,ready:ready.length,blocked,latestTrain,evidence};
}
function getAITotalScoreTrusted(){
  const engines=[
    {key:"classic",label:"Classic L"},
    {key:"aiL",label:"AI L"},
    {key:"gl",label:"AI GL"},
    {key:"independent",label:"AI อิสระ"},
    {key:"pair",label:"AI Pair"}
  ];
  const counts={classic:0,aiL:0,gl:0,independent:0,pair:0}, hits={classic:0,aiL:0,gl:0,independent:0,pair:0}, totals={classic:0,aiL:0,gl:0,independent:0,pair:0};
  let scored=0,tie=0,noWinner=0,trustedRows=0;
  (state.actualDraws||[]).filter(d=>/^\d{3}$/.test(String(d?.number||""))).forEach(draw=>{
    const profileId=Number(draw?.profileId??0), c=getHistoryComparisonStatuses(draw,profileId);
    if(!c?.trusted || (!c.verified && !c.walkForward)) return;
    const statuses={classic:c.classic,aiL:c.aiL,gl:c.gl||"pending",independent:c.independent,pair:c.pair};
    const available=engines.filter(e=>statuses[e.key] && statuses[e.key]!=="pending");
    if(!available.length) return;
    trustedRows++;
    available.forEach(e=>{totals[e.key]++; if(mlSelectIsHit(statuses[e.key])) hits[e.key]++;});
    const best=Math.max(...available.map(e=>formulaStatusScore(statuses[e.key])));
    const winners=best>0?available.filter(e=>formulaStatusScore(statuses[e.key])===best):[];
    if(!winners.length){ noWinner++; return; }
    scored++;
    winners.forEach(e=>counts[e.key]++);
    if(winners.length>1) tie++;
  });
  const rows=engines.map(e=>({
    ...e,points:counts[e.key],hit:hits[e.key],total:totals[e.key],rate:totals[e.key]?Math.round(hits[e.key]*1000/totals[e.key])/10:0
  })).sort((a,b)=>b.points-a.points||b.rate-a.rate||b.total-a.total);
  return {rows,trustedRows,scored,tie,noWinner};
}
function renderAITotalScoreCard(){
  const s=getAITotalScoreTrusted(), max=Math.max(1,...s.rows.map(r=>r.points));
  return `<div class="ai-total-score-card">
    <div class="ai-total-score-head"><div><small>AI TOTAL SCORE • TRUSTED ONLY</small><h3>คะแนนรวม AI</h3><p>Verified Live + Strict Walk-Forward • ทุก Profile</p></div><span>${s.trustedRows} rows</span></div>
    <div class="ai-total-score-list">${s.rows.map((r,i)=>`<div class="ai-total-score-row ${i===0?'leader':''}"><i>${i+1}</i><div class="ai-total-score-copy"><b>${escapeHtml(r.label)}</b><small>Hit ${r.hit}/${r.total} • ${r.rate.toFixed(1)}%</small></div><div class="ai-total-score-bar"><span style="width:${Math.max(4,Math.round(r.points/max*100))}%"></span></div><strong>${r.points}</strong></div>`).join('')}</div>
    <details class="ai-total-score-details">
      <summary>Score details <span>▾</span></summary>
      <div class="ai-total-score-foot"><span>TIE <b>${s.tie}</b></span><span>No winner <b>${s.noWinner}</b></span><span>Scored <b>${s.scored}</b></span></div>
      <p class="ai-total-score-note">กติกา: Hit/Rev ที่ได้คะแนนสูงสุดรับ +1 • ถ้าเสมอ ผู้ชนะที่เสมอกันทุกตัวได้ +1 • ถ้าทุกตัว Miss = 0 • Total Score เป็นเพียงหนึ่ง Input ของ ML Shadow และยังไม่เปลี่ยน AUTO</p>
    </details>
  </div>`;
}

function renderMLSelectCard(){
  const monitor=getMLGlobalMonitor();
  const hasAlerts=monitor.alerts.length>0, hasWatches=monitor.watches.length>0;
  const allBlocked=monitor.total>0&&monitor.blocked===monitor.total;
  const status=allBlocked?'BLOCKED':hasAlerts?'EDGE':hasWatches?'WATCH':'MONITORING';
  const statusClass=allBlocked?'blocked':hasAlerts?'edge':'monitoring';
  const headline=allBlocked
    ? 'ML BLOCKED • รอ Strict WF / Anti-Leak'
    : hasAlerts
      ? `${monitor.alerts[0].label} มี Edge เด่นสุด ${monitor.alerts[0].lead.toFixed(1)} จุดเปอร์เซ็นต์`
      : hasWatches
        ? `${monitor.watches[0].label} เริ่มมีแนวโน้ม +${monitor.watches[0].lead.toFixed(1)} จุดเปอร์เซ็นต์`
        : 'ยังไม่มี Edge ชัดเจน';
  const source=hasAlerts?monitor.alerts:monitor.watches;
  const cards=source.length?`<div class="ml-global-alerts">${source.map((x,i)=>`<button type="button" class="ml-global-alert" data-ml-table-preview data-profile-id="${x.profileId}"><span class="ml-alert-rank">${i+1}</span><span class="ml-alert-copy"><b>${escapeHtml(x.profileName)}</b><small>${escapeHtml(x.label)} +${x.lead.toFixed(1)} จุดเปอร์เซ็นต์</small></span><em>${x.level==='strong'?'STRONG':x.level==='edge'?'EDGE':'WATCH'} ↗</em></button>`).join('')}</div>`:'';
  return `<div class="ml-select-card ml-background ml-compact ml-global ${statusClass}">
    <div class="ux-card-head"><div><small>MACHINE LEARNING • GLOBAL MONITOR</small><h3>ML Insight</h3><p>ดูแนวโน้มทุก Profile แบบ Strict Prior-only</p></div><span class="ml-select-pill">${status}</span></div>
    <div class="ml-insight-main ${statusClass}">
      <span class="ml-insight-icon">${hasAlerts||hasWatches?'↗':'●'}</span>
      <div><b>${headline}</b></div>
    </div>
    ${cards}
    <div class="ml-trust-strip"><span><b>Anti-Leak</b> ${allBlocked?'BLOCKED':'PASS'}</span><span><b>Profiles ready</b> ${monitor.ready}/${monitor.total}</span><span><b>Train through</b> ${escapeHtml(monitor.latestTrain||'—')}</span></div>
  </div>`;
}

function renderAIGLCard(profileId){
  const id=Number(profileId),saved=state.aiGLFormulaLab?.[id]||null,check=glFormulaEligibility(saved,id),samples=getFormulaSamples(id);
  const trusted={classic:trustedHistorySummary(state.actualDraws.filter(d=>Number(d.profileId??0)===id),id,"classic"),ai:trustedHistorySummary(state.actualDraws.filter(d=>Number(d.profileId??0)===id),id,"aiL"),gl:trustedHistorySummary(state.actualDraws.filter(d=>Number(d.profileId??0)===id),id,"gl")};
  const status=check.allowed?"READY":saved?.formula?"LEARNING":"WARM-UP";
  let statusText=`รอข้อมูล ${samples.length}/8 งวด`;
  if(saved?.formula && trusted.gl.total && trusted.ai.total){
    const delta=Math.round((trusted.gl.rate-trusted.ai.rate)*10)/10;
    if(delta<0) statusText=`ยังตาม AI L อยู่ ${Math.abs(delta).toFixed(1)} จุดเปอร์เซ็นต์`;
    else if(delta===0) statusText="เสมอ AI L";
    else statusText=`นำ AI L อยู่ ${delta.toFixed(1)} จุดเปอร์เซ็นต์${check.allowed?"":" • LEARNING"}`;
  } else if(saved?.formula && check.allowed){
    statusText="READY";
  }
  return `<div class="ai-gl-card ai-gl-card-clean ${check.allowed?'ready':'learning'}">
    <div class="ux-card-head ai-gl-clean-head"><div><small>AI GL</small><h3>AI GL</h3></div><span class="ai-gl-pill">${status}</span></div>
    <div class="ai-gl-kpis"><div><span>Classic</span><b>${trusted.classic.total?trusted.classic.rate+'%':'—'}</b></div><div><span>AI L</span><b>${trusted.ai.total?trusted.ai.rate+'%':'—'}</b></div><div><span>AI GL</span><b>${trusted.gl.total?trusted.gl.rate+'%':'—'}</b></div></div>
    <p class="score-explainer ai-gl-status-clean"><b>${escapeHtml(statusText)}</b></p>
  </div>`;
}



function renderWeekly() {
  const profileId=Number(state.activeProfile), samples=getFormulaSamples(profileId);
  const saved=state.aiFormulaLab?.[profileId] || null;
  const original=getOriginalFormula();
  const allOriginal=evaluateFormula(original,samples);
  const allAI=saved?evaluateFormula(saved.formula,samples):null;
  const glSaved=state.aiGLFormulaLab?.[profileId]||null,allGL=glSaved?evaluateFormula(glSaved.formula,samples):null,glEligibility=glFormulaEligibility(glSaved,profileId);
  const trustedDraws=(state.actualDraws||[]).filter(d=>Number(d.profileId??0)===profileId);
  const trustedClassic=trustedHistorySummary(trustedDraws,profileId,"classic");
  const trustedAI=trustedHistorySummary(trustedDraws,profileId,"aiL");
  const trustedGL=trustedHistorySummary(trustedDraws,profileId,"gl");
  const eligibility=formulaEligibility(saved);
  const delta=saved?eligibility.delta:0;
  const configuredMode=getConfiguredFormulaMode(profileId);
  const activeMode=getActiveFormulaMode(profileId);
  const autoDecision=getAutoFormulaDecision(profileId);
  const modeName=activeMode==="blend"?"BLEND":activeMode==="gl"?"AI GL":activeMode==="ai"?"AI L":"CLASSIC";
  const strategyBadge=configuredMode === "auto" ? `AUTO → ${modeName}` : modeName;
  return `<section class="card ai-lab ux-page-card">
    <div class="ux-page-head"><div><small>AI CENTER</small></div><span class="ux-count-pill">${samples.length} งวด</span></div>
    ${profileTabs()}
    ${renderTodayTrustedTopProfiles()}
    ${renderAIReadinessDashboard(profileId)}
    <div class="formula-strategy-panel ux-strategy-card" aria-label="เลือกสูตรที่ใช้คำนวณ">
      <div class="strategy-heading"><div><b>สูตรที่ใช้ใน Calculate</b><span>เลือกเฉพาะ Profile นี้</span></div><strong>${strategyBadge}</strong></div>
      <div class="strategy-options ux-three-choice">
        <button type="button" class="strategy-option auto-strategy strategy-auto-hero ${configuredMode==='auto'?'selected':''}" data-formula-mode="auto" aria-pressed="${configuredMode==='auto'}"><span class="model-dot auto"></span><span><b>🤖 AUTO</b><small>วันนี้ → ${modeName}${activeMode==="blend"?" • AI L + AI GL":""} • ${escapeHtml(autoDecision.reason)}</small></span><em>${configuredMode==='auto'?'กำลังใช้':'ใช้ AUTO'}</em></button>
        <button type="button" class="strategy-option ${configuredMode==='original'?'selected':''}" data-formula-mode="original" aria-pressed="${configuredMode==='original'}"><span class="model-dot classic"></span><span><b>Classic L</b><small>Trusted ${trustedClassic.total?trustedClassic.rate+'%':'—'} • ${trustedClassic.total} งวด</small></span><em>${configuredMode==='original'?'กำลังใช้':'เลือก'}</em></button>
        <button type="button" class="strategy-option ${configuredMode==='ai'?'selected':''} ${!saved?.formula||!eligibility.allowed?'disabled':''}" data-formula-mode="ai" aria-pressed="${configuredMode==='ai'}" ${!saved?.formula||!eligibility.allowed?'disabled':''}><span class="model-dot ail"></span><span><b>AI L</b><small>${saved?.formula?`Trusted ${trustedAI.total?trustedAI.rate+'%':'—'} • ${eligibility.reason}`:'ยังไม่มีสูตรพร้อมใช้'}</small></span><em>${configuredMode==='ai'?'กำลังใช้':(saved?.formula&&eligibility.allowed?'เลือก':'ล็อก')}</em></button>
        <button type="button" class="strategy-option ${configuredMode==='gl'?'selected':''} ${!glSaved?.formula||!glEligibility.allowed?'disabled':''}" data-formula-mode="gl" aria-pressed="${configuredMode==='gl'}" ${!glSaved?.formula||!glEligibility.allowed?'disabled':''}><span class="model-dot gl"></span><span><b>AI GL</b><small>${glSaved?.formula?`Trusted ${trustedGL.total?trustedGL.rate+'%':'—'} • ${glEligibility.reason}`:'ยังไม่มีสูตร Hybrid พร้อมใช้'}</small></span><em>${configuredMode==='gl'?'กำลังใช้':(glSaved?.formula&&glEligibility.allowed?'เลือก':'ล็อก')}</em></button>
        <button type="button" class="strategy-option independent-view" data-independent-table-preview><span class="model-dot independent"></span><span><b>AI อิสระ</b><small>ดูตาราง Top 5 จาก History โดยตรง • ไม่เปลี่ยนสูตรหลัก</small></span><em>ดูตาราง</em></button>
      </div>
    </div>
    ${renderAIGLCard(profileId)}
    ${renderMLSelectCard()}
    ${renderAITotalScoreCard()}
  </section>`;
}

function canonical3(value) { return [...String(value || "")].sort().join(""); }
function getDailyTable(profileId, date) {
  const wantedDate = String(date || "").trim().slice(0, 10);
  return (state.dailyTables || []).find(t =>
    Number(t?.profileId) === Number(profileId) &&
    String(t?.date || "").trim().slice(0, 10) === wantedDate
  ) || null;
}

// V6.10.0 hotfix: older/imported History can contain the actual result for the
// reference day while its dailyTables row is missing. Rebuild a READ-ONLY
// reference table from that prior actual result so History can still show and
// score Classic without borrowing today's AI/formula (no future leakage).
function buildHistoricalReferenceTableFromActual(profileId, date) {
  const wantedDate = String(date || "").trim().slice(0, 10);
  const source = (state.actualDraws || []).find(x =>
    Number(x?.profileId ?? 0) === Number(profileId) &&
    String(x?.date || "").trim().slice(0, 10) === wantedDate &&
    /^\d{3}$/.test(String(x?.number || "")) && /^\d{2}$/.test(String(x?.twoDigit || ""))
  );
  if (!source) return null;
  const inputDigits = [...String(source.number), ...String(source.twoDigit)];
  return {
    id: `recovered-${Number(profileId)}-${wantedDate}`,
    profileId: Number(profileId),
    profileName: source.profileName || state.profiles?.[Number(profileId)] || `Profile ${Number(profileId)+1}`,
    date: wantedDate,
    inputDigits,
    inputNumber: inputDigits.join(""),
    recoveredHistoricalReference: true,
    sourceActualDrawId: source.id || ""
  };
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
function isStrictPriorReferenceTable(table, resultDate, profileId = null) {
  if (!table || !/^\d{4}-\d{2}-\d{2}$/.test(String(resultDate || ""))) return false;
  const tableDate = String(table.date || "").slice(0,10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tableDate) || tableDate >= String(resultDate)) return false;
  if (profileId !== null && Number(table.profileId) !== Number(profileId)) return false;
  return Array.isArray(table.inputDigits) && table.inputDigits.length === 5;
}
function resolveReferenceTable(profileId, resultDate, actualDraw = null) {
  const draw = actualDraw || state.actualDraws.find(x => Number(x.profileId ?? 0) === Number(profileId) && x.date === resultDate);
  if (draw?.referenceTableId) {
    const manualTable = state.dailyTables.find(t => t.id === draw.referenceTableId && Number(t.profileId) === Number(profileId)) || null;
    // Strict anti-leak rule: even a manually linked table may never be same-day/future.
    if (isStrictPriorReferenceTable(manualTable, resultDate, profileId)) {
      return { table: manualTable, expectedDate: manualTable?.date || "", mode: "manual", fallback: false };
    }
    // Ignore an unsafe/stale manual link and continue through the prior-only resolver.
  }
  const expectedDate = getExpectedReferenceDate(resultDate);
  const exactTable = getDailyTable(profileId, expectedDate);
  if (isStrictPriorReferenceTable(exactTable, resultDate, profileId)) return { table: exactTable, expectedDate, mode: "auto", fallback: false };

  // Prefer the exact expected business day reconstructed from its saved actual
  // result over an older unrelated table. This fixes History "No table" after
  // imports/migrations where dailyTables was incomplete.
  const recoveredExact = buildHistoricalReferenceTableFromActual(profileId, expectedDate);
  if (isStrictPriorReferenceTable(recoveredExact, resultDate, profileId)) return { table: recoveredExact, expectedDate, mode: "auto-recovered", fallback: false };

  const fallbackTable = getLatestAvailableTableBefore(profileId, resultDate);
  if (isStrictPriorReferenceTable(fallbackTable, resultDate, profileId)) return { table: fallbackTable, expectedDate, mode: "auto", fallback: true };

  // Last safe fallback: use the latest earlier actual result as a read-only
  // reference. Never synthesize an AI snapshot here.
  const priorActual = (state.actualDraws || [])
    .filter(x => Number(x?.profileId ?? 0) === Number(profileId) && String(x?.date || "") < String(resultDate || ""))
    .sort((a,b) => String(b.date || "").localeCompare(String(a.date || "")))[0] || null;
  const recoveredPrior = priorActual ? buildHistoricalReferenceTableFromActual(profileId, priorActual.date) : null;
  return { table: isStrictPriorReferenceTable(recoveredPrior, resultDate, profileId) ? recoveredPrior : null, expectedDate, mode: recoveredPrior ? "auto-recovered" : "auto", fallback: Boolean(recoveredPrior) };
}
function getPredictionTable(profileId, resultDate, actualDraw = null) {
  return resolveReferenceTable(profileId, resultDate, actualDraw).table;
}

// V6.6.9 — Historical AI must use the model/prediction that existed before the result.
// Never fall back to today's AI model for an old draw, because that would rewrite past winners.
function getHistoricalAIFormula(profileId, resultDate, actualDraw = null) {
  const draw = actualDraw || state.actualDraws.find(x => Number(x.profileId ?? 0) === Number(profileId) && x.date === resultDate) || null;
  const table = getPredictionTable(profileId, resultDate, draw);
  if (!table || !draw) return null;

  // V6.7.8 universal prediction lock:
  // AI-L counts in History only when the snapshot was explicitly created for this
  // target draw BEFORE that result was saved. Never reuse today's/latest formula
  // and never treat a table reconstructed from imported historical results as a prediction.
  const universal = getUniversalPredictionSnapshot(profileId, resultDate, draw);
  if (universal && Array.isArray(universal.aiLFormula)) return universal.aiLFormula;
  if (!isStrictPriorReferenceTable(table, resultDate, profileId)) return null;
  const targetDate = String(table.aiSnapshotTargetDate || "");
  const snapshotAt = Number(table.aiSnapshotCreatedAt || 0);
  const resultSavedAt = Number(draw.createdAt || draw.updatedAt || 0);
  if (targetDate !== String(resultDate || "")) return null;
  if (!snapshotAt || !resultSavedAt || snapshotAt >= resultSavedAt) return null;
  return Array.isArray(table.aiFormulaSnapshot) ? table.aiFormulaSnapshot : null;
}

function classicSnapshotHistoryStatus(actualDraw, profileId = Number(actualDraw?.profileId ?? 0)) {
  if (!actualDraw) return {status:"pending", snapshot:null};
  const snap = getUniversalPredictionSnapshot(profileId, actualDraw.date, actualDraw);
  if (!snap) return {status:"pending", snapshot:null};
  return {status:snapshotItemsStatus(actualDraw.number, snap.classicItems || []), snapshot:snap};
}
function classicSnapshotHistorySummary(draws, profileId) {
  let hit=0,total=0;
  (draws||[]).forEach(draw=>{const r=classicSnapshotHistoryStatus(draw,profileId);if(r.status==="pending")return;total++;if(r.status==="exact"||r.status==="reversed")hit++;});
  return {hit,total,rate:total?Math.round(hit*1000/total)/10:0};
}

function aiLHistoryStatus(actualDraw, profileId = Number(actualDraw?.profileId ?? 0)) {
  if (!actualDraw) return {status:"pending", formula:null, table:null};
  const table = getPredictionTable(profileId, actualDraw.date, actualDraw);
  const formula = getHistoricalAIFormula(profileId, actualDraw.date, actualDraw);
  if (!table || !formula) return {status:"pending", formula:null, table};
  return {status:formulaHistoryStatus(actualDraw.number, table.inputDigits, formula), formula, table};
}

function aiLHistorySummary(draws, profileId) {
  let hit = 0, total = 0;
  (draws || []).forEach(draw => {
    const result = aiLHistoryStatus(draw, profileId);
    if (result.status === "pending") return;
    total += 1;
    if (result.status === "exact" || result.status === "reversed") hit += 1;
  });
  return {hit, total, rate: total ? Math.round(hit * 1000 / total) / 10 : 0};
}
function getNextBusinessDate(date) {
  if (!date) return "";
  const d = new Date(`${date}T12:00:00`);
  do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6);
  return isoDate(d);
}
function saveAIPredictionSnapshotsForTable(table) {
  if (!table) return false;
  const profileId = Number(table.profileId ?? 0);
  const targetDate = getNextBusinessDate(table.date);
  const knownTarget = state.actualDraws.find(d => Number(d.profileId ?? 0) === profileId && d.date === targetDate);

  // Strict anti-leak boundary: a target prediction can only come from a table dated before targetDate.
  if (!isStrictPriorReferenceTable(table, targetDate, profileId)) {
    table.snapshotBlockedReason = "source-table-not-prior";
    return false;
  }

  // Once a universal snapshot exists for this target, keep the first pre-result prediction immutable.
  if (table.predictionSnapshot && String(table.predictionSnapshot.targetDate || "") === targetDate && Number(table.predictionSnapshot.createdAt || 0) > 0) return true;

  // Universal rule: no engine may create/refresh a target prediction after that result exists.
  if (knownTarget) {
    table.aiFormulaSnapshot = null;
    table.aiSnapshotTargetDate = targetDate;
    table.aiSnapshotCreatedAt = null;
    table.masterPredictionSnapshot = null;
    table.predictionSnapshot = null;
    table.snapshotBlockedReason = "target-result-already-known";
    return false;
  }

  const snapshotAt = Date.now();
  const inputs = Array.isArray(table.inputDigits) ? table.inputDigits.map(String) : [];
  if (inputs.length !== 5) return false;
  const aiSaved = state.aiFormulaLab?.[profileId] || null;
  // AI-L snapshot is rebuilt from samples strictly before targetDate. Current/live AI state is never reused for history.
  const aiFormula = buildStrictPriorAIFormula(profileId, targetDate);
  const glFormula = aiFormula ? buildStrictPriorAIGLFormula(profileId,targetDate,aiFormula) : null;
  const classicGrid = formulaGrid(inputs, getOriginalFormula());
  const aiLGrid = aiFormula ? formulaGrid(inputs, aiFormula) : null;
  const glGrid = glFormula ? formulaGrid(inputs,glFormula) : null;
  const classicResults = classicGrid ? findLResults(classicGrid) : [];
  const aiLResults = aiLGrid ? findLResults(aiLGrid) : [];
  const glResults = glGrid ? findLResults(glGrid) : [];
  const autoDecision=getHistoricalAutoFormulaDecision(profileId,targetDate,30);
  let independent = {items:[],pending:true}, pair = {items:[],pending:true}, master = {items:[],pending:true}, rankedL = [], overlap=[];
  try { independent = generateIndependentAI(profileId, targetDate, 100); } catch (error) { console.error("Independent snapshot failed", error); }
  try { pair = generatePairAI(profileId, targetDate, 100); } catch (error) { console.error("Pair snapshot failed", error); }
  if (!MASTER_AI_PAUSED) { try { master = buildStrictPriorMasterPrediction(profileId, targetDate, inputs, aiFormula, 10); } catch (error) { console.error("Master snapshot failed", error); } }
  try { rankedL = rankLResults(aiLResults.length ? aiLResults : classicResults, profileId, targetDate); } catch (error) { console.error("L+AI ranking snapshot failed", error); }
  try {
    const independentTop100 = (independent.items || []).map(x=>String(x.number));
    const independentSet = new Set(independentTop100);
    overlap = rankedL.filter(x=>independentSet.has(String(x.number))).map(x=>String(x.number));
  } catch (error) { console.error("Overlap snapshot failed", error); }

  table.predictionSnapshot = {
    version: 2,
    targetDate,
    createdAt: snapshotAt,
    sourceTableId: table.id,
    sourceTableDate: table.date,
    profileId,
    classicItems: classicResults.map(x=>String(x.number)),
    aiLFormula: aiFormula ? cloneFormula(aiFormula) : null,
    aiLVersion: aiFormula ? `prior-only-${targetDate}` : null,
    aiLItems: aiLResults.map(x=>String(x.number)),
    glFormula:glFormula?cloneFormula(glFormula):null,
    glVersion:glFormula?`prior-only-${targetDate}`:null,
    glItems:glResults.map(x=>String(x.number)),
    autoMode:autoDecision.mode,
    autoDecision:{...autoDecision,reconstructed:false,createdAt:snapshotAt},
    lAiRankingItems: rankedL.map(x=>String(x.number)),
    independentItems: (independent.items || []).map(x=>String(x.number)),
    independentTop10: (independent.items || []).slice(0,10).map(x=>String(x.number)),
    pairItems: (pair.items || []).map(x=>String(x.number)),
    pairTop10: (pair.items || []).slice(0,10).map(x=>String(x.number)),
    masterItems: MASTER_AI_PAUSED ? [] : (master.items || []).slice(0,10).map(x=>String(x.number)),
    masterWeights: MASTER_AI_PAUSED ? null : (master?.weights ? {classic:master.weights.classic, aiL:master.weights.aiL, independent:master.weights.independent, pair:master.weights.pair} : null),
    overlapItems: overlap
  };

  // Keep legacy fields for UI/backward compatibility, sourced from the same immutable timestamp.
  table.aiFormulaSnapshot = aiFormula ? cloneFormula(aiFormula) : null;
  table.aiFormulaVersion = aiSaved?.version || null;
  table.aiSnapshotTargetDate = targetDate;
  table.aiSnapshotCreatedAt = snapshotAt;
  table.masterPredictionSnapshot = (MASTER_AI_PAUSED || master?.pending) ? null : {
    targetDate,
    items:(master.items || []).slice(0,10).map(x => String(x.number)),
    weights: table.predictionSnapshot.masterWeights,
    createdAt:snapshotAt
  };
  table.snapshotBlockedReason = "";
  return true;
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
  const grid = calculateGrid(inputDigits, profileId);
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
    note: existing?.note || "สร้างจากผลวันนี้เพื่อใช้ทำนายงวดถัดไป",
    autoGeneratedFromActual: true,
    predictionTargetDate: getNextBusinessDate(actualDraw.date),
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

// V6.9.3 migration: V6.9.2 could build an auto table using the formula of the
// currently open Profile instead of the result's own Profile. The correct historical
// formulaSnapshot is already stored on the table, so we can repair the grid without
// using today's model or rewriting prediction snapshots.
function repairAutoGeneratedDailyTablesProfileFormula() {
  let repaired = 0;
  (state.dailyTables || []).forEach(table => {
    if (!table?.autoGeneratedFromActual || !Array.isArray(table.inputDigits) || table.inputDigits.length !== 5) return;
    if (!Array.isArray(table.formulaSnapshot)) return;
    const inputs = table.inputDigits.map(String);
    if (inputs.some(v => !/^\d$/.test(v))) return;
    const expectedGrid = formulaGrid(inputs, table.formulaSnapshot);
    if (!expectedGrid || gridsEqual(table.grid, expectedGrid)) return;
    table.grid = expectedGrid.map(row => [...row]);
    table.lResults = findLResults(expectedGrid);
    table.updatedAt = Date.now();
    repaired += 1;
  });
  if (repaired) {
    clearPerformanceCaches();
    activeRenderPerfSignature = "";
    invalidateViewCache();
  }
  return repaired;
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

function buildHistoryChampionSummary(originalSummary, aiSummary,glSummary, independentSummary, pairSummary, masterSummary) {
  const candidates = [
    { key:"original", label:"Classic", summary:originalSummary },
    ...(aiSummary ? [{ key:"ai", label:"AI L", summary:aiSummary }] : []),
    ...(glSummary?.total?[{key:"gl",label:"AI GL",summary:glSummary}]:[]),
    ...(independentSummary?.total ? [{ key:"independent", label:"AI อิสระ", summary:independentSummary }] : []),
    ...(pairSummary?.total ? [{ key:"pair", label:"AI Pair", summary:pairSummary }] : []),
    ...(!MASTER_AI_PAUSED && masterSummary?.total ? [{ key:"master", label:"Master AI", summary:masterSummary }] : [])
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
  const originalSummary = trustedHistorySummary(draws, selectedProfile, "classic");
  const aiSummary = trustedHistorySummary(draws, selectedProfile, "aiL");
  const glSummary=trustedHistorySummary(draws,selectedProfile,"gl");
  const independentSummary = trustedHistorySummary(draws, selectedProfile, "independent");
  const pairSummary = trustedHistorySummary(draws, selectedProfile, "pair");
  const masterSummary = MASTER_AI_PAUSED ? null : trustedHistorySummary(draws, selectedProfile, "master");
  return buildHistoryChampionSummary(originalSummary, aiSummary,glSummary, independentSummary, pairSummary, masterSummary);
}


function trustedPairedWindowSummary(draws, profileId, limit = Infinity) {
  const rows = [...(draws || [])].sort((a,b)=>b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0));
  let classicHit=0, aiHit=0, total=0;
  for (const draw of rows) {
    const c=getHistoryComparisonStatuses(draw,profileId);
    const cs=c?.classic || "pending", as=c?.aiL || "pending";
    if (cs === "pending" || as === "pending") continue;
    total++;
    if (cs === "exact" || cs === "reversed") classicHit++;
    if (as === "exact" || as === "reversed") aiHit++;
    if (total >= limit) break;
  }
  const classicRate=total?Math.round(classicHit*1000/total)/10:0;
  const aiRate=total?Math.round(aiHit*1000/total)/10:0;
  return {total,classicHit,aiHit,classicRate,aiRate,gap:Math.round((aiRate-classicRate)*10)/10};
}
function formatAILearningTime(timestamp) {
  if (!timestamp) return "ยังไม่มีรอบเรียนที่บันทึก";
  try { return new Date(timestamp).toLocaleString("th-TH",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}); } catch (_) { return "เรียนล่าสุดแล้ว"; }
}
function renderAILearningStatus(profileId, draws, originalSummary, aiSummary) {
  const id=Number(profileId), log=state.aiLearningStatus?.[id] || null;
  const w7=trustedPairedWindowSummary(draws,id,7), w30=trustedPairedWindowSummary(draws,id,30);
  const overallGap=(aiSummary?.total && originalSummary?.total) ? Math.round((aiSummary.rate-originalSummary.rate)*10)/10 : null;
  const autoDecision=getAutoFormulaDecision(id);
  let level="warmup", icon="🧠", label="กำลังสะสมข้อมูล";
  if (aiSummary?.total) {
    if (autoDecision.samples < (autoDecision.minSamples || 14)) {
      level="warmup"; icon="🧠"; label="กำลังสะสมข้อมูล AUTO";
    } else if (autoDecision.mode === "ai" || autoDecision.mode === "gl" || autoDecision.mode === "blend") {
      level="ahead"; icon="🏆"; label=autoDecision.mode === "blend" ? "AUTO BLEND • AI L + AI GL" : autoDecision.mode === "gl" ? "AI GL ถูก AUTO เลือกแล้ว" : "AI L ถูก AUTO เลือกแล้ว";
    } else if (autoDecision.margin > 0) {
      level="near"; icon="🟡"; label="AI นำแล้ว • ยังไม่ผ่าน AUTO Gate";
    } else if (autoDecision.margin === 0) {
      level="near"; icon="🟢"; label="AI เสมอ Classic • AUTO ใช้ Classic";
    } else if (w30.total >= 7 && (w30.gap >= 0 || (overallGap != null && w30.gap > overallGap + 0.5))) {
      level="chasing"; icon="🟡"; label="AI กำลังไล่ Classic";
    } else {
      level="behind"; icon="🔴"; label="AI ยังตาม Classic";
    }
  }
  const signed=v=>v==null?"—":`${v>0?"+":""}${v}%`;
  let outcome="ยังไม่มีบันทึกรอบเรียนใหม่ในเวอร์ชันนี้", outcomeClass="neutral";
  if (log) {
    if (log.outcome === "approved") { outcome="✓ รับสูตรใหม่ที่ดีกว่า"; outcomeClass="good"; }
    else if (log.outcome === "candidate-improved" || log.outcome === "first-candidate") { outcome="↗ เก็บ Candidate ที่ดีขึ้นเพื่อเรียนต่อ"; outcomeClass="good"; }
    else if (log.outcome === "protected") { outcome="🛡️ ทดลองแล้ว • คงสูตรเดิมเพื่อกันถอยหลัง"; outcomeClass="safe"; }
    else if (log.outcome === "error") { outcome="⚠ รอบเรียนล่าสุดมีข้อผิดพลาด"; outcomeClass="bad"; }
  }
  const scoreLine=log && log.previousScore!=null && log.newScore!=null ? `${log.previousScore}% → ${log.newScore}% (${signed(log.improvement)})` : "จะเริ่มแสดงหลังบันทึกผลจริงครั้งถัดไป";
  return `<div class="ai-learning-status-card ${level}">
    <div class="ai-learning-status-head"><div><small>AI LEARNING STATUS</small><h3>${icon} ${label}</h3></div><span class="ai-learning-live-dot">${log?"LEARNED":"READY"}</span></div>
    <div class="ai-learning-kpis">
      <div><span>Gap ทั้งหมด</span><b>${signed(overallGap)}</b><small>AI L ${aiSummary?.total?`${aiSummary.rate}%`:'—'} • Classic ${originalSummary?.total?`${originalSummary.rate}%`:'—'}</small></div>
      <div><span>7 งวดล่าสุด</span><b>${w7.total?signed(w7.gap):"—"}</b><small>${w7.total?`AI ${w7.aiRate}% • CLS ${w7.classicRate}%`:'รอข้อมูลคู่เทียบ'}</small></div>
      <div><span>30 งวดล่าสุด</span><b>${w30.total?signed(w30.gap):"—"}</b><small>${w30.total?`AI ${w30.aiRate}% • CLS ${w30.classicRate}%`:'รอข้อมูลคู่เทียบ'}</small></div>
    </div>
    <div class="ai-learning-event ${autoDecision.mode === "ai" || autoDecision.mode === "gl" || autoDecision.mode === "blend" ? "good" : "safe"}"><div><span>AUTO • Profile นี้</span><b>${autoDecision.mode === "blend" ? "BLEND • AI L + AI GL" : autoDecision.mode === "gl" ? "AI GL" : autoDecision.mode === "ai" ? "AI L" : "Classic L"}</b></div><small>${escapeHtml(autoDecision.reason)} • Trusted ${autoDecision.samples || 0} งวด</small></div>
    <div class="ai-learning-event ${outcomeClass}"><div><span>${outcome}</span><b>${scoreLine}</b></div><small>${log?`เรียนล่าสุด ${formatAILearningTime(log.trainedAt)} • ข้อมูล ${log.historyCount || 0} งวด${log.formulaChanged?' • สูตรเปลี่ยน':' • สูตรไม่เปลี่ยน'}`:`ระบบเรียนอัตโนมัติหลังบันทึกผลจริง • Warm-up ขั้นต่ำ 8 งวด`}</small></div>
  </div>`;
}

function renderHistoryChampion(champion) {
  if (!champion?.winner) return "";
  const winner = champion.winner;
  return `<div class="history-champion-card">
    <div class="history-champion-head"><span class="history-champion-trophy">🏆</span><div><small>History Champion</small><b>Winner: ${escapeHtml(winner.label)}</b></div><strong>${winner.summary.rate}%</strong></div>
    <div class="history-champion-scores">${champion.items.map((x,i)=>`<div class="history-champion-score ${i===0?'winner':''}"><span>${i===0?'🥇':i===1?'🥈':'🥉'} ${escapeHtml(x.label)}</span><b>${x.championScore}</b><small>Champion Score</small></div>`).join("")}</div>
    <p>คะแนนนี้ใช้เฉพาะ Verified Live + Walk-Forward (Prior-only) โดยให้น้ำหนักความแม่น 80% และจำนวนงวดที่มีข้อมูล 20%</p>
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
  const formulaMode = state.historyFormulaMode === "original" ? "original" : (state.historyFormulaMode === "ai" ? "ai" : "compare");
  const aiSaved = state.aiFormulaLab?.[selectedProfile];
  const originalFormula = getOriginalFormula();
  const aiFormula = aiSaved?.formula || null;
  const originalSummary = trustedHistorySummary(selectedActualDraws, selectedProfile, "classic");
  const aiSummary = trustedHistorySummary(selectedActualDraws, selectedProfile, "aiL");
  const glSummary = trustedHistorySummary(selectedActualDraws, selectedProfile, "gl");
  const independentSummary = trustedHistorySummary(selectedActualDraws, selectedProfile, "independent");
  const pairSummary = trustedHistorySummary(selectedActualDraws, selectedProfile, "pair");
  const masterSummary = MASTER_AI_PAUSED ? null : trustedHistorySummary(selectedActualDraws, selectedProfile, "master");
  const champion = buildHistoryChampionSummary(originalSummary, aiSummary,glSummary, independentSummary, pairSummary, masterSummary);
  // V7.09.29: History display order requested by the user. GL stays next to WIN
  // even after it gains evidence; scoring and AUTO still use the real Trusted rates.
  const engineDefs=[
    {key:"classic",label:"CLS",model:"classic",summary:originalSummary},
    {key:"aiL",label:"AIL",model:"ail",summary:aiSummary},
    {key:"independent",label:"IND",model:"ind",summary:independentSummary},
    {key:"pair",label:"PAIR",model:"pair",summary:pairSummary},
    {key:"gl",label:"GL",model:"gl",summary:glSummary}
  ];

  const resultRows = [...selectedActualDraws]
    .sort((a,b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0))
    .map(r => {
      const comparison = getHistoryDisplayComparisonStatuses(r, selectedProfile);
      const originalStatus = comparison.classic;
      const aiStatus = comparison.aiL;
      const glStatus=comparison.gl||"pending";
      const independentStatus = comparison.independent;
      const pairStatus = comparison.pair;
      const masterStatus = MASTER_AI_PAUSED ? "pending" : comparison.master;
      const basicCell = MASTER_BASIC_TEST ? masterBasicHistoryCell(selectedProfile,r.date) : {status:"pending",selected:"—",count:0,audit:true,title:""};
      const day = DAYS_SHORT[new Date(`${r.date}T12:00:00`).getDay()];
      const statusMap={classic:originalStatus,aiL:aiStatus,gl:glStatus,independent:independentStatus,pair:pairStatus};
      const available=engineDefs.filter(x=>statusMap[x.key]!=="pending"),best=available.length?Math.max(...available.map(x=>formulaStatusScore(statusMap[x.key]))):0;
      const winnerDefs=best>0?available.filter(x=>formulaStatusScore(statusMap[x.key])===best):[];
      const winner=winnerDefs.length===1?winnerDefs[0].label:winnerDefs.length>1?"TIE":"—";
      const winnerKey=winnerDefs.length===1?winnerDefs[0].model:winnerDefs.length>1?"tie":"none";
      const statusCell = (status, model="") => `<span class="status ${status} model-${model || "neutral"}">${compactHistoryStatusLabel(status)}</span>`;
      const rowWinnerClass = comparison.legacy ? " legacy-unverified" : (comparison.walkForward ? " walk-forward-prediction" : " verified-prediction");
      const deleteOpen = historyEditMode && String(historyDeleteRevealId || "") === String(r.id);
      return `<div class="history-edit-shell${historyEditMode ? " editing" : ""}${deleteOpen ? " delete-open" : ""}" data-history-edit-shell="${r.id}">
        <button type="button" class="history-minus-control" data-history-minus="${r.id}" aria-label="เตรียมลบผลวันที่ ${escapeHtml(r.date)}"><span>−</span></button>
        <button class="result-history-row formula-${formulaMode}${rowWinnerClass}" data-actual-draw="${r.id}" ${comparison.legacy ? 'title="Legacy: แสดงย้อนหลังเท่านั้น ไม่นับคะแนน"' : (comparison.walkForward ? 'title="WF: Walk-Forward ใช้เฉพาะข้อมูลก่อนวันเป้าหมาย"' : 'title="Verified Live: มี Snapshot ก่อนผลออกจริง"')}>
          <span class="result-date"><b>${compactHistoryDate(r.date)}</b><small>${day}${comparison.legacy ? ' • LEG' : (comparison.walkForward ? ' • WF' : ' • ✓')}</small></span>
          <span class="result-number-stack"><strong>${escapeHtml(r.number || "---")}</strong><b>${escapeHtml(r.twoDigit || "--")}</b></span>
          ${formulaMode === "original" ? statusCell(originalStatus,"classic") : ""}
          ${formulaMode === "ai" ? (comparison.hasAI ? statusCell(aiStatus,"ail") : '<span class="status pending model-ail">—</span>') : ""}
          ${formulaMode === "compare" ? `${engineDefs.map(x=>statusCell(statusMap[x.key],x.model)).join("")}<span class="formula-winner winner-${winnerKey}">${escapeHtml(winner)}</span>` : ""}
          ${formulaMode === "advanced" ? `${engineDefs.map(x=>statusCell(statusMap[x.key],x.model)).join("")}<span class="formula-winner winner-${winnerKey}">${escapeHtml(winner)}</span>` : ""}
        </button>
        <button type="button" class="history-inline-delete" data-history-inline-delete="${r.id}" aria-label="ลบผลวันที่ ${escapeHtml(r.date)}">Delete</button>
      </div>`;
    }).join("");

  const lRows = selectedRecords.map(r => `<article class="history-item" data-record="${r.id}">
    <div><small>${formatDateTH(r.date)} • ${DAYS_TH[new Date(`${r.date}T12:00:00`).getDay()]}${r.autoGenerated ? " • Auto Match" : ""}</small>
    <h3>${escapeHtml(r.selectedNumber || "-")} → ${escapeHtml(r.actualResult || "-")}</h3>
    <p>${escapeHtml(r.patternId || "-")} • ${escapeHtml(r.patternName || "-")} • Actual ${escapeHtml(r.actualResult || "-")}</p></div>
    <span class="status ${r.status}">${statusLabel(r.status)}</span>
  </article>`).join("");

  return `<section class="card history-hub">
    <div class="ux-page-head"><div><small>HISTORY</small><p>${escapeHtml(selectedName)} • ${selectedActualDraws.length} งวด</p></div><div class="history-head-actions"><span class="ux-count-pill">${originalSummary.total} ตรวจแล้ว</span></div></div>
    ${profileTabs()}
    <div class="history-mode-tabs">
      <button class="history-mode-btn ${activeTab === "results" ? "active" : ""}" data-history-tab="results">ผลย้อนหลัง</button>
      <button class="history-mode-btn ${activeTab === "l" ? "active" : ""}" data-history-tab="l">History L</button>
    </div>
    ${activeTab === "results" ? `
      <div class="profile-filter-summary"><b style="color:${profileColor(selectedProfile)}">${escapeHtml(selectedName)}</b><span>เปรียบเทียบ L Match</span></div>
      <div class="history-verification-note ux-history-legend"><span><b>✓ LIVE</b> Snapshot ก่อนผล</span><span><b>WF</b> Prior-only</span><span><b>LEG</b> อ้างอิงไม่นับคะแนน</span></div>
      <div class="formula-summary-grid v6-three-way">
        <div class="formula-summary original"><span>สูตรดั้งเดิม</span><b>${originalSummary.rate}%</b><small>${originalSummary.hit}/${originalSummary.total} งวด</small></div>
        <div class="formula-summary ai"><span>AI L</span><b>${aiSummary ? `${aiSummary.rate}%` : "—"}</b><small>${aiSummary ? `${aiSummary.hit}/${aiSummary.total} งวด` : "ยังไม่มีสูตร AI"}</small></div>
        <div class="formula-summary gl"><span>AI GL • Hybrid</span><b>${glSummary.total?`${glSummary.rate}%`:"—"}</b><small>${glSummary.total?`${glSummary.hit}/${glSummary.total} งวด`:"รอ Strict WF ≥ 8 งวด"}</small></div>
        <div class="formula-summary independent"><span>AI อิสระ Top10</span><b>${independentSummary.total ? `${independentSummary.rate}%` : "—"}</b><small>${independentSummary.total ? `${independentSummary.hit}/${independentSummary.total} งวด` : "ต้องมี History ก่อนหน้า ≥ 8 งวด"}</small></div>
        <div class="formula-summary pair"><span>AI Pair • TEST</span><b>${pairSummary.total ? `${pairSummary.rate}%` : "—"}</b><small>${pairSummary.total ? `${pairSummary.hit}/${pairSummary.total} งวด` : "Pair Relationship ต้องมี ≥ 8 งวด"}</small></div>
      </div>
      ${renderHistoryChampion(champion)}
      ${renderAILearningStatus(selectedProfile, selectedActualDraws, originalSummary, aiSummary)}
      <div class="history-manager-panel history-ref-1">
        <div class="formula-view-tabs public-history-tabs">
          <button class="formula-view-btn ${formulaMode === "compare" ? "active" : ""}" data-formula-mode="compare">Compare</button>
          <button class="formula-view-btn ${formulaMode === "original" ? "active" : ""}" data-formula-mode="original">Classic L</button>
          <button class="formula-view-btn ${formulaMode === "ai" ? "active" : ""}" data-formula-mode="ai">AI L</button>
          <button class="formula-view-btn ${formulaMode === "advanced" ? "active" : ""}" data-formula-mode="advanced">Advanced</button>
        </div>
        <div class="history-action-grid">
          <button id="btnAddActualDraw" class="btn primary full actual-add-button" style="--profile-color:${profileColor(selectedProfile)}">＋ บันทึกผล</button>
          <button id="btnImportImageSandbox" class="btn secondary full import-image-button">📷 นำเข้ารูป</button>
        </div>
        <input id="importImageInput" type="file" accept="image/*,.heic,.heif" multiple hidden>
        <p class="import-sandbox-note">Import Sandbox: อ่านรูปและให้ตรวจสอบก่อนเท่านั้น ยังไม่เขียนลง History จนกด “ยืนยันบันทึก”</p>
        <div class="history-table-toolbar">
          <div><b>History</b><small>${resultRows ? `${selectedActualDraws.length} งวด` : "ยังไม่มีข้อมูล"}</small></div>
          ${selectedActualDraws.length ? `<button type="button" id="btnHistoryEdit" class="history-edit-toggle${historyEditMode ? " active" : ""}">${historyEditMode ? "Done" : "Edit"}</button>` : ""}
        </div>
        <div class="result-history-table formula-table-${formulaMode}${historyEditMode ? " history-editing" : ""}">
          <div class="result-history-head formula-${formulaMode}"><span>Date</span><span class="history-number-head">3D&nbsp;&nbsp;2D</span>${formulaMode === "original" ? "<span>CLS</span>" : ""}${formulaMode === "ai" ? "<span>AIL</span>" : ""}${(formulaMode === "compare"||formulaMode === "advanced") ? `${engineDefs.map(x=>`<span><b>${x.label}</b><small>${x.summary?.total?`${x.summary.rate}%`:"—"}</small></span>`).join("")}<span>Win</span>` : ""}</div>
          ${resultRows || `<div class="empty-card flat visible-empty">ยังไม่มีผลย้อนหลังของ ${escapeHtml(selectedName)}</div>`}
        </div>
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

function getTrustedProfileConfidenceRows(profileId) {
  // V7.07 trusted-only Profile AI Confidence.
  // The scoring path is intentionally isolated from state.records and retrospective formula tests.
  // A row is admitted only when the canonical History gate proves Verified Live or strict WF Prior-only.
  const id = Number(profileId);
  const draws = (state.actualDraws || [])
    .filter(d => Number(d.profileId ?? 0) === id && /^\d{4}-\d{2}-\d{2}$/.test(String(d.date || "")))
    .sort((a,b) => String(a.date).localeCompare(String(b.date)) || Number(a.createdAt || 0) - Number(b.createdAt || 0));
  const rows = [];
  let blocked = 0;
  for (const draw of draws) {
    const targetDate = String(draw.date || "").slice(0,10);
    const c = getHistoryComparisonStatuses(draw, id);
    if (!c?.trusted || (!c.verified && !c.walkForward)) { blocked++; continue; }

    // Defense in depth: re-prove the prior-only date boundary here as well, even though
    // getUniversalPredictionSnapshot/getWalkForwardRecord already enforce it.
    let sourceDate = "", trainedThrough = "", source = "";
    if (c.verified) {
      const snap = getUniversalPredictionSnapshot(id, targetDate, draw);
      sourceDate = String(snap?.sourceTableDate || c.table?.date || "").slice(0,10);
      if (!snap || !/^\d{4}-\d{2}-\d{2}$/.test(sourceDate) || sourceDate >= targetDate) { blocked++; continue; }
      source = "verified-live";
    } else {
      const wf = c.walkForwardRecord || getWalkForwardRecord(id, draw);
      sourceDate = String(wf?.sourceTableDate || "").slice(0,10);
      trainedThrough = String(wf?.trainedThrough || sourceDate || "").slice(0,10);
      const strict = Boolean(wf && String(wf.methodology || "") === "walk-forward-adaptive-memory-prior-only" &&
        /^\d{4}-\d{2}-\d{2}$/.test(sourceDate) && sourceDate < targetDate &&
        /^\d{4}-\d{2}-\d{2}$/.test(trainedThrough) && trainedThrough < targetDate);
      if (!strict) { blocked++; continue; }
      source = "walk-forward";
    }

    // Profile AI Confidence follows the strict prior-only AI-L result when it existed for that target.
    // During AI warm-up, Classic is the only fair pre-result profile output, so it is the trusted fallback.
    const aiStatus = String(c.aiL || "pending");
    const classicStatus = String(c.classic || "pending");
    const engine = aiStatus !== "pending" ? "aiL" : (classicStatus !== "pending" ? "classic" : "");
    const status = engine ? String(c[engine] || "pending") : "pending";
    if (!engine || status === "pending") { blocked++; continue; }
    rows.push({
      draw, date:targetDate, status, engine, source, sourceDate, trainedThrough,
      hit:status === "exact" || status === "reversed" || status === "swap",
      aiLStatus:aiStatus, classicStatus
    });
  }
  return {rows, blocked};
}

function getProfileAIDayScore(profileId, days, trustedPack = null) {
  const windowDays = [7, 14, 30, 60, 90, 180].includes(Number(days)) ? Number(days) : 7;
  const pack = trustedPack || getTrustedProfileConfidenceRows(profileId);
  const rows = Array.isArray(pack?.rows) ? pack.rows : [];
  if (!rows.length) return { score:0, samples:0, hits:0, trusted:true };
  const anchorDate = String(rows.at(-1).date || "");
  const startDate = shiftIsoDate(anchorDate, -(windowDays - 1));
  const sample = rows.filter(r => String(r.date) >= startDate && String(r.date) <= anchorDate);
  if (!sample.length) return { score:0, samples:0, hits:0, trusted:true };
  const hits = sample.reduce((sum, row) => sum + (row.hit ? 1 : 0), 0);
  return { score:(hits * 100) / sample.length, samples:sample.length, hits, trusted:true };
}

function getTrustedProfileFormulaSignal(trustedPack, limit = 30) {
  const rows = (trustedPack?.rows || []).filter(r => String(r.aiLStatus || "pending") !== "pending").slice(-Math.max(1, Number(limit) || 30));
  if (!rows.length) return {score:0, samples:0, hits:0};
  const hits = rows.reduce((sum, row) => sum + ((row.aiLStatus === "exact" || row.aiLStatus === "reversed" || row.aiLStatus === "swap") ? 1 : 0), 0);
  return {score:(hits * 100) / rows.length, samples:rows.length, hits};
}

function getProfileAIRecommendation(profileId, options = null) {
  const id = Number(profileId);
  const basePack = getTrustedProfileConfidenceRows(id);
  const beforeDate = /^\d{4}-\d{2}-\d{2}$/.test(String(options?.beforeDate || "")) ? String(options.beforeDate) : "";
  const trustedPack = beforeDate
    ? {...basePack, rows:(basePack.rows || []).filter(r => String(r.date || "") < beforeDate)}
    : basePack;
  const trustedRows = trustedPack.rows || [];
  const w7 = getProfileAIDayScore(id, 7, trustedPack);
  const w14 = getProfileAIDayScore(id, 14, trustedPack);
  const w30 = getProfileAIDayScore(id, 30, trustedPack);
  const w90 = getProfileAIDayScore(id, 90, trustedPack);
  const w180 = getProfileAIDayScore(id, 180, trustedPack);
  const windowScores = [w7, w14, w30, w90, w180].filter(x => x.samples > 0).map(x => x.score);
  const mean = windowScores.length ? windowScores.reduce((sum, x) => sum + x, 0) / windowScores.length : 0;
  const variance = windowScores.length ? windowScores.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / windowScores.length : 0;
  const consistency = windowScores.length ? Math.max(0, 100 - Math.sqrt(variance) * 2.5) : 0;

  // Only admitted trusted rows count toward evidence confidence. Legacy/history record count is never used.
  const trustedSamples = trustedRows.length;
  const sampleConfidence = trustedSamples ? Math.min(100, Math.sqrt(Math.min(trustedSamples, 180) / 180) * 100) : 0;

  // Former savedAI.test.rate was retrospective experiment output and is forbidden here.
  // Formula signal is rebuilt exclusively from trusted AI-L outcomes that existed before each result.
  const trustedFormula = getTrustedProfileFormulaSignal(trustedPack, 30);
  const formulaSignal = trustedFormula.samples ? trustedFormula.score : 0;
  const trend = w7.score - w30.score;
  const trendSignal = Math.max(0, Math.min(100, 50 + (w7.score - w30.score) * 0.90 + (w14.score - w90.score) * 0.35));
  const raw = (w7.score * 0.22) + (w14.score * 0.18) + (w30.score * 0.14) +
    (w90.score * 0.10) + (w180.score * 0.08) + (consistency * 0.08) +
    (sampleConfidence * 0.05) + (formulaSignal * 0.10) + (trendSignal * 0.05);
  const evidenceReady = trustedSamples >= PROFILE_AI_MIN_TRUSTED_EVIDENCE;
  const confidence = evidenceReady ? Math.max(0, Math.min(99, Math.round(raw))) : 0;
  const trustedHits = trustedRows.reduce((sum,row)=>sum+(row.hit?1:0),0);
  const trustedRate = trustedSamples ? Math.round(trustedHits * 1000 / trustedSamples) / 10 : 0;
  const verifiedSamples = trustedRows.filter(r=>r.source === "verified-live").length;
  const walkForwardSamples = trustedRows.filter(r=>r.source === "walk-forward").length;
  const trendLabel = !evidenceReady ? `Trusted ${trustedSamples}/${PROFILE_AI_MIN_TRUSTED_EVIDENCE}` : trend >= 10 ? "แนวโน้มดีขึ้น" : trend <= -10 ? "แนวโน้มลดลง" : "แนวโน้มคงที่";
  const savedAI = state.aiFormulaLab?.[id];
  return {
    profileId:id,
    name: state.profiles[id] || `Profile ${id + 1}`,
    score:Math.round(trustedRate),
    score10:0,
    score30:Math.round(w30.score),
    scoreAll:Math.round(trustedRate),
    samples:trustedSamples,
    trustedSamples,
    trustedHits,
    trustedRate,
    verifiedSamples,
    walkForwardSamples,
    blockedUntrusted:Number(trustedPack.blocked || 0),
    evidenceReady,
    statScore:Math.round(trustedRate),
    confidence,
    trend,
    trendLabel,
    hasAIFormula: Boolean(savedAI?.formula),
    aiWindows: { day7:w7, day14:w14, day30:w30, day90:w90, day180:w180 },
    consistency: Math.round(consistency),
    sampleConfidence: Math.round(sampleConfidence),
    formulaSignal: Math.round(formulaSignal),
    formulaTrustedSamples:trustedFormula.samples,
    trendSignal: Math.round(trendSignal),
    confidenceSource:"trusted-only"
  };
}


function getTodayTopProfileRecommendation(profileId, targetDate = isoDate()) {
  const id = Number(profileId);
  const target = /^\d{4}-\d{2}-\d{2}$/.test(String(targetDate || "")) ? String(targetDate) : isoDate();
  const trustedPack = getTrustedProfileConfidenceRows(id);
  // Today's ranking is strictly prior-only: never admit a row from the target date or later.
  const rows = (trustedPack.rows || []).filter(r => String(r.date || "") < target);
  const samples = rows.length;
  const ready = samples >= PROFILE_AI_MIN_TRUSTED_EVIDENCE;
  const hits = rows.reduce((sum, r) => sum + (r.hit ? 1 : 0), 0);
  const overallRate = samples ? hits * 100 / samples : 0;

  const recent = (limit) => rows.slice(-Math.max(1, Number(limit) || 1));
  const rate = (sample) => sample.length ? sample.reduce((sum,r)=>sum+(r.hit?1:0),0) * 100 / sample.length : 0;
  const recent14 = recent(14);
  const recent30 = recent(30);
  const recent14Rate = rate(recent14);
  const recent30Rate = rate(recent30);

  const targetWeekday = new Date(`${target}T12:00:00`).getDay();
  const weekdayRows = rows.filter(r => new Date(`${r.date}T12:00:00`).getDay() === targetWeekday);
  const weekdayRate = rate(weekdayRows);

  // Keep Today Top 5 anchored to the same trusted evidence philosophy as AI Confidence,
  // while allowing today's weekday/recent context to re-order otherwise similar profiles.
  const coverage = Math.min(100, Math.sqrt(Math.min(samples, 180) / 180) * 100);
  const stability = Math.max(0, 100 - Math.abs(recent14Rate - recent30Rate) * 2);
  const todayScoreRaw = (overallRate * 0.30) + (recent14Rate * 0.25) + (recent30Rate * 0.15) +
    (weekdayRate * 0.20) + (coverage * 0.05) + (stability * 0.05);
  const todayScore = ready ? Math.max(0, Math.min(99, Math.round(todayScoreRaw))) : 0;

  return {
    profileId:id,
    name:state.profiles[id] || `Profile ${id + 1}`,
    targetDate:target,
    evidenceReady:ready,
    trustedSamples:samples,
    trustedHits:hits,
    overallRate:Math.round(overallRate * 10) / 10,
    recent14Rate:Math.round(recent14Rate * 10) / 10,
    recent30Rate:Math.round(recent30Rate * 10) / 10,
    weekdayRate:Math.round(weekdayRate * 10) / 10,
    weekdaySamples:weekdayRows.length,
    todayScore,
    source:"trusted-prior-only"
  };
}

function getTodayTrustedTopProfiles(limit = 5, targetDate = isoDate()) {
  return state.profiles.map((_, i) => getTodayTopProfileRecommendation(i, targetDate))
    .sort((a,b) => Number(b.evidenceReady) - Number(a.evidenceReady) || b.todayScore - a.todayScore ||
      b.recent14Rate - a.recent14Rate || b.weekdayRate - a.weekdayRate || b.trustedSamples - a.trustedSamples || a.profileId - b.profileId)
    .slice(0, Math.max(1, Number(limit) || 5));
}

function renderTodayTrustedTopProfiles() {
  const targetDate = isoDate();
  const top = getTodayTrustedTopProfiles(5, targetDate);
  if (!top.length) return "";
  const medals = ["🥇","🥈","🥉","4","5"];
  return `<div class="today-top-profiles-card">
    <div class="today-top-profiles-head"><div><small>AI TODAY</small><h3>Top 5 วันนี้</h3><p>${formatDateTH(targetDate)} • ใช้ข้อมูลถึงวันก่อนหน้า</p></div></div>
    <div class="today-top-profiles-list">${top.map((item,index)=>`<button type="button" class="today-top-profile-row ${item.profileId === Number(state.activeProfile) ? "active" : ""}" data-ranking-profile="${item.profileId}" style="--profile-color:${profileColor(item.profileId)}">
      <span class="today-top-rank">${medals[index] || index+1}</span>
      <span class="today-top-name"><b>${escapeHtml(item.name)}</b><small>${item.evidenceReady ? `Trusted ${item.trustedSamples} งวด` : `Trusted ${item.trustedSamples}/${PROFILE_AI_MIN_TRUSTED_EVIDENCE}`}</small></span>
      <span class="today-top-score"><strong>${item.evidenceReady ? item.todayScore : "—"}</strong><small>Today Score</small></span>
    </button>`).join("")}</div>
  </div>`;
}

// V7.09.17 — Ranking update badges are TODAY-only.
// "Updated" means this profile has a complete 3D+2D result saved in History
// for the device's local calendar date today. Older History never counts as
// updated for today's dashboard.
function getProfileRankingUpdateMeta() {
  const rows = (state.actualDraws || []).filter(r => actualDrawDateOrderKey(r?.date) > 0);
  const todayIso = isoDate();
  const todayKey = actualDrawDateOrderKey(todayIso);
  const todayRows = rows.filter(r => actualDrawDateOrderKey(r?.date) === todayKey);
  const latestStamp = todayRows.reduce((max, r) => Math.max(max, Number(r?.updatedAt || r?.createdAt || 0)), 0);
  const byProfile = new Map();

  state.profiles.forEach((_, profileId) => {
    const profileRows = rows.filter(r => Number(r?.profileId ?? 0) === Number(profileId));
    if (!profileRows.length) {
      byProfile.set(profileId, {status:"nodata", label:"No Data", latest:null, today:null});
      return;
    }

    const latest = [...profileRows].sort(compareActualDrawRecency)[0] || null;
    const today = [...profileRows]
      .filter(r => actualDrawDateOrderKey(r?.date) === todayKey)
      .sort(compareActualDrawRecency)[0] || null;
    const todayComplete = !!today
      && /^\d{3}$/.test(String(today?.number || ""))
      && /^\d{2}$/.test(String(today?.twoDigit || ""));

    byProfile.set(profileId, todayComplete
      ? {status:"updated", label:"Updated", latest, today}
      : {status:"pending", label:"Pending", latest, today});
  });

  const updatedCount = [...byProfile.values()].filter(x => x.status === "updated").length;
  let timeLabel = "";
  if (latestStamp > 0) {
    const d = new Date(latestStamp);
    if (!Number.isNaN(d.getTime())) timeLabel = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  }
  return {todayIso, todayKey, timeLabel, updatedCount, total:state.profiles.length, byProfile};
}

function renderRankingUpdateBadge(meta) {
  if (!meta) return "";
  return `<span class="ranking-update-badge ${meta.status}"><i></i>${meta.label}</span>`;
}

function getProfileAIRankScore(item, updateStatus = "pending") {
  if (!item?.evidenceReady) return 0;
  const hitNorm = Math.max(0, Math.min(100, Number(item.trustedRate || 0) * 5)); // 20% trusted hit rate = 100
  const confidenceNorm = Math.max(0, Math.min(100, Number(item.confidence || 0)));
  const sampleNorm = Math.max(0, Math.min(100, Math.sqrt(Math.min(Number(item.trustedSamples || 0), 180) / 180) * 100));
  const freshnessNorm = updateStatus === "updated" ? 100 : updateStatus === "pending" ? 35 : 0;
  // Trusted Hit Rate is deliberately dominant; confidence remains useful but can no longer win by itself.
  return Math.round((hitNorm * 0.62) + (confidenceNorm * 0.23) + (sampleNorm * 0.12) + (freshnessNorm * 0.03));
}

function getProfileRankMovement(currentRanking, updateMeta) {
  const today = String(updateMeta?.todayIso || isoDate());
  const previous = state.profiles.map((_, i) => {
    const item = getProfileAIRecommendation(i, {beforeDate:today});
    return {...item, rankScore:getProfileAIRankScore(item, "pending")};
  }).sort((a,b) => Number(b.evidenceReady) - Number(a.evidenceReady) || b.rankScore - a.rankScore || b.trustedRate - a.trustedRate || b.confidence - a.confidence || b.trustedSamples - a.trustedSamples || a.profileId - b.profileId);
  const oldRank = new Map(previous.map((item,index)=>[Number(item.profileId), index+1]));
  const movement = new Map();
  currentRanking.forEach((item,index)=>{
    const before = Number(oldRank.get(Number(item.profileId)) || index+1);
    const now = index+1;
    movement.set(Number(item.profileId), before - now);
  });
  return movement;
}

function renderProfileRankMovement(delta) {
  const n = Number(delta || 0);
  if (!n) return "";
  return n > 0
    ? `<span class="rank-move up" title="อันดับขึ้น ${n}">↑${n}</span>`
    : `<span class="rank-move down" title="อันดับลง ${Math.abs(n)}">↓${Math.abs(n)}</span>`;
}

function renderProfileRanking() {
  const config = getRankingConfig();
  const requestedMode = ["manual", "score", "ai"].includes(state.analysisSortMode) ? state.analysisSortMode : "ai";
  const mode = requestedMode;
  const updateMeta = getProfileRankingUpdateMeta();
  let ranking = state.profiles.map((_, i) => mode === "ai" ? getProfileAIRecommendation(i) : getProfileAnalysisScore(i));
  if (mode === "score") ranking.sort((a,b) => b.score - a.score || b.samples - a.samples || a.profileId - b.profileId);
  // AI Recommend uses a trusted composite: Hit Rate is dominant, then AI Confidence, evidence size and today's update status.
  if (mode === "ai") {
    ranking = ranking.map(item => ({...item, rankScore:getProfileAIRankScore(item, updateMeta.byProfile.get(item.profileId)?.status)}));
    ranking.sort((a,b) => Number(b.evidenceReady) - Number(a.evidenceReady) || b.rankScore - a.rankScore || b.trustedRate - a.trustedRate || b.confidence - a.confidence || b.trustedSamples - a.trustedSamples || a.profileId - b.profileId);
  }
  const rankMovement = mode === "ai" ? getProfileRankMovement(ranking, updateMeta) : new Map();
  const championProfileId = mode === "ai" && ranking[0]?.evidenceReady ? ranking[0].profileId : null;
  const summary = `<div class="ranking-update-summary ${updateMeta.updatedCount ? "" : "empty"}"><span>↻</span><b>${updateMeta.timeLabel ? `Last updated ${escapeHtml(updateMeta.timeLabel)}` : "Today"}</b><i></i><span>${updateMeta.updatedCount}/${updateMeta.total} profiles updated today</span></div>`;
  return `<div class="analysis-ranking">
    <div class="analysis-ranking-head"><h3>Real-time Profile Ranking</h3></div>
    ${summary}
    <div class="analysis-sort-toggle analysis-sort-toggle-3">
      <button type="button" class="${mode === "manual" ? "active" : ""}" data-analysis-sort="manual">Manual</button>
      <button type="button" class="${mode === "score" ? "active" : ""}" data-analysis-sort="score">Stat Score</button>
      <button type="button" class="${mode === "ai" ? "active ai-active" : ""}" data-analysis-sort="ai">AI Recommend</button>
    </div>
    <div class="profile-ranking-list">${ranking.map((item,index)=>{
      const isChampion = mode === "ai" && item.profileId === championProfileId;
      const statusBadge = renderRankingUpdateBadge(updateMeta.byProfile.get(item.profileId));
      const aiEvidenceText = item.evidenceReady
        ? `Trusted ${item.trustedSamples} draws`
        : `Trusted ${item.trustedSamples}/${PROFILE_AI_MIN_TRUSTED_EVIDENCE}`;
      const scoreEvidenceText = item.samples
        ? `${item.samples} draws • 10 draws ${item.score10}% • 30 draws ${item.score30}%`
        : "Not enough data";
      const movementBadge = mode === "ai" ? renderProfileRankMovement(rankMovement.get(item.profileId)) : "";
      return `<button type="button" class="profile-ranking-row ${item.profileId === Number(state.activeProfile) ? "active" : ""} ${isChampion ? "ai-champion" : ""}" data-ranking-profile="${item.profileId}" style="--profile-color:${profileColor(item.profileId)}">
        <span class="rank-number"><span class="rank-position">${isChampion ? `<span class="rank-trophy" aria-label="AI Champion">🏆</span>` : (mode === "manual" ? item.profileId + 1 : index + 1)}</span></span>
        <span class="rank-profile"><b>${escapeHtml(item.name)}${movementBadge}${isChampion ? `<span class="rank-champion-badge">CHAMPION</span>` : ""}</b><small><span>${mode === "ai" ? aiEvidenceText : scoreEvidenceText}</span>${statusBadge}</small></span>
        <span class="rank-score"><strong>${mode === "ai" ? (item.evidenceReady ? item.rankScore : "—") : `${item.score}%`}</strong><small>${mode === "ai" ? "Rank Score" : "Stat Score"}</small>${mode === "ai" ? `<em>Hit ${item.trustedRate}% • AI ${item.confidence}%</em>` : ""}</span>
      </button>`;
    }).join("")}</div>
    ${mode === "ai" ? "" : `<p class="analysis-ranking-note">Stat Score is for profile ranking only and does not guarantee results.</p>`}
  </div>`;
}

function getHistoryComparisonStatuses(draw, profileId = Number(draw?.profileId ?? 0)) {
  // Trusted scoring source: Verified Live first; otherwise fair Walk-Forward reconstruction.
  // Legacy retrospective recalculation is display-only and never enters scoring.
  const selectedProfile=Number(profileId), table=getPredictionTable(selectedProfile,draw?.date,draw);
  const live=getUniversalPredictionSnapshot(selectedProfile,draw?.date,draw);
  if(live){
    const aiLResult=aiLHistoryStatus(draw,selectedProfile);
    const glWF=Array.isArray(live.glItems)&&live.glItems.length?null:getWalkForwardRecord(selectedProfile,draw);
    const glStatus=Array.isArray(live.glItems)&&live.glItems.length?snapshotItemsStatus(draw.number,live.glItems):(glWF?.statuses?.gl||"pending");
    return {table,verified:true,walkForward:false,trusted:true,hasAI:aiLResult.status!=="pending",classic:classicSnapshotHistoryStatus(draw,selectedProfile).status,aiL:aiLResult.status,gl:glStatus,glWalkForward:Boolean(glWF&&glStatus!=="pending"),independent:independentHistoryStatus(draw.number,selectedProfile,draw.date,10).status,pair:pairHistoryStatus(draw.number,selectedProfile,draw.date,10).status,master:masterSnapshotHistoryStatus(draw.number,selectedProfile,draw.date).status};
  }
  const wf=getWalkForwardRecord(selectedProfile,draw);
  if(wf?.statuses){
    return {table,verified:false,walkForward:true,trusted:true,hasAI:wf.statuses.aiL!=="pending",classic:wf.statuses.classic||"pending",aiL:wf.statuses.aiL||"pending",gl:wf.statuses.gl||"pending",independent:wf.statuses.independent||"pending",pair:wf.statuses.pair||"pending",master:wf.statuses.master||"pending",walkForwardRecord:wf};
  }
  return {table,verified:false,walkForward:false,trusted:false,hasAI:false,classic:"pending",aiL:"pending",gl:"pending",independent:"pending",pair:"pending",master:"pending"};
}

function getLegacyHistoryComparisonStatuses(draw, profileId = Number(draw?.profileId ?? 0)) {
  // DISPLAY-ONLY compatibility for records created before Universal Prediction Lock.
  // These values restore the old History view but are explicitly NOT used by winner summaries,
  // Champion, Analysis ranking, or any verified prediction score.
  const selectedProfile = Number(profileId);
  const table = getPredictionTable(selectedProfile, draw?.date, draw);
  const originalFormula = getOriginalFormula();
  let classic = "pending", aiL = "pending", independent = "pending", pair = "pending", master = "pending";

  if (table?.inputDigits) {
    classic = formulaHistoryStatus(draw.number, table.inputDigits, originalFormula);
    const legacyFormula = Array.isArray(table.aiFormulaSnapshot)
      ? table.aiFormulaSnapshot
      : (table.formulaMode === "ai" && Array.isArray(table.formulaSnapshot) ? table.formulaSnapshot : null);
    if (legacyFormula) aiL = formulaHistoryStatus(draw.number, table.inputDigits, legacyFormula);
  }

  try {
    const free = generateIndependentAI(selectedProfile, draw?.date, 10);
    if (!free?.pending) independent = snapshotItemsStatus(draw.number, free.items || []);
  } catch (_) {}

  try {
    const meta = masterHistoryStatus(draw.number, selectedProfile, draw?.date, 10);
    if (meta?.status) master = meta.status;
  } catch (_) {}

  return {table, verified:false, legacy:true, hasAI:aiL !== "pending", classic, aiL,gl:"pending", independent, pair, master};
}

function getHistoryDisplayComparisonStatuses(draw, profileId = Number(draw?.profileId ?? 0)) {
  const trusted = getHistoryComparisonStatuses(draw, profileId);
  if (trusted.verified) return {...trusted, legacy:false};
  if (trusted.walkForward) return {...trusted, legacy:false};

  // During WF self-recovery, preserve the user's last saved AI rows on screen only.
  // These rows are explicitly untrusted and therefore excluded from all scoring/learning.
  const recoveryRow = getWalkForwardRecoveryDisplayRecord(profileId, draw);
  if (recoveryRow?.statuses) {
    return {
      table: getPredictionTable(Number(profileId), draw?.date, draw),
      verified:false, walkForward:false, trusted:false, legacy:false, recoveryDisplayOnly:true,
      hasAI:recoveryRow.statuses.aiL !== "pending",
      classic:recoveryRow.statuses.classic || "pending",
      aiL:recoveryRow.statuses.aiL || "pending",
      gl:recoveryRow.statuses.gl||"pending",
      independent:recoveryRow.statuses.independent || "pending",
      pair:recoveryRow.statuses.pair||"pending",
      master:recoveryRow.statuses.master || "pending",
      walkForwardRecord: recoveryRow
    };
  }
  return getLegacyHistoryComparisonStatuses(draw, profileId);
}

function getRecentAIWinnerSummary(days = 7) {
  // V6.8.4 — History/Analysis canonical sync.
  // Analysis MUST score the same visible statuses as History for every Profile and every formula.
  // Future-dated / malformed actual results are ignored so one bad import cannot shift the whole window.
  // Exact/Reversed are both Hits. Every system that Hits gets +1 independently;
  // multiple simultaneous Hits are recorded as a shared Hit, not a score-cancelling tie.
  const allowedDays = [7, 14, 30, 60, 90, 180];
  const windowDays = allowedDays.includes(Number(days)) ? Number(days) : 7;
  const today = isoDate();
  const all = (state.actualDraws || [])
    .filter(r => /^\d{3}$/.test(String(r.number || ""))
      && /^\d{4}-\d{2}-\d{2}$/.test(String(r.date || ""))
      && String(r.date) <= today
      && Number.isInteger(Number(r.profileId ?? 0))
      && Number(r.profileId ?? 0) >= 0)
    .sort((a,b) => String(a.date).localeCompare(String(b.date)) || Number(a.createdAt || 0) - Number(b.createdAt || 0));
  const emptyCounts = {classic:0, aiL:0,gl:0, independent:0, pair:0, master:0};
  if (!all.length) return {windowDays, windowMode:windowDays===7?"draws":"days", anchorDate:null, startDate:null, evaluated:0, tie:0, noWinner:0, counts:emptyCounts, profileWins:{classic:{},aiL:{},gl:{},independent:{},pair:{},master:{}}, details:[], champion:null};

  const anchorDate = String(all.at(-1).date);
  // V6.9.3: default 7 = latest 7 actual draw dates (7 งวด), not 7 calendar days.
  const recentDrawDates = [...new Set(all.map(r => String(r.date)))].sort();
  const sevenDrawDates = windowDays === 7 ? recentDrawDates.slice(-7) : null;
  const sevenDrawDateSet = sevenDrawDates ? new Set(sevenDrawDates) : null;
  const startDate = windowDays === 7 ? (sevenDrawDates?.[0] || anchorDate) : shiftIsoDate(anchorDate, -(windowDays - 1));
  const periodDraws = windowDays === 7 ? all.filter(r => sevenDrawDateSet.has(String(r.date))) : all.filter(r => String(r.date) >= startDate && String(r.date) <= anchorDate);
  const windowMode = windowDays === 7 ? "draws" : "days";
  const counts = {...emptyCounts};
  const profileWins = {classic:{}, aiL:{},gl:{}, independent:{}, pair:{}, master:{}};
  const labels = {classic:"สูตรเดิม", aiL:"AI L",gl:"AI GL", independent:"AI อิสระ", pair:"AI Pair", master:"Master AI"};
  const isHit = status => status === "exact" || status === "reversed" || status === "swap";
  let evaluated = 0, tie = 0, noWinner = 0;
  const details = [];

  periodDraws.forEach(r => {
    const profileId = Number(r.profileId ?? 0);
    // Single source of truth: use the exact status resolver that History renders.
    // This includes verified/live, walk-forward, and legacy historical display fallback.
    const comparison = getHistoryDisplayComparisonStatuses(r, profileId);
    if (!comparison.table?.inputDigits) return; // same History eligibility rule
    const statuses = {
      classic: comparison.classic,
      aiL: comparison.aiL,
      gl:comparison.gl||"pending",
      independent: comparison.independent,
      pair: comparison.pair,
      master: comparison.master
    };
    const available = Object.entries(statuses).filter(([key,status]) => status !== "pending" && (!MASTER_AI_PAUSED || key !== "master"));
    if (!available.length) return;
    evaluated += 1;
    const hitKeys = available.filter(([,status]) => isHit(status)).map(([key]) => key);
    // V6.10.40-R20 — Competition points follow actual Hits only.
    // Miss is always Miss and earns no point. If 2+ systems Hit/Rev together,
    // only those tied Hit systems receive +1 equally and History shows green TIE.
    const bestScore = Math.max(...available.map(([,status]) => formulaStatusScore(status)));
    const pointKeys = bestScore > 0
      ? available.filter(([,status]) => formulaStatusScore(status) === bestScore).map(([key]) => key)
      : [];
    pointKeys.forEach(key => {
      counts[key] += 1;
      profileWins[key][profileId] = (profileWins[key][profileId] || 0) + 1;
    });

    let resultType = "no-winner", winnerKey = null;
    if (pointKeys.length === 1) {
      resultType = "winner";
      winnerKey = pointKeys[0];
    } else if (pointKeys.length > 1) {
      resultType = "tie";
      tie += 1;
    } else {
      noWinner += 1;
    }
    details.push({
      id:r.id, date:String(r.date), profileId,
      profileName:state.profiles[profileId] || `Profile ${profileId+1}`,
      number:String(r.number), statuses, hitKeys, resultType, winnerKey,
      winnerLabel:pointKeys.length ? pointKeys.map(key=>labels[key]).join(" + ") : "ไม่มีผู้ชนะ"
    });
  });

  details.sort((a,b) => String(b.date).localeCompare(String(a.date)) || a.profileId - b.profileId);
  const ranking = Object.entries(counts).map(([key,wins]) => ({key,label:labels[key],wins})).sort((a,b)=>b.wins-a.wins || a.label.localeCompare(b.label));
  const bestWins = ranking[0]?.wins || 0;
  const best = ranking.filter(x => x.wins === bestWins && bestWins > 0);
  const champion = best.length === 1 ? best[0] : best.length > 1 ? {key:"tie", label:"คะแนน Hit เท่ากัน", wins:bestWins} : null;
  return {windowDays, windowMode, anchorDate, startDate, evaluated, tie, noWinner, counts, profileWins, details, ranking, champion};
}

function getDailyAIWinnerView(summary, selectedDate) {
  const details = (summary.details || []).filter(d => d.date === selectedDate).sort((a,b)=>a.profileId-b.profileId);
  const aiDefs = [
    {key:"classic", label:"Classic L"},
    {key:"aiL", label:"AI L"},
    {key:"gl",label:"AI GL • HYBRID"},
    {key:"independent", label:"AI อิสระ"},
    {key:"pair", label:"AI Pair • TEST"}
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
  const windowDays = [7,14,30,60,90,180].includes(Number(state.analysisWinWindow)) ? Number(state.analysisWinWindow) : 7;
  const s = getRecentAIWinnerSummary(windowDays);
  const labels = {classic:"สูตรเดิม", aiL:"AI L",gl:"AI GL", independent:"AI อิสระ", pair:"AI Pair", master:"Master AI"};
  const rows = (MASTER_AI_PAUSED ? ["gl","aiL","independent","pair","classic"] : ["master","gl","aiL","independent","pair","classic"])
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
      <div class="recent-ai-champion"><span>${windowDays===7?"7 งวดล่าสุด":`${windowDays} วันล่าสุด`}</span><b>${escapeHtml(champText)}</b></div>
    </div>
    <div class="recent-ai-window-tabs winner-window-tabs" role="tablist" aria-label="เลือกช่วงเวลาสรุปผู้ชนะ">
      ${[[7,"7 วัน"],[14,"14 วัน"],[30,"1 เดือน"],[60,"2 เดือน"],[90,"3 เดือน"],[180,"6 เดือน"]].map(([day,label])=>`<button type="button" class="${windowDays===day?'active':''}" data-ai-win-window="${day}" aria-pressed="${windowDays===day}">${label}</button>`).join("")}
    </div>
    <div class="recent-ai-winner-list">${rows.map((row,index)=>`<div class="recent-ai-winner-row global ${s.champion?.key===row.key?'winner':''}">
      <span class="recent-ai-rank">${index+1}</span><div class="recent-ai-system"><b>${escapeHtml(row.label)}</b><small>${profileLine(row.key)}</small></div>
      <div class="recent-ai-win-bar"><i style="width:${Math.round(row.wins*100/maxWins)}%"></i></div>
      <strong>${row.wins} ชนะ</strong>
    </div>`).join("")}</div>
    <div class="recent-ai-winner-foot"><span>ประเมิน <b>${s.evaluated}</b> Profile-Draw</span><span>เสมอ <b>${s.tie}</b></span><span>ไม่มีผู้ชนะ <b>${s.noWinner}</b></span></div>
    <button type="button" class="recent-ai-detail-toggle" data-ai-win-open-calendar>ข้อมูลรายวัน</button>
    ${dailySummary}
    <p class="recent-ai-winner-note">Exact และ Reverse ถือว่า Hit เท่ากัน • ผู้ชนะได้ +1 และถ้า TIE ทุกตัวที่เสมอกันได้ +1 เท่ากัน • ใช้สถานะเดียวกับหน้า History ทุก Profile/ทุกสูตร • ตัดข้อมูลวันที่อนาคตอัตโนมัติ</p>
  </div>`;
}

// V6.10.40-R12 — Today Top 3 Profiles final-candidate hardening.
// Today is isolated from Calculate.calculationDate. Ranking confidence is based on
// VERIFIED evidence for the winning engine itself, not the Profile's raw History count.
// Engines with fewer than MASTER_MIN_EVIDENCE evaluated rows may keep a prior/fallback
// weight for the ensemble, but cannot be presented as today's AI Winner.
function getTodayTopProfiles(limit = 3) {
  const items = (state.profiles || []).map((name, profileId) => {
    const w = todayMasterAIWeights(profileId);
    const engines = [
      {key:"classic", label:"Classic", available:true},
      {key:"aiL", label:"AI L", available:Boolean(getMasterEligibleAIFormula(profileId))},
      {key:"independent", label:"AI อิสระ", available:true},
      {key:"pair", label:"AI Pair • TEST", available:true}
    ].filter(x => x.available).map(engine => {
      const m = w.metrics?.[engine.key] || {};
      const evidenceCount = Math.max(0, Number(m.overall?.total || 0));
      return {
        ...engine,
        weight:Number(w[engine.key] || 0),
        score:Number(m.score || 0),
        weekday:m.weekday || {},
        recent:m.recent || {},
        overall:m.overall || {},
        evidenceCount,
        evidenceReady:evidenceCount >= MASTER_MIN_EVIDENCE
      };
    });
    const eligible = engines.filter(x => x.evidenceReady);
    const winner = [...eligible].sort((a,b) => b.weight-a.weight || b.score-a.score || b.evidenceCount-a.evidenceCount)[0] || null;
    const evidenceConfidence = winner ? Math.min(1, winner.evidenceCount / 20) : 0;
    const evidenceFactor = 0.65 + (0.35 * evidenceConfidence);
    const profileScore = winner ? Math.round(winner.score * evidenceFactor * 10) / 10 : 0;
    return {
      profileId,
      name:String(name || `Profile ${profileId+1}`),
      weights:w,
      engines,
      winner,
      profileScore,
      samples:Number(w.samples || 0),
      evidenceCount:winner?.evidenceCount || 0
    };
  }).filter(x => x.winner);
  return items.sort((a,b) => b.profileScore-a.profileScore || b.winner.weight-a.winner.weight || b.evidenceCount-a.evidenceCount || a.profileId-b.profileId).slice(0, Math.max(1, Number(limit)||3));
}

function renderTodayTopProfilesCard() {
  const top = getTodayTopProfiles(3);
  const ref = top[0]?.weights || todayMasterAIWeights(Number(state.activeProfile)||0);
  const targetText = `${ref.targetDayName || "Today"} ${formatDateTH(ref.targetDate || isoDate())}`;
  if (!top.length) return `<div class="today-top-profiles-card"><div class="today-top-profiles-head"><div><small>TODAY TOP 3 PROFILES</small><h3>🏆 3 Profile แนะนำวันนี้</h3><p>${escapeHtml(targetText)}</p></div></div><div class="today-top-profiles-empty">ยังมี History ไม่พอสำหรับจัดอันดับ Profile วันนี้</div></div>`;
  return `<div class="today-top-profiles-card">
    <div class="today-top-profiles-head"><div><small>TODAY TOP 3 PROFILES</small><h3>🏆 3 Profile แนะนำวันนี้</h3><p>${escapeHtml(targetText)} • Master AI ประเมินทุก Profile แยกกัน</p></div><span>TOP 3</span></div>
    <div class="today-top-profiles-list">${top.map((x,i)=>{
      const wd=x.winner.weekday||{}, recent=x.winner.recent||{};
      const weekdayText=wd.total ? `${Math.round(Number(wd.rate||0)*10)/10}% (${wd.hit}/${wd.total})` : "ยังไม่มีข้อมูลวันเดียวกัน";
      const recentText=recent.windows?.length ? `${Math.round(Number(recent.score||0)*10)/10}%` : "—";
      return `<button type="button" class="today-top-profile-row ${i===0?'winner':''}" data-today-top-profile="${x.profileId}">
        <span class="today-top-profile-rank">${i===0?'🥇':i===1?'🥈':'🥉'}</span>
        <span class="today-top-profile-main"><b>${escapeHtml(x.name)}</b><small>${escapeHtml(x.winner.label)} • ${escapeHtml(x.weights.targetDayName||'Today')} ${weekdayText} • Recent ${recentText}</small></span>
        <span class="today-top-profile-ai"><small>AI Winner</small><b>${escapeHtml(x.winner.label)}</b><strong>${x.winner.weight}%</strong></span>
        <span class="today-top-profile-score"><small>Profile Score</small><b>${x.profileScore}</b><small>Evidence ${x.evidenceCount}</small></span>
      </button>`;
    }).join('')}</div>
    <div class="today-top-profiles-note"><b>การจัดอันดับ Profile:</b> ใช้ Weekday 40% + Recent 40% + Overall 20% แบบ prior-only และวัดความมั่นใจจากจำนวนผลที่ AI Winner ถูกประเมินจริง • ต้องมี Evidence อย่างน้อย ${MASTER_MIN_EVIDENCE} งวดจึงเป็น Winner ได้ • AI Weight ใช้เลือก AI ภายใน Profile ส่วน Profile Score ใช้เปรียบเทียบข้าม Profile</div>
  </div>`;
}

function renderTodayAIWeightCard(profileId) {
  const w = todayMasterAIWeights(profileId);
  const metric = key => w.metrics?.[key] || {};
  const rows = [
    {key:"classic", label:"Classic", weight:w.classic, available:true},
    {key:"aiL", label:"AI L", weight:w.aiL, available:Boolean(getMasterEligibleAIFormula(profileId))},
    {key:"independent", label:"AI อิสระ", weight:w.independent, available:true},
    {key:"pair", label:"AI Pair • TEST", weight:w.pair, available:true}
  ].filter(x => x.available).map(row => {
    const evidenceCount = Math.max(0, Number(metric(row.key)?.overall?.total || 0));
    return {...row, evidenceCount, evidenceReady:evidenceCount >= MASTER_MIN_EVIDENCE};
  });
  const winner = [...rows].filter(x=>x.evidenceReady).sort((a,b)=>b.weight-a.weight || b.evidenceCount-a.evidenceCount)[0] || null;
  const targetText = `${w.targetDayName || "Today"} ${formatDateTH(w.targetDate || isoDate())}`;
  return `<div class="today-ai-weight-card">
    <div class="today-ai-weight-head">
      <div><small>TODAY AI WEIGHT</small><h3>${escapeHtml(state.profiles[profileId] || `Profile ${profileId+1}`)}</h3><p>${escapeHtml(targetText)} • เรียนรู้แยกตาม Profile + วันในสัปดาห์</p></div>
      ${winner ? `<div class="today-ai-winner"><span>AI Winner</span><b>${escapeHtml(winner.label)}</b><strong>${winner.weight}%</strong></div>` : `<div class="today-ai-winner"><span>AI Winner</span><b>รอหลักฐาน</b><strong>—</strong></div>`}
    </div>
    <div class="today-ai-weight-list">${rows.map(row=>{
      const m=metric(row.key), weekday=m.weekday || {}, recent=m.recent || {};
      const weekdayText = weekday.total ? `${weekday.rate}% (${weekday.hit}/${weekday.total})` : "ยังไม่มีข้อมูล";
      const recentText = recent.windows?.length ? `${Math.round(Number(recent.score||0)*10)/10}%` : "—";
      const evidenceText = row.evidenceReady ? `Evidence ${row.evidenceCount}` : `Prior/Fallback • Evidence ${row.evidenceCount}/${MASTER_MIN_EVIDENCE}`;
      return `<div class="today-ai-weight-row ${winner?.key===row.key?'winner':''}">
        <div class="today-ai-weight-label"><b>${escapeHtml(row.label)}</b><small>${escapeHtml(w.targetDayName || "Today")} ${weekdayText} • Recent ${recentText} • ${escapeHtml(evidenceText)}</small></div>
        <div class="today-ai-weight-bar"><i style="width:${Math.max(0,Math.min(100,row.weight))}%"></i></div>
        <strong>${row.weight}%</strong>
      </div>`;
    }).join("")}</div>
    <div class="today-ai-weight-note"><b>วิธีคิด:</b> วันเดียวกันของโปรไฟล์นี้ 40% + Adaptive Recent Memory 40% + ประวัติภาพรวม 20% • Today ใช้เฉพาะข้อมูลก่อนวันเป้าหมาย และไม่รับวันที่ที่ค้างจากหน้า Calculate • AI ต้องมี Evidence อย่างน้อย ${MASTER_MIN_EVIDENCE} งวดก่อนเป็น Winner</div>
    <div class="today-ai-confidence-note">เปอร์เซ็นต์นี้คือ <b>น้ำหนักที่ Master AI ใช้ตัดสินใจ</b> ไม่ใช่เปอร์เซ็นต์รับประกันว่าเลขจะออก</div>
  </div>`;
}


// V6.10.3 — Behavior / Streak analysis for Classic + every AI engine.
// Uses trusted Verified Live / Walk-Forward statuses only. Legacy retrospective
// display values are intentionally excluded so the behavior card cannot learn from future data.
function getEngineBehaviorStats(profileId, engine, windowDays = 30) {
  const id = Number(profileId);
  const allowed = [7,14,30,60,90,180];
  const days = allowed.includes(Number(windowDays)) ? Number(windowDays) : 30;
  const today = isoDate();
  const allDraws = (state.actualDraws || [])
    .filter(d => Number(d.profileId ?? 0) === id
      && /^\d{4}-\d{2}-\d{2}$/.test(String(d.date || ""))
      && String(d.date) <= today)
    .sort((a,b) => String(a.date).localeCompare(String(b.date)) || Number(a.createdAt || 0) - Number(b.createdAt || 0));

  if (!allDraws.length) return {engine, rows:[], total:0, currentType:"none", currentLength:0, currentLabel:"ยังไม่มีข้อมูล", nextHitRate:null, nextHitHits:0, nextHitTotal:0, hitToHitRate:null, hitToHitHits:0, hitToHitTotal:0, missToHitRate:null, missToHitHits:0, missToHitTotal:0, maxHitStreak:0, maxMissStreak:0};
  const anchorDate = String(allDraws.at(-1).date);
  const startDate = shiftIsoDate(anchorDate, -(days - 1));

  // Keep a little pre-window context only for deriving the incoming streak length,
  // but every transition counted in the percentages must finish inside the selected window.
  const resolved = allDraws.map(draw => {
    const comparison = getHistoryComparisonStatuses(draw, id);
    const status = comparison?.[engine] || "pending";
    if (!comparison?.trusted || status === "pending") return null;
    return {draw, date:String(draw.date), status, hit:status === "exact" || status === "reversed" || status === "swap"};
  }).filter(Boolean);
  if (!resolved.length) return {engine, rows:[], total:0, currentType:"none", currentLength:0, currentLabel:"ยังไม่มีข้อมูล", nextHitRate:null, nextHitHits:0, nextHitTotal:0, hitToHitRate:null, hitToHitHits:0, hitToHitTotal:0, missToHitRate:null, missToHitHits:0, missToHitTotal:0, maxHitStreak:0, maxMissStreak:0};

  let streakType = null, streakLength = 0, maxHitStreak = 0, maxMissStreak = 0;
  const seq = resolved.map(row => {
    const type = row.hit ? "hit" : "miss";
    if (type === streakType) streakLength += 1;
    else { streakType = type; streakLength = 1; }
    if (type === "hit") maxHitStreak = Math.max(maxHitStreak, streakLength);
    else maxMissStreak = Math.max(maxMissStreak, streakLength);
    return {...row, streakType:type, streakLength};
  });
  const rows = seq.filter(row => row.date >= startDate && row.date <= anchorDate);
  if (!rows.length) return {engine, rows:[], total:0, currentType:"none", currentLength:0, currentLabel:"ยังไม่มีข้อมูล", nextHitRate:null, nextHitHits:0, nextHitTotal:0, hitToHitRate:null, hitToHitHits:0, hitToHitTotal:0, missToHitRate:null, missToHitHits:0, missToHitTotal:0, maxHitStreak:0, maxMissStreak:0};

  const last = rows.at(-1);
  const currentType = last.hit ? "hit" : "miss";
  const currentLength = last.streakLength;
  let hitToHitHits=0, hitToHitTotal=0, missToHitHits=0, missToHitTotal=0;
  let sameStateHits=0, sameStateTotal=0;

  // Transition i -> i+1. The target observation must be in the selected analysis range.
  for (let i=0; i<seq.length-1; i++) {
    const prev=seq[i], next=seq[i+1];
    if (next.date < startDate || next.date > anchorDate) continue;
    if (prev.hit) {
      hitToHitTotal += 1;
      if (next.hit) hitToHitHits += 1;
    } else {
      missToHitTotal += 1;
      if (next.hit) missToHitHits += 1;
    }

    // Match the CURRENT streak state. Use exact lengths for 1-3 and a 4+ bucket
    // so long miss/hit streaks still have enough historical examples to be useful.
    const currentBucket = currentLength >= 4 ? 4 : currentLength;
    const prevBucket = prev.streakLength >= 4 ? 4 : prev.streakLength;
    if ((prev.hit ? "hit" : "miss") === currentType && prevBucket === currentBucket) {
      sameStateTotal += 1;
      if (next.hit) sameStateHits += 1;
    }
  }

  const pct = (hit,total) => total ? Math.round(hit*1000/total)/10 : null;
  const currentLabel = currentType === "hit" ? `Hit ต่อเนื่อง ${currentLength} งวด` : `Miss ต่อเนื่อง ${currentLength} งวด`;
  return {
    engine, rows, total:rows.length, currentType, currentLength, currentLabel,
    nextHitRate:pct(sameStateHits,sameStateTotal), nextHitHits:sameStateHits, nextHitTotal:sameStateTotal,
    hitToHitRate:pct(hitToHitHits,hitToHitTotal), hitToHitHits, hitToHitTotal,
    missToHitRate:pct(missToHitHits,missToHitTotal), missToHitHits, missToHitTotal,
    maxHitStreak, maxMissStreak
  };
}

function renderBehaviorStreakCard(profileId, windowDays) {
  const models = [
    {key:"classic", label:"Classic", cls:"classic"},
    {key:"aiL", label:"AI L", cls:"ail"},
    {key:"gl",label:"AI GL",cls:"gl"},
    {key:"independent", label:"AI อิสระ", cls:"ind"},
    {key:"pair", label:"AI Pair", cls:"pair"}
  ];
  const stats = models.map(m => ({...m, stat:getEngineBehaviorStats(profileId,m.key,windowDays)}));
  const fmt = v => Number.isFinite(Number(v)) ? `${Number(v).toFixed(Number(v)%1?1:0)}%` : "—";
  const evidence = n => n ? `${n} ครั้ง` : "ข้อมูลยังน้อย";

  // "Rhythm leader" is simply the highest empirical next-Hit rate for the model's
  // current streak state, with >=3 historical transitions. It is not a forecast guarantee.
  const leaders = stats.filter(x => x.stat.nextHitTotal >= 3 && x.stat.nextHitRate !== null)
    .sort((a,b) => b.stat.nextHitRate - a.stat.nextHitRate || b.stat.nextHitTotal - a.stat.nextHitTotal);
  const leader = leaders[0] || null;
  const leaderText = leader ? `${leader.label} • ${leader.stat.currentLabel} • เคย Hit งวดถัดไป ${fmt(leader.stat.nextHitRate)} (${leader.stat.nextHitHits}/${leader.stat.nextHitTotal})` : "ยังมีตัวอย่างของจังหวะปัจจุบันไม่พอสำหรับเปรียบเทียบ";

  return `<details class="ux-disclosure analysis-detail behavior-streak-detail">
    <summary><span><b>จังหวะ / พฤติกรรม Hit–Miss</b><small>${windowDays} วัน • Classic + AI ทุกตัว • Trusted WF/Live</small></span><i>⌄</i></summary>
    <div class="ux-disclosure-body">
      <div class="behavior-leader-note"><span>จังหวะเด่นตอนนี้</span><b>${escapeHtml(leaderText)}</b></div>
      <div class="behavior-model-grid">${stats.map(({label,cls,stat}) => `
        <div class="behavior-model-card ${cls} ${stat.currentType}">
          <div class="behavior-model-head"><span>${escapeHtml(label)}</span><b>${stat.total ? escapeHtml(stat.currentLabel) : "ยังไม่มีข้อมูล"}</b></div>
          <div class="behavior-current-row">
            <strong>${stat.currentType === "hit" ? "🔥" : stat.currentType === "miss" ? "❄️" : "—"}</strong>
            <div><span>จากจังหวะปัจจุบัน → Hit ถัดไป</span><b>${fmt(stat.nextHitRate)}</b><small>${evidence(stat.nextHitTotal)}${stat.nextHitTotal ? ` • ${stat.nextHitHits}/${stat.nextHitTotal}` : ""}</small></div>
          </div>
          <div class="behavior-mini-grid">
            <div><span>หลัง Hit → Hit ต่อ</span><b>${fmt(stat.hitToHitRate)}</b><small>${stat.hitToHitHits}/${stat.hitToHitTotal}</small></div>
            <div><span>หลัง Miss → กลับ Hit</span><b>${fmt(stat.missToHitRate)}</b><small>${stat.missToHitHits}/${stat.missToHitTotal}</small></div>
            <div><span>Hit ยาวสุด</span><b>${stat.maxHitStreak || "—"}</b><small>งวด</small></div>
            <div><span>Miss ยาวสุด</span><b>${stat.maxMissStreak || "—"}</b><small>งวด</small></div>
          </div>
        </div>`).join("")}</div>
      <p class="behavior-footnote">เปอร์เซ็นต์เป็นสถิติจากสถานะ Hit/Miss ที่เกิดขึ้นจริงในช่วงที่เลือก โดย Exact และ Reverse นับเป็น Hit • ใช้เฉพาะ Verified Live / Walk-Forward ที่ไม่เห็นอนาคต • ไม่ใช่เปอร์เซ็นต์รับประกันงวดถัดไป</p>
    </div>
  </details>`;
}

function getAntiLeakAnalysisReport(profileId) {
  const id = Number(profileId);
  const draws = (state.actualDraws || []).filter(d => Number(d.profileId ?? 0) === id);
  let checked = 0, live = 0, wf = 0, blocked = 0, unsafeUsed = 0;

  draws.forEach(draw => {
    const targetDate = String(draw?.date || "").slice(0,10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return;

    // Count manual links that exist in saved data but are blocked by the strict resolver.
    if (draw?.referenceTableId) {
      const rawManual = (state.dailyTables || []).find(t => t.id === draw.referenceTableId && Number(t.profileId) === id) || null;
      if (rawManual && !isStrictPriorReferenceTable(rawManual, targetDate, id)) blocked++;
    }

    const resolved = resolveReferenceTable(id, targetDate, draw);
    if (resolved?.table && !isStrictPriorReferenceTable(resolved.table, targetDate, id)) unsafeUsed++;

    const table = resolved?.table || null;
    const rawSnap = table?.predictionSnapshot || null;
    if (rawSnap) {
      const savedAt = Number(draw.createdAt || draw.updatedAt || 0);
      const snapAt = Number(rawSnap.createdAt || 0);
      const sourceDate = String(rawSnap.sourceTableDate || table.date || "").slice(0,10);
      const targetOK = String(rawSnap.targetDate || "") === targetDate;
      const timeOK = Boolean(snapAt && savedAt && snapAt < savedAt);
      const sourceOK = /^\d{4}-\d{2}-\d{2}$/.test(sourceDate) && sourceDate < targetDate;
      if (!(targetOK && timeOK && sourceOK)) blocked++;
    }

    const liveSnap = getUniversalPredictionSnapshot(id, targetDate, draw);
    if (liveSnap) { live++; checked++; return; }
    const wfRow = getWalkForwardRecord(id, draw);
    if (wfRow?.statuses && Object.values(wfRow.statuses).some(v => v && v !== "pending")) { wf++; checked++; }
  });

  // Inspect raw WF rows too. Unsafe rows are blocked by getWalkForwardRecord above,
  // so they are reported as blocked rather than admitted to scoring.
  const bucket = getWalkForwardBucket(id);
  (bucket?.records || []).forEach(row => {
    const hasScoredOutput = Object.values(row?.statuses || {}).some(v => v && v !== "pending");
    if (!hasScoredOutput) return;
    const target = String(row?.date || "").slice(0,10);
    const source = String(row?.sourceTableDate || "").slice(0,10);
    const trained = String(row?.trainedThrough || source || "").slice(0,10);
    const valid = Number(bucket.version || 0) >= 4 &&
      String(bucket.engineVersion || "") === WF_ENGINE_VERSION &&
      String(bucket.methodology || "") === "walk-forward-adaptive-memory-prior-only" &&
      String(row?.methodology || "") === "walk-forward-adaptive-memory-prior-only" &&
      /^\d{4}-\d{2}-\d{2}$/.test(target) && /^\d{4}-\d{2}-\d{2}$/.test(source) && source < target &&
      /^\d{4}-\d{2}-\d{2}$/.test(trained) && trained < target;
    if (!valid) blocked++;
  });

  return {pass: unsafeUsed === 0, checked, live, wf, blocked, unsafeUsed};
}

function renderAntiLeakAnalysisCard(profileId) {
  const a = getAntiLeakAnalysisReport(profileId);
  return `<details class="anti-leak-audit-card ${a.pass ? "pass" : "fail"}">
    <summary class="anti-leak-audit-summary">
      <span class="anti-leak-lock">${a.pass ? "🔒" : "⚠️"}</span>
      <span class="anti-leak-summary-copy"><small>DATA LEAK AUDIT</small><b>Anti-Leak: <em>${a.pass ? "PASS" : "CHECK"}</em></b></span>
      <span class="anti-leak-summary-status">${a.unsafeUsed === 0 ? "Future 0" : `Unsafe ${a.unsafeUsed}`}</span>
      <i class="anti-leak-chevron">⌄</i>
    </summary>
    <div class="anti-leak-audit-body">
      <div class="anti-leak-audit-grid">
        <div><span>Future / Same-day used</span><b>${a.unsafeUsed}</b></div>
        <div><span>Trusted rows checked</span><b>${a.checked}</b></div>
        <div><span>Verified Live</span><b>${a.live}</b></div>
        <div><span>Walk-Forward</span><b>${a.wf}</b></div>
      </div>
      <p>${a.pass ? `✓ คะแนน Analysis รับเฉพาะ Snapshot ก่อนผลจริง และ WF ที่ source/training date &lt; target date${a.blocked ? ` • บล็อกข้อมูลไม่ผ่านกฎ ${a.blocked} จุด` : ""}` : "พบข้อมูลที่ไม่ผ่าน Prior-only gate — ไม่ควรใช้คะแนนจนกว่าจะตรวจสอบ"}</p>
    </div>
  </details>`;
}

function renderAnalysis() {
  const profileId = Number(state.activeProfile);
  const draws = state.actualDraws.filter(r => Number(r.profileId ?? 0) === profileId);
  const linkedDraws = draws.filter(d => getPredictionTable(profileId, d.date));
  const allRecords = state.records.filter(r => Number(r.profileId) === profileId && r.status !== "notfound");
  const windowDays = [7,14,30,60,90,180].includes(Number(state.analysisWinWindow)) ? Number(state.analysisWinWindow) : 30;
  const latestDate = [...linkedDraws].map(d=>d.date).filter(Boolean).sort().at(-1) || isoDate();
  const cutoff = new Date(`${latestDate}T00:00:00`); cutoff.setDate(cutoff.getDate() - (windowDays - 1));
  const cutoffISO = cutoff.toISOString().slice(0,10);
  const windowDraws = linkedDraws.filter(d => d.date >= cutoffISO && d.date <= latestDate);
  const windowIds = new Set(windowDraws.map(d=>d.id));
  const records = allRecords.filter(r => windowIds.has(r.sourceActualDrawId));
  const exact = records.filter(r => r.status === "exact").length;
  const swap = records.filter(r => r.status === "swap").length;
  const foundRate = windowDraws.length ? Math.round(records.length * 100 / windowDraws.length) : 0;
  const exactRate = windowDraws.length ? Math.round(exact * 100 / windowDraws.length) : 0;
  const patternRows = L_PATTERNS.map(pattern => {
    const matched = records.filter(r => r.patternId === pattern.id);
    return { ...pattern, matched: matched.length, exactCount: matched.filter(r=>r.status==="exact").length, reverseCount: matched.filter(r=>r.status==="swap").length };
  }).sort((a,b) => b.matched - a.matched || b.exactCount - a.exactCount || a.id.localeCompare(b.id));
  const visiblePatterns = state.analysisLShowAll ? patternRows : patternRows.slice(0,3);
  const all=state.actualDraws.filter(r=>Number(r.profileId??0)===profileId);
  const classic=trustedHistorySummary(all,profileId,"classic"), aiL=trustedHistorySummary(all,profileId,"aiL"),gl=trustedHistorySummary(all,profileId,"gl"), free=trustedHistorySummary(all,profileId,"independent"), pair=trustedHistorySummary(all,profileId,"pair");
  return `<section class="card ux-page-card analysis-v690">
    <div class="ux-page-head"><div><small>ANALYSIS</small><h2>ผลวิเคราะห์</h2><p>${escapeHtml(state.profiles[profileId]||`Profile ${profileId+1}`)} • ใช้ข้อมูลเดียวกับ History</p></div><span class="ux-count-pill">${linkedDraws.length} งวด</span></div>
    ${profileTabs()}
    <div class="analysis-global-range"><span>ช่วงวิเคราะห์</span><div>${[7,14,30,60,90,180].map(day=>`<button type="button" class="${windowDays===day?'active':''}" data-analysis-window="${day}">${day}</button>`).join('')}</div></div>
    ${renderRecentAIWinnerCard()}
    <div class="model-score-grid ux-model-grid pair-test-grid"><div class="classic"><span>Classic</span><b>${classic.rate}%</b><small>${classic.hit}/${classic.total}</small></div><div class="ail"><span>AI L</span><b>${aiL.total?`${aiL.rate}%`:'—'}</b><small>${aiL.hit}/${aiL.total}</small></div><div class="gl"><span>AI GL</span><b>${gl.total?`${gl.rate}%`:'—'}</b><small>${gl.hit}/${gl.total}</small></div><div class="ind"><span>Independent</span><b>${free.total?`${free.rate}%`:'—'}</b><small>${free.hit}/${free.total}</small></div><div class="pair"><span>AI Pair • TEST</span><b>${pair.total?`${pair.rate}%`:'—'}</b><small>${pair.hit}/${pair.total}</small></div></div>
    ${renderProfileRanking()}
    <p class="score-explainer">Score / Confidence / Weight ใช้ช่วยจัดอันดับเท่านั้น ไม่ใช่เปอร์เซ็นต์รับประกันผล</p>
    ${renderBehaviorStreakCard(profileId, windowDays)}
    ${renderAntiLeakAnalysisCard(profileId)}
  </section>`;
}
function progressCard(label, value) {
  return `<div class="progress-card"><div><span>${label}</span><b>${value}%</b></div><div class="progress"><i style="width:${value}%"></i></div></div>`;
}

function renderSettings() {
  const c=getRankingConfig(), total=c.weight10+c.weight30+c.weightAll;
  return `<section class="card ux-page-card settings-v690">
    <div class="ux-page-head settings-title-only"><div><small>SETTING</small></div><span class="settings-app-version">${APP_DISPLAY_VERSION}</span></div>
    <div class="settings-section-card profiles-settings-card">
      <div class="settings-section-head profiles-section-head"><span>👤</span><div><b>Profiles</b><small>${state.profiles.length} Profile • แตะชื่อเพื่อแก้ไข</small></div><button type="button" id="btnProfileReorderMode" class="profile-reorder-mode-btn" aria-pressed="false">แก้ไขลำดับ</button></div>
      <div class="profile-search-row"><span aria-hidden="true">⌕</span><input id="profileSettingsSearch" type="search" placeholder="ค้นหา Profile..." autocomplete="off" aria-label="ค้นหา Profile"><button type="button" id="profileSettingsSearchClear" aria-label="ล้างคำค้น" hidden>×</button></div>
      <div class="profile-search-meta" id="profileSearchMeta" hidden></div>
      <div class="settings-list profile-sort-list" id="profileSortList">${state.profiles.map((name,i)=>`<div class="profile-swipe-row" data-profile-row="${i}" data-profile-name="${escapeHtml(String(name).toLowerCase())}"><div class="profile-delete-action"><button type="button" data-delete-profile="${i}">ลบ</button></div><div class="profile-row-content" data-row-content="${i}"><span class="profile-settings-index">${i+1}</span><input class="name-input profile-name-clean" data-name-index="${i}" value="${escapeHtml(name)}" maxlength="30" aria-label="ชื่อ ${escapeHtml(name)}"><button type="button" class="profile-drag-handle" data-drag-handle="${i}" aria-label="ลาก ${escapeHtml(name)}">☰</button></div></div>`).join("")}</div>
      <div class="profile-reorder-hint" id="profileReorderHint" hidden>กดค้างที่ ☰ แล้วลากเพื่อเปลี่ยนลำดับ</div>
      <div class="settings-inline-actions"><button id="btnAddProfile" class="btn secondary">＋ เพิ่ม</button><button id="btnSaveNames" class="btn primary">บันทึก</button></div>
    </div>
    <div class="settings-section-card">
      <div class="settings-section-head"><span>🤖</span><div><b>AI</b><small>Classic L + AI L + AI อิสระ + AI Pair + Master AI</small></div></div>
      <p class="theme-help"><b>Master AI:</b> ระบบจะเลือกใช้เฉพาะเมื่อข้อมูลและการตรวจสอบภายในพร้อม</p>
    </div>
    <div class="settings-section-card app-update-card">
      <div class="settings-section-head"><span>↻</span><div><b>App Update & Refresh</b><small>อัปเดต CSS / JS / Service Worker โดยไม่ลบข้อมูล</small></div><span class="update-safe-badge">SAFE</span></div>
      <button id="btnSafeRefreshApp" class="btn primary full">Refresh ทั้งแอป • Check Update</button>
      <p class="theme-help app-update-help">ไม่ลบ Home Screen • ไม่ล้าง History • ไม่ล้าง Settings • ไม่ล้าง AI/WF/JSON data</p>
      <div id="safeRefreshStatus" class="safe-refresh-status" aria-live="polite"></div>
    </div>
    <div class="settings-section-card">
      <div class="settings-section-head"><span>💾</span><div><b>Data & Backup</b><small>สำรอง / Restore JSON</small></div></div>
      <button id="btnExport" class="btn secondary full">สำรองข้อมูลไป Files / iCloud</button>
      <label class="btn secondary full file-button" for="importFile"><span class="restore-label-text">กู้คืน JSON • Clean AI Rebuild</span><input id="importFile" type="file" accept="application/json,.json" hidden></label>
      ${renderJsonRestoreStatus()}
      <button id="btnResetAll" class="btn danger full">ล้างข้อมูลทั้งหมด</button>
    </div>
    <div class="settings-section-card">
      <div class="settings-section-head"><span>◐</span><div><b>Appearance</b><small>เลือกตาม iPhone หรือกำหนดเอง</small></div></div>
      <div class="theme-segment" role="group" aria-label="Appearance">
        <button type="button" data-theme-mode="auto" class="${state.theme === "auto" ? "active" : ""}">⚙️ Auto</button>
        <button type="button" data-theme-mode="light" class="${state.theme === "light" ? "active" : ""}">☀️ Light</button>
        <button type="button" data-theme-mode="dark" class="${state.theme === "dark" ? "active" : ""}">🌙 Dark</button>
      </div>
      <p class="theme-help">Auto จะเปลี่ยนตาม Light / Dark Mode ของ iPhone • สี Hit / Miss / AI ยังคงความหมายเดิม</p>
    </div>
    <details class="ux-disclosure settings-advanced">
      <summary><span><b>Advanced</b><small>สูตรคะแนน Profile และเครื่องมือขั้นสูง</small></span><i>⌄</i></summary>
      <div class="ux-disclosure-body">
        <div class="ranking-settings-card">
          <div class="ranking-settings-head"><div><h3>Profile Ranking Score</h3><p>ใช้จัดอันดับในหน้า Analysis</p></div><span id="rankingWeightTotal" class="${Math.abs(total-100)<0.001?'valid':'invalid'}">รวม ${total}%</span></div>
          <div class="ranking-settings-grid"><label><span>Exact Match</span><input id="rankExactPoints" type="number" inputmode="decimal" min="0" step="0.1" value="${c.exactPoints}"></label><label><span>Reversed Match</span><input id="rankReversePoints" type="number" inputmode="decimal" min="0" step="0.1" value="${c.reversedPoints}" disabled></label><label><span>10 งวดล่าสุด</span><div class="percent-input"><input id="rankWeight10" type="number" inputmode="decimal" min="0" step="1" value="${c.weight10}"><b>%</b></div></label><label><span>30 งวดล่าสุด</span><div class="percent-input"><input id="rankWeight30" type="number" inputmode="decimal" min="0" step="1" value="${c.weight30}"><b>%</b></div></label><label class="full-row"><span>ข้อมูลทั้งหมด</span><div class="percent-input"><input id="rankWeightAll" type="number" inputmode="decimal" min="0" step="1" value="${c.weightAll}"><b>%</b></div></label></div>
          <div id="rankingConfigMessage" class="ranking-config-message">น้ำหนักรวมต้องเท่ากับ 100%</div><div class="ranking-settings-actions"><button id="btnResetRankingConfig" type="button" class="btn secondary">คืนค่า</button><button id="btnSaveRankingConfig" type="button" class="btn primary">บันทึก</button></div>
        </div>
      </div>
    </details>
  </section>`;
}

function bindCommon() {
  document.querySelector("[data-profile-order-toggle]")?.addEventListener("click", () => {
    state.profileOrderMode = state.profileOrderMode === "ai" ? "default" : "ai";
    saveState();
    refreshCurrentView();
  });
  document.querySelectorAll("[data-view]").forEach(btn => btn.addEventListener("click", () => {
    navigateToView(btn.dataset.view);
  }));
  document.querySelectorAll("[data-profile]").forEach(btn => btn.addEventListener("click", () => {
    const id = Number(btn.dataset.profile);
    independentCalculatePreviewProfile = null;
    mlCalculatePreviewProfile = null;
    state.activeProfile = id;

    // หน้า Calculate: เปลี่ยน Profile แล้วดึงเลขออกจริงล่าสุด 3 ตัว + 2 ตัวมาใส่ 5 ช่องทันที
    if (state.currentView === "home") {
      loadLatestProfileResultIntoCalculator(id);
    }

    saveState();
    refreshCurrentView();
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
      if(mode==="gl"){
        const saved=state.aiGLFormulaLab?.[id],check=glFormulaEligibility(saved,id);
        if(!saved?.formula||!check.allowed) return alert(check.reason||"ยังไม่มีสูตร AI GL พร้อมใช้งาน");
      }
      if (!["auto","ai","gl","original"].includes(mode)) return;
      state.activeFormulaByProfile = state.activeFormulaByProfile || {};
      state.activeFormulaByProfile[id] = mode;
      syncCalculatorTableViewToActiveFormula(id, true);
      state.grid=calculateGrid(state.lastInput,id);
      saveState(); render();
      const resolved=getActiveFormulaMode(id);
      showToast(mode === "auto" ? `✓ AUTO เปิดแล้ว • ตอนนี้ใช้ ${resolved === "blend"?"BLEND • AI L + AI GL":resolved === "gl"?"AI GL":resolved === "ai" ? "AI L" : "Classic L"}` : mode === "gl"?"✓ เปลี่ยนเป็น AI GL แล้ว":mode === "ai" ? "✓ เปลี่ยนเป็น AI Champion แล้ว" : "✓ เปลี่ยนเป็น Original Formula แล้ว");
    }));
    document.querySelector("[data-independent-table-preview]")?.addEventListener("click",()=>{
      const id=Number(state.activeProfile);
      const preview=getIndependentPreviewTable(id);
      if (preview.pending) return alert(`AI อิสระต้องมี History อย่างน้อย 8 งวด (ขณะนี้ ${preview.dataCount} งวด)`);
      independentCalculatePreviewProfile=id;
      state.currentView="home";
      render();
      showToast("✓ เปิดตาราง AI อิสระ Top 5 • โหมดดูอย่างเดียว");
    });
    document.querySelectorAll("[data-ml-table-preview]").forEach(btn=>btn.addEventListener("click",()=>{
      const id=Number(btn.dataset.profileId ?? state.activeProfile);
      const preview=getMLSelectPreviewTable(id);
      if (preview.pending || !preview.grid) return alert(preview.reason || "ML Select Table ยังไม่พร้อม");
      independentCalculatePreviewProfile=null;
      mlCalculatePreviewProfile=id;
      state.currentView="home";
      render();
      showToast(`✓ เปิดตาราง ML Select • ${state.profiles[id]||`Profile ${id+1}`} • ${preview.engineLabel} • Strict Prior-only`);
    }));
    document.getElementById("generateAIFormula")?.addEventListener("click",()=>{
      const result=generateAIFormula(Number(state.activeProfile));
      if (result?.error) return alert(result.error);
      result.deploymentStatus = formulaEligibility(result).allowed ? "approved" : "candidate";
      saveState(); clearPerformanceCaches(); activeRenderPerfSignature = "";
      render();
    });
    document.getElementById("generateAIGLFormula")?.addEventListener("click",()=>{
      const result=generateAIGLFormula(Number(state.activeProfile));
      if(result?.error) return alert(result.error);
      saveState();clearPerformanceCaches();activeRenderPerfSignature="";render();
      showToast(glFormulaEligibility(result,Number(state.activeProfile)).allowed?"✓ AI GL ผ่าน Trusted Gate • READY":"AI GL รุ่นใหม่ถูกเก็บเป็น Candidate เพื่อเรียนต่อ");
    });
    document.getElementById("previewAIGLFormula")?.addEventListener("click",()=>{
      const saved=state.aiGLFormulaLab?.[Number(state.activeProfile)];if(!saved?.formula)return alert("ยังไม่มีสูตร AI GL");
      const grid=formulaGrid(state.lastInput,saved.formula);if(!grid)return alert("กรุณากรอกตัวเลข 5 หลักในหน้า Calculate ก่อน");
      state.grid=grid;saveState();state.currentView="home";render();showToast("เปิดตาราง AI GL แบบ Preview แล้ว");
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
    document.querySelectorAll("[data-history-tab]").forEach(btn => btn.addEventListener("click", () => {
      state.historyTab = btn.dataset.historyTab;
      historyDeleteRevealId = null;
      if (state.historyTab !== "results") historyEditMode = false;
      render();
    }));
    document.querySelectorAll("[data-formula-mode]").forEach(btn => btn.addEventListener("click", () => { state.historyFormulaMode = btn.dataset.formulaMode; historyDeleteRevealId = null; render(); }));
    document.getElementById("btnHistoryManagerToggle")?.addEventListener("click", event => {
      event.preventDefault();
      historyManagerOpen = !historyManagerOpen;
      if (!historyManagerOpen) { historyEditMode = false; historyDeleteRevealId = null; }
      render();
    });
    document.getElementById("btnHistoryEdit")?.addEventListener("click", event => {
      event.preventDefault(); event.stopPropagation();
      historyEditMode = !historyEditMode;
      historyDeleteRevealId = null;

      // V6.10.16: toggle History edit mode entirely in-place.
      // Do not refresh/re-render the History view here: on iOS/PWA that can reset
      // the current scroll position to the top before the user can tap a minus button.
      const editBtn = event.currentTarget;
      editBtn?.classList.toggle("active", historyEditMode);
      if (editBtn) editBtn.textContent = historyEditMode ? "Done" : "Edit";

      const table = document.querySelector(".result-history-table");
      table?.classList.toggle("history-editing", historyEditMode);
      document.querySelectorAll("[data-history-edit-shell]").forEach(shell => {
        shell.classList.toggle("editing", historyEditMode);
        shell.classList.remove("delete-open");
      });
    });
    document.querySelectorAll("[data-history-minus]").forEach(btn => btn.addEventListener("click", event => {
      event.preventDefault(); event.stopPropagation();
      if (!historyEditMode) return;
      const id = String(btn.dataset.historyMinus || "");
      const wasOpen = String(historyDeleteRevealId || "") === id;
      historyDeleteRevealId = wasOpen ? null : id;
      // V6.10.16: reveal Delete in-place. Do NOT rebuild the History DOM here;
      // rebuilding on iOS can reset the page to the top before the user taps Delete.
      document.querySelectorAll("[data-history-edit-shell].delete-open").forEach(shell => shell.classList.remove("delete-open"));
      if (!wasOpen) btn.closest("[data-history-edit-shell]")?.classList.add("delete-open");
    }));
    document.querySelectorAll("[data-history-inline-delete]").forEach(btn => btn.addEventListener("click", async event => {
      event.preventDefault(); event.stopPropagation();
      const id = btn.dataset.historyInlineDelete;
      const draw = (state.actualDraws || []).find(x => String(x.id) === String(id));
      if (!draw) return;
      if (!confirm(`ลบผล ${draw.number || "---"} วันที่ ${formatDateTH(draw.date)} หรือไม่?`)) return;
      const preserveScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      historyDeleteRevealId = null;
      await deleteActualDrawWithSync(id, {skipConfirm:true, preserveScrollY});
    }));
    document.getElementById("btnAddActualDraw")?.addEventListener("click", () => openActualDrawForm());
    document.getElementById("btnImportImageSandbox")?.addEventListener("click", () => document.getElementById("importImageInput")?.click());
    document.getElementById("importImageInput")?.addEventListener("change", handleImportImageSelection);
    document.querySelectorAll("[data-actual-draw]").forEach(el => el.addEventListener("click", event => {
      if (historyEditMode) { event.preventDefault(); return; }
      openActualDrawDetail(el.dataset.actualDraw);
    }));
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
      refreshCurrentView();
      requestAnimationFrame(() => {
        document.querySelector(".profile-tabs")?.scrollTo?.({ left: 0, behavior: "smooth" });
      });
    }));
    document.querySelectorAll("[data-ranking-profile]").forEach(btn => btn.addEventListener("click", () => {
      state.activeProfile = Number(btn.dataset.rankingProfile); saveState(); refreshCurrentView();
    }));
    document.querySelectorAll("[data-today-top-profile]").forEach(btn => btn.addEventListener("click", () => {
      const id = Number(btn.dataset.todayTopProfile);
      if (!Number.isInteger(id) || id < 0 || id >= state.profiles.length) return;
      state.activeProfile = id;
      saveState(); refreshCurrentView();
      requestAnimationFrame(() => document.querySelector('.today-ai-weight-card')?.scrollIntoView?.({behavior:'smooth', block:'center'}));
    }));
    document.querySelectorAll("[data-analysis-window]").forEach(btn => btn.addEventListener("click", () => {
      const days=Number(btn.dataset.analysisWindow);
      if (![7,14,30,60,90,180].includes(days)) return;
      state.analysisWinWindow=days; state.analysisLWindow=days; state.analysisLShowAll=false;
      saveState(); refreshCurrentView();
    }));
    document.querySelectorAll("[data-ai-win-window]").forEach(btn => btn.addEventListener("click", () => {
      const days = Number(btn.dataset.aiWinWindow);
      if (![7,14,30,60,90,180].includes(days)) return;
      state.analysisWinWindow = days;
      saveState(); refreshCurrentView();
    }));
    document.querySelectorAll("[data-ai-win-open-calendar]").forEach(btn => btn.addEventListener("click", () => {
      openAIWinnerCalendar([7,14,30,60,90,180].includes(Number(state.analysisWinWindow)) ? Number(state.analysisWinWindow) : 7);
    }));
    document.querySelectorAll("[data-l-window]").forEach(btn => btn.addEventListener("click", () => {
      const days = Number(btn.dataset.lWindow);
      if (![7,14,30,60,90,180].includes(days)) return;
      state.analysisLWindow = days; state.analysisLShowAll = false;
      saveState(); refreshCurrentView();
    }));
    document.querySelector("[data-l-pattern-toggle]")?.addEventListener("click", () => {
      state.analysisLShowAll = !state.analysisLShowAll;
      saveState(); refreshCurrentView();
    });
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
    independentCalculatePreviewProfile = null;
    mlCalculatePreviewProfile = null;
    syncCalculatorTableViewToActiveFormula(state.activeProfile, false);
    const grid = calculateGrid();
    if (!grid) return alert("Please enter all 5 digits");
    state.grid = grid; saveState(); render();
  });
  document.getElementById("btnClear")?.addEventListener("click", () => {
    independentCalculatePreviewProfile = null;
    mlCalculatePreviewProfile = null;
    state.lastInput = ["","","","",""]; state.grid = null; state.selectedL = null; state.calculationDate = null; syncCalculatorTableViewToActiveFormula(state.activeProfile, true); saveState(); render();
  });
  document.getElementById("btnFindL")?.addEventListener("click", () => {
    const selected=getCalculatorSelectedTable(state.activeProfile);
    const visibleGrid=selected?.grid || state.grid;
    if(!visibleGrid) return alert(`${selected?.label || 'AI'} ยังไม่มีตารางสำหรับงวดนี้`);
    currentLResults = findLResults(visibleGrid);
    openLResults();
  });
  document.querySelectorAll("[data-calc-engine]").forEach(button=>button.addEventListener("click",()=>{
    const mode=String(button.dataset.calcEngine||'original');
    if(!['original','ai','gl'].includes(mode)) return;
    calculatorTableViewMode=mode;
    const selected=getCalculatorSelectedTable(state.activeProfile);
    if(!selected?.grid){
      render();
      setTimeout(()=>alert(`${selected?.label || 'AI'} ยังไม่มี Prior-only snapshot สำหรับงวดย้อนหลังนี้`),0);
      return;
    }
    render();
  }));
  document.getElementById("btnIndependentResults")?.addEventListener("click", () => {
    currentLResultMode = "independent";
    openLResults("", currentLRankLimit, "independent");
  });
  document.querySelectorAll("#btnExitIndependentPreview").forEach(button=>button.addEventListener("click",()=>{
    independentCalculatePreviewProfile = null;
    render();
  }));
  document.querySelectorAll("#btnExitMLPreview").forEach(button=>button.addEventListener("click",()=>{
    mlCalculatePreviewProfile = null;
    render();
  }));
  document.getElementById("btnMLPreviewDetails")?.addEventListener("click",()=>{
    mlCalculatePreviewProfile = null;
    state.currentView = "weekly";
    render();
  });
}


function getCandidateUiMeta(items,index,mode,dataCount=0) {
  const raw=x=>Number(mode==="master"?x?.masterScore:mode==="overlap"?((Number(x?.aiScore)||0)+(Number(x?.independentScore)||0))/2:x?.aiScore)||0;
  const max=Math.max(0,...(items||[]).map(raw)), current=raw(items?.[index]), next=raw(items?.[index+1]);
  const score=max>0?Math.max(0,Math.min(100,Math.round(current*100/max))):Math.max(0,100-index*8);
  const gap=max>0?Math.max(0,(current-next)*100/max):0;
  let label="LOW", kind="low";
  if(index===0 && dataCount>=20 && gap>=8){label="HIGH";kind="high";}
  else if(score>=72 && dataCount>=8){label="MEDIUM";kind="medium";}
  return {score,label,kind,gap:Math.round(gap)};
}

function openLResults(searchValue = "", limit = currentLRankLimit, mode = currentLResultMode) {
  currentLRankLimit = Number(limit) || 0;
  currentLResultMode = (MASTER_AI_PAUSED && mode === "master") ? "l" : (mode === "blend" ? "l" : (["l","ai","gl","independent","master","overlap"].includes(mode) ? mode : "l"));
  const ranked = rankLResults(currentLResults);

  // V7.09.42 — LIVE AUTO BLEND for the L ranking popup.
  // Eligibility must come from model READY + Trusted evidence, not from whether a Calculator
  // preview grid happened to be opened first. If a live grid is missing, build it on demand
  // from the current 5-digit input and the already-READY formulas. Historical snapshots remain
  // untouched: this affects only the live result popup.
  const calculatorTables = getCalculatorEngineTables(Number(state.activeProfile));
  const aiLTable = calculatorTables.find(t => t.key === "ai") || null;
  const glTable = calculatorTables.find(t => t.key === "gl") || null;
  const liveInputs = Array.isArray(state.lastInput) ? state.lastInput.map(String) : [];
  const liveInputReady = liveInputs.length === 5 && liveInputs.every(v => /^\d$/.test(v));
  const aiSavedLive = state.aiFormulaLab?.[Number(state.activeProfile)] || null;
  const glSavedLive = state.aiGLFormulaLab?.[Number(state.activeProfile)] || null;
  const aiLiveReady = Boolean(aiSavedLive?.formula && formulaEligibility(aiSavedLive).allowed);
  const glLiveReady = Boolean(glSavedLive?.formula && glFormulaEligibility(glSavedLive, Number(state.activeProfile)).allowed);
  const aiLiveGrid = liveInputReady && aiLiveReady ? formulaGrid(liveInputs, aiSavedLive.formula) : null;
  const glLiveGrid = liveInputReady && glLiveReady ? formulaGrid(liveInputs, glSavedLive.formula) : null;
  const aiLRawResults = aiLTable?.grid ? (aiLTable.results || []) : (aiLiveGrid ? findLResults(aiLiveGrid) : []);
  const glRawResults = glTable?.grid ? (glTable.results || []) : (glLiveGrid ? findLResults(glLiveGrid) : []);
  const aiLRanked = rankLResults(aiLRawResults, state.activeProfile);
  const glRanked = rankLResults(glRawResults, state.activeProfile);
  const championForBlend = getHistoryChampionForProfile(state.activeProfile);
  const aiLChampion = championForBlend?.items?.find(x => x.key === "aiL") || null;
  const glChampion = championForBlend?.items?.find(x => x.key === "gl") || null;
  const aiLRate = Number(aiLChampion?.summary?.rate || 0);
  const glRate = Number(glChampion?.summary?.rate || 0);
  const aiLTrusted = Number(aiLChampion?.summary?.total || 0);
  const glTrusted = Number(glChampion?.summary?.total || 0);
  const sharedAutoDecision = getAutoFormulaDecision(state.activeProfile);
  const blendGap = Number.isFinite(Number(sharedAutoDecision?.blendGap)) ? Number(sharedAutoDecision.blendGap) : Math.round(Math.abs(aiLRate - glRate) * 10) / 10;
  // Same global AUTO gate; lists are generated lazily only when the popup needs them.
  const blendReady = Boolean(
    sharedAutoDecision?.mode === "blend" && liveInputReady &&
    aiLRanked.length && glRanked.length
  );
  // V7.09.46 — BLEND result guard.
  // AUTO may already be globally resolved to BLEND before this popup opens. The result
  // list must therefore be built directly from the live AI L + AI GL candidates and must
  // never depend on a previously opened Calculator preview. Normalize every candidate to
  // the canonical 3-digit form, deduplicate it, then rank consensus first.
  const buildBlendItems = () => {
    if (!blendReady) return [];
    const map = new Map();
    const normalizeBlendNumber = item => {
      const raw = String(item?.number ?? "").replace(/\D/g, "");
      if (!raw) return "";
      const three = raw.padStart(3, "0").slice(-3);
      return /^\d{3}$/.test(three) ? canonical3(three) : "";
    };
    const add = (items, sourceKey, sourceLabel) => (items || []).forEach((item, index) => {
      const number = normalizeBlendNumber(item);
      if (!number) return;
      let row = map.get(number);
      if (!row) {
        row = {...item, number, canonicalNumber:number, blendSources:[], blendRanks:{}, blendConsensus:0};
        map.set(number, row);
      }
      if (!row.blendSources.includes(sourceLabel)) row.blendSources.push(sourceLabel);
      row.blendRanks[sourceKey] = index + 1;
      row.blendConsensus = row.blendSources.length;
      // Keep the best source score so the existing confidence UI always has a value.
      row.aiRawScore = Math.max(Number(row.aiRawScore || 0), Number(item?.aiRawScore || 0));
      row.aiScore = Math.max(Number(row.aiScore || 0), Number(item?.aiScore || 0));
    });
    add(aiLRanked, "aiL", "AI L");
    add(glRanked, "gl", "AI GL");

    // Defensive fallback: rankLResults should preserve candidates, but if a future change
    // strips their number field, rebuild from the raw L results rather than showing blank.
    if (!map.size) {
      add(aiLRawResults, "aiL", "AI L");
      add(glRawResults, "gl", "AI GL");
    }

    return [...map.values()].sort((a,b) => {
      const consensus = Number(b.blendConsensus||0) - Number(a.blendConsensus||0);
      if (consensus) return consensus;
      const ar = Number(a.blendRanks?.aiL || 999) + Number(a.blendRanks?.gl || 999);
      const br = Number(b.blendRanks?.aiL || 999) + Number(b.blendRanks?.gl || 999);
      return ar - br || String(a.number).localeCompare(String(b.number));
    }).map((item,index)=>({...item, aiRank:index+1}));
  };
  const blendItems = buildBlendItems();
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
  const source = currentLResultMode === "gl" ? glRanked
    : currentLResultMode === "ai" ? ranked
    : currentLResultMode === "blend" ? blendItems
    : currentLResultMode === "independent" ? independentItems
    : currentLResultMode === "master" ? masterItems
    : currentLResultMode === "overlap" ? overlap
    : (blendReady ? blendItems : ranked);
  // For L × AI the rank buttons define the AI comparison pool, not the number
  // of overlap results shown. Show every intersection found in that pool.
  const effectiveLimit = currentLResultMode === "overlap"
    ? 0
    : ((currentLResultMode === "independent" || currentLResultMode === "master") && currentLRankLimit === 0 ? 10 : currentLRankLimit);
  const visible = effectiveLimit === 0 ? source : source.slice(0, effectiveLimit);
  const profileName = state.profiles[state.activeProfile] || "Profile";
  const dataCount = currentLResultMode === "gl" ? glTrusted
    : currentLResultMode === "ai" ? aiLTrusted
    : (currentLResultMode === "blend" || (currentLResultMode === "l" && blendReady)) ? Math.min(aiLTrusted, glTrusted)
    : currentLResultMode === "independent" ? independent.dataCount
    : currentLResultMode === "master" ? master.dataCount
    : (ranked[0]?.aiDataCount || 0);
  // V7.09.38 — Ranking popup follows the same Global AUTO vocabulary as AI + Calculator.
  // Keep ranking/history evidence separate from formula selection: this is UI sync only, no historical recomputation.
  const activeAutoMode = getActiveFormulaMode(state.activeProfile);
  const activeAutoLabel = blendReady ? "BLEND" : (activeAutoMode === "gl" ? "AI GL" : activeAutoMode === "ai" ? "AI L" : "Classic L");
  const title = currentLResultMode === "gl" ? "AI GL Ranking"
    : currentLResultMode === "ai" ? "AI L Ranking"
    : currentLResultMode === "blend" ? "AI L + AI GL • BLEND"
    : currentLResultMode === "independent" ? "AI อิสระ"
    : currentLResultMode === "master" ? "Master AI"
    : currentLResultMode === "overlap" ? "เลขร่วม L × AI"
    : (blendReady ? "AUTO • BLEND • AI L + AI GL" : "AUTO + AI Ranking");
  const historyChampion = getHistoryChampionForProfile(state.activeProfile);
  const historyWinner = historyChampion?.winner || null;
  // V7.09.51 — Yellow hero follows the selected top tab.
  const heroDraws = (state.actualDraws || []).filter(d => Number(d.profileId ?? 0) === Number(state.activeProfile));
  const heroSummary = key => trustedHistorySummary(heroDraws, Number(state.activeProfile), key);
  const classicHero = heroSummary("classic");
  const aiLHero = heroSummary("aiL");
  const glHero = heroSummary("gl");
  const independentHero = heroSummary("independent");
  const statHero = (heading,label,summary,extra="") => `<div class="l-popup-winner"><span>${heading}</span><b>${escapeHtml(label)}</b><strong>${Number(summary?.total||0) ? `${Number(summary.rate||0)}%` : "—"}</strong><small>${Number(summary?.total||0) ? `${Number(summary.hit||0)}/${Number(summary.total||0)} งวด${extra ? ` • ${escapeHtml(extra)}` : ""}` : "ยังไม่มีข้อมูล Trusted เพียงพอ"}</small></div>`;
  let heroBlock = "";
  if (currentLResultMode === "ai") {
    heroBlock = statHero("🤖 Selected Model","AI L",aiLHero);
  } else if (currentLResultMode === "gl") {
    heroBlock = statHero("🤖 Selected Model","AI GL",glHero);
  } else if (currentLResultMode === "independent") {
    heroBlock = statHero("🤖 Selected Model","AI อิสระ",independentHero);
  } else if (currentLResultMode === "overlap") {
    heroBlock = `<div class="l-popup-winner"><span>🔗 Selected Model</span><b>L × AI</b><strong>${overlap.length}</strong><small>เลขร่วมจาก L × AI อิสระ • ${independent.pending ? `History ${independent.dataCount}/8 งวด` : `AI pool ${overlapAiLimit} อันดับ`}</small></div>`;
  } else if (blendReady) {
    heroBlock = `<div class="l-popup-winner blend-active"><span>🤖 AUTO Selection</span><b>BLEND • AI L + AI GL</b><strong>AUTO</strong><small>ต่างกัน ${blendGap.toFixed(1)} จุดเปอร์เซ็นต์ • DEDUP + CONSENSUS</small></div>`;
  } else if (activeAutoMode === "gl") {
    heroBlock = statHero("🤖 AUTO Selection","AI GL",glHero,"AUTO");
  } else if (activeAutoMode === "ai") {
    heroBlock = statHero("🤖 AUTO Selection","AI L",aiLHero,"AUTO");
  } else {
    heroBlock = statHero("🤖 AUTO Selection","Classic L",classicHero,"AUTO");
  }
  const note = currentLResultMode === "ai"
    ? (dataCount ? `AI L ใช้ข้อมูลย้อนหลัง ${dataCount} งวด • 12 งวด 50% • 30 งวด 30% • 60 งวด 20% • คะแนนใช้สำหรับเรียงอันดับ` : `ยังไม่มี History สำหรับ AI L ใน Profile นี้`)
    : currentLResultMode === "independent"
    ? (independent.pending ? `ต้องมี History อย่างน้อย 8 งวด (ขณะนี้ ${independent.dataCount} งวด)` : `วิเคราะห์ผลจริงย้อนหลัง ${independent.dataCount} งวดโดยตรง • น้ำหนัก 12/30/60 = 50/30/20 • ไม่ใช้เลข L • สร้าง Top 10 จาก 000–999`)
    : currentLResultMode === "master"
      ? (master.pending ? `Master AI ต้องมี History อย่างน้อย 8 งวด` : `Adaptive Weight: Classic ${master.weights.classic}% • AI L ${master.weights.aiL}% • AI อิสระ ${master.weights.independent}% • AI Pair ${master.weights.pair}%`)
    : currentLResultMode === "overlap"
      ? (independent.pending
        ? `AI อิสระต้องมี History อย่างน้อย 8 งวด (ขณะนี้ ${independent.dataCount} งวด)`
        : `L มี ${ranked.length} ชุด • AI อิสระ ${currentLRankLimit === 0 ? "Top 100" : `Top ${currentLRankLimit}`} มี ${independentItems.length} ชุด • จุดร่วม ${overlap.length} ชุด`)
      : (dataCount ? `ข้อมูลทั้งหมด ${dataCount} งวด • 12 งวด 50% • 30 งวด 30% • 60 งวด 20% • คะแนนใช้สำหรับเรียงอันดับ` : `ยังไม่มี History สำหรับ Profile นี้ ลำดับขณะนี้ใช้โครงสร้างตารางเป็นหลัก`);
  showModal(`
    <div class="modal-head"><div><h2>ผลลัพธ์เลข L</h2><p>${escapeHtml(profileName)} • ${escapeHtml(title)}</p></div><button class="icon-btn" data-close>×</button></div>
    <div class="l-engine-tabs l-engine-tabs-five">
      <button class="l-engine-tab ${currentLResultMode === "l" ? "active" : ""}" data-l-engine="l">AUTO</button>
      <button class="l-engine-tab ${currentLResultMode === "ai" ? "active" : ""} ${ranked.length ? "" : "unavailable"}" data-l-engine="ai">AI L</button>
      <button class="l-engine-tab ${currentLResultMode === "gl" ? "active" : ""} ${glRanked.length ? "" : "unavailable"}" data-l-engine="gl">AI GL</button>
      <button class="l-engine-tab ${currentLResultMode === "independent" ? "active" : ""}" data-l-engine="independent">AI อิสระ</button>
      <button class="l-engine-tab ${currentLResultMode === "overlap" ? "active" : ""}" data-l-engine="overlap">L × AI</button>
    </div>
    ${heroBlock}
    <div class="l-rank-tabs">
      ${[[0,(currentLResultMode === "independent" || currentLResultMode === "master") ? "Top 10" : "ทั้งหมด"],[10,"Top 10"],[5,"Top 5"],[3,"Top 3"]].map(([n,label],i)=>`<button class="l-rank-tab ${((currentLResultMode === "independent" || currentLResultMode === "master") && currentLRankLimit===0 && i===0) || currentLRankLimit===n?'active':''}" data-rank-limit="${n}">${label}</button>`).join("")}
    </div>
    <div class="l-search-wrap">
      <span>🔎</span>
      <input id="lSearchInput" class="l-search-input" type="text" readonly maxlength="3" data-numeric-keypad="true" placeholder="ค้นหาเลข เช่น 356" value="${escapeHtml(searchValue)}">
      <button id="clearLSearch" class="search-clear" type="button">Clear</button>
    </div>
    <div class="l-result-grid ai-ranked-grid ux-candidate-grid compact-three-column">${visible.map((item,i)=>{const meta=getCandidateUiMeta(visible,i,currentLResultMode,dataCount);return currentLResultMode === "independent"
      ? `<button class="l-number ai-ranked-number independent-number ${item.aiRank<=3?'top-three':''}" data-independent-number="${item.number}" data-number="${item.number}" aria-label="${item.number} ${meta.label} Score ${meta.score} จาก 100"><div class="candidate-card-top"><em class="confidence-badge ${meta.kind}">${meta.label}</em></div><b>${item.number}</b><small>Score ${meta.score}/100</small></button>`
      : currentLResultMode === "master"
      ? `<button class="l-number ai-ranked-number master-number ${item.masterRank<=3?'top-three':''}" data-master-number="${item.number}" data-number="${item.number}" aria-label="${item.number} ${meta.label} Score ${meta.score} จาก 100"><div class="candidate-card-top"><em class="confidence-badge ${meta.kind}">${meta.label}</em></div><b>${item.number}</b><small>Score ${meta.score}/100</small></button>`
      : `<button class="l-number ai-ranked-number ${(item.aiRank||i+1)<=3?'top-three':''}" data-ranked-number="${item.number}" data-number="${item.number}" aria-label="${item.number} ${meta.label} Score ${meta.score} จาก 100"><div class="candidate-card-top"><em class="confidence-badge ${meta.kind}">${meta.label}</em></div><b>${item.number}</b><small>${(currentLResultMode === "blend" || (currentLResultMode === "l" && blendReady)) && item.blendSources?.length > 1 ? "AI L + AI GL" : `Score ${meta.score}/100`}</small></button>`}).join("") || `<div class="empty-card flat visible-empty">${currentLResultMode === "blend" || (currentLResultMode === "l" && blendReady) ? "BLEND ยังสร้างรายการเลขไม่ได้ • ตรวจ AI L / AI GL สำหรับงวดนี้" : currentLResultMode === "gl" ? "AI GL ยังไม่มีตารางสำหรับงวดนี้" : currentLResultMode === "ai" ? "AI L ยังไม่มีตารางสำหรับงวดนี้" : currentLResultMode === "overlap" ? (independent.pending ? `AI อิสระยังคำนวณไม่ได้ • History ${independent.dataCount}/8 งวด` : `คำนวณแล้ว: L ${ranked.length} ชุด × AI ${currentLRankLimit === 0 ? "Top 100" : `Top ${currentLRankLimit}`} ${independentItems.length} ชุด • ยังไม่มีเลขร่วม`) : currentLResultMode === "independent" ? "ข้อมูล History ยังไม่พอสำหรับ AI อิสระ" : "ยังไม่มีเลข L สำหรับงวดนี้"}</div>`}</div>
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
  document.querySelectorAll("[data-ranked-number]").forEach(btn=>btn.addEventListener("click",()=>{const item=source.find(x=>x.number===btn.dataset.rankedNumber) || ranked.find(x=>x.number===btn.dataset.rankedNumber);if(item)openLDetail(item);}));
  document.querySelectorAll("[data-independent-number]").forEach(btn=>btn.addEventListener("click",()=>{const item=independentItems.find(x=>x.number===btn.dataset.independentNumber);if(item)openIndependentDetail(item);}));
  document.querySelectorAll("[data-master-number]").forEach(btn=>btn.addEventListener("click",()=>{const item=masterItems.find(x=>x.number===btn.dataset.masterNumber);if(item)openMasterDetail(item,master.weights);}));
  searchInput.addEventListener("input",applySearch); document.getElementById("clearLSearch").addEventListener("click",()=>{searchInput.value="";searchInput.focus();applySearch();}); applySearch(); if(searchValue)searchInput.focus();
}

function openMasterDetail(item,weights){
  showModal(`<div class="modal-head"><div><h2>Master AI #${item.masterRank}</h2><p>Classic + AI L + AI อิสระ + AI Pair</p></div><button class="icon-btn" data-close>×</button></div><div class="hero-number">${escapeHtml(item.number)}</div><div class="ai-number-detail"><div><span>Master Rank Score (raw)</span><b>${item.masterScore}</b></div><div><span>สนับสนุน</span><b>${item.sources.length} ระบบ</b></div></div><div class="ai-reason-list"><span>• ${escapeHtml(item.sources.join(' + '))}</span><span>• Weight: Classic ${weights.classic}% • AI L ${weights.aiL}% • AI อิสระ ${weights.independent}% • AI Pair ${weights.pair}%</span></div><button id="btnBackResults" class="btn secondary full">กลับผลลัพธ์</button>`);
  document.getElementById("btnBackResults")?.addEventListener("click",()=>openLResults("",currentLRankLimit,"master"));
}

function openIndependentDetail(item) {
  showModal(`<div class="modal-head"><div><h2>AI อิสระ #${item.aiRank}</h2><p>วิเคราะห์จาก History โดยไม่อ้างอิงเลข L</p></div><button class="icon-btn" data-close>×</button></div>
    <div class="hero-number">${escapeHtml(item.number)}</div>
    <div class="ai-number-detail"><div><span>อันดับ</span><b>#${item.aiRank}</b></div><div><span>Rank Score (raw)</span><b>${item.aiScore}</b></div></div>
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
    ${item.aiRank ? `<div class="ai-number-detail"><div><span>อันดับ AI</span><b>#${item.aiRank}</b></div><div><span>Rank Score (raw)</span><b>${item.aiScore}</b></div></div><div class="ai-reason-list">${(item.aiReasons || []).map(reason=>`<span>• ${escapeHtml(reason)}</span>`).join("")}</div>` : ""}
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

// V7.09.59 — Import No-Result Guard.
// Thai lottery result pages may keep a dated row but replace both result columns
// with “งดออกผล”. OCR window/stream strategies must never borrow digits from
// the following row for that date. Treat these phrases as a hard stop.
function normalizeImportNoResultText(text = "") {
  return normalizeOcrDigits(String(text || ""))
    .toLowerCase()
    .replace(/[\s._,;:|/\\()[\]{}'"`~!@#$%^&*+=?\-–—]/g, "");
}

function isImportNoResultText(text = "") {
  const clean = normalizeImportNoResultText(text);
  if (!clean) return false;
  return [
    "งดออกผล",
    "งดการออกผล",
    "งดประกาศผล",
    "ไม่มีผล",
    "เลื่อนออกผล"
  ].some(token => clean.includes(token));
}

function extractImportNoResultDates(text = "") {
  const normalized = normalizeOcrDigits(String(text || ""));
  const lines = normalized.split(/\r?\n/).map(x => x.replace(/\s+/g, " ").trim()).filter(Boolean);
  const dates = new Set();
  let activeDate = "";
  let activeBlock = [];

  const flush = () => {
    if (activeDate && isImportNoResultText(activeBlock.join(" "))) dates.add(activeDate);
    activeDate = "";
    activeBlock = [];
  };

  // Build OCR blocks from one recognized date line up to (but not including)
  // the next recognized date line. This supports both same-line and split-line
  // “งดออกผล” without ever assigning the phrase to the previous/next date.
  lines.forEach(line => {
    const dm = parseImportDateMatch(line);
    if (dm?.date) {
      flush();
      activeDate = dm.date;
      activeBlock = [line];
    } else if (activeDate) {
      activeBlock.push(line);
    }
  });
  flush();
  return dates;
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
    if (isImportNoResultText(line)) return;
    const nums = parseNumbersNearDate(line, dm.raw);
    if (!/^\d{3}$/.test(nums.number) || !/^\d{2}$/.test(nums.twoDigit)) return;
    const key = `${dm.date}|${nums.number}|${nums.twoDigit}`;
    if (!seen.has(key)) {
      seen.add(key);
      rows.push({ id:`import-line-${lineIndex}-${Date.now()}`, date:dm.date, number:nums.number, twoDigit:nums.twoDigit, enabled:true, sourceLine:line, parsePriority:3 });
    }
  });

  // Strategy 2: iPhone screenshots often split one visual row into 2–3 OCR lines.
  // Build a strict block from this date line only up to the next date line so
  // result digits can never bleed backward from a different day.
  for (let i = 0; i < lines.length; i++) {
    const firstDm = parseImportDateMatch(lines[i]);
    if (!firstDm) continue;
    const blockLines = [lines[i]];
    for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
      if (parseImportDateMatch(lines[j])) break;
      blockLines.push(lines[j]);
    }
    const currentDateBlock = blockLines.join(" ");
    if (isImportNoResultText(currentDateBlock)) continue;
    const dm = parseImportDateMatch(currentDateBlock) || firstDm;
    const nums = parseNumbersNearDate(currentDateBlock, dm.raw);
    if (!/^\d{3}$/.test(nums.number) || !/^\d{2}$/.test(nums.twoDigit)) continue;
    const key = `${dm.date}|${nums.number}|${nums.twoDigit}`;
    if (!seen.has(key)) {
      seen.add(key);
      rows.push({ id:`import-window-${i}-${Date.now()}`, date:dm.date, number:nums.number, twoDigit:nums.twoDigit, enabled:true, sourceLine:currentDateBlock, parsePriority:2 });
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
    // Hard stop at NO RESULT: this is the critical guard against date-to-next-row bleed.
    if (isImportNoResultText(segment)) return;
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
  const spatialText = spatialLines.join("\n");
  // Build one shared blocked-date set from both OCR representations. This prevents
  // a weaker OCR pass from re-introducing a false numeric row for a NO RESULT date.
  const noResultDates = new Set([
    ...extractImportNoResultDates(normalized),
    ...extractImportNoResultDates(spatialText)
  ]);
  const candidates = [
    ...parseImportRowsFromText(spatialText),
    ...parseImportRowsFromText(normalized)
  ].filter(row => !noResultDates.has(row.date));
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
  return { rows, rawText, noResultDates:[...noResultDates].sort() };
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
  importSandboxImportStats = { files:validFiles.length, read:0, failed:0, found:0, noResult:0 };
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
        importSandboxImportStats.noResult += Array.isArray(parsed.noResultDates) ? parsed.noResultDates.length : 0;
        importSandboxRawText += `${importSandboxRawText ? "\n\n" : ""}===== รูป ${fileIndex + 1}: ${file.name} =====\n${parsed.rawText}${parsed.noResultDates?.length ? `\n[NO RESULT Guard] ข้ามวันที่: ${parsed.noResultDates.join(", ")}` : ""}`;
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
      ? `อ่านสำเร็จ ${importSandboxImportStats.read}/${validFiles.length} รูป • ตรวจพบ ${rows.length} วัน${importSandboxImportStats.noResult ? ` • ข้ามงดออกผล ${importSandboxImportStats.noResult} วัน` : ""}${duplicateCount ? ` • รวมรายการซ้ำ ${duplicateCount}` : ""}${importSandboxImportStats.failed ? ` • อ่านไม่สำเร็จ ${importSandboxImportStats.failed} รูป` : ""}`
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
    if (index % 4 === 0) await waitForImportProgressPaint(0);
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
    if (index % 4 === 0) await waitForImportProgressPaint(0);
    const savedActual = { id:uid(), profileId, profileName, date:item.date, number:item.number, twoDigit:item.twoDigit, note:"นำเข้าหลายวันจากรูป (ตรวจสอบแล้ว)", referenceTableId:"", source:"image-import-overwrite-v539", createdAt:Date.now() + toUpdate.length + index };
    state.actualDraws.push(savedActual); saved.push(savedActual);
  }
  // V7.09.61 — a successful new import supersedes any previous Reset-All tombstone.
  // Leaving the tombstone attached to fresh source data makes recovery ambiguous on iOS.
  delete state._historyResetAt;

  // V7.09.60 — iOS import durability guard.
  // A large History/WF state can exceed localStorage quota. In that case saveState()
  // may look successful in-memory until iOS suspends/reloads the PWA. Commit the newly
  // imported actualDraws to IndexedDB NOW and await transaction completion before
  // continuing, so one app swipe/background transition cannot erase the import.
  const importMainSaved = saveState(); // บันทึกผลจริงก่อนเสมอ
  clearTimeout(persistenceWriteTimer);
  persistenceWriteTimer = null;
  const importIndexedSaved = await commitStateDurably();
  const importSourceCheckpointSaved = await writeHistorySourceCheckpoint(state);
  if (!importMainSaved && !importIndexedSaved && !importSourceCheckpointSaved) {
    button.disabled = false;
    updateImportAiProgress(button, 0, "บันทึกถาวรไม่สำเร็จ");
    return alert("พื้นที่จัดเก็บของแอปไม่พร้อม จึงยังไม่ยืนยัน Import เพื่อป้องกัน History หาย กรุณาปิด/เปิดแอปแล้วลองใหม่");
  }
  updateImportAiProgress(button, 30, "✓ บันทึกข้อมูลถาวรแล้ว • กำลังสร้างตาราง…");
  await waitForImportProgressPaint();

  // สร้างตารางครบทุกวันก่อน เพื่อให้งวดถัดไปเชื่อมตารางย้อนหลังได้จริง
  saved.sort((a,b)=>a.date.localeCompare(b.date));
  for (let index = 0; index < saved.length; index++) {
    const savedActual = saved[index];
    if(index===0 || index===saved.length-1 || index%12===0)
      updateImportAiProgress(button, 30 + ((index + 1) / Math.max(saved.length, 1)) * 35, `กำลังสร้างตาราง ${index + 1}/${saved.length}…`);
    if (index % 16 === 0) await waitForImportProgressPaint(0);
    try { upsertDailyTableFromActual(savedActual); }
    catch (error) { console.error("Multi import table failed", savedActual.date, error); warnings.push(`Table ${savedActual.date}`); }
  }
  try { syncAutoLHistoryForProfile(profileId); }
  catch (error) { console.error("Multi import L History failed", error); warnings.push("L History"); }
  saveState();
  // Persist the derived Table/History checkpoint before the heavier WF pass. If iOS
  // suspends during WF, startup can still restore the imported results and rebuild
  // derived rows instead of returning to an empty History.
  clearTimeout(persistenceWriteTimer);
  persistenceWriteTimer = null;
  await commitStateDurably();
  await writeHistorySourceCheckpoint(state);
  updateImportAiProgress(button, 68, "✓ Table/History บันทึกถาวรแล้ว • กำลังทำ Fast Walk-Forward…");
  await waitForImportProgressPaint();
  try {
    const earliestChangedDate = saved.reduce((min, row) => !min || String(row.date) < min ? String(row.date) : min, "");
    const coldWfCount=(state.actualDraws||[]).filter(d=>Number(d.profileId??0)===profileId && /^\d{3}$/.test(String(d.number||""))).length;
    const coldMode=coldWfCount>=60 && (!getWalkForwardBucket(profileId)?.records?.length);
    await rebuildWalkForwardBacktest(profileId, (done,total,date,meta={}) => {
      const wfDone=Math.min(total,done+1), wfPercent=Math.round(wfDone*100/Math.max(total,1));
      const percent = 68 + (wfDone / Math.max(total,1)) * 18;
      const reused = Number(meta.reused||0);
      updateImportAiProgress(button, percent, `WF Fast ${wfDone}/${total} (${wfPercent}%) • ใช้ของเดิม ${reused} งวด • ${date}`);
    }, {startDate:earliestChangedDate, progressEvery:coldMode?4:2, yieldEvery:coldMode?12:6});
  } catch (wfError) {
    console.error("Walk-forward reconstruction failed", wfError); warnings.push("Walk-Forward");
  }
  updateImportAiProgress(button, 87, "✓ Fast Walk-Forward พร้อม • กำลังอัปเดต AI Live…");
  await waitForImportProgressPaint();

  // ฝึก AI Live เพียงครั้งเดียวหลังมีตารางครบแล้ว; WF ด้านบนแยกเป็น prior-only และไม่เขียนทับ Verified Live
  let aiMessage = "AI ยังมีข้อมูลไม่ครบ 8 งวด";
  try {
    updateImportAiProgress(button, 91, `AI Live กำลังเรียนรู้ ${profileName}…`);
    await waitForImportProgressPaint(60);
    const aiResult = generateAIFormula(profileId);
    if (aiResult?.error) aiMessage = aiResult.error;
    else {
      const glResult=generateAIGLFormula(profileId);
      aiMessage = `AI V${aiResult.version || 1} เรียนรู้ ${aiResult.sampleCount || 0} งวดแล้ว`;
      if(!glResult?.error) aiMessage+=` • GL V${glResult.version||1}`;
      // V6.8.2: ห้ามเขียน Prediction ของทุก engine ย้อนทับ History เก่าหลังรู้ผล
      // หลัง Import ให้ล็อก Prediction ได้เฉพาะตารางล่าสุดสำหรับงวดถัดไปที่ยังไม่มีผลจริงเท่านั้น
      const latestTable = (state.dailyTables || [])
        .filter(t => Number(t.profileId) === profileId)
        .sort((a,b) => String(b.date || "").localeCompare(String(a.date || "")))[0] || null;
      if (latestTable) saveAIPredictionSnapshotsForTable(latestTable);
    }
  } catch (error) {
    console.error("Multi import AI failed", error); warnings.push("AI"); aiMessage = "AI ประมวลผลไม่สำเร็จ แต่ History ถูกบันทึกแล้ว";
  }
  try { syncAutoLHistoryForProfile(profileId); } catch (_) {}
  saveState();
  // Do not expose 100% until the final imported History/AI state is durable. This is
  // deliberately awaited rather than left on the normal 80 ms coalescing timer,
  // because iOS may freeze a Home Screen PWA immediately after the user swipes away.
  clearTimeout(persistenceWriteTimer);
  persistenceWriteTimer = null;
  const finalImportDurable = await commitStateDurably();
  const finalSourceCheckpointDurable = await writeHistorySourceCheckpoint(state);
  updateImportAiProgress(button, 100, (finalImportDurable || finalSourceCheckpointDurable) ? "✓ ประมวลผลและบันทึกถาวรสำเร็จ" : "✓ ประมวลผลสำเร็จ • ใช้ Local Backup");
  await waitForImportProgressPaint(550);
  importSandboxPreviewUrl = "";
  importSandboxPreviewUrls = [];
  closeModal(); state.activeProfile = profileId; state.currentView = "history"; saveState(); render();
  const suffix = skipped ? ` • ข้าม/รวมซ้ำ ${skipped}` : "";
  showToast(warnings.length ? `✓ บันทึก ${saved.length} รายการแล้ว${suffix} • ${aiMessage} • มีบางส่วนต้องตรวจสอบ` : `✓ นำเข้า ${saved.length} วันแล้ว • Table/History/Fast WF พร้อม • ${aiMessage}${suffix}`);
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
    let autoTable = getDailyTable(profileId, expectedDate);

    // V6.9.8: self-heal an interrupted Fast Save. The result may already be durable
    // while its same-day auto table was not committed yet (for example the app was
    // closed during WF/AI processing). When Edit needs that exact previous-business-day
    // table, rebuild only that missing expected table from the already-saved result.
    // This is deliberately narrow: it does not recreate every deleted historical table.
    if (isEdit && expectedDate && !autoTable) {
      const sourceActual = (state.actualDraws || []).find(draw =>
        Number(draw.profileId ?? 0) === profileId &&
        String(draw.date || "") === String(expectedDate) &&
        /^\d{3}$/.test(String(draw.number || "")) &&
        /^\d{2}$/.test(String(draw.twoDigit || ""))
      ) || null;
      if (sourceActual) {
        try {
          autoTable = upsertDailyTableFromActual(sourceActual);
          if (autoTable) {
            autoTable.recoveredMissingTableV698 = true;
            autoTable.recoveredAt = Date.now();
            saveState();
          }
        } catch (error) {
          console.warn("Edit reference-table self-heal failed", profileId, expectedDate, error);
        }
      }
    }

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

    // V6.9.4: classify the change BEFORE mutating state. A brand-new latest draw can
    // be handled in O(1) History work + one WF row; an old edit/backfill must rebuild
    // only from the affected date forward because later WF models may have learned from it.
    const oldExistingDate = existing ? String(existing.date || "") : "";
    const otherProfileDates = (state.actualDraws || [])
      .filter(x => Number(x.profileId ?? 0) === profileId && x.id !== existingId)
      .map(x => String(x.date || "")).filter(x => /^\d{4}-\d{2}-\d{2}$/.test(x)).sort();
    const latestDateBeforeSave = otherProfileDates.at(-1) || "";

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

    // V7.09.8: freeze the AUTO choice using only evidence strictly before this result date.
    // This is computed before the result is inserted/edited, so the target result cannot influence its own AUTO choice.
    const autoDecisionAtSave = getHistoricalAutoFormulaDecision(profileId, date, 30);

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
        existing.autoDecisionSnapshot = {...autoDecisionAtSave,reconstructed:false,trustedOnly:true,recordedAt:Date.now()};
        savedActual = existing;
      } else {
        // อนุญาตให้บันทึกมากกว่าหนึ่งรายการใน Profile/วันที่เดียวกันหลังผู้ใช้กดยืนยัน
        savedActual = { id: uid(), profileId, profileName, date, number, twoDigit, note, referenceTableId:"", source:"manual", createdAt: Date.now(), autoDecisionSnapshot:{...autoDecisionAtSave,reconstructed:false,trustedOnly:true,recordedAt:Date.now()} };
        state.actualDraws.push(savedActual);
      }

      const isNewLatestDraw = !existing && !duplicate && (!latestDateBeforeSave || String(date) > latestDateBeforeSave);
      const earliestAffectedDate = existing && oldExistingDate && oldExistingDate < String(date) ? oldExistingDate : String(date);
      const wfIncrementalStart = walkForwardAffectedStartDate(profileId, earliestAffectedDate);
      // V6.9.4: do NOT throw away the whole WF cache for a one-day append. The existing
      // prefix is preserved and, when a WF cache exists, only the changed row onward is rebuilt.
      // Verified Live snapshots remain untouched.
      // บันทึกข้อมูลหลักก่อนเสมอ เพื่อไม่ให้ขั้นตอนสร้างตาราง/AI ทำให้ข้อมูลผลจริงสูญหาย
      saveState();
      updateActualDrawProgress(30, "✓ บันทึกผลจริงแล้ว • กำลังอัปเดต History…");
      await waitForActualDrawProgressPaint(70);

      let autoTable = null;
      let aiUpdate = null;
      let glUpdate = null;
      const warnings = [];

      try {
        autoTable = upsertDailyTableFromActual(savedActual);
        // V6.9.8 durability fix: commit the generated table immediately, before
        // any heavier History/WF/AI work. If iOS suspends/closes the PWA afterwards,
        // the next business day will still find this table in Edit/History.
        if (autoTable) saveState();
        syncAutoLHistoryForActual(savedActual);
        // V6.9.4 Fast Save: a normal newest draw has no later result that can depend on
        // today's newly-created table, so touching every old History row is wasted work.
        // Backfill/edit still resyncs the profile because later saved results may need relinking.
        if (!isNewLatestDraw) syncAutoLHistoryForProfile(profileId);

        // Keep WF fair and current without rebuilding old days. New latest draw = normally 1 row.
        // Historical edit/backfill = only changed date -> present. If no WF cache exists yet,
        // V6.9.5 queues a one-time background bootstrap after Save so the UI never stays 0/N.
        if (wfIncrementalStart) {
          await rebuildWalkForwardBacktest(profileId, null, {startDate:wfIncrementalStart});
        } else {
          scheduleMissingWalkForwardBootstrap(profileId);
        }
      } catch (historyError) {
        console.error("Actual result saved, but history/table sync failed", historyError);
        warnings.push("History/Table");
      }

      updateActualDrawProgress(65, warnings.includes("History/Table") ? "บันทึกแล้ว • กำลังอัปเดต AI…" : (isNewLatestDraw ? "✓ อัปเดต 1 งวดแล้ว • AI กำลังเรียนรู้ข้อมูลใหม่…" : "✓ History/WF พร้อม • AI กำลังเรียนรู้ข้อมูลที่แก้…"));
      await waitForActualDrawProgressPaint(70);

      try {
        // AI เรียนรู้และพัฒนาสูตรอัตโนมัติหลังบันทึกผลจริง
        aiUpdate = autoEvolveAfterActualSave(profileId);
        glUpdate = autoEvolveAIGLAfterActualSave(profileId);
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

    if (aiUpdate?.recommended && getConfiguredFormulaMode(profileId) !== "auto") {
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

async function deleteActualDrawWithSync(id, {skipConfirm=false, preserveScrollY=null} = {}) {
  const r = (state.actualDraws || []).find(x => String(x.id) === String(id));
  if (!r) return false;
    if (!skipConfirm && !confirm("ConfirmDeleteเลขออกจริง 3 หลักนี้?")) return false;

    const deletedProfileId = Number(r.profileId ?? 0);
    const deletedDate = String(r.date || "");
    const hadWalkForwardBucket = Boolean(getWalkForwardBucket(deletedProfileId));
    const deletedTableIds = new Set((state.dailyTables || [])
      .filter(t => t?.autoGeneratedFromActual === true && String(t.sourceActualDrawId || "") === String(id))
      .map(t => String(t.id || ""))
      .filter(Boolean));

    // V6.10.12 Delete Sync: commit the user's deletion first. Any table generated
    // directly from the deleted result is stale too, because it encoded those digits
    // as the next-draw input. Manual/unrelated tables are intentionally preserved.
    state.actualDraws = (state.actualDraws || []).filter(x => x.id !== id);
    state.dailyTables = (state.dailyTables || []).filter(t => !(t?.autoGeneratedFromActual === true && String(t.sourceActualDrawId || "") === String(id)));
    state.records = (state.records || []).filter(x => {
      if (x?.autoGenerated === true && String(x.sourceActualDrawId || "") === String(id)) return false;
      if (x?.autoGenerated === true && deletedTableIds.has(String(x.sourceDailyTableId || ""))) return false;
      return true;
    });

    // A removed source table can change which earlier table the following draws use.
    // Re-link only this Profile before rebuilding WF/AI; no other Profile is touched.
    try { syncAutoLHistoryForProfile(deletedProfileId); }
    catch (error) { console.warn("Delete History resync warning", deletedProfileId, error); }

    clearPerformanceCaches();
    activeRenderPerfSignature = "";
    invalidateViewCache();
    saveState();
    closeModal();
    render();
    if (Number.isFinite(Number(preserveScrollY))) requestAnimationFrame(() => window.scrollTo(0, Math.max(0, Number(preserveScrollY))));
    showToast("✓ ลบแล้ว • กำลังอัปเดต WF / AI…");

    let wfUpdated = false;
    let aiUpdated = false;
    try {
      // Preserve the valid prefix and rebuild only the deleted date -> present.
      // If there was no WF bucket yet, queue the normal one-time bootstrap instead.
      if (hadWalkForwardBucket && /^\d{4}-\d{2}-\d{2}$/.test(deletedDate)) {
        await rebuildWalkForwardBacktest(deletedProfileId, null, {startDate:deletedDate});
        wfUpdated = true;
      } else {
        wfUpdated = scheduleMissingWalkForwardBootstrap(deletedProfileId) || !hadWalkForwardBucket;
      }
    } catch (error) {
      console.error("Delete WF refresh failed", deletedProfileId, deletedDate, error);
      // Never leave a stale bucket claiming to match the now-deleted History.
      invalidateWalkForwardBacktest(deletedProfileId);
      scheduleMissingWalkForwardBootstrap(deletedProfileId);
    }

    try {
      const remainingSamples = getFormulaSamples(deletedProfileId).length;
      if (remainingSamples < 8) {
        // Warm-up protection: a model trained on data that was just removed must not
        // remain active once the Profile has fewer than the minimum 8 linked samples.
        if (state.aiFormulaLab && Object.prototype.hasOwnProperty.call(state.aiFormulaLab, deletedProfileId)) {
          delete state.aiFormulaLab[deletedProfileId];
        }
        if(state.aiGLFormulaLab) delete state.aiGLFormulaLab[deletedProfileId];
        writeAILearningStatus(deletedProfileId, {
          outcome:"waiting-after-delete", accepted:false, formulaChanged:false,
          previousScore:null, newScore:null, improvement:null,
          reason:`ลบข้อมูลแล้วเหลือ ${remainingSamples}/8 งวด • รอข้อมูลขั้นต่ำก่อนให้ AI L ทำงาน`,
          testTotal:0, deploymentStatus:"waiting"
        });
        aiUpdated = true;
      } else {
        // Re-evaluate/refine AI L against the remaining History immediately. The
        // normal protection still prevents a worse replacement from being deployed.
        autoEvolveAfterActualSave(deletedProfileId);
        autoEvolveAIGLAfterActualSave(deletedProfileId);
        aiUpdated = true;
      }
    } catch (error) {
      console.error("Delete AI refresh failed", deletedProfileId, error);
    }

    clearPerformanceCaches();
    activeRenderPerfSignature = "";
    invalidateViewCache();
    saveState();
    if (Number(state.activeProfile) === deletedProfileId && state.currentView === "history") {
      render();
      if (Number.isFinite(Number(preserveScrollY))) requestAnimationFrame(() => window.scrollTo(0, Math.max(0, Number(preserveScrollY))));
    }
    showToast(wfUpdated && aiUpdated ? "✓ ลบแล้ว • History / WF / AI อัปเดตแล้ว" : "✓ ลบแล้ว • ระบบจะซิงก์ส่วนที่เหลือต่ออัตโนมัติ");
  return true;
}

function openActualDrawDetail(id) {
  const r = state.actualDraws.find(x => x.id === id); if (!r) return;
  const profileId = Number(r.profileId ?? 0);
  const profileName = r.profileName || state.profiles[profileId] || state.profiles[0] || "Profile 1";
  const t = getPredictionTable(profileId, r.date, r);
  const expected = getExpectedReferenceDate(r.date);
  const aiSaved = state.aiFormulaLab?.[profileId];
  const aiFormula = getHistoricalAIFormula(profileId, r.date, r);
  const universal=getUniversalPredictionSnapshot(profileId,r.date,r);
  const glFormula=Array.isArray(universal?.glFormula)?universal.glFormula:null;
  // Live snapshot is preferred. Imported-photo rows intentionally have no live snapshot,
  // so use the already-stored fair WF grid for this exact target draw as visual fallback.
  const wfRecord = getWalkForwardRecord(profileId, r);
  const wfAIGrid = Array.isArray(wfRecord?.grids?.aiL) ? wfRecord.grids.aiL : null;
  const hasWFAI = Boolean(wfAIGrid && wfRecord?.statuses?.aiL && wfRecord.statuses.aiL !== "pending");
  const wfGLGrid=Array.isArray(wfRecord?.grids?.gl)?wfRecord.grids.gl:null;
  const hasWFGL=Boolean(wfGLGrid&&wfRecord?.statuses?.gl&&wfRecord.statuses.gl!=="pending");

  let comparisonHtml = `<div class="detail-card"><div><span>Profile</span><b>${escapeHtml(profileName)}</b></div><div><span>วันที่ผลจริง</span><b>${formatDateTH(r.date)}</b></div><div><span>ต้องใช้ตารางวันที่</span><b>${formatDateTH(expected)}</b></div><div><span>สถานะตาราง</span><b>ยังไม่บันทึกตาราง</b></div><div><span>สถานะ</span><b>ยังไม่คำนวณ L</b></div><div><span>Note</span><b>${escapeHtml(r.note || "-")}</b></div></div>`;

  if (t) {
    const inputs = Array.isArray(t.inputDigits) && t.inputDigits.length === 5 ? t.inputDigits : [];
    const original = formulaMatchDetail(r.number, inputs, getOriginalFormula());
    const aiSource = aiFormula ? "live" : (hasWFAI ? "wf" : "none");
    const ai = aiFormula ? formulaMatchDetail(r.number, inputs, aiFormula) : (hasWFAI ? gridMatchDetail(r.number, wfAIGrid) : {status:"pending", matched:"-", grid:null});
    const glSource=glFormula?"live":hasWFGL?"wf":"none";
    const gl=glFormula?formulaMatchDetail(r.number,inputs,glFormula):(hasWFGL?gridMatchDetail(r.number,wfGLGrid):{status:"pending",matched:"-",grid:null});
    // For imported data, Classic + AI comparison shown in this modal can safely use the
    // exact WF status because both were produced from information before the target draw.
    const originalForWinner = aiSource === "wf" && wfRecord?.statuses?.classic ? wfRecord.statuses.classic : original.status;
    const aiForWinner = aiSource === "wf" ? wfRecord.statuses.aiL : ai.status;
    const winner = formulaWinner(originalForWinner, aiForWinner, aiSource !== "none");
    const winnerText = winner === "AI" ? "AI ชนะ — ตาราง AI ให้ผลดีกว่า" : winner === "เดิม" ? "สูตรเดิมชนะ" : winner === "เสมอ" ? "ผลเท่ากัน" : "ยังไม่มีสูตร AI";
    const statusBox = (title, detail, kind, source="") => `<section class="formula-detail-panel ${kind}"><div class="formula-detail-title"><div><small>${title}${source === "wf" ? " • WF" : ""}</small><b>${formulaStatusLabel(detail.status)}</b></div><span class="status ${detail.status} ${kind === "ai" ? "ai-status" : ""}">${formulaStatusLabel(detail.status)}</span></div>${detail.grid ? gridHtml(detail.grid) : '<div class="ai-empty compact">ยังไม่มีตาราง AI</div>'}<div class="formula-detail-meta"><span>ผลจากรูปแบบ L${source === "wf" ? " • Walk-Forward" : ""}</span><b>${escapeHtml(detail.matched || "-")}</b></div></section>`;
    comparisonHtml = `<div class="comparison-winner ${winner === "AI" ? "ai" : winner === "เดิม" ? "original" : "tie"}"><small>ผลการเปรียบเทียบ${aiSource === "wf" ? " • WF" : ""}</small><strong>${winnerText}</strong><span>Exact = Hit • เลขกลับ = Hit • Not Found = Miss${aiSource === "wf" ? " • WF ใช้เฉพาะข้อมูลก่อนงวดนี้" : ""}</span></div>
      <div class="formula-detail-stack">
        ${statusBox("ตารางดั้งเดิม", original, "original")}
        ${statusBox("ตาราง AI", ai, "ai", aiSource)}
        ${statusBox("ตาราง AI GL",gl,"ai",glSource)}
      </div>
      <div class="detail-card"><div><span>Profile</span><b>${escapeHtml(profileName)}</b></div><div><span>วันที่ผลจริง</span><b>${formatDateTH(r.date)}</b></div><div><span>ใช้ตารางวันที่</span><b>${formatDateTH(t.date)}${r.referenceTableId ? " (เลือกเอง)" : " (อัตโนมัติ)"}</b></div><div><span>สูตรเดิม</span><b>${formulaStatusLabel(original.status)}${original.matched !== "-" ? ` • ${escapeHtml(original.matched)}` : ""}</b></div><div><span>สูตร AI</span><b>${aiSource !== "none" ? `${formulaStatusLabel(ai.status)}${ai.matched !== "-" ? ` • ${escapeHtml(ai.matched)}` : ""}${aiSource === "wf" ? " • WF" : ""}` : "ยังไม่มีสูตร AI"}</b></div><div><span>AI GL</span><b>${glSource!=="none"?`${formulaStatusLabel(gl.status)}${glSource==="wf"?" • WF":""}`:"ยังไม่มี GL"}</b></div><div><span>ผู้ชนะ Classic/AI L</span><b>${winner}</b></div><div><span>Note</span><b>${escapeHtml(r.note || "-")}</b></div></div>`;
  }

  showModal(`<div class="modal-head"><div><h2>เลขออกจริง 3 หลัก</h2><p>${formatDateTH(r.date)} • ${DAYS_TH[new Date(`${r.date}T12:00:00`).getDay()]}</p></div><button class="icon-btn" data-close>×</button></div>
    <div class="actual-result-pair"><div><small>3 ตัว</small><strong>${escapeHtml(r.number)}</strong></div><div><small>2 ตัว</small><strong>${escapeHtml(r.twoDigit || "--")}</strong></div></div>
    ${comparisonHtml}
    <button id="editActualDraw" class="btn secondary full">Editข้อมูล</button>
    <button id="deleteActualDraw" class="btn danger full">Deleteเลขออกจริงนี้</button>`);
  document.getElementById("editActualDraw").addEventListener("click", () => openActualDrawForm(id));
  document.getElementById("deleteActualDraw").addEventListener("click", async () => {
    await deleteActualDrawWithSync(id);
  });
}

const SYSTEM_DARK_QUERY = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
let LAST_APPLIED_THEME = "";
let LAST_APPLIED_THEME_MODE = "";
function normalizedThemeMode() {
  return ["auto","light","dark"].includes(state.theme) ? state.theme : "auto";
}
function resolvedThemeMode() {
  const mode = normalizedThemeMode();
  return mode === "auto" ? (SYSTEM_DARK_QUERY?.matches ? "dark" : "light") : mode;
}
function applyThemeMode(force = false) {
  const mode = normalizedThemeMode();
  const resolved = resolvedThemeMode();
  // V6.10.5 performance: never touch <html> during normal page navigation
  // unless the actual theme/mode changed. This avoids Safari-wide style recalculation.
  if (!force && LAST_APPLIED_THEME === resolved && LAST_APPLIED_THEME_MODE === mode) return false;
  const root = document.documentElement;
  if (force || root.dataset.theme !== resolved) root.dataset.theme = resolved;
  if (force || root.dataset.themeMode !== mode) root.dataset.themeMode = mode;
  if (force || root.style.colorScheme !== resolved) root.style.colorScheme = resolved;
  LAST_APPLIED_THEME = resolved;
  LAST_APPLIED_THEME_MODE = mode;
  return true;
}
function syncThemeSettingButtons() {
  const mode = normalizedThemeMode();
  document.querySelectorAll("[data-theme-mode]").forEach(btn => btn.classList.toggle("active", btn.dataset.themeMode === mode));
}
function setThemeMode(mode) {
  if (!["auto","light","dark"].includes(mode)) return;
  if (state.theme === mode) { syncThemeSettingButtons(); return; }
  state.theme = mode;
  saveState();
  applyThemeMode();
  syncThemeSettingButtons();
}
if (SYSTEM_DARK_QUERY) {
  const onSystemThemeChange = () => {
    // CSS variables/selectors react immediately; a full app render is unnecessary.
    if (normalizedThemeMode() === "auto") applyThemeMode();
  };
  if (SYSTEM_DARK_QUERY.addEventListener) SYSTEM_DARK_QUERY.addEventListener("change", onSystemThemeChange);
  else if (SYSTEM_DARK_QUERY.addListener) SYSTEM_DARK_QUERY.addListener(onSystemThemeChange);
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

// V6.10.40-R3 Profile persistence hotfix.
// Keep Profile edits in memory immediately, then debounce the heavy durable write.
let profileNameSaveTimer = null;
function syncProfileNameInput(input) {
  if (!input) return false;
  const index = Number(input.dataset?.nameIndex);
  if (!Number.isInteger(index) || index < 0 || index >= state.profiles.length) return false;
  const nextName = String(input.value || "").trim() || `Profile ${index + 1}`;
  if (state.profiles[index] === nextName) return false;
  state.profiles[index] = nextName;
  for (const collection of [state.actualDraws, state.dailyTables, state.records]) {
    for (const item of (Array.isArray(collection) ? collection : [])) {
      if (Number(item?.profileId) === index) item.profileName = nextName;
    }
  }
  return true;
}
function scheduleProfileNameSave(delay = 350) {
  clearTimeout(profileNameSaveTimer);
  profileNameSaveTimer = setTimeout(() => {
    profileNameSaveTimer = null;
    try { saveState(); } catch (error) { console.warn("Profile autosave failed", error); }
  }, delay);
}
function flushProfileNamesBeforeSuspend() {
  clearTimeout(profileNameSaveTimer);
  profileNameSaveTimer = null;
  try { saveVisibleProfileNames(); } catch (_) {}
  try { saveProfileMutationDurably(); } catch (error) { console.warn("Profile suspend save failed", error); }
  if (stateHasHistoryPayload(state)) void writeHistorySourceCheckpoint(state);
}

function remapProfileIds(indexMap) {
  [state.records, state.actualDraws, state.dailyTables].forEach(collection => {
    (collection || []).forEach(item => {
      const oldId = Number(item.profileId);
      if (indexMap.has(oldId)) item.profileId = indexMap.get(oldId);
      if (state.profiles[item.profileId]) item.profileName = state.profiles[item.profileId];
    });
  });

  // V6.9.3: AI state is keyed by Profile index too. Reorder/delete must remap
  // these stores together with History, otherwise one Profile can inherit another's AI.
  const remapObjectKeys = (source, transform = value => value) => {
    const out = {};
    Object.entries(source || {}).forEach(([key, value]) => {
      const oldId = Number(key);
      if (!indexMap.has(oldId)) return;
      const newId = indexMap.get(oldId);
      out[newId] = transform(value, newId);
    });
    return out;
  };
  state.aiFormulaLab = remapObjectKeys(state.aiFormulaLab);
  state.aiLearningStatus = remapObjectKeys(state.aiLearningStatus);
  state.aiGLFormulaLab=remapObjectKeys(state.aiGLFormulaLab);
  state.aiGLLearningStatus=remapObjectKeys(state.aiGLLearningStatus);
  state.activeFormulaByProfile = remapObjectKeys(state.activeFormulaByProfile);
  state.walkForwardBacktests = remapObjectKeys(state.walkForwardBacktests, (bucket, newId) => {
    if (!bucket || typeof bucket !== "object") return bucket;
    const next = {...bucket, profileId:newId};
    if (Array.isArray(bucket.records)) next.records = bucket.records.map(r => r && typeof r === "object" ? {...r, profileId:newId} : r);
    return next;
  });

  // A restore job also carries Profile ids. Remap its lists so a later resume
  // cannot rebuild the wrong Profile after a reorder/delete.
  if (state.walkForwardRebuildJob && typeof state.walkForwardRebuildJob === "object") {
    const remapIds = list => (Array.isArray(list) ? list.map(x => indexMap.get(Number(x))).filter(Number.isInteger) : []);
    const job = {...state.walkForwardRebuildJob};
    ["profileIds","wfProfileIds","reusedProfileIds","invalidProfileIds"].forEach(key => { if (Array.isArray(job[key])) job[key] = remapIds(job[key]); });
    if (job.verificationResults && typeof job.verificationResults === "object") {
      job.verificationResults = remapObjectKeys(job.verificationResults);
    }
    state.walkForwardRebuildJob = job;
    try { localStorage.setItem(WF_JOB_KEY, JSON.stringify(job)); } catch (_) {}
  }

  clearPerformanceCaches();
  activeRenderPerfSignature = "";
  invalidateViewCache();
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
  nextProfileRevision();
  refreshWfCompletionAfterProfileMutation("reorder");
  saveProfileMutationDurably();
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

  const beforeProfiles = [...state.profiles];
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
  const profileRevision = nextProfileRevision();
  journalProfileDelete(beforeProfiles, index, name, state.profiles, profileRevision);
  if (state.walkForwardRebuildJob && typeof state.walkForwardRebuildJob === "object") {
    state.walkForwardRebuildJob = { ...state.walkForwardRebuildJob, profileRevision };
    try { localStorage.setItem(WF_JOB_KEY, JSON.stringify({...state.walkForwardRebuildJob, profileRevision:Number(state._profileRevision||0)})); } catch (_) {}
  }
  refreshWfCompletionAfterProfileMutation("delete");
  saveProfileMutationDurably();
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


// V6.8.2 — Fast JSON restore + resumable background Walk-Forward rebuild.
// Restore makes the data usable first, then rebuilds historical WF evidence in small
// background phases. The job checkpoint is persisted so iOS can close/reopen the PWA
// without starting the whole rebuild again.
let backgroundWfWorkerRunning = false;
function restoreReadinessMeta(percent, job=state.walkForwardRebuildJob) {
  const safe=Math.max(0,Math.min(100,Math.round(Number(percent)||0)));
  const rebuilt=(job?.wfProfileIds||[]).length;
  let level="กำลังอ่านข้อมูล", detail="Clean Rebuild: ยังไม่ใช้ผล AI เพื่อเปรียบเทียบ";
  if(safe>=100){ level="AI พร้อม 100%"; detail="History + WF + AI Live คำนวณใหม่จากศูนย์ครบแล้ว"; }
  else if(safe>=90){ level="WF พร้อม 90%+"; detail="WF ใหม่เสร็จเกือบทั้งหมด • กำลังสร้าง AI Live ใหม่"; }
  else if(safe>=30){ level="ข้อมูลพร้อมใช้งาน 30%+"; detail="History/ตารางพร้อม • WF กำลังคำนวณใหม่จากศูนย์"; }
  else if(safe>=20){ level="เตรียม Clean WF"; detail="AI/WF Cache เก่าถูกล้างแล้ว • กำลังเตรียม Rebuild"; }
  else if(safe>=15){ level="กำลังเชื่อม History"; detail="กำลังสร้าง derived History ใหม่จากข้อมูลต้นทาง"; }
  const cacheText=rebuilt?`Clean Rebuild ${rebuilt} Profile • Reuse Cache 0`:"Clean Rebuild • Reuse Cache 0";
  return {safe,level,detail,cacheText};
}
function paintJsonRestoreStatus(percent, message) {
  const host=document.getElementById("jsonRestoreStatus");
  if(!host) return;
  const meta=restoreReadinessMeta(percent);
  host.classList.toggle("complete",meta.safe>=100);
  host.classList.toggle("working",meta.safe<100);
  host.style.setProperty("--restore-pct",`${meta.safe}%`);
  const pct=host.querySelector("[data-restore-percent]"); if(pct) pct.textContent=`${meta.safe}%`;
  const bar=host.querySelector("[data-restore-bar]"); if(bar) bar.style.width=`${meta.safe}%`;
  const level=host.querySelector("[data-restore-level]"); if(level) level.textContent=meta.level;
  const detail=host.querySelector("[data-restore-detail]"); if(detail) detail.textContent=message||meta.detail;
  const cache=host.querySelector("[data-restore-cache]"); if(cache) cache.textContent=meta.cacheText;
}
function setJsonRestoreProgress(percent, message) {
  const label = document.querySelector('label.file-button[for="importFile"], label.file-button');
  const safe = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
  if (label) {
    label.dataset.restoreBusy = safe < 100 ? "true" : "false";
    label.style.pointerEvents = safe < 100 ? "none" : "";
    label.style.opacity = safe < 100 ? ".78" : "";
    const text=label.querySelector(".restore-label-text");
    if(text) text.textContent = `${message || "กำลังกู้คืน…"}${safe < 100 ? ` ${safe}%` : ""}`;
  }
  paintJsonRestoreStatus(safe,message);
}
function renderJsonRestoreStatus() {
  const job=state.walkForwardRebuildJob;
  const pct=job ? backgroundJobPercent(job) : 100;
  const meta=restoreReadinessMeta(pct,job);
  const hasJob=Boolean(job);
  const title=hasJob ? meta.level : "พร้อมกู้คืน JSON";
  const detail=hasJob ? (job.lastMessage||meta.detail) : "Clean Rebuild: History ก่อน → WF ใหม่ → AI Live ใหม่";
  const cache=hasJob ? meta.cacheText : "JSON Restore จะล้าง AI/WF Cache เก่าและคำนวณใหม่จากศูนย์";
  return `<div id="jsonRestoreStatus" class="json-restore-status ux-restore-status ${hasJob&&pct<100?'working':'complete'}" style="--restore-pct:${hasJob?pct:100}%">
    <div class="restore-ring-row"><div class="restore-ring"><div><strong data-restore-percent>${hasJob?pct:100}%</strong><small>READY</small></div></div><div class="restore-copy"><small>JSON RESTORE</small><b data-restore-level>${escapeHtml(title)}</b><p data-restore-detail>${escapeHtml(detail)}</p><span data-restore-cache>${escapeHtml(cache)}</span></div></div>
    <div class="json-restore-progress"><i data-restore-bar style="width:${hasJob?pct:100}%"></i></div>
    <div class="restore-step-flow"><em class="${pct>=15?'ready':''}">History</em><i>→</i><em class="${pct>=30?'ready':''}">Tables</em><i>→</i><em class="${pct>=90?'ready':''}">WF</em><i>→</i><em class="${pct>=100?'ready':''}">AI Live</em></div>
    <div class="json-restore-milestones"><em class="${pct>=30?'ready':''}">30% ข้อมูลพร้อม</em><em class="${pct>=90?'ready':''}">90% WF พร้อม</em><em class="${pct>=100?'ready':''}">100% AI พร้อม</em></div>
  </div>`;
}
function nextUiFrame(ms = 24) { return new Promise(resolve => setTimeout(resolve, ms)); }
function validRestoreDrawsSorted() {
  return (state.actualDraws||[]).filter(d=>/^\d{3}$/.test(String(d.number||"")) && /^\d{4}-\d{2}-\d{2}$/.test(String(d.date||"")))
    .slice().sort((a,b)=>String(a.date||"").localeCompare(String(b.date||""))||Number(a.createdAt||0)-Number(b.createdAt||0));
}
function restoreJobProfileIds() {
  return [...new Set(validRestoreDrawsSorted().map(d=>Number(d.profileId??0)))]
    .filter(id=>Number.isInteger(id)&&id>=0&&id<state.profiles.length).sort((a,b)=>a-b);
}
function createWalkForwardRebuildJob(options = {}) {
  const draws=validRestoreDrawsSorted(), ids=restoreJobProfileIds();
  const cleanRebuild=Boolean(options.cleanRebuild);
  return {
    version:3,status:"queued",phase:"tables",tableIndex:0,syncProfileIndex:0,verifyProfileIndex:0,wfProfileIndex:0,liveProfileIndex:0,
    profileIds:ids,wfProfileIds:cleanRebuild?[...ids]:[],reusedProfileIds:[],invalidProfileIds:cleanRebuild?[...ids]:[],verificationResults:{},cleanRebuild,
    totalDraws:draws.length,startedAt:Date.now(),updatedAt:Date.now(),lastMessage:cleanRebuild?"Clean Rebuild • AI/WF Cache เก่าถูกล้างแล้ว":"รอตรวจ WF Cache เบื้องหลัง"
  };
}
function updateWalkForwardJob(patch={}) {
  if(!state.walkForwardRebuildJob) return;
  state.walkForwardRebuildJob={...state.walkForwardRebuildJob,...patch,updatedAt:Date.now()};
  // Lightweight checkpoint only. Avoid serializing the full 60MB+ restored state
  // every few rows; profile completion still persists the full state safely.
  try { localStorage.setItem(WF_JOB_KEY, JSON.stringify({...state.walkForwardRebuildJob, profileRevision:Number(state._profileRevision||0)})); } catch (_) {}
}
function backgroundJobPercent(job=state.walkForwardRebuildJob) {
  if(!job) return 100;
  const draws=Math.max(1,Number(job.totalDraws||0)), ids=Array.isArray(job.profileIds)?job.profileIds:[];
  const wfIds=Array.isArray(job.wfProfileIds)&&job.wfProfileIds.length?job.wfProfileIds:ids;
  if(job.phase==="tables") return Math.min(15, Math.round((Number(job.tableIndex||0)/draws)*15));
  if(job.phase==="sync") return 15 + Math.round((Number(job.syncProfileIndex||0)/Math.max(1,ids.length))*5);
  if(job.phase==="verify") return 20 + Math.round((Number(job.verifyProfileIndex||0)/Math.max(1,ids.length))*10);
  if(job.phase==="wf") return 30 + Math.round((Number(job.wfProfileIndex||0)/Math.max(1,wfIds.length))*60);
  if(job.phase==="live") {
    const liveIds=Array.isArray(job.liveProfileIds)?job.liveProfileIds:ids;
    return 90 + Math.round((Number(job.liveProfileIndex||0)/Math.max(1,liveIds.length))*9);
  }
  return job.phase==="done"?100:1;
}
function paintBackgroundJobProgress() {
  const job=state.walkForwardRebuildJob;
  if(!job || job.status==="done") return;
  setJsonRestoreProgress(backgroundJobPercent(job), job.lastMessage||"กำลังสร้าง WF เบื้องหลัง");
}
async function runWalkForwardBackgroundJob() {
  if(backgroundWfWorkerRunning) return;
  const job=state.walkForwardRebuildJob;
  if(!job || job.status==="done") return;
  backgroundWfWorkerRunning=true;
  try {
    updateWalkForwardJob({status:"running"});
    // Phase 1: fill only genuinely missing daily tables, in small batches.
    if(state.walkForwardRebuildJob.phase==="tables"){
      const draws=validRestoreDrawsSorted();
      while(Number(state.walkForwardRebuildJob.tableIndex||0)<draws.length){
        const from=Number(state.walkForwardRebuildJob.tableIndex||0), to=Math.min(from+40,draws.length);
        for(let i=from;i<to;i++){
          const draw=draws[i];
          if(!getDailyTable(Number(draw.profileId??0),draw.date)){
            try{upsertDailyTableFromActual(draw);}catch(error){console.warn("Restore missing-table rebuild failed",draw.date,error);}
          }
        }
        updateWalkForwardJob({tableIndex:to,lastMessage:`ตรวจตารางเบื้องหลัง ${to}/${draws.length}`});
        paintBackgroundJobProgress(); await nextUiFrame(12);
      }
      updateWalkForwardJob({phase:"sync",lastMessage:"กำลังเชื่อม History L"});
    }
    // Phase 2: regenerate legacy display linkage one profile per yield.
    if(state.walkForwardRebuildJob.phase==="sync"){
      const ids=state.walkForwardRebuildJob.profileIds||[];
      while(Number(state.walkForwardRebuildJob.syncProfileIndex||0)<ids.length){
        const idx=Number(state.walkForwardRebuildJob.syncProfileIndex||0), id=ids[idx];
        try{syncAutoLHistoryForProfile(id);}catch(error){console.warn("Restore L History sync warning",id,error);}
        updateWalkForwardJob({syncProfileIndex:idx+1,lastMessage:`History ${(state.profiles[id]||`Profile ${id+1}`)} ${idx+1}/${ids.length}`});
        paintBackgroundJobProgress(); await nextUiFrame(18);
      }
      // V7.09.3 Clean JSON Restore: imported AI/WF evidence is never reusable.
      if(state.walkForwardRebuildJob.cleanRebuild){
        const cleanIds=[...(state.walkForwardRebuildJob.profileIds||[])];
        updateWalkForwardJob({phase:"wf",wfProfileIndex:0,wfProfileIds:cleanIds,reusedProfileIds:[],invalidProfileIds:cleanIds,verificationResults:{},lastMessage:`Clean WF Rebuild ${cleanIds.length} Profile • Reuse 0`});
      } else {
        updateWalkForwardJob({phase:"verify",verifyProfileIndex:0,wfProfileIds:[],reusedProfileIds:[],invalidProfileIds:[],verificationResults:{},lastMessage:"กำลังตรวจ WF Cache"});
      }
    }
    // Phase 3: verify every restored profile cache before deciding whether to rebuild it.
    if(state.walkForwardRebuildJob.phase==="verify"){
      const ids=state.walkForwardRebuildJob.profileIds||[];
      while(Number(state.walkForwardRebuildJob.verifyProfileIndex||0)<ids.length){
        const idx=Number(state.walkForwardRebuildJob.verifyProfileIndex||0), id=ids[idx], name=state.profiles[id]||`Profile ${id+1}`;
        const check=verifyWalkForwardCache(id);
        const reused=[...(state.walkForwardRebuildJob.reusedProfileIds||[])], invalid=[...(state.walkForwardRebuildJob.invalidProfileIds||[])];
        const results={...(state.walkForwardRebuildJob.verificationResults||{}),[id]:check.reason};
        if(check.valid){ if(!reused.includes(id)) reused.push(id); }
        else {
          if(!invalid.includes(id)) invalid.push(id);
          // History-safe recovery: keep the prior-only bucket as DISPLAY-ONLY while rebuilding.
          // getWalkForwardRecord() quarantines it from trusted scoring via invalidProfileIds.
        }
        updateWalkForwardJob({verifyProfileIndex:idx+1,reusedProfileIds:reused,invalidProfileIds:invalid,wfProfileIds:invalid,verificationResults:results,lastMessage:`${check.valid?"✓ Cache":"↻ Rebuild"} ${name} ${idx+1}/${ids.length}`});
        paintBackgroundJobProgress(); await nextUiFrame(10);
      }
      saveState();
      const rebuildIds=state.walkForwardRebuildJob.wfProfileIds||[];
      const reusedCount=(state.walkForwardRebuildJob.reusedProfileIds||[]).length;
      updateWalkForwardJob({phase:"wf",wfProfileIndex:0,lastMessage:rebuildIds.length?`WF Cache ผ่าน ${reusedCount} • สร้างใหม่ ${rebuildIds.length}`:`✓ WF Cache ผ่านครบ ${reusedCount} Profile`});
    }
    // Phase 4: rebuild only profiles whose JSON WF cache failed verification.
    if(state.walkForwardRebuildJob.phase==="wf"){
      const allIds=state.walkForwardRebuildJob.profileIds||[];
      const ids=Array.isArray(state.walkForwardRebuildJob.wfProfileIds)?state.walkForwardRebuildJob.wfProfileIds:allIds;
      while(Number(state.walkForwardRebuildJob.wfProfileIndex||0)<ids.length){
        const idx=Number(state.walkForwardRebuildJob.wfProfileIndex||0), id=ids[idx], name=state.profiles[id]||`Profile ${id+1}`;
        // Normal recovery may skip a fully valid cache. Clean JSON Restore explicitly may not.
        if(!state.walkForwardRebuildJob.cleanRebuild){
          const existingBucket=getWalkForwardBucket(id);
          const alreadyComplete=walkForwardBucketCoversCurrentHistory(id,existingBucket);
          if(alreadyComplete){
            updateWalkForwardJob({wfProfileIndex:idx+1,lastMessage:`✓ WF Cache เดิม ${name} • ไม่ Backtest ซ้ำ`});
            paintBackgroundJobProgress(); await nextUiFrame(12);
            continue;
          }
        }
        updateWalkForwardJob({lastMessage:`WF Rebuild ${name} ${idx+1}/${ids.length}`}); paintBackgroundJobProgress();
        await rebuildWalkForwardBacktest(id);
        const remainingInvalid=(state.walkForwardRebuildJob.invalidProfileIds||[]).filter(x=>Number(x)!==Number(id));
        updateWalkForwardJob({wfProfileIndex:idx+1,invalidProfileIds:remainingInvalid,lastMessage:`✓ WF ${name}`});
        await nextUiFrame(24);
      }
      updateWalkForwardJob({phase:"live",liveProfileIndex:0,lastMessage:"กำลังอัปเดต AI Live"});
    }
    // Phase 5: rebuild live formula/snapshot only after historical WF is verified/complete.
    if(state.walkForwardRebuildJob.phase==="live"){
      const ids=Array.isArray(state.walkForwardRebuildJob.liveProfileIds)
        ? state.walkForwardRebuildJob.liveProfileIds
        : (state.walkForwardRebuildJob.profileIds||[]);
      while(Number(state.walkForwardRebuildJob.liveProfileIndex||0)<ids.length){
        const idx=Number(state.walkForwardRebuildJob.liveProfileIndex||0), id=ids[idx], name=state.profiles[id]||`Profile ${id+1}`;
        try{
          generateAIFormula(id);
          const latestTable=(state.dailyTables||[]).filter(t=>Number(t.profileId)===id).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))[0]||null;
          if(latestTable) saveAIPredictionSnapshotsForTable(latestTable);
        }catch(error){console.warn("Background live AI rebuild skipped",name,error);}
        updateWalkForwardJob({liveProfileIndex:idx+1,lastMessage:`AI Live ${name} ${idx+1}/${ids.length}`});
        paintBackgroundJobProgress(); await nextUiFrame(20);
      }
      const reusedCount=(state.walkForwardRebuildJob.reusedProfileIds||[]).length;
      const rebuiltCount=(state.walkForwardRebuildJob.wfProfileIds||[]).length;
      // R6: do not show 100% or delete the checkpoint until the completed state
      // has been durably committed. This closes the iOS 100% -> 91% relaunch race.
      await commitCompletedWfJobDurably(reusedCount, rebuiltCount);
      setJsonRestoreProgress(100,`✓ WF พร้อม • Cache ${reusedCount} • Rebuild ${rebuiltCount}`);
      clearPerformanceCaches(); activeRenderPerfSignature=""; invalidateViewCache();
      if(document.visibilityState!=="hidden") setTimeout(()=>render(),80);
    }
  } catch(error) {
    console.error("Background Walk-Forward rebuild failed",error);
    updateWalkForwardJob({status:"paused",lastMessage:`WF หยุดชั่วคราว: ${error?.message||"เกิดข้อผิดพลาด"}`});
  } finally { backgroundWfWorkerRunning=false; }
}
// V6.10.40-R3 — WF Fast Cold Import: zero-allocation L scoring + per-target fitness memo + throttled UI yielding; exact methodology preserved.
// V6.10.40-R2 — WF Fast Batch: single-pass weighted formula scoring + lighter import UI yielding; exact methodology preserved.
// V6.10.40-R1 — Startup WF self-recovery.
// A normal app launch (including rolling back from a newer build) may contain complete
// History but no current/valid WF bucket and no JSON-restore job. In that case History
// Champion would score only the few Verified Live snapshots (for example 4/131).
// Detect that state after full persistence has loaded and queue a background rebuild.
// IMPORTANT: verification and rebuilt predictions remain strict prior-only; this helper
// never converts legacy retrospective rows into Verified Live evidence.
function ensureWalkForwardRecoveryJobOnStartup() {
  const activeJob = state.walkForwardRebuildJob;
  if (activeJob && activeJob.status !== "done") return false;

  // R10 hard gate: an unchanged, authoritative 100% marker means startup recovery is
  // forbidden. Normal close/reopen must never verify/rebuild WF or AI Live again.
  const hardMarker = readWfCompletionMarker();
  if (hardMarker && completionMarkerCanSkipStartupRecovery(hardMarker)) {
    try { localStorage.removeItem(WF_JOB_KEY); } catch (_) {}
    forceCompletedWfStartupState(hardMarker);
    return false;
  }

  // R7: if this exact dataset already reached durable 100% and its WF buckets still
  // cover History, do NOT run verifyWalkForwardCache() again on every launch.
  // Revalidation is automatically re-enabled when History/Profile data changes
  // because the completion signature/revision no longer matches.
  const completionMarker = readWfCompletionMarker();
  if (completionMarkerCanSkipStartupRecovery(completionMarker)) {
    try { localStorage.removeItem(WF_JOB_KEY); } catch (_) {}
    if (!state.walkForwardRebuildJob || state.walkForwardRebuildJob.status !== "done") {
      state.walkForwardRebuildJob = {
        ...(state.walkForwardRebuildJob||{}),
        version: 2, status: "done", phase: "done",
        profileIds: [...(completionMarker.profileIds||[])],
        totalDraws: Number(completionMarker.totalDraws||0),
        liveProfileIndex: (completionMarker.profileIds||[]).length,
        finishedAt: Number(completionMarker.completedAt||Date.now()),
        lastMessage: `✓ WF พร้อม • Cache ${Number(completionMarker.reusedCount||0)} • Rebuild ${Number(completionMarker.rebuiltCount||0)}`
      };
    }
    return false;
  }

  const ids = restoreJobProfileIds().filter(id => walkForwardProfileDraws(id).length >= 8);
  if (!ids.length) return false;

  const reused = [], invalid = [], results = {};
  for (const id of ids) {
    const check = verifyWalkForwardCache(id);
    results[id] = check.reason;
    if (check.valid) {
      reused.push(id);
      continue;
    }
    invalid.push(id);
    // History-safe recovery: DO NOT delete the existing bucket before replacement is ready.
    // invalidProfileIds quarantines it from trusted scoring, while History may show only
    // rows that still pass the strict row-level prior-only date/methodology gates.
  }
  if (!invalid.length) return false;

  state.walkForwardRebuildJob = {
    version: 2,
    status: "queued",
    phase: "wf",
    tableIndex: validRestoreDrawsSorted().length,
    syncProfileIndex: ids.length,
    verifyProfileIndex: ids.length,
    wfProfileIndex: 0,
    liveProfileIndex: 0,
    profileIds: ids,
    wfProfileIds: invalid,
    liveProfileIds: [...invalid],
    reusedProfileIds: reused,
    invalidProfileIds: invalid,
    verificationResults: results,
    totalDraws: validRestoreDrawsSorted().length,
    startedAt: Date.now(),
    updatedAt: Date.now(),
    lastMessage: `↻ กู้ WF จาก History อัตโนมัติ ${invalid.length} Profile • Prior-only`
  };
  try { localStorage.setItem(WF_JOB_KEY, JSON.stringify({...state.walkForwardRebuildJob, profileRevision:Number(state._profileRevision||0)})); } catch (_) {}
  return true;
}

function scheduleWalkForwardBackgroundJob(delay=150) {
  if(!state.walkForwardRebuildJob || state.walkForwardRebuildJob.status==="done") return;
  setTimeout(()=>runWalkForwardBackgroundJob(),delay);
}
function cleanImportedDailyTablesForAIRebuild(tables) {
  return (Array.isArray(tables) ? tables : []).map(source => {
    const table = source && typeof source === "object" ? {...source} : source;
    if (!table || typeof table !== "object") return table;
    delete table.predictionSnapshot;
    delete table.aiFormulaSnapshot;
    delete table.aiFormulaVersion;
    delete table.aiSnapshotTargetDate;
    delete table.aiSnapshotCreatedAt;
    delete table.masterPredictionSnapshot;
    delete table.snapshotBlockedReason;
    if (Array.isArray(table.inputDigits) && table.inputDigits.length === 5 && table.inputDigits.every(v => /^\d$/.test(String(v)))) {
      const inputs = table.inputDigits.map(String);
      const classic = getOriginalFormula();
      const grid = formulaGrid(inputs, classic);
      table.formulaMode = "original";
      table.formulaSnapshot = cloneFormula(classic);
      table.grid = grid ? grid.map(row => [...row]) : table.grid;
      table.lResults = grid ? findLResults(grid) : [];
      table.updatedAt = Date.now();
    }
    return table;
  });
}

async function clearImportedAiCompletionAuthority() {
  try { localStorage.removeItem(WF_COMPLETION_KEY); } catch (_) {}
  try { localStorage.removeItem(WF_JOB_KEY); } catch (_) {}
  try { await deleteIndexedValue(WF_COMPLETION_KEY); } catch (_) {}
}

async function restoreJsonBackupFast(parsed) {
  const validated = await validateBackupEnvelope(parsed);
  const data = validated.data;
  const existingCount=(state.records?.length||0)+(state.actualDraws?.length||0)+(state.dailyTables?.length||0);
  if(existingCount>0 && !confirm(`การกู้คืนจะใช้ข้อมูลจากไฟล์แทนข้อมูลปัจจุบัน

โหมด Clean AI Rebuild จะนำ History/ข้อมูลต้นทางกลับมา แต่จะทิ้ง AI Confidence, Profile derived score, AI Formula และ WF Cache เก่าทั้งหมด แล้วคำนวณใหม่จากศูนย์

ต้องการดำเนินการต่อหรือไม่?`)) return null;
  await clearImportedAiCompletionAuthority();
  const base=typeof structuredClone==="function"?structuredClone(DEFAULT_STATE):JSON.parse(JSON.stringify(DEFAULT_STATE));
  state={...base,...data};
  state.actualDraws=Array.isArray(data.actualDraws)?data.actualDraws.map(x=>x&&typeof x==="object"?{...x}:x):[];
  state.dailyTables=cleanImportedDailyTablesForAIRebuild(data.dailyTables);
  state.records=[];
  state.profiles=Array.isArray(data.profiles)&&data.profiles.length?data.profiles:[...DEFAULT_STATE.profiles];
  state.activeProfile=Math.min(Math.max(Number(state.activeProfile)||0,0),state.profiles.length-1);
  state.rankingConfig={...base.rankingConfig,...(data.rankingConfig||{})}; state.webSync={...base.webSync,...(data.webSync||{})};
  state.backupSettings={...base.backupSettings,...(data.backupSettings||{})}; state.masterAISettings={...base.masterAISettings,...(data.masterAISettings||{})};
  // Clean means no resumable WF evidence survives from the imported dataset either.
  await Promise.all(state.profiles.map((_, id) => deleteIndexedValue(wfProgressKey(id))));
  state.aiFormulaLab={};
  state.aiLearningStatus={};
  state.aiGLFormulaLab={};
  state.aiGLLearningStatus={};
  state.walkForwardBacktests={};
  state.walkForwardRebuildJob=null;
  state._historyResetAt=0;
  repairAutoGeneratedDailyTablesProfileFormula();
  // V7.09.5 — History durability guard. Clean Restore intentionally discards imported
  // derived records, but the replacement History linkage must exist BEFORE we report
  // restore success. Otherwise an iOS close during the background WF job can reopen
  // with actualDraws intact but the visible History list still empty.
  state.records = [];
  for (const draw of (state.actualDraws || [])) {
    try { syncAutoLHistoryForActual(draw); } catch (error) { console.warn("Clean Restore History materialize warning", draw?.date, error); }
  }
  state.walkForwardRebuildJob=createWalkForwardRebuildJob({cleanRebuild:true});
  clearPerformanceCaches(); activeRenderPerfSignature=""; invalidateViewCache();
  saveState();
  const restoreDurableOk = await commitStateDurably();
  if (!restoreDurableOk) throw new Error("บันทึก History ลงพื้นที่ถาวรไม่สำเร็จ กรุณาอย่าปิดแอปและลอง Import ใหม่");
  render();
  setJsonRestoreProgress(backgroundJobPercent(state.walkForwardRebuildJob),"✓ History พร้อม • AI/WF Cache เก่าล้างแล้ว • เริ่ม Clean Rebuild");
  scheduleWalkForwardBackgroundJob(250);
  return {queued:true,draws:state.walkForwardRebuildJob.totalDraws,profiles:state.walkForwardRebuildJob.profileIds.length,cacheCandidates:0,cleanRebuild:true};
}

async function safeRefreshApp(){
  const button=document.getElementById("btnSafeRefreshApp");
  const status=document.getElementById("safeRefreshStatus");
  const setStatus=(text,kind="")=>{if(status){status.textContent=text;status.className=`safe-refresh-status ${kind}`.trim();}};
  if(button){button.disabled=true;button.textContent="กำลังตรวจ Update…";}
  try{
    // Persist the current in-memory state first. This updates only app data stores;
    // the refresh path never clears localStorage / IndexedDB / History / AI caches.
    try{ saveState(); }catch(_){}
    try{ if(typeof commitStateDurably==="function") await commitStateDurably(); }catch(_){}
    setStatus("กำลังตรวจเวอร์ชันใหม่…");
    if("serviceWorker" in navigator){
      const reg=await navigator.serviceWorker.getRegistration();
      if(reg){
        try{ await reg.update(); }catch(_){}
        if(reg.waiting){ try{ reg.waiting.postMessage({type:"SKIP_WAITING"}); }catch(_){} }
      }
    }
    // Force a network validation of the app shell only. User data is not touched.
    try{ await fetch(`./index.html?safeUpdate=${Date.now()}`,{cache:"no-store",headers:{"Cache-Control":"no-cache"}}); }catch(_){}
    setStatus("✓ ข้อมูลเดิมปลอดภัย • กำลังเปิดเวอร์ชันล่าสุด","ok");
    if(button) button.textContent="✓ Update checked";
    setTimeout(()=>location.reload(),650);
  }catch(error){
    console.error("Safe app refresh failed",error);
    setStatus("ตรวจ Update ไม่สำเร็จ • ข้อมูลเดิมยังอยู่ครบ","error");
    if(button){button.disabled=false;button.textContent="ลอง Refresh อีกครั้ง";}
  }
}

function bindSettings() {
  bindProfileGestures();
  const profileList = document.getElementById("profileSortList");
  const reorderButton = document.getElementById("btnProfileReorderMode");
  const reorderHint = document.getElementById("profileReorderHint");
  const profileSearch = document.getElementById("profileSettingsSearch");
  const profileSearchClear = document.getElementById("profileSettingsSearchClear");
  const profileSearchMeta = document.getElementById("profileSearchMeta");
  let reorderMode = false;
  const updateReorderMode = () => {
    profileList?.classList.toggle("reorder-mode", reorderMode);
    if (reorderButton) {
      reorderButton.classList.toggle("active", reorderMode);
      reorderButton.setAttribute("aria-pressed", String(reorderMode));
      reorderButton.textContent = reorderMode ? "เสร็จสิ้น" : "แก้ไขลำดับ";
    }
    if (reorderHint) reorderHint.hidden = !reorderMode;
  };
  reorderButton?.addEventListener("click", () => { reorderMode = !reorderMode; updateReorderMode(); });
  const filterProfiles = () => {
    const query = String(profileSearch?.value || "").trim().toLocaleLowerCase();
    const rows = [...document.querySelectorAll("#profileSortList [data-profile-row]")];
    let visible = 0;
    rows.forEach(row => {
      const input = row.querySelector("[data-name-index]");
      const name = String(input?.value || row.dataset.profileName || "").toLocaleLowerCase();
      const show = !query || name.includes(query);
      row.hidden = !show;
      if (show) visible++;
    });
    if (profileSearchClear) profileSearchClear.hidden = !query;
    if (profileSearchMeta) {
      profileSearchMeta.hidden = !query;
      profileSearchMeta.textContent = query ? `พบ ${visible} จาก ${rows.length} Profile` : "";
    }
  };
  profileSearch?.addEventListener("input", filterProfiles);
  profileSearchClear?.addEventListener("click", () => { if (profileSearch) { profileSearch.value = ""; profileSearch.focus(); } filterProfiles(); });
  document.querySelectorAll("#profileSortList [data-name-index]").forEach(input => input.addEventListener("input", () => {
    syncProfileNameInput(input);
    filterProfiles();
    scheduleProfileNameSave();
  }));
  updateReorderMode();
  document.querySelectorAll("[data-theme-mode]").forEach(btn=>btn.addEventListener("click",()=>setThemeMode(btn.dataset.themeMode)));
  [["masterLearning","learning"],["masterAdaptive","adaptiveWeight"],["masterBacktest","backtest"]].forEach(([id,key])=>document.getElementById(id)?.addEventListener("change",e=>{state.masterAISettings={...DEFAULT_STATE.masterAISettings,...(state.masterAISettings||{}),[key]:Boolean(e.target.checked)};saveState();render();}));
  document.getElementById("btnAddProfile")?.addEventListener("click", () => {
    saveVisibleProfileNames();
    state.profiles = [...state.profiles, `Profile ${state.profiles.length + 1}`];
    state.activeProfile = state.profiles.length - 1;
    nextProfileRevision();
    refreshWfCompletionAfterProfileMutation("add");
    saveProfileMutationDurably();
    render();
    setTimeout(() => {
      const inputs = document.querySelectorAll(".name-input");
      const last = inputs[inputs.length - 1];
      if (last) { last.focus(); last.select(); last.scrollIntoView({behavior:"smooth", block:"center"}); }
    }, 0);
  });
  document.getElementById("btnSaveNames")?.addEventListener("click", () => {
    // R8: a display-name edit does not change Profile identity, History, WF, or AI.
    // Persist it without invalidating the 100% completion marker.
    saveVisibleProfileNames(); saveProfileMutationDurably(); alert("SaveProfileเรียบร้อย"); render();
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
  document.getElementById("btnSafeRefreshApp")?.addEventListener("click", safeRefreshApp);
  document.getElementById("btnExport")?.addEventListener("click", () => downloadBackup("manual"));
  document.getElementById("importFile")?.addEventListener("change", async e => {
    const input=e.target, file=input.files?.[0];
    if(!file) return;
    try {
      setJsonRestoreProgress(2,"กำลังอ่าน Backup JSON…");
      const parsed=JSON.parse(await file.text());
      const result=await restoreJsonBackupFast(parsed);
      if(!result){ render(); return; }
      alert(`กู้ข้อมูล JSON แบบ Clean Rebuild แล้ว
ผลจริง ${state.actualDraws.length} รายการ
ตารางต้นทาง ${state.dailyTables.length} รายการ

AI Formula เก่า: ล้างแล้ว
AI Confidence เก่า: ล้างแล้ว
Profile derived score เก่า: ล้างแล้ว
WF Cache เก่า: ไม่ใช้ซ้ำ

กำลังคำนวณ WF ใหม่ ${result.draws} งวด / ${result.profiles} Profile จากเก่า → ใหม่
เมื่อขึ้น AI พร้อม 100% จึงใช้คะแนนใหม่เพื่อเปรียบเทียบได้
ปิดแอปแล้วกลับมาทำต่อได้`);
    } catch(error) {
      console.error("JSON restore failed",error);
      render();
      alert(`กู้คืนไม่สำเร็จ: ${error?.message||"ไฟล์ไม่ถูกต้องหรือไฟล์เสียหาย"}`);
    } finally { input.value=""; }
  });
  document.getElementById("btnResetAll")?.addEventListener("click", () => {
    if (!confirm("Clearข้อมูลทั้งหมด รวมHistoryทุกProfileหรือไม่?")) return;
    state=typeof structuredClone === "function" ? structuredClone(DEFAULT_STATE) : JSON.parse(JSON.stringify(DEFAULT_STATE));
    state._historyResetAt = Date.now();
    saveState();
    // Replace the source checkpoint with the reset tombstone. An older imported
    // checkpoint can therefore never resurrect data after an intentional Reset All.
    void writeIndexedValue(HISTORY_SOURCE_CHECKPOINT_KEY, makeHistorySourceCheckpoint(state));
    void commitStateDurably();
    render();
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
if ("serviceWorker" in navigator) window.addEventListener("load", () => {
  // V7.09.56: update the PWA shell after first paint. This keeps launch speed unchanged
  // while still forcing iOS to discover the new build and activate it once.
  const updatePwaShell = async () => {
    try {
      const reg = await navigator.serviceWorker.register("sw-r32.js?v=70958rankarrowname", { updateViaCache: "none" });
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        const key = "lucky-sw-reload-v70956pwacachesync";
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
        location.reload();
      });
      reg.update().catch(()=>{});
    } catch (_) {}
  };
  if ("requestIdleCallback" in window) requestIdleCallback(updatePwaShell, { timeout: 1500 });
  else setTimeout(updatePwaShell, 600);
});
async function runDeferredStartupMaintenanceR55() {
  // R55 Instant First Paint: everything in this routine is maintenance/recovery work.
  // It runs only AFTER the first visible render, so normal cold launch is never held
  // behind History normalization, AUTO-L synchronization, WF marker verification, or
  // WF cache validation. No automatic render is issued here, preventing startup flash.
  try {
    state.records = Array.isArray(state.records) ? state.records.filter(r => r && r.status !== "notfound") : [];
    state.actualDraws = Array.isArray(state.actualDraws) ? state.actualDraws : [];
    state.dailyTables = Array.isArray(state.dailyTables) ? state.dailyTables : [];

    normalizeImportedHistoryDatesV534();
    repairAutoGeneratedDailyTablesProfileFormula();

    let completionMarker = null;
    try {
      completionMarker = await readAuthoritativeWfCompletionMarker();
      if (completionMarker) forceCompletedWfStartupState(completionMarker);
      const checkpoint = JSON.parse(localStorage.getItem(WF_JOB_KEY) || "null");
      if (state.walkForwardRebuildJob && state.walkForwardRebuildJob.status !== "done" && completionMarkerMatchesJob(completionMarker, state.walkForwardRebuildJob)) {
        state.walkForwardRebuildJob = {
          ...state.walkForwardRebuildJob,
          status: "done", phase: "done",
          liveProfileIndex: (state.walkForwardRebuildJob.profileIds || []).length,
          finishedAt: Number(completionMarker.completedAt || Date.now()),
          lastMessage: `✓ WF พร้อม • Cache ${Number(completionMarker.reusedCount || 0)} • Rebuild ${Number(completionMarker.rebuiltCount || 0)}`
        };
      }
      if (checkpoint && checkpoint.status !== "done") {
        if (completionMarkerMatchesJob(completionMarker, checkpoint)) {
          try { localStorage.removeItem(WF_JOB_KEY); } catch (_) {}
        } else {
          const checkpointProfileRev = Number(checkpoint.profileRevision || 0);
          const currentProfileRev = Number(state._profileRevision || 0);
          if (checkpointProfileRev < currentProfileRev) {
            try { localStorage.removeItem(WF_JOB_KEY); } catch (_) {}
          } else {
            const jobIds = Array.isArray(checkpoint.profileIds) ? checkpoint.profileIds.map(Number).filter(Number.isInteger) : [];
            const allAlreadyComplete = jobIds.length > 0 && jobIds.every(id => walkForwardBucketCoversCurrentHistory(id));
            if (allAlreadyComplete) {
              try { localStorage.removeItem(WF_JOB_KEY); } catch (_) {}
              if (state.walkForwardRebuildJob && state.walkForwardRebuildJob.status !== "done") {
                state.walkForwardRebuildJob = {
                  ...state.walkForwardRebuildJob,
                  status: "done", phase: "done", finishedAt: Date.now(),
                  lastMessage: "✓ WF Cache พร้อม • ข้าม Backtest ซ้ำ"
                };
              }
            } else {
              const savedUpdated = Number(state.walkForwardRebuildJob?.updatedAt || 0);
              const checkpointUpdated = Number(checkpoint.updatedAt || 0);
              if (!state.walkForwardRebuildJob || state.walkForwardRebuildJob.status === "done" || checkpointUpdated > savedUpdated) {
                state.walkForwardRebuildJob = { ...(state.walkForwardRebuildJob || {}), ...checkpoint };
              }
            }
          }
        }
      }
    } catch (_) {}

    // Yield between expensive History rows so iOS can keep the freshly-painted UI responsive.
    const draws = Array.isArray(state.actualDraws) ? state.actualDraws : [];
    for (let i = 0; i < draws.length; i++) {
      syncAutoLHistoryForActual(draws[i]);
      if (i > 0 && i % 24 === 0) await new Promise(resolve => setTimeout(resolve, 0));
    }

    const wfRecoveryQueued = ensureWalkForwardRecoveryJobOnStartup();
    try { saveState(); } catch (error) { console.warn("Deferred startup save failed", error); }
    scheduleWalkForwardBackgroundJob(wfRecoveryQueued ? 700 : 550);
  } catch (error) {
    console.warn("Deferred startup maintenance failed", error);
    scheduleWalkForwardBackgroundJob(700);
  }
}

async function startApplication() {
  // R55 Instant First Paint:
  // 1) load only the authoritative state required for safety,
  // 2) paint the app immediately,
  // 3) move all non-essential migration/sync/WF verification behind first paint.
  // This preserves every backup/recovery layer and all AI/WF logic while removing
  // those expensive loops from the user's black-screen launch time.
  applyThemeMode(true);
  bindGlobalKeypad();

  await bootstrapPersistentState();
  state = applyBootStatePatch(state, initialBootStatePatch);

  // Minimal shape guards only; they are O(1) and safe before first paint.
  if (!Array.isArray(state.records)) state.records = [];
  if (!Array.isArray(state.actualDraws)) state.actualDraws = [];
  if (!Array.isArray(state.dailyTables)) state.dailyTables = [];

  // V7.09.5 startup rescue: if source History survived but the derived visible rows
  // were interrupted before persistence, materialize them now BEFORE first render.
  // This does not reuse AI/WF evidence; it derives Classic History linkage only from
  // the persisted actualDraws + dailyTables already in the clean dataset.
  if (state.records.length === 0 && state.actualDraws.length > 0 && state.dailyTables.length > 0) {
    for (const draw of state.actualDraws) {
      try { syncAutoLHistoryForActual(draw); } catch (error) { console.warn("Startup History materialize warning", draw?.date, error); }
    }
    try { saveState(); } catch (_) {}
    void commitStateDurably();
  }

  applyThemeMode(true);
  // V7.09.37: on a fresh app launch, Calculator immediately follows the global
  // AI-page strategy. AUTO resolves to its current winner without a second tap.
  if (state.currentView === "home") syncCalculatorTableViewToActiveFormula(state.activeProfile, true);
  render();

  // Give Safari/iOS one frame to present the UI before any maintenance work starts.
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => setTimeout(() => { void runDeferredStartupMaintenanceR55(); }, 80));
  } else {
    setTimeout(() => { void runDeferredStartupMaintenanceR55(); }, 120);
  }
}

window.addEventListener("pagehide", () => {
  flushProfileNamesBeforeSuspend();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    flushProfileNamesBeforeSuspend();
  }
});
startApplication().catch(error => {
  console.error("Application bootstrap failed", error);
  render();
  bindGlobalKeypad();
});

// LuckyNumber V6.7.8: L × AI overlap scope fixed; All=AI Top100, Top10/5/3 compare their true AI rank pools.
// LuckyNumber V4.25: simple result entry; reference-table selection is available only in Edit.
