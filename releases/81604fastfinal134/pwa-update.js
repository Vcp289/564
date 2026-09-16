/* One update owner: never navigate before the new worker is fully installed. */
(() => {
  if (!('serviceWorker' in navigator)) return;
  window.__lnShellRegistrationScheduled = true;
  const build = document.querySelector('meta[name="app-build"]').content;
  let registration, checking, lastCheck = 0, reloading = false;
  function controllerBuild() {
    return new Promise(resolve => {
      const worker = navigator.serviceWorker.controller;
      if (!worker) return resolve(null);
      const channel = new MessageChannel();
      const timer = setTimeout(() => { channel.port1.close(); resolve(null); }, 2000);
      channel.port1.onmessage = e => { clearTimeout(timer); channel.port1.close(); resolve(e.data?.build); };
      worker.postMessage({type:'GET_BUILD'}, [channel.port2]);
    });
  }
  async function adoptUpdate() {
    if (reloading || document.visibilityState === 'hidden') return;
    const next = await controllerBuild();
    if (!next || next === build) return; // First installation does not reload.
    if (document.querySelector('.modal-open') || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '') ||
        (typeof userInteractionHot === 'function' && userInteractionHot(2000))) {
      setTimeout(adoptUpdate, 2500); return;
    }
    reloading = true;
    try {
      if (typeof commitStateDurably === 'function') await commitStateDurably();
      location.reload();
    } catch (_) { reloading = false; }
  }
  navigator.serviceWorker.addEventListener('controllerchange', adoptUpdate);
  window.__lnCheckForUpdate = function(force = false) {
    if (checking) return checking;
    if (!navigator.onLine || (!force && Date.now()-lastCheck < 60000)) return Promise.resolve(false);
    lastCheck = Date.now();
    checking = (async () => {
      registration ||= await navigator.serviceWorker.register('sw.js', {scope:'./', updateViaCache:'none'});
      await registration.update();
      await adoptUpdate();
      return true;
    })().catch(() => false).finally(() => { checking = null; });
    return checking;
  };
  window.addEventListener('load', () => { setTimeout(() => window.__lnCheckForUpdate(), 1500); }, {once:true});
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { void adoptUpdate(); void window.__lnCheckForUpdate(); }
  });
  window.addEventListener('online', () => window.__lnCheckForUpdate(true));
})();
