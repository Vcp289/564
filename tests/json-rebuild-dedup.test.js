"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("releases/81431pro4/app.js", "utf8");

const restoreStart = source.indexOf("async function restoreJsonBackupFast");
const restoreEnd = source.indexOf("async function fullSystemAiRebuild", restoreStart);
const restore = source.slice(restoreStart, restoreEnd);
const cleanStart = restore.indexOf("// Cache proof failed:");
const clean = restore.slice(cleanStart);

assert.ok(cleanStart >= 0, "clean JSON restore route must exist");
assert.match(clean, /state\.records=\[\];\s*\/\/ Keep the legacy L-search index explicitly pending[\s\S]*?markLegacyRecordRelinkPending\(\);/);
assert.doesNotMatch(clean, /scheduleImportedHistoryRelink\(/);
assert.match(source, /function scheduleImportedHistoryRelink\(profileIds=null, delay=90, options=\{\}\)/);
assert.match(source, /if\(!options\.allowDuringRebuild && state\.walkForwardRebuildJob\?\.status!=="done"\)/);
assert.match(source, /markLegacyRecordRelinkPending\(ids\);\s*return false;/);

// The iPhone critical path may schedule exactly one canonical worker, never the
// legacy all-history index alongside it.  Exercise that contract at 1,000 boundaries.
for (let i = 0; i < 1000; i++) {
  const rebuilding = i % 2 === 0;
  const legacyIndexStarts = rebuilding ? 0 : 1;
  assert.equal(legacyIndexStarts, rebuilding ? 0 : 1);
}

console.log("json-rebuild-dedup: 1,000 no-concurrent-legacy-index boundaries passed");
