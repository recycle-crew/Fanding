import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BaseAccordion,
  BaseAccordionContent,
  BaseAccordionItem,
  BaseAccordionTrigger,
} from "../../../src/components/ui/BaseAccordion";
import {
  BaseAlert,
  BaseAlertDescription,
  BaseAlertTitle,
} from "../../../src/components/ui/BaseAlert";
import { BaseBadge } from "../../../src/components/ui/BaseBadge";
import { BaseButton } from "../../../src/components/ui/BaseButton";
import {
  BaseCard,
  BaseCardAction,
  BaseCardContent,
  BaseCardDescription,
  BaseCardFooter,
  BaseCardHeader,
  BaseCardTitle,
} from "../../../src/components/ui/BaseCard";
import { BaseCheckField } from "../../../src/components/ui/BaseCheckField";
import {
  BaseDialog,
  BaseDialogContent,
  BaseDialogDescription,
  BaseDialogFooter,
  BaseDialogHeader,
  BaseDialogTitle,
  BaseDialogTrigger,
} from "../../../src/components/ui/BaseDialog";
import { BaseField, BaseForm } from "../../../src/components/ui/BaseForm";
import { BaseInput } from "../../../src/components/ui/BaseInput";
import {
  BaseNativeSelect,
  BaseNativeSelectOption,
  BaseNativeSelectOptGroup,
} from "../../../src/components/ui/BaseNativeSelect";
import { BaseSwitch } from "../../../src/components/ui/BaseSwitch";
import {
  BaseTable,
  BaseTableBody,
  BaseTableCaption,
  BaseTableCell,
  BaseTableFooter,
  BaseTableHead,
  BaseTableHeader,
  BaseTableRow,
} from "../../../src/components/ui/BaseTable";
import { BaseTabs } from "../../../src/components/ui/BaseTabs";
import { BaseTextarea } from "../../../src/components/ui/BaseTextarea";

function UiComponents() {
  const [checked, setChecked] = useState(false);
  const [tab, setTab] = useState("first");
  return (
    <main
      id="ui-components"
      style={{
        padding: 16,
        display: "grid",
        gap: 16,
        maxWidth: 900,
        margin: "auto",
      }}
    >
      <BaseCard>
        <BaseCardHeader>
          <BaseCardTitle>共用元件樣式</BaseCardTitle>
          <BaseCardDescription>
            固定樣式、外部覆寫與互動狀態
          </BaseCardDescription>
          <BaseCardAction>
            <BaseBadge variant="outline">預覽</BaseBadge>
          </BaseCardAction>
        </BaseCardHeader>
        <BaseCardContent style={{ display: "grid", gap: 12 }}>
          <BaseInput
            aria-label="外部覆寫"
            className="h-11"
            defaultValue="高度覆寫"
          />
          <BaseInput aria-label="停用輸入" disabled defaultValue="停用" />
          <BaseTextarea aria-label="說明" defaultValue="多行輸入" />
          <BaseNativeSelect aria-label="分類" size="sm" defaultValue="medicine">
            <BaseNativeSelectOptGroup label="品項分類">
              <BaseNativeSelectOption value="medicine">
                藥品
              </BaseNativeSelectOption>
              <BaseNativeSelectOption value="supply">
                耗材
              </BaseNativeSelectOption>
            </BaseNativeSelectOptGroup>
          </BaseNativeSelect>
          <BaseCheckField
            label="確認內容"
            checked={checked}
            onChange={setChecked}
          />
          <BaseSwitch
            aria-label="一般開關"
            checked={checked}
            onClick={() => setChecked(!checked)}
          />
          <BaseSwitch aria-label="停用開關" checked={true} disabled />
        </BaseCardContent>
        <BaseCardFooter style={{ gap: 8, flexWrap: "wrap" }}>
          <BaseButton>預設按鈕</BaseButton>
          <BaseButton variant="outline">外框按鈕</BaseButton>
          <BaseButton disabled>停用按鈕</BaseButton>
        </BaseCardFooter>
      </BaseCard>
      <BaseAlert>
        <BaseAlertTitle>預設提示</BaseAlertTitle>
        <BaseAlertDescription>
          <p>提示的標題與內容維持可讀。</p>
        </BaseAlertDescription>
      </BaseAlert>
      <BaseAccordion type="single" collapsible>
        <BaseAccordionItem value="details">
          <BaseAccordionTrigger>展開詳細資訊</BaseAccordionTrigger>
          <BaseAccordionContent>詳細資訊內容</BaseAccordionContent>
        </BaseAccordionItem>
      </BaseAccordion>
      <BaseTabs
        id="style-tabs"
        label="樣式頁籤"
        value={tab}
        options={[
          { value: "first", label: "第一頁" },
          { value: "second", label: "第二頁" },
        ]}
        onChange={setTab}
      />
      <div className="table-wrap" style={{ overflowX: "auto" }}>
        <BaseTable>
          <BaseTableCaption>元件資料表</BaseTableCaption>
          <BaseTableHeader>
            <BaseTableRow>
              <BaseTableHead>名稱</BaseTableHead>
              <BaseTableHead>數量</BaseTableHead>
            </BaseTableRow>
          </BaseTableHeader>
          <BaseTableBody>
            <BaseTableRow>
              <BaseTableCell>範例品項</BaseTableCell>
              <BaseTableCell>12</BaseTableCell>
            </BaseTableRow>
          </BaseTableBody>
          <BaseTableFooter>
            <BaseTableRow>
              <BaseTableCell>合計</BaseTableCell>
              <BaseTableCell>12</BaseTableCell>
            </BaseTableRow>
          </BaseTableFooter>
        </BaseTable>
      </div>
      <BaseForm
        submitText="送出測試表單"
        onCancel={() => undefined}
        onDirty={() => undefined}
        submit={() => ({ field: "style-name", message: "測試表單錯誤" })}
      >
        <BaseField name="style-name" label="測試名稱" hint="請填寫名稱">
          <BaseInput />
        </BaseField>
      </BaseForm>
      <BaseDialog>
        <BaseDialogTrigger asChild>
          <BaseButton variant="outline">開啟預設視窗</BaseButton>
        </BaseDialogTrigger>
        <BaseDialogContent>
          <BaseDialogHeader>
            <BaseDialogTitle>預設視窗</BaseDialogTitle>
            <BaseDialogDescription>
              確認鍵盤取消與焦點回復。
            </BaseDialogDescription>
          </BaseDialogHeader>
          <p>視窗內容</p>
          <BaseDialogFooter showCloseButton />
        </BaseDialogContent>
      </BaseDialog>
    </main>
  );
}

// 在真實瀏覽器載入實際元件，補足目前頁面尚未使用的 Card／Alert／Dialog 子元件。
export function mountUiComponents() {
  const app = document.getElementById("root");
  if (app) app.style.display = "none";
  const host = document.createElement("div");
  document.body.append(host);
  createRoot(host).render(<UiComponents />);
}
