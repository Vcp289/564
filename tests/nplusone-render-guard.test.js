"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("releases/81431pro4/app.js", "utf8");

function bodyBetween(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `missing ${startMarker}`);
  return source.slice(start, end);
}

const modelRefresh = bodyBetween("function refreshAfterBackgroundModelWork()", "function refreshCurrentView()");
assert.match(modelRefresh, /main\?\.dataset\?\.dataStamp===next/, "background completion must compare the rendered data stamp");
assert.match(modelRefresh, /refreshCurrentViewIfDataChanged\("background-model-work"\)/, "background completion must use guarded refresh");

const oneRow = bodyBetween("function scheduleWalkForwardOneRowResume", "function scheduleMissingWalkForwardBootstrap");
assert.match(oneRow, /Number\(state\.activeProfile\)===id/, "N+1 worker must only consider its active Profile");
assert.match(oneRow, /refreshCurrentViewIfDataChanged\("wf-one-row-resume"\)/, "N+1 worker must use guarded refresh");
assert.doesNotMatch(oneRow, /setTimeout\(\(\)=>render\(\)/, "N+1 worker must not full-render the app");

const bootstrap = bodyBetween("function scheduleMissingWalkForwardBootstrap", "function ensureProfileDerivedHistoryReady");
assert.match(bootstrap, /refreshCurrentViewIfDataChanged\("wf-bootstrap"\)/, "bootstrap must use guarded refresh");
assert.doesNotMatch(bootstrap, /setTimeout\(\(\)=>render\(\)/, "bootstrap must not full-render the app");

const ranking = bodyBetween("function getProfessionalProfileAIRankingPage", "function renderRankingUpdateBadge");
assert.match(ranking, /PERF_CACHE\.profileRankingPage\.get\(cacheKey\)/, "unchanged ranking must use the presentation cache");
assert.match(ranking, /PERF_CACHE\.profileRankingPage\.set\(cacheKey/, "ranking cache must publish a complete generation");

console.log("nplusone-render-guard: all checks passed");
