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

  function tick() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    let json = null;
    try { json = localStorage.getItem(STORAGE_KEY); } catch (_) { return; }
    if (!json || json === lastPushed) return;
    db.collection("userStates").doc(user.uid).set({
      json,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => { lastPushed = json; }).catch(error => {
      console.warn("[CloudSync] push failed", error);
    });
  }

  setInterval(tick, 6000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tick();
  }, { passive: true });
})();
