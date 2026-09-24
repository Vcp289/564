/* Repair only pending AI L / AI GL History rows after paint, while the UI is idle. */
(() => {
  "use strict";

  const attempts = new Map();
  const MAX_ATTEMPTS = 3;
  let scheduleTimer = 0;
  let running = false;
  let runToken = 0;

  const READY = new Set(["exact", "reversed", "swap", "notfound", "miss"]);
  const ready = value => READY.has(String(value || "pending").toLowerCase());

  // The History renderer prefers an atomic row as a whole. An older atomic row
  // can have valid pattern statuses while its AI columns are still pending.
  // Merge only the committed AI columns so reopening the app reads the same
  // result that the review displayed. Verify draw identity before merging.
  if (typeof getAtomicHistoryStatuses === "function") {
    const readAtomic = getAtomicHistoryStatuses;
    getAtomicHistoryStatuses = function (draw, profileId) {
      const atomic = readAtomic(draw, profileId);
      if (!atomic || !draw) return atomic;
      let committed;
      try {
        const date = String(draw.date || "").slice(0, 10);
        const row = window.LNCanonicalHistory?.load?.()
          ?.profiles?.[String(Number(profileId))]?.rows?.[date];
        if (!row || String(row.drawId || "") !== String(draw.id || "")) return atomic;
        committed = row.engines;
      } catch (_) { return atomic; }
      if (!committed || !["aiL", "gl"].some(key =>
        !ready(atomic.statuses?.[key]) && ready(committed[key]))) return atomic;
      return {
        ...atomic,
        statuses: {
          ...atomic.statuses,
          aiL: ready(atomic.statuses?.aiL) ? atomic.statuses.aiL
            : ready(committed.aiL) ? committed.aiL : "pending",
          gl: ready(atomic.statuses?.gl) ? atomic.statuses.gl
            : ready(committed.gl) ? committed.gl : "pending"
        }
      };
    };
  }

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function waitForIdle() {
    return new Promise(resolve => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => resolve(), { timeout: 1800 });
      } else {
        setTimeout(resolve, 500);
      }
    });
  }

  function historyIsQuiet(profileId) {
    return document.visibilityState !== "hidden"
      && typeof state !== "undefined"
      && state.currentView === "history"
      && Number(state.activeProfile) === Number(profileId)
      && !(typeof userInteractionHot === "function" && userInteractionHot(900));
  }

  function pendingVisibleRows(profileId) {
    const rows = [];
    document.querySelectorAll("[data-history-edit-shell]").forEach(shell => {
      const id = String(shell.getAttribute("data-history-edit-shell") || "");
      const draw = (state.actualDraws || []).find(item => String(item?.id || "") === id);
      if (!draw || Number(draw.profileId ?? 0) !== Number(profileId)) return;
      const shownPending = !!shell.querySelector(".status.model-ail.pending, .status.model-gl.pending");
      const committed = window.LNCanonicalHistory?.peekRow?.(profileId, draw);
      if (!shownPending && ready(committed?.aiL) && ready(committed?.gl)) return;
      // A review may have painted a result without committing it. Capture that
      // row as well so the same result survives the next launch.
      const reviewed = draw.historyAtomicStatuses?.statuses
        || (typeof getWalkForwardRecord === "function" && getWalkForwardRecord(profileId, draw)?.statuses);
      if (shownPending || ["aiL", "gl"].some(key =>
        ready(reviewed?.[key]) && !ready(committed?.[key]))) rows.push(draw);
    });
    return rows;
  }

  function formulaRevision(profileId) {
    const saved = state?.aiGLFormulaLab?.[profileId] || null;
    if (!saved) return "none";
    let signature = "";
    try {
      signature = typeof compactFormulaSignature === "function"
        ? compactFormulaSignature(saved.formula)
        : JSON.stringify(saved.formula || []);
    } catch (_) {}
    return `${String(saved.version || "")}|${Number(saved.updatedAt || saved.createdAt || 0)}|${signature}`;
  }

  function commitRepairedRow(profileId, draw, statuses) {
    if (!ready(statuses?.aiL) && !ready(statuses?.gl)) return false;
    const canonical = window.LNCanonicalHistory;
    if (!canonical?.commitRow || !canonical?.load) return false;
    canonical.commitRow(profileId, draw, statuses, "ai-review-persisted");
    const saved = canonical.load()?.profiles?.[String(Number(profileId))]
      ?.rows?.[String(draw.date || "").slice(0, 10)];
    if (String(saved?.drawId || "") !== String(draw.id || "")) return false;
    return ["aiL", "gl"].every(key => !ready(statuses[key]) || ready(saved.engines?.[key]));
  }

  async function repairPendingAiRows(profileId, token) {
    if (running || !historyIsQuiet(profileId)) return;
    running = true;
    let changed = false;
    let needsRetry = false;
    try {
      const rows = pendingVisibleRows(profileId);
      for (const draw of rows) {
        if (token !== runToken || !historyIsQuiet(profileId)) break;
        const attemptKey = `${profileId}|${String(draw.id || "")}|${String(draw.date || "")}|${formulaRevision(profileId)}`;
        const attemptCount = Number(attempts.get(attemptKey) || 0);
        if (attemptCount >= MAX_ATTEMPTS) continue;

        await waitForIdle();
        if (token !== runToken || !historyIsQuiet(profileId)) break;
        attempts.set(attemptKey, attemptCount + 1);

        try {
          const existing = draw.historyAtomicStatuses?.statuses
            || (typeof getWalkForwardRecord === "function" && getWalkForwardRecord(profileId, draw)?.statuses);
          const rec = ready(existing?.aiL) && ready(existing?.gl)
            ? { statuses: existing }
            : await rebuildWalkForwardExactActualRow(profileId, String(draw.id || ""), {
              durable: false,
              skipCacheClear: true
            });
          const aiLReady = rec && String(rec.statuses?.aiL || "pending") !== "pending";
          const glReady = rec && String(rec.statuses?.gl || "pending") !== "pending";
          if ((aiLReady || glReady) && commitRepairedRow(profileId, draw, rec.statuses)) {
            buildAtomicHistoryStatusesForExactRow(profileId, draw, rec);
            patchHistoryRowStatusesInstant(profileId, String(draw.id || ""), { atomicOnly: false });
            changed = true;
          } else if (aiLReady || glReady) {
            console.warn("History AI result was calculated but not persisted", draw?.date);
            if (attemptCount + 1 < MAX_ATTEMPTS) needsRetry = true;
          }
          if (aiLReady && glReady) attempts.delete(attemptKey);
          else if (attemptCount + 1 < MAX_ATTEMPTS) needsRetry = true;
        } catch (error) {
          console.warn("Idle History AI row repair skipped", draw?.date, error);
          if (attemptCount + 1 < MAX_ATTEMPTS) needsRetry = true;
        }
        await sleep(120);
      }

      if (changed && token === runToken) {
        saveState();
        await commitStateDurably();
      }
    } finally {
      running = false;
      if (needsRetry && token === runToken && historyIsQuiet(profileId)) {
        clearTimeout(scheduleTimer);
        scheduleTimer = setTimeout(scheduleRepair, 1600);
      }
    }
  }

  function scheduleRepair() {
    clearTimeout(scheduleTimer);
    const token = ++runToken;
    scheduleTimer = setTimeout(() => {
      if (typeof state === "undefined" || state.currentView !== "history") return;
      const profileId = Number(state.activeProfile) || 0;
      waitForIdle().then(() => repairPendingAiRows(profileId, token));
    }, 2200);
  }

  const app = document.getElementById("app");
  if (app && "MutationObserver" in window) {
    new MutationObserver(() => {
      if (running) return;
      if (document.querySelector(".result-history-table")) scheduleRepair();
      else runToken++;
    }).observe(app, { childList: true, subtree: true });
  }

  window.addEventListener("pageshow", scheduleRepair, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") scheduleRepair();
    else runToken++;
  }, { passive: true });

  if (document.querySelector(".result-history-table")) scheduleRepair();
})();
