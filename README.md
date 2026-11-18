# Huella de carbono: ¿quién contamina más?

Repositorio: https://github.com/vianeyCas/DashboardEmisionesCO2

Dashboard interactivo en React sobre las emisiones de CO₂ por país.

## Equipo

**Nombre del equipo:** MVKD

**Integrantes:**

- Mariana Vianey Castro Mendez
- Kenya Dhalai Navarrete Patraca

## Descripción del proyecto

Este proyecto explora cómo distintos países contribuyen al cambio climático, analizando sus emisiones de CO₂, su crecimiento económico (PIB) y su población durante el periodo 2010–2023. El dashboard, de tipo **estratégico**, permite comparar países, identificar a los mayores emisores y descubrir patrones entre desarrollo económico y contaminación.

## Datos

**Fuente principal:** [Our World in Data – CO₂ emissions dataset](https://ourworldindata.org/grapher/annual-co2-emissions-per-country)

Columnas del archivo de emisiones: `Entity`, `Code`, `Year` y `Annual CO₂ emissions`.

Como el archivo solo contiene emisiones, se complementará con datos de **población**, **PIB** y **continente** de otras fuentes (Our World in Data o Banco Mundial), unidos por `Code` y `Year`.

> Si el CSV se ve con caracteres extraños en Excel (por ejemplo, "COâ"), impórtalo con codificación UTF-8.

## Indicadores previstos

- Top 5 de emisores globales
- Reducción o aumento de emisiones por país
- País con mayor mejora ambiental

## Visualizaciones previstas

- Mapa de calor mundial (CO₂ per cápita)
- Series temporales por continente
- Gráfico de dispersión PIB vs. emisiones
- Barras apiladas por sector (si los datos lo permiten)

## Tecnologías

- Frontend: React
- Base de datos: [PostgreSQL / MySQL / MongoDB]
- Despliegue: [GitHub Pages / Vercel / Netlify]

## Estado del proyecto

- [x] **Fase 1:** Análisis (audiencia, objetivos, preprocesamiento y tipo de dashboard)
- [ ] Fase 2
- [ ] Fase 3
