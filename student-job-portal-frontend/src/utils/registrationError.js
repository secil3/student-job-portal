export const REGISTRATION_EMAIL_DELIVERY_MESSAGE =
  "Hesabınız oluşturuldu ancak doğrulama e-postası gönderilemedi. Doğrulama e-postasını yeniden isteyebilirsiniz.";

export const isVerificationEmailDeliveryFailure = (error) =>
  error?.response?.status === 502 &&
  error?.response?.data?.code ===
    "STUDENT_VERIFICATION_EMAIL_DELIVERY_FAILED";
