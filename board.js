"use strict";

// 各 Page 擁有自己的畫面順序、操作說明與需求訪談問題。
const planningPages = [
  { id:"login", title:"登入與工作區", description:"從 NAS LDAP 登入畫面到工作區總覽。", frames:[
    { scene:"login", title:"登入畫面", instruction:"使用已填好的展示帳號，按「使用展示帳號登入」。", outcome:"進入工作區總覽；此處不驗證真實帳密。", question:"是在本系統輸入帳密，還是沿用既有單一登入狀態？" },
    { scene:"overview", title:"工作區總覽", instruction:"查看庫存摘要，點選指標或左側功能選單。", outcome:"可進入 HIS、OTC、廠商維護與盤點。", question:"哪些庫存指標與提醒需要放在首頁？" }
  ]},
  { id:"vendors", title:"廠商資料維護", description:"列表 → 新增 → 編輯，以表格管理廠商。", frames:[
    { scene:"vendor-list", title:"廠商列表", instruction:"搜尋廠商；點新增、編輯或刪除。", outcome:"列表依搜尋條件更新；被品項引用的廠商不能刪除。", question:"HIS 與 OTC 是否共用廠商？既有廠商資料從哪裡取得？" },
    { scene:"vendor-new", title:"新增廠商", instruction:"檢查預填的示範欄位，按儲存新增。", outcome:"新增廠商出現在列表，代碼不可重複。", question:"哪些廠商欄位必填？是否需要統編、地址或付款條件？" },
    { scene:"vendor-edit", title:"編輯廠商", instruction:"修改聯絡資訊或狀態，儲存後確認列表。", outcome:"更新廠商資料，或將廠商停用。", question:"已有作業紀錄的廠商，停用後如何處理？" }
  ]},
  { id:"his", title:"HIS 藥品查詢與修改", description:"查詢藥品檔 → 修改欄位 → 檢視回寫結果。日常扣庫由 HIS 執行。", frames:[
    { scene:"his-list", title:"HIS 藥品列表", instruction:"搜尋示例藥品，查看規格、單位與庫存。", outcome:"呈現 HIS 藥品檔的查詢畫面。", question:"即時資料更新需要多快？有哪些搜尋條件？" },
    { scene:"his-edit", title:"修改藥品檔", instruction:"修改名稱、規格、單位或狀態，再按儲存。", outcome:"顯示模擬回寫成功，庫存不因編輯而改變。", question:"哪些欄位允許修改？誰有權限？是否要保留修改歷程？" },
    { scene:"his-result", title:"回寫結果", instruction:"核對列表的最新內容；可再次開啟編輯確認。", outcome:"呈現剛才儲存的假資料；切到此步驟不會自動回寫。", question:"回寫失敗、連線中斷或多人同時修改時怎麼處理？" }
  ]},
  { id:"receipt", title:"OTC 掃碼入庫", description:"掃碼 → 已有品項直接入庫／未建檔先補建 → 核對入庫結果。", frames:[
    { scene:"receipt-scan", title:"掃描條碼", instruction:"輸入條碼按 Enter，或用「代入已存在條碼」查找。", outcome:"查找到品項後，顯示庫存與入庫表單。", question:"國際條碼格式與掃描設備為何？不同包裝是否有不同條碼？" },
    { scene:"receipt-known", title:"已有品項入庫", instruction:"已代入既有品項與數量 10；檢查後按確認入庫。", outcome:"假庫存增加，留下入庫異動紀錄。", question:"是否需要批號、效期、廠商單號或儲位？" },
    { scene:"receipt-new", title:"未建檔：補建並入庫", instruction:"系統提示條碼未建檔。檢查品項資料與數量，按儲存。", outcome:"新增品項並完成入庫，不必回列表另做一次入庫。", question:"新增品項需要哪些資訊？誰可以新增？" },
    { scene:"receipt-result", title:"入庫結果與紀錄", instruction:"查看最近入庫紀錄；可到品項維護查詢新建品項。", outcome:"顯示當次實際操作結果；本步驟不自動新增或扣庫。", question:"入庫錯誤如何更正或取消？是否需要審核？" }
  ]},
  { id:"issue", title:"OTC 出庫／耗用", description:"查找品項 → 輸入用途與數量 → 核對耗用結果。", frames:[
    { scene:"issue-scan", title:"出庫掃碼", instruction:"輸入條碼按 Enter，或代入已存在條碼。", outcome:"顯示啟用品項的可用庫存；未知條碼提示查無資料。", question:"耗用與其他出庫用途需要分開嗎？" },
    { scene:"issue-form", title:"填寫耗用資訊", instruction:"檢查示範數量 3 與用途，按確認耗用出庫。", outcome:"減少假庫存並留下紀錄；數量不足時阻擋。", question:"需要記錄部門、操作人、批號或耗用原因嗎？" },
    { scene:"issue-result", title:"耗用結果", instruction:"核對最近紀錄與庫存數量。", outcome:"呈現已完成的耗用，切換步驟不會再次扣庫。", question:"如何處理誤扣、取消或退回？" }
  ]},
  { id:"requisitions", title:"OTC 領用資料", description:"查看領用 → 新增 → 編輯與刪除。展示假設：領用立即扣庫。", frames:[
    { scene:"requisition-list", title:"領用列表", instruction:"搜尋領用資料，查看品項、部門與數量。", outcome:"可以新增、編輯、刪除領用資料。", question:"領用是申請、實際領取，還是另一種出庫用途？" },
    { scene:"requisition-new", title:"新增領用", instruction:"檢查預填領用人、部門與數量 4，按儲存。", outcome:"依展示假設立即扣假庫存，不再重複產生耗用扣庫。", question:"實際應該在哪個時點扣庫？是否需要審核？" },
    { scene:"requisition-edit", title:"編輯／刪除領用", instruction:"修改數量後儲存；關閉表單後，也可以確認刪除。", outcome:"修改依新舊差額調整庫存，刪除回復原領用數量。", question:"已領取後是否可以修改或刪除？需要保留哪些操作紀錄？" }
  ]},
  { id:"stocktake", title:"HIS ／ OTC 庫存盤點", description:"選擇工作區 → 掃碼填實盤 → 確認調整 → 核對結果。", frames:[
    { scene:"stocktake-otc", title:"OTC 掃碼盤點", instruction:"已加入示例品項；輸入實盤數量，再按確認調整。", outcome:"顯示帳面數量與盤盈盤差，可輸入零庫存。", question:"盤點以哪個時間點為準？是否分倉庫或盤點批次？" },
    { scene:"stocktake-his", title:"HIS 掃碼盤點", instruction:"在 HIS 工作區輸入實盤數量，按確認調整並確認。", outcome:"展示假設：直接調整 HIS 假庫存，不連線 HIS。", question:"正式 HIS 庫存調整如何交由 HIS 執行？" },
    { scene:"stocktake-confirm", title:"確認盤盈盤差調整", instruction:"檢查調整前後數量，選擇確認或取消。", outcome:"確認後更新假庫存；同一筆盤點不可重複調整。", question:"是否需要審核、調整原因與操作人紀錄？" },
    { scene:"stocktake-result", title:"盤點調整結果", instruction:"檢查已調整標示與異動紀錄；必要時重新掃碼開始新盤點。", outcome:"呈現當次已完成與待處理盤點；不自動調整。", question:"盤點期間庫存異動或帳面變更時怎麼處理？" }
  ]}
];
let activePage=planningPages[0];
let zoom=.7;
let currentStep=0;
let guided=true;
let demoReady=false;
let pendingStep=null;
let requestSequence=0;
let requestTimeout;
let dragStart=null;
const viewport=document.querySelector("#canvas-viewport");
const canvas=document.querySelector("#frame-canvas");
const player=document.querySelector("#player");
const demoFrame=document.querySelector("#interactive-demo");

