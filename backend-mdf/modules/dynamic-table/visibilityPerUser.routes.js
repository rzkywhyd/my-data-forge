const express = require("express");

const router = express.Router();

const db = require("../../config/db");
const auth = require("../../middleware/auth");

/**
 * POST /api/user-field-settings
 *
 * Ambil setting column milik user untuk entity tertentu.
 */
router.post("/", auth, async (req, res) => {
  try {
    const { entityId } = req.body;
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
        ORDER BY display_order
      `,
      [entityId, userId],
    );

    return res.status(200).json({
      columns: result.rows,
    });
  } catch (error) {
    console.error("LOAD VISIBILITY ERROR:", error);

    return res.status(500).json({
      message: "Failed load visibility setting",
    });
  }
});

/**
 * POST /api/user-field-settings/save
 *
 * Simpan setting column user.
 */
router.post("/save", auth, async (req, res) => {
  const client = await db.connect();

  try {
    const { entityId, columns } = req.body;
    const userId = req.user.id;

    if (!entityId) {
      return res.status(400).json({
        message: "entityId wajib diisi",
      });
    }

    if (!Array.isArray(columns)) {
      return res.status(400).json({
        message: "columns harus berupa array",
      });
    }

    await client.query("BEGIN");

    for (const column of columns) {
      await client.query(
        `
          INSERT INTO mdf_user_field_settings
          (
            user_id,
            entity_id,
            field_name,
            is_visible,
            display_order
          )
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (user_id, entity_id, field_name)
          DO UPDATE SET
            is_visible = EXCLUDED.is_visible,
            display_order = EXCLUDED.display_order
        `,
        [
          userId,
          entityId,
          column.field_name,
          column.is_visible,
          column.display_order,
        ],
      );
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("SAVE VISIBILITY ERROR:", error);

    return res.status(500).json({
      message: "Failed save visibility",
    });
  } finally {
    client.release();
  }
});

module.exports = router;
