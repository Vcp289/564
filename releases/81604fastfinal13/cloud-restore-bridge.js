"use strict";

(function installCloudRestoreBridge(){
  const MAIN_KEY="luckyNumberProV4_5";
  const SOURCE_KEY="luckyNumberProV4_5_history_source_v70962";
  const PROFILE_JOURNAL_KEY_CLOUD="luckyNumberProV4_5_profile_journal_v1";
  const HISTORY_ROW_JOURNAL_KEY_CLOUD="luckyNumberProV4_5_history_row_journal_v72408";

  function cloudRestoreError(message,cause){
    const error=new Error(message);
    error.name="CloudRestoreError";
    if(cause)error.cause=cause;
    return error;
  }

  // The main localStorage mirror can fail when History grows beyond the browser
  // quota. Always include the durable state when choosing a Cloud source.
  window.__lnReadCloudSource=async function readCloudSource(){
    window.__lnCloudReadStage="อ่าน IndexedDB ครั้งแรก";
    const stored=typeof readIndexedState==="function"?await readIndexedState():null;
    window.__lnCloudReadStage="เปรียบเทียบข้อมูลที่บันทึก";
    let mirror=null;
    try{mirror=JSON.parse(localStorage.getItem(MAIN_KEY)||"null")}catch(_){}
    let historySource=null;
    try{historySource=JSON.parse(localStorage.getItem(SOURCE_KEY)||"null")}catch(_){}
    const count=value=>Array.isArray(value?.actualDraws)?value.actualDraws.length:0;
    const revision=value=>Math.max(0,Number(value?._profileRevision||0));
    // A profile deletion lowers History count. An older mirror with more rows
    // must never outrank the newer, durable deletion.
    const newer=(candidate,previous)=>!!candidate&&(!previous||
      revision(candidate)>revision(previous)||
      revision(candidate)===revision(previous)&&count(candidate)>count(previous));
    let best=stored;
    if(newer(mirror,best))best=mirror;
    // A recent, committed in-memory edit may still be waiting for the IDB timer.
    if(typeof state!=="undefined"&&newer(state,best)){
      window.__lnCloudReadStage="บันทึกข้อมูลล่าสุดลงเครื่อง";
      if(typeof commitStateDurably!=="function"||!await commitStateDurably()){
        throw cloudRestoreError("ยังบันทึกข้อมูลล่าสุดลงเครื่องไม่สำเร็จ จึงหยุดซิงก์ Cloud");
      }
      window.__lnCloudReadStage="ตรวจข้อมูลหลังบันทึก";
      best=await readIndexedState();
    }
    if(count(historySource)>count(best)||revision(historySource)>revision(best)){
      // The History checkpoint may be newer than IndexedDB on a cold start.
      // Wait for the app's normal recovery before deciding which snapshot to sync.
      window.__lnCloudReadStage="รอการกู้ History";
      const until=Date.now()+25000;
      while(!window.__lnPostHydrationSettled&&Date.now()<until){
        await new Promise(resolve=>setTimeout(resolve,100));
      }
      if(typeof state!=="undefined"&&newer(state,best)){
        if(typeof commitStateDurably!=="function"||!await commitStateDurably()){
          throw cloudRestoreError("บันทึก History ที่กู้คืนลงเครื่องไม่สำเร็จ จึงหยุดซิงก์ Cloud");
        }
        best=await readIndexedState();
      }
      if((count(historySource)>count(best)||revision(historySource)>revision(best))&&window.__lnPostHydrationSettled&&
         typeof state!=="undefined"&&typeof mergeRecoveredHistory==="function"){
        const recovered=mergeRecoveredHistory(state,historySource,"Cloud:history-source-checkpoint");
        if(revision(recovered)>=revision(historySource)&&
           (revision(historySource)>revision(best)||count(recovered)>=count(historySource))){
          state=recovered;
          if(typeof commitStateDurably!=="function"||!await commitStateDurably()){
            throw cloudRestoreError("บันทึก History ที่กู้คืนลงเครื่องไม่สำเร็จ จึงหยุดซิงก์ Cloud");
          }
          best=await readIndexedState();
          try{if(typeof refreshCurrentViewIfDataChanged==="function")refreshCurrentViewIfDataChanged("cloud-history-recovered")}catch(_){}
        }
      }
      if(count(historySource)>count(best)||revision(historySource)>revision(best)){
        throw cloudRestoreError("History หรือการลบ Profile ในเครื่องยังไม่ได้บันทึกครบ กรุณาสำรองข้อมูลก่อนซิงก์ Cloud");
      }
    }
    if(!best)return null;
    window.__lnCloudReadStage="สร้างสำเนาข้อมูลสำหรับ Cloud";
    const json=JSON.stringify(best);
    if(!json)throw cloudRestoreError("อ่านข้อมูลที่บันทึกในเครื่องไม่สำเร็จ");
    let deletedProfileAt=0;
    try{
      const journal=JSON.parse(localStorage.getItem(PROFILE_JOURNAL_KEY_CLOUD)||"[]");
      if(Array.isArray(journal))for(const op of journal){
        if(op?.type!=="delete"||revision(best)<Number(op.revision||0)||
           JSON.stringify(op.afterProfiles)!==JSON.stringify(best.profiles))continue;
        deletedProfileAt=Math.max(deletedProfileAt,Number(op.updatedAt||0));
      }
    }catch(_){}
    window.__lnCloudReadStage="อ่านข้อมูลในเครื่องเสร็จ";
    return{json,count:count(best),profiles:Array.isArray(best.profiles)?best.profiles.length:0,
      profileRevision:revision(best),deletedProfileAt,
      signature:window.__lnCloudSignature(best)};
  };
  // Compare authoritative rows/settings, not volatile UI state or generated AI caches.
  window.__lnCloudSignature=function cloudSignature(value){
    return JSON.stringify({profiles:value.profiles||[],actualDraws:value.actualDraws||[],
      records:value.records||[],dailyTables:(value.dailyTables||[]).map(row=>[
        row.id,row.profileId,row.date,row.sourceActualDrawId,row.updatedAt,row.inputNumber
      ]),
      rankingConfig:value.rankingConfig||{},masterAISettings:value.masterAISettings||{}});
  };

  window.__lnRestoreCloudState=async function restoreCloudState(rawJson){
    if(typeof rawJson!=="string"||!rawJson.trim()){
      throw cloudRestoreError("ไฟล์ข้อมูลบน Cloud ว่างเปล่า");
    }

    let parsed;
    try{
      parsed=JSON.parse(rawJson);
    }catch(error){
      throw cloudRestoreError("ไฟล์ข้อมูลบน Cloud ไม่ใช่ JSON ที่ถูกต้อง",error);
    }

    if(typeof validateBackupEnvelope!=="function"||typeof restoreJsonBackupFast!=="function"){
      throw cloudRestoreError("ระบบกู้ข้อมูลของแอปยังโหลดไม่ครบ กรุณาลองใหม่");
    }

    const validated=await validateBackupEnvelope(parsed);
    const expectedDraws=Array.isArray(validated?.data?.actualDraws)?validated.data.actualDraws.length:0;
    const expectedProfiles=Array.isArray(validated?.data?.profiles)?validated.data.profiles.length:0;
    const result=await restoreJsonBackupFast(parsed,{validated:validated,skipConfirm:true});
    if(!result)throw cloudRestoreError("การกู้ข้อมูลจาก Cloud ถูกยกเลิก");

    if(result.durablePromise)await result.durablePromise;
    if(typeof commitStateDurably!=="function"||!await commitStateDurably()){
      throw cloudRestoreError("บันทึกข้อมูล Cloud ลงฐานข้อมูลถาวรไม่สำเร็จ");
    }

    const stored=typeof readIndexedState==="function"?await readIndexedState():null;
    const storedDraws=Array.isArray(stored?.actualDraws)?stored.actualDraws.length:-1;
    const storedProfiles=Array.isArray(stored?.profiles)?stored.profiles.length:-1;
    if(!stored||storedDraws!==expectedDraws||(expectedProfiles>0&&storedProfiles!==expectedProfiles)){
      throw cloudRestoreError("ตรวจสอบข้อมูลหลังบันทึกไม่ผ่าน (Cloud "+expectedDraws+" งวด / เครื่อง "+Math.max(0,storedDraws)+" งวด)");
    }

    let mainSaved=false;
    try{
      const compact=typeof serializeLocalStorageMainState==="function"?serializeLocalStorageMainState(state):"";
      mainSaved=!!compact&&typeof writeLocalStorageWithReclaim==="function"&&writeLocalStorageWithReclaim(MAIN_KEY,compact);
    }catch(error){
      console.warn("Cloud restore localStorage mirror skipped",error);
    }
    if(!mainSaved){
      try{localStorage.removeItem(MAIN_KEY)}catch(_){}
    }

    let sourceSaved=false;
    try{
      sourceSaved=typeof writeHistorySourceSyncCheckpointFast==="function"&&writeHistorySourceSyncCheckpointFast(state);
    }catch(error){
      console.warn("Cloud restore History checkpoint skipped",error);
    }
    if(!sourceSaved){
      try{localStorage.removeItem(SOURCE_KEY)}catch(_){}
    }

    try{localStorage.removeItem(PROFILE_JOURNAL_KEY_CLOUD)}catch(_){}
    try{localStorage.removeItem(HISTORY_ROW_JOURNAL_KEY_CLOUD)}catch(_){}
    try{
      if(typeof deleteIndexedValue==="function"&&typeof HISTORY_ROW_JOURNAL_INDEXED_KEY!=="undefined"){
        await deleteIndexedValue(HISTORY_ROW_JOURNAL_INDEXED_KEY);
      }
    }catch(error){
      console.warn("Cloud restore old row journal cleanup skipped",error);
    }

    return{
      draws:storedDraws,
      profiles:storedProfiles,
      mainSaved:mainSaved,
      sourceSaved:sourceSaved
    };
  };
})();
