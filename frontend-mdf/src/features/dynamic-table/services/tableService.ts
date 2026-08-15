// import api from "@/lib/api";
// import type {
//   SortModelItem,
//   FilterModel
// } from "ag-grid-community";

// type ColumnConfig = {
//   field_name: string;
//   label: string;
//   display_order: number;
//   is_visible: number | boolean;
//   is_filterable: number | boolean;
//   width?: number;
//   freeze_enabled?: number;
//   freeze_type?: "left" | "right" | "";
//   sort_enabled?: number;
//   sort_type?: "asc" | "desc" | null;
// };

// type DefaultFilter = {
//   field_name: string;
//   operator: string;
//   value: string;
//   filter_type: string;
// };

// export type PersonalResponse<T = Record<string, unknown>> = {
//   columns: ColumnConfig[];
//   rows: T[];
//   total: number;

//   defaultFilters?: DefaultFilter[];
// };

// type EntityDataPayload = {
//   entityId: number;
//   startRow: number;
//   endRow: number;
//   sortModel: SortModelItem[];
//   filterModel: FilterModel;
//   clearedFilters?: string[];
// };

// export const tableService = {
//   getPersonal: async <T = Record<string, unknown>>(
//     payload: EntityDataPayload
//   ): Promise<PersonalResponse<T>> => {
//     const res = await api.post("/personal", payload);
//     return res.data;
//   }
// };
import api from "@/lib/api";
import type { SortModelItem, FilterModel } from "ag-grid-community";

type ColumnConfig = {
  field_name: string;
  label: string;
  display_order: number;
  is_visible: number | boolean;
  is_filterable: number | boolean;
  width?: number;
  freeze_enabled?: number;
  freeze_type?: "left" | "right" | "";
  sort_enabled?: number;
  sort_type?: "asc" | "desc" | null;
};

type DefaultFilter = {
  field_name: string;
  operator: string;
  value: string;
  filter_type: string;
};

export type PersonalResponse<T = Record<string, unknown>> = {
  columns: ColumnConfig[];
  rows: T[];
  total: number;
  defaultFilters?: DefaultFilter[];
};

export type EntityDataPayload = {
  entityId: number;
  startRow: number;
  endRow: number;
  sortModel: SortModelItem[];
  filterModel: FilterModel;
  clearedFilters?: string[];
};

export const tableService = {
  getPersonal: async <T = Record<string, unknown>>(
    payload: EntityDataPayload
  ): Promise<PersonalResponse<T>> => {
    const res = await api.post("/personal", payload);
    return res.data;
  },
};