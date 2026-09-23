import { useRef, useState } from "react";
import api from "../../services/api";
import "../../styles/UploadResume.css";

export default function UploadResume({ onUploadSuccess, className = "" }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async () => {
    setMessage("");
    setError("");

    if (!file) {
      setError("Lütfen bir PDF dosyası seçin.");
      return;
    }

    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Yalnızca PDF dosyaları kabul edilir.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("PDF dosyası en fazla 5 MB olmalıdır.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setLoading(true);
      await api.post("/resumes/upload", formData);
      setMessage("CV başarıyla yüklendi ✅");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      if (typeof onUploadSuccess === "function") {
        await onUploadSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || "CV yüklenemedi ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-heading">
        <div className="upload-title">PDF CV Yükle</div>
        <div className="upload-help">Yalnızca PDF · En fazla 5 MB</div>
      </div>

      <div className="upload-controls">
        <input
          className="upload-input"
          type="file"
          accept="application/pdf,.pdf"
          ref={fileInputRef}
          disabled={loading}
          aria-label="Yüklenecek PDF CV’yi seçin"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          type="button"
          className={`upload-btn ${className}`.trim()}
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? "Yükleniyor..." : "CV Yükle"}
        </button>
      </div>


      {message && <div className="upload-success">{message}</div>}
      {error && <div className="upload-error">{error}</div>}
    </div>
  );
}
