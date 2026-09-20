import { jest } from "@jest/globals";

const queryMock = jest.fn();

await jest.unstable_mockModule("../config/db.js", () => ({
  default: { query: queryMock },
  getDB: jest.fn(),
}));

await jest.unstable_mockModule("../middleware/upload.middleware.js", () => ({
  removeUploadedFile: jest.fn(),
}));

const { renameResume } = await import("../controllers/resume.controller.js");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const request = (name, userId = 1) => ({
  body: { name },
  params: { id: "10" },
  user: { id: userId, role: "student" },
});

describe("Resume rename", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each(["", "   "])("rejects an empty resume name", async (name) => {
    const res = mockResponse();

    await renameResume(request(name), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Resume name is required" });
    expect(queryMock).not.toHaveBeenCalled();
  });

  test("rejects a resume name longer than 255 characters", async () => {
    const res = mockResponse();

    await renameResume(request("a".repeat(256)), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Resume name must be 255 characters or fewer",
    });
    expect(queryMock).not.toHaveBeenCalled();
  });

  test("returns 404 when the resume does not exist", async () => {
    queryMock.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = mockResponse();

    await renameResume(request("My Resume"), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Resume not found" });
  });

  test("does not reveal whether a resume belongs to another user", async () => {
    queryMock.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = mockResponse();

    await renameResume(request("My Resume", 2), res);

    expect(queryMock).toHaveBeenCalledWith(
      "UPDATE resumes SET name=? WHERE id=? AND user_id=?",
      ["My Resume", "10", 2]
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Resume not found" });
  });

  test("trims and renames an owned resume", async () => {
    queryMock.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = mockResponse();

    await renameResume(request("  Internship Resume  "), res);

    expect(queryMock).toHaveBeenCalledWith(
      "UPDATE resumes SET name=? WHERE id=? AND user_id=?",
      ["Internship Resume", "10", 1]
    );
    expect(res.json).toHaveBeenCalledWith({ message: "Resume renamed" });
    expect(res.status).not.toHaveBeenCalled();
  });

  test("returns 500 when the database update fails", async () => {
    queryMock.mockRejectedValueOnce(Object.assign(new Error("database failed"), {
      code: "ER_INTERNAL_ERROR",
    }));
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = mockResponse();

    await renameResume(request("My Resume"), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Resume could not be renamed" });
    consoleErrorSpy.mockRestore();
  });
});
