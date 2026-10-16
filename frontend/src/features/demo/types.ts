import type {
  Workspace,
  Product,
  Movement,
  InventoryFilter,
  Change,
} from "../inventory/types";
export type {
  Workspace,
  Product,
  Movement,
  InventoryFilter,
  Change,
} from "../inventory/types";
import type { Vendor } from "../suppliers/types";
export type { Vendor } from "../suppliers/types";
import type { Requisition, VoucherLine, Voucher } from "../otc/types";
export type { Requisition, VoucherLine, Voucher } from "../otc/types";
import type {
  Batch,
  Count,
  BatchOperation,
  Correction,
} from "../stocktaking/types";
export type {
  Batch,
  Count,
  BatchOperation,
  Correction,
} from "../stocktaking/types";
export type ModuleKey =
  | "overview"
  | "vendors"
  | "his"
  | "products"
  | "historical-cost"
  | "receipt"
  | "issue"
  | "requisitions"
  | "stocktake"
  | "stocktake-history";

export type EditorKind =
  | "vendors"
  | "his"
  | "products"
  | "requisitions"
  | "stocktake"
  | "stocktake-correction"
  | "new-receipt";
export interface Editor {
  kind: EditorKind;
  id: string | number | null;
  unknownBarcode: string;
  values: Record<string, string>;
  lockedFields: Record<string, string>;
}
export interface Confirmation {
  message: string;
  action:
    | "submit-voucher"
    | "cancel-voucher"
    | "delete"
    | "end-batch"
    | "submit-batch";
  id: string;
}
export interface DemoState {
  vendors: Vendor[];
  hisMedicines: Product[];
  otcProducts: Product[];
  movements: Movement[];
  requisitions: Requisition[];
  movementVouchers: Voucher[];
  stocktakeBatches: Batch[];
  stocktakes: Count[];
  stocktakeOperations: BatchOperation[];
  stocktakeCorrections: Correction[];
  dataChangeRecords: Change[];
  nextVendorId: number;
  nextMovementId: number;
  nextRequisitionId: number;
  nextStocktakeId: number;
  nextStocktakeBatchId: number;
  nextStocktakeOperationId: number;
  selectedStocktakeBatchIds: Record<Workspace, string | null>;
  selectedHistoricalBatchIds: Record<Workspace, string | null>;
  selectedMovementVoucherIds: Record<string, string | null>;
  stocktakeRoutes: Record<string, ModuleKey>;
  modules: { key: ModuleKey; label: string; group?: string }[];
  activeModule: ModuleKey;
  currentAccount: string;
  canEditExistingData: boolean;
  searchTerm: string;
  vendorStatusFilter: string;
  historicalCostFilter: InventoryFilter;
  requisitionFilter: InventoryFilter;
  issueMovementTimeFilter: InventoryFilter;
  receiptMovementFilter: InventoryFilter;
  overviewMovementFilter: InventoryFilter;
  issueMovementView: string;
  selectedProductId: string | null;
  scanBarcode: string;
  stocktakeWorkspace: Workspace;
  loggedIn: boolean;
  recovery: boolean;
  recoverySent: boolean;
  editor: Editor | null;
  confirmation: Confirmation | null;
  readonlyReason: string;
  notice: string;
  errors: Record<string, string>;
  pageRevision: number;
  movementDraft: { quantity: string; note: string; unitCost: string };
}
