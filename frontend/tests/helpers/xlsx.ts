import type { XlsxReader } from "../types/helpers/xlsx";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

// The vendored UMD bundle uses the read API contract in tests/types/helpers/xlsx.ts.
const library: { exports: unknown } = { exports: {} };
runInNewContext(
  readFileSync(
    new URL("../../public/vendor/xlsx-0.20.3.mini.min.js", import.meta.url),
    "utf8",
  ),
  {
    module: library,
    exports: library.exports,
    Buffer,
    console,
    Uint8Array,
    ArrayBuffer,
    Date,
  },
  { filename: "sheetjs-download-test.js" },
);
const XLSX = library.exports as XlsxReader;
if (
  typeof XLSX.read !== "function" ||
  typeof XLSX.utils?.sheet_to_json !== "function"
)
  throw new Error("本機 XLSX 套件缺少測試所需的讀取 API。");
export default XLSX;
