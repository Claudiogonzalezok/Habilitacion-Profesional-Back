import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// Importar rutas
import usuarioRoutes from "./src/routes/usuarioRoutes.js";
import cursoRoutes from "./src/routes/cursoRoutes.js";
import claseRoutes from "./src/routes/claseRoutes.js";
import inscripcionRoutes from "./src/routes/inscripcionRoutes.js";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // para leer JSON en requests
app.use("/uploads", express.static("uploads"));

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => console.error("❌ Error MongoDB:", err));

// Rutas API
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/cursos", cursoRoutes);
app.use("/api/clases", claseRoutes);
app.use("/api/inscripciones", inscripcionRoutes);

// Puerto
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
