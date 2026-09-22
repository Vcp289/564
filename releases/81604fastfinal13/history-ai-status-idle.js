/* Repair only pending AI L / AI GL History rows after paint, while the UI is idle. */
(() => {
  "use strict";

  const attempted = new Set();
  let scheduleTimer = 0;
  let running = false;
  let runToken = 0;

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
      if (!shell.querySelector(".status.model-ail.pending, .status.model-gl.pending")) return;
      const id = String(shell.getAttribute("data-history-edit-shell") || "");
      const draw = (state.actualDraws || []).find(item => String(item?.id || "") === id);
      if (draw && Number(draw.profileId ?? 0) === Number(profileId)) rows.push(draw);
    });
    return rows;
  }

  async function repairPendingAiRows(profileId, token) {
    if (running || !historyIsQuiet(profileId)) return;
    running = true;
    let changed = false;
    try {
      const rows = pendingVisibleRows(profileId);
      for (const draw of rows) {
        if (token !== runToken || !historyIsQuiet(profileId)) break;
        const attemptKey = `${profileId}|${String(draw.id || "")}|${String(draw.date || "")}`;
        if (attempted.has(attemptKey)) continue;

        await waitForIdle();
        if (token !== runToken || !historyIsQuiet(profileId)) break;
        attempted.add(attemptKey);

        try {
          const rec = await rebuildWalkForwardExactActualRow(profileId, String(draw.id || ""), {
            durable: false,
            skipCacheClear: true
          });
          const aiReady = rec
            && String(rec.statuses?.aiL || "pending") !== "pending"
            && String(rec.statuses?.gl || "pending") !== "pending";
          if (aiReady) {
            buildAtomicHistoryStatusesForExactRow(profileId, draw, rec);
            patchHistoryRowStatusesInstant(profileId, String(draw.id || ""), { atomicOnly: false });
            changed = true;
          }
        } catch (error) {
          console.warn("Idle History AI row repair skipped", draw?.date, error);
        }
        await sleep(120);
      }

      if (changed && token === runToken) {
        saveState();
        await commitStateDurably();
        clearPerformanceCaches();
        activeRenderPerfSignature = "";
        invalidateViewCache();
      }
    } finally {
      running = false;
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
