/* Push only changes derived from the Cloud version verified at sign-in.
   The durable IndexedDB snapshot is authoritative when localStorage is full. */
(function(){
  "use strict";
  if (typeof firebase === "undefined" || !firebase.apps || !firebase.apps.length) return;
  const CHECK_INTERVAL_MS = 180000; // 3 minutes
  let busy = false;
  async function tick() {
    if (busy || window.__lnCloudSyncBlocked || document.visibilityState === "hidden") return;
    const user = firebase.auth().currentUser;
    const baseline = window.__lnCloudBaseline;
    if (!user || !baseline || baseline.uid !== user.uid || !baseline.generation ||
        typeof window.__lnReadCloudSource !== "function") return;
    busy = true;
    try {
      const source = await window.__lnReadCloudSource();
      if (!source || source.count < baseline.count || source.signature === baseline.signature) return;
      const ref = firebase.storage().ref("userStates/" + user.uid + "/state.json");
      const meta = await ref.getMetadata();
      if (String(meta.generation || "") !== baseline.generation) {
        window.__lnCloudSyncBlocked = true;
        if (typeof window.__lnCheckCloudNow === "function") window.__lnCheckCloudNow();
        return;
      }
      const remoteCount = Number(meta.customMetadata && meta.customMetadata.drawCount);
      if (!Number.isFinite(remoteCount) || remoteCount > source.count) return;
      const payload = new Blob([source.json], {type:"application/json"});
      const result = await ref.put(payload, {
        contentType:"application/json",
        customMetadata:{drawCount:String(source.count),profileCount:String(source.profiles)}
      });
      const uploaded = await ref.getMetadata();
      if (!uploaded.generation || String(result.metadata && result.metadata.generation || "") !== String(uploaded.generation) ||
          Number(uploaded.size) !== payload.size ||
          Number(uploaded.customMetadata && uploaded.customMetadata.drawCount) !== source.count)
        throw new Error("Cloud draw count verification failed");
      if (typeof window.__lnPersistCloudAck === "function")
        await window.__lnPersistCloudAck(user, source, uploaded);
    } catch (error) {
      console.warn("[CloudSync] upload skipped or failed", error);
      if (typeof window.__lnReportCloudError === "function") window.__lnReportCloudError(error);
    } finally { busy = false; }
  }

  setInterval(tick, CHECK_INTERVAL_MS);
  window.addEventListener("ln-cloud-local-pending", () => setTimeout(tick, 15000));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tick();
  }, { passive: true });
})();
