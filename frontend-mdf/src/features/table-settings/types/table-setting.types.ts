export type FilterValue = string | number | boolean | null;

/**
 * =========================
 * COLUMN (UI STATE)
 * =========================
 */
export type ColumnConfig = {
  field_id: number;

  // ⚠️ PROBLEM: kamu pakai "key" tapi backend pakai "field_name"
  // 👉 RECOMMEND: ganti ke field_name biar konsisten
  key: string;

  label: string;

  visible: boolean;
  order: number;

  sort_enabled: boolean;
  sort_type: "asc" | "desc" | null;

  freeze_enabled: boolean;
  freeze_type: "left" | "right" | null;
};

/**
 * =========================
 * FILTER (UI STATE)
 * =========================
 */
export type FilterOperator =
  | "equals"
  | "not equals"
  | "contains"
  | "greater than"
  | "less than";

export type FilterRule = {
  // ⚠️ ISSUE:
  // UI pakai "key"
  // backend pakai "field_name"
  //
  // 👉 ini sumber bug sync kamu sebelumnya
  key: string;

  operator: FilterOperator;
  value: FilterValue;
};

/**
 * =========================
 * TABLE SETTINGS (UI STATE)
 * =========================
 */
export type TableSetting = {
  entityId: string;
  menu_name: string;

  theme: "default" | "blue" | "green" | "dark" | "purple";

  pagination: {
    pageSize: number;
    pageSizeOptions: number[];
  };

  filters: {
    default: FilterRule[];
    fixed: FilterRule[];
  };

  columns: ColumnConfig[];

  actions: string[];
};

/**
 * =========================
 * ENTITY FIELD (DB SOURCE)
 * =========================
 */
export type EntityField = {
  field_id: number;
  field_name: string;
  field_label: string;
  is_visible_default: number;
  display_order: number;
};

/**
 * =========================
 * TABLE COLUMN (DB RESPONSE)
 * =========================
 */
export type TableColumn = {
  field_id: number;
  label: string;
  is_visible: number;
  display_order: number;

  sort_enabled: boolean;
  sort_type: "asc" | "desc" | null;

  freeze_enabled: boolean;
  freeze_type: "left" | "right" | null;
};

/**
 * =========================
 * SAVE PAYLOAD (API CONTRACT)
 * =========================
 */
export type SaveTableSettingPayload = {
  entity_id: number;

  menu_name: string;
  theme: TableSetting["theme"];
  page_size: number;

  columns: {
    field_id: number;

    // ⚠️ ISSUE:
    // backend pakai field_name, tapi di sini belum ada
    // 👉 kalau tetap pakai "key" di UI, harus mapping di FE
    visible: boolean;
    display_order: number;

    sort_enabled: boolean;
    sort_type: "asc" | "desc" | null;

    freeze_enabled: boolean;
    freeze_type: "left" | "right" | null;
  }[];

  filters: {
    filter_type: "default" | "fixed";

    // ⚠️ INI SUDAH BENAR SECARA API
    field_name: string;

    operator: string;
    value: FilterValue;
  }[];
};