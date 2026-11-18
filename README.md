## Huella de carbono: ¿quién contamina más?

Dashboard interactivo en React sobre las emisiones anuales totales de CO₂ por país (2010–2023).

Repositorio: https://github.com/vianeyCas/DashboardEmisionesCO2

---

## Equipo

**Nombre del equipo:** MVKD

**Integrantes:**

- Mariana Vianey Castro Méndez
- Kenya Dhalai Navarrete Patraca

---

## Descripción del proyecto

Este proyecto responde a una pregunta central: **¿qué países generan mayores emisiones anuales totales de CO₂ y cómo ha cambiado su comportamiento entre 2010 y 2023?**

El dashboard, de tipo **estratégico**, permite identificar a los principales emisores, comparar países, observar la evolución de las emisiones a lo largo del tiempo y detectar los mayores aumentos y reducciones. Está dirigido a analistas ambientales y de políticas públicas, estudiantes y docentes, y público general interesado en la sostenibilidad.

El alcance se limita a las **emisiones anuales totales de CO₂** de la fuente seleccionada; no se incorporan indicadores de población, PIB ni emisiones por sector.

---

## Datos

- **Fuente principal:** [Our World in Data – Annual CO₂ emissions](https://ourworldindata.org/grapher/annual-co2-emissions-per-country), basada en el Global Carbon Budget.
- **Contenido:** emisiones de combustibles fósiles y de la industria, en toneladas. No incluye cambio de uso del suelo.
- **Columnas del archivo:** `Entity`, `Code`, `Year` y `Annual CO₂ emissions`.
- **Periodo analizado:** 2010–2023.
- **Preprocesamiento:** filtrado por periodo, revisión de valores faltantes y duplicados, separación de países frente a regiones y totales mundiales, y carga en la tabla `emisiones`.

> Si el CSV se ve con caracteres extraños en Excel (por ejemplo, "CO₂"), impórtalo con codificación UTF-8.

---

## Funcionalidades

**Indicadores (KPIs)**

- Emisiones mundiales del año seleccionado.
- Principal emisor y su volumen de emisiones.
- Variación anual de las emisiones globales.
- Países analizados.

**Visualizaciones**

- Mapa coroplético mundial de emisiones de CO₂ por país.
- Top 5 de países emisores (barras horizontales).
- Evolución histórica 2010–2023 (gráfica de línea).
- Comparación entre los principales emisores (barras verticales).
- Variaciones porcentuales: mayores incrementos y reducciones (barras divergentes).
- Tabla de detalle de emisiones por país.

**Filtros**

- Selector de año (2010–2023).
- Selector de país, con la opción «Todos los países».
- Todos los indicadores, gráficas, el mapa y la tabla se actualizan al cambiar los filtros.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite |
| Gráficas | Recharts |
| Mapa | Leaflet + React-Leaflet (OpenStreetMap) |
| Consumo de API | Axios |
| Estilos | CSS / TailwindCSS |
| Backend | Node.js + Express + dotenv |
| Base de datos | PostgreSQL |

---

## Estructura del proyecto

```
DashboardEmisionesCO2/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── routes/
│   │   └── emisiones.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── MapaEmisiones.jsx
│   │   └── Sidebar.jsx
│   ├── data/
│   ├── pages/
│   │   └── Dashboard.jsx
│   ├── styles/
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── docs/
│   └── capturas/
├── index.html
├── package.json
└── vite.config.js
```

---

## Cómo ejecutarlo

### Requisitos

- [Node.js](https://nodejs.org/) (versión LTS)
- PostgreSQL con los datos cargados en la tabla `emisiones`

### 1. Clonar el repositorio

```bash
git clone https://github.com/vianeyCas/DashboardEmisionesCO2.git
cd DashboardEmisionesCO2
```

### 2. Backend

```bash
cd backend
npm install
```

Crea un archivo `.env` a partir de `.env.example` y completa tus datos de conexión:

```env
PORT=
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=
```

Inicia el servidor:

```bash
node server.js
```

### 3. Frontend

En otra terminal, desde la raíz del proyecto:

```bash
npm install
npm run dev
```

Abre en el navegador la dirección que indique Vite (normalmente `http://localhost:5173`).

---

## Paleta de colores

| Color | Código | Muestra | Uso |
|---|---|---|---|
| Verde petróleo oscuro | `#102D29` | ![#102D29](https://placehold.co/70x24/102D29/102D29.png) | Menú lateral y textos principales |
| Blanco puro | `#FFFFFF` | ![#FFFFFF](https://placehold.co/70x24/FFFFFF/FFFFFF.png) | Fondo de las tarjetas |
| Gris humo / blanco verdoso | `#F4F7F6` | ![#F4F7F6](https://placehold.co/70x24/F4F7F6/F4F7F6.png) | Fondo general del dashboard |
| Verde bosque / esmeralda oscuro | `#1B665B` | ![#1B665B](https://placehold.co/70x24/1B665B/1B665B.png) | Barras principales, línea de evolución, escala alta del mapa |
| Verde turquesa | `#579B8E` | ![#579B8E](https://placehold.co/70x24/579B8E/579B8E.png) | Escala intermedia del mapa |
| Verde grisáceo claro | `#B7CEC9` | ![#B7CEC9](https://placehold.co/70x24/B7CEC9/B7CEC9.png) | Escala baja del mapa y subtarjetas |
| Terracota | `#BD7356` | ![#BD7356](https://placehold.co/70x24/BD7356/BD7356.png) | Incrementos porcentuales |


---

## Documentación

Los documentos de cada fase están en la carpeta [`docs/`](docs/):

- Fase 1: Análisis (audiencia, objetivos, preprocesamiento y tipo de dashboard)
- Fase 2: Diseño (KPIs, tipos de gráfico, paleta, wireframe y jerarquía visual)
- Fase 3: Implementación (estructura, componentes, KPIs, gráficas y mapa)
- Fase 4: Evaluación y validación

---

## Estado del proyecto

- [x] Fase 1: Análisis
- [x] Fase 2: Diseño
- [x] Fase 3: Implementación
- [ ] Fase 4: Evaluación y validación
