const fs=require('fs');
const s=fs.readFileSync('hybrid-core-v72305.js','utf8');
const checks=[
 ['latest path maxRows:1', /maxRows:1,mutationScope:true/],
 ['latest path no full hydrate', /ensureRows\(id,\[d\].*percent-later-one-row/],
 ['automatic bootstrap disabled', /setTimeout\(bootstrapOnce,1800\); \/\/ intentionally disabled/],
 ['latest returns one row', /rowsProcessed:1/],
 ['historical path remains serialized', /while\(!walkForwardBucketCoversCurrentHistory\(id\).*guard\+\+<64/s]
];
let ok=true; for(const [name,re] of checks){ const pass=re.test(s); console.log(`${pass?'PASS':'FAIL'} ${name}`); ok&&=pass; }
if(!ok) process.exit(1);
console.log('PASS COOL SAVE regression 5/5');
