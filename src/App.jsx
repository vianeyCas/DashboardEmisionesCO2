
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import "./App.css";

function App() {
  return (
    <div className="app-container">

      <Sidebar />

      <main className="main-content">

        <header className="top-header">
          <div>
            <span className="breadcrumb">
              ANÁLISIS AMBIENTAL / RESUMEN
            </span>

            <h1>Huella de carbono</h1>

            <p>
              ¿Quién contamina más? Análisis global de emisiones de CO₂.
            </p>
          </div>

          <div className="header-period">
            <span>PERIODO DE ANÁLISIS</span>
            <strong>2010 — 2023</strong>
          </div>
        </header>

        <Dashboard />

      </main>

    </div>
  );
}

export default App;
