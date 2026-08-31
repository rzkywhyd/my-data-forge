import { Download } from "lucide-react";

type Props = {
  x: number;
  y: number;
  onExport: () => void;
  onClose: () => void;
};

export default function RowContextMenu({ x, y, onExport, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        className="fixed z-50 min-w-44 rounded-md border bg-background p-1 shadow-lg"
        style={{
          left: x,
          top: y,
        }}
      >
        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-muted"
          onClick={() => {
            onExport();
            onClose();
          }}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>
    </>
  );
}
