
const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// ========================================
// FUNCIONES AUXILIARES
// ========================================

// Validar que el año exista en la base de datos.
async function obtenerAnioValido(anioSolicitado) {
  const consulta = await pool.query(`
    SELECT
      MIN(year) AS primer_anio,
      MAX(year) AS ultimo_anio
    FROM emisiones_paises;
  `);

  const { primer_anio, ultimo_anio } = consulta.rows[0];

  const anio = anioSolicitado
    ? Number(anioSolicitado)
    : Number(ultimo_anio);

  if (
    !Number.isInteger(anio) ||
    anio < Number(primer_anio) ||
    anio > Number(ultimo_anio)
  ) {
    return null;
  }

  return anio;
}

// Obtener y validar los códigos enviados desde el frontend.
// Si no se envían códigos, se conserva el análisis global.
function obtenerCodigos(req, res, minimo = 1) {
  if (req.query.codigos === undefined) {
    return null;
  }

  const codigos = [
    ...new Set(
      String(req.query.codigos)
        .split(",")
        .map(codigo => codigo.trim().toUpperCase())
        .filter(Boolean)
    )
  ];

  if (
    codigos.length < minimo ||
    codigos.length > 5 ||
    codigos.some(codigo => !/^[A-Z0-9_-]+$/.test(codigo))
  ) {
    res.status(400).json({
      mensaje: minimo === 2
        ? "Selecciona entre 2 y 5 países para comparar."
        : "Selecciona entre 1 y 5 países."
    });

    return undefined;
  }

  return codigos;
}

// Comprobar si hubo un error al validar los códigos.
function filtroInvalido(req, codigos) {
  return req.query.codigos !== undefined && codigos === undefined;
}

// ========================================
// 1. RESUMEN DEL DASHBOARD
// GET /api/emisiones/resumen?anio=2023&codigos=MEX,USA
// ========================================

router.get("/resumen", async (req, res) => {
  try {
    const codigos = obtenerCodigos(req, res);

    if (filtroInvalido(req, codigos)) return;

    const anio = await obtenerAnioValido(req.query.anio);

    if (anio === null) {
      return res.status(400).json({
        mensaje: "El año solicitado no es válido."
      });
    }

    const consulta = await pool.query(`
      WITH emisiones_filtradas AS (
        SELECT
          entity,
          UPPER(code) AS code,
          year,
          emissions_total
        FROM emisiones_paises
        WHERE ($2::text[] IS NULL OR UPPER(code) = ANY($2::text[]))
      ),

      actual AS (
        SELECT
          year,
          SUM(emissions_total) AS total_emisiones,
          COUNT(DISTINCT COALESCE(code, entity)) AS total_paises
        FROM emisiones_filtradas
        WHERE year = $1
        GROUP BY year
      ),

      anterior AS (
        SELECT
          SUM(emissions_total) AS total_emisiones
        FROM emisiones_filtradas
        WHERE year = $1 - 1
      ),

      mayor_emisor AS (
        SELECT
          entity,
          SUM(emissions_total) AS emissions_total
        FROM emisiones_filtradas
        WHERE year = $1
        GROUP BY entity, code
        ORDER BY SUM(emissions_total) DESC
        LIMIT 1
      )

      SELECT
        actual.year AS ultimo_anio,
        actual.total_emisiones,
        actual.total_paises,
        anterior.total_emisiones AS emisiones_anio_anterior,
        mayor_emisor.entity AS pais_mayor_emisor,
        mayor_emisor.emissions_total AS emisiones_mayor_emisor

      FROM actual
      CROSS JOIN anterior
      LEFT JOIN mayor_emisor ON TRUE;
    `, [anio, codigos]);

    if (consulta.rows.length === 0) {
      return res.status(404).json({
        mensaje: "No hay registros para los países y el año solicitado."
      });
    }

    const datos = consulta.rows[0];

    const actual = Number(datos.total_emisiones);
    const anterior = datos.emisiones_anio_anterior === null
      ? null
      : Number(datos.emisiones_anio_anterior);

    let variacion = null;

    if (anterior !== null && anterior !== 0) {
      variacion = ((actual - anterior) / anterior) * 100;
    }

    res.json({
      ultimo_anio: Number(datos.ultimo_anio),
      total_emisiones: actual,
      total_paises: Number(datos.total_paises),
      variacion_porcentual: variacion,
      pais_mayor_emisor: datos.pais_mayor_emisor,
      emisiones_mayor_emisor:
        datos.emisiones_mayor_emisor === null
          ? null
          : Number(datos.emisiones_mayor_emisor)
    });

  } catch (error) {
    console.error("Error en resumen:", error.message);

    res.status(500).json({
      mensaje: "Error al obtener el resumen del dashboard."
    });
  }
});

