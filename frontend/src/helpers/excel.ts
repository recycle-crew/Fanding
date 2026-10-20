interface SpreadsheetCell {
  t: string;
  z?: string;
}
interface Worksheet {
  [cell: string]: SpreadsheetCell | unknown;
}
interface SpreadsheetLibrary {
  utils: {
    aoa_to_sheet(rows: (string | number)[][]): Worksheet;
    encode_cell(cell: { r: number; c: number }): string;
    book_new(): unknown;
    book_append_sheet(book: unknown, sheet: Worksheet, name: string): void;
  };
  writeFile(
    book: unknown,
    name: string,
    options: { bookType: string; compression: boolean },
  ): void;
}
declare global {
  interface Window {
    XLSX?: SpreadsheetLibrary;
  }
}
let libraryPromise: Promise<SpreadsheetLibrary> | null = null;
const numericColumns = new Set([
  "已盤品項", "我已盤品項", "帳面快照", "期間異動", "預期數量", "採用輪次", "實盤數量", "差異數量",
  "原始成交金額", "已退款金額", "待退款金額", "淨銷售金額",
  "淨耗用量", "有效筆數", "目前可用庫存", "原始數量", "換算比例", "讀取", "新增套用", "略過重複", "失敗",
  "品項數",
  "原始進貨金額",
  "原進貨數量",
  "原單位成本",
  "已處理量",
  "淨留存入庫量",
  "庫存數量",
  "安全庫存",
  "建議售價",
  "可用數量",
  "加權平均成本",
  "進貨數量",
  "單位成本",
  "小計",
  "異動數量",
  "異動後數量",
  "入庫單價",
  "入庫金額",
  "入庫總金額",
  "歷史平均成本價",
  "入庫傳票數",
  "入庫總數量",
  "原送出數量",
  "更正前",
  "更正後",
  "成本價",
  "售價",
  "庫存",
  "最低庫存",
  "帳面數量",
  "實盤數量",
  "差異",
  "盤差",
  "數量",
  "數量變化",
  "原值",
  "新值",
]);
// 暫行 XLSX 匯出：資料留在瀏覽器；正式欄位與版型仍待確認。
async function loadLibrary(): Promise<SpreadsheetLibrary> {
  if (window.XLSX) return window.XLSX;
  if (!libraryPromise)
    libraryPromise = new Promise<SpreadsheetLibrary>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${import.meta.env.BASE_URL}vendor/xlsx-0.20.3.mini.min.js`;
      script.onload = () =>
        window.XLSX
          ? resolve(window.XLSX)
          : reject(new Error("Excel 套件未正常載入"));
      script.onerror = () => {
        script.remove();
        reject(new Error("無法載入 Excel 套件，請確認檔案完整後重試"));
      };
      document.head.append(script);
    }).catch((error) => {
      libraryPromise = null;
      throw error;
    });
  return libraryPromise;
}
export async function downloadTable(table: HTMLTableElement): Promise<number> {
  const headerCells = Array.from(table.tHead.rows[0].cells);
  const headers = headerCells.map((cell) => {
    const copy = cell.cloneNode(true) as HTMLElement;
    copy.querySelectorAll(".field-access").forEach((label) => label.remove());
    return copy.textContent.trim();
  });
  const included = headers
    .map((_, index) =>
      headerCells[index].dataset.exportIgnore === "true" ? -1 : index,
    )
    .filter((i) => i >= 0);
  // 在非同步載入前取快照，避免等待時切換篩選造成匯出資料不一致。
  const rows: (string | number)[][] = [included.map((i) => headers[i])];
  for (const row of Array.from(table.tBodies).flatMap((body) =>
    Array.from(body.rows),
  )) {
    if (row.querySelector("td.empty")) continue;
    rows.push(
      included.map((index) => {
        const cell = row.cells[index];
        if (!cell) return "";
        const copy = cell.cloneNode(true) as HTMLElement;
        copy
          .querySelectorAll(
            "button,input,select,textarea,.actions,.field-access",
          )
          .forEach((control) => control.remove());
        copy.querySelectorAll("br").forEach((line) => line.replaceWith("\n"));
        const text = copy.textContent.trim();
        return numericColumns.has(headers[index]) &&
          /^[+-]?\d+(\.\d+)?$/.test(text) &&
          Number.isFinite(Number(text))
          ? Number(text)
          : text;
      }),
    );
  }
  const region = table
    .closest(".table-wrap")
    ?.getAttribute("aria-label")
    ?.replace("，可左右捲動", "");
  const title =
    table.caption?.textContent.trim() ||
    table.closest(".panel")?.querySelector("h3")?.textContent.trim() ||
    (region !== "資料表" ? region : "") ||
    table.closest("main")?.querySelector("h2")?.textContent.trim() ||
    "資料表";
  const xlsx = await loadLibrary();
  const sheet = xlsx.utils.aoa_to_sheet(rows);
  sheet["!cols"] = rows[0].map((_, index) => ({
    wch: Math.min(
      42,
      rows.reduce(
        (width, row) => Math.max(width, String(row[index] ?? "").length * 1.5),
        12,
      ),
    ),
  }));
  rows[0].forEach((header, column) => {
    if (
      ![
        "建議售價",
        "加權平均成本",
        "單位成本",
        "小計",
        "成本價",
        "售價",
        "入庫單價",
        "入庫金額",
        "入庫總金額",
        "歷史平均成本價",
      ].includes(String(header))
    )
      return;
    for (let row = 1; row < rows.length; row++) {
      const cell = sheet[xlsx.utils.encode_cell({ r: row, c: column })] as
        SpreadsheetCell | undefined;
      if (cell?.t === "n") cell.z = "0.00";
    }
  });
  sheet["!autofilter"] = { ref: sheet["!ref"] };
  const book = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(
    book,
    sheet,
    title.replace(/[\\/?*\[\]:]/g, " ").slice(0, 31) || "資料表",
  );
  xlsx.writeFile(
    book,
    `${title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").slice(0, 80)}_${new Date().toLocaleDateString("sv-SE")}.xlsx`,
    { bookType: "xlsx", compression: true },
  );
  return rows.length - 1;
}
