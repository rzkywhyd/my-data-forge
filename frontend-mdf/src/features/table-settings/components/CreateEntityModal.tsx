import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { entityService } from "@/features/table-settings/services/entityService";
import type { Entity } from "../types/entity.types";

type Props = {
  onSuccess?: (entity: Entity) => void;
  initialData?: Entity | null;
};

export default function CreateEntityModal({
  onSuccess,
  initialData = null,
}: Props) {
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    entity_name: "",
  });

  // 🔥 convert helper
  const generateTableName = (name: string) => {
    return name.trim().toLowerCase().replace(/\s+/g, "_"); // atau "-" kalau kamu mau
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (value && initialData) {
      setForm({
        entity_name: initialData.entity_name,
      });
    }

    if (value && !initialData) {
      setForm({
        entity_name: "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      entity_name: form.entity_name,
      table_name: generateTableName(form.entity_name),
      primary_key: "id", // fixed default
    };

    let result;

    if (initialData?.entity_id) {
      result = await entityService.update(initialData.entity_id, payload);
    } else {
      result = await entityService.create(payload);
    }

    onSuccess?.(result);

    setOpen(false);

    setForm({
      entity_name: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {initialData ? "Edit Entity" : "+ New Entity"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {initialData ? "Edit Entity" : "Create Entity"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Entity Name</Label>
              <Input
                value={form.entity_name}
                onChange={(e) =>
                  setForm({
                    entity_name: e.target.value,
                  })
                }
              />
            </div>

            {/* OPTIONAL: preview hasil generate */}
            <div className="text-xs text-gray-500">
              Table Name: {generateTableName(form.entity_name || "")}
            </div>
          </div>

          <DialogFooter className="mt-5">
            <Button type="submit">{initialData ? "Update" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
