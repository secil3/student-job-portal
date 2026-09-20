import { jest } from "@jest/globals";
import multer from "multer";
import fs from "node:fs/promises";
import upload, {
  MAX_RESUME_SIZE,
  hasPdfSignature,
  pdfFileFilter,
  handleUploadError,
} from "../middleware/upload.middleware.js";

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("PDF resume upload validation", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("creates a missing upload directory before returning the destination", async () => {
    const mkdirSpy = jest.spyOn(fs, "mkdir").mockResolvedValueOnce(undefined);
    const destination = await new Promise((resolve, reject) => {
      upload.storage.getDestination({}, {}, (error, directory) => {
        if (error) reject(error);
        else resolve(directory);
      });
    });

    expect(mkdirSpy).toHaveBeenCalledWith(destination, { recursive: true });
  });

  test("keeps using an existing upload directory without failing", async () => {
    const mkdirSpy = jest.spyOn(fs, "mkdir").mockResolvedValueOnce(undefined);
    const callback = jest.fn();

    upload.storage.getDestination({}, {}, callback);
    await Promise.resolve();

    expect(mkdirSpy).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    expect(callback).toHaveBeenCalledWith(null, expect.any(String));
  });

  test("passes directory creation errors to Multer", async () => {
    const error = Object.assign(new Error("mkdir failed"), { code: "EACCES" });
    jest.spyOn(fs, "mkdir").mockRejectedValueOnce(error);
    const callback = jest.fn();

    await new Promise((resolve) => {
      upload.storage.getDestination({}, {}, (...args) => {
        callback(...args);
        resolve();
      });
    });

    expect(callback).toHaveBeenCalledWith(error);
  });

  test("accepts a PDF extension and MIME type", () => {
    const callback = jest.fn();

    pdfFileFilter({}, { originalname: "resume.pdf", mimetype: "application/pdf" }, callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  test("rejects a wrong extension even when the MIME type claims PDF", () => {
    const callback = jest.fn();

    pdfFileFilter({}, { originalname: "resume.txt", mimetype: "application/pdf" }, callback);

    const [error] = callback.mock.calls[0];
    expect(error.status).toBe(400);
    expect(error.message).toBe("Only PDF files are allowed");
  });

  test("rejects a PDF extension with a non-PDF MIME type", () => {
    const callback = jest.fn();

    pdfFileFilter({}, { originalname: "resume.pdf", mimetype: "text/plain" }, callback);

    expect(callback.mock.calls[0][0].status).toBe(400);
  });

  test("recognizes a valid PDF signature and rejects fake PDF content", () => {
    expect(hasPdfSignature(Buffer.from("%PDF-1.7\n"))).toBe(true);
    expect(hasPdfSignature(Buffer.from("not a pdf"))).toBe(false);
  });

  test("configures a 5 MB limit", () => {
    expect(MAX_RESUME_SIZE).toBe(5 * 1024 * 1024);
    expect(upload.limits.fileSize).toBe(MAX_RESUME_SIZE);
  });

  test("returns 413 when Multer reports the size limit was exceeded", async () => {
    const error = new multer.MulterError("LIMIT_FILE_SIZE");
    const req = {};
    const res = mockResponse();
    const next = jest.fn();

    await handleUploadError(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({
      message: "PDF file must be 5 MB or smaller",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("generates distinct random PDF filenames", () => {
    const firstCallback = jest.fn();
    const secondCallback = jest.fn();

    upload.storage.getFilename({}, {}, firstCallback);
    upload.storage.getFilename({}, {}, secondCallback);

    const firstName = firstCallback.mock.calls[0][1];
    const secondName = secondCallback.mock.calls[0][1];
    expect(firstName).toMatch(/^[0-9a-f-]{36}\.pdf$/);
    expect(secondName).toMatch(/^[0-9a-f-]{36}\.pdf$/);
    expect(firstName).not.toBe(secondName);
  });
});
