/* X4 2D v1: reuse the five ranked 3D columns; never train or rebuild X4 here. */
(function (root) {
  'use strict';
  const rule = 'x4-columns-4-5-all-cell-pairs-v1';
  function canonical(value) {
    const text = String(value ?? '');
    return /^\d{2}$/.test(text) ? text.split('').sort().join('') : null;
  }
  function fromGrid(grid) {
    if (!Array.isArray(grid) || grid.length !== 3 || grid.some(row =>
      !Array.isArray(row) || row.length !== 5 || row.some(n => !/^\d$/.test(String(n))))) return null;
    const cells = grid.flatMap((row, r) => [3, 4].map(c => ({digit:String(row[c]), row:r, column:c})));
    const pairs = new Map();
    for (let i=0; i<cells.length; i++) for (let j=i+1; j<cells.length; j++) {
      const number = canonical(cells[i].digit + cells[j].digit);
      if (!pairs.has(number)) pairs.set(number, {number, occurrences:0, positions:[]});
      const pair = pairs.get(number);
      pair.occurrences++;
      pair.positions.push([cells[i], cells[j]]);
    }
    // Top means position frequency, not a probability or confidence score.
    return [...pairs.values()].sort((a,b) => b.occurrences-a.occurrences || a.number.localeCompare(b.number));
  }
  function fromItems(items) {
    if (!Array.isArray(items) || items.length < 5) return null;
    const numbers = items.slice(0,5).map(item => String(item?.number ?? item ?? ''));
    if (numbers.some(n => !/^\d{3}$/.test(n))) return null;
    return fromGrid([0,1,2].map(r => numbers.map(n => Number(n[r]))));
  }
  function expand(pairs) {
    const numbers = new Set();
    for (const item of pairs || []) {
      const pair = canonical(item?.number ?? item);
      if (pair === null) continue;
      numbers.add(pair); numbers.add(pair[1]+pair[0]);
    }
    return [...numbers].sort();
  }
  function matches(pairs, outcome) {
    const number = canonical(outcome);
    return number !== null && (pairs || []).some(item => canonical(item?.number ?? item) === number);
  }
  function fromSnapshot(snapshot, draw, profileId) {
    if (!snapshot || !draw || Number(snapshot.profileId) !== Number(profileId) ||
      Number(draw.profileId ?? 0) !== Number(profileId) || snapshot.targetDate !== draw.date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(snapshot.sourceTableDate || '') ||
      snapshot.sourceTableDate >= draw.date || !Number(snapshot.createdAt) ||
      !Number(draw.createdAt || draw.updatedAt) ||
      Number(snapshot.createdAt) >= Number(draw.createdAt || draw.updatedAt)) return null;
    return fromItems(snapshot.x4Items);
  }
  root.LuckyTwoDigit = Object.freeze({rule, canonical, fromGrid, fromItems, expand, matches, fromSnapshot});
  if (typeof module === 'object' && module.exports) module.exports = root.LuckyTwoDigit;
})(typeof window === 'object' ? window : globalThis);

