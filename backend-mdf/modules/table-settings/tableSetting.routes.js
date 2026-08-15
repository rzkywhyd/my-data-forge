const express = require("express");
const router = express.Router();
const db = require("../../config/db");
const auth = require("../../middleware/auth");

/**
 * =========================
 * GET COLUMNS
 * =========================
 */
router.get("/:id/columns", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
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
      WHERE entity_id = ?
      ORDER BY display_order
      `,
      [id]
    );

    res.json({ data: rows });
  } catch (err) {
    console.error("GET COLUMNS ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * =========================
 * GET FILTERS
 * =========================
 */
router.get("/:id/filters", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `
      SELECT filter_type, field_name, operator, value
      FROM mdf_entity_filters
      WHERE entity_id = ?
      `,
      [id]
    );

    res.json({
      data: Array.isArray(rows) ? rows : [],
    });
  } catch (err) {
    console.error("GET FILTER ERROR:", err);
    res.status(500).json({ message: "error" });
  }
});

/**
 * =========================
 * GET GENERAL CONFIG
 * =========================
 */
router.get("/:id/generals", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `
      SELECT 
        entity_id,
        menu_name,
        table_theme,
        default_page_size
      FROM mdf_entity_table_config
      WHERE entity_id = ?
      `,
      [id]
    );

    if (!rows.length) {
      return res.json({
        data: null,
      });
    }

    const r = rows[0];

    res.json({
      data: {
        entity_id: r.entity_id,
        menu_name: r.menu_name,
        theme: r.table_theme,
        page_size: r.default_page_size,
      },
    });
  } catch (err) {
    console.error("GET CONFIG ERROR:", err);
    res.status(500).json({ message: "error" });
  }
});

/**
 * =========================
 * SAVE CONFIG (FIXED TOTAL 🔥)
 * =========================
 */
router.post("/save", auth, async (req, res) => {
  const conn = await db.getConnection();

  try {
    const {
      entity_id,
      menu_name,
      theme,
      page_size,
      columns,
      filters,
    } = req.body;

    console.log("FILTERS IN:", filters);

    if (!entity_id) {
      return res.status(400).json({ message: "entity_id required" });
    }

    await conn.beginTransaction();

    /**
     * =========================
     * SAVE COLUMNS
     * =========================
     */
    if (Array.isArray(columns)) {
      await conn.query(
        `DELETE FROM mdf_entity_table_columns WHERE entity_id = ?`,
        [entity_id]
      );

      for (const col of columns) {
        await conn.query(
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
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            entity_id,
            col.field_id,
            col.label,
            col.visible ? 1 : 0,
            col.display_order ?? 0,
            col.sort_enabled ? 1 : 0,
            col.sort_type ?? null,
            col.freeze_enabled ? 1 : 0,
            col.freeze_type ?? null,
          ]
        );
      }
    }

    /**
     * =========================
     * SAVE FILTERS (FIXED SAFE 🔥)
     * =========================
     */
    const safeFilters = Array.isArray(filters) ? filters : [];

    // ALWAYS RESET FIRST
    await conn.query(
      `DELETE FROM mdf_entity_filters WHERE entity_id = ?`,
      [entity_id]
    );

    // INSERT ONLY IF EXISTS
    if (safeFilters.length > 0) {
      for (const f of safeFilters) {
        const field_name = f.field_name || f.key;
        const operator = f.operator;
        const value = f.value;
        const filter_type = f.filter_type || "default";

        if (!field_name || !operator) {
          console.warn("SKIP INVALID FILTER:", f);
          continue;
        }

        await conn.query(
          `
          INSERT INTO mdf_entity_filters (
            entity_id,
            filter_type,
            field_name,
            operator,
            value
          )
          VALUES (?, ?, ?, ?, ?)
          `,
          [
            entity_id,
            filter_type,
            field_name,
            operator,
            value !== null && value !== undefined
              ? String(value)
              : null,
          ]
        );
      }
    }

    /**
     * =========================
     * SAVE GENERAL CONFIG
     * =========================
     */
    await conn.query(
      `
      INSERT INTO mdf_entity_table_config (
        entity_id,
        menu_name,
        table_theme,
        default_page_size
      )
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        menu_name = VALUES(menu_name),
        table_theme = VALUES(table_theme),
        default_page_size = VALUES(default_page_size)
      `,
      [entity_id, menu_name, theme, page_size]
    );

    await conn.commit();

    res.json({ message: "Saved successfully" });
  } catch (err) {
    await conn.rollback();
    console.error("SAVE CONFIG ERROR:", err);

    res.status(500).json({
      message: "Internal server error",
    });
  } finally {
    conn.release();
  }
});

/**
 * =========================
 * DATA QUERY
 * =========================
 */
router.post("/:id/data", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { filters } = req.body;

    const [entityRows] = await db.query(
      `SELECT table_name FROM mdf_entities WHERE entity_id = ?`,
      [id]
    );

    if (!entityRows.length) {
      return res.status(404).json({ message: "Entity not found" });
    }

    const tableName = entityRows[0].table_name;

    const [fieldRows] = await db.query(
      `SELECT field_name FROM mdf_entity_fields WHERE entity_id = ?`,
      [id]
    );

    const fieldSet = new Set(fieldRows.map((f) => f.field_name));

    let where = [];
    let params = [];

    const allFilters = Array.isArray(filters) ? filters : [];

    for (const f of allFilters) {
      const field = f.field_name || f.key;

      if (!field || !fieldSet.has(field)) continue;

      switch (f.operator) {
        case "equals":
          where.push(`\`${field}\` = ?`);
          params.push(f.value);
          break;

        case "not equals":
          where.push(`\`${field}\` != ?`);
          params.push(f.value);
          break;

        case "contains":
          where.push(`\`${field}\` LIKE ?`);
          params.push(`%${f.value}%`);
          break;

        case "greater than":
          where.push(`\`${field}\` > ?`);
          params.push(f.value);
          break;

        case "less than":
          where.push(`\`${field}\` < ?`);
          params.push(f.value);
          break;
      }
    }

    const sql = `
      SELECT *
      FROM \`${tableName}\`
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      LIMIT 100
    `;

    const [rows] = await db.query(sql, params);

    res.json({ data: rows });
  } catch (err) {
    console.error("DATA ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * =========================
 * SAVE CONFIG (FIXED TOTAL 🔥)
 * =========================
 */
router.post("/sync-schema", auth, async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { entityId } = req.body;

    if (!entityId) {
      return res.status(400).json({ message: "entityId is required" });
    }

    // 1. ambil table name
    const [entityRows] = await conn.query(
      `SELECT table_name FROM mdf_entities WHERE entity_id = ?`,
      [entityId]
    );

    if (!entityRows.length) {
      return res.status(404).json({ message: "Entity not found" });
    }

    const tableName = entityRows[0].table_name;

    // 2. ambil schema
    const [columns] = await conn.query(
      `
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        ORDINAL_POSITION
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
      `,
      [tableName]
    );

    const toLabel = (field) =>
      field
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

    // 3. CHECKING + INSERT (ANTI DUPLICATE PASTI)
    for (const col of columns) {
      const fieldName = col.COLUMN_NAME.trim();

      // cek dulu
      const [exists] = await conn.query(
        `
        SELECT 1 
        FROM mdf_entity_fields
        WHERE entity_id = ?
          AND field_name = ?
        LIMIT 1
        `,
        [entityId, fieldName]
      );

      if (exists.length > 0) {
        continue; // skip kalau sudah ada
      }

      // insert kalau belum ada
      await conn.query(
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
        VALUES (?, ?, ?, ?, 1, 1, 1, ?)
        `,
        [
          entityId,
          fieldName,
          toLabel(fieldName),
          col.DATA_TYPE,
          col.ORDINAL_POSITION
        ]
      );
    }

    res.json({
      message: "Schema synced successfully",
      total: columns.length
    });

  } catch (err) {
    console.error("SYNC SCHEMA ERROR:", err);

    res.status(500).json({
      message: "Internal server error",
      error: err.message
    });

  } finally {
    conn.release();
  }
});

module.exports = router;