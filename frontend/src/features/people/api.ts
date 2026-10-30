import type { InventoryPerson } from "@/types/people";

const mockPeople: InventoryPerson[] = [
  {
    id: "person-001",
    employeeNumber: "EMP001",
    name: "王小明",
    department: "護理部",
    active: true,
  },
  {
    id: "person-002",
    employeeNumber: "EMP002",
    name: "李護理師",
    department: "護理部",
    active: true,
  },
  {
    id: "person-003",
    employeeNumber: "EMP003",
    name: "陳藥師",
    department: "藥局",
    active: true,
  },
  {
    id: "person-004",
    employeeNumber: "EMP004",
    name: "林醫師",
    department: "門診",
    active: true,
  },
  {
    id: "person-005",
    employeeNumber: "EMP005",
    name: "許助理",
    department: "行政部",
    active: true,
  },
  {
    id: "person-006",
    employeeNumber: "EMP006",
    name: "張護理師",
    department: "護理部",
    active: false,
  },
];

/** API boundary: replace this implementation with the personnel API when available. */
export async function listInventoryPeople(): Promise<InventoryPerson[]> {
  return mockPeople
    .filter((person) => person.active)
    .map((person) => ({ ...person }));
}
