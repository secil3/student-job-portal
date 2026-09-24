import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "node:fs/promises";
import { resumeStorageDirectory } from "../config/resumeStorage.js";

export const MAX_RESUME_SIZE = 5 * 1024 * 1024;
const uploadsDirectory = resumeStorageDirectory;

export const hasPdfSignature = (buffer) =>
  buffer.subarray(0, 5).toString("ascii") === "%PDF-";

const isPathInsideUploads = (filePath) => {
  const absolutePath = path.resolve(filePath);
  return absolutePath.startsWith(`${uploadsDirectory}${path.sep}`);
};

export const removeUploadedFile = async (filePath) => {
  if (!filePath || !isPathInsideUploads(filePath)) return;

  try {
    await fs.unlink(path.resolve(filePath));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("UPLOAD CLEANUP ERROR:", error.code || error.name);
    }
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdir(uploadsDirectory, { recursive: true })
      .then(() => cb(null, uploadsDirectory))
      .catch((error) => cb(error));
  },
  filename: (req, file, cb) => {
    cb(null, `${crypto.randomUUID()}.pdf`);
  }
});

export const pdfFileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const isPdf = extension === ".pdf" && file.mimetype === "application/pdf";

  if (!isPdf) {
    const error = new Error("Only PDF files are allowed");
    error.status = 400;
    return cb(error);
  }

  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter: pdfFileFilter,
  limits: { fileSize: MAX_RESUME_SIZE }
});

export const validatePdfSignature = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "No PDF file uploaded" });
  }

  try {
    const handle = await fs.open(req.file.path, "r");
    const signature = Buffer.alloc(5);

    try {
      await handle.read(signature, 0, signature.length, 0);
    } finally {
      await handle.close();
    }

    if (!hasPdfSignature(signature)) {
      await removeUploadedFile(req.file.path);
      return res.status(400).json({ message: "The uploaded file is not a valid PDF" });
    }

    return next();
  } catch (error) {
    await removeUploadedFile(req.file.path);
    console.error("PDF VALIDATION ERROR:", error.code || error.name);
    return res.status(400).json({ message: "The uploaded PDF could not be validated" });
  }
};

export const handleUploadError = async (error, req, res, _next) => {
  await removeUploadedFile(req.file?.path);

  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "PDF file must be 5 MB or smaller" });
  }

  if (error?.status === 400) {
    return res.status(400).json({ message: error.message });
  }

  console.error("UPLOAD ERROR:", error.code || error.name);
  return res.status(500).json({ message: "Resume upload failed" });
};

export default upload;
