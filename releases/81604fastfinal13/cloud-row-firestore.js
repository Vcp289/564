/* Explicitly opt-in Firestore transport. The legacy Storage writer must be
   disabled for an account before this can become its authoritative store. */
(function(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LNCloudRowFirestore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function() {
  "use strict";
  const KINDS = new Set(["profiles", "actualDraws", "records", "dailyTables"]);

  function encodeId(value) {
    const bytes = new TextEncoder().encode(String(value));
    const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join("");
    const base64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(bytes).toString("base64");
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function collection(db, uid) {
    if (!uid || /\//.test(uid)) throw new Error("Invalid authenticated user id");
    return db.collection("users").doc(uid).collection("rows");
  }
  function ref(db, uid, kind, id) {
    if (!KINDS.has(kind) || id === undefined || id === null || String(id) === "")
      throw new Error("Invalid row address");
    return collection(db, uid).doc(kind + "~" + encodeId(id));
  }
  function same(a,b) { return JSON.stringify(a) === JSON.stringify(b); }

  // lastSeen is a Firestore Timestamp from the previous poll. >= deliberately
  // re-reads ties at the boundary: it cannot silently skip same-time updates.
  async function changesSince(db, uid, lastSeen) {
    let query = collection(db,uid).orderBy("updatedAt");
    if (lastSeen) query = query.startAt(lastSeen);
    const snapshot = await query.get({source:"server"});
    const changes = snapshot.docs.map(doc => {
      const data = doc.data();
      if (!KINDS.has(data.kind) || !data.id) throw new Error("Invalid cloud row " + doc.id);
      return {kind:data.kind,id:data.id,deleted:data.deleted === true,
        row:data.deleted ? undefined : data.row,revision:data.revision,
        updatedAt:data.updatedAt};
    });
    return {changes,lastSeen:changes.length ? changes[changes.length-1].updatedAt : lastSeen};
  }

  // Each update compares the server's previous revision AND row value before
  // writing. Concurrent edits/deletions to the same row cannot overwrite one
  // another. A failed transaction leaves the caller's local row unchanged.
  async function writeChange(db, uid, change, expected, serverTimestamp) {
    if (typeof serverTimestamp !== "function") throw new Error("A Firestore server timestamp factory is required");
    const doc = ref(db,uid,change.kind,change.id);
    return db.runTransaction(async transaction => {
      const current = await transaction.get(doc);
      const prior = current.exists ? current.data() : null;
      const actualRevision = prior ? prior.revision : null;
      const expectedRevision = expected ? expected.revision : null;
      if (actualRevision !== expectedRevision ||
          (expected && !same(prior && prior.row, expected.row)) ||
          (expected && !!(prior && prior.deleted) !== !!expected.deleted)) {
        const error = new Error("Cloud row changed on another device: " + change.kind + "/" + change.id);
        error.code = "cloud/row-conflict";
        throw error;
      }
      const nextRevision = (Number(actualRevision)||0) + 1;
      transaction.set(doc,{kind:change.kind,id:String(change.id),
        deleted:change.deleted === true,
        row:change.deleted ? null : change.row,
        revision:nextRevision,updatedAt:serverTimestamp()});
      return nextRevision;
    });
  }
  return {encodeId,changesSince,writeChange};
});
