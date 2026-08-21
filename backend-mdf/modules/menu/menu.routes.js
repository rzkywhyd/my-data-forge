const router = require("express").Router();
const db = require("../../config/db");
const auth = require("../../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT DISTINCT
          mdf_menus.id AS menu_id,
          mdf_menus.name AS menu_name,
          mdf_menus.path AS href,
          mdf_menus.parent_id AS parent_id,
          mdf_menus.is_system_mode AS is_system_mode,
          mdf_permissions.action AS permissions
      FROM 
          mdf_role_permissions
      JOIN 
          mdf_menus 
          ON mdf_role_permissions.menu_id = mdf_menus.id
      JOIN 
          mdf_permissions 
          ON mdf_role_permissions.permission_id = mdf_permissions.id
      JOIN 
          mdf_user_roles 
          ON mdf_role_permissions.role_id = mdf_user_roles.role_id
      WHERE 
          mdf_user_roles.user_id = ?
      `,
      [userId],
    );

    const map = new Map();

    for (const row of rows) {
      if (!map.has(row.menu_id)) {
        map.set(row.menu_id, {
          menu_id: row.menu_id,
          menu_name: row.menu_name,
          href: row.href,
          parent_id: row.parent_id,
          is_system_mode: row.is_system_mode,
          permissions: [],
        });
      }

      const menu = map.get(row.menu_id);

      if (row.permissions && !menu.permissions.includes(row.permissions)) {
        menu.permissions.push(row.permissions);
      }
    }

    const result = [...map.values()];

    if (result.length === 0) {
      return res.status(403).json({ message: "No access" });
    }

    res.json({
      message: "Success",
      data: result,
    });
  } catch (err) {
    console.error("MENU ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
