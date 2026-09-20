import { jest } from "@jest/globals";
import path from "path";

const connectionMock = {
  beginTransaction: jest.fn(),
  query: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
};
const getDBMock = jest.fn();
const unlinkMock = jest.fn();

await jest.unstable_mockModule("../config/db.js", () => ({
  default: { query: jest.fn() },
  getDB: getDBMock,
}));

await jest.unstable_mockModule("node:fs/promises", () => ({
  default: { unlink: unlinkMock },
}));

await jest.unstable_mockModule("../middleware/upload.middleware.js", () => ({
  removeUploadedFile: jest.fn(),
}));

const { deleteResume } = await import("../controllers/resume.controller.js");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const request = (userId = 1) => ({
  params: { id: "10" },
  user: { id: userId, role: "student" },
});

const ownedResume = {
  id: 10,
  user_id: 1,
  file_path: "/uploads/delete-me.pdf",
};

describe("Resume deletion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDBMock.mockResolvedValue(connectionMock);
    connectionMock.beginTransaction.mockResolvedValue();
    connectionMock.commit.mockResolvedValue();
    connectionMock.rollback.mockResolvedValue();
    unlinkMock.mockResolvedValue();
  });

  test("deletes an owned, unused resume record and physical file", async () => {
    connectionMock.query
      .mockResolvedValueOnce([[ownedResume]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = mockResponse();

    await deleteResume(request(), res);

    expect(connectionMock.beginTransaction).toHaveBeenCalledTimes(1);
    expect(connectionMock.query).toHaveBeenLastCalledWith(
      "DELETE FROM resumes WHERE id = ? AND user_id = ?",
      [10, 1]
    );
    expect(unlinkMock).toHaveBeenCalledWith(
      path.resolve(process.cwd(), "uploads", "delete-me.pdf")
    );
    expect(connectionMock.commit).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ message: "Resume deleted" });
  });

  test("denies deletion of another student's resume", async () => {
    connectionMock.query.mockResolvedValueOnce([[
      { ...ownedResume, user_id: 2 },
    ]]);
    const res = mockResponse();

    await deleteResume(request(), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(connectionMock.rollback).toHaveBeenCalledTimes(1);
    expect(unlinkMock).not.toHaveBeenCalled();
  });

  test("returns 404 for a missing resume", async () => {
    connectionMock.query.mockResolvedValueOnce([[]]);
    const res = mockResponse();

    await deleteResume(request(), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(connectionMock.rollback).toHaveBeenCalledTimes(1);
  });

  test("blocks deletion when the resume is used by an application", async () => {
    connectionMock.query
      .mockResolvedValueOnce([[ownedResume]])
      .mockResolvedValueOnce([[{ id: 30 }]]);
    const res = mockResponse();

    await deleteResume(request(), res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: "This resume cannot be deleted because it is used in an application",
    });
    expect(connectionMock.rollback).toHaveBeenCalledTimes(1);
    expect(unlinkMock).not.toHaveBeenCalled();
  });

  test("rolls back the database delete when the physical file is missing", async () => {
    connectionMock.query
      .mockResolvedValueOnce([[ownedResume]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    unlinkMock.mockRejectedValueOnce(Object.assign(new Error("missing"), {
      code: "ENOENT",
    }));
    const res = mockResponse();

    await deleteResume(request(), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(connectionMock.rollback).toHaveBeenCalledTimes(1);
    expect(connectionMock.commit).not.toHaveBeenCalled();
  });

  test("rolls back the database delete when physical file deletion fails", async () => {
    connectionMock.query
      .mockResolvedValueOnce([[ownedResume]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    unlinkMock.mockRejectedValueOnce(Object.assign(new Error("denied"), {
      code: "EACCES",
    }));
    const res = mockResponse();

    await deleteResume(request(), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(connectionMock.rollback).toHaveBeenCalledTimes(1);
    expect(connectionMock.commit).not.toHaveBeenCalled();
  });
});
