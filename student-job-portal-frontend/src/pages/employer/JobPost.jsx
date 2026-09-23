import { useState } from "react";
import api from "../../services/api";
import "../../styles/JobForm.css";

export default function JobPost() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await api.post("/jobs", {
        title,
        description,
        location,
        salary,
      });

      setMessage("İlan başarıyla yayınlandı ✅");
      setTitle("");
      setDescription("");
      setLocation("");
      setSalary("");
    } catch (err) {
      setError(err.response?.data?.message || "İlan yayınlanamadı ❌");
    }
  };

  return (
    <div className="jobform-container jobpost-page">
      <div className="jobform-card">
        <h2 className="jobform-title">Yeni İlan Oluştur</h2>
        <p className="jobform-intro">Pozisyon ayrıntılarını öğrencilerle paylaşın.</p>

        <form className="jobform" onSubmit={handleSubmit}>
          <label className="jobform-field">
            <span>İlan başlığı</span>
            <input
              className="jobform-input"
              placeholder="Örn. Junior Ürün Tasarımcısı"
              value={title}
              required
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="jobform-field">
            <span>Açıklama</span>
            <textarea
              className="jobform-textarea"
              placeholder="Pozisyonu ve temel sorumlulukları açıklayın"
              value={description}
              required
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div className="jobform-row">
            <label className="jobform-field">
              <span>Konum</span>
              <input
                className="jobform-input"
                placeholder="Örn. Uzaktan"
                value={location}
                required
                onChange={(e) => setLocation(e.target.value)}
              />
            </label>

            <label className="jobform-field">
              <span>Maaş</span>
              <input
                className="jobform-input"
                placeholder="İsteğe bağlı"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
              />
            </label>
          </div>

          <div className="jobform-actions">
            <button className="btn btn-primary" type="submit">
              İlanı Yayınla
            </button>
          </div>
        </form>

        {message && <p className="jobform-success">{message}</p>}
        {error && <p className="jobform-error">{error}</p>}
      </div>
    </div>
  );
}
