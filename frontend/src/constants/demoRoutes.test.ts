import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { demoModulePaths, itemGroupPaths } from "./demoRoutes";

const consumptionSource = readFileSync(
  fileURLToPath(
    new URL("../features/consumptions/ConsumptionsPage.tsx", import.meta.url),
  ),
  "utf8",
);
const consumptionRoutes = [
  ...consumptionSource.matchAll(/"(\/demo\/consumptions[^\"]*)"/g),
].map((match) => match[1]);
const routes = [
  ...new Set([
    "/",
    "/architecture",
    "/board",
    "/demo/overview",
    ...Object.values(demoModulePaths),
    ...Object.values(itemGroupPaths),
    ...consumptionRoutes,
  ]),
];
describe("route 與頁面測試對應", () => {
  it.each(routes)("%s 有所屬的 Playwright 頁面測試", (route) => {
    const folder = route === "/" ? "index" : route.slice(1);
    const directory = new URL(`../../tests/pages/${folder}/`, import.meta.url);
    expect(
      existsSync(directory),
      `新增 route 時也需要建立 ${fileURLToPath(directory)}`,
    ).toBe(true);
    const covered = readdirSync(directory)
      .filter((file) => file.endsWith(".test.ts"))
      .some((file) => {
        const content = readFileSync(new URL(file, directory), "utf8");
        return (
          content.includes(`page.goto(${JSON.stringify(route)})`) &&
          content.includes("page.reload()") &&
          content.includes(".toHaveURL(")
        );
      });
    expect(covered, `${route} 需要頁面入口與重新整理測試`).toBe(true);
  });
});
