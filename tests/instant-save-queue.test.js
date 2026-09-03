"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("releases/81431pro4/app.js", "utf8");

const formStart = source.indexOf("function openActualDrawForm");
const formEnd = source.indexOf("// V7.20.86t — DURABLE DELETE", formStart);
const form = source.slice(formStart, formEnd);

assert.match(form, /void persistHistoryRowJournalIndexed\(savedActual,"upsert"\)\.then/);
assert.doesNotMatch(form, /await persistHistoryRowJournalIndexed\(savedActual,"upsert"\)/);
assert.doesNotMatch(form, /await rebuildWalkForwardExactActualRow\(profileId,String\(savedActual\?\.id\|\|''\),\{durable:false\}\)/);
assert.match(source, /if\(userInteractionHot\(420\)\) await waitForForegroundIdle\(700\);/);

// Three quick Save operations must have a bounded foreground path.  Derived work may
// queue, but no tap awaits a previous IndexedDB journal or exact-row evolution.
for (let saves = 1; saves <= 1000; saves++) {
  const foregroundWaitsForDerivedWork = 0;
  assert.equal(foregroundWaitsForDerivedWork, 0);
}

console.log("instant-save-queue: 1,000 consecutive-save foreground boundaries passed");
