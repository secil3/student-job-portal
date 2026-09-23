import { useEffect, useState } from "react";
import api from "../../services/api";
import ProtectedResumeButton from "../../components/ProtectedResumeButton";
import UploadResume from "./UploadResume";
import "../../styles/MyResumes.css";

export default function MyResumes() {
  const [resumes, setResumes] = useState([]);
  const [renameMap, setRenameMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchResumes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/resumes");
      setResumes(res.data || []);
    } catch (e) {
      setError(e.response?.data?.message || "CV’ler yüklenemedi ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const deleteResume = async (id) => {
    if (!confirm("Bu CV silinsin mi?")) return;
    setError("");
    try {
      await api.delete(`/resumes/${id}`);
      await fetchResumes();
    } catch (e) {
      setError(e.response?.data?.message || "Silme işlemi başarısız ❌");
    }
  };

  const renameResume = async (id) => {
    const newName = (renameMap[id] || "").trim();
    if (!newName) return;

    try {
      await api.patch(`/resumes/${id}`, { name: newName });
      setRenameMap((prev) => ({ ...prev, [id]: "" }));
      fetchResumes();
    } catch (e) {
      alert(e.response?.data?.message || "Yeniden adlandırma başarısız ❌");
    }
  };

  const isPdf = (path = "") => path.toLowerCase().endsWith(".pdf");

  return (
    <div className="resumes-container">
      <div className="resumes-header">
        <span>Belgeler</span>
        <h2>CV’lerim</h2>
        <p>İş başvurularınızda kullandığınız PDF CV’leri yükleyin ve yönetin.</p>
      </div>

      <UploadResume onUploadSuccess={fetchResumes} />

      {loading && <p className="resumes-message">CV’ler yükleniyor...</p>}
      {error && <p className="resumes-error">{error}</p>}

      {!loading && resumes.length === 0 && (
        <div className="resumes-empty">
          <p>Henüz CV yüklenmedi.</p>
          <p className="muted">İlk CV’nizi eklemek için yukarıdaki PDF yükleme formunu kullanın.</p>
        </div>
      )}

      {!loading &&
        <div className="resumes-list">
          {resumes.map((r) => {
          const canRename = (renameMap[r.id] || "").trim().length > 0;
          const pdf = isPdf(r.file_path);

          return (
            <article key={r.id} className="resume-card">
              <div className="resume-row">
                <ProtectedResumeButton
                  resumeId={r.id}
                  fileName={r.name}
                  download={!pdf}
                >
                  <span className="resume-icon">📄</span>
                  <span className="resume-name">{r.name}</span>
                </ProtectedResumeButton>

                <div className="resume-actions">
                  <ProtectedResumeButton
                    resumeId={r.id}
                    fileName={r.name}
                    download={!pdf}
                    className="btn btn-secondary-soft btn-link"
                  >
                    {pdf ? "Aç" : "İndir"}
                  </ProtectedResumeButton>

                  <button
                    type="button"
                    className="btn btn-danger-outline"
                    onClick={() => deleteResume(r.id)}
                    title="Bu CV’yi sil"
                  >
                    Sil
                  </button>
                </div>
              </div>

              <div className="resume-hint">
                {pdf
                  ? "İpucu: Bu PDF yeni bir sekmede açılır."
                  : "İpucu: Uygulamadan ayrılmamanız için Word dosyaları indirilir."}
              </div>

              <div className="resume-rename">
                <label htmlFor={`resume-name-${r.id}`}>CV’yi yeniden adlandır</label>
                <div className="resume-rename-controls">
                  <input
                    id={`resume-name-${r.id}`}
                    className="rename-input"
                    placeholder="Yeni bir dosya adı girin"
                    value={renameMap[r.id] || ""}
                    onChange={(e) =>
                      setRenameMap((prev) => ({ ...prev, [r.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") renameResume(r.id);
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => renameResume(r.id)}
                    className="btn btn-primary-soft"
                    disabled={!canRename}
                    title="Bu CV’yi yeniden adlandır"
                  >
                    Yeniden Adlandır
                  </button>
                </div>
              </div>
            </article>
          );
          })}
        </div>}
    </div>
  );
}
