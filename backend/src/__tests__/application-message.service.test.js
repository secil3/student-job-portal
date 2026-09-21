import { jest } from "@jest/globals";
import {
  AI_PROVIDER_NOT_CONFIGURED,
  generateApplicationMessage,
} from "../services/applicationMessage.service.js";

const originalApiKey = process.env.GROQ_API_KEY;
const originalModel = process.env.GROQ_MODEL;
const originalFetch = global.fetch;

const job = {
  id: 12,
  title: "Software Intern",
  description: "Support the development team.",
  location: "Aydin",
  salary: null,
};

const successfulResponse = (content) => ({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValue({
    choices: [{ message: { content } }],
  }),
});

const responseWithPayload = (payload) => ({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValue(payload),
});

describe("application message Groq service", () => {
  beforeEach(() => {
    process.env.GROQ_API_KEY = "test-only-api-key";
    delete process.env.GROQ_MODEL;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (originalApiKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = originalApiKey;

    if (originalModel === undefined) delete process.env.GROQ_MODEL;
    else process.env.GROQ_MODEL = originalModel;

    global.fetch = originalFetch;
  });

  test.each([
    ["tr", "Başvurumu değerlendirdiğiniz için teşekkür ederim.", "Turkish"],
    ["en", "Thank you for considering my application.", "English"],
  ])("returns a successful %s message", async (language, content, expectedLanguage) => {
    global.fetch.mockResolvedValueOnce(successfulResponse(`  ${content}  `));

    await expect(generateApplicationMessage({
      job,
      notes: "I am interested in this role.",
      language,
    })).resolves.toBe(content);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    const requestBody = JSON.parse(options.body);

    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(options.headers.Authorization).toBe("Bearer test-only-api-key");
    expect(requestBody.model).toBe("openai/gpt-oss-20b");
    expect(requestBody.max_completion_tokens).toBe(1024);
    expect(requestBody.include_reasoning).toBe(false);
    expect(requestBody.reasoning_effort).toBe("low");
    expect(requestBody.messages[0].content).toContain(expectedLanguage);
    expect(requestBody.messages[0].content).toContain("untrusted content");
    expect(requestBody.messages[1].content).toContain(job.title);
    expect(requestBody.messages[1].content).toContain("I am interested");
    expect(requestBody.messages[1].content).not.toContain(String(job.id));
  });

  test("reads the configured model when the function is called", async () => {
    process.env.GROQ_MODEL = "llama-3.3-70b-versatile";
    global.fetch.mockResolvedValueOnce(successfulResponse("Message"));

    await generateApplicationMessage({ job, notes: "", language: "en" });

    const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(requestBody.model).toBe("llama-3.3-70b-versatile");
  });

  test("forbids attributing an age from the job description to the student", async () => {
    global.fetch.mockResolvedValueOnce(successfulResponse("General application message"));

    await generateApplicationMessage({
      job: {
        ...job,
        description: "22 yaşında bir ekip üyesi arıyoruz.",
      },
      notes: "",
      language: "tr",
    });

    const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    const systemInstruction = requestBody.messages[0].content;
    const untrustedInput = JSON.parse(requestBody.messages[1].content);

    expect(systemInstruction).toContain("never facts about the student");
    expect(systemInstruction).toContain("Never attribute an age");
    expect(systemInstruction).toContain("Only information that the student notes explicitly state");
    expect(untrustedInput.untrustedJobData.description).toContain("22 yaşında");
    expect(untrustedInput.untrustedStudentNotes).toBe("");
  });

  test("forbids salary repetition and application-process questions", async () => {
    global.fetch.mockResolvedValueOnce(successfulResponse("Professional intent message"));

    await generateApplicationMessage({
      job: { ...job, salary: "Synthetic salary" },
      notes: "selam, örnek metin",
      language: "tr",
    });

    const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    const systemInstruction = requestBody.messages[0].content;

    expect(systemInstruction).toContain("short, professional statement of intent");
    expect(systemInstruction).toContain("Do not repeat salary");
    expect(systemInstruction).toContain("Do not ask questions about salary, documents, or the application process");
    expect(systemInstruction).toContain("'hello', 'selam', or 'example text'");
  });

  test("keeps the not-configured error when the API key is missing", async () => {
    delete process.env.GROQ_API_KEY;

    await expect(generateApplicationMessage({ job, notes: "", language: "tr" }))
      .rejects.toMatchObject({ code: AI_PROVIDER_NOT_CONFIGURED });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("rejects a timed out request", async () => {
    jest.useFakeTimers();
    global.fetch.mockImplementationOnce((_url, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener("abort", () => {
        reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      });
    }));

    const requestPromise = generateApplicationMessage({ job, notes: "", language: "tr" });
    const expectation = expect(requestPromise).rejects.toMatchObject({
      code: "AI_PROVIDER_TIMEOUT",
    });
    await jest.advanceTimersByTimeAsync(10_000);
    await expectation;
  });

  test.each([
    [429, "AI_PROVIDER_RATE_LIMITED"],
    [401, "AI_PROVIDER_AUTHENTICATION_FAILED"],
    [403, "AI_PROVIDER_AUTHENTICATION_FAILED"],
  ])("maps provider HTTP %s without reading its body", async (status, code) => {
    const json = jest.fn();
    global.fetch.mockResolvedValueOnce({ ok: false, status, json });

    await expect(generateApplicationMessage({ job, notes: "", language: "en" }))
      .rejects.toMatchObject({ code });
    expect(json).not.toHaveBeenCalled();
  });

  test("rejects malformed JSON", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new SyntaxError("invalid JSON")),
    });

    await expect(generateApplicationMessage({ job, notes: "", language: "tr" }))
      .rejects.toMatchObject({ code: "AI_PROVIDER_INVALID_RESPONSE" });
  });

  test("classifies an empty response stopped by the token limit as incomplete", async () => {
    global.fetch.mockResolvedValueOnce(responseWithPayload({
      choices: [{
        finish_reason: "length",
        message: { content: "", reasoning: "Synthetic reasoning" },
      }],
    }));

    await expect(generateApplicationMessage({ job, notes: "", language: "tr" }))
      .rejects.toMatchObject({ code: "AI_PROVIDER_INCOMPLETE_RESPONSE" });
  });

  test("never substitutes reasoning for empty final content", async () => {
    global.fetch.mockResolvedValueOnce(responseWithPayload({
      choices: [{
        finish_reason: "stop",
        message: { content: "", reasoning: "Synthetic reasoning" },
      }],
    }));

    await expect(generateApplicationMessage({ job, notes: "", language: "en" }))
      .rejects.toMatchObject({ code: "AI_PROVIDER_INVALID_RESPONSE" });
  });

  test("returns final content and ignores a separate reasoning field", async () => {
    global.fetch.mockResolvedValueOnce(responseWithPayload({
      choices: [{
        finish_reason: "stop",
        message: {
          content: "  Final application message  ",
          reasoning: "Synthetic reasoning that must not be returned",
        },
      }],
    }));

    await expect(generateApplicationMessage({ job, notes: "", language: "en" }))
      .resolves.toBe("Final application message");
  });

  test.each([
    { label: "missing choices", payload: {} },
    { label: "missing message", payload: { choices: [{}] } },
    { label: "missing content", payload: { choices: [{ message: {} }] } },
  ])("rejects a response with $label", async ({ payload }) => {
    global.fetch.mockResolvedValueOnce(responseWithPayload(payload));

    await expect(generateApplicationMessage({ job, notes: "", language: "tr" }))
      .rejects.toMatchObject({ code: "AI_PROVIDER_INVALID_RESPONSE" });
  });

  test.each(["", "   ", null])("rejects empty provider content", async (content) => {
    global.fetch.mockResolvedValueOnce(successfulResponse(content));

    await expect(generateApplicationMessage({ job, notes: "", language: "tr" }))
      .rejects.toMatchObject({ code: "AI_PROVIDER_INVALID_RESPONSE" });
  });
});
