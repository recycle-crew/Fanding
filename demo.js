"use strict";

// 展示資料只留在記憶體；重新整理重新建立，不接觸正式系統。
const vendors = [
  { id:"V001", name:"晴川醫材（虛構）", contact:"陳小姐", phone:"02-0000-0101", email:"sales@example.test", status:"啟用" },
  { id:"V002", name:"天澄藥業（虛構）", contact:"林先生", phone:"02-0000-0102", email:"order@example.test", status:"啟用" },
  { id:"V003", name:"藍禾健康（虛構）", contact:"王小姐", phone:"03-0000-0103", email:"service@example.test", status:"啟用" },
  { id:"V004", name:"和光供應（虛構）", contact:"李先生", phone:"04-0000-0104", email:"hello@example.test", status:"啟用" },
  { id:"V005", name:"舊版展示廠商（虛構）", contact:"周先生", phone:"07-0000-0105", email:"archive@example.test", status:"停用" }
];
const hisMedicines = [
  ["示例藥品 A","500 mg","錠",1200], ["示例藥品 B","10 mg","錠",600],
  ["示例藥品 C","250 mg","膠囊",32], ["示例藥品 D","100 mL","瓶",90],
  ["示例藥品 E","5 mg","錠",800], ["示例藥品 F","20 mL","支",20],
  ["示例藥品 G","30 g","條",140], ["示例藥品 H","50 mg","錠",0]
].map((medicine,index)=>({ id:`H${String(index+1).padStart(3,"0")}`, barcode:`990100000${String(index+1).padStart(4,"0")}`, name:medicine[0], spec:medicine[1], unit:medicine[2], stock:medicine[3], status:index===7?"停用":"啟用" }));
const otcProducts = [
  ["醫用口罩","50 入","盒",240], ["酒精棉片","100 入","盒",80],
  ["無菌紗布","10 入","包",12], ["透氣膠帶","1 吋","捲",64],
  ["檢查手套","M／100 入","盒",120], ["生理沖洗液","500 mL","瓶",8],
  ["棉棒","100 入","包",160], ["電子體溫計","標準型","支",35],
  ["冷敷袋","小型","個",28], ["舊版護具","展示停用品","個",0]
].map((product,index)=>({ id:`O${String(index+1).padStart(3,"0")}`, barcode:`990200000${String(index+1).padStart(4,"0")}`, name:product[0], spec:product[1], unit:product[2], stock:product[3], vendorId:vendors[index%4].id, status:index===9?"停用":"啟用" }));
const movements = [
  { id:1, workspace:"OTC", productId:"O001", type:"入庫", quantity:50, note:"期初展示入庫", time:"2026/10/14 09:00" },
  { id:2, workspace:"OTC", productId:"O002", type:"耗用", quantity:-5, note:"門診耗用", time:"2026/10/14 09:20" }
];
const requisitions = [{ id:1, productId:"O005", person:"展示護理師", department:"門診", quantity:5, note:"日常領用" }];
const stocktakes = [{ id:1, workspace:"OTC", productId:"O003", book:15, actual:12, completed:true }];
const modules = [
  {key:"overview",label:"工作區總覽",group:"共同管理"}, {key:"vendors",label:"廠商資料維護"},
  {key:"his",label:"藥品查詢與修改",group:"HIS 工作區"},
  {key:"products",label:"品項資料維護",group:"OTC 工作區"}, {key:"receipt",label:"掃碼入庫"},
  {key:"issue",label:"出庫／耗用"}, {key:"requisitions",label:"領用資料"},
  {key:"stocktake",label:"庫存盤點",group:"HIS ／ OTC"}
];
let activeModule="overview";
let searchTerm="";
let selectedProductId=null;
let scanBarcode="";
let stocktakeWorkspace="OTC";
let editorContext=null;
let confirmationAction=null;
let nextMovementId=3;
let nextRequisitionId=2;
let nextStocktakeId=2;
let noticeTimeout;
const content=document.querySelector("#content");
const editor=document.querySelector("#editor");
const editorForm=document.querySelector("#editor-form");
const confirmation=document.querySelector("#confirmation");

// 所有使用者文字進入 HTML 前都轉義；資料本身保留原始文字。
function escapeHtml(text) {
  return String(text??"").replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));
}
function showNotice(message) {
  const notice=document.querySelector("#notice");
  notice.textContent=message; notice.hidden=false;
  clearTimeout(noticeTimeout);
  noticeTimeout=setTimeout(()=>{notice.hidden=true;},5000);
}
function askConfirmation(message,action) {
  document.querySelector("#confirmation-text").textContent=message;
  confirmationAction=action;
  if(previewDemo) confirmation.setAttribute("open","");
  else confirmation.showModal();
}
confirmation.addEventListener("close",()=>{
  const action=confirmationAction; confirmationAction=null;
  if(confirmation.returnValue==="confirm" && action) action();
});

