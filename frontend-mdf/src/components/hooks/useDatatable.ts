import { useEffect, useRef, useState } from "react";
import type { ColumnFilter, DataTableQuery, DataTableResponse } from "../types/datatable.types";

type Props<T> = {
  fetchData: (q: DataTableQuery) => Promise<DataTableResponse<T>>;
};

const cache = new Map<string, DataTableResponse<unknown>>();

export function useDataTable<T>({ fetchData }: Props<T>) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, ColumnFilter>>({});

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildKey = () =>
    JSON.stringify({ page, pageSize, search, filters });

  const load = async () => {
    const key = buildKey();

    if (cache.has(key)) {
      const cached = cache.get(key)! as DataTableResponse<T>;
      setData(cached.data);
      setTotal(cached.total);
      return;
    }

    const res = await fetchData({
      page,
      pageSize,
      search,
      filters,
    });

    cache.set(key, res as DataTableResponse<unknown>);

    setData(res.data);
    setTotal(res.total);
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      load();
    }, 300);
  }, [page, pageSize, search, filters]);

  return {
    data,
    total,
    page,
    pageSize,
    search,
    filters,
    setPage,
    setPageSize,
    setSearch,
    setFilters,
  };
}