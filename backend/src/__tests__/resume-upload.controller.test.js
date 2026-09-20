import { jest } from "@jest/globals";

const dbMock = { query: jest.fn() };
const removeUploadedFileMock = jest.fn();

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock,
  getDB: jest.fn(),
}));

await jest.unstable_mockModule("../middleware/upload.middleware.js", () => ({
  removeUploadedFile: removeUploadedFileMock,
}));

const { uploadResume } = await import("../controllers/resume.controller.js");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Resume upload persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("stores the generated server filename for a valid PDF", async () => {
    dbMock.query.mockResolvedValueOnce([{ insertId: 1 }]);
    const req = {
      user: { id: 4 },
      file: {
        originalname: "student-resume.pdf",
        filename: "generated-id.pdf",
        path: "/safe/uploads/generated-id.pdf",
      },
    };
    const res = mockResponse();

    await uploadResume(req, res);

    expect(dbMock.query).toHaveBeenCalledWith(
      "INSERT INTO resumes (user_id, name, file_path) VALUES (?, ?, ?)",
      [4, "student-resume.pdf", "/uploads/generated-id.pdf"]
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(removeUploadedFileMock).not.toHaveBeenCalled();
  });

  test("removes only the newly uploaded file when the database insert fails", async () => {
    dbMock.query.mockRejectedValueOnce(Object.assign(new Error("DB failure"), {
      code: "ER_TEST_FAILURE",
    }));
    const req = {
      user: { id: 4 },
      file: {
        originalname: "student-resume.pdf",
        filename: "generated-id.pdf",
        path: "/safe/uploads/generated-id.pdf",
      },
    };
    const res = mockResponse();

    await uploadResume(req, res);

    expect(removeUploadedFileMock).toHaveBeenCalledWith(
      "/safe/uploads/generated-id.pdf"
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
