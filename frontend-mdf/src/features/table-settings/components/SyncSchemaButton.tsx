import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import api from "@/lib/api";

export function SyncSchemaButton({ entityId }: { entityId?: number }) {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    if (!entityId) {
      toast.error("Please select an entity first");
      return;
    }

    try {
      setLoading(true);

      await api.post(`table-setting/sync-schema`, { entityId });

      toast.success("Schema successfully synced!");
    } catch (err) {
      toast.error("Failed sync schema" + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleSync}
      disabled={!entityId || loading}
    >
      {loading ? "Syncing..." : "Sync Schema"}
    </Button>
  );
}
