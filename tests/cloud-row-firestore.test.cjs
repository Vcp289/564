const assert = require('node:assert/strict');
const test = require('node:test');
const {encodeId,writeChange,changesSince} = require('../releases/81604fastfinal13/cloud-row-firestore.js');

function fakeDb(existing) {
  let written;
  const doc = {path:'row', get written() {return written}};
  const db = {
    collection:() => ({doc:() => ({collection:() => ({doc:() => doc,
      orderBy:() => ({startAt:() => ({get:async() => ({docs:[]})})})})})}),
    runTransaction:async callback => callback({
      get:async () => ({exists:!!existing,data:() => existing}),
      set:(_doc,value) => {written=value}
    })
  };
  return {db,doc};
}

test('encodes row IDs safely for document paths', () => {
  assert.match(encodeId('21 ก.ย./a'),/^[A-Za-z0-9_-]+$/);
  assert.notEqual(encodeId('a/b'),encodeId('a_b'));
});
test('creates a revisioned row using server time',async () => {
  const {db,doc}=fakeDb(null);
  assert.equal(await writeChange(db,'user',{kind:'actualDraws',id:'a',row:{id:'a'},deleted:false},null,()=> 'SERVER'),1);
  assert.equal(doc.written.revision,1);
  assert.equal(doc.written.updatedAt,'SERVER');
});
test('refuses a stale edit and keeps deletion explicit',async () => {
  const {db,doc}=fakeDb({revision:2,row:{id:'a',number:'22'},deleted:false});
  await assert.rejects(writeChange(db,'user',{kind:'actualDraws',id:'a',deleted:true},{revision:1,row:{id:'a',number:'11'},deleted:false},()=> 'SERVER'),{code:'cloud/row-conflict'});
  assert.equal(doc.written,undefined);
});
