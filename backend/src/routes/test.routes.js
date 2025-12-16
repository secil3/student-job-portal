const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/auth.middleware");

router.get("/protected", auth, (req, res) => {
  res.json({ message: "Access granted", user: req.user });
});

router.get("/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS db_test");
    res.status(200).json({
      success: true,
      message: "Database connection successful 🚀",
      result: rows,
    });
  } catch (error) {
    console.error("DB ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Database connection failed ❌",
      error: error.message,
    });
  }
});

const authController = require("../controllers/auth.controller");

router.post("/login", authController.login);

module.exports = router;
