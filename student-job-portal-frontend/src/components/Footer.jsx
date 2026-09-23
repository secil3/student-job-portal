import { Link } from "react-router-dom";
import "../styles/Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* LEFT */}
        <div className="footer-brand">
          <h3>StudentJob</h3>
          <p>
            Öğrencileri ve işverenleri sade, verimli bir başvuru sürecinde
            buluşturan modern bir iş platformu.
          </p>
        </div>

        {/* CENTER */}
        <div className="footer-links">
          <h4>Platform</h4>
          <Link to="/">Ana Sayfa</Link>
          <Link to="/login">Giriş Yap</Link>
          <Link to="/register">Kayıt Ol</Link>
        </div>

        {/* RIGHT */}
        <div className="footer-links">
          <h4>Roller</h4>
          <span>Öğrenciler</span>
          <span>İşverenler</span>
          <span>Yönetici</span>
        </div>

      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} StudentJob. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}
