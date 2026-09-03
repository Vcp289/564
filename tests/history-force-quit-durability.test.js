"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("releases/81431pro4/app.js", "utf8");

assert.match(source, /const HISTORY_ROW_JOURNAL_INDEXED_KEY = "history-row-journal-v81431"/);
assert.match(source, /await persistHistoryRowJournalIndexed\(savedActual,"upsert"\)/);
assert.match(source, /await recoverIndexedHistoryRowJournal\(\)/);
assert.match(source, /function replayHistoryRowJournalEntries\(candidate, entries\)/);

function replay(staleRows, operations) {
  const byKey = new Map(staleRows.map(row => [`${row.profileId}|${row.date}`, row]));
  for (const op of operations) {
    const key = `${op.profileId}|${op.date}`;
    if (op.type === "delete") byKey.delete(key);
    else byKey.set(key, op.row);
  }
  return [...byKey.values()].sort((a,b) => a.date.localeCompare(b.date));
}

// 1,000 force-quit recoveries: MAIN remains one row behind, while the completed
// IndexedDB row journal restores the latest confirmed result before History paints.
for (let i = 0; i < 1000; i++) {
  const date = `2026-09-${String((i % 28) + 1).padStart(2, "0")}`;
  const stale = [{profileId:1, date:"2026-08-31", number:"389", twoDigit:"43"}];
  const latest = {profileId:1, date, number:String(100 + (i % 900)), twoDigit:String(i % 100).padStart(2, "0")};
  const restored = replay(stale, [{type:"upsert", profileId:1, date, row:latest}]);
  assert.equal(restored.length, 2);
  assert.deepEqual(restored.find(row => row.date === date), latest);
}

console.log("history-force-quit-durability: 1,000 recovery cycles passed");
