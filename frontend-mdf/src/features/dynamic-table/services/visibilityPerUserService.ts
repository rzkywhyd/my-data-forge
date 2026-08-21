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
  entityId: number,
      ): Promise<VisibilityPerUserResponse> => {
  const res = await api.get(
    `/personal/${entityId}/column_visibility_by_user`,
  );
 
  return res.data ;
},


  saveColumns: async (
    entityId: number,
    columns: ColumnConfig[],
  ) => {

    const res = await api.post(
      `personal/${entityId}/save_column_visibility_by_user`,
      {
        entityId,
        columns,
      },
    );

    return res.data;
  },

};