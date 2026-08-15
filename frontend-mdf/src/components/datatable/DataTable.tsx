import { useEffect, useMemo } from "react";
import type {
  DataTableQuery,
  DataTableResponse,
} from "../types/datatable.types";
import { useDataTable } from "../hooks/useDatatable";

type Column<T> = {
  key: Extract<keyof T, string>;
  title: string;
  frozen?: boolean;
};

type RowData<T> = T & Record<string, unknown>;

type Props<T> = {
  columns: Column<T>[];
  fetchData: (q: DataTableQuery) => Promise<DataTableResponse<T>>;
};

export default function DataTable<T>({ columns, fetchData }: Props<T>) {
  const {
    data,
    total,
    page,
    pageSize,
    search,
    // filters,
    setPage,
    setPageSize,
    setSearch,
    setFilters,
  } = useDataTable<T>({ fetchData });

  /**
   * URL SYNC
   */
  useEffect(() => {
    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    params.set("search", search);

    window.history.replaceState({}, "", `?${params.toString()}`);
  }, [page, pageSize, search]);

  const frozenCols = useMemo(() => columns.filter((c) => c.frozen), [columns]);

  const normalCols = useMemo(() => columns.filter((c) => !c.frozen), [columns]);

  const renderHeader = (cols: Column<T>[]) => (
    <tr>
      {cols.map((c) => (
        <th key={c.key} className="sticky top-0 bg-gray-100 px-3 py-2 border-b">
          {c.title}

          {/* FILTER */}
          <div className="text-xs mt-1">
            <input
              className="border px-1 w-full"
              placeholder="filter..."
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  [c.key]: {
                    key: c.key,
                    operator: "contains",
                    value: e.target.value,
                  },
                }))
              }
            />
          </div>
        </th>
      ))}
    </tr>
  );

  const renderRows = (cols: Column<T>[]) =>
    (data as RowData<T>[]).map((row, i) => (
      <tr key={i} className="border-b">
        {cols.map((c) => (
          <td key={c.key} className="px-3 py-2">
            {String(row[c.key] ?? "")}
          </td>
        ))}
      </tr>
    ));

  return (
    <div className="space-y-3">
      {/* GLOBAL SEARCH */}
      <input
        className="border p-2 w-full"
        placeholder="Global search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* TABLE */}
      <div className="overflow-auto border rounded-lg flex">
        {frozenCols.length > 0 && (
          <table className="border-r bg-white">
            <thead>{renderHeader(frozenCols)}</thead>
            <tbody>{renderRows(frozenCols)}</tbody>
          </table>
        )}

        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-gray-100">
            {renderHeader(normalCols)}
          </thead>
          <tbody>{renderRows(normalCols)}</tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center">
        <div>
          Page {page} / {Math.ceil(total / pageSize)}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))}>Prev</button>
          <button onClick={() => setPage(page + 1)}>Next</button>

          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {[10, 20, 50].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
