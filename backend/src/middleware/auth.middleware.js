import jwt from "jsonwebtoken";
import db from "../config/db.js";

const auth = async (req, res, next) => {
  const authHeader = req.headers?.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }

  if (!decoded?.id) {
    return res.status(401).json({ message: "Invalid token" });
  }

  try {
    const [users] = await db.query(
      "SELECT id, role, is_active FROM users WHERE id = ?",
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "User account not found" });
    }

    if (Number(users[0].is_active) !== 1) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    req.user = {
      ...decoded,
      id: users[0].id,
      role: users[0].role,
    };
    return next();
  } catch (error) {
    console.error("auth middleware error:", error.code || error.name);
    return res.status(500).json({ message: "Authentication could not be verified" });
  }
};

export default auth; 