function renderTable(headers,rows) {
  return `<div class="table-wrap" tabindex="0" role="region" aria-label="資料表，可左右捲動"><table><thead><tr>${headers.map(header=>`<th scope="col">${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows.length?rows.map(row=>`<tr>${row.map(cell=>`<td>${cell}</td>`).join("")}</tr>`).join(""):`<tr><td colspan="${headers.length}" class="empty">目前沒有符合的資料</td></tr>`}</tbody></table></div>`;
}
function renderMovements() {
  const visible=movements.filter(movement=>activeModule==="overview" || movement.workspace==="OTC").slice().reverse().slice(0,12);
  return renderTable(["時間","工作區","品項","作業","數量變化","備註"],visible.map(movement=>{
    const product=(movement.workspace==="HIS"?hisMedicines:otcProducts).find(product=>product.id===movement.productId);
    return [escapeHtml(movement.time),escapeHtml(movement.workspace),escapeHtml(product?.name??movement.productId),escapeHtml(movement.type),`<span class="${movement.quantity>=0?"positive":"negative"}">${movement.quantity>0?"+":""}${movement.quantity}</span>`,escapeHtml(movement.note)];
  }));
}
function renderList() {
  const collection=activeModule==="vendors"?vendors:activeModule==="his"?hisMedicines:activeModule==="products"?otcProducts:requisitions;
  const filtered=collection.filter(entry=>Object.values(entry).some(value=>String(value).toLowerCase().includes(searchTerm.toLowerCase())) || (activeModule==="requisitions" && otcProducts.find(product=>product.id===entry.productId)?.name.includes(searchTerm)));
  let headers;
  const rows=filtered.map(entry=>{
    const status=`<span class="tag ${entry.status==="停用"?"off":""}">${escapeHtml(entry.status)}</span>`;
    const actions=`<div class="actions"><button data-action="edit" data-id="${escapeHtml(entry.id)}">編輯</button>${activeModule==="his"?"":`<button data-action="delete" data-id="${escapeHtml(entry.id)}">刪除</button>`}</div>`;
    if(activeModule==="vendors") {headers=["代碼","廠商名稱","聯絡人","電話","Email","狀態","操作"];return [entry.id,entry.name,entry.contact,entry.phone,entry.email].map(escapeHtml).concat(status,actions);}
    if(activeModule==="requisitions") {headers=["編號","品項","領用人","部門","數量","備註","操作"];return [String(entry.id),otcProducts.find(product=>product.id===entry.productId)?.name,entry.person,entry.department,entry.quantity,entry.note].map(escapeHtml).concat(actions);}
    headers=activeModule==="his"?["藥品代碼","名稱","規格","單位","庫存","狀態","操作"]:["品項代碼","國際條碼","名稱","規格","單位","廠商","庫存","狀態","操作"];
    const cells=activeModule==="his"?[entry.id,entry.name,entry.spec,entry.unit]:[entry.id,entry.barcode,entry.name,entry.spec,entry.unit,vendors.find(vendor=>vendor.id===entry.vendorId)?.name];
    return cells.map(escapeHtml).concat(`<span class="${entry.stock<20?"tag low":""}">${entry.stock}</span>`,status,actions);
  });
  // 空結果也保留各模組的欄位。
  headers??=activeModule==="vendors"?["代碼","廠商名稱","聯絡人","電話","Email","狀態","操作"]:activeModule==="requisitions"?["編號","品項","領用人","部門","數量","備註","操作"]:activeModule==="his"?["藥品代碼","名稱","規格","單位","庫存","狀態","操作"]:["品項代碼","國際條碼","名稱","規格","單位","廠商","庫存","狀態","操作"];
  return `<div class="panel"><div class="toolbar"><input id="search" type="search" aria-label="搜尋資料" placeholder="搜尋代碼、名稱或相關資訊…" value="${escapeHtml(searchTerm)}"><span class="muted small">${filtered.length} 筆資料</span></div><div id="list-table">${renderTable(headers,rows)}</div></div>`;
}
function renderScan() {
  const isStocktake=activeModule==="stocktake";
  const products=isStocktake&&stocktakeWorkspace==="HIS"?hisMedicines:otcProducts;
  const selected=products.find(product=>product.id===selectedProductId);
  let html=`<div class="panel">${isStocktake?`<label style="max-width:220px;margin-bottom:20px">盤點工作區<select id="stocktake-workspace"><option${stocktakeWorkspace==="OTC"?" selected":""}>OTC</option><option${stocktakeWorkspace==="HIS"?" selected":""}>HIS</option></select></label>`:""}<form id="scan-form" class="scan-form"><label>國際條碼<input id="barcode" name="barcode" value="${escapeHtml(scanBarcode)}" placeholder="掃描或輸入條碼後按 Enter" required autocomplete="off"></label><button type="submit" class="primary">查找品項</button></form><div class="samples"><button data-action="sample">代入已存在條碼</button>${activeModule==="receipt"?'<button data-action="unknown">代入未建檔條碼</button>':""}</div><p id="scan-error" class="error" role="alert"></p>`;
  if(selected) {
    html+=`<div class="selection"><strong>${escapeHtml(selected.name)} <span class="tag">${escapeHtml(selected.id)}</span></strong><p>${escapeHtml(selected.spec)} · 帳面庫存 ${selected.stock} ${escapeHtml(selected.unit)} · ${escapeHtml(selected.status)}</p></div>`;
    if(!isStocktake && selected.status==="啟用") html+=`<form id="movement-form" class="inline-form"><div class="form-grid"><label>數量（${escapeHtml(selected.unit)}）<input name="quantity" type="number" min="1" max="1000000" step="1" required></label><label>${activeModule==="issue"?"用途":"備註"}<input name="note" ${activeModule==="issue"?"required":""}></label></div><button class="primary" type="submit">${activeModule==="receipt"?"確認入庫":"確認耗用出庫"}</button> <button type="button" data-action="cancel-scan">取消</button><p id="movement-error" class="error" role="alert"></p></form>`;
    else if(!isStocktake) html+='<p class="error">停用品項不可新增入出庫或領用。</p>';
  }
  html+='</div>';
  if(isStocktake) {
    html+=`<div class="panel"><h3>盤點明細</h3>${renderTable(["品項","帳面數量","實盤數量","差異","狀態","操作"],stocktakes.filter(count=>count.workspace===stocktakeWorkspace).map(count=>{
      const product=products.find(product=>product.id===count.productId);
      const difference=count.actual-count.book;
      return [escapeHtml(product?.name),String(count.book),count.completed?String(count.actual):`<input class="count-input" type="number" min="0" max="1000000" step="1" aria-label="${escapeHtml(product?.name)}實盤數量" data-count="${count.id}" value="${count.actual}">`,`<span id="difference-${count.id}" class="${difference<0?"negative":"positive"}">${difference>0?"+":""}${difference}</span>`,count.completed?'<span class="tag">已調整</span>':'<span class="tag low">待確認</span>',count.completed?'<button disabled>已完成</button>':`<button data-action="adjust" data-id="${count.id}">確認調整</button> <button data-action="remove-count" data-id="${count.id}">移除</button>`];
    }))}</div>`;
  } else html+=`<div class="panel"><h3>最近 OTC 異動</h3>${renderMovements()}</div>`;
  return html;
}
function renderPage() {
  const module=modules.find(module=>module.key===activeModule);
  document.querySelector("#workspace-label").textContent=activeModule==="his"?"HIS 工作區":activeModule==="stocktake"?`${stocktakeWorkspace} 盤點工作區`:["products","receipt","issue","requisitions"].includes(activeModule)?"OTC 工作區":"共同工作區";
  document.querySelector("#module-nav").innerHTML=modules.map(module=>`${module.group?`<div class="nav-group">${module.group}</div>`:""}<button data-module="${module.key}" class="${module.key===activeModule?"active":""}" ${module.key===activeModule?'aria-current="page"':""}>${module.label}</button>`).join("");
  const subtitles={overview:"從資料維護到庫存作業，掌握今天的工作。",vendors:"以表格管理廠商基本資料。",his:"查詢藥品檔，模擬修改並回寫 HIS。",products:"維護 OTC 品項與條碼，庫存透過作業異動更新。",receipt:"掃描條碼，查找或補建品項後入庫。",issue:"掃描條碼並記錄耗用，更新 OTC 假庫存。",requisitions:"維護部門領用資料與展示扣庫紀錄。",stocktake:"掃描品項，核對帳面與實際數量。"};
  let html=`<div class="page-heading"><div><p class="eyebrow">FANGDING / ${activeModule==="his"?"HIS":"DEMO"}</p><h2>${module.label}</h2><p>${subtitles[activeModule]}</p></div>${["vendors","products","requisitions"].includes(activeModule)?'<button class="primary" data-action="add">＋ 新增資料</button>':'<span class="tag">展示模式・假資料</span>'}</div>`;
  if(activeModule==="his") html+='<div class="callout">日常扣庫由 HIS 執行。本頁僅模擬藥品檔維護與回寫；藥品編輯不修改庫存。</div>';
  if(activeModule==="requisitions") html+='<div class="callout assumption">展示假設，正式規則待確認：領用立即扣庫，修改依差額調整，刪除回復庫存；不重複產生耗用扣庫。</div>';
  if(activeModule==="stocktake") html+='<div class="callout assumption">展示假設，正式規則待確認：HIS 與 OTC 盤點確認後直接調整假庫存。此操作不會連線或修改 HIS 資料庫。</div>';
  if(activeModule==="overview") {
    const low=otcProducts.filter(product=>product.status==="啟用"&&product.stock<20);
    const metrics=[["HIS 藥品",hisMedicines.length,"his"],["OTC 品項",otcProducts.length,"products"],["OTC 庫存總量",otcProducts.reduce((sum,product)=>sum+product.stock,0),"products"],["低庫存品項",low.length,"products"]];
    html+=`<div class="callout">所有品項與廠商均為虛構資料。可直接操作各模組；重新整理會回復初始展示資料。</div><div class="cards">${metrics.map(metric=>`<button class="metric" data-module="${metric[2]}"><span>${metric[0]}</span><strong>${metric[1]}</strong><span>${metric[0]==="OTC 庫存總量"?"混合單位，僅供展示":"查看資料 →"}</span></button>`).join("")}</div><div class="two-columns"><div class="panel"><h3>OTC 低庫存提醒</h3>${renderTable(["品項","庫存","單位"],low.map(product=>[escapeHtml(product.name),String(product.stock),escapeHtml(product.unit)]))}<button data-module="receipt" style="margin-top:16px">前往掃碼入庫 →</button></div><div class="panel"><h3>盤點差異摘要</h3><p class="muted">${stocktakes.filter(count=>count.actual!==count.book).length} 筆差異 · ${stocktakes.filter(count=>!count.completed).length} 筆待調整</p><p>盤點涵蓋 HIS 與 OTC，調整規則以展示假設呈現。</p><button data-module="stocktake">前往庫存盤點 →</button></div></div><div class="panel"><h3>最近庫存異動</h3>${renderMovements()}</div>`;
  } else if(["vendors","his","products","requisitions"].includes(activeModule)) html+=renderList();
  else html+=renderScan();
  content.innerHTML=html;
}

// 表單欄位與儲存邏輯由各業務模組明確擁有。
function openEditor(kind,id=null,unknownBarcode="") {
  const collection=kind==="vendors"?vendors:kind==="his"?hisMedicines:kind==="requisitions"?requisitions:otcProducts;
  const existing=collection.find(entry=>String(entry.id)===String(id));
  editorContext={kind,id:existing?.id??null,unknownBarcode};
  const fields=[];
  const addField=(name,label,type="text",options=null,required=true)=>{
    const initial=existing?.[name]??(name==="barcode"?unknownBarcode:name==="status"?"啟用":"");
    fields.push(`<label>${label}${required?' <span class="muted small">必填</span>':""}${options?`<select name="${name}" ${required?"required":""}>${options.map(option=>`<option value="${escapeHtml(option[0])}" ${String(initial)===String(option[0])?"selected":""}>${escapeHtml(option[1])}</option>`).join("")}</select>`:`<input name="${name}" type="${type}" value="${escapeHtml(initial)}" ${required?"required":""} ${name==="id"&&existing?"readonly":""} ${type==="number"?'min="1" max="1000000" step="1"':""}>`}</label>`);
  };
  if(kind==="requisitions") {
    addField("productId","品項","text",otcProducts.filter(product=>product.status==="啟用"||product.id===existing?.productId).map(product=>[product.id,`${product.name}（庫存 ${product.stock} ${product.unit}）`]));
    addField("person","領用人"); addField("department","部門"); addField("quantity","數量","number"); addField("note","備註","text",null,false);
  } else {
    if(kind!=="his") addField("id",kind==="vendors"?"廠商代碼":"品項代碼");
    if(kind==="products" || kind==="new-receipt") addField("barcode","國際條碼");
    addField("name",kind==="vendors"?"廠商名稱":"名稱");
    if(kind==="vendors") {addField("contact","聯絡人");addField("phone","電話");addField("email","Email","email",null,false);}
    else {addField("spec","規格");addField("unit","單位");if(kind!=="his") addField("vendorId","廠商","text",vendors.filter(vendor=>vendor.status==="啟用"||vendor.id===existing?.vendorId).map(vendor=>[vendor.id,vendor.name]));}
    addField("status","狀態","text",[["啟用","啟用"],["停用","停用"]]);
    if(kind==="new-receipt") {addField("quantity","入庫數量","number");addField("note","入庫備註","text",null,false);}
  }
  document.querySelector("#editor-title").textContent=kind==="new-receipt"?"條碼未建檔：新增品項並入庫":`${existing?"編輯":"新增"}${kind==="vendors"?"廠商":kind==="his"?"HIS 藥品":kind==="requisitions"?"領用資料":"OTC 品項"}`;
  document.querySelector("#editor-fields").innerHTML=fields.join("");
  document.querySelector("#editor-error").textContent="";
  if(previewDemo) editor.setAttribute("open","");
  else editor.showModal();
}
editorForm.addEventListener("click",event=>{if(event.target.closest("[data-close]")) editor.close();});
editorForm.addEventListener("submit",event=>{
  event.preventDefault();
  const {kind,id}=editorContext;
  const formValues=Object.fromEntries(new FormData(editorForm));
  for(const key of Object.keys(formValues)) formValues[key]=formValues[key].trim();
  const error=document.querySelector("#editor-error");
  error.textContent="";
  if([...editorForm.querySelectorAll("[required]")].some(input=>!input.value.trim())) {error.textContent="請填寫所有必填欄位。";return;}
  const collection=kind==="vendors"?vendors:kind==="his"?hisMedicines:kind==="requisitions"?requisitions:otcProducts;
  const existing=collection.find(entry=>entry.id===id);
  if(kind!=="his" && kind!=="requisitions" && collection.some(entry=>entry.id!==id&&entry.id===formValues.id)) {error.textContent="代碼已存在，請使用其他代碼。";return;}
  if(["products","new-receipt"].includes(kind)) {
    if(otcProducts.some(product=>product.id!==id&&product.barcode===formValues.barcode)) {error.textContent="國際條碼已存在。";return;}
    if(!vendors.some(vendor=>vendor.id===formValues.vendorId)) {error.textContent="請先建立廠商。";return;}
  }
  if(kind==="requisitions" || kind==="new-receipt") {
    const quantity=Number(formValues.quantity);
    if(!Number.isSafeInteger(quantity)||quantity<=0||quantity>1000000) {error.textContent="數量必須為 1 至 1,000,000 的整數。";return;}
    formValues.quantity=quantity;
    if(kind==="requisitions") {
      const product=otcProducts.find(product=>product.id===formValues.productId);
      const oldProduct=existing?otcProducts.find(product=>product.id===existing.productId):null;
      if(!product || product.status!=="啟用") {error.textContent="請選擇啟用品項，停用品項不可新增領用。";return;}
      const available=product.stock+(oldProduct===product?existing.quantity:0);
      if(quantity>available) {error.textContent=`庫存不足，可用數量為 ${available}。`;return;}
      if(existing) {oldProduct.stock+=existing.quantity;movements.push({id:nextMovementId++,workspace:"OTC",productId:oldProduct.id,type:"領用修改回復",quantity:existing.quantity,note:"回復原領用數量",time:new Date().toLocaleString("zh-TW")});}
      product.stock-=quantity;
      movements.push({id:nextMovementId++,workspace:"OTC",productId:product.id,type:existing?"領用修改":"領用",quantity:-quantity,note:formValues.note||formValues.department,time:new Date().toLocaleString("zh-TW")});
    } else if(formValues.status!=="啟用") {error.textContent="新增入庫品項必須為啟用狀態。";return;}
  }
  if(kind==="new-receipt") {
    const {quantity,note,...productFields}=formValues;
    otcProducts.push({...productFields,stock:quantity});
    movements.push({id:nextMovementId++,workspace:"OTC",productId:productFields.id,type:"入庫",quantity,note,time:new Date().toLocaleString("zh-TW")});
    selectedProductId=null;scanBarcode="";
  } else if(existing) Object.assign(existing,formValues);
  else collection.push({...formValues,id:kind==="requisitions"?nextRequisitionId++:formValues.id,...(kind==="products"?{stock:0}:{})});
  editor.close();renderPage();showNotice(kind==="his"?"模擬回寫成功（未連線 HIS）":kind==="new-receipt"?"品項已新增並完成入庫":"資料已儲存，假庫存已同步更新");
});

function deleteEntry(id) {
  const collection=activeModule==="vendors"?vendors:activeModule==="products"?otcProducts:requisitions;
  const entry=collection.find(entry=>String(entry.id)===id);
  if(!entry) return;
  if(activeModule==="vendors"&&otcProducts.some(product=>product.vendorId===entry.id)) {showNotice("此廠商已被品項引用，不能刪除；可改為停用。");return;}
  if(activeModule==="products"&&(movements.some(movement=>movement.workspace==="OTC"&&movement.productId===entry.id)||requisitions.some(requisition=>requisition.productId===entry.id)||stocktakes.some(count=>count.workspace==="OTC"&&count.productId===entry.id))) {showNotice("此品項已有庫存異動、領用或盤點紀錄，不能刪除。");return;}
  askConfirmation(`確定刪除 ${entry.name??`領用紀錄 #${entry.id}`}？${activeModule==="requisitions"?"刪除將回復原領用庫存。":""}`,()=>{
    if(activeModule==="requisitions") {
      const product=otcProducts.find(product=>product.id===entry.productId);
      product.stock+=entry.quantity;
      movements.push({id:nextMovementId++,workspace:"OTC",productId:product.id,type:"領用刪除回復",quantity:entry.quantity,note:`刪除領用 #${entry.id}`,time:new Date().toLocaleString("zh-TW")});
    }
    collection.splice(collection.indexOf(entry),1);renderPage();showNotice("資料已刪除");
  });
}

