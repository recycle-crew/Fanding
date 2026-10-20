import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

interface Cell { t: string; v?: string | number | boolean; z?: string }
interface Workbook { Sheets: Record<string, Record<string, Cell>>; SheetNames: string[] }
interface XlsxReader {
  read(data: Buffer | string, options: { type: "buffer" | "base64" }): Workbook;
  utils: {
    sheet_to_json(sheet: Record<string, Cell>, options: { header: 1 }): (string | number | boolean)[][];
    sheet_to_json<T extends Record<string, unknown> = Record<string, string | number | boolean>>(sheet: Record<string, Cell>): T[];
    encode_cell(cell: { r: number; c: number }): string;
  };
}

// The vendored UMD bundle has no module declarations. Its read API is typed here.
const library: { exports: unknown } = { exports: {} };
runInNewContext(
  readFileSync(new URL("../../public/vendor/xlsx-0.20.3.mini.min.js", import.meta.url), "utf8"),
  { module: library, exports: library.exports, require: createRequire(import.meta.url), Buffer, console, Uint8Array, ArrayBuffer, Date },
  { filename: "sheetjs-download-test.js" },
);
const XLSX = library.exports as XlsxReader;
if (typeof XLSX.read !== "function" || typeof XLSX.utils?.sheet_to_json !== "function")
  throw new Error("本機 XLSX 套件缺少測試所需的讀取 API。");
export default XLSX;
