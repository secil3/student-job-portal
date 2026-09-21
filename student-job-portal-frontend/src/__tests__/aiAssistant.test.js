import test from "node:test";
import assert from "node:assert/strict";
import {
  findAssistantJob,
  getAssistantRequestError,
  normalizeAssistantJobId,
} from "../utils/aiAssistant.js";

test("normalizes only positive integer job ids", () => {
  assert.equal(normalizeAssistantJobId("42"), 42);
  assert.equal(normalizeAssistantJobId("0"), null);
  assert.equal(normalizeAssistantJobId("1.5"), null);
  assert.equal(normalizeAssistantJobId("not-a-job"), null);
});

test("matches a trusted API job across numeric id representations", () => {
  const job = { id: 7, title: "Synthetic role" };
  assert.equal(findAssistantJob([job], 7), job);
  assert.equal(findAssistantJob([{ ...job, id: "7" }], 7)?.title, "Synthetic role");
  assert.equal(findAssistantJob([job], 8), null);
});

test("maps supported API and network failures to safe messages", () => {
  assert.match(getAssistantRequestError({}, "generate"), /Sunucuya ulaşılamadı/);
  assert.match(getAssistantRequestError({ response: { status: 401 } }), /Oturumunuz/);
  assert.match(getAssistantRequestError({ response: { status: 403 } }), /doğrulanmış/);
  assert.match(getAssistantRequestError({ response: { status: 404 } }), /bulunamadı/);
  assert.match(getAssistantRequestError({ response: { status: 429 } }), /Çok fazla/);
  assert.match(getAssistantRequestError({ response: { status: 502 } }), /geçerli bir mesaj/);
  assert.match(getAssistantRequestError({ response: { status: 503 } }), /kullanılamıyor/);
});
