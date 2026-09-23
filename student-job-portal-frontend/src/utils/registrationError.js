export const REGISTRATION_EMAIL_DELIVERY_MESSAGE =
  "Hesabınız oluşturuldu ancak doğrulama e-postası gönderilemedi. Doğrulama e-postasını yeniden isteyebilirsiniz.";

export const EMPLOYER_PENDING_APPROVAL_MESSAGE =
  "Hesabınız oluşturuldu. İlan yayınlayabilmek için yönetici onayı bekleniyor.";

export const getRegistrationEmailPresentation = (role) =>
  role === "student"
    ? {
        placeholder: "ogrenci.no@stu.adu.edu.tr",
        hint: "Yalnızca @stu.adu.edu.tr uzantılı ADÜ öğrenci e-posta adresleri kabul edilir.",
      }
    : {
        placeholder: "sirket@example.com",
        hint: "",
      };

export const isVerificationEmailDeliveryFailure = (error) =>
  error?.response?.status === 502 &&
  error?.response?.data?.code ===
    "STUDENT_VERIFICATION_EMAIL_DELIVERY_FAILED";
