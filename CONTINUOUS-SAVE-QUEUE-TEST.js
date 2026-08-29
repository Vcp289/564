const fs=require('fs');
const h=fs.readFileSync('hybrid-core-v72306.js','utf8');
const checks=[
 ['worker accepts captured target row', /targetDrawId='',targetDate=''/.test(h)],
 ['worker resolves captured ID before latest fallback', h.indexOf("targetDrawId?list.find") < h.indexOf("list[list.length-1]", h.indexOf("targetDrawId?list.find"))],
 ['save hook forwards actualDrawId into queue', /targetDrawId:String\(actualDrawId\|\|''\)/.test(h)],
 ['save hook captures date at schedule time', /targetDate:String\(row\?\.date\|\|''\)/.test(h)],
 ['profile queue remains serialized not collapsed', /const prev=Q\.get\(id\)\|\|Promise\.resolve\(\)/.test(h) && /prev\.catch\(\(\)=>\{\}\)\.then/.test(h)],
 ['latest WF remains bounded to one row', /maxRows:1,mutationScope:true/.test(h)],
 ['percent/ranking still runs after row publish', h.indexOf("commitRow(id,d,statuses,'row-first-final')") < h.indexOf('setTimeout(async()=>')]
];
let ok=true; for(const [n,p] of checks){ console.log(`${p?'PASS':'FAIL'} ${n}`); ok&&=p; } if(!ok) process.exit(1); console.log('PASS CONTINUOUS SAVE queue regression 7/7');
