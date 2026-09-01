const router = require("express").Router();
const db = require("../../config/db");
const auth = require("../../middleware/auth");

/**
 * GET /api/users?entity_id=1
 *
 * Mengambil data dari table yang terhubung
 * dengan entity dan hanya menampilkan kolom
 * yang aktif pada konfigurasi entity.
 */
router.get("/", auth, async (req, res) => {
  try {
    const { entity_id } = req.query;

    // =========================
    // VALIDATE ENTITY ID
    // =========================
    if (!entity_id) {
      return res.status(400).json({
        message: "entity_id is required",
      });
    }

    const entityId = Number(entity_id);

    if (!Number.isInteger(entityId) || entityId <= 0) {
      return res.status(400).json({
        message: "Invalid entity_id",
      });
    }

    // =========================
    // 1. GET ENTITY
    // =========================
    const entityResult = await db.query(
      `
      SELECT table_name
      FROM mdf_entities
      WHERE entity_id = $1
      LIMIT 1
      `,
      [entityId],
    );

    if (entityResult.rows.length === 0) {
      return res.status(404).json({
        message: "Entity not found",
      });
    }

    const tableName = entityResult.rows[0].table_name;

    // =========================
    // 2. VALIDATE TABLE NAME
    // =========================
    if (typeof tableName !== "string" || !/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return res.status(500).json({
        message: "Invalid table configuration",
      });
    }

    // =========================
    // 3. GET VISIBLE COLUMNS
    // =========================
    const columnsResult = await db.query(
      `
      SELECT
        f.field_name
      FROM mdf_entity_table_columns c
      JOIN mdf_entity_fields f
        ON f.field_id = c.field_id
      WHERE c.entity_id = $1
        AND c.is_visible = 1
      ORDER BY c.display_order ASC
      `,
      [entityId],
    );

    // =========================
    // 4. BUILD SELECT COLUMNS
    // =========================
    let selectColumns = "*";

    if (columnsResult.rows.length > 0) {
      const validColumns = columnsResult.rows
        .map((column) => column.field_name)
        .filter(
          (fieldName) =>
            typeof fieldName === "string" && /^[a-zA-Z0-9_]+$/.test(fieldName),
        );

      if (validColumns.length > 0) {
        selectColumns = validColumns
          .map((fieldName) => `"${fieldName}"`)
          .join(", ");
      }
    }

    // =========================
    // 5. GET DATA
    // =========================
    const dataResult = await db.query(
      `
      SELECT ${selectColumns}
      FROM "${tableName}"
      WHERE deleted_at IS NULL
      `,
    );

    // =========================
    // 6. RESPONSE
    // =========================
    return res.json({
      message: "Success",
      data: dataResult.rows,
    });
  } catch (error) {
    console.error("USER ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

module.exports = router;
