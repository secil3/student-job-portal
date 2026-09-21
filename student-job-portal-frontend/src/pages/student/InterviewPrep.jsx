import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import {
  findAssistantJob,
  getAssistantRequestError,
  normalizeAssistantJobId,
} from "../../utils/aiAssistant";
import {
  getInterviewPreparationError,
  normalizeInterviewQuestions,
} from "../../utils/interviewPreparation";
import "../../styles/InterviewPrep.css";

export default function InterviewPrep() {
  const { jobId: jobIdParam } = useParams();
  const jobId = normalizeAssistantJobId(jobIdParam);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [language, setLanguage] = useState("tr");
  const [questions, setQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");

  useEffect(() => {
    let active = true;

    const loadJob = async () => {
      if (jobId === null) {
        setLoadError("Geçersiz ilan bağlantısı.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/jobs");
        if (!active) return;

        const matchedJob = findAssistantJob(response.data, jobId);
        if (!matchedJob) {
          setLoadError("İlan bulunamadı veya artık erişilebilir değil.");
        } else {
          setJob(matchedJob);
        }
      } catch (error) {
        if (active) setLoadError(getAssistantRequestError(error, "load"));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadJob();
    return () => {
      active = false;
    };
  }, [jobId]);

  const handleGenerate = async () => {
    if (!job || generating) return;

    setGenerating(true);
    setGenerationError("");

    try {
      const response = await api.post("/ai/interview-prep", {
        jobId: job.id,
        language,
      });
      const nextQuestions = normalizeInterviewQuestions(response.data?.questions);
      if (!nextQuestions) {
        setGenerationError(getInterviewPreparationError({ response: { status: 502 } }));
        return;
      }

      setQuestions(nextQuestions);
    } catch (error) {
      setGenerationError(getInterviewPreparationError(error));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="interview-prep-page">
      <header className="interview-prep-header">
        <span>Student tools</span>
        <h1>AI Mülakat Hazırlığı</h1>
        <p>Seçtiğiniz ilana göre üç örnek soru ve kısa hazırlık ipuçları oluşturun.</p>
      </header>

      {loading && <p className="interview-prep-state">İlan bilgileri yükleniyor...</p>}

      {!loading && loadError && (
        <section className="interview-prep-state interview-prep-error" role="alert">
          <p>{loadError}</p>
          <Link to="/student/jobs">İlanlara dön</Link>
        </section>
      )}

      {!loading && job && (
        <div className="interview-prep-layout">
          <aside className="interview-prep-job-card">
            <span>Seçilen ilan</span>
            <h2>{job.title}</h2>
            {job.location && <p className="interview-prep-location">{job.location}</p>}
            <p>{job.description}</p>
          </aside>

          <section className="interview-prep-workspace">
            <fieldset className="interview-prep-language">
              <legend>Soru dili</legend>
              <label>
                <input
                  type="radio"
                  name="interview-language"
                  value="tr"
                  checked={language === "tr"}
                  onChange={(event) => setLanguage(event.target.value)}
                />
                Türkçe
              </label>
              <label>
                <input
                  type="radio"
                  name="interview-language"
                  value="en"
                  checked={language === "en"}
                  onChange={(event) => setLanguage(event.target.value)}
                />
                English
              </label>
            </fieldset>

            <div className="interview-prep-notice">
              <p>
                Bu sorular AI tarafından oluşturulan örnek hazırlık sorularıdır;
                işverenin gerçek mülakat soruları olduğu garanti edilmez.
              </p>
              <p>
                İlanın başlığı, açıklaması ve konumu AI sağlayıcısına gönderilir.
                CV’niz ve kişisel hesap bilgileriniz gönderilmez.
              </p>
              <p>
                Başvuru mesajı ve mülakat hazırlığı ortak olarak 15 dakikada en
                fazla 5 AI isteği kullanır.
              </p>
            </div>

            <div className="interview-prep-actions">
              <button type="button" onClick={handleGenerate} disabled={generating}>
                {generating ? "Sorular oluşturuluyor..." : "3 soru oluştur"}
              </button>
              <Link to="/student/jobs">İlanlara dön</Link>
            </div>

            {generationError && (
              <p className="interview-prep-feedback" role="alert">{generationError}</p>
            )}

            {questions.length === 3 && (
              <div className="interview-question-list" aria-live="polite">
                {questions.map((item, index) => (
                  <article className="interview-question-card" key={`${index}-${item.question}`}>
                    <span>Soru {index + 1}</span>
                    <h2>{item.question}</h2>
                    <div className="interview-question-tip">
                      <strong>Hazırlık ipucu</strong>
                      <p>{item.tip}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
