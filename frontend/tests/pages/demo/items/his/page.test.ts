import { test, checkPageEntry } from "../../../../helpers/test";

test(
  "/demo/items/his 直接進入與重新整理",
  { tag: "@critical" },
  async ({ page }, info) => {
    await checkPageEntry(page, "/demo/items/his", info);
  },
);