function lookupBarcode(barcode) {
  scanBarcode=barcode.trim();
  const products=activeModule==="stocktake"&&stocktakeWorkspace==="HIS"?hisMedicines:otcProducts;
  const product=products.find(product=>product.barcode===scanBarcode);
  selectedProductId=null;
  if(!product) {
    renderPage();
    document.querySelector("#scan-error").textContent=activeModule==="receipt"?"此條碼尚未建檔，請新增品項後入庫。":"找不到此條碼，請確認或先建立品項。";
    if(activeModule==="receipt") openEditor("new-receipt",null,scanBarcode);
    return;
  }
  selectedProductId=product.id;
  if(activeModule==="stocktake") {
    const pending=stocktakes.find(count=>count.workspace===stocktakeWorkspace&&count.productId===product.id&&!count.completed);
    if(!pending) stocktakes.push({id:nextStocktakeId++,workspace:stocktakeWorkspace,productId:product.id,book:product.stock,actual:product.stock,completed:false});
    else showNotice("此品項已在待調整盤點中，請直接輸入實盤數量。");
  }
  renderPage();
  if(!previewDemo) document.querySelector(activeModule==="stocktake"?".count-input":"#movement-form input")?.focus();
}

content.addEventListener("submit",event=>{
  event.preventDefault();
  if(event.target.id==="scan-form") lookupBarcode(new FormData(event.target).get("barcode"));
  if(event.target.id==="movement-form") {
    const formValues=Object.fromEntries(new FormData(event.target));
    const quantity=Number(formValues.quantity);
    const product=otcProducts.find(product=>product.id===selectedProductId);
    const error=document.querySelector("#movement-error");
    if(!product||product.status!=="啟用") {error.textContent="請選擇啟用品項。";return;}
    if(!Number.isSafeInteger(quantity)||quantity<=0||quantity>1000000) {error.textContent="請輸入 1 至 1,000,000 的整數數量。";return;}
    if(activeModule==="issue"&&!formValues.note.trim()) {error.textContent="請輸入耗用用途。";return;}
    if(activeModule==="issue"&&quantity>product.stock) {error.textContent=`庫存不足，目前僅有 ${product.stock}。`;return;}
    const change=activeModule==="receipt"?quantity:-quantity;
    product.stock+=change;
    movements.push({id:nextMovementId++,workspace:"OTC",productId:product.id,type:activeModule==="receipt"?"入庫":"耗用",quantity:change,note:formValues.note.trim(),time:new Date().toLocaleString("zh-TW")});
    selectedProductId=null;scanBarcode="";renderPage();showNotice("作業完成，OTC 假庫存與異動紀錄已更新");
  }
});
content.addEventListener("input",event=>{
  if(event.target.id==="search") {
    searchTerm=event.target.value;
    const temporary=document.createElement("div");temporary.innerHTML=renderList();
    document.querySelector("#list-table").innerHTML=temporary.querySelector("#list-table").innerHTML;
    document.querySelector(".toolbar .small").textContent=temporary.querySelector(".toolbar .small").textContent;
  }
  if(event.target.dataset.count) {
    const count=stocktakes.find(count=>count.id===Number(event.target.dataset.count));
    const actual=event.target.value===""?NaN:Number(event.target.value);
    count.actual=actual;
    const difference=document.querySelector(`#difference-${count.id}`);
    difference.textContent=Number.isSafeInteger(actual)&&actual>=0?`${actual-count.book>0?"+":""}${actual-count.book}`:"請輸入有效數量";
    difference.className=actual<count.book?"negative":"positive";
  }
});
content.addEventListener("change",event=>{
  if(event.target.id==="stocktake-workspace") {stocktakeWorkspace=event.target.value;selectedProductId=null;scanBarcode="";renderPage();}
});

