import { useEffect, useRef, useState } from "react";

import { Settings2, X } from "lucide-react";

import { AgGridReact } from "ag-grid-react";

import type { FilterModel, GridApi, GridReadyEvent } from "ag-grid-community";

import { useDynamicTable } from "../hooks/useDynamicTable";
import { tableService } from "../services/tableService";

import LazySetFilter from "../components/LazySetFilter";

import { customQuartzTheme } from "../styles/agGridTheme";

import { Button } from "@/components/ui/button";

import ColumnVisibilityPanel from "./ColumnVisibilityPanel";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import selectAllHeader from "./SelectAllHeader";

import RowContextMenu from "../components/RowContextMenu";

type Props = {
  entityId: number;
};

type RowData = Record<string, unknown>;

export default function DynamicTable({ entityId }: Props) {
  // =====================================================
  // COLUMN SETTINGS
  // =====================================================

  const [showColumnSettings, setShowColumnSettings] = useState(false);

  // =====================================================
  // SELECT ALL STATE
  // =====================================================
  const [showSelectionBar, setShowSelectionBar] = useState(false);
  const [selectAllRows, setSelectAllRows] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [selectedRowCount, setSelectedRowCount] = useState(0);

  const [totalRowCount, setTotalRowCount] = useState(0);

  const [userColumns, setUserColumns] = useState<
    {
      field: string;
      label: string;
      visible: boolean;
    }[]
  >([]);

  // =====================================================
  // DYNAMIC TABLE
  // =====================================================

  const { createDataSource, buildDefaultSortModel } = useDynamicTable();

  // =====================================================
  // CONTEXT MENU
  // =====================================================

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // =====================================================
  // REFS
  // =====================================================

  const buttonRef = useRef<HTMLButtonElement>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  const gridRef = useRef<GridApi<RowData> | null>(null);

  // =====================================================
  // COLUMN SETTINGS CLICK OUTSIDE
  // =====================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const clickedButton = buttonRef.current?.contains(target);

      const clickedPanel = panelRef.current?.contains(target);

      if (!clickedButton && !clickedPanel) {
        setShowColumnSettings(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // =====================================================
  // CONTEXT MENU
  // =====================================================

  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      const gridElement = target.closest(".ag-root");

      if (!gridElement) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      setContextMenu({
        x: event.clientX,
        y: event.clientY,
      });
    };

    document.addEventListener("contextmenu", handleContextMenu, true);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, []);

  // =====================================================
  // GRID READY
  // =====================================================

  const onGridReady = async (params: GridReadyEvent) => {
    gridRef.current = params.api;

    const res = await tableService.getPersonal({
      entityId,
      startRow: 0,
      endRow: 1,
      sortModel: [],
      filterModel: {},
    });

    const columns = res.columns;
    // console.log("COLUMNS:", res);
    setUserColumns(
      columns
        .sort((a, b) => a.display_order - b.display_order)
        .map((column) => ({
          field: column.field_name,
          label: column.field_label,
          visible: Boolean(column.is_visible),
        })),
    );

    // =====================================================
    // TOTAL ROW COUNT
    // =====================================================

    // setTotalRowCount(res.total);

    // =====================================================
    // COLUMN DEFS
    // =====================================================

    const dynamicColumns = columns
      .filter((c) => Boolean(c.is_visible))
      .sort((a, b) => a.display_order - b.display_order)
      .map((c) => ({
        field: c.field_name,

        headerName: c.field_label,

        filter: c.is_filterable ? "LazySetFilter" : false,

        width: c.width ?? undefined,

        pinned:
          c.freeze_enabled === 1
            ? (c.freeze_type as "left" | "right")
            : undefined,
      }));

    // =====================================================
    // SET COLUMN DEFS
    // =====================================================

    params.api.setGridOption("columnDefs", dynamicColumns);

    // =====================================================
    // DEFAULT SORT
    // =====================================================

    const defaultSortModel = buildDefaultSortModel(columns);

    if (defaultSortModel.length) {
      params.api.applyColumnState({
        state: defaultSortModel.map((s) => ({
          colId: s.colId,
          sort: s.sort,
        })),
      });
    }

    // =====================================================
    // DEFAULT FILTER
    // =====================================================

    const defaultFilterModel: FilterModel = {};

    for (const f of res.defaultFilters || []) {
      defaultFilterModel[f.field_name] = {
        filterType: "text",

        type: f.operator === "equals" ? "equals" : "contains",

        filter: f.value,
      };
    }

    params.api.setFilterModel(defaultFilterModel);

    // =====================================================
    // DATASOURCE
    // =====================================================

    // params.api.setGridOption(
    //   "datasource",
    //   createDataSource(entityId, defaultSortModel),
    // );
    params.api.setGridOption(
      "datasource",
      createDataSource(entityId, defaultSortModel, (total) => {
        setTotalRowCount(total);
      }),
    );

    // =====================================================
    // SELECTION LISTENER
    // =====================================================

    params.api.addEventListener("selectionChanged", () => {
      const selected = params.api.getSelectedRows();

      setSelectedRowCount(selected.length);
    });
  };

  // =====================================================
  // GET CURRENT FILTER
  // =====================================================

  const getCurrentFilterModel = (): FilterModel => {
    const api = gridRef.current;

    if (!api) {
      return {};
    }

    return api.getFilterModel();
  };

  // =====================================================
  // GET CURRENT SORT
  // =====================================================

  const getCurrentSortModel = () => {
    const api = gridRef.current;

    if (!api) {
      return [];
    }

    return api
      .getColumnState()
      .filter(
        (
          column,
        ): column is typeof column & {
          sort: "asc" | "desc";
        } => column.sort === "asc" || column.sort === "desc",
      )
      .map((column) => ({
        colId: column.colId,
        sort: column.sort,
      }));
  };

  // =====================================================
  // EXPORT CURRENTLY SELECTED ROWS
  // =====================================================

  const exportSelectedRowsToCsv = () => {
    const gridApi = gridRef.current;

    if (!gridApi) {
      return;
    }

    const selectedRows = gridApi.getSelectedRows();

    if (selectedRows.length === 0) {
      return;
    }

    const displayedColumns = gridApi.getAllDisplayedColumns();

    const columns = displayedColumns
      .map((column) => column.getColDef())
      .filter(
        (
          column,
        ): column is typeof column & {
          field: string;
        } => Boolean(column.field),
      );

    const escapeCsv = (value: unknown): string => {
      const text = value == null ? "" : String(value);

      return `"${text.replace(/"/g, '""')}"`;
    };

    const headers = columns.map((column) => column.headerName ?? column.field);

    const csvRows = selectedRows.map((row) =>
      columns.map((column) => escapeCsv(row[column.field])).join(","),
    );

    const csv = [headers.map(escapeCsv).join(","), ...csvRows].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "export.csv";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  };

  // =====================================================
  // EXPORT ALL SERVER DATA
  // =====================================================

  const exportAllRowsToCsv = async () => {
    const gridApi = gridRef.current;

    if (!gridApi) {
      return;
    }

    const filterModel = getCurrentFilterModel();

    const sortModel = getCurrentSortModel();

    /*
     * PENTING:
     *
     * Di sini kita TIDAK mengambil row
     * dari grid.
     *
     * Kita minta backend mengambil
     * seluruh data berdasarkan:
     *
     * - entityId
     * - filter aktif
     * - sort aktif
     *
     * Jadi infinite scrolling tetap aman.
     */

    const result = await tableService.getPersonal({
      entityId,

      startRow: 0,

      /*
       * Untuk sementara ambil sesuai
       * jumlah total data.
       *
       * Nanti lebih bagus dibuat endpoint
       * export khusus di backend supaya
       * backend langsung stream CSV.
       */
      endRow: totalRowCount > 0 ? totalRowCount : 1000000,

      sortModel,

      filterModel,
    });

    const rows = result.rows ?? [];

    if (rows.length === 0) {
      return;
    }

    // =====================================================
    // COLUMNS
    // =====================================================

    const displayedColumns = gridApi.getAllDisplayedColumns();

    const columns = displayedColumns
      .map((column) => column.getColDef())
      .filter(
        (
          column,
        ): column is typeof column & {
          field: string;
        } => Boolean(column.field),
      );

    // =====================================================
    // ESCAPE CSV
    // =====================================================

    const escapeCsv = (value: unknown): string => {
      const text = value == null ? "" : String(value);

      return `"${text.replace(/"/g, '""')}"`;
    };

    // =====================================================
    // HEADER
    // =====================================================

    const headers = columns.map((column) => column.headerName ?? column.field);

    // =====================================================
    // ROWS
    // =====================================================

    const csvRows = rows.map((row) =>
      columns.map((column) => escapeCsv(row[column.field])).join(","),
    );

    // =====================================================
    // CSV
    // =====================================================

    const csv = [headers.map(escapeCsv).join(","), ...csvRows].join("\n");

    // =====================================================
    // DOWNLOAD
    // =====================================================

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "export-all.csv";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  };

  // =====================================================
  // SAME EXPORT BUTTON
  // =====================================================

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Beri kesempatan React menampilkan loading
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });

      if (selectAllRows) {
        await exportAllRowsToCsv();
        return;
      }

      exportSelectedRowsToCsv();
    } catch (error) {
      console.error("EXPORT FAILED:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const updateFilteredRowCount = async () => {
    const gridApi = gridRef.current;

    if (!gridApi) {
      return;
    }

    const filterModel = gridApi.getFilterModel();

    const sortModel = gridApi
      .getColumnState()
      .filter(
        (
          column,
        ): column is typeof column & {
          sort: "asc" | "desc";
        } => column.sort === "asc" || column.sort === "desc",
      )
      .map((column) => ({
        colId: column.colId,
        sort: column.sort,
      }));

    try {
      const res = await tableService.getPersonal({
        entityId,
        startRow: 0,
        endRow: 1,
        sortModel,
        filterModel,
      });

      setTotalRowCount(res.total);
    } catch (error) {
      console.error("FAILED TO GET FILTERED ROW COUNT:", error);
    }
  };

  const handleSelectAllRows = async (checked: boolean) => {
    if (!checked) {
      // Header checkbox di-uncheck
      setShowSelectionBar(false);
      setSelectAllRows(false);
      setSelectedRowCount(0);
      return;
    }

    const gridApi = gridRef.current;

    if (!gridApi) {
      return;
    }

    // Header checkbox baru saja dicentang
    setShowSelectionBar(true);

    // Belum klik "Select all"
    setSelectAllRows(false);

    const filterModel = gridApi.getFilterModel();

    const sortModel = gridApi
      .getColumnState()
      .filter(
        (
          column,
        ): column is typeof column & {
          sort: "asc" | "desc";
        } => column.sort === "asc" || column.sort === "desc",
      )
      .map((column) => ({
        colId: column.colId,
        sort: column.sort,
      }));

    try {
      const res = await tableService.getPersonal({
        entityId,
        startRow: 0,
        endRow: 1,
        sortModel,
        filterModel,
      });

      setTotalRowCount(res.total);
    } catch (error) {
      console.error("FAILED TO GET SELECT ALL COUNT:", error);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="h-170 w-full">
      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="relative mb-2 flex items-center justify-start gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                ref={buttonRef}
                type="button"
                variant="default"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowColumnSettings((prev) => !prev)}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>

            <TooltipContent>
              <p>Column Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {showColumnSettings && (
          <div ref={panelRef} className="absolute left-0 top-full z-50 mt-0">
            <ColumnVisibilityPanel
              columns={userColumns}
              onChange={(columns) => {
                console.log("Columns changed:", columns);
              }}
              onCancel={() => {
                setShowColumnSettings(false);
              }}
              onSave={(columns) => {
                console.log("Columns saved:", columns);
                setShowColumnSettings(false);
              }}
            />
          </div>
        )}

        {/* CLOSE ICON */}
        {showSelectionBar && totalRowCount > 0 && (
          <div className="flex h-6 items-center">
            <span className="flex h-6 items-center gap-1 rounded-md bg-blue-100 px-2 text-[10px] text-blue-700">
              {/* SELECTED */}
              <span className="font-semibold">
                {selectedRowCount.toLocaleString()}
              </span>

              <span>selected</span>

              {/* SELECT ALL */}
              {!selectAllRows && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setSelectAllRows(true);
                    setSelectedRowCount(totalRowCount);
                  }}
                  className="ml-1 h-6 rounded-md bg-indigo-950 px-2 text-[10px] font-medium text-white hover:bg-indigo-900"
                >
                  <span className="mr-1">→</span>
                  Select all {totalRowCount.toLocaleString()}
                </Button>
              )}

              {/* CLOSE */}
              <X
                className="ml-1 h-3.5 w-3.5 cursor-pointer text-blue-500 hover:text-blue-700"
                onClick={() => {
                  const gridApi = gridRef.current;

                  if (gridApi) {
                    gridApi.deselectAll();
                  }

                  setShowSelectionBar(false);
                  setSelectAllRows(false);
                  setSelectedRowCount(0);
                }}
              />
            </span>
          </div>
        )}
      </div>

      {/* =================================================
          AG GRID
      ================================================= */}

      <div className="h-full w-full">
        <AgGridReact<RowData>
          theme={customQuartzTheme}

          rowModelType="infinite"

          cacheBlockSize={100}

          pagination={true}

          paginationPageSize={100}

          defaultColDef={{
            resizable: false,
            sortable: false,
          }}

          onGridReady={onGridReady}

          onFilterChanged={updateFilteredRowCount}

          enableCellTextSelection={true}

          rowSelection={{
            mode: "multiRow",
            checkboxes: true,
          }}

          selectionColumnDef={{
            pinned: "left",
            width: 40,
            headerComponent: selectAllHeader,
          }}

          components={{
            LazySetFilter,
          }}

          context={{
            entityId,
            onSelectAllRows: handleSelectAllRows,
          }}
        />

        {/* =================================================
            CONTEXT MENU
        ================================================= */}

        {contextMenu && (
          <RowContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onExport={handleExport}
          />
        )}

        {isExporting && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
            <div className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3 shadow-lg">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary" />

              <div className="flex flex-col">
                <span className="text-sm font-medium">Exporting data...</span>

                <span className="text-xs text-muted-foreground">
                  Please wait while the file is being prepared
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
