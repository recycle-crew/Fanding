# shadcn/ui 元件慣例

全站 React UI 使用 shadcn/ui（官方 `new-york` registry），元件原始碼位於 `frontend/src/components/ui/`。`frontend/components.json` 是 CLI 設定，元件直接從 `cn` 套件匯入 `cn` 合併 Tailwind class；主題集中於 `styles/tailwind.css`。沿用 Tailwind CSS 4、React 19、Vite 與 React Router。

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

## 外觀由 variant 管理

呼叫端以 `variant` 選擇預先定義的外觀，不再額外拼接 `tag low`、`primary`、`callout assumption` 或選取色等外觀 class。`className` 保留給頁面寬度、間距、排列、響應式配置、可見性和穩定定位用途；尺寸選項使用 `size`。只有單一外觀的 Input／Textarea／Checkbox／Accordion 等元件沿用基底樣式，不額外製造沒有差異的 variant。

| 元件 | 外觀選項與用途 |
| --- | --- |
| BaseBadge | `secondary` 一般、`muted` 停用、`warning` 提醒；保留原 shadcn 選項 |
| BaseButton | 原選項外，提供 `primary`、`text`、狀態、唯讀說明、排序、紀錄連結、通知、商品卡片、分頁、導覽／選取及登出等既有外觀 |
| BaseAlert | `info` 作業提示、`warning` 假設提醒、`result` 結果、`notification` 浮動通知；通知位置仍由頁面配置 |
| BaseCard | `panel` 一般面板、`editor` 編輯面板、`login` 登入面板；asChild 的外觀也由 BaseCard 指定 |
| BaseLabel／BaseNativeSelect | `pagination` 管理分頁控制的字體、邊框和內距；Label 的 `field`、`check`／`check-inline`、`page-size`、`confirmation`、`inline` 管理既有欄位／勾選配置 |
| BaseSwitch | `compact` 管理既有品項開關外觀；`checked` 自動反映開關狀態，呼叫端不另拼 `on` class |
| BaseTable／BaseTableCell／BaseTableFrame | `inventory`／`lines` 選表格樣式；儲存格以 `code`、`name`、`numeric`、`expired`、`money`、`empty`／`empty-lines` 選外觀；Frame 的 `sticky-actions` 管理固定操作欄的表格樣式 |
| BaseDialogContent／Description | `workspace`／`workspace-wide`、`native`／`player` 管理視窗外觀；Description 的 `workspace` 管理既有說明樣式 |
| BaseDropdownMenuContent | `menu` 管理作業選單外觀 |

CVA 設定仍透過 `VariantProps<typeof ...>` 推導可用選項。元件內部可組合既有 CSS preset，以保留主題及斷點；呼叫端只選 variant。`disabled`、`checked`、`aria-selected` 等原生／Radix 互動狀態繼續控制對應行為與樣式，不另設一份重複的業務狀態。新增衍生 variant 時也須檢查既有 `data-variant` CSS 選擇器，例如分頁沿用 workspace outline 的主題色。

## 元件內部樣式宣告

`components/ui` 內有自身樣式的元件與部位，將固定及條件 class 集中到所屬檔案的 `xxxVariants` CVA 宣告，放在對應元件前。CardTitle、TableHeader 等子元件，以及圖示、容器、分頁列等內部部位也遵守此規則；沒有自身樣式的 Radix 透傳元件維持原狀，不新增包裝元件或空設定。

只有固定樣式時使用 `cva("...")` 或 `cva(["...", "..."])`，不增加只有 `default` 的外觀選項；有多種外觀時保留 `variants`、`defaultVariants` 與既有公開 props。互動樣式優先沿用原有 ARIA／data-state 選擇器；需要組合外觀與狀態時使用 `compoundVariants`，例如 compact Switch 的 checked 樣式直接取自既有 `checked` prop。

JSX 的 `cn` 只接樣式結果及最後的外部 `className`，不再放固定 class、外觀條件，也不將 `className` 傳入 CVA：

```tsx
className={cn(inputVariants(), className)}
className={cn(buttonVariants({ variant, size }), className)}
className={cn(switchVariants({ variant, checked }), className)}
```

內部部位沒有外部 class 時使用 `cn(iconVariants())`。完全沿用呼叫端樣式的 BaseFilterForm 保留 `props.className`，不製造沒有樣式的 variants。此規則不擴及 Layout、Home 與 features 的頁面配置；不改動 CSS hooks、DOM 結構或業務流程。

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

檢查 registry 更新造成的差異，保留上列專案調整；不要直接以 `--overwrite` 覆寫整個元件目錄。新元件統一使用 `import { cn } from "cn"`，不建立本地 `utils.ts`；`components.json` 的 `utils` alias 同步設為 `cn`，其餘外部依賴由 CLI 安裝。主題使用現有無前綴的 Tailwind utilities，與專案預設 sm／md／lg／xl／2xl 斷點一致。

registry primitives 提供共用元件；class 合併直接使用 `cn` 套件，不保留本地 cn function；既有 BaseFilterForm.controls 補上元件識別、BaseModal 管理 Portal 與原生視窗生命週期、App 的錨點 reveal 改用 Accordion trigger。沒有搬動業務 method 或重寫 store 的交易規則。

## 驗證範圍

沿用 `docs/ui-case-matrix.md` 的完整正常、錯誤、找不到、取消、重試、權限與設備模擬案例。`shadcn.test.js` 新增鍵盤焦點限制、Esc／取消、焦點回復，以及規劃板關閉重開保留實際新增廠商；`rwd.test.js` 新增四種尺寸的 Accordion 鍵盤、原生選擇欄、資料表與確認視窗案例。

執行結果與截圖檢視另記於 `docs/ui-testing.md`。實際相機、USB／藍牙掃碼槍、NAS／HIS、正式後端及部署仍依案例清單標示待驗證。
