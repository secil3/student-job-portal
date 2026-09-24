import "../styles/DemoBanner.css";

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

export default function DemoBanner() {
  if (!isDemoMode) return null;

  return (
    <aside className="demo-banner" role="status">
      <strong>Demo Sürümü</strong>
      <span aria-hidden="true">—</span>
      <span>
        Bu platformdaki kullanıcı, şirket, ilan, CV ve başvuru bilgileri
        tanıtım amacıyla oluşturulmuş kurgusal verilerdir.
      </span>
    </aside>
  );
}
