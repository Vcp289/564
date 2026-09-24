const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const start = html.indexOf('var compatFiles=[');
const end = html.indexOf('await ensureFirebaseCompat();',start);
assert.ok(start > 0 && end > start);
const sdkSetup = html.slice(start,end + 'await ensureFirebaseCompat();'.length);

function run(available, fail) {
  const loaded = [];
  const context = {
    firebase:{initializeApp() {}, apps:[]},
    Date, setTimeout, clearTimeout,
    document:{head:{appendChild(script) {
      loaded.push(script.src);
      queueMicrotask(() => {
        if (fail) return script.onerror();
        const kind = script.src.match(/firebase-(app|auth|storage)-compat/)[1];
        if (kind === 'auth') context.firebase.auth = () => ({});
        if (kind === 'storage') context.firebase.storage = () => ({});
        script.onload();
      });
    }},createElement(){return {remove(){}}}}
  };
  for (const kind of available) context.firebase[kind] = () => ({});
  return {loaded,promise:vm.runInNewContext('(async()=>{' + sdkSetup + '})()',context)};
}

test('repairs a partially loaded Firebase SDK in dependency order',async () => {
  const result=run(['auth'],false);
  await result.promise;
  assert.equal(result.loaded.length,1);
  assert.match(result.loaded[0],/firebase-storage-compat/);
});
test('fails clearly when both retry sources fail',async () => {
  const result=run([],true);
  await assert.rejects(result.promise,/firebase-auth-compat.js.*SDK load failed/);
  assert.equal(result.loaded.length,2);
});
