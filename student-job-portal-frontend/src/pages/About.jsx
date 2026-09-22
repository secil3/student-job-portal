import { Link } from "react-router-dom";
import "../styles/PublicPages.css";

export default function About() {
  return (
    <div className="public-page">
      <header className="public-page-header">
        <span>StudentJob hakkında</span>
        <h1>Öğrenciler ve işverenler için daha açık bir yol.</h1>
        <p>
          StudentJob, öğrencilerin ilanları inceleyip hazır PDF CV’leriyle
          başvurduğu; işverenlerin ilan ve başvuruları yönettiği bir platformdur.
        </p>
      </header>

      <section aria-labelledby="about-flow-title">
        <h2 id="about-flow-title">Nasıl Çalışır?</h2>
        <div className="public-page-grid">
          <article className="public-page-card">
            <span>Öğrenciler için</span>
            <h3>Başvurularınızı tek yerden takip edin</h3>
            <ol>
              <li>ADÜ öğrenci e-postanızla kayıt olun ve adresinizi doğrulayın.</li>
              <li>İlanları inceleyin, hazır PDF CV’nizi yükleyip seçin.</li>
              <li>CV’nizle başvurun ve başvuru durumunuzu takip edin.</li>
            </ol>
          </article>
          <article className="public-page-card">
            <span>İşverenler için</span>
            <h3>İlan ve başvuruları yönetin</h3>
            <ol>
              <li>İşveren hesabınızı oluşturun ve yönetici onayını bekleyin.</li>
              <li>Onaydan sonra ilan yayınlayın.</li>
              <li>Başvuruları ve ilgili CV’leri inceleyip kabul veya ret kararı verin.</li>
            </ol>
          </article>
        </div>
      </section>
      <div className="public-page-actions">
        <Link to="/features">Özellikleri keşfet</Link>
        <Link to="/register">Kayıt Ol</Link>
        <Link to="/login">Giriş Yap</Link>
      </div>
    </div>
  );
}
