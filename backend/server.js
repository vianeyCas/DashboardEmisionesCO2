
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const emisionesRoutes = require("./routes/emisiones");

const app = express();

app.use(cors());
app.use(express.json());

// Rutas de la API
app.use("/api/emisiones", emisionesRoutes);

// Ruta principal
app.get("/", (req, res) => {
  res.json({
    mensaje: "API de Huella de Carbono funcionando",
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
