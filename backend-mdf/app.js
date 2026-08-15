require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// =====================
// MIDDLEWARE GLOBAL
// =====================
app.use(cors());
app.use(express.json());

// =====================
// ROUTES
// =====================
// LOGIN
app.use("/api/login", require("./modules/login/login.routes"));

// MENU
app.use("/api/menus", require("./modules/menu/menu.routes"));

// ENTITY (metadata)
app.use("/api/entities", require("./modules/entity/entity.routes"));

// 🔥 TABLE SETTING (INI YANG KURANG)
app.use(
  "/api/table-setting",
  require("./modules/table-settings/tableSetting.routes")
);

app.use("/api/users", require("./modules/users/user.routes"));

app.use("/api/personal", require("./modules/personal/personal.routes"));



app.use(
  "/api/visibilityPerUser",
  require("./modules/dynamic-table/visibilityPerUser.routes")
);

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});