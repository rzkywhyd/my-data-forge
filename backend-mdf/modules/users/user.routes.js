const router = require("express").Router();
const db = require("../../config/db");
const auth = require("../../middleware/auth");

// GET /api/users?entity_id=1
router.get("/", auth, async (req, res) => {
  try {
    const { entity_id } = req.query;

    if (!entity_id) {
      return res.status(400).json({
        message: "entity_id is required",
      });
    }

    /**
     * 🔥 1. ambil columns config
     */
    const [cols] = await db.query(
      `
      SELECT 
        f.field_name
      FROM mdf_entity_table_columns c
      JOIN mdf_entity_fields f ON f.field_id = c.field_id
      WHERE c.entity_id = ?
        AND c.is_visible = 1
      ORDER BY c.display_order
      `,
      [entity_id],
    );

    /**
     * 🔥 2. fallback kalau belum ada config
     */
    let selectColumns = "*";

    if (cols.length > 0) {
      selectColumns = cols.map((c) => `\`${c.field_name}\``).join(", ");
    }

    /**
     * 🔥 3. query data user
     */
    const [rows] = await db.query(`
      SELECT ${selectColumns}
      FROM mdf_users
      WHERE deleted_at IS NULL
    `);

    res.json({
      message: "Success",
      data: rows,
    });
  } catch (err) {
    console.error("USER ERROR:", err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

module.exports = router;