// ========================================
// 2. AÑOS DISPONIBLES
// GET /api/emisiones/anios
// ========================================

router.get("/anios", async (req, res) => {
  try {
    const consulta = await pool.query(`
      SELECT DISTINCT year
      FROM emisiones_paises
      ORDER BY year ASC;
    `);

    res.json(
      consulta.rows.map(registro => Number(registro.year))
    );

  } catch (error) {
    console.error("Error al obtener años:", error.message);

    res.status(500).json({
      mensaje: "Error al obtener los años disponibles."
    });
  }
});

// ========================================
// 3. TOP 5 PAÍSES EMISORES
// GET /api/emisiones/top-paises?anio=2023&codigos=MEX,USA
// ========================================

router.get("/top-paises", async (req, res) => {
  try {
    const codigos = obtenerCodigos(req, res);

    if (filtroInvalido(req, codigos)) return;

    const anio = await obtenerAnioValido(req.query.anio);

    if (anio === null) {
      return res.status(400).json({
        mensaje: "El año solicitado no es válido."
      });
    }

    const consulta = await pool.query(`
      SELECT
        MAX(entity) AS entity,
        UPPER(code) AS code,
        year,
        SUM(emissions_total) AS emissions_total,
        BOOL_OR(es_outlier_iqr) AS es_outlier_iqr
      FROM emisiones_paises
      WHERE year = $1
        AND ($2::text[] IS NULL OR UPPER(code) = ANY($2::text[]))
      GROUP BY UPPER(code), year
      ORDER BY SUM(emissions_total) DESC
      LIMIT 5;
    `, [anio, codigos]);

    res.json(
      consulta.rows.map(registro => ({
        ...registro,
        year: Number(registro.year),
        emissions_total: Number(registro.emissions_total)
      }))
    );

  } catch (error) {
    console.error("Error en top países:", error.message);

    res.status(500).json({
      mensaje: "Error al obtener el ranking de países."
    });
  }
});

// ========================================
// 4. EVOLUCIÓN HISTÓRICA
// GET /api/emisiones/evolucion?anio=2023&codigos=MEX,USA
// ========================================

router.get("/evolucion", async (req, res) => {
  try {
    const codigos = obtenerCodigos(req, res);

    if (filtroInvalido(req, codigos)) return;

    const anio = await obtenerAnioValido(req.query.anio);

    if (anio === null) {
      return res.status(400).json({
        mensaje: "El año solicitado no es válido."
      });
    }

    // Sin filtro: conservar la evolución global.
    if (codigos === null) {
      const consulta = await pool.query(`
        SELECT
          year,
          SUM(emissions_total) AS total_emisiones
        FROM emisiones_paises
        WHERE year <= $1
        GROUP BY year
        ORDER BY year ASC;
      `, [anio]);

      return res.json(
        consulta.rows.map(registro => ({
          year: Number(registro.year),
          total_emisiones: Number(registro.total_emisiones)
        }))
      );
    }

    // Con filtro: obtener una serie histórica por país.
    const consulta = await pool.query(`
      SELECT
        MAX(entity) AS entity,
        UPPER(code) AS code,
        year,
        SUM(emissions_total) AS total_emisiones
      FROM emisiones_paises
      WHERE UPPER(code) = ANY($1::text[])
        AND year <= $2
      GROUP BY UPPER(code), year
      ORDER BY year ASC, code ASC;
    `, [codigos, anio]);

    res.json(
      consulta.rows.map(registro => ({
        ...registro,
        year: Number(registro.year),
        total_emisiones: Number(registro.total_emisiones)
      }))
    );

  } catch (error) {
    console.error("Error en evolución:", error.message);

    res.status(500).json({
      mensaje: "Error al obtener la evolución histórica."
    });
  }
});

// ========================================
// 5. EMISIONES PARA EL MAPA
// GET /api/emisiones/mapa?anio=2023&codigos=MEX,USA
// ========================================

