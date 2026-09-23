export const normalizeAssistantJobId = (value) => {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;

  const jobId = Number(value);
  return Number.isSafeInteger(jobId) && jobId > 0 ? jobId : null;
};

export const findAssistantJob = (jobs, jobId) => {
  if (!Array.isArray(jobs) || jobId === null) return null;
  return jobs.find((job) => Number(job?.id) === jobId) || null;
};

export const getAssistantRequestError = (error, action = "generate") => {
  const status = error?.response?.status;

  if (!error?.response) {
    return "Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.";
  }

  if (status === 401) return "Oturumunuz sona ermiş. Lütfen yeniden giriş yapın.";
  if (status === 403) {
    return action === "load"
      ? "Bu ilan bilgilerine erişim yetkiniz bulunmuyor."
      : "AI Başvuru Mesajı aracını kullanmak için doğrulanmış bir öğrenci hesabı gerekir.";
  }
  if (status === 404) return "İlan bulunamadı veya artık erişilebilir değil.";
  if (status === 429) return "Çok fazla mesaj isteği gönderdiniz. Lütfen daha sonra tekrar deneyin.";
  if (status === 502) return "AI hizmeti geçerli bir mesaj oluşturamadı. Lütfen tekrar deneyin.";
  if (status === 503) return "AI hizmeti şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.";

  return action === "load"
    ? "İlan bilgileri yüklenemedi. Lütfen tekrar deneyin."
    : "Mesaj oluşturulamadı. Lütfen tekrar deneyin.";
};
