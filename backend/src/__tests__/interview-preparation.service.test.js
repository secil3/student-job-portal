import { jest } from "@jest/globals";
import { generateInterviewPreparation } from "../services/interviewPreparation.service.js";

const originalApiKey = process.env.GROQ_API_KEY;
const originalModel = process.env.GROQ_MODEL;
const originalFetch = global.fetch;

const job = {
  id: 12,
  title: "Software Intern",
  description: "Support the development team.",
  location: "Aydin",
  salary: "private salary field",
  student_email: "private@example.test",
  resume_id: 99,
};

const questions = [
  { question: "Question one?", tip: "Tip one" },
  { question: "Question two?", tip: "Tip two" },
  { question: "Question three?", tip: "Tip three" },
];

const responseWithContent = (content, finishReason = "stop") => ({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValue({
    choices: [{
      finish_reason: finishReason,
      message: { content },
    }],
  }),
});

const getSystemInstructions = () => {
  const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
  return requestBody.messages[0].content;
};

describe("interview preparation Groq service", () => {
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

  test("returns exactly three validated questions and safe tips", async () => {
    global.fetch.mockResolvedValueOnce(
      responseWithContent(JSON.stringify({ questions }))
    );

    await expect(generateInterviewPreparation({ job, language: "tr" }))
      .resolves.toEqual({ questions });

    const [url, options] = global.fetch.mock.calls[0];
    const requestBody = JSON.parse(options.body);
    const untrustedInput = JSON.parse(requestBody.messages[1].content);

    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(requestBody.model).toBe("openai/gpt-oss-20b");
    expect(requestBody.include_reasoning).toBe(false);
    expect(requestBody.reasoning_effort).toBe("low");
    expect(requestBody.response_format.json_schema.schema.properties.questions)
      .toMatchObject({ minItems: 3, maxItems: 3 });
    expect(untrustedInput).toEqual({
      untrustedJobData: {
        title: job.title,
        description: job.description,
        location: job.location,
      },
      language: "tr",
    });
    expect(options.body).not.toContain(job.salary);
    expect(options.body).not.toContain(job.student_email);
    expect(options.body).not.toContain(String(job.resume_id));
    expect(options.body).not.toContain(String(job.id));
  });

  test("requires general questions when the job description is short or vague", async () => {
    global.fetch.mockResolvedValueOnce(
      responseWithContent(JSON.stringify({ questions }))
    );

    await generateInterviewPreparation({
      job: {
        title: "Intern",
        description: "Join our team.",
        location: "Aydin",
      },
      language: "tr",
    });

    const instructions = getSystemInstructions();
    expect(instructions).toContain("short or vague");
    expect(instructions).toContain("general role-appropriate preparation questions");
    expect(instructions).toContain("Do not use the location to infer stereotypes");
  });

  test("forbids unsupported tools and student experience assumptions", async () => {
    global.fetch.mockResolvedValueOnce(
      responseWithContent(JSON.stringify({ questions }))
    );

    await generateInterviewPreparation({ job, language: "en" });

    const instructions = getSystemInstructions();
    expect(instructions).toContain("Jira or Trello");
    expect(instructions).toContain("unless they are explicitly present in the job data");
    expect(instructions).toContain("Do not assume that the student has used a particular tool");
    expect(instructions).toContain("if they have one");
    expect(instructions).toContain("if they do not");
    expect(instructions).toContain("Do not claim or imply that the real employer will ask");
  });

  test("rejects a timed out request", async () => {
    jest.useFakeTimers();
    global.fetch.mockImplementationOnce((_url, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener("abort", () => {
        reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      });
    }));

    const promise = generateInterviewPreparation({ job, language: "tr" });
    const expectation = expect(promise).rejects.toMatchObject({
      code: "AI_PROVIDER_TIMEOUT",
    });
    await jest.advanceTimersByTimeAsync(10_000);
    await expectation;
  });

  test("rejects malformed JSON content", async () => {
    global.fetch.mockResolvedValueOnce(responseWithContent("not-json"));

    await expect(generateInterviewPreparation({ job, language: "tr" }))
      .rejects.toMatchObject({ code: "AI_PROVIDER_INVALID_RESPONSE" });
  });

  test.each([
    questions.slice(0, 2),
    [...questions, { question: "Fourth?", tip: "Fourth tip" }],
  ])("rejects a response that does not contain exactly three questions", async (items) => {
    global.fetch.mockResolvedValueOnce(
      responseWithContent(JSON.stringify({ questions: items }))
    );

    await expect(generateInterviewPreparation({ job, language: "en" }))
      .rejects.toMatchObject({ code: "AI_PROVIDER_INVALID_RESPONSE" });
  });

  test("rejects an empty preparation tip", async () => {
    const invalidQuestions = [
      { question: "Question one?", tip: "" },
      ...questions.slice(1),
    ];
    global.fetch.mockResolvedValueOnce(
      responseWithContent(JSON.stringify({ questions: invalidQuestions }))
    );

    await expect(generateInterviewPreparation({ job, language: "tr" }))
      .rejects.toMatchObject({ code: "AI_PROVIDER_INVALID_RESPONSE" });
  });

  test("does not substitute reasoning for final content", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        choices: [{
          finish_reason: "stop",
          message: { content: "", reasoning: JSON.stringify({ questions }) },
        }],
      }),
    });

    await expect(generateInterviewPreparation({ job, language: "tr" }))
      .rejects.toMatchObject({ code: "AI_PROVIDER_INVALID_RESPONSE" });
  });

  test.each([
    [401, "AI_PROVIDER_AUTHENTICATION_FAILED"],
    [429, "AI_PROVIDER_RATE_LIMITED"],
  ])("maps provider HTTP %s safely", async (status, code) => {
    global.fetch.mockResolvedValueOnce({ ok: false, status });

    await expect(generateInterviewPreparation({ job, language: "tr" }))
      .rejects.toMatchObject({ code });
  });
});
