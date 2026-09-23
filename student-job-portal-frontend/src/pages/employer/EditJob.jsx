import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "../../styles/JobForm.css";

export default function EditJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    salary: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadJob = async () => {
      try {
        const response = await api.get("/jobs/employer");
        const job = response.data.find((item) => String(item.id) === String(jobId));

        if (!job) {
          setError("İlan bulunamadı veya düzenleme yetkiniz yok.");
          return;
        }

        setForm({
          title: job.title ?? "",
          description: job.description ?? "",
          location: job.location ?? "",
          salary: job.salary ?? "",
        });
      } catch (err) {
        setError(err.response?.data?.message || "İlan yüklenemedi ❌");
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [jobId]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    setError("");
    setSaving(true);
    try {
      await api.put(`/jobs/${jobId}`, form);
      navigate("/employer", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "İlan güncellenemedi ❌");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="jobform-container"><p>Yükleniyor...</p></div>;
  }

  return (
    <div className="jobform-container">
      <div className="jobform-card">
        <h2 className="jobform-title">İlanı Düzenle</h2>

        <form className="jobform" onSubmit={handleSubmit}>
          <input
            className="jobform-input"
            name="title"
            placeholder="İlan başlığı"
            value={form.title}
            required
            maxLength={255}
            onChange={handleChange}
          />

          <textarea
            className="jobform-textarea"
            name="description"
            placeholder="İlan açıklaması"
            value={form.description}
            required
            maxLength={65535}
            onChange={handleChange}
          />

          <input
            className="jobform-input"
            name="location"
            placeholder="Konum"
            value={form.location}
            required
            maxLength={100}
            onChange={handleChange}
          />

          <input
            className="jobform-input"
            name="salary"
            placeholder="Maaş"
            value={form.salary}
            maxLength={50}
            onChange={handleChange}
          />

          <button className="btn btn-primary" type="submit" disabled={saving || Boolean(error && !form.title)}>
            {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </button>
        </form>

        {error && <p className="jobform-error">{error}</p>}
      </div>
    </div>
  );
}
