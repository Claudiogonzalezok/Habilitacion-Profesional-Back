import dotenv from "dotenv";
dotenv.config(); // ✅ PRIMERO - Cargar variables de entorno antes que todo

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

// Importar rutas
import usuarioRoutes from "./src/routes/usuarioRoutes.js";
import cursoRoutes from "./src/routes/cursoRoutes.js";
import claseRoutes from "./src/routes/claseRoutes.js";
import inscripcionRoutes from "./src/routes/inscripcionRoutes.js";
import examenRoutes from "./src/routes/examenRoutes.js";

const app = express();
const server = createServer(app); // 🔹 Crear servidor HTTP
const io = new Server(server, {
  cors: {
    origin: "*", // Podés poner la URL del frontend si querés restringirlo
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => console.error("❌ Error MongoDB:", err));

// Rutas API
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/cursos", cursoRoutes);
app.use("/api/clases", claseRoutes);
app.use("/api/inscripciones", inscripcionRoutes);
app.use("/api/examenes", examenRoutes);

// 🔔 Socket.io - Conexión
io.on("connection", (socket) => {
  console.log("🟢 Usuario conectado al socket:", socket.id);

  // Ejemplo: recibir notificación desde el backend
  socket.on("enviarNotificacion", (data) => {
    console.log("📩 Notificación recibida:", data);
    io.emit("nuevaNotificacion", data); // reenviarla a todos
  });

  socket.on("disconnect", () => {
    console.log("🔴 Usuario desconectado:", socket.id);
  });
});

// Puerto
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));