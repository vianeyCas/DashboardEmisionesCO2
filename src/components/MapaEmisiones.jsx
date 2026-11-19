import { useEffect, useMemo, useState } from "react";

import {
  MapContainer,
  TileLayer,
  GeoJSON
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

const URL_GEOJSON =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

const URL_API = `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/emisiones/mapa`;

const colores = [
  "#E8F3ED",
  "#B8DCC8",
  "#78B99A",
  "#398765",
  "#14543B"
];

const COLOR_SIN_SELECCION = "#E5E7EB";

function obtenerCodigoPais(feature) {
  const propiedades = feature.properties || {};

  return (
    propiedades["ISO3166-1-Alpha-3"] ||
    propiedades.ISO_A3 ||
    propiedades.ADM0_A3 ||
    ""
  );
}

function obtenerNombrePais(feature) {
  const propiedades = feature.properties || {};

  return (
    propiedades.name ||
    propiedades.ADMIN ||
    propiedades.NAME ||
    "País sin nombre"
  );
}

function obtenerColor(valor, limites) {
  if (valor === null || valor === undefined) {
    return COLOR_SIN_SELECCION;
  }

  if (valor <= limites[0]) return colores[0];
  if (valor <= limites[1]) return colores[1];
  if (valor <= limites[2]) return colores[2];
  if (valor <= limites[3]) return colores[3];

  return colores[4];
}

function MapaEmisiones({ anio, codigos = [] }) {
  const [geojson, setGeojson] = useState(null);
  const [emisiones, setEmisiones] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const codigosQuery = useMemo(
    () => codigos.join(","),
    [codigos]
  );

  // ========================================
  // CARGAR MAPA MUNDIAL
  // ========================================

  useEffect(() => {
    const controlador = new AbortController();

    const obtenerGeojson = async () => {
      try {
        const respuesta = await fetch(URL_GEOJSON, {
          signal: controlador.signal
        });

        if (!respuesta.ok) {
          throw new Error("No se pudo obtener el mapa mundial.");
        }

        const datos = await respuesta.json();
        setGeojson(datos);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          setError("No se pudo cargar el mapa mundial.");
        }
      }
    };

    obtenerGeojson();

    return () => controlador.abort();
  }, []);

  // ========================================
  // CONSULTAR EMISIONES POR AÑO Y PAÍSES
  // ========================================

  useEffect(() => {
    if (!anio) return;

    const controlador = new AbortController();

    const obtenerEmisiones = async () => {
      try {
        setCargando(true);
        setError("");

        const parametros = new URLSearchParams();
        parametros.set("anio", anio);

        // Solo enviar códigos cuando existen países seleccionados.
        if (codigosQuery) {
          parametros.set("codigos", codigosQuery);
        }

        const respuesta = await fetch(
          `${URL_API}?${parametros.toString()}`,
          { signal: controlador.signal }
        );

        if (!respuesta.ok) {
          throw new Error("No se pudieron obtener las emisiones.");
        }

        const datos = await respuesta.json();
        setEmisiones(datos);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          setError("No se pudieron cargar las emisiones por país.");
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    };

    obtenerEmisiones();

    return () => controlador.abort();
  }, [anio, codigosQuery]);

  // ========================================
  // RELACIONAR CÓDIGOS CON EMISIONES
  // ========================================

  const emisionesPorCodigo = useMemo(() => {
    const resultado = {};

    emisiones.forEach((pais) => {
      if (pais.code) {
        resultado[pais.code.trim().toUpperCase()] =
          Number(pais.emissions_total);
      }
    });

    return resultado;
  }, [emisiones]);

  // ========================================
  // CALCULAR LÍMITES DE COLOR
  // ========================================

  const limites = useMemo(() => {
    const valoresOrdenados = emisiones
      .map((pais) => Number(pais.emissions_total))
      .filter((valor) => Number.isFinite(valor))
      .sort((a, b) => a - b);

    const obtenerPercentil = (porcentaje) => {
      if (valoresOrdenados.length === 0) return 0;

      const posicion = Math.floor(
        (valoresOrdenados.length - 1) * porcentaje
      );

      return valoresOrdenados[posicion];
    };

    return [
      obtenerPercentil(0.20),
      obtenerPercentil(0.40),
      obtenerPercentil(0.60),
      obtenerPercentil(0.80)
    ];
  }, [emisiones]);

  // ========================================
  // VERIFICAR SI EL PAÍS ESTÁ SELECCIONADO
  // ========================================

  const paisSeleccionado = (codigo) => {
    // Sin selección, todos los países se muestran normalmente.
    if (!codigosQuery) return true;

    return codigos.includes(codigo);
  };

  // ========================================
  // ESTILO DE CADA PAÍS
  // ========================================

  const estiloPais = (feature) => {
    const codigo = obtenerCodigoPais(feature)
      .trim()
      .toUpperCase();

    const seleccionado = paisSeleccionado(codigo);
    const valor = emisionesPorCodigo[codigo];

    if (!seleccionado) {
      return {
        fillColor: COLOR_SIN_SELECCION,
        weight: 0.7,
        opacity: 1,
        color: "#FFFFFF",
        fillOpacity: 0.65
      };
    }

    return {
      fillColor: obtenerColor(valor, limites),
      weight: 0.7,
      opacity: 1,
      color: "#FFFFFF",
      fillOpacity: valor === undefined ? 0.35 : 0.85
    };
  };

  // ========================================
  // CONFIGURAR INTERACCIÓN DE CADA PAÍS
  // ========================================

  const configurarPais = (feature, layer) => {
    const codigo = obtenerCodigoPais(feature)
      .trim()
      .toUpperCase();

    const nombre = obtenerNombrePais(feature);
    const seleccionado = paisSeleccionado(codigo);
    const valor = emisionesPorCodigo[codigo];

    let contenido;

    if (!seleccionado) {
      contenido = `<strong>${nombre}</strong><br/>País fuera de la selección actual`;
    } else if (valor === undefined) {
      contenido = `<strong>${nombre}</strong><br/>Sin datos de emisiones para ${anio}`;
    } else {
      contenido =
        `<strong>${nombre}</strong><br/>` +
        `Emisiones: ${(valor / 1000000000).toFixed(2)} Gt de CO₂<br/>` +
        `Año: ${anio}`;
    }

    layer.bindTooltip(contenido, {
      sticky: true,
      direction: "auto",
      className: "tooltip-pais",
      opacity: 1
    });

    layer.bindPopup(contenido);

    layer.on({
      mouseover: (evento) => {
        const capa = evento.target;

        capa.setStyle({
          weight: 2,
          color: "#173B32",
          fillOpacity: 1
        });

        capa.bringToFront();
      },

      mouseout: (evento) => {
        evento.target.setStyle(estiloPais(feature));
      }
    });
  };

  // ========================================
  // RENDERIZADO
  // ========================================

  if (error) {
    return (
      <div className="error-message">
        {error}
      </div>
    );
  }

  return (
    <article className="dashboard-card map-card">

      <div className="card-heading">
        <div>
          <h2>Emisiones de CO₂ por país</h2>

          <p>
            {codigosQuery
              ? `Distribución de los países seleccionados en ${anio}`
              : `Distribución mundial de emisiones de CO₂ en ${anio}`}
          </p>
        </div>

        <span className="year-label">{anio}</span>
      </div>

      {cargando && (
        <p className="loading-message">
          Actualizando emisiones del mapa...
        </p>
      )}

      {!geojson && (
        <p className="loading-message">
          Cargando mapa mundial...
        </p>
      )}

      {geojson && (
        <>
          <div className="map-container">
            <MapContainer
              center={[20, 0]}
              zoom={2}
              minZoom={2}
              scrollWheelZoom={true}
              worldCopyJump={true}
              style={{
                height: "100%",
                width: "100%"
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <GeoJSON
                key={`${anio}-${codigosQuery}`}
                data={geojson}
                style={estiloPais}
                onEachFeature={configurarPais}
              />
            </MapContainer>
          </div>

          <div className="map-legend">
            <span>Menores emisiones</span>

            <div className="legend-colors">
              {colores.map((color, index) => (
                <span
                  key={index}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <span>Mayores emisiones</span>
          </div>

          <p className="map-note">
            {codigosQuery
              ? "Los países seleccionados se muestran en la escala de verdes y los demás aparecen en gris."
              : "Se muestran las emisiones de todos los países en la escala de verdes."}
            {" "}Selecciona un país para consultar sus emisiones.
          </p>
        </>
      )}
    </article>
  );
}

export default MapaEmisiones;