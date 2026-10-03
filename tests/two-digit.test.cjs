const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../releases/81604fastfinal13/two-digit-core.js');
const example=['034','389','689','058','067'];
test('X4 screenshot: columns 4-5, dedupe reversals, keep leading zero',()=>{
 const pairs=core.fromItems(example);
 assert.equal(pairs.length,11);assert.equal(core.expand(pairs).length,21);
 assert.deepEqual(pairs.map(p=>p.number).sort(),['00','05','06','07','08','56','57','58','67','68','78']);
 assert(core.matches(pairs,'50'));assert(core.matches(pairs,'05'));assert(!core.matches(pairs,'99'));
 assert.equal(pairs.reduce((sum,p)=>sum+p.occurrences,0),15);
});
test('all distinct cells: 15 pairs, including vertical and non-adjacent cells',()=>{
 const pairs=core.fromGrid([[9,9,9,0,1],[9,9,9,2,3],[9,9,9,4,5]]);
 assert.equal(pairs.length,15);assert.equal(core.expand(pairs).length,30);
 assert(core.matches(pairs,'04'));assert(core.matches(pairs,'05'));assert(!core.matches(pairs,'99'));assert(!core.matches(pairs,'00'));
});
test('same digit needs distinct cells; do not pad a short deduped result',()=>{
 const pairs=core.fromGrid([[1,2,3,0,0],[1,2,3,0,0],[1,2,3,0,0]]);
 assert.equal(pairs.length,1);assert.equal(pairs[0].number,'00');assert.equal(pairs[0].occurrences,15);
 assert.deepEqual(core.expand(pairs),['00']);
});
test('missing, malformed or partial tables remain pending',()=>{
 for(const value of [null,[],[[1,2]],[[0,0,0,0,null],[0,0,0,0,0],[0,0,0,0,0]]])assert.equal(core.fromGrid(value),null);
 assert.equal(core.fromItems(['034','389']),null);assert.equal(core.fromItems(['34',...example.slice(1)]),null);
 assert.equal(core.canonical('5'),null);assert.equal(core.canonical('50'),'05');
});
test('snapshot must belong to the profile and target and predate result',()=>{
 const draw={profileId:0,date:'2026-10-02',createdAt:200,twoDigit:'50'};
 const snap={profileId:0,targetDate:draw.date,sourceTableDate:'2026-10-01',createdAt:100,x4Items:example};
 assert(core.matches(core.fromSnapshot(snap,draw,0),'50'));
 for(const patch of [{profileId:1},{targetDate:'2026-10-03'},{sourceTableDate:draw.date},{sourceTableDate:''},{createdAt:200},{createdAt:201},{createdAt:0},{x4Items:[]}])assert.equal(core.fromSnapshot({...snap,...patch},draw,0),null);
 assert.equal(core.fromSnapshot(snap,{...draw,profileId:1},0),null);
 assert.equal(core.fromSnapshot(snap,{...draw,createdAt:0},0),null);
});
test('exhaustively compare all six-cell combinations over three digits with independent reference',()=>{
 for(let n=0;n<729;n++){
  let k=n;const cells=Array.from({length:6},()=>{const x=k%3;k=Math.floor(k/3);return x;});
  const grid=[0,1,2].map(r=>[8,8,8,cells[r*2],cells[r*2+1]]),expected=new Set();
  cells.forEach((a,i)=>cells.forEach((b,j)=>{if(i!==j)expected.add(`${Math.min(a,b)}${Math.max(a,b)}`)}));
  assert.deepEqual(core.fromGrid(grid).map(p=>p.number).sort(),[...expected].sort());
 }
});
