import { Link } from "react-router-dom";
import "../styles/NotFound.css";

export default function NotFound() {
  return (
    <div className="not-found-page">
      <section className="not-found-card" aria-labelledby="not-found-title">
        <span className="not-found-code">404</span>
        <h1 id="not-found-title">Sayfa bulunamadı</h1>
        <p>
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <Link to="/" className="not-found-link">
          Ana Sayfaya Dön
        </Link>
      </section>
    </div>
  );
}
