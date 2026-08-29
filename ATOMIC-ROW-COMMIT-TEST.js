const fs=require('fs');
const hybrid=fs.readFileSync('hybrid-core-v72308.js','utf8');
const app=fs.readFileSync('app-v72308.js','utf8');
const latest=hybrid.slice(hybrid.indexOf('if(!bootstrap){'),hybrid.indexOf('// Historical add/edit/delete'));
const checks=[
  ['no early partial canonical commit', !/row-first-early/.test(latest)],
  ['all six readiness gate exists', /allSixReady=statuses=>\['classic','aiL','gl','p18','p19','x3'\]\.every/.test(latest)],
  ['atomic commit guarded by all six', /if\(allSixReady\(statuses\)\)\{[\s\S]*commitRow\(id,d,statuses,'atomic-row-final'\)/.test(latest)],
  ['target row WF starts at exact saved date', /startDate:String\(d\.date\|\|''\)[\s\S]*maxRows:1/.test(latest)],
  ['foreground row avoids incremental P19 X3 shortcut', !/computeIncrementalP19X3\(d,id\)/.test(latest)],
  ['percent later only after atomic publication', /if\(atomicPublished\) setTimeout\(async\(\)=>/.test(latest)],
  ['initial History paint requests atomic-only', /patchHistoryRowStatusesInstant\(id,String\(draw\.id\),\{atomicOnly:true\}\)/.test(app)],
  ['atomic-only path refuses incomplete canonical row', /if\(options\?\.atomicOnly && !atomicReady\) return false/.test(app)],
  ['exact queued row identity preserved', /targetDrawId,targetDate/.test(hybrid)]
];
let ok=true; for(const [n,p] of checks){ console.log(`${p?'PASS':'FAIL'} ${n}`); ok&&=p; }
if(!ok) process.exit(1);
console.log('PASS ATOMIC ROW COMMIT 9/9');
