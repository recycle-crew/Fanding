export type BaseDataKind = "warehouses" | "suppliers";
export interface BaseDataRecord {
  id: string;
  code: string;
  name: string;
  location: string;
  taxId: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  remark: string;
  active: boolean;
  used: boolean;
}
