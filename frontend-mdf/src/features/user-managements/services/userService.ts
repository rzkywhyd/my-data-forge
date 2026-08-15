import api from "@/lib/api";

export type FilterValue = string | number | boolean | null;

export type FilterRule = {
  key: string;
  operator: "equals" | "not equals" | "contains" | "greater than" | "less than";
  value: FilterValue;
};

export type FilterPayload = {
  default: FilterRule[];
  fixed: FilterRule[];
};

export const userService = {
  async list(entityId: number, filters: FilterPayload) {
    const res = await api.post(`/table-setting/${entityId}/data`, {
      filters,
    });

    return res.data.data;
  },
};