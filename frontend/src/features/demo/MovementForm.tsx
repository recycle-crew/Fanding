import { useDemo } from "./store";
import type { Product } from "./types";
export function MovementForm({ product }: { product: Product }) {
  const { state: s, dispatch } = useDemo();
  const draft = s.movementDraft;
  const control = (field: keyof typeof draft) => ({
    value: draft[field],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      dispatch({
        type: "update",
        update: (d) => {
          d.movementDraft[field] = value;
        },
      });
    },
  });
  return (
    <form id="movement-form" className="inline-form">
      <div className="form-grid">
        <label>
          數量（{product.unit}）
          <input
            name="quantity"
            type="number"
            min="1"
            max="1000000"
            step="1"
            required
            {...control("quantity")}
          />
        </label>
        {s.activeModule === "receipt" && (
          <label>
            本次入庫單價
            <input
              name="unitCost"
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              placeholder={
                product.costPrice == null
                  ? "尚無成本價，可填本次單價"
                  : `留空沿用品項成本價 ${product.costPrice}`
              }
              {...control("unitCost")}
            />
            <span className="field-hint">
              本次傳票獨立記錄，不修改品項成本價；留空時沿用品項成本價，仍無值則記為未填。
            </span>
          </label>
        )}
        <label>
          {s.activeModule === "issue" ? "用途" : "備註"}
          <input
            name="note"
            required={s.activeModule === "issue"}
            {...control("note")}
          />
        </label>
      </div>
      <button className="primary" type="submit">
        加入傳票明細
      </button>{" "}
      <button
        type="button"
        data-action="cancel-scan"
        onClick={() => dispatch({ type: "action", action: "cancel-scan" })}
      >
        取消
      </button>
      <p id="movement-error" className="error" role="alert">
        {s.errors.movement}
      </p>
    </form>
  );
}
