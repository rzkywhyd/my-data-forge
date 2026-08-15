import React from "react";
import type { TableSetting, ColumnConfig } from "../types/table-setting.types";

import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import {
  ArrowUp,
  ArrowDown,
  GripVertical,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

type Props = {
  config: TableSetting;
  setConfig: React.Dispatch<React.SetStateAction<TableSetting>>;
};

/**
 * ROW
 */
function Row({
  col,
  children,
}: {
  col: ColumnConfig;
  children: (props: {
    setActivatorNodeRef: (element: HTMLElement | null) => void;
    listeners: React.HTMLAttributes<HTMLElement>;
    attributes: React.HTMLAttributes<HTMLElement>;
  }) => React.ReactNode;
}) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
  } = useSortable({
    id: col.field_id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({
        setActivatorNodeRef,
        listeners: listeners ?? {},
        attributes: attributes ?? {},
      })}
    </div>
  );
}

/**
 * MAIN
 */
export default function ColumnsTab({ config, setConfig }: Props) {
  const updateColumn = (
    field_id: number,
    updater: (col: ColumnConfig) => ColumnConfig,
  ) => {
    const updated = config.columns.map((col) => {
      if (col.field_id !== field_id) return col;

      let next = updater(col);

      if (!next.visible) {
        next = {
          ...next,
          sort_enabled: false,
          sort_type: null,
          freeze_enabled: false,
          freeze_type: null,
        };
      }

      return next;
    });

    setConfig((prev) => ({
      ...prev,
      columns: updated,
    }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const sortedColumns = [...config.columns].sort((a, b) => a.order - b.order);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = sortedColumns.findIndex(
      (c) => c.field_id === Number(active.id),
    );

    const newIndex = sortedColumns.findIndex(
      (c) => c.field_id === Number(over.id),
    );

    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(sortedColumns, oldIndex, newIndex);

    const updated = reordered.map((col, index) => ({
      ...col,
      order: index + 1,
    }));

    setConfig((prev) => ({
      ...prev,
      columns: updated,
    }));
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">
        Column Configuration (Grid UI)
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedColumns.map((c) => c.field_id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="border rounded-lg overflow-hidden">
            {/* HEADER */}
            <div className="grid grid-cols-8 bg-gray-100 text-sm font-medium">
              <div className="p-2">Show</div>
              <div className="p-2">Drag</div>
              <div className="p-2">Column</div>
              <div className="p-2">Sort</div>
              <div className="p-2">Sort Type</div>
              <div className="p-2">Freeze</div>
              <div className="p-2">Freeze Type</div>
              <div className="p-2">Order</div>
            </div>

            {/* BODY */}
            {sortedColumns.map((col) => {
              const disabled = !col.visible;

              return (
                <Row key={col.field_id} col={col}>
                  {({ setActivatorNodeRef, listeners, attributes }) => (
                    <div className="grid grid-cols-8 border-t items-center text-sm">
                      {/* SHOW */}
                      <div className="p-2">
                        <Checkbox
                          checked={col.visible}
                          onCheckedChange={(checked) =>
                            updateColumn(col.field_id, (c) => ({
                              ...c,
                              visible: !!checked,
                            }))
                          }
                        />
                      </div>

                      {/* DRAG */}
                      <div className="p-2">
                        <button
                          ref={setActivatorNodeRef}
                          {...attributes}
                          {...listeners}
                          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                        >
                          <GripVertical size={16} />
                        </button>
                      </div>

                      {/* COLUMN */}
                      <div className="p-2">
                        <span className={disabled ? "text-gray-400" : ""}>
                          {col.label}
                        </span>
                      </div>

                      {/* SORT TOGGLE */}
                      <div className="p-2">
                        <Switch
                          disabled={disabled}
                          checked={col.sort_enabled}
                          onCheckedChange={(checked) =>
                            updateColumn(col.field_id, (c) => ({
                              ...c,
                              sort_enabled: checked,
                              sort_type: checked ? "asc" : null,
                            }))
                          }
                        />
                      </div>

                      {/* SORT TYPE POPUP */}
                      <div className="p-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={disabled || !col.sort_enabled}
                            >
                              {col.sort_type === "asc" ? (
                                <>
                                  <ArrowUp size={14} /> ASC
                                </>
                              ) : col.sort_type === "desc" ? (
                                <>
                                  <ArrowDown size={14} /> DESC
                                </>
                              ) : (
                                "Select"
                              )}
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent className="p-0 w-[140px]">
                            <Command>
                              <CommandGroup>
                                <CommandItem
                                  onSelect={() =>
                                    updateColumn(col.field_id, (c) => ({
                                      ...c,
                                      sort_type: "asc",
                                      sort_enabled: true,
                                    }))
                                  }
                                >
                                  ASC
                                </CommandItem>

                                <CommandItem
                                  onSelect={() =>
                                    updateColumn(col.field_id, (c) => ({
                                      ...c,
                                      sort_type: "desc",
                                      sort_enabled: true,
                                    }))
                                  }
                                >
                                  DESC
                                </CommandItem>
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* FREEZE TOGGLE */}
                      <div className="p-2">
                        <Switch
                          disabled={disabled}
                          checked={col.freeze_enabled}
                          onCheckedChange={(checked) =>
                            updateColumn(col.field_id, (c) => ({
                              ...c,
                              freeze_enabled: checked,
                              freeze_type: checked ? "left" : null,
                            }))
                          }
                        />
                      </div>

                      {/* FREEZE TYPE POPUP */}
                      <div className="p-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={disabled || !col.freeze_enabled}
                            >
                              {col.freeze_type === "left" ? (
                                <>
                                  <ArrowLeft size={14} /> Left
                                </>
                              ) : col.freeze_type === "right" ? (
                                <>
                                  <ArrowRight size={14} /> Right
                                </>
                              ) : (
                                "Select"
                              )}
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent className="p-0 w-[140px]">
                            <Command>
                              <CommandGroup>
                                <CommandItem
                                  onSelect={() =>
                                    updateColumn(col.field_id, (c) => ({
                                      ...c,
                                      freeze_enabled: true,
                                      freeze_type: "left",
                                    }))
                                  }
                                >
                                  Left
                                </CommandItem>

                                <CommandItem
                                  onSelect={() =>
                                    updateColumn(col.field_id, (c) => ({
                                      ...c,
                                      freeze_enabled: true,
                                      freeze_type: "right",
                                    }))
                                  }
                                >
                                  Right
                                </CommandItem>
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* ORDER */}
                      <div className="p-2 text-gray-500">{col.order}</div>
                    </div>
                  )}
                </Row>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
