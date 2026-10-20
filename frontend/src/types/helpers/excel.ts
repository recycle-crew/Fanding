export interface SpreadsheetCell {
  t: string;
  z?: string;
}

export interface Worksheet {
  [cell: string]: SpreadsheetCell | unknown;
}

export interface SpreadsheetLibrary {
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
