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
      setError("Please select a PDF file.");
      return;
    }

    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("PDF file must be 5 MB or smaller.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setLoading(true);
      await api.post("/resumes/upload", formData);
      setMessage("Resume uploaded successfully ✅");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      if (typeof onUploadSuccess === "function") {
        await onUploadSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Resume upload failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-title">Upload Resume</div>

      <input
        className="upload-input"
        type="file"
        accept="application/pdf,.pdf"
        ref={fileInputRef}
        disabled={loading}
        onChange={(e) => setFile(e.target.files[0])}
      />

      <div className="upload-help">PDF only, maximum 5 MB.</div>

      <button
        type="button"
        className={`btn btn-primary upload-btn ${className}`.trim()}
        onClick={handleUpload}
        disabled={loading}
      >
        {loading ? "Uploading..." : "Upload Resume"}
      </button>


      {message && <div className="upload-success">{message}</div>}
      {error && <div className="upload-error">{error}</div>}
    </div>
  );
}
