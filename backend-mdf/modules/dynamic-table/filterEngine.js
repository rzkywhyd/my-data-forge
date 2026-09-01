// =========================
// HELPERS
// =========================

function toAllowedSet(allowed) {
  return new Set(Array.isArray(allowed) ? allowed : []);
}

function buildUserFilterMap(filterModel) {
  const map = new Set();

  if (!filterModel) {
    return map;
  }

  for (const key in filterModel) {
    map.add(key);
  }

  return map;
}

// =========================
// SAFE FIELD
// PostgreSQL identifier
// =========================

function safeField(field) {
  const cleaned = String(field).replace(/[^a-zA-Z0-9_]/g, "");

  return `"${cleaned}"`;
}

// =========================
// ADD PARAMETER
// PostgreSQL:
// $1, $2, $3, ...
// =========================

function addParam(params, value) {
  params.push(value);

  return `$${params.length}`;
}

// =========================
// OPERATOR ENGINE
// =========================

function applyOperator(field, filter, where, params) {
  const col = safeField(field);

  if (!filter) {
    return;
  }

  // =========================
  // TEXT FILTER
  // =========================

  if (filter.filterType === "text") {
    const val = filter.filter;

    if (val === undefined || val === null || val === "") {
      return;
    }

    switch (filter.type) {
      case "contains": {
        const placeholder = addParam(params, `%${val}%`);

        where.push(`${col} LIKE ${placeholder}`);
        break;
      }

      case "equals": {
        const placeholder = addParam(params, val);

        where.push(`${col} = ${placeholder}`);
        break;
      }

      case "notEqual": {
        const placeholder = addParam(params, val);

        where.push(`${col} != ${placeholder}`);
        break;
      }

      case "startsWith": {
        const placeholder = addParam(params, `${val}%`);

        where.push(`${col} LIKE ${placeholder}`);
        break;
      }

      case "endsWith": {
        const placeholder = addParam(params, `%${val}`);

        where.push(`${col} LIKE ${placeholder}`);
        break;
      }

      case "blank":
        where.push(`(${col} IS NULL OR ${col} = '')`);
        break;

      case "notBlank":
        where.push(`(${col} IS NOT NULL AND ${col} != '')`);
        break;

      default:
        break;
    }

    return;
  }

  // =========================
  // SET FILTER
  // =========================

  if (filter.filterType === "set") {
    if (!Array.isArray(filter.values) || filter.values.length === 0) {
      return;
    }

    const placeholders = filter.values.map((value) => addParam(params, value));

    where.push(`${col} IN (${placeholders.join(", ")})`);

    return;
  }

  // =========================
  // NUMBER FILTER
  // =========================

  if (filter.filterType === "number") {
    let val = filter.filter;

    if (val === "" || val === null || val === undefined) {
      return;
    }

    val = Number(val);

    if (Number.isNaN(val)) {
      return;
    }

    switch (filter.type) {
      case "equals": {
        const placeholder = addParam(params, val);

        where.push(`${col} = ${placeholder}`);
        break;
      }

      case "notEqual": {
        const placeholder = addParam(params, val);

        where.push(`${col} != ${placeholder}`);
        break;
      }

      case "greaterThan": {
        const placeholder = addParam(params, val);

        where.push(`${col} > ${placeholder}`);
        break;
      }

      case "greaterThanOrEqual": {
        const placeholder = addParam(params, val);

        where.push(`${col} >= ${placeholder}`);
        break;
      }

      case "lessThan": {
        const placeholder = addParam(params, val);

        where.push(`${col} < ${placeholder}`);
        break;
      }

      case "lessThanOrEqual": {
        const placeholder = addParam(params, val);

        where.push(`${col} <= ${placeholder}`);
        break;
      }

      case "inRange": {
        let to = filter.filterTo;

        if (to === "" || to === null || to === undefined) {
          return;
        }

        to = Number(to);

        if (Number.isNaN(to)) {
          return;
        }

        const fromPlaceholder = addParam(params, val);
        const toPlaceholder = addParam(params, to);

        where.push(`${col} BETWEEN ${fromPlaceholder} AND ${toPlaceholder}`);

        break;
      }

      default:
        break;
    }

    return;
  }

  // =========================
  // DATE FILTER
  // =========================

  if (filter.filterType === "date") {
    const val = filter.dateFrom;

    if (!val) {
      return;
    }

    switch (filter.type) {
      case "equals": {
        const placeholder = addParam(params, val);

        where.push(`DATE(${col}) = ${placeholder}`);
        break;
      }

      case "lessThan": {
        const placeholder = addParam(params, val);

        where.push(`DATE(${col}) < ${placeholder}`);
        break;
      }

      case "greaterThan": {
        const placeholder = addParam(params, val);

        where.push(`DATE(${col}) > ${placeholder}`);
        break;
      }

      case "inRange": {
        if (!filter.dateTo) {
          return;
        }

        const fromPlaceholder = addParam(params, filter.dateFrom);
        const toPlaceholder = addParam(params, filter.dateTo);

        where.push(
          `DATE(${col}) BETWEEN ${fromPlaceholder} AND ${toPlaceholder}`,
        );

        break;
      }

      default:
        break;
    }
  }
}

