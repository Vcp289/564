/* LuckyNumber X4 Coverage 577 — independent strict-prior Global Hamming KNN.
 * Keeps every existing engine intact. Uses one cached KNN result for all UI surfaces. */
(()=>{
'use strict';
const META=Object.freeze({engine:'X4-COVERAGE-577',k:80,window:600,top:21,strictPriorOnly:true,developmentHit:577});
const CACHE=new Map();
const canon=v=>[...String(v||'')].sort().join('');
const validInput=x=>Array.isArray(x)&&x.length===5&&x.every(v=>/^\d$/.test(String(v)));
function signature(){return `${Number(state?._persistenceUpdatedAt||0)}|${(state?.actualDraws||[]).length}|${Number(state?._profileRevision||0)}`;}
function strictRows(targetDate){
  const key=`ROWS|${targetDate}|${signature()}`; if(CACHE.has(key))return CACHE.get(key);
  const all=(state?.actualDraws||[]).filter(d=>/^\d{3}$/.test(String(d?.number||''))&&/^\d{2}$/.test(String(d?.twoDigit||''))&&String(d?.date||'')<targetDate)
    .sort((a,b)=>String(a.date).localeCompare(String(b.date))||Number(a.profileId)-Number(b.profileId)||Number(a.createdAt||0)-Number(b.createdAt||0));
  const prev=new Map(),rows=[];
  for(const d of all){const pid=Number(d.profileId),p=prev.get(pid);if(p)rows.push({x:[...String(p.number),...String(p.twoDigit)].map(Number),y:canon(d.number),date:String(d.date)});prev.set(pid,d);}
  const out=rows.slice(-META.window);CACHE.set(key,out);if(CACHE.size>80)CACHE.delete(CACHE.keys().next().value);return out;
}
function select(ctx={}){
  const targetDate=String(ctx.targetDate||'').slice(0,10),x=(ctx.inputDigits||[]).map(Number);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)||!validInput(x))return{items:[],ready:false,reason:'missing-input-or-target',engine:META.engine};
  const base=new Set((ctx.baseItems||[]).map(v=>canon(typeof v==='string'?v:v?.number)).filter(Boolean));
  const ck=`OUT|${targetDate}|${x.join('')}|${[...base].join(',')}|${signature()}`;if(CACHE.has(ck))return CACHE.get(ck);
  const near=strictRows(targetDate).map((r,i)=>({r,i,d:r.x.reduce((n,v,j)=>n+(v!==x[j]?1:0),0)})).sort((a,b)=>a.d-b.d||b.i-a.i).slice(0,META.k);
  const votes=new Map();for(const z of near)votes.set(z.r.y,(votes.get(z.r.y)||0)+1/(1+z.d));
  const items=[...votes].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).filter(([n])=>!base.has(n)).slice(0,META.top)
    .map(([number,score],i)=>({number,patternX4Source:'Global Hamming KNN',patternX4Score:score,patternX4Rank:i+1}));
  const out={items,ready:true,engine:META.engine,strictPriorOnly:true,config:META};CACHE.set(ck,out);return out;
}
function current(){
  try{const input=Array.isArray(state?.lastInput)?state.lastInput.map(String):[];const target=typeof autoRouteTargetDate==='function'?autoRouteTargetDate():new Date().toISOString().slice(0,10);return select({targetDate:target,inputDigits:input});}catch(_){return{items:[],ready:false,engine:META.engine};}
}
function renderCard(){
  const root=document.querySelector('main,#app>div');if(!root)return;let card=document.getElementById('x4CoverageCard');if(!card){card=document.createElement('section');card.id='x4CoverageCard';card.className='x4-coverage-card';root.appendChild(card);}
  const out=current(),nums=(out.items||[]).map(x=>x.number);card.innerHTML=`<div class="x4-title"><span>X4</span><div><b>Coverage 577</b><small>Standalone Global Hamming · Strict Prior-Only</small></div><em>${out.ready?'READY':'WAIT INPUT'}</em></div><div class="x4-numbers">${nums.length?nums.map(n=>`<i>${n}</i>`).join(''):'<small>กรอกเลข 5 หลักเพื่อสร้าง X4 Top 21</small>'}</div><div class="x4-foot">K80 · Window 600 · Top 21 · ไม่แทน X3/AI เดิม</div>`;
}
const style=document.createElement('style');style.textContent=`.x4-coverage-card{margin:14px 16px 92px;padding:14px;border:1px solid rgba(10,132,255,.35);border-radius:18px;background:rgba(10,132,255,.08);font-family:inherit}.x4-title{display:flex;gap:10px;align-items:center}.x4-title>span{font-weight:900;font-size:22px;color:#0a84ff}.x4-title div{display:flex;flex:1;flex-direction:column}.x4-title small,.x4-foot{opacity:.7;font-size:11px}.x4-title em{font-style:normal;font-size:10px;color:#30d158}.x4-numbers{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}.x4-numbers i{font-style:normal;font-weight:750;padding:6px 9px;border-radius:10px;background:rgba(10,132,255,.16)}.x4-foot{text-align:right}`;document.head.appendChild(style);
const api={...META,select,current,clearCache:()=>CACHE.clear(),render:renderCard};globalThis.X4Coverage577=api;
let queued=false;const schedule=()=>{if(queued)return;queued=true;(globalThis.requestIdleCallback||setTimeout)(()=>{queued=false;renderCard();},{timeout:900});};
new MutationObserver(schedule).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});window.addEventListener('load',schedule,{once:true});window.addEventListener('x3-pro-ready',schedule);schedule();
})();
