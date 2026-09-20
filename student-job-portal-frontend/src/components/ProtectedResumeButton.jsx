import { useState } from "react";
import api from "../services/api";

export default function ProtectedResumeButton({
  resumeId,
  fileName,
  download = false,
  children,
  className = "resume-link",
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/resumes/${resumeId}/file`, {
        responseType: "blob",
      });
      const objectUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.rel = "noopener noreferrer";

      if (download) {
        link.download = fileName || "resume";
      } else {
        link.target = "_blank";
      }

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to open resume");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
