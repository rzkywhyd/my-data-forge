const router = require("express").Router();
const db = require("../../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/", async (req, res) => {
  console.log("Login request body:", req.body); // Debug: log request body
  try {
    const { email, password } = req.body;

    // 0. validasi input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email dan password wajib diisi" });
    }

    // 1. cari user
    const [users] = await db.query(
      "SELECT * FROM mdf_users WHERE email = ? LIMIT 1",
      [email],
    );

    if (users.length === 0) {
      return res.status(400).json({ message: "Email tidak ditemukan" });
    }

    const user = users[0];

    // 2. cek status user
    if (user.status !== "active") {
      return res.status(403).json({ message: "User tidak aktif" });
    }

    // 3. cek password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Password salah" });
    }

    // 4. generate JWT (FIX: pakai env saja)
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    );

    // 5. response
    res.json({
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
