const MAX_QUESTION_LENGTH = 500;
const MAX_TIP_LENGTH = 800;

export const normalizeInterviewQuestions = (value) => {
  if (!Array.isArray(value) || value.length !== 3) return null;

  const questions = value.map((item) => {
    if (
      !item
      || typeof item !== "object"
      || Array.isArray(item)
      || Object.keys(item).length !== 2
      || !Object.hasOwn(item, "question")
      || !Object.hasOwn(item, "tip")
      || typeof item.question !== "string"
      || typeof item.tip !== "string"
    ) {
      return null;
    }

    const question = item.question.trim();
    const tip = item.tip.trim();
    if (
      question.length === 0
      || question.length > MAX_QUESTION_LENGTH
      || tip.length === 0
      || tip.length > MAX_TIP_LENGTH
    ) {
      return null;
    }

    return { question, tip };
  });

  return questions.every(Boolean) ? questions : null;
};

export const getInterviewPreparationError = (error) => {
  const status = error?.response?.status;

  if (!error?.response) {
    return "Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.";
  }
  if (status === 401) return "Oturumunuz sona ermiş. Lütfen yeniden giriş yapın.";
  if (status === 403) {
    return "Mülakat hazırlığını kullanmak için doğrulanmış bir öğrenci hesabı gerekir.";
  }
  if (status === 404) return "İlan bulunamadı veya artık erişilebilir değil.";
  if (status === 429) {
    return "Ortak AI kullanım sınırına ulaştınız. Lütfen daha sonra tekrar deneyin.";
  }
  if (status === 502) {
    return "AI hizmeti geçerli mülakat soruları oluşturamadı. Lütfen tekrar deneyin.";
  }
  if (status === 503) {
    return "AI hizmeti şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.";
  }

  return "Mülakat soruları oluşturulamadı. Lütfen tekrar deneyin.";
};
