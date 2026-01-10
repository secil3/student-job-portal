import { useEffect, useState } from "react";
import api from "../../services/api";
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
    try {
      await api.delete(`/resumes/${id}`);
      fetchResumes();
    } catch (e) {
      alert(e.response?.data?.message || "Delete failed ❌");
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

  // ✅ IMPORTANT: uploads are served by BACKEND, not by Vite (5173)
  // Put your backend url here if different (e.g. http://localhost:5000)
  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5050";

  const fileUrl = (path = "") => {
    // already full url
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    // ensure /uploads/... works
    return `${BACKEND_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  return (
    <div className="resumes-container">
      <div className="resumes-header">
        <h2>My Resumes</h2>
        <p>Open, rename, download, or delete your uploaded resumes.</p>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="resumes-error">{error}</p>}

      {!loading && resumes.length === 0 && (
        <div className="resumes-empty">
          <p>No resumes uploaded.</p>
          <p className="muted">Upload one from your Profile page (Resume section).</p>
        </div>
      )}

      {!loading &&
        resumes.map((r) => {
          const canRename = (renameMap[r.id] || "").trim().length > 0;
          const pdf = isPdf(r.file_path);
          const url = fileUrl(r.file_path);

          return (
            <div key={r.id} className="resume-card">
              <div className="resume-row">
                {/* File name click: PDF => open new tab, others => download */}
                {pdf ? (
                  <a
                    className="resume-link"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open this resume in a new tab"
                  >
                    <span className="resume-icon">📄</span>
                    <span className="resume-name">{r.name}</span>
                  </a>
                ) : (
                  <a
                    className="resume-link"
                    href={url}
                    download
                    title="Download this resume"
                  >
                    <span className="resume-icon">📄</span>
                    <span className="resume-name">{r.name}</span>
                  </a>
                )}

                <div className="resume-actions">
                  {pdf ? (
                    <a
                      className="btn btn-secondary-soft btn-link"
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open this resume"
                    >
                      Open
                    </a>
                  ) : (
                    <a
                      className="btn btn-secondary-soft btn-link"
                      href={url}
                      download
                      title="Download this resume"
                    >
                      Download
                    </a>
                  )}

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
                <input
                  className="rename-input"
                  placeholder="Type a new name..."
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
          );
        })}
    </div>
  );
}
