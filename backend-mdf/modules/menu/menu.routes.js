const router = require("express").Router();

const db = require("../../config/db");
const auth = require("../../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `
        SELECT
          m.id AS menu_id,
          m.name AS menu_name,
          m.path AS href,
          m.parent_id,
          m.is_system_mode,
          ARRAY_AGG(DISTINCT p.action)
            FILTER (WHERE p.action IS NOT NULL) AS permissions
        FROM mdf_role_permissions rp

        INNER JOIN mdf_menus m
          ON rp.menu_id = m.id

        INNER JOIN mdf_permissions p
          ON rp.permission_id = p.id

        INNER JOIN mdf_user_roles ur
          ON rp.role_id = ur.role_id

        WHERE ur.user_id = $1

        GROUP BY
          m.id,
          m.name,
          m.path,
          m.parent_id,
          m.is_system_mode

        ORDER BY m.id
      `,
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        message: "No access",
      });
    }

    return res.status(200).json({
      message: "Success",
      data: result.rows,
    });
  } catch (error) {
    console.error("MENU ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

module.exports = router;
