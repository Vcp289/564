/* Ongoing cloud sync while the app is open. The initial pull-or-push
   decision at login time lives in index.html's auth-gate script (it must
   finish before that overlay closes); this file only pushes local changes
   up to Firebase Storage afterward, so a slow/late load here never blocks
   boot. State blobs here can be tens to hundreds of MB (real user data
   observed at ~170MB), so this intentionally polls far less often than a
   typical "sync every few seconds" pattern would — re-uploading a payload
   that size every 6s would be wasteful of both bandwidth and battery. */
(function(){
  "use strict";
  if (typeof firebase === "undefined" || !firebase.apps || !firebase.apps.length) return;

  const STORAGE_KEY = "luckyNumberProV4_5";
  const CHECK_INTERVAL_MS = 180000; // 3 minutes
  let lastPushed = null;
  let busy = false;

  function drawCount(json) {
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed && parsed.actualDraws) ? parsed.actualDraws.length : 0;
    } catch (_) { return 0; }
  }

  function fileRef(uid) {
    return firebase.storage().ref("userStates/" + uid + "/state.json");
  }

  // Never push a local copy that would REDUCE the cloud's record count — that's
  // the signature of a thin/stale local session (e.g. a browser that hasn't
  // caught up yet) silently clobbering a fuller copy another device pushed.
  // getMetadata() is a cheap call (no file content downloaded) so this guard
  // stays fast even though the file itself can be huge.
  function tick() {
    if (busy) return;
    const user = firebase.auth().currentUser;
    if (!user) return;
    let json = null;
    try { json = localStorage.getItem(STORAGE_KEY); } catch (_) { return; }
    if (!json || json === lastPushed) return;
    busy = true;
    const ref = fileRef(user.uid);
    const localCount = drawCount(json);
    ref.getMetadata().then(meta => {
      const remoteCount = Number((meta.customMetadata && meta.customMetadata.drawCount) || 0);
      if (remoteCount > localCount) return; // cloud has moved ahead; skip, don't clobber
      return ref.putString(json, "raw", {
        contentType: "application/json",
        customMetadata: { drawCount: String(localCount) }
      }).then(() => { lastPushed = json; });
    }).catch(error => {
      if (error && error.code === "storage/object-not-found") {
        return ref.putString(json, "raw", {
          contentType: "application/json",
          customMetadata: { drawCount: String(localCount) }
        }).then(() => { lastPushed = json; }).catch(err2 => {
          console.warn("[CloudSync] initial push failed", err2);
        });
      }
      console.warn("[CloudSync] push failed", error);
    }).then(() => { busy = false; });
  }

  setInterval(tick, CHECK_INTERVAL_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") tick();
  }, { passive: true });
})();
