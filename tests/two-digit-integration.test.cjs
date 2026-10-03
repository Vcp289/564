const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const dir=path.join(__dirname,'../releases/81604fastfinal13');
function appContext(){
 const noop=()=>{},proxy=new Proxy(function(){},{get:(t,k)=>k==='then'?undefined:k==='length'?0:proxy,apply:()=>proxy});
 const storage={getItem:()=>null,setItem:noop,removeItem:noop};
 const c={console,Date,Map,Set,JSON,Math,Number,String,Array,Object,RegExp,Promise,URL,Uint8Array,TextEncoder,TextDecoder,structuredClone,performance,localStorage:storage,sessionStorage:storage,document:proxy,navigator:proxy,location:{href:'https://example.org',protocol:'https:',hostname:'example.org'},setTimeout:()=>0,clearTimeout:noop,setInterval:()=>0,clearInterval:noop,requestAnimationFrame:()=>0,addEventListener:noop,crypto:require('crypto').webcrypto};
 c.window=c;c.globalThis=c;vm.createContext(c);
 vm.runInContext(fs.readFileSync(path.join(dir,'two-digit-core.js'),'utf8'),c);
 vm.runInContext(fs.readFileSync(path.join(dir,'app.js'),'utf8').replace(/startApplication\(\)\.catch\(error=>\{console.error\("Application bootstrap failed"[\s\S]*$/,'void 0;'),c);
 return c;
}
test('History and Analysis derive matching snapshot only; pending excluded; never rebuild X4',()=>{
 const c=appContext();
 vm.runInContext(`state={profiles:['Lao'],dailyTables:[{id:'saved',profileId:0,date:'2026-10-01',predictionSnapshot:{profileId:0,createdAt:100,targetDate:'2026-10-02',x4Items:['034','389','689','058','067']}}],actualDraws:[]};getUniversalPredictionSnapshot=()=>{throw Error('must not reconstruct')};getPredictionTable=()=>{throw Error('must not reconstruct')};getCalculatorEngineTable=()=>{throw Error('must not run X4')};`,c);
 c.draws=[{profileId:0,date:'2026-10-02',createdAt:200,twoDigit:'50'},{profileId:0,date:'2026-10-03',createdAt:300,twoDigit:'05'},{profileId:0,date:'2026-10-02',createdAt:200,twoDigit:'99'}];
 const summary=vm.runInContext('twoDigitSummary(0,draws)',c);
 assert.equal(summary.checked,2);assert.equal(summary.hit,1);assert.equal(summary.pending,1);assert.equal(summary.rate,50);assert.equal(summary.average,11);
 assert.match(vm.runInContext('twoDigitHistoryBadge(draws[0],0)',c),/2D Hit/);
 assert.match(vm.runInContext('twoDigitHistoryBadge(draws[1],0)',c),/2D —/);
 c.draws[0].referenceTableId='different';assert.equal(vm.runInContext('twoDigitHistoryEvidence(draws[0],0)',c),null);
});
test('popup shows pair count, expanded pricing, reversed search, Top limit and pair detail',()=>{
 const c=appContext(),nodes=new Map();let cards=[];
 const node=id=>({id,value:'',dataset:{},hidden:false,handlers:{},addEventListener(k,fn){this.handlers[k]=fn}});
 c.document={getElementById:id=>nodes.get(id),querySelectorAll:s=>s==='[data-two-pair]'?cards:[]};
 c.capture=html=>{c.html=html;nodes.clear();for(const id of ['twoDigitSearch','clearTwoDigitSearch','twoDigitEmpty','twoDigitBack'])nodes.set(id,node(id));const value=html.match(/id="twoDigitSearch"[^>]*value="([^"]*)"/);nodes.get('twoDigitSearch').value=value?.[1]||'';cards=[...html.matchAll(/data-two-pair="(\d\d)"/g)].map(m=>Object.assign(node(m[1]),{dataset:{twoPair:m[1]}}));};
 vm.runInContext(`state={profiles:['Lao'],activeProfile:0};showModal=capture;getCalculatorEngineTable=()=>({grid:[[0,3,6,0,0],[3,8,8,5,6],[4,9,9,8,7]]});openTwoDigitResults('50');`,c);
 assert.match(c.html,/11 คู่ไม่ซ้ำ/);assert.match(c.html,/21 บาท/);assert.equal(cards.filter(x=>!x.hidden).length,1);assert.equal(cards.find(x=>!x.hidden).dataset.twoPair,'05');
 nodes.get('clearTwoDigitSearch').handlers.click();assert.equal(cards.filter(x=>!x.hidden).length,11);
 cards.find(x=>x.dataset.twoPair==='05').handlers.click();assert.match(c.html,/05 \/ 50/);nodes.get('twoDigitBack').handlers.click();assert.match(c.html,/11 คู่ไม่ซ้ำ/);
 vm.runInContext(`openTwoDigitResults('',3,2)`,c);assert.equal(cards.length,3);assert.match(c.html,/3 คู่ที่เลือก/);const n=Number(c.html.match(/กลับเลขแล้ว (\d+) ชุด/)[1]);assert.match(c.html,new RegExp(`${n*2} บาท`));
});
test('old 3D result finder stays byte-for-byte identical to V8.19.85',()=>{
 const source=fs.readFileSync(path.join(dir,'app.js'),'utf8'),a=source.indexOf('function findLResults('),b=source.indexOf('const PATTERN_V1_EXT_PATTERNS',a);
 assert(a>0&&b>a);assert.equal(require('node:crypto').createHash('sha256').update(source.slice(a,b)).digest('hex'),'f8b9bacd2f285e77ce7e09b79c4a21deba971736552ccb918e49b56f5b468771');
});
test('new helper loads before app and is pre-cached in bumped shell',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),sw=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8'),version=JSON.parse(fs.readFileSync(path.join(__dirname,'../version.json'),'utf8'));
 assert(html.indexOf('/two-digit-core.js')<html.indexOf('/app.js'));assert.match(sw,/two-digit-core\.js/);assert.match(sw,new RegExp(version.build));assert.match(html,new RegExp(version.build));assert.equal(version.version,'V8.19.86');
});
