import test from "node:test";
import assert from "node:assert/strict";
import {
  getInterviewPreparationError,
  normalizeInterviewQuestions,
} from "../utils/interviewPreparation.js";

const questions = [
  { question: "Soru bir?", tip: "İpucu bir" },
  { question: "Soru iki?", tip: "İpucu iki" },
  { question: "Soru üç?", tip: "İpucu üç" },
];

test("accepts and trims exactly three interview questions", () => {
  assert.deepEqual(
    normalizeInterviewQuestions([
      { question: "  Soru bir? ", tip: " İpucu bir " },
      ...questions.slice(1),
    ]),
    questions
  );
});

test("rejects missing, extra, empty, or unexpected interview fields", () => {
  assert.equal(normalizeInterviewQuestions(questions.slice(0, 2)), null);
  assert.equal(normalizeInterviewQuestions([...questions, questions[0]]), null);
  assert.equal(normalizeInterviewQuestions([
    { question: "Soru bir?", tip: "" },
    ...questions.slice(1),
  ]), null);
  assert.equal(normalizeInterviewQuestions([
    { question: "Soru bir?", tip: "İpucu", extra: true },
    ...questions.slice(1),
  ]), null);
});

test("maps interview API and connection failures to safe messages", () => {
  assert.match(getInterviewPreparationError({}), /Sunucuya ulaşılamadı/);
  assert.match(getInterviewPreparationError({ response: { status: 401 } }), /Oturumunuz/);
  assert.match(getInterviewPreparationError({ response: { status: 403 } }), /doğrulanmış/);
  assert.match(getInterviewPreparationError({ response: { status: 404 } }), /bulunamadı/);
  assert.match(getInterviewPreparationError({ response: { status: 429 } }), /Ortak AI/);
  assert.match(getInterviewPreparationError({ response: { status: 502 } }), /geçerli/);
  assert.match(getInterviewPreparationError({ response: { status: 503 } }), /kullanılamıyor/);
});
