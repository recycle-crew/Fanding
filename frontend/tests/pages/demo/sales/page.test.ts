import { test, checkPageEntry } from "../../../helpers/test";

test(
  "/demo/sales 直接進入與重新整理",
  { tag: "@critical" },
  async ({ page }, info) => {
    await checkPageEntry(page, "/demo/sales", info);
  },
);
