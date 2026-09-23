/* Push only changes derived from the Cloud version verified at sign-in.
   The durable IndexedDB snapshot is authoritative when localStorage is full. */
(function(){
  "use strict";
  if (typeof firebase === "undefined" || !firebase.apps || !firebase.apps.length) return;
  const CHECK_INTERVAL_MS = 180000; // 3 minutes
  let busy = false;
  async function tick() {
    if (busy || window.__lnCloudSyncBlocked) return;
    const user = firebase.auth().currentUser;
    const baseline = window.__lnCloudBaseline;
    if (!user || !baseline || !baseline.generation || typeof window.__lnReadCloudSource !== "function") return;
    busy = true;
    try {
      const source = await window.__lnReadCloudSource();
      if (!source || source.count < baseline.count || source.signature === baseline.signature) return;
      const ref = firebase.storage().ref("userStates/" + user.uid + "/state.json");
      const meta = await ref.getMetadata();
      if (String(meta.generation || "") !== baseline.generation) return;
      const remoteCount = Number(meta.customMetadata && meta.customMetadata.drawCount);
      if (!Number.isFinite(remoteCount) || remoteCount > source.count) return;
      await ref.put(new Blob([source.json], {type:"application/json"}), {
        contentType:"application/json",
        customMetadata:{drawCount:String(source.count),profileCount:String(source.profiles)}
      });
      const uploaded = await ref.getMetadata();
      if (Number(uploaded.customMetadata && uploaded.customMetadata.drawCount) !== source.count)
        throw new Error("Cloud draw count verification failed");
      window.__lnCloudBaseline = {
        generation:String(uploaded.generation || ""),count:source.count,signature:source.signature
      };
    } catch (error) {
      console.warn("[CloudSync] upload skipped or failed", error);
    } finally { busy = false; }
  }

  setInterval(tick, CHECK_INTERVAL_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") tick();
  }, { passive: true });
})();