// =========================
// FIXED FILTERS
// =========================

function applyFixedFilters(dbFilters, allowedSet, where, params) {
  for (const filter of dbFilters) {
    if (filter.filter_type !== "fixed") {
      continue;
    }

    if (!allowedSet.has(filter.field_name)) {
      continue;
    }

    const col = safeField(filter.field_name);

    if (filter.operator === "contains") {
      const placeholder = addParam(params, `%${filter.value}%`);

      where.push(`${col} LIKE ${placeholder}`);
    }

    if (filter.operator === "equals") {
      const placeholder = addParam(params, filter.value);

      where.push(`${col} = ${placeholder}`);
    }
  }
}

// =========================
// DEFAULT FILTERS
// =========================

function applyDefaultFilters(
  dbFilters,
  allowedSet,
  userFilterMap,
  where,
  params,
  currentField = null,
) {
  for (const filter of dbFilters) {
    if (filter.filter_type !== "default") {
      continue;
    }

    if (!allowedSet.has(filter.field_name)) {
      continue;
    }

    // Jangan gunakan default filter
    // pada field yang sedang DISTINCT.
    if (currentField && filter.field_name === currentField) {
      continue;
    }

    // User filter mengalahkan default filter.
    if (userFilterMap.has(filter.field_name)) {
      continue;
    }

    const col = safeField(filter.field_name);

    if (filter.operator === "contains") {
      const placeholder = addParam(params, `%${filter.value}%`);

      where.push(`${col} LIKE ${placeholder}`);
    }

    if (filter.operator === "equals") {
      const placeholder = addParam(params, filter.value);

      where.push(`${col} = ${placeholder}`);
    }
  }
}

// =========================
// USER FILTERS
// =========================

function applyUserFilters(
  filterModel,
  allowedSet,
  where,
  params,
  currentField = null,
) {
  if (!filterModel) {
    return;
  }

  for (const key in filterModel) {
    if (!allowedSet.has(key)) {
      continue;
    }

    // Jangan gunakan filter field
    // yang sedang DISTINCT.
    if (currentField && key === currentField) {
      continue;
    }

    applyOperator(key, filterModel[key], where, params);
  }
}

// =========================
// MAIN FILTER ENGINE
// =========================

function applyFilters({
  dbFilters = [],
  allowed = [],
  filterModel = {},
  where = [],
  params = [],
}) {
  const allowedSet = toAllowedSet(allowed);

  const userFilterMap = buildUserFilterMap(filterModel);

  // Reset = tidak ada filter dari user.
  const isReset = !filterModel || Object.keys(filterModel).length === 0;

  // =========================
  // 1. FIXED FILTERS
  // ALWAYS ON
  // =========================

  applyFixedFilters(dbFilters, allowedSet, where, params);

  // =========================
  // 2. DEFAULT FILTERS
  // =========================

  if (!isReset) {
    applyDefaultFilters(dbFilters, allowedSet, userFilterMap, where, params);
  }

  // =========================
  // 3. USER FILTERS
  // =========================

  applyUserFilters(filterModel, allowedSet, where, params);

  return {
    where,
    params,
  };
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
  toAllowedSet,
  buildUserFilterMap,
  safeField,
};
