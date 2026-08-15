import { useState } from "react";
import GeneralTab from "./GeneralTab";
import FiltersTab from "./FiltersTab";
import ColumnsTab from "./ColumnsTab";
import type { TableSetting } from "../types/table-setting.types";

type TabKey = "general" | "filters" | "columns";

type Props = {
  config: TableSetting;
  setConfig: React.Dispatch<React.SetStateAction<TableSetting>>;
  entityId?: number;
};

const tabs: { id: TabKey; label: string }[] = [
  { id: "columns", label: "Columns" },
  { id: "filters", label: "Filters" },
  { id: "general", label: "General" },
];

export default function FancyTabs({ config, setConfig }: Props) {
  const [active, setActive] = useState<TabKey>("columns");

  return (
    <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
      {/* TAB HEADER */}
      <div className="flex gap-1 bg-gray-50 border-b p-1">
        {tabs.map((tab) => {
          const isActive = active === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`
                relative px-4 py-2 text-sm font-medium rounded-lg transition-all
                ${
                  isActive
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }
              `}
            >
              {tab.label}

              {isActive && (
                <span className="absolute left-3 right-3 -bottom-[2px] h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      <div className="p-5">
        {active === "general" && (
          <GeneralTab config={config} setConfig={setConfig} />
        )}

        {active === "filters" && (
          <FiltersTab config={config} setConfig={setConfig} />
        )}

        {active === "columns" && (
          <ColumnsTab config={config} setConfig={setConfig} />
        )}
      </div>
    </div>
  );
}
