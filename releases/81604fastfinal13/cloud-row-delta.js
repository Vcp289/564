/* Data-only sync planning. No Firebase writes occur in this module. */
(function(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LNCloudRowDelta = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function() {
  "use strict";
  const COLLECTIONS = ["profiles", "actualDraws", "records", "dailyTables"];

  function rowsById(rows, kind) {
    if (!Array.isArray(rows)) throw new Error(kind + " must be an array");
    const result = new Map();
    for (const row of rows) {
      if (!row || typeof row !== "object" || row.id === undefined || row.id === null || String(row.id) === "")
        throw new Error(kind + " contains a row without an id");
      const key = String(row.id);
      if (result.has(key)) throw new Error(kind + " contains duplicate id " + key);
      result.set(key, row);
    }
    return result;
  }

  function identical(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  // A missing row in the current state means a deletion, not an unchanged row.
  // Consumers must acknowledge each deletion explicitly on the server.
  function changedRows(previous, current) {
    const changes = [];
    for (const kind of COLLECTIONS) {
      const before = rowsById(previous[kind] || [], kind);
      const after = rowsById(current[kind] || [], kind);
      for (const [id, row] of after) {
        if (!before.has(id) || !identical(before.get(id), row))
          changes.push({kind, id, deleted:false, row});
      }
      for (const id of before.keys())
        if (!after.has(id)) changes.push({kind, id, deleted:true});
    }
    return changes;
  }

  // Merge only when both devices share an acknowledged ancestor. A conflicting
  // edit or delete stops the merge; callers must preserve both copies for review.
  function mergeThreeWay(ancestor, local, remote) {
    const merged = {...remote}, conflicts = [];
    for (const kind of COLLECTIONS) {
      const base = rowsById(ancestor[kind] || [], kind);
      const left = rowsById(local[kind] || [], kind);
      const right = rowsById(remote[kind] || [], kind);
      const output = new Map(right);
      for (const id of new Set([...base.keys(), ...left.keys(), ...right.keys()])) {
        const original = base.get(id), mine = left.get(id), theirs = right.get(id);
        const mineChanged = !identical(original, mine);
        const theirsChanged = !identical(original, theirs);
        if (mineChanged && theirsChanged && !identical(mine, theirs)) {
          conflicts.push({kind, id, local:mine, remote:theirs});
        } else if (mineChanged) {
          if (mine === undefined) output.delete(id);
          else output.set(id, mine);
        }
      }
      merged[kind] = [...output.values()];
    }
    return {merged:conflicts.length ? null : merged, conflicts};
  }

  return {COLLECTIONS, changedRows, mergeThreeWay};
});
