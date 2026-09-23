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