router.get("/mapa", async (req, res) => {
  try {
    const codigos = obtenerCodigos(req, res);

    if (filtroInvalido(req, codigos)) return;

    const anio = await obtenerAnioValido(req.query.anio);

    if (anio === null) {
      return res.status(400).json({
        mensaje: "El año solicitado no es válido."
      });
    }

    const consulta = await pool.query(`
      SELECT
        entity,
        UPPER(code) AS code,
        year,
        SUM(emissions_total) AS emissions_total,
        BOOL_OR(es_outlier_iqr) AS es_outlier_iqr
      FROM emisiones_paises
      WHERE year = $1
        AND code IS NOT NULL
        AND TRIM(code) <> ''
        AND ($2::text[] IS NULL OR UPPER(code) = ANY($2::text[]))
      GROUP BY entity, UPPER(code), year
      ORDER BY SUM(emissions_total) DESC;
    `, [anio, codigos]);

    res.json(
      consulta.rows.map(registro => ({
        ...registro,
        year: Number(registro.year),
        emissions_total: Number(registro.emissions_total)
      }))
    );

  } catch (error) {
    console.error("Error al obtener emisiones para el mapa:", error.message);

    res.status(500).json({
      mensaje: "Error al obtener las emisiones por país."
    });
  }
});

// ========================================
// 6. PAÍSES DISPONIBLES
// GET /api/emisiones/paises
// ========================================

router.get("/paises", async (req, res) => {
  try {
    const consulta = await pool.query(`
      SELECT
        code,
        MAX(entity) AS entity
      FROM emisiones_paises
      WHERE code IS NOT NULL
        AND TRIM(code) <> ''
      GROUP BY code
      ORDER BY MAX(entity) ASC;
    `);

    res.json(consulta.rows);

  } catch (error) {
    console.error("Error al obtener países:", error.message);

    res.status(500).json({
      mensaje: "Error al obtener los países disponibles."
    });
  }
});

// ========================================
// 7. COMPARACIÓN ENTRE PAÍSES
// GET /api/emisiones/comparacion?anio=2023&codigos=MEX,USA
// ========================================

router.get("/comparacion", async (req, res) => {
  try {
    const codigos = obtenerCodigos(req, res, 2);

    if (filtroInvalido(req, codigos)) return;

    if (codigos === null) {
      return res.status(400).json({
        mensaje: "Selecciona entre 2 y 5 países para comparar."
      });
    }

    const anio = await obtenerAnioValido(req.query.anio);

    if (anio === null) {
      return res.status(400).json({
        mensaje: "El año solicitado no es válido."
      });
    }

    const consulta = await pool.query(`
      SELECT
        UPPER(code) AS code,
        MAX(entity) AS entity,
        year,
        SUM(emissions_total) AS emissions_total
      FROM emisiones_paises
      WHERE UPPER(code) = ANY($1::text[])
        AND year <= $2
      GROUP BY UPPER(code), year
      ORDER BY year ASC, code ASC;
    `, [codigos, anio]);

    res.json(
      consulta.rows.map(registro => ({
        ...registro,
        year: Number(registro.year),
        emissions_total: Number(registro.emissions_total)
      }))
    );

  } catch (error) {
    console.error("Error en comparación:", error.message);

    res.status(500).json({
      mensaje: "Error al comparar las emisiones de los países."
    });
  }
});

// ========================================
// 8. VARIACIONES PORCENTUALES
// GET /api/emisiones/variaciones?anio=2023&codigos=MEX,USA
// ========================================

