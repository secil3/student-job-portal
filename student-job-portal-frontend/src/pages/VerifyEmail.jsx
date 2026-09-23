import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api";
import "../styles/VerifyEmail.css";

const readToken = () => {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  return fragment.get("token");
};

export default function VerifyEmail() {
  const location = useLocation();
  const [status, setStatus] = useState(readToken() ? "loading" : "waiting");
  const [message, setMessage] = useState(
    new URLSearchParams(location.search).get("sent") === "1"
      ? "ADÜ öğrenci e-posta adresinize bir doğrulama bağlantısı gönderdik."
      : "E-postanızdaki doğrulama bağlantısını açın veya yeni bir bağlantı isteyin."
  );
  const [email, setEmail] = useState(location.state?.email || "");
  const [resending, setResending] = useState(false);
  const requested = useRef(false);

  useEffect(() => {
    const token = readToken();
    if (!token || requested.current) return;
    requested.current = true;

    api.post("/auth/verify-email", { token })
      .then(() => {
        window.history.replaceState(null, "", "/verify-email");
        setStatus("success");
        setMessage("ADÜ öğrenci e-posta adresiniz başarıyla doğrulandı.");
      })
      .catch((error) => {
        setStatus(error.response?.status === 400 ? "invalid" : "error");
        setMessage(
          error.response?.status === 400
            ? "Bu doğrulama bağlantısı geçersiz, süresi dolmuş veya daha önce kullanılmış."
            : "E-postanız şu anda doğrulanamadı. Lütfen daha sonra tekrar deneyin."
        );
      });
  }, []);

  const handleResend = async (event) => {
    event.preventDefault();
    setResending(true);

    try {
      const response = await api.post("/auth/resend-verification", { email });
      setMessage(response.data.message);
      setStatus("waiting");
    } catch (error) {
      setMessage(
        error.response?.data?.message
          || "Doğrulama isteği tamamlanamadı. Lütfen daha sonra tekrar deneyin."
      );
      setStatus("error");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="verify-email-page">
      <section className="verify-email-card" aria-live="polite">
        <span className={`verify-email-badge verify-email-badge--${status}`}>
          {status === "success" ? "Doğrulandı" : "E-posta doğrulaması"}
        </span>
        <h1>Öğrenci e-postanızı doğrulayın</h1>
        <p>{status === "loading" ? "E-postanız doğrulanıyor..." : message}</p>

        {status !== "success" && status !== "loading" && (
          <form className="verify-email-form" onSubmit={handleResend}>
            <label htmlFor="verification-email">ADÜ öğrenci e-postası</label>
            <input
              id="verification-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ogrenci.no@stu.adu.edu.tr"
              autoComplete="email"
              required
            />
            <button type="submit" disabled={resending}>
              {resending ? "Gönderiliyor..." : "Doğrulama E-postasını Yeniden Gönder"}
            </button>
          </form>
        )}

        {status === "success" && <Link to="/login">Giriş Sayfasına Devam Et</Link>}
      </section>
    </main>
  );
}
