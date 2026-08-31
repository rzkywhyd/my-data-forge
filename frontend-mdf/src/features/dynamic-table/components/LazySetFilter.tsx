import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api";
import type { IFilterParams } from "ag-grid-community";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = IFilterParams & {
  context: {
    entityId: number;
  };
};

type TabFilter = "list" | "paste";

export default function LazySetFilter(props: Props) {
  const [tab, setTab] = useState<TabFilter>("list");

  const [values, setValues] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [appliedSelected, setAppliedSelected] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [pasteText, setPasteText] = useState("");

  const field = props.colDef?.field;

  // =========================
  // 🔥 GLOBAL TRACKER (NO RERENDER LOOP)
  // =========================
  const clearedFiltersRef = useRef<string[]>([]);

  const apiRef = props.api;
  const filterModel = JSON.stringify(apiRef.getFilterModel());

  // =========================
  // LOAD DISTINCT VALUES
  // =========================

  useEffect(() => {
    if (!field) return;

    const load = async () => {
      const currentFilterModel = {
        ...apiRef.getFilterModel(),
      };

      // remove self filter
      delete currentFilterModel[field];

      const res = await api.post<string[]>("/personal/distinct", {
        entityId: props.context.entityId,
        field,
        currentField: field,
        filterModel: currentFilterModel,
        search,
        clearedFilters: clearedFiltersRef.current,
      });

      const data = res.data ?? [];

      setValues(data);

      const existing = apiRef.getFilterModel()?.[field];

      if (!existing) {
        setSelected(data);
        setAppliedSelected([]);
        return;
      }

      if (existing.filterType === "set" && Array.isArray(existing.values)) {
        const filtered = data.filter((v) => existing.values.includes(v));

        setSelected(filtered);
        setAppliedSelected(filtered);
        return;
      }

      if (existing.filterType === "text" && existing.type === "contains") {
        const keyword = String(existing.filter ?? "").toLowerCase();

        const filtered = data.filter((v) =>
          String(v).toLowerCase().includes(keyword),
        );

        setSelected(filtered);
        setAppliedSelected(filtered);
        return;
      }

      setSelected(data);
      setAppliedSelected(data);
    };

    const timer = setTimeout(() => {
      load();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [field, search, props.context.entityId, apiRef, filterModel]);

  // =========================
  // SEARCH SCOPE
  // =========================
  const scope = useMemo(() => {
    if (!search) return values;

    const q = search.toLowerCase();

    return values.filter((v) => String(v).toLowerCase().includes(q));
  }, [values, search]);

  // =========================
  // APPLIED SET (SORT PURPOSE)
  // =========================
  const appliedSet = useMemo(() => new Set(appliedSelected), [appliedSelected]);

  // =========================
  // SORTED VALUES
  // ONLY APPLIED VALUES MOVE TO TOP
  // =========================
  const sortedScope = useMemo(() => {
    return [...scope].sort((a, b) => {
      const aApplied = appliedSet.has(a);
      const bApplied = appliedSet.has(b);

      if (aApplied && !bApplied) return -1;
      if (!aApplied && bApplied) return 1;

      return String(a).localeCompare(String(b));
    });
  }, [scope, appliedSet]);

  // =========================
  // SELECT ALL STATE
  // =========================
  const isAllSelected = useMemo(() => {
    return scope.length > 0 && scope.every((v) => selected.includes(v));
  }, [scope, selected]);

  // =========================
  // TOGGLE SINGLE
  // =========================
  const toggle = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  // =========================
  // SELECT ALL
  // =========================
  const handleSelectAll = () => {
    const allSelected = scope.every((v) => selected.includes(v));

    if (allSelected) {
      setSelected((prev) => prev.filter((v) => !scope.includes(v)));
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...scope])));
    }
  };

  // =========================
  // APPLY FILTER
  // =========================
  const applyFilter = () => {
    if (!field) return;

    const finalValues = selected.filter((v) => values.includes(v));

    const model = {
      ...apiRef.getFilterModel(),
    };

    if (finalValues.length === 0) {
      delete model[field];
    } else {
      model[field] = {
        filterType: "set",
        values: finalValues,
      };
    }

    apiRef.setFilterModel(model);
    apiRef.onFilterChanged?.();

    // 🔥 save applied values for sorting
    setAppliedSelected(finalValues);

    // 🔥 reset cleared state after apply
    clearedFiltersRef.current = clearedFiltersRef.current.filter(
      (f) => f !== field,
    );

    setSearch("");
    setPasteText("");

    apiRef.hidePopupMenu?.();
  };

  // =========================
  // CLEAR FILTER
  // =========================
  const handleClear = () => {
    if (!field) return;

    const currentModel = apiRef.getFilterModel() || {};
    const newModel = { ...currentModel };

    delete newModel[field];

    apiRef.setFilterModel(newModel);
    apiRef.onFilterChanged?.();

    // 🔥 track cleared column
    if (!clearedFiltersRef.current.includes(field)) {
      clearedFiltersRef.current.push(field);
    }

    // UI reset
    setSelected(values);
    setAppliedSelected([]);

    setSearch("");
    setPasteText("");

    apiRef.hidePopupMenu?.();
  };

  // =========================
  // LABEL
  // =========================
  const selectAllLabel =
    search.length > 0 ? "Select All Search Result" : "Select All";

  // =========================
  // UI
  // =========================
  return (
    <div className="w-70 h-105 rounded-md border bg-white shadow-lg overflow-hidden">
      {/* HEADER */}
      <div className="flex justify-between px-2 py-2 border-b bg-gray-50">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabFilter)}>
          <TabsList className="grid grid-cols-2 w-fit">
            <TabsTrigger value="list" className="text-[11px] px-3 py-1">
              List
            </TabsTrigger>

            <TabsTrigger value="paste" className="text-[11px] px-3 py-1">
              Paste
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="text-[10px] text-gray-500">
          {selected.length} selected
        </div>
      </div>

      {/* LIST */}
      {tab === "list" && (
        <div className="p-2">
          {/* SELECT ALL */}
          <div className="mb-2 flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              onCheckedChange={() => {
                handleSelectAll();
              }}
            />

            <label
              htmlFor="select-all"
              className="cursor-pointer text-xs font-medium"
            >
              {selectAllLabel}
            </label>
          </div>

          {/* SEARCH */}
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="mb-2 h-8 text-xs"
          />

          {/* VALUES */}
          <div className="h-60 space-y-1 overflow-auto">
            {sortedScope.map((v) => (
              <div
                key={v}
                className="flex items-center gap-2 rounded px-1 py-1 text-xs hover:bg-muted"
              >
                <Checkbox
                  id={`filter-${v}`}
                  checked={selected.includes(v)}
                  onCheckedChange={() => toggle(v)}
                />

                <label
                  htmlFor={`filter-${v}`}
                  className="flex-1 cursor-pointer truncate"
                  title={v}
                >
                  {v}
                </label>
              </div>
            ))}
          </div>

          {/* ACTIONS */}
          <div className="mt-2 flex justify-between border-t pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="h-7 px-2 text-xs"
            >
              Clear
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={applyFilter}
              className="h-7 bg-black px-3 text-xs text-white hover:bg-gray-800"
            >
              Apply
            </Button>
          </div>
        </div>
      )}

      {/* PASTE */}
      {tab === "paste" && (
        <div className="max-h-80 p-2">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            className="w-full border rounded p-2 text-xs h-75"
            placeholder={`value1\nvalue2\nvalue3`}
          />

          <Button
            onClick={applyFilter}
            className="text-xs bg-black text-white mt-2"
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