router.get("/variaciones", async (req, res) => {
  try {
    const codigos = obtenerCodigos(req, res);

    if (filtroInvalido(req, codigos)) return;

    const anio = await obtenerAnioValido(req.query.anio);

    if (anio === null) {
      return res.status(400).json({
        mensaje: "El año solicitado no es válido."
      });
    }

    const consulta = await pool.query(`
      WITH emisiones_anuales AS (
        SELECT
          UPPER(code) AS code,
          MAX(entity) AS entity,
          year,
          SUM(emissions_total) AS emisiones
        FROM emisiones_paises
        WHERE code IS NOT NULL
          AND TRIM(code) <> ''
          AND year IN ($1, $1 - 1)
          AND ($2::text[] IS NULL OR UPPER(code) = ANY($2::text[]))
        GROUP BY UPPER(code), year
      ),

      variaciones AS (
        SELECT
          actual.entity,
          actual.code,
          actual.year,
          actual.emisiones AS emisiones_actuales,
          anterior.emisiones AS emisiones_anteriores,
          (
            (actual.emisiones - anterior.emisiones)
            / NULLIF(anterior.emisiones, 0)
          ) * 100 AS variacion_porcentual
        FROM emisiones_anuales actual
        INNER JOIN emisiones_anuales anterior
          ON actual.code = anterior.code
          AND anterior.year = actual.year - 1
        WHERE actual.year = $1
          AND anterior.emisiones > 0
      ),

      incrementos AS (
        SELECT
          *,
          'incremento' AS tipo,
          ROW_NUMBER() OVER (
            ORDER BY variacion_porcentual DESC
          ) AS posicion
        FROM variaciones
        WHERE variacion_porcentual > 0
      ),

      reducciones AS (
        SELECT
          *,
          'reduccion' AS tipo,
          ROW_NUMBER() OVER (
            ORDER BY variacion_porcentual ASC
          ) AS posicion
        FROM variaciones
        WHERE variacion_porcentual < 0
      )

      SELECT
        entity,
        code,
        year,
        emisiones_actuales,
        emisiones_anteriores,
        variacion_porcentual,
        tipo
      FROM incrementos
      WHERE posicion <= 5

      UNION ALL

      SELECT
        entity,
        code,
        year,
        emisiones_actuales,
        emisiones_anteriores,
        variacion_porcentual,
        tipo
      FROM reducciones
      WHERE posicion <= 5

      ORDER BY variacion_porcentual DESC;
    `, [anio, codigos]);

    res.json(
      consulta.rows.map(registro => ({
        ...registro,
        year: Number(registro.year),
        emisiones_actuales: Number(registro.emisiones_actuales),
        emisiones_anteriores: Number(registro.emisiones_anteriores),
        variacion_porcentual: Number(registro.variacion_porcentual)
      }))
    );

  } catch (error) {
    console.error("Error en variaciones:", error.message);

    res.status(500).json({
      mensaje: "Error al obtener las variaciones porcentuales."
    });
  }
});

// ========================================
// 9. TABLA DE DETALLE
// GET /api/emisiones/detalle?anio=2023&codigos=MEX,USA
// ========================================

router.get("/detalle", async (req, res) => {
  try {
    const codigos = obtenerCodigos(req, res);

    if (filtroInvalido(req, codigos)) return;

    const anio = await obtenerAnioValido(req.query.anio);

    if (anio === null) {
      return res.status(400).json({
        mensaje: "El año solicitado no es válido."
      });
    }

    const consulta = await pool.query(`
      WITH emisiones_anuales AS (
        SELECT
          UPPER(code) AS code,
          MAX(entity) AS entity,
          year,
          SUM(emissions_total) AS emisiones
        FROM emisiones_paises
        WHERE code IS NOT NULL
          AND TRIM(code) <> ''
          AND year IN ($1, $1 - 1)
          AND ($2::text[] IS NULL OR UPPER(code) = ANY($2::text[]))
        GROUP BY UPPER(code), year
      ),

      datos_actuales AS (
        SELECT
          entity,
          code,
          year,
          emisiones
        FROM emisiones_anuales
        WHERE year = $1
      ),

      datos_anteriores AS (
        SELECT
          code,
          emisiones
        FROM emisiones_anuales
        WHERE year = $1 - 1
      )

      SELECT
        ROW_NUMBER() OVER (
          ORDER BY actual.emisiones DESC
        ) AS posicion,

        actual.entity,
        actual.code,
        actual.year,
        actual.emisiones AS emissions_total,

        CASE
          WHEN anterior.emisiones IS NULL
            OR anterior.emisiones = 0
          THEN NULL

          ELSE (
            (actual.emisiones - anterior.emisiones)
            / anterior.emisiones
          ) * 100
        END AS variacion_porcentual

      FROM datos_actuales actual

      LEFT JOIN datos_anteriores anterior
        ON actual.code = anterior.code

      ORDER BY actual.emisiones DESC;
    `, [anio, codigos]);

    res.json(
      consulta.rows.map(registro => ({
        ...registro,
        posicion: Number(registro.posicion),
        year: Number(registro.year),
        emissions_total: Number(registro.emissions_total),
        variacion_porcentual:
          registro.variacion_porcentual === null
            ? null
            : Number(registro.variacion_porcentual)
      }))
    );

  } catch (error) {
    console.error("Error en detalle:", error.message);

    res.status(500).json({
      mensaje: "Error al obtener el detalle de emisiones."
    });
  }
});

module.exports = router;
