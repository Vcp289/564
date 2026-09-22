/* Keep every History source row addressable by one stable, unique ID. */
(() => {
  "use strict";

  let sequence = 0;

  function createUniqueId(used) {
    let id = "";
    do {
      const random = globalThis.crypto?.randomUUID?.()
        || Math.random().toString(36).slice(2, 10);
      id = `history-${Date.now()}-${sequence++}-${random}`;
    } while (used.has(id));
    return id;
  }

  function sameProfileAndDate(item, repair, dateFields) {
    if (Number(item?.profileId ?? 0) !== repair.profileId) return false;
    return dateFields.some(field => String(item?.[field] || "").slice(0, 10) === repair.date);
  }

  function repairHistoryRowIdentities(candidate) {
    if (!candidate || !Array.isArray(candidate.actualDraws)) return [];

    const used = new Set();
    const repairs = [];

    candidate.actualDraws.forEach(row => {
      if (!row || typeof row !== "object") return;
      const oldId = String(row.id || "");
      if (oldId && !used.has(oldId)) {
        used.add(oldId);
        return;
      }

      const newId = createUniqueId(used);
      used.add(newId);
      row.id = newId;
      row.identityRepairedAt = Date.now();
      row.identityRepairReason = oldId ? "duplicate-history-id" : "missing-history-id";
      repairs.push({
        oldId,
        newId,
        profileId: Number(row.profileId ?? 0),
        date: String(row.date || "").slice(0, 10)
      });
    });

    if (!repairs.length) return repairs;

    // Relink only derived data whose profile and date identify the repaired
    // source row. The first row keeps the old ID, so unrelated rows are safe.
    (candidate.dailyTables || []).forEach(table => {
      const repair = repairs.find(item => item.oldId
        && String(table?.sourceActualDrawId || "") === item.oldId
        && sameProfileAndDate(table, item, ["date"]));
      if (repair) {
        table.sourceActualDrawId = repair.newId;
        table.identityRepairedAt = Date.now();
      }
    });

    (candidate.records || []).forEach(record => {
      const repair = repairs.find(item => item.oldId
        && String(record?.actualDrawId || "") === item.oldId
        && sameProfileAndDate(record, item, ["actualDate", "date"]));
      if (repair) {
        record.actualDrawId = repair.newId;
        record.identityRepairedAt = Date.now();
      }
    });

    candidate._historyIdentitySchema = 1;
    candidate._historyIdentityRepairedAt = Date.now();
    return repairs;
  }

  const originalCanonicalize = canonicalizeHistorySourceState;
  canonicalizeHistorySourceState = function canonicalizeWithUniqueIds(candidate, options) {
    repairHistoryRowIdentities(candidate);
    return originalCanonicalize(candidate, options);
  };

  const originalUpsert = upsertHistorySourceRow;
  upsertHistorySourceRow = function upsertWithUniqueIdGuard(payload, options) {
    const result = originalUpsert(payload, options);
    repairHistoryRowIdentities(state);
    return result;
  };

  function repairCurrentState() {
    const repairs = repairHistoryRowIdentities(state);
    if (!repairs.length) return;

    originalCanonicalize(state);
    try { clearPerformanceCaches(); } catch (_) {}
    try { activeRenderPerfSignature = ""; } catch (_) {}
    try { invalidateViewCache(); } catch (_) {}
    try { saveState(); } catch (_) {}
    try { writeHistorySourceSyncCheckpointFast(state); } catch (_) {}

    requestAnimationFrame(() => {
      try {
        if (state.currentView === "history") refreshCurrentView();
      } catch (_) {}
    });
  }

  globalThis.__historyRowIdentityRepair = {
    version: 1,
    repair: repairCurrentState
  };

  queueMicrotask(repairCurrentState);
})();
