import db from "../config/db.js";

const normalizeOptionalText = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { error: `${fieldName} must be text` };
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    return { value: null };
  }

  if (normalized.length > 255) {
    return { error: `${fieldName} must be at most 255 characters` };
  }

  return { value: normalized };
};

const normalizeOptionalGPA = (value) => {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }

  if (typeof value !== "string" && typeof value !== "number") {
    return { error: "GPA must be a number between 0.00 and 4.00 with at most two decimal places" };
  }

  const rawValue = String(value).trim();
  if (rawValue === "") {
    return { value: null };
  }

  const validFormat = /^(?:[0-3](?:\.\d{1,2})?|4(?:\.0{1,2})?)$/;
  if (!validFormat.test(rawValue)) {
    return { error: "GPA must be a number between 0.00 and 4.00 with at most two decimal places" };
  }

  return { value: Number(rawValue) };
};

export const getProfile = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [rows] = await db.query(
      "SELECT university, major, GPA FROM users WHERE id = ?",
      [req.user.id]
    );

    res.json(rows[0] || { university: "", major: "", GPA: "" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const university = normalizeOptionalText(req.body?.university, "University");
    const major = normalizeOptionalText(req.body?.major, "Major");
    const GPA = normalizeOptionalGPA(req.body?.GPA);

    const validationError = university.error || major.error || GPA.error;
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    await db.query(
      "UPDATE users SET university = ?, major = ?, GPA = ? WHERE id = ?",
      [university.value, major.value, GPA.value, req.user.id]
    );

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};
