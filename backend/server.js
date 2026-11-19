
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const emisionesRoutes = require("./routes/emisiones");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
