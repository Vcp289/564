const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const test=require('node:test');
const source=fs.readFileSync(require('node:path').join(__dirname,'../releases/81604fastfinal13/app.js'),'utf8');
function extract(name){
 const match=new RegExp('(?:async )?function '+name+'\\(').exec(source);assert.ok(match,name);
 for(let end=source.indexOf('}',match.index);end>=0;end=source.indexOf('}',end+1)){
  const text=source.slice(match.index,end+1);
  try{new vm.Script('('+text+')');return text}catch{}
 }
 throw new Error('Cannot extract '+name);
}
const names=['historySourceKey','historySourceRowTime','normalizeHistorySourceRows','canonicalizeHistorySourceState','appendHistoryRowJournalOperation','makeHistoryRowJournalOperation','persistHistoryRowJournalIndexed','replayHistoryRowJournalEntries','resolveIndexedHistoryRowJournalEntries','recoverIndexedHistoryRowJournal','historyIdentityLite','bootstrapPersistentState','writeHistoryRowJournal','writeLocalStorageWithReclaim'];
const lao={id:'lao-5oct',profileId:0,profileName:'Lao',date:'2026-10-05',number:'607',twoDigit:'26',createdAt:500};
function environment({local=[],entries=[],state={profiles:['Lao'],actualDraws:[],dailyTables:[{id:'old'}],records:[],_persistenceUpdatedAt:300,_profileRevision:0,walkForwardBacktests:{0:{records:[]}}},quota=false}={}){
 const db={['history-row-journal-v81431']:{entries}};let cleared=false;
 const ctx=vm.createContext({state,window:{},console:{warn(){}},Date,Map,Set,JSON,performance:{now:()=>0},
  HISTORY_ROW_JOURNAL_MAX:256,HISTORY_ROW_JOURNAL_KEY:'local-journal',HISTORY_ROW_JOURNAL_INDEXED_KEY:'history-row-journal-v81431',historyRowJournalIndexedWriteChain:Promise.resolve(true),persistenceReady:false,
  cloneForRecovery:x=>JSON.parse(JSON.stringify(x)),normalizeProfileNameKey:x=>String(x).trim().toLowerCase(),
  readHistoryRowJournal:()=>local,readIndexedValue:async k=>db[k],writeIndexedValue:async(k,v)=>{db[k]=JSON.parse(JSON.stringify(v));return true},
  localStorage:{setItem(){if(quota&&!cleared)throw new Error('QuotaExceededError')}},reclaimLocalStorageEmergencySpace:()=>{cleared=true;return 1},
  writeHistorySourceSyncCheckpointFast:()=>!quota,
  stateHasHistoryPayload:s=>s.actualDraws.length>0,stateMayBeSourceOnlyPartial:()=>false,
  readIndexedState:async()=>null,applyProfileJournalToCandidate:x=>x,recoverHistorySourceCheckpointIfNeeded:async()=>false,deepHistoryRescueIfNeeded:async()=>false,replayHistoryRowJournal:x=>x,
  repairExistingHistoryProfileMapping:x=>x,scheduleHistoryFullStateCommit(){},HISTORY_SOURCE_CHECKPOINT_THROTTLE_KEY:'throttle',HISTORY_SOURCE_CHECKPOINT_MIN_INTERVAL_MS:Infinity
 });
 for(const name of names)vm.runInContext(extract(name),ctx);return {ctx,db};
}
function op(row=lao,at=600){return {type:'upsert',profileId:row.profileId,date:row.date,row,at}}
test('reopen recovers saved Lao row from IndexedDB even when old main takes the fast path and local storage is full',async()=>{
 const {ctx}=environment({quota:true,state:{profiles:['Lao'],actualDraws:[{id:'old',profileId:0,date:'2026-10-02',number:'693',twoDigit:'46'}],dailyTables:[{id:'old'}],_persistenceUpdatedAt:300,walkForwardBacktests:{0:{records:[]}}}});
 ctx.saved=lao;assert.equal(await vm.runInContext('persistHistoryRowJournalIndexed(saved)',ctx),true);
 assert.equal(await ctx.bootstrapPersistentState(),true);
 assert.equal(ctx.state.actualDraws.length,2);
 assert.equal(ctx.state.actualDraws.find(x=>x.date==='2026-10-05').number,'607');
 assert.equal(await ctx.bootstrapPersistentState(),false);
 assert.equal(ctx.state.actualDraws.length,2);
});
test('normal hydration path also recovers IndexedDB row',async()=>{
 const {ctx}=environment({entries:[op()]});ctx.state.dailyTables=[];ctx.stateHasHistoryPayload=()=>false;
 assert.equal(await ctx.bootstrapPersistentState(),true);assert.equal(ctx.state.actualDraws[0].number,'607');
});
test('a newer local edit wins over an older indexed saved row',async()=>{
 const edit={...lao,number:'123',updatedAt:700};const {ctx}=environment({entries:[op()],local:[op(edit,800)]});
 await ctx.recoverIndexedHistoryRowJournal();assert.equal(ctx.state.actualDraws[0].number,'123');
});
test('a journal before explicit reset cannot restore cleared history',async()=>{
 const {ctx}=environment({entries:[op()]});ctx.state._historyResetAt=700;
 assert.equal(await ctx.recoverIndexedHistoryRowJournal(),false);assert.equal(ctx.state.actualDraws.length,0);
});
test('deleted profiles stay deleted when old journal contains their rows',async()=>{
 const {ctx}=environment({entries:[op()]});ctx.state.profiles=['Taiwan'];ctx.state._profileRevision=2;
 assert.equal(await ctx.recoverIndexedHistoryRowJournal(),false);assert.equal(ctx.state.actualDraws.length,0);
});
test('journal rows follow profile name after profiles are reordered',async()=>{
 const {ctx}=environment({entries:[op()]});ctx.state.profiles=['Taiwan','Lao'];ctx.state._profileRevision=2;
 await ctx.recoverIndexedHistoryRowJournal();assert.equal(ctx.state.actualDraws[0].profileId,1);
});
test('a saved deletion removes its row but cannot erase a later replacement',async()=>{
 const deletion={type:'delete',profileId:0,profileName:'Lao',date:lao.date,id:lao.id,at:600};
 const {ctx}=environment({entries:[deletion]});ctx.state.actualDraws=[{...lao}];
 await ctx.recoverIndexedHistoryRowJournal();assert.equal(ctx.state.actualDraws.length,0);
 ctx.state.actualDraws=[{...lao,id:'new',updatedAt:700}];
 await ctx.recoverIndexedHistoryRowJournal();assert.equal(ctx.state.actualDraws.length,1);
});
test('local journal retries after reclaiming disposable cache space',()=>{
 const {ctx}=environment({quota:true});assert.equal(ctx.writeHistoryRowJournal([op()]),true);
});
