
import {
  LayoutDashboard,
  Globe2,
  BarChart3,
  TrendingUp,
  Table2,
  Info
} from "lucide-react";

const menuItems = [
  { name: "Resumen general", icon: LayoutDashboard },
  { name: "Emisiones por país", icon: Globe2 },
  { name: "Evolución histórica", icon: TrendingUp },
  { name: "Comparación", icon: BarChart3 },
  { name: "Datos detallados", icon: Table2 },
  { name: "Acerca del proyecto", icon: Info }
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Globe2 size={25} />
        </div>

        <div>
          <h2>Huella de carbono</h2>
          <span>ANÁLISIS GLOBAL DE CO₂</span>
        </div>
      </div>

      <div className="sidebar-section">
        <span className="section-label">MENÚ PRINCIPAL</span>

        <nav>
          {menuItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <a
                href="#"
                key={item.name}
                className={`menu-item ${index === 0 ? "active" : ""}`}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </a>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="status-dot"></div>
        <span>Datos: Our World in Data</span>
      </div>
    </aside>
  );
}

export default Sidebar;
