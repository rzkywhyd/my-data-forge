function buildWhereQuery({ fixedFilters, roleFilters, uiFilters }) {
  let where = "WHERE 1=1";
  let params = [];

  const allFilters = [...fixedFilters, ...roleFilters, ...uiFilters];

  for (const f of allFilters) {
    if (!f.field || !f.operator) continue;

    // handle LIKE special case
    if (f.operator === "LIKE") {
      where += ` AND ${f.field} LIKE ?`;
      params.push(`%${f.value}%`);
      continue;
    }

    where += ` AND ${f.field} ${f.operator} ?`;
    params.push(f.value);
  }

  return { where, params };
}

module.exports = { buildWhereQuery };
