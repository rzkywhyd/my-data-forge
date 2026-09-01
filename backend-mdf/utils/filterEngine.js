/**
 * Build fixed filters berdasarkan user yang sedang login.
 *
 * Fixed filter digunakan sebagai security layer:
 * - Owner       : tidak dibatasi tenant/partner
 * - User biasa  : dibatasi berdasarkan tenant_id
 * - Partner     : dibatasi berdasarkan partner_id jika tersedia
 */
function buildFixedFilters(user) {
  const filters = [];

  if (!user) {
    return filters;
  }

  // =========================
  // OWNER
  // =========================
  // Owner tidak mendapatkan
  // restriction tenant / partner.
  if (user.is_owner === true) {
    return filters;
  }

  // =========================
  // TENANT RESTRICTION
  // =========================
  if (user.tenant_id !== null && user.tenant_id !== undefined) {
    filters.push({
      field: "tenant_id",
      operator: "=",
      value: user.tenant_id,
    });
  }

  // =========================
  // PARTNER RESTRICTION
  // =========================
  if (user.partner_id !== null && user.partner_id !== undefined) {
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
