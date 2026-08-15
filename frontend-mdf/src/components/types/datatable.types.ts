export type SortDir = "asc" | "desc" | null;

export type FilterOperator =
  | "equals"
  | "not equals"
  | "contains"
  | "gt"
  | "lt";

export type ColumnFilter = {
  key: string;
  operator: FilterOperator;
  value: string | number | null;
};

export type DataTableQuery = {
  page: number;
  pageSize: number;
  search: string;
  filters: Record<string, ColumnFilter>;
  sortKey?: string;
  sortDir?: SortDir;
};

export type DataTableResponse<T> = {
  data: T[];
  total: number;
};