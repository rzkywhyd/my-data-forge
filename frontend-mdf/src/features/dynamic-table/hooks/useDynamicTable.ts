import { useState, useCallback, useRef } from "react";
import type {
  ColDef,
  IDatasource,
  IGetRowsParams,
  SortModelItem,
  FilterModel
} from "ag-grid-community";

import { tableService } from "../services/tableService";

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

type RowData = Record<string, unknown>;

export type DefaultSortModel = SortModelItem[];

export const useDynamicTable = () => {
  const [columnDefs, setColumnDefs] = useState<ColDef<RowData>[]>([]);
  const clearedFiltersRef = useRef<string[]>([]);
  const clearedFiltersQueueRef = useRef<string[]>([]);

  // =========================
  // BUILD COLUMNS
  // =========================
  const createColumns = useCallback(
    
    (cols: ColumnConfig[], entityId: number): ColDef<RowData>[] => {
        
      return cols
        .filter((c) => Boolean(c.is_visible))
        .sort((a, b) => a.display_order - b.display_order)
        .map((c) => ({
          field: c.field_name,
          headerName: c.label,

          // 🔥 custom filter kamu
          filter: c.is_filterable ? "LazySetFilter" : false,

          filterParams: {
            context: { entityId }
          },

          sortable: true,

          width: c.width ?? undefined,

          pinned:
            c.freeze_enabled === 1
              ? (c.freeze_type as "left" | "right")
              : undefined,

          resizable: false,
        //   flex: c.width ? undefined : 1
        }));
    },
    []
  );

  // =========================
  // DEFAULT SORT MODEL
  // =========================
  const buildDefaultSortModel = useCallback(
    (cols: ColumnConfig[]): DefaultSortModel => {
      return cols
        .filter((c) => c.sort_enabled === 1 && c.sort_type)
        .map((c) => ({
          colId: c.field_name,
          sort: c.sort_type as "asc" | "desc"
        }));
    },
    []
  );

  // =========================
  // INIT COLUMNS
  // =========================
  const initColumns = useCallback(
    async (entityId: number) => {
      const res = await tableService.getPersonal({
        entityId,
        startRow: 0,
        endRow: 1,
        sortModel: [],
        filterModel: {} as FilterModel
      });

      const cols: ColumnConfig[] = res.columns;

      setColumnDefs(createColumns(cols, entityId));

      return cols;
    },
    [createColumns]
  );

  // =========================
  // DATASOURCE
  // =========================
//   const createDataSource = useCallback(
//     (entityId: number, defaultSortModel: DefaultSortModel): IDatasource => ({
//       getRows: async (params: IGetRowsParams) => {
//         try {
//           params.api.setGridOption("loading", true);
//           // 🔥 STRONG TYPE FILTER MODEL
//           const filterModel: FilterModel = params.filterModel ?? {};

//           const sortModel =
//             params.sortModel?.length
//               ? params.sortModel
//               : defaultSortModel;

//           const res = await tableService.getPersonal({
//             entityId,
//             startRow: params.startRow,
//             endRow: params.endRow,
//             sortModel,
//             filterModel
//           });
//           params.api.setGridOption("loading", false);
//           params.successCallback(res.rows, res.total);
//         } catch (err) {
//           console.error("DATASOURCE ERROR:", err);
//           params.api.setGridOption("loading", false);
//           params.failCallback();
//         }
//       }
//     }),
//     []
//   );
const createDataSource = useCallback(
  (entityId: number, defaultSortModel: DefaultSortModel): IDatasource => ({
    getRows: async (params: IGetRowsParams) => {
      try {
        const cleared = [...clearedFiltersQueueRef.current];

  // reset langsung supaya tidak double kirim
  clearedFiltersQueueRef.current = [];
        params.api.setGridOption("loading", true);

        const filterModel: FilterModel = params.filterModel ?? {};

        const sortModel =
          params.sortModel?.length
            ? params.sortModel
            : defaultSortModel;

        const res = await tableService.getPersonal({
          entityId,
          startRow: params.startRow,
          endRow: params.endRow,
          sortModel,
          filterModel,

          // 🔥 INI KUNCI
          clearedFilters: cleared,
        });

        // reset setelah request
        clearedFiltersRef.current = [];

        params.api.setGridOption("loading", false);
        params.successCallback(res.rows, res.total);
      } catch (err) {
        console.error("DATASOURCE ERROR:", err);
        params.api.setGridOption("loading", false);
        params.failCallback();
      }
    },
  }),
  []
);

  // =========================
  // RETURN
  // =========================
  return {
    columnDefs,
    initColumns,
    createDataSource,
    buildDefaultSortModel
  };
};

