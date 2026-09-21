import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import {
  findAssistantJob,
  getAssistantRequestError,
  normalizeAssistantJobId,
} from "../../utils/aiAssistant";
import "../../styles/AiAssistant.css";

const MAX_NOTES_LENGTH = 1000;

export default function AiAssistant() {
  const { jobId: jobIdParam } = useParams();
  const jobId = normalizeAssistantJobId(jobIdParam);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notes, setNotes] = useState("");
  const [language, setLanguage] = useState("tr");
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

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
    setCopyStatus("");

    try {
      const response = await api.post("/ai/application-message", {
        jobId: job.id,
        notes,
        language,
      });
      const message = response.data?.message;

      if (typeof message !== "string" || message.trim().length === 0) {
        throw { response: { status: 502 } };
      }

      setDraft(message.trim());
    } catch (error) {
      setGenerationError(getAssistantRequestError(error));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    setCopyStatus("");
    try {
      if (!draft || !navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(draft);
      setCopyStatus("Metin panoya kopyalandı.");
    } catch {
      setCopyStatus("Metin kopyalanamadı. Lütfen metni seçip manuel olarak kopyalayın.");
    }
  };

  return (
    <div className="ai-assistant-page">
      <header className="ai-assistant-header">
        <span>Student tools</span>
        <h1>AI Application Assistant</h1>
        <p>İlana özel, düzenleyebileceğiniz kısa bir başvuru mesajı hazırlayın.</p>
      </header>

      {loading && <p className="ai-assistant-state">İlan bilgileri yükleniyor...</p>}

      {!loading && loadError && (
        <section className="ai-assistant-state ai-assistant-error" role="alert">
          <p>{loadError}</p>
          <Link to="/student/jobs">İlanlara dön</Link>
        </section>
      )}

      {!loading && job && (
        <div className="ai-assistant-layout">
          <aside className="ai-assistant-job-card">
            <span>Seçilen ilan</span>
            <h2>{job.title}</h2>
            <div className="ai-assistant-job-meta">
              {job.location && <span>{job.location}</span>}
              {job.salary && <span>{job.salary}</span>}
            </div>
            <p>{job.description}</p>
          </aside>

          <section className="ai-assistant-form-card">
            <div className="ai-assistant-field">
              <label htmlFor="assistant-notes">Başvurumda vurgulamak istediklerim</label>
              <textarea
                id="assistant-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={MAX_NOTES_LENGTH}
                rows={4}
                placeholder="İsteğe bağlı kısa notlarınızı yazın. Yalnızca doğru bilgileri paylaşın."
              />
              <small>{notes.length}/{MAX_NOTES_LENGTH} karakter</small>
            </div>

            <fieldset className="ai-assistant-language">
              <legend>Mesaj dili</legend>
              <label>
                <input
                  type="radio"
                  name="assistant-language"
                  value="tr"
                  checked={language === "tr"}
                  onChange={(event) => setLanguage(event.target.value)}
                />
                Türkçe
              </label>
              <label>
                <input
                  type="radio"
                  name="assistant-language"
                  value="en"
                  checked={language === "en"}
                  onChange={(event) => setLanguage(event.target.value)}
                />
                English
              </label>
            </fieldset>

            <p className="ai-assistant-disclosure">
              İlan bilgileri ve buraya yazdığınız notlar mesaj oluşturmak için AI
              sağlayıcısına gönderilir. CV’niz gönderilmez.
            </p>

            <button
              type="button"
              className="ai-assistant-generate"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? "Mesaj oluşturuluyor..." : "Mesaj oluştur"}
            </button>

            {generationError && (
              <p className="ai-assistant-feedback error" role="alert">{generationError}</p>
            )}

            {draft && (
              <div className="ai-assistant-result">
                <label htmlFor="assistant-draft">Oluşturulan mesaj</label>
                <textarea
                  id="assistant-draft"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={8}
                />
                <p>
                  Oluşturduğunuz mesaj başvurunuza otomatik eklenmez veya işverene
                  gönderilmez. Kullanmadan önce metni dikkatle kontrol edin.
                </p>
                <div className="ai-assistant-result-actions">
                  <button type="button" onClick={handleCopy}>Metni kopyala</button>
                  <Link to="/student/jobs">İlanlara dön</Link>
                </div>
                {copyStatus && (
                  <p className="ai-assistant-feedback" role="status">{copyStatus}</p>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
