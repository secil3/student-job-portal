import { Link } from "react-router-dom";
import digiPathLogo from "../assets/brand/LOGO-DigiPath.svg";
import "../styles/Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* LEFT */}
        <div className="footer-brand">
          <div className="footer-brand-lockup">
            <h3>StudentJob</h3>
            <span>by</span>
            <span className="footer-digipath-mark">
              <img src={digiPathLogo} alt="DigiPath" />
            </span>
          </div>
          <p>
            Öğrencileri ve işverenleri sade, verimli bir başvuru sürecinde
            buluşturan modern bir iş platformu.
          </p>
          <p className="footer-brand-relation">
            StudentJob, DigiPath tarafından geliştirilen bir üründür.
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
        © {new Date().getFullYear()} DigiPath. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}
