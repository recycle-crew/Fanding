# shadcn/ui 元件慣例

全站 React UI 使用 shadcn/ui（官方 `new-york` registry），元件原始碼位於 `frontend/src/components/ui/`。`frontend/components.json` 是 CLI 設定，`frontend/src/lib/utils.ts` 的 `cn` 合併 Tailwind class；主題集中於 `styles/tailwind.css`。沿用 Tailwind CSS 4、React 19、Vite 與 React Router。

## 使用位置與責任

| 元件 | 使用範圍 |
| --- | --- |
| Button | 共用 Header／Sidebar、規劃板操作、所有表單／資料列動作、文件 CTA、錯誤重試／返回 |
| Input、Label、NativeSelect、NativeSelectOption | 登入、密碼申請、主檔編輯、查詢、出入庫、盤點、分頁選擇 |
| Table、TableHeader／Body／Row／Head／Cell／Caption | 文件需求表、所有 Demo 資料表及成本明細；BaseTableFrame 擁有分頁、捲動與 Excel 匯出 |
| Card | 登入／密碼申請、資料維護表單、各功能面板、文件概要；asChild 保留 form／aside 語意 |
| Badge、Alert | 主檔狀態、低庫存、盤點鎖定及作業假設提示 |
| Checkbox | 盤點逐筆確認；onCheckedChange 轉成領域所需的 boolean |
| Accordion | 規劃待確認問題、架構開發準備事項；錨點可展開對應項目 |
| Dialog | BaseModal 的確認、唯讀提示與規劃板互動播放器 |

新增 UI 應直接組合上述元件。`BaseDataTable`、`BaseFilterForm`、`BaseModal` 負責跨頁的應用規則；業務狀態、交易、權限判斷與表單提交仍由既有 Home、features、store 擁有，不放入 shadcn primitives。

## 專案調整

- 使用 Native Select 保留 FormData、required、原生 change 事件、selectOption、自動聚焦和既有查詢契約。BaseFilterForm 直接識別 Input／NativeSelect，保留各表尚未送出的條件。
- Table 的捲動容器由 BaseTableFrame 提供，移除 registry Table 額外的 overflow 容器，讓資料表的標籤、焦點、捲動與匯出指向同一份表格。
- Label 預設為欄位標題與控制項上下排列；需要橫排的標籤在呼叫端加 flex。NativeSelect wrapper 填滿欄位寬度。
- Card 增加 asChild，避免表單改成 div、巢狀 form 或丟失原有提交／無障礙語意。卡片內的間距由各使用頁面決定。
- BaseModal 以 DialogContent asChild 承載原生 dialog。原生 top layer、Esc、焦點限制／回復與 method=dialog 保留；Dialog 提供共用樣式及標題／描述。標準視窗依開啟狀態掛載；播放器使用 forceMount 保留同一 iframe 的記憶體資料。DialogContent 的 asChild 分支只渲染單一 child，Portal 同步 forceMount。
- 沒有載入全域 Preflight，保留文件排版與原生驗證；僅對 data-slot 元件補上 border solid／box sizing。主題使用 shadcn 的 background、foreground、card、primary、secondary、muted、accent、destructive、border、input、ring token。
- 廠商搜尋是專案的組合元件，使用 Input、Button 與既有選項狀態／鍵盤流程；側欄拖曳、縮放畫布、掃碼與 iframe 通訊維持各自的專案行為。

## 維護與新增元件

```powershell
cd frontend
npx shadcn@latest add <component>
```

檢查 registry 更新造成的差異，保留上列專案調整；不要直接以 `--overwrite` 覆寫整個元件目錄。新元件的 cn 匯入統一指向 `@/lib/utils`，其餘外部依賴由 CLI 安裝。主題使用現有無前綴的 Tailwind utilities，與專案預設 sm／md／lg／xl／2xl 斷點一致。

此次新增的 functions 是 registry primitives、cn；既有 BaseFilterForm.controls 補上元件識別、BaseModal 管理 Portal 與原生視窗生命週期、App 的錨點 reveal 改用 Accordion trigger。沒有搬動業務 method 或重寫 store 的交易規則。

## 驗證範圍

沿用 `docs/ui-case-matrix.md` 的完整正常、錯誤、找不到、取消、重試、權限與設備模擬案例。`shadcn.test.js` 新增鍵盤焦點限制、Esc／取消、焦點回復，以及規劃板關閉重開保留實際新增廠商；`rwd.test.js` 新增四種尺寸的 Accordion 鍵盤、原生選擇欄、資料表與確認視窗案例。

執行結果與截圖檢視另記於 `docs/ui-testing.md`。實際相機、USB／藍牙掃碼槍、NAS／HIS、正式後端及部署仍依案例清單標示待驗證。