function updateCanvasSize() {
  const width=activePage.frames.length*820+(activePage.frames.length-1)*76+96;
  document.querySelector("#canvas-size").style.width=`${width*zoom}px`;
  document.querySelector("#canvas-size").style.height=`${930*zoom}px`;
  canvas.style.transform=`scale(${zoom})`;
  document.querySelector("#zoom-label").textContent=`${Math.round(zoom*100)}%`;
  document.querySelector("#zoom-out").disabled=zoom<=.1;
  document.querySelector("#zoom-in").disabled=zoom>=1.2;
}
function renderPlanningPage() {
  document.querySelector("#page-nav").innerHTML=planningPages.map(page=>`<button data-page="${page.id}" class="${page===activePage?"active":""}" ${page===activePage?'aria-current="page"':""}>${page.title}<small>${page.frames.length}</small></button>`).join("");
  document.querySelector("#page-title").textContent=activePage.title;
  document.querySelector("#page-description").textContent=activePage.description;
  document.querySelector("#frame-count").textContent=`${activePage.frames.length} 個 Frame · 縮圖為初始畫面參考`;
  canvas.innerHTML=activePage.frames.map((frame,index)=>`<article class="screen-frame"><div class="frame-heading"><div><span>FRAME ${String(index+1).padStart(2,"0")}</span><h2>${frame.title}</h2></div><button data-open="${index}">操作此畫面 ↗</button></div><div class="frame-preview" inert><iframe src="demo.html?embed=1&amp;preview=1&amp;scene=${frame.scene}" title="${frame.title}初始畫面" tabindex="-1" loading="lazy"></iframe></div><div class="frame-notes"><p><strong>用途：</strong>${frame.instruction}</p><p><strong>待確認：</strong>${frame.question}</p></div></article>`).join("");
  updateCanvasSize();viewport.scrollTo(0,0);
}
function updateStepNotes() {
  const step=activePage.frames[currentStep];
  document.querySelector("#player-mode").textContent=guided?`${activePage.title} / 流程示範`:"Frame / 互動操作";
  document.querySelector("#step-title").textContent=step.title;
  document.querySelector("#step-counter").textContent=`${currentStep+1} / ${activePage.frames.length}`;
  document.querySelector("#step-instruction").textContent=step.instruction;
  document.querySelector("#step-outcome").textContent=step.outcome;
  document.querySelector("#step-question").textContent=step.question;
  document.querySelector("#previous-step").disabled=currentStep===0;
  document.querySelector("#next-step").textContent=currentStep===activePage.frames.length-1?"完成流程 ✓":"下一步 →";
}
function requestScene(stepIndex) {
  pendingStep={index:stepIndex,requestId:++requestSequence};
  document.querySelector("#player-status").textContent=demoReady?"正在切換畫面…":"正在準備互動示範…";
  if(!demoReady) return;
  demoFrame.contentWindow.postMessage({type:"fangding-request-scene",scene:activePage.frames[stepIndex].scene,requestId:pendingStep.requestId},"*");
  clearTimeout(requestTimeout);
  requestTimeout=setTimeout(()=>{document.querySelector("#player-status").textContent="畫面尚未回應，請關閉後重試，或開啟完整 Demo。";},8000);
}
function openPlayer(stepIndex,tour) {
  guided=tour;currentStep=stepIndex;updateStepNotes();
  if(!player.open) player.showModal();
  requestScene(stepIndex);
}
window.addEventListener("message",event=>{
  // file:// 的 origin 是 null，以實際 iframe Window 身分限制訊息來源。
  if(event.source!==demoFrame.contentWindow) return;
  const message=event.data;
  if(!message||typeof message!=="object") return;
  if(message.type==="fangding-demo-ready") {
    demoReady=true;if(pendingStep) requestScene(pendingStep.index);
  }
  if(message.type==="fangding-scene-result"&&pendingStep?.requestId===message.requestId) {
    clearTimeout(requestTimeout);
    if(message.accepted) {currentStep=pendingStep.index;updateStepNotes();document.querySelector("#player-status").textContent="";}
    else document.querySelector("#player-status").textContent=message.reason;
    pendingStep=null;
  }
});
document.querySelector("#page-nav").addEventListener("click",event=>{
  const button=event.target.closest("[data-page]");if(!button) return;
  activePage=planningPages.find(page=>page.id===button.dataset.page);renderPlanningPage();
});
canvas.addEventListener("click",event=>{const button=event.target.closest("[data-open]");if(button) openPlayer(Number(button.dataset.open),false);});
document.querySelector("#start-tour").addEventListener("click",()=>openPlayer(0,true));
document.querySelector("#previous-step").addEventListener("click",()=>{if(currentStep>0&&!pendingStep) requestScene(currentStep-1);});
document.querySelector("#next-step").addEventListener("click",()=>{
  if(pendingStep) return;
  if(currentStep<activePage.frames.length-1) requestScene(currentStep+1);
  else {player.close();document.querySelector("#board-status").textContent="流程展示完成。可選擇其他分類，互動假資料會在當次規劃板繼續保留。";}
});
document.querySelector("#close-player").addEventListener("click",()=>player.close());
document.querySelector("#return-board").addEventListener("click",()=>player.close());
player.addEventListener("close",()=>{
  pendingStep=null;clearTimeout(requestTimeout);
  if(demoReady) demoFrame.contentWindow.postMessage({type:"fangding-dismiss-form"},"*");
});
document.querySelector("#zoom-in").addEventListener("click",()=>{zoom=Math.min(1.2,Math.round((zoom+.1)*100)/100);updateCanvasSize();});
document.querySelector("#zoom-out").addEventListener("click",()=>{zoom=Math.max(.1,Math.round((zoom-.1)*100)/100);updateCanvasSize();});
document.querySelector("#zoom-fit").addEventListener("click",()=>{
  const canvasWidth=activePage.frames.length*820+(activePage.frames.length-1)*76+96;
  zoom=Math.min(1.2,Math.max(.1,Math.min((viewport.clientWidth-24)/canvasWidth,(viewport.clientHeight-24)/930)));
  updateCanvasSize();viewport.scrollTo(0,0);
});
viewport.addEventListener("pointerdown",event=>{
  if(event.button!==0||event.target.closest(".screen-frame")) return;
  dragStart={x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(event.pointerId);viewport.classList.add("dragging");
});
viewport.addEventListener("pointermove",event=>{if(dragStart){viewport.scrollLeft=dragStart.left+dragStart.x-event.clientX;viewport.scrollTop=dragStart.top+dragStart.y-event.clientY;}});
viewport.addEventListener("pointerup",()=>{dragStart=null;viewport.classList.remove("dragging");});
viewport.addEventListener("pointercancel",()=>{dragStart=null;viewport.classList.remove("dragging");});
renderPlanningPage();
