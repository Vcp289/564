"use strict";

const APP_VERSION = "7.20.86k-X3-NESTED-PRO-463-SAVE-COMMIT-GUARD-AI-PICK-PRO";
const APP_DISPLAY_VERSION = "V7.20.86r • Deterministic Atomic Ranking • Pro";
const APP_BUILD_TAG = "72086rdeterministicranking";
// Pro 1–5: stable configuration is split into pro-core-r44.js.
// Keep calculation constants out of UI/runtime implementation to prevent accidental drift.
const SUPPORT_AI_RUNTIME_ENABLED = false; // V7.19.24: Independent + Pair removed from runtime. Legacy stored fields remain readable only.
const MASTER_AI_PAUSED = true; // Legacy Master permanently removed from runtime; stored history remains backward-compatible.
const MASTER_BASIC_TEST = true; // R48: Basic V1.2 Exact Mirror. Selector stays simple Prior-only; Walk-Forward BASIC result is mirrored 1:1 from the engine selected on that draw.
const MASTER_BASIC_MIN_PRIOR = 8;
const MASTER_AI_V1_ACTIVE = false; // V7.19.24: Legacy Master V1 removed from runtime to reduce CPU/background work.
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
const ML_SELECT_ENGINES = ["classic","aiL","gl"];
// V7.15.00 Pattern V5 continues directly from V4/V3 on the user's V7.09.72 base.
// V1/V2/V3 internals are retained as dependencies. V4 remains SHADOW and does not join AUTO/Ranking.
// Target-20 Guard: experimental selectors are blocked unless fair fixed-count Strict Prior-only evidence beats the V3 champion.
const PATTERN_V1_WINDOW = 14;
const PATTERN_V1_MIN_PRIOR = 14;
const PATTERN_V1_MIN_EXT_TYPE_HITS = 1;
const PATTERN_V1_MAX_REPLACEMENTS = 1;
const PATTERN_V1_SHADOW = true;
const PATTERN_V2_SAFETY_WINDOW = 14;
const PATTERN_V2_MIN_CHANGED = 5;
const PATTERN_V2_MIN_NET = 0;
const PATTERN_V2_SHADOW = true;
const PATTERN_V3_WINDOWS = Object.freeze([7,14,30]);
const PATTERN_V3_MIN_CHANGED = 5;
const PATTERN_V3_MIN_NET = 0;
const PATTERN_V3_MIN_POSITIVE_WINDOWS = 1;
const PATTERN_V3_SHADOW = true;
const PATTERN_V4_SHADOW = true;
const PATTERN_V4_TARGET_RELATIVE = 0.20;
const PATTERN_V5_SHADOW = true;
const PATTERN_V5_TARGET_RELATIVE = 0.20;
const PATTERN_V6_SHADOW = true;
const PATTERN_V6_CLASSIC_BONUS = 0.06;
const PATTERN_V6_NEW_GEOMETRY_BONUS = 0.02;
const PATTERN_V6_TARGET_RELATIVE = 0.20;
const PATTERN_V7_SHADOW = true;
const PATTERN_V7_TARGET_RELATIVE = 0.20;
const PATTERN_V7_EXPERT_WINDOW = 30;
const PATTERN_V7_EXPERT_MIN = 8;
const PATTERN_V7_ADV_MARGIN = 2;
const PATTERN_V7_MAX_LOST_VS_V6 = 1;
const PATTERN_V7_EXPERTS = Object.freeze([[0.02,0.01],[0.04,0.02],[0.06,0],[0.06,0.01],[0.06,0.02],[0.08,0.005],[0.08,0.02],[0.10,0.02],[0.12,0.01]]);
const PATTERN_V18_SHADOW = true;
const PATTERN_V18_TARGET_RELATIVE = 0.20;
const PATTERN_V18_RESEARCH_GEOMETRIES = 100;
const PATTERN_V18_CHAMPION_WINS = 267;
const PATTERN_V18_CLASSIC_WINS = 243;
const PATTERN_V18_TOTAL = 2358;
const PATTERN_V18_FINAL_TAIL_TOTAL = 469;
const PATTERN_V18_FINAL_TAIL_CLASSIC = 53;
const PATTERN_V18_FINAL_TAIL_CHAMPION = 62;
// V7.19.00 — P19 Precision Rescue. P18 remains the protected champion.
const PATTERN_V19_SHADOW = false;
const PATTERN_V19_TARGET_CLASSIC_RELATIVE = 0.0;
const PATTERN_V19_TARGET_V18_RELATIVE = 0.10;
const PATTERN_V19_WINDOWS = Object.freeze([14,30,60]);
const PATTERN_V19_MIN_PRIOR = 30;
const PATTERN_V19_MAX_REPLACEMENTS = 1;
const PATTERN_V19_RESCUE_MARGIN = 0.035;
const PATTERN_V19_MIN_ALT_HITS_30 = 2;
const PATTERN_V19_EXPERT_WEIGHTS = Object.freeze([0.55575913,0.04921373,0.39502713,0.03585446,0.00255372,0.02512029,-0.00701235,0.00306549]);
const PATTERN_V19_MODEL_FEATURES = Object.freeze(["overlap","nchange","scoreGapMean","scoreGapMin","e14","v14","diff14","e30","v30","diff30","e60","v60","diff60","pid","weekday","k"]);
const PATTERN_V19_MODEL_MEAN = Object.freeze([0.6724832519913129,6.333333333333333,0.027415232651819117,0.006576937105144808,0.20812596884429466,0.20759729000679228,0.0005286788375023666,0.17908650204161228,0.17481109362980232,0.004275408411809936,0.16753889120640317,0.15715148144616523,0.01038740976023793,6.910256410256411,2.641025641025641,19.205128205128204]);
const PATTERN_V19_MODEL_SCALE = Object.freeze([0.14865964615578414,3.1528036634352827,0.013779789443813611,0.0077320166652856395,0.09693733184062549,0.09287482782638128,0.052154997699496275,0.10118519633489846,0.09401705169124472,0.047658080228159455,0.10289078626907087,0.09218982084694503,0.03904654916975037,4.475534339781281,1.640624951081681,2.5936756136208805]);
const PATTERN_V19_MODEL_COEF = Object.freeze([-0.02994948035714576,-0.013877520686894197,0.08965780593480183,-0.2061719334281115,0.06378904859893471,-0.016919802288929447,0.14869071495229585,-0.0024327291761425877,-0.061133119109923806,0.11543476811801004,-0.018525873875680682,0.09622118545830939,-0.27599764403307264,0.03447234490241007,0.11366703542513495,-0.04500291835306425]);
const PATTERN_V19_MODEL_INTERCEPT = -0.000479768693754293;
const PATTERN_V19_MODEL_THRESHOLD = 0.50;
const PATTERN_V19_ENGINE_SIGNATURE = "P19-HYBRID-LOGISTIC-R3-ROW-REBUILD-20260821";

const V19_BACKGROUND = {
  ready: new Set(),
  running: new Set(),
  progress: new Map()
};
// V7.20.01 — Single Compute Manager + Fast Rebuild hot-loop tuning.
// Heavy model work is serialized behind one queue. UI render/tap/scroll never starts
// competing P19/X3/WF loops. A task yields until foreground input is quiet.
const COMPUTE_MANAGER={
  queue:[], running:false, activeKey:"", pending:new Set(),
  enqueue(key,work,{delay=0,idleMs=900}={}){
    const k=String(key||"task");
    if(this.pending.has(k)||this.activeKey===k) return false;
    this.pending.add(k); this.queue.push({key:k,work,delay:Math.max(0,Number(delay)||0),idleMs:Math.max(0,Number(idleMs)||0)});
    this.pump(); return true;
  },
  async pump(){
    if(this.running) return; this.running=true;
    try{
      while(this.queue.length){
        const task=this.queue.shift(); this.pending.delete(task.key); this.activeKey=task.key;
        if(task.delay) await new Promise(r=>setTimeout(r,task.delay));
        if(document.visibilityState==="hidden"){ this.queue.unshift(task); this.pending.add(task.key); this.activeKey=""; break; }
        if(userInteractionHot(700)) await waitForForegroundIdle(task.idleMs||900);
        try{ await task.work(); }catch(error){ console.warn("Compute task",task.key,error); }
        this.activeKey="";
        await new Promise(r=>setTimeout(r,0));
      }
    } finally { this.activeKey=""; this.running=false; }
  }
};

// V7.19.33 — P19 Persistent Primary Cache.
// The cache identity is based ONLY on source data that can change a P19 result:
// actual 3D result + the 5 input digits for that profile/date. UI timestamps and
// persistence metadata are deliberately excluded so a normal app relaunch is 0 rebuild.
function p19HashText(text){
  let h=2166136261>>>0;
  for(let i=0;i<text.length;i++){ h^=text.charCodeAt(i); h=Math.imul(h,16777619)>>>0; }
  return h.toString(36);
}
function p19SourceRows(profileId=state.activeProfile){
  const id=Number(profileId);
  return (state.actualDraws||[])
    .filter(d=>Number(d?.profileId??0)===id)
    .sort((a,b)=>String(a?.date||'').localeCompare(String(b?.date||'')))
    .map(draw=>{
      let inputs='';
      try{
        const table=getPredictionTable(id,draw?.date,draw), arr=table?.inputDigits;
        if(Array.isArray(arr)&&arr.length===5) inputs=arr.map(String).join('');
      }catch(_){}
      return `${String(draw?.date||'')}:${String(draw?.number||'')}:${inputs}`;
    });
}
function p19PersistentFingerprint(profileId=state.activeProfile){
  const rows=p19SourceRows(profileId);
  return `${rows.length}:${p19HashText(rows.join('|'))}`;
}
function v19BackgroundKey(profileId=state.activeProfile){
  const id=Number(profileId);
  return `${PATTERN_V19_ENGINE_SIGNATURE}|${id}|${p19PersistentFingerprint(id)}`;
}
function p19BundleCacheKey(profileId=state.activeProfile){
  const id=Number(profileId);
  return `P19BUNDLE|${PATTERN_V19_ENGINE_SIGNATURE}|${id}|${p19PersistentFingerprint(id)}`;
}
function serializeP19StatusMap(statusMap){
  return statusMap instanceof Map ? [...statusMap.entries()].map(([key,status])=>[String(key),String(status)]) : [];
}
function restorePatternV19PersistentCache(profileId=state.activeProfile){
  const id=Number(profileId), key=v19BackgroundKey(id), saved=state.p19PrimaryCache?.[id];
  if(!saved || saved.key!==key || saved.engineSignature!==PATTERN_V19_ENGINE_SIGNATURE || !saved.summary || !Array.isArray(saved.statusRows)) return false;
  const bundle={
    summary:{...saved.summary},
    statusMap:new Map(saved.statusRows.map(row=>[String(row?.[0]??''),String(row?.[1]??'pending')])),
    engineSignature:PATTERN_V19_ENGINE_SIGNATURE,
    rebuildComplete:true,
    restoredFromPersistent:true
  };
  PERF_CACHE.patternV19Bundle.set(p19BundleCacheKey(id),bundle);
  PERF_CACHE.patternV19Summary.set(`READY|${PATTERN_V19_ENGINE_SIGNATURE}|${id}|${p19PersistentFingerprint(id)}`,bundle.summary);
  V19_BACKGROUND.ready.add(key);
  V19_BACKGROUND.progress.set(key,100);
  return true;
}
function getPatternV19PrimarySummary(profileId=state.activeProfile){
  const id=Number(profileId), key=v19BackgroundKey(id);
  const saved=state.p19PrimaryCache?.[id];
  if(saved && saved.key===key && saved.engineSignature===PATTERN_V19_ENGINE_SIGNATURE && saved.summary){
    if(!V19_BACKGROUND.ready.has(key)) restorePatternV19PersistentCache(id);
    return saved.summary;
  }
  if(V19_BACKGROUND.ready.has(key)){
    try{return patternV19HistorySummary(id);}catch(_){}
  }
  return null;
}
function persistPatternV19PrimarySummary(profileId, bundle){
  const id=Number(profileId);
  if(!bundle?.summary || !(bundle?.statusMap instanceof Map)) return false;
  state.p19PrimaryCache=state.p19PrimaryCache||{};
  state.p19PrimaryCache[id]={
    key:v19BackgroundKey(id),
    engineSignature:PATTERN_V19_ENGINE_SIGNATURE,
    summary:{...bundle.summary},
    statusRows:serializeP19StatusMap(bundle.statusMap),
    updatedAt:Date.now()
  };
  return true;
}
let p19PrimaryPersistTimer=null;
function queuePatternV19PrimaryPersist(delay=700){
  clearTimeout(p19PrimaryPersistTimer);
  p19PrimaryPersistTimer=setTimeout(()=>{
    p19PrimaryPersistTimer=null;
    try{ saveState(); }catch(_){}
  },Math.max(120,Number(delay)||700));
}
// V7.19.19 — real row-level P19 rebuild without blocking iPhone UI.
// Rebuild every WF/verified row with the current engine signature, yield between small
// chunks, and publish ONE completed bundle to the shared cache. Pages never recompute it.
function schedulePatternV19Background(profileId=state.activeProfile, delay=900){
  const id=Number(profileId), key=v19BackgroundKey(id);
  // V7.20.86a DEMAND AI — P19 historical rebuild belongs to the visible AI page only.
  // History/Analysis/Calculate may consume a durable cache but must never start the job.
  if(state.currentView!=="weekly" || Number(state.activeProfile)!==id || document.visibilityState==="hidden") return false;
  if(V19_BACKGROUND.ready.has(key)||V19_BACKGROUND.running.has(key)) return false;
  if(restorePatternV19PersistentCache(id)) return false;
  V19_BACKGROUND.running.add(key); V19_BACKGROUND.progress.set(key,0);
  const queued=COMPUTE_MANAGER.enqueue(`P19|${key}`,async()=>{
    try{
      if(state.currentView!=="weekly" || Number(state.activeProfile)!==id || document.visibilityState==="hidden") return;
      if(backgroundWfWorkerRunning){ return; }
      const draws=(state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===id);
      const bundle=await patternV19HistoryBundleAsync(draws,id,p=>V19_BACKGROUND.progress.set(key,p));
      persistPatternV19PrimarySummary(id,bundle); V19_BACKGROUND.ready.add(key); V19_BACKGROUND.progress.set(key,100);
      queuePatternV19PrimaryPersist();
      try{ PERF_CACHE.recentAIWinner.clear(); PERF_CACHE.autoDecision.clear(); PERF_CACHE.calculatorTables.clear(); PERF_CACHE.calculatorEngine?.clear(); }catch(_){}
    } finally {
      V19_BACKGROUND.running.delete(key);
      // V7.20.31 Interaction-first: AI Standard repair must never jump onto the tap path.
      // Build it only after the AI page is open and the foreground has been idle.
      if(state.currentView==='weekly') scheduleAIStandardSummaryCacheBuild(id,null,3200);
      if(Number(state.activeProfile)===id && ['home','weekly','history','analysis'].includes(state.currentView) && !userInteractionHot(700)) requestAnimationFrame(()=>refreshAfterBackgroundModelWork());
    }
  },{delay:Math.max(0,Number(delay)||0),idleMs:950});
  if(!queued) V19_BACKGROUND.running.delete(key);
  return queued;
}

// V7.09.63 — Profiles are dynamic. This is a UI guidance threshold only, not a hard cap.
// Add/Profile History/Import/WF/Ranking logic must continue to use state.profiles.length.
const PROFILE_SOFT_GUIDE = 30;

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
  aiTrendWindow: 7, // V7.20.70 UI-only Profile Trend tab: 7 | 14 | 30
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
    "historyFormulaMode", "calculationDate", "profileOrderMode", "formulaStrategyVersion", "aiTrendWindow"
  ];
  simpleKeys.forEach(key => { if (Object.prototype.hasOwnProperty.call(patch, key)) next[key] = patch[key]; });
  next.aiTrendWindow = [7,14,30].includes(Number(next.aiTrendWindow)) ? Number(next.aiTrendWindow) : 7;
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
      aiTrendWindow: [7,14,30].includes(Number(source?.aiTrendWindow)) ? Number(source.aiTrendWindow) : 7,
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
// V7.20.86a FAST BOOT — never parse the full History/WF payload before first paint.
// Start from the tiny UI-only boot mirror and hydrate the durable state immediately
// after Safari has painted a usable frame.
let state = applyBootStatePatch(JSON.parse(JSON.stringify(DEFAULT_STATE)), initialBootStatePatch);
// V7.09.17 — Analysis always opens on AI Recommend. Users can still inspect other tabs during the current visit.
if (state.currentView === "analysis") { state.analysisSortMode = "ai"; state.profileOrderMode = "ai"; }
let currentLResults = [];
let currentLRankLimit = 0; // 0 = แสดงทั้งหมดเหมือน V4.46
let currentLResultMode = "l"; // V7.09.71: AUTO may select the strongest eligible result-only COMBO on L entry.
let currentLComboPair = "classic-ai"; // classic-ai | classic-gl | ai-gl | pattern-classic | pattern-ai | pattern-gl
// V7.20.33 — Calculate always follows the newest History source when entering/reselecting a Profile.
// Keep the first 5-digit paint immediate, then rebuild the heavier X3/P19 table after that paint.
let calculatorProfileRefreshToken = 0;
let calculatorFirstPaintDeferred = false; // V7.20.34: launch Calculate paints History 5D + Classic base before AUTO/history work
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
// V7.19.11 — keep the last fully-rendered page across ordinary cache invalidations.
// Navigation can show real content immediately, then refresh it after the tap has painted.
const LAST_VIEW_HTML_CACHE = new Map();
let viewCacheGeneration = 0;
function viewSnapshotKey(view = state.currentView) {
  return `${view}|p${Number(state.activeProfile || 0)}`;
}
function rememberViewHtml(view, html) {
  if (!html || !["history","analysis"].includes(view)) return;
  // V7.20.80: AI is a live-status view. Never remember whole-page AI HTML because
  // WAITING/HIT/REV/MISS must always reflect current History immediately.
  LAST_VIEW_HTML_CACHE.set(viewSnapshotKey(view), html);
}
function getRememberedViewHtml(view) {
  return LAST_VIEW_HTML_CACHE.get(viewSnapshotKey(view)) || null;
}
function invalidateViewCache() {
  VIEW_HTML_CACHE.clear();
  viewCacheGeneration++;
}
function getViewHtml(view = state.currentView) {
  const liveSuffix = view === "weekly" ? `:h${Number(state._persistenceUpdatedAt||0)}:n${(state.actualDraws||[]).length}` : "";
  const key = `${viewCacheGeneration}:${view}${liveSuffix}`;
  if (VIEW_HTML_CACHE.has(key)) return VIEW_HTML_CACHE.get(key);
  const previousView = state.currentView;
  state.currentView = view;
  const html = renderView();
  state.currentView = previousView;
  // V7.20.80: a transient AI Trend loading shell must never become a navigation cache.
  if (!(view === "weekly" && html.includes("กำลังจัดอันดับ"))) VIEW_HTML_CACHE.set(key, html);
  rememberViewHtml(view, html);
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
  mlSelect: new Map(),
  patternV18Status: new Map(),
  patternV18Summary: new Map(),
  patternV19Summary: new Map(),
  patternV19Evidence: new Map(),
  patternV19Bundle: new Map(),
  patternV19Status: new Map(),
  patternV19Live: new Map(),
  x3Bundle: new Map(),
  x3Status: new Map(),
  autoDecision: new Map(),
  calculatorTables: new Map(), // V7.20.32 legacy full-snapshot cache; retained for compatibility
  calculatorEngine: new Map(), // V7.20.34: lazy one-engine Calculate cache (UI first, compute only what is visible/requested)
  recentAIWinner: new Map()
};
let activeRenderPerfSignature = "";
const AI_FORMULA_RECOVERY_IN_FLIGHT = new Set(); // V6.4.8: one-time recovery for profiles whose candidate was deleted by V6.4.7
const WF_BOOTSTRAP_IN_FLIGHT = new Set(); // V6.9.5: first missing WF cache builds once in background after a fast save

function clearPerformanceCaches() {
  Object.values(PERF_CACHE).forEach(cache => cache.clear());
  // V7.20.21: one invalidation contract for all production AI adapters.
  invalidateUnifiedAIRuntime();
}

function compactFormulaSignature(formula) {
  if (!Array.isArray(formula)) return "-";
  try { return formula.flat().map(cell => `${cell?.s ?? ""}:${cell?.o ?? ""}`).join(","); }
  catch (_) { return "-"; }
}

function buildPerformanceSignature() {
  const drawSig = (state.actualDraws || []).map(d =>
    `${d.profileId ?? 0}:${d.date || ""}:${d.number || ""}:${d.twoDigit || ""}`
  ).join("|");
  const tableSig = (state.dailyTables || []).map(t =>
    `${t.profileId ?? 0}:${t.date || ""}:${(t.inputDigits || t.inputs || []).join?.("") || ""}`
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
    `M:${m.learning !== false}:${m.adaptiveWeight !== false}:${m.backtest !== false}`
  ].join("§");
}

function ensurePerformanceSignature() {
  // V7.20.86a FAST NAV — data mutations already invalidate activeRenderPerfSignature.
  // Do not rescan all History/tables/formulas on every UI-only render/navigation.
  if (activeRenderPerfSignature) return activeRenderPerfSignature;
  activeRenderPerfSignature = buildPerformanceSignature();
  return activeRenderPerfSignature;
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
    p19PrimaryCache: remapObject(candidate.p19PrimaryCache),
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
  merged.p19PrimaryCache = raw?.p19PrimaryCache && typeof raw.p19PrimaryCache === "object" ? raw.p19PrimaryCache : {};
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
        let main = applyProfileJournalToCandidate(JSON.parse(mainText));
        const syncSource = readHistorySourceSyncCheckpoint();
        if (main && typeof main === "object" && syncSource && typeof syncSource === "object") {
          const mainTs = Number(main._persistenceUpdatedAt || 0);
          const syncTs = Number(syncSource._persistenceUpdatedAt || syncSource.savedAt || 0);
          const syncHasHistory = stateHasHistoryPayload(syncSource);
          // A newer compact imported-source journal overrides a stale empty Reset MAIN.
          if (syncHasHistory && syncTs >= mainTs && !explicitHistoryResetWins(main, syncSource)) {
            // V7.20.86r: version-2 sync journal is intentionally source-only. It stores
            // actualDraws but omits dailyTables/records to stay small enough for a synchronous
            // iOS-safe commit. Never let those intentional empty arrays erase MAIN's derived
            // History state during normal load, otherwise P18/P19/X3 fingerprints break and
            // History shows “—” after a swipe/kill. Overlay the newer source rows while keeping
            // MAIN's derived rows/caches as the enrichment baseline.
            const sourceOnly = Number(syncSource?.version || 0) >= 2;
            const syncForMerge = sourceOnly ? {
              ...syncSource,
              dailyTables: Array.isArray(main?.dailyTables) ? main.dailyTables : [],
              records: Array.isArray(main?.records) ? main.records : []
            } : syncSource;
            main = mergeRecoveredHistory(main, syncForMerge, "localStorage:history-source-v70962-preserve-derived");
          } else if (!syncHasHistory && Number(syncSource._historyResetAt || 0) > 0 && syncTs >= mainTs) {
            // A deliberate newer Reset journal has authority over an older MAIN History.
            const base = typeof structuredClone === "function" ? structuredClone(DEFAULT_STATE) : JSON.parse(JSON.stringify(DEFAULT_STATE));
            main = { ...base, profiles: Array.isArray(syncSource.profiles) && syncSource.profiles.length ? syncSource.profiles : base.profiles, activeProfile: Number(syncSource.activeProfile || 0), _profileRevision: Number(syncSource._profileRevision || 0), _historyResetAt: Number(syncSource._historyResetAt || Date.now()), _persistenceUpdatedAt: syncTs };
          }
        }
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
const HISTORY_SOURCE_CHECKPOINT_KEY = "history-source-v70962";
const HISTORY_SOURCE_SYNC_KEY = "luckyNumberProV4_5_history_source_v70962";
let historySourceWriteChain = Promise.resolve(true);

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

function writeHistorySourceSyncCheckpoint(source = state) {
  const full = makeHistorySourceCheckpoint(source);
  // Keep the synchronous journal intentionally small: Profiles + actual results are
  // sufficient to restore History source and rebuild derived Table/WF rows.
  const compact = {
    version: 2,
    savedAt: Number(full.savedAt || Date.now()),
    _persistenceUpdatedAt: Number(full._persistenceUpdatedAt || Date.now()),
    _historyResetAt: Number(full._historyResetAt || 0),
    _profileRevision: Number(full._profileRevision || 0),
    profiles: Array.isArray(full.profiles) ? full.profiles : [],
    activeProfile: Number(full.activeProfile || 0),
    actualDraws: Array.isArray(full.actualDraws) ? full.actualDraws : [],
    dailyTables: [],
    records: []
  };
  try {
    localStorage.setItem(HISTORY_SOURCE_SYNC_KEY, JSON.stringify(compact));
    return true;
  } catch (error) {
    console.warn("History sync checkpoint write failed", error);
    return false;
  }
}
function readHistorySourceSyncCheckpoint() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_SOURCE_SYNC_KEY) || "null");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_) { return null; }
}
async function writeHistorySourceCheckpoint(source = state) {
  // Synchronous compact journal commits before this function yields. This is the
  // iOS suspend safety net even if IndexedDB is delayed or the app is backgrounded.
  const syncSaved = writeHistorySourceSyncCheckpoint(source);
  const snapshot = makeHistorySourceCheckpoint(source);
  const work = async () => {
    try { return await writeIndexedValue(HISTORY_SOURCE_CHECKPOINT_KEY, snapshot); }
    catch (error) { console.warn("History source checkpoint write failed", error); return false; }
  };
  // Serialize Reset -> Import checkpoint writes. A slow Reset write can no longer
  // finish after a newer Import and overwrite it with an empty tombstone.
  historySourceWriteChain = historySourceWriteChain.then(work, work);
  const indexedSaved = await historySourceWriteChain;
  return Boolean(syncSaved || indexedSaved);
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
  state = mergeRecoveredHistory(state, checkpoint, "IndexedDB:history-source-v70962");
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

// V7.19.06 — UI-only persistence must never serialize the entire History/WF payload on a tap.
// Active Profile / Profile Order are presentation preferences, so paint immediately and
// defer the full durable snapshot until the user has stopped interacting.
let uiStateSaveTimer = null;
function saveUiStateFast() {
  // V7.19.14 Performance Clean — UI navigation/profile selection is persisted by the tiny
  // boot snapshot only. Never stringify the complete History/WF state just because of a tap.
  try { return writeBootStateSnapshot(state); } catch (_) { return false; }
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

// V7.09.65 — iOS full-state hydration guard.
// A compact History source checkpoint intentionally contains only imported source rows.
// If MAIN localStorage could not fit the much larger AI/WF state, iOS may relaunch with
// History intact but AIL/PAIR/GL shown as "—". Detect that partial state cheaply and
// hydrate the richer full snapshot from IndexedDB before first render.
function historyIdentityLite(candidate) {
  const rows = Array.isArray(candidate?.actualDraws) ? candidate.actualDraws : [];
  return rows
    .map(d => `${Number(d?.profileId ?? 0)}:${String(d?.date || "")}:${String(d?.number || "")}:${String(d?.twoDigit || "")}`)
    .sort()
    .join("|");
}
function derivedPersistenceScore(candidate) {
  if (!candidate || typeof candidate !== "object") return 0;
  const wfRows = Object.values(candidate.walkForwardBacktests || {}).reduce((sum, bucket) =>
    sum + (Array.isArray(bucket?.records) ? bucket.records.length : 0), 0);
  const aiModels = Object.values(candidate.aiFormulaLab || {}).filter(x => x?.formula).length;
  const glModels = Object.values(candidate.aiGLFormulaLab || {}).filter(x => x?.formula).length;
  const liveSnapshots = candidate.universalPredictionSnapshots && typeof candidate.universalPredictionSnapshots === "object"
    ? Object.keys(candidate.universalPredictionSnapshots).length : 0;
  return (Array.isArray(candidate.dailyTables) ? candidate.dailyTables.length : 0) * 1000000
    + (Array.isArray(candidate.records) ? candidate.records.length : 0) * 10000
    + wfRows * 100
    + aiModels * 20
    + glModels * 20
    + liveSnapshots;
}
function stateMayBeSourceOnlyPartial(candidate) {
  const draws = Array.isArray(candidate?.actualDraws) ? candidate.actualDraws : [];
  if (!draws.length) return false;
  const byProfile = new Map();
  for (const d of draws) {
    const id = Number(d?.profileId ?? 0);
    byProfile.set(id, (byProfile.get(id) || 0) + 1);
  }
  const needsWf = [...byProfile.values()].some(count => count >= 8);
  const wfRows = Object.values(candidate?.walkForwardBacktests || {}).reduce((sum, bucket) =>
    sum + (Array.isArray(bucket?.records) ? bucket.records.length : 0), 0);
  const noWfDespiteEnoughHistory = needsWf && wfRows === 0;
  const sourceRecovery = String(candidate?._historyRecoveredFrom || "").includes("history-source");
  const missingTables = draws.length > 0 && (!Array.isArray(candidate?.dailyTables) || candidate.dailyTables.length === 0);
  return noWfDespiteEnoughHistory || missingTables || sourceRecovery;
}

async function bootstrapPersistentState() {
  // R54: a healthy timestamped MAIN state is already the newest synchronous commit.
  // Do not block first paint on opening/parsing the redundant IndexedDB copy. Full
  // IndexedDB/deep rescue remains unchanged for missing/empty/corrupt MAIN states.
  if (stateHasHistoryPayload(state) && Number(state?._persistenceUpdatedAt || 0) > 0 && !stateMayBeSourceOnlyPartial(state)) {
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
      // V7.09.65: MAIN/source journal can be newer only because the compact source
      // checkpoint was written after the final full save. Timestamp alone must not let
      // that source-only state defeat a richer IndexedDB snapshot of the SAME History.
      const sameHistory = currentHasHistory && indexedHasHistory
        && historyIdentityLite(state) === historyIdentityLite(indexed);
      const richerSameHistory = sameHistory
        && Number(indexed?._profileRevision || 0) >= Number(state?._profileRevision || 0)
        && derivedPersistenceScore(indexed) > derivedPersistenceScore(state);
      if (richerSameHistory && !explicitHistoryResetWins(state, indexed)) {
        const currentProfiles = Array.isArray(state.profiles) ? [...state.profiles] : [];
        const currentProfileRevision = Number(state?._profileRevision || 0);
        const currentActive = Number(state.activeProfile || 0);
        const currentView = state.currentView;
        const base = typeof structuredClone === "function" ? structuredClone(DEFAULT_STATE) : JSON.parse(JSON.stringify(DEFAULT_STATE));
        state = { ...base, ...indexed };
        if (currentProfiles.length && Number(indexed?._profileRevision || 0) === currentProfileRevision) state.profiles = currentProfiles;
        state.activeProfile = Math.min(Math.max(currentActive, 0), Math.max(0, state.profiles.length - 1));
        if (currentView) state.currentView = currentView;
        state._fullStateHydratedAt = Date.now();
        state._fullStateHydratedFrom = "IndexedDB:richer-same-history-v70965";
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
function getCalculatorEngineTable(profileId = state.activeProfile, engineKey = "original") {
  const id=Number(profileId), key=String(engineKey||"original");
  const inputs=Array.isArray(state.lastInput)?state.lastInput.map(String):[];
  const valid=inputs.length===5&&inputs.every(v=>/^\d$/.test(v));
  if(!valid) return null;
  const sourceDate=String(state.calculationDate||'').slice(0,10);
  const aiSavedKey=state.aiFormulaLab?.[id]||null, glSavedKey=state.aiGLFormulaLab?.[id]||null;
  const engineSig=key==='x3'?X3_ENGINE_SIGNATURE:key==='p19'?PATTERN_V19_ENGINE_SIGNATURE:key==='pattern'?'P18':key;
  const cacheKey=[
    'CALC34',key,engineSig,id,inputs.join(''),sourceDate||'live',String(state.activeFormulaByProfile?.[id]||'auto'),globalThis.X3NestedPro463?'x3pro':'x3preload',
    Number(aiSavedKey?.version||0),compactFormulaSignature(aiSavedKey?.formula),
    Number(glSavedKey?.version||0),compactFormulaSignature(glSavedKey?.formula),
    Number(state._profileRevision||0),Number(state._persistenceUpdatedAt||0),(state.actualDraws||[]).length,(state.dailyTables||[]).length
  ].join('|');
  const cached=PERF_CACHE.calculatorEngine.get(cacheKey);
  if(cached) return cached;

  let historical=false, table=null, targetDate='', targetDraw=null;
  if(/^\d{4}-\d{2}-\d{2}$/.test(sourceDate)) {
    table=getDailyTable(id,sourceDate);
    if(table){
      historical=true;
      targetDate=String(table.predictionSnapshot?.targetDate||table.aiSnapshotTargetDate||getNextBusinessDate(sourceDate)||'').slice(0,10);
      targetDraw=(state.actualDraws||[]).find(x=>Number(x?.profileId??0)===id&&String(x?.date||'').slice(0,10)===targetDate)||null;
    }
  }

  const active=calculatorTableViewMode===key;
  const remember=out=>{
    if(!out) return null;
    PERF_CACHE.calculatorEngine.set(cacheKey,out);
    if(PERF_CACHE.calculatorEngine.size>120) PERF_CACHE.calculatorEngine.delete(PERF_CACHE.calculatorEngine.keys().next().value);
    return out;
  };

  if(key==='original'){
    const grid=formulaGrid(inputs,getOriginalFormula());
    return remember({key:'original',label:'Classic L',grid,status:historical?'STABLE':'READY',active,results:grid?findLResults(grid):[],historical,tableKind:'formula'});
  }

  if(key==='ai' || key==='gl'){
    let formula=null, status=key==='ai'?'NOT READY':'TEST / LEARNING';
    if(historical && targetDraw){
      const snap=getUniversalPredictionSnapshot(id,targetDate,targetDraw);
      if(key==='ai'){
        if(Array.isArray(snap?.aiLFormula)){ formula=snap.aiLFormula; status='PRIOR-ONLY'; }
        else { const legacy=getHistoricalAIFormula(id,targetDate,targetDraw); if(Array.isArray(legacy)){ formula=legacy; status='PRIOR-ONLY'; } }
      }else if(Array.isArray(snap?.glFormula)){ formula=snap.glFormula; status='PRIOR-ONLY'; }
    }
    if(!historical){
      if(key==='ai' && Array.isArray(aiSavedKey?.formula)){ formula=aiSavedKey.formula; status=formulaEligibility(aiSavedKey).allowed?'READY':'TEST / LEARNING'; }
      if(key==='gl' && Array.isArray(glSavedKey?.formula)){ formula=glSavedKey.formula; status=glFormulaEligibility(glSavedKey,id).allowed?'READY':'TEST / LEARNING'; }
    }
    const grid=Array.isArray(formula)?formulaGrid(inputs,formula):null;
    return remember({key,label:key==='ai'?'AI L':'AI GL',grid,status,active,results:grid?findLResults(grid):[],historical,tableKind:'formula'});
  }

  const classicGrid=formulaGrid(inputs,getOriginalFormula());
  if(!classicGrid) return null;
  const calcTargetDate=String(getNextBusinessDate(sourceDate||isoDate())||'').slice(0,10);

  if(key==='pattern'){
    const p18=buildPatternV18Candidates(classicGrid,id,calcTargetDate);
    const items=Array.isArray(p18?.items)?p18.items.slice(0,5):[];
    const nums=items.map(x=>String(x?.number||'').padStart(3,'0')).filter(x=>/^\d{3}$/.test(x));
    const grid=nums.length===5?[0,1,2].map(pos=>nums.map(n=>Number(n[pos]))):null;
    return remember({key:'pattern',label:'P18',grid,status:historical?'PRIOR-ONLY':(p18?.selectorStatus||'CHAMPION GUARD'),active,results:items,historical,tableKind:'top5',targetDate:calcTargetDate,prediction:p18});
  }

  if(key==='p19'){
    const p19LiveKey=`P19LIVE|${PATTERN_V19_ENGINE_SIGNATURE}|${id}|${calcTargetDate}|${inputs.join('')}`;
    let p19=PERF_CACHE.patternV19Live.get(p19LiveKey);
    if(!p19){ p19=buildPatternV19Candidates(classicGrid,id,calcTargetDate); PERF_CACHE.patternV19Live.set(p19LiveKey,p19); }
    const items=Array.isArray(p19?.items)?p19.items.slice(0,5):[];
    const nums=items.map(x=>String(x?.number||'').padStart(3,'0')).filter(x=>/^\d{3}$/.test(x));
    const grid=nums.length===5?[0,1,2].map(pos=>nums.map(n=>Number(n[pos]))):null;
    return remember({key:'p19',label:'P19',grid,status:historical?'PRIOR-ONLY':(p19?.selectorStatus||'PRIMARY'),active,results:items,historical,tableKind:'top5',targetDate:calcTargetDate,prediction:p19});
  }

  if(key==='x3'){
    const x3=buildX3Candidates(classicGrid,id,calcTargetDate,inputs,historical);
    const items=Array.isArray(x3?.items)?x3.items:[];
    const nums=items.slice(0,5).map(x=>String(x?.number||'').padStart(3,'0')).filter(x=>/^\d{3}$/.test(x));
    const grid=nums.length===5?[0,1,2].map(pos=>nums.map(n=>Number(n[pos]))):null;
    return remember({key:'x3',label:'X3',grid,status:historical?'PRIOR-ONLY':(x3?.selectorStatus||'PRECISION'),active,results:items,historical,tableKind:'top7',targetDate:calcTargetDate,prediction:x3});
  }
  return null;
}

function getCalculatorEngineTablesForKeys(profileId = state.activeProfile, keys = []) {
  const wanted=[...new Set((Array.isArray(keys)?keys:[]).map(String).filter(k=>['original','ai','gl','pattern','p19','x3'].includes(k)))];
  return wanted.map(k=>getCalculatorEngineTable(profileId,k)).filter(Boolean);
}

function getCalculatorEngineTables(profileId = state.activeProfile) {
  // Compatibility path for pages/tools that explicitly need every engine. Calculate itself
  // never calls this on first paint in V7.20.34.
  return getCalculatorEngineTablesForKeys(profileId,['original','ai','gl','pattern','p19','x3']);
}

function getCalculatorSelectedTable(profileId = state.activeProfile, tablesOverride = null) {
  if(Array.isArray(tablesOverride)) return tablesOverride.find(t=>t.key===calculatorTableViewMode) || tablesOverride[0] || null;
  return getCalculatorEngineTable(profileId,calculatorTableViewMode) || getCalculatorEngineTable(profileId,'original');
}

function calculatorEngineTabsHtml(profileId = state.activeProfile, tablesOverride = null) {
  const tables=Array.isArray(tablesOverride)?tablesOverride:getCalculatorEngineTables(profileId);
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
  if (!SUPPORT_AI_RUNTIME_ENABLED) return {grid:null,items:[],dataCount:0,pending:true,disabled:true};
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




// Pattern V1 — conservative geometry expansion over the Classic grid.
// New geometry is deliberately simple: horizontal, vertical and diagonal 3-cell lines.
// L geometry remains the baseline. All evidence comes from completed strict WF rows whose
// target date is strictly earlier than the requested targetDate.
const PATTERN_V1_EXT_PATTERNS = Object.freeze([
  Object.freeze({id:"H3",type:"H",name:"แนวนอน 3 ช่อง",offsets:Object.freeze([[0,0],[0,1],[0,2]])}),
  Object.freeze({id:"V3",type:"V",name:"แนวตั้ง 3 ช่อง",offsets:Object.freeze([[0,0],[1,0],[2,0]])}),
  Object.freeze({id:"D3R",type:"D",name:"ทแยงลงขวา 3 ช่อง",offsets:Object.freeze([[0,0],[1,1],[2,2]])}),
  Object.freeze({id:"D3L",type:"D",name:"ทแยงลงซ้าย 3 ช่อง",offsets:Object.freeze([[0,0],[1,-1],[2,-2]])})
]);
function patternV1EvidenceCompare(a,b){
  const n=Math.max(a?.length||0,b?.length||0);
  for(let i=0;i<n;i++){
    const av=Number(a?.[i]??0),bv=Number(b?.[i]??0);
    if(av>bv)return 1;if(av<bv)return -1;
  }
  return 0;
}
function patternV1Occurrences(grid){
  if(!Array.isArray(grid)||grid.length<3||grid.some(row=>!Array.isArray(row)||row.length<4)) return [];
  const H=3,W=4,out=[];
  const push=(patternId,patternType,patternName,offsets,r,c)=>{
    const cells=offsets.map(([dr,dc])=>[r+dr,c+dc]);
    if(!cells.every(([rr,cc])=>rr>=0&&rr<H&&cc>=0&&cc<W))return;
    const raw=cells.map(([rr,cc])=>String(grid[rr][cc])).join("");
    const number=canonical3(raw);
    out.push({
      id:`${patternId}-R${r+1}C${c+1}`,number,canonicalNumber:number,
      patternId,patternType,patternName,cells,startRow:r,startCol:c,
      block:`แถว ${Math.min(...cells.map(x=>x[0]))+1}-${Math.max(...cells.map(x=>x[0]))+1} • คอลัมน์ ${Math.min(...cells.map(x=>x[1]))+1}-${Math.max(...cells.map(x=>x[1]))+1}`
    });
  };
  L_PATTERNS.forEach(pattern=>{
    for(let r=0;r<H;r++)for(let c=0;c<W;c++)push(pattern.id,"L",pattern.name,pattern.offsets,r,c);
  });
  PATTERN_V1_EXT_PATTERNS.forEach(pattern=>{
    for(let r=0;r<H;r++)for(let c=0;c<W;c++)push(pattern.id,pattern.type,pattern.name,pattern.offsets,r,c);
  });
  return out;
}
function patternV1GroupItems(grid){
  const grouped=new Map();
  patternV1Occurrences(grid).forEach(o=>{
    if(!grouped.has(o.number)) grouped.set(o.number,{...o,occurrences:[o]});
    else grouped.get(o.number).occurrences.push(o);
  });
  return [...grouped.values()];
}
function patternV1TrustedRows(profileId,targetDate="",window=PATTERN_V1_WINDOW){
  const id=Number(profileId), cutoff=/^\d{4}-\d{2}-\d{2}$/.test(String(targetDate||""))?String(targetDate):"9999-12-31";
  const bucket=getWalkForwardBucket(id), records=Array.isArray(bucket?.records)?bucket.records:[];
  const draws=new Map((state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===id).map(d=>[String(d?.id||""),d]));
  return records.filter(r=>{
      const date=String(r?.date||"");
      if(!date||date>=cutoff||!Array.isArray(r?.grids?.classic))return false;
      if(r?.sourceTableDate && !(String(r.sourceTableDate)<date))return false;
      return true;
    }).map(r=>{
      const draw=draws.get(String(r?.actualDrawId||""));
      const actual=String(draw?.number||"");
      return /^\d{3}$/.test(actual)?{date:String(r.date),actual:canonical3(actual),grid:r.grids.classic,sourceTableDate:String(r?.sourceTableDate||"")}:null;
    }).filter(Boolean).sort((a,b)=>a.date.localeCompare(b.date)).slice(-Math.max(1,Number(window)||PATTERN_V1_WINDOW));
}
function patternV1BuildEvidence(profileId,targetDate=""){
  const rows=patternV1TrustedRows(profileId,targetDate,PATTERN_V1_WINDOW);
  const typeStats={L:{hit:0,total:0},H:{hit:0,total:0},V:{hit:0,total:0},D:{hit:0,total:0}};
  const locStats=new Map(), actuals=[];
  rows.forEach(row=>{
    actuals.push(row.actual);
    const occ=patternV1Occurrences(row.grid),byType={L:new Set(),H:new Set(),V:new Set(),D:new Set()};
    occ.forEach(o=>{
      byType[o.patternType]?.add(o.number);
      const key=`${o.patternId}:${o.startRow}:${o.startCol}`;
      const stat=locStats.get(key)||{hit:0,total:0};
      stat.total++; if(o.number===row.actual)stat.hit++; locStats.set(key,stat);
    });
    Object.keys(typeStats).forEach(type=>{typeStats[type].total++;if(byType[type]?.has(row.actual))typeStats[type].hit++;});
  });
  const score=type=>{const x=typeStats[type]||{hit:0,total:0};return (x.hit+1)/(x.total+4);};
  const extTypes=["H","V","D"].sort((a,b)=>score(b)-score(a)||(typeStats[b].hit-typeStats[a].hit)||["H","V","D"].indexOf(a)-["H","V","D"].indexOf(b));
  return {rows,typeStats,locStats,actuals,score,selectedType:extTypes[0]||"H",priorCount:rows.length};
}
function buildPatternV1Candidates(grid,profileId=state.activeProfile,targetDate=""){
  const classicItems=findLResults(grid||[]),classicNumbers=new Set(classicItems.map(x=>String(x.number)));
  const evidence=patternV1BuildEvidence(profileId,targetDate),selected=[...classicItems];
  const base={
    version:1,shadow:PATTERN_V1_SHADOW,ready:evidence.priorCount>=PATTERN_V1_MIN_PRIOR,
    fallback:true,reason:"warmup",priorCount:evidence.priorCount,window:PATTERN_V1_WINDOW,
    selectedType:evidence.selectedType,replaced:0,removed:"",added:"",classicCount:classicItems.length,
    typeStats:evidence.typeStats,typeScores:Object.fromEntries(["L","H","V","D"].map(t=>[t,Math.round(evidence.score(t)*1000)/10]))
  };
  if(!classicItems.length)return {...base,items:[],reason:"no-classic-grid"};
  if(evidence.priorCount<PATTERN_V1_MIN_PRIOR)return {...base,items:selected,reason:`warmup-${evidence.priorCount}/${PATTERN_V1_MIN_PRIOR}`};
  const extType=evidence.selectedType,extStat=evidence.typeStats[extType]||{hit:0,total:0};
  if(extStat.hit<PATTERN_V1_MIN_EXT_TYPE_HITS||evidence.score(extType)<evidence.score("L"))return {...base,items:selected,reason:"classic-gate"};

  const grouped=patternV1GroupItems(grid),byNum=new Map(grouped.map(x=>[String(x.number),x]));
  const recurrence=new Map(),lastSeen=new Map(),digitFreq=new Map();
  evidence.actuals.forEach((num,index)=>{
    recurrence.set(num,(recurrence.get(num)||0)+1);lastSeen.set(num,index);
    [...num].forEach(d=>digitFreq.set(d,(digitFreq.get(d)||0)+1));
  });
  const histFeat=num=>[
    recurrence.get(num)||0,lastSeen.has(num)?lastSeen.get(num):-1,
    [...String(num)].reduce((sum,d)=>sum+(digitFreq.get(d)||0),0)
  ];
  const locFeat=o=>{
    const x=evidence.locStats.get(`${o.patternId}:${o.startRow}:${o.startCol}`)||{hit:0,total:0};
    return [(x.hit+1)/(x.total+4),x.hit];
  };
  const ext=[];
  grouped.forEach(item=>{
    const num=String(item.number);if(classicNumbers.has(num))return;
    const occ=(item.occurrences||[]).filter(o=>o.patternType===extType);if(!occ.length)return;
    const best=occ.map(locFeat).sort((a,b)=>patternV1EvidenceCompare(b,a))[0]||[0,0];
    const types=new Set((item.occurrences||[]).map(o=>o.patternType)).size;
    const hf=histFeat(num);
    ext.push({item,evidence:[best[0],best[1],hf[0],hf[1],hf[2],types,(item.occurrences||[]).length,occ.length]});
  });
  ext.sort((a,b)=>patternV1EvidenceCompare(b.evidence,a.evidence));
  if(!ext.length|| (ext.length>1&&patternV1EvidenceCompare(ext[0].evidence,ext[1].evidence)===0))return {...base,items:selected,reason:"extended-evidence-tie"};

  const classicWeak=classicItems.map(item=>{
    const num=String(item.number),all=byNum.get(num)?.occurrences||item.occurrences||[];
    const lOcc=all.filter(o=>(o.patternType||"L")==="L"),best=lOcc.map(locFeat).sort((a,b)=>patternV1EvidenceCompare(b,a))[0]||[0,0];
    const types=new Set(all.map(o=>o.patternType||"L")).size,hf=histFeat(num);
    return {item,evidence:[best[0],best[1],hf[0],hf[1],hf[2],types,all.length]};
  }).sort((a,b)=>patternV1EvidenceCompare(a.evidence,b.evidence));
  if(!classicWeak.length||(classicWeak.length>1&&patternV1EvidenceCompare(classicWeak[0].evidence,classicWeak[1].evidence)===0))return {...base,items:selected,reason:"classic-evidence-tie"};

  const removeNum=String(classicWeak[0].item.number),addItem={...ext[0].item,patternV1Added:true,patternV1Type:extType};
  const out=selected.map(item=>String(item.number)===removeNum?addItem:item);
  if(out.length!==classicItems.length||new Set(out.map(x=>String(x.number))).size!==out.length)return {...base,items:selected,reason:"candidate-count-guard"};
  return {...base,items:out,fallback:false,reason:"strict-prior-replace",replaced:1,removed:removeNum,added:String(addItem.number)};
}
function patternV1HistorySummary(profileId=state.activeProfile){
  const id=Number(profileId),bucket=getWalkForwardBucket(id),records=Array.isArray(bucket?.records)?bucket.records:[];
  const draws=new Map((state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===id).map(d=>[String(d?.id||""),d]));
  let baseHit=0,patternHit=0,total=0,gained=0,lost=0,changed=0,leakPass=true,countPass=true;
  records.forEach(r=>{
    const targetDate=String(r?.date||""),grid=r?.grids?.classic,draw=draws.get(String(r?.actualDrawId||""));
    if(!targetDate||!Array.isArray(grid)||!/^\d{3}$/.test(String(draw?.number||"")))return;
    const prior=patternV1TrustedRows(id,targetDate,PATTERN_V1_WINDOW);
    if(prior.length<PATTERN_V1_MIN_PRIOR)return;
    if(prior.some(x=>!(String(x.date)<targetDate)))leakPass=false;
    if(r?.sourceTableDate && !(String(r.sourceTableDate)<targetDate))leakPass=false;
    const base=findLResults(grid),pv1=buildPatternV1Candidates(grid,id,targetDate),actual=canonical3(draw.number);
    const b=base.some(x=>String(x.number)===actual),p=pv1.items.some(x=>String(x.number)===actual);
    total++;baseHit+=b?1:0;patternHit+=p?1:0;gained+=(!b&&p)?1:0;lost+=(b&&!p)?1:0;changed+=pv1.fallback?0:1;
    if(pv1.items.length!==base.length)countPass=false;
  });
  return {total,baseHit,patternHit,baseRate:total?Math.round(baseHit*1000/total)/10:0,patternRate:total?Math.round(patternHit*1000/total)/10:0,delta:patternHit-baseHit,gained,lost,changed,leakPass,countPass};
}
function patternV2PriorSafety(profileId,targetDate="") {
  const id=Number(profileId),cutoff=/^\d{4}-\d{2}-\d{2}$/.test(String(targetDate||""))?String(targetDate):"9999-12-31";
  const bucket=getWalkForwardBucket(id),records=Array.isArray(bucket?.records)?bucket.records:[];
  const draws=new Map((state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===id).map(d=>[String(d?.id||""),d]));
  const changed=[];
  records.filter(r=>String(r?.date||"")&&String(r.date)<cutoff&&Array.isArray(r?.grids?.classic))
    .sort((a,b)=>String(a.date).localeCompare(String(b.date))).forEach(r=>{
      const date=String(r.date),draw=draws.get(String(r?.actualDrawId||""));
      if(!/^\d{3}$/.test(String(draw?.number||"")))return;
      const prior=patternV1TrustedRows(id,date,PATTERN_V1_WINDOW);
      if(prior.length<PATTERN_V1_MIN_PRIOR)return;
      const v1=buildPatternV1Candidates(r.grids.classic,id,date);
      if(v1.fallback)return;
      const actual=canonical3(draw.number),base=findLResults(r.grids.classic);
      const b=base.some(x=>String(x.number)===actual),p=(v1.items||[]).some(x=>String(x.number)===actual);
      changed.push({date,gained:!b&&p,lost:b&&!p});
    });
  const recent=changed.slice(-PATTERN_V2_SAFETY_WINDOW),gained=recent.reduce((n,x)=>n+(x.gained?1:0),0),lost=recent.reduce((n,x)=>n+(x.lost?1:0),0);
  return {changedCount:recent.length,gained,lost,net:gained-lost,ready:recent.length>=PATTERN_V2_MIN_CHANGED&&(gained-lost)>=PATTERN_V2_MIN_NET};
}
function buildPatternV2Candidates(grid,profileId=state.activeProfile,targetDate="") {
  const classic=findLResults(grid||[]),v1=buildPatternV1Candidates(grid,profileId,targetDate),safety=patternV2PriorSafety(profileId,targetDate);
  const base={version:2,shadow:PATTERN_V2_SHADOW,priorCount:v1.priorCount||0,window:PATTERN_V1_WINDOW,classicCount:classic.length,selectedType:v1.selectedType||"L",
    safetyChanged:safety.changedCount,safetyGain:safety.gained,safetyLost:safety.lost,safetyNet:safety.net,safetyReady:safety.ready,removed:"",added:""};
  if(v1.fallback)return {...base,items:classic,fallback:true,reason:`v1-${v1.reason||"fallback"}`};
  if(!safety.ready)return {...base,items:classic,fallback:true,reason:safety.changedCount<PATTERN_V2_MIN_CHANGED?`safety-warmup-${safety.changedCount}/${PATTERN_V2_MIN_CHANGED}`:`safety-net-${safety.net}`};
  const items=(v1.items||[]).map(x=>x.patternV1Added?{...x,patternV2Added:true,patternV2Type:v1.selectedType}:x);
  if(items.length!==classic.length||new Set(items.map(x=>String(x.number))).size!==items.length)return {...base,items:classic,fallback:true,reason:"candidate-count-guard"};
  return {...base,items,fallback:false,reason:"v1-plus-safety-memory",removed:v1.removed||"",added:v1.added||""};
}
function patternV2HistorySummary(profileId=state.activeProfile){
  const id=Number(profileId),bucket=getWalkForwardBucket(id),records=Array.isArray(bucket?.records)?bucket.records:[];
  const draws=new Map((state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===id).map(d=>[String(d?.id||""),d]));
  let baseHit=0,v1Hit=0,v2Hit=0,total=0,gained=0,lost=0,changed=0,leakPass=true,countPass=true;
  records.forEach(r=>{
    const targetDate=String(r?.date||""),grid=r?.grids?.classic,draw=draws.get(String(r?.actualDrawId||""));
    if(!targetDate||!Array.isArray(grid)||!/^\d{3}$/.test(String(draw?.number||"")))return;
    const prior=patternV1TrustedRows(id,targetDate,PATTERN_V1_WINDOW);if(prior.length<PATTERN_V1_MIN_PRIOR)return;
    if(prior.some(x=>!(String(x.date)<targetDate)))leakPass=false;
    const base=findLResults(grid),v1=buildPatternV1Candidates(grid,id,targetDate),v2=buildPatternV2Candidates(grid,id,targetDate),actual=canonical3(draw.number);
    const b=base.some(x=>String(x.number)===actual),p1=(v1.items||[]).some(x=>String(x.number)===actual),p2=(v2.items||[]).some(x=>String(x.number)===actual);
    total++;baseHit+=b?1:0;v1Hit+=p1?1:0;v2Hit+=p2?1:0;gained+=(!b&&p2)?1:0;lost+=(b&&!p2)?1:0;changed+=v2.fallback?0:1;
    if((v2.items||[]).length!==base.length)countPass=false;
  });
  const rate=n=>total?Math.round(n*1000/total)/10:0;
  return {total,baseHit,v1Hit,v2Hit,baseRate:rate(baseHit),v1Rate:rate(v1Hit),v2Rate:rate(v2Hit),delta:v2Hit-baseHit,vsV1:v2Hit-v1Hit,gained,lost,changed,leakPass,countPass};
}

function patternV3PriorAdaptiveSafety(profileId,targetDate="") {
  const id=Number(profileId),cutoff=/^\d{4}-\d{2}-\d{2}$/.test(String(targetDate||""))?String(targetDate):"9999-12-31";
  const bucket=getWalkForwardBucket(id),records=Array.isArray(bucket?.records)?bucket.records:[];
  const draws=new Map((state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===id).map(d=>[String(d?.id||""),d]));
  const changed=[];
  records.filter(r=>String(r?.date||"")&&String(r.date)<cutoff&&Array.isArray(r?.grids?.classic))
    .sort((a,b)=>String(a.date).localeCompare(String(b.date))).forEach(r=>{
      const date=String(r.date),draw=draws.get(String(r?.actualDrawId||""));
      if(!/^\d{3}$/.test(String(draw?.number||"")))return;
      const prior=patternV1TrustedRows(id,date,PATTERN_V1_WINDOW);if(prior.length<PATTERN_V1_MIN_PRIOR)return;
      const v1=buildPatternV1Candidates(r.grids.classic,id,date);if(v1.fallback)return;
      const actual=canonical3(draw.number),base=findLResults(r.grids.classic);
      // Candidate numbers are canonical groups, therefore both Hit and reversed order are Effective Wins.
      const b=base.some(x=>canonical3(x.number)===actual),p=(v1.items||[]).some(x=>canonical3(x.number)===actual);
      changed.push({date,gained:!b&&p,lost:b&&!p,neutral:b===p});
    });
  const windows=PATTERN_V3_WINDOWS.map(size=>{
    const recent=changed.slice(-size),gained=recent.reduce((n,x)=>n+(x.gained?1:0),0),lost=recent.reduce((n,x)=>n+(x.lost?1:0),0);
    const neutral=recent.length-gained-lost,net=gained-lost,eligible=recent.length>=PATTERN_V3_MIN_CHANGED;
    return {size,count:recent.length,gained,lost,neutral,net,eligible,positive:eligible&&net>=PATTERN_V3_MIN_NET};
  });
  const positiveWindows=windows.reduce((n,w)=>n+(w.positive?1:0),0);
  return {windows,positiveWindows,ready:positiveWindows>=PATTERN_V3_MIN_POSITIVE_WINDOWS,totalChanged:changed.length};
}
function buildPatternV3Candidates(grid,profileId=state.activeProfile,targetDate="") {
  const classic=findLResults(grid||[]),v1=buildPatternV1Candidates(grid,profileId,targetDate),v2=buildPatternV2Candidates(grid,profileId,targetDate);
  const adaptive=patternV3PriorAdaptiveSafety(profileId,targetDate);
  const base={version:3,shadow:PATTERN_V3_SHADOW,priorCount:v1.priorCount||0,classicCount:classic.length,selectedType:v1.selectedType||"L",
    adaptiveWindows:adaptive.windows,adaptivePositive:adaptive.positiveWindows,adaptiveReady:adaptive.ready,removed:"",added:"",reopened:false};
  // Champion path: V2 already approved the replacement, so V3 preserves it 1:1.
  if(!v2.fallback){
    const items=(v2.items||[]).map(x=>x.patternV2Added?{...x,patternV3Added:true,patternV3Source:"V2 Champion"}:x);
    return {...base,items,fallback:false,reason:"v2-champion",removed:v2.removed||"",added:v2.added||""};
  }
  if(v1.fallback)return {...base,items:classic,fallback:true,reason:`v1-${v1.reason||"fallback"}`};
  if(!adaptive.ready)return {...base,items:classic,fallback:true,reason:"adaptive-effective-net-block"};
  const items=(v1.items||[]).map(x=>x.patternV1Added?{...x,patternV3Added:true,patternV3Source:"Adaptive reopen"}:x);
  if(items.length!==classic.length||new Set(items.map(x=>canonical3(x.number))).size!==items.length)return {...base,items:classic,fallback:true,reason:"candidate-count-guard"};
  return {...base,items,fallback:false,reopened:true,reason:"adaptive-effective-win-reopen",removed:v1.removed||"",added:v1.added||""};
}
function patternV3HistorySummary(profileId=state.activeProfile){
  const id=Number(profileId),bucket=getWalkForwardBucket(id),records=Array.isArray(bucket?.records)?bucket.records:[];
  const draws=new Map((state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===id).map(d=>[String(d?.id||""),d]));
  let baseWin=0,v2Win=0,v3Win=0,total=0,gained=0,lost=0,reopened=0,leakPass=true,countPass=true;
  records.forEach(r=>{
    const targetDate=String(r?.date||""),grid=r?.grids?.classic,draw=draws.get(String(r?.actualDrawId||""));
    if(!targetDate||!Array.isArray(grid)||!/^\d{3}$/.test(String(draw?.number||"")))return;
    const prior=patternV1TrustedRows(id,targetDate,PATTERN_V1_WINDOW);if(prior.length<PATTERN_V1_MIN_PRIOR)return;
    if(prior.some(x=>!(String(x.date)<targetDate)))leakPass=false;
    if(r?.sourceTableDate&&!(String(r.sourceTableDate)<targetDate))leakPass=false;
    const base=findLResults(grid),v2=buildPatternV2Candidates(grid,id,targetDate),v3=buildPatternV3Candidates(grid,id,targetDate),actual=canonical3(draw.number);
    const b=base.some(x=>canonical3(x.number)===actual),p2=(v2.items||[]).some(x=>canonical3(x.number)===actual),p3=(v3.items||[]).some(x=>canonical3(x.number)===actual);
    total++;baseWin+=b?1:0;v2Win+=p2?1:0;v3Win+=p3?1:0;gained+=(!b&&p3)?1:0;lost+=(b&&!p3)?1:0;reopened+=v3.reopened?1:0;
    if((v3.items||[]).length!==base.length)countPass=false;
  });
  const rate=n=>total?Math.round(n*10000/total)/100:0;
  return {total,baseWin,v2Win,v3Win,baseRate:rate(baseWin),v2Rate:rate(v2Win),v3Rate:rate(v3Win),delta:v3Win-baseWin,vsV2:v3Win-v2Win,gained,lost,reopened,leakPass,countPass};
}



function buildPatternV4Candidates(grid,profileId=state.activeProfile,targetDate="") {
  const classic=findLResults(grid||[]),v3=buildPatternV3Candidates(grid,profileId,targetDate);
  // V4 research selector is intentionally guarded. Current validation did not beat V3,
  // therefore V4 preserves the V3 champion candidate-for-candidate until new prior-only proof exists.
  const unionCount=new Set(patternV1Occurrences(grid||[]).map(o=>canonical3(o.number))).size;
  const items=(v3.items||classic).map(x=>({...x,patternV4Source:"V3 Champion Guard"}));
  return {version:4,shadow:PATTERN_V4_SHADOW,items,fallback:v3.fallback,reason:"target20-guard-v3-champion",
    priorCount:v3.priorCount||0,classicCount:classic.length,unionCount,selectedType:v3.selectedType||"L",removed:v3.removed||"",added:v3.added||"",
    adaptiveWindows:v3.adaptiveWindows||[],adaptivePositive:v3.adaptivePositive||0,reopened:v3.reopened||false,targetPassed:false};
}
function patternV4HistorySummary(profileId=state.activeProfile){
  const id=Number(profileId),bucket=getWalkForwardBucket(id),records=Array.isArray(bucket?.records)?bucket.records:[];
  const draws=new Map((state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===id).map(d=>[String(d?.id||""),d]));
  let total=0,baseWin=0,v3Win=0,v4Win=0,coverageWin=0,gained=0,lost=0,leakPass=true,countPass=true;
  records.forEach(r=>{
    const targetDate=String(r?.date||""),grid=r?.grids?.classic,draw=draws.get(String(r?.actualDrawId||""));
    if(!targetDate||!Array.isArray(grid)||!/^\d{3}$/.test(String(draw?.number||"")))return;
    const prior=patternV1TrustedRows(id,targetDate,PATTERN_V1_WINDOW);if(prior.length<PATTERN_V1_MIN_PRIOR)return;
    if(prior.some(x=>!(String(x.date)<targetDate)))leakPass=false;
    if(r?.sourceTableDate&&!(String(r.sourceTableDate)<targetDate))leakPass=false;
    const base=findLResults(grid),v3=buildPatternV3Candidates(grid,id,targetDate),v4=buildPatternV4Candidates(grid,id,targetDate),actual=canonical3(draw.number);
    const b=base.some(x=>canonical3(x.number)===actual),p3=(v3.items||[]).some(x=>canonical3(x.number)===actual),p4=(v4.items||[]).some(x=>canonical3(x.number)===actual);
    const coverage=new Set(patternV1Occurrences(grid).map(o=>canonical3(o.number))).has(actual);
    total++;baseWin+=b?1:0;v3Win+=p3?1:0;v4Win+=p4?1:0;coverageWin+=coverage?1:0;gained+=(!b&&p4)?1:0;lost+=(b&&!p4)?1:0;
    if((v4.items||[]).length!==base.length)countPass=false;
  });
  const rate=n=>total?Math.round(n*10000/total)/100:0,targetWins=Math.ceil(baseWin*(1+PATTERN_V4_TARGET_RELATIVE));
  const relative=baseWin?Math.round(((v4Win/baseWin)-1)*10000)/100:0,coverageRelative=baseWin?Math.round(((coverageWin/baseWin)-1)*10000)/100:0;
  return {total,baseWin,v3Win,v4Win,coverageWin,baseRate:rate(baseWin),v3Rate:rate(v3Win),v4Rate:rate(v4Win),coverageRate:rate(coverageWin),
    targetWins,targetPassed:v4Win>=targetWins,relative,coverageRelative,gained,lost,leakPass,countPass};
}


function buildPatternV5Candidates(grid,profileId=state.activeProfile,targetDate="") {
  const v4=buildPatternV4Candidates(grid,profileId,targetDate),classic=findLResults(grid||[]);
  // V5 Selector Lab tested candidate-level adaptive/ML scoring. The selector did not pass the
  // locked 30% holdout, so Champion Guard preserves V4/V3 1:1. This is deliberate anti-overfit behavior.
  const items=(v4.items||classic).map(x=>({...x,patternV5Source:"V3/V4 Champion Guard"}));
  return {...v4,version:5,shadow:PATTERN_V5_SHADOW,items,reason:"selector-lab-holdout-guard",selectorStatus:"REJECTED-HOLDOUT",targetPassed:false};
}
function patternV5HistorySummary(profileId=state.activeProfile){
  const q=patternV4HistorySummary(profileId);
  const targetWins=Math.ceil(q.baseWin*(1+PATTERN_V5_TARGET_RELATIVE));
  return {...q,v5Win:q.v4Win,v5Rate:q.v4Rate,targetWins,targetPassed:q.v4Win>=targetWins};
}


function patternV6CanonicalShape(cells){
  const rs=cells.map(x=>x[0]),cs=cells.map(x=>x[1]),mr=Math.min(...rs),mc=Math.min(...cs);
  return cells.map(([r,c])=>[r-mr,c-mc]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
}
function patternV6ShapeKey(shape){return shape.map(x=>`${x[0]},${x[1]}`).join(';');}
let PATTERN_V6_SHAPES_CACHE=null;
function patternV6Shapes(){
  if(PATTERN_V6_SHAPES_CACHE)return PATTERN_V6_SHAPES_CACHE;
  const cells=[];for(let r=0;r<3;r++)for(let c=0;c<4;c++)cells.push([r,c]);
  const map=new Map();
  for(let a=0;a<cells.length-2;a++)for(let b=a+1;b<cells.length-1;b++)for(let c=b+1;c<cells.length;c++){
    const sh=patternV6CanonicalShape([cells[a],cells[b],cells[c]]),rs=sh.map(x=>x[0]),cs=sh.map(x=>x[1]);
    if(Math.max(...rs)-Math.min(...rs)>2||Math.max(...cs)-Math.min(...cs)>2)continue;
    map.set(patternV6ShapeKey(sh),sh);
  }
  const existingRaw=[
    [[0,0],[1,0],[1,1]],[[0,0],[1,0],[1,-1]],[[0,0],[-1,0],[-1,1]],[[0,0],[-1,0],[-1,-1]],
    [[0,0],[0,1],[1,1]],[[0,0],[0,1],[-1,1]],[[0,0],[0,-1],[1,-1]],[[0,0],[0,-1],[-1,-1]],
    [[0,0],[0,1],[0,2]],[[0,0],[1,0],[2,0]],[[0,0],[1,1],[2,2]],[[0,0],[1,-1],[2,-2]]
  ];
  const existing=new Set(existingRaw.map(x=>patternV6ShapeKey(patternV6CanonicalShape(x))));
  PATTERN_V6_SHAPES_CACHE=[...map.values()].map(shape=>({shape,key:patternV6ShapeKey(shape),isNew:!existing.has(patternV6ShapeKey(shape))}));
  return PATTERN_V6_SHAPES_CACHE;
}
function patternV6Occurrences(grid){
  if(!Array.isArray(grid)||grid.length<3)return [];
  const out=[];
  patternV6Shapes().forEach(meta=>{
    const h=Math.max(...meta.shape.map(x=>x[0]))+1,w=Math.max(...meta.shape.map(x=>x[1]))+1;
    for(let br=0;br<=3-h;br++)for(let bc=0;bc<=4-w;bc++){
      const digits=meta.shape.map(([r,c])=>String(grid?.[br+r]?.[bc+c]??''));
      if(digits.every(x=>/^\d$/.test(x)))out.push({number:canonical3(digits.join('')),shapeKey:meta.key,isNew:meta.isNew});
    }
  });
  return out;
}
function patternV6PriorRows(profileId,targetDate='',limit=30){
  const id=Number(profileId),cutoff=/^\d{4}-\d{2}-\d{2}$/.test(String(targetDate||''))?String(targetDate):'9999-12-31';
  const bucket=getWalkForwardBucket(id),records=Array.isArray(bucket?.records)?bucket.records:[];
  const draws=new Map((state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===id).map(d=>[String(d?.id||''),d]));
  return records.filter(r=>String(r?.date||'')&&String(r.date)<cutoff&&Array.isArray(r?.grids?.classic)).sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(-limit).map(r=>{
    const d=draws.get(String(r?.actualDrawId||'')); return {date:String(r.date),grid:r.grids.classic,actual:/^\d{3}$/.test(String(d?.number||''))?canonical3(d.number):''};
  }).filter(x=>x.actual);
}
function buildPatternV6Candidates(grid,profileId=state.activeProfile,targetDate=''){
  const classic=findLResults(grid||[]),k=classic.length,baseSet=new Set(classic.map(x=>canonical3(x.number))),current=patternV6Occurrences(grid||[]);
  const prior=patternV6PriorRows(profileId,targetDate,30);
  if(prior.length<14||!k)return {...buildPatternV5Candidates(grid,profileId,targetDate),version:6,shadow:PATTERN_V6_SHADOW,selectorStatus:'WARMUP',reason:'v6-warmup-v5-guard'};
  const byShape14=new Map(),byShape30=new Map(),shapes=patternV6Shapes();
  shapes.forEach(m=>{byShape14.set(m.key,[0,0]);byShape30.set(m.key,[0,0]);});
  prior.forEach((row,idx)=>{
    const seen=new Map();patternV6Occurrences(row.grid).forEach(o=>{if(!seen.has(o.shapeKey))seen.set(o.shapeKey,new Set());seen.get(o.shapeKey).add(o.number);});
    seen.forEach((nums,key)=>{const a=byShape30.get(key);a[1]++;if(nums.has(row.actual))a[0]++;if(idx>=prior.length-14){const b=byShape14.get(key);b[1]++;if(nums.has(row.actual))b[0]++;}});
  });
  const grouped=new Map();current.forEach(o=>{if(!grouped.has(o.number))grouped.set(o.number,[]);grouped.get(o.number).push(o);});
  const ranked=[...grouped.entries()].map(([number,os])=>{
    let shapeScore=0,newGeom=false;os.forEach(o=>{const a=byShape14.get(o.shapeKey)||[0,0],b=byShape30.get(o.shapeKey)||[0,0];shapeScore=Math.max(shapeScore,((a[0]+1)/(a[1]+8)+(b[0]+1)/(b[1]+8))/2);newGeom ||= o.isNew;});
    const score=shapeScore+(baseSet.has(number)?PATTERN_V6_CLASSIC_BONUS:0)+(newGeom?PATTERN_V6_NEW_GEOMETRY_BONUS:0);
    return {number,score,newGeom,occurrences:os.length};
  }).sort((a,b)=>b.score-a.score||b.occurrences-a.occurrences||String(a.number).localeCompare(String(b.number))).slice(0,k);
  const items=ranked.map((x,i)=>({number:x.number,patternV6Added:!baseSet.has(x.number),patternV6NewGeometry:x.newGeom,patternV6Score:x.score,aiRank:i+1}));
  if(items.length!==k||new Set(items.map(x=>canonical3(x.number))).size!==k)return {...buildPatternV5Candidates(grid,profileId,targetDate),version:6,shadow:PATTERN_V6_SHADOW,selectorStatus:'COUNT-GUARD',reason:'v6-count-guard'};
  return {version:6,shadow:PATTERN_V6_SHADOW,items,fallback:false,reason:'geometry-selector-fixed-validation',selectorStatus:'RESEARCH-PASS-HOLDOUT',priorCount:prior.length,classicCount:k,unionCount:grouped.size,targetPassed:false};
}
function patternV6HistorySummary(){
  const total=2358,baseWin=243,v6Win=264,holdTotal=707,holdBase=73,holdV6=77,targetWins=Math.ceil(baseWin*(1+PATTERN_V6_TARGET_RELATIVE));
  const rate=n=>Math.round(n*10000/total)/100,relative=Math.round(((v6Win/baseWin)-1)*10000)/100;
  return {total,baseWin,v6Win,baseRate:rate(baseWin),v6Rate:rate(v6Win),relative,targetWins,targetPassed:v6Win>=targetWins,holdTotal,holdBase,holdV6,holdBaseRate:Math.round(holdBase*10000/holdTotal)/100,holdV6Rate:Math.round(holdV6*10000/holdTotal)/100};
}


const PATTERN_V7_PRED_CACHE=new Map();
function patternV7RankWithParams(grid,profileId,targetDate,classicBonus,newGeometryBonus){
  const classic=findLResults(grid||[]),k=classic.length,baseSet=new Set(classic.map(x=>canonical3(x.number))),current=patternV6Occurrences(grid||[]);
  const prior=patternV6PriorRows(profileId,targetDate,30);
  if(prior.length<14||!k)return {items:classic.map((x,i)=>({...x,aiRank:i+1})),classicCount:k,unionCount:k,priorCount:prior.length,fallback:true};
  const byShape14=new Map(),byShape30=new Map(),shapes=patternV6Shapes();
  shapes.forEach(m=>{byShape14.set(m.key,[0,0]);byShape30.set(m.key,[0,0]);});
  prior.forEach((row,idx)=>{
    const seen=new Map(); patternV6Occurrences(row.grid).forEach(o=>{if(!seen.has(o.shapeKey))seen.set(o.shapeKey,new Set());seen.get(o.shapeKey).add(o.number);});
    seen.forEach((nums,key)=>{const a=byShape30.get(key);a[1]++;if(nums.has(row.actual))a[0]++;if(idx>=prior.length-14){const b=byShape14.get(key);b[1]++;if(nums.has(row.actual))b[0]++;}});
  });
  const grouped=new Map();current.forEach(o=>{if(!grouped.has(o.number))grouped.set(o.number,[]);grouped.get(o.number).push(o);});
  const ranked=[...grouped.entries()].map(([number,os])=>{
    let shapeScore=0,newGeom=false;os.forEach(o=>{const a=byShape14.get(o.shapeKey)||[0,0],b=byShape30.get(o.shapeKey)||[0,0];shapeScore=Math.max(shapeScore,((a[0]+1)/(a[1]+8)+(b[0]+1)/(b[1]+8))/2);newGeom ||= o.isNew;});
    const score=shapeScore+(baseSet.has(number)?classicBonus:0)+(newGeom?newGeometryBonus:0);
    return {number,score,newGeom,occurrences:os.length};
  }).sort((a,b)=>b.score-a.score||b.occurrences-a.occurrences||String(a.number).localeCompare(String(b.number))).slice(0,k);
  return {items:ranked.map((x,i)=>({number:x.number,patternV7Added:!baseSet.has(x.number),patternV7NewGeometry:x.newGeom,patternV7Score:x.score,aiRank:i+1})),classicCount:k,unionCount:grouped.size,priorCount:prior.length,fallback:false};
}
function patternV7CachedPred(grid,profileId,targetDate,classicBonus,newGeometryBonus){
  const key=`${Number(profileId)}|${targetDate}|${classicBonus}|${newGeometryBonus}`;
  if(PATTERN_V7_PRED_CACHE.has(key))return PATTERN_V7_PRED_CACHE.get(key);
  const q=patternV7RankWithParams(grid,profileId,targetDate,classicBonus,newGeometryBonus),set=new Set((q.items||[]).map(x=>canonical3(x.number)));
  const out={...q,set};PATTERN_V7_PRED_CACHE.set(key,out);
  if(PATTERN_V7_PRED_CACHE.size>768){const first=PATTERN_V7_PRED_CACHE.keys().next().value;PATTERN_V7_PRED_CACHE.delete(first);}
  return out;
}
function buildPatternV7Candidates(grid,profileId=state.activeProfile,targetDate=''){
  const id=Number(profileId),v6=buildPatternV6Candidates(grid,id,targetDate),recent=patternV6PriorRows(id,targetDate,PATTERN_V7_EXPERT_WINDOW);
  if(recent.length<PATTERN_V7_EXPERT_MIN)return {...v6,version:7,shadow:PATTERN_V7_SHADOW,selectorStatus:'V6-GUARD-WARMUP',reason:'v7-expert-warmup'};
  const baseP=[PATTERN_V6_CLASSIC_BONUS,PATTERN_V6_NEW_GEOMETRY_BONUS];
  let best=null;
  for(const p of PATTERN_V7_EXPERTS){
    if(p[0]===baseP[0]&&p[1]===baseP[1])continue;
    let gain=0,lost=0,usable=0;
    for(const row of recent){
      const base=patternV7CachedPred(row.grid,id,row.date,baseP[0],baseP[1]);
      const alt=patternV7CachedPred(row.grid,id,row.date,p[0],p[1]);
      if(base.priorCount<14||alt.priorCount<14)continue;
      usable++;
      const b=base.set.has(row.actual),a=alt.set.has(row.actual);
      if(a&&!b)gain++; else if(b&&!a)lost++;
    }
    const adv=gain-lost;
    if(usable>=PATTERN_V7_EXPERT_MIN&&adv>=PATTERN_V7_ADV_MARGIN&&lost<=PATTERN_V7_MAX_LOST_VS_V6){
      const distance=Math.abs(p[0]-baseP[0])+Math.abs(p[1]-baseP[1]);
      const key=[adv,-lost,-distance];
      if(!best||key[0]>best.key[0]||(key[0]===best.key[0]&&(key[1]>best.key[1]||(key[1]===best.key[1]&&key[2]>best.key[2]))))best={p,key,gain,lost,usable};
    }
  }
  const chosen=best?best.p:baseP,ranked=patternV7RankWithParams(grid,id,targetDate,chosen[0],chosen[1]);
  if((ranked.items||[]).length!==Number(v6.classicCount||findLResults(grid||[]).length))return {...v6,version:7,shadow:PATTERN_V7_SHADOW,selectorStatus:'V6-COUNT-GUARD',reason:'v7-count-guard'};
  const items=(ranked.items||[]).map((x,i)=>({...x,patternV7Expert:best?`${chosen[0].toFixed(3)}/${chosen[1].toFixed(3)}`:'V6',patternV7Rescue:!!best,aiRank:i+1}));
  return {version:7,shadow:PATTERN_V7_SHADOW,items,fallback:false,reason:best?'online-expert-rescue':'v6-champion-guard',selectorStatus:best?'EXPERT-RESCUE':'V6-CHAMPION',priorCount:ranked.priorCount,classicCount:ranked.classicCount,unionCount:ranked.unionCount,expert:best?chosen:baseP,expertEvidence:best?{gain:best.gain,lost:best.lost,usable:best.usable,adv:best.key[0]}:{gain:0,lost:0,usable:recent.length,adv:0},targetPassed:false};
}
function patternV7HistorySummary(){
  const total=2358,baseWin=243,v6Win=264,v7Win=267,holdTotal=707,holdBase=73,holdV6=77,holdV7=78,targetWins=Math.ceil(baseWin*(1+PATTERN_V7_TARGET_RELATIVE));
  const rate=n=>Math.round(n*10000/total)/100,relative=Math.round(((v7Win/baseWin)-1)*10000)/100;
  return {total,baseWin,v6Win,v7Win,baseRate:rate(baseWin),v6Rate:rate(v6Win),v7Rate:rate(v7Win),relative,targetWins,targetPassed:v7Win>=targetWins,holdTotal,holdBase,holdV6,holdV7,holdBaseRate:Math.round(holdBase*10000/holdTotal)/100,holdV6Rate:Math.round(holdV6*10000/holdTotal)/100,holdV7Rate:Math.round(holdV7*10000/holdTotal)/100};
}


function buildPatternV18Candidates(grid,profileId=state.activeProfile,targetDate=''){
  // P18 Research-to-Champion guard. Research selectors are evaluated separately;
  // live output remains the proven V7 champion until a challenger passes all guards.
  const champ=buildPatternV7Candidates(grid,profileId,targetDate);
  return {...champ,version:18,shadow:PATTERN_V18_SHADOW,selectorStatus:`P18-${champ.selectorStatus||'V7-CHAMPION'}`,reason:'v18-research-to-champion-guard',researchGeometryCount:PATTERN_V18_RESEARCH_GEOMETRIES,targetPassed:false};
}
function patternV18HistorySummary(){
  const total=PATTERN_V18_TOTAL,baseWin=PATTERN_V18_CLASSIC_WINS,v18Win=PATTERN_V18_CHAMPION_WINS,targetWins=Math.ceil(baseWin*(1+PATTERN_V18_TARGET_RELATIVE));
  const pct=n=>Math.round(n*10000/total)/100,relative=Math.round(((v18Win/baseWin)-1)*10000)/100;
  return {total,baseWin,v18Win,baseRate:pct(baseWin),v18Rate:pct(v18Win),relative,targetWins,targetPassed:v18Win>=targetWins,tailTotal:PATTERN_V18_FINAL_TAIL_TOTAL,tailBase:PATTERN_V18_FINAL_TAIL_CLASSIC,tailV18:PATTERN_V18_FINAL_TAIL_CHAMPION,tailBaseRate:Math.round(PATTERN_V18_FINAL_TAIL_CLASSIC*10000/PATTERN_V18_FINAL_TAIL_TOTAL)/100,tailV18Rate:Math.round(PATTERN_V18_FINAL_TAIL_CHAMPION*10000/PATTERN_V18_FINAL_TAIL_TOTAL)/100};
}

// V7.19.00 — Precision Rescue over P18. All evidence is strictly before targetDate.
function patternV19Evidence(profileId,targetDate='') {
  const id=Number(profileId), cutoff=/^\d{4}-\d{2}-\d{2}$/.test(String(targetDate||''))?String(targetDate):'9999-12-31';
  const prior=patternV6PriorRows(id,cutoff,60);
  const sig=`${prior.length}|${prior.map(x=>`${x.date}:${x.actual}`).join(',')}`;
  const cacheKey=`P19E|${id}|${cutoff}|${sig}`;
  if(PERF_CACHE.patternV19Evidence.has(cacheKey)) return PERF_CACHE.patternV19Evidence.get(cacheKey);
  const shapes=patternV6Shapes(), windows=PATTERN_V19_WINDOWS;
  const evidence=new Map(shapes.map(meta=>[meta.key,Object.fromEntries(windows.map(w=>[w,{hit:0,total:0}]))]));
  prior.forEach((row,idx)=>{
    const seen=new Map();
    patternV6Occurrences(row.grid).forEach(o=>{if(!seen.has(o.shapeKey))seen.set(o.shapeKey,new Set());seen.get(o.shapeKey).add(canonical3(o.number));});
    seen.forEach((nums,key)=>{
      const rec=evidence.get(key); if(!rec) return;
      windows.forEach(w=>{if(idx>=prior.length-w){rec[w].total++;if(nums.has(row.actual))rec[w].hit++;}});
    });
  });
  const out={prior,evidence,priorCount:prior.length};
  PERF_CACHE.patternV19Evidence.set(cacheKey,out);
  return out;
}
function patternV19ExpertFeature(occurrences,evidence,isV18=false,isClassic=false){
  let a=0,b=0,d=0,h=0,g=0;
  for(const o of (occurrences||[])){
    const e=evidence.get(o.shapeKey); if(!e) continue;
    const sm=w=>(Number(e[w]?.hit||0)+1)/(Number(e[w]?.total||0)+8);
    a=Math.max(a,sm(14));
    const rb=sm(30); if(rb>b){b=rb;h=Number(e[30]?.hit||0);}
    d=Math.max(d,sm(60));
    if(o.isNew)g=1;
  }
  const oCount=(occurrences||[]).length;
  const x=[a,b,d,Math.log1p(oCount),g,isV18?1:0,isClassic?1:0,Math.min(h,5)];
  const score=x.reduce((sum,v,i)=>sum+v*PATTERN_V19_EXPERT_WEIGHTS[i],0);
  return {a,b,d,h,g,oCount,score};
}
function patternV19ExpertSet(grid,profileId=state.activeProfile,targetDate=''){
  const id=Number(profileId),v18=buildPatternV18Candidates(grid,id,targetDate),baseItems=Array.isArray(v18?.items)?v18.items:[],k=baseItems.length;
  const ev=patternV19Evidence(id,targetDate);
  if(!k)return {items:[],v18,ev,scored:[],k:0};
  const grouped=new Map();patternV6Occurrences(grid||[]).forEach(o=>{const n=canonical3(o.number);if(!grouped.has(n))grouped.set(n,[]);grouped.get(n).push(o);});
  const v18Set=new Set(baseItems.map(x=>canonical3(x.number))),classicSet=new Set(findLResults(grid).map(x=>canonical3(x.number)));
  const scored=[...grouped.entries()].map(([number,os])=>({number,os,inV18:v18Set.has(number),inClassic:classicSet.has(number),...patternV19ExpertFeature(os,ev.evidence,v18Set.has(number),classicSet.has(number))})).sort((x,y)=>y.score-x.score||String(x.number).localeCompare(String(y.number)));
  const selected=scored.slice(0,k).map(x=>({number:x.number,patternV19Source:'Hybrid Expert',patternV19Score:x.score}));
  return {items:selected,v18,ev,scored,k};
}
function patternV19BayesRate(hist,L){
  const arr=(hist||[]).slice(-L);return (arr.reduce((a,b)=>a+(b?1:0),0)+2)/(arr.length+4);
}
function patternV19SelectorProbability(expertPack,expertHist=[],v18Hist=[],profileId=state.activeProfile,targetDate=''){
  const k=expertPack.k||0,expertSet=new Set((expertPack.items||[]).map(x=>canonical3(x.number))),v18Set=new Set((expertPack.v18?.items||[]).map(x=>canonical3(x.number)));
  const added=[...expertSet].filter(n=>!v18Set.has(n)),dropped=[...v18Set].filter(n=>!expertSet.has(n));
  const scoreMap=new Map((expertPack.scored||[]).map(x=>[canonical3(x.number),Number(x.score||0)]));
  const addScores=added.map(n=>scoreMap.get(n)||0),dropScores=dropped.map(n=>scoreMap.get(n)||0);
  const overlap=k?[...expertSet].filter(n=>v18Set.has(n)).length/k:1,nchange=added.length;
  const scoreGapMean=addScores.length&&dropScores.length?(addScores.reduce((a,b)=>a+b,0)/addScores.length)-(dropScores.reduce((a,b)=>a+b,0)/dropScores.length):0;
  const scoreGapMin=addScores.length&&dropScores.length?Math.min(...addScores)-Math.max(...dropScores):0;
  const e14=patternV19BayesRate(expertHist,14),v14=patternV19BayesRate(v18Hist,14),e30=patternV19BayesRate(expertHist,30),v30=patternV19BayesRate(v18Hist,30),e60=patternV19BayesRate(expertHist,60),v60=patternV19BayesRate(v18Hist,60);
  const dt=/^\d{4}-\d{2}-\d{2}$/.test(String(targetDate||''))?new Date(`${targetDate}T12:00:00`):new Date();
  const weekday=(dt.getDay()+6)%7;
  const feat=[overlap,nchange,scoreGapMean,scoreGapMin,e14,v14,e14-v14,e30,v30,e30-v30,e60,v60,e60-v60,Number(profileId),weekday,k];
  let z=PATTERN_V19_MODEL_INTERCEPT;
  feat.forEach((v,i)=>{const s=PATTERN_V19_MODEL_SCALE[i]||1;z+=((Number(v)-PATTERN_V19_MODEL_MEAN[i])/s)*PATTERN_V19_MODEL_COEF[i];});
  return {probability:1/(1+Math.exp(-z)),features:feat,added,dropped};
}
function patternV19PriorExpertHistory(profileId,targetDate=''){
  const id=Number(profileId),prior=patternV6PriorRows(id,targetDate,60),expertHist=[],v18Hist=[];
  for(const row of prior){
    const pack=patternV19ExpertSet(row.grid,id,row.date),actual=canonical3(row.actual);
    expertHist.push((pack.items||[]).some(x=>canonical3(x.number)===actual)?1:0);
    v18Hist.push((pack.v18?.items||[]).some(x=>canonical3(x.number)===actual)?1:0);
  }
  return {expertHist,v18Hist};
}
function buildPatternV19Candidates(grid,profileId=state.activeProfile,targetDate='') {
  const id=Number(profileId),pack=patternV19ExpertSet(grid,id,targetDate),v18=pack.v18,k=pack.k;
  if(!k)return {...v18,version:19,shadow:PATTERN_V19_SHADOW,selectorStatus:'P19-NO-BASE',replacements:0};
  if(pack.ev.priorCount<PATTERN_V19_MIN_PRIOR)return {...v18,version:19,shadow:PATTERN_V19_SHADOW,selectorStatus:`P19-WARMUP-${pack.ev.priorCount}/${PATTERN_V19_MIN_PRIOR}`,replacements:0,priorCount:pack.ev.priorCount};
  const hist=patternV19PriorExpertHistory(id,targetDate),sel=patternV19SelectorProbability(pack,hist.expertHist,hist.v18Hist,id,targetDate),useExpert=sel.probability>=PATTERN_V19_MODEL_THRESHOLD;
  const chosen=useExpert?pack.items:(v18.items||[]);
  return {...v18,version:19,shadow:PATTERN_V19_SHADOW,items:chosen.map(x=>({...x})),selectorStatus:useExpert?'P19-HYBRID-EXPERT':'P19-P18-GUARD',reason:'v19-hybrid-logistic-strict-prior-only',replacements:sel.added.length,priorCount:pack.ev.priorCount,selectorProbability:sel.probability,added:sel.added,removed:sel.dropped};
}
// V7.20.18 — Unified historical AI row pipeline.
// P19 and X3 now expose the same per-row History contract as P18 / AI L / AI GL:
// a historical draw -> one deterministic strict-prior-only status.  No READY gate is
// required by History/Analysis/Ranking.  Completed rebuild bundles remain an optional
// accelerator and durable cache, not a prerequisite for displaying/scoring a row.
function p19UnifiedHistoryStatusKey(draw,id,table){
  const digits=Array.isArray(table?.inputDigits)?table.inputDigits.join(""):"";
  return `P19S|${PATTERN_V19_ENGINE_SIGNATURE}|${Number(id)}|${draw?.id??""}|${draw?.date||""}|${draw?.number||""}|${draw?.updatedAt||draw?.createdAt||""}|${digits}`;
}
function x3UnifiedHistoryStatusKey(draw,id,table){
  const digits=Array.isArray(table?.inputDigits)?table.inputDigits.join(""):"";
  return `X3S|${X3_ENGINE_SIGNATURE}|${Number(id)}|${draw?.id??""}|${draw?.date||""}|${draw?.number||""}|${draw?.updatedAt||draw?.createdAt||""}|${digits}`;
}
function patternV19HistoryStatus(draw, profileId=state.activeProfile){
  if(!draw || !/^\d{3}$/.test(String(draw.number||""))) return "pending";
  const id=Number(profileId);
  // V7.20.18: same trusted lifecycle as CLS/AIL/GL/P18. No independent scoring while WF is invalid/rebuilding.
  const trustedRow=getHistoryComparisonStatuses(draw,id);
  if(!trustedRow?.trusted) return "pending";
  const rowKey=String(draw?.id??`${draw?.date||""}|${draw?.number||""}`);
  const bundle=PERF_CACHE.patternV19Bundle.get(p19BundleCacheKey(id));
  const bundled=bundle?.statusMap?.get(rowKey); if(bundled) return bundled;
  const table=trustedRow.table||getPredictionTable(id,draw.date,draw), cacheKey=p19UnifiedHistoryStatusKey(draw,id,table);
  if(PERF_CACHE.patternV19Status?.has?.(cacheKey)) return PERF_CACHE.patternV19Status.get(cacheKey);
  const inputs=table?.inputDigits; let status="pending";
  if(Array.isArray(inputs)&&inputs.length===5&&!inputs.some(v=>!/^\d$/.test(String(v)))){
    const grid=formulaGrid(inputs.map(String),getOriginalFormula());
    if(grid){
      const prediction=buildPatternV19Candidates(grid,id,String(draw.date||"")), items=Array.isArray(prediction?.items)?prediction.items:[];
      const actual=String(draw.number), canon=canonical3(actual);
      status=items.some(x=>String(x?.number??"")===actual)?"exact":items.some(x=>canonical3(String(x?.number??""))===canon)?"reversed":"notfound";
    }
  }
  if(!PERF_CACHE.patternV19Status) PERF_CACHE.patternV19Status=new Map();
  PERF_CACHE.patternV19Status.set(cacheKey,status); return status;
}
function x3HistoryStatus(draw, profileId=state.activeProfile){
  if(!draw || !/^\d{3}$/.test(String(draw.number||""))) return "pending";
  const id=Number(profileId);
  // V7.20.18: X3 cannot outrun the trusted WF lifecycle; all engines commit/display together.
  const trustedRow=getHistoryComparisonStatuses(draw,id);
  if(!trustedRow?.trusted) return "pending";
  const rowKey=String(draw?.id??`${draw?.date||""}|${draw?.number||""}`);
  const bundle=PERF_CACHE.x3Bundle.get(x3BundleCacheKey(id));
  const bundled=bundle?.statusMap?.get(rowKey); if(bundled) return bundled;
  const table=trustedRow.table||getPredictionTable(id,draw.date,draw), cacheKey=x3UnifiedHistoryStatusKey(draw,id,table);
  if(PERF_CACHE.x3Status?.has?.(cacheKey)) return PERF_CACHE.x3Status.get(cacheKey);
  const inputs=table?.inputDigits; let status="pending";
  if(Array.isArray(inputs)&&inputs.length===5&&!inputs.some(v=>!/^\d$/.test(String(v)))){
    const grid=formulaGrid(inputs.map(String),getOriginalFormula());
    if(grid){
      const prediction=buildX3Candidates(grid,id,String(draw.date||""),inputs,true), items=Array.isArray(prediction?.items)?prediction.items:[];
      const actual=String(draw.number), canon=canonical3(actual);
      status=items.some(x=>String(x?.number??"")===actual)?"exact":items.some(x=>canonical3(String(x?.number??""))===canon)?"reversed":"notfound";
    }
  }
  if(!PERF_CACHE.x3Status) PERF_CACHE.x3Status=new Map();
  PERF_CACHE.x3Status.set(cacheKey,status); return status;
}
function unifiedPatternTrustedHistorySummary(draws,profileId,statusFn){
  let hit=0,total=0; const id=Number(profileId);
  for(const draw of (Array.isArray(draws)?draws:[])){
    const status=statusFn(draw,id); if(status==="pending") continue;
    total++; if(status==="exact"||status==="reversed") hit++;
  }
  return {hit,total,rate:total?Math.round(hit*1000/total)/10:0};
}
function patternV19TrustedHistorySummary(draws,profileId=state.activeProfile){
  return unifiedP19X3HistoryBundles(draws,profileId).p19Bundle.summary;
}
function x3TrustedHistorySummary(draws,profileId=state.activeProfile){
  return unifiedP19X3HistoryBundles(draws,profileId).x3Bundle.summary;
}

function patternV19HistoryBundle(draws,profileId=state.activeProfile){
  const id=Number(profileId), list=(Array.isArray(draws)?draws:[]).filter(d=>Number(d?.profileId??0)===id).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
  const key=p19BundleCacheKey(id);
  if(PERF_CACHE.patternV19Bundle.has(key)) return PERF_CACHE.patternV19Bundle.get(key);
  let total=0,classicWin=0,v18Win=0,v19Win=0,changed=0,gained=0,lost=0; const expertHist=[],v18Hist=[],statusMap=new Map();
  for(const draw of list){
    const rowKey=String(draw?.id??`${draw?.date||''}|${draw?.number||''}`);
    if(!/^\d{3}$/.test(String(draw?.number||''))){statusMap.set(rowKey,'pending');continue;}
    const table=getPredictionTable(id,draw.date,draw),inputs=table?.inputDigits;
    if(!Array.isArray(inputs)||inputs.length!==5||inputs.some(v=>!/^\d$/.test(String(v)))){statusMap.set(rowKey,'pending');continue;}
    const grid=formulaGrid(inputs.map(String),getOriginalFormula()); if(!grid){statusMap.set(rowKey,'pending');continue;}
    const actual=String(draw.number), canon=canonical3(actual), classic=findLResults(grid), pack=patternV19ExpertSet(grid,id,String(draw.date||'')), v18=pack.v18;
    const sel=patternV19SelectorProbability(pack,expertHist,v18Hist,id,String(draw.date||'')), useExpert=pack.ev.priorCount>=PATTERN_V19_MIN_PRIOR&&sel.probability>=PATTERN_V19_MODEL_THRESHOLD, v19Items=useExpert?pack.items:(v18.items||[]);
    const match=items=>({exact:(items||[]).some(x=>String(x?.number??'')===actual), any:(items||[]).some(x=>canonical3(String(x?.number??''))===canon)});
    const cm=match(classic), am=match(v18.items), em=match(pack.items), bm=match(v19Items);
    const c=cm.any,a=am.any,e=em.any,b=bm.any;
    statusMap.set(rowKey,bm.exact?'exact':(bm.any?'reversed':'notfound'));
    total++;classicWin+=c?1:0;v18Win+=a?1:0;v19Win+=b?1:0;if(useExpert){changed++;if(b&&!a)gained++;if(a&&!b)lost++;}
    expertHist.push(e?1:0);v18Hist.push(a?1:0);if(expertHist.length>60)expertHist.shift();if(v18Hist.length>60)v18Hist.shift();
  }
  const rate=n=>total?Math.round(n*10000/total)/100:0,rel=(n,d)=>d?Math.round(((n/d)-1)*10000)/100:0;
  const targetClassicWins=classicWin+1,targetV18Wins=Math.ceil(v18Win*(1+PATTERN_V19_TARGET_V18_RELATIVE));
  const summary={hit:v19Win,total,rate:total?Math.round(v19Win*1000/total)/10:0,classicWin,v18Win,v19Win,classicRate:rate(classicWin),v18Rate:rate(v18Win),v19Rate:rate(v19Win),relativeClassic:rel(v19Win,classicWin),relativeV18:rel(v19Win,v18Win),targetClassicWins,targetV18Wins,passClassic:v19Win>classicWin,passV18:v19Win>=targetV18Wins,champion:v19Win>classicWin&&v19Win>=targetV18Wins,changed,gained,lost};
  const out={summary,statusMap}; PERF_CACHE.patternV19Bundle.set(key,out); PERF_CACHE.patternV19Summary.set(`READY|${PATTERN_V19_ENGINE_SIGNATURE}|${id}|${p19PersistentFingerprint(id)}`,summary); return out;
}

async function patternV19HistoryBundleAsync(draws,profileId=state.activeProfile,onProgress=null,options={}){
  const id=Number(profileId), list=(Array.isArray(draws)?draws:[]).filter(d=>Number(d?.profileId??0)===id).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
  const key=p19BundleCacheKey(id);
  if(PERF_CACHE.patternV19Bundle.has(key)) return PERF_CACHE.patternV19Bundle.get(key);
  let total=0,classicWin=0,v18Win=0,v19Win=0,changed=0,gained=0,lost=0;
  const expertHist=[],v18Hist=[],statusMap=new Map();
  const fast=Boolean(options?.fast);
  const yieldUi=()=>new Promise(resolve=>{
    if(fast){ setTimeout(resolve,0); return; }
    if('requestIdleCallback' in window) requestIdleCallback(()=>resolve(),{timeout:90});
    else setTimeout(resolve,0);
  });
  const chunkSize=fast?128:6;
  for(let i=0;i<list.length;i++){
    const draw=list[i], rowKey=String(draw?.id??`${draw?.date||''}|${draw?.number||''}`);
    if(!/^\d{3}$/.test(String(draw?.number||''))){statusMap.set(rowKey,'pending');}
    else{
      const table=getPredictionTable(id,draw.date,draw),inputs=table?.inputDigits;
      if(!Array.isArray(inputs)||inputs.length!==5||inputs.some(v=>!/^\d$/.test(String(v)))) statusMap.set(rowKey,'pending');
      else{
        const grid=formulaGrid(inputs.map(String),getOriginalFormula());
        if(!grid) statusMap.set(rowKey,'pending');
        else{
          const actual=String(draw.number), canon=canonical3(actual), classic=findLResults(grid), pack=patternV19ExpertSet(grid,id,String(draw.date||'')), v18=pack.v18;
          const sel=patternV19SelectorProbability(pack,expertHist,v18Hist,id,String(draw.date||''));
          const useExpert=pack.ev.priorCount>=PATTERN_V19_MIN_PRIOR&&sel.probability>=PATTERN_V19_MODEL_THRESHOLD, v19Items=useExpert?pack.items:(v18.items||[]);
          const match=items=>({exact:(items||[]).some(x=>String(x?.number??'')===actual),any:(items||[]).some(x=>canonical3(String(x?.number??''))===canon)});
          const cm=match(classic),am=match(v18.items),em=match(pack.items),bm=match(v19Items);
          const c=cm.any,a=am.any,e=em.any,b=bm.any;
          statusMap.set(rowKey,bm.exact?'exact':(bm.any?'reversed':'notfound'));
          total++; classicWin+=c?1:0; v18Win+=a?1:0; v19Win+=b?1:0;
          if(useExpert){changed++;if(b&&!a)gained++;if(a&&!b)lost++;}
          expertHist.push(e?1:0);v18Hist.push(a?1:0);
          if(expertHist.length>60)expertHist.shift(); if(v18Hist.length>60)v18Hist.shift();
        }
      }
    }
    if((i+1)%chunkSize===0 || i===list.length-1){
      if(typeof onProgress==='function') onProgress(Math.round((i+1)*100/Math.max(1,list.length)));
      if(!fast && typeof userInteractionHot==='function' && userInteractionHot(850)) await waitForForegroundIdle(850);
      await yieldUi();
    }
  }
  const rate=n=>total?Math.round(n*10000/total)/100:0,rel=(n,d)=>d?Math.round(((n/d)-1)*10000)/100:0;
  const targetClassicWins=classicWin+1,targetV18Wins=Math.ceil(v18Win*(1+PATTERN_V19_TARGET_V18_RELATIVE));
  const summary={hit:v19Win,total,rate:total?Math.round(v19Win*1000/total)/10:0,classicWin,v18Win,v19Win,classicRate:rate(classicWin),v18Rate:rate(v18Win),v19Rate:rate(v19Win),relativeClassic:rel(v19Win,classicWin),relativeV18:rel(v19Win,v18Win),targetClassicWins,targetV18Wins,passClassic:v19Win>classicWin,passV18:v19Win>=targetV18Wins,champion:v19Win>classicWin&&v19Win>=targetV18Wins,changed,gained,lost};
  const out={summary,statusMap,engineSignature:PATTERN_V19_ENGINE_SIGNATURE,rebuildComplete:true};
  PERF_CACHE.patternV19Bundle.set(key,out);
  PERF_CACHE.patternV19Summary.set(`READY|${PATTERN_V19_ENGINE_SIGNATURE}|${id}|${p19PersistentFingerprint(id)}`,summary);
  return out;
}


// V7.19.38 — X3 Precision Rescue R2.
// Strict prior-only candidate expansion over P19: keep the full P19 candidate set and add
// the two highest-ranked Hybrid-Expert geometry candidates that are not already in P19.
// The rescue ranking itself is built only from evidence before targetDate. No current-row
// result is used to choose either rescue candidate.
const X3_ENGINE_SIGNATURE = "X3-NESTED-PRO-7-463-STRICT-PRIOR-ONLY-20260823";
const X3_MAX_RESCUE_ADDS = 2; // internal protected precision stage absorbed into the X3 engine
const X3_PRO_MAX_RESCUE_ADDS = 7;
function buildX3FromP19Pack(p19,expert,context={}){
  const baseItems=Array.isArray(p19?.items)?p19.items:[];
  const baseSet=new Set(baseItems.map(x=>canonical3(String(x?.number??''))));
  const precision=(expert?.scored||[])
    .filter(x=>!baseSet.has(canonical3(String(x?.number??''))))
    .slice(0,X3_MAX_RESCUE_ADDS)
    .map((x,i)=>({number:canonical3(String(x.number)),patternX3Source:'Precision Rescue',patternX3Score:Number(x.score||0),patternX3Rank:i+1}));
  const protectedItems=[...baseItems.map(x=>({...x})),...precision];
  const protectedSet=new Set(protectedItems.map(x=>canonical3(String(x?.number??''))));
  let pro=[];
  try{
    const engine=globalThis.X3NestedPro463;
    if(engine?.select){
      const selected=engine.select({profileId:Number(context?.profileId??state.activeProfile),targetDate:String(context?.targetDate||''),inputDigits:Array.isArray(context?.inputDigits)?context.inputDigits.map(String):[],baseItems:protectedItems,expert,historical:Boolean(context?.historical)});
      const seen=new Set(protectedSet);
      pro=(Array.isArray(selected?.items)?selected.items:[]).filter(x=>{
        const n=canonical3(String(x?.number??'')); if(!/^\d{3}$/.test(n)||seen.has(n)) return false; seen.add(n); return true;
      }).slice(0,X3_PRO_MAX_RESCUE_ADDS).map((x,i)=>({...x,number:canonical3(String(x.number)),patternX3Source:'Nested Pro Rescue',patternX3Rank:i+1}));
    }
  }catch(err){ console.warn('X3 Nested Pro fallback to protected precision stage',err); }
  const items=[...protectedItems,...pro];
  return {...p19,version:'X3-NESTED-PRO-7',engineSignature:X3_ENGINE_SIGNATURE,items,precisionRescueAdds:precision.length,proRescueAdds:pro.length,rescueAdds:precision.length+pro.length,selectorStatus:pro.length?`X3-NESTED-PRO+${pro.length}`:'X3-NESTED-PRO-PENDING'};
}
function buildX3Candidates(grid,profileId=state.activeProfile,targetDate='',inputDigits=null,historical=false){
  const id=Number(profileId), p19=buildPatternV19Candidates(grid,id,targetDate), expert=patternV19ExpertSet(grid,id,targetDate);
  const inputs=Array.isArray(inputDigits)?inputDigits.map(String):((!historical&&Number(id)===Number(state.activeProfile)&&Array.isArray(state.lastInput))?state.lastInput.map(String):[]);
  return buildX3FromP19Pack(p19,expert,{profileId:id,targetDate:String(targetDate||''),inputDigits:inputs,historical});
}

// V7.20.02 — One-pass P19 + X3 historical finalize.
async function computeP19X3HistoryBundlesAsync(draws,profileId=state.activeProfile,options={}){
  const id=Number(profileId), list=(Array.isArray(draws)?draws:[]).filter(d=>Number(d?.profileId??0)===id).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||Number(a.createdAt||0)-Number(b.createdAt||0));
  const fast=Boolean(options?.fast), chunkSize=fast?192:10;
  let total=0,classicWin=0,v18Win=0,v19Win=0,changed=0,gained=0,lost=0,x3Hit=0,rescueHits=0;
  const expertHist=[],v18Hist=[],p19StatusMap=new Map(),x3StatusMap=new Map(),x3SelectedMap=new Map();
  const match=(items,actual,canon)=>({exact:(items||[]).some(x=>String(x?.number??'')===actual),any:(items||[]).some(x=>canonical3(String(x?.number??''))===canon)});
  for(let i=0;i<list.length;i++){
    const draw=list[i], rowKey=String(draw?.id??`${draw?.date||''}|${draw?.number||''}`), actual=String(draw?.number||'');
    if(!/^\d{3}$/.test(actual)){ p19StatusMap.set(rowKey,'pending'); x3StatusMap.set(rowKey,'pending'); }
    else{
      const table=getPredictionTable(id,draw.date,draw),inputs=table?.inputDigits;
      if(!Array.isArray(inputs)||inputs.length!==5||inputs.some(v=>!/^\d$/.test(String(v)))){ p19StatusMap.set(rowKey,'pending'); x3StatusMap.set(rowKey,'pending'); }
      else{
        const grid=formulaGrid(inputs.map(String),getOriginalFormula());
        if(!grid){ p19StatusMap.set(rowKey,'pending'); x3StatusMap.set(rowKey,'pending'); }
        else{
          const targetDate=String(draw.date||''), canon=canonical3(actual), classic=findLResults(grid), pack=patternV19ExpertSet(grid,id,targetDate), v18=pack.v18;
          const sel=patternV19SelectorProbability(pack,expertHist,v18Hist,id,targetDate);
          const useExpert=pack.ev.priorCount>=PATTERN_V19_MIN_PRIOR&&sel.probability>=PATTERN_V19_MODEL_THRESHOLD;
          const p19Items=useExpert?pack.items:(v18.items||[]);
          const p19Like={...v18,version:19,shadow:PATTERN_V19_SHADOW,items:p19Items.map(x=>({...x})),selectorStatus:useExpert?'P19-HYBRID-EXPERT':'P19-P18-GUARD',reason:'v19-hybrid-logistic-strict-prior-only',replacements:sel.added.length,priorCount:pack.ev.priorCount,selectorProbability:sel.probability,added:sel.added,removed:sel.dropped};
          const x3=buildX3FromP19Pack(p19Like,pack,{profileId:id,targetDate,inputDigits:inputs,historical:true});
          const cm=match(classic,actual,canon), am=match(v18.items,actual,canon), em=match(pack.items,actual,canon), bm=match(p19Items,actual,canon), xm=match(x3.items,actual,canon);
          const c=cm.any,a=am.any,e=em.any,b=bm.any;
          p19StatusMap.set(rowKey,bm.exact?'exact':(bm.any?'reversed':'notfound'));
          const rescueItem=(x3.items||[]).find(x=>(x?.patternX3Source==='Precision Rescue'||x?.patternX3Source==='Nested Pro Rescue')&&canonical3(String(x?.number??''))===canon);
          const rescued=Boolean(rescueItem);
          x3StatusMap.set(rowKey,xm.exact?'exact':(xm.any?'reversed':'notfound')); x3SelectedMap.set(rowKey,rescued?(rescueItem?.patternX3Source==='Nested Pro Rescue'?'nested-pro-rescue':'precision-rescue'):'p19');
          total++; classicWin+=c?1:0; v18Win+=a?1:0; v19Win+=b?1:0; x3Hit+=xm.any?1:0; if(rescued)rescueHits++;
          if(useExpert){ changed++; if(b&&!a)gained++; if(a&&!b)lost++; }
          expertHist.push(e?1:0); v18Hist.push(a?1:0); if(expertHist.length>60)expertHist.shift(); if(v18Hist.length>60)v18Hist.shift();
        }
      }
    }
    if((i+1)%chunkSize===0 || i===list.length-1){ if(!fast && userInteractionHot(850)) await waitForForegroundIdle(850); await nextUiFrame(fast?0:2); }
  }
  const rate=n=>total?Math.round(n*10000/total)/100:0,rel=(n,d)=>d?Math.round(((n/d)-1)*10000)/100:0;
  const targetClassicWins=classicWin+1,targetV18Wins=Math.ceil(v18Win*(1+PATTERN_V19_TARGET_V18_RELATIVE));
  const p19Summary={hit:v19Win,total,rate:total?Math.round(v19Win*1000/total)/10:0,classicWin,v18Win,v19Win,classicRate:rate(classicWin),v18Rate:rate(v18Win),v19Rate:rate(v19Win),relativeClassic:rel(v19Win,classicWin),relativeV18:rel(v19Win,v18Win),targetClassicWins,targetV18Wins,passClassic:v19Win>classicWin,passV18:v19Win>=targetV18Wins,champion:v19Win>classicWin&&v19Win>=targetV18Wins,changed,gained,lost};
  const p19Bundle={summary:p19Summary,statusMap:p19StatusMap,engineSignature:PATTERN_V19_ENGINE_SIGNATURE,rebuildComplete:true};
  const x3Bundle={summary:{hit:x3Hit,total,rate:total?Math.round(x3Hit*1000/total)/10:0,rescueHits,engineSignature:X3_ENGINE_SIGNATURE},statusMap:x3StatusMap,selectedMap:x3SelectedMap,pending:false};
  PERF_CACHE.patternV19Bundle.set(p19BundleCacheKey(id),p19Bundle);
  PERF_CACHE.patternV19Summary.set(`READY|${PATTERN_V19_ENGINE_SIGNATURE}|${id}|${p19PersistentFingerprint(id)}`,p19Summary);
  PERF_CACHE.x3Bundle.set(x3BundleCacheKey(id),x3Bundle);
  return {p19Bundle,x3Bundle};
}

// V7.20.18 — Unified AI pipeline: one synchronous, deterministic history pass for P19 + X3.
// This is the same strict-prior algorithm used by Full Rebuild, but it publishes the result
// immediately to the shared History/Analysis/Ranking cache. Background workers are now only
// optional pre-warm/persistence helpers and are never a readiness gate.
function computeP19X3HistoryBundlesSync(draws,profileId=state.activeProfile){
  const id=Number(profileId), pKey=p19BundleCacheKey(id), xKey=x3BundleCacheKey(id);
  const cachedP=PERF_CACHE.patternV19Bundle.get(pKey), cachedX=PERF_CACHE.x3Bundle.get(xKey);
  if(cachedP?.statusMap instanceof Map && cachedX?.statusMap instanceof Map) return {p19Bundle:cachedP,x3Bundle:cachedX};
  const list=(Array.isArray(draws)?draws:[]).filter(d=>Number(d?.profileId??0)===id).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||Number(a.createdAt||0)-Number(b.createdAt||0));
  let total=0,classicWin=0,v18Win=0,v19Win=0,changed=0,gained=0,lost=0,x3Hit=0,rescueHits=0;
  const expertHist=[],v18Hist=[],p19StatusMap=new Map(),x3StatusMap=new Map(),x3SelectedMap=new Map();
  const match=(items,actual,canon)=>({exact:(items||[]).some(x=>String(x?.number??'')===actual),any:(items||[]).some(x=>canonical3(String(x?.number??''))===canon)});
  for(const draw of list){
    const rowKey=String(draw?.id??`${draw?.date||''}|${draw?.number||''}`), actual=String(draw?.number||'');
    if(!/^\d{3}$/.test(actual)){ p19StatusMap.set(rowKey,'pending'); x3StatusMap.set(rowKey,'pending'); continue; }
    const table=getPredictionTable(id,draw.date,draw),inputs=table?.inputDigits;
    if(!Array.isArray(inputs)||inputs.length!==5||inputs.some(v=>!/^\d$/.test(String(v)))){ p19StatusMap.set(rowKey,'pending'); x3StatusMap.set(rowKey,'pending'); continue; }
    const grid=formulaGrid(inputs.map(String),getOriginalFormula());
    if(!grid){ p19StatusMap.set(rowKey,'pending'); x3StatusMap.set(rowKey,'pending'); continue; }
    const targetDate=String(draw.date||''), canon=canonical3(actual), classic=findLResults(grid), pack=patternV19ExpertSet(grid,id,targetDate), v18=pack.v18;
    const sel=patternV19SelectorProbability(pack,expertHist,v18Hist,id,targetDate);
    const useExpert=pack.ev.priorCount>=PATTERN_V19_MIN_PRIOR&&sel.probability>=PATTERN_V19_MODEL_THRESHOLD;
    const p19Items=useExpert?pack.items:(v18.items||[]);
    const p19Like={...v18,version:19,shadow:PATTERN_V19_SHADOW,items:p19Items.map(x=>({...x})),selectorStatus:useExpert?'P19-HYBRID-EXPERT':'P19-P18-GUARD',reason:'v19-hybrid-logistic-strict-prior-only',replacements:sel.added.length,priorCount:pack.ev.priorCount,selectorProbability:sel.probability,added:sel.added,removed:sel.dropped};
    const x3=buildX3FromP19Pack(p19Like,pack,{profileId:id,targetDate,inputDigits:inputs,historical:true});
    const cm=match(classic,actual,canon), am=match(v18.items,actual,canon), em=match(pack.items,actual,canon), bm=match(p19Items,actual,canon), xm=match(x3.items,actual,canon);
    const c=cm.any,a=am.any,e=em.any,b=bm.any;
    p19StatusMap.set(rowKey,bm.exact?'exact':(bm.any?'reversed':'notfound'));
    const rescueItem=(x3.items||[]).find(x=>(x?.patternX3Source==='Precision Rescue'||x?.patternX3Source==='Nested Pro Rescue')&&canonical3(String(x?.number??''))===canon);
          const rescued=Boolean(rescueItem);
    x3StatusMap.set(rowKey,xm.exact?'exact':(xm.any?'reversed':'notfound')); x3SelectedMap.set(rowKey,rescued?(rescueItem?.patternX3Source==='Nested Pro Rescue'?'nested-pro-rescue':'precision-rescue'):'p19');
    total++; classicWin+=c?1:0; v18Win+=a?1:0; v19Win+=b?1:0; x3Hit+=xm.any?1:0; if(rescued) rescueHits++;
    if(useExpert){ changed++; if(b&&!a)gained++; if(a&&!b)lost++; }
    expertHist.push(e?1:0); v18Hist.push(a?1:0); if(expertHist.length>60)expertHist.shift(); if(v18Hist.length>60)v18Hist.shift();
  }
  const rate=n=>total?Math.round(n*10000/total)/100:0,rel=(n,d)=>d?Math.round(((n/d)-1)*10000)/100:0;
  const targetClassicWins=classicWin+1,targetV18Wins=Math.ceil(v18Win*(1+PATTERN_V19_TARGET_V18_RELATIVE));
  const p19Summary={hit:v19Win,total,rate:total?Math.round(v19Win*1000/total)/10:0,classicWin,v18Win,v19Win,classicRate:rate(classicWin),v18Rate:rate(v18Win),v19Rate:rate(v19Win),relativeClassic:rel(v19Win,classicWin),relativeV18:rel(v19Win,v18Win),targetClassicWins,targetV18Wins,passClassic:v19Win>classicWin,passV18:v19Win>=targetV18Wins,champion:v19Win>classicWin&&v19Win>=targetV18Wins,changed,gained,lost,engineSignature:PATTERN_V19_ENGINE_SIGNATURE};
  const p19Bundle={summary:p19Summary,statusMap:p19StatusMap,engineSignature:PATTERN_V19_ENGINE_SIGNATURE,rebuildComplete:true,unifiedImmediate:true};
  const x3Bundle={summary:{hit:x3Hit,total,rate:total?Math.round(x3Hit*1000/total)/10:0,rescueHits,engineSignature:X3_ENGINE_SIGNATURE},statusMap:x3StatusMap,selectedMap:x3SelectedMap,pending:false,unifiedImmediate:true};
  PERF_CACHE.patternV19Bundle.set(pKey,p19Bundle); PERF_CACHE.patternV19Summary.set(`READY|${PATTERN_V19_ENGINE_SIGNATURE}|${id}|${p19PersistentFingerprint(id)}`,p19Summary); PERF_CACHE.x3Bundle.set(xKey,x3Bundle);
  V19_BACKGROUND.ready.add(v19BackgroundKey(id)); X3_BACKGROUND.ready.add(xKey);
  return {p19Bundle,x3Bundle};
}
function unifiedP19X3HistoryBundles(draws,profileId=state.activeProfile,options={}){
  const id=Number(profileId), p=PERF_CACHE.patternV19Bundle.get(p19BundleCacheKey(id)), x=PERF_CACHE.x3Bundle.get(x3BundleCacheKey(id));
  if(p?.statusMap instanceof Map && x?.statusMap instanceof Map) return {p19Bundle:p,x3Bundle:x};

  // V7.20.19 Instant AI First Paint:
  // render paths must NEVER fall through to a 200+ row synchronous P19/X3 rebuild.
  // Persisted bundles are hydrated asynchronously; missing data renders as pending for one
  // paint and is refreshed after foreground-idle. Explicit rebuild code may opt in to sync.
  if(options?.allowSync===true) return computeP19X3HistoryBundlesSync(draws,id);

  if(!x?.statusMap) void hydrateX3PersistentCache(id).then(restored=>{
    if(restored && Number(state.activeProfile)===id && ['weekly','history','analysis'].includes(state.currentView) && !userInteractionHot(650)){
      requestAnimationFrame(()=>refreshAfterBackgroundModelWork());
    }
  });
  if(!p?.statusMap) schedulePatternV19Background(id,1800);

  return {
    p19Bundle:p?.statusMap instanceof Map?p:{summary:{hit:0,total:0,rate:0,pending:true},statusMap:new Map(),pending:true},
    x3Bundle:x?.statusMap instanceof Map?x:x3PendingBundle()
  };
}

// V7.19.39 — X3 Smooth Idle Cache.
// Never run a full X3 historical backtest inside render(). The first request returns a
// lightweight pending bundle and queues one chunked computation for true foreground idle.
// Completed bundles are cached by source fingerprint and reused by every view/render.
const X3_BACKGROUND={running:new Set(),ready:new Set(),hydrating:new Set(),checked:new Set()};
const X3_PERSIST_PREFIX="x3-bundle-v720-";
function x3BundleCacheKey(profileId=state.activeProfile){
  const id=Number(profileId);
  return `X3BUNDLE|${X3_ENGINE_SIGNATURE}|${id}|${p19PersistentFingerprint(id)}`;
}
function x3PersistentKey(profileId=state.activeProfile){
  return `${X3_PERSIST_PREFIX}${Number(profileId)}`;
}
const X3_SYNC_MIRROR_PREFIX="luckyNumber_x3_sync_v72020_";
function x3SyncMirrorKey(profileId=state.activeProfile){ return `${X3_SYNC_MIRROR_PREFIX}${Number(profileId)}`; }
function restoreX3SyncMirror(profileId=state.activeProfile){
  const id=Number(profileId), key=x3BundleCacheKey(id);
  if(PERF_CACHE.x3Bundle.has(key)) return true;
  try{
    const saved=JSON.parse(localStorage.getItem(x3SyncMirrorKey(id))||"null");
    if(!saved || saved.cacheKey!==key || saved.engineSignature!==X3_ENGINE_SIGNATURE || !saved.summary || !Array.isArray(saved.statusRows)) return false;
    const bundle={summary:{...saved.summary,pending:false},statusMap:new Map(saved.statusRows),selectedMap:new Map(Array.isArray(saved.selectedRows)?saved.selectedRows:[]),pending:false,restoredFromSyncMirror:true};
    PERF_CACHE.x3Bundle.set(key,bundle); X3_BACKGROUND.ready.add(key); return true;
  }catch(_){ return false; }
}
function x3PendingBundle(){
  return {summary:{hit:0,total:0,rate:0,rescueHits:0,engineSignature:X3_ENGINE_SIGNATURE,pending:true},statusMap:new Map(),selectedMap:new Map(),pending:true};
}
function serializeX3Bundle(bundle){
  if(!bundle?.summary || !(bundle.statusMap instanceof Map)) return null;
  return {
    cacheKey:x3BundleCacheKey(), engineSignature:X3_ENGINE_SIGNATURE,
    summary:{...bundle.summary,pending:false},
    statusRows:[...bundle.statusMap.entries()], selectedRows:[...(bundle.selectedMap instanceof Map?bundle.selectedMap:new Map()).entries()],
    updatedAt:Date.now()
  };
}
async function persistX3Bundle(profileId,bundle){
  const id=Number(profileId), data=serializeX3Bundle(bundle); if(!data) return false;
  data.cacheKey=x3BundleCacheKey(id);
  // V7.20.21 Unified Registry: keep a small synchronous mirror so a cold iPhone launch can
  // restore the active X3 card before first paint without waiting on IndexedDB.
  try{ localStorage.setItem(x3SyncMirrorKey(id),JSON.stringify(data)); }catch(_){}
  return await writeIndexedValue(x3PersistentKey(id),data);
}
async function hydrateX3PersistentCache(profileId=state.activeProfile){
  const id=Number(profileId), key=x3BundleCacheKey(id);
  if(PERF_CACHE.x3Bundle.has(key)) return true;
  if(restoreX3SyncMirror(id)) return true;
  if(X3_BACKGROUND.hydrating.has(key)) return false;
  X3_BACKGROUND.hydrating.add(key);
  try{
    const saved=await readIndexedValue(x3PersistentKey(id)); X3_BACKGROUND.checked.add(key);
    if(!saved || saved.cacheKey!==key || saved.engineSignature!==X3_ENGINE_SIGNATURE || !saved.summary || !Array.isArray(saved.statusRows)) return false;
    const bundle={summary:{...saved.summary,pending:false},statusMap:new Map(saved.statusRows),selectedMap:new Map(Array.isArray(saved.selectedRows)?saved.selectedRows:[]),pending:false,restoredFromPersistent:true};
    PERF_CACHE.x3Bundle.set(key,bundle); X3_BACKGROUND.ready.add(key);
    // Heal the synchronous mirror after any successful IndexedDB restore so every
    // later cold launch can show X3 before first paint.
    try{ localStorage.setItem(x3SyncMirrorKey(id),JSON.stringify(saved)); }catch(_){}
    return true;
  }catch(_){ X3_BACKGROUND.checked.add(key); return false; }
  finally{ X3_BACKGROUND.hydrating.delete(key); }
}
async function computeX3HistoryBundleAsync(draws, profileId=state.activeProfile, options={}){
  const id=Number(profileId), list=(Array.isArray(draws)?draws:[]).filter(d=>Number(d?.profileId??0)===id).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||Number(a.createdAt||0)-Number(b.createdAt||0));
  const fast=Boolean(options?.fast), chunkSize=fast?64:8;
  const statusMap=new Map(), selectedMap=new Map(); let hit=0,total=0,rescueHits=0;
  for(let i=0;i<list.length;i++){
    const draw=list[i], rowKey=String(draw?.id??`${draw?.date||''}|${draw?.number||''}`);
    if(!/^\d{3}$/.test(String(draw?.number||''))) statusMap.set(rowKey,'pending');
    else{
      const table=getPredictionTable(id,draw.date,draw),inputs=table?.inputDigits;
      if(!Array.isArray(inputs)||inputs.length!==5||inputs.some(v=>!/^\d$/.test(String(v)))) statusMap.set(rowKey,'pending');
      else{
        const grid=formulaGrid(inputs.map(String),getOriginalFormula());
        if(!grid) statusMap.set(rowKey,'pending');
        else{
          const actual=String(draw.number), canon=canonical3(actual), x3=buildX3Candidates(grid,id,String(draw.date||''),inputs,true);
          const exact=(x3.items||[]).some(x=>String(x?.number??'')===actual), any=(x3.items||[]).some(x=>canonical3(String(x?.number??''))===canon);
          const rescueItem=(x3.items||[]).find(x=>(x?.patternX3Source==='Precision Rescue'||x?.patternX3Source==='Nested Pro Rescue')&&canonical3(String(x?.number??''))===canon);
          const rescued=Boolean(rescueItem);
          statusMap.set(rowKey,exact?'exact':(any?'reversed':'notfound')); selectedMap.set(rowKey,rescued?'precision-rescue':'p19'); total++; if(any)hit++; if(rescued)rescueHits++;
        }
      }
    }
    if((i+1)%chunkSize===0){ if(!fast && userInteractionHot(700)) await waitForForegroundIdle(850); await new Promise(r=>setTimeout(r,0)); }
  }
  return {summary:{hit,total,rate:total?Math.round(hit*1000/total)/10:0,rescueHits,engineSignature:X3_ENGINE_SIGNATURE},statusMap,selectedMap,pending:false};
}
function scheduleX3Background(profileId=state.activeProfile, delay=500){
  const id=Number(profileId), key=x3BundleCacheKey(id);
  // V7.20.86a DEMAND AI — missing X3 backtests are computed only while AI is visible.
  if(state.currentView!=="weekly" || Number(state.activeProfile)!==id || document.visibilityState==="hidden") return false;
  if(PERF_CACHE.x3Bundle.has(key)||X3_BACKGROUND.running.has(key)) return false;
  X3_BACKGROUND.running.add(key);
  const queued=COMPUTE_MANAGER.enqueue(`X3|${key}`,async()=>{
    try{
      if(state.currentView!=="weekly" || Number(state.activeProfile)!==id || document.visibilityState==="hidden") return;
      if(await hydrateX3PersistentCache(id)) return;
      if(backgroundWfWorkerRunning) return;
      // The locked 463 selector is lazy-loaded after first paint. Never publish a fallback
      // historical bundle before that selector is available; retry later instead.
      if(!globalThis.X3NestedPro463){ setTimeout(()=>scheduleX3Background(id,360),900); return; }
      const draws=(state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===id);
      const bundle=await computeX3HistoryBundleAsync(draws,id);
      PERF_CACHE.x3Bundle.set(key,bundle); X3_BACKGROUND.ready.add(key); await persistX3Bundle(id,bundle);
    } finally {
      X3_BACKGROUND.running.delete(key);
      try{ PERF_CACHE.autoDecision.clear(); PERF_CACHE.calculatorTables.clear(); PERF_CACHE.calculatorEngine?.clear(); }catch(_){}
      // V7.20.32: keep X3/0-19 repair off active Calculate/navigation gestures and invalidate only the lightweight Calculate snapshot.
      if(state.currentView==='weekly') scheduleAIStandardSummaryCacheBuild(id,null,3400);
      if(Number(state.activeProfile)===id && document.visibilityState!=='hidden' && !userInteractionHot(700)) requestAnimationFrame(()=>refreshAfterBackgroundModelWork());
    }
  },{delay:Math.max(0,Number(delay)||0),idleMs:950});
  if(!queued) X3_BACKGROUND.running.delete(key); return queued;
}
function x3HistoryBundle(draws, profileId=state.activeProfile){
  return unifiedP19X3HistoryBundles(draws,profileId).x3Bundle;
}
function x3HistorySummary(profileId=state.activeProfile){
  const id=Number(profileId),draws=(state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===id);
  return unifiedP19X3HistoryBundles(draws,id).x3Bundle.summary;
}
function patternV19HistorySummary(profileId=state.activeProfile){
  const id=Number(profileId),draws=(state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===id);
  return unifiedP19X3HistoryBundles(draws,id).p19Bundle.summary;
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
    <main class="main" data-rendered-view="${state.currentView}">${viewHtml}</main>
    <nav class="bottom-nav" aria-label="เมนูหลัก">
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
  if (state.currentView === "weekly") scheduleMissingAIFormulaRecovery(state.activeProfile);
  if (state.currentView === "weekly") schedulePatternV19Background(state.activeProfile,2200);
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
  bindAITrendControls(document);
  document.querySelector("[data-profile-order-toggle]")?.addEventListener("click", () => {
    state.profileOrderMode = state.profileOrderMode === "ai" ? "default" : "ai";
    saveUiStateFast();
    refreshCurrentView();
  });
  document.querySelectorAll("[data-profile]").forEach(btn => btn.addEventListener("click", () => {
    const id = Number(btn.dataset.profile);
    independentCalculatePreviewProfile = null;
    mlCalculatePreviewProfile = null;
    state.activeProfile = id;
    if (state.currentView === "home") {
      const latestSync = loadLatestProfileResultIntoCalculator(id);
      paintLatestProfileDigitsImmediately(id, latestSync);
      saveUiStateFast();
      scheduleCalculatorProfileRefresh(id);
      if (!latestSync.loaded) showToast(`ยังไม่มีเลขออกจริงล่าสุดของ ${state.profiles[id] || "Profile"}`);
      return;
    }
    saveUiStateFast();
    refreshCurrentView();
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

// V7.20.66 — Weekly background refresh guard.
// The AI page keeps Profile AI Ranking chips mounted while background model/cache work finishes.
// Only the AI SELECT card is patched in place; this avoids the visible iPhone flicker caused by
// replacing the entire <main> after X3/P19 hydration.
function refreshWeeklyBackgroundPanels(){
  if(state.currentView!=="weekly") return false;
  if(document.querySelector("main.main .ai-final-pro")) return refreshAIUnifiedFinalPro();
  const current=document.querySelector("main.main .ai-select-top3-card");
  if(!current) return false;
  const tpl=document.createElement("template");
  tpl.innerHTML=renderAISelectTop3().trim();
  const next=tpl.content.firstElementChild;
  if(!next) return false;
  current.replaceWith(next);
  next.querySelectorAll("[data-ai-select-history]").forEach(button=>button.addEventListener("click",event=>{
    event.preventDefault(); event.stopPropagation();
    const id=Number(button.dataset.aiSelectHistory);
    if(!Number.isInteger(id)||id<0||id>=(state.profiles||[]).length) return;
    state.activeProfile=id;
    historyVisibleLimitByProfile[id]=HISTORY_FIRST_BATCH;
    saveUiStateFast();
    navigateToView("history");
  }));
  return true;
}
function refreshAfterBackgroundModelWork(){
  if(state.currentView==="weekly") return refreshWeeklyBackgroundPanels();
  refreshCurrentView();
  return true;
}

function refreshCurrentView() {
  const main = document.querySelector("main.main");
  if (!main) { render(); return; }
  invalidateViewCache();
  const html = getViewHtml(state.currentView);
  main.innerHTML = html;
  main.dataset.renderedView = state.currentView;
  bindFastViewContent();
  bindView();
  if (state.currentView === "home") paintLatestProfileDigitsImmediately(state.activeProfile);
  centerActiveProfileTab();
  if (state.currentView === "weekly") scheduleMissingAIFormulaRecovery(state.activeProfile);
}

let navigationRenderToken = 0;
function resetNavigationScroll() {
  // V7.19.14 — each bottom-tab is a fresh page. Never inherit scroll position
  // from the previous long page (the cause of Analysis opening around rank 12+).
  try {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  } catch (_) {}
}
function applyFastViewHtml(main, html) {
  // V7.19.14 — iOS atomic page swap without inheriting the previous page height.
  // The old implementation pinned min-height to the entire outgoing page; if that
  // page was very tall and JS stayed busy, Safari displayed a huge empty dark area
  // until requestAnimationFrame could finally clear it. Keep only one viewport.
  const viewportHeight = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0, 1);
  main.style.minHeight = `${Math.ceil(Math.max(0, viewportHeight - 92))}px`;
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const fragment = tpl.content.cloneNode(true);
  main.replaceChildren(fragment);
  main.dataset.renderedView = state.currentView;
  main.classList.remove("view-loading-fast","view-switching","view-enter-fast");
  resetNavigationScroll();
  bindFastViewContent();
  bindView();
  if (state.currentView === "home") paintLatestProfileDigitsImmediately(state.activeProfile);
  centerActiveProfileTab();
  if (state.currentView === "weekly") scheduleMissingAIFormulaRecovery(state.activeProfile);
  // Clear the temporary inline guard synchronously. CSS already keeps .main at
  // viewport height, so no rAF is needed and a busy main thread cannot prolong it.
  main.style.minHeight = "";
}
function fastViewPlaceholder(view){
  const labels={home:'Calculate',weekly:'AI',history:'History',analysis:'Analysis',settings:'Settings'};
  return `<section class="card ux-page-card fast-view-placeholder" aria-busy="true"><div class="ux-page-head"><div><small>${labels[view]||'LuckyNumber'}</small><h3>กำลังแสดงข้อมูลล่าสุด…</h3><p>ใช้ข้อมูล cache ก่อน และซิงก์ส่วนที่เปลี่ยนหลังบ้าน</p></div></div></section>`;
}
function navigateToView(nextView) {
  if (!nextView || nextView === state.currentView) return;
  noteUserInteraction();
  closeModal();
  closeTransientPopupRoots();
  closeNumericKeypad();
  // V7.09.17 — every fresh entry to Analysis starts from AI Recommend.
  if (nextView === "analysis") {
    state.analysisSortMode = "ai";
    state.profileOrderMode = "ai";
  }
  // V7.09.65 — History always starts in Compare on every fresh entry.
  // The user can still switch to Classic L / AI L / Advanced while staying on the page.
  if (nextView === "history") state.historyFormulaMode = "compare";
  if (nextView === "home") {
    // V7.20.34: load the authoritative 5 digits first; renderHome resolves only the visible engine.
    loadLatestProfileResultIntoCalculator(state.activeProfile);
  }
  state.currentView = nextView;
  if (nextView === "home") saveUiStateFast();
  resetNavigationScroll();
  const main = document.querySelector("main.main");
  if (!main) { render(); return; }

  document.querySelectorAll(".bottom-nav [data-view]").forEach(btn => {
    const active=btn.dataset.view === state.currentView;
    btn.classList.toggle("active", active);
    if(active) btn.setAttribute("aria-current","page"); else btn.removeAttribute("aria-current");
  });

  const token = ++navigationRenderToken;
  const targetView = state.currentView;
  const liveSuffix = targetView === "weekly" ? `:h${Number(state._persistenceUpdatedAt||0)}:n${(state.actualDraws||[]).length}` : "";
  const cacheKey = `${viewCacheGeneration}:${targetView}${liveSuffix}`;
  const cachedHtml = VIEW_HTML_CACHE.get(cacheKey);

  // V7.09.39 — cached tabs swap immediately with no opacity/transform animation.
  // This removes the iOS white blink and avoids an unnecessary extra paint.
  if (cachedHtml != null) {
    applyFastViewHtml(main, cachedHtml);
    return;
  }

  // V7.19.11 — Real-content instant navigation. Never replace a 2–3 second
  // calculation with a skeleton. If this page has rendered before, show that last
  // complete HTML immediately, then refresh only after the interaction quiets down.
  const rememberedHtml = targetView === "weekly" ? null : getRememberedViewHtml(targetView);
  if (rememberedHtml != null) {
    applyFastViewHtml(main, rememberedHtml);
    const refreshWhenQuiet = async () => {
      await waitForForegroundIdle(650);
      if (token !== navigationRenderToken || targetView !== state.currentView) return;
      setTimeout(() => {
        if (token !== navigationRenderToken || targetView !== state.currentView || userInteractionHot(650)) return;
        const html = getViewHtml(targetView);
        if (token !== navigationRenderToken || targetView !== state.currentView) return;
        if (html !== rememberedHtml) applyFastViewHtml(main, html);
      }, 80);
    };
    refreshWhenQuiet();
    return;
  }

  // V7.20.23 Pro Standard — retained-view navigation. On a first-ever visit, keep
  // the outgoing real page visible while the target is prepared after the tap paints.
  // Never replace the whole viewport with a white/blank "AI processing" shell.
  // The bottom nav updates immediately; the body swaps atomically only when real target
  // HTML is ready. This matches modern no-blank app navigation behavior.
  main.classList.add("view-preparing-target");
  main.dataset.pendingView = targetView;
  main.setAttribute("aria-busy","true");
  const buildFirstViewAfterPaint=()=>{
    requestAnimationFrame(()=>{
      if(token!==navigationRenderToken||targetView!==state.currentView) return;
      const run=()=>{
        if(token!==navigationRenderToken||targetView!==state.currentView) return;
        const html=getViewHtml(targetView);
        if(token!==navigationRenderToken||targetView!==state.currentView) return;
        main.classList.remove("view-preparing-target");
        main.removeAttribute("data-pending-view");
        main.removeAttribute("aria-busy");
        applyFastViewHtml(main,html);
      };
      if("requestIdleCallback" in window){
        requestIdleCallback(run,{timeout:90});
      }else{
        setTimeout(run,16);
      }
    });
  };
  buildFirstViewAfterPaint();

}

function navButton(view, icon, label) {
  return `<button type="button" class="nav-item ${state.currentView === view ? "active" : ""}" data-view="${view}" aria-label="${escapeHtml(label)}" ${state.currentView===view?'aria-current="page"':''}><span aria-hidden="true">${icon}</span><small>${label}</small></button>`;
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
    // V7.09.67 — Single Source of Truth:
    // Profile Order must be identical to Real-time Profile Ranking > AI Recommend.
    // Never re-sort here with a different comparator, otherwise the chips can show
    // Hang E #1 while the real-time ranking correctly shows China E #1.
    return getCanonicalProfileAIRanking().map(item => Number(item.profileId));
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

  // V7.20.33 — History is the authority for Calculator Auto-5.
  // Never silently fall back to an older complete row: the five boxes must represent
  // the true newest History row for the selected Profile, or be blank if that row is incomplete.
  if (!complete) {
    state.lastInput = ["","","","",""];
    state.grid = null;
    state.calculationDate = latest?.date || null;
    state.selectedL = null;
    return { loaded:false, latest, digits:["","","","",""] };
  }

  const digits = [...String(latest.number), ...String(latest.twoDigit)];
  state.lastInput = digits;
  state.calculationDate = latest.date || isoDate();
  // Do not run the active formula here on the Profile tap. renderHome already builds the
  // exact Classic/AI/P18/P19/X3 snapshot once; avoiding this duplicate work lets the 5 digits paint first.
  state.grid = null;
  state.selectedL = null;
  return { loaded:true, latest, digits };
}

function paintLatestProfileDigitsImmediately(profileId = state.activeProfile, syncResult = null) {
  if (state.currentView !== "home") return;
  const id = Number(profileId);
  const result = syncResult || {digits:Array.isArray(state.lastInput)?state.lastInput:["","","","",""]};
  const digits = Array.isArray(result?.digits) ? result.digits : (Array.isArray(state.lastInput) ? state.lastInput : ["","","","",""]);
  document.querySelectorAll(".calculator-card .digit-input").forEach((input,index) => {
    input.value = String(digits[index] ?? "");
    input.classList.toggle("active", index === 0);
  });
  const title = document.querySelector(".calculator-card .ux-page-head h2");
  if (title) title.textContent = state.profiles[id] || `Profile ${id+1}`;
  document.querySelectorAll(".profile-tabs [data-profile]").forEach(btn => btn.classList.toggle("active", Number(btn.dataset.profile) === id));
}

function scheduleCalculatorProfileRefresh(profileId = state.activeProfile) {
  const id = Number(profileId);
  const token = ++calculatorProfileRefreshToken;
  // V7.20.34: five History digits/title/profile chip paint first. AUTO/engine resolution
  // starts only on the following frame, so no History/WF scan can block the tap itself.
  requestAnimationFrame(() => setTimeout(() => {
    if (token !== calculatorProfileRefreshToken || state.currentView !== "home" || Number(state.activeProfile) !== id) return;
    const decision=getConfiguredFormulaMode(id)==="auto"?getAutoFormulaDecision(id):null;
    syncCalculatorTableViewToActiveFormula(id,true,decision);
    refreshCurrentView();
  }, 0));
}


function calculatorAutoUiStatus(profileId=state.activeProfile, decisionOverride=null){
  const id=Number(profileId), decision=decisionOverride||getAutoFormulaDecision(id)||{}, mode=String(decision.mode||"original");
  const rateFor = key => key==="x3" ? Number(decision.x3Rate||0)
    : key==="p19" ? Number(decision.p19Rate||0)
    : key==="pattern" ? Number(decision.p18Rate||0)
    : key==="gl" ? Number(decision.glRate||0)
    : key==="ai" ? Number(decision.aiRate||0)
    : Number(decision.classicRate||0);
  const shortFor = key => key==="x3" ? "X3" : key==="p19" ? "P19" : key==="pattern" ? "P18" : key==="gl" ? "GL" : key==="ai" ? "AIL" : "CLS";
  if(mode==="combo"){
    const sources=Array.isArray(decision.comboSources)?decision.comboSources:[];
    const left=sources[0]||"original", right=sources[1]||"ai";
    const lrate=rateFor(left), rrate=rateFor(right);
    return {
      mode,
      badge:`AUTO → ${shortFor(left)} + ${shortFor(right)}`,
      detail:`${shortFor(left)} ${lrate}% • ${shortFor(right)} ${rrate}% • gap ${Number(decision.comboGap||0).toFixed(1)}pp • COMBO`,
      button:`AUTO • ${shortFor(left)} + ${shortFor(right)}`
    };
  }
  const label=shortFor(mode), rate=rateFor(mode);
  return {
    mode,
    badge:`AUTO → ${label}`,
    detail:`${label} ${rate}% • ${decision.lowConfidence?"LOW CONFIDENCE":"Highest Trusted"} • ${mode==="pattern"?"P18":"Single"}`,
    button:`AUTO • ${label}`
  };
}

function renderHome() {
  // V7.20.77 Pro Calculate: this page is intentionally lean.
  // ML/AI diagnostic preview engines remain available to Analysis/engine code, but Calculate
  // no longer constructs or renders them. This prevents Profile search/taps from triggering
  // preview-table work and keeps the page focused on Input → Calculate → Result → AUTO Route.
  const profileId = Number(state.activeProfile);
  const configuredAuto = getConfiguredFormulaMode(profileId)==="auto";
  const deferAuto = Boolean(configuredAuto && calculatorFirstPaintDeferred);
  const autoDecision = (configuredAuto && !deferAuto) ? getAutoFormulaDecision(profileId) : null;
  if(deferAuto) calculatorTableViewMode="original";
  else syncCalculatorTableViewToActiveFormula(profileId, true, autoDecision);
  const calculatorSelected = getCalculatorSelectedTable(profileId);
  const grid = calculatorSelected?.grid || state.grid;
  const latestDraw = getLatestCompleteActualDraw();
  const profileName = state.profiles[profileId] || `Profile ${profileId+1}`;
  const calcDate = state.calculationDate || isoDate();
  const autoUi = configuredAuto ? (deferAuto ? {mode:"pending",badge:"AUTO",detail:"Fast Calculate",button:"AUTO"} : calculatorAutoUiStatus(profileId, autoDecision)) : null;
  const resolvedHomeMode = configuredAuto ? String(autoDecision?.mode||"original") : getConfiguredFormulaMode(profileId);
  const resultBadgeClass = ['pattern','p19'].includes(calculatorSelected?.key) ? "pattern" : configuredAuto && autoUi?.mode==="combo" ? "combo" : configuredAuto && autoUi?.mode==="pattern" ? "pattern" : (resolvedHomeMode==="blend"?"blend":calculatorSelected?.key==="gl"?"gl":calculatorSelected?.key==="ai"?"ai":"original");
  const patternNumbers = ['pattern','p19'].includes(calculatorSelected?.key) ? (calculatorSelected.results||[]).slice(0,5).map(x=>String(x?.number||'')).join(" • ") : "";
  const headerFormulaText = configuredAuto ? "AUTO" : getActiveFormulaLabel();
  return `
    <section class="card calculator-card ux-page-card calculator-pro-lean">
      <div class="ux-page-head">
        <div><small>CALCULATE</small><h2>${escapeHtml(profileName)}</h2><p>${formatDateTH(calcDate)} • ${escapeHtml(headerFormulaText)}</p></div>
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
      <div class="input-row ux-digit-row">${state.lastInput.map((v, i) => `<input class="digit-input ${i===0?'active':''}" data-index="${i}" maxlength="1" type="text" readonly value="${escapeHtml(v)}" aria-label="Digit ${i+1}">`).join("")}</div>
      <div class="action-row ux-primary-actions">
        <button id="btnCalc" class="btn primary">CALCULATE</button>
        <button id="btnClear" class="btn secondary">CLEAR</button>
      </div>
    </section>
    ${grid ? `<section class="card result-card-clean ux-result-card calculator-pro-result">
      <div class="ux-result-head"><div><small>TABLE RESULT</small></div></div>
      ${configuredAuto && autoUi ? `<div class="calculator-auto-route ${autoUi.mode==="combo"?"combo":autoUi.mode==="pattern"?"pattern":""}"><span>AUTO ROUTE</span><b>${escapeHtml(autoUi.badge)}</b><small>${escapeHtml(autoUi.detail)}</small></div>` : ''}
      ${['pattern','p19'].includes(calculatorSelected?.key) ? `<div class="independent-top5-line pattern-v18-calc-line"><span>${calculatorSelected.key==='p19'?'P19':'P18'} • Top 5</span><b>${escapeHtml(patternNumbers)}</b></div>` : ``}
      ${gridHtml(grid)}
      <button id="btnFindL" class="btn primary full ux-find-l-btn">${configuredAuto && autoUi ? escapeHtml(autoUi.button) : (calculatorSelected?.label || "RESULT")}</button>
    </section>` : `<section class="ux-empty-state"><b>พร้อมคำนวณ</b><span>กรอกเลขให้ครบ 5 หลัก แล้วกด “คำนวณตาราง”</span></section>`}
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
function syncCalculatorTableViewToActiveFormula(profileId = state.activeProfile, forceConfigured = false, decisionOverride = null) {
  const id = Number(profileId);
  const configured = getConfiguredFormulaMode(id);
  if (configured === "auto") {
    const decision = decisionOverride || getAutoFormulaDecision(id);
    const resolved = decision?.mode;
    // BLEND is result-only fusion; X3 is also result-only. Keep their visible base grid
    // exactly as before while the AUTO result button resolves the real route on demand.
    const baseMode = resolved === "combo" ? decision?.comboBaseMode : resolved;
    calculatorTableViewMode = resolved === "blend" ? "ai" : (resolved === "p19" || baseMode === "p19" ? "p19" : (resolved === "pattern" || baseMode === "pattern" ? "pattern" : (["original","ai","gl"].includes(baseMode) ? baseMode : "original")));
  } else if (forceConfigured && ["original","ai","gl"].includes(configured)) {
    calculatorTableViewMode = configured;
  }
  return calculatorTableViewMode;
}
// V7.20.04 — one deterministic tie policy shared by AUTO, History Champion and display ranking.
// A challenger must beat the proven primary engine; an exact tie stays with P19.
const TRUSTED_CHAMPION_PRIORITY = Object.freeze({p19:0,x3:1,p18:2,pattern:2,gl:3,ai:4,aiL:4,original:5,classic:5});
function trustedChampionPriority(key){ return TRUSTED_CHAMPION_PRIORITY[String(key||"")] ?? 99; }

// V7.20.78 — AUTO ROUTE PRO LOCK.
// Invariant: a route for targetDate can consume ONLY rows with date < targetDate.
// The first decision for each Profile/date is persisted and reused for the whole day,
// so adding today's result can never rerank today's AUTO route.
const AUTO_ROUTE_DAILY_LOCK_KEY="luckyNumber_auto_route_daily_lock_v72078_strict_prior";
const AUTO_ROUTE_LOW_CONFIDENCE_RATE=20;
function autoRouteTargetDate(){
  // Calculator input is the SOURCE draw used to predict the NEXT business draw.
  // Therefore the anti-leak cutoff is the prediction target date, not blindly the
  // phone's calendar date and not the source date itself. Example: source 25 Aug
  // predicting 26 Aug may use rows through 25 Aug, but never 26 Aug.
  const sourceDate=String(state.calculationDate||"").slice(0,10);
  if(/^\d{4}-\d{2}-\d{2}$/.test(sourceDate)){
    const next=String(getNextBusinessDate(sourceDate)||"").slice(0,10);
    if(/^\d{4}-\d{2}-\d{2}$/.test(next)) return next;
  }
  return isoDate();
}
function autoRouteLocalDateFromTimestamp(ts){
  const n=Number(ts||0); if(!n) return "";
  try{const d=new Date(n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}catch(_){return "";}
}
function readAutoRouteDailyLock(targetDate,profileId){
  try{
    const box=JSON.parse(localStorage.getItem(AUTO_ROUTE_DAILY_LOCK_KEY)||"null");
    const item=box?.dates?.[String(targetDate)]?.[String(Number(profileId))]||null;
    return item?.decision&&item.targetDate===String(targetDate)?item.decision:null;
  }catch(_){return null;}
}
function writeAutoRouteDailyLock(targetDate,profileId,decision){
  try{
    const today=String(targetDate), pid=String(Number(profileId));
    const box=JSON.parse(localStorage.getItem(AUTO_ROUTE_DAILY_LOCK_KEY)||"null")||{schema:1,dates:{}};
    box.schema=1; box.dates=box.dates||{}; box.dates[today]=box.dates[today]||{};
    box.dates[today][pid]={targetDate:today,profileId:Number(profileId),createdAt:Date.now(),decision};
    const dates=Object.keys(box.dates).sort(); while(dates.length>10){delete box.dates[dates.shift()];}
    localStorage.setItem(AUTO_ROUTE_DAILY_LOCK_KEY,JSON.stringify(box));
  }catch(_){}
  return decision;
}
function historyChampionForPriorDraws(draws,id){
  const originalSummary=trustedHistorySummary(draws,id,"classic");
  const aiSummary=trustedHistorySummary(draws,id,"aiL");
  const glSummary=trustedHistorySummary(draws,id,"gl");
  const p18Summary=patternV18TrustedHistorySummary(draws,id);
  const p19Summary=patternV19TrustedHistorySummary(draws,id);
  const x3Summary=x3TrustedHistorySummary(draws,id);
  const masterSummary=MASTER_AI_PAUSED?null:trustedHistorySummary(draws,id,"master");
  return buildHistoryChampionSummary(originalSummary,aiSummary,glSummary,null,p18Summary,p19Summary,x3Summary,masterSummary);
}
function getAutoFormulaDecision(profileId = state.activeProfile) {
  const id=Number(profileId), targetDate=autoRouteTargetDate();
  const locked=readAutoRouteDailyLock(targetDate,id);
  if(locked) return locked;

  const saved=state.aiFormulaLab?.[id]||null, glSaved=state.aiGLFormulaLab?.[id]||null;
  const gate=5,minSamples=14;
  const profileDraws=(state.actualDraws||[])
    .filter(d=>Number(d.profileId??0)===id && String(d.date||"")<targetDate)
    .sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")));

  const classic=trustedHistorySummary(profileDraws,id,"classic");
  const ai=trustedHistorySummary(profileDraws,id,"aiL");
  const gl=trustedHistorySummary(profileDraws,id,"gl");
  const p18=patternV18TrustedHistorySummary(profileDraws,id);
  const p19=patternV19TrustedHistorySummary(profileDraws,id);
  const x3=x3TrustedHistorySummary(profileDraws,id);

  // If a model object itself was created on/after the target day, it cannot be used to
  // reconstruct that day's morning route. This closes the "first open after result" edge case.
  const aiCreated=autoRouteLocalDateFromTimestamp(saved?.createdAt||saved?.autoLearnedAt);
  const glCreated=autoRouteLocalDateFromTimestamp(glSaved?.createdAt||glSaved?.autoLearnedAt);
  const aiModelPrior=!aiCreated||aiCreated<targetDate;
  const glModelPrior=!glCreated||glCreated<targetDate;
  const aiActivationReady=Boolean(saved?.formula&&aiModelPrior&&formulaEligibility(saved).allowed);
  const glComparable=Math.min(Number(ai.total||0),Number(gl.total||0));
  const glActivationReady=Boolean(glSaved?.formula&&glModelPrior&&glComparable>=8&&Number(gl.rate||0)>=Number(ai.rate||0));

  const samples=Number(classic.total||0);
  const margin=Math.round((Number(ai.rate||0)-Number(classic.rate||0))*10)/10;
  const glVsClassic=Math.round((Number(gl.rate||0)-Number(classic.rate||0))*10)/10;
  const glVsAI=Math.round((Number(gl.rate||0)-Number(ai.rate||0))*10)/10;
  const selector={
    targetDate,strictPriorOnly:true,samples,glSamples:Number(gl.total||0),
    classicRate:Number(classic.rate||0),aiRate:Number(ai.rate||0),glRate:Number(gl.rate||0),
    p18Rate:Number(p18.rate||0),p18Samples:Number(p18.total||0),p19Rate:Number(p19.rate||0),p19Samples:Number(p19.total||0),
    x3Rate:Number(x3.rate||0),x3Samples:Number(x3.total||0),margin,glVsClassic,glVsAI,aiActivationReady,glActivationReady,trustedOnly:true,
    classicTrustedAll:Number(classic.total||0),aiTrustedAll:Number(ai.total||0),glTrustedAll:Number(gl.total||0),
    classicTrustedAllRate:Number(classic.rate||0),aiTrustedAllRate:Number(ai.rate||0),glTrustedAllRate:Number(gl.rate||0)
  };
  const finish=result=>writeAutoRouteDailyLock(targetDate,id,{...result,locked:true,lockVersion:1});

  if(Number(classic.total||0)<minSamples){
    return finish({...selector,mode:"original",reason:`รอข้อมูล Trusted ${classic.total}/${minSamples} งวด • ใช้ Classic L`,gate,minSamples,ready:false,candidatePool:["original"],lowConfidence:true});
  }

  const candidates=[{key:"original",name:"Classic L",rate:Number(classic.rate||0),total:Number(classic.total||0),ready:true}];
  if(aiActivationReady&&Number(ai.total||0)>=minSamples)candidates.push({key:"ai",name:"AI L",rate:Number(ai.rate||0),total:Number(ai.total||0),ready:true});
  if(glActivationReady&&Number(gl.total||0)>=minSamples)candidates.push({key:"gl",name:"AI GL",rate:Number(gl.rate||0),total:Number(gl.total||0),ready:true});
  if(Number(p18.total||0)>=minSamples)candidates.push({key:"pattern",name:"P18",rate:Number(p18.rate||0),total:Number(p18.total||0),ready:true,resultOnly:true});
  if(Number(p19.total||0)>=minSamples)candidates.push({key:"p19",name:"P19",rate:Number(p19.rate||0),total:Number(p19.total||0),ready:true,resultOnly:true});
  if(Number(x3.total||0)>=minSamples)candidates.push({key:"x3",name:"X3",rate:Number(x3.rate||0),total:Number(x3.total||0),ready:true,resultOnly:true});

  const champion=historyChampionForPriorDraws(profileDraws,id);
  const championByKey=new Map((champion?.items||[]).map(x=>[x.key==="p18"?"pattern":x.key==="aiL"?"ai":x.key==="classic"?"original":x.key,Number(x.championScore||0)]));
  const rankedAll=candidates.map(x=>({...x,championScore:championByKey.get(x.key)||0}))
    .sort((a,b)=>Number(b.rate||0)-Number(a.rate||0)||Number(b.championScore||0)-Number(a.championScore||0)||Number(b.total||0)-Number(a.total||0)||trustedChampionPriority(a.key)-trustedChampionPriority(b.key));
  const topRate=Math.max(...candidates.map(x=>Number(x.rate||0)));
  const tied=candidates.filter(x=>Math.abs(Number(x.rate||0)-topRate)<0.0001);
  let chosen=null,tieReason="";
  if(tied.length===1) chosen=tied[0];
  else{
    const ranked=tied.map(x=>({...x,championScore:championByKey.get(x.key)||0}))
      .sort((a,b)=>Number(b.championScore||0)-Number(a.championScore||0)||Number(b.total||0)-Number(a.total||0));
    const bestScore=Number(ranked[0]?.championScore||0), scoreTied=ranked.filter(x=>Number(x.championScore||0)===bestScore);
    if(scoreTied.length===1){chosen=scoreTied[0];tieReason=` • Trusted เสมอ → Champion Score ${chosen.championScore}`;}
    else{
      const bestTotal=Math.max(...scoreTied.map(x=>Number(x.total||0))),sampleTied=scoreTied.filter(x=>Number(x.total||0)===bestTotal);
      if(sampleTied.length===1){chosen=sampleTied[0];tieReason=` • Trusted/Champion เสมอ → Sample ${chosen.total}`;}
      else{chosen=[...sampleTied].sort((a,b)=>trustedChampionPriority(a.key)-trustedChampionPriority(b.key))[0]||candidates[0];tieReason=` • Trusted/Champion/Sample เสมอ → Safety priority ${chosen.name}`;}
    }
  }

  const first=rankedAll[0]||chosen||candidates[0],second=rankedAll[1]||null;
  if(second){
    const comboGap=Math.round(Math.abs(Number(first.rate||0)-Number(second.rate||0))*10)/10;
    const scoreGap=Math.abs(Number(first.championScore||0)-Number(second.championScore||0));
    const minTotal=Math.min(Number(first.total||0),Number(second.total||0)),maxTotal=Math.max(Number(first.total||0),Number(second.total||0),1),sampleRatio=minTotal/maxTotal;
    const comboReady=comboGap<=0.5||(comboGap<=1.0&&scoreGap<=5&&sampleRatio>=0.90);
    if(comboReady){
      const pairKeyPart=key=>key==="original"?"classic":key==="ai"?"ai":key,pairKeys=[pairKeyPart(first.key),pairKeyPart(second.key)].sort();
      const lowConfidence=Math.max(Number(first.rate||0),Number(second.rate||0))<AUTO_ROUTE_LOW_CONFIDENCE_RATE;
      return finish({...selector,mode:"combo",comboSources:[first.key,second.key],comboPair:pairKeys.join("-"),comboLabel:`${first.name} + ${second.name}`,comboGap,comboBaseMode:first.key,lowConfidence,reason:`${first.name} ${first.rate}% + ${second.name} ${second.rate}% • Trusted ใกล้กัน ${comboGap.toFixed(1)}pp → AUTO COMBO • DEDUP + CONSENSUS`,gate,minSamples,ready:true,candidatePool:candidates.map(x=>x.key),championTieBreak:tied.length>1});
    }
  }
  const top=chosen||candidates[0],compareClassic=Math.round((Number(top.rate||0)-Number(classic.rate||0))*10)/10;
  const compare=top.key==="original"?` • AI L ${ai.rate}% • AI GL ${gl.rate}% • P18 ${p18.rate}% • P19 ${p19.rate||0}% • X3 ${x3.rate||0}%`:` • เหนือ Classic ${compareClassic>=0?"+":""}${compareClassic}%`;
  const lowConfidence=Number(top.rate||0)<AUTO_ROUTE_LOW_CONFIDENCE_RATE;
  return finish({...selector,mode:top.key,lowConfidence,reason:`${top.name} สูงสุด Trusted ${top.rate}%${compare}${tieReason} • READY`,gate,minSamples,ready:true,candidatePool:candidates.map(x=>x.key),championTieBreak:tied.length>1});
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
      if (!c?.trusted || c.classic === "pending") return null;
      return {date:String(d.date || ""), classic:c.classic, aiL:c.aiL||"pending",gl:c.gl||"pending",p18:patternV18HistoryStatus(d,id)};
    }).filter(Boolean).slice(-Math.max(1, Number(maxRows) || 30));
  const hitRate = key => {
    const valid = rows.filter(r => r[key] !== "pending");
    const hit = valid.filter(r => r[key] === "exact" || r[key] === "reversed").length;
    return valid.length ? hit * 100 / valid.length : 0;
  };
  const classicRate = hitRate("classic"), aiRate = hitRate("aiL"),glRate=hitRate("gl"),p18Rate=hitRate("p18");
  const margin = Math.round((aiRate - classicRate) * 10) / 10;
  const glRows=rows.filter(r=>r.gl!=="pending").length,glVsClassic=Math.round((glRate-classicRate)*10)/10,glVsAI=Math.round((glRate-aiRate)*10)/10;
  const p18Rows=rows.filter(r=>r.p18!=="pending").length;
  let mode=glRows>=minSamples&&glVsClassic>=gate&&glVsAI>0?"gl":rows.filter(r=>r.aiL!=="pending").length>=minSamples&&margin>=gate?"ai":"original";
  const currentRate=mode==="gl"?glRate:mode==="ai"?aiRate:classicRate;
  if(p18Rows>=minSamples && p18Rate>currentRate) mode="pattern";
  let championTieBreak=false;
  if(rows.length>=minSamples&&margin===0&&mode==="original"){
    const cTotal=rows.filter(r=>r.classic!=="pending").length, aTotal=rows.filter(r=>r.aiL!=="pending").length;
    const bestRate=Math.max(classicRate,aiRate,.1),maxTotal=Math.max(cTotal,aTotal,1);
    const cScore=Math.round(Math.min(100,(classicRate/bestRate)*80+(cTotal/maxTotal)*20));
    const aScore=Math.round(Math.min(100,(aiRate/bestRate)*80+(aTotal/maxTotal)*20));
    if(aScore>cScore) mode="ai";
    championTieBreak=true;
  }
  return {mode, label:mode === "pattern"?"P18":mode === "gl"?"GL":mode === "ai" ? "AIL" : "CLS", samples:rows.length, classicRate:Math.round(classicRate*10)/10, aiRate:Math.round(aiRate*10)/10,glRate:Math.round(glRate*10)/10,p18Rate:Math.round(p18Rate*10)/10,p18Samples:p18Rows,margin,glVsClassic,glVsAI,gate,minSamples,trustedOnly:true,reconstructed:true,championTieBreak};
}
function getHistoryAutoChoice(draw, profileId = Number(draw?.profileId ?? 0)) {
  const saved = draw?.autoDecisionSnapshot;
  if (saved && (saved.mode === "ai" || saved.mode === "gl" || saved.mode === "pattern" || saved.mode === "p19" || saved.mode === "original")) {
    return {...saved, label:saved.mode === "p19"?"P19":saved.mode === "pattern"?"P18":saved.mode === "gl"?"GL":saved.mode === "ai" ? "AIL" : "CLS", reconstructed:false};
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
  if(mode==="blend"&&saved?.formula) return saved.formula; // legacy visual base grid only
  if(mode==="combo"){
    const base=getAutoFormulaDecision(id)?.comboBaseMode;
    if(base==="gl"&&glSaved?.formula) return glSaved.formula;
    if(base==="ai"&&saved?.formula) return saved.formula;
    return getOriginalFormula();
  }
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
  if(getActiveFormulaMode(id)==="combo") return `COMBO • ${getAutoFormulaDecision(id)?.comboLabel||"AUTO"}`;
  if(getActiveFormulaMode(id)==="blend") return "BLEND • AI L + AI GL";
  if(getActiveFormulaMode(id)==="gl") return `AI GL V${Number(state.aiGLFormulaLab?.[id]?.version||1)} • Hybrid Refiner`;
  if(getActiveFormulaMode(id)==="x3") return "X3 • AUTO Trusted Champion";
  if(getActiveFormulaMode(id)==="p19") return "P19 • AUTO Primary";
  if(getActiveFormulaMode(id)==="pattern") return "P18 • AUTO Champion";
  if (getActiveFormulaMode(id) !== "ai") return "Classic L";
  return getAIFormulaDisplayName(id);
}

function getActiveFormulaDetail(profileId = state.activeProfile) {
  const id = Number(profileId);
  if(getActiveFormulaMode(id)==="combo") return `AUTO COMBO • ${getAutoFormulaDecision(id)?.comboLabel||"AUTO"} • DEDUP + CONSENSUS`;
  if(getActiveFormulaMode(id)==="blend") return "AUTO BLEND • AI L + AI GL • DEDUP + CONSENSUS";
  if(getActiveFormulaMode(id)==="gl") return `AI GL V${Number(state.aiGLFormulaLab?.[id]?.version||1)} • Classic + AI L`;
  if(getActiveFormulaMode(id)==="x3") return "AUTO → X3 • Trusted Champion • Strict Prior-only";
  if(getActiveFormulaMode(id)==="p19") return "AUTO → P19 • Result-only • Strict Prior-only";
  if(getActiveFormulaMode(id)==="pattern") return "AUTO → P18 • Result-only • Strict Prior-only";
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
  if (configuredMode === "auto" && activeMode === "combo") {
    return `🤖 AUTO → COMBO • ${getAutoFormulaDecision(id)?.comboLabel||"AUTO"}`;
  }
  if (configuredMode === "auto" && activeMode === "blend") {
    return "🤖 AUTO → BLEND • AI L + AI GL";
  }
  if (configuredMode === "auto" && displayedMode === activeMode) {
    return activeMode === "x3" ? "🤖 AUTO → X3" : activeMode === "p19" ? "🤖 AUTO → P19" : activeMode === "pattern" ? "🤖 AUTO → P18" : displayedMode === "gl"?"🤖 AUTO → AI GL":displayedMode === "ai" ? "🤖 AUTO → AI L" : "🤖 AUTO → Classic L";
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
  const id=Number(profileId);
  // V7.20.18 Fast Incremental WF: a completed WF bucket already walked the exact
  // strict-prior source tables. Reuse that compact sample cache instead of resolving
  // every historical table again on each Save/Delete AI refresh.
  const bucket=getWalkForwardBucket(id);
  if(bucket && walkForwardBucketCoversCurrentHistory(id,bucket) && Array.isArray(bucket.formulaSamplesCache)){
    return bucket.formulaSamplesCache.map(x=>({date:String(x.date||""),actual:String(x.actual||""),inputs:(x.inputs||[]).map(String)}));
  }
  return state.actualDraws
    .filter(d => Number(d.profileId ?? 0) === id && /^\d{3}$/.test(String(d.number || "")))
    .map(draw => {
      const table = getPredictionTable(id, draw.date, draw);
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
  return {items:[],dataCount:0,pending:true,disabled:true,retired:true};
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
  if (!SUPPORT_AI_RUNTIME_ENABLED) return {hit:0,total:0,rate:0,disabled:true};
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
  return {items:[],dataCount:0,pending:true,experimental:false,disabled:true,retired:true};
}
function pairHistoryStatus(actual, profileId, date, limit=10) {
  const draw=state.actualDraws.find(x=>Number(x.profileId??0)===Number(profileId)&&x.date===date)||null, snap=getUniversalPredictionSnapshot(profileId,date,draw);
  if(!snap)return {status:"pending",prediction:{items:[],pending:true,snapshotMissing:true}};
  const items=(snap.pairItems||[]).slice(0,Math.max(1,limit)).map((number,i)=>({number:String(number),aiRank:i+1}));
  return {status:snapshotItemsStatus(actual,items),prediction:{items,pending:!items.length,snapshot:true,createdAt:snap.createdAt}};
}
function pairHistorySummary(draws, profileId, limit=10) {
  if (!SUPPORT_AI_RUNTIME_ENABLED) return {hit:0,total:0,rate:0,disabled:true};
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
  // R36 Master Weight Evidence-Rank Guard (FAST):
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
  return {items:[],pending:true,dataCount:0,weights:null,paused:true,retired:true};
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
  // It still scores candidates against ALL available History, but avoids a fresh 120x32
  // global search after every single new draw. Manual Generate AI keeps the full budget.
  const incremental = Boolean(options?.incremental && previous?.formula);
  // V7.19.31: Full System Rebuild uses a dedicated fast-live budget. Manual Generate AI
  // remains at the original 120x32 budget, so this optimization affects only Rebuild.
  const fastLive = Boolean(options?.fast);
  const populationSize = fastLive ? 72 : (incremental ? 42 : 120);
  const generations = fastLive ? 12 : (incremental ? 7 : 22);
  const eliteSize = fastLive ? 14 : (incremental ? 10 : 18);
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
function runAIGLEvolution(profileId,samples,aiFormula,previousFormula,targetDate,{incremental=false,fast=false}={}) {
  if(!Array.isArray(samples)||samples.length<8||!Array.isArray(aiFormula)) return null;
  const split=Math.max(5,Math.floor(samples.length*.7)), train=samples.slice(0,split), test=samples.slice(split);
  const classic=getOriginalFormula();
  const baseline={classicTrain:evaluateFormulaWeighted(classic,train),classicTest:evaluateFormulaWeighted(classic,test),aiTrain:evaluateFormulaWeighted(aiFormula,train),aiTest:evaluateFormulaWeighted(aiFormula,test)};
  const seed=(Number(profileId)+1)*700001+samples.length*131+Number(String(targetDate||samples.at(-1)?.date||"1").replaceAll("-","")||1);
  // V7.19.29 Fast WF: preserve strict prior-only inputs but use the previous champion as
  // the primary warm start. Historical rebuild no longer spends a full 34x6 search on
  // every adjacent draw. Live/full training keeps the original budget unchanged.
  // V7.19.31 Turbo Full-Rebuild budget. Same strict-prior objective; fewer repeated
  // candidates around the previous champion for materially faster iPhone rebuilds.
  const rand=seededRandom(seed), populationSize=fast?10:(incremental?34:72), generations=fast?2:(incremental?6:14), eliteSize=fast?4:(incremental?8:12);
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
  const evolved=runAIGLEvolution(id,samples,aiSaved.formula,previous?.formula,samples.at(-1)?.date,{incremental:Boolean(options.incremental),fast:Boolean(options.fast)});
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
function evolveWalkForwardAIGLFormula(profileId,samples,aiFormula,previousFormula,targetDate,options={}) {
  const working=samples.length>180?[...samples.slice(0,-120).filter((_,i,a)=>i%Math.max(1,Math.floor(a.length/60))===0).slice(-60),...samples.slice(-120)]:samples;
  const result=runAIGLEvolution(Number(profileId),working,aiFormula,previousFormula,targetDate,{incremental:true,fast:Boolean(options.fast)});
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
function fastPruneLatestWalkForwardAfterDelete(profileId, deletedDraw, oldBucket=getWalkForwardBucket(profileId)) {
  const id=Number(profileId), deletedId=String(deletedDraw?.id||""), deletedDate=String(deletedDraw?.date||"");
  if(!oldBucket || !Array.isArray(oldBucket.records) || !oldBucket.records.length || !/^\d{4}-\d{2}-\d{2}$/.test(deletedDate)) return false;
  const lastRecord=oldBucket.records[oldBucket.records.length-1];
  if(String(lastRecord?.actualDrawId||"")!==deletedId || String(lastRecord?.date||"")!==deletedDate) return false;
  const remaining=walkForwardProfileDraws(id);
  const latestRemaining=remaining.length?String(remaining[remaining.length-1].date||""):"";
  if(latestRemaining && latestRemaining>=deletedDate) return false; // only a true latest-row delete is dependency-free
  const records=oldBucket.records.slice(0,-1);
  const formulaSamplesCache=Array.isArray(oldBucket.formulaSamplesCache)
    ? oldBucket.formulaSamplesCache.filter(x=>String(x.date||"")!==deletedDate)
    : null;
  state.walkForwardBacktests=state.walkForwardBacktests||{};
  state.walkForwardBacktests[id]={
    ...oldBucket,generatedAt:Date.now(),rebuildMode:"fast-latest-delete",reusedRecords:records.length,recalculatedRecords:0,
    incrementalFrom:deletedDate,totalHistoryDraws:remaining.length,records,
    ...(formulaSamplesCache?{formulaSamplesCache}:{}),cacheFingerprint:buildWalkForwardCacheFingerprint(id)
  };
  clearPerformanceCaches(); activeRenderPerfSignature="";
  return walkForwardBucketCoversCurrentHistory(id,state.walkForwardBacktests[id]);
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

// V7.20.49 — lightweight append-safe History guard on the V7.20.37 speed base.
// A normal Save adds exactly one newest History row. Preserve the complete N-row WF
// prefix and resume only N+1 instead of invalidating/rebuilding the whole profile.
function walkForwardBucketIsOneRowPrefix(profileId, bucket=getWalkForwardBucket(profileId)) {
  const id=Number(profileId), draws=walkForwardProfileDraws(id);
  const records=Array.isArray(bucket?.records)?bucket.records:[];
  if(!bucket || Number(bucket.version||0)<4 || String(bucket.engineVersion||"")!==WF_ENGINE_VERSION) return false;
  if(String(bucket.methodology||"")!=="walk-forward-adaptive-memory-prior-only") return false;
  if(!records.length || records.length !== draws.length - 1) return false;
  for(let i=0;i<records.length;i++){
    const row=records[i], draw=draws[i];
    if(!row || !draw || Number(row.profileId)!==id) return false;
    if(String(row.actualDrawId||"")!==String(draw.id||"")) return false;
    if(String(row.date||"")!==String(draw.date||"")) return false;
  }
  return true;
}
const WF_APPEND_RESUME_IN_FLIGHT = new Set();
function scheduleWalkForwardOneRowResume(profileId, delay=180) {
  const id=Number(profileId);
  if(!Number.isInteger(id) || id<0 || id>=state.profiles.length || WF_APPEND_RESUME_IN_FLIGHT.has(id)) return false;
  if(!walkForwardBucketIsOneRowPrefix(id)) return false;
  WF_APPEND_RESUME_IN_FLIGHT.add(id);
  const run=async()=>{
    try {
      if(backgroundWfWorkerRunning){ setTimeout(run,650); return; }
      const bucket=getWalkForwardBucket(id);
      if(walkForwardBucketCoversCurrentHistory(id,bucket)) return;
      if(!walkForwardBucketIsOneRowPrefix(id,bucket)) return;
      const draws=walkForwardProfileDraws(id), records=Array.isArray(bucket?.records)?bucket.records:[];
      const nextDraw=draws[records.length];
      if(!nextDraw) return;
      await rebuildWalkForwardBacktest(id, null, {startDate:String(nextDraw.date||""),yieldEvery:1,progressEvery:1});
      clearPerformanceCaches(); activeRenderPerfSignature=""; invalidateViewCache(); saveState();
      if(document.visibilityState!=="hidden") setTimeout(()=>render(),50);
    } catch(error) { console.error("WF one-row resume failed",state.profiles[id]||id,error); }
    finally { WF_APPEND_RESUME_IN_FLIGHT.delete(id); }
  };
  setTimeout(run,Math.max(0,Number(delay)||0));
  return true;
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
      await rebuildWalkForwardBacktest(id, null, {yieldEvery:1, progressEvery:2});
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
// V7.09.68 — Dynamic last-Profile derived-data guard.
// A Profile can become the final index after add/delete/reorder/recovery. History source
// rows are authoritative, but its generated daily tables/WF cache may be missing or stale.
// Repair only that Profile from its own saved results and queue a strict prior-only WF
// bootstrap. This is position-independent: no Profile is special merely because it is last.
function ensureProfileDerivedHistoryReady(profileId, {repairTables=true} = {}) {
  const id = Number(profileId);
  if (!Number.isInteger(id) || id < 0 || id >= state.profiles.length) return {valid:false, reason:"invalid-profile"};
  const draws = (state.actualDraws || [])
    .filter(d => Number(d?.profileId ?? 0) === id && /^\d{3}$/.test(String(d?.number || "")) && /^\d{2}$/.test(String(d?.twoDigit || "")) && /^\d{4}-\d{2}-\d{2}$/.test(String(d?.date || "")));
  // V7.19.14 Performance Core: History/Analysis call this with repairTables:false.
  // Sorting a copied History array on every tab entry was pure foreground overhead.
  // Only maintenance/repair needs chronological order.
  if (repairTables && draws.length > 1) draws.sort((a,b)=>String(a.date).localeCompare(String(b.date)) || Number(a.createdAt||0)-Number(b.createdAt||0));
  let repairedTables = 0;
  if (repairTables && draws.length) {
    for (const draw of draws) {
      if (getDailyTable(id, draw.date)) continue;
      try { if (upsertDailyTableFromActual(draw)) repairedTables += 1; }
      catch (error) { console.warn("Profile derived table repair skipped", id, draw.date, error); }
    }
    if (repairedTables) {
      try { syncAutoLHistoryForProfile(id); } catch (error) { console.warn("Profile History relink skipped", id, error); }
      clearPerformanceCaches(); activeRenderPerfSignature = ""; invalidateViewCache();
      saveState();
    }
  }
  let wfReady = false, wfQueued = false;
  if (draws.length >= 8) {
    const bucket = getWalkForwardBucket(id);
    wfReady = Boolean(bucket && walkForwardBucketCoversCurrentHistory(id, bucket));
    if (wfReady) {
      try { wfReady = Boolean(walkForwardRuntimeTrust(id).valid); } catch (_) { wfReady = false; }
    }
    if (!wfReady) {
      if (bucket && walkForwardBucketIsOneRowPrefix(id,bucket)) {
        wfQueued = scheduleWalkForwardOneRowResume(id, 160);
      } else {
        if (bucket) invalidateWalkForwardBacktest(id);
        wfQueued = scheduleMissingWalkForwardBootstrap(id, 80);
      }
    }
  }
  return {valid:true, draws:draws.length, repairedTables, wfReady, wfQueued};
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
function evolveWalkForwardAIFormula(profileId, samples, previousFormula, targetDate, options = {}) {
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
  // V7.19.29 Fast WF warm-start budget. This changes search budget only; every fitness
  // value still uses strictly-prior samples and the same Classic-relative objective.
  // Normal/live evolution remains 48x8. Full Turbo Rebuild uses 12x3 around the prior champion.
  const fast=Boolean(options.fast);
  // V7.19.31 Turbo Full-Rebuild: cut the historical search work by ~60% versus V7.19.30
  // while keeping the same strict-prior samples, deterministic seed and Classic-relative objective.
  const populationSize = fast ? 12 : 48, generations = fast ? 2 : 8, eliteSize = fast ? 4 : 10;
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
  return {items:[],pending:true,weights:null,paused:true,retired:true};
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
  // R36 mirror of the live Evidence-Rank Guard. Uses priorRecords already in memory;
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
    // V7.20.18: newest-row append can restore the already-built training memory in O(1).
    // Historical edits intentionally fall back to exact reconstruction below.
    if(startIndex===Number(oldBucket.records.length||0) && Array.isArray(oldBucket.formulaSamplesCache)){
      formulaSamples=oldBucket.formulaSamplesCache.map(x=>({date:String(x.date||""),actual:String(x.actual||""),inputs:(x.inputs||[]).map(String)}));
      previousFormula=oldBucket.lastAIFormula?cloneFormula(oldBucket.lastAIFormula):null;
      previousGLFormula=oldBucket.lastGLFormula?cloneFormula(oldBucket.lastGLFormula):null;
      pendingSampleDate=""; pendingSameDateSamples=[];
      resumedFromCheckpoint=true;
    }
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
  // V7.20.01 Fast Rebuild: precompute the latest STRICTLY-prior training date once.
  // The previous code rebuilt draws.slice(0,i).map(...) for every row (O(n²)).
  // This preserves the exact trainedThrough semantics while making the hot loop O(n).
  const strictPriorDateByIndex=new Array(draws.length).fill("");
  let lastStrictDate="", groupDate="";
  for(let i=0;i<draws.length;i++){
    const d=String(draws[i]?.date||"");
    if(i===0){ groupDate=d; strictPriorDateByIndex[i]=""; continue; }
    if(d!==groupDate){ lastStrictDate=groupDate; groupDate=d; }
    strictPriorDateByIndex[i]=lastStrictDate;
  }
  const rebuildTotal=Math.max(0,draws.length-startIndex);
  const persistProgress=async(nextIndex, force=false)=>{
    if(requestedStartDate || nextIndex<=0 || nextIndex>draws.length) return true;
    if(!force && (nextIndex>=draws.length || nextIndex%checkpointEvery!==0)) return true;
    return writeIndexedValue(progressKey,{
      version:1,profileId:id,engineVersion:WF_ENGINE_VERSION,methodology:"walk-forward-adaptive-memory-prior-only",
      fingerprintHash:fingerprint.hash,totalHistoryDraws:draws.length,nextIndex,updatedAt:Date.now(),
      records,previousFormula:previousFormula?cloneFormula(previousFormula):null,previousGLFormula:previousGLFormula?cloneFormula(previousGLFormula):null,formulaSamples,
      pendingSampleDate,pendingSameDateSamples
    });
  };

  const progressEvery=Math.max(1,Number(options?.progressEvery||1));
  const yieldEvery=Math.max(1,Number(options?.yieldEvery||2));
  const checkpointEvery=Math.max(1,Number(options?.checkpointEvery||WF_PROGRESS_COMMIT_EVERY));
  const fastEvolution=Boolean(options?.fastEvolution);
  for(let i=startIndex;i<draws.length;i++){
    // Full fast rebuild is an explicit user action: do not add a 620 ms quiet wait for
    // every touch/scroll. Yielding below is enough to keep Safari responsive.
    if (!fastEvolution && typeof userInteractionHot === "function" && userInteractionHot(620)) await waitForForegroundIdle(620);
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
    if(samples.length>=8){aiFormula=evolveWalkForwardAIFormula(id,samples,previousFormula,draw.date,{fast:fastEvolution}); if(aiFormula) previousFormula=cloneFormula(aiFormula);}
    if(aiFormula){ aiGrid=formulaGrid(inputs,aiFormula); aiLItems=findLResults(aiGrid||[]).map(x=>String(x.number)); }
    if(aiFormula&&samples.length>=8){ glFormula=evolveWalkForwardAIGLFormula(id,samples,aiFormula,previousGLFormula,draw.date,{fast:fastEvolution}); if(glFormula) previousGLFormula=cloneFormula(glFormula); }
    if(glFormula){ glGrid=formulaGrid(inputs,glFormula); glItems=findLResults(glGrid||[]).map(x=>String(x.number)); }
    // Pair / Independent are retired from runtime. Keep empty compatibility fields only
    // so old History schemas remain readable; no generator is called during WF.
    const independent={items:[],pending:true,disabled:true}, pair={items:[],pending:true,disabled:true};
    const independentItems=[], pairItems=[];
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
    const trainedThrough=strictPriorDateByIndex[i] || String(table.date||"");
    records.push({
      version:1,profileId:id,actualDrawId:draw.id,date:draw.date,sourceTableId:table.id,sourceTableDate:table.date,
      trainedThrough,sampleCount:samples.length,createdAt:Date.now(),
      statuses:wfStatuses,
      items:{classic:classicItems,aiL:aiLItems,gl:glItems,independent:independentItems,pair:pairItems,master:masterItems,masterBasic:masterBasicItems},grids:{classic:classicGrid,aiL:aiGrid,gl:glGrid},aiLFormula:aiFormula?cloneFormula(aiFormula):null,glFormula:glFormula?cloneFormula(glFormula):null,masterWeights:weights,masterBasicSelected:basicSelected,masterBasicFallback:Boolean(masterBasic.fallback),masterBasicCandidateCount:masterBasicItems.length,masterBasicAuditMatched:basicAuditMatched,masterBasicExpectedStatus:basicExpectedStatus,
      methodology:"walk-forward-adaptive-memory-prior-only",verifiedLive:false,
      sample:{actualDrawId:String(draw.id||""),date:String(draw.date||""),actual,inputs:inputs.slice()}
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
    formulaSamplesCache:[...formulaSamples,...pendingSameDateSamples].map(x=>({date:String(x.date||""),actual:String(x.actual||""),inputs:(x.inputs||[]).map(String)})),
    lastAIFormula:previousFormula?cloneFormula(previousFormula):null,
    lastGLFormula:previousGLFormula?cloneFormula(previousGLFormula):null,
    memoryPolicy:{windows:AI_HISTORY_WINDOWS.map(w=>({size:w.size===Infinity?"All":w.size,weight:w.weight}))},records
  };
  clearPerformanceCaches(); activeRenderPerfSignature="";
  const deferDurable=Boolean(options?.deferDurable);
  let durable=true;
  if(!deferDurable){
    saveState();
    // Normal/incremental WF keeps the original per-profile durability boundary.
    durable=await commitStateDurably();
  }
  // Fast full rebuild persists in profile batches from the outer worker. Keep the small
  // resumable checkpoint until that batch commit succeeds.
  if(durable && !deferDurable && !requestedStartDate) await deleteIndexedValue(progressKey);
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
  // V7.19.14 Performance Clean — do not train/recover formulas silently while the user is navigating.
  // Existing explicit Generate/Train/Restore flows remain unchanged.
  return false;
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
// V7.09.22 — Global Background ML Monitor.
// ML scans EVERY profile across active engines only (Classic L / AI L / AI GL)
// from verified STRICT prior-only WF evidence. The UI stays quiet unless a profile has
// a meaningful edge. Internal probabilities are intentionally hidden from the main UI.
const ML_SELECT_WATCH_MIN_PP = 0.8;
const ML_SELECT_EDGE_MIN_PP = 1.5;
const ML_SELECT_STRONG_MIN_PP = 2.5;
const ML_GLOBAL_ALERT_LIMIT = 3;
let AI_STANDARD_SNAPSHOT_CACHE={signature:'',builtAt:0,profiles:new Map()};
const AI_STANDARD_PROFILE_CACHE_KEY="luckyNumber_ai_standard_profile_v72031";
let AI_STANDARD_PROFILE_STORE_MEMORY=null;
let AI_STANDARD_PROFILE_STORE_RAW='';
function aiStandardSnapshotSignature(){
  return [X3_ENGINE_SIGNATURE,Number(state._persistenceUpdatedAt||0),(state.actualDraws||[]).length,Number(state._profileRevision||0)].join('|');
}
function aiStandardProfileSummarySignature(profileId,draws){
  const id=Number(profileId)||0,list=Array.isArray(draws)?draws:[],last=list.length?list[list.length-1]:null;
  return [WF_ENGINE_VERSION,PATTERN_V19_ENGINE_SIGNATURE,X3_ENGINE_SIGNATURE,id,list.length,String(last?.id||''),String(last?.date||''),String(last?.number||'')].join('|');
}
function readAIStandardProfileStore(){
  try{
    const raw=localStorage.getItem(AI_STANDARD_PROFILE_CACHE_KEY)||'{}';
    if(AI_STANDARD_PROFILE_STORE_MEMORY && raw===AI_STANDARD_PROFILE_STORE_RAW) return AI_STANDARD_PROFILE_STORE_MEMORY;
    const parsed=JSON.parse(raw)||{};
    AI_STANDARD_PROFILE_STORE_RAW=raw; AI_STANDARD_PROFILE_STORE_MEMORY=parsed;
    return parsed;
  }catch(_){ return AI_STANDARD_PROFILE_STORE_MEMORY||{}; }
}
function readAIStandardProfileSummary(profileId,draws){
  try{
    const all=readAIStandardProfileStore(),item=all?.[String(Number(profileId)||0)];
    return item?.signature===aiStandardProfileSummarySignature(profileId,draws)?item:null;
  }catch(_){ return null; }
}
function persistAIStandardProfileSummary(profileId,draws,result){
  if(!result?.summaries) return false;
  try{
    const all={...readAIStandardProfileStore()};
    all[String(Number(profileId)||0)]={signature:aiStandardProfileSummarySignature(profileId,draws),updatedAt:Date.now(),...result};
    const raw=JSON.stringify(all);
    localStorage.setItem(AI_STANDARD_PROFILE_CACHE_KEY,raw);
    AI_STANDARD_PROFILE_STORE_RAW=raw; AI_STANDARD_PROFILE_STORE_MEMORY=all;
    return true;
  }catch(_){ return false; }
}
async function computeAIStandardCommonSummary(profileId,draws){
  const id=Number(profileId),list=Array.isArray(draws)?draws:[],hits=Object.fromEntries(AI_STANDARD_VISIBLE_ENGINES.map(k=>[k,0]));
  let total=0,lastDate='';
  for(let i=0;i<list.length;i++){
    const draw=list[i],row=getUnifiedAIHistoryStatuses(draw,id);
    if(row?.trusted){
      const statuses=Object.fromEntries(AI_STANDARD_VISIBLE_ENGINES.map(k=>[k,row?.[k]||row?.engineStatuses?.[k]||'pending']));
      if(AI_STANDARD_VISIBLE_ENGINES.every(k=>statuses[k]!=='pending')){
        total++; lastDate=String(draw?.date||lastDate).slice(0,10);
        for(const k of AI_STANDARD_VISIBLE_ENGINES) if(mlSelectIsHit(statuses[k])) hits[k]++;
      }
    }
    // iPhone main-thread guard: yield more often and wait out any active gesture.
    if(i>0&&i%32===0){ await new Promise(r=>setTimeout(r,0)); if(userInteractionHot(500)) await waitForForegroundIdle(700); }
  }
  const summaries=Object.fromEntries(AI_STANDARD_VISIBLE_ENGINES.map(k=>[k,{hit:hits[k],total,rate:total?Math.round(hits[k]*1000/total)/10:0}]));
  return {summaries,ready:total>0,sameDataset:total>0,total,lastDate};
}
function scheduleAIStandardSummaryCacheBuild(profileId,draws=null,delay=1600){
  const id=Number(profileId),provided=Array.isArray(draws)?draws:null;
  // Do not filter/sort History synchronously when this function is called from a tap,
  // profile switch, route render, or model completion. The list is prepared inside the
  // idle job instead.
  const quickKey=`AI-STANDARD|${id}|${aiStandardSnapshotSignature()}|${provided?.length??'lazy'}`;
  return COMPUTE_MANAGER.enqueue(quickKey,async()=>{
    if(document.visibilityState==='hidden') return;
    if(userInteractionHot(900)) await waitForForegroundIdle(1400);
    const list=provided || (state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===id).sort((a,b)=>String(a?.date||'').localeCompare(String(b?.date||''))||Number(a?.createdAt||0)-Number(b?.createdAt||0));
    if(!list.length||readAIStandardProfileSummary(id,list)?.ready) return;
    restoreUnifiedAIProfileSync(id);
    const pReady=PERF_CACHE.patternV19Bundle.get(p19BundleCacheKey(id))?.statusMap instanceof Map;
    const xReady=PERF_CACHE.x3Bundle.get(x3BundleCacheKey(id))?.statusMap instanceof Map;
    if(!pReady||!xReady){
      // Hydrate persisted caches only. Missing P19/X3 computation is scheduled separately
      // with a long idle delay, never recursively from inside this summary job.
      await hydrateUnifiedAIProfile(id,{allowIndexed:true,scheduleMissing:false});
      if(!(PERF_CACHE.patternV19Bundle.get(p19BundleCacheKey(id))?.statusMap instanceof Map)) schedulePatternV19Background(id,3600);
      if(!(PERF_CACHE.x3Bundle.get(x3BundleCacheKey(id))?.statusMap instanceof Map)) scheduleX3Background(id,3900);
      setTimeout(()=>{ if(state.currentView==='weekly'&&!userInteractionHot(1200)) scheduleAIStandardSummaryCacheBuild(id,null,2600); },2400);
      return;
    }
    const result=await computeAIStandardCommonSummary(id,list);
    if(result.ready) persistAIStandardProfileSummary(id,list,result);
    AI_STANDARD_SNAPSHOT_CACHE={signature:'',builtAt:0,profiles:new Map()};
    if(state.currentView==='weekly'&&!userInteractionHot(900)) requestAnimationFrame(()=>refreshWeeklyBackgroundPanels());
  },{delay:Math.max(900,Number(delay)||1600),idleMs:1600});
}
function rebuildAIStandardSnapshotCache(){
  const signature=aiStandardSnapshotSignature(), now=Date.now();
  if(AI_STANDARD_SNAPSHOT_CACHE.signature===signature && now-AI_STANDARD_SNAPSHOT_CACHE.builtAt<1500) return AI_STANDARD_SNAPSHOT_CACHE;
  const grouped=new Map();
  for(const d of (state.actualDraws||[])){
    const id=Number(d?.profileId??0); if(!grouped.has(id))grouped.set(id,[]); grouped.get(id).push(d);
  }
  for(const list of grouped.values()) list.sort((a,b)=>String(a?.date||'').localeCompare(String(b?.date||''))||Number(a?.createdAt||0)-Number(b?.createdAt||0));
  let committedAll={},summaryAll={};
  try{ committedAll=JSON.parse(localStorage.getItem(AI_HISTORY_COMMITTED_SNAPSHOT_KEY)||'{}')||{}; }catch(_){}
  try{ summaryAll=JSON.parse(localStorage.getItem(HISTORY_SUMMARY_CACHE_KEY)||'{}')||{}; }catch(_){}
  const profiles=new Map(), totalProfiles=(state.profiles||[]).length;
  for(let id=0;id<totalProfiles;id++){
    const draws=grouped.get(id)||[], committed=committedAll?.[String(id)], cached=summaryAll?.[String(id)];
    const committedOK=Boolean(committed&&committed.fingerprint===aiHistoryDatasetFingerprint(id,draws));
    const cacheOK=Boolean(cached&&cached.signature===historySummarySignature(id,draws));
    let summaries=committedOK?committed.summaries:(cacheOK?cached.summaries:null);
    let totals=summaries?AI_STANDARD_VISIBLE_ENGINES.map(k=>Number(summaries?.[k]?.total||0)):[];
    let ready=Boolean(summaries&&totals.every(n=>n>0)&&new Set(totals).size===1),standardCached=null;
    if(!ready&&draws.length){
      standardCached=readAIStandardProfileSummary(id,draws);
      if(standardCached?.ready){ summaries=standardCached.summaries; totals=AI_STANDARD_VISIBLE_ENGINES.map(k=>Number(summaries?.[k]?.total||0)); ready=totals.every(n=>n>0)&&new Set(totals).size===1; }
    }
    const sameDataset=Boolean(ready),lastDate=standardCached?.lastDate||(draws.length?String(draws[draws.length-1]?.date||'').slice(0,10):'');
    profiles.set(id,{id,draws,summaries,ready,sameDataset,lastDate,total:ready?totals[0]:0});
    if(!ready&&draws.length) scheduleAIStandardSummaryCacheBuild(id,draws,1500+id*180);
  }
  AI_STANDARD_SNAPSHOT_CACHE={signature,builtAt:now,profiles}; return AI_STANDARD_SNAPSHOT_CACHE;
}
function getAIStandardProfileSnapshot(profileId){
  const id=Number(profileId); return rebuildAIStandardSnapshotCache().profiles.get(id)||{id,draws:[],summaries:null,ready:false,sameDataset:false,lastDate:'',total:0};
}
function getMLSelectInsight(profileId,targetDate=getMLSelectTargetDate()){
  const snap=getAIStandardProfileSnapshot(profileId);
  const labels=AI_STANDARD_VISIBLE_LABELS;
  const summaries=snap.summaries||{};
  const ranked=AI_STANDARD_VISIBLE_ENGINES.filter(k=>Number(summaries?.[k]?.total||0)>0)
    .sort((a,b)=>Number(summaries?.[b]?.rate||0)-Number(summaries?.[a]?.rate||0)||Number(summaries?.[b]?.hit||0)-Number(summaries?.[a]?.hit||0)||AI_STANDARD_VISIBLE_ENGINES.indexOf(a)-AI_STANDARD_VISIBLE_ENGINES.indexOf(b));
  const first=ranked[0]||"x3", second=ranked[1]||null;
  const lead=second?Number(summaries?.[first]?.rate||0)-Number(summaries?.[second]?.rate||0):0;
  const validEdge=Boolean(snap.ready&&second);
  const level=!validEdge?'none':lead>=ML_SELECT_STRONG_MIN_PP?'strong':lead>=ML_SELECT_EDGE_MIN_PP?'edge':lead>=ML_SELECT_WATCH_MIN_PP?'watch':'none';
  const edge=level==='edge'||level==='strong', watch=level==='watch';
  const current={ready:snap.ready,leakPass:snap.sameDataset,examples:snap.total,trainedThrough:snap.lastDate,probabilities:Object.fromEntries(AI_STANDARD_VISIBLE_ENGINES.map(k=>[k,Number(summaries?.[k]?.rate||0)]))};
  return {current,labels,ranked,first,second,lead,edge,watch,level,label:labels[first]||"X3"};
}
// V7.20.66 — ML Insight UI was retired and merged into AI DECISION PRO.
// getMLSelectInsight() remains as a read-only hidden signal for the Pro quality score.
try{ localStorage.removeItem("luckyNumber_ml_render_v72032_x3_fast_auto"); }catch(_){}



// V7.20.36 — Pro Persistent Views Standard.
// AI + Analysis are cache-first across navigation AND cold launch. A view is regenerated
// only when canonical History/engine/formula/config data changes. UI timestamps are excluded.
const PRO_VIEW_SNAPSHOT_SCHEMA="V37-PRO-VIEW-AI-TREND";
const PRO_VIEW_SNAPSHOT_KEY="luckyNumber_pro_view_snapshots_v72036";
const PRO_DETAIL_SNAPSHOT_KEY="luckyNumber_pro_detail_snapshots_v72036";
let PRO_VIEW_STORE_MEMORY=null, PRO_VIEW_STORE_RAW="";
let PRO_DETAIL_STORE_MEMORY=null, PRO_DETAIL_STORE_RAW="";
function proHashRows(rows){ return p19HashText((rows||[]).join("|")); }
function proCanonicalDataFingerprint(){
  const draws=(state.actualDraws||[]).map(d=>`${Number(d?.profileId??0)}:${String(d?.date||"")}:${String(d?.number||"")}:${String(d?.twoDigit||"")}:${String(d?.id||"")}`);
  const tables=(state.dailyTables||[]).map(t=>`${Number(t?.profileId??0)}:${String(t?.date||"")}:${Array.isArray(t?.inputDigits)?t.inputDigits.join(""):String(t?.inputNumber||"")}:${String(t?.id||"")}`);
  const formulas=Object.entries(state.aiFormulaLab||{}).map(([id,v])=>`L${id}:${compactFormulaSignature(v?.formula)}`)
    .concat(Object.entries(state.aiGLFormulaLab||{}).map(([id,v])=>`G${id}:${compactFormulaSignature(v?.formula)}:${compactFormulaSignature(v?.parentAIFormula)}`));
  let historyEpoch="", aiEpoch="";
  try{ historyEpoch=localStorage.getItem(HISTORY_SUMMARY_CACHE_KEY)||""; }catch(_){}
  try{ aiEpoch=localStorage.getItem(AI_STANDARD_PROFILE_CACHE_KEY)||""; }catch(_){}
  const profiles=(state.profiles||[]).map((n,i)=>`${i}:${String(n||"")}`).join("|");
  return proHashRows([
    WF_ENGINE_VERSION,PATTERN_V19_ENGINE_SIGNATURE,X3_ENGINE_SIGNATURE,
    `D${draws.length}:${proHashRows(draws)}`,`T${tables.length}:${proHashRows(tables)}`,
    `F${proHashRows(formulas)}`,`P${p19HashText(profiles)}`,
    `H${p19HashText(historyEpoch)}`,`A${p19HashText(aiEpoch)}`
  ]);
}
function proViewSignature(view,profileId=state.activeProfile){
  const id=Number(profileId)||0, base=proCanonicalDataFingerprint();
  if(view==="weekly") return `${PRO_VIEW_SNAPSHOT_SCHEMA}|weekly|p${id}|${base}|order:${state.profileOrderMode||"default"}|mode:${getConfiguredFormulaMode(id)}|trend:${[7,14,30].includes(Number(state.aiTrendWindow))?Number(state.aiTrendWindow):7}`;
  const rc=getRankingConfig();
  return `${PRO_VIEW_SNAPSHOT_SCHEMA}|analysis|p${id}|${base}|sort:${state.analysisSortMode||"ai"}|order:${state.profileOrderMode||"default"}|win:${Number(state.analysisWinWindow)||30}|l:${Number(state.analysisLWindow)||30}|show:${state.analysisLShowAll?1:0}|rw:${rc.exactPoints},${rc.weight10},${rc.weight30},${rc.weightAll}`;
}
function readProStore(kind="view"){
  const key=kind==="detail"?PRO_DETAIL_SNAPSHOT_KEY:PRO_VIEW_SNAPSHOT_KEY;
  try{
    const raw=localStorage.getItem(key)||"{}";
    if(kind==="detail"){
      if(PRO_DETAIL_STORE_MEMORY && raw===PRO_DETAIL_STORE_RAW) return PRO_DETAIL_STORE_MEMORY;
      const parsed=JSON.parse(raw)||{}; PRO_DETAIL_STORE_RAW=raw; PRO_DETAIL_STORE_MEMORY=parsed; return parsed;
    }
    if(PRO_VIEW_STORE_MEMORY && raw===PRO_VIEW_STORE_RAW) return PRO_VIEW_STORE_MEMORY;
    const parsed=JSON.parse(raw)||{}; PRO_VIEW_STORE_RAW=raw; PRO_VIEW_STORE_MEMORY=parsed; return parsed;
  }catch(_){ return kind==="detail"?(PRO_DETAIL_STORE_MEMORY||{}):(PRO_VIEW_STORE_MEMORY||{}); }
}
function proStoreSlot(view,profileId=state.activeProfile){
  const id=Number(profileId)||0;
  if(view==="analysis") return `${view}:p${id}:w${Number(state.analysisWinWindow)||30}:s${state.analysisSortMode||"ai"}`;
  return `${view}:p${id}`;
}
function readPersistentProView(view,profileId=state.activeProfile){
  const slot=proStoreSlot(view,profileId), item=readProStore("view")?.[slot], signature=proViewSignature(view,profileId);
  return item?.schema===PRO_VIEW_SNAPSHOT_SCHEMA && item?.signature===signature && typeof item?.html==="string" ? item.html : null;
}
function persistProView(view,profileId,html){
  if(!html) return false;
  try{
    const all={...readProStore("view")}, slot=proStoreSlot(view,profileId), signature=proViewSignature(view,profileId);
    all[slot]={schema:PRO_VIEW_SNAPSHOT_SCHEMA,signature,updatedAt:Date.now(),html};
    // Bound storage: retain newest 30 view/profile variants only.
    const entries=Object.entries(all).sort((a,b)=>Number(b[1]?.updatedAt||0)-Number(a[1]?.updatedAt||0));
    const bounded=Object.fromEntries(entries.slice(0,30));
    const raw=JSON.stringify(bounded); localStorage.setItem(PRO_VIEW_SNAPSHOT_KEY,raw);
    PRO_VIEW_STORE_RAW=raw; PRO_VIEW_STORE_MEMORY=bounded; return true;
  }catch(_){ return false; }
}
function readPersistentProDetail(key,signature){
  const item=readProStore("detail")?.[key];
  return item?.schema===PRO_VIEW_SNAPSHOT_SCHEMA && item?.signature===signature && typeof item?.html==="string" ? item.html : null;
}
function persistProDetail(key,signature,html){
  if(!html) return false;
  try{
    const all={...readProStore("detail")}; all[key]={schema:PRO_VIEW_SNAPSHOT_SCHEMA,signature,updatedAt:Date.now(),html};
    const bounded=Object.fromEntries(Object.entries(all).sort((a,b)=>Number(b[1]?.updatedAt||0)-Number(a[1]?.updatedAt||0)).slice(0,36));
    const raw=JSON.stringify(bounded); localStorage.setItem(PRO_DETAIL_SNAPSHOT_KEY,raw);
    PRO_DETAIL_STORE_RAW=raw; PRO_DETAIL_STORE_MEMORY=bounded; return true;
  }catch(_){ return false; }
}

// V7.20.70 — PROFILE TREND RANKING PRO.
// Display tabs expose only 7D / 14D / 30D. The stabilizer behind the ranking
// uses strict-prior trusted evidence from 7/14/30/60/90 day windows.
// Today's result is excluded so the ranking cannot improve after the outcome is known.
const AI_PROFILE_TREND_WINDOWS=Object.freeze([7,14,30,60,90]);
const AI_PROFILE_TREND_WEIGHTS=Object.freeze({7:0.25,14:0.22,30:0.20,60:0.18,90:0.15});
// V7.20.73 — Daily Trend Snapshot Pro. Compute 7D/14D/30D once per day,
// persist it, and reuse instantly on every AI-page open. Today's results never rerank today's snapshot.
const AI_PROFILE_TREND_DAILY_KEY="lucky_ai_profile_trend_daily_v3_durable_prior";
const AI_PROFILE_TREND_IDB_PREFIX="ai-profile-trend-daily-v3-";
let AI_PROFILE_TREND_CACHE=new Map();
let AI_PROFILE_TREND_DURABLE_HYDRATE=null;
function aiProfileTrendIndexedKey(todayKey=isoDate()){ return `${AI_PROFILE_TREND_IDB_PREFIX}${todayKey}`; }
function validAIProfileTrendSnapshot(x,todayKey=isoDate()){
  return Boolean(x&&x.schema===3&&x.date===todayKey&&x.byFocus&&[7,14,30].every(d=>x.byFocus?.[d]));
}
function readAIProfileTrendDaily(todayKey=isoDate()){
  try{
    const raw=localStorage.getItem(AI_PROFILE_TREND_DAILY_KEY); if(!raw) return null;
    const x=JSON.parse(raw);
    if(!validAIProfileTrendSnapshot(x,todayKey)) return null;
    return x;
  }catch(_){return null;}
}
function mirrorAIProfileTrendDaily(snapshot){
  try{ localStorage.setItem(AI_PROFILE_TREND_DAILY_KEY,JSON.stringify(snapshot)); return true; }catch(_){ return false; }
}
async function writeAIProfileTrendDaily(todayKey,byFocus){
  const snapshot={schema:3,date:todayKey,createdAt:Date.now(),byFocus};
  const mirrorOk=mirrorAIProfileTrendDaily(snapshot);
  const indexedOk=await writeIndexedValue(aiProfileTrendIndexedKey(todayKey),snapshot);
  // Durable lock succeeds when either store committed. IndexedDB is authoritative;
  // localStorage is the synchronous first-paint mirror. Heal whichever side missed.
  if(indexedOk&&!mirrorOk) mirrorAIProfileTrendDaily(snapshot);
  return Boolean(indexedOk||mirrorOk);
}
function applyAIProfileTrendSnapshot(snap,todayKey=isoDate()){
  if(!validAIProfileTrendSnapshot(snap,todayKey)) return false;
  for(const focus of [7,14,30]) AI_PROFILE_TREND_CACHE.set(`${todayKey}|${focus}|daily`,snap.byFocus[focus]);
  return true;
}
function hydrateAIProfileTrendDaily(todayKey=isoDate()){
  return applyAIProfileTrendSnapshot(readAIProfileTrendDaily(todayKey),todayKey);
}
async function hydrateAIProfileTrendDurable(todayKey=isoDate()){
  if(hydrateAIProfileTrendDaily(todayKey)) return true;
  if(AI_PROFILE_TREND_DURABLE_HYDRATE) return AI_PROFILE_TREND_DURABLE_HYDRATE;
  AI_PROFILE_TREND_DURABLE_HYDRATE=(async()=>{
    try{
      const snap=await readIndexedValue(aiProfileTrendIndexedKey(todayKey));
      if(!applyAIProfileTrendSnapshot(snap,todayKey)) return false;
      mirrorAIProfileTrendDaily(snap); // self-heal fast mirror for the next cold iPhone launch
      if(state.currentView==="weekly"){
        requestAnimationFrame(()=>{ refreshAIProfileTrendPanel(); invalidateViewCache(); });
      }
      return true;
    }catch(_){ return false; }
    finally{ AI_PROFILE_TREND_DURABLE_HYDRATE=null; }
  })();
  return AI_PROFILE_TREND_DURABLE_HYDRATE;
}
function aiProfileTrendPriorSignature(todayKey=isoDate()){
  let h=2166136261>>>0,count=0;
  for(const d of (state.actualDraws||[])){
    const date=String(d?.date||"").slice(0,10);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>=todayKey||!/^\d{3}$/.test(String(d?.number||""))) continue;
    count++;
    const x=`${Number(d?.profileId??0)}|${date}|${String(d?.number||"")}|${Number(d?.updatedAt||d?.createdAt||0)}`;
    for(let i=0;i<x.length;i++){h^=x.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
  }
  return `${count}:${h.toString(36)}`;
}
function aiProfileTrendCacheKey(focusDays=7,todayKey=isoDate()){
  const focus=[7,14,30].includes(Number(focusDays))?Number(focusDays):7;
  return `${todayKey}|${focus}|${aiProfileTrendPriorSignature(todayKey)}`;
}
function getProfileTrendRanking(focusDays=7,todayKey=isoDate(),allowCompute=true){
  const focus=[7,14,30].includes(Number(focusDays))?Number(focusDays):7;
  const dailyKey=`${todayKey}|${focus}|daily`;
  if(AI_PROFILE_TREND_CACHE.has(dailyKey)) return AI_PROFILE_TREND_CACHE.get(dailyKey);
  if(hydrateAIProfileTrendDaily(todayKey)&&AI_PROFILE_TREND_CACHE.has(dailyKey)) return AI_PROFILE_TREND_CACHE.get(dailyKey);
  const key=aiProfileTrendCacheKey(focus,todayKey);
  if(AI_PROFILE_TREND_CACHE.has(key)) return AI_PROFILE_TREND_CACHE.get(key);
  if(!allowCompute) return null;
  const ranking=(state.profiles||[]).map((name,pid)=>{
    const base=getTrustedProfileConfidenceRows(pid);
    // V7.20.74 STRICT CALENDAR PRIOR: every trend window ends at yesterday.
    // A 7D score for date D is [D-7, D), never a rolling window anchored to the
    // profile's latest draw, and never includes any result dated D.
    const priorRows=(base?.rows||[]).filter(r=>String(r?.date||"")<todayKey);
    const windows={};
    let weighted=0,weightTotal=0;
    for(const days of AI_PROFILE_TREND_WINDOWS){
      const startDate=shiftIsoDate(todayKey,-Number(days));
      const sample=priorRows.filter(r=>String(r?.date||"")>=startDate&&String(r?.date||"")<todayKey);
      const hits=sample.reduce((sum,row)=>sum+(row?.hit?1:0),0);
      const w={score:sample.length?(hits*100)/sample.length:0,samples:sample.length,hits,trusted:true,startDate,endExclusive:todayKey};
      windows[days]=w;
      if(w.samples>0){const wt=Number(AI_PROFILE_TREND_WEIGHTS[days]||0);weighted+=w.score*wt;weightTotal+=wt;}
    }
    const focusStat=windows[focus]||{score:0,samples:0,hits:0};
    const stable=weightTotal?weighted/weightTotal:0;
    const trendScore=(focusStat.score*0.70)+(stable*0.30);
    return {profileId:pid,name:String(name||`Profile ${pid+1}`),focus,rate:focusStat.score,samples:focusStat.samples,hits:focusStat.hits,stable,trendScore,windows};
  }).filter(x=>x.samples>0)
    .sort((a,b)=>b.trendScore-a.trendScore||b.rate-a.rate||b.samples-a.samples||a.profileId-b.profileId);
  const out={focus,todayKey,items:ranking.slice(0,3),total:ranking.length,source:"trusted-strict-prior-only-7-14-30-60-90"};
  AI_PROFILE_TREND_CACHE.set(key,out);
  if(AI_PROFILE_TREND_CACHE.size>12){const first=AI_PROFILE_TREND_CACHE.keys().next().value;AI_PROFILE_TREND_CACHE.delete(first);}
  return out;
}
let AI_PROFILE_TREND_JOB=0;
function scheduleAIProfileTrendRanking(){
  if(state.currentView!=="weekly") return;
  const focus=[7,14,30].includes(Number(state.aiTrendWindow))?Number(state.aiTrendWindow):7,todayKey=isoDate();
  if(getProfileTrendRanking(focus,todayKey,false)) return;
  // Cold iPhone launch: try durable IndexedDB before any expensive rerank.
  if(!AI_PROFILE_TREND_DURABLE_HYDRATE){
    void hydrateAIProfileTrendDurable(todayKey).then(restored=>{
      if(restored&&state.currentView==="weekly") refreshAIProfileTrendPanel();
    });
  }
  const token=++AI_PROFILE_TREND_JOB;
  const run=async()=>{
    if(token!==AI_PROFILE_TREND_JOB) return;
    try{
      // IndexedDB may have restored the same-day snapshot while this idle task was queued.
      if(getProfileTrendRanking(focus,todayKey,false)) return;
      if(await hydrateAIProfileTrendDurable(todayKey)){
        refreshAIProfileTrendPanel();
        return;
      }
      // No durable snapshot exists: build all visible windows once, then lock them for the whole day.
      const byFocus={};
      for(const d of [7,14,30]) byFocus[d]=getProfileTrendRanking(d,todayKey,true);
      const durableOk=await writeAIProfileTrendDaily(todayKey,byFocus);
      if(!durableOk) throw new Error("AI Trend daily snapshot could not be persisted");
      for(const d of [7,14,30]) if(byFocus[d]) AI_PROFILE_TREND_CACHE.set(`${todayKey}|${d}|daily`,byFocus[d]);
      // Drop any transient weekly HTML cache created before the durable snapshot existed.
      invalidateViewCache();
    }catch(err){console.warn("AI Profile Trend unavailable",err);}
    if(token===AI_PROFILE_TREND_JOB&&state.currentView==="weekly"){
      refreshAIProfileTrendPanel();
      const main=document.querySelector("main.main");
      if(main&&!main.innerHTML.includes("กำลังจัดอันดับ")) rememberViewHtml("weekly",main.innerHTML);
    }
  };
  if("requestIdleCallback" in window) requestIdleCallback(run,{timeout:1400}); else setTimeout(run,80);
}

function aiProfileFlagEmoji(name=""){
  const n=String(name||"").toLowerCase();
  if(n.includes("thai")||n.includes("รัฐบาล")||n.includes("government")) return "🇹🇭";
  if(n.includes("china")) return "🇨🇳";
  if(n.includes("korea")) return "🇰🇷";
  if(n.includes("nikkei")||n.includes("japan")) return "🇯🇵";
  if(n.includes("malaysia")) return "🇲🇾";
  if(n.includes("dow")||n.includes("nasdaq")||n.includes("s&p")||n.includes("us ")) return "🇺🇸";
  if(n.includes("lao")) return "🇱🇦";
  if(n.includes("hanoi")||n.includes("ฮานอย")) return "🇻🇳";
  return "";
}
function aiTrendSparkline(windows={}){
  const order=[90,60,30,14,7],vals=order.map(d=>Number(windows?.[d]?.score||0));
  if(!vals.some(v=>v>0)) return "";
  const lo=Math.min(...vals),hi=Math.max(...vals),span=Math.max(1,hi-lo);
  const pts=vals.map((v,i)=>`${4+i*22},${26-((v-lo)/span)*18}`).join(" ");
  return `<svg class="ai-trend-spark" viewBox="0 0 96 32" role="img" aria-label="แนวโน้มย้อนหลัง"><polyline points="${pts}" fill="none" vector-effect="non-scaling-stroke"/><circle cx="92" cy="${26-((vals[4]-lo)/span)*18}" r="2.2"/></svg>`;
}

function getProfileTrendFallbackRanking(){
  try{
    if(typeof getCanonicalProfileAIRanking!=='function') return [];
    const ranking=getCanonicalProfileAIRanking(getProfileRankingUpdateMeta())||[];
    const ready=ranking.filter(x=>x?.evidenceReady);
    const pool=(ready.length?ready:ranking).slice(0,3);
    return pool.map((x,i)=>({
      profileId:Number(x.profileId),
      name:String(x.name||x.profileName||`Profile ${Number(x.profileId)+1}`),
      rank:i+1,
      rate:Math.round(Number(x.trustedRate||0)*10)/10,
      samples:Number(x.trustedSamples||x.samples||0),
      confidence:Number(x.confidence||0),
      trendLabel:String(x.trendLabel||''),
      source:'profile-ai-ranking-fallback'
    }));
  }catch(_){ return []; }
}
function renderProfileTrendRanking(){
  const focus=[7,14,30].includes(Number(state.aiTrendWindow))?Number(state.aiTrendWindow):7;
  const r=getProfileTrendRanking(focus,isoDate(),false);
  const fallback=(!r||!r.items.length)?getProfileTrendFallbackRanking():[];
  const body=!r && !fallback.length
    ? `<div class="ai-trend-empty ai-trend-loading">กำลังจัดอันดับ…</div>`
    : r && r.items.length
      ? r.items.map((x,i)=>{
          const rate=Math.round(Number(x.rate||0)*10)/10,flag=aiProfileFlagEmoji(x.name),spark=aiTrendSparkline(x.windows);
          return `<div class="ai-trend-row"><b class="ai-trend-rank">${i+1}</b><div class="ai-trend-flag" aria-hidden="true">${flag}</div><div class="ai-trend-main"><strong>${escapeHtml(x.name)}</strong><small>Win ${rate}% · ${Number(x.samples)||0} งวด</small></div><div class="ai-trend-visual">${spark}</div><strong class="ai-trend-rate">${rate}%</strong><span class="ai-trend-chevron" aria-hidden="true">›</span></div>`;
        }).join("")
      : fallback.length
        ? fallback.map((x,i)=>{
            const flag=aiProfileFlagEmoji(x.name);
            return `<div class="ai-trend-row ai-trend-row-fallback"><b class="ai-trend-rank">${i+1}</b><div class="ai-trend-flag" aria-hidden="true">${flag}</div><div class="ai-trend-main"><strong>${escapeHtml(x.name)}</strong><small>Trusted ${Number(x.samples)||0} งวด · Confidence ${Number(x.confidence)||0}</small></div><div class="ai-trend-visual"><span class="ai-trend-fallback-tag">Fallback</span></div><strong class="ai-trend-rate">${Math.round(Number(x.rate||0)*10)/10}%</strong><span class="ai-trend-chevron" aria-hidden="true">›</span></div>`;
          }).join("")
        : `<div class="ai-trend-empty">ยังไม่มี Trusted History ก่อนวันนี้เพียงพอ</div>`;
  const footNote=fallback.length && !(r&&r.items.length)
    ? `ⓘ ใช้ Profile AI Ranking ชั่วคราวเมื่อ Trend ยังไม่พอ`
    : `ⓘ คำนวณจากข้อมูลก่อนวันนี้เท่านั้น`;
  const footBadge=fallback.length && !(r&&r.items.length) ? `Ranking Fallback` : `Strict Prior-Only`;
  return `<section class="ai-profile-trend-card" aria-label="Profile Trend Pro"><div class="ai-profile-trend-head"><div><small>PROFILE TREND · PRO</small><h3>Best Profiles</h3></div><div class="ai-trend-tabs" role="tablist" aria-label="Profile Trend Ranking">${[7,14,30].map(d=>`<button type="button" data-ai-trend-window="${d}" class="${focus===d?'active':''}" aria-pressed="${focus===d}">${d}D</button>`).join("")}</div></div><div class="ai-trend-list">${body}</div><div class="ai-trend-foot"><span>${footNote}</span><b>${footBadge}</b></div></section>`;
}
function refreshAIProfileTrendPanel(){
  if(state.currentView!=="weekly") return false;
  const current=document.querySelector("main.main .ai-profile-trend-card");
  if(!current) return false;
  const tpl=document.createElement("template");tpl.innerHTML=renderProfileTrendRanking().trim();
  const next=tpl.content.firstElementChild;if(!next)return false;current.replaceWith(next);bindAITrendControls(next);return true;
}
function bindAITrendControls(root=document){
  root.querySelectorAll?.("[data-ai-trend-window]").forEach(btn=>btn.addEventListener("click",()=>{
    const days=Number(btn.dataset.aiTrendWindow);if(![7,14,30].includes(days)||days===Number(state.aiTrendWindow))return;
    state.aiTrendWindow=days;AI_PROFILE_TREND_JOB++;saveUiStateFast();if(!refreshAIUnifiedFinalPro())refreshAIProfileTrendPanel();scheduleAIProfileTrendRanking();
  }));
  if(state.currentView==="weekly"&&(root.querySelector?.(".ai-profile-trend-card")||root.querySelector?.(".ai-final-pro"))) scheduleAIProfileTrendRanking();
}


function getAIPagePickSource(){
  try{
    const locked=(getDailyAISelectTop3()?.items||[]).map(x=>({
      profileId:Number(x?.profileId),
      profileName:String(x?.profileName||state?.profiles?.[Number(x?.profileId)]||`Profile ${Number(x?.profileId)+1}`),
      confidence:Number(x?.confidence||x?.score||0),
      source:'AI Decision'
    })).filter(x=>Number.isFinite(x.profileId)).slice(0,3);
    if(locked.length) return {source:'AI Decision',items:locked};
  }catch(_){ }
  try{
    if(typeof getCanonicalProfileAIRanking!=='function') return {source:'NONE',items:[]};
    const ranking=getCanonicalProfileAIRanking(getProfileRankingUpdateMeta())||[];
    const ready=ranking.filter(x=>Number.isFinite(Number(x?.profileId))&&x?.evidenceReady);
    const pool=(ready.length?ready:ranking).filter(x=>Number.isFinite(Number(x?.profileId))).slice(0,3).map(x=>({
      profileId:Number(x.profileId),
      profileName:String(x.name||x.profileName||state?.profiles?.[Number(x.profileId)]||`Profile ${Number(x.profileId)+1}`),
      confidence:Number(x.confidence||0),
      trustedRate:Number(x.trustedRate||0),
      source:'Profile AI Ranking'
    }));
    return {source:pool.length?'Profile AI Ranking':'NONE',items:pool};
  }catch(_){ return {source:'NONE',items:[]}; }
}
function getLatestAIPickTable(profileId,targetDate=isoDate()){
  try{
    const rows=(state?.dailyTables||[]).filter(t=>Number(t?.profileId)===Number(profileId)&&String(t?.date||'').slice(0,10)<targetDate&&Array.isArray(t?.inputDigits)&&t.inputDigits.length===5)
      .sort((a,b)=>String(b?.date||'').localeCompare(String(a?.date||''))||Number(b?.createdAt||0)-Number(a?.createdAt||0));
    return rows[0]||null;
  }catch(_){ return null; }
}
function buildQuickX3Pool(profileId,targetDate=isoDate()){
  try{
    const table=getLatestAIPickTable(profileId,targetDate); if(!table) return null;
    const inputs=(table.inputDigits||[]).map(String);
    const grid=table.grid||formulaGrid(inputs,getOriginalFormula());
    if(!grid||typeof buildX3Candidates!=='function') return null;
    const pack=buildX3Candidates(grid,Number(profileId),targetDate,inputs,false);
    const seen=new Set(),items=[];
    for(const raw of (pack?.items||[])){
      const number=canonical3(String(raw?.number||''));
      if(!/^\d{3}$/.test(number)||seen.has(number)) continue;
      seen.add(number);
      items.push({number,source:String(raw?.patternX3Source||raw?.source||'X3'),rank:items.length+1});
      if(items.length>=7) break;
    }
    return items.length?{items,tableDate:String(table?.date||'').slice(0,10)}:null;
  }catch(err){ console.warn('AI Pick quick pool error',err); return null; }
}
function settleQuickPickStatus(profileId,pick,targetDate=isoDate()){
  try{
    const draw=(state?.actualDraws||[]).find(d=>Number(d?.profileId)===Number(profileId)&&String(d?.date||'').slice(0,10)===targetDate&&/^\d{3}$/.test(String(d?.number||'')));
    if(!draw) return 'WAITING';
    return canonical3(String(draw.number||''))===canonical3(String(pick||''))?'HIT':'MISS';
  }catch(_){ return 'WAITING'; }
}
function quickPickStatusMeta(status){
  return status==='HIT'?['HIT','hit']:status==='MISS'?['MISS','miss']:['WAITING','pending'];
}
function buildQuickPickRows(targetDate=isoDate()){
  const src=getAIPagePickSource();
  return (src.items||[]).map((item,index)=>{
    const pool=buildQuickX3Pool(item.profileId,targetDate);
    if(!pool||!pool.items?.length) return {profileId:item.profileId,profileName:item.profileName,pick:'',x3Rank:0,confidence:0,status:'NO_DATA',note:'NO X3'};
    const top=pool.items[0];
    const baseConfidence=Number(item.confidence||0);
    const confidence=Math.max(45,Math.min(89,Math.round((baseConfidence*0.45)+(72-(index*3))+(8-Math.min(7,Number(top.rank||7))))));
    const status=settleQuickPickStatus(item.profileId,top.number,targetDate);
    return {profileId:item.profileId,profileName:item.profileName,pick:top.number,x3Rank:Number(top.rank||0),confidence,status,sourceLabel:src.source,poolSource:top.source};
  }).filter(Boolean);
}
function renderAIQuickPickCard(){
  const src=getAIPagePickSource();
  const rows=buildQuickPickRows(isoDate());
  const headTag=src.source==='AI Decision'?'AI Decision':src.source==='Profile AI Ranking'?'Profile AI Ranking':'No Source';
  if(!src.items.length){
    return `<section class="ai-pick-pro-card" aria-label="AI Pick Pro Rebuilt"><div class="ai-pick-head"><div><small>AI PICK · TEST</small><h3>X3 Candidate Pick</h3></div><span>${escapeHtml(headTag)}</span></div><div class="ai-pick-loading">ยังไม่มี Profile ที่พร้อมให้ AI Pick ในตอนนี้</div><div class="ai-pick-foot">เลือก 1 ชุดจาก X3 เท่านั้น · ไม่เปลี่ยน Top 3/5/7 · Strict Prior-Only</div></section>`;
  }
  if(!rows.length || rows.every(r=>!r.pick)){
    return `<section class="ai-pick-pro-card" aria-label="AI Pick Pro Rebuilt"><div class="ai-pick-head"><div><small>AI PICK · TEST</small><h3>X3 Candidate Pick</h3></div><span>${escapeHtml(headTag)}</span></div><div class="ai-pick-loading">ยังไม่พบ X3 Candidate ที่พร้อมใช้งานสำหรับ Profile ที่เลือก</div><div class="ai-pick-foot">เลือก 1 ชุดจาก X3 เท่านั้น · ไม่เปลี่ยน Top 3/5/7 · Strict Prior-Only</div></section>`;
  }
  const body=rows.map(x=>{
    const [label,tone]=quickPickStatusMeta(x.status);
    return `<div class="ai-pick-row"><div><small>${escapeHtml(x.profileName)}</small><strong>${escapeHtml(x.pick||'—')}</strong></div><div class="ai-pick-meta"><span>X3 #${Number(x.x3Rank)||'—'}</span><span>AI Score ${Number(x.confidence)||0}</span></div><b class="ai-pick-status ${tone}">${label}</b></div>`;
  }).join('');
  return `<section class="ai-pick-pro-card" aria-label="AI Pick Pro Rebuilt"><div class="ai-pick-head"><div><small>AI PICK · TEST</small><h3>X3 Candidate Pick</h3></div><span>${escapeHtml(headTag)}</span></div>${body}<div class="ai-pick-foot">เลือก 1 ชุดจาก X3 เท่านั้น · ไม่เปลี่ยน Top 3/5/7 · Strict Prior-Only</div></section>`;
}

function getAIUnifiedTrendRows(){
  const focus=[7,14,30].includes(Number(state.aiTrendWindow))?Number(state.aiTrendWindow):7;
  const strict=getProfileTrendRanking(focus,isoDate(),false);
  if(strict?.items?.length){
    return {focus,source:'Strict Prior-Only',fallback:false,items:strict.items.slice(0,3).map((x,i)=>({
      rank:i+1,profileId:Number(x.profileId),name:String(x.name||''),rate:Math.round(Number(x.rate||0)*10)/10,
      samples:Number(x.samples||0),confidence:0,windows:x.windows||{}
    }))};
  }
  const fallback=getProfileTrendFallbackRanking();
  return {focus,source:fallback.length?'Profile AI Ranking':'No Data',fallback:Boolean(fallback.length),items:fallback.slice(0,3)};
}
function getAIUnifiedModel(){
  const decision=getDailyAISelectTop3();
  const decisionItems=Array.isArray(decision?.items)?decision.items:[];
  const pickSource=getAIPagePickSource();
  const picks=buildQuickPickRows(isoDate()).filter(x=>x?.pick);
  const trend=getAIUnifiedTrendRows();
  const finalPick=[...picks].sort((a,b)=>Number(b.confidence||0)-Number(a.confidence||0)||Number(a.x3Rank||99)-Number(b.x3Rank||99)||Number(a.profileId||0)-Number(b.profileId||0))[0]||null;
  const mode=decisionItems.length?'AI DECISION':(pickSource.source==='Profile AI Ranking'?'RANKING FALLBACK':'WAIT');
  const ready=Boolean(finalPick);
  return {decision,decisionItems,pickSource,picks,trend,finalPick,mode,ready};
}
function renderAIUnifiedDecisionBlock(model){
  const d=model.decision||{},items=model.decisionItems||[];
  const title=items.length?`Top ${items.length} · ${escapeHtml(d.dayLabel||'')}`:`NO SELECT · ${escapeHtml(d.dayLabel||'THU')}`;
  const body=items.length
    ? `<div class="ai-final-mini-list">${items.map((x,i)=>`<div class="ai-final-mini-row"><b>${i+1}</b><span>${escapeHtml(x.profileName||state.profiles?.[Number(x.profileId)]||'Profile')}</span><strong>${escapeHtml(x.label||'AI')}</strong></div>`).join('')}</div>`
    : `<div class="ai-final-no-select"><strong>NO SELECT</strong><span>ระบบยังไม่บังคับเลือกเมื่อสัญญาณไม่ถึงเกณฑ์</span></div>`;
  return `<div class="ai-final-section ai-final-decision"><div class="ai-final-section-head"><div><small>STEP 1</small><h4>AI Decision</h4></div><span>${escapeHtml(items.length?'SELECT':'NO SELECT')}</span></div><div class="ai-final-decision-title">${title}</div>${body}</div>`;
}
function renderAIUnifiedPickBlock(model){
  const finalPick=model.finalPick;
  const source=escapeHtml(model.pickSource?.source||'NONE');
  if(!finalPick){
    return `<div class="ai-final-section ai-final-pick"><div class="ai-final-section-head"><div><small>STEP 2</small><h4>X3 AI Pick</h4></div><span>${source}</span></div><div class="ai-final-empty">ยังไม่มี X3 Candidate ที่พร้อมใช้งานในตอนนี้</div></div>`;
  }
  const rows=(model.picks||[]).map(x=>{const [label,tone]=quickPickStatusMeta(x.status);return `<div class="ai-final-pick-row ${Number(x.profileId)===Number(finalPick.profileId)?'primary':''}"><div><small>${escapeHtml(x.profileName)}</small><strong>${escapeHtml(x.pick)}</strong></div><div class="ai-final-pick-meta"><span>X3 #${Number(x.x3Rank)||'—'}</span><span>Score ${Number(x.confidence)||0}</span></div><b class="ai-pick-status ${tone}">${label}</b></div>`;}).join('');
  return `<div class="ai-final-section ai-final-pick"><div class="ai-final-section-head"><div><small>STEP 2</small><h4>X3 AI Pick</h4></div><span>${source}</span></div><div class="ai-final-primary"><div><small>FINAL PICK</small><strong>${escapeHtml(finalPick.pick)}</strong><span>${escapeHtml(finalPick.profileName)} · X3 #${Number(finalPick.x3Rank)||'—'}</span></div><b>${Number(finalPick.confidence)||0}</b></div><div class="ai-final-pick-list">${rows}</div></div>`;
}
function renderAIUnifiedTrendBlock(model){
  const t=model.trend||{focus:7,items:[]};
  const tabs=`<div class="ai-final-trend-tabs">${[7,14,30].map(d=>`<button type="button" data-ai-trend-window="${d}" class="${Number(t.focus)===d?'active':''}" aria-pressed="${Number(t.focus)===d}">${d}D</button>`).join('')}</div>`;
  const rows=t.items?.length?t.items.map((x,i)=>{const flag=aiProfileFlagEmoji(x.name);return `<div class="ai-final-trend-row"><b>${i+1}</b><span class="ai-final-trend-flag">${flag}</span><div><strong>${escapeHtml(x.name)}</strong><small>${t.fallback?`Trusted ${Number(x.samples)||0} งวด · Confidence ${Number(x.confidence)||0}`:`Win ${Math.round(Number(x.rate||0)*10)/10}% · ${Number(x.samples)||0} งวด`}</small></div><em>${Math.round(Number(x.rate||0)*10)/10}%</em></div>`;}).join(''):`<div class="ai-final-empty">ยังไม่มี Trusted History ก่อนวันนี้เพียงพอ</div>`;
  return `<div class="ai-final-section ai-final-trend"><div class="ai-final-section-head"><div><small>STEP 3</small><h4>Best Profiles</h4></div>${tabs}</div>${rows}<div class="ai-final-trend-foot"><span>${t.fallback?'ใช้ Profile AI Ranking ชั่วคราว':'คำนวณจากข้อมูลก่อนวันนี้เท่านั้น'}</span><b>${escapeHtml(t.source||'Strict Prior-Only')}</b></div></div>`;
}
function renderAIUnifiedFinalPro(){
  const model=getAIUnifiedModel();
  const status=model.ready?'READY':(model.pickSource?.items?.length?'WAIT X3':'WAIT DATA');
  const tone=model.ready?'ready':status==='WAIT X3'?'watch':'idle';
  return `<section class="ai-final-pro ${tone}" aria-label="AI Unified Final Pro"><div class="ai-final-head"><div><small>AI SYSTEM · FINAL PRO</small><h3>Decision → Pick → Trend</h3></div><span>${status}</span></div><div class="ai-final-summary"><span>Source</span><strong>${escapeHtml(model.mode)}</strong><i>•</i><span>Strict Prior-Only</span><i>•</i><span>X3 Top 3/5/7 ไม่เปลี่ยน</span></div>${renderAIUnifiedDecisionBlock(model)}${renderAIUnifiedPickBlock(model)}${renderAIUnifiedTrendBlock(model)}</section>`;
}
function refreshAIUnifiedFinalPro(){
  if(state.currentView!=="weekly") return false;
  const current=document.querySelector('main.main .ai-final-pro');
  if(!current) return false;
  const tpl=document.createElement('template');tpl.innerHTML=renderAIUnifiedFinalPro().trim();
  const next=tpl.content.firstElementChild;if(!next)return false;current.replaceWith(next);bindAITrendControls(next);return true;
}
function renderWeekly(){
  return renderWeeklyFresh();
}


function renderWeeklyFresh() {
  const profileId=Number(state.activeProfile), samples=getFormulaSamples(profileId);
  return `<section class="card ai-lab ux-page-card">
    <div class="ux-page-head"><div><small>AI CENTER</small></div><span class="ux-count-pill">${samples.length} งวด</span></div>
    ${profileTabs()}
    ${renderAIUnifiedFinalPro()}
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

// V7.19.14 — Persistent P18 historical status cache.
// P18 historical scoring is expensive but deterministic for a fixed History source.
// Keep it separate from generic UI/performance caches so Calculator typing, tab changes,
// theme changes, and profile UI state cannot force a full P18 recomputation.
const P18_HISTORY_CACHE_KEY = "luckyNumber_p18_history_cache_v71912";
const P18_HISTORY_STATUS_CACHE = new Map();
let p18HistoryCacheLoaded = false;
let p18HistoryCacheFlushTimer = null;
function p18HistorySourceSignature(){
  let h=2166136261>>>0, count=0;
  const mix=(text)=>{ const str=String(text||""); for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } };
  for(const d of (state.actualDraws||[])){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(d?.date||""))) continue;
    count++; mix(`${d?.profileId??0}|${d?.date||""}|${d?.number||""}|${d?.twoDigit||""}|${d?.updatedAt||d?.createdAt||""}`);
  }
  for(const t of (state.dailyTables||[])){
    count++; const digits=Array.isArray(t?.inputDigits)?t.inputDigits.join(""):(Array.isArray(t?.inputs)?t.inputs.join(""):"");
    mix(`${t?.profileId??0}|${t?.date||""}|${digits}|${t?.updatedAt||t?.createdAt||""}`);
  }
  return `${WF_ENGINE_VERSION}|${count}|${h.toString(36)}`;
}
function loadP18HistoryCache(){
  if(p18HistoryCacheLoaded) return; p18HistoryCacheLoaded=true;
  try{
    const raw=JSON.parse(localStorage.getItem(P18_HISTORY_CACHE_KEY)||"null");
    if(raw?.source===p18HistorySourceSignature() && raw?.items && typeof raw.items==="object") {
      Object.entries(raw.items).forEach(([k,v])=>{ if(["exact","reversed","notfound","pending"].includes(v)) P18_HISTORY_STATUS_CACHE.set(k,v); });
    }
  }catch(_){}
}
function scheduleP18HistoryCacheFlush(){
  clearTimeout(p18HistoryCacheFlushTimer);
  p18HistoryCacheFlushTimer=setTimeout(async()=>{
    try{
      await waitForForegroundIdle(900);
      const items=Object.fromEntries(P18_HISTORY_STATUS_CACHE);
      localStorage.setItem(P18_HISTORY_CACHE_KEY,JSON.stringify({source:p18HistorySourceSignature(),items}));
    }catch(_){}
  },1300);
}
function p18HistoryStatusKey(draw,id,table){
  const digits=Array.isArray(table?.inputDigits)?table.inputDigits.join(""):"";
  return `P18S|${Number(id)}|${draw?.id??""}|${draw?.date||""}|${draw?.number||""}|${draw?.updatedAt||draw?.createdAt||""}|${digits}`;
}

// V7.18.01 — History P18 display.
// P18 is evaluated per historical draw with the draw date as targetDate,
// so the V7/P18 selector can only consume prior rows (Strict Prior-only).
function patternV18HistoryStatus(draw, profileId = state.activeProfile) {
  if (!draw || !/^\d{3}$/.test(String(draw.number || ""))) return "pending";
  const id=Number(profileId);
  // V7.20.18: P18 shares the exact trusted row lifecycle with CLS/AIL/GL.
  // If the row is not Verified Live or strict WF yet, every AI stays pending together.
  const trustedRow = getHistoryComparisonStatuses(draw, id);
  if (!trustedRow?.trusted) return "pending";
  const table = trustedRow.table || getPredictionTable(id, draw.date, draw);
  loadP18HistoryCache();
  const cacheKey=p18HistoryStatusKey(draw,id,table);
  if(P18_HISTORY_STATUS_CACHE.has(cacheKey)) return P18_HISTORY_STATUS_CACHE.get(cacheKey);
  if(PERF_CACHE.patternV18Status.has(cacheKey)) return PERF_CACHE.patternV18Status.get(cacheKey);
  const inputs = table?.inputDigits;
  let status="pending";
  if (Array.isArray(inputs) && inputs.length === 5 && !inputs.some(v => !/^\d$/.test(String(v)))) {
    const classicGrid = formulaGrid(inputs.map(String), getOriginalFormula());
    if (classicGrid) {
      const prediction = buildPatternV18Candidates(classicGrid, id, String(draw.date || ""));
      const items = Array.isArray(prediction?.items) ? prediction.items : [];
      const actual = String(draw.number), canonical = canonical3(actual);
      status = items.some(x => String(x?.number ?? "") === actual) ? "exact"
        : items.some(x => canonical3(String(x?.number ?? "")) === canonical) ? "reversed" : "notfound";
    }
  }
  PERF_CACHE.patternV18Status.set(cacheKey,status);
  P18_HISTORY_STATUS_CACHE.set(cacheKey,status);
  scheduleP18HistoryCacheFlush();
  return status;
}

function patternV18TrustedHistorySummary(draws, profileId = state.activeProfile, statusMap = null) {
  const id=Number(profileId), list=Array.isArray(draws)?draws:[];
  const summaryKey=`P18SUM|${id}|${drawListPerformanceKey(list)}|${list.map(d=>`${d?.date||""}:${d?.number||""}:${d?.updatedAt||d?.createdAt||""}`).join(",")}`;
  if(!statusMap && PERF_CACHE.patternV18Summary.has(summaryKey)) return PERF_CACHE.patternV18Summary.get(summaryKey);
  let hit = 0, total = 0;
  for (const draw of list) {
    const key = String(draw?.id ?? `${draw?.date || ""}|${draw?.number || ""}`);
    const status = statusMap?.get(key) || patternV18HistoryStatus(draw, id);
    if (status === "pending") continue;
    total++;
    if (status === "exact" || status === "reversed") hit++;
  }
  const out={hit,total,rate:total?Math.round(hit*1000/total)/10:0};
  if(!statusMap) PERF_CACHE.patternV18Summary.set(summaryKey,out);
  return out;
}

function buildHistoryChampionSummary(originalSummary, aiSummary,glSummary, independentSummary, p18Summary, p19Summary, x3Summary, masterSummary) {
  const candidates = [
    { key:"original", label:"Classic", summary:originalSummary },
    ...(aiSummary ? [{ key:"ai", label:"AI L", summary:aiSummary }] : []),
    ...(glSummary?.total?[{key:"gl",label:"AI GL",summary:glSummary}]:[]),
    ...(p18Summary?.total ? [{ key:"p18", label:"P18", summary:p18Summary }] : []),
    ...(p19Summary?.total ? [{ key:"p19", label:"P19", summary:p19Summary }] : []),
    ...(x3Summary?.total ? [{ key:"x3", label:"X3", summary:x3Summary }] : []),
    ...(!MASTER_AI_PAUSED && masterSummary?.total ? [{ key:"master", label:"Master AI", summary:masterSummary }] : [])
  ].filter(x => x.summary && Number(x.summary.total || 0) > 0);
  if (!candidates.length) return { winner:null, items:[] };
  const bestRate = Math.max(...candidates.map(x => Number(x.summary.rate || 0)), 0.1);
  const maxTotal = Math.max(...candidates.map(x => Number(x.summary.total || 0)), 1);
  const items = candidates.map(x => {
    const accuracyPart = (Number(x.summary.rate || 0) / bestRate) * 80;
    const coveragePart = (Number(x.summary.total || 0) / maxTotal) * 20;
    return { ...x, championScore:Math.round(Math.min(100, accuracyPart + coveragePart)) };
  }).sort((a,b) => Number(b.summary.rate||0) - Number(a.summary.rate||0)
    || Number(b.championScore||0) - Number(a.championScore||0)
    || Number(b.summary.total||0) - Number(a.summary.total||0)
    || trustedChampionPriority(a.key) - trustedChampionPriority(b.key));
  return { winner:items[0] || null, items };
}

function getHistoryChampionForProfile(profileId = state.activeProfile) {
  const selectedProfile = Number(profileId);
  const draws = (state.actualDraws || []).filter(d => Number(d.profileId ?? 0) === selectedProfile);
  const originalSummary = trustedHistorySummary(draws, selectedProfile, "classic");
  const aiSummary = trustedHistorySummary(draws, selectedProfile, "aiL");
  const glSummary=trustedHistorySummary(draws,selectedProfile,"gl");
  const independentSummary = null; // V7.19.25: removed from History scoring/display.
  const p18Summary = patternV18TrustedHistorySummary(draws, selectedProfile);
  const masterSummary = MASTER_AI_PAUSED ? null : trustedHistorySummary(draws, selectedProfile, "master");
  const p19Summary = patternV19TrustedHistorySummary(draws, selectedProfile);
  const x3Summary = x3TrustedHistorySummary(draws, selectedProfile);
  return buildHistoryChampionSummary(originalSummary, aiSummary,glSummary, independentSummary, p18Summary, p19Summary, x3Summary, masterSummary);
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

// V7.20.66 — AI DECISION PRO. Quality Gate + hidden ML Edge support; minimal Win/Repeat UI.
// Ranking uses only completed Trusted rows (Verified Live / strict prior-only WF).
// One best model is retained per Profile so the Top 3 are useful alternatives rather than
// three models from the same Profile. Rebuild occurs only when day or History signature changes.
const AI_SELECT_TOP3_CACHE_KEY="luckyNumber_ai_decision_pro_daily_lock_v72074_strict_prior";
const AI_SELECT_MIN_WEEKDAY_SAMPLES=8;
const AI_SELECT_PRO_MIN_WIN_RATE=0.30;
const AI_SELECT_PRO_MIN_RECENT_RATE=0.25;
const AI_SELECT_PRO_MIN_SCORE=0.44;
const AI_SELECT_PRO_MAX_MISS_STREAK=2;
const AI_SELECT_ENGINES=Object.freeze(["x3","p19","p18","gl","aiL","classic"]);
const AI_SELECT_LABELS=Object.freeze({x3:"X3",p19:"P19",p18:"P18",gl:"AI GL",aiL:"AI L",classic:"Classic"});
function aiSelectLocalDateKey(now=new Date()){
  const y=now.getFullYear(),m=String(now.getMonth()+1).padStart(2,"0"),d=String(now.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}
function aiSelectDayLabel(day){return ["SUN","MON","TUE","WED","THU","FRI","SAT"][Number(day)]||"DAY";}
function aiSelectHistorySignature(){
  const rows=state.actualDraws||[]; let h=2166136261>>>0,count=0;
  for(const d of rows){
    if(!/^\d{3}$/.test(String(d?.number||""))) continue; count++;
    const x=`${Number(d?.profileId??0)}|${String(d?.date||"")}|${String(d?.number||"")}|${String(d?.twoDigit||"")}|${Number(d?.updatedAt||d?.createdAt||0)}`;
    for(let i=0;i<x.length;i++){h^=x.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
  }
  return `${count}:${h.toString(36)}`;
}
const AI_SELECT_TOP3_IDB_PREFIX="ai-select-top3-daily-v1-";
let AI_SELECT_TOP3_DURABLE_HYDRATE=null;
function aiSelectTop3IndexedKey(date=aiSelectLocalDateKey()){ return `${AI_SELECT_TOP3_IDB_PREFIX}${date}`; }
function validAISelectTop3Cache(v,date=aiSelectLocalDateKey()){
  return Boolean(v&&v.date===date&&Array.isArray(v?.decision?.items));
}
function readAISelectTop3Cache(){try{return JSON.parse(localStorage.getItem(AI_SELECT_TOP3_CACHE_KEY)||"null");}catch(_){return null;}}
function mirrorAISelectTop3Cache(v){try{localStorage.setItem(AI_SELECT_TOP3_CACHE_KEY,JSON.stringify(v));return true;}catch(_){return false;}}
function writeAISelectTop3Cache(v){
  const mirrorOk=mirrorAISelectTop3Cache(v);
  const date=String(v?.date||"");
  if(date&&validAISelectTop3Cache(v,date)){
    // V7.20.86r: localStorage is the instant mirror; IndexedDB is the durable authority.
    // Do not make normal UI writes await IDB, but heal the mirror if the durable write succeeds.
    void writeIndexedValue(aiSelectTop3IndexedKey(date),v).then(ok=>{ if(ok&&!mirrorOk) mirrorAISelectTop3Cache(v); }).catch(()=>{});
  }
  return v;
}
async function hydrateAISelectTop3Durable(date=aiSelectLocalDateKey()){
  const local=readAISelectTop3Cache();
  if(validAISelectTop3Cache(local,date)) return local;
  if(AI_SELECT_TOP3_DURABLE_HYDRATE) return AI_SELECT_TOP3_DURABLE_HYDRATE;
  AI_SELECT_TOP3_DURABLE_HYDRATE=(async()=>{
    try{
      const snap=await readIndexedValue(aiSelectTop3IndexedKey(date));
      if(!validAISelectTop3Cache(snap,date)) return null;
      mirrorAISelectTop3Cache(snap);
      return snap;
    }catch(_){ return null; }
    finally{ AI_SELECT_TOP3_DURABLE_HYDRATE=null; }
  })();
  return AI_SELECT_TOP3_DURABLE_HYDRATE;
}
function aiSelectStatusHit(st){return st==="exact"||st==="reversed";}
// V7.20.69 DAILY LOCK PRO — today's draw is NEVER allowed into today's selection score.
// This makes the first build reproducible even if the app is opened after today's result was imported.
function buildAISelectTop3(today=new Date()){
  const targetDay=today.getDay(),todayKey=aiSelectLocalDateKey(today),perProfile=[];
  for(let pid=0;pid<(state.profiles||[]).length;pid++){
    try{restoreUnifiedAIProfileSync(pid);}catch(_){}
    const allProfileDraws=(state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===pid&&/^\d{3}$/.test(String(d?.number||"")));
    const draws=allProfileDraws
      .filter(d=>String(d?.date||"")<todayKey)
      .filter(d=>{const dt=new Date(`${String(d?.date||"")}T12:00:00`);return !Number.isNaN(dt.getTime())&&dt.getDay()===targetDay;})
      .sort((a,b)=>String(a?.date||"").localeCompare(String(b?.date||"")));
    if(!draws.length) continue;
    // V7.20.74: hidden support signal must obey the same target-date boundary.
    // Build it only from trusted rows whose result date is strictly before today.
    let mlInsight=null;
    try{
      const priorForInsight=allProfileDraws.filter(d=>String(d?.date||"")<todayKey).sort((a,b)=>String(a?.date||"").localeCompare(String(b?.date||"")));
      const totals=Object.fromEntries(AI_STANDARD_VISIBLE_ENGINES.map(k=>[k,{hit:0,total:0,rate:0}]));
      for(const draw of priorForInsight){
        const row=getUnifiedAIHistoryStatuses(draw,pid); if(!row?.trusted) continue;
        for(const k of AI_STANDARD_VISIBLE_ENGINES){
          const st=row?.[k]||row?.engineStatuses?.[k]||"pending"; if(st==="pending") continue;
          totals[k].total++; if(aiSelectStatusHit(st)) totals[k].hit++;
        }
      }
      for(const k of AI_STANDARD_VISIBLE_ENGINES) totals[k].rate=totals[k].total?(totals[k].hit*100/totals[k].total):0;
      const ranked=AI_STANDARD_VISIBLE_ENGINES.filter(k=>totals[k].total>0).sort((a,b)=>totals[b].rate-totals[a].rate||totals[b].hit-totals[a].hit||AI_STANDARD_VISIBLE_ENGINES.indexOf(a)-AI_STANDARD_VISIBLE_ENGINES.indexOf(b));
      const first=ranked[0]||"x3",second=ranked[1]||null,lead=second?(totals[first].rate-totals[second].rate):0;
      const level=!second?"none":lead>=ML_SELECT_STRONG_MIN_PP?"strong":lead>=ML_SELECT_EDGE_MIN_PP?"edge":lead>=ML_SELECT_WATCH_MIN_PP?"watch":"none";
      mlInsight={first,second,lead,level,current:{ready:Boolean(ranked.length),leakPass:priorForInsight.every(d=>String(d?.date||"")<todayKey),trainedThrough:priorForInsight.at(-1)?.date||""}};
    }catch(_){ mlInsight=null; }
    let best=null;
    for(const engine of AI_SELECT_ENGINES){
      let hit=0,total=0;const recent=[];
      for(const draw of draws){
        const row=getUnifiedAIHistoryStatuses(draw,pid);
        if(!row?.trusted) continue;
        const st=row?.[engine]||row?.engineStatuses?.[engine]||"pending";
        if(st==="pending") continue;
        const win=aiSelectStatusHit(st)?1:0;hit+=win;total++;recent.push(win);
      }
      if(!total) continue;
      const r8=recent.slice(-8),recentRate=r8.length?r8.reduce((a,b)=>a+b,0)/r8.length:0;
      const winRate=hit/total,posterior=(hit+2)/(total+4),evidence=Math.min(1,total/AI_SELECT_MIN_WEEKDAY_SAMPLES);
      let currentWinStreak=0,currentMissStreak=0;
      for(let i=recent.length-1;i>=0&&recent[i]===1;i--) currentWinStreak++;
      for(let i=recent.length-1;i>=0&&recent[i]===0;i--) currentMissStreak++;
      let repeatWins=0,repeatOpportunities=0;
      for(let i=0;i<recent.length-1;i++) if(recent[i]===1){repeatOpportunities++;if(recent[i+1]===1)repeatWins++;}
      const repeatRate=repeatOpportunities?repeatWins/repeatOpportunities:0;
      const streakScore=Math.min(1,currentWinStreak/3);
      const baseScore=(posterior*.40)+(evidence*.25)+(recentRate*.15)+(streakScore*.10)+(repeatRate*.10);
      let mlSupport=0;
      if(mlInsight?.current?.ready && mlInsight?.current?.leakPass && mlInsight?.first===engine){
        mlSupport=mlInsight.level==="strong"?0.05:mlInsight.level==="edge"?0.035:mlInsight.level==="watch"?0.015:0;
      }
      let qualityScore=baseScore+mlSupport;
      if(currentMissStreak===1) qualityScore-=0.03;
      else if(currentMissStreak===2) qualityScore-=0.08;
      else if(currentMissStreak>=3) qualityScore-=0.18;
      qualityScore=Math.max(0,Math.min(1,qualityScore));
      const passesProGate=total>=AI_SELECT_MIN_WEEKDAY_SAMPLES
        && winRate>=AI_SELECT_PRO_MIN_WIN_RATE
        && recentRate>=AI_SELECT_PRO_MIN_RECENT_RATE
        && qualityScore>=AI_SELECT_PRO_MIN_SCORE
        && currentMissStreak<=AI_SELECT_PRO_MAX_MISS_STREAK;
      const watch=!passesProGate&&total>=6&&winRate>=0.27&&qualityScore>=0.40&&currentMissStreak<=AI_SELECT_PRO_MAX_MISS_STREAK;
      const item={profileId:pid,profileName:String(state.profiles?.[pid]||`Profile ${pid+1}`),engine,label:AI_SELECT_LABELS[engine]||engine,hit,total,score:qualityScore,recentRate,winRate,currentWinStreak,currentMissStreak,repeatRate,repeatOpportunities,mlSupport,passesProGate,watch,latestStatus:"waiting",latestDate:""};
      if(!best||item.score>best.score||(item.score===best.score&&item.total>best.total)) best=item;
    }
    if(best) perProfile.push(best);
  }
  perProfile.sort((a,b)=>b.score-a.score||b.total-a.total||b.hit-a.hit||a.profileId-b.profileId);
  const selected=perProfile.filter(x=>x.passesProGate).slice(0,3);
  const watch=perProfile.filter(x=>!x.passesProGate&&x.watch).slice(0,3);
  return {date:todayKey,day:targetDay,dayLabel:aiSelectDayLabel(targetDay),items:selected,watch,status:selected.length?"PRO":"NO SELECT",watchCount:watch.length,source:"history-strict-prior-only-daily-lock-pro"};
}
// Resolve only the result badge from live History. Selection/engine/metrics remain immutable for the day.
function aiSelectLiveStatusForItem(item,today=new Date()){
  const todayKey=aiSelectLocalDateKey(today),pid=Number(item?.profileId??-1),engine=String(item?.engine||"");
  if(pid<0||!engine) return {latestStatus:"waiting",latestDate:""};
  const todayDraw=(state.actualDraws||[]).find(d=>Number(d?.profileId??-1)===pid&&String(d?.date||"")===todayKey&&/^\d{3}$/.test(String(d?.number||"")))||null;
  if(!todayDraw) return {latestStatus:"waiting",latestDate:""};
  // V7.20.86 — FINAL DURABLE STATUS RESTORE.
  // Prefer the last atomically committed History snapshot for this exact row. This
  // makes cold iPhone launches independent from engine-cache timing and avoids the
  // old "open History first" requirement. The committed snapshot contains only
  // trusted rows, so a resolved non-pending status is safe to use immediately.
  try{
    const profileDraws=(state.actualDraws||[]).filter(d=>Number(d?.profileId??-1)===pid);
    const committed=readCommittedAIHistorySnapshot(pid,profileDraws);
    const committedStatus=committed?.rows?.[unifiedAIRowKey(todayDraw)]?.[engine];
    if(committedStatus&&committedStatus!=="pending") return {latestStatus:committedStatus,latestDate:todayKey};
  }catch(_){ }
  const row=getUnifiedAIHistoryStatuses(todayDraw,pid);
  if(!row?.trusted) return {latestStatus:"waiting",latestDate:todayKey};
  const st=row?.[engine]||row?.engineStatuses?.[engine]||"pending";
  return {latestStatus:st==="pending"?"waiting":st,latestDate:todayKey};
}
function hydrateAISelectDecisionStatus(lockedDecision,today=new Date()){
  const todayKey=aiSelectLocalDateKey(today);
  const d={...lockedDecision,items:Array.isArray(lockedDecision?.items)?lockedDecision.items.map(item=>{
    const live=aiSelectLiveStatusForItem(item,today);
    // V7.20.86: keep the already-confirmed same-day badge stable during a cold iPhone
    // boot if engine hydration has not completed yet. The Top-3 boot gate below
    // reconciles it before first AI render whenever a Daily Decision snapshot exists.
    if(live.latestStatus==="waiting"&&item?.latestDate===todayKey&&item?.latestStatus&&item.latestStatus!=="waiting") return {...item};
    return {...item,...live};
  }):[]};
  return d;
}
function getDailyAISelectTop3(){
  const now=new Date(),date=aiSelectLocalDateKey(now),cached=readAISelectTop3Cache();
  // PRO DAILY LOCK: once a decision exists for this date, History changes cannot re-rank it.
  if(cached?.date===date&&Array.isArray(cached?.decision?.items)) return hydrateAISelectDecisionStatus(cached.decision,now);
  const decision=buildAISelectTop3(now);
  writeAISelectTop3Cache({date,decision,lockedAt:Date.now(),lockVersion:"v72074-strict-prior-daily-lock-pro"});
  return hydrateAISelectDecisionStatus(decision,now);
}
function aiSelectLatestStatusMeta(status){
  if(status==="exact") return {label:"HIT",tone:"hit"};
  if(status==="reversed") return {label:"REV",tone:"rev"};
  if(status==="notfound") return {label:"MISS",tone:"miss"};
  return {label:"WAITING",tone:"pending"};
}
function renderAISelectTop3(){
  const d=getDailyAISelectTop3(),medals=["1","2","3"],count=Array.isArray(d.items)?d.items.length:0;
  const title=count?`Top ${count} · ${escapeHtml(d.dayLabel)}`:`NO SELECT · ${escapeHtml(d.dayLabel)}`;
  const aggTotal=count?d.items.reduce((a,x)=>a+Number(x.total||0),0):0;
  const aggHit=count?d.items.reduce((a,x)=>a+Number(x.hit||0),0):0;
  const hitRate=aggTotal?Math.round((aggHit/aggTotal)*1000)/10:0;
  const recentRate=count?Math.round((d.items.reduce((a,x)=>a+Number(x.recentRate||0),0)/count)*1000)/10:0;
  const body=count
    ? `<div class="ai-select-top3-list">${d.items.map((x,i)=>{const winPct=x.total?Math.round(x.winRate*1000)/10:0,repeatPct=x.repeatOpportunities?Math.round(x.repeatRate*1000)/10:0,st=aiSelectLatestStatusMeta(x.latestStatus);return `<div class="ai-select-top3-row has-engine"><b class="ai-select-rank">${medals[i]||i+1}</b><span class="ai-engine-badge">${escapeHtml(x.label)}</span><div class="ai-select-top3-main"><strong>${escapeHtml(x.profileName)} · ${escapeHtml(x.label)}</strong><small><b>Win ${winPct}%</b><i>·</i><b>Repeat ${repeatPct}%</b></small></div><button class="ai-select-history-link ${st.tone}" type="button" data-ai-select-history="${Number(x.profileId)||0}" aria-label="เปิด History ${escapeHtml(x.profileName)}"><span>${st.label==="WAITING"?"⌛ ":""}${st.label}</span><b>›</b></button></div>`;}).join("")}</div><div class="ai-decision-stats"><div><small>🎯 Hit Rate</small><b>${hitRate}%</b></div><div><small>↗ Recent</small><b>${recentRate}%</b></div><div><small>🗓 Total Draws</small><b>${aggTotal}</b></div><div><small>🛡 Trusted Only</small><b>Yes</b></div></div>`
    : `<div class="ai-select-no-select"><strong>NO SELECT</strong><span>WAIT FOR BETTER SIGNAL</span></div>`;
  return `<section class="ai-select-top3-card ${count?"ready":"no-select"}" aria-label="AI Decision Pro"><div class="ai-select-top3-head"><div><small>AI DECISION · PRO</small><h3>${title}</h3></div><span>${escapeHtml(d.status)}</span></div>${body}</section>`;
}

// V7.20.81 — PROFILE-SCOPED REALTIME AI RESULT BADGES.
// Daily selection remains locked. A History mutation only patches the matching locked Top-3 card.
function aiSelectLockedProfileIds(){
  const now=new Date(),date=aiSelectLocalDateKey(now),cached=readAISelectTop3Cache();
  if(cached?.date!==date||!Array.isArray(cached?.decision?.items)) return [];
  return cached.decision.items.map(x=>Number(x?.profileId??-1)).filter(x=>x>=0);
}
// V7.20.86 — FINAL TOP-3 DURABLE STATUS RESTORE.
// Cold-killing the iPhone PWA must not require opening each Profile History before
// HIT/REV/MISS becomes available. Restore only the locked Top-3 engine caches, in
// parallel, then persist the reconciled badges into the tiny Daily Decision snapshot.
async function hydrateAISelectLockedProfilesForBoot(){
  const now=new Date(),todayKey=aiSelectLocalDateKey(now),cached=readAISelectTop3Cache();
  if(cached?.date!==todayKey||!Array.isArray(cached?.decision?.items)||!cached.decision.items.length) return false;
  // V7.20.86 — FINAL TOP-3 STATUS BOOT GATE.
  // Never use a short timeout to decide HIT/REV/MISS. First consult the atomic
  // committed History snapshot (via aiSelectLiveStatusForItem). Only unresolved
  // selected rows with an actual result today may restore their exact engine cache.
  const unresolved=cached.decision.items.filter(item=>{
    const pid=Number(item?.profileId??-1); if(pid<0) return false;
    const hasToday=(state.actualDraws||[]).some(d=>Number(d?.profileId??-1)===pid&&String(d?.date||'')===todayKey&&/^\d{3}$/.test(String(d?.number||'')));
    const settled=item?.latestDate===todayKey&&item?.latestStatus&&item.latestStatus!=="waiting";
    if(!hasToday||settled) return false;
    return aiSelectLiveStatusForItem(item,now).latestStatus==="waiting";
  });
  if(unresolved.length){
    await Promise.all(unresolved.map(async item=>{
      const pid=Number(item?.profileId??-1),engine=String(item?.engine||"");
      try{
        restoreUnifiedAIProfileSync(pid);
        if(engine==="x3"&&!PERF_CACHE.x3Bundle.has(x3BundleCacheKey(pid))) await hydrateX3PersistentCache(pid);
        else if(engine==="p19") restorePatternV19PersistentCache(pid);
        else if(engine==="p18") loadP18HistoryCache();
      }catch(_){ }
    }));
  }
  const nextItems=cached.decision.items.map(item=>{
    const live=aiSelectLiveStatusForItem(item,now);
    if(live.latestStatus==="waiting"&&item?.latestDate===todayKey&&item?.latestStatus&&item.latestStatus!=="waiting") return item;
    return {...item,...live};
  });
  const changed=nextItems.some((item,i)=>item.latestStatus!==cached.decision.items[i]?.latestStatus||item.latestDate!==cached.decision.items[i]?.latestDate);
  if(changed) writeAISelectTop3Cache({...cached,decision:{...cached.decision,items:nextItems},statusHydratedAt:Date.now(),statusHydrateVersion:"v72086r-final-durable-status"});
  return true;
}
function persistAISelectLiveStatusForProfile(profileId){
  const pid=Number(profileId),now=new Date(),todayKey=aiSelectLocalDateKey(now),cached=readAISelectTop3Cache();
  if(cached?.date!==todayKey||!Array.isArray(cached?.decision?.items)||!cached.decision.items.some(x=>Number(x?.profileId??-1)===pid)) return false;
  let changed=false;
  const items=cached.decision.items.map(item=>{
    if(Number(item?.profileId??-1)!==pid) return item;
    const live=aiSelectLiveStatusForItem(item,now);
    if(live.latestStatus!==item.latestStatus||live.latestDate!==item.latestDate) changed=true;
    return {...item,...live};
  });
  if(changed) writeAISelectTop3Cache({...cached,decision:{...cached.decision,items},statusUpdatedAt:Date.now()});
  return changed;
}
function normalizeHistoryMutationProfileIds(detail){
  const raw=Array.isArray(detail?.profileIds)?detail.profileIds:[detail?.profileId];
  return [...new Set(raw.map(Number).filter(Number.isFinite).filter(x=>x>=0))];
}
function patchAISelectLiveStatusForProfile(profileId){
  if(state.currentView!=="weekly") return false;
  const pid=Number(profileId);
  if(!Number.isFinite(pid)||pid<0) return false;
  const lockedIds=aiSelectLockedProfileIds();
  if(!lockedIds.includes(pid)) return false;
  const cached=readAISelectTop3Cache();
  const item=cached?.decision?.items?.find(x=>Number(x?.profileId??-1)===pid);
  if(!item) return false;
  const button=document.querySelector(`main.main .ai-select-history-link[data-ai-select-history="${pid}"]`);
  if(!button) return false;
  const live=aiSelectLiveStatusForItem(item,new Date());
  persistAISelectLiveStatusForProfile(pid);
  const meta=aiSelectLatestStatusMeta(live.latestStatus);
  button.classList.remove("hit","rev","miss","pending");
  button.classList.add(meta.tone);
  const label=button.querySelector("span");
  if(label) label.textContent=`${meta.label==="WAITING"?"⌛ ":""}${meta.label}`;
  return true;
}
function refreshAISelectLiveStatuses(profileIds=null){
  if(state.currentView!=="weekly") return false;
  const lockedIds=aiSelectLockedProfileIds();
  if(!lockedIds.length) return false;
  const requested=Array.isArray(profileIds)&&profileIds.length
    ? profileIds.map(Number).filter(pid=>lockedIds.includes(pid))
    : lockedIds;
  if(!requested.length) return false;
  let changed=false;
  for(const pid of requested) changed=patchAISelectLiveStatusForProfile(pid)||changed;
  return changed;
}
function notifyLiveHistoryMutation(profileIds){
  invalidateViewCache();
  const ids=[...new Set((Array.isArray(profileIds)?profileIds:[profileIds]).map(Number).filter(Number.isFinite).filter(x=>x>=0))];
  const detail={profileIds:ids,profileId:ids.length===1?ids[0]:null};
  try{ window.dispatchEvent(new CustomEvent("lucky:history-mutated",{detail})); }catch(_){
    try{ const ev=new Event("lucky:history-mutated"); ev.historyMutationDetail=detail; window.dispatchEvent(ev); }catch(__){}
  }
}
window.addEventListener("lucky:history-mutated",event=>{
  if(state.currentView!=="weekly") return;
  const detail=event?.detail||event?.historyMutationDetail||{};
  const changedIds=normalizeHistoryMutationProfileIds(detail);
  // Critical guard: History of a non-selected Profile must not touch AI Decision at all.
  if(!changedIds.length) return;
  const locked=new Set(aiSelectLockedProfileIds());
  const relevant=changedIds.filter(pid=>locked.has(pid));
  if(!relevant.length) return;
  refreshAISelectLiveStatuses(relevant);
});
document.addEventListener("visibilitychange",()=>{
  if(!document.hidden && state.currentView==="weekly") refreshAISelectLiveStatuses();
},{passive:true});
window.addEventListener("pageshow",()=>{
  if(state.currentView==="weekly") refreshAISelectLiveStatuses();
},{passive:true});

function historyCompetitionRanks(items=[]) {
  let lastRate=null, lastRank=0;
  return items.map((item,index)=>{
    const rate=Number(item?.summary?.rate||0);
    if(lastRate===null || rate!==lastRate) lastRank=index+1;
    lastRate=rate;
    return {...item,displayRank:lastRank};
  });
}

function historyModelMeta(key) {
  return ({
    gl:{short:"AI GL",tag:"Hybrid",tone:"teal"},
    ai:{short:"AI L",tag:"L",tone:"violet"},
    p19:{short:"P19",tag:"Hybrid",tone:"blue"},
    x3:{short:"X3",tag:"Meta",tone:"purple"},
    p18:{short:"P18",tag:"Champion",tone:"blue"},
    original:{short:"Classic",tag:"Original",tone:"slate"},
    master:{short:"Master AI",tag:"Master",tone:"blue"}
  })[key] || {short:String(key||"AI"),tag:"Model",tone:"slate"};
}

function renderHistoryChampion(champion) {
  if (!champion?.winner) return "";
  const winner = champion.winner;
  const meta=historyModelMeta(winner.key);
  return `<div class="history-champion-card history-champion-compact">
    <div class="history-champion-head">
      <span class="history-champion-trophy" aria-hidden="true">🏆</span>
      <div class="history-champion-copy"><small>History Champion</small><b>${escapeHtml(meta.short || winner.label)}</b><span>คะแนนนำเป็นอันดับ 1</span></div>
      <div class="history-champion-result"><small>ชนะ</small><strong>${winner.summary.rate}%</strong><span>${winner.summary.hit}/${winner.summary.total} งวด</span></div>
    </div>
  </div>`;
}

function renderHistoryRankingBoard(champion) {
  const ranked=historyCompetitionRanks(champion?.items||[]);
  if(!ranked.length) return "";
  const maxRate=Math.max(...ranked.map(x=>Number(x?.summary?.rate||0)),1);
  return `<div class="history-ranking-board">
    <div class="history-ranking-head"><span>#</span><span>AI Model</span><span>ชนะ (%)</span><span>Hit / Total</span></div>
    <div class="history-ranking-list">${ranked.map((x,index)=>{
      const meta=historyModelMeta(x.key);
      const pct=Math.max(4,Math.min(100,(Number(x.summary?.rate||0)/maxRate)*100));
      const medal=x.displayRank===1?'🥇':x.displayRank===2?'🥈':x.displayRank===3?'🥉':'';
      return `<div class="history-ranking-row rank-${x.displayRank} tone-${meta.tone}">
        <div class="history-rank-num"><b>${x.displayRank}</b></div>
        <div class="history-rank-model"><strong>${medal?`<span aria-hidden="true">${medal}</span> `:''}${escapeHtml(meta.short)}</strong><small>${escapeHtml(meta.tag)}</small></div>
        <div class="history-rank-rate"><b>${x.summary.rate}%</b></div>
        <div class="history-rank-evidence"><span>${x.summary.hit} / ${x.summary.total}</span><i><em style="width:${pct.toFixed(1)}%"></em></i></div>
      </div>`;
    }).join("")}</div>
    <p class="history-ranking-note">คำนวณจาก Verified Live + Walk-Forward (Prior-only) • อันดับเท่ากันใช้เลขอันดับเดียวกัน</p>
  </div>`;
}


// V7.20.22 Production PWA Standard — History first paint is cache-first and bounded.
const HISTORY_FIRST_BATCH = 48;
const HISTORY_BATCH_STEP = 48;
let historyVisibleLimitByProfile = {};
const HISTORY_SUMMARY_CACHE_KEY = "luckyNumber_history_summary_v72022";
const HISTORY_SUMMARY_SCHEMA = "H35-PERSISTENT-SWR";
let HISTORY_SUMMARY_BUILDING = new Set();
let HISTORY_SUMMARY_STORE_MEMORY=null, HISTORY_SUMMARY_STORE_RAW='';
function readHistorySummaryStore(){
  try{
    const raw=localStorage.getItem(HISTORY_SUMMARY_CACHE_KEY)||'{}';
    if(HISTORY_SUMMARY_STORE_MEMORY && raw===HISTORY_SUMMARY_STORE_RAW) return HISTORY_SUMMARY_STORE_MEMORY;
    const parsed=JSON.parse(raw)||{};
    HISTORY_SUMMARY_STORE_RAW=raw; HISTORY_SUMMARY_STORE_MEMORY=parsed;
    return parsed;
  }catch(_){ return HISTORY_SUMMARY_STORE_MEMORY||{}; }
}
function historySummarySignature(profileId, draws){
  // Navigation/UI saves are not data mutations. Key only from canonical History + engine inputs.
  return `${HISTORY_SUMMARY_SCHEMA}|${aiHistoryDatasetFingerprint(profileId,draws)}`;
}
function readHistorySummaryCache(profileId, draws){
  try{
    const all=readHistorySummaryStore();
    const item=all?.[String(Number(profileId)||0)];
    return item?.signature===historySummarySignature(profileId,draws)?item:null;
  }catch(_){ return null; }
}
function persistHistorySummaryCache(profileId, draws, summaries){
  try{
    const all={...readHistorySummaryStore()};
    all[String(Number(profileId)||0)]={signature:historySummarySignature(profileId,draws),updatedAt:Date.now(),summaries};
    const raw=JSON.stringify(all);
    localStorage.setItem(HISTORY_SUMMARY_CACHE_KEY,raw);
    HISTORY_SUMMARY_STORE_RAW=raw; HISTORY_SUMMARY_STORE_MEMORY=all;
  }catch(_){ }
}
function scheduleHistorySummaryCacheBuild(profileId, draws, visibleSummaries=null){
  const id=Number(profileId)||0, key=String(id), list=Array.isArray(draws)?draws.slice():[];
  if(HISTORY_SUMMARY_BUILDING.has(key)) return;
  HISTORY_SUMMARY_BUILDING.add(key);
  const previous=visibleSummaries || readCommittedAIHistorySnapshot(id,list)?.summaries || readHistorySummaryCache(id,list)?.summaries || null;
  setTimeout(async()=>{
    try{
      await waitForForegroundIdle(500);
      // Restore every durable adapter before deciding anything is missing. Indexed X3
      // hydration is awaited; genuinely missing P18/P19/X3 work is only scheduled for idle.
      restoreUnifiedAIProfileSync(id);
      await hydrateUnifiedAIProfile(id,{allowIndexed:true,scheduleMissing:false});
      const keys=UNIFIED_AI_ENGINE_ORDER.slice();
      const totals=Object.fromEntries(keys.map(k=>[k,0])), hits=Object.fromEntries(keys.map(k=>[k,0]));
      const rows={}; let trusted=0,pending=0;
      for(let i=0;i<list.length;i++){
        const draw=list[i], row=getUnifiedAIHistoryStatuses(draw,id);
        if(row?.trusted){
          trusted++;
          const statuses={};
          for(const k of keys){
            const st=row?.[k]||row?.engineStatuses?.[k]||'pending';
            statuses[k]=st;
            if(st==='pending'){ pending++; continue; }
            totals[k]++;
            if(st==='exact'||st==='reversed'||st==='swap') hits[k]++;
          }
          rows[unifiedAIRowKey(draw)]=statuses;
        }
        if(i>0 && i%32===0){ await new Promise(r=>setTimeout(r,0)); if(userInteractionHot(300)) await waitForForegroundIdle(220); }
      }
      const summaries=Object.fromEntries(keys.map(k=>[k,{hit:hits[k],total:totals[k],rate:totals[k]?Math.round(hits[k]*1000/totals[k])/10:0}]));
      // Publish only a COMPLETE generation. A partial warm-up must never overwrite the last
      // good summary with 0/0 or “—”. Missing engines continue through idle Compute Manager.
      if(pending===0){
        persistHistorySummaryCache(id,list,summaries);
        persistCommittedAIHistorySnapshot(id,list,{ok:true,trusted,pending:0,rows,summaries,generation:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`});
        const changed=JSON.stringify(previous||{})!==JSON.stringify(summaries||{});
        if(changed && state.currentView==='history' && Number(state.activeProfile)===id && !userInteractionHot(500)) requestAnimationFrame(()=>refreshCurrentView());
      } else if(state.currentView==='history' && Number(state.activeProfile)===id){
        setTimeout(()=>scheduleHistorySummaryCacheBuild(id,list,previous),2400);
      }
    }catch(e){ console.warn('History summary cache build skipped',e); }
    finally{ HISTORY_SUMMARY_BUILDING.delete(key); }
  },80);
}
function renderHistory() {
  const selectedProfile = Number(state.activeProfile);
  ensureProfileDerivedHistoryReady(selectedProfile, {repairTables:false});
  const selectedName = state.profiles[selectedProfile] || `Profile ${selectedProfile + 1}`;
  const selectedActualDraws = state.actualDraws.filter(r => Number(r.profileId ?? 0) === selectedProfile);
  const formulaMode = state.historyFormulaMode === "original" ? "original" : (state.historyFormulaMode === "ai" ? "ai" : "compare");
  // V7.20.35 Pro Cache-first History: restore small synchronous persistent adapters before
  // reading the page snapshot. A READY P19/X3 generation therefore never flashes back to “—”
  // merely because PERF_CACHE was cleared by navigation or another runtime render.
  restoreUnifiedAIProfileSync(selectedProfile);
  const committedAISnapshot = readCommittedAIHistorySnapshot(selectedProfile, selectedActualDraws);
  const cachedHistorySummary = readHistorySummaryCache(selectedProfile, selectedActualDraws);
  const cachedS = committedAISnapshot?.summaries || cachedHistorySummary?.summaries || null;
  const p19PersistentSummary=PERF_CACHE.patternV19Bundle.get(p19BundleCacheKey(selectedProfile))?.summary || getPatternV19PrimarySummary(selectedProfile) || null;
  const x3PersistentSummary=PERF_CACHE.x3Bundle.get(x3BundleCacheKey(selectedProfile))?.summary || null;
  // First paint reads the last valid persistent generation. Recompute happens only when the
  // canonical History/engine fingerprint is dirty, and then only in background.
  const originalSummary = cachedS?.classic || trustedHistorySummary(selectedActualDraws, selectedProfile, "classic");
  const aiSummary = cachedS?.aiL || trustedHistorySummary(selectedActualDraws, selectedProfile, "aiL");
  const glSummary = cachedS?.gl || trustedHistorySummary(selectedActualDraws, selectedProfile, "gl");
  const p18Summary = cachedS?.p18 || patternV18TrustedHistorySummary(selectedActualDraws, selectedProfile);
  const p19Summary = cachedS?.p19 || p19PersistentSummary || {hit:0,total:0,rate:0,pending:true};
  const x3Summary = cachedS?.x3 || x3PersistentSummary || {hit:0,total:0,rate:0,pending:true};
  if(!committedAISnapshot) scheduleHistorySummaryCacheBuild(selectedProfile, selectedActualDraws, {
    classic:originalSummary, aiL:aiSummary, gl:glSummary, p18:p18Summary, p19:p19Summary, x3:x3Summary
  });
  // V7.18.01: AI Pair is removed from History and replaced by P18.
  // Model columns are sorted strongest → weakest by this profile's trusted History rate.
  // Ties prefer larger evidence, then a stable display priority.
  const enginePriority={p19:0,x3:1,p18:2,classic:3,gl:4,aiL:5};
  const engineDefs=[
    {key:"x3",label:"X3",model:"x3",summary:x3Summary},
    {key:"p19",label:"P19",model:"p19",summary:p19Summary},
    {key:"p18",label:"P18",model:"p18",summary:p18Summary},
    {key:"gl",label:"GL",model:"gl",summary:glSummary},
    {key:"aiL",label:"AIL",model:"ail",summary:aiSummary},
    {key:"classic",label:"CLS",model:"classic",summary:originalSummary}
  ].sort((a,b)=>Number(b.summary?.rate||0)-Number(a.summary?.rate||0)||Number(b.summary?.total||0)-Number(a.summary?.total||0)||(enginePriority[a.key]-enginePriority[b.key]));

  const sortedActualDraws = [...selectedActualDraws].sort((a,b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0));
  const visibleLimit=Math.max(HISTORY_FIRST_BATCH,Number(historyVisibleLimitByProfile[selectedProfile]||HISTORY_FIRST_BATCH));
  const visibleActualDraws=sortedActualDraws.slice(0,visibleLimit);
  const resultRows = visibleActualDraws
    .map(r => {
      const comparison = getHistoryDisplayComparisonStatuses(r, selectedProfile);
      const committedRow=committedAISnapshot?.rows?.[unifiedAIRowKey(r)] || null;
      const unifiedRow=committedRow?null:getUnifiedAIHistoryStatuses(r,selectedProfile);
      const originalStatus = committedRow?.classic || comparison.classic;
      const aiStatus = committedRow?.aiL || comparison.aiL;
      const glStatus=committedRow?.gl || comparison.gl || unifiedRow?.gl || "pending";
      const p18Status = committedRow?.p18 || unifiedRow?.p18 || "pending";
      const p19Status = committedRow?.p19 || unifiedRow?.p19 || "pending";
      const x3Status = committedRow?.x3 || unifiedRow?.x3 || "pending";
      const day = DAYS_SHORT[new Date(`${r.date}T12:00:00`).getDay()];
      const statusMap={x3:x3Status,p19:p19Status,p18:p18Status,classic:originalStatus,aiL:aiStatus,gl:glStatus};
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


  return `<section class="card history-hub history-pro-evidence">
    <div class="ux-page-head"><div><small>HISTORY</small><p>${escapeHtml(selectedName)} • ${selectedActualDraws.length} งวด</p></div><div class="history-head-actions"><span class="ux-count-pill">${originalSummary.total} ตรวจแล้ว</span></div></div>
    ${profileTabs()}
      <div class="profile-filter-summary"><b style="color:${profileColor(selectedProfile)}">${escapeHtml(selectedName)}</b><span>เปรียบเทียบ L Match</span></div>
      <div class="history-verification-note ux-history-legend"><span><b>✓ LIVE</b> Snapshot ก่อนผล</span><span><b>WF</b> Prior-only</span><span><b>LEG</b> อ้างอิงไม่นับคะแนน</span></div>
      <div class="history-manager-panel history-ref-1">
        <div class="formula-view-tabs public-history-tabs">
          <button class="formula-view-btn ${formulaMode === "compare" ? "active" : ""}" data-formula-mode="compare">Compare</button>
          <button class="formula-view-btn ${formulaMode === "original" ? "active" : ""}" data-formula-mode="original">Classic L</button>
          <button class="formula-view-btn ${formulaMode === "ai" ? "active" : ""}" data-formula-mode="ai">AI L</button>
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
        ${formulaMode === "compare" ? `<div class="history-ranked-guide"><span>Highest</span><i>→</i><span>Lowest</span></div>` : ""}
        <div class="result-history-table formula-table-${formulaMode}${historyEditMode ? " history-editing" : ""}">
          <div class="result-history-head formula-${formulaMode}"><span>Date</span><span class="history-number-head">3D&nbsp;&nbsp;2D</span>${formulaMode === "original" ? "<span>CLS</span>" : ""}${formulaMode === "ai" ? "<span>AIL</span>" : ""}${(formulaMode === "compare"||formulaMode === "advanced") ? `${engineDefs.map(x=>`<span><b>${x.label}</b><small>${x.summary?.total?`${x.summary.rate}%`:"—"}</small></span>`).join("")}<span>Win</span>` : ""}</div>
          ${resultRows || `<div class="empty-card flat visible-empty">ยังไม่มีผลย้อนหลังของ ${escapeHtml(selectedName)}</div>`}
          ${visibleLimit < sortedActualDraws.length ? `<button type="button" class="history-load-more" data-history-load-more="1">แสดงเพิ่ม ${Math.min(HISTORY_BATCH_STEP,sortedActualDraws.length-visibleLimit)} งวด</button>` : ""}
        </div>
      </div>
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

function getProfileAIDayScore(profileId, days, trustedPack = null, anchorDateOverride = "") {
  const windowDays = [7, 14, 30, 60, 90, 180].includes(Number(days)) ? Number(days) : 7;
  const pack = trustedPack || getTrustedProfileConfidenceRows(profileId);
  const rows = Array.isArray(pack?.rows) ? pack.rows : [];
  if (!rows.length) return { score:0, samples:0, hits:0, trusted:true };
  // V7.20.86r: every Profile in one ranking generation uses ONE shared calendar anchor.
  // Never let a Profile's latest hydrated row silently move its 7/14/30-day window.
  const requested = /^\d{4}-\d{2}-\d{2}$/.test(String(anchorDateOverride||"")) ? String(anchorDateOverride) : "";
  const anchorDate = requested || String(rows.at(-1).date || "");
  const startDate = shiftIsoDate(anchorDate, -(windowDays - 1));
  const sample = rows.filter(r => String(r.date) >= startDate && String(r.date) <= anchorDate);
  if (!sample.length) return { score:0, samples:0, hits:0, trusted:true, anchorDate };
  const hits = sample.reduce((sum, row) => sum + (row.hit ? 1 : 0), 0);
  return { score:(hits * 100) / sample.length, samples:sample.length, hits, trusted:true, anchorDate };
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
  const anchorDate = /^\d{4}-\d{2}-\d{2}$/.test(String(options?.anchorDate || "")) ? String(options.anchorDate) : "";
  const baseRows=(basePack.rows||[]).filter(r=>!anchorDate || String(r.date||"")<=anchorDate);
  const trustedPack = beforeDate
    ? {...basePack, rows:baseRows.filter(r => String(r.date || "") < beforeDate)}
    : {...basePack, rows:baseRows};
  const trustedRows = trustedPack.rows || [];
  const w7 = getProfileAIDayScore(id, 7, trustedPack, anchorDate);
  const w14 = getProfileAIDayScore(id, 14, trustedPack, anchorDate);
  const w30 = getProfileAIDayScore(id, 30, trustedPack, anchorDate);
  const w90 = getProfileAIDayScore(id, 90, trustedPack, anchorDate);
  const w180 = getProfileAIDayScore(id, 180, trustedPack, anchorDate);
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
    confidenceSource:"trusted-only",
    rankingAnchorDate:anchorDate||String(trustedRows.at(-1)?.date||"")
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



// V7.09.66 — Ranking update badges follow the LATEST DRAW, not the calendar date.
// Example: on 19 Aug, if no valid 19 Aug result exists yet, 18 Aug is the current
// latest draw. As soon as a valid 19 Aug result is saved, the target advances to 19 Aug.
// This prevents yesterday's newly-completed results from being shown as Pending simply
// because the device calendar has already moved to the next day.
function getProfileRankingUpdateMeta() {
  const todayIso = isoDate();
  const todayKey = actualDrawDateOrderKey(todayIso);
  const rows = (state.actualDraws || []).filter(r => {
    const key = actualDrawDateOrderKey(r?.date);
    return key > 0 && key <= todayKey
      && /^\d{3}$/.test(String(r?.number || ""))
      && /^\d{2}$/.test(String(r?.twoDigit || ""));
  });

  // The dashboard target is the newest complete result date available anywhere in the app.
  // If today has no result yet this naturally stays on the previous/latest draw date.
  const targetKey = rows.reduce((max, r) => Math.max(max, actualDrawDateOrderKey(r?.date)), 0);
  const targetRow = targetKey ? rows.find(r => actualDrawDateOrderKey(r?.date) === targetKey) : null;
  const targetDate = targetRow?.date || todayIso;
  const targetRows = targetKey ? rows.filter(r => actualDrawDateOrderKey(r?.date) === targetKey) : [];
  const latestStamp = targetRows.reduce((max, r) => Math.max(max, Number(r?.updatedAt || r?.createdAt || 0)), 0);
  const byProfile = new Map();

  state.profiles.forEach((_, profileId) => {
    const profileRows = rows.filter(r => Number(r?.profileId ?? 0) === Number(profileId));
    if (!profileRows.length) {
      byProfile.set(profileId, {status:"nodata", label:"No Data", latest:null, target:null});
      return;
    }

    const latest = [...profileRows].sort(compareActualDrawRecency)[0] || null;
    const target = targetKey ? [...profileRows]
      .filter(r => actualDrawDateOrderKey(r?.date) === targetKey)
      .sort(compareActualDrawRecency)[0] || null : null;
    const targetComplete = !!target
      && /^\d{3}$/.test(String(target?.number || ""))
      && /^\d{2}$/.test(String(target?.twoDigit || ""));

    byProfile.set(profileId, targetComplete
      ? {status:"updated", label:"Updated", latest, target}
      : {status:"pending", label:"Pending", latest, target});
  });

  const updatedCount = [...byProfile.values()].filter(x => x.status === "updated").length;
  let timeLabel = "";
  if (latestStamp > 0) {
    const d = new Date(latestStamp);
    if (!Number.isNaN(d.getTime())) timeLabel = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  }
  return {todayIso, todayKey, targetDate, targetKey, timeLabel, updatedCount, total:state.profiles.length, byProfile};
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
  const w = SAFE_POLISH_FREEZE.profileRankWeights;
  return Math.round((hitNorm * w.hit) + (confidenceNorm * w.confidence) + (sampleNorm * w.samples) + (freshnessNorm * w.freshness));
}

// V7.20.86r — DETERMINISTIC / ATOMIC PROFILE RANKING AUTHORITY.
// During Full Rebuild, UI consumers never see mixed generations. The pre-rebuild ranking
// is frozen, all model work is staged privately in the normal engine caches, and one final
// ranking snapshot is atomically published only after every Profile completes.
const PROFILE_RANKING_AUTHORITY_KEY="lucky_profile_ranking_authority_v72086r";
const PROFILE_RANKING_LOCK_KEY="lucky_profile_ranking_rebuild_lock_v72086r";
const PROFILE_RANKING_SCHEMA=1;
function profileRankingStableSourceFingerprint(){
  const profiles=(state.profiles||[]).map((name,id)=>`${id}:${String(name||"")}`).join("¦");
  const rows=(state.actualDraws||[]).map(d=>[
    Number(d?.profileId??0),String(d?.date||"").slice(0,10),String(d?.number||""),String(d?.twoDigit||""),String(d?.id||"")
  ].join(":" )).sort().join("§");
  return hashWalkForwardText(`RANK-SOURCE-R1|${Number(state._profileRevision||0)}|${profiles}|${rows}`);
}
function profileRankingEngineSignature(){
  return [WF_ENGINE_VERSION,PATTERN_V19_ENGINE_SIGNATURE,X3_ENGINE_SIGNATURE,"PROFILE-RANK-R1"].join("|");
}
function profileRankingTargetDate(meta=null){
  const m=meta||getProfileRankingUpdateMeta();
  const d=String(m?.targetDate||m?.todayIso||isoDate()).slice(0,10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d)?d:isoDate();
}
function rankingSerializableItems(items){
  return (items||[]).map(x=>({
    profileId:Number(x.profileId),name:String(x.name||""),evidenceReady:Boolean(x.evidenceReady),
    rankScore:Number(x.rankScore||0),trustedRate:Number(x.trustedRate||0),trustedSamples:Number(x.trustedSamples||0),
    trustedHits:Number(x.trustedHits||0),confidence:Number(x.confidence||0),trend:Number(x.trend||0),
    trendLabel:String(x.trendLabel||""),rankingAnchorDate:String(x.rankingAnchorDate||""),
    verifiedSamples:Number(x.verifiedSamples||0),walkForwardSamples:Number(x.walkForwardSamples||0),
    blockedUntrusted:Number(x.blockedUntrusted||0),aiWindows:x.aiWindows||{},consistency:Number(x.consistency||0),
    sampleConfidence:Number(x.sampleConfidence||0),formulaSignal:Number(x.formulaSignal||0),formulaTrustedSamples:Number(x.formulaTrustedSamples||0),
    trendSignal:Number(x.trendSignal||0),score:Number(x.score||0),score10:Number(x.score10||0),score30:Number(x.score30||0),scoreAll:Number(x.scoreAll||0),samples:Number(x.samples||0),statScore:Number(x.statScore||0),hasAIFormula:Boolean(x.hasAIFormula),confidenceSource:String(x.confidenceSource||"trusted-only")
  }));
}
function readProfileRankingAuthority(){
  try{const x=JSON.parse(localStorage.getItem(PROFILE_RANKING_AUTHORITY_KEY)||"null");return x&&x.schema===PROFILE_RANKING_SCHEMA&&Array.isArray(x.items)?x:null;}catch(_){return null;}
}
function readProfileRankingRebuildLock(){
  try{const x=JSON.parse(localStorage.getItem(PROFILE_RANKING_LOCK_KEY)||"null");return x&&x.schema===PROFILE_RANKING_SCHEMA&&Array.isArray(x.items)?x:null;}catch(_){return null;}
}
function writeProfileRankingObject(key,obj){try{localStorage.setItem(key,JSON.stringify(obj));return true;}catch(error){console.warn("Profile ranking authority write failed",error);return false;}}
function rankingJobIsActive(){const j=state.walkForwardRebuildJob;return Boolean(j&&j.status!=="done");}
function computeCanonicalProfileAIRankingFresh(updateMeta=null,targetDateOverride=""){
  const meta=updateMeta||getProfileRankingUpdateMeta();
  const targetDate=/^\d{4}-\d{2}-\d{2}$/.test(String(targetDateOverride||""))?String(targetDateOverride):profileRankingTargetDate(meta);
  return state.profiles.map((_,i)=>{
    const item=getProfileAIRecommendation(i,{anchorDate:targetDate});
    const updateStatus=meta?.byProfile?.get(item.profileId)?.status||"pending";
    return {...item,rankScore:getProfileAIRankScore(item,updateStatus)};
  }).sort((a,b)=>
    Number(b.evidenceReady)-Number(a.evidenceReady)||
    b.rankScore-a.rankScore||b.trustedRate-a.trustedRate||b.trustedSamples-a.trustedSamples||b.confidence-a.confidence||a.profileId-b.profileId
  );
}
function rankingDigest(items){
  return hashWalkForwardText(JSON.stringify(rankingSerializableItems(items).map((x,index)=>[index+1,x.profileId,x.rankScore,x.trustedRate,x.trustedSamples,x.trustedHits,x.confidence,x.rankingAnchorDate])));
}
function beginDeterministicProfileRankingRebuild(){
  const meta=getProfileRankingUpdateMeta(),targetDate=profileRankingTargetDate(meta),sourceFingerprint=profileRankingStableSourceFingerprint();
  // Freeze only from a complete pre-rebuild generation. If a valid authority exists for the
  // same source, use it; otherwise compute once before any derived cache is cleared.
  const authority=readProfileRankingAuthority();
  const frozen=(authority&&authority.sourceFingerprint===sourceFingerprint&&authority.engineSignature===profileRankingEngineSignature())
    ? authority.items : rankingSerializableItems(computeCanonicalProfileAIRankingFresh(meta,targetDate));
  const generation=`R${Date.now().toString(36)}-${sourceFingerprint.slice(0,8)}`;
  const lock={schema:PROFILE_RANKING_SCHEMA,generation,targetDate,sourceFingerprint,engineSignature:profileRankingEngineSignature(),createdAt:Date.now(),items:frozen,digest:rankingDigest(frozen),state:"REBUILDING"};
  if(!writeProfileRankingObject(PROFILE_RANKING_LOCK_KEY,lock)) throw new Error("ล็อก Profile Ranking ก่อน Rebuild ไม่สำเร็จ");
  return lock;
}
function deterministicRankingRepeatabilityAudit(meta,targetDate,passes=7){
  const runs=[];
  for(let i=0;i<Math.max(3,Number(passes)||7);i++){
    const items=computeCanonicalProfileAIRankingFresh(meta,targetDate);
    runs.push({items,digest:rankingDigest(items)});
  }
  const first=runs[0]?.digest||"",pass=Boolean(first&&runs.every(x=>x.digest===first));
  return {pass,digest:first,runs:runs.length,items:runs[0]?.items||[]};
}
function publishDeterministicProfileRankingSnapshot(generation=""){
  const lock=readProfileRankingRebuildLock();
  const meta=getProfileRankingUpdateMeta();
  const targetDate=String(lock?.targetDate||profileRankingTargetDate(meta));
  const sourceFingerprint=profileRankingStableSourceFingerprint();
  if(lock&&lock.sourceFingerprint!==sourceFingerprint) throw new Error("History เปลี่ยนระหว่าง Rebuild — ยกเลิก Ranking generation");
  const audit=deterministicRankingRepeatabilityAudit(meta,targetDate,7);
  if(!audit.pass) throw new Error("Profile Ranking Repeatability Audit ไม่ผ่าน");
  const snapshot={schema:PROFILE_RANKING_SCHEMA,generation:generation||lock?.generation||`R${Date.now().toString(36)}`,targetDate,sourceFingerprint,engineSignature:profileRankingEngineSignature(),publishedAt:Date.now(),digest:audit.digest,auditRuns:audit.runs,items:rankingSerializableItems(audit.items),state:"READY"};
  if(!writeProfileRankingObject(PROFILE_RANKING_AUTHORITY_KEY,snapshot)) throw new Error("Publish Profile Ranking แบบ Atomic ไม่สำเร็จ");
  try{localStorage.removeItem(PROFILE_RANKING_LOCK_KEY);}catch(_){ }
  void writeIndexedValue(PROFILE_RANKING_AUTHORITY_KEY,snapshot);
  return snapshot;
}
function getCanonicalProfileAIRanking(updateMeta=null){
  // A running rebuild is a read barrier: never expose profile A from generation N+1
  // alongside profile B from generation N.
  if(rankingJobIsActive()){
    const lock=readProfileRankingRebuildLock();
    if(lock?.items?.length) return lock.items.map(x=>({...x}));
  }
  const meta=updateMeta||getProfileRankingUpdateMeta(),targetDate=profileRankingTargetDate(meta),sourceFingerprint=profileRankingStableSourceFingerprint();
  const authority=readProfileRankingAuthority();
  if(authority&&authority.sourceFingerprint===sourceFingerprint&&authority.engineSignature===profileRankingEngineSignature()&&authority.targetDate===targetDate&&Array.isArray(authority.items)) return authority.items.map(x=>({...x}));
  const fresh=computeCanonicalProfileAIRankingFresh(meta,targetDate);
  // Normal non-rebuild mutations may publish immediately because there is no mixed generation.
  if(!rankingJobIsActive()){
    const snapshot={schema:PROFILE_RANKING_SCHEMA,generation:`LIVE-${sourceFingerprint.slice(0,8)}`,targetDate,sourceFingerprint,engineSignature:profileRankingEngineSignature(),publishedAt:Date.now(),digest:rankingDigest(fresh),auditRuns:1,items:rankingSerializableItems(fresh),state:"READY"};
    writeProfileRankingObject(PROFILE_RANKING_AUTHORITY_KEY,snapshot);
  }
  return fresh;
}

function getProfileRankMovement(currentRanking, updateMeta) {
  const targetDate = String(updateMeta?.targetDate || updateMeta?.todayIso || isoDate());
  // Baseline = ranking immediately before the current latest draw could affect trusted evidence.
  // On 19 Aug with 18 Aug as the latest draw, compare against evidence strictly before 18 Aug.
  const previousAnchor=shiftIsoDate(targetDate,-1);
  const previous = state.profiles.map((_, i) => {
    const item = getProfileAIRecommendation(i, {beforeDate:targetDate,anchorDate:previousAnchor});
    return {...item, rankScore:getProfileAIRankScore(item, "pending")};
  }).sort((a,b) => Number(b.evidenceReady) - Number(a.evidenceReady) || b.rankScore - a.rankScore || b.trustedRate - a.trustedRate || b.trustedSamples - a.trustedSamples || b.confidence - a.confidence || a.profileId - b.profileId);
  const oldRank = new Map(previous.map((item,index)=>[Number(item.profileId), index+1]));
  const movement = new Map();
  currentRanking.forEach((item,index)=>{
    const fromRank = Number(oldRank.get(Number(item.profileId)) || index+1);
    const toRank = index+1;
    movement.set(Number(item.profileId), {fromRank,toRank,delta:fromRank-toRank});
  });
  return movement;
}

function renderProfileRankMovement(move, updateStatus = "pending") {
  // Ranking movement is shown only after that profile has a complete result for the current latest draw.
  if (updateStatus !== "updated" || !move) return "";
  const fromRank = Number(move.fromRank || 0), toRank = Number(move.toRank || 0), delta = Number(move.delta || 0);
  if (!toRank) return "";
  // Badge shows HOW MANY positions changed, not the current rank.
  if (delta > 0) return `<span class="rank-move up" title="อันดับขึ้นจาก #${fromRank} เป็น #${toRank}">↑${delta}</span>`;
  if (delta < 0) return `<span class="rank-move down" title="อันดับลงจาก #${fromRank} เป็น #${toRank}">↓${Math.abs(delta)}</span>`;
  // No movement = no badge. The large rank number already shows the current rank.
  return "";
}

// V7.20.68 — Production AI Ranker guard. The canonical ranking remains strict trusted/prior-only.
// Candidate Pool is capped at 5 ready profiles. Transition is deliberately metadata-only:
// it requires 3–5 trusted observations before a new recommendation is treated as settled,
// so the underlying ranking math/history is never rewritten by presentation smoothing.
function getAIRankerCandidatePool(ranking){
  const maxPool=Math.max(1,Number(PRO_RANKER_POLICY?.candidatePoolSize||5));
  return (Array.isArray(ranking)?ranking:[]).filter(x=>x?.evidenceReady).slice(0,maxPool);
}
function getAIRankerTransitionMeta(candidate){
  const minDraws=Math.max(1,Number(PRO_RANKER_POLICY?.transitionMinDraws||3));
  const maxDraws=Math.max(minDraws,Number(PRO_RANKER_POLICY?.transitionMaxDraws||5));
  const n=Math.max(0,Number(candidate?.trustedSamples||0));
  const observed=Math.min(maxDraws,n);
  return {minDraws,maxDraws,observed,ready:observed>=minDraws};
}

function renderProfileRanking() {
  const config = getRankingConfig();
  const requestedMode = ["manual", "score", "ai"].includes(state.analysisSortMode) ? state.analysisSortMode : "ai";
  const mode = requestedMode;
  const updateMeta = getProfileRankingUpdateMeta();
  let ranking = mode === "ai"
    ? getCanonicalProfileAIRanking(updateMeta)
    : state.profiles.map((_, i) => getProfileAnalysisScore(i));
  if (mode === "score") ranking.sort((a,b) => b.score - a.score || b.samples - a.samples || a.profileId - b.profileId);
  // AI Recommend and Profile Order now consume the exact same canonical ranking.
  const candidatePool = mode === "ai" ? getAIRankerCandidatePool(ranking) : [];
  const transitionMeta = candidatePool.length ? getAIRankerTransitionMeta(candidatePool[0]) : null;
  const rankMovement = mode === "ai" ? getProfileRankMovement(ranking, updateMeta) : new Map();
  const championProfileId = mode === "ai" && ranking[0]?.evidenceReady ? ranking[0].profileId : null;
  const latestDrawLabel = updateMeta.targetKey ? formatDateTH(updateMeta.targetDate) : "No latest draw";
  const summary = `<div class="ranking-update-summary ${updateMeta.updatedCount ? "" : "empty"}"><span>↻</span><b>Latest draw ${escapeHtml(latestDrawLabel)}${updateMeta.timeLabel ? ` • ${escapeHtml(updateMeta.timeLabel)}` : ""}</b><i></i><span>${updateMeta.updatedCount}/${updateMeta.total} profiles updated latest draw</span>${mode === "ai" ? `<span> • Candidate ${candidatePool.length}/${PRO_RANKER_POLICY.candidatePoolSize} • Transition ${transitionMeta?.minDraws||3}–${transitionMeta?.maxDraws||5}</span>` : ""}</div>`;
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
      const profileUpdateStatus = updateMeta.byProfile.get(item.profileId)?.status || "pending";
      const movementBadge = mode === "ai" ? renderProfileRankMovement(rankMovement.get(item.profileId), profileUpdateStatus) : "";
      return `<button type="button" class="profile-ranking-row ${item.profileId === Number(state.activeProfile) ? "active" : ""} ${isChampion ? "ai-champion" : ""}" data-ranking-profile="${item.profileId}" style="--profile-color:${profileColor(item.profileId)}">
        <span class="rank-number"><span class="rank-position">${isChampion ? `<span class="rank-trophy" aria-label="AI Champion">🏆</span>` : (mode === "manual" ? item.profileId + 1 : index + 1)}</span></span>
        <span class="rank-profile"><b>${escapeHtml(item.name)}${movementBadge}${isChampion ? `<span class="rank-champion-badge">CHAMPION</span>` : ""}</b><small><span>${mode === "ai" ? aiEvidenceText : scoreEvidenceText}</span>${statusBadge}</small></span>
        <span class="rank-score"><strong>${mode === "ai" ? (item.evidenceReady ? item.rankScore : "—") : `${item.score}%`}</strong><small>${mode === "ai" ? SCORE_TERMS.rank : "Stat Score"}</small>${mode === "ai" ? `<em>${SCORE_TERMS.hit.replace("Trusted ","")} ${item.trustedRate}% • ${SCORE_TERMS.confidence.replace(" Confidence","")} ${item.confidence}%</em>` : ""}</span>
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


// V7.20.21 — App-standard Unified AI Registry.
// Every production model uses one lifecycle contract for trusted status, restore,
// background hydration, invalidation and summaries. Model-specific algorithms stay
// private adapters; UI/History/Ranking/Analysis never depend on their private gates.
const UNIFIED_AI_ENGINE_ORDER=Object.freeze(["classic","aiL","gl","p18","p19","x3"]);
const UNIFIED_AI_ENGINE_LABELS=Object.freeze({classic:"Classic L",aiL:"AI L",gl:"AI GL",p18:"P18",p19:"P19",x3:"X3"});
function unifiedAIRowKey(draw){ return String(draw?.id ?? `${draw?.date||""}|${draw?.number||""}`); }
function getUnifiedAICachedPatternStatus(engine,draw,profileId,base){
  const id=Number(profileId), rowKey=unifiedAIRowKey(draw);
  if(!base?.trusted) return "pending";
  if(engine==="p18"){
    const table=base?.table||getPredictionTable(id,draw?.date,draw), cacheKey=p18HistoryStatusKey(draw,id,table);
    return P18_HISTORY_STATUS_CACHE.get(cacheKey)||PERF_CACHE.patternV18Status.get(cacheKey)||"pending";
  }
  if(engine==="p19"){
    const bundle=PERF_CACHE.patternV19Bundle.get(p19BundleCacheKey(id)), bundled=bundle?.statusMap?.get(rowKey);
    if(bundled) return bundled;
    const table=base?.table||getPredictionTable(id,draw?.date,draw), cacheKey=p19UnifiedHistoryStatusKey(draw,id,table);
    return PERF_CACHE.patternV19Status?.get?.(cacheKey)||"pending";
  }
  if(engine==="x3"){
    const bundle=PERF_CACHE.x3Bundle.get(x3BundleCacheKey(id)), bundled=bundle?.statusMap?.get(rowKey);
    if(bundled) return bundled;
    const table=base?.table||getPredictionTable(id,draw?.date,draw), cacheKey=x3UnifiedHistoryStatusKey(draw,id,table);
    return PERF_CACHE.x3Status?.get?.(cacheKey)||"pending";
  }
  return "pending";
}
function getUnifiedAIHistoryStatuses(draw,profileId=Number(draw?.profileId??0),options={}){
  const id=Number(profileId);
  const base=options?.display===true?getHistoryDisplayComparisonStatuses(draw,id):getHistoryComparisonStatuses(draw,id);
  const out={...base};
  out.classic=base?.classic||"pending";
  out.aiL=base?.aiL||"pending";
  out.gl=base?.gl||"pending";
  out.p18=getUnifiedAICachedPatternStatus("p18",draw,id,base);
  out.p19=getUnifiedAICachedPatternStatus("p19",draw,id,base);
  out.x3=getUnifiedAICachedPatternStatus("x3",draw,id,base);
  out.allReady=UNIFIED_AI_ENGINE_ORDER.every(k=>out[k]!=="pending");
  out.engineStatuses=Object.fromEntries(UNIFIED_AI_ENGINE_ORDER.map(k=>[k,out[k]]));
  return out;
}
function restoreUnifiedAIProfileSync(profileId=state.activeProfile){
  const id=Number(profileId); let restored=false;
  try{ loadP18HistoryCache(); restored=true; }catch(_){}
  try{ restored=restorePatternV19PersistentCache(id)||restored; }catch(_){}
  try{ restored=restoreX3SyncMirror(id)||restored; }catch(_){}
  return restored;
}
async function warmUnifiedP18ProfileCache(profileId=state.activeProfile){
  const id=Number(profileId), draws=(state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===id).sort((a,b)=>String(a?.date||'').localeCompare(String(b?.date||'')));
  for(let i=0;i<draws.length;i++){
    const draw=draws[i],base=getHistoryComparisonStatuses(draw,id);
    if(base?.trusted){
      const table=base.table||getPredictionTable(id,draw?.date,draw),key=p18HistoryStatusKey(draw,id,table);
      if(!P18_HISTORY_STATUS_CACHE.has(key)&&!PERF_CACHE.patternV18Status.has(key)) patternV18HistoryStatus(draw,id);
    }
    if(i>0&&i%32===0){await new Promise(r=>setTimeout(r,0));if(userInteractionHot(350))await waitForForegroundIdle(300);}
  }
  return true;
}
function scheduleUnifiedP18Background(profileId=state.activeProfile,delay=1700){
  const id=Number(profileId);
  if(state.currentView!=="weekly" || Number(state.activeProfile)!==id || document.visibilityState==="hidden") return false;
  return COMPUTE_MANAGER.enqueue(`P18|UNIFIED|${id}|${p19PersistentFingerprint(id)}`,async()=>{
    if(state.currentView!=="weekly" || Number(state.activeProfile)!==id || document.visibilityState==="hidden") return;
    await warmUnifiedP18ProfileCache(id);
  },{delay:Math.max(0,Number(delay)||0),idleMs:950});
}
async function hydrateUnifiedAIProfile(profileId=state.activeProfile,{allowIndexed=true,scheduleMissing=true}={}){
  const id=Number(profileId); restoreUnifiedAIProfileSync(id);
  if(allowIndexed && !PERF_CACHE.x3Bundle.has(x3BundleCacheKey(id))){ try{ await hydrateX3PersistentCache(id); }catch(_){} }
  if(scheduleMissing){
    scheduleUnifiedP18Background(id,1700);
    if(!PERF_CACHE.patternV19Bundle.has(p19BundleCacheKey(id))) schedulePatternV19Background(id,1800);
    if(!PERF_CACHE.x3Bundle.has(x3BundleCacheKey(id))) scheduleX3Background(id,1900);
    if(state.currentView==='weekly') scheduleAIStandardSummaryCacheBuild(id,null,4200);
  }
  return {
    profileId:id,
    p18:true,
    p19:PERF_CACHE.patternV19Bundle.has(p19BundleCacheKey(id)),
    x3:PERF_CACHE.x3Bundle.has(x3BundleCacheKey(id))
  };
}
async function hydrateUnifiedAIProfileForLaunch(profileId=state.activeProfile,budgetMs=120){
  const id=Number(profileId); restoreUnifiedAIProfileSync(id);
  if(PERF_CACHE.x3Bundle.has(x3BundleCacheKey(id))) return true;
  try{ await Promise.race([hydrateX3PersistentCache(id),new Promise(resolve=>setTimeout(()=>resolve(false),Math.max(40,Number(budgetMs)||120)))]); }catch(_){}
  return true;
}
function invalidateUnifiedAIRuntime(){
  try{ V19_BACKGROUND.ready.clear(); V19_BACKGROUND.running.clear(); V19_BACKGROUND.progress.clear(); }catch(_){}
  try{ X3_BACKGROUND.ready.clear(); X3_BACKGROUND.running.clear(); X3_BACKGROUND.hydrating.clear(); X3_BACKGROUND.checked.clear(); }catch(_){}
  // V7.20.35 Pro lifecycle: runtime invalidation must never erase the last committed
  // History display generation. HISTORY_SUMMARY_CACHE_KEY and the atomic committed
  // snapshot are fingerprint-gated, so a real History/engine change makes them stale
  // automatically while ordinary navigation/render invalidations keep READY visible.
}
function unifiedAITrustedSummary(draws,profileId,engine){
  const id=Number(profileId); let hit=0,total=0;
  for(const draw of (Array.isArray(draws)?draws:[])){
    const row=getUnifiedAIHistoryStatuses(draw,id);
    const status=row?.[engine]||"pending";
    if(!row?.trusted||status==="pending") continue;
    total++; if(status==="exact"||status==="reversed"||status==="swap") hit++;
  }
  return {hit,total,rate:total?Math.round(hit*1000/total)/10:0};
}
function publishUnifiedAIBundles(profileId,{p19Bundle=null,x3Bundle=null}={}){
  const id=Number(profileId);
  if(p19Bundle?.statusMap instanceof Map){ persistPatternV19PrimarySummary(id,p19Bundle); PERF_CACHE.patternV19Bundle.set(p19BundleCacheKey(id),p19Bundle); V19_BACKGROUND.ready.add(v19BackgroundKey(id)); }
  if(x3Bundle?.statusMap instanceof Map){ PERF_CACHE.x3Bundle.set(x3BundleCacheKey(id),x3Bundle); X3_BACKGROUND.ready.add(x3BundleCacheKey(id)); void persistX3Bundle(id,x3Bundle); }
  AI_STANDARD_SNAPSHOT_CACHE={signature:'',builtAt:0,profiles:new Map()};
  try{ PERF_CACHE.autoDecision.clear(); PERF_CACHE.calculatorTables.clear(); PERF_CACHE.calculatorEngine?.clear(); }catch(_){}
  if(state.currentView==='weekly') scheduleAIStandardSummaryCacheBuild(id,null,2600);
  return true;
}

// V7.20.25 — App-standard atomic History transaction.
// One committed snapshot is the only source for History rows + summaries + sorting.
// Save / Delete / Import / Full Rebuild may compute privately, but UI never observes
// a half-published generation. A profile transaction is serialized and commits once.
const AI_HISTORY_COMMITTED_SNAPSHOT_KEY = "luckyNumber_ai_history_snapshot_v72025";
const AI_HISTORY_COMMITTED_SCHEMA = "H35-ATOMIC-PERSISTENT";
const AI_HISTORY_TX_CHAINS = new Map();
let AI_HISTORY_COMMITTED_STORE_MEMORY=null, AI_HISTORY_COMMITTED_STORE_RAW='';
function readAIHistoryCommittedStore(){
  try{
    const raw=localStorage.getItem(AI_HISTORY_COMMITTED_SNAPSHOT_KEY)||'{}';
    if(AI_HISTORY_COMMITTED_STORE_MEMORY && raw===AI_HISTORY_COMMITTED_STORE_RAW) return AI_HISTORY_COMMITTED_STORE_MEMORY;
    const parsed=JSON.parse(raw)||{};
    AI_HISTORY_COMMITTED_STORE_RAW=raw; AI_HISTORY_COMMITTED_STORE_MEMORY=parsed;
    return parsed;
  }catch(_){ return AI_HISTORY_COMMITTED_STORE_MEMORY||{}; }
}
function aiHistoryDatasetFingerprint(profileId, draws){
  const id=Number(profileId)||0;
  const list=(Array.isArray(draws)?draws:[]).slice().sort((a,b)=>String(a?.date||'').localeCompare(String(b?.date||''))||Number(a?.createdAt||0)-Number(b?.createdAt||0)||String(a?.id||'').localeCompare(String(b?.id||'')));
  let h=2166136261>>>0;
  const mix=(v)=>{ const str=String(v??''); for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } };
  mix(AI_HISTORY_COMMITTED_SCHEMA); mix(WF_ENGINE_VERSION); mix(PATTERN_V19_ENGINE_SIGNATURE); mix(X3_ENGINE_SIGNATURE); mix(id); mix(list.length);
  for(const d of list){ mix(d?.id); mix(d?.date); mix(d?.number); mix(d?.twoDigit); mix(d?.referenceTableId); }
  // P19/X3 depend on the historical 5-digit source table too; include that fingerprint
  // so an actual table/input edit marks the snapshot dirty even when the draw count is unchanged.
  try{ mix(p19PersistentFingerprint(id)); }catch(_){ }
  return `${id}|${list.length}|${h.toString(16)}`;
}
function readCommittedAIHistorySnapshot(profileId,draws){
  try{
    const all=readAIHistoryCommittedStore();
    const item=all?.[String(Number(profileId)||0)];
    return item?.fingerprint===aiHistoryDatasetFingerprint(profileId,draws) ? item : null;
  }catch(_){ return null; }
}
function persistCommittedAIHistorySnapshot(profileId,draws,snapshot){
  try{
    const all={...readAIHistoryCommittedStore()};
    all[String(Number(profileId)||0)]={...snapshot,fingerprint:aiHistoryDatasetFingerprint(profileId,draws),profileId:Number(profileId)||0,committedAt:Date.now()};
    const raw=JSON.stringify(all);
    localStorage.setItem(AI_HISTORY_COMMITTED_SNAPSHOT_KEY,raw);
    AI_HISTORY_COMMITTED_STORE_RAW=raw; AI_HISTORY_COMMITTED_STORE_MEMORY=all;
  }catch(e){ console.warn('AI History snapshot persist skipped',e); }
}
function buildCommittedAIHistorySnapshot(profileId,draws){
  const id=Number(profileId), list=Array.isArray(draws)?draws:[];
  const hits=Object.fromEntries(UNIFIED_AI_ENGINE_ORDER.map(k=>[k,0]));
  const totals=Object.fromEntries(UNIFIED_AI_ENGINE_ORDER.map(k=>[k,0]));
  const rows={}; let trusted=0,pending=0;
  for(const draw of list){
    const row=getUnifiedAIHistoryStatuses(draw,id);
    const key=unifiedAIRowKey(draw);
    if(!row?.trusted) continue;
    trusted++;
    const statuses={};
    for(const engine of UNIFIED_AI_ENGINE_ORDER){
      const st=row?.[engine]||row?.engineStatuses?.[engine]||'pending'; statuses[engine]=st;
      if(st==='pending'){ pending++; continue; }
      totals[engine]++; if(st==='exact'||st==='reversed'||st==='swap') hits[engine]++;
    }
    rows[key]=statuses;
  }
  if(pending>0) return {ok:false,trusted,pending};
  const summaries=Object.fromEntries(UNIFIED_AI_ENGINE_ORDER.map(k=>[k,{hit:hits[k],total:totals[k],rate:totals[k]?Math.round(hits[k]*1000/totals[k])/10:0}]));
  return {ok:true,trusted,pending:0,rows,summaries,generation:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`};
}
async function runAIHistoryTransaction(profileId,reason='mutation'){
  const id=Number(profileId), previous=AI_HISTORY_TX_CHAINS.get(id)||Promise.resolve();
  const job=previous.catch(()=>{}).then(async()=>{
    const draws=(state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===id).sort((a,b)=>String(a?.date||'').localeCompare(String(b?.date||''))||Number(a?.createdAt||0)-Number(b?.createdAt||0));
    // Prepare all model adapters privately. No History render is allowed in this block.
    try{ await warmUnifiedP18ProfileCache(id); }catch(e){ console.warn('P18 transaction warm skipped',id,e); }
    try{
      const combined=await computeP19X3HistoryBundlesAsync(draws,id,{fast:true});
      publishUnifiedAIBundles(id,combined||{});
    }catch(e){ console.error('P19/X3 transaction compute failed',id,e); return {ok:false,profileId:id,reason:'p19-x3'}; }
    // Give Classic/AI-L/GL a bounded chance to finish any already-started WF commit.
    let snapshot=null;
    for(let attempt=0;attempt<4;attempt++){
      snapshot=buildCommittedAIHistorySnapshot(id,draws);
      if(snapshot.ok) break;
      await new Promise(r=>setTimeout(r,40*(attempt+1)));
    }
    // If trusted WF rows are still pending, rebuild only this profile's current range once.
    // This is a recovery path, not the normal daily path.
    if(!snapshot?.ok && draws.length){
      try{
        await rebuildWalkForwardBacktest(id,null,{startDate:String(draws[0]?.date||''),fastEvolution:true,yieldEvery:8});
        await warmUnifiedP18ProfileCache(id);
        const combined=await computeP19X3HistoryBundlesAsync(draws,id,{fast:true});
        publishUnifiedAIBundles(id,combined||{});
        snapshot=buildCommittedAIHistorySnapshot(id,draws);
      }catch(e){ console.error('AI History recovery transaction failed',id,e); }
    }
    if(!snapshot?.ok) return {ok:false,profileId:id,reason:'pending',trusted:snapshot?.trusted||0,pending:snapshot?.pending||0};
    // Single atomic publication point used by History + Analysis + sorting.
    persistCommittedAIHistorySnapshot(id,draws,snapshot);
    persistHistorySummaryCache(id,draws,snapshot.summaries);
    return {ok:true,profileId:id,reason,trusted:snapshot.trusted,pending:0,summaries:snapshot.summaries,generation:snapshot.generation};
  });
  const tracked=job.finally(()=>{ if(AI_HISTORY_TX_CHAINS.get(id)===tracked) AI_HISTORY_TX_CHAINS.delete(id); });
  AI_HISTORY_TX_CHAINS.set(id,tracked);
  return job;
}

// V7.20.25 — History mutation barrier. After Save/Delete, all six AI engines must
// publish one complete trusted generation BEFORE History is rendered/sorted.
// This prevents P19/X3 from temporarily falling to the last columns with “—” while
// their private background caches are still warming. UI ordering therefore remains
// Highest → Lowest from one atomic summary snapshot.
function scheduleAIHistoryTransactionRetry(profileId=state.activeProfile,delay=350){
  const id=Number(profileId);
  setTimeout(async()=>{
    const result=await runAIHistoryTransaction(id,'retry');
    if(result?.ok && state.currentView==='history' && Number(state.activeProfile)===id && !userInteractionHot(250)){
      activeRenderPerfSignature=''; invalidateViewCache(); requestAnimationFrame(()=>render());
      showToast('✓ History / AI ซิงก์ครบแล้ว');
    }
  },Math.max(120,Number(delay)||350));
}
async function refreshUnifiedAIHistoryAfterMutation(profileId=state.activeProfile){
  return runAIHistoryTransaction(profileId,'history-mutation');
}

function getRecentAIWinnerSummary(days = 7) {
  const recentCacheKey = `${Number(days)||7}|${activeRenderPerfSignature}`;
  if (PERF_CACHE.recentAIWinner.has(recentCacheKey)) return PERF_CACHE.recentAIWinner.get(recentCacheKey);
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
  const emptyCounts = {classic:0, aiL:0,gl:0, p18:0, p19:0, x3:0};
  if (!all.length) {
    const out = {windowDays, windowMode:windowDays===7?"draws":"days", anchorDate:null, startDate:null, evaluated:0, tie:0, noWinner:0, counts:emptyCounts, profileWins:{classic:{},aiL:{},gl:{},p18:{},p19:{},x3:{}}, details:[], champion:null};
    PERF_CACHE.recentAIWinner.set(recentCacheKey, out);
    return out;
  }

  const anchorDate = String(all.at(-1).date);
  // V6.9.3: default 7 = latest 7 actual draw dates (7 งวด), not 7 calendar days.
  const recentDrawDates = [...new Set(all.map(r => String(r.date)))].sort();
  const sevenDrawDates = windowDays === 7 ? recentDrawDates.slice(-7) : null;
  const sevenDrawDateSet = sevenDrawDates ? new Set(sevenDrawDates) : null;
  const startDate = windowDays === 7 ? (sevenDrawDates?.[0] || anchorDate) : shiftIsoDate(anchorDate, -(windowDays - 1));
  const periodDraws = windowDays === 7 ? all.filter(r => sevenDrawDateSet.has(String(r.date))) : all.filter(r => String(r.date) >= startDate && String(r.date) <= anchorDate);
  const windowMode = windowDays === 7 ? "draws" : "days";

  // V7.20.62 — Pro all-profile atomic read path.
  // History UI is backed by the committed six-engine atomic snapshot. Recent Winner must
  // consume that exact committed row contract too, rather than depending on private model
  // caches being hydrated for inactive profiles. This is read-only and performs no rebuild.
  const recentProfileIds = [...new Set(periodDraws.map(r => Number(r.profileId ?? 0)).filter(Number.isFinite))];
  const committedByProfile = new Map();
  for (const profileId of recentProfileIds) {
    const profileDraws=(state.actualDraws||[])
      .filter(d=>Number(d?.profileId??0)===profileId)
      .sort((a,b)=>String(a?.date||'').localeCompare(String(b?.date||''))||Number(a?.createdAt||0)-Number(b?.createdAt||0));
    let committed=null;
    try { committed=readCommittedAIHistorySnapshot(profileId,profileDraws); } catch (_) {}
    if(committed?.rows) committedByProfile.set(profileId,committed);
    // Fallback restore remains cheap/read-only for profiles without a committed generation.
    try { restoreUnifiedAIProfileSync(profileId); } catch (_) {}
  }

  const counts = {...emptyCounts};
  const profileWins = {classic:{}, aiL:{},gl:{}, p18:{}, p19:{}, x3:{}};
  const labels = {classic:"สูตรเดิม", aiL:"AI L",gl:"AI GL", p18:"P18", p19:"P19", x3:"X3"};
  const isHit = status => status === "exact" || status === "reversed" || status === "swap";
  let evaluated = 0, tie = 0, noWinner = 0;
  const details = [];

  // V7.20.21: Analysis consumes the same Unified AI Registry row contract as History.
  periodDraws.forEach(r => {
    const profileId = Number(r.profileId ?? 0);
    // Single source of truth: use the exact status resolver that History renders.
    // This includes verified/live, walk-forward, and legacy historical display fallback.
    const comparison = getUnifiedAIHistoryStatuses(r, profileId, {display:true});
    if (!comparison.table?.inputDigits) return; // same History eligibility rule
    // Canonical source = the same atomic committed row used by History. This keeps P18/P19/X3
    // visible for inactive profiles without warming/rebuilding their private caches.
    const committedRow=committedByProfile.get(profileId)?.rows?.[unifiedAIRowKey(r)] || null;
    const statuses=committedRow
      ? Object.fromEntries(UNIFIED_AI_ENGINE_ORDER.map(key=>[key,committedRow?.[key] || comparison.engineStatuses?.[key] || 'pending']))
      : comparison.engineStatuses;
    const available = Object.entries(statuses).filter(([,status]) => status !== "pending");
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
  const out = {windowDays, windowMode, anchorDate, startDate, evaluated, tie, noWinner, counts, profileWins, details, ranking, champion};
  PERF_CACHE.recentAIWinner.set(recentCacheKey, out);
  return out;
}

function getDailyAIWinnerView(summary, selectedDate) {
  const details = (summary.details || []).filter(d => d.date === selectedDate).sort((a,b)=>a.profileId-b.profileId);
  const aiDefs = [
    {key:"x3", label:"X3"},
    {key:"classic", label:"Classic L"},
    {key:"aiL", label:"AI L"},
    {key:"gl",label:"AI GL • HYBRID"},
    {key:"p18", label:"P18"},
    {key:"p19", label:"P19"}
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
  const labels = {classic:"สูตรเดิม", aiL:"AI L",gl:"AI GL", p18:"P18", p19:"P19", x3:"X3"};
  // V7.19.26 — Analysis Main League: P19 is visible beside P18 in every window.
  const rows = ["x3","p19","p18","gl","aiL","classic"]
    .map(key => ({key,label:labels[key],wins:Number(s.counts[key] || 0)}))
    .sort((a,b)=>b.wins-a.wins || a.label.localeCompare(b.label));
  const maxWins = Math.max(1, ...rows.map(x=>x.wins));
  const champText = s.champion ? `${s.champion.label} • ${s.champion.wins} ชนะ` : "ยังไม่มีผู้ชนะ";
  const periodText = s.anchorDate ? `${formatDateTH(s.startDate)} – ${formatDateTH(s.anchorDate)}` : "ยังไม่มีผลจริง";
  const profileLine = key => {
    const entries = Object.entries(s.profileWins[key] || {}).map(([id,wins]) => ({id:Number(id), wins:Number(wins), name:state.profiles[Number(id)] || `Profile ${Number(id)+1}`})).sort((a,b)=>b.wins-a.wins || a.name.localeCompare(b.name));
    return entries.length ? entries.map(x=>`${escapeHtml(x.name)} ×${x.wins}`).join(" • ") : "ยังไม่มี Profile ที่ชนะ";
  };

  // V7.20.60 — restore the compact daily drill-down only.
  // This reuses the already-built Recent Winner summary and does not restore the removed
  // six large model tiles or the Hit-Miss behavior section.
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

function renderAntiLeakAnalysisCardFresh(profileId) {
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


// V7.20.36 — Analysis disclosure work is truly lazy. Closed cards do zero History/WF scans.
function renderAntiLeakAnalysisCard(profileId){
  return `<details class="anti-leak-audit-card pass" data-lazy-analysis="antileak" data-profile-id="${Number(profileId)||0}"><summary class="anti-leak-audit-summary"><span class="anti-leak-lock">🔒</span><span class="anti-leak-summary-copy"><small>DATA LEAK AUDIT</small><b>Anti-Leak: <em>ตรวจเมื่อเปิด</em></b></span><span class="anti-leak-summary-status">Lazy</span><i class="anti-leak-chevron">⌄</i></summary><div class="anti-leak-audit-body analysis-lazy-body"><p>แตะเพื่อรัน Prior-only audit • ไม่สแกน History ขณะเปิดหน้า Analysis</p></div></details>`;
}
function replaceLazyAnalysisDetail(details,html){
  if(!details || !html) return false;
  const tmp=document.createElement("div"); tmp.innerHTML=html;
  const fresh=tmp.querySelector("details"); if(!fresh) return false;
  fresh.open=true; fresh.dataset.loaded="1"; details.replaceWith(fresh); return true;
}
function hydrateLazyAnalysisDetail(details){
  if(!details || details.dataset.loaded==="1") return;
  const type=String(details.dataset.lazyAnalysis||""), id=Number(details.dataset.profileId||state.activeProfile)||0;
  const win=Number(details.dataset.window||state.analysisWinWindow||30), base=proCanonicalDataFingerprint();
  const sig=`${PRO_VIEW_SNAPSHOT_SCHEMA}|detail:${type}|p${id}|w${win}|${base}`;
  const key=`${type}:p${id}:w${win}`, cached=readPersistentProDetail(key,sig);
  if(cached){ replaceLazyAnalysisDetail(details,cached); return; }
  requestAnimationFrame(()=>setTimeout(()=>{
    if(!details.open || details.dataset.loaded==="1") return;
    let html="";
    if(type==="antileak") html=renderAntiLeakAnalysisCardFresh(id);
    if(html){ persistProDetail(key,sig,html); replaceLazyAnalysisDetail(details,html); }
  },0));
}
function renderAnalysisModelPerformance(profileId = state.activeProfile){
  const id=Number(profileId);
  const draws=(state.actualDraws||[]).filter(r=>Number(r?.profileId??0)===id);
  restoreUnifiedAIProfileSync(id);
  const committed=readCommittedAIHistorySnapshot(id,draws);
  const cached=readHistorySummaryCache(id,draws);
  const s=committed?.summaries||cached?.summaries||null;
  const classic=s?.classic||trustedHistorySummary(draws,id,"classic");
  const aiL=s?.aiL||trustedHistorySummary(draws,id,"aiL");
  const gl=s?.gl||trustedHistorySummary(draws,id,"gl");
  const p18=s?.p18||patternV18TrustedHistorySummary(draws,id);
  const p19=s?.p19||getPatternV19PrimarySummary(id)||{hit:0,total:0,rate:0,pending:true};
  const x3=s?.x3||PERF_CACHE.x3Bundle.get(x3BundleCacheKey(id))?.summary||{hit:0,total:0,rate:0,pending:true};
  const champion=buildHistoryChampionSummary(classic,aiL,gl,null,p18,p19,x3,null);
  return `<section class="analysis-model-performance"><div class="analysis-section-head"><div><small>MODEL PERFORMANCE</small><h3>Champion & Ranking</h3></div><span class="ux-count-pill">Prior-only</span></div>${renderHistoryChampion(champion)}${renderHistoryRankingBoard(champion)}</section>`;
}

function renderAnalysis(){
  const id=Number(state.activeProfile)||0, cached=readPersistentProView("analysis",id);
  if(cached) return cached;
  const html=renderAnalysisFresh(); persistProView("analysis",id,html); return html;
}

function renderAnalysisFresh() {
  // V7.20.36: generate only content that is visible before disclosure cards are opened.
  const profileId = Number(state.activeProfile);
  ensureProfileDerivedHistoryReady(profileId, {repairTables:false});
  const all=state.actualDraws.filter(r=>Number(r.profileId??0)===profileId);
  const linkedDraws = all.filter(d => getPredictionTable(profileId, d.date));
  const windowDays = [7,14,30,60,90,180].includes(Number(state.analysisWinWindow)) ? Number(state.analysisWinWindow) : 30;
  return `<section class="card ux-page-card analysis-v690">
    <div class="ux-page-head"><div><small>ANALYSIS</small><h2>ผลวิเคราะห์</h2><p>${escapeHtml(state.profiles[profileId]||`Profile ${profileId+1}`)} • ใช้ข้อมูลเดียวกับ History</p></div><span class="ux-count-pill">${linkedDraws.length} งวด</span></div>
    ${profileTabs()}
    <div class="analysis-global-range"><span>ช่วงวิเคราะห์</span><div>${[7,14,30,60,90,180].map(day=>`<button type="button" class="${windowDays===day?'active':''}" data-analysis-window="${day}">${day}</button>`).join('')}</div></div>
    ${renderRecentAIWinnerCard()}
    ${renderProfileRanking()}
    ${renderAnalysisModelPerformance(profileId)}
    <p class="score-explainer">Score / Confidence / Weight ใช้ช่วยจัดอันดับเท่านั้น ไม่ใช่เปอร์เซ็นต์รับประกันผล</p>
    ${renderAntiLeakAnalysisCard(profileId)}
  </section>`;
}
function progressCard(label, value) {
  return `<div class="progress-card"><div><span>${label}</span><b>${value}%</b></div><div class="progress"><i style="width:${value}%"></i></div></div>`;
}

// V7.09.63 — "Clear all data" keeps the user's Profile identities/names.
// Only Profile content/History/AI/WF-derived data is reset. This avoids forcing
// users to recreate 5/10/20+ Profile names after every clean import cycle.
function buildClearedStateKeepingProfiles(currentState) {
  const base = typeof structuredClone === "function" ? structuredClone(DEFAULT_STATE) : JSON.parse(JSON.stringify(DEFAULT_STATE));
  const keptProfiles = Array.isArray(currentState?.profiles) && currentState.profiles.length
    ? currentState.profiles.map((name, index) => String(name || "").trim() || `Profile ${index + 1}`)
    : [...DEFAULT_STATE.profiles];
  const keptActive = Math.max(0, Math.min(Number(currentState?.activeProfile || 0), keptProfiles.length - 1));
  base.profiles = keptProfiles;
  base.activeProfile = keptActive;
  // Preserve the Profile identity revision and advance it once so stale snapshots
  // from before Clear cannot outrank this freshly-reset Profile list.
  base._profileRevision = Math.max(0, Number(currentState?._profileRevision || 0)) + 1;
  base._historyResetAt = Date.now();
  return base;
}

function renderSettings() {
  const c=getRankingConfig(), total=c.weight10+c.weight30+c.weightAll;
  return `<section class="card ux-page-card settings-v690 settings-pro-order">
    <div class="ux-page-head settings-title-only"><div><small>SETTING</small></div><span class="settings-app-version">${APP_DISPLAY_VERSION}</span></div>

    <div class="settings-section-card profiles-settings-card">
      <div class="settings-section-head profiles-section-head"><span>👤</span><div><b>Profiles</b><small>${state.profiles.length} Profile • เพิ่มได้แบบ Dynamic${state.profiles.length > PROFILE_SOFT_GUIDE ? ` • จำนวนมากอาจทำให้ WF ใช้เวลานานขึ้น` : ``}</small></div><button type="button" id="btnProfileReorderMode" class="profile-reorder-mode-btn" aria-pressed="false">แก้ไขลำดับ</button></div>
      <div class="profile-search-row"><span aria-hidden="true">⌕</span><input id="profileSettingsSearch" type="search" placeholder="ค้นหา Profile..." autocomplete="off" aria-label="ค้นหา Profile"><button type="button" id="profileSettingsSearchClear" aria-label="ล้างคำค้น" hidden>×</button></div>
      <div class="profile-search-meta" id="profileSearchMeta" hidden></div>
      <div class="settings-list profile-sort-list" id="profileSortList">${state.profiles.map((name,i)=>`<div class="profile-swipe-row" data-profile-row="${i}" data-profile-name="${escapeHtml(String(name).toLowerCase())}"><div class="profile-delete-action"><button type="button" data-delete-profile="${i}">ลบ</button></div><div class="profile-row-content" data-row-content="${i}"><span class="profile-settings-index">${i+1}</span><input class="name-input profile-name-clean" data-name-index="${i}" value="${escapeHtml(name)}" maxlength="30" aria-label="ชื่อ ${escapeHtml(name)}"><button type="button" class="profile-drag-handle" data-drag-handle="${i}" aria-label="ลาก ${escapeHtml(name)}">☰</button></div></div>`).join("")}</div>
      <div class="profile-reorder-hint" id="profileReorderHint" hidden>กดค้างที่ ☰ แล้วลากเพื่อเปลี่ยนลำดับ</div>
      <div class="settings-inline-actions"><button id="btnAddProfile" class="btn secondary">＋ เพิ่ม</button><button id="btnSaveNames" class="btn primary">บันทึก</button></div>
    </div>

    <div class="settings-section-card app-update-card">
      <div class="settings-section-head"><span>↻</span><div><b>App Update</b><small>ตรวจเวอร์ชันใหม่และ Refresh asset อย่างปลอดภัย</small></div><span class="update-safe-badge">AUTO</span></div>
      <button id="btnSafeRefreshApp" class="btn primary full">Check Update • Refresh</button>
      <p class="theme-help app-update-help">ไม่ลบ Home Screen • History • Settings • AI/WF data</p>
      <div id="safeRefreshStatus" class="safe-refresh-status" aria-live="polite"></div>
    </div>

    <div class="settings-section-card">
      <div class="settings-section-head"><span>💾</span><div><b>Data & Backup</b><small>สำรอง / Restore JSON</small></div></div>
      <button id="btnExport" class="btn secondary full">สำรองข้อมูลไป Files / iCloud</button>
      <label class="btn secondary full file-button" for="importFile"><span class="restore-label-text">กู้คืน JSON • Verified Smart Restore</span><input id="importFile" type="file" accept="application/json,.json" hidden></label>
      ${renderJsonRestoreStatus()}
      <button id="btnResetAll" class="btn danger full">ล้างข้อมูลทั้งหมด</button>
    </div>

    <div class="settings-section-card full-system-rebuild-card">
      <div class="settings-section-head"><span>⟳</span><div><b>Rebuild</b><small>สร้าง AI / WF / Ranking ใหม่จาก History ปัจจุบัน</small></div><span class="update-safe-badge">HISTORY SAFE</span></div>
      <button id="btnFullSystemRebuild" class="btn primary full rebuild-main-btn">⟳ Rebuild</button>
      <p class="theme-help">เก็บ History / Profile / Settings ไว้ครบ • งาน Rebuild ทำต่อแบบเบื้องหลัง</p>
      <div id="fullSystemRebuildStatus" class="safe-refresh-status" aria-live="polite"></div>
    </div>

    <div class="settings-section-card">
      <div class="settings-section-head"><span>◐</span><div><b>Appearance</b><small>เลือกตาม iPhone หรือกำหนดเอง</small></div></div>
      <div class="theme-segment" role="group" aria-label="Appearance">
        <button type="button" data-theme-mode="auto" class="${state.theme === "auto" ? "active" : ""}">⚙️ Auto</button>
        <button type="button" data-theme-mode="light" class="${state.theme === "light" ? "active" : ""}">☀️ Light</button>
        <button type="button" data-theme-mode="dark" class="${state.theme === "dark" ? "active" : ""}">🌙 Dark</button>
      </div>
      <p class="theme-help">Auto จะเปลี่ยนตาม Light / Dark Mode ของ iPhone</p>
    </div>

    <details class="ux-disclosure settings-advanced">
      <summary><span><b>Advanced & Maintenance</b><small>AI engine • Rebuild • Ranking weights</small></span><i>⌄</i></summary>
      <div class="ux-disclosure-body">
        <div class="settings-section-card settings-advanced-inner">
          <div class="settings-section-head"><span>🤖</span><div><b>AI Runtime</b><small>X3 + P19 + P18 + Classic L + AI L + AI GL</small></div></div>
          <p class="theme-help"><b>Lean Runtime:</b> Diagnostic/preview UI ถูกย้ายออกจาก Calculate แต่ engine ที่จำเป็นยังอยู่ครบ</p>
        </div>
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
    saveUiStateFast();
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

    // V7.20.34 — Calculate Profile tap = newest History 3D+2D first; AUTO resolves after paint.
    if (state.currentView === "home") {
      const latestSync = loadLatestProfileResultIntoCalculator(id);
      paintLatestProfileDigitsImmediately(id, latestSync);
      saveUiStateFast();
      scheduleCalculatorProfileRefresh(id);
      if (!latestSync.loaded) showToast(`ยังไม่มีเลขออกจริงล่าสุดของ ${state.profiles[id] || "Profile"}`);
      return;
    }

    saveUiStateFast();
    refreshCurrentView();
  }));
  document.querySelectorAll("[data-record]").forEach(el => el.addEventListener("click", () => openRecordDetail(el.dataset.record)));
}

function bindView() {
  if (state.currentView === "home") bindHome();
  if (state.currentView === "weekly") {
    document.querySelectorAll("[data-ai-select-history]").forEach(button=>button.addEventListener("click",event=>{
      event.preventDefault();event.stopPropagation();
      const id=Number(button.dataset.aiSelectHistory);
      if(!Number.isInteger(id)||id<0||id>=(state.profiles||[]).length) return;
      state.activeProfile=id;
      historyVisibleLimitByProfile[id]=HISTORY_FIRST_BATCH;
      saveUiStateFast();
      navigateToView("history");
    }));
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
      showToast(mode === "auto" ? `✓ AUTO เปิดแล้ว • ตอนนี้ใช้ ${resolved === "combo"?`COMBO • ${getAutoFormulaDecision(state.activeProfile)?.comboLabel||"AUTO"}`:resolved === "blend"?"BLEND • AI L + AI GL":resolved === "x3"?"X3":resolved === "p19"?"P19":resolved === "pattern"?"P18":resolved === "gl"?"AI GL":resolved === "ai" ? "AI L" : "Classic L"}` : mode === "gl"?"✓ เปลี่ยนเป็น AI GL แล้ว":mode === "ai" ? "✓ เปลี่ยนเป็น AI Champion แล้ว" : "✓ เปลี่ยนเป็น Original Formula แล้ว");
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
      saveState();clearPerformanceCaches();activeRenderPerfSignature="";refreshCurrentView();
      showToast(glFormulaEligibility(result,Number(state.activeProfile)).allowed?"✓ AI GL ผ่าน Trusted Gate • READY":"AI GL รุ่นใหม่ถูกเก็บเป็น Candidate เพื่อเรียนต่อ");
    });
    document.getElementById("previewAIGLFormula")?.addEventListener("click",()=>{
      const saved=state.aiGLFormulaLab?.[Number(state.activeProfile)];if(!saved?.formula)return alert("ยังไม่มีสูตร AI GL");
      const grid=formulaGrid(state.lastInput,saved.formula);if(!grid)return alert("กรุณากรอกตัวเลข 5 หลักในหน้า Calculate ก่อน");
      state.grid=grid;saveState();navigateToView("home");showToast("เปิดตาราง AI GL แบบ Preview แล้ว");
    });
    document.getElementById("previewAIFormula")?.addEventListener("click",()=>{
      const saved=state.aiFormulaLab?.[Number(state.activeProfile)];
      if (!saved?.formula) return alert("ยังไม่มีสูตร AI");
      const grid=formulaGrid(state.lastInput,saved.formula);
      if (!grid) return alert("กรุณากรอกตัวเลข 5 หลักในหน้า Calculate ก่อน");
      state.grid=grid; saveState(); navigateToView("home");
      showToast("ทดลองคำนวณด้วยสูตร AI ครั้งนี้แล้ว โดยยังไม่เปลี่ยนสูตรหลัก");
    });
    document.getElementById("activateAIFormula")?.addEventListener("click",()=>{
      const id=Number(state.activeProfile), saved=state.aiFormulaLab?.[id], check=formulaEligibility(saved);
      if (!check.allowed) return alert(check.reason);
      if (!confirm(`ใช้สูตร AI เป็นสูตรหลักของ ${state.profiles[id]} หรือไม่?\n\nสูตรดั้งเดิมจะยังถูกเก็บไว้และย้อนกลับได้ตลอด`)) return;
      state.activeFormulaByProfile = state.activeFormulaByProfile || {};
      state.activeFormulaByProfile[id]="ai";
      state.grid=calculateGrid(state.lastInput,id); saveState(); refreshCurrentView();
    });
    document.getElementById("restoreOriginalFormula")?.addEventListener("click",()=>{
      const id=Number(state.activeProfile);
      if (!confirm("กลับมาใช้สูตรดั้งเดิมหรือไม่? สูตร AI ทดลองจะยังถูกเก็บไว้")) return;
      state.activeFormulaByProfile = state.activeFormulaByProfile || {};
      state.activeFormulaByProfile[id]="original";
      state.grid=calculateGrid(state.lastInput,id); saveState(); refreshCurrentView();
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
      historyVisibleLimitByProfile[Number(state.activeProfile)||0]=HISTORY_FIRST_BATCH;
      refreshCurrentView();
    }));
    document.querySelectorAll("[data-formula-mode]").forEach(btn => btn.addEventListener("click", () => { state.historyFormulaMode = btn.dataset.formulaMode; historyDeleteRevealId = null; refreshCurrentView(); }));
    document.getElementById("btnHistoryManagerToggle")?.addEventListener("click", event => {
      event.preventDefault();
      historyManagerOpen = !historyManagerOpen;
      if (!historyManagerOpen) { historyEditMode = false; historyDeleteRevealId = null; }
      refreshCurrentView();
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
    const historyMore=document.querySelector("[data-history-load-more]");
    if(historyMore){
      let loaded=false, io=null;
      const loadMore=()=>{
        if(loaded) return; loaded=true; if(io) io.disconnect();
        const id=Number(state.activeProfile)||0;
        historyVisibleLimitByProfile[id]=Math.max(HISTORY_FIRST_BATCH,Number(historyVisibleLimitByProfile[id]||HISTORY_FIRST_BATCH))+HISTORY_BATCH_STEP;
        refreshCurrentView();
      };
      historyMore.addEventListener("click",loadMore,{once:true});
      if("IntersectionObserver" in window){
        io=new IntersectionObserver(entries=>{ if(entries.some(e=>e.isIntersecting)) loadMore(); },{rootMargin:"600px 0px"});
        io.observe(historyMore);
      }
    }
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
    document.querySelectorAll("details[data-lazy-analysis]").forEach(details => details.addEventListener("toggle", () => {
      if(details.open) hydrateLazyAnalysisDetail(details);
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
    independentCalculatePreviewProfile = null;
    mlCalculatePreviewProfile = null;
    if (!Array.isArray(state.lastInput) || state.lastInput.length!==5 || state.lastInput.some(v=>!/^\d$/.test(String(v)))) return alert("Please enter all 5 digits");
    const decision=getConfiguredFormulaMode(state.activeProfile)==="auto"?getAutoFormulaDecision(state.activeProfile):null;
    syncCalculatorTableViewToActiveFormula(state.activeProfile, false, decision);
    const selected=getCalculatorSelectedTable(state.activeProfile);
    if (!selected?.grid) return alert(`${selected?.label || 'Formula'} ยังไม่มีตารางสำหรับงวดนี้`);
    state.grid = selected.grid; saveState(); refreshCurrentView();
  });
  document.getElementById("btnClear")?.addEventListener("click", () => {
    independentCalculatePreviewProfile = null;
    mlCalculatePreviewProfile = null;
    state.lastInput = ["","","","",""]; state.grid = null; state.selectedL = null; state.calculationDate = null; saveState(); refreshCurrentView();
  });
  document.getElementById("btnFindL")?.addEventListener("click", () => {
    const selected=getCalculatorSelectedTable(state.activeProfile);
    const visibleGrid=selected?.grid || state.grid;
    if(!visibleGrid) return alert(`${selected?.label || 'AI'} ยังไม่มีตารางสำหรับงวดนี้`);
    // Keep legacy detail/highlight views aligned with the exact table currently selected.
    state.grid = visibleGrid;
    // V7.20.32 — AUTO tap fast-path. The Calculate screen already computed/cached the resolved
    // engine table. Open the AUTO result route immediately; do not run findLResults on the
    // projected X3/P19 grid and do not rebuild all engines before the modal can paint.
    if(getConfiguredFormulaMode(state.activeProfile)==="auto") {
      currentLResultMode = "l";
      currentLResults = [];
      openLResults("", currentLRankLimit, "l");
      return;
    }
    if(selected?.key === "pattern" || selected?.key === "p19") {
      currentLResultMode = selected.key;
      currentLResults = Array.isArray(selected?.results) ? selected.results : [];
      openLResults("", currentLRankLimit, selected.key);
      return;
    }
    currentLResults = findLResults(visibleGrid);
    openLResults("", currentLRankLimit, selected?.key === "gl" ? "gl" : selected?.key === "ai" ? "ai" : "l");
  });
  // V7.19.21 — no Calculator engine-tab listeners: AUTO/shared strategy controls the visible table.
  document.getElementById("btnIndependentResults")?.addEventListener("click", () => {
    currentLResultMode = "independent";
    openLResults("", currentLRankLimit, "independent");
  });
  document.querySelectorAll("#btnExitIndependentPreview").forEach(button=>button.addEventListener("click",()=>{
    independentCalculatePreviewProfile = null;
    refreshCurrentView();
  }));
  document.querySelectorAll("#btnExitMLPreview").forEach(button=>button.addEventListener("click",()=>{
    mlCalculatePreviewProfile = null;
    refreshCurrentView();
  }));
  document.getElementById("btnMLPreviewDetails")?.addEventListener("click",()=>{
    mlCalculatePreviewProfile = null;
    navigateToView("weekly");
  });
}


function getCandidateUiMeta(items,index,mode,dataCount=0) {
  const raw=x=>Number(x?.comboFusionScore ?? (mode==="master"?x?.masterScore:mode==="overlap"?((Number(x?.aiScore)||0)+(Number(x?.independentScore)||0))/2:x?.aiScore))||0;
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
  currentLResultMode = (MASTER_AI_PAUSED && mode === "master") ? "l" : (mode === "blend" ? "l" : (["l","ai","gl","pattern","p19","x3","combo","totalcombo","independent","master","overlap"].includes(mode) ? mode : "l"));

  // V7.20.32 — resolve AUTO first. Ranking Classic/AI L/AI GL scans History records and is
  // expensive on iPhone; only run those scans when the selected popup route actually needs them.
  const sharedAutoDecision = getAutoFormulaDecision(state.activeProfile);
  const autoPopupMode = String(sharedAutoDecision?.mode || "original");
  const autoComboSourcesEarly = sharedAutoDecision?.mode === "combo" && Array.isArray(sharedAutoDecision.comboSources) ? sharedAutoDecision.comboSources.slice(0,2) : [];
  const needComboRanks = currentLResultMode === "combo" || (currentLResultMode === "l" && autoPopupMode === "combo");
  const needTotalRanks = currentLResultMode === "totalcombo";
  const needBlendRanks = currentLResultMode === "blend" || (currentLResultMode === "l" && autoPopupMode === "blend");
  const comboFallbackClassicAi = currentLResultMode === "combo" && autoComboSourcesEarly.length !== 2;
  const comboNeedsClassic = needComboRanks && (autoComboSourcesEarly.includes("original") || comboFallbackClassicAi);
  const comboNeedsAiL = needComboRanks && (autoComboSourcesEarly.includes("ai") || comboFallbackClassicAi);
  const comboNeedsGl = needComboRanks && autoComboSourcesEarly.includes("gl");
  const needClassicRank = currentLResultMode === "overlap" || currentLResultMode === "master" || currentLResultMode === "independent" || needTotalRanks || comboNeedsClassic || (currentLResultMode === "l" && autoPopupMode === "original");
  const needAiLRank = currentLResultMode === "ai" || comboNeedsAiL || needTotalRanks || needBlendRanks || (currentLResultMode === "l" && autoPopupMode === "ai");
  const needGlRank = currentLResultMode === "gl" || comboNeedsGl || needTotalRanks || needBlendRanks || (currentLResultMode === "l" && autoPopupMode === "gl");

  // V7.09.42 — LIVE AUTO BLEND for the L ranking popup.
  // Eligibility must come from model READY + Trusted evidence, not from whether a Calculator
  // preview grid happened to be opened first. If a live grid is missing, build it on demand
  // from the current 5-digit input and the already-READY formulas. Historical snapshots remain
  // untouched: this affects only the live result popup.
  const popupRequiredKeys = (()=>{
    if(currentLResultMode==="l"){
      if(autoPopupMode==="combo") return autoComboSourcesEarly.length===2?autoComboSourcesEarly:["original","ai"];
      if(autoPopupMode==="blend") return ["ai","gl"];
      return [(["original","ai","gl","pattern","p19","x3"].includes(autoPopupMode)?autoPopupMode:"original")];
    }
    if(["ai","gl","pattern","p19","x3"].includes(currentLResultMode)) return [currentLResultMode];
    if(currentLResultMode==="combo") return autoComboSourcesEarly.length===2?autoComboSourcesEarly:["original","ai"];
    if(currentLResultMode==="totalcombo") return ["original","ai","gl","pattern","p19","x3"];
    return ["original","ai","gl","pattern","p19","x3"];
  })();
  const calculatorTables = getCalculatorEngineTablesForKeys(Number(state.activeProfile),popupRequiredKeys);
  const classicTable = calculatorTables.find(t => t.key === "original") || null;
  const aiLTable = calculatorTables.find(t => t.key === "ai") || null;
  const glTable = calculatorTables.find(t => t.key === "gl") || null;
  const liveInputs = Array.isArray(state.lastInput) ? state.lastInput.map(String) : [];
  const liveInputReady = liveInputs.length === 5 && liveInputs.every(v => /^\d$/.test(v));
  const aiSavedLive = state.aiFormulaLab?.[Number(state.activeProfile)] || null;
  const glSavedLive = state.aiGLFormulaLab?.[Number(state.activeProfile)] || null;
  // Cached Calculator tables are the primary source. Only evaluate live deployment gates if a
  // legacy/missing table forces a fallback; AUTO X3 therefore performs no extra GL History scan.
  const aiLiveGrid = (needAiLRank && !aiLTable?.grid && liveInputReady && aiSavedLive?.formula && formulaEligibility(aiSavedLive).allowed) ? formulaGrid(liveInputs, aiSavedLive.formula) : null;
  const glLiveGrid = (needGlRank && !glTable?.grid && liveInputReady && glSavedLive?.formula && glFormulaEligibility(glSavedLive, Number(state.activeProfile)).allowed) ? formulaGrid(liveInputs, glSavedLive.formula) : null;
  const classicRawResults = needClassicRank ? (classicTable?.grid ? (classicTable.results || []) : (liveInputReady ? findLResults(formulaGrid(liveInputs, getOriginalFormula()) || []) : [])) : [];
  const aiLRawResults = needAiLRank ? (aiLTable?.grid ? (aiLTable.results || []) : (aiLiveGrid ? findLResults(aiLiveGrid) : [])) : [];
  const glRawResults = needGlRank ? (glTable?.grid ? (glTable.results || []) : (glLiveGrid ? findLResults(glLiveGrid) : [])) : [];
  const classicRanked = needClassicRank ? rankLResults(classicRawResults, state.activeProfile) : [];
  const aiLRanked = needAiLRank ? rankLResults(aiLRawResults, state.activeProfile) : [];
  const glRanked = needGlRank ? rankLResults(glRawResults, state.activeProfile) : [];
  const patternTable = calculatorTables.find(t => t.key === "pattern") || null;
  // Reuse the P18 prediction already produced by getCalculatorEngineTables during Calculate render.
  const patternV18=patternTable?.prediction || {items:patternTable?.results||[],fallback:true,priorCount:0,selectedType:"L",classicCount:0,unionCount:0,reason:"cached-table",selectorStatus:patternTable?.status||"READY"};
  const patternRanked=(patternTable?.results||patternV18.items||[]).map((item,index)=>({...item,aiRank:index+1,aiScore:Number(item.patternV7Score||Math.max(10,92-index*3))}));
  const p19Table = calculatorTables.find(t => t.key === "p19") || null;
  const p19Ready = Boolean(p19Table?.grid && Array.isArray(p19Table?.results) && p19Table.results.length);
  if(popupRequiredKeys.includes("p19") && !p19Ready) schedulePatternV19Background(state.activeProfile,220);
  const p19Ranked = p19Ready ? (p19Table.results||[]).map((item,index)=>({...item,aiRank:index+1,aiScore:Number(item.patternV19Score||item.patternV7Score||Math.max(10,94-index*3))})) : [];
  const x3Table = calculatorTables.find(t => t.key === "x3") || null;
  const x3Ready = Boolean(x3Table?.grid && Array.isArray(x3Table?.results) && x3Table.results.length);
  const x3Ranked = x3Ready ? (x3Table.results||[]).map((item,index)=>({...item,aiRank:index+1,aiScore:Number(item.patternX3Score||item.patternV19Score||item.patternV7Score||Math.max(10,96-index*3))})) : [];
  // V7.20.32 — AUTO decision already owns the same Trusted AI L / AI GL evidence.
  // Reuse it instead of rebuilding getHistoryChampionForProfile on every AUTO tap.
  const aiLRate = Number(sharedAutoDecision?.aiRate || 0);
  const glRate = Number(sharedAutoDecision?.glRate || 0);
  const aiLTrusted = Number(sharedAutoDecision?.aiTrustedAll || 0);
  const glTrusted = Number(sharedAutoDecision?.glTrustedAll || 0);
  const autoComboSources = autoComboSourcesEarly;
  const autoComboPair = autoComboSources.length === 2 ? "auto" : "";
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

  // V7.09.69 — Manual COMBO is result-only fusion. It never changes AUTO, formula
  // selection, training weights, Trusted evidence, or History. The two source lists are
  // normalized, deduplicated, and consensus numbers are ranked first.
  const buildResultCombo = (leftItems, rightItems, leftKey, rightKey) => {
    const map = new Map();
    const normalizeComboNumber = item => {
      const raw = String(item?.number ?? "").replace(/\D/g, "");
      if (!raw) return "";
      const three = raw.padStart(3, "0").slice(-3);
      return /^\d{3}$/.test(three) ? canonical3(three) : "";
    };
    const normalizedRankScore = (index, total) => {
      const n=Math.max(1, Number(total||0));
      if(n<=1) return 100;
      return Math.max(0, Math.min(100, Math.round((1 - (Number(index||0)/(n-1))) * 100)));
    };
    const add = (items, sourceKey) => (items || []).forEach((item, index) => {
      const number = normalizeComboNumber(item);
      if (!number) return;
      let row = map.get(number);
      if (!row) {
        row = {...item, number, canonicalNumber:number, comboSources:[], comboRanks:{}, comboSourceScores:{}, comboConsensus:0, comboFusionScore:0};
        map.set(number, row);
      }
      if (!row.comboSources.includes(sourceKey)) row.comboSources.push(sourceKey);
      row.comboRanks[sourceKey] = index + 1;
      row.comboSourceScores[sourceKey] = normalizedRankScore(index, items.length);
      row.comboConsensus = row.comboSources.length;
      // Keep legacy fields only for detail compatibility; ordering below uses normalized fusion score.
      row.aiRawScore = Math.max(Number(row.aiRawScore || 0), Number(item?.aiRawScore || 0));
      row.aiScore = Math.max(Number(row.aiScore || 0), Number(item?.aiScore || 0));
    });
    add(leftItems, leftKey);
    add(rightItems, rightKey);
    const fused=[...map.values()].map(row=>{
      const scores=Object.values(row.comboSourceScores||{}).map(Number).filter(Number.isFinite);
      const avg=scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : 0;
      const isConsensus=Number(row.comboConsensus||0)>1;
      const fusion=isConsensus
        ? Math.min(100, Math.round(avg * SAFE_POLISH_FREEZE.comboSingleScale + SAFE_POLISH_FREEZE.comboConsensusBonus))
        : Math.round(avg * SAFE_POLISH_FREEZE.comboSingleScale);
      return {...row,comboFusionScore:fusion};
    });
    return fused.sort((a,b) => {
      const consensus = Number(b.comboConsensus||0) - Number(a.comboConsensus||0);
      if (consensus) return consensus;
      const fusion = Number(b.comboFusionScore||0) - Number(a.comboFusionScore||0);
      if (fusion) return fusion;
      const ar = Number(a.comboRanks?.[leftKey] || 999) + Number(a.comboRanks?.[rightKey] || 999);
      const br = Number(b.comboRanks?.[leftKey] || 999) + Number(b.comboRanks?.[rightKey] || 999);
      return ar - br || String(a.number).localeCompare(String(b.number));
    }).map((item,index)=>({...item, aiRank:index+1}));
  };
  const comboPairs = {
    "pattern-classic": {label:"P18 + Classic", left:patternRanked, right:classicRanked, leftKey:"pattern", rightKey:"classic"},
    "pattern-ai": {label:"P18 + AI L", left:patternRanked, right:aiLRanked, leftKey:"pattern", rightKey:"aiL"},
    "pattern-gl": {label:"P18 + AI GL", left:patternRanked, right:glRanked, leftKey:"pattern", rightKey:"gl"},
    "classic-ai": {label:"Classic + AI L", left:classicRanked, right:aiLRanked, leftKey:"classic", rightKey:"aiL"},
    "classic-gl": {label:"Classic + AI GL", left:classicRanked, right:glRanked, leftKey:"classic", rightKey:"gl"},
    "ai-gl": {label:"AI L + AI GL", left:aiLRanked, right:glRanked, leftKey:"aiL", rightKey:"gl"}
  };
  // V7.20.05 — AUTO can fuse any two eligible Trusted leaders, including P19/X3.
  // Manual COMBO pairs above remain available; AUTO's pair is generated from the single
  // shared decision so the popup can never fall back to a legacy Classic selector.
  const autoComboSource = key => key === "x3" ? {label:"X3",items:x3Ranked,fuseKey:"x3"}
    : key === "p19" ? {label:"P19",items:p19Ranked,fuseKey:"p19"}
    : key === "pattern" ? {label:"P18",items:patternRanked,fuseKey:"pattern"}
    : key === "gl" ? {label:"AI GL",items:glRanked,fuseKey:"gl"}
    : key === "ai" ? {label:"AI L",items:aiLRanked,fuseKey:"aiL"}
    : {label:"Classic",items:classicRanked,fuseKey:"classic"};
  if(autoComboSources.length===2){
    const left=autoComboSource(autoComboSources[0]), right=autoComboSource(autoComboSources[1]);
    comboPairs.auto={label:`${left.label} + ${right.label}`,left:left.items,right:right.items,leftKey:left.fuseKey,rightKey:right.fuseKey};
  }
  const resolvedComboPairKey = autoComboPair || currentLComboPair || "classic-ai";
  const comboPair = comboPairs[resolvedComboPairKey] || comboPairs["classic-ai"];
  const comboReady = Boolean(autoComboPair && comboPair.left.length && comboPair.right.length);
  const comboItems = (currentLResultMode === "combo" || (currentLResultMode === "l" && sharedAutoDecision?.mode === "combo"))
    ? buildResultCombo(comboPair.left, comboPair.right, comboPair.leftKey, comboPair.rightKey) : [];
  const buildTotalCombo = sources => {
    const activeSources = (sources || []).filter(src => Array.isArray(src?.items) && src.items.length);
    if (activeSources.length < 2) return [];
    const map = new Map();
    const normalizeComboNumber = item => {
      const raw = String(item?.number ?? "").replace(/\D/g, "");
      if (!raw) return "";
      const three = raw.padStart(3, "0").slice(-3);
      return /^\d{3}$/.test(three) ? canonical3(three) : "";
    };
    const normalizedRankScore = (index, total) => {
      const n = Math.max(1, Number(total || 0));
      if (n <= 1) return 100;
      return Math.max(0, Math.min(100, Math.round((1 - (Number(index || 0) / (n - 1))) * 100)));
    };
    activeSources.forEach(src => {
      (src.items || []).forEach((item, index) => {
        const number = normalizeComboNumber(item);
        if (!number) return;
        let row = map.get(number);
        if (!row) {
          row = {...item, number, canonicalNumber:number, comboSources:[], comboSourceLabels:[], comboRanks:{}, comboSourceScores:{}, comboConsensus:0, comboFusionScore:0};
          map.set(number, row);
        }
        if (!row.comboSources.includes(src.key)) row.comboSources.push(src.key);
        if (!row.comboSourceLabels.includes(src.label)) row.comboSourceLabels.push(src.label);
        row.comboRanks[src.key] = index + 1;
        row.comboSourceScores[src.key] = normalizedRankScore(index, src.items.length);
        row.comboConsensus = row.comboSources.length;
        row.aiRawScore = Math.max(Number(row.aiRawScore || 0), Number(item?.aiRawScore || 0));
        row.aiScore = Math.max(Number(row.aiScore || 0), Number(item?.aiScore || 0));
      });
    });
    return [...map.values()].map(row => {
      const scores = Object.values(row.comboSourceScores || {}).map(Number).filter(Number.isFinite);
      const avg = scores.length ? scores.reduce((a,b)=>a+b,0) / scores.length : 0;
      const extraConsensus = Math.max(0, Number(row.comboConsensus || 0) - 1);
      const bonusPerExtra = Math.max(4, Math.round(SAFE_POLISH_FREEZE.comboConsensusBonus * 0.45));
      const fusion = Math.min(100, Math.round(avg * SAFE_POLISH_FREEZE.comboSingleScale + extraConsensus * bonusPerExtra));
      return {...row, comboFusionScore:fusion};
    }).sort((a,b) => {
      const consensus = Number(b.comboConsensus || 0) - Number(a.comboConsensus || 0);
      if (consensus) return consensus;
      const fusion = Number(b.comboFusionScore || 0) - Number(a.comboFusionScore || 0);
      if (fusion) return fusion;
      const aRank = Object.values(a.comboRanks || {}).reduce((sum,val)=>sum + Number(val || 999), 0);
      const bRank = Object.values(b.comboRanks || {}).reduce((sum,val)=>sum + Number(val || 999), 0);
      return aRank - bRank || String(a.number).localeCompare(String(b.number));
    }).map((item,index)=>({...item, aiRank:index+1}));
  };
  const totalComboAvailableCount = [classicRawResults,aiLRawResults,glRawResults,patternRanked,p19Ranked,x3Ranked].filter(items=>Array.isArray(items)&&items.length).length;
  const totalComboSourceList = currentLResultMode === "totalcombo" ? [
    {key:"classic", label:"Classic", items:classicRanked},
    {key:"aiL", label:"AI L", items:aiLRanked},
    {key:"gl", label:"AI GL", items:glRanked},
    {key:"pattern", label:"P18", items:patternRanked},
    {key:"p19", label:"P19", items:p19Ranked},
    {key:"x3", label:"X3", items:x3Ranked}
  ].filter(src => src.items.length) : [];
  const totalComboItems = currentLResultMode === "totalcombo" ? buildTotalCombo(totalComboSourceList) : [];
  const totalComboReady = currentLResultMode === "totalcombo" ? (totalComboSourceList.length >= 2 && totalComboItems.length > 0) : totalComboAvailableCount >= 2;
  // V6.7.4 — L × AI uses the selected AI scope instead of always forcing Top 10.
  // "ทั้งหมด" intentionally uses AI Top 100: wide enough to reveal useful overlap
  // while still representing high-ranked AI candidates rather than all 000–999.
  const overlapAiLimit = currentLResultMode === "overlap"
    ? (currentLRankLimit === 0 ? 100 : currentLRankLimit)
    : 10;
  const needIndependentRuntime = currentLResultMode === "independent" || currentLResultMode === "overlap";
  const independent = needIndependentRuntime ? generateIndependentAI(Number(state.activeProfile), null, overlapAiLimit) : {items:[],dataCount:0,pending:true,lazy:true};
  const independentItems = independent.items || [];
  const needMasterRuntime = currentLResultMode === "master";
  const master = needMasterRuntime ? generateMasterAI(Number(state.activeProfile), null, 10) : {items:[],dataCount:0,pending:true,lazy:true,weights:{classic:0,aiL:0,independent:0,pair:0}};
  const masterItems = master.items || [];
  const ranked = currentLResultMode === "overlap" ? rankLResults(currentLResults, state.activeProfile) : [];
  const independentByNumber = new Map(independentItems.map(x=>[x.number,x]));
  const overlap = ranked.filter(x=>independentByNumber.has(x.number)).map(x=>{
    const free=independentByNumber.get(x.number);
    return {...x, independentRank:free?.aiRank, independentScore:free?.aiScore};
  });
  const source = currentLResultMode === "gl" ? glRanked
    : currentLResultMode === "pattern" ? patternRanked
    : currentLResultMode === "p19" ? p19Ranked
    : currentLResultMode === "x3" ? x3Ranked
    : currentLResultMode === "ai" ? aiLRanked
    : currentLResultMode === "combo" ? (comboReady ? comboItems : [])
    : currentLResultMode === "totalcombo" ? (totalComboReady ? totalComboItems : [])
    : currentLResultMode === "blend" ? blendItems
    : currentLResultMode === "independent" ? independentItems
    : currentLResultMode === "master" ? masterItems
    : currentLResultMode === "overlap" ? overlap
    : (sharedAutoDecision?.mode === "combo" && comboReady ? comboItems : sharedAutoDecision?.mode === "x3" ? x3Ranked : sharedAutoDecision?.mode === "p19" ? p19Ranked : sharedAutoDecision?.mode === "pattern" ? patternRanked : sharedAutoDecision?.mode === "gl" ? glRanked : sharedAutoDecision?.mode === "ai" ? aiLRanked : classicRanked);
  // For L × AI the rank buttons define the AI comparison pool, not the number
  // of overlap results shown. Show every intersection found in that pool.
  const effectiveLimit = currentLResultMode === "overlap"
    ? 0
    : ((currentLResultMode === "independent" || currentLResultMode === "master") && currentLRankLimit === 0 ? 10 : currentLRankLimit);
  const visible = effectiveLimit === 0 ? source : source.slice(0, effectiveLimit);
  const profileName = state.profiles[state.activeProfile] || "Profile";
  const comboTrustedCount = key => {
    if(key === "x3") return Number(sharedAutoDecision?.x3Samples || 0);
    if(key === "p19") return Number(sharedAutoDecision?.p19Samples || 0);
    if(key === "pattern") return Number(sharedAutoDecision?.p18Samples || patternV18.priorCount || 0);
    if(key === "classic") return Number(sharedAutoDecision?.samples || 0);
    if(key === "aiL") return Number(sharedAutoDecision?.aiTrustedAll || aiLTrusted || 0);
    if(key === "gl") return Number(sharedAutoDecision?.glTrustedAll || glTrusted || 0);
    return 0;
  };
  const dataCount = currentLResultMode === "gl" ? glTrusted
    : currentLResultMode === "pattern" ? Number(patternV18.priorCount||0)
    : currentLResultMode === "p19" ? Number(patternV19TrustedHistorySummary((state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===Number(state.activeProfile)),state.activeProfile)?.total||0)
    : currentLResultMode === "x3" ? Number(x3TrustedHistorySummary((state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===Number(state.activeProfile)),state.activeProfile)?.total||0)
    : currentLResultMode === "ai" ? aiLTrusted
    : currentLResultMode === "combo" ? Math.min(
        comboTrustedCount(comboPair.leftKey),
        comboTrustedCount(comboPair.rightKey)
      )
    : currentLResultMode === "totalcombo" ? (totalComboSourceList.length ? Math.min(...totalComboSourceList.map(src => comboTrustedCount(src.key)).filter(x => Number.isFinite(Number(x)) && Number(x) > 0)) : 0)
    : (currentLResultMode === "l" && sharedAutoDecision?.mode === "x3") ? Number(sharedAutoDecision?.x3Samples||0)
    : (currentLResultMode === "l" && sharedAutoDecision?.mode === "p19") ? Number(sharedAutoDecision?.p19Samples||0)
    : (currentLResultMode === "l" && sharedAutoDecision?.mode === "pattern") ? Number(sharedAutoDecision?.p18Samples||patternV18.priorCount||0)
    : (currentLResultMode === "l" && sharedAutoDecision?.mode === "gl") ? Number(sharedAutoDecision?.glTrustedAll||glTrusted||0)
    : (currentLResultMode === "l" && sharedAutoDecision?.mode === "ai") ? Number(sharedAutoDecision?.aiTrustedAll||aiLTrusted||0)
    : (currentLResultMode === "l" && sharedAutoDecision?.mode === "original") ? Number(sharedAutoDecision?.classicTrustedAll||sharedAutoDecision?.samples||0)
    : (currentLResultMode === "l" && comboReady) ? Math.min(
        comboTrustedCount(comboPair.leftKey),
        comboTrustedCount(comboPair.rightKey)
      )
    : (currentLResultMode === "blend" || (currentLResultMode === "l" && blendReady)) ? Math.min(aiLTrusted, glTrusted)
    : currentLResultMode === "independent" ? independent.dataCount
    : currentLResultMode === "master" ? master.dataCount
    : (classicRanked[0]?.aiDataCount || ranked[0]?.aiDataCount || 0);
  // V7.09.38 — Ranking popup follows the same Global AUTO vocabulary as AI + Calculator.
  // Keep ranking/history evidence separate from formula selection: this is UI sync only, no historical recomputation.
  const activeAutoMode = getActiveFormulaMode(state.activeProfile);
  const activeAutoLabel = activeAutoMode === "combo" ? `COMBO • ${sharedAutoDecision?.comboLabel||"AUTO"}` : activeAutoMode === "x3" ? "X3" : activeAutoMode === "p19" ? "P19" : activeAutoMode === "pattern" ? "P18" : (activeAutoMode === "gl" ? "AI GL" : activeAutoMode === "ai" ? "AI L" : "Classic L");
  const title = currentLResultMode === "gl" ? "AI GL Ranking"
    : currentLResultMode === "pattern" ? "P18 • Research-to-Champion"
    : currentLResultMode === "p19" ? "P19 • Hybrid Selector"
    : currentLResultMode === "x3" ? "X3 • Precision Challenger"
    : currentLResultMode === "ai" ? "AI L Ranking"
    : currentLResultMode === "blend" ? "AI L + AI GL • BLEND"
    : currentLResultMode === "combo" ? `COMBO • ${comboPair.label}`
    : currentLResultMode === "totalcombo" ? "TOTAL COMBO • Unified"
    : currentLResultMode === "independent" ? "AI อิสระ"
    : currentLResultMode === "master" ? "Master AI"
    : currentLResultMode === "overlap" ? "เลขร่วม L × AI"
    : (activeAutoMode === "combo" ? `AUTO • COMBO • ${sharedAutoDecision?.comboLabel||"AUTO"}` : activeAutoMode === "x3" ? "AUTO • X3" : activeAutoMode === "p19" ? "AUTO • P19" : activeAutoMode === "pattern" ? "AUTO • P18" : activeAutoMode === "gl" ? "AUTO • AI GL" : activeAutoMode === "ai" ? "AUTO • AI L" : "AUTO • Classic L");
  // V7.20.32: getHistoryChampionForProfile was unused here and rescanned all Trusted History.
  // Compute only the single hero summary required by the active popup route.
  const heroDraws = (state.actualDraws || []).filter(d => Number(d.profileId ?? 0) === Number(state.activeProfile));
  const heroSummary = key => trustedHistorySummary(heroDraws, Number(state.activeProfile), key);
  const statHero = (heading,label,summary,extra="") => `<div class="l-popup-winner"><span>${heading}</span><b>${escapeHtml(label)}</b><strong>${Number(summary?.total||0) ? `${Number(summary.rate||0)}%` : "—"}</strong><small>${Number(summary?.total||0) ? `${Number(summary.hit||0)}/${Number(summary.total||0)} งวด${extra ? ` • ${escapeHtml(extra)}` : ""}` : "ยังไม่มีข้อมูล Trusted เพียงพอ"}</small></div>`;
  let heroBlock = "";
  if (currentLResultMode === "pattern") {
    heroBlock = statHero("▦ P18","CHAMPION GUARD",`${patternV18.selectorStatus}`,`Effective Win = Hit + Rev • Fair Candidate ${patternV18.classicCount||0} • Research geometries ${PATTERN_V18_RESEARCH_GEOMETRIES}`);
  } else if (currentLResultMode === "p19") {
    const p19Hero=patternV19TrustedHistorySummary(heroDraws,state.activeProfile);
    heroBlock = statHero("▦ P19","HYBRID SELECTOR",p19Hero,"Strict Prior-only • Unified History Pipeline");
  } else if (currentLResultMode === "ai") {
    heroBlock = statHero("🤖 Selected Model","AI L",heroSummary("aiL"));
  } else if (currentLResultMode === "gl") {
    heroBlock = statHero("🤖 Selected Model","AI GL",heroSummary("gl"));
  } else if (currentLResultMode === "combo") {
    const consensusCount = comboItems.filter(x=>Number(x.comboConsensus||0)>1).length;
    heroBlock = `<div class="l-popup-winner"><span>🔗 COMBO AUTO</span><b>${escapeHtml(comboPair.label)}</b><strong>${comboReady ? comboItems.length : "—"}</strong><small>${comboReady ? `รวมผล • ตัดเลขซ้ำ • Consensus ${consensusCount} ชุด` : "ยังไม่มีคู่ที่เข้าเกณฑ์ AUTO COMBO"}</small></div>`;
  } else if (currentLResultMode === "totalcombo") {
    const consensusCount = totalComboItems.filter(x=>Number(x.comboConsensus||0)>1).length;
    heroBlock = `<div class="l-popup-winner"><span>🧩 TOTAL COMBO</span><b>Classic + AI L + AI GL + P18 + P19 + X3</b><strong>${totalComboReady ? totalComboItems.length : "—"}</strong><small>${totalComboReady ? `รวมทุกสูตร • ตัดเลขซ้ำ • Consensus ${consensusCount} ชุด • ใช้ ${totalComboSourceList.length} แหล่ง` : "ยังมีสูตรพร้อมใช้งานไม่พอสำหรับ TOTAL COMBO"}</small></div>`;
  } else if (currentLResultMode === "independent") {
    heroBlock = statHero("🤖 Selected Model","AI อิสระ",heroSummary("independent"));
  } else if (currentLResultMode === "overlap") {
    heroBlock = `<div class="l-popup-winner"><span>🔗 Selected Model</span><b>L × AI</b><strong>${overlap.length}</strong><small>เลขร่วมจาก L × AI อิสระ • ${independent.pending ? `History ${independent.dataCount}/8 งวด` : `AI pool ${overlapAiLimit} อันดับ`}</small></div>`;
  } else if (comboReady) {
    heroBlock = `<div class="l-popup-winner blend-active"><span>🤖 AUTO Selection</span><b>COMBO • ${escapeHtml(comboPair.label)}</b><strong>AUTO</strong><small>ต่างกัน ${Number(sharedAutoDecision.comboGap||0).toFixed(1)} จุดเปอร์เซ็นต์ • Trusted READY • Consensus ${comboItems.filter(x=>Number(x.comboConsensus||0)>1).length}</small></div>`;
  } else if (blendReady) {
    heroBlock = `<div class="l-popup-winner blend-active"><span>🤖 AUTO Selection</span><b>BLEND • AI L + AI GL</b><strong>AUTO</strong><small>ต่างกัน ${blendGap.toFixed(1)} จุดเปอร์เซ็นต์ • DEDUP + CONSENSUS</small></div>`;
  } else if (activeAutoMode === "x3") {
    const x3Hero=x3TrustedHistorySummary(heroDraws,state.activeProfile);
    heroBlock = statHero("🤖 AUTO Selection","X3",x3Hero,"AUTO • Strict Prior-only • Unified History Pipeline");
  } else if (activeAutoMode === "p19") {
    const p19Hero=patternV19TrustedHistorySummary(heroDraws,state.activeProfile);
    heroBlock = statHero("🤖 AUTO Selection","P19",p19Hero,"AUTO • Strict Prior-only • Unified History Pipeline");
  } else if (activeAutoMode === "pattern") {
    const p18Hero=patternV18TrustedHistorySummary(heroDraws, Number(state.activeProfile));
    heroBlock = statHero("🤖 AUTO Selection","P18",p18Hero,"AUTO • Strict Prior-only");
  } else if (activeAutoMode === "gl") {
    heroBlock = statHero("🤖 AUTO Selection","AI GL",heroSummary("gl"),"AUTO");
  } else if (activeAutoMode === "ai") {
    heroBlock = statHero("🤖 AUTO Selection","AI L",heroSummary("aiL"),"AUTO");
  } else {
    heroBlock = statHero("🤖 AUTO Selection","Classic L",heroSummary("classic"),"AUTO");
  }
  const note = currentLResultMode === "pattern"
    ? `P18 • Research-to-Champion Guard • V7 Champion retained • Effective Win = Hit + Rev • Strict Prior-only • Fixed-count • SHADOW`
    : currentLResultMode === "p19"
    ? (p19Ready ? `P19 • Hybrid Selector • Strict Prior-only • P18 Champion Guard + Expert Geometry • Result-only` : `P19 กำลังสร้างข้อมูลเบื้องหลัง • หน้า Calculator ใช้งานต่อได้ตามปกติ`)
    : currentLResultMode === "ai"
    ? (dataCount ? `AI L ใช้ข้อมูลย้อนหลัง ${dataCount} งวด • 12 งวด 50% • 30 งวด 30% • 60 งวด 20% • คะแนนใช้สำหรับเรียงอันดับ` : `ยังไม่มี History สำหรับ AI L ใน Profile นี้`)
    : currentLResultMode === "combo"
    ? `COMBO เลือกคู่อัตโนมัติจากสูตรที่แข็งแรงที่สุด + คู่ที่ใกล้สุด ≤ ${SAFE_POLISH_FREEZE.comboMaxGap.toFixed(1)} จุดเปอร์เซ็นต์ • รวมผล → ตัดเลขซ้ำ → Consensus ขึ้นก่อน`
    : currentLResultMode === "totalcombo"
    ? `TOTAL COMBO รวม Classic + AI L + AI GL + P18 + P19 + X3 • รวมผล → ตัดเลขซ้ำ → เลขที่ซ้ำหลายสูตรขึ้นก่อน • ใช้กฎ Consensus เดียวกับระบบ COMBO`
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
    <div class="l-engine-tabs l-engine-tabs-six">
      <button class="l-engine-tab ${currentLResultMode === "l" ? "active" : ""}" data-l-engine="l">AUTO</button>
      <button class="l-engine-tab ${currentLResultMode === "ai" ? "active" : ""} ${(aiLRawResults.length || (liveInputReady && aiSavedLive?.formula) || sharedAutoDecision?.candidatePool?.includes("ai")) ? "" : "unavailable"}" data-l-engine="ai">AI L</button>
      <button class="l-engine-tab ${currentLResultMode === "gl" ? "active" : ""} ${(glRanked.length || (liveInputReady && glSavedLive?.formula) || sharedAutoDecision?.candidatePool?.includes("gl")) ? "" : "unavailable"}" data-l-engine="gl">AI GL</button>
      <button class="l-engine-tab ${currentLResultMode === "pattern" ? "active" : ""} ${liveInputReady ? "" : "unavailable"}" data-l-engine="pattern">P18</button>
      <button class="l-engine-tab ${currentLResultMode === "p19" ? "active" : ""} ${liveInputReady ? "" : "unavailable"}" data-l-engine="p19">P19</button>
      <button class="l-engine-tab ${currentLResultMode === "combo" ? "active" : ""} ${autoComboPair ? "" : "unavailable"}" data-l-engine="combo">COMBO</button>
      <button class="l-engine-tab ${currentLResultMode === "totalcombo" ? "active" : ""} ${liveInputReady ? "" : "unavailable"}" data-l-engine="totalcombo">TOTAL</button>
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
      : currentLResultMode === "p19"
      ? `<button class="l-number ai-ranked-number ${(item.aiRank||i+1)<=3?'top-three':''}" data-ranked-number="${item.number}" data-number="${item.number}" aria-label="${item.number} P19"><div class="candidate-card-top"><em class="confidence-badge medium">P19</em></div><b>${item.number}</b><small>${item.patternV19Source||'Hybrid'}</small></button>`
      : currentLResultMode === "pattern"
      ? `<button class="l-number ai-ranked-number ${item.patternV7Added?'top-three':''}" data-ranked-number="${item.number}" data-number="${item.number}" aria-label="${item.number} Pattern V5 ${item.patternV7Added?'V7':'KEEP'}"><div class="candidate-card-top"><em class="confidence-badge ${item.patternV3Added?'high':'medium'}">${item.patternV7Added?'V7':'KEEP'}</em></div><b>${item.number}</b><small>${item.patternV7Added?'V7 Expert':'Classic'}</small></button>`
      : currentLResultMode === "master"
      ? `<button class="l-number ai-ranked-number master-number ${item.masterRank<=3?'top-three':''}" data-master-number="${item.number}" data-number="${item.number}" aria-label="${item.number} ${meta.label} Score ${meta.score} จาก 100"><div class="candidate-card-top"><em class="confidence-badge ${meta.kind}">${meta.label}</em></div><b>${item.number}</b><small>Score ${meta.score}/100</small></button>`
      : `<button class="l-number ai-ranked-number ${(item.aiRank||i+1)<=3?'top-three':''}" data-ranked-number="${item.number}" data-number="${item.number}" aria-label="${item.number} ${meta.label} Score ${meta.score} จาก 100"><div class="candidate-card-top"><em class="confidence-badge ${meta.kind}">${meta.label}</em></div><b>${item.number}</b><small>${(currentLResultMode === "combo" || currentLResultMode === "totalcombo" || (currentLResultMode === "l" && comboReady)) ? (Number(item.comboConsensus||0)>1 ? `Consensus ${Number(item.comboConsensus||0)}` : `Score ${meta.score}/100`) : ((currentLResultMode === "blend" || (currentLResultMode === "l" && blendReady)) && item.blendSources?.length > 1 ? "AI L + AI GL" : `Score ${meta.score}/100`)}</small></button>`}).join("") || `<div class="empty-card flat visible-empty">${currentLResultMode === "combo" ? "COMBO ยังสร้างผลไม่ได้ • ยังไม่มีคู่ READY/Trusted ที่ต่างกันไม่เกิน ${SAFE_POLISH_FREEZE.comboMaxGap.toFixed(1)} จุดเปอร์เซ็นต์" : currentLResultMode === "totalcombo" ? "TOTAL COMBO ยังสร้างผลไม่ได้ • ต้องมีอย่างน้อย 2 สูตรที่ READY เพื่อรวมผล" : currentLResultMode === "blend" || (currentLResultMode === "l" && blendReady) ? "BLEND ยังสร้างรายการเลขไม่ได้ • ตรวจ AI L / AI GL สำหรับงวดนี้" : currentLResultMode === "p19" ? "P19 กำลังคำนวณเบื้องหลัง • ลองอีกครั้งเมื่อสถานะ READY" : currentLResultMode === "gl" ? "AI GL ยังไม่มีตารางสำหรับงวดนี้" : currentLResultMode === "ai" ? "AI L ยังไม่มีตารางสำหรับงวดนี้" : currentLResultMode === "overlap" ? (independent.pending ? `AI อิสระยังคำนวณไม่ได้ • History ${independent.dataCount}/8 งวด` : `คำนวณแล้ว: L ${ranked.length} ชุด × AI ${currentLRankLimit === 0 ? "Top 100" : `Top ${currentLRankLimit}`} ${independentItems.length} ชุด • ยังไม่มีเลขร่วม`) : currentLResultMode === "independent" ? "ข้อมูล History ยังไม่พอสำหรับ AI อิสระ" : "ยังไม่มีเลข L สำหรับงวดนี้"}</div>`}</div>
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
  document.getElementById("goHistory").addEventListener("click", () => { closeModal(); state.historyFormulaMode="compare"; state.currentView="history"; saveState(); render(); });
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

function parseStrictImportNumbers(line, dateRaw = "") {
  let clean = normalizeOcrDigits(String(line || "")).replace(/\s+/g, " ").trim();
  if (dateRaw) clean = clean.replace(dateRaw, " ");
  // Strict Numeric Import: only accept an unambiguous 3-digit + 2-digit result
  // from the SAME OCR visual/text row. Never borrow from the next line/date.
  const groups = [...clean.matchAll(/(?<!\d)(\d{1,5})(?!\d)/g)].map(m => m[1]);
  const three = groups.filter(v => /^\d{3}$/.test(v));
  const two = groups.filter(v => /^\d{2}$/.test(v));
  if (three.length !== 1 || two.length !== 1) return { number:"", twoDigit:"", strict:false };
  return { number:three[0], twoDigit:two[0], strict:true };
}

function parseImportRowsFromText(text) {
  const normalized = normalizeOcrDigits(text);
  const lines = normalized.split(/\r?\n/).map(x => x.replace(/\s+/g, " ").trim()).filter(Boolean);
  const rows = [];
  const seen = new Set();

  // V7.19.15 — STRICT NUMERIC IMPORT.
  // Accept only a date + complete 3-digit + 2-digit result found on the SAME OCR row.
  // If the row contains only text (e.g. งดออกผล / OCR-garbled text), incomplete digits,
  // or ambiguous extra 2/3-digit groups, skip the row completely. No window/stream fallback.
  lines.forEach((line, lineIndex) => {
    const dm = parseImportDateMatch(line);
    if (!dm) return;
    if (isImportNoResultText(line)) return;
    const nums = parseStrictImportNumbers(line, dm.raw);
    if (!nums.strict) return;
    const key = `${dm.date}|${nums.number}|${nums.twoDigit}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({
      id:`import-strict-${lineIndex}-${Date.now()}`,
      date:dm.date,
      number:nums.number,
      twoDigit:nums.twoDigit,
      enabled:true,
      sourceLine:line,
      parsePriority:4,
      strictNumeric:true
    });
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
  notifyLiveHistoryMutation(profileId);
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
  updateImportAiProgress(button, 96, "✓ ข้อมูลถาวรแล้ว • กำลัง Commit 6 AI…");
  await waitForImportProgressPaint(40);
  clearPerformanceCaches(); activeRenderPerfSignature=''; invalidateViewCache();
  const importAtomicCommit=await runAIHistoryTransaction(profileId,'import');
  if(importAtomicCommit?.ok) notifyLiveHistoryMutation(profileId);
  updateImportAiProgress(button, 100, importAtomicCommit?.ok ? ((finalImportDurable || finalSourceCheckpointDurable) ? "✓ ประมวลผลและบันทึกถาวรสำเร็จ" : "✓ ประมวลผลสำเร็จ • ใช้ Local Backup") : "✓ Import บันทึกแล้ว • History กำลังซิงก์ต่อ…");
  await waitForImportProgressPaint(550);
  importSandboxPreviewUrl = "";
  importSandboxPreviewUrls = [];
  closeModal();
  if(importAtomicCommit?.ok){ state.activeProfile = profileId; state.historyFormulaMode = "compare"; state.currentView = "history"; saveState(); render(); }
  else scheduleAIHistoryTransactionRetry(profileId,450);
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


// V7.20.86c — Professional Instant History Commit.
// Daily newest-result saves must never wait for WF/AI backtests before the user sees the row.
// We score the just-saved row from the prediction state that already existed before the result,
// atomically extend the previously committed History snapshot in O(1), render immediately,
// then enrich/rebuild durable model caches in foreground-idle. No result is used to train itself.
function instantCommitNewestHistoryRow(profileId, savedActual, previousDraws, previousSnapshot){
  const id=Number(profileId), prev=Array.isArray(previousDraws)?previousDraws:[];
  if(!savedActual || !previousSnapshot || previousSnapshot.fingerprint!==aiHistoryDatasetFingerprint(id,prev)) return {ok:false,reason:'no-prior-atomic-snapshot'};
  const base=getHistoryComparisonStatuses(savedActual,id);
  if(!base?.trusted) return {ok:false,reason:'row-not-verified-yet'};
  const statuses={
    classic:base.classic||'pending',
    aiL:base.aiL||'pending',
    gl:base.gl||'pending',
    p18:patternV18HistoryStatus(savedActual,id),
    p19:patternV19HistoryStatus(savedActual,id),
    x3:x3HistoryStatus(savedActual,id)
  };
  if(UNIFIED_AI_ENGINE_ORDER.some(k=>statuses[k]==='pending')) return {ok:false,reason:'instant-row-pending',statuses};
  const rows={...(previousSnapshot.rows||{})};
  rows[unifiedAIRowKey(savedActual)]={...statuses};
  const summaries={};
  for(const engine of UNIFIED_AI_ENGINE_ORDER){
    const before=previousSnapshot.summaries?.[engine]||{hit:0,total:0,rate:0};
    const hit=Number(before.hit||0)+(statuses[engine]==='exact'||statuses[engine]==='reversed'||statuses[engine]==='swap'?1:0);
    const total=Number(before.total||0)+1;
    summaries[engine]={hit,total,rate:total?Math.round(hit*1000/total)/10:0};
  }
  const drawsNow=(state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===id).sort((a,b)=>String(a?.date||'').localeCompare(String(b?.date||''))||Number(a?.createdAt||0)-Number(b?.createdAt||0));
  const snapshot={ok:true,trusted:Number(previousSnapshot.trusted||prev.length)+1,pending:0,rows,summaries,generation:`instant-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,instant:true};
  persistCommittedAIHistorySnapshot(id,drawsNow,snapshot);
  persistHistorySummaryCache(id,drawsNow,summaries);
  AI_STANDARD_SNAPSHOT_CACHE={signature:'',builtAt:0,profiles:new Map()};
  return {ok:true,summaries,statuses,snapshot};
}

function scheduleActualDrawPostCommitEnrichment({profileId,wfIncrementalStart,autoTable}){
  const id=Number(profileId);
  const work=async()=>{
    try{
      if(document.visibilityState==='hidden') return setTimeout(()=>scheduleActualDrawPostCommitEnrichment({profileId:id,wfIncrementalStart,autoTable}),900);
      if(userInteractionHot(450)) await waitForForegroundIdle(700);
      if(wfIncrementalStart) await rebuildWalkForwardBacktest(id,null,{startDate:wfIncrementalStart,fastEvolution:true,yieldEvery:6});
      else scheduleMissingWalkForwardBootstrap(id);
      try{
        autoEvolveAfterActualSave(id);
        autoEvolveAIGLAfterActualSave(id);
        if(autoTable) saveAIPredictionSnapshotsForTable(autoTable);
      }catch(e){ console.warn('Post-save AI evolve skipped',e); }
      clearPerformanceCaches(); activeRenderPerfSignature=''; invalidateViewCache();
      const result=await refreshUnifiedAIHistoryAfterMutation(id);
      saveState(); notifyLiveHistoryMutation(id);
      if(result?.ok && state.currentView==='history' && Number(state.activeProfile)===id && !userInteractionHot(450)){
        requestAnimationFrame(()=>refreshCurrentView());
      } else if(!result?.ok){
        scheduleAIHistoryTransactionRetry(id,700);
      }
    }catch(e){
      console.error('Post-save History enrichment failed',e);
      scheduleAIHistoryTransactionRetry(id,900);
    }
  };
  setTimeout(()=>{ void work(); },280);
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
    // Capture the exact pre-save atomic generation so a normal newest draw can be appended
    // to History immediately without waiting for any retraining/backtest.
    const autoDecisionAtSave = getHistoricalAutoFormulaDecision(profileId, date, 30);
    const preSaveProfileDraws=(state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===profileId).sort((a,b)=>String(a?.date||'').localeCompare(String(b?.date||''))||Number(a?.createdAt||0)-Number(b?.createdAt||0));
    const preSaveCommittedSnapshot=readCommittedAIHistorySnapshot(profileId,preSaveProfileDraws);

    saveBtn.disabled = true;
    updateActualDrawProgress(10, "กำลังบันทึก…");

    let savedActual;
    let autoTable=null;
    let instantCommit=null;
    let primaryCommitted=false;
    let wfIncrementalStart="";
    let isNewLatestDraw=false;

    // V7.20.86r — SAVE COMMIT GUARD. The actual result is the only critical transaction.
    // Once it is durably committed, failures in Table/L/AI/render must NEVER report
    // "บันทึกไม่สำเร็จ" because that creates a dangerous duplicate-save retry on iPhone.
    try {
      if (existing) {
        existing.profileId = profileId; existing.profileName = profileName; existing.date = date; existing.number = number; existing.twoDigit = twoDigit; existing.note = note; existing.referenceTableId = referenceTableId; existing.updatedAt = Date.now();
        existing.autoDecisionSnapshot = {...autoDecisionAtSave,reconstructed:false,trustedOnly:true,recordedAt:Date.now()};
        savedActual = existing;
      } else {
        savedActual = { id: uid(), profileId, profileName, date, number, twoDigit, note, referenceTableId:"", source:"manual", createdAt: Date.now(), autoDecisionSnapshot:{...autoDecisionAtSave,reconstructed:false,trustedOnly:true,recordedAt:Date.now()} };
        state.actualDraws.push(savedActual);
      }

      isNewLatestDraw = !existing && !duplicate && (!latestDateBeforeSave || String(date) > latestDateBeforeSave);
      const earliestAffectedDate = existing && oldExistingDate && oldExistingDate < String(date) ? oldExistingDate : String(date);
      wfIncrementalStart = walkForwardAffectedStartDate(profileId, earliestAffectedDate);

      // Primary result durability. localStorage is instant; IndexedDB is the rare fallback.
      let durable = saveState();
      if(!durable){
        clearTimeout(persistenceWriteTimer); persistenceWriteTimer=null;
        durable = await commitStateDurably();
      }
      if(!durable) throw new Error('actual-primary-durable-commit-failed');
      primaryCommitted=true;
      // V7.20.86r: commit the compact History source in the same successful transaction.
      // If iOS kills the PWA immediately after Save, History cold boot can restore this row
      // without waiting for the async IndexedDB/redundancy timers.
      try { writeHistorySourceSyncCheckpoint(state); }
      catch(error){ console.warn('Actual History source sync checkpoint deferred',error); }
    } catch (saveError) {
      console.error('Actual result primary save failed', saveError);
      // Roll back a newly inserted in-memory row only when no durable commit happened.
      if(!primaryCommitted && !existing && savedActual){
        const idx=(state.actualDraws||[]).findIndex(x=>x.id===savedActual.id);
        if(idx>=0) state.actualDraws.splice(idx,1);
      }
      saveBtn.disabled = false;
      saveBtn.classList.remove("processing");
      alert("บันทึกไม่สำเร็จ กรุณาลองใหม่");
      return;
    }

    // Everything below is derived/enrichment work. It can degrade gracefully but can no longer
    // turn a successful actual-result commit into a false failure alert.
    try {
      autoTable = upsertDailyTableFromActual(savedActual);
      if(autoTable) saveState();
    } catch (e) { console.warn('Post-save Next Table deferred', e); autoTable=null; }

    try {
      syncAutoLHistoryForActual(savedActual);
      if(!isNewLatestDraw) syncAutoLHistoryForProfile(profileId);
    } catch (e) { console.warn('Post-save L History sync deferred', e); }

    if(isNewLatestDraw){
      try { instantCommit=instantCommitNewestHistoryRow(profileId,savedActual,preSaveProfileDraws,preSaveCommittedSnapshot); }
      catch (e) { console.warn('Instant AI History commit deferred',e); instantCommit={ok:false,reason:'exception'}; }
    }

    updateActualDrawProgress(100, instantCommit?.ok ? "✓ บันทึกแล้ว • History พร้อมทันที" : "✓ บันทึกแล้ว");
    activeRenderPerfSignature=''; invalidateViewCache();
    state.historyFormulaMode = "compare"; state.currentView = "history"; saveState();
    closeModal();
    try { render(); } catch (e) { console.error('Post-save render failed',e); setTimeout(()=>{ try{ refreshCurrentView(); }catch(_){ } },120); }
    try { notifyLiveHistoryMutation(profileId); } catch (e) { console.warn('Post-save live notify deferred',e); }

    // Heavy work remains fully detached from the tap path.
    try { scheduleActualDrawPostCommitEnrichment({profileId,wfIncrementalStart,autoTable}); }
    catch (e) { console.warn('Post-save enrichment schedule deferred',e); }

    if(instantCommit?.ok) showToast(autoTable ? "✓ บันทึกผลแล้ว • History/เปอร์เซ็นต์อัปเดตทันที • Next Table Ready" : "✓ บันทึกผลแล้ว • History/เปอร์เซ็นต์อัปเดตทันที");
    else showToast(autoTable ? "✓ บันทึกผลแล้ว • History พร้อม • AI ซิงก์เบื้องหลัง" : "✓ บันทึกผลแล้ว • History พร้อม • Table/AI ซิงก์เบื้องหลัง");
    return;

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

function remapProfileIndexedPersistentCaches(indexMap) {
  if (!(indexMap instanceof Map) || !indexMap.size) return false;
  const mappedDraws = (newId) => (state.actualDraws || [])
    .filter(d => Number(d?.profileId ?? 0) === Number(newId))
    .slice().sort((a,b)=>String(a?.date||'').localeCompare(String(b?.date||''))||Number(a?.createdAt||0)-Number(b?.createdAt||0)||String(a?.id||'').localeCompare(String(b?.id||'')));
  const remapLocalObject = (storageKey, transform) => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const source = JSON.parse(raw) || {}, out = {};
      Object.entries(source).forEach(([key, value]) => {
        const oldId = Number(key);
        if (!indexMap.has(oldId)) return;
        const newId = indexMap.get(oldId);
        out[String(newId)] = transform ? transform(value, newId, oldId) : value;
      });
      localStorage.setItem(storageKey, JSON.stringify(out));
      return out;
    } catch (_) { return null; }
  };

  // History atomic snapshot — statuses/summaries are preserved, only identity/signature changes.
  const committed = remapLocalObject(AI_HISTORY_COMMITTED_SNAPSHOT_KEY, (item,newId) => {
    const draws = mappedDraws(newId);
    return item && typeof item === 'object'
      ? {...item, profileId:newId, fingerprint:aiHistoryDatasetFingerprint(newId,draws), committedAt:Date.now()}
      : item;
  });
  if (committed) {
    AI_HISTORY_COMMITTED_STORE_MEMORY = committed;
    AI_HISTORY_COMMITTED_STORE_RAW = JSON.stringify(committed);
  } else { AI_HISTORY_COMMITTED_STORE_MEMORY=null; AI_HISTORY_COMMITTED_STORE_RAW=''; }

  // Small History summary adapter.
  const historySummary = remapLocalObject(HISTORY_SUMMARY_CACHE_KEY, (item,newId) => {
    const draws = mappedDraws(newId);
    return item && typeof item === 'object'
      ? {...item, signature:historySummarySignature(newId,draws), updatedAt:Date.now()}
      : item;
  });
  if (historySummary) {
    HISTORY_SUMMARY_STORE_MEMORY = historySummary;
    HISTORY_SUMMARY_STORE_RAW = JSON.stringify(historySummary);
  } else { HISTORY_SUMMARY_STORE_MEMORY=null; HISTORY_SUMMARY_STORE_RAW=''; }

  // AI Standard common-dataset summary.
  const aiStandard = remapLocalObject(AI_STANDARD_PROFILE_CACHE_KEY, (item,newId) => {
    const draws = mappedDraws(newId);
    return item && typeof item === 'object'
      ? {...item, signature:aiStandardProfileSummarySignature(newId,draws), updatedAt:Date.now()}
      : item;
  });
  if (aiStandard) {
    AI_STANDARD_PROFILE_STORE_MEMORY = aiStandard;
    AI_STANDARD_PROFILE_STORE_RAW = JSON.stringify(aiStandard);
  } else { AI_STANDARD_PROFILE_STORE_MEMORY=null; AI_STANDARD_PROFILE_STORE_RAW=''; }

  // P18 persistent row keys embed Profile index as well. Re-key the deterministic
  // statuses and stamp them with the reordered canonical source signature.
  try {
    loadP18HistoryCache();
    const p18Rows=[...P18_HISTORY_STATUS_CACHE.entries()];
    P18_HISTORY_STATUS_CACHE.clear();
    for (const [key,status] of p18Rows) {
      const parts=String(key).split('|');
      if (parts[0]==='P18S' && indexMap.has(Number(parts[1]))) parts[1]=String(indexMap.get(Number(parts[1])));
      P18_HISTORY_STATUS_CACHE.set(parts.join('|'),status);
    }
    localStorage.setItem(P18_HISTORY_CACHE_KEY,JSON.stringify({source:p18HistorySourceSignature(),items:Object.fromEntries(P18_HISTORY_STATUS_CACHE)}));
    p18HistoryCacheLoaded=true;
  } catch (_) {}

  // Keep per-Profile History pagination position attached to the same logical Profile.
  try {
    const nextVisible={};
    Object.entries(historyVisibleLimitByProfile||{}).forEach(([oldKey,value])=>{
      const oldId=Number(oldKey); if(indexMap.has(oldId)) nextVisible[indexMap.get(oldId)]=value;
    });
    historyVisibleLimitByProfile=nextVisible;
  } catch (_) {}

  // X3 synchronous mirrors: collect first, then delete/write to avoid swap collisions (1↔2).
  const x3Moves = [];
  for (const [oldIdRaw,newIdRaw] of indexMap.entries()) {
    const oldId=Number(oldIdRaw), newId=Number(newIdRaw);
    try {
      const raw=localStorage.getItem(x3SyncMirrorKey(oldId));
      if (raw) {
        const saved=JSON.parse(raw);
        if (saved && typeof saved==='object') x3Moves.push({oldId,newId,saved});
      }
    } catch (_) {}
  }
  try { for (const {oldId} of x3Moves) localStorage.removeItem(x3SyncMirrorKey(oldId)); } catch (_) {}
  for (const {newId,saved} of x3Moves) {
    try {
      const next={...saved,cacheKey:x3BundleCacheKey(newId),engineSignature:X3_ENGINE_SIGNATURE};
      localStorage.setItem(x3SyncMirrorKey(newId),JSON.stringify(next));
    } catch (_) {}
  }

  // IndexedDB X3 copies are remapped asynchronously; the synchronous mirror above keeps
  // first paint instant while this durability step completes. Read all before deleting any
  // old key so swaps cannot overwrite each other.
  if (x3Moves.length) setTimeout(async()=>{
    try {
      const loaded=await Promise.all(x3Moves.map(async m=>({m,data:await readIndexedValue(x3PersistentKey(m.oldId))})));
      await Promise.all(x3Moves.map(m=>deleteIndexedValue(x3PersistentKey(m.oldId))));
      await Promise.all(loaded.filter(x=>x.data).map(({m,data})=>writeIndexedValue(x3PersistentKey(m.newId),{...data,cacheKey:x3BundleCacheKey(m.newId),engineSignature:X3_ENGINE_SIGNATURE})));
    } catch (error) { console.warn('Profile reorder X3 durable remap skipped',error); }
  },0);

  // Derived view HTML is presentation-only and cheap to recreate from the preserved
  // canonical caches. Never flash a remembered screen that still contains the old order.
  try { localStorage.removeItem(PRO_VIEW_SNAPSHOT_KEY); localStorage.removeItem(PRO_DETAIL_SNAPSHOT_KEY); } catch (_) {}
  PRO_VIEW_STORE_MEMORY=null; PRO_VIEW_STORE_RAW='';
  PRO_DETAIL_STORE_MEMORY=null; PRO_DETAIL_STORE_RAW='';
  try { LAST_VIEW_HTML_CACHE.clear(); } catch (_) {}
  AI_STANDARD_SNAPSHOT_CACHE={signature:'',builtAt:0,profiles:new Map()};
  return true;
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

  // V7.20.37 — Settings reorder is identity-preserving, not a data mutation.
  // WF fingerprints include profileId by design; after an index remap the historical
  // rows/tables are still the same Profile, but the old fingerprint would fail trust and
  // make Analysis fall back to Trusted 0/8 or 1/8. Re-sign ONLY the already-complete
  // remapped buckets against their unchanged History/table inputs. No model is retrained.
  Object.entries(state.walkForwardBacktests || {}).forEach(([key, bucket]) => {
    const newId = Number(key);
    if (!bucket || !Number.isInteger(newId)) return;
    try { bucket.cacheFingerprint = buildWalkForwardCacheFingerprint(newId); }
    catch (error) { console.warn("Profile reorder WF fingerprint refresh skipped", newId, error); }
  });

  // P19 primary summaries are also keyed by Profile index. Preserve the committed
  // status rows and re-key their identity to the new index; the source data itself did
  // not change, so rebuilding the model here would be both wasteful and misleading.
  state.p19PrimaryCache = remapObjectKeys(state.p19PrimaryCache, (saved, newId) => {
    if (!saved || typeof saved !== "object") return saved;
    return { ...saved, key:v19BackgroundKey(newId), engineSignature:PATTERN_V19_ENGINE_SIGNATURE, updatedAt:Date.now() };
  });

  // Keep every small persistent Profile-indexed adapter aligned with the same remap.
  // This is what makes reorder behave like a presentation operation: READY stays READY
  // and no Profile temporarily inherits another Profile's cached dashboard.
  try { remapProfileIndexedPersistentCaches(indexMap); }
  catch (error) { console.warn("Profile reorder persistent cache remap skipped", error); }

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
  // V7.09.68: if deleting the final Profile makes another Profile the new last item,
  // keep its History-derived tables/WF alive instead of leaving it at 0/0.
  ensureProfileDerivedHistoryReady(state.activeProfile);
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
// V7.19.06 — foreground interaction always wins over WF/AI maintenance.
// iOS Safari runs JS and scrolling on the same main thread; background model work must
// yield while the user is tapping, switching tabs, scrolling, or typing.
let lastUserInteractionAt = 0;
function noteUserInteraction() {
  try { lastUserInteractionAt = performance.now(); } catch (_) { lastUserInteractionAt = Date.now(); }
}
function userInteractionHot(windowMs = 550) {
  const now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
  return now - Number(lastUserInteractionAt || 0) < Math.max(0, Number(windowMs) || 0);
}
async function waitForForegroundIdle(quietMs = 500) {
  while (document.visibilityState !== "hidden" && userInteractionHot(quietMs)) {
    await new Promise(resolve => setTimeout(resolve, 90));
  }
}
if (!window.__luckySmoothInteractionBound) {
  window.__luckySmoothInteractionBound = true;
  document.addEventListener("pointerdown", noteUserInteraction, {capture:true, passive:true});
  document.addEventListener("touchstart", noteUserInteraction, {capture:true, passive:true});
  document.addEventListener("keydown", noteUserInteraction, {capture:true});
  document.addEventListener("scroll", noteUserInteraction, {capture:true, passive:true});
}

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
  const fastRebuild=Boolean(options.fastRebuild);
  return {
    version:4,status:"queued",phase:"tables",tableIndex:0,syncProfileIndex:0,verifyProfileIndex:0,wfProfileIndex:0,liveProfileIndex:0,
    profileIds:ids,wfProfileIds:cleanRebuild?[...ids]:[],reusedProfileIds:[],invalidProfileIds:cleanRebuild?[...ids]:[],verificationResults:{},cleanRebuild,fastRebuild,
    totalDraws:draws.length,startedAt:Date.now(),updatedAt:Date.now(),lastMessage:fastRebuild?"Turbo One-Pass Rebuild • WF fast + shared P19/X3 finalize":"Clean Rebuild • AI/WF/P19 Cache เก่าถูกล้างแล้ว"
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
        const fastMode=Boolean(state.walkForwardRebuildJob.fastRebuild);
        // Explicit Full Rebuild must not stall for 520 ms after every touch/scroll.
        await waitForForegroundIdle(fastMode?700:520);
        const from=Number(state.walkForwardRebuildJob.tableIndex||0), to=Math.min(from+(fastMode?240:40),draws.length);
        for(let i=from;i<to;i++){
          const draw=draws[i];
          if(!getDailyTable(Number(draw.profileId??0),draw.date)){
            try{upsertDailyTableFromActual(draw);}catch(error){console.warn("Restore missing-table rebuild failed",draw.date,error);}
          }
        }
        updateWalkForwardJob({tableIndex:to,lastMessage:`ตรวจตารางเบื้องหลัง ${to}/${draws.length}`});
        paintBackgroundJobProgress(); await nextUiFrame(fastMode?2:12);
      }
      if(state.walkForwardRebuildJob.fastRebuild){
        const ids=state.walkForwardRebuildJob.profileIds||[];
        updateWalkForwardJob({phase:"wf",syncProfileIndex:ids.length,verifyProfileIndex:ids.length,wfProfileIndex:0,wfProfileIds:[...ids],invalidProfileIds:[...ids],lastMessage:`Turbo WF • ข้าม Sync/Verify ซ้ำ ${ids.length} Profile`});
      } else {
        updateWalkForwardJob({phase:"sync",lastMessage:"กำลังเชื่อม History L"});
      }
    }
    // Phase 2: regenerate legacy display linkage one profile per yield.
    if(state.walkForwardRebuildJob.phase==="sync"){
      const ids=state.walkForwardRebuildJob.profileIds||[];
      while(Number(state.walkForwardRebuildJob.syncProfileIndex||0)<ids.length){
        await waitForForegroundIdle(520);
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
        await waitForForegroundIdle(520);
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
        const fastMode=Boolean(state.walkForwardRebuildJob.fastRebuild);
        await waitForForegroundIdle(fastMode?800:620);
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
        updateWalkForwardJob({lastMessage:`${fastMode?"Turbo ":""}WF Rebuild ${name} ${idx+1}/${ids.length}`}); paintBackgroundJobProgress();
        await rebuildWalkForwardBacktest(id, null, fastMode
          ? {yieldEvery:48, progressEvery:64, checkpointEvery:192, fastEvolution:true, deferDurable:true}
          : {yieldEvery:1, progressEvery:2});
        // One full-state serialization/IndexedDB commit for every 4 completed Profiles,
        // instead of one after every Profile. This is a major iPhone rebuild bottleneck.
        if(fastMode && ((idx+1)%8===0 || idx===ids.length-1)){
          saveState();
          const batchDurable=await commitStateDurably();
          if(batchDurable){
            for(let k=Math.max(0,idx-7);k<=idx;k++) if(ids[k]!==undefined) await deleteIndexedValue(wfProgressKey(ids[k]));
          }
        }
        const remainingInvalid=(state.walkForwardRebuildJob.invalidProfileIds||[]).filter(x=>Number(x)!==Number(id));
        updateWalkForwardJob({wfProfileIndex:idx+1,invalidProfileIds:remainingInvalid,lastMessage:`✓ WF ${name}`});
        await nextUiFrame(fastMode?4:24);
      }
      updateWalkForwardJob({phase:"live",liveProfileIndex:0,lastMessage:"กำลังอัปเดต AI L + AI GL + P19 Primary"});
    }
    // Phase 5: rebuild live formula/snapshot only after historical WF is verified/complete.
    if(state.walkForwardRebuildJob.phase==="live"){
      const ids=Array.isArray(state.walkForwardRebuildJob.liveProfileIds)
        ? state.walkForwardRebuildJob.liveProfileIds
        : (state.walkForwardRebuildJob.profileIds||[]);
      const profileDrawsById=new Map(ids.map(id=>[Number(id),[]]));
      for(const d of (state.actualDraws||[])){ const id=Number(d?.profileId??0); if(profileDrawsById.has(id)) profileDrawsById.get(id).push(d); }
      for(const arr of profileDrawsById.values()) arr.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||Number(a.createdAt||0)-Number(b.createdAt||0));
      const latestTableByProfile=new Map();
      for(const t of (state.dailyTables||[])){ const id=Number(t?.profileId??0); if(!profileDrawsById.has(id)) continue; const prev=latestTableByProfile.get(id); if(!prev||String(t.date||'')>String(prev.date||'')) latestTableByProfile.set(id,t); }
      while(Number(state.walkForwardRebuildJob.liveProfileIndex||0)<ids.length){
        if(!state.walkForwardRebuildJob.fastRebuild) await waitForForegroundIdle(620);
        const idx=Number(state.walkForwardRebuildJob.liveProfileIndex||0), id=ids[idx], name=state.profiles[id]||`Profile ${id+1}`;
        try{
          const fastMode=Boolean(state.walkForwardRebuildJob.fastRebuild);
          const aiLive=generateAIFormula(id,{deferSave:true,fast:fastMode});
          if(!aiLive?.error) generateAIGLFormula(id,{deferSave:true,fast:fastMode});
          // V7.20.02: P19 + X3 share one strict-prior historical pass.
          const p19Draws=profileDrawsById.get(id)||[];
          const combined=await computeP19X3HistoryBundlesAsync(p19Draws,id,{fast:fastMode});
          const p19Bundle=combined.p19Bundle, x3Bundle=combined.x3Bundle;
          publishUnifiedAIBundles(id,{p19Bundle,x3Bundle});
          // V7.20.25: Full Rebuild publishes through the same committed snapshot format
          // without recomputing P19/X3 a second time.
          await warmUnifiedP18ProfileCache(id);
          const rebuiltSnapshot=buildCommittedAIHistorySnapshot(id,p19Draws);
          if(rebuiltSnapshot.ok){ persistCommittedAIHistorySnapshot(id,p19Draws,rebuiltSnapshot); persistHistorySummaryCache(id,p19Draws,rebuiltSnapshot.summaries); }
          const latestTable=latestTableByProfile.get(id)||null;
          if(latestTable) saveAIPredictionSnapshotsForTable(latestTable);
        }catch(error){console.warn("Background live AI/P19 rebuild skipped",name,error);}
        updateWalkForwardJob({liveProfileIndex:idx+1,lastMessage:`One-Pass AI + P19 + X3 ${name} ${idx+1}/${ids.length}`});
        paintBackgroundJobProgress(); await nextUiFrame(state.walkForwardRebuildJob.fastRebuild?6:20);
      }
      const reusedCount=(state.walkForwardRebuildJob.reusedProfileIds||[]).length;
      const rebuiltCount=(state.walkForwardRebuildJob.wfProfileIds||[]).length;
      // V7.20.86r: atomic ranking publish is the final gate. Seven identical fresh
      // computations must agree before the rebuild can be marked 100% complete.
      updateWalkForwardJob({rankingState:"AUDITING",lastMessage:"กำลังตรวจ Profile Ranking Repeatability 7 รอบ"});
      const rankingSnapshot=publishDeterministicProfileRankingSnapshot(state.walkForwardRebuildJob.rankingGeneration||"");
      updateWalkForwardJob({rankingState:"READY",rankingDigest:rankingSnapshot.digest,rankingAuditRuns:rankingSnapshot.auditRuns,lastMessage:`✓ Profile Ranking Atomic ${rankingSnapshot.digest}`});
      // R6: do not show 100% or delete the checkpoint until the completed state
      // has been durably committed. This closes the iOS 100% -> 91% relaunch race.
      await commitCompletedWfJobDurably(reusedCount, rebuiltCount);
      setJsonRestoreProgress(100,`✓ AI/WF + P19 + X3 + Ranking พร้อม • Repeatability 7/7 • Cache ${reusedCount} • Rebuild ${rebuiltCount}`);
      // Do not clear P19 runtime bundles here: they were just built for every Profile.
      PERF_CACHE.autoDecision.clear(); PERF_CACHE.recentAIWinner.clear(); activeRenderPerfSignature=""; invalidateViewCache();
      // V7.20.21: a completed Rebuild publishes the aggregate cache in chunked idle work.
      // The next relaunch therefore reads one small score object instead of scanning 2,000+ rows.
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
  setTimeout(() => {
    const launch = () => {
      if (userInteractionHot(650)) { scheduleWalkForwardBackgroundJob(700); return; }
      void runWalkForwardBackgroundJob();
    };
    if ("requestIdleCallback" in window) requestIdleCallback(launch, {timeout:1800});
    else launch();
  }, Math.max(0, Number(delay)||0));
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


// V7.20.86c — Professional Fast JSON Restore.
// Parse + checksum validation run in a disposable Worker so a large backup cannot freeze
// navigation/the Settings page on iPhone. The worker receives the File directly, avoiding
// a second main-thread text copy before JSON.parse.
function parseBackupFileOffMainThread(file) {
  if (!file) return Promise.reject(new Error("ไม่พบไฟล์ Backup"));
  if (typeof Worker === "undefined" || typeof Blob === "undefined" || typeof URL === "undefined") {
    return file.text().then(async text => {
      const parsed = JSON.parse(text);
      const validated = await validateBackupEnvelope(parsed);
      return { parsed, validated };
    });
  }
  const workerSource = `
    const bytesToHex = buffer => [...new Uint8Array(buffer)].map(b=>b.toString(16).padStart(2,'0')).join('');
    const fnv = text => { let h=0x811c9dc5; for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;} return h.toString(16).padStart(8,'0'); };
    const counts = data => ({profiles:Array.isArray(data?.profiles)?data.profiles.length:0,records:Array.isArray(data?.records)?data.records.length:0,actualDraws:Array.isArray(data?.actualDraws)?data.actualDraws.length:0,dailyTables:Array.isArray(data?.dailyTables)?data.dailyTables.length:0});
    const structure = data => { if(!data||typeof data!=='object'||Array.isArray(data)) throw new Error('Backup ไม่มีข้อมูล State ที่ถูกต้อง'); if(!Array.isArray(data.profiles)||!data.profiles.length) throw new Error('Backup ไม่มี Profile'); for(const k of ['records','actualDraws','dailyTables']) if(!Array.isArray(data[k])) throw new Error('Backup field '+k+' ไม่ถูกต้อง'); };
    const hash = async (data,algorithm) => { const text=JSON.stringify(data); if(algorithm==='SHA-256' && self.crypto?.subtle && typeof TextEncoder!=='undefined'){ const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)); return {algorithm:'SHA-256',value:bytesToHex(digest)}; } return {algorithm:'FNV-1a-32',value:fnv(text)}; };
    self.onmessage = async e => { try { const file=e.data; const text=await file.text(); const parsed=JSON.parse(text); let data=parsed,legacy=true; if(parsed?.format==='LuckyNumberBackup'){ data=parsed.state; structure(data); const version=Number(parsed.formatVersion||0); legacy=version<4; if(version>=4){ const expected=parsed.counts||{},actual=counts(data); for(const k of Object.keys(actual)) if(Number(expected[k])!==Number(actual[k])) throw new Error('Backup count ไม่ตรง ('+k+')'); const check=parsed.checksum; if(!check?.algorithm||!check?.value) throw new Error('Backup ไม่มี checksum'); const actualHash=await hash(data,check.algorithm); if(String(actualHash.algorithm)!==String(check.algorithm)||String(actualHash.value)!==String(check.value)) throw new Error('Backup checksum ไม่ตรง ไฟล์อาจเสียหายหรือถูกแก้ไข'); } } else { structure(data); }
      self.postMessage({ok:true,parsed,legacy});
    } catch(err) { self.postMessage({ok:false,error:String(err?.message||err||'Invalid backup')}); } };
  `;
  const url=URL.createObjectURL(new Blob([workerSource],{type:"text/javascript"}));
  return new Promise((resolve,reject)=>{
    const worker=new Worker(url);
    const finish=()=>{ try{worker.terminate();}catch(_){} try{URL.revokeObjectURL(url);}catch(_){} };
    worker.onmessage=e=>{ const msg=e.data||{}; finish(); if(!msg.ok) reject(new Error(msg.error||"Invalid backup")); else { const parsed=msg.parsed; const data=parsed?.format==="LuckyNumberBackup"?parsed.state:parsed; resolve({parsed,validated:{data,legacy:Boolean(msg.legacy),envelope:parsed?.format==="LuckyNumberBackup"?parsed:undefined}}); } };
    worker.onerror=e=>{ finish(); reject(new Error(e?.message||"อ่าน Backup ไม่สำเร็จ")); };
    worker.postMessage(file);
  });
}

function cleanImportedDailyTablesForAIRebuildFast(tables) {
  const list=Array.isArray(tables)?tables:[];
  // Mutate the freshly parsed backup in place. Copying every table and rebuilding every
  // Classic grid during import doubled memory and blocked the main thread for seconds.
  for(const table of list){
    if(!table||typeof table!=="object") continue;
    delete table.predictionSnapshot; delete table.aiFormulaSnapshot; delete table.aiFormulaVersion;
    delete table.aiSnapshotTargetDate; delete table.aiSnapshotCreatedAt; delete table.masterPredictionSnapshot;
    delete table.snapshotBlockedReason;
  }
  return list;
}

function scheduleImportedHistoryRelink(profileIds=null, delay=180) {
  const token=String(Date.now())+Math.random();
  window.__jsonRestoreRelinkToken=token;
  const run=async()=>{
    const draws=validRestoreDrawsSorted();
    state.records=[];
    const batch=60;
    for(let i=0;i<draws.length;i+=batch){
      if(window.__jsonRestoreRelinkToken!==token) return;
      await waitForForegroundIdle(220);
      const end=Math.min(i+batch,draws.length);
      for(let j=i;j<end;j++){ try{syncAutoLHistoryForActual(draws[j]);}catch(error){console.warn("JSON History relink",draws[j]?.date,error);} }
      if((i/batch)%4===3) await nextUiFrame(2);
    }
    // Persist once after relink; never serialize the full state per row.
    try{ saveState(); }catch(error){ console.warn("JSON relink save",error); }
  };
  setTimeout(()=>{ if("requestIdleCallback" in window) requestIdleCallback(()=>void run(),{timeout:1400}); else void run(); },Math.max(0,Number(delay)||0));
}

function importedBackupVerifiedReuseProof(validated) {
  const envelope=validated?.envelope;
  if(!envelope || validated?.legacy) return {eligible:false,partial:false,reason:"legacy-backup",reused:[],invalid:[]};
  if(Number(envelope?.wf?.schema)!==Number(WF_CACHE_SCHEMA) || String(envelope?.wf?.engineVersion||"")!==String(WF_ENGINE_VERSION))
    return {eligible:false,partial:false,reason:"wf-engine-mismatch",reused:[],invalid:[]};
  if(String(envelope?.appVersion||"").trim()==="") return {eligible:false,partial:false,reason:"missing-app-version",reused:[],invalid:[]};
  const ids=restoreJobProfileIds();
  let currentFingerprint="";
  try{ currentFingerprint=currentWfCompletionInputFingerprint(ids); }catch(error){ return {eligible:false,partial:false,reason:"fingerprint-error",reused:[],invalid:[],error}; }
  if(!envelope?.wf?.datasetFingerprint || String(envelope.wf.datasetFingerprint)!==String(currentFingerprint))
    return {eligible:false,partial:false,reason:"dataset-fingerprint",reused:[],invalid:[]};
  const reused=[], invalid=[], results={};
  // V7.20.86e — trust is proven per Profile, not by an all-or-nothing restore-job flag.
  // A backup can contain complete canonical WF buckets even when the transient rebuild job
  // was absent/old. Each profile is independently verified against current History and the
  // strict prior-only methodology before it is admitted to Profile Trend.
  for(const id of ids){
    if(walkForwardProfileDraws(id).length<8){ reused.push(id); results[id]="no-wf-needed"; continue; }
    const check=verifyWalkForwardCache(id);
    results[id]=check.reason|| (check.valid?"verified":"invalid");
    if(check.valid) reused.push(id); else invalid.push(id);
  }
  return {
    eligible:reused.length>0,
    partial:reused.length>0 && invalid.length>0,
    fullyVerified:invalid.length===0,
    reused,invalid,results,currentFingerprint,
    reason:invalid.length?(reused.length?"partial-profile-cache":"profile-cache-invalid"):"verified"
  };
}

function primeImportedProfileTrendNow(todayKey=isoDate()) {
  try{
    AI_PROFILE_TREND_CACHE.clear();
    const byFocus={};
    for(const d of [7,14,30]) byFocus[d]=getProfileTrendRanking(d,todayKey,true);
    const snapshot={schema:3,date:todayKey,createdAt:Date.now(),byFocus};
    mirrorAIProfileTrendDaily(snapshot);
    // Durable write is intentionally fire-and-forget; first paint uses the synchronous mirror.
    void writeIndexedValue(aiProfileTrendIndexedKey(todayKey),snapshot);
    for(const d of [7,14,30]) AI_PROFILE_TREND_CACHE.set(`${todayKey}|${d}|daily`,byFocus[d]);
    return byFocus;
  }catch(error){ console.warn("Prime imported Profile Trend",error); return null; }
}

function installImportedVerifiedCompletion(proof) {
  const ids=restoreJobProfileIds();
  const completedAt=Date.now();
  state.walkForwardRebuildJob={
    version:4,status:"done",phase:"done",profileIds:[...ids],wfProfileIds:[],invalidProfileIds:[],reusedProfileIds:[...proof.reused],
    verificationResults:{...(proof.results||{})},totalDraws:validRestoreDrawsSorted().length,
    tableIndex:validRestoreDrawsSorted().length,syncProfileIndex:ids.length,verifyProfileIndex:ids.length,wfProfileIndex:0,liveProfileIndex:ids.length,
    finishedAt:completedAt,updatedAt:completedAt,profileRevision:Number(state._profileRevision||0),cleanRebuild:false,fastRebuild:false,
    lastMessage:`✓ Verified Restore • Trusted Cache ${proof.reused.length}/${ids.length} • ไม่ Rebuild ซ้ำ`
  };
  const marker={
    version:3,completedAt,signature:currentWfDatasetSignature(state.walkForwardRebuildJob),profileRevision:Number(state._profileRevision||0),
    totalDraws:Number(state.walkForwardRebuildJob.totalDraws||0),profileIds:[...ids],inputFingerprint:proof.currentFingerprint||currentWfCompletionInputFingerprint(ids),
    reusedCount:proof.reused.length,rebuiltCount:0,durableIndexedDB:false,mutationReason:"verified-json-restore"
  };
  writeWfCompletionMarkerSync(marker);
  void writeIndexedValue(WF_COMPLETION_KEY,marker);
  try{ localStorage.removeItem(WF_JOB_KEY); }catch(_){}
  // Restore durable P19 summaries immediately when their source fingerprints still match.
  for(const id of ids){ try{ restorePatternV19PersistentCache(id); }catch(_){} }
  return marker;
}

async function restoreJsonBackupFast(parsed, options={}) {
  const validated = options.validated || await validateBackupEnvelope(parsed);
  const data = validated.data;
  const returnView = state.currentView || "settings";
  const returnProfile = Number(state.activeProfile || 0);
  const existingCount=(state.records?.length||0)+(state.actualDraws?.length||0)+(state.dailyTables?.length||0);
  if(existingCount>0 && !confirm(`การกู้คืนจะใช้ข้อมูลจากไฟล์แทนข้อมูลปัจจุบัน\n\nระบบจะตรวจ Trusted AI/WF Cache จาก checksum + engine + dataset fingerprint + strict prior-only rows ก่อน ถ้าผ่านจะคืนเปอร์เซ็นต์/Best Profiles ทันที และ Rebuild เฉพาะ Cache ที่ไม่ผ่านเท่านั้น\n\nต้องการดำเนินการต่อหรือไม่?`)) return null;

  // Install the private parsed backup without throwing away proven derived evidence first.
  const base=typeof structuredClone==="function"?structuredClone(DEFAULT_STATE):JSON.parse(JSON.stringify(DEFAULT_STATE));
  state={...base,...data};
  state.actualDraws=Array.isArray(data.actualDraws)?data.actualDraws:[];
  state.dailyTables=Array.isArray(data.dailyTables)?data.dailyTables:[];
  state.records=Array.isArray(data.records)?data.records:[];
  state.profiles=Array.isArray(data.profiles)&&data.profiles.length?data.profiles:[...DEFAULT_STATE.profiles];
  state.activeProfile=Math.min(Math.max(returnProfile,0),state.profiles.length-1);
  state.currentView=returnView;
  state.rankingConfig={...base.rankingConfig,...(data.rankingConfig||{})}; state.webSync={...base.webSync,...(data.webSync||{})};
  state.backupSettings={...base.backupSettings,...(data.backupSettings||{})}; state.masterAISettings={...base.masterAISettings,...(data.masterAISettings||{})};
  state._historyResetAt=0;
  repairAutoGeneratedDailyTablesProfileFormula();
  clearPerformanceCaches(); activeRenderPerfSignature=""; invalidateViewCache();

  // Professional restore: prove an already-completed backup before destroying its caches.
  // A v4 backup checksum protects the exact state bytes; the WF envelope proves engine/schema;
  // the current dataset fingerprint proves identical inputs; verifyWalkForwardCache re-checks
  // every row's strict-prior boundary and saved status. Only then is it trusted immediately.
  const proof=importedBackupVerifiedReuseProof(validated);
  if(proof.eligible){
    const ids=restoreJobProfileIds();
    // Keep every independently verified bucket live immediately. Never discard valid profiles
    // merely because one sibling profile needs repair.
    if(proof.partial){
      state.walkForwardBacktests=state.walkForwardBacktests||{};
      for(const id of proof.invalid) delete state.walkForwardBacktests[id];
      state.walkForwardRebuildJob=createWalkForwardRebuildJob({cleanRebuild:false});
      state.walkForwardRebuildJob.profileIds=[...ids];
      state.walkForwardRebuildJob.wfProfileIds=[...proof.invalid];
      state.walkForwardRebuildJob.invalidProfileIds=[...proof.invalid];
      state.walkForwardRebuildJob.reusedProfileIds=[...proof.reused];
      state.walkForwardRebuildJob.verificationResults={...(proof.results||{})};
      state.walkForwardRebuildJob.status="running";
      state.walkForwardRebuildJob.phase="wf";
      state.walkForwardRebuildJob.wfProfileIndex=0;
      state.walkForwardRebuildJob.lastMessage=`Trusted ${proof.reused.length} Profile พร้อม • ซ่อม ${proof.invalid.length} Profile เบื้องหลัง`;
    } else {
      installImportedVerifiedCompletion(proof);
    }
    // Build today's Trend synchronously from the verified rows before rendering AI Center.
    // This fixes the old state where History was present but the daily Trend mirror was empty.
    primeImportedProfileTrendNow(isoDate());
    writeBootStateSnapshot(state);
    render();
    if(proof.partial){
      setJsonRestoreProgress(Math.max(30,backgroundJobPercent(state.walkForwardRebuildJob)),`✓ Trusted ${proof.reused.length} Profile พร้อมทันที • ซ่อม ${proof.invalid.length} Profile เบื้องหลัง`);
      scheduleWalkForwardBackgroundJob(180);
    } else {
      setJsonRestoreProgress(100,`✓ Trusted History พร้อมทันที • Cache ผ่าน ${proof.reused.length} Profile • ไม่ Rebuild ซ้ำ`);
    }
    const durablePromise=(async()=>{
      let sourceOk=false,fullOk=false;
      try{ sourceOk=await writeHistorySourceCheckpoint(state); }catch(error){ console.warn("JSON source checkpoint",error); }
      await waitForForegroundIdle(220);
      try{ saveState(); }catch(error){ console.warn("JSON MAIN save",error); }
      try{ fullOk=await commitStateDurably(); }catch(error){ console.warn("JSON durable save",error); }
      if(!sourceOk&&!fullOk) showToast("Trusted Restore สำเร็จ แต่บันทึกถาวรยังไม่สำเร็จ • อย่าเพิ่งปิดแอป");
      else showToast(proof.partial?`✓ Trusted AI ${proof.reused.length} Profile พร้อม • ${proof.invalid.length} Profile กำลังซ่อม`:`✓ JSON + Trusted AI พร้อม • Reuse ${proof.reused.length} Profile`);
    })();
    return {queued:Boolean(proof.partial),durablePromise,draws:validRestoreDrawsSorted().length,profiles:ids.length,cacheCandidates:proof.reused.length,cleanRebuild:false,verifiedReuse:true,partialReuse:Boolean(proof.partial),invalidProfiles:[...proof.invalid]};
  }

  // Cache proof failed: preserve source History, quarantine derived evidence and rebuild only
  // through the canonical clean pipeline. Nothing unverified is admitted into Profile Trend.
  try { localStorage.removeItem(WF_COMPLETION_KEY); localStorage.removeItem(WF_JOB_KEY); } catch (_) {}
  void clearImportedAiCompletionAuthority();
  void Promise.all(state.profiles.map((_, id) => deleteIndexedValue(wfProgressKey(id))));
  state.dailyTables=cleanImportedDailyTablesForAIRebuildFast(state.dailyTables);
  state.records=[];
  state.aiFormulaLab={}; state.aiLearningStatus={}; state.aiGLFormulaLab={}; state.aiGLLearningStatus={};
  state.p19PrimaryCache={}; state.walkForwardBacktests={}; state.walkForwardRebuildJob=createWalkForwardRebuildJob({cleanRebuild:true});
  clearPerformanceCaches(); activeRenderPerfSignature=""; invalidateViewCache();
  writeBootStateSnapshot(state);
  render();
  setJsonRestoreProgress(backgroundJobPercent(state.walkForwardRebuildJob),`ข้อมูลหลักพร้อม • Cache เดิมไม่ผ่าน (${proof.reason}) • กำลัง Clean Rebuild เบื้องหลัง`);
  const durablePromise=(async()=>{
    let sourceOk=false,fullOk=false;
    try{ sourceOk=await writeHistorySourceCheckpoint(state); }catch(error){ console.warn("JSON source checkpoint",error); }
    await waitForForegroundIdle(300);
    try{ saveState(); }catch(error){ console.warn("JSON MAIN save",error); }
    try{ fullOk=await commitStateDurably(); }catch(error){ console.warn("JSON durable save",error); }
    if(!sourceOk&&!fullOk) showToast("Backup เข้าแล้ว แต่บันทึกถาวรยังไม่สำเร็จ • อย่าเพิ่งปิดแอป");
    else showToast("✓ JSON บันทึกถาวรแล้ว • เฉพาะ Cache ที่พิสูจน์ไม่ได้กำลังสร้างใหม่");
  })();
  scheduleImportedHistoryRelink(state.walkForwardRebuildJob.profileIds,220);
  scheduleWalkForwardBackgroundJob(320);
  return {queued:true,durablePromise,draws:state.walkForwardRebuildJob.totalDraws,profiles:state.walkForwardRebuildJob.profileIds.length,cacheCandidates:0,cleanRebuild:true,verifiedReuse:false,reason:proof.reason};
}

async function fullSystemAiRebuild(){
  const button=document.getElementById("btnFullSystemRebuild");
  const status=document.getElementById("fullSystemRebuildStatus");
  const setStatus=(text,kind="")=>{if(status){status.textContent=text;status.className=`safe-refresh-status ${kind}`.trim();}};
  const activeJob=state.walkForwardRebuildJob;
  if(activeJob && activeJob.status!=="done"){
    if(!confirm("มี Rebuild กำลังทำงานอยู่ ต้องการเริ่มใหม่จากศูนย์หรือไม่?")) return;
  } else if(!confirm(`Rebuild ทั้งระบบ AI / WF ใหม่จาก History ปัจจุบันหรือไม่?

ข้อมูลที่จะเก็บไว้:
• History / ผลจริง
• Profiles / ชื่อ
• Settings / Theme

ข้อมูลที่จะสร้างใหม่:
• AI L / AI GL
• AI Confidence
• Walk-Forward
• Ranking derived score
• P18 + P19 Primary (ทุก Profile)

Turbo Primary Pipeline ใช้ Champion งวดก่อนเป็น Warm Start + ลด Evolution Budget + Batch Save + P19 48-row Build แต่ยังคง Strict Prior-only / History เดิมครบ

ระหว่าง Rebuild สามารถใช้หน้าอื่นได้ และงานจะทำต่อแบบเบื้องหลัง`)) return;
  if(button){button.disabled=true;button.textContent="กำลังเตรียม Rebuild…";}
  try{
    setStatus("กำลังล็อก Profile Ranking generation…");
    const rankingLock=beginDeterministicProfileRankingRebuild();
    setStatus("กำลังล้าง AI/WF Cache เก่า…");
    await clearImportedAiCompletionAuthority();
    await Promise.all((state.profiles||[]).map((_,id)=>deleteIndexedValue(wfProgressKey(id))));

    // Keep source History and user settings, but remove every derived AI/WF artifact.
    state.dailyTables=cleanImportedDailyTablesForAIRebuild(state.dailyTables);
    state.aiFormulaLab={};
    state.aiLearningStatus={};
    state.aiGLFormulaLab={};
    state.aiGLLearningStatus={};
    state.p19PrimaryCache={};
    state.walkForwardBacktests={};
    state.walkForwardRebuildJob=null;

    // Re-materialize visible History from the unchanged source actualDraws so no stale
    // winner/status row survives the clean rebuild.
    state.records=[];
    for(const draw of (state.actualDraws||[])){
      try{ syncAutoLHistoryForActual(draw); }catch(error){ console.warn("Full rebuild History sync warning",draw?.date,error); }
    }

    clearPerformanceCaches();
    try{ await globalThis.AIPickPro?.clear?.(); }catch(_){ }
    activeRenderPerfSignature="";
    invalidateViewCache();
    state.walkForwardRebuildJob=createWalkForwardRebuildJob({cleanRebuild:true,fastRebuild:true});
    state.walkForwardRebuildJob.rankingGeneration=rankingLock.generation;
    state.walkForwardRebuildJob.rankingTargetDate=rankingLock.targetDate;
    state.walkForwardRebuildJob.rankingSourceFingerprint=rankingLock.sourceFingerprint;
    state.walkForwardRebuildJob.rankingState="FROZEN";
    saveState();
    const durable=await commitStateDurably();
    if(!durable) throw new Error("บันทึกสถานะ Rebuild ลงพื้นที่ถาวรไม่สำเร็จ");

    render();
    setJsonRestoreProgress(backgroundJobPercent(state.walkForwardRebuildJob),"✓ History พร้อม • เริ่ม Turbo AI/WF + P19 Primary Rebuild");
    const liveStatus=document.getElementById("fullSystemRebuildStatus");
    if(liveStatus){liveStatus.textContent="เริ่ม Rebuild แล้ว • AI L / AI GL / P19 Primary / X3 ทำงานพร้อม Pipeline เดียวกัน";liveStatus.className="safe-refresh-status success";}
    scheduleWalkForwardBackgroundJob(80);
    showToast("⚡ One-Pass Rebuild เริ่มแล้ว • P19/X3 ไม่คำนวณซ้ำ • History ไม่ถูกลบ");
  }catch(error){
    console.error("Full system AI rebuild failed",error);
    if(!state.walkForwardRebuildJob){ try{localStorage.removeItem(PROFILE_RANKING_LOCK_KEY);}catch(_){ } }
    setStatus(`Rebuild ไม่สำเร็จ: ${error?.message||"เกิดข้อผิดพลาด"}`,"error");
    if(button){button.disabled=false;button.textContent="⟳ Rebuild";}
  }
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
    const profileCountAfterAdd = state.profiles.length;
    render();
    if (profileCountAfterAdd > PROFILE_SOFT_GUIDE && profileCountAfterAdd % 5 === 0) {
      showToast(`มี ${profileCountAfterAdd} Profile • ยังเพิ่มได้ แต่ WF/Ranking จะใช้เวลามากขึ้น`);
    }
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
  document.getElementById("btnFullSystemRebuild")?.addEventListener("click", fullSystemAiRebuild);
  document.getElementById("btnSafeRefreshApp")?.addEventListener("click", safeRefreshApp);
  document.getElementById("btnExport")?.addEventListener("click", () => downloadBackup("manual"));
  document.getElementById("importFile")?.addEventListener("change", async e => {
    const input=e.target, file=input.files?.[0];
    if(!file) return;
    try {
      setJsonRestoreProgress(2,"กำลังอ่าน + ตรวจ Backup นอก Main Thread…");
      await nextUiFrame(0);
      const loaded=await parseBackupFileOffMainThread(file);
      setJsonRestoreProgress(8,"✓ JSON ผ่านการตรวจสอบ • กำลังเปิดข้อมูล…");
      const result=await restoreJsonBackupFast(loaded.parsed,{validated:loaded.validated});
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
  document.getElementById("btnResetAll")?.addEventListener("click", async event => {
    if (!confirm("Clearข้อมูลทั้งหมด รวมHistoryทุกProfileหรือไม่?")) return;
    const resetButton = event.currentTarget;
    if (resetButton) { resetButton.disabled = true; resetButton.textContent = "กำลังล้างและบันทึก…"; }
    // V7.09.63: keep every current Profile name (5, 10, 20+), but clear
    // all data inside those Profiles. Do not recreate DEFAULT profile names here.
    state = buildClearedStateKeepingProfiles(state);
    // A full content reset starts a new durable generation. Old delete-journal and
    // resumable WF markers must not replay against the freshly-cleared dataset.
    writeProfileJournal([]);
    try { localStorage.removeItem(WF_JOB_KEY); } catch (_) {}
    try { localStorage.removeItem(WF_COMPLETION_KEY); } catch (_) {}
    // MAIN localStorage + compact source journal are synchronous. Then wait for both
    // IndexedDB authorities before allowing the user to start a new image Import.
    saveState();
    clearTimeout(persistenceWriteTimer);
    persistenceWriteTimer = null;
    const [sourceResetSaved, fullResetSaved] = await Promise.all([
      writeHistorySourceCheckpoint(state),
      commitStateDurably()
    ]);
    if (!sourceResetSaved && !fullResetSaved) {
      alert("ล้างข้อมูลในหน่วยความจำแล้ว แต่บันทึกสถานะ Reset ถาวรไม่สำเร็จ กรุณาปิด/เปิดแอปแล้วลองอีกครั้งก่อน Import");
    }
    render();
    showToast(`✓ ล้างข้อมูลแล้ว • เก็บชื่อ ${state.profiles.length} Profile ไว้ครบ • พร้อม Import`);
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

function closeTransientPopupRoots() {
  const matchRoot=document.getElementById("matchPopupRoot");
  if(matchRoot){ matchRoot.innerHTML=""; matchRoot.classList.remove("active"); }
  document.body.classList.remove("match-popup-open");
}
function showModal(content) {
  closeNumericKeypad();
  closeTransientPopupRoots();
  applyThemeMode();
  const root=document.getElementById("modalRoot");
  if(!root) return;
  root.innerHTML = `<div class="modal show stable-modal" data-modal-theme="${resolvedThemeMode()}"><div class="modal-panel">${content}</div></div>`;
  document.body.classList.add("modal-open");
  root.querySelectorAll('input[data-numeric-keypad="true"], .result-input, .l-search-input').forEach(input => input.readOnly = true);
  root.querySelectorAll("[data-close]").forEach(btn=>btn.addEventListener("click", closeModal));
  root.querySelector(".modal")?.addEventListener("click", e=>{ if(e.target.classList.contains("modal")) closeModal(); });
}
function closeModal() {
  closeNumericKeypad();
  const root=document.getElementById("modalRoot");
  if(root) root.innerHTML="";
  closeTransientPopupRoots();
  document.body.classList.remove("modal-open");
}

document.addEventListener("keydown", e => { if(e.key==="Escape") closeModal(); });

// V7.20.81 — iPhone/PWA Update Guard Pro + Profile-Scoped AI Realtime + AI Trend Boot Lock + Strict Prior AUTO Route Daily Lock.
// Stable version endpoint + immutable build-specific asset URLs prevent mixed-version JS/CSS.
// Checks only on launch/resume (throttled); normal in-app navigation does not re-check or reload.
const PWA_VERSION_URL = "./version.json";
const PWA_SW_URL = "sw-v72086r.js";
let _lastPwaBuildCheckAt = 0;
let _pwaBuildCheckBusy = false;
let _pwaControllerReloadArmed = true;

async function fetchPublishedBuildV72079(){
  const stamp=Date.now();
  try{
    const response=await fetch(`${PWA_VERSION_URL}?t=${stamp}`,{
      cache:"no-store",
      headers:{"Cache-Control":"no-cache, no-store","Pragma":"no-cache"}
    });
    if(response.ok){
      const info=await response.json();
      const build=String(info?.build||"").trim();
      if(build) return build;
    }
  }catch(_){}
  // Compatibility fallback: lets V7.20.77 still detect deployments that forgot version.json.
  try{
    const response=await fetch(`./index.html?__build_check=${stamp}`,{
      cache:"no-store",
      headers:{"Cache-Control":"no-cache, no-store","Pragma":"no-cache"}
    });
    if(!response.ok) return "";
    const html=await response.text();
    return String(html.match(/data-app-build=["']([^"']+)["']/i)?.[1]||"").trim();
  }catch(_){ return ""; }
}

async function forcePublishedBuildV72079(published){
  if(!published || published===APP_BUILD_TAG) return false;
  const reloadKey=`lucky-build-transition-${APP_BUILD_TAG}-to-${published}`;
  if(sessionStorage.getItem(reloadKey)) return false;
  sessionStorage.setItem(reloadKey,"1");
  try{ saveState(); }catch(_){}
  try{ if(typeof commitStateDurably==="function") await commitStateDurably(); }catch(_){}
  try{
    const regs=await navigator.serviceWorker?.getRegistrations?.();
    for(const reg of regs||[]){
      try{ await reg.update(); }catch(_){}
      try{ if(reg.waiting) reg.waiting.postMessage({type:"SKIP_WAITING"}); }catch(_){}
    }
  }catch(_){}
  // Unique navigation URL bypasses iOS document cache while preserving PWA standalone mode.
  const next=new URL(location.href);
  next.searchParams.set("appBuild",published);
  next.searchParams.set("_update",String(Date.now()));
  location.replace(next.toString());
  return true;
}

async function checkForPublishedBuildV72079(force=false){
  if(_pwaBuildCheckBusy || !navigator.onLine) return false;
  const now=Date.now();
  if(!force && now-_lastPwaBuildCheckAt<60000) return false;
  _lastPwaBuildCheckAt=now;
  _pwaBuildCheckBusy=true;
  try{
    const published=await fetchPublishedBuildV72079();
    return await forcePublishedBuildV72079(published);
  }finally{ _pwaBuildCheckBusy=false; }
}

if("serviceWorker" in navigator){
  navigator.serviceWorker.addEventListener("controllerchange",()=>{
    if(!_pwaControllerReloadArmed) return;
    _pwaControllerReloadArmed=false;
    const key=`lucky-sw-controller-${APP_BUILD_TAG}`;
    if(sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key,"1");
    const next=new URL(location.href);
    next.searchParams.set("appBuild",APP_BUILD_TAG);
    next.searchParams.set("_sw",String(Date.now()));
    location.replace(next.toString());
  });

  window.addEventListener("load",()=>{
    const updatePwaShell=async()=>{
      try{
        const reg=await navigator.serviceWorker.register(PWA_SW_URL,{updateViaCache:"none"});
        await reg.update().catch(()=>{});
        if(reg.waiting) try{ reg.waiting.postMessage({type:"SKIP_WAITING"}); }catch(_){}
        await checkForPublishedBuildV72079(true);
      }catch(_){}
    };
    if("requestIdleCallback" in window) requestIdleCallback(updatePwaShell,{timeout:900});
    else setTimeout(updatePwaShell,250);
  },{once:true,passive:true});
}
window.addEventListener("pageshow",()=>{ checkForPublishedBuildV72079(false); },{passive:true});
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible") checkForPublishedBuildV72079(false);
},{passive:true});

async function runDeferredStartupMaintenanceR55() {
  // V7.19.14 Performance Clean:
  // Normal launches do ZERO History-wide normalization/materialization and ZERO formula training.
  // Only reconcile tiny WF authority/checkpoint metadata. A real pending rebuild may resume only
  // after a long foreground-idle window.
  await waitForForegroundIdle(2200);
  try {
    let completionMarker = null;
    try {
      completionMarker = await readAuthoritativeWfCompletionMarker();
      if (completionMarker) forceCompletedWfStartupState(completionMarker);
    } catch (_) {}

    const job = state.walkForwardRebuildJob;
    const realPendingJob = Boolean(job && job.status !== "done" && Array.isArray(job.wfProfileIds) && job.wfProfileIds.length);
    if (realPendingJob) {
      setTimeout(async () => {
        await waitForForegroundIdle(2400);
        if (!userInteractionHot(1800) && document.visibilityState !== "hidden") scheduleWalkForwardBackgroundJob(0);
      }, 2500);
    }
  } catch (error) {
    console.warn("Performance-clean startup metadata check skipped", error);
  }
}

async function hydrateApplicationAfterFirstPaint(){
  try{
    // Parse the authoritative localStorage payload only after a usable frame exists.
    state = applyBootStatePatch(loadState(), initialBootStatePatch);
    if (!Array.isArray(state.records)) state.records = [];
    if (!Array.isArray(state.actualDraws)) state.actualDraws = [];
    if (!Array.isArray(state.dailyTables)) state.dailyTables = [];

    // Paint the real persisted state immediately; IndexedDB is recovery, not a boot gate.
    if (state.currentView === "analysis") { state.analysisSortMode = "ai"; state.profileOrderMode = "ai"; }
    if (state.currentView === "history") state.historyFormulaMode = "compare";
    if (state.currentView === "home") {
      calculatorFirstPaintDeferred = true;
      loadLatestProfileResultIntoCalculator(state.activeProfile);
    }
    activeRenderPerfSignature="";
    clearPerformanceCaches();
    applyThemeMode(true);
    render();

    // Deep durable recovery starts after the real state is visible and never blocks first paint.
    await waitForForegroundIdle(650);
    await bootstrapPersistentState();
    state = applyBootStatePatch(state, initialBootStatePatch);
    if(document.visibilityState!=="hidden"){
      activeRenderPerfSignature="";
      clearPerformanceCaches();
      refreshCurrentView();
    }

    const activeId=Number(state.activeProfile)||0;
    if(state.currentView==="weekly"){
      // V7.20.86r: same-day AI Decision + Trend are durable snapshots. Restore them before
      // any selected-profile status reconciliation; ordinary navigation never reranks the day.
      try{ await hydrateAISelectTop3Durable(aiSelectLocalDateKey(new Date())); }catch(_){}
      try{ await hydrateAIProfileTrendDurable(isoDate()); }catch(_){}
      try{ await hydrateAISelectLockedProfilesForBoot(); }catch(_){}
      try{ await hydrateUnifiedAIProfileForLaunch(activeId,120); }catch(_){}
      if(state.currentView==="weekly" && Number(state.activeProfile)===activeId && document.visibilityState!=="hidden"){
        await hydrateUnifiedAIProfile(activeId,{allowIndexed:true,scheduleMissing:true});
        refreshCurrentView();
      }
    } else if(state.currentView==="home"){
      // Calculate may restore already-persisted caches, but it never starts P18/P19/X3 rebuilds.
      try{ await hydrateUnifiedAIProfile(activeId,{allowIndexed:true,scheduleMissing:false}); }catch(_){}
      if(state.currentView==="home" && Number(state.activeProfile)===activeId){
        calculatorFirstPaintDeferred=false;
        const decision=getConfiguredFormulaMode(activeId)==="auto"?getAutoFormulaDecision(activeId):null;
        syncCalculatorTableViewToActiveFormula(activeId,true,decision);
        refreshCurrentView();
      }
    }

    // Classic visible-History rescue is maintenance, never part of launch latency.
    if (state.records.length === 0 && state.actualDraws.length > 0 && state.dailyTables.length > 0) {
      setTimeout(async()=>{
        await waitForForegroundIdle(1800);
        if(document.visibilityState==="hidden" || userInteractionHot(900)) return;
        for (let i=0;i<state.actualDraws.length;i++) {
          try { syncAutoLHistoryForActual(state.actualDraws[i]); } catch (_) {}
          if(i>0 && i%24===0) await new Promise(r=>setTimeout(r,0));
        }
        try { saveState(); } catch (_) {}
        void commitStateDurably();
        if(state.currentView==="history" && !userInteractionHot(700)) refreshCurrentView();
      },2200);
    }
  }catch(error){
    console.warn("Post-paint hydration warning",error);
  }
}

async function hydrateAIWeeklyBeforeFirstRender(){
  // V7.20.86r — AI COLD BOOT GATE. If the app was killed while the AI page was
  // visible, restore the authoritative state and same-day durable AI snapshots before
  // the first weekly render. This prevents a second ranking/loading pass on cold boot.
  state = applyBootStatePatch(loadState(), initialBootStatePatch);
  if (!Array.isArray(state.records)) state.records = [];
  if (!Array.isArray(state.actualDraws)) state.actualDraws = [];
  if (!Array.isArray(state.dailyTables)) state.dailyTables = [];
  state.currentView = "weekly";
  applyThemeMode(true);

  // A healthy MAIN state returns immediately; only damaged/partial state waits for IDB recovery.
  try{ await bootstrapPersistentState(); }catch(_){ }
  state = applyBootStatePatch(state, initialBootStatePatch);
  state.currentView = "weekly";

  const todayKey=aiSelectLocalDateKey(new Date());
  await Promise.allSettled([
    hydrateAISelectTop3Durable(todayKey),
    hydrateAIProfileTrendDurable(todayKey)
  ]);
  // Reconcile only locked Top-3 live badges. No daily selection or Trend rerank occurs here.
  try{ await hydrateAISelectLockedProfilesForBoot(); }catch(_){ }

  activeRenderPerfSignature="";
  clearPerformanceCaches();
  render();

  // Heavy active-profile engine recovery remains background-only after the stable first paint.
  const activeId=Number(state.activeProfile)||0;
  requestAnimationFrame(()=>setTimeout(async()=>{
    try{
      await waitForForegroundIdle(650);
      if(state.currentView!=="weekly"||document.visibilityState==="hidden") return;
      await hydrateUnifiedAIProfile(activeId,{allowIndexed:true,scheduleMissing:true});
      if(state.currentView==="weekly"&&Number(state.activeProfile)===activeId&&!userInteractionHot(650)) refreshWeeklyBackgroundPanels();
    }catch(_){ }
  },0));
}

async function hydrateHistoryBeforeFirstRenderV72086M(){
  // V7.20.86r — HISTORY FULL-STATE RESTORE.
  // Professional cold-boot rule: History must never render from the compact recovery journal
  // when a healthy MAIN state exists. The compact journal intentionally omits dailyTables,
  // WF/model primary caches and derived records; using it for first paint makes P18/P19/X3
  // appear as “—” after an iOS swipe/kill even though their durable generations still exist.
  // Parse MAIN once before History first paint. loadState() already merges a newer compact
  // source journal only when it is genuinely newer/authoritative, so durability is preserved.
  try {
    state=applyBootStatePatch(loadState(),initialBootStatePatch);
  } catch(error){
    console.warn('History full-state cold-boot restore skipped',error);
    // Last-resort source rescue only. This branch is for damaged/missing MAIN, never the normal path.
    try {
      const checkpoint=readHistorySourceSyncCheckpoint();
      if(checkpoint && typeof checkpoint==='object' && stateHasHistoryPayload(checkpoint)){
        const base=typeof structuredClone==='function'?structuredClone(DEFAULT_STATE):JSON.parse(JSON.stringify(DEFAULT_STATE));
        state=applyBootStatePatch(finalizeLoadedState(mergeRecoveredHistory(base,checkpoint,'localStorage:history-cold-boot-rescue-v72086r')),initialBootStatePatch);
      }
    } catch(_) {}
  }
  if(!Array.isArray(state.records)) state.records=[];
  if(!Array.isArray(state.actualDraws)) state.actualDraws=[];
  if(!Array.isArray(state.dailyTables)) state.dailyTables=[];
  state.currentView='history';
  state.historyFormulaMode='compare';
  applyThemeMode(true);

  // Restore only durable/synchronous adapters before first paint. No expensive model rebuild
  // is allowed on the History foreground path.
  const activeId=Number(state.activeProfile)||0;
  try { restoreUnifiedAIProfileSync(activeId); } catch(_) {}
  activeRenderPerfSignature='';
  // Do not clear restored model caches here. renderHistory() is cache-first by design.
  invalidateViewCache();
  render();

  // X3 may have an IndexedDB durable mirror. Hydrate it after the stable first paint and
  // refresh once only if it adds data. Missing generations remain background/AI-page work.
  requestAnimationFrame(()=>setTimeout(async()=>{
    try{
      if(state.currentView!=='history'||Number(state.activeProfile)!==activeId||document.visibilityState==='hidden') return;
      const before=Boolean(PERF_CACHE.x3Bundle.get(x3BundleCacheKey(activeId)));
      await hydrateUnifiedAIProfile(activeId,{allowIndexed:true,scheduleMissing:false});
      const after=Boolean(PERF_CACHE.x3Bundle.get(x3BundleCacheKey(activeId)));
      if(!before&&after&&state.currentView==='history'&&Number(state.activeProfile)===activeId&&!userInteractionHot(500)) refreshCurrentView();
    }catch(_){}
  },0));
}

async function startApplication() {
  // V7.20.86r — AI and History get truthful cold-boot gates; other pages keep instant first paint.
  applyThemeMode(true);
  bindGlobalKeypad();

  if (!Array.isArray(state.records)) state.records = [];
  if (!Array.isArray(state.actualDraws)) state.actualDraws = [];
  if (!Array.isArray(state.dailyTables)) state.dailyTables = [];
  if (state.currentView === "analysis") { state.analysisSortMode = "ai"; state.profileOrderMode = "ai"; }
  if (state.currentView === "history") state.historyFormulaMode = "compare";

  if(state.currentView==="history"){
    // Do not expose the boot mirror's intentionally-empty actualDraws after an iOS swipe/kill.
    // The compact source journal restores Profile identity + actual results before first paint.
    await hydrateHistoryBeforeFirstRenderV72086M();
    requestAnimationFrame(()=>setTimeout(()=>{ void hydrateApplicationAfterFirstPaint(); },0));
  }else if(state.currentView==="weekly"){
    // If both fast mirrors are already present, they render synchronously; otherwise
    // the gate restores their IndexedDB copies before exposing the weekly page.
    const todayKey=aiSelectLocalDateKey(new Date());
    const fastDecision=validAISelectTop3Cache(readAISelectTop3Cache(),todayKey);
    const fastTrend=hydrateAIProfileTrendDaily(todayKey);
    if(fastDecision&&fastTrend){
      render();
      requestAnimationFrame(()=>setTimeout(()=>{ void hydrateApplicationAfterFirstPaint(); },0));
    }else{
      await hydrateAIWeeklyBeforeFirstRender();
    }
  }else{
    // First usable frame contains only the tiny boot mirror/default state.
    render();
    requestAnimationFrame(()=>setTimeout(()=>{ void hydrateApplicationAfterFirstPaint(); },0));
  }

  setTimeout(()=>{ APP_COLD_LAUNCH=false; },4200);
  setTimeout(() => { void runDeferredStartupMaintenanceR55(); },6500);
}

window.addEventListener("pageshow", () => {
  // iOS can restore an old visual snapshot before JS resumes. Ensure the visible body and
  // the active bottom-nav always represent the same view after BFCache/PWA resume.
  requestAnimationFrame(()=>{
    const main=document.querySelector('main.main');
    if(main && main.dataset.renderedView && main.dataset.renderedView!==state.currentView) render();
  });
});

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
