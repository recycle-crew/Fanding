import { describe, expect, it } from "vitest";
import reducer, {
  blankBaseData,
  deleteBaseData,
  saveBaseData,
  toggleBaseData,
} from "./baseData";

const initial = () => reducer(undefined, { type: "test/init" });
describe("基礎資料狀態", () => {
  it("表單草稿彼此獨立，預設啟用且尚未被引用", () => {
    const first = blankBaseData();
    first.name = "修改草稿";
    expect(blankBaseData()).toMatchObject({
      name: "",
      active: true,
      used: false,
    });
  });
  it("新增及修改倉別不改動供應商或原始狀態", () => {
    const before = initial();
    const record = {
      ...blankBaseData(),
      id: "TEST-W",
      code: "TEST",
      name: "測試倉",
    };
    const added = reducer(before, saveBaseData({ kind: "warehouses", record }));
    const updated = reducer(
      added,
      saveBaseData({
        kind: "warehouses",
        record: { ...record, name: "新名稱" },
      }),
    );
    expect(before.warehouses.some((row) => row.id === record.id)).toBe(false);
    expect(updated.warehouses.filter((row) => row.id === record.id)).toEqual([
      { ...record, name: "新名稱" },
    ]);
    expect(updated.suppliers).toEqual(before.suppliers);
    expect(added.warehouses.at(-1)?.name).toBe("測試倉");
  });
  it("被引用的資料即使直接派送刪除 action 也保留", () => {
    const before = initial();
    const used = before.warehouses.find((row) => row.used)!;
    const unused = before.warehouses.find((row) => !row.used)!;
    const after = reducer(
      before,
      deleteBaseData({ kind: "warehouses", id: used.id }),
    );
    expect(after.warehouses).toContainEqual(used);
    expect(
      reducer(after, deleteBaseData({ kind: "warehouses", id: unused.id }))
        .warehouses,
    ).not.toContainEqual(unused);
  });
  it("停用不刪資料，重複切換可恢復；不存在的 ID 不影響資料", () => {
    const before = initial();
    const action = toggleBaseData({
      kind: "warehouses",
      id: before.warehouses[0].id,
    });
    const disabled = reducer(before, action);
    expect(disabled.warehouses[0].active).toBe(!before.warehouses[0].active);
    expect(reducer(disabled, action)).toEqual(before);
    expect(
      reducer(before, toggleBaseData({ kind: "suppliers", id: "missing" })),
    ).toEqual(before);
  });
});
