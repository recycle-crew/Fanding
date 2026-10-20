import type { Workspace } from "@/types/inventory";
export interface Batch {
  id: string;
  name: string;
  workspace: Workspace;
  startedAt: string;
  endedAt: string | null;
  startedBy: string;
  endedBy: string | null;
  submittedAt?: string;
  submittedBy?: string;
}
export interface Count {
  id: number;
  batchId: string;
  workspace: Workspace;
  productId: string;
  book: number;
  actual: number | null;
  completed: boolean;
  confirmed?: boolean;
  filledBy?: string;
  submittedAt?: string;
  submittedBy?: string;
  correctedActual?: number;
  correctedBy?: string;
}
export interface BatchOperation {
  id: number;
  batchId: string;
  time: string;
  operation: string;
  productId: string;
  before: string;
  after: string;
  detail: string;
  outcome: string;
  filledBy: string;
}
export interface Correction {
  id: number;
  batchId: string;
  countId: number;
  productId: string;
  time: string;
  original: number;
  before: number;
  after: number;
  reason: string;
  filledBy: string;
}
