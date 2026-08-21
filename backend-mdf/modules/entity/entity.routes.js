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
    const [rows] = await db.query(`
      SELECT *
      FROM mdf_entities
    `);

    res.json({
      message: "Success",
      data: rows || [],
    });
  } catch (err) {
    console.error("ENTITY ERROR:", err);
    res.status(500).json({
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

    const [rows] = await db.query(
      `
      SELECT 
        field_id,
        field_name,
        field_label,
        is_visible_default,
        display_order
      FROM mdf_entity_fields
      WHERE entity_id = ?
      ORDER BY display_order
      `,
      [id],
    );

    res.json({
      message: "Success",
      data: rows || [],
    });
  } catch (err) {
    console.error("FIELDS ERROR:", err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

/**
 * 🔥 GET /api/entities/:id/filters
 * Ambil filters (default + fixed)
 */
router.get("/:id/filters", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `
      SELECT *
      FROM mdf_entity_filters
      WHERE entity_id = ?
        AND is_active = 1
      ORDER BY filter_type
      `,
      [id],
    );

    res.json({
      message: "Success",
      data: rows || [],
    });
  } catch (err) {
    console.error("FILTERS ERROR:", err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

/**
 * 🔥 POST /api/entities/:id/filters
 * Save filters (replace all)
 */
router.post("/:id/filters", auth, async (req, res) => {
  const { id } = req.params;
  const { filters } = req.body;

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // delete lama
    await conn.query("DELETE FROM mdf_entity_filters WHERE entity_id = ?", [
      id,
    ]);

    // insert baru
    for (const f of filters) {
      await conn.query(
        `
        INSERT INTO mdf_entity_filters
        (entity_id, filter_type, field_name, operator, value)
        VALUES (?, ?, ?, ?, ?)
        `,
        [id, f.filter_type, f.field_name, f.operator, f.value],
      );
    }

    await conn.commit();

    res.json({
      message: "Saved successfully",
      success: true,
    });
  } catch (err) {
    await conn.rollback();
    console.error("SAVE FILTER ERROR:", err);

    res.status(500).json({
      message: "Failed to save filters",
    });
  } finally {
    conn.release();
  }
});

router.get("/:id/data", auth, async (req, res) => {
  const user = req.user;

  const fixedFilters = buildFixedFilters(user);

  let where = "WHERE 1=1";
  let params = [];

  for (const f of fixedFilters) {
    where += ` AND ${f.field} ${f.operator} ?`;
    params.push(f.value);
  }

  const [rows] = await db.query(`SELECT * FROM your_table ${where}`, params);

  res.json(rows);
});

router.get("/:id/data", auth, async (req, res) => {
  const user = req.user;

  // 1. FIXED (security layer)
  const fixedFilters = buildFixedFilters(user);

  // 2. ROLE FILTER (nanti bisa expand)
  const roleFilters = []; // sementara kosong dulu

  // 3. UI FILTER (dari query FE)
  const uiFilters = req.query.filters ? JSON.parse(req.query.filters) : [];

  // 4. BUILD QUERY
  const { where, params } = buildWhereQuery({
    fixedFilters,
    roleFilters,
    uiFilters,
  });

  const [rows] = await db.query(`SELECT * FROM your_table ${where}`, params);

  res.json(rows);
});

module.exports = router;