/* These UI functions use the existing app's state, modal and cached X4 table. */
function twoDigitSnapshotIndex(profileId) {
  const index=new Map();
  for (const table of state.dailyTables || []) {
    const snapshot=table?.predictionSnapshot;
    if (!snapshot || Number(table.profileId)!==Number(profileId) || Number(snapshot.profileId)!==Number(profileId)) continue;
    const key=String(snapshot.targetDate || '');
    if (!index.has(key)) index.set(key,[]);
    index.get(key).push({tableId:table.id,snapshot:{...snapshot,sourceTableDate:snapshot.sourceTableDate || table.date}});
  }
  return index;
}
function twoDigitHistoryEvidence(draw, profileId, index=twoDigitSnapshotIndex(profileId)) {
  if (!/^\d{2}$/.test(String(draw?.twoDigit || ''))) return null;
  const candidates=(index.get(draw.date) || []).filter(entry=>!draw.referenceTableId || entry.tableId===draw.referenceTableId)
    .sort((a,b)=>Number(b.snapshot.createdAt)-Number(a.snapshot.createdAt));
  for (const entry of candidates) {
    const pairs=LuckyTwoDigit.fromSnapshot(entry.snapshot,draw,profileId);
    if (pairs!==null) return {pairs,hit:LuckyTwoDigit.matches(pairs,draw.twoDigit)};
  }
  return null;
}
function twoDigitHistoryBadge(draw, profileId, index) {
  const evidence = twoDigitHistoryEvidence(draw,profileId,index);
  const status = evidence === null ? 'pending' : evidence.hit ? 'exact' : 'notfound';
  return `<small class="two-digit-history-status ${status}" title="X4 2 ตัว • Snapshot ก่อนบันทึกผล • นับเลขกลับเป็นคู่เดียว">2D ${evidence === null ? '—' : evidence.hit ? 'Hit' : 'Miss'}</small>`;
}
function twoDigitSummary(profileId, draws) {
  let checked=0, hit=0, pending=0, pairTotal=0;
  const index=twoDigitSnapshotIndex(profileId);
  for (const draw of draws) {
    const evidence = twoDigitHistoryEvidence(draw,profileId,index);
    if (!evidence) {pending++;continue;}
    checked++; hit += Number(evidence.hit); pairTotal += evidence.pairs.length;
  }
  return {checked,hit,pending,rate:checked ? hit*100/checked : null,average:checked ? pairTotal/checked : null};
}
function renderTwoDigitAnalysis(profileId) {
  const all=(state.actualDraws || []).filter(d=>Number(d.profileId ?? 0)===Number(profileId));
  // A separate all-history summary keeps its scope explicit alongside the old
  // analysis range controls; no expensive historical prediction reconstruction.
  const s=twoDigitSummary(profileId,all);
  return `<section class="card two-digit-analysis"><div class="ux-result-head"><div><small>X4 · 2 ตัว · ทั้งหมด</small><h3>ผลทายคอลัมน์ 4–5</h3></div><b>${s.rate===null?'—':s.rate.toFixed(1)+'%'}</b></div><p>ถูก ${s.hit} / ตรวจแล้ว ${s.checked} งวด · รอ Snapshot ${s.pending} งวด</p><p class="theme-help">เฉลี่ย ${s.average===null?'—':s.average.toFixed(2)} คู่/งวด · 05 = 50 · นับเฉพาะ Snapshot ก่อนบันทึกผล · สถิติแยกจาก 3 ตัว</p></section>`;
}
function openTwoDigitResults(searchValue='',limit=0,bet=1) {
  const id=Number(state.activeProfile), table=getCalculatorEngineTable(id,'x4');
  const pairs=LuckyTwoDigit.fromGrid(table?.grid);
  if (pairs===null) {showModal(`<div class="modal-head"><div><h2>ผลลัพธ์ 2 ตัว</h2><p>X4 ยังไม่มีตารางครบ 5 คอลัมน์สำหรับงวดนี้</p></div><button class="icon-btn" data-close>×</button></div>`);return;}
  const selected = limit ? pairs.slice(0,limit) : pairs;
  const expanded=LuckyTwoDigit.expand(selected), amount=[1,2,3,5,10,20].includes(Number(bet))?Number(bet):1;
  const query=String(searchValue).replace(/\D/g,'').slice(0,2);
  showModal(`<div class="modal-head"><div><h2>ผลลัพธ์ 2 ตัว</h2><p>${escapeHtml(state.profiles[id] || 'Profile')} · X4 · คอลัมน์ 4–5</p></div><button class="icon-btn" data-close>×</button></div>
    <div class="l-engine-tabs"><button class="l-engine-tab active" type="button">X4 <small>${pairs.length} คู่</small></button></div>
    <div class="two-digit-summary"><b>${pairs.length} คู่ไม่ซ้ำ</b><p>จับคู่ทั้งช่องติดกันและไม่ติดกัน · 05 = 50 · สูงสุด 15 คู่</p><small>Top เรียงตามจำนวนคู่ตำแหน่งที่พบ ไม่ใช่ความมั่นใจ</small><hr><b>${selected.length} คู่ที่เลือก · กลับเลขแล้ว ${expanded.length} ชุด</b><div class="two-digit-bet-options">${[1,2,3,5,10,20].map(n=>`<button type="button" class="l-rank-tab ${amount===n?'active':''}" data-two-bet="${n}">${n} บ.</button>`).join('')}</div><p>รวมเดิมพัน <b>${expanded.length*amount} บาท</b> (${expanded.length} ชุด × ${amount} บาท/เลข)</p></div>
    <div class="l-rank-tabs">${[[0,'ทั้งหมด'],[10,'Top 10'],[5,'Top 5'],[3,'Top 3']].map(([n,label])=>`<button class="l-rank-tab ${Number(limit)===n?'active':''}" data-two-limit="${n}">${label}</button>`).join('')}</div>
    <div class="l-search-wrap"><span>🔎</span><input id="twoDigitSearch" class="l-search-input" type="text" readonly maxlength="2" data-numeric-keypad="true" placeholder="ค้นหาเลข เช่น 05 หรือ 50" value="${escapeHtml(query)}"><button id="clearTwoDigitSearch" class="search-clear" type="button">Clear</button></div>
    <div class="l-result-grid ai-ranked-grid ux-candidate-grid compact-three-column" id="twoDigitCards">${selected.map(item=>`<button class="l-number ai-ranked-number" type="button" data-two-pair="${item.number}"><div class="candidate-card-top"><em class="confidence-badge medium">X4 · 2D</em></div><b>${item.number}</b><small>${item.occurrences} คู่ตำแหน่ง</small></button>`).join('')}</div><p id="twoDigitEmpty" class="theme-help" hidden>ไม่พบคู่เลขในรายการที่เลือก</p>`);
  const input=document.getElementById('twoDigitSearch');
  const applySearch=()=>{
    const q=input.value.replace(/\D/g,'').slice(0,2);let shown=0;
    document.querySelectorAll('[data-two-pair]').forEach(card=>{const n=card.dataset.twoPair;const visible=!q || (q.length===2?LuckyTwoDigit.canonical(q)===n:n.includes(q));card.hidden=!visible;if(visible)shown++;});
    document.getElementById('twoDigitEmpty').hidden=shown>0;
  };
  input.addEventListener('input',applySearch);applySearch();
  document.getElementById('clearTwoDigitSearch').addEventListener('click',()=>{input.value='';applySearch();});
  document.querySelectorAll('[data-two-limit]').forEach(b=>b.addEventListener('click',()=>openTwoDigitResults(input.value,Number(b.dataset.twoLimit),amount)));
  document.querySelectorAll('[data-two-bet]').forEach(b=>b.addEventListener('click',()=>openTwoDigitResults(input.value,limit,Number(b.dataset.twoBet))));
  document.querySelectorAll('[data-two-pair]').forEach(b=>b.addEventListener('click',()=>{
    const item=selected.find(p=>p.number===b.dataset.twoPair),numbers=LuckyTwoDigit.expand([item]);
    showModal(`<div class="modal-head"><div><h2>คู่ ${item.number}</h2><p>X4 · 2 ตัว · คอลัมน์ 4–5</p></div><button class="icon-btn" data-close>×</button></div><div class="hero-number">${item.number}</div><p>เลขสำหรับคู่: ${numbers.join(' / ')} · ${item.occurrences} คู่ตำแหน่ง</p><p>${item.positions.map(([a,b])=>`แถว ${a.row+1} คอลัมน์ ${a.column+1} ↔ แถว ${b.row+1} คอลัมน์ ${b.column+1}`).join('<br>')}</p><button id="twoDigitBack" class="btn secondary full">กลับผลลัพธ์</button>`);
    document.getElementById('twoDigitBack').addEventListener('click',()=>openTwoDigitResults(query,limit,amount));
  }));
}
