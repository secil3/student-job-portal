import { jest } from "@jest/globals";

const dbMock = { query: jest.fn() };
const generateApplicationMessageMock = jest.fn();
const consumeApplicationMessageRequestMock = jest.fn();

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock,
}));

await jest.unstable_mockModule("../services/applicationMessage.service.js", () => ({
  AI_PROVIDER_NOT_CONFIGURED: "AI_PROVIDER_NOT_CONFIGURED",
  generateApplicationMessage: generateApplicationMessageMock,
}));

await jest.unstable_mockModule(
  "../services/applicationMessageRateLimit.service.js",
  () => ({
    consumeApplicationMessageRequest: consumeApplicationMessageRequestMock,
  })
);

const { createApplicationMessage } = await import("../controllers/ai.controller.js");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const request = (body = {}) => ({
  user: { id: 7, role: "student" },
  body,
});

const mockVerifiedStudent = () => {
  dbMock.query.mockResolvedValueOnce([[
    { role: "student", is_verified: 1, is_active: 1 },
  ]]);
};

const mockJob = () => {
  dbMock.query.mockResolvedValueOnce([[
    {
      id: 4,
      title: "Synthetic Internship",
      description: "A synthetic job description",
      location: "Aydin",
      salary: null,
    },
  ]]);
};

describe("AI application message controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consumeApplicationMessageRequestMock.mockReturnValue(true);
  });

  test("returns a generated message using only the database job and validated input", async () => {
    mockVerifiedStudent();
    mockJob();
    generateApplicationMessageMock.mockResolvedValueOnce(" Generated message ");
    const res = mockResponse();

    await createApplicationMessage(
      request({ jobId: 4, notes: "  Real student note  ", language: "en" }),
      res
    );

    expect(dbMock.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("FROM jobs"),
      [4]
    );
    expect(generateApplicationMessageMock).toHaveBeenCalledWith({
      job: expect.objectContaining({ id: 4, title: "Synthetic Internship" }),
      notes: "Real student note",
      language: "en",
    });
    expect(res.json).toHaveBeenCalledWith({ message: "Generated message" });
  });

  test.each([
    [{}, "A valid jobId is required"],
    [{ jobId: 0 }, "A valid jobId is required"],
    [{ jobId: "not-a-number" }, "A valid jobId is required"],
    [{ jobId: 4, language: "de" }, "Language must be tr or en"],
  ])("rejects invalid input", async (body, expectedMessage) => {
    const res = mockResponse();

    await createApplicationMessage(request(body), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: expectedMessage });
    expect(dbMock.query).not.toHaveBeenCalled();
  });

  test.each([
    42,
    "x".repeat(1001),
  ])("rejects invalid notes", async (notes) => {
    const res = mockResponse();

    await createApplicationMessage(request({ jobId: 4, notes }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(dbMock.query).not.toHaveBeenCalled();
  });

  test("returns 404 when the database job does not exist", async () => {
    mockVerifiedStudent();
    dbMock.query.mockResolvedValueOnce([[]]);
    const res = mockResponse();

    await createApplicationMessage(request({ jobId: 404 }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(generateApplicationMessageMock).not.toHaveBeenCalled();
  });

  test("blocks a user whose current database role is not student", async () => {
    dbMock.query.mockResolvedValueOnce([[
      { role: "employer", is_verified: 1, is_active: 1 },
    ]]);
    const res = mockResponse();

    await createApplicationMessage(request({ jobId: 4 }), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.query).toHaveBeenCalledTimes(1);
  });

  test("blocks an unverified student", async () => {
    dbMock.query.mockResolvedValueOnce([[
      { role: "student", is_verified: 0, is_active: 1 },
    ]]);
    const res = mockResponse();

    await createApplicationMessage(request({ jobId: 4 }), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.query).toHaveBeenCalledTimes(1);
  });

  test("blocks an inactive student before using the AI provider", async () => {
    dbMock.query.mockResolvedValueOnce([[
      { role: "student", is_verified: 1, is_active: 0 },
    ]]);
    const res = mockResponse();

    await createApplicationMessage(request({ jobId: 4 }), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Account is inactive" });
    expect(dbMock.query).toHaveBeenCalledTimes(1);
    expect(generateApplicationMessageMock).not.toHaveBeenCalled();
  });

  test("rate limits the current student before loading the job", async () => {
    mockVerifiedStudent();
    consumeApplicationMessageRequestMock.mockReturnValueOnce(false);
    const res = mockResponse();

    await createApplicationMessage(request({ jobId: 4 }), res);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(dbMock.query).toHaveBeenCalledTimes(1);
    expect(generateApplicationMessageMock).not.toHaveBeenCalled();
  });

  test("returns 503 when no AI provider is configured", async () => {
    mockVerifiedStudent();
    mockJob();
    generateApplicationMessageMock.mockRejectedValueOnce(
      Object.assign(new Error("not configured"), {
        code: "AI_PROVIDER_NOT_CONFIGURED",
      })
    );
    const res = mockResponse();

    await createApplicationMessage(request({ jobId: 4 }), res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      message: "AI message generation is not configured",
    });
  });

  test("returns a safe 503 when the AI provider fails", async () => {
    mockVerifiedStudent();
    mockJob();
    generateApplicationMessageMock.mockRejectedValueOnce(
      Object.assign(new Error("provider details"), { code: "PROVIDER_FAILURE" })
    );
    const res = mockResponse();

    await createApplicationMessage(request({ jobId: 4 }), res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      message: "AI service is temporarily unavailable",
    });
  });

  test.each(["", "   ", null])("rejects an empty provider response", async (message) => {
    mockVerifiedStudent();
    mockJob();
    generateApplicationMessageMock.mockResolvedValueOnce(message);
    const res = mockResponse();

    await createApplicationMessage(request({ jobId: 4 }), res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({
      message: "AI service returned an invalid response",
    });
  });
});
