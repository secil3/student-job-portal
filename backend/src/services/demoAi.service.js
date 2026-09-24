const SUPPORTED_DEMO_AI_MODES = new Set(["live", "fallback", "mock"]);

const applicationMessageFallback = () => (
  "Merhaba, yayınladığınız pozisyonla ilgileniyorum. Rolün sorumluluklarını öğrenmeye ve ekibinize katkı sunmaya istekliyim. Başvurumu değerlendirmenizden memnuniyet duyarım."
);

const interviewPreparationFallback = () => ({
  questions: [
    {
      question: "React component yapısını oluştururken nelere dikkat edersiniz?",
      tip: "Varsa kendi deneyiminizden kısa bir örnek verin; yoksa componentleri nasıl böleceğinizi açıklayın.",
    },
    {
      question: "Bir arayüzü farklı ekran boyutlarına uyumlu hâle nasıl getirirsiniz?",
      tip: "Responsive yaklaşımınızı ve kontrol edeceğiniz temel ekran boyutlarını sade biçimde anlatın.",
    },
    {
      question: "Git kullanarak bir ekip çalışmasına nasıl katkı sağlarsınız?",
      tip: "Varsa kendi deneyiminizi paylaşın; yoksa branch, commit ve kod inceleme sürecine nasıl yaklaşacağınızı açıklayın.",
    },
  ],
});

export const getDemoAiMode = () => {
  if (process.env.DEMO_MODE !== "true") return "live";

  const configuredMode = process.env.DEMO_AI_MODE?.trim().toLowerCase();
  return SUPPORTED_DEMO_AI_MODES.has(configuredMode)
    ? configuredMode
    : "fallback";
};

export const executeDemoAiRequest = async ({ provider, fallback }) => {
  const mode = getDemoAiMode();

  if (mode === "mock") {
    return { value: fallback(), isDemoAi: true };
  }

  try {
    return { value: await provider(), isDemoAi: false };
  } catch (error) {
    if (mode !== "fallback") throw error;
    return { value: fallback(), isDemoAi: true };
  }
};

export const runApplicationMessageProvider = (provider) => executeDemoAiRequest({
  provider,
  fallback: applicationMessageFallback,
});

export const runInterviewPreparationProvider = (provider) => executeDemoAiRequest({
  provider,
  fallback: interviewPreparationFallback,
});
