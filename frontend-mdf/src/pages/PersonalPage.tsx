import { useState } from "react";
import { Settings } from "lucide-react";

import DynamicTable from "@/features/dynamic-table/components/DynamicTable";
import ColumnSettingModal from "@/features/dynamic-table/components/ColumnSettingModal";

export default function PersonalPage() {
  const ENTITY_ID = 2;

  const [openColumnSetting, setOpenColumnSetting] = useState(false);

  return (
    <div className="p-4 space-y-4">
      {/* <div>
        <h1 className="text-xl font-semibold">Personal Data Viewer</h1>

        <p className="text-sm text-gray-500">
          Showing data for entity ID: {ENTITY_ID}
        </p>
      </div> */}

      {/* Toolbar */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            console.log("ENTITY_ID:", ENTITY_ID);
            setOpenColumnSetting(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Table */}
      <DynamicTable entityId={ENTITY_ID} />

      {/* Modal */}
      {openColumnSetting && (
        <ColumnSettingModal
          entityId={ENTITY_ID}
          onClose={() => setOpenColumnSetting(false)}
        />
      )}
    </div>
  );
}
