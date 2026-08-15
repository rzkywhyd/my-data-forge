import api from "@/lib/api";

export type ColumnConfig = {
  field_name: string;
  display_name: string;

  default_visible: boolean;
  default_order: number;

  is_visible?: boolean;
  display_order?: number;
};


export type VisibilityPerUserResponse = {
  columns: ColumnConfig[];
};


export const visibilityPerUserService = {

  getColumns: async (
    entityId: string,
  ): Promise<VisibilityPerUserResponse> => {

    const res = await api.post(
      "/visibilityPerUser",
      {
        entityId,
      },
    );

    return res.data;
  },


  saveColumns: async (
    entityId: string,
    columns: ColumnConfig[],
  ) => {

    const res = await api.post(
      "/visibilityPerUser/save",
      {
        entityId,
        columns,
      },
    );

    return res.data;
  },

};