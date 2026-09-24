/* Keep the Settings badge aligned with the deployed build metadata. */
(function(){
  "use strict";
  var app=document.getElementById("app");
  if(!app)return;
  var display=String(document.title||"").replace(/^365\s*/,"").trim();
  var pending=false;
  function update(){
    pending=false;
    var badge=app.querySelector(".settings-app-version");
    if(badge&&display&&badge.textContent!==display)badge.textContent=display;
  }
  // render() replaces #app's children; avoid observing the entire History table.
  var observer=new MutationObserver(function(){
    if(!pending){pending=true;queueMicrotask(update);}
  });
  observer.observe(app,{childList:true});
  update();
  var meta=document.querySelector('meta[name="app-build"]');
  var build=meta?meta.content:"";
  fetch("version.json?b="+encodeURIComponent(build),{cache:"no-store"})
    .then(function(response){if(!response.ok)throw new Error("Version HTTP "+response.status);return response.json();})
    .then(function(data){
      if(String(data.build||"")!==build)return;
      display=String(data.displayVersion||data.version||display);
      update();
    }).catch(function(){/* The page title still supplies the current version. */});
})();
