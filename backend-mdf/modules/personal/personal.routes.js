const express = require("express");
const router = express.Router();
const db = require("../../config/db");
const auth = require("../../middleware/auth");

const {
  applyFixedFilters,
  applyDefaultFilters,
  applyUserFilters,
} = require("../dynamic-table/filterEngine");

// =========================
// GET DB FILTERS
// =========================
async function getDbFilters(entityId) {
  const [rows] = await db.query(
    `SELECT field_name, operator, value, filter_type
     FROM mdf_entity_filters
     WHERE entity_id = ?`,
    [entityId],
  );

  return rows || [];
}

// =========================
// GET ALLOWED FIELDS
// =========================
async function getAllowedFields(entityId) {
  const [rows] = await db.query(
    `SELECT f.field_name
     FROM mdf_entity_table_columns c
     JOIN mdf_entity_fields f ON f.field_id = c.field_id
     WHERE c.entity_id = ?`,
    [entityId],
  );

  return new Set((rows || []).map((r) => r.field_name));
}

// =========================
// MAIN DATA API
// =========================
router.post("/", auth, async (req, res) => {
  console.log("PERSONAL API CALLED", req.body);

  const {
    entityId,
    startRow = 0,
    endRow = 100,
    sortModel = [],
    filterModel = {},
  } = req.body;

  try {
    // =========================
    // TABLE NAME
    // =========================
    const [entity] = await db.query(
      `SELECT table_name FROM mdf_entities WHERE entity_id = ?`,
      [entityId],
    );

    if (!entity.length) {
      return res.status(404).json({ message: "Entity not found" });
    }

    const tableName = entity[0].table_name;

    // =========================
    // COLUMNS
    // =========================
    const [columns] = await db.query(
      `
      SELECT 
        c.*,
        f.field_name,
        f.field_label,
        f.is_sortable,
        f.is_filterable
      FROM mdf_entity_table_columns c
      JOIN mdf_entity_fields f ON f.field_id = c.field_id
      WHERE c.entity_id = ?
      ORDER BY c.display_order ASC
      `,
      [entityId],
    );

    const safeColumns = Array.isArray(columns) ? columns : [];

    const allowed = new Set(safeColumns.map((c) => c.field_name));

    const columnList = safeColumns.length
      ? safeColumns.map((c) => `\`${c.field_name}\``).join(",")
      : "*";

    // =========================
    // FILTER CONFIG
    // =========================
    const dbFilters = await getDbFilters(entityId);

    const where = [];
    const params = [];

    const userFilterMap = new Set(Object.keys(filterModel || {}));

    applyFixedFilters(dbFilters, allowed, where, params);
    applyDefaultFilters(dbFilters, allowed, userFilterMap, where, params);
    applyUserFilters(filterModel, allowed, where, params);

    const whereSQL = where.length ? "WHERE " + where.join(" AND ") : "";

    console.log("WHERE CLAUSE:", whereSQL, params);

    // =========================
    // SORT
    // =========================
    let orderSQL = "";

    if (Array.isArray(sortModel) && sortModel.length) {
      const sort = sortModel
        .filter((s) => allowed.has(s.colId))
        .map((s) => `\`${s.colId}\` ${s.sort === "asc" ? "ASC" : "DESC"}`);

      if (sort.length) {
        orderSQL = "ORDER BY " + sort.join(",");
      }
    }

    // =========================
    // PAGING
    // =========================
    const limit = Math.max(1, endRow - startRow);

    // =========================
    // DATA QUERY
    // =========================
    const [rows] = await db.query(
      `
      SELECT ${columnList}
      FROM \`${tableName}\`
      ${whereSQL}
      ${orderSQL}
      LIMIT ?, ?
      `,
      [...params, startRow, limit],
    );

    // =========================
    // COUNT QUERY
    // =========================
    const [count] = await db.query(
      `
      SELECT COUNT(*) as total
      FROM \`${tableName}\`
      ${whereSQL}
      `,
      params,
    );

    // =========================
    // RESPONSE
    // =========================
    res.json({
      columns: safeColumns,
      rows,
      total: count?.[0]?.total || 0,
      defaultFilters: dbFilters.filter((f) => f.filter_type === "default"),
    });
  } catch (err) {
    console.error("PERSONAL API ERROR:", err);
    res.status(500).json({ message: "Query error" });
  } finally {
    conn.release();
  }
});

// =========================
// DISTINCT API
// =========================
// router.post("/distinct", auth, async (req, res) => {
//   try {
//     const {
//       entityId,
//       field,
//       currentField,
//       filterModel,
//       search = {},
//     } = req.body;

//     if (!field || typeof field !== "string") {
//       return res.status(400).json({
//         error: "Invalid field",
//       });
//     }

//     // =========================
//     // SAFE FIELD
//     // =========================
//     const safeField = field.replace(/[^a-zA-Z0-9_]/g, "");

//     // =========================
//     // TABLE
//     // =========================
//     const [entity] = await db.query(
//       `
//       SELECT table_name
//       FROM mdf_entities
//       WHERE entity_id = ?
//       `,
//       [entityId],
//     );

//     const tableName = entity?.[0]?.table_name;

//     if (!tableName) {
//       return res.status(404).json({
//         error: "Entity not found",
//       });
//     }

//     // =========================
//     // FILTER CONFIG
//     // =========================
//     // Fixed Filter by Entity
//     const dbFilters = await getDbFilters(entityId);
//     // Column From entity
//     const allowed = await getAllowedFields(entityId);
//     allowed;

//     const where = [];
//     const params = [];

//     const userFilterMap = new Set(Object.keys(filterModel || {}));

//     // =========================
//     // FIXED FILTERS
//     // =========================
//     applyFixedFilters(dbFilters, allowed, where, params);

//     // =========================
//     // DEFAULT FILTERS
//     // IMPORTANT:
//     // current field default filter
//     // should NOT restrict distinct list
//     // =========================
//     const filteredDefaultFilters = dbFilters.filter((f) => {
//       if (f.filter_type === "default" && f.field_name === currentField) {
//         return false;
//       }

//       return true;
//     });

//     applyDefaultFilters(
//       filteredDefaultFilters,
//       allowed,
//       userFilterMap,
//       where,
//       params,
//     );

//     // =========================
//     // USER FILTERS
//     // IMPORTANT:
//     // current field already removed
//     // from FE
//     // =========================
//     applyUserFilters(filterModel, allowed, where, params);

//     // =========================
//     // WHERE SQL
//     // =========================
//     const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

//     // =========================
//     // DISTINCT QUERY
//     // =========================
//     const sql = `
//       SELECT DISTINCT \`${safeField}\`
//       FROM \`${tableName}\`
//       ${whereSQL}
//       ORDER BY \`${safeField}\` ASC
//       LIMIT 100
//     `;

//     console.log("DISTINCT SQL:", sql);

//     const [rows] = await db.query(sql, params);

//     // =========================
//     // RESPONSE
//     // =========================
//     res.json(
//       rows
//         .map((r) => r[safeField])
//         .filter((v) => v !== null && v !== undefined),
//     );
//   } catch (err) {
//     console.error("DISTINCT ERROR:", err);

//     res.status(500).json({
//       error: "Internal Server Error",
//     });
//   }
// });

router.post("/distinct", auth, async (req, res) => {
  try {
    const {
      entityId,
      field,
      currentField,
      filterModel = {},
      search = "",
      clearedFilters = [],
    } = req.body;

    // =========================
    // VALIDATE FIELD
    // =========================

    if (!field || typeof field !== "string") {
      return res.status(400).json({
        error: "Invalid field",
      });
    }

    // =========================
    // SAFE FIELD
    // =========================

    const safeField = field.replace(/[^a-zA-Z0-9_]/g, "");

    if (!safeField) {
      return res.status(400).json({
        error: "Invalid field",
      });
    }

    // =========================
    // TABLE
    // =========================

    const [entity] = await db.query(
      `
      SELECT table_name
      FROM mdf_entities
      WHERE entity_id = ?
      `,
      [entityId],
    );

    const tableName = entity?.[0]?.table_name;

    if (!tableName) {
      return res.status(404).json({
        error: "Entity not found",
      });
    }

    // =========================
    // FILTER CONFIG
    // =========================

    // Filter yang disimpan di DB
    const dbFilters = await getDbFilters(entityId);

    // Field yang memang boleh digunakan
    const allowed = await getAllowedFields(entityId);

    // =========================
    // WHERE BUILDER
    // =========================

    const where = [];
    const params = [];

    // Field yang sedang mempunyai user filter
    const userFilterMap = new Set(Object.keys(filterModel || {}));

    // =========================
    // 1. FIXED FILTER
    // =========================
    // Fixed filter SELALU diterapkan
    // dan tidak bisa diubah user.

    applyFixedFilters(dbFilters, allowed, where, params);

    // =========================
    // 2. DEFAULT FILTER
    // =========================
    //
    // Default filter diterapkan,
    // tetapi default filter untuk
    // currentField TIDAK boleh
    // membatasi distinct list.
    //
    // Contoh:
    //
    // Default:
    // status = Active
    //
    // User sedang membuka filter:
    // status
    //
    // Maka status = Active
    // tidak digunakan untuk mencari
    // distinct status.
    // =========================

    const filteredDefaultFilters = dbFilters.filter((filter) => {
      if (
        filter.filter_type === "default" &&
        filter.field_name === currentField
      ) {
        return false;
      }

      return true;
    });

    applyDefaultFilters(
      filteredDefaultFilters,
      allowed,
      userFilterMap,
      where,
      params,
    );

    // =========================
    // 3. USER FILTER
    // =========================
    //
    // filterModel dari AG Grid.
    //
    // current field sudah dihapus
    // oleh FE sebelum request.
    // =========================

    applyUserFilters(filterModel, allowed, where, params);

    // =========================
    // 4. SEARCH DISTINCT
    // =========================
    //
    // Search hanya digunakan
    // untuk mempersempit daftar
    // distinct value.
    //
    // Contoh:
    //
    // search = "957436"
    //
    // menjadi:
    //
    // field LIKE '%957436%'
    // =========================

    if (typeof search === "string" && search.trim()) {
      where.push(`\`${safeField}\` LIKE ?`);

      params.push(`%${search.trim()}%`);
    }

    // =========================
    // WHERE SQL
    // =========================

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // =========================
    // DISTINCT QUERY
    // =========================

    const sql = `
      SELECT DISTINCT
        \`${safeField}\`
      FROM \`${tableName}\`
      ${whereSQL}
      ORDER BY \`${safeField}\` ASC
      LIMIT 100
    `;

    // =========================
    // DEBUG
    // =========================

    console.log("DISTINCT REQUEST:", {
      entityId,
      field,
      currentField,
      filterModel,
      search,
      clearedFilters,
    });

    console.log("DISTINCT SQL:", sql);

    console.log("DISTINCT PARAMS:", params);

    // =========================
    // EXECUTE
    // =========================

    const [rows] = await db.query(sql, params);

    // =========================
    // RESPONSE
    // =========================

    const values = rows
      .map((row) => row[safeField])
      .filter((value) => value !== null && value !== undefined);

    return res.json(values);
  } catch (err) {
    console.error("DISTINCT ERROR:", err);

    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.get("/:entityId/column_visibility_by_user", auth, async (req, res) => {
  console.log("PERSONAL API CALLED", req.params.entityId);
  try {
    const userId = req.params.entityId;

    const [rows] = await db.query(
      `
      SELECT DISTINCT
          mdf_menus.id AS menu_id,
          mdf_menus.name AS menu_name,
          mdf_menus.path AS href,
          mdf_menus.parent_id AS parent_id,
          mdf_menus.is_system_mode AS is_system_mode,
          mdf_permissions.action AS permissions
      FROM
          mdf_role_permissions
      JOIN
          mdf_menus
          ON mdf_role_permissions.menu_id = mdf_menus.id
      JOIN
          mdf_permissions
          ON mdf_role_permissions.permission_id = mdf_permissions.id
      JOIN
          mdf_user_roles
          ON mdf_role_permissions.role_id = mdf_user_roles.role_id
      WHERE
          mdf_user_roles.user_id = ?
      `,
      [userId],
    );

    const map = new Map();

    for (const row of rows) {
      if (!map.has(row.menu_id)) {
        map.set(row.menu_id, {
          menu_id: row.menu_id,
          menu_name: row.menu_name,
          href: row.href,
          parent_id: row.parent_id,
          is_system_mode: row.is_system_mode,
          permissions: [],
        });
      }

      const menu = map.get(row.menu_id);

      if (row.permissions && !menu.permissions.includes(row.permissions)) {
        menu.permissions.push(row.permissions);
      }
    }

    const result = [...map.values()];

    if (result.length === 0) {
      return res.status(403).json({ message: "No access" });
    }

    res.json({
      message: "Success",
      data: result,
    });
  } catch (err) {
    console.error("MENU ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
