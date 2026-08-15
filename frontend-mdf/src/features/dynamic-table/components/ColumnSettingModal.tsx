import { useEffect, useState } from "react";
import {
  visibilityPerUserService,
  type ColumnConfig,
} from "../services/visibilityPerUserService";

type Props = {
  entityId: string;
  onClose: () => void;
  onSave?: (columns: ColumnConfig[]) => void;
};

export default function ColumnSettingModal({
  entityId,
  onClose,
  onSave,
}: Props) {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadColumns() {
      try {
        const result = await visibilityPerUserService.getColumns(entityId);

        setLocalColumns(
          [...result.columns].sort(
            (a, b) =>
              (a.display_order ?? a.default_order) -
              (b.display_order ?? b.default_order),
          ),
        );
      } catch (error) {
        console.error("Failed load columns", error);

        setLocalColumns([]);
      } finally {
        setLoading(false);
      }
    }

    loadColumns();
  }, [entityId]);

  const handleToggle = (fieldName: string, checked: boolean) => {
    setLocalColumns((prev) =>
      prev.map((column) =>
        column.field_name === fieldName
          ? {
              ...column,
              is_visible: checked,
            }
          : column,
      ),
    );
  };

  const handleSave = async () => {
    try {
      await visibilityPerUserService.saveColumns(entityId, localColumns);

      onSave?.(localColumns);

      onClose();
    } catch (error) {
      console.error("Failed save columns", error);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-screen w-[420px] bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Column Settings</h2>

          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && (
            <div className="text-sm text-gray-500">Loading columns...</div>
          )}

          {!loading && localColumns.length === 0 && (
            <div className="text-sm text-gray-500">No columns found</div>
          )}

          {localColumns.map((column) => {
            const visible = column.is_visible ?? column.default_visible;

            return (
              <div
                key={column.field_name}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) =>
                    handleToggle(column.field_name, e.target.checked)
                  }
                />

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {column.display_name}
                  </div>

                  <div className="text-xs text-gray-400 truncate">
                    {column.field_name}
                  </div>
                </div>

                <span className="cursor-grab text-gray-400 text-lg">⋮⋮</span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded border px-4 py-2"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="flex-1 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
