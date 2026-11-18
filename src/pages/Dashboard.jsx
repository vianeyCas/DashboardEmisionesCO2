
import { useEffect, useMemo, useState } from "react";
import MapaEmisiones from "../components/MapaEmisiones";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

import {
  Globe,
  TrendingUp,
  Flag,
  Activity,
  CalendarDays,
  ChevronDown
} from "lucide-react";

const API = "http://localhost:3001/api/emisiones";

const nombresPaises = {
  "United States": "Estados Unidos",
  "United States of America": "Estados Unidos",
  Russia: "Rusia",
  Japan: "Japón",
  China: "China",
  India: "India",
  "Estados Unidos": "Estados Unidos"
};

const coloresLineas = [
  "#28765B",
  "#06A6A6",
  "#D97757",
  "#6477C8",
  "#9B59B6"
];

function nombreEnEspanol(nombre) {
  return nombresPaises[nombre] || nombre;
}

function convertirAGigatoneladas(valor) {
  return (Number(valor) / 1000000000).toFixed(2);
}

function Dashboard() {
  // ========================================
  // DATOS GENERALES
  // ========================================

  const [anios, setAnios] = useState([]);
  const [anio, setAnio] = useState("");

  const [resumen, setResumen] = useState(null);
  const [topPaises, setTopPaises] = useState([]);
  const [evolucion, setEvolucion] = useState([]);

  // ========================================
  // PAÍSES Y FILTROS
  // ========================================

  const [paises, setPaises] = useState([]);
  const [paisesSeleccionados, setPaisesSeleccionados] = useState([]);
  const [filtroAbierto, setFiltroAbierto] = useState(false);

  // ========================================
  // DATOS DE ANÁLISIS
  // ========================================

  const [comparacion, setComparacion] = useState([]);
  const [variaciones, setVariaciones] = useState([]);
  const [detalle, setDetalle] = useState([]);

  // ========================================
  // PAGINACIÓN DE LA TABLA
  // ========================================

  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  // ========================================
  // ESTADOS DE CARGA
  // ========================================

  const [cargando, setCargando] = useState(true);
  const [cargandoEvolucion, setCargandoEvolucion] = useState(true);
  const [cargandoPaises, setCargandoPaises] = useState(true);
  const [cargandoComparacion, setCargandoComparacion] = useState(false);
  const [cargandoVariaciones, setCargandoVariaciones] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // ========================================
  // ESTADOS DE ERROR
  // ========================================

  const [error, setError] = useState("");
  const [errorEvolucion, setErrorEvolucion] = useState("");
  const [errorPaises, setErrorPaises] = useState("");
  const [errorComparacion, setErrorComparacion] = useState("");
  const [errorVariaciones, setErrorVariaciones] = useState("");
  const [errorDetalle, setErrorDetalle] = useState("");

  // ========================================
  // CÓDIGOS SELECCIONADOS
  // ========================================

  const codigosQuery = useMemo(
    () => paisesSeleccionados.join(","),
    [paisesSeleccionados]
  );

  // ========================================
  // DATOS DE PAGINACIÓN
  // ========================================

  const totalRegistros = detalle.length;

  const totalPaginas = Math.ceil(
    totalRegistros / registrosPorPagina
  );

  const indiceInicial = (paginaActual - 1) * registrosPorPagina;

  const indiceFinal = indiceInicial + registrosPorPagina;

  const registrosPaginados = detalle.slice(
    indiceInicial,
    indiceFinal
  );

  // ========================================
  // OBTENER AÑOS DISPONIBLES
  // ========================================

  useEffect(() => {
    const obtenerAnios = async () => {
      try {
        const respuesta = await fetch(`${API}/anios`);

        if (!respuesta.ok) {
          throw new Error("No se pudieron obtener los años");
        }

        const datos = await respuesta.json();

        setAnios(datos);

        if (datos.length > 0) {
          setAnio(String(Math.max(...datos)));
        }
      } catch (error) {
        console.error(error);
        setError("No se pudieron cargar los años disponibles.");
        setCargando(false);
      }
    };

    obtenerAnios();
  }, []);

  // ========================================
  // OBTENER PAÍSES DISPONIBLES
  // ========================================

  useEffect(() => {
    const controlador = new AbortController();

    const obtenerPaises = async () => {
      try {
        setCargandoPaises(true);
        setErrorPaises("");

        const respuesta = await fetch(`${API}/paises`, {
          signal: controlador.signal
        });

        if (!respuesta.ok) {
          throw new Error("No se pudieron obtener los países");
        }

        const datos = await respuesta.json();

        setPaises(
          datos.map((pais) => ({
            ...pais,
            entity: nombreEnEspanol(pais.entity)
          }))
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          setErrorPaises("No se pudieron cargar los países disponibles.");
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargandoPaises(false);
        }
      }
    };

    obtenerPaises();

    return () => controlador.abort();
  }, []);

  // ========================================
  // OBTENER RESUMEN Y RANKING
  // ========================================

  useEffect(() => {
    if (!anio) return;

    const controlador = new AbortController();

    const obtenerDatos = async () => {
      try {
        setCargando(true);
        setError("");

        const parametros = new URLSearchParams();
        parametros.set("anio", anio);

        if (codigosQuery) {
          parametros.set("codigos", codigosQuery);
        }

        const [respuestaResumen, respuestaTop] = await Promise.all([
          fetch(`${API}/resumen?${parametros.toString()}`, {
            signal: controlador.signal
          }),
          fetch(`${API}/top-paises?${parametros.toString()}`, {
            signal: controlador.signal
          })
        ]);

        if (!respuestaResumen.ok || !respuestaTop.ok) {
          throw new Error("No fue posible consultar los datos");
        }

        const datosResumen = await respuestaResumen.json();
        const datosTop = await respuestaTop.json();

        setResumen(datosResumen);

        setTopPaises(
          datosTop.map((pais) => ({
            ...pais,
            entity: nombreEnEspanol(pais.entity),
            emisiones_gt:
              Number(pais.emissions_total) / 1000000000
          }))
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          setError("No se pudieron cargar los datos del dashboard.");
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    };

    obtenerDatos();

    return () => controlador.abort();
  }, [anio, codigosQuery]);

  // ========================================
  // OBTENER EVOLUCIÓN HISTÓRICA
  // ========================================

  useEffect(() => {
    if (!anio) return;

    const controlador = new AbortController();

    const obtenerEvolucion = async () => {
      try {
        setCargandoEvolucion(true);
        setErrorEvolucion("");

        const parametros = new URLSearchParams();

        if (codigosQuery) {
          parametros.set("codigos", codigosQuery);
        }

        const respuesta = await fetch(
          `${API}/evolucion?${parametros.toString()}`,
          { signal: controlador.signal }
        );

        if (!respuesta.ok) {
          throw new Error("No se pudo obtener la evolución histórica");
        }

        const datos = await respuesta.json();

        if (codigosQuery) {
          const agrupados = {};

          datos.forEach((registro) => {
            const anioRegistro = Number(registro.year);
            const codigo = registro.code;

            if (!agrupados[anioRegistro]) {
              agrupados[anioRegistro] = {
                year: anioRegistro
              };
            }

            agrupados[anioRegistro][codigo] =
              Number(registro.total_emisiones) / 1000000000;
          });

          setEvolucion(
            Object.values(agrupados).sort(
              (a, b) => a.year - b.year
            )
          );
        } else {
          setEvolucion(
            datos.map((registro) => ({
              ...registro,
              year: Number(registro.year),
              emisiones_gt:
                Number(registro.total_emisiones) / 1000000000
            }))
          );
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          setErrorEvolucion("No se pudo cargar la evolución histórica.");
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargandoEvolucion(false);
        }
      }
    };

    obtenerEvolucion();

    return () => controlador.abort();
  }, [codigosQuery, anio]);

  // ========================================
  // OBTENER COMPARACIÓN ENTRE PAÍSES
  // ========================================

  useEffect(() => {
    if (!anio || paisesSeleccionados.length < 2) {
      setComparacion([]);
      setCargandoComparacion(false);
      setErrorComparacion("");
      return;
    }

    const controlador = new AbortController();

    const obtenerComparacion = async () => {
      try {
        setCargandoComparacion(true);
        setErrorComparacion("");

        const parametros = new URLSearchParams({
          codigos: codigosQuery,
          anio
        });

        const respuesta = await fetch(
          `${API}/comparacion?${parametros.toString()}`,
          { signal: controlador.signal }
        );

        if (!respuesta.ok) {
          throw new Error("No se pudo obtener la comparación");
        }

        const datos = await respuesta.json();

        setComparacion(
          datos
            .filter(
              (pais) => Number(pais.year) === Number(anio)
            )
            .map((pais) => ({
              ...pais,
              entity: nombreEnEspanol(pais.entity),
              emisiones_gt:
                Number(pais.emissions_total) / 1000000000
            }))
            .sort((a, b) => b.emisiones_gt - a.emisiones_gt)
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          setErrorComparacion("No se pudo cargar la comparación.");
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargandoComparacion(false);
        }
      }
    };

    obtenerComparacion();

    return () => controlador.abort();
  }, [anio, codigosQuery, paisesSeleccionados.length]);

  // ========================================
  // OBTENER VARIACIONES PORCENTUALES
  // ========================================

  useEffect(() => {
    if (!anio) return;

    const controlador = new AbortController();

    const obtenerVariaciones = async () => {
      try {
        setCargandoVariaciones(true);
        setErrorVariaciones("");

        const parametros = new URLSearchParams();
        parametros.set("anio", anio);

        if (codigosQuery) {
          parametros.set("codigos", codigosQuery);
        }

        const respuesta = await fetch(
          `${API}/variaciones?${parametros.toString()}`,
          { signal: controlador.signal }
        );

        if (!respuesta.ok) {
          throw new Error("No se pudieron obtener las variaciones");
        }

        const datos = await respuesta.json();

        setVariaciones(
          datos.map((registro) => ({
            ...registro,
            entity: nombreEnEspanol(registro.entity),
            variacion_porcentual:
              Number(registro.variacion_porcentual)
          }))
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          setErrorVariaciones("No se pudieron cargar las variaciones.");
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargandoVariaciones(false);
        }
      }
    };

    obtenerVariaciones();

    return () => controlador.abort();
  }, [anio, codigosQuery]);

  // ========================================
  // OBTENER TABLA DE DETALLE
  // ========================================

  useEffect(() => {
    if (!anio) return;

    const controlador = new AbortController();

    const obtenerDetalle = async () => {
      try {
        setCargandoDetalle(true);
        setErrorDetalle("");

        const parametros = new URLSearchParams();
        parametros.set("anio", anio);

        if (codigosQuery) {
          parametros.set("codigos", codigosQuery);
        }

        const respuesta = await fetch(
          `${API}/detalle?${parametros.toString()}`,
          { signal: controlador.signal }
        );

        if (!respuesta.ok) {
          throw new Error("No se pudo obtener el detalle");
        }

        const datos = await respuesta.json();

        setDetalle(
          datos.map((registro) => ({
            ...registro,
            entity: nombreEnEspanol(registro.entity),
            emisiones_gt:
              Number(registro.emissions_total) / 1000000000,
            variacion_porcentual:
              registro.variacion_porcentual == null
                ? null
                : Number(registro.variacion_porcentual)
          }))
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          setErrorDetalle("No se pudo cargar la tabla de emisiones.");
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargandoDetalle(false);
        }
      }
    };

    obtenerDetalle();

    return () => controlador.abort();
  }, [anio, codigosQuery]);

  // ========================================
  // REINICIAR PAGINACIÓN CUANDO CAMBIAN LOS DATOS
  // ========================================

  useEffect(() => {
    setPaginaActual(1);
  }, [anio, codigosQuery]);

  // ========================================
  // MANEJAR SELECCIÓN DE PAÍSES
  // ========================================

  const manejarSeleccionPais = (codigo) => {
    setErrorComparacion("");

    setPaisesSeleccionados((seleccionActual) => {
      const yaSeleccionado = seleccionActual.includes(codigo);

      if (yaSeleccionado) {
        return seleccionActual.filter(
          (item) => item !== codigo
        );
      }

      if (seleccionActual.length >= 5) {
        setErrorComparacion(
          "Puedes seleccionar un máximo de 5 países."
        );

        return seleccionActual;
      }

      return [...seleccionActual, codigo];
    });
  };

  // ========================================
  // LIMPIAR SELECCIÓN
  // ========================================

  const limpiarSeleccion = () => {
    setPaisesSeleccionados([]);
    setErrorComparacion("");
  };

  // ========================================
  // NOMBRES DE PAÍSES SELECCIONADOS
  // ========================================

  const nombresSeleccionados = paises
    .filter((pais) => paisesSeleccionados.includes(pais.code))
    .map((pais) => pais.entity);

  // ========================================
  // DATOS PARA VARIACIONES
  // ========================================

  const incrementos = variaciones
    .filter((registro) => registro.tipo === "incremento")
    .sort(
      (a, b) =>
        b.variacion_porcentual - a.variacion_porcentual
    );

  const reducciones = variaciones
    .filter((registro) => registro.tipo === "reduccion")
    .sort(
      (a, b) =>
        a.variacion_porcentual - b.variacion_porcentual
    );

  const datosVariaciones = [...incrementos, ...reducciones];

  // ========================================
  // DATOS PARA LA COMPARACIÓN
  // ========================================

  const datosComparacion =
    paisesSeleccionados.length === 0
      ? topPaises
      : comparacion;

  const puedeMostrarComparacion =
    paisesSeleccionados.length === 0 ||
    paisesSeleccionados.length >= 2;

  // ========================================
  // INDICADORES KPI
  // ========================================

  const indicadores = resumen
    ? [
        {
          titulo: codigosQuery
            ? "Emisiones seleccionadas"
            : "Emisiones mundiales",
          valor: `${convertirAGigatoneladas(
            resumen.total_emisiones
          )} Gt`,
          descripcion: `Total registrado en ${anio}`,
          icono: Globe,
          clase: "green"
        },
        {
          titulo: "Principal emisor",
          valor: nombreEnEspanol(resumen.pais_mayor_emisor),
          descripcion: `${convertirAGigatoneladas(
            resumen.emisiones_mayor_emisor
          )} Gt de CO₂`,
          icono: Flag,
          clase: "blue"
        },
        {
          titulo: "Variación anual",
          valor:
            resumen.variacion_porcentual === null
              ? "Sin datos"
              : `${resumen.variacion_porcentual >= 0 ? "+" : ""}${Number(
                  resumen.variacion_porcentual
                ).toFixed(2)}%`,
          descripcion: "Respecto al año anterior",
          icono: TrendingUp,
          clase: "orange"
        },
        {
          titulo: "Países analizados",
          valor: resumen.total_paises,
          descripcion: codigosQuery
            ? "Entidades seleccionadas"
            : "Entidades a nivel mundial",
          icono: Activity,
          clase: "purple"
        }
      ]
    : [];

  // ========================================
  // PAÍSES PARA LAS LÍNEAS DE EVOLUCIÓN
  // ========================================

  const paisesDeEvolucion = paisesSeleccionados.map((codigo) => {
    const pais = paises.find((item) => item.code === codigo);

    return {
      codigo,
      nombre: pais?.entity || codigo
    };
  });

  // ========================================
  // RENDERIZADO
  // ========================================

  return (
    <section className="dashboard-content">

      {/* FILTROS GLOBALES */}

      <div className="dashboard-filters">

        <div className="filter-label">
          <CalendarDays size={18} />
          <span>Filtros de análisis</span>
        </div>

        <div className="global-filters-grid">

          {/* FILTRO DE AÑO */}

          <div className="filter-control">
            <label htmlFor="filtro-anio">
              Periodo de análisis
            </label>

            <select
              id="filtro-anio"
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              disabled={anios.length === 0}
            >
              {anios.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* FILTRO DESPLEGABLE DE PAÍSES */}

          <div className="filter-control country-filter">

            <label>Países para analizar (opcional)</label>

            <div className="selectBox">
              <button
                type="button"
                className="country-filter-button"
                onClick={() => setFiltroAbierto(!filtroAbierto)}
                disabled={cargandoPaises}
                aria-expanded={filtroAbierto}
              >
                <span>
                  {cargandoPaises
                    ? "Cargando países..."
                    : paisesSeleccionados.length === 0
                      ? "Todos los países"
                      : `${paisesSeleccionados.length} países seleccionados`}
                </span>

                <ChevronDown
                  size={18}
                  className={filtroAbierto ? "chevron-open" : ""}
                />
              </button>

              {filtroAbierto && (
                <div className="country-filter-menu">

                  <div className="country-filter-heading">
                    <span>Selecciona los países</span>
                    <span>{paisesSeleccionados.length}/5</span>
                  </div>

                  <div className="country-filter-options">
                    {paises.map((pais) => (
                      <label
                        className="country-filter-option"
                        key={pais.code}
                      >
                        <input
                          type="checkbox"
                          checked={paisesSeleccionados.includes(pais.code)}
                          onChange={() => manejarSeleccionPais(pais.code)}
                          disabled={
                            !paisesSeleccionados.includes(pais.code) &&
                            paisesSeleccionados.length >= 5
                          }
                        />

                        <span>{pais.entity}</span>
                      </label>
                    ))}
                  </div>

                  <div className="country-filter-footer">
                    <button
                      type="button"
                      onClick={limpiarSeleccion}
                    >
                      Limpiar selección
                    </button>

                    <button
                      type="button"
                      onClick={() => setFiltroAbierto(false)}
                    >
                      Cerrar
                    </button>
                  </div>

                </div>
              )}
            </div>

            <span className="filter-help">
              {codigosQuery
                ? "Las visualizaciones muestran los países seleccionados."
                : "Sin selección se muestran los datos mundiales."}
            </span>

          </div>

        </div>

        {nombresSeleccionados.length > 0 && (
          <div className="selected-countries">
            {nombresSeleccionados.map((nombre, index) => (
              <span className="selected-country-chip" key={index}>
                {nombre}
              </span>
            ))}
          </div>
        )}

        {errorPaises && (
          <div className="error-message">{errorPaises}</div>
        )}

        {errorComparacion && (
          <div className="error-message">{errorComparacion}</div>
        )}

      </div>

      {/* MENSAJES DE ESTADO */}

      {error && (
        <div className="error-message">{error}</div>
      )}

      {cargando && (
        <p className="loading-message">
          Actualizando información...
        </p>
      )}

      {!cargando && !error && resumen && (
        <>

          {/* TARJETAS KPI */}

          <div className="kpi-grid">
            {indicadores.map((indicador, index) => {
              const Icono = indicador.icono;

              return (
                <article className="kpi-card" key={index}>
                  <div className="kpi-card-header">
                    <span className="kpi-title">
                      {indicador.titulo}
                    </span>

                    <div className={`kpi-icon ${indicador.clase}`}>
                      <Icono size={20} />
                    </div>
                  </div>

                  <h2 className="kpi-value">
                    {indicador.valor}
                  </h2>

                  <p className="kpi-description">
                    {indicador.descripcion}
                  </p>
                </article>
              );
            })}
          </div>

          {/* VISUALIZACIÓN PRINCIPAL */}

          <div className="primary-grid">

            {/* MAPA */}

            <div className="primary-map">
              <MapaEmisiones
                anio={anio}
                codigos={paisesSeleccionados}
              />
            </div>

            {/* RANKING */}

            <article className="dashboard-card ranking-card">

              <div className="card-heading">
                <div>
                  <h2>
                    {codigosQuery
                      ? "Ranking de países seleccionados"
                      : "Top 5 países emisores"}
                  </h2>

                  <p>
                    Emisiones de CO₂ en {anio}
                  </p>
                </div>

                <span className="year-label">{anio}</span>
              </div>

              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topPaises}
                    layout="vertical"
                    margin={{
                      top: 10,
                      right: 15,
                      left: 5,
                      bottom: 10
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#E7EDE9"
                    />

                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: "#718078" }}
                      tickFormatter={(valor) => `${valor} Gt`}
                    />

                    <YAxis
                      type="category"
                      dataKey="entity"
                      width={100}
                      tick={{ fontSize: 11, fill: "#344B40" }}
                    />

                    <Tooltip
                      formatter={(valor) => [
                        `${Number(valor).toFixed(2)} Gt de CO₂`,
                        "Emisiones"
                      ]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #E2EAE5"
                      }}
                    />

                    <Bar
                      dataKey="emisiones_gt"
                      fill="#28765B"
                      radius={[0, 5, 5, 0]}
                      barSize={22}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="ranking-summary">
                <span>Principal país emisor</span>

                <strong>
                  {topPaises.length > 0
                    ? topPaises[0].entity
                    : "Sin datos"}
                </strong>

                <p>
                  {topPaises.length > 0
                    ? `${topPaises[0].emisiones_gt.toFixed(2)} Gt de CO₂ en ${anio}`
                    : "No hay información disponible"}
                </p>
              </div>
            </article>
          </div>

          {/* ANÁLISIS SECUNDARIO */}

          <div className="secondary-grid">

            {/* EVOLUCIÓN HISTÓRICA */}

            <article className="dashboard-card evolution-card secondary-card">

              <div className="card-heading">
                <div>
                  <h2>Evolución histórica</h2>

                  <p>
                    {codigosQuery
                      ? "Evolución de los países seleccionados entre 2010 y 2023"
                      : "Evolución mundial de las emisiones entre 2010 y 2023"}
                  </p>
                </div>
              </div>

              {cargandoEvolucion && (
                <p className="loading-message">
                  Cargando evolución histórica...
                </p>
              )}

              {errorEvolucion && (
                <div className="error-message">
                  {errorEvolucion}
                </div>
              )}

              {!cargandoEvolucion && !errorEvolucion && (
                <div className="chart-container evolution-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={evolucion}
                      margin={{
                        top: 15,
                        right: 10,
                        left: 0,
                        bottom: 10
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E7EDE9"
                      />

                      <XAxis
                        dataKey="year"
                        tick={{ fontSize: 10, fill: "#718078" }}
                      />

                      <YAxis
                        tick={{ fontSize: 10, fill: "#718078" }}
                        tickFormatter={(valor) => `${valor} Gt`}
                      />

                      <Tooltip
                        labelFormatter={(anioTooltip) =>
                          `Año ${anioTooltip}`
                        }
                        formatter={(valor, nombre) => [
                          `${Number(valor).toFixed(2)} Gt de CO₂`,
                          nombre
                        ]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #E2EAE5"
                        }}
                      />

                      {codigosQuery ? (
                        paisesDeEvolucion.map((pais, index) => (
                          <Line
                            key={pais.codigo}
                            type="monotone"
                            dataKey={pais.codigo}
                            name={pais.nombre}
                            stroke={
                              coloresLineas[index % coloresLineas.length]
                            }
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 5 }}
                            connectNulls
                          />
                        ))
                      ) : (
                        <Line
                          type="monotone"
                          dataKey="emisiones_gt"
                          name="Emisiones mundiales"
                          stroke="#28765B"
                          strokeWidth={3}
                          dot={{ r: 3, fill: "#28765B" }}
                          activeDot={{ r: 6 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="highlight-strip">
                <span>Periodo analizado</span>
                <strong>2010 – 2023</strong>
              </div>
            </article>

            {/* COMPARACIÓN ENTRE PAÍSES */}

            <article className="dashboard-card secondary-card">

              <div className="card-heading">
                <div>
                  <h2>
                    {codigosQuery
                      ? "Comparación entre países"
                      : "Comparación de los principales emisores"}
                  </h2>

                  <p>Emisiones de CO₂ en {anio}</p>
                </div>
              </div>

              {cargandoComparacion && (
                <p className="loading-message">
                  Cargando comparación...
                </p>
              )}

              {!cargandoComparacion &&
                !puedeMostrarComparacion && (
                  <div className="chart-placeholder">
                    <p>
                      Selecciona al menos dos países para visualizar
                      la comparación, o limpia el filtro para consultar
                      los cinco principales emisores.
                    </p>
                  </div>
                )}

              {!cargandoComparacion &&
                puedeMostrarComparacion &&
                datosComparacion.length > 0 && (
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={datosComparacion}
                        margin={{
                          top: 15,
                          right: 10,
                          left: 0,
                          bottom: 35
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#E7EDE9"
                        />

                        <XAxis
                          dataKey="entity"
                          interval={0}
                          angle={-25}
                          textAnchor="end"
                          height={65}
                          tick={{ fontSize: 10, fill: "#718078" }}
                        />

                        <YAxis
                          tick={{ fontSize: 10, fill: "#718078" }}
                          tickFormatter={(valor) => `${valor} Gt`}
                        />

                        <Tooltip
                          formatter={(valor) => [
                            `${Number(valor).toFixed(2)} Gt de CO₂`,
                            "Emisiones"
                          ]}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid #E2EAE5"
                          }}
                        />

                        <Bar
                          dataKey="emisiones_gt"
                          name="Emisiones"
                          fill="#28765B"
                          radius={[5, 5, 0, 0]}
                          barSize={35}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

              {!cargandoComparacion &&
                puedeMostrarComparacion &&
                datosComparacion.length === 0 &&
                !errorComparacion && (
                  <div className="chart-placeholder">
                    <p>
                      No hay registros disponibles para la comparación.
                    </p>
                  </div>
                )}

              <div className="highlight-strip">
                <span>
                  {codigosQuery
                    ? "Países seleccionados"
                    : "Países en comparación"}
                </span>

                <strong>
                  {codigosQuery
                    ? `${paisesSeleccionados.length} de 5`
                    : `${datosComparacion.length} principales`}
                </strong>
              </div>
            </article>

            {/* VARIACIONES PORCENTUALES */}

            <article className="dashboard-card secondary-card">

              <div className="card-heading">
                <div>
                  <h2>Variaciones porcentuales</h2>

                  <p>
                    Cambios respecto a {Number(anio) - 1}
                  </p>
                </div>
              </div>

              {cargandoVariaciones && (
                <p className="loading-message">
                  Cargando variaciones...
                </p>
              )}

              {errorVariaciones && (
                <div className="error-message">
                  {errorVariaciones}
                </div>
              )}

              {!cargandoVariaciones &&
                !errorVariaciones &&
                datosVariaciones.length > 0 && (
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={datosVariaciones}
                        layout="vertical"
                        margin={{
                          top: 10,
                          right: 15,
                          left: 5,
                          bottom: 10
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                          stroke="#E7EDE9"
                        />

                        <XAxis
                          type="number"
                          tick={{ fontSize: 10, fill: "#718078" }}
                          tickFormatter={(valor) => `${valor}%`}
                        />

                        <YAxis
                          type="category"
                          dataKey="entity"
                          width={105}
                          tick={{ fontSize: 10, fill: "#344B40" }}
                        />

                        <Tooltip
                          formatter={(valor) => [
                            `${Number(valor).toFixed(2)}%`,
                            "Variación"
                          ]}
                          labelFormatter={(nombre) => nombre}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid #E2EAE5"
                          }}
                        />

                        <Bar
                          dataKey="variacion_porcentual"
                          name="Variación"
                          radius={[0, 5, 5, 0]}
                          barSize={17}
                        >
                          {datosVariaciones.map((registro) => (
                            <Cell
                              key={registro.code}
                              fill={
                                registro.variacion_porcentual >= 0
                                  ? "#D97757"
                                  : "#28765B"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

              {!cargandoVariaciones &&
                !errorVariaciones &&
                datosVariaciones.length === 0 && (
                  <div className="chart-placeholder">
                    <p>
                      No hay variaciones porcentuales disponibles
                      para este periodo.
                    </p>
                  </div>
                )}

              <div className="highlight-strip">
                <span>Variaciones registradas</span>

                <strong>
                  {incrementos.length} incrementos · {reducciones.length} reducciones
                </strong>
              </div>
            </article>
          </div>

          {/* TABLA DE DETALLE CON PAGINACIÓN */}

          <article className="dashboard-card table-card">

            <div className="card-heading">
              <div>
                <h2>Detalle de emisiones por país</h2>

                <p>
                  {codigosQuery
                    ? `Información de los países seleccionados en ${anio}`
                    : `Información mundial de emisiones en ${anio}`}
                </p>
              </div>

              <span className="year-label">{anio}</span>
            </div>

            {cargandoDetalle && (
              <p className="loading-message">
                Cargando registros...
              </p>
            )}

            {errorDetalle && (
              <div className="error-message">
                {errorDetalle}
              </div>
            )}

            {!cargandoDetalle && !errorDetalle && (
              <>
                <div className="table-placeholder">
                  <table>
                    <thead>
                      <tr>
                        <th>Posición</th>
                        <th>País</th>
                        <th>Código</th>
                        <th>Año</th>
                        <th>Total de emisiones</th>
                        <th>Variación porcentual</th>
                      </tr>
                    </thead>

                    <tbody>
                      {registrosPaginados.map((registro) => (
                        <tr key={`${registro.code}-${registro.year}`}>
                          <td>{registro.posicion}</td>
                          <td>{registro.entity}</td>
                          <td>{registro.code}</td>
                          <td>{registro.year}</td>
                          <td>
                            {Number(registro.emisiones_gt ?? 0).toFixed(3)} Gt
                          </td>
                          <td>
                            {registro.variacion_porcentual == null
                              ? "Sin datos"
                              : `${registro.variacion_porcentual >= 0 ? "+" : ""}${Number(
                                  registro.variacion_porcentual
                                ).toFixed(2)}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {detalle.length === 0 && (
                    <p className="chart-placeholder">
                      No hay registros para mostrar.
                    </p>
                  )}
                </div>

                {/* CONTROLES DE PAGINACIÓN */}

                {totalRegistros > 0 && (
                  <div className="pagination">

                    <span className="pagination-info">
                      Mostrando {indiceInicial + 1}-
                      {Math.min(indiceFinal, totalRegistros)} de{" "}
                      {totalRegistros} registros
                    </span>

                    <div className="pagination-buttons">

                      <button
                        type="button"
                        onClick={() =>
                          setPaginaActual((pagina) =>
                            Math.max(1, pagina - 1)
                          )
                        }
                        disabled={paginaActual === 1}
                      >
                        Anterior
                      </button>

                      <span className="pagination-current">
                        Página {paginaActual} de {Math.max(totalPaginas, 1)}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setPaginaActual((pagina) =>
                            Math.min(totalPaginas, pagina + 1)
                          )
                        }
                        disabled={paginaActual >= totalPaginas}
                      >
                        Siguiente
                      </button>

                    </div>
                  </div>
                )}
              </>
            )}

            <div className="highlight-strip">
              <span>Total de registros</span>
              <strong>{totalRegistros}</strong>
            </div>

          </article>
        </>
      )}
    </section>
  );
}

export default Dashboard;
