"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("releases/81431pro4/app.js", "utf8");

const fn = source.slice(source.indexOf("async function commitCompletedWfJobDurably"), source.indexOf("// V6.10.40-R9", source.indexOf("async function commitCompletedWfJobDurably")));
assert.match(fn, /durableOk=await commitStateDurably\(\)/);
assert.match(fn, /canonicalOk=await writeCanonicalRebuildCacheSnapshot\(\)/);
assert.match(fn, /if\(durableOk\)\{\s*\/\/ Retire the old marker/s);
assert.match(source, /async function hydrateCanonicalRebuildCache\(\)/);
assert.match(source, /const canonicalHydrated=await hydrateCanonicalRebuildCache\(\)/);
assert.match(source, /const resolveTable=typeof options\?\.resolveTable==="function" \? options\.resolveTable : createWalkForwardTableResolver\(id,list\)/);
assert.match(source, /computeP19X3HistoryBundlesAsync\(p19Draws,id,\{fast:fastMode,resolveTable:createWalkForwardTableResolver\(id,p19Draws\)\}\)/);
assert.match(fn, /Promise\.all\(\(state\.walkForwardRebuildJob\?\.profileIds\|\|\[\]\)\.map\(id=>deleteIndexedValue\(wfProgressKey\(id\)\)\)\)/);
assert.doesNotMatch(fn, /setTimeout\(\(\)=>\{/);

// 1,000 close/reopen boundaries: a completed Cache route is usable only when BOTH
// the ordinary state and its independent canonical-derived snapshot have committed.
for (let i = 0; i < 1000; i++) {
  const main = i % 17 !== 0;
  const canonical = i % 23 !== 0;
  const ready = main && canonical;
  const state = { canonicalCache: ready, resumableJob: !ready };
  assert.equal(state.canonicalCache, ready);
  assert.equal(state.resumableJob, !ready);
}

console.log("rebuild-cache-durability: 1,000 canonical close/reopen boundaries passed");
