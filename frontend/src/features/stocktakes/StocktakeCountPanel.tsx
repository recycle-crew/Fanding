import { useRef, useState } from "react";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseField as Field } from "@/components/ui/BaseForm";
import { BaseCheckField } from "@/components/ui/BaseCheckField";
import { BaseDataTable } from "@/components/ui/BaseDataTable";
import { useAppDispatch } from "@/store/hooks";
import { addCount, finishCounting, submitRecount } from "@/store/stocktakes";
import { countFor, countableRound, supervisor } from "./model";
import type { Stocktake } from "@/types/stocktakes";
export function StocktakeCountPanel({
  order,
  person,
  onDirty,
  onInvalidate,
}: {
  order: Stocktake;
  person: string;
  onDirty: (value: boolean) => void;
  onInvalidate: (recordId: string) => void;
}) {
  const dispatch = useAppDispatch(),
    searchRef = useRef<HTMLInputElement>(null),
    errorRef = useRef<HTMLParagraphElement>(null);
  const [search, setSearch] = useState(""),
    [selected, setSelected] = useState(""),
    [quantity, setQuantity] = useState("1"),
    [zero, setZero] = useState(false),
    [area, setArea] = useState(""),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const choices = order.scope.filter(
    (scope) =>
      countableRound(order, scope.itemId, person) &&
      `${scope.code} ${scope.name} ${scope.barcode}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const canInput = order.scope.some((scope) =>
    countableRound(order, scope.itemId, person),
  );
  const item = order.scope.find((scope) => scope.itemId === selected),
    round = item ? countableRound(order, item.itemId, person) : null;
  const records = order.records.filter(
    (record) => person === supervisor || record.person === person,
  );
  const pendingRecounts = order.recounts.filter(
    (row) => row.person === person && row.status === "待複盤",
  );
  function fail(message: string) {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  }
  function save() {
    if (!item) return fail("請先選擇盤點範圍內的商品。");
    const result = dispatch(
      addCount({
        id: order.id,
        recordId: crypto.randomUUID(),
        itemId: item.itemId,
        quantity: zero ? 0 : Number(quantity),
        zero,
        area,
      }),
    );
    if (result.error) return fail(result.error);
    setSelected("");
    setSearch("");
    setQuantity("1");
    setZero(false);
    setArea("");
    setError("");
    setNotice(`已登錄 ${item.name}；原始紀錄採新增保留。`);
    onDirty(false);
    searchRef.current?.focus();
  }
  return (
    <>
      <section className="stocktake-card">
        <h3>{canInput ? "新增盤點紀錄（盲盤）" : "盤點輸入已結束"}</h3>
        <p>
          輸入本次實際清點數量，多次登錄會累加。員工只看本人紀錄，無批號選擇或帳面數量。
        </p>
        {!canInput && (
          <p>
            本人已完成、盤點已關閉或目前沒有被指派的待複盤任務；可在下方查看本人紀錄。
          </p>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (selected) save();
            else if (choices.length === 1) {
              setSelected(choices[0].itemId);
              onDirty(true);
            } else
              fail(
                choices.length
                  ? "符合多筆商品，請選擇後輸入。"
                  : "查無可盤點商品，或不在本人可輸入範圍。",
              );
          }}
        >
          <Field name="stocktake-scan" label="掃碼／搜尋盤點商品">
            <BaseInput
              disabled={!canInput}
              ref={searchRef}
              value={search}
              placeholder="條碼、料號或品名；Enter 選擇"
              onChange={(event) => {
                setSearch(event.target.value);
                setSelected("");
                onDirty(Boolean(event.target.value));
              }}
            />
          </Field>
          <div className="stocktake-choice-list">
            {search &&
              !selected &&
              choices.map((scope) => (
                <BaseButton
                  type="button"
                  key={scope.itemId}
                  variant="outline"
                  onClick={() => {
                    setSelected(scope.itemId);
                    onDirty(true);
                  }}
                >
                  {scope.code} {scope.name} ／ {scope.specification} ／{" "}
                  {scope.unit}
                </BaseButton>
              ))}
          </div>
          {item && (
            <div className="stocktake-selected">
              <strong>
                {item.code} {item.name}
              </strong>
              <p>
                {item.specification} ／ {item.unit} ／ 第 {round} 輪
              </p>
              <div className="stocktake-form-grid">
                <Field
                  name="stocktake-quantity"
                  label="本次盤點數量"
                  required={!zero}
                >
                  <BaseInput
                    type="number"
                    min="0.001"
                    step="0.001"
                    disabled={zero}
                    value={quantity}
                    onChange={(event) => {
                      setQuantity(event.target.value);
                      onDirty(true);
                    }}
                  />
                </Field>
                <Field name="stocktake-area" label="存放位置／分工備註">
                  <BaseInput
                    value={area}
                    maxLength={200}
                    onChange={(event) => {
                      setArea(event.target.value);
                      onDirty(true);
                    }}
                  />
                </Field>
              </div>
              <BaseCheckField
                label="已現場確認此品項實盤為零（明確零值紀錄）"
                checked={zero}
                onChange={(value) => {
                  setZero(value);
                  onDirty(true);
                }}
              />
              <BaseButton type="submit">確認登錄</BaseButton>
            </div>
          )}
          {error && (
            <p
              ref={errorRef}
              role="alert"
              tabIndex={-1}
              className="items-error"
            >
              {error}
            </p>
          )}
          <p role="status" aria-live="polite">
            {notice}
          </p>
        </form>
        {order.status === "盤點中" && order.people.includes(person) && (
          <BaseButton
            variant="outline"
            disabled={order.finished.includes(person)}
            onClick={() => {
              if (selected || search) return fail("請先完成或清除目前輸入。");
              const result = dispatch(finishCounting(order.id));
              if (result.error) fail(result.error);
              else setNotice("已確認本人分區盤點完成；如需更正請由主管核對。");
            }}
          >
            {order.finished.includes(person)
              ? "本人已完成"
              : "本人分區盤點完成"}
          </BaseButton>
        )}
        {pendingRecounts.map((recount) => (
          <div className="stocktake-recount-task" key={recount.id}>
            <p>
              複盤：
              {
                order.scope.find((scope) => scope.itemId === recount.itemId)
                  ?.name
              }{" "}
              ／ 第 {recount.round} 輪 ／ {recount.reason}
            </p>
            <BaseButton
              variant="outline"
              onClick={() => {
                if (selected || search) return fail("請先完成或清除目前輸入。");
                const result = dispatch(
                  submitRecount({ id: order.id, recountId: recount.id }),
                );
                if (result.error) fail(result.error);
                else setNotice("複盤已提交，等待主管選擇有效輪次。");
              }}
            >
              提交第 {recount.round} 輪複盤
            </BaseButton>
          </div>
        ))}
      </section>
      <section className="stocktake-card">
        <h3>
          {person === supervisor ? "盤點輸入紀錄（主管）" : "我的盤點紀錄"}
        </h3>
        <p>錯誤輸入由主管標記無效並保留原因，不直接覆寫或刪除。</p>
        <BaseDataTable
          tableKey={`stocktake-records-${order.id}-${person}`}
          exportable={false}
          headers={[
            "時間",
            "品名",
            "規格",
            "數量",
            "單位",
            "輪次",
            "位置／備註",
            ...(person === supervisor ? ["盤點人員"] : []),
            "狀態",
            ...(person === supervisor ? ["操作"] : []),
          ]}
          rows={records.map((record) => {
            const scope = order.scope.find(
              (row) => row.itemId === record.itemId,
            )!;
            return [
              record.time,
              scope.name,
              scope.specification,
              record.zero ? "確認為零" : record.quantity,
              scope.unit,
              record.round,
              record.area || "—",
              ...(person === supervisor ? [record.person] : []),
              record.valid
                ? "有效"
                : `無效：${record.invalidReason}（${record.invalidatedBy} ${record.invalidatedAt}）`,
              ...(person === supervisor
                ? [
                    <BaseButton
                      variant="outline"
                      disabled={
                        !record.valid ||
                        ["已完成", "已作廢"].includes(order.status)
                      }
                      onClick={() => onInvalidate(record.id)}
                    >
                      標記無效 {record.id}
                    </BaseButton>,
                  ]
                : []),
            ];
          })}
        />
        {person !== supervisor && (
          <p>
            本人各輪累計（不同輪次不相加）：
            {order.scope
              .map((scope) => {
                const rounds = [
                  ...new Set(
                    records
                      .filter((record) => record.itemId === scope.itemId)
                      .map((record) => record.round),
                  ),
                ];
                return rounds
                  .map(
                    (number) =>
                      `${scope.name} 第 ${number} 輪 ${countFor(order, scope.itemId, number, person).quantity} ${scope.unit}`,
                  )
                  .join("；");
              })
              .filter(Boolean)
              .join(" ／ ") || "尚無紀錄"}
          </p>
        )}
      </section>
    </>
  );
}
