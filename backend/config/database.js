
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: true,
  },
});

pool.on("connect", () => {
  console.log("Conexión establecida con PostgreSQL");
});

pool.on("error", (error) => {
  console.error("Error inesperado en PostgreSQL:", error.message);
});

module.exports = pool;
