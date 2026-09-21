import { jest } from "@jest/globals";

const dbMock = { query: jest.fn() };
const jwtMock = { verify: jest.fn() };

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock,
}));

await jest.unstable_mockModule("jsonwebtoken", () => ({
  default: jwtMock,
}));

const { default: auth } = await import("../middleware/auth.middleware.js");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("current account authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  test("uses the current active account role for protected routes", async () => {
    jwtMock.verify.mockReturnValue({ id: 7, role: "student" });
    dbMock.query.mockResolvedValueOnce([[
      { id: 7, role: "employer", is_active: 1 },
    ]]);
    const req = { headers: { authorization: "Bearer old-token" } };
    const res = mockResponse();
    const next = jest.fn();

    await auth(req, res, next);

    expect(dbMock.query).toHaveBeenCalledWith(
      "SELECT id, role, is_active FROM users WHERE id = ?",
      [7]
    );
    expect(req.user).toEqual({ id: 7, role: "employer" });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test("blocks a previously issued JWT after the account is deactivated", async () => {
    jwtMock.verify.mockReturnValue({ id: 7, role: "student" });
    dbMock.query.mockResolvedValueOnce([[
      { id: 7, role: "student", is_active: 0 },
    ]]);
    const req = { headers: { authorization: "Bearer previously-valid-token" } };
    const res = mockResponse();
    const next = jest.fn();

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Account is inactive" });
    expect(next).not.toHaveBeenCalled();
  });

  test("blocks a deleted account even when its JWT is otherwise valid", async () => {
    jwtMock.verify.mockReturnValue({ id: 404, role: "student" });
    dbMock.query.mockResolvedValueOnce([[]]);
    const req = { headers: { authorization: "Bearer old-token" } };
    const res = mockResponse();
    const next = jest.fn();

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("rejects an invalid token before reading the account", async () => {
    jwtMock.verify.mockImplementation(() => {
      throw new Error("invalid token");
    });
    const req = { headers: { authorization: "Bearer invalid-token" } };
    const res = mockResponse();
    const next = jest.fn();

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(dbMock.query).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
