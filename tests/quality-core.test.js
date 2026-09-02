"use strict";

const assert = require("node:assert/strict");
require("../releases/81431pro1/quality-core.js");

const q = globalThis.LuckyProQuality;
assert.ok(q, "quality core must be available");
assert.deepEqual(q.summarize(["exact", "reversed", "swap", "miss", "pending"]), {
  total: 4, exact: 1, variants: 2, miss: 1, exactRate: 25, variantRate: 50, expandedRate: 75
});
assert.equal(q.validateSyncUrl("https://example.com/api").ok, true);
assert.equal(q.validateSyncUrl("http://example.com/api").ok, false);
assert.equal(q.validateSyncUrl("https://user:pass@example.com/api").ok, false);
assert.deepEqual(q.health({profiles:["A"],actualDraws:[
  {profileId:0,date:"2026-01-01",number:"123",twoDigit:"45"},
  {profileId:0,date:"2026-01-02",number:"",twoDigit:"45"}
]}), {build:"81431pro1",profiles:1,draws:2,complete:1,invalid:1,duplicateDates:0,healthy:false});
assert.equal(q.selfTest().ok, true);
console.log("quality-core: all checks passed");
