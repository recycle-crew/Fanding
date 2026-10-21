export interface Field {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: [string, string][];
}
