import { test, checkPageEntry } from "../../../../helpers/test";

test(
  "/demo/items/general 直接進入與重新整理",
  { tag: "@critical" },
  async ({ page }, info) => {
    await checkPageEntry(page, "/demo/items/general", info);
  },
);
