/**
 * Build PostgreSQL WHERE query
 *
 * fixedFilters : filter security/system
 * roleFilters  : filter berdasarkan role
 * uiFilters    : filter dari frontend / AG Grid
 *
 * Return:
 * {
 *   where: 'WHERE 1=1 AND "tenant_id" = $1 ...',
 *   params: [...]
 * }
 */

function safeField(field) {
  if (typeof field !== "string") {
    return null;
  }

  const cleaned = field.replace(/[^a-zA-Z0-9_]/g, "");

  return cleaned ? `"${cleaned}"` : null;
}

function safeOperator(operator) {
  const allowedOperators = new Set([
    "=",
    "!=",
    "<>",
    ">",
    ">=",
    "<",
    "<=",
    "LIKE",
    "NOT LIKE",
    "IN",
  ]);

  if (typeof operator !== "string") {
    return null;
  }

  const normalized = operator.toUpperCase();

  return allowedOperators.has(normalized) ? normalized : null;
}

function buildWhereQuery({
  fixedFilters = [],
  roleFilters = [],
  uiFilters = [],
}) {
  const conditions = [];
  const params = [];

  const allFilters = [...fixedFilters, ...roleFilters, ...uiFilters];

  for (const filter of allFilters) {
    if (!filter) {
      continue;
    }

    const field = safeField(filter.field);
    const operator = safeOperator(filter.operator);

    if (!field || !operator) {
      continue;
    }

    // =========================
    // LIKE
    // =========================
    if (operator === "LIKE" || operator === "NOT LIKE") {
      if (
        filter.value === null ||
        filter.value === undefined ||
        filter.value === ""
      ) {
        continue;
      }

      params.push(`%${filter.value}%`);

      conditions.push(`${field} ${operator} $${params.length}`);

      continue;
    }

    // =========================
    // IN
    // =========================
    if (operator === "IN") {
      if (!Array.isArray(filter.value) || filter.value.length === 0) {
        continue;
      }

      const placeholders = filter.value.map((value) => {
        params.push(value);
        return `$${params.length}`;
      });

      conditions.push(`${field} IN (${placeholders.join(", ")})`);

      continue;
    }

    // =========================
    // STANDARD OPERATOR
    // =========================
    if (filter.value === null || filter.value === undefined) {
      continue;
    }

    params.push(filter.value);

    conditions.push(`${field} ${operator} $${params.length}`);
  }

  // =========================
  // BUILD WHERE
  // =========================
  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return {
    where,
    params,
  };
}

module.exports = {
  buildWhereQuery,
  safeField,
  safeOperator,
};
