export interface NewStocktakeInput {
  name: string;
  date: string;
  warehouse: string;
  type: "全盤" | "部分盤點";
  itemIds: string[];
  people: string[];
  remark: string;
}