document.addEventListener("click",event=>{
  const button=event.target.closest("button");
  if(!button) return;
  if(button.dataset.module) {
    activeModule=button.dataset.module;searchTerm="";selectedProductId=null;scanBarcode="";renderPage();
    document.querySelector("#sidebar").classList.remove("open");document.querySelector("#menu-toggle").setAttribute("aria-expanded","false");content.focus();
  }
  const action=button.dataset.action;
  if(action==="add") openEditor(activeModule);
  if(action==="edit") openEditor(activeModule,button.dataset.id);
  if(action==="delete") deleteEntry(button.dataset.id);
  if(action==="sample") {
    const products=activeModule==="stocktake"&&stocktakeWorkspace==="HIS"?hisMedicines:otcProducts;
    lookupBarcode(products.find(product=>product.status==="啟用").barcode);
  }
  if(action==="unknown") {
    let barcode="9902999990001";
    while(otcProducts.some(product=>product.barcode===barcode)) barcode=String(Number(barcode)+1);
    lookupBarcode(barcode);
  }
  if(action==="cancel-scan") {selectedProductId=null;scanBarcode="";renderPage();}
  if(action==="remove-count") {
    const index=stocktakes.findIndex(count=>count.id===Number(button.dataset.id)&&!count.completed);
    if(index>=0) stocktakes.splice(index,1);renderPage();
  }
  if(action==="adjust") {
    const count=stocktakes.find(count=>count.id===Number(button.dataset.id));
    if(!count||count.completed) return;
    if(!Number.isSafeInteger(count.actual)||count.actual<0||count.actual>1000000) {showNotice("實盤數量必須為 0 至 1,000,000 的整數。");return;}
    const product=(count.workspace==="HIS"?hisMedicines:otcProducts).find(product=>product.id===count.productId);
    if(product.stock!==count.book) {showNotice("帳面庫存已變更，請移除此筆並重新掃描盤點。");return;}
    askConfirmation(`確認將 ${product.name} 的 ${count.workspace} 假庫存由 ${count.book} 調整為 ${count.actual}？`,()=>{
      if(count.completed || product.stock!==count.book) {showNotice("此盤點已完成或帳面數量已變更，請重新盤點。");return;}
      const change=count.actual-count.book;
      product.stock=count.actual;count.completed=true;
      movements.push({id:nextMovementId++,workspace:count.workspace,productId:product.id,type:"盤點調整",quantity:change,note:"展示假設：直接調整假庫存",time:new Date().toLocaleString("zh-TW")});
      renderPage();showNotice("盤點調整完成（僅更新假資料）");
    });
  }
});
document.querySelector("#login-form").addEventListener("submit",event=>{
  event.preventDefault();
  const account=new FormData(event.target).get("account").trim();
  const password=new FormData(event.target).get("password").trim();
  if(!account||!password) {showNotice("請輸入展示帳號及密碼。");return;}
  document.querySelector("#account-label").textContent=account;
  document.querySelector("#login").hidden=true;document.querySelector("#workspace").hidden=false;
  renderPage();content.focus();showNotice("已登入展示工作區（未連線 NAS LDAP）");
});
document.querySelector("#logout").addEventListener("click",()=>{
  document.querySelector("#workspace").hidden=true;document.querySelector("#login").hidden=false;
  document.querySelector("#login-form input").focus();showNotice("已登出，重新整理可重置假資料");
});
document.querySelector("#menu-toggle").addEventListener("click",event=>{
  const open=document.querySelector("#sidebar").classList.toggle("open");event.currentTarget.setAttribute("aria-expanded",String(open));
});

