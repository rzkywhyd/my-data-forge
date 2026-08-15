function buildFixedFilters(user) {
  const filters = [];

  // 🔥 OWNER = tidak ada restriction
  if (user.is_owner) {
    return filters;
  }

  // 🔥 tenant restriction
  if (user.tenant_id) {
    filters.push({
      field: "tenant_id",
      operator: "=",
      value: user.tenant_id,
    });
  }

  // 🔥 optional: partner restriction
  if (user.partner_id) {
    filters.push({
      field: "partner_id",
      operator: "=",
      value: user.partner_id,
    });
  }

  return filters;
}

module.exports = {
  buildFixedFilters,
};