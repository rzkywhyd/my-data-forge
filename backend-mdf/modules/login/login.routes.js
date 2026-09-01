const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const db = require("../../config/db");

router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email dan password wajib diisi",
      });
    }

    // Cari user berdasarkan email
    const result = await db.query(
      `
        SELECT id, name, email, status, password_hash
        FROM mdf_users
        WHERE email = $1
        LIMIT 1
      `,
      [email.trim()],
    );

    // User tidak ditemukan
    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Email atau password salah",
      });
    }

    const user = result.rows[0];

    // Cek status user
    if (user.status !== "active") {
      return res.status(403).json({
        message: "User tidak aktif",
      });
    }

    // Verifikasi password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({
        message: "Email atau password salah",
      });
    }

    // Pastikan JWT secret tersedia
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET belum dikonfigurasi");

      return res.status(500).json({
        message: "Konfigurasi server bermasalah",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "3h",
      },
    );

    // Response
    return res.status(200).json({
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

module.exports = router;