// 規劃板縮圖各自使用初始假資料；互動播放器以同一 iframe 延續操作結果。
const presentationParams=new URLSearchParams(location.search);
const embeddedDemo=presentationParams.get("embed")==="1";
const previewDemo=presentationParams.get("preview")==="1";
const presentationScenes=new Set([
  "login","overview","vendor-list","vendor-new","vendor-edit","his-list","his-edit","his-result",
  "receipt-scan","receipt-known","receipt-new","receipt-result","issue-scan","issue-form","issue-result",
  "requisition-list","requisition-new","requisition-edit","stocktake-otc","stocktake-his","stocktake-confirm","stocktake-result"
]);

function presentDemoScene(scene) {
  if(!presentationScenes.has(scene)) return;
  if(editor.open) editor.close();
  if(confirmation.open) {confirmationAction=null;confirmation.close("cancel");}
  document.querySelector("#notice").hidden=true;clearTimeout(noticeTimeout);
  document.querySelector("#login").hidden=scene!=="login";
  document.querySelector("#workspace").hidden=scene==="login";
  document.querySelector("#account-label").textContent="demo.pharmacy";
  if(scene==="login") return;
  searchTerm="";selectedProductId=null;scanBarcode="";
  activeModule=scene==="overview"?"overview":scene.startsWith("vendor-")?"vendors":scene.startsWith("his-")?"his":scene.startsWith("receipt-")?"receipt":scene.startsWith("issue-")?"issue":scene.startsWith("requisition-")?"requisitions":"stocktake";
  if(scene==="stocktake-his") stocktakeWorkspace="HIS";
  if(scene==="stocktake-otc" || scene==="stocktake-confirm") stocktakeWorkspace="OTC";
  if(previewDemo) {
    // 只在隔離的縮圖中補出結果示例；互動播放器不因切換步驟自動送出。
    if(scene==="his-result") hisMedicines[0].name="示例藥品 A（已修改）";
    if(scene==="receipt-result" || scene==="issue-result") {
      const change=scene==="receipt-result"?10:-3;
      otcProducts[0].stock+=change;
      movements.push({id:nextMovementId++,workspace:"OTC",productId:"O001",type:change>0?"入庫":"耗用",quantity:change,note:"結果示例（獨立縮圖）",time:"示範操作後"});
    }
  }
  renderPage();
  if(scene==="vendor-new") openEditor("vendors");
  if(scene==="vendor-edit") openEditor("vendors",vendors.length>5?vendors.at(-1).id:"V001");
  if(scene==="his-edit") openEditor("his","H001");
  if(scene==="requisition-new") openEditor("requisitions");
  if(scene==="requisition-edit") openEditor("requisitions",requisitions.at(-1)?.id);
  if(scene==="receipt-new") {
    let barcode="9902999990001";
    while(otcProducts.some(product=>product.barcode===barcode)) barcode=String(Number(barcode)+1);
    lookupBarcode(barcode);
  }
  if(scene==="receipt-known" || scene==="issue-form") {
    lookupBarcode(otcProducts[0].barcode);
    document.querySelector('#movement-form [name="quantity"]').value=scene==="receipt-known"?10:3;
    document.querySelector('#movement-form [name="note"]').value=scene==="receipt-known"?"示範補貨":"門診耗用";
  }
  if(scene==="stocktake-otc" || scene==="stocktake-his" || scene==="stocktake-confirm") {
    const product=(stocktakeWorkspace==="HIS"?hisMedicines:otcProducts)[0];
    lookupBarcode(product.barcode);
    const count=stocktakes.find(count=>count.workspace===stocktakeWorkspace&&count.productId===product.id&&!count.completed);
    if(scene==="stocktake-confirm") {
      count.actual=Math.max(0,count.book-2);renderPage();
      document.querySelector(`[data-action="adjust"][data-id="${count.id}"]`).click();
    }
  }
  if(editor.open) {
    const defaults=scene==="vendor-new"?{id:`V${String(vendors.length+1).padStart(3,"0")}`,name:"新晴醫材（展示）",contact:"展示聯絡人",phone:"02-0000-0200",email:"demo@example.test"}:scene==="receipt-new"?{id:`O${String(otcProducts.length+1).padStart(3,"0")}`,name:"新建示例品項",spec:"10 入",unit:"包",quantity:10,note:"未建檔入庫示範"}:scene==="requisition-new"?{productId:"O001",person:"展示護理師",department:"門診",quantity:4,note:"流程示範"}:null;
    if(defaults) {
      // 已刪除品項可能留下被使用的代碼，選擇下一個可用代碼。
      const collection=scene==="vendor-new"?vendors:otcProducts;
      if(defaults.id) {let suffix=collection.length+1;while(collection.some(entry=>entry.id===defaults.id)) defaults.id=`${scene==="vendor-new"?"V":"O"}${String(++suffix).padStart(3,"0")}`;}
      for(const [fieldName,initial] of Object.entries(defaults)) editorForm.elements.namedItem(fieldName).value=initial;
    }
  }
  if(scene.endsWith("result")&&!previewDemo) showNotice("目前顯示當次操作資料；切換畫面不會自動儲存或調整庫存。");
  if(previewDemo) document.body.inert=true;
}
if(embeddedDemo) {
  document.body.classList.add("embedded");
  if(previewDemo) {document.body.classList.add("preview-mode");document.body.inert=true;}
  document.addEventListener("click",event=>{if(event.target.closest("a")) event.preventDefault();});
  const initialScene=presentationParams.get("scene");
  if(presentationScenes.has(initialScene)) presentDemoScene(initialScene);
  if(!previewDemo) {
    window.addEventListener("message",event=>{
      if(event.source!==window.parent||window.parent===window) return;
      const request=event.data;
      if(request?.type==="fangding-dismiss-form") {
        if(editor.open) editor.close();
        if(confirmation.open) {confirmationAction=null;confirmation.close("cancel");}
        if(activeModule==="receipt"||activeModule==="issue") {selectedProductId=null;scanBarcode="";renderPage();}
        return;
      }
      if(!request||request.type!=="fangding-request-scene"||!presentationScenes.has(request.scene)) return;
      const unfinished=editor.open||confirmation.open||Boolean(document.querySelector('#movement-form [name="quantity"]')?.value);
      if(unfinished) {
        window.parent.postMessage({type:"fangding-scene-result",requestId:request.requestId,accepted:false,reason:"請先儲存、確認或取消目前的表單，再切換畫面。"},"*");
        return;
      }
      presentDemoScene(request.scene);
      window.parent.postMessage({type:"fangding-scene-result",requestId:request.requestId,accepted:true},"*");
    });
    window.parent.postMessage({type:"fangding-demo-ready"},"*");
  }
}
