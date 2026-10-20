export interface Cell {
  t: string;
  v?: string | number | boolean;
  z?: string;
}

export interface Workbook {
  Sheets: Record<string, Record<string, Cell>>;
  SheetNames: string[];
}

export interface XlsxReader {
  read(data: Buffer | string, options: { type: "buffer" | "base64" }): Workbook;
  utils: {
    sheet_to_json(
      sheet: Record<string, Cell>,
      options: { header: 1 },
    ): (string | number | boolean)[][];
    sheet_to_json<
      T extends Record<string, unknown> = Record<
        string,
        string | number | boolean
      >,
    >(
      sheet: Record<string, Cell>,
    ): T[];
    encode_cell(cell: { r: number; c: number }): string;
  };
}
