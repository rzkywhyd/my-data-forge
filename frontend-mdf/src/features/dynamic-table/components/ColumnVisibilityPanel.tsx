import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { Search, GripVertical, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import {
  useColumnVisibilityPanel,
  type ColumnItem,
} from "../hooks/useColumnVisibilityPanel";

// =====================================================
// TYPES
// =====================================================

type Props = {
  columns: ColumnItem[];
  onChange?: (columns: ColumnItem[]) => void;
  onSave?: (columns: ColumnItem[]) => void;
  onCancel?: () => void;
};

// =====================================================
// SORTABLE COLUMN ROW
// =====================================================

function SortableColumnRow({
  column,
  onToggle,
}: {
  column: ColumnItem;
  onToggle: (field: string, checked: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.field,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group
        flex
        items-center
        gap-1
        rounded-md
        px-2
        py-0.5
        transition-colors
        ${
          isDragging
            ? "opacity-30"
            : column.visible
              ? "bg-white hover:bg-slate-100"
              : "bg-slate-50"
        }
      `}
    >
      {/* DRAG HANDLE */}

      <button
        type="button"
        {...attributes}
        {...listeners}
        className={`
          flex
          h-6
          w-5
          shrink-0
          touch-none
          items-center
          justify-center
          cursor-grab
          active:cursor-grabbing
          ${
            column.visible
              ? "text-slate-400 hover:text-slate-700"
              : "text-slate-300 hover:text-slate-500"
          }
        `}
        aria-label={`Move ${column.label}`}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* CHECKBOX */}

      <Checkbox
        checked={column.visible}
        onCheckedChange={(checked) => onToggle(column.field, checked === true)}
      />

      {/* COLUMN NAME */}

      <span
        className={`
          min-w-0 flex-1 text-xs break-words whitespace-normal
          ${column.visible ? "text-slate-700" : "text-slate-400"}
        `}
      >
        {column.label}
      </span>

      {/* SETTINGS */}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`
              h-7
              w-7
              shrink-0
              transition-opacity
              ${
                column.visible
                  ? "opacity-0 group-hover:opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              }
            `}
          >
            <Settings2 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>

        <TooltipContent>
          <p>{`Settings for ${column.label}`}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

// =====================================================
// DRAG OVERLAY
// =====================================================

function DragColumnOverlay({ column }: { column: ColumnItem }) {
  return (
    <div
      className="
        flex
        w-[304px]
        items-center
        gap-1
        rounded-md
        border
        border-slate-200
        bg-white
        px-2
        py-0.5
        shadow-xl
      "
    >
      {/* DRAG HANDLE */}

      <div
        className="
          flex
          h-6
          w-5
          shrink-0
          items-center
          justify-center
          text-slate-400
        "
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* CHECKBOX */}

      <Checkbox checked={column.visible} disabled />

      {/* COLUMN NAME */}

      <span
        className={`
          min-w-0
          flex-1
          truncate
          text-xs
          ${column.visible ? "text-slate-700" : "text-slate-400"}
        `}
      >
        {column.label}
      </span>

      {/* SETTINGS */}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled
        className="h-7 w-7 shrink-0"
      >
        <Settings2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function ColumnVisibilityPanel({
  columns: initialColumns,
  onChange,
  onSave,
  onCancel,
}: Props) {
  // ===================================================
  // HOOK
  // ===================================================

  const {
    columns,
    search,
    setSearch,
    confirmAction,
    setConfirmAction,
    activeColumn,
    filteredColumns,
    visibleCount,
    toggleColumn,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    handleConfirmAction,
    handleCancel,
    handleSave,
  } = useColumnVisibilityPanel({
    columns: initialColumns,
    onChange,
    onSave,
    onCancel,
  });

  // ===================================================
  // DND SENSOR
  // ===================================================

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>
      <TooltipProvider>
        {/* =================================================
            COLUMN SETTINGS PANEL
        ================================================= */}

        <div
          className="
            w-80
            overflow-hidden
            rounded-lg
            border-3
            border-slate-300
            bg-white
            shadow-xl
          "
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <div className="border-b px-4 py-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">
                Column Settings
              </h3>

              <span className="text-xs text-muted-foreground">
                {visibleCount}/{columns.length}
              </span>
            </div>

            {/* SEARCH */}

            <div className="relative">
              <Search
                className="
                  absolute
                  left-2.5
                  top-2.5
                  h-4
                  w-4
                  text-muted-foreground
                "
              />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search columns..."
                className="
                  h-8
                  pl-8
                  text-xs
                "
              />
            </div>
          </div>

          {/* =================================================
              COLUMN LIST
          ================================================= */}

          <div
            className="
              max-h-[420px]
              overflow-y-auto
              p-2
            "
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragCancel={handleDragCancel}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredColumns.map((column) => column.field)}
                strategy={verticalListSortingStrategy}
              >
                {filteredColumns.map((column) => (
                  <SortableColumnRow
                    key={column.field}
                    column={column}
                    onToggle={toggleColumn}
                  />
                ))}
              </SortableContext>

              {/* =================================================
                  EMPTY
              ================================================= */}

              {filteredColumns.length === 0 && (
                <div
                  className="
                    py-10
                    text-center
                    text-xs
                    text-muted-foreground
                  "
                >
                  No columns found
                </div>
              )}

              {/* =================================================
                  DRAG OVERLAY
              ================================================= */}

              <DragOverlay>
                {activeColumn ? (
                  <DragColumnOverlay column={activeColumn} />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="border-t px-3 py-3">
            {/* SELECT / RESET */}

            <div className="mb-3 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setConfirmAction("selectAll")}
              >
                Select All
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setConfirmAction("reset")}
              >
                Reset
              </Button>
            </div>

            {/* CANCEL / SAVE */}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleCancel}
              >
                Cancel
              </Button>

              <Button type="button" className="flex-1" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </TooltipProvider>

      {/* =================================================
          CONFIRMATION DIALOG
      ================================================= */}

      <Dialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "selectAll"
                ? "Select All Columns?"
                : "Reset Columns?"}
            </DialogTitle>

            <DialogDescription>
              {confirmAction === "selectAll"
                ? "Are you sure you want to make all columns visible?"
                : "Are you sure you want to reset the columns to their original settings?"}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </Button>

            <Button type="button" onClick={handleConfirmAction}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
