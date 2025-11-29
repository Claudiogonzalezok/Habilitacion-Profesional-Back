import dotenv from "dotenv";
dotenv.config(); // ✅ PRIMERO - Cargar variables de entorno antes que todo

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import fs from "fs";

// Importar rutas
import usuarioRoutes from "./src/routes/usuarioRoutes.js";
import cursoRoutes from "./src/routes/cursoRoutes.js";
import claseRoutes from "./src/routes/claseRoutes.js";
import inscripcionRoutes from "./src/routes/inscripcionRoutes.js";
import examenRoutes from "./src/routes/examenRoutes.js";
import tareaRoutes from "./src/routes/tareaRoutes.js";
import entregaRoutes from "./src/routes/entregaRoutes.js";
import { handleMulterError } from "./src/middlewares/uploadMiddleware.js";

// ✅ AGREGAR ESTAS LÍNEAS después de las importaciones existentes

import anuncioRoutes from "./src/routes/anuncioRoutes.js";
import foroRoutes from "./src/routes/foroRoutes.js";
import mensajeRoutes from "./src/routes/mensajeRoutes.js";
import notificacionRoutes from "./src/routes/notificacionRoutes.js";
import reporteRoutes from "./src/routes/reporteRoutes.js";

// Importar rutas de calificaciones
import calificacionesRoutes from "./src/routes/calificacionesRoutes.js";

// Importar rutas de notas
import notasAlumnoRoutes from "./src/routes/notasAlumnoRoutes.js";

// Importar rutas de perfil
import perfilRoutes from "./src/routes/perfilRoutes.js";

// Importar ruta solicitud inscripcion
import solicitudInscripcionRoutes from "./src/routes/solicitudInscripcionRoutes.js";


const app = express();
const server = createServer(app); // 🔹 Crear servidor HTTP

// 🆕 Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🆕 Crear directorios de uploads si no existen
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
const subdirs = ["tareas", "entregas", "materiales"];

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📁 Directorio de uploads creado: ${uploadDir}`);
}

subdirs.forEach(subdir => {
  const fullPath = path.join(uploadDir, subdir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`📁 Subdirectorio creado: ${fullPath}`);
  }
});

// Socket.io configurado
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🆕 Servir archivos estáticos con path absoluto
app.use("/uploads", express.static(path.join(__dirname, uploadDir)));

// Logging middleware (opcional pero útil)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => {
    console.error("❌ Error MongoDB:", err);
    process.exit(1); // Salir si no puede conectar a la BD
  });

// Rutas API
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/cursos", cursoRoutes);
app.use("/api/clases", claseRoutes);
app.use("/api/inscripciones", inscripcionRoutes);
app.use("/api/examenes", examenRoutes);
app.use("/api/tareas", tareaRoutes);
app.use("/api/entregas", entregaRoutes);
app.use("/api/anuncios", anuncioRoutes);
app.use("/api/foros", foroRoutes);
app.use("/api/mensajes", mensajeRoutes);
app.use("/api/notificaciones", notificacionRoutes);
app.use("/api/reportes", reporteRoutes);
app.use("/api/calificaciones", calificacionesRoutes);
app.use("/api/notas-alumno", notasAlumnoRoutes);
app.use("/api/perfil", perfilRoutes);
app.use("/api/solicitudes-inscripcion", solicitudInscripcionRoutes);
// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ 
    msg: "API de Aula Virtual funcionando", 
    version: "1.0.0",
    endpoints: [
      "/api/usuarios",
      "/api/cursos",
      "/api/clases",
      "/api/inscripciones",
      "/api/examenes",
      "/api/tareas",
      "/api/entregas"
    ]
  });
});

// 🆕 Middleware de manejo de errores de multer (debe ir DESPUÉS de las rutas)
app.use(handleMulterError);

// 🆕 Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  
  // Errores de validación de Mongoose
  if (err.name === "ValidationError") {
    return res.status(400).json({ 
      msg: "Error de validación",
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // Errores de duplicado (E11000)
  if (err.code === 11000) {
    return res.status(400).json({ 
      msg: "Ya existe un registro con estos datos" 
    });
  }
  
  // Error genérico
  res.status(err.status || 500).json({ 
    msg: err.message || "Error del servidor" 
  });
});

// 🔔 Socket.io - Conexión
io.on("connection", (socket) => {
  console.log("🟢 Usuario conectado al socket:", socket.id);

  // Unirse a una sala específica (por ejemplo, por curso)
  socket.on("joinCourse", (cursoId) => {
    socket.join(`curso-${cursoId}`);
    console.log(`👤 Usuario ${socket.id} se unió al curso ${cursoId}`);
  });

  // Notificación de nueva tarea
  socket.on("nuevaTarea", (data) => {
    console.log("📋 Nueva tarea creada:", data);
    io.to(`curso-${data.cursoId}`).emit("nuevaTarea", data);
  });

  // Notificación de nueva entrega
  socket.on("nuevaEntrega", (data) => {
    console.log("📤 Nueva entrega recibida:", data);
    io.to(`curso-${data.cursoId}`).emit("nuevaEntrega", data);
  });

  // Notificación de calificación
  socket.on("nuevaCalificacion", (data) => {
    console.log("✅ Nueva calificación:", data);
    socket.to(data.alumnoSocketId).emit("nuevaCalificacion", data);
  });

  // Notificación genérica
  socket.on("enviarNotificacion", (data) => {
    console.log("📩 Notificación recibida:", data);
    io.emit("nuevaNotificacion", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Usuario desconectado:", socket.id);
  });
});

// Puerto
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📁 Uploads: ${path.join(__dirname, uploadDir)}`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
  console.log(`${"=".repeat(50)}\n`);
});

// 🆕 Manejo de cierre graceful
process.on("SIGTERM", () => {
  console.log("⚠️ SIGTERM recibido. Cerrando servidor...");
  server.close(() => {
    console.log("✅ Servidor cerrado");
    mongoose.connection.close(false, () => {
      console.log("✅ Conexión a MongoDB cerrada");
      process.exit(0);
    });
  });
});

process.on("SIGINT", () => {
  console.log("\n⚠️ SIGINT recibido. Cerrando servidor...");
  server.close(() => {
    console.log("✅ Servidor cerrado");
    mongoose.connection.close(false, () => {
      console.log("✅ Conexión a MongoDB cerrada");
      process.exit(0);
    });
  });
});

// 🆕 Manejo de errores no capturados
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});