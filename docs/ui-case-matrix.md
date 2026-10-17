# 畫面測試案例清單

## shadcn/ui 全站遷移（2026-10-17）

| 需求 | 預期畫面與來源 | 驗證狀態／限制 |
| --- | --- | --- |
| 全站 UI 原始碼 | App、五個頁面模組、共用版面與 features 的控制項使用 shadcn Button／Input／Label／NativeSelect；所有表格經 Table primitives；主面板／狀態／作業提示使用 Card／Badge／Alert | 原始碼盤點與 typecheck；視覺結果依 ui-testing.md |
| 表單／查詢／權限 | 登入必填、忘記密碼、一般人員補填／高權限編輯、CRUD、重複值、日期與數量驗證、各頁篩選保留；react-flows、barcode、batch-filters、historical-cost | 正式身分及後端資料仍待整合 |
| 表格／分頁／Excel | 每頁筆數／頁碼變更、首末頁焦點、所有分頁實際 XLSX、載入失敗及重試；既有功能 spec | 真實後端完整資料仍待驗證 |
| 確認／唯讀 Dialog | 取消不執行、確認只執行一次、Esc、Tab 限制於視窗、關閉後回復焦點；shadcn.spec.js 及既有 CRUD／傳票／盤點 spec | Windows Chromium 鍵盤與手機模擬；實際輔具未驗收 |
| 規劃板 Dialog | 開啟七種分類、切換步驟、關閉再開保留實際新增廠商；shadcn.spec.js、rwd.spec.js | iframe 仍為當次記憶體展示，重新整理不持久化 |
| 文件 Accordion | 可用 Enter／Space 展開收合，跨路由／深連結錨點自動展開；spa.spec.js、rwd.spec.js | 未列出的特殊錨點組合仍待驗證 |
| 四尺寸 RWD | 320／390／768／1440px 的全部頁面、模組、表單、Dialog、表格獨立捲動、手機導覽及斷點兩側；rwd.spec.js | 執行結果與截圖檢視在 ui-testing.md；其他尺寸與實機依下表保留 |
| 主動作與選取狀態 | 重試按鈕及出入庫選取分類文字可讀，選取分類使用 default variant；SPA 錯誤測試與新增 RWD shadcn case | 截圖先擷取檢視，不能只以 DOM／style 值作為完成證據 |

元件來源、專案客製與各檔責任見 [shadcn/ui 慣例](shadcn-ui.md)。下方既有案例保留作為本次遷移的功能檢核來源；歷史執行結果不當成本次結果。

## IA_Map 組織與 Redux 遷移

| 需求 | 預期結果與測試來源 | 待驗證 |
| --- | --- | --- |
| 前端子專案 | 根目錄 workspace 指令及 frontend 直接指令可建置，frontend/dist 僅一份 HTML；build 與 build-smoke.spec.js | 正式主機部署 |
| Redux 狀態 | 登入、權限、主檔、傳票、盤點及歷史成本操作保留原行為；沿用各功能 spec | NAS／HIS／後端正式資料 |
| Redux 完整性 | 全部案例監看不可序列化及 state mutation 訊息，出現即失敗；tests/test-api.cjs | 未列出的真實資料組合 |
| 路由與頁面分層 | pages 與 router/routes 搬移後，深連結、上一頁、未完成表單保護、iframe、錯誤重試可用；spa.spec.js、react-flows.spec.js、rwd.spec.js | 正式主機 rewrite |
| 模組 Layout／子頁 | 五個 Layout 只選擇 BaseLayout 版型，Outlet 承載 Home；Demo 具體內容在 Home。切頁保留側欄／頂部導覽，手機選單切換後收合，編輯取消回到列表；rwd.spec.js「RWD Demo Layout 承載子頁並保留工作區」 | 正式身分與權限整合 |
| Home 流程生命週期 | 四種尺寸登入／密碼重設／工作區／阻擋切頁／登出、上一頁／下一頁及登入欄位保留已於 shadcn 改寫前驗證；rwd.spec.js「RWD Layout 外框與 Home 登入流程及切頁保護」，五種狀態共 20 張實際畫面已檢視，見 ui-review/layout-home | 驗證期間另有 shadcn／Radix 改寫，BaseModal ref 為 null 導致後續失敗；最新工作樹整合後須重驗。NAS LDAP／真實帳密、其他裝置仍未驗收 |
| 架構文件一致 | 畫面與 Markdown 目錄反映 Layout／Home、Redux 與 workspace；四種尺寸檢視目錄截圖及水平捲動；rwd.spec.js「RWD IA_Map 前端組織與 Redux 文件」 | 後端與正式 OTC API 尚為規劃 |
| Tailwind 全站樣式 | 官方 Vite plugin 編譯主入口 utilities 與頁面 apply；既有全站與功能截圖維持容許值比對，build-smoke 驗證正式產物 | 正式主機部署 |
| Tailwind RWD 斷點 | 320／390／768／1440px 全站案例，另以「RWD Tailwind 版面斷點兩側」核對本次使用的 sm／md／lg 邊界 639／640、767／768、1023／1024px，檢查表單、導覽、文件及規劃板 | 本次瀏覽器案例未執行、截圖未更新；其他未列出的視窗尺寸、實機設備仍未驗收 |
| 相機切頁清理 | React effect 非同步釋放後串流與 decoder 均停止；barcode-cases.spec.js 的 close／navigate／logout 共 12 次重跑通過，保留使用者可見截圖 | 真實手機鏡頭與掃碼槍 |
| 列印及 reduced-motion | Tailwind 遷移保留既有規則 | 本輪未另作獨立畫面驗收 |
| 畫面一致性 | 320／390／768／1440px 的頁面、導覽、表單、視窗及獨立表格捲動與原基準比對；rwd.spec.js | 實機相機與掃碼槍仍未驗收 |

## SPA 遷移對照

| 需求／案例 | 預期畫面與驗證來源 | 尚需驗證 |
| --- | --- | --- |
| 單一入口與深層路由 | 正式 dist 僅一份 index.html，四個主要路由及盤點深連結可直接開啟；`build-smoke.spec.js` | 正式主機 rewrite 與實際部署 |
| 跨頁資料保留 | Demo 新增廠商後切換規劃、架構、規劃板再返回，登入及資料保留且主視窗沒有 document 請求；`spa.spec.js` | 真實 NAS 身分與後端持久化 |
| 重新整理與舊連結 | 深層路由重新整理保留網址並回到登入，舊 HTML／盤點 hash 轉向新路徑，保留 embed 參數；`spa.spec.js` | 非 Vite 主機的回退設定 |
| 未完成表單、取消及重試 | 編輯時上一頁被阻擋，表單及目前網址保留，儲存後可繼續；`react-flows.spec.js` | 瀏覽器重新整理／離站仍依 Demo 規則重置，不提供離站資料復原 |
| 文件錨點 | 跨路由開啟 details 並捲到指定段落，返回需求表列時顯示正確分頁；`spa.spec.js` | 未列出的特殊錨點組合 |
| 找不到頁面 | 顯示提示及可操作的返回首頁連結；`spa.spec.js`、`rwd.spec.js` | 無 |
| 載入失敗／重試 | 模擬頁面模組下載失敗，顯示重載按鈕；解除錯誤後可重新載入；`spa.spec.js` | 正式 CDN 更新／離線情境 |
| 延遲載入 | 等待模組下載時顯示載入狀態，下載完成後顯示實際頁面；`spa.spec.js` | 真實弱網路與離線恢復 |
| 手機／平板／桌面 | 跨頁切換、上一頁／下一頁及錯誤頁於 320／390／768／1440px 不溢出並比較截圖；既有模組、表單、視窗與表格獨立捲動沿用 `rwd.spec.js` | 實機相機／掃碼槍仍未驗收 |

SPA 新增與有差異的截圖先透過 capture 模式擷取並檢視，再接受指定基準並執行一般比對。頁面測試須先等待實際標題或登入表單，避免將延遲載入中的畫面接受為基準。下方 React 遷移數量為先前紀錄，本次 SPA 執行結果另記於 ui-testing.md。

## React 重構對照

| 範圍 | 使用者可見結果與測試來源 |
| --- | --- |
| 共用 BaseLayout | Planning／Architecture 共用 BaseHeader、BaseFooter；Demo 由 BaseLayout 組合 BaseSidebar 與頂部導覽；RWD 檢查 header、sidebar、footer 與子頁內容 |
| 四個頁面與十個模組 | 保留頁面、導覽、表單、表格捲動及 320／390／768／1440px；`rwd.spec.js` |
| 登入／忘記密碼 | 必填阻擋、展示申請結果、返回登入；`react-flows.spec.js` |
| 廠商與權限 | 新增、重複代碼錯誤、一般人員唯讀／補填、高權限修改歷程、被引用不得刪除、取消及確認刪除；`react-flows.spec.js` |
| 品項與搜尋 | 料號／條碼重複、日期前後驗證、新增與高權限改價、刪除、搜尋鍵盤選取／Escape／無結果；`react-flows.spec.js` |
| 匯出錯誤 | 套件載入失敗提示、按鈕恢復可重試、空結果可下載；`react-flows.spec.js` |
| 領用 | 新增不足時不扣庫、成功後可查詢、刪除回復、查無結果；`react-flows.spec.js` |
| 盤點 | 草稿、表單未完成時路由保護、確認取消、整批鎖定、歷史更正保留原值與目前庫存、直接連結及上一頁；`react-flows.spec.js` |
| 出入庫、相機、批次、成本 | 沿用原有四組功能測試，初始化改由測試模式入口，仍驗證可見結果及下載；原有對應 spec |
| build 產物 | 單一 HTML、四個主要路由、錨點、深連結、iframe、XLSX、本機辨識套件、正式版無測試入口；`build-smoke.spec.js` |

此表是本次重構的追蹤範圍，並不把下方尚需驗證的實機、NAS／HIS、正式後端或其他未覆蓋邊界標為完成。

2026-10-16 執行結果：Windows Chromium 156.0.8078.4，一般模式完整 322 次通過（142 次功能流程、180 次 RWD），正式 build 另有 8 次通過；TypeScript 與 build 通過。新增／變更截圖已檢視，再執行一般基準比對；完整驗證方式與單張基準差異處理見 [畫面測試規範](ui-testing.md)。這是上述案例的結果，不是未列出資料組合或實機範圍的覆蓋證明。

這份清單以使用者操作和錯誤分支核對覆蓋範圍。通過測試不等於整個系統已全面驗收；未覆蓋項目必須保留，不能省略或以模擬設備代替實機結果。

## 入庫／出庫：已建立瀏覽器與畫面測試

以下案例在 Windows Chromium 的電腦及手機模擬版面執行。每個測試有畫面截圖比對；需要資源釋放的案例也檢查串流與辨識器停止。

| 案例 | 預期結果 | 測試來源 |
| --- | --- | --- |
| 進入入庫／出庫頁 | 電腦自動聚焦；手機不自動彈鍵盤，可見相機按鈕 | barcode.spec.js |
| 掃碼槍輸入＋Enter | 顯示品項，取消後可再掃描 | barcode.spec.js |
| 條碼不存在／前導零 | 保留原條碼、顯示紅字，入庫可選擇新增 | barcode.spec.js |
| 正常入庫／出庫 | 只新增一筆異動，庫存及填寫人員一致 | barcode-cases.spec.js |
| 空白條碼 | 必填驗證，不查詢／不扣庫 | barcode-cases.spec.js |
| 停用品項 | 可查看，但不得入出庫 | barcode-cases.spec.js |
| 數量 0、負數、小數、超上限 | 驗證不通過、原庫存保留 | barcode-cases.spec.js |
| 出庫用途空白 | 必填驗證，不扣庫 | barcode-cases.spec.js |
| 出庫超過庫存 | 紅字提示，修正數量後可重試 | barcode-cases.spec.js |
| 未建檔品項取消 | 保留未建檔狀態，不建立／不入庫 | barcode-cases.spec.js |
| 未建檔品項建立入庫 | 條碼保留前導零，新增品項與入庫一致 | barcode-cases.spec.js |
| 相機指定後鏡頭 | 請求 exact environment | barcode.spec.js |
| 未辨識出條碼 | 維持掃描，不查詢／不異動 | barcode-cases.spec.js |
| 相機辨識成功 | 查詢品項並釋放串流及辨識器 | barcode-cases.spec.js |
| 等待授權時取消 | 遲到的串流仍關閉，不出現過期查詢 | barcode-cases.spec.js |
| 關閉相機／切頁／登出 | 串流及辨識器停止，畫面狀態正確 | barcode-cases.spec.js |
| 快速重開／多個授權請求 | 只使用最新授權，舊串流釋放 | barcode-cases.spec.js |
| 背景化／返回 | 停止掃描、不接受過期結果，返回可重開 | barcode-cases.spec.js |
| 權限拒絕 | 顯示可理解提示，可關閉 | barcode.spec.js |
| 後鏡頭不可用 | 顯示提示，不回退前鏡頭 | barcode.spec.js |
| 找不到鏡頭／鏡頭被占用 | 顯示提示，可重試 | barcode-cases.spec.js |
| 辨識套件載入失敗 | 顯示提示，可重試 | barcode-cases.spec.js |
| 瀏覽器相機 API 不支援 | 提示安全網址及替代輸入，鍵盤掃碼仍可用 | barcode-cases.spec.js |

