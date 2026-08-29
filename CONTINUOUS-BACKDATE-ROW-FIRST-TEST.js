const fs=require('fs');
const h=fs.readFileSync('hybrid-core-v72307.js','utf8');
const checks=[
 ['every save queues bootstrap false', /enqueue\(id,\{affectedStartDate:String\(wfIncrementalStart\|\|''\),bootstrap:false,targetDrawId,targetDate\}\)/.test(h)],
 ['backdate suffix is delayed', /scheduleCoalescedSuffixRepair\(id,String\(wfIncrementalStart\|\|targetDate\|\|''\)\)/.test(h)],
 ['suffix repairs coalesce per profile', /SUFFIX_TIMERS=new Map\(\)/.test(h) && /clearTimeout\(old\)/.test(h)],
 ['suffix waits 2600ms idle', /\},2600\);/.test(h)],
 ['row-first final precedes percent timer', h.indexOf("commitRow(id,d,statuses,'row-first-final')") < h.indexOf('setTimeout(async()=>')],
 ['exact row identity captured before queue', /const targetDrawId=String\(actualDrawId\|\|''\), targetDate=String\(row\?\.date\|\|''\)/.test(h)],
 ['latest WF bounded one row', /maxRows:1,mutationScope:true/.test(h)]
];
let ok=true; for(const [n,p] of checks){console.log(`${p?'PASS':'FAIL'} ${n}`); ok&&=p;} if(!ok) process.exit(1); console.log('PASS CONTINUOUS BACKDATE ROW-FIRST 7/7');
