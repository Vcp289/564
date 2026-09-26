const assert = require('node:assert/strict');
const test = require('node:test');
const {changedRows, mergeThreeWay} = require('../releases/81604fastfinal13/cloud-row-delta.js');

function state(rows = []) { return {profiles:[], actualDraws:rows, records:[], dailyTables:[]}; }
const a = {id:'a', profileId:1, date:'2026-09-21', number:'017'};
const b = {id:'b', profileId:1, date:'2026-09-22', number:'158'};

test('two devices adding different days keep both', () => {
  const result = mergeThreeWay(state(), state([a]), state([b]));
  assert.deepEqual(result.conflicts, []);
  assert.deepEqual(result.merged.actualDraws, [b,a]);
});
test('editing one day while another device adds a day keeps both', () => {
  const edit = {...a,number:'018'};
  const result = mergeThreeWay(state([a]), state([edit]), state([a,b]));
  assert.deepEqual(result.conflicts, []);
  assert.deepEqual(result.merged.actualDraws, [edit,b]);
});
test('different edits to same day stop instead of overwriting', () => {
  const result = mergeThreeWay(state([a]),state([{...a,number:'018'}]),state([{...a,number:'019'}]));
  assert.equal(result.merged,null);
  assert.deepEqual(result.conflicts.map(x => x.id), ['a']);
});
test('delete is retained and conflicts with an independent edit', () => {
  assert.deepEqual(changedRows(state([a]),state()),[{kind:'actualDraws',id:'a',deleted:true}]);
  const result = mergeThreeWay(state([a]),state(),state([{...a,number:'019'}]));
  assert.equal(result.merged,null);
  assert.equal(result.conflicts.length,1);
});
test('reject missing and duplicate identifiers before syncing', () => {
  assert.throws(() => changedRows(state(),state([{number:'1'}])),/without an id/);
  assert.throws(() => changedRows(state(),state([a,a])),/duplicate id/);
});
