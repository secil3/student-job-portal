import test from "node:test";
import assert from "node:assert/strict";
import {
  REGISTRATION_EMAIL_DELIVERY_MESSAGE,
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
