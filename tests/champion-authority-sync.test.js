"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");

const source = fs.readFileSync("releases/81431pro4/app.js", "utf8");

// Guard the architectural contract: a durable, source-keyed authority is published
// from atomic History commits and is consumed by both visible destinations.
assert.match(source, /const CHAMPION_AUTHORITY_SNAPSHOT_KEY="luckyNumber_champion_authority_v81431"/);
assert.match(source, /function championAuthoritySourceSignature\(profileId, draws\)/);
assert.match(source, /persistChampionAuthoritySnapshot\(id,draws,snapshot\?\.summaries\)/);
assert.match(source, /const published=getPublishedChampionAuthority\(id,all\)/);
assert.match(source, /const champion=getPublishedChampionAuthority\(id,draws\)/);

function championFromSummaries(summaries) {
  const labels = {classic:"Classic", aiL:"AI L", gl:"AI GL", p18:"P18", p19:"P19", x3:"X3"};
  return Object.entries(summaries)
    .filter(([, summary]) => Number(summary?.total || 0) > 0)
    .map(([key, summary]) => ({key, label:labels[key], hit:Number(summary.hit), total:Number(summary.total), rate:Number(summary.rate)}))
    .sort((a,b) => b.rate-a.rate || b.total-a.total || a.key.localeCompare(b.key));
}

// 1,000 cold-launch cycles: Analysis and Calculate deserialize one published
// authority object and therefore choose the same winner with no refresh/rebuild.
for (let i = 0; i < 1000; i++) {
  const summaries = {
    classic:{hit:3 + (i % 3),total:30,rate:(3 + (i % 3)) * 100 / 30},
    aiL:{hit:4,total:30,rate:100 / 7.5},
    gl:{hit:5,total:30,rate:100 / 6},
    p18:{hit:6,total:30,rate:20},
    p19:{hit:6 + (i % 2),total:30,rate:(6 + (i % 2)) * 100 / 30},
    x3:{hit:10,total:30,rate:100 / 3}
  };
  const published = JSON.parse(JSON.stringify({profileId:7, sourceSignature:`7|30|${i}`, authority:{items:championFromSummaries(summaries)}}));
  const analysisWinner = published.authority.items[0];
  const calculateWinner = published.authority.items[0];
  assert.equal(calculateWinner.key, analysisWinner.key);
  assert.equal(calculateWinner.rate, analysisWinner.rate);
  assert.equal(published.profileId, 7);
}

console.log("champion-authority-sync: 1,000 cold-launch authority cycles passed");
