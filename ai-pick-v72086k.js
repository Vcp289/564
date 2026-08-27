/* LuckyNumber V7.20.86k — AI PICK · TEST
 * Shadow-mode selector: chooses ONE candidate only from the existing X3 pool.
 * It never changes X3 Top 3/5/7, AI Decision profile selection, History, or AUTO.
 * Daily snapshot is strict prior-only and durable (localStorage mirror + IndexedDB).
 */
(()=>{
  'use strict';
  const SCHEMA=1;
  const LS_KEY='lucky_ai_pick_test_daily_v72086k';
  const IDB_PREFIX='ai-pick-test-daily-v72086k-';
  const MAX_PRIOR=120;
  let memory=null, running=null, hydratePromise=null, refreshTimer=0, retryTimer=0, retryCount=0, uiState='BOOTING';
  const safe=s=>String(s??'');
  const esc=s=>safe(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dayKey=()=>typeof isoDate==='function'?isoDate():new Date().toISOString().slice(0,10);
  const canonical=n=>safe(n).split('').sort().join('');
  const yieldUi=()=>new Promise(r=>setTimeout(r,0));
  const decisionIds=()=>{
    try{return (getDailyAISelectTop3()?.items||[]).map(x=>Number(x?.profileId)).filter(Number.isFinite).slice(0,3);}catch(_){return [];}
  };
  const fingerprint=(date,ids)=>`${date}|${ids.join(',')}|${safe(globalThis.X3_ENGINE_SIGNATURE||'x3')}`;
  const valid=(x,date=dayKey(),ids=decisionIds())=>Boolean(x&&x.schema===SCHEMA&&x.date===date&&x.fingerprint===fingerprint(date,ids)&&Array.isArray(x.items));
  const readMirror=()=>{try{const x=JSON.parse(localStorage.getItem(LS_KEY)||'null');return valid(x)?x:null;}catch(_){return null;}};
  const mirror=x=>{try{localStorage.setItem(LS_KEY,JSON.stringify(x));return true;}catch(_){return false;}};
  const idbKey=date=>`${IDB_PREFIX}${date}`;
  async function readDurable(){
    if(hydratePromise)return hydratePromise;
    hydratePromise=(async()=>{
      try{
        const date=dayKey(), ids=decisionIds();
        if(!ids.length)return null;
        const x=typeof readIndexedValue==='function'?await readIndexedValue(idbKey(date)):null;
        if(valid(x,date,ids)){memory=x;mirror(x);return x;}
      }catch(_){ }
      finally{hydratePromise=null;}
      return null;
    })();
    return hydratePromise;
  }
  async function persist(x){
    memory=x; const a=mirror(x); let b=false;
    try{b=typeof writeIndexedValue==='function'?await writeIndexedValue(idbKey(x.date),x):false;}catch(_){ }
    return Boolean(a||b);
  }
  function latestSourceTable(pid,targetDate){
    try{
      const list=(state?.dailyTables||[]).filter(t=>Number(t?.profileId)===Number(pid)&&safe(t?.date).slice(0,10)<targetDate&&Array.isArray(t?.inputDigits)&&t.inputDigits.length===5)
        .sort((a,b)=>safe(b.date).localeCompare(safe(a.date))||Number(b.createdAt||0)-Number(a.createdAt||0));
      return list[0]||null;
    }catch(_){return null;}
  }
  function buildPool(pid,targetDate){
    const table=latestSourceTable(pid,targetDate); if(!table)return null;
    const inputs=table.inputDigits.map(String);
    const grid=typeof formulaGrid==='function'?formulaGrid(inputs,getOriginalFormula()):table.grid;
    if(!grid||typeof buildX3Candidates!=='function')return null;
    const x3=buildX3Candidates(grid,pid,targetDate,inputs,false);
    const seen=new Set(),items=[];
    for(const raw of (x3?.items||[])){
      const n=canonical(raw?.number); if(!/^\d{3}$/.test(n)||seen.has(n))continue; seen.add(n);
      items.push({number:n,source:safe(raw?.patternX3Source||raw?.source||'X3'),originalRank:items.length+1});
      if(items.length>=7)break;
    }
    return items.length?{items,table,inputs}:null;
  }
  async function historicalStats(pid,targetDate){
    const draws=(state?.actualDraws||[]).filter(d=>Number(d?.profileId)===Number(pid)&&safe(d?.date)<targetDate&&/^\d{3}$/.test(safe(d?.number)))
      .sort((a,b)=>safe(a.date).localeCompare(safe(b.date))||Number(a.createdAt||0)-Number(b.createdAt||0)).slice(-MAX_PRIOR);
    const rank=Array.from({length:7},()=>({hit:0,total:0})),source=new Map();
    let carryHit=0,carryTotal=0,processed=0;
    for(const draw of draws){
      let table=null;
      try{table=getPredictionTable(pid,draw.date,draw);}catch(_){ }
      const inputs=table?.inputDigits?.map?.(String);
      if(!table||!Array.isArray(inputs)||inputs.length!==5)continue;
      let grid=null,pool=null;
      try{grid=formulaGrid(inputs,getOriginalFormula());pool=buildX3Candidates(grid,pid,draw.date,inputs,true)?.items||[];}catch(_){continue;}
      const actual=canonical(draw.number), actualDigits=new Set(safe(draw.number).split(''));
      const priorDigits=new Set(inputs);
      if(actualDigits.size){carryTotal++; if([...actualDigits].some(d=>priorDigits.has(d)))carryHit++;}
      const seen=new Set(); let r=0;
      for(const raw of pool){
        const n=canonical(raw?.number); if(!/^\d{3}$/.test(n)||seen.has(n))continue; seen.add(n); if(r>=7)break;
        const hit=n===actual; rank[r].total++; if(hit)rank[r].hit++;
        const src=safe(raw?.patternX3Source||raw?.source||'X3'); const st=source.get(src)||{hit:0,total:0}; st.total++; if(hit)st.hit++; source.set(src,st); r++;
      }
      processed++;
      if(processed%24===0)await yieldUi();
    }
    return {rank,source,carryRate:carryTotal?carryHit/carryTotal:0.5,samples:processed};
  }
  function candidateScore(c,i,stats,inputs){
    const rs=stats.rank[i]||{hit:0,total:0};
    const rankPosterior=(rs.hit+1)/(rs.total+8);
    const ss=stats.source.get(c.source)||{hit:0,total:0};
    const sourcePosterior=(ss.hit+1)/(ss.total+6);
    const inputSet=new Set(inputs||[]),digits=[...new Set(c.number.split(''))];
    const overlap=digits.filter(d=>inputSet.has(d)).length/Math.max(1,digits.length);
    const carryBias=(stats.carryRate-0.5)*2;
    const originalRankPrior=(7-i)/7;
    return rankPosterior*0.42+sourcePosterior*0.20+originalRankPrior*0.20+(0.5+carryBias*(overlap-0.5))*0.18;
  }
  async function buildOne(pid,date){
    const pack=buildPool(pid,date); if(!pack)return {profileId:pid,profileName:safe(state?.profiles?.[pid]||`Profile ${pid+1}`),status:'NO X3',pick:'',score:0,samples:0};
    const stats=await historicalStats(pid,date);
    const scored=pack.items.map((c,i)=>({...c,score:candidateScore(c,i,stats,pack.inputs)})).sort((a,b)=>b.score-a.score||a.originalRank-b.originalRank);
    const top=scored[0],second=scored[1];
    const gap=Math.max(0,Number(top?.score||0)-Number(second?.score||0));
    const confidence=Math.max(35,Math.min(89,Math.round(50+gap*160+Math.min(15,stats.samples/8))));
    return {profileId:pid,profileName:safe(state?.profiles?.[pid]||`Profile ${pid+1}`),pick:top?.number||'',x3Rank:Number(top?.originalRank||0),source:top?.source||'X3',confidence,samples:stats.samples,status:'WAITING',pool:pack.items.map(x=>x.number)};
  }
  function settle(item,date){
    if(!item?.pick)return item;
    const draw=(state?.actualDraws||[]).find(d=>Number(d?.profileId)===Number(item.profileId)&&safe(d?.date).slice(0,10)===date&&/^\d{3}$/.test(safe(d?.number)));
    if(!draw)return {...item,status:'WAITING'};
    return {...item,status:canonical(draw.number)===canonical(item.pick)?'HIT':'MISS'};
  }
  async function compute(){
    if(running)return running;
    running=(async()=>{
      const date=dayKey(),ids=decisionIds();
      if(!ids.length)return null;
      const items=[];
      for(const pid of ids){items.push(await buildOne(pid,date));await yieldUi();}
      const snap={schema:SCHEMA,date,fingerprint:fingerprint(date,ids),createdAt:Date.now(),mode:'X3-SHADOW-TEST-STRICT-PRIOR',items};
      await persist(snap); refresh(); return snap;
    })().finally(()=>{running=null;});
    return running;
  }
  function current(){
    const date=dayKey(),ids=decisionIds();
    if(memory&&valid(memory,date,ids))return {...memory,items:memory.items.map(x=>settle(x,date))};
    const m=readMirror(); if(m){memory=m;return {...m,items:m.items.map(x=>settle(x,date))};}
    return null;
  }
  function statusMeta(s){return s==='HIT'?['HIT','hit']:s==='MISS'?['MISS','miss']:['WAITING','pending'];}
  function loadingText(){
    if(uiState==='WAIT_DECISION')return 'กำลังรอ AI Decision เพื่อเลือก Profile…';
    if(uiState==='WAIT_X3')return 'กำลังโหลด X3 Candidate…';
    if(uiState==='COMPUTING')return 'กำลังจัดอันดับ Candidate จาก X3…';
    if(uiState==='NO_DATA')return 'ยังไม่มีข้อมูล X3 สำหรับงวดนี้';
    return 'กำลังเตรียม X3 Candidate…';
  }
  function cardHtml(snap){
    const rows=(snap?.items||[]).map(x=>{const [label,tone]=statusMeta(x.status);return `<div class="ai-pick-row"><div><small>${esc(x.profileName)}</small><strong>${esc(x.pick||'—')}</strong></div><div class="ai-pick-meta"><span>X3 #${Number(x.x3Rank)||'—'}</span><span>AI Score ${Number(x.confidence)||0}</span></div><b class="ai-pick-status ${tone}">${label}</b></div>`;}).join('');
    return `<section class="ai-pick-card" aria-label="AI Pick Test"><div class="ai-pick-head"><div><small>AI PICK · TEST</small><h3>X3 Candidate Pick</h3></div><span>SHADOW</span></div>${rows||`<div class="ai-pick-loading">${esc(loadingText())}</div>`}<div class="ai-pick-foot">เลือก 1 ชุดจาก X3 เท่านั้น · ไม่เปลี่ยน Top 3/5/7 · Strict Prior-Only</div></section>`;
  }
  function renderCard(){
    const snap=current();
    setTimeout(schedule,0);
    return cardHtml(snap);
  }
  function refresh(){
    if(typeof document==='undefined')return false;
    const old=document.querySelector('main.main .ai-pick-card'); if(!old)return false;
    const tpl=document.createElement('template');tpl.innerHTML=cardHtml(current()).trim();const next=tpl.content.firstElementChild;if(next)old.replaceWith(next);return Boolean(next);
  }
  function queueRetry(ms=240){
    clearTimeout(retryTimer);
    retryTimer=setTimeout(()=>schedule(true),Math.max(80,Number(ms)||240));
  }
  function schedule(isRetry=false){
    clearTimeout(refreshTimer); refreshTimer=setTimeout(async()=>{
      const date=dayKey(),ids=decisionIds();
      if(!ids.length){
        uiState='WAIT_DECISION'; refresh();
        retryCount=Math.min(retryCount+1,120); queueRetry(retryCount<15?180:500); return;
      }
      if(current()){ retryCount=0; uiState='READY'; if(!memory)memory=readMirror(); return refresh(); }
      const durable=await readDurable(); if(durable){retryCount=0;uiState='READY';return refresh();}
      if(!globalThis.X3NestedPro463){
        uiState='WAIT_X3'; refresh();
        retryCount=Math.min(retryCount+1,120); queueRetry(retryCount<15?180:500); return;
      }
      uiState='COMPUTING'; refresh();
      const snap=await compute();
      retryCount=0; uiState=snap?.items?.length?'READY':'NO_DATA'; refresh();
    },isRetry?0:40);
  }
  async function clear(){memory=null;try{localStorage.removeItem(LS_KEY);}catch(_){ }try{if(typeof deleteIndexedValue==='function')await deleteIndexedValue(idbKey(dayKey()));}catch(_){ }refresh();}
  globalThis.AIPickPro={renderCard,refresh,schedule,clear,current,compute,version:'7.20.86k-ready-retry'};
  if(typeof addEventListener==='function'){
    addEventListener('x3-pro-ready',()=>schedule(),{passive:true});
    addEventListener('lucky:history-mutated',()=>schedule(),{passive:true});
    addEventListener('pageshow',()=>schedule(),{passive:true});
    document?.addEventListener?.('visibilitychange',()=>{if(document.visibilityState==='visible')schedule();},{passive:true});
  }
})();
