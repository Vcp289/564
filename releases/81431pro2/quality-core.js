/* LuckyNumber Pro Quality Core — isolated, dependency-free policy helpers.
 * This file deliberately has no access to the DOM at load time.  It provides one
 * auditable source for accuracy labels, URL policy, lightweight data-health checks,
 * and deterministic self-tests.  Feature code may consume it, but it must not mutate
 * History, formulas, or user data.
 */
(function(global){
  'use strict';
  const BUILD='81431pro2';
  const READY=new Set(['exact','reversed','swap','miss']);
  const normalize=value=>{
    const s=String(value||'pending').toLowerCase();
    if(s==='hit') return 'exact';
    if(s==='reverse'||s==='rev') return 'reversed';
    if(s==='notfound'||s==='not_found'||s==='nohit'||s==='no-hit') return 'miss';
    return READY.has(s)?s:'pending';
  };
  const isExact=value=>normalize(value)==='exact';
  const isVariant=value=>['reversed','swap'].includes(normalize(value));
  const summarize=values=>{
    const rows=(values||[]).map(normalize).filter(v=>v!=='pending');
    const total=rows.length, exact=rows.filter(v=>v==='exact').length;
    const variants=rows.filter(v=>v==='reversed'||v==='swap').length;
    const percent=n=>total?Math.round(n*1000/total)/10:0;
    return Object.freeze({total,exact,variants,miss:rows.filter(v=>v==='miss').length,
      exactRate:percent(exact),variantRate:percent(variants),expandedRate:percent(exact+variants)});
  };
  function validateSyncUrl(raw){
    let url;
    const text=String(raw||'').trim();
    // URL is standard in browsers.  The small fallback keeps the policy testable in
    // JavaScriptCore shells used by CI without weakening the browser validation.
    if(typeof URL!=='function'){
      const match=text.match(/^https:\/\/([^\/?#]+)(\/[^\s]*)?$/i);
      if(!match) return {ok:false,reason:'URL ไม่ถูกต้อง'};
      if(match[1].includes('@')) return {ok:false,reason:'URL ต้องไม่มี username หรือ password'};
      return {ok:true,url:text,origin:`https://${match[1]}`};
    }
    try{url=new URL(text);}catch(_){return {ok:false,reason:'URL ไม่ถูกต้อง'};}
    if(url.protocol!=='https:') return {ok:false,reason:'Web Sync อนุญาตเฉพาะ HTTPS เพื่อป้องกันการดักแปลงข้อมูล'};
    if(url.username||url.password) return {ok:false,reason:'URL ต้องไม่มี username หรือ password'};
    return {ok:true,url:url.toString(),origin:url.origin};
  }
  function health(state){
    const draws=Array.isArray(state?.actualDraws)?state.actualDraws:[];
    const complete=draws.filter(d=>/^\d{3}$/.test(String(d?.number||''))&&/^\d{2}$/.test(String(d?.twoDigit||''))).length;
    const invalid=draws.length-complete;
    const duplicateKeys=new Set(), duplicates=new Set();
    draws.forEach(d=>{const key=`${Number(d?.profileId||0)}|${String(d?.date||'')}`;if(duplicateKeys.has(key))duplicates.add(key);duplicateKeys.add(key);});
    return Object.freeze({build:BUILD,profiles:Array.isArray(state?.profiles)?state.profiles.length:0,
      draws:draws.length,complete,invalid,duplicateDates:duplicates.size,
      healthy:invalid===0&&duplicates.size===0});
  }
  function selfTest(){
    const s=summarize(['exact','reversed','swap','miss','pending']);
    const checks=[s.total===4,s.exactRate===25,s.variantRate===50,s.expandedRate===75,
      validateSyncUrl('https://example.com/a').ok,!validateSyncUrl('http://example.com').ok,
      !validateSyncUrl('https://u:p@example.com').ok];
    return Object.freeze({ok:checks.every(Boolean),checks:checks.length,build:BUILD});
  }
  global.LuckyProQuality=Object.freeze({BUILD,normalize,isExact,isVariant,summarize,validateSyncUrl,health,selfTest});
})(globalThis);
