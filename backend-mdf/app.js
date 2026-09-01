require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./config/db");

const app = express();

// =====================
// MIDDLEWARE GLOBAL
// =====================

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  }),
);

app.use(express.json());

// =====================
// ROUTES
// =====================

app.use("/api/login", require("./modules/login/login.routes"));

app.use("/api/menus", require("./modules/menu/menu.routes"));

app.use("/api/entities", require("./modules/entity/entity.routes"));

app.use(
  "/api/table-setting",
  require("./modules/table-settings/tableSetting.routes"),
);

app.use("/api/users", require("./modules/users/user.routes"));

app.use("/api/personal", require("./modules/personal/personal.routes"));

app.use(
  "/api/visibilityPerUser",
  require("./modules/dynamic-table/visibilityPerUser.routes"),
);

// =====================
// HEALTH CHECK
// =====================

app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT NOW()");

    res.json({
      success: true,
      message: "API and database are running",
    });
  } catch (error) {
    console.error("HEALTH CHECK ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// =====================
// 404
// =====================

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// =====================
// START SERVER
// =====================

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
