import { describe, expect, it } from "vitest";
import { listInventoryPeople } from "./api";

describe("領用／報廢人員資料來源", () => {
  it("以穩定 ID 提供啟用人員及可搜尋的姓名、員工編號、部門", async () => {
    const people = await listInventoryPeople();
    expect(people.length).toBeGreaterThan(0);
    expect(new Set(people.map((person) => person.id)).size).toBe(people.length);
    expect(
      people.every(
        (person) =>
          person.active &&
          person.name &&
          person.employeeNumber &&
          person.department,
      ),
    ).toBe(true);
    expect(people.some((person) => person.employeeNumber === "EMP006")).toBe(
      false,
    );
    people[0].name = "修改呼叫端資料";
    expect((await listInventoryPeople())[0].name).not.toBe("修改呼叫端資料");
  });
});
