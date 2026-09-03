"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("releases/81431pro4/app.js", "utf8");
const start = source.indexOf("function getProfileAnalysisScore(profileId) {");
const end = source.indexOf("function getRankingHistoryAuthoritySnapshot", start);
const implementation = source.slice(start, end);
const executableImplementation = implementation.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");

assert.ok(start >= 0 && end > start, "Stat Score implementation must exist");
assert.match(implementation, /getTrustedProfileConfidenceRows\(profileId\)/, "Stat Score must use canonical trusted rows");
assert.doesNotMatch(executableImplementation, /state\.records/, "Stat Score must not depend on retired records storage");
assert.match(implementation, /status==="exact"/, "exact outcomes must score");
assert.match(implementation, /status==="reversed"\|\|status==="swap"/, "reverse outcomes must score");

function score(rows, limit, exactPoints = 1, reversedPoints = 0.5) {
  const sample = limit ? rows.slice(-limit) : rows;
  const points = sample.reduce((total, status) => total + (status === "exact" ? exactPoints : (status === "reversed" || status === "swap" ? reversedPoints : 0)), 0);
  return sample.length ? Math.round((points / (sample.length * exactPoints)) * 1000) / 10 : 0;
}

const trusted = ["miss", "exact", "reversed", "swap", "miss", "exact", "miss", "miss", "exact", "reversed", "miss", "exact"];
assert.equal(score(trusted, 0), 45.8, "all trusted rows contribute to Stat Score");
assert.equal(score(trusted, 10), 45, "recent Stat Score uses the latest trusted window");
assert.equal(score([], 10), 0, "empty trusted history is the only empty-score case");

console.log("stat-score-trusted: all checks passed");
