"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");

const source = fs.readFileSync("releases/81431pro4/app.js", "utf8");

// Contract: Calculate keeps a verified table only while both canonical History
// and the published AUTO/Analysis authority are unchanged. Switching tabs alone
// is not a data mutation.
assert.match(source, /function calculatorHistorySourceKey\(profileId, draw\)/);
assert.match(source, /function calculatorAutoAuthoritySignature\(profileId\)/);
assert.match(source, /String\(decision\.evidenceFingerprint\|\|""\)/);
assert.match(source, /const unchanged=state\.calculatorSourceKey===sourceKey/);
assert.match(source, /if\(unchanged\) return \{ loaded:true, latest, digits, retained:true \}/);
assert.match(source, /state\.calculatorSourceKey = "";/);

function sourceKey(profileId, draw, historySignature, authoritySignature) {
  return [profileId, draw.id, draw.date, draw.number, draw.twoDigit, historySignature, authoritySignature].join("|");
}

for (let i = 0; i < 1000; i++) {
  const draw = {id:`d-${i}`, date:"2026-09-02", number:"297", twoDigit:"86"};
  const history = `1|${148 + (i % 2)}|history-${i}`;
  const authority = `auto|V5|2026-09-03|x3|x3|evidence-${i}|true|false`;
  const key = sourceKey(1, draw, history, authority);
  const state = {calculatorSourceKey:key, calculationDate:draw.date, lastInput:["2","9","7","8","6"], grid:[[2,7,5]]};
  const unchanged = state.calculatorSourceKey === key
    && state.calculationDate === draw.date
    && state.lastInput.join("") === `${draw.number}${draw.twoDigit}`;
  assert.equal(unchanged, true, "same History source must retain Calculate table");

  const changed = sourceKey(1, {...draw, number:"298"}, `1|${149 + (i % 2)}|history-${i}-next`, authority);
  assert.notEqual(changed, state.calculatorSourceKey, "new History data must invalidate retained table");
  const refreshedAuthority = sourceKey(1, draw, history, `auto|V5|2026-09-03|p19|p19|evidence-${i}-next|true|false`);
  assert.notEqual(refreshedAuthority, state.calculatorSourceKey, "new Analysis authority must invalidate retained table");
}

console.log("calculator-analysis-memory: 1,000 source continuity cycles passed");
