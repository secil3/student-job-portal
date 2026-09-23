import test from "node:test";
import assert from "node:assert/strict";
import {
  EMPLOYER_PENDING_APPROVAL_MESSAGE,
  REGISTRATION_EMAIL_DELIVERY_MESSAGE,
  getRegistrationEmailPresentation,
  isVerificationEmailDeliveryFailure,
} from "../utils/registrationError.js";

test("recognizes only the post-registration verification email delivery failure", () => {
  const deliveryFailure = {
    response: {
      status: 502,
      data: { code: "STUDENT_VERIFICATION_EMAIL_DELIVERY_FAILED" },
    },
  };

  assert.equal(isVerificationEmailDeliveryFailure(deliveryFailure), true);
  assert.match(REGISTRATION_EMAIL_DELIVERY_MESSAGE, /Hesabınız oluşturuldu/);
});

test("does not treat an uncreated account as an email delivery failure", () => {
  assert.equal(
    isVerificationEmailDeliveryFailure({
      response: { status: 500, data: { message: "Register failed" } },
    }),
    false
  );
  assert.equal(
    isVerificationEmailDeliveryFailure({
      response: { status: 502, data: { code: "DIFFERENT_ERROR" } },
    }),
    false
  );
});

test("shows the ADU address rule only for student registration", () => {
  const student = getRegistrationEmailPresentation("student");
  const employer = getRegistrationEmailPresentation("employer");

  assert.equal(student.placeholder, "ogrenci.no@stu.adu.edu.tr");
  assert.match(student.hint, /@stu\.adu\.edu\.tr/);
  assert.equal(employer.placeholder, "sirket@example.com");
  assert.equal(employer.hint, "");
});

test("provides the employer approval success message", () => {
  assert.match(EMPLOYER_PENDING_APPROVAL_MESSAGE, /yönetici onayı bekleniyor/);
});
