const fs=require('fs');
const app=fs.readFileSync('app-v72306.js','utf8');
const hybrid=fs.readFileSync('hybrid-core-v72306.js','utf8');
const canonical=fs.readFileSync('history-analysis-core-v72306.js','utf8');
const saveStart=app.indexOf('saveBtn.addEventListener("click", async () => {');
const paint=app.indexOf('returnToHistoryHubAfterMutation(profileId',saveStart);
const beforePaint=app.slice(saveStart,paint);
const checks=[
 ['save paints History before instant aggregate snapshot', !/instantCommitNewestHistoryRow\(/.test(beforePaint)],
 ['save paints History before ranking rebuild', !/publishInstantProfileRankingAfterSave\(/.test(beforePaint)],
 ['single row canonical peek has no snapshot/ensureRows', /function peekRow\(profileId,draw\)/.test(canonical) && !/function peekRow\(profileId,draw\)[\s\S]{0,500}(snapshot\(|ensureRows\()/.test(canonical)],
 ['row status patch uses canonical peek', /LNCanonicalHistory\?\.peekRow\?\.\(id,draw\)/.test(app)],
 ['latest WF remains maxRows 1', /maxRows:1,mutationScope:true/.test(hybrid)],
 ['row publish occurs before percent-later timer', hybrid.indexOf("commitRow(id,d,statuses,'row-first-final')") < hybrid.indexOf('setTimeout(async()=>')],
 ['percent/ranking delayed 900ms', /publishInstantProfileRankingAfterSave[\s\S]*?\},900\);/.test(hybrid)],
 ['latest path never full hydrates profile', !/hydrateProfile\(id,\{full:true\}\)/.test(hybrid.slice(hybrid.indexOf('if(!bootstrap){'),hybrid.indexOf('// Historical add/edit/delete')))],
 ['service worker caches hybrid core', /hybrid-core-v72306\.js/.test(fs.readFileSync('sw-v72306.js','utf8'))]
];
let ok=true; for(const [name,pass] of checks){console.log(`${pass?'PASS':'FAIL'} ${name}`); ok&&=pass;} if(!ok)process.exit(1); console.log('PASS ROW-FIRST/PERCENT-LATER regression 9/9');