目前共 40 個測試案例 × 2 種版面 = 80 次執行。數量不是覆蓋證明：每次需求變更仍需逐項檢查受影響的分支，補測後才能結束。

## 尚需驗證，不能標成完成

| 範圍 | 待驗證內容 |
| --- | --- |
| 實際設備 | iOS Safari／Android Chrome 授權、實際後鏡頭、印製條碼辨識、USB／藍牙掃碼槍 Enter 設定與連續掃描 |
| NAS LDAP | 真實登入、群組權限及忘記密碼；目前只有 Demo |
| 其他未列出的業務邊界 | 本次已補上表首所列 CRUD、權限、領用、盤點鎖定／更正及鍵盤搜尋，原有篩選／分頁／Excel 與側欄測試保留；未列出的資料組合、正式權限映射與後端一致性仍未驗收，不能以案例總數判定零缺漏 |
| 其他掃碼邊界 | SDK 真實解碼、作業系統背景切換與真實設備多鏡頭仍需實機案例；本機背景化測試模擬 visibilitychange |

後續修改哪個功能，就補齊那個功能的正常、錯誤、邊界、取消／重試、權限及不同裝置案例；報告需同時列出通過與待驗證項目。

## 全站 RWD

批次篩選新增 `batch-filters.spec.js` 八個案例 × 電腦／手機 = 16 次：總覽、入庫、出庫的完整編號／日期前綴查詢、跨日預設解除、多料號同批次、分頁與實際 XLSX、料號／人員／日期交集、清除、無符合資料、分類頁籤、各頁條件獨立及盤點維持品項核對。RWD 另在四種尺寸驗證三頁的批次查詢畫面。

傳票新增 `vouchers.spec.js` 八個案例 × 電腦／手機 = 16 次：多筆整批送出與確認取消、送出鎖定與防重複、同日出入庫共用序列與跨日、取消不回收、999 上限、庫存變化導致整批失敗／修正重試、重複料號累計／移除／取消，以及送出重新驗證啟用與數量、明細分頁及實際 XLSX 匯出。既有掃碼成功／未建檔／不足重試案例改為整批送出後才核對庫存。RWD 另涵蓋出／入庫傳票草稿、確認視窗與鎖定畫面。

`rwd.spec.js` 檢查 index／architecture／board／demo 四個頁面、Demo 十個模組（四個大分類有圖示、功能細項僅文字）、各新增／編輯頁、忘記密碼、盤點編輯與歷史更正、確認／唯讀視窗、相機提示及七個流程分類的互動 iframe。固定尺寸 320、390、768、1440px，另在本次使用的 sm／md／lg breakpoint 兩側測試 639／640、767／768、1023／1024px，確認未送出表單不遺失。本次依使用者要求只更新案例、未執行瀏覽器測試，也未更新截圖。

判定包含整頁不橫向溢出、表單／按鈕不超出螢幕、寬表格在容器中可捲到最後一欄、手機導覽可操作、表單儲存按鈕可捲到，以及各畫面截圖比對。RWD 驗證不取代其餘模組的業務功能驗收。

React 重構前 RWD 為 44 個案例 × 4 種尺寸 = 176 次執行；與既有掃碼 80 次合併，共 256 次；另含傳票 16 次及批次篩選 16 次，另含歷史成本 8 次，共 296 次。修正案例包含 320px 側欄拉柄導致整頁溢出，以及 768px 導覽被主頁搜尋欄遮擋；測試檢查選單中心的實際點擊命中元素。

## 歷史平均成本價

`historical-cost.spec.js` 在電腦及手機各跑四個案例：兩張入庫傳票數量加權與成本快照、主檔改價不回寫、草稿／取消／出庫排除、缺價與零元、批次／料號／人員／期間交集、無結果／錯誤重試、分頁與 XLSX 全明細、單價小數驗證及送出再驗證。`rwd.spec.js` 另外涵蓋新模組及有資料成本表於四種尺寸的畫面與獨立表格捲動。數量加權平均算法已於 2026-10-15 由使用者確認；正式後端持久化、稅額／運費／退貨／幣別規則仍未驗收。
