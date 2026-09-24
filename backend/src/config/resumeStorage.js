import path from "node:path";

export const resumeStorageDirectory = path.resolve(
  process.cwd(),
  process.env.RESUME_STORAGE_DIR || "uploads"
);
