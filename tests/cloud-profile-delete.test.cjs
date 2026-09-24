const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const release = path.join(__dirname,'../releases/81604fastfinal13');

test('a durable profile deletion outranks an old mirror with more draws',async () => {
  const after={_profileRevision:2,profiles:['Taiwan'],actualDraws:[{id:'a'}]};
  const before={_profileRevision:1,profiles:['Taiwan','Hong'],actualDraws:[{id:'a'},{id:'b'}]};
  const values={
    luckyNumberProV4_5:JSON.stringify(before),
    luckyNumberProV4_5_profile_journal_v1:JSON.stringify([{type:'delete',revision:2,
      afterProfiles:['Taiwan'],updatedAt:3000}])
  };
  const context={window:{__lnPostHydrationSettled:true},state:after,
    localStorage:{getItem:key=>values[key]||null},
    readIndexedState:async()=>after,commitStateDurably:async()=>true,
    console,setTimeout,Date,JSON};
  vm.runInNewContext(fs.readFileSync(path.join(release,'cloud-restore-bridge.js'),'utf8'),context);
  const source=await context.window.__lnReadCloudSource();
  assert.equal(source.profiles,1);
  assert.equal(source.count,1);
  assert.equal(source.profileRevision,2);
  assert.equal(source.deletedProfileAt,3000);
});

test('background sync uploads a verified profile deletion even when draws decrease',async () => {
  let runTick,uploaded=null;
  const meta={generation:'g1',customMetadata:{drawCount:'2',profileRevision:'1'},updated:'2026-09-23T00:00:00Z'};
  const ref={getMetadata:async()=>meta,put:async(blob,options)=>{
    uploaded=options.customMetadata;
    meta.generation='g2';meta.customMetadata=uploaded;meta.size=blob.size;
    return {metadata:{generation:'g2'}};
  }};
  const source={json:JSON.stringify({profiles:['Taiwan'],actualDraws:[{id:'a'}]}),
    count:1,profiles:1,profileRevision:2,deletedProfileAt:3000,signature:'deleted'};
  const context={
    window:{__lnCloudSyncBlocked:false,
      __lnCloudBaseline:{uid:'u',generation:'g1',count:2,profileRevision:1,signature:'original'},
      __lnReadCloudSource:async()=>source,
      __lnCloudProfileDeletionPending:(value)=>value.profileRevision===2,
      __lnPersistCloudAck:async()=>{} ,addEventListener(){}},
    document:{visibilityState:'visible',addEventListener(){}},
    firebase:{apps:[{}],auth:()=>({currentUser:{uid:'u'}}),storage:()=>({ref:()=>ref})},
    setInterval:fn=>{runTick=fn},setTimeout,Blob,console
  };
  vm.runInNewContext(fs.readFileSync(path.join(release,'cloud-sync.js'),'utf8'),context);
  await runTick();
  assert.equal(uploaded.drawCount,'1');
  assert.equal(uploaded.profileCount,'1');
  assert.equal(uploaded.profileRevision,'2');
});

test('reopening with old Cloud generation keeps a locally deleted profile pending',() => {
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const start=html.indexOf('function pendingProfileDeletion(');
  const end=html.indexOf('window.__lnCloudProfileDeletionPending=',start);
  assert.ok(start>0&&end>start);
  const fn=vm.runInNewContext(html.slice(start,end)+'; pendingProfileDeletion');
  const source={profileRevision:9,deletedProfileAt:Date.parse('2026-09-24T09:00:00Z')};
  const cloud={updated:'2026-09-24T08:00:00Z',customMetadata:{drawCount:'100'}};
  assert.equal(fn(source,cloud,{count:100}),true);
  assert.equal(fn(source,cloud,{profileRevision:9}),false);
  assert.equal(fn(source,{...cloud,customMetadata:{profileRevision:'10'}},{profileRevision:8}),false);
});
