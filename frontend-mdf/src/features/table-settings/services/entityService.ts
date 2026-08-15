import api from "@/lib/api";
import type { Entity } from "../types/entity.types";

type CreateEntityDTO = Omit<Entity, "entity_id" | "created_at" | "updated_at">;

export const entityService = {
  list: async (): Promise<Entity[]> => {
    const res = await api.get("/entities");
    return res.data.data;
  },

  create: async (data: CreateEntityDTO): Promise<Entity> => {
    const res = await api.post("/entities", data);
    return res.data.data;
  },

  update: async (id: number, data: CreateEntityDTO): Promise<Entity> => {
    const res = await api.put(`/entities/${id}`, data);
    return res.data.data;
  },

  // 🔥 TAMBAH INI
  getFields: async (entityId: number) => {
    const res = await api.get(`/entities/${entityId}/fields`);
    return res.data.data;
  },
};