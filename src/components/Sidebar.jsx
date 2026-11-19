
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Globe2,
  BarChart3,
  TrendingUp,
  Table2,
  Info
} from "lucide-react";

const menuItems = [
  { id: "resumen", name: "Resumen general", icon: LayoutDashboard },
  { id: "emisiones-pais", name: "Emisiones por país", icon: Globe2 },
  { id: "evolucion", name: "Evolución histórica", icon: TrendingUp },
  { id: "comparacion", name: "Comparación", icon: BarChart3 },
  { id: "datos-detallados", name: "Datos detallados", icon: Table2 },
  { id: "acerca", name: "Acerca del proyecto", icon: Info }
];

function Sidebar() {
  const [activeSection, setActiveSection] = useState("resumen");

  useEffect(() => {
    const sections = menuItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              b.intersectionRatio - a.intersectionRatio
          );

        if (visibleSections.length > 0) {
          setActiveSection(visibleSections[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: "-15% 0px -65% 0px",
        threshold: [0, 0.1, 0.25, 0.5]
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Globe2 size={24} strokeWidth={1.8} />
        </div>

        <div className="brand-text">
          <h2>Huella de carbono</h2>
          <span>ANÁLISIS GLOBAL DE CO₂</span>
        </div>
      </div>

      <div className="sidebar-section">
        <span className="section-label">MENÚ PRINCIPAL</span>

        <nav aria-label="Menú principal">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <a
                href={`#${item.id}`}
                key={item.id}
                className={`menu-item ${
                  activeSection === item.id ? "active" : ""
                }`}
                aria-current={
                  activeSection === item.id ? "location" : undefined
                }
                onClick={() => setActiveSection(item.id)}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.name}</span>
              </a>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <span className="status-dot"></span>
        <span>Datos: Our World in Data</span>
      </div>
    </aside>
  );
}

export default Sidebar;
