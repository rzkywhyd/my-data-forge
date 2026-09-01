const express = require("express");
const router = express.Router();

const db = require("../../config/db");
const auth = require("../../middleware/auth");

// =========================================================
// HELPERS
// =========================================================

/**
 * PostgreSQL identifier-safe.
 *
 * Nama tabel/kolom tidak boleh dimasukkan sebagai parameter
 * ($1, $2), sehingga harus divalidasi sebelum dimasukkan
 * ke SQL.
 */
function safeIdentifier(value) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleaned)) {
    return null;
  }

  return `"${cleaned.replace(/"/g, '""')}"`;
}

/**
 * Convert value menjadi integer positif.
 */
function toPositiveInteger(value, fallback) {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 1) {
    return fallback;
  }

  return number;
}

// =========================================================
// GET COLUMNS
// =========================================================

router.get("/:id/columns", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      `
        SELECT
          field_id,
          label,
          is_visible,
          display_order,
          sort_enabled,
          sort_type,
          freeze_enabled,
          freeze_type
        FROM mdf_entity_table_columns
        WHERE entity_id = $1
        ORDER BY display_order ASC
      `,
      [id],
    );

    return res.json({
      data: rows,
    });
  } catch (error) {
    console.error("GET COLUMNS ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// =========================================================
// GET FILTERS
// =========================================================

router.get("/:id/filters", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      `
        SELECT
          filter_type,
          field_name,
          operator,
          value
        FROM mdf_entity_filters
        WHERE entity_id = $1
        ORDER BY filter_type, field_name
      `,
      [id],
    );

    return res.json({
      data: rows,
    });
  } catch (error) {
    console.error("GET FILTER ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// =========================================================
// GET GENERAL CONFIG
// =========================================================

router.get("/:id/generals", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      `
        SELECT
          entity_id,
          menu_name,
          table_theme,
          default_page_size
        FROM mdf_entity_table_config
        WHERE entity_id = $1
        LIMIT 1
      `,
      [id],
    );

    if (rows.length === 0) {
      return res.json({
        data: null,
      });
    }

    const config = rows[0];

    return res.json({
      data: {
        entity_id: config.entity_id,
        menu_name: config.menu_name,
        theme: config.table_theme,
        page_size: config.default_page_size,
      },
    });
  } catch (error) {
    console.error("GET CONFIG ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// =========================================================
// SAVE CONFIG
// =========================================================

router.post("/save", auth, async (req, res) => {
  const client = await db.connect();

  try {
    const { entity_id, menu_name, theme, page_size, columns, filters } =
      req.body;

    if (!entity_id) {
      return res.status(400).json({
        message: "entity_id required",
      });
    }

    await client.query("BEGIN");

    // =====================================================
    // SAVE COLUMNS
    // =====================================================

    if (Array.isArray(columns)) {
      await client.query(
        `
          DELETE FROM mdf_entity_table_columns
          WHERE entity_id = $1
        `,
        [entity_id],
      );

      for (const column of columns) {
        if (!column?.field_id) {
          continue;
        }

        await client.query(
          `
            INSERT INTO mdf_entity_table_columns (
              entity_id,
              field_id,
              label,
              is_visible,
              display_order,
              sort_enabled,
              sort_type,
              freeze_enabled,
              freeze_type
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              $9
            )
          `,
          [
            entity_id,
            column.field_id,
            column.label ?? null,
            column.visible ? 1 : 0,
            column.display_order ?? 0,
            column.sort_enabled ? 1 : 0,
            column.sort_type ?? null,
            column.freeze_enabled ? 1 : 0,
            column.freeze_type ?? null,
          ],
        );
      }
    }

    // =====================================================
    // SAVE FILTERS
    // =====================================================

    const safeFilters = Array.isArray(filters) ? filters : [];

    await client.query(
      `
        DELETE FROM mdf_entity_filters
        WHERE entity_id = $1
      `,
      [entity_id],
    );

    for (const filter of safeFilters) {
      const fieldName = filter?.field_name || filter?.key;
      const operator = filter?.operator;
      const filterType = filter?.filter_type || "default";

      if (!fieldName || !operator) {
        console.warn("SKIP INVALID FILTER:", filter);
        continue;
      }

      await client.query(
        `
          INSERT INTO mdf_entity_filters (
            entity_id,
            filter_type,
            field_name,
            operator,
            value
          )
          VALUES ($1, $2, $3, $4, $5)
        `,
        [
          entity_id,
          filterType,
          fieldName,
          operator,
          filter?.value !== null && filter?.value !== undefined
            ? String(filter.value)
            : null,
        ],
      );
    }

    // =====================================================
    // SAVE GENERAL CONFIG
    // PostgreSQL UPSERT
    // =====================================================

    await client.query(
      `
        INSERT INTO mdf_entity_table_config (
          entity_id,
          menu_name,
          table_theme,
          default_page_size
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (entity_id)
        DO UPDATE SET
          menu_name = EXCLUDED.menu_name,
          table_theme = EXCLUDED.table_theme,
          default_page_size = EXCLUDED.default_page_size
      `,
      [entity_id, menu_name ?? null, theme ?? null, page_size ?? 25],
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Saved successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("SAVE CONFIG ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  } finally {
    client.release();
  }
});

// =========================================================
// DATA QUERY
// =========================================================

router.post("/:id/data", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const {
      filters = [],
      startRow = 0,
      endRow = 100,
      sortModel = [],
    } = req.body;

    // =====================================================
    // GET ENTITY TABLE
    // =====================================================

    const { rows: entityRows } = await db.query(
      `
        SELECT table_name
        FROM mdf_entities
        WHERE entity_id = $1
        LIMIT 1
      `,
      [id],
    );

    if (entityRows.length === 0) {
      return res.status(404).json({
        message: "Entity not found",
      });
    }

    const tableName = safeIdentifier(entityRows[0].table_name);

    if (!tableName) {
      return res.status(400).json({
        message: "Invalid table name",
      });
    }

    // =====================================================
    // GET ALLOWED FIELDS
    // =====================================================

    const { rows: fieldRows } = await db.query(
      `
        SELECT field_name
        FROM mdf_entity_fields
        WHERE entity_id = $1
      `,
      [id],
    );

    const allowedFields = new Set(fieldRows.map((field) => field.field_name));

    // =====================================================
    // BUILD WHERE
    // =====================================================

    const where = [];
    const params = [];

    if (Array.isArray(filters)) {
      for (const filter of filters) {
        const field = filter?.field_name || filter?.key;

        if (!field || !allowedFields.has(field)) {
          continue;
        }

        const column = safeIdentifier(field);

        if (!column) {
          continue;
        }

        const value = filter?.value;

        switch (filter?.operator) {
          case "equals": {
            params.push(value);
            where.push(`${column} = $${params.length}`);
            break;
          }

          case "not equals": {
            params.push(value);
            where.push(`${column} != $${params.length}`);
            break;
          }

          case "contains": {
            params.push(`%${value ?? ""}%`);
            where.push(`${column} ILIKE $${params.length}`);
            break;
          }

          case "starts with": {
            params.push(`${value ?? ""}%`);
            where.push(`${column} ILIKE $${params.length}`);
            break;
          }

          case "ends with": {
            params.push(`%${value ?? ""}`);
            where.push(`${column} ILIKE $${params.length}`);
            break;
          }

          case "greater than": {
            params.push(value);
            where.push(`${column} > $${params.length}`);
            break;
          }

          case "less than": {
            params.push(value);
            where.push(`${column} < $${params.length}`);
            break;
          }

          case "greater than or equal": {
            params.push(value);
            where.push(`${column} >= $${params.length}`);
            break;
          }

          case "less than or equal": {
            params.push(value);
            where.push(`${column} <= $${params.length}`);
            break;
          }

          case "blank": {
            where.push(`(${column} IS NULL OR ${column} = '')`);
            break;
          }

          case "not blank": {
            where.push(`(${column} IS NOT NULL AND ${column} != '')`);
            break;
          }

          default:
            break;
        }
      }
    }

    const whereSQL = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    // =====================================================
    // SORT
    // =====================================================

    let orderSQL = "";

    if (Array.isArray(sortModel) && sortModel.length > 0) {
      const sortParts = [];

      for (const sort of sortModel) {
        const field = sort?.colId;

        if (!field || !allowedFields.has(field)) {
          continue;
        }

        const column = safeIdentifier(field);

        if (!column) {
          continue;
        }

        const direction = sort?.sort === "asc" ? "ASC" : "DESC";

        sortParts.push(`${column} ${direction}`);
      }

      if (sortParts.length > 0) {
        orderSQL = `ORDER BY ${sortParts.join(", ")}`;
      }
    }

    // Default sorting
    if (!orderSQL) {
      orderSQL = "ORDER BY 1";
    }

    // =====================================================
    // PAGINATION
    // =====================================================

    const safeStartRow = Math.max(
      0,
      Number.isInteger(Number(startRow)) ? Number(startRow) : 0,
    );

    const requestedLimit = Number(endRow) - Number(startRow);

    const limit = requestedLimit > 0 ? Math.min(requestedLimit, 1000) : 100;

    // =====================================================
    // DATA QUERY
    // =====================================================

    const dataParams = [...params];

    dataParams.push(limit);
    const limitParam = dataParams.length;

    dataParams.push(safeStartRow);
    const offsetParam = dataParams.length;

    const dataSQL = `
      SELECT *
      FROM ${tableName}
      ${whereSQL}
      ${orderSQL}
      LIMIT $${limitParam}
      OFFSET $${offsetParam}
    `;

    const { rows } = await db.query(dataSQL, dataParams);

    // =====================================================
    // COUNT
    // =====================================================

    const countSQL = `
      SELECT COUNT(*)::integer AS total
      FROM ${tableName}
      ${whereSQL}
    `;

    const { rows: countRows } = await db.query(countSQL, params);

    const total = countRows.length > 0 ? Number(countRows[0].total) : 0;

    return res.json({
      data: rows,
      rows,
      total,
    });
  } catch (error) {
    console.error("DATA ERROR:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================================================
// SYNC SCHEMA
// =========================================================

router.post("/sync-schema", auth, async (req, res) => {
  const client = await db.connect();

  try {
    const { entityId } = req.body;

    if (!entityId) {
      return res.status(400).json({
        message: "entityId is required",
      });
    }

    // =====================================================
    // GET TABLE NAME
    // =====================================================

    const { rows: entityRows } = await client.query(
      `
        SELECT table_name
        FROM mdf_entities
        WHERE entity_id = $1
        LIMIT 1
      `,
      [entityId],
    );

    if (entityRows.length === 0) {
      return res.status(404).json({
        message: "Entity not found",
      });
    }

    const tableName = entityRows[0].table_name;

    // =====================================================
    // GET DATABASE SCHEMA
    // PostgreSQL
    // =====================================================

    const { rows: columns } = await client.query(
      `
        SELECT
          column_name,
          data_type,
          ordinal_position
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = $1
        ORDER BY ordinal_position
      `,
      [tableName],
    );

    if (columns.length === 0) {
      return res.status(404).json({
        message: "Table has no columns",
      });
    }

    // =====================================================
    // LABEL GENERATOR
    // =====================================================

    const toLabel = (field) => {
      return field
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    await client.query("BEGIN");

    // =====================================================
    // SYNC COLUMNS
    // =====================================================

    for (const column of columns) {
      const fieldName = column.column_name.trim();

      if (!fieldName) {
        continue;
      }

      // Check existing field
      const { rows: existingFields } = await client.query(
        `
            SELECT field_id
            FROM mdf_entity_fields
            WHERE entity_id = $1
              AND field_name = $2
            LIMIT 1
          `,
        [entityId, fieldName],
      );

      if (existingFields.length > 0) {
        continue;
      }

      // Insert new field
      await client.query(
        `
          INSERT INTO mdf_entity_fields (
            entity_id,
            field_name,
            field_label,
            data_type,
            is_visible_default,
            is_sortable,
            is_filterable,
            display_order
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            1,
            1,
            1,
            $5
          )
        `,
        [
          entityId,
          fieldName,
          toLabel(fieldName),
          column.data_type,
          column.ordinal_position,
        ],
      );
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Schema synced successfully",
      total: columns.length,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("SYNC SCHEMA ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    client.release();
  }
});

// =========================================================
// EXPORT
// =========================================================

module.exports = router;
