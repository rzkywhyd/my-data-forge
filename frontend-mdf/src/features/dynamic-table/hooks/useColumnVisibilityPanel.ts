import { useMemo, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";

export type ColumnItem = {
  field: string;
  label: string;
  visible: boolean;
};

type UseColumnVisibilityPanelProps = {
  columns: ColumnItem[];
  onChange?: (columns: ColumnItem[]) => void;
  onSave?: (columns: ColumnItem[]) => void;
  onCancel?: () => void;
};

export function useColumnVisibilityPanel({
  columns: initialColumns,
  onChange,
  onSave,
  onCancel,
}: UseColumnVisibilityPanelProps) {
  const [columns, setColumns] = useState<ColumnItem[]>(initialColumns);

  const [search, setSearch] = useState("");

  const [confirmAction, setConfirmAction] = useState<
    "selectAll" | "reset" | null
  >(null);

  const [activeColumn, setActiveColumn] = useState<ColumnItem | null>(null);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredColumns = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return columns;
    }

    return columns.filter((column) =>
      column.label.toLowerCase().includes(keyword),
    );
  }, [columns, search]);

  // ===================================================
  // COUNTS
  // ===================================================

  const visibleCount = columns.filter((column) => column.visible).length;

  // ===================================================
  // UPDATE
  // ===================================================

  const updateColumns = (nextColumns: ColumnItem[]) => {
    setColumns(nextColumns);
    onChange?.(nextColumns);
  };

  // ===================================================
  // TOGGLE
  // ===================================================

  const toggleColumn = (field: string, checked: boolean) => {
    const nextColumns = columns.map((column) =>
      column.field === field
        ? {
            ...column,
            visible: checked,
          }
        : column,
    );

    updateColumns(nextColumns);
  };

  // ===================================================
  // DRAG START
  // ===================================================

  const handleDragStart = (event: DragStartEvent) => {
    const column = columns.find((item) => item.field === event.active.id);

    setActiveColumn(column ?? null);
  };

  // ===================================================
  // DRAG END
  // ===================================================

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveColumn(null);

    const { active, over } = event;

    if (!over) {
      return;
    }

    if (active.id === over.id) {
      return;
    }

    const oldIndex = columns.findIndex((column) => column.field === active.id);

    const newIndex = columns.findIndex((column) => column.field === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const nextColumns = arrayMove(columns, oldIndex, newIndex);

    updateColumns(nextColumns);
  };

  // ===================================================
  // DRAG CANCEL
  // ===================================================

  const handleDragCancel = () => {
    setActiveColumn(null);
  };

  // ===================================================
  // SELECT ALL
  // ===================================================

  const handleSelectAll = () => {
    updateColumns(
      columns.map((column) => ({
        ...column,
        visible: true,
      })),
    );
  };

  // ===================================================
  // RESET
  // ===================================================

  const handleReset = () => {
    updateColumns(
      initialColumns.map((column) => ({
        ...column,
      })),
    );

    setSearch("");
  };

  // ===================================================
  // CONFIRM ACTION
  // ===================================================

  const handleConfirmAction = () => {
    if (confirmAction === "selectAll") {
      handleSelectAll();
    }

    if (confirmAction === "reset") {
      handleReset();
    }

    setConfirmAction(null);
  };

  // ===================================================
  // CANCEL
  // ===================================================

  const handleCancel = () => {
    setColumns(
      initialColumns.map((column) => ({
        ...column,
      })),
    );

    setSearch("");
    setConfirmAction(null);

    onCancel?.();
  };

  // ===================================================
  // SAVE
  // ===================================================

  const handleSave = () => {
    onSave?.(columns);
  };

  // ===================================================
  // DISPLAYED / HIDDEN
  // ===================================================

  const displayedColumns = filteredColumns.filter((column) => column.visible);

  const hiddenColumns = filteredColumns.filter((column) => !column.visible);

  return {
    columns,
    search,
    setSearch,

    confirmAction,
    setConfirmAction,

    activeColumn,

    filteredColumns,
    displayedColumns,
    hiddenColumns,

    visibleCount,

    toggleColumn,

    handleDragStart,
    handleDragEnd,
    handleDragCancel,

    handleSelectAll,
    handleReset,
    handleConfirmAction,

    handleCancel,
    handleSave,
  };
}
