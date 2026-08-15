import api from "@/lib/api";
import type { SaveTableSettingPayload } from "../types/table-setting.types";

export const tableSettingService = {
  async getFilters(entityId: number) {
    const res = await api.get(`/table-setting/${entityId}/filters`);
    return res.data;
  },

 async getColumns(entityId: number) {
  const res = await api.get(`/table-setting/${entityId}/columns`);
  return res.data.data; // ✅ BENAR
    },

  async getGenerals(entityId: number) {
    const res = await api.get(`/table-setting/${entityId}/generals`);
    return res.data;
  },

   async saveConfig(data: SaveTableSettingPayload) {
    const res = await api.post("/table-setting/save", data);
    return res.data;
  },


};