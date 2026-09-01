const express = require("express");

const router = express.Router();

const db = require("../../config/db");
const auth = require("../../middleware/auth");

const {
  applyFixedFilters,
  applyDefaultFilters,
  applyUserFilters,
  safeField,
} = require("../dynamic-table/filterEngine");

// ============================================================
// HELPERS
// ============================================================

/**
 * Validasi identifier database.
 *
 * Hanya mengizinkan:
 * - huruf
 * - angka
 * - underscore
 *
 * Tidak boleh menerima nama tabel/kolom mentah
 * dari request tanpa validasi.
 */
function sanitizeIdentifier(value) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.replace(/[^a-zA-Z0-9_]/g, "");

  return cleaned || null;
}

/**
 * Quote PostgreSQL identifier.
 */
function quoteIdentifier(value) {
  const safe = sanitizeIdentifier(value);

  if (!safe) {
    return null;
  }

  return `"${safe}"`;
}

// ============================================================
// GET DB FILTERS
// ============================================================

async function getDbFilters(entityId) {
  const result = await db.query(
    `
      SELECT
        field_name,
        operator,
        value,
        filter_type
      FROM mdf_entity_filters
      WHERE entity_id = $1
        AND is_active = true
    `,
    [entityId],
  );

  return result.rows;
}

// ============================================================
// GET ALLOWED FIELDS
// ============================================================

async function getAllowedFields(entityId) {
  const result = await db.query(
    `
      SELECT
        f.field_name
      FROM mdf_entity_table_columns c

      INNER JOIN mdf_entity_fields f
        ON f.field_id = c.field_id

      WHERE c.entity_id = $1
    `,
    [entityId],
  );

  return new Set(result.rows.map((row) => row.field_name));
}

// ============================================================
// GET ENTITY TABLE
// ============================================================

async function getEntityTable(entityId) {
  const result = await db.query(
    `
      SELECT table_name
      FROM mdf_entities
      WHERE entity_id = $1
      LIMIT 1
    `,
    [entityId],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return sanitizeIdentifier(result.rows[0].table_name);
}

// ============================================================
// MAIN DATA API
// ============================================================

/**
 * POST /api/personal
 *
 * Data API untuk Dynamic Table.
 */
router.post("/", auth, async (req, res) => {
  try {
    const {
      entityId,
      startRow = 0,
      endRow = 100,
      sortModel = [],
      filterModel = {},
    } = req.body;

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!entityId) {
      return res.status(400).json({
        message: "entityId wajib diisi",
      });
    }

    const parsedStartRow = Number(startRow);
    const parsedEndRow = Number(endRow);

    const safeStartRow =
      Number.isFinite(parsedStartRow) && parsedStartRow >= 0
        ? Math.floor(parsedStartRow)
        : 0;

    const safeEndRow =
      Number.isFinite(parsedEndRow) && parsedEndRow > safeStartRow
        ? Math.floor(parsedEndRow)
        : safeStartRow + 100;

    const limit = Math.min(safeEndRow - safeStartRow, 500);

    // ========================================================
    // TABLE
    // ========================================================

    const tableName = await getEntityTable(entityId);

    if (!tableName) {
      return res.status(404).json({
        message: "Entity not found",
      });
    }

    const quotedTableName = quoteIdentifier(tableName);

    if (!quotedTableName) {
      return res.status(400).json({
        message: "Invalid table name",
      });
    }

    // ========================================================
    // COLUMNS
    // ========================================================

    const columnsResult = await db.query(
      `
        SELECT
          c.*,
          f.field_name,
          f.field_label,
          f.is_sortable,
          f.is_filterable
        FROM mdf_entity_table_columns c

        INNER JOIN mdf_entity_fields f
          ON f.field_id = c.field_id

        WHERE c.entity_id = $1

        ORDER BY c.display_order ASC
      `,
      [entityId],
    );

    const safeColumns = columnsResult.rows;

    if (safeColumns.length === 0) {
      return res.status(200).json({
        columns: [],
        rows: [],
        total: 0,
        defaultFilters: [],
      });
    }

    // Hanya field yang memang terdaftar
    // pada entity.
    const allowed = new Set(safeColumns.map((column) => column.field_name));

    // ========================================================
    // SELECT COLUMNS
    // ========================================================

    const columnList = safeColumns
      .map((column) => {
        return quoteIdentifier(column.field_name);
      })
      .filter(Boolean)
      .join(", ");

    // ========================================================
    // FILTER CONFIG
    // ========================================================

    const dbFilters = await getDbFilters(entityId);

    const where = [];
    const params = [];

    const userFilterMap = new Set(Object.keys(filterModel || {}));

    // ========================================================
    // FIXED FILTER
    // ========================================================

    applyFixedFilters(dbFilters, allowed, where, params);

    // ========================================================
    // DEFAULT FILTER
    // ========================================================

    applyDefaultFilters(dbFilters, allowed, userFilterMap, where, params);

    // ========================================================
    // USER FILTER
    // ========================================================

    applyUserFilters(filterModel, allowed, where, params);

    // ========================================================
    // WHERE
    // ========================================================

    const whereSQL = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    // ========================================================
    // SORT
    // ========================================================

    let orderSQL = "";

    if (Array.isArray(sortModel) && sortModel.length > 0) {
      const sortParts = sortModel
        .filter(
          (sort) =>
            sort && typeof sort.colId === "string" && allowed.has(sort.colId),
        )
        .map((sort) => {
          const column = quoteIdentifier(sort.colId);

          const direction = sort.sort === "asc" ? "ASC" : "DESC";

          return `${column} ${direction}`;
        });

      if (sortParts.length > 0) {
        orderSQL = `ORDER BY ${sortParts.join(", ")}`;
      }
    }

    // Default sort supaya pagination stabil.
    if (!orderSQL) {
      orderSQL = "ORDER BY 1";
    }

    // ========================================================
    // PAGINATION PARAMETERS
    // ========================================================

    const limitPlaceholder = `$${params.length + 1}`;

    const offsetPlaceholder = `$${params.length + 2}`;

    const dataParams = [...params, limit, safeStartRow];

    // ========================================================
    // DATA QUERY
    // ========================================================

    const dataSQL = `
      SELECT ${columnList}
      FROM ${quotedTableName}
      ${whereSQL}
      ${orderSQL}
      LIMIT ${limitPlaceholder}
      OFFSET ${offsetPlaceholder}
    `;

    console.log("DATA SQL:", dataSQL);
    console.log("DATA PARAMS:", dataParams);

    const rowsResult = await db.query(dataSQL, dataParams);

    // ========================================================
    // COUNT QUERY
    // ========================================================

    const countSQL = `
      SELECT COUNT(*) AS total
      FROM ${quotedTableName}
      ${whereSQL}
    `;

    const countResult = await db.query(countSQL, params);

    const total = Number(countResult.rows[0]?.total || 0);

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      columns: safeColumns,
      rows: rowsResult.rows,
      total,
      defaultFilters: dbFilters.filter(
        (filter) => filter.filter_type === "default",
      ),
    });
  } catch (error) {
    console.error("PERSONAL API ERROR:", error);

    return res.status(500).json({
      message: "Query error",
    });
  }
});

// ============================================================
// DISTINCT API
// ============================================================

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

    // ======================================================
    // VALIDATE FIELD
    // ======================================================

    if (!field || typeof field !== "string") {
      return res.status(400).json({
        error: "Invalid field",
      });
    }

    const cleanField = sanitizeIdentifier(field);

    if (!cleanField) {
      return res.status(400).json({
        error: "Invalid field",
      });
    }

    // ======================================================
    // TABLE
    // ======================================================

    const tableName = await getEntityTable(entityId);

    if (!tableName) {
      return res.status(404).json({
        error: "Entity not found",
      });
    }

    const quotedTableName = quoteIdentifier(tableName);

    const quotedField = quoteIdentifier(cleanField);

    if (!quotedTableName || !quotedField) {
      return res.status(400).json({
        error: "Invalid database identifier",
      });
    }

    // ======================================================
    // ALLOWED FIELDS
    // ======================================================

    const allowed = await getAllowedFields(entityId);

    if (!allowed.has(cleanField)) {
      return res.status(400).json({
        error: "Field is not allowed",
      });
    }

    // ======================================================
    // DB FILTERS
    // ======================================================

    const dbFilters = await getDbFilters(entityId);

    const where = [];
    const params = [];

    const userFilterMap = new Set(Object.keys(filterModel || {}));

    // ======================================================
    // 1. FIXED FILTER
    // ======================================================

    applyFixedFilters(dbFilters, allowed, where, params);

    // ======================================================
    // 2. DEFAULT FILTER
    //
    // Jangan gunakan default filter
    // untuk current field.
    // ======================================================

    applyDefaultFilters(
      dbFilters,
      allowed,
      userFilterMap,
      where,
      params,
      currentField || null,
    );

    // ======================================================
    // 3. USER FILTER
    //
    // Jangan gunakan filter current field
    // saat mengambil distinct.
    // ======================================================

    applyUserFilters(filterModel, allowed, where, params, currentField || null);

    // ======================================================
    // 4. SEARCH
    // ======================================================

    if (typeof search === "string" && search.trim()) {
      const searchPlaceholder = `$${params.length + 1}`;

      where.push(`${quotedField}::text ILIKE ${searchPlaceholder}`);

      params.push(`%${search.trim()}%`);
    }

    // ======================================================
    // WHERE
    // ======================================================

    const whereSQL = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    // ======================================================
    // DISTINCT
    // ======================================================

    const sql = `
        SELECT DISTINCT
          ${quotedField} AS value
        FROM ${quotedTableName}
        ${whereSQL}
        ORDER BY value ASC
        LIMIT 100
      `;

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

    // ======================================================
    // EXECUTE
    // ======================================================

    const result = await db.query(sql, params);

    // ======================================================
    // RESPONSE
    // ======================================================

    const values = result.rows
      .map((row) => row.value)
      .filter((value) => value !== null && value !== undefined);

    return res.status(200).json(values);
  } catch (error) {
    console.error("DISTINCT ERROR:", error);

    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

// ============================================================
// COLUMN VISIBILITY BY USER
// ============================================================

router.get("/:entityId/column_visibility_by_user", auth, async (req, res) => {
  try {
    const { entityId } = req.params;
    const userId = req.user.id;

    if (!entityId) {
      return res.status(400).json({
        message: "entityId wajib diisi",
      });
    }

    const result = await db.query(
      `
          SELECT
            field_name,
            display_name,
            default_visible,
            default_order,
            is_visible,
            display_order
          FROM mdf_user_field_settings
          WHERE entity_id = $1
            AND user_id = $2
          ORDER BY display_order ASC
        `,
      [entityId, userId],
    );

    return res.status(200).json({
      message: "Success",
      columns: result.rows,
    });
  } catch (error) {
    console.error("COLUMN VISIBILITY ERROR:", error);

    return res.status(500).json({
      message: "Failed load visibility setting",
    });
  }
});

module.exports = router;
