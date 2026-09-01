const router = require("express").Router();

const db = require("../../config/db");
const auth = require("../../middleware/auth");
const { buildFixedFilters } = require("../../utils/filterEngine");
const { buildWhereQuery } = require("../../utils/queryBuilder");

/**
 * GET /api/entities
 * Ambil semua entity
 */
router.get("/", auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT *
      FROM mdf_entities
      ORDER BY id
    `);

    return res.status(200).json({
      message: "Success",
      data: result.rows,
    });
  } catch (error) {
    console.error("ENTITY ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

/**
 * GET /api/entities/:id/fields
 * Ambil field berdasarkan entity
 */
router.get("/:id/fields", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `
        SELECT
          field_id,
          field_name,
          field_label,
          is_visible_default,
          display_order
        FROM mdf_entity_fields
        WHERE entity_id = $1
        ORDER BY display_order
      `,
      [id],
    );

    return res.status(200).json({
      message: "Success",
      data: result.rows,
    });
  } catch (error) {
    console.error("FIELDS ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

/**
 * GET /api/entities/:id/filters
 * Ambil filters (default + fixed)
 */
router.get("/:id/filters", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `
        SELECT *
        FROM mdf_entity_filters
        WHERE entity_id = $1
          AND is_active = true
        ORDER BY filter_type
      `,
      [id],
    );

    return res.status(200).json({
      message: "Success",
      data: result.rows,
    });
  } catch (error) {
    console.error("FILTERS ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

/**
 * POST /api/entities/:id/filters
 * Replace semua filters untuk entity
 */
router.post("/:id/filters", auth, async (req, res) => {
  const { id } = req.params;
  const { filters } = req.body;

  if (!Array.isArray(filters)) {
    return res.status(400).json({
      message: "filters harus berupa array",
    });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Hapus filter lama
    await client.query(
      `
        DELETE FROM mdf_entity_filters
        WHERE entity_id = $1
      `,
      [id],
    );

    // Insert filter baru
    for (const filter of filters) {
      await client.query(
        `
          INSERT INTO mdf_entity_filters
          (
            entity_id,
            filter_type,
            field_name,
            operator,
            value
          )
          VALUES ($1, $2, $3, $4, $5)
        `,
        [
          id,
          filter.filter_type,
          filter.field_name,
          filter.operator,
          filter.value,
        ],
      );
    }

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Saved successfully",
      success: true,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("SAVE FILTER ERROR:", error);

    return res.status(500).json({
      message: "Failed to save filters",
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/entities/:id/data
 * Ambil data entity dengan:
 * - Fixed filters
 * - Role filters
 * - UI filters
 */
router.get("/:id/data", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // 1. Fixed filters
    const fixedFilters = buildFixedFilters(user);

    // 2. Role filters
    const roleFilters = [];

    // 3. UI filters
    let uiFilters = [];

    if (req.query.filters) {
      try {
        uiFilters = JSON.parse(req.query.filters);
      } catch {
        return res.status(400).json({
          message: "Format filters tidak valid",
        });
      }
    }

    // 4. Build WHERE
    const { where, params } = buildWhereQuery({
      fixedFilters,
      roleFilters,
      uiFilters,
    });

    /**
     * TODO:
     * Ganti your_table dengan nama tabel
     * berdasarkan entity ID.
     */
    const query = `
      SELECT *
      FROM your_table
      ${where}
    `;

    const result = await db.query(query, params);

    return res.status(200).json({
      message: "Success",
      data: result.rows,
    });
  } catch (error) {
    console.error("ENTITY DATA ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

module.exports = router;
