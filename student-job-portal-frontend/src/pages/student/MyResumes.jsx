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
      setError(e.response?.data?.message || "Failed to load resumes ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const deleteResume = async (id) => {
    if (!confirm("Delete this resume?")) return;
    setError("");
    try {
      await api.delete(`/resumes/${id}`);
      await fetchResumes();
    } catch (e) {
      setError(e.response?.data?.message || "Delete failed ❌");
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
      alert(e.response?.data?.message || "Rename failed ❌");
    }
  };

  const isPdf = (path = "") => path.toLowerCase().endsWith(".pdf");

  return (
    <div className="resumes-container">
      <div className="resumes-header">
        <span>Documents</span>
        <h2>My Resumes</h2>
        <p>Upload and manage the PDF CVs you use for job applications.</p>
      </div>

      <UploadResume onUploadSuccess={fetchResumes} />

      {loading && <p className="resumes-message">Loading resumes...</p>}
      {error && <p className="resumes-error">{error}</p>}

      {!loading && resumes.length === 0 && (
        <div className="resumes-empty">
          <p>No resumes uploaded.</p>
          <p className="muted">Use the PDF upload form above to add your first resume.</p>
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
                    {pdf ? "Open" : "Download"}
                  </ProtectedResumeButton>

                  <button
                    type="button"
                    className="btn btn-danger-outline"
                    onClick={() => deleteResume(r.id)}
                    title="Delete this resume"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="resume-hint">
                {pdf
                  ? "Tip: This PDF opens in a new tab."
                  : "Tip: Word files are downloaded to avoid leaving the app."}
              </div>

              <div className="resume-rename">
                <label htmlFor={`resume-name-${r.id}`}>Rename CV</label>
                <div className="resume-rename-controls">
                  <input
                    id={`resume-name-${r.id}`}
                    className="rename-input"
                    placeholder="Enter a new file name"
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
                    title="Rename this resume"
                  >
                    Rename
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
