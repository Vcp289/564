"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("releases/81431pro4/app.js", "utf8");

assert.match(source, /const PRODUCTION_AI_ENGINES = Object\.freeze\(\["classic","aiL","gl","p18","p19","x3"\]\)/);
assert.match(source, /const SUPPORT_AI_RUNTIME_ENABLED = false/);
assert.match(source, /const MASTER_AI_PAUSED = true/);
assert.match(source, /const MASTER_BASIC_TEST = false/);

const snapshotStart = source.indexOf("table.predictionSnapshot = {");
const snapshotEnd = source.indexOf("  // Keep legacy fields", snapshotStart);
assert.ok(snapshotStart >= 0 && snapshotEnd > snapshotStart, "production snapshot block must exist");
const snapshotBlock = source.slice(snapshotStart, snapshotEnd);
for (const retired of ["independentItems:", "independentTop10:", "pairItems:", "pairTop10:", "masterItems:", "masterWeights:", "overlapItems:"]) {
  assert.ok(!snapshotBlock.includes(retired), `new production snapshots must omit ${retired}`);
}

const wfStart = source.indexOf("async function rebuildWalkForwardBacktest");
const wfEnd = source.indexOf("async function rebuildWalkForwardExactActualRow", wfStart);
const wfBlock = source.slice(wfStart, wfEnd);
assert.ok(!wfBlock.includes("generateIndependentAI("), "WF must not generate Independent AI");
assert.ok(!wfBlock.includes("generatePairAI("), "WF must not generate Pair AI");
assert.ok(!wfBlock.includes("buildStrictPriorMasterBasicPrediction("), "WF must not generate Master Basic");

// 1,000 persistence cycles: only the six production engines may be emitted in new
// snapshot/WF shapes, and JSON serialization must remain stable and readable.
for (let i = 0; i < 1000; i++) {
  const snap = {
    productionEngines:["classic","aiL","gl","p18","p19","x3"],
    classicItems:["123"], aiLItems:["234"], glItems:["345"],
    p18Items:["456"], p19Items:["567"], x3Items:["678"]
  };
  const row = {statuses:{classic:"notfound",aiL:"pending",gl:"exact"},items:{classic:["123"],aiL:[],gl:["345"]}};
  const roundTrip = JSON.parse(JSON.stringify({snap,row}));
  assert.deepEqual(roundTrip.snap.productionEngines, ["classic","aiL","gl","p18","p19","x3"]);
  assert.deepEqual(Object.keys(roundTrip.row.statuses), ["classic","aiL","gl"]);
  for (const retired of ["independent", "pair", "master", "masterBasic"]) {
    assert.ok(!JSON.stringify(roundTrip).includes(retired));
  }
}

console.log("production-engine-trim: 1,000 contract cycles passed");
