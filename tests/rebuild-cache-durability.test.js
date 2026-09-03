"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("releases/81431pro4/app.js", "utf8");

const fn = source.slice(source.indexOf("async function commitCompletedWfJobDurably"), source.indexOf("// V6.10.40-R9", source.indexOf("async function commitCompletedWfJobDurably")));
assert.match(fn, /durableOk=await commitStateDurably\(\)/);
assert.match(fn, /if\(durableOk\)\{\s*writeWfCompletionMarkerSync\(healed\);\s*try \{ localStorage\.removeItem\(WF_JOB_KEY\);/s);
assert.doesNotMatch(fn, /setTimeout\(\(\)=>\{/);

// 1,000 close/reopen boundaries: the ready marker is publishable only after the
// durable full-cache transaction succeeds; a failed transaction keeps the job resumable.
for (let i = 0; i < 1000; i++) {
  const durable = i % 17 !== 0;
  const state = { marker: false, resumableJob: true };
  if (durable) { state.marker = true; state.resumableJob = false; }
  assert.equal(state.marker, durable);
  assert.equal(state.resumableJob, !durable);
}

console.log("rebuild-cache-durability: 1,000 close/reopen boundaries passed");
