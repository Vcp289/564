/* Ongoing cloud sync while the app is open. The initial pull-or-push
   decision at login time lives in index.html's auth-gate script (it must
   finish before that overlay closes); this file only pushes local changes
   up to Firestore afterward, so a slow/late load here never blocks boot. */
(function(){
  "use strict";
  if (typeof firebase === "undefined" || !firebase.apps || !firebase.apps.length) return;

  const STORAGE_KEY = "luckyNumberProV4_5";
  const db = firebase.firestore();
  let lastPushed = null;
  let busy = false;

  function drawCount(json) {
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed && parsed.actualDraws) ? parsed.actualDraws.length : 0;
    } catch (_) { return 0; }
  }

  // Never push a local copy that would REDUCE the cloud's record count — that's
  // the signature of a thin/stale local session (e.g. a browser that hasn't
  // caught up yet) silently clobbering a fuller copy another device pushed.
  // Read-before-write here on every tick trades a little extra latency for
  // that safety; the periodic 6s cadence already tolerates the round trip.
  function tick() {
    if (busy) return;
    const user = firebase.auth().currentUser;
    if (!user) return;
    let json = null;
    try { json = localStorage.getItem(STORAGE_KEY); } catch (_) { return; }
    if (!json || json === lastPushed) return;
    busy = true;
    const ref = db.collection("userStates").doc(user.uid);
    ref.get().then(snap => {
      const remoteJson = snap.exists ? snap.data().json : null;
      if (remoteJson && remoteJson !== json && drawCount(remoteJson) > drawCount(json)) {
        return; // cloud has moved ahead of this device; skip, don't clobber
      }
      return ref.set({
        json,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => { lastPushed = json; });
    }).catch(error => {
      console.warn("[CloudSync] push failed", error);
    }).then(() => { busy = false; });
  }

  setInterval(tick, 6000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tick();
  }, { passive: true });
})();
