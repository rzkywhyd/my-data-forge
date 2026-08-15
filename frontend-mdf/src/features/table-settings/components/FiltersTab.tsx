import { useState } from "react";
import type {
  TableSetting,
  FilterRule,
  FilterOperator,
} from "../types/table-setting.types";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { FieldCombobox } from "@/components/common/FieldCombobox";

type Props = {
  config: TableSetting;
  setConfig: React.Dispatch<React.SetStateAction<TableSetting>>;
};

const operators: FilterOperator[] = [
  "equals",
  "not equals",
  "contains",
  "greater than",
  "less than",
];

/**
 * 🔥 DEFAULT RULE TEMPLATE (FIX UTAMA)
 * jangan hardcode equals di reset logic
 */
const EMPTY_RULE: FilterRule = {
  key: "",
  operator: "contains", // 🔥 FIX: jangan equals
  value: "",
};

export default function FiltersTab({ config, setConfig }: Props) {
  const [defaultRule, setDefaultRule] = useState<FilterRule>(EMPTY_RULE);
  const [fixedRule, setFixedRule] = useState<FilterRule>(EMPTY_RULE);

  /**
   * =========================
   * ADD RULE
   * =========================
   */

  // console.log("RENDER FILTERS TAB", config);
  const addRule = (type: "default" | "fixed", rule: FilterRule) => {
    if (!rule.key) return;

    setConfig((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        [type]: [...(prev.filters?.[type] || []), rule],
      },
    }));
  };

  /**
   * =========================
   * REMOVE RULE
   * =========================
   */
  const removeRule = (type: "default" | "fixed", index: number) => {
    setConfig((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        [type]: prev.filters[type].filter((_, i) => i !== index),
      },
    }));
  };

  const toText = (v: FilterRule["value"]) =>
    v === null || v === undefined ? "" : String(v);

  const defaultFields = config.columns
    .filter((c) => c.visible)
    .map((c) => ({
      key: c.key,
      label: c.label,
    }));

  const allFields = config.columns.map((c) => ({
    key: c.key,
    label: c.label,
  }));

  /**
   * =========================
   * RENDER BUILDER
   * =========================
   */
  const renderBuilder = (
    title: string,
    rule: FilterRule,
    setRule: React.Dispatch<React.SetStateAction<FilterRule>>,
    type: "default" | "fixed",
    bg: string,
    fields: { key: string; label: string }[],
  ) => {
    return (
      <div className={`border rounded-xl p-4 space-y-4 ${bg}`}>
        <div className="text-sm font-semibold">{title}</div>

        {/* INPUT ROW */}
        <div className="grid grid-cols-12 gap-2 items-center">
          {/* FIELD */}
          <div className="col-span-4">
            <FieldCombobox
              value={rule.key}
              onChange={(val) =>
                setRule((p) => ({
                  ...p,
                  key: val,
                }))
              }
              options={fields}
            />
          </div>

          {/* OPERATOR */}
          <div className="col-span-3">
            <Select
              value={rule.operator}
              onValueChange={(value: FilterOperator) =>
                setRule((p) => ({
                  ...p,
                  operator: value,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op} value={op}>
                    {op}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* VALUE */}
          <Input
            className="col-span-3 text-sm"
            value={toText(rule.value)}
            onChange={(e) =>
              setRule((p) => ({
                ...p,
                value: e.target.value,
              }))
            }
          />

          {/* ADD */}
          <button
            className="col-span-2 bg-black text-white text-xs rounded h-9"
            onClick={() => {
              addRule(type, rule);

              // 🔥 FIX UTAMA DI SINI
              // jangan paksa equals lagi
              setRule((prev) => ({
                ...EMPTY_RULE,
                operator: prev.operator || "contains", // keep last operator
              }));
            }}
          >
            ADD
          </button>
        </div>

        {/* LIST */}
        <div className="space-y-2">
          {config.filters[type].map((f, i) => (
            <div
              key={i}
              className="flex justify-between border rounded px-3 py-2 text-sm bg-white"
            >
              <span>
                {f.key} {f.operator} {toText(f.value)}
              </span>

              <button
                className="text-red-500 text-xs"
                onClick={() => removeRule(type, i)}
              >
                delete
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold">Filter Builder</h2>

      <div className="grid grid-cols-2 gap-4">
        {renderBuilder(
          "Default Filters",
          defaultRule,
          setDefaultRule,
          "default",
          "bg-blue-50",
          defaultFields,
        )}

        {renderBuilder(
          "Fixed Filters",
          fixedRule,
          setFixedRule,
          "fixed",
          "bg-gray-50",
          allFields,
        )}
      </div>
    </div>
  );
}
