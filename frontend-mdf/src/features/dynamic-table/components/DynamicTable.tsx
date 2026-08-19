import { AgGridReact } from "ag-grid-react";
import type { GridReadyEvent } from "ag-grid-community";

import { useDynamicTable } from "../hooks/useDynamicTable";
import { tableService } from "../services/tableService";
import LazySetFilter from "../components/LazySetFilter";
import type { FilterModel } from "ag-grid-community";

type Props = {
  entityId: number;
};

export default function DynamicTable({ entityId }: Props) {
  const { createDataSource, buildDefaultSortModel } = useDynamicTable();

  // =========================
  // GRID READY
  // =========================
  const onGridReady = async (params: GridReadyEvent) => {
    const res = await tableService.getPersonal({
      entityId,
      startRow: 0,
      endRow: 1,
      sortModel: [],
      filterModel: {},
    });

    const columns = res.columns;

    // =========================
    // COLUMN DEFS
    // =========================
    const dynamicColumns = columns
      .filter((c) => Boolean(c.is_visible))
      .sort((a, b) => a.display_order - b.display_order)
      .map((c) => ({
        field: c.field_name,
        headerName: c.label,

        // 🔥 IMPORTANT: jangan pakai agTextColumnFilter kalau pakai custom filter
        filter: c.is_filterable ? "LazySetFilter" : false,

        sortable: true,

        width: c.width ?? undefined,

        pinned:
          c.freeze_enabled === 1
            ? (c.freeze_type as "left" | "right")
            : undefined,

        resizable: true,
        flex: c.width ? undefined : 1,
      }));

    // =========================
    // SET COLUMN DEFS
    // =========================
    params.api.setGridOption("columnDefs", dynamicColumns);

    // =========================
    // DEFAULT SORT
    // =========================
    const defaultSortModel = buildDefaultSortModel(columns);

    if (defaultSortModel.length) {
      params.api.applyColumnState({
        state: defaultSortModel.map((s) => ({
          colId: s.colId,
          sort: s.sort,
        })),
      });
    }

    // =========================
    // DEFAULT FILTER MODEL
    // =========================
    const defaultFilterModel: FilterModel = {};

    for (const f of res.defaultFilters || []) {
      defaultFilterModel[f.field_name] = {
        filterType: "text",
        type: f.operator === "equals" ? "equals" : "contains",
        filter: f.value,
      };
    }

    params.api.setFilterModel(defaultFilterModel);

    // =========================
    // DATASOURCE
    // =========================
    params.api.setGridOption(
      "datasource",
      createDataSource(entityId, defaultSortModel),
    );
  };

  // =========================
  // REFRESH HELPERS
  // =========================
  // const refreshGrid = (api: GridApi) => {
  //   api.refreshInfiniteCache();
  // };

  // const handleFilterChanged = (event: { api: GridApi }) => {
  //   refreshGrid(event.api);
  // };

  // const handleSortChanged = (event: { api: GridApi }) => {
  //   refreshGrid(event.api);
  // };

  // =========================
  // RENDER
  // =========================
  return (
    <div className="ag-theme-alpine h-150 w-full">
      <AgGridReact
        rowModelType="infinite"
        cacheBlockSize={100}
        pagination={true}
        paginationPageSize={100}
        onGridReady={onGridReady}
        // onFilterChanged={handleFilterChanged}
        // onSortChanged={handleSortChanged}
        enableCellTextSelection={true}
        rowSelection="multiple"
        // 🔥 WAJIB UNTUK CUSTOM FILTER
        components={{
          LazySetFilter,
        }}
        context={{ entityId }}
      />
    </div>
  );
}
