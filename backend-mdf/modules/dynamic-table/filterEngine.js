// =========================
// HELPERS
// =========================

function toAllowedSet(allowed) {
  return new Set(Array.isArray(allowed) ? allowed : []);
}

function buildUserFilterMap(filterModel) {
  const map = new Set();
  if (!filterModel) return map;

  for (const key in filterModel) {
    map.add(key);
  }

  return map;
}

// =========================
// SAFE FIELD (SQL INJECTION SAFE)
// =========================
function safeField(field) {
  return `\`${String(field).replace(/[^a-zA-Z0-9_]/g, "")}\``;
}

// =========================
// OPERATOR ENGINE (FULL)
// =========================
function applyOperator(field, f, where, params) {
  const col = safeField(field);

  // =========================
  // TEXT FILTER
  // =========================
  if (f.filterType === "text") {
    const val = f.filter;

    if (val === undefined || val === null || val === "") return;

    switch (f.type) {
      case "contains":
        where.push(`${col} LIKE ?`);
        params.push(`%${val}%`);
        break;

      case "equals":
        where.push(`${col} = ?`);
        params.push(val);
        break;

      case "notEqual":
        where.push(`${col} != ?`);
        params.push(val);
        break;

      case "startsWith":
        where.push(`${col} LIKE ?`);
        params.push(`${val}%`);
        break;

      case "endsWith":
        where.push(`${col} LIKE ?`);
        params.push(`%${val}`);
        break;

      case "blank":
        where.push(`(${col} IS NULL OR ${col} = '')`);
        break;

      case "notBlank":
        where.push(`(${col} IS NOT NULL AND ${col} != '')`);
        break;
    }
  }

  // =========================
  // SET FILTER
  // =========================
  if (f.filterType === "set") {
    if (Array.isArray(f.values) && f.values.length) {
      const placeholders = f.values.map(() => "?").join(",");
      where.push(`${col} IN (${placeholders})`);
      params.push(...f.values);
    }
  }

  // =========================
  // NUMBER FILTER (FULL SAFE)
  // =========================
  if (f.filterType === "number") {
    let val = f.filter;

    if (val === "" || val === null || val === undefined) return;

    val = Number(val);
    if (isNaN(val)) return;

    switch (f.type) {
      case "equals":
        where.push(`${col} = ?`);
        params.push(val);
        break;

      case "notEqual":
        where.push(`${col} != ?`);
        params.push(val);
        break;

      case "greaterThan":
        where.push(`${col} > ?`);
        params.push(val);
        break;

      case "greaterThanOrEqual":
        where.push(`${col} >= ?`);
        params.push(val);
        break;

      case "lessThan":
        where.push(`${col} < ?`);
        params.push(val);
        break;

      case "lessThanOrEqual":
        where.push(`${col} <= ?`);
        params.push(val);
        break;

      case "inRange": {
        let to = f.filterTo;

        if (to === "" || to === null || to === undefined) return;

        to = Number(to);
        if (isNaN(to)) return;

        where.push(`${col} BETWEEN ? AND ?`);
        params.push(val, to);
        break;
      }
    }
  }

  // =========================
  // DATE FILTER
  // =========================
  if (f.filterType === "date") {
    const val = f.dateFrom;

    if (!val) return;

    switch (f.type) {
      case "equals":
        where.push(`DATE(${col}) = ?`);
        params.push(val);
        break;

      case "lessThan":
        where.push(`DATE(${col}) < ?`);
        params.push(val);
        break;

      case "greaterThan":
        where.push(`DATE(${col}) > ?`);
        params.push(val);
        break;

      case "inRange":
        if (!f.dateTo) return;
        where.push(`DATE(${col}) BETWEEN ? AND ?`);
        params.push(f.dateFrom, f.dateTo);
        break;
    }
  }
}

// =========================
// FIXED FILTERS (SYSTEM)
// =========================
function applyFixedFilters(dbFilters, allowedSet, where, params) {
  for (const f of dbFilters) {
    if (f.filter_type !== "fixed") continue;
    if (!allowedSet.has(f.field_name)) continue;

    const col = safeField(f.field_name);

    if (f.operator === "contains") {
      where.push(`${col} LIKE ?`);
      params.push(`%${f.value}%`);
    }

    if (f.operator === "equals") {
      where.push(`${col} = ?`);
      params.push(f.value);
    }
  }
}

// =========================
// DEFAULT FILTERS (RESET SAFE)
// =========================
function applyDefaultFilters(dbFilters, allowedSet, userFilterMap, where, params) {
  for (const f of dbFilters) {
    if (f.filter_type !== "default") continue;
    if (!allowedSet.has(f.field_name)) continue;
    if (userFilterMap.has(f.field_name)) continue;

    const col = safeField(f.field_name);

    if (f.operator === "contains") {
      where.push(`${col} LIKE ?`);
      params.push(`%${f.value}%`);
    }

    if (f.operator === "equals") {
      where.push(`${col} = ?`);
      params.push(f.value);
    }
  }
}

// =========================
// USER FILTERS (AG GRID)
// =========================
function applyUserFilters(filterModel, allowedSet, where, params) {
  if (!filterModel) return;

  for (const key in filterModel) {
    if (!allowedSet.has(key)) continue;

    applyOperator(key, filterModel[key], where, params);
  }
}

// =========================
// MAIN ENGINE
// =========================
function applyFilters({
  dbFilters = [],
  allowed = [],
  filterModel = {},
  where = [],
  params = []
}) {
  const allowedSet = toAllowedSet(allowed);
  const userFilterMap = buildUserFilterMap(filterModel);

  // =========================
  // RESET DETECTION (IMPORTANT FIX)
  // =========================
  const isReset =
    !filterModel ||
    Object.keys(filterModel).length === 0;

  // =========================
  // 1. FIXED FILTERS (ALWAYS ON)
  // =========================
  applyFixedFilters(dbFilters, allowedSet, where, params);

  // =========================
  // 2. DEFAULT FILTERS (ONLY IF NOT RESET)
  // =========================
  if (!isReset) {
    applyDefaultFilters(dbFilters, allowedSet, userFilterMap, where, params);
  }

  // =========================
  // 3. USER FILTERS (AG GRID)
  // =========================
  applyUserFilters(filterModel, allowedSet, where, params);

  return { where, params };
}

// =========================
// EXPORT
// =========================
module.exports = {
  applyFilters,
  applyFixedFilters,
  applyDefaultFilters,
  applyUserFilters,
  applyOperator,
  toAllowedSet
};