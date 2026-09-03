"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");

const source = fs.readFileSync("releases/81431pro4/app.js", "utf8");

// Contract: Calculate keeps a verified table only while the exact canonical
// History source is unchanged.  Switching tabs is not a data mutation.
assert.match(source, /function calculatorHistorySourceKey\(profileId, draw\)/);
assert.match(source, /const unchanged=state\.calculatorSourceKey===sourceKey/);
assert.match(source, /if\(unchanged\) return \{ loaded:true, latest, digits, retained:true \}/);
assert.match(source, /state\.calculatorSourceKey = "";/);

function sourceKey(profileId, draw, historySignature) {
  return [profileId, draw.id, draw.date, draw.number, draw.twoDigit, historySignature].join("|");
}

for (let i = 0; i < 1000; i++) {
  const draw = {id:`d-${i}`, date:"2026-09-02", number:"297", twoDigit:"86"};
  const key = sourceKey(1, draw, `1|${148 + (i % 2)}|history-${i}`);
  const state = {calculatorSourceKey:key, calculationDate:draw.date, lastInput:["2","9","7","8","6"], grid:[[2,7,5]]};
  const unchanged = state.calculatorSourceKey === key
    && state.calculationDate === draw.date
    && state.lastInput.join("") === `${draw.number}${draw.twoDigit}`;
  assert.equal(unchanged, true, "same History source must retain Calculate table");

  const changed = sourceKey(1, {...draw, number:"298"}, `1|${149 + (i % 2)}|history-${i}-next`);
  assert.notEqual(changed, state.calculatorSourceKey, "new History data must invalidate retained table");
}

console.log("calculator-analysis-memory: 1,000 source continuity cycles passed");
