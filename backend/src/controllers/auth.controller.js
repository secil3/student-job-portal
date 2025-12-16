const db = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");



// ------- REGISTER ----------------
exports.registerEmployer = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }
  
      const [existing] = await db.query(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );
  
      if (existing.length > 0) {
        return res.status(409).json({ message: "Email already exists" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      await db.query(
        "INSERT INTO users (email, password, role, is_verified) VALUES (?, ?, 'employer', FALSE)",
        [email, hashedPassword]
      );
  
      res.status(201).json({
        message: "Employer registered. Awaiting admin approval.",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  };
  

// ------------ LOGIN -----------------------
exports.login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }
  
      const [rows] = await db.query(
        "SELECT id, email, password, role, is_verified FROM users WHERE email = ?",
        [email]
      );
  
      if (rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }
  
      const user = rows[0];
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }
  
      // Employer ama onaylı değilse
      if (user.role === "employer" && !user.is_verified) {
        return res.status(403).json({
            success: false,
            message: "Employer account is not verified yet",
          });
        }
    
        const token = jwt.sign(
          {
            id: user.id,
            role: user.role,
          },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );
    
        res.status(200).json({
          success: true,
          message: "Login successful",
          token,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },   
         });
        } catch (error) {
          console.error("Login error:", error);
          res.status(500).json({
            success: false,
            message: "Server error",
          });
        }
      };