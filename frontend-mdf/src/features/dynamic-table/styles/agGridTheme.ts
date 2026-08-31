import { themeQuartz } from "ag-grid-community";

export const customQuartzTheme = themeQuartz.withParams({
  // GLOBAL
  backgroundColor: "#ffffff",
  foregroundColor: "#334155",
  accentColor: "#2563eb",

  // FONT
  fontSize: 12,
  headerFontSize: 13,
  fontFamily: "Inter, sans-serif",

  // HEADER
  headerBackgroundColor: "#bdd3e94f",
  // headerTextColor: "#ffffff",
  headerFontWeight: 600,

  // ROW
  rowHoverColor: "#eff6ff",
  selectedRowBackgroundColor: "#dbeafe",

  // SIZE
  rowHeight: 28,
  headerHeight: 32,

  // BORDER
  borderColor: "#e2e8f0",

  // SPACING
  spacing: 4,

  // INPUT
  inputBorder: true,
  //   inputBorderColor: "#cbd5e1",

  // CHECKBOX
  checkboxBorderRadius: 4,

  // BUTTON
  buttonBorderRadius: 6,
});
