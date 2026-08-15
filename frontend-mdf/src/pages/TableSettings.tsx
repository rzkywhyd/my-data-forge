import { useEffect, useState } from "react";

import FancyTabs from "@/features/table-settings/components/FancyTabs";
import CreateEntityModal from "@/features/table-settings/components/CreateEntityModal";

import { entityService } from "@/features/table-settings/services/entityService";
import { tableSettingService } from "@/features/table-settings/services/tableSettingService";

import type { Entity } from "@/features/table-settings/types/entity.types";
import type {
  EntityField,
  TableColumn,
  TableSetting,
  FilterRule,
  ColumnConfig,
  SaveTableSettingPayload,
} from "@/features/table-settings/types/table-setting.types";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SyncSchemaButton } from "@/features/table-settings/components/SyncSchemaButton";

type DbFilter = {
  filter_type: "default" | "fixed";
  field_name: string;
  operator: string;
  value: string | number | boolean | null;
};

export default function TableSettings() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  const [config, setConfig] = useState<TableSetting>({
    entityId: "",
    menu_name: "User Management",

    pagination: {
      pageSize: 100,
      pageSizeOptions: [25, 50, 100, 200],
    },

    filters: {
      default: [],
      fixed: [],
    },

    columns: [],
    actions: ["edit", "delete"],
    theme: "default",
  });

  /**
   * ======================
   * LOAD ENTITIES
   * ======================
   */
  useEffect(() => {
    const load = async () => {
      const data = await entityService.list();
      setEntities(data);
    };

    load();
  }, []);

  /**
   * ======================
   * LOAD CONFIG
   * ======================
   */
  useEffect(() => {
    if (!selectedEntity) return;

    const load = async () => {
      try {
        const [fieldsRes, colsRes, filtersRes, generalsRes] = await Promise.all(
          [
            entityService.getFields(selectedEntity.entity_id),
            tableSettingService.getColumns(selectedEntity.entity_id),
            tableSettingService.getFilters(selectedEntity.entity_id),
            tableSettingService.getGenerals(selectedEntity.entity_id),
          ],
        );

        const fields = fieldsRes as EntityField[];

        const cols: TableColumn[] = Array.isArray(colsRes?.data)
          ? colsRes.data
          : colsRes;

        const filters: DbFilter[] = Array.isArray(filtersRes?.data)
          ? filtersRes.data
          : [];

        const general = generalsRes?.data;

        if (general) {
          setConfig((prev) => ({
            ...prev,
            menu_name: general.menu_name ?? prev.menu_name,
            theme: general.theme ?? prev.theme,
            pagination: {
              pageSize: general.page_size ?? prev.pagination.pageSize,
              pageSizeOptions:
                general.page_size_options ?? prev.pagination.pageSizeOptions,
            },
          }));
        }

        /**
         * ======================
         * MERGE COLUMNS
         * ======================
         */
        const merged: ColumnConfig[] = fields.map((f, i) => {
          const saved = cols.find(
            (c) => Number(c.field_id) === Number(f.field_id),
          );

          return {
            field_id: f.field_id,
            key: f.field_name,
            label: saved?.label ?? f.field_label,

            visible:
              saved?.is_visible !== undefined
                ? Number(saved.is_visible) === 1
                : Number(f.is_visible_default) === 1,

            order: saved?.display_order ?? f.display_order ?? i + 1,

            sort_enabled: saved?.sort_enabled ?? false,
            sort_type: saved?.sort_type ?? null,

            freeze_enabled: saved?.freeze_enabled ?? false,
            freeze_type: saved?.freeze_type ?? null,
          };
        });

        /**
         * ======================
         * GROUP FILTERS
         * ======================
         */
        const grouped: {
          default: FilterRule[];
          fixed: FilterRule[];
        } = {
          default: [],
          fixed: [],
        };

        filters.forEach((f) => {
          const rule: FilterRule = {
            key: f.field_name,
            operator: f.operator as FilterRule["operator"],
            value: f.value,
          };

          if (f.filter_type === "fixed") {
            grouped.fixed.push(rule);
          } else {
            grouped.default.push(rule);
          }
        });

        /**
         * ======================
         * SET CONFIG
         * ======================
         */
        setConfig((prev) => ({
          ...prev,
          entityId: String(selectedEntity.entity_id),
          columns: merged,
          filters: grouped,
        }));
      } catch (err) {
        console.error("FAILED LOAD CONFIG:", err);
      }
    };

    load();
  }, [selectedEntity]);

  /**
   * ======================
   * SELECT ENTITY
   * ======================
   */
  const handleSelectEntity = (entityId: number) => {
    const found = entities.find((x) => x.entity_id === entityId) || null;
    setSelectedEntity(found);
  };

  /**
   * ======================
   * BUILD PAYLOAD (FIXED)
   * ======================
   */
  const buildPayload = (): SaveTableSettingPayload | null => {
    if (!selectedEntity) return null;

    return {
      entity_id: selectedEntity.entity_id,

      menu_name: config.menu_name,
      theme: config.theme,
      page_size: config.pagination.pageSize,

      columns: config.columns.map((c) => ({
        field_id: c.field_id,
        visible: c.visible,
        display_order: c.order,
        sort_enabled: c.sort_enabled,
        sort_type: c.sort_type,
        freeze_enabled: c.freeze_enabled,
        freeze_type: c.freeze_type,
      })),

      /**
       * ======================
       * FLATTEN FILTERS (FIX CRITICAL)
       * ======================
       */
      filters: [
        ...config.filters.default.map((f) => ({
          filter_type: "default" as const,
          field_name: f.key,
          operator: f.operator,
          value: f.value,
        })),
        ...config.filters.fixed.map((f) => ({
          filter_type: "fixed" as const,
          field_name: f.key,
          operator: f.operator,
          value: f.value,
        })),
      ],
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full space-y-6">
        {/* =========================
        ENTITY HEADER
    ========================= */}
        <Card className="p-6 space-y-4 w-full">
          {/* TITLE */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              {selectedEntity?.entity_name || "No Entity Selected"}
            </h1>

            {selectedEntity?.entity_id && (
              <p className="text-sm text-gray-500">
                Entity ID: {selectedEntity.entity_id}
              </p>
            )}
          </div>

          {/* SELECT + BUTTON ROW */}
          <div className="flex gap-3 items-center">
            {/* SELECT ENTITY */}
            <Select
              value={selectedEntity?.entity_id?.toString() || ""}
              onValueChange={(val) => handleSelectEntity(Number(val))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Entity" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="__empty" disabled>
                  Select Entity
                </SelectItem>

                {entities.map((e) => (
                  <SelectItem key={e.entity_id} value={e.entity_id.toString()}>
                    {e.entity_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 🔥 SYNC SCHEMA BUTTON */}
            <div className="shrink-0">
              <SyncSchemaButton entityId={selectedEntity?.entity_id} />
            </div>

            {/* NEW ENTITY BUTTON */}
            <div className="shrink-0">
              <CreateEntityModal
                onSuccess={(newEntity) => {
                  setEntities((prev) => [...prev, newEntity]);
                  setSelectedEntity(newEntity);
                }}
              />
            </div>
          </div>

          {/* MENU NAME */}
          <Input
            className="w-full"
            value={config.menu_name}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                menu_name: e.target.value,
              }))
            }
            placeholder="Menu Name"
          />
        </Card>

        {/* =========================
        TABS
    ========================= */}
        <div className="bg-white border rounded-xl shadow-sm w-full">
          <FancyTabs
            config={config}
            setConfig={setConfig}
            entityId={selectedEntity?.entity_id}
          />
        </div>

        {/* =========================
        SAVE BUTTON
    ========================= */}
        <div className="flex justify-end w-full">
          <Button
            onClick={async () => {
              const payload = buildPayload();
              if (!payload) return;

              console.log("FINAL PAYLOAD:", payload);

              await tableSettingService.saveConfig(payload);

              alert("Saved!");
            }}
          >
            Save Table Setting
          </Button>
        </div>
      </div>
    </div>
  );
}
