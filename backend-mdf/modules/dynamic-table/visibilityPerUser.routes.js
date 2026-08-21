const express = require("express");
const router = express.Router();

const db = require("../../config/db");
const auth = require("../../middleware/auth");

router.post("/", auth, async (req, res) => {
  try {
    const { entityId } = req.body;

    const userId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT
        field_name,
        display_name,
        default_visible,
        default_order,
        is_visible,
        display_order
      FROM mdf_user_field_settings
      WHERE entity_id = ?
        AND user_id = ?
      ORDER BY display_order
      `,
      [entityId, userId],
    );

    res.json({
      columns: rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed load visibility setting",
    });
  }
});

router.post("/save", auth, async (req, res) => {
  try {
    const { entityId, columns } = req.body;

    const userId = req.user.id;

    for (const column of columns) {
      await db.query(
        `
        INSERT INTO mdf_user_field_settings
        (
          user_id,
          entity_id,
          field_name,
          is_visible,
          display_order
        )
        VALUES (?, ?, ?, ?, ?)

        ON DUPLICATE KEY UPDATE
          is_visible = VALUES(is_visible),
          display_order = VALUES(display_order)
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

    res.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed save visibility",
    });
  }
});

module.exports = router;
