import "./loadEnv.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Obtener __dirname primero (necesario para ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la carpeta backend
dotenv.config({ path: path.join(__dirname, ".env") });

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
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
import anuncioRoutes from "./src/routes/anuncioRoutes.js";
import foroRoutes from "./src/routes/foroRoutes.js";
import mensajeRoutes from "./src/routes/mensajeRoutes.js";
import notificacionRoutes from "./src/routes/notificacionRoutes.js";
import reporteRoutes from "./src/routes/reporteRoutes.js";
import calificacionesRoutes from "./src/routes/calificacionesRoutes.js";
import notasAlumnoRoutes from "./src/routes/notasAlumnoRoutes.js";
import perfilRoutes from "./src/routes/perfilRoutes.js";
import solicitudInscripcionRoutes from "./src/routes/solicitudInscripcionRoutes.js";

const app = express();
const server = createServer(app);

// Configuración de directorios de uploads
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
const uploadsPath = path.join(__dirname, "uploads");
const subdirs = ["tareas", "entregas", "materiales", "perfiles"];

// Crear directorios de uploads si no existen
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log(`📁 Directorio de uploads creado: ${uploadsPath}`);
}

subdirs.forEach(subdir => {
  const fullPath = path.join(uploadsPath, subdir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`📁 Subdirectorio creado: ${fullPath}`);
  }
});

// ============================================
// CONFIGURACIÓN DE CORS PARA PRODUCCIÓN
// ============================================
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000"
].filter(Boolean);

// Socket.io configurado con CORS
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      // Permitir requests sin origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // En producción, verificar si el origin está permitido
      if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
        callback(null, true);
      } else {
        // Permitir cualquier origen de Vercel en producción
        if (origin.includes('vercel.app')) {
          callback(null, true);
        } else {
          console.log(`⚠️ Origin no permitido: ${origin}`);
          callback(null, true); // Permitir de todos modos para evitar problemas
        }
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Middleware CORS para Express
app.use(cors({
  origin: function(origin, callback) {
    // Permitir requests sin origin
    if (!origin) return callback(null, true);
    
    // Permitir orígenes configurados
    if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
      callback(null, true);
    } else if (origin.includes('vercel.app') || origin.includes('render.com')) {
      // Permitir cualquier subdominio de Vercel o Render
      callback(null, true);
    } else {
      console.log(`⚠️ CORS - Origin no permitido: ${origin}`);
      callback(null, true); // Permitir de todos modos
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middlewares de parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos (uploads)
app.use("/uploads", express.static(uploadsPath));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// CONEXIÓN A MONGODB
// ============================================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => {
    console.error("❌ Error MongoDB:", err);
    process.exit(1);
  });

// ============================================
// RUTAS API
// ============================================
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

// Ruta de prueba / Health check
app.get("/", (req, res) => {
  res.json({ 
    msg: "API de Aula Virtual funcionando", 
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
});

// Health check para Render
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// ============================================
// MANEJO DE ERRORES
// ============================================
app.use(handleMulterError);

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  
  if (err.name === "ValidationError") {
    return res.status(400).json({ 
      msg: "Error de validación",
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({ 
      msg: "Ya existe un registro con estos datos" 
    });
  }
  
  res.status(err.status || 500).json({ 
    msg: err.message || "Error del servidor" 
  });
});

// ============================================
// SOCKET.IO - EVENTOS
// ============================================
io.on("connection", (socket) => {
  console.log("🟢 Usuario conectado al socket:", socket.id);

  socket.on("joinCourse", (cursoId) => {
    socket.join(`curso-${cursoId}`);
    console.log(`👤 Usuario ${socket.id} se unió al curso ${cursoId}`);
  });

  socket.on("nuevaTarea", (data) => {
    console.log("📋 Nueva tarea creada:", data);
    io.to(`curso-${data.cursoId}`).emit("nuevaTarea", data);
  });

  socket.on("nuevaEntrega", (data) => {
    console.log("📤 Nueva entrega recibida:", data);
    io.to(`curso-${data.cursoId}`).emit("nuevaEntrega", data);
  });

  socket.on("nuevaCalificacion", (data) => {
    console.log("✅ Nueva calificación:", data);
    socket.to(data.alumnoSocketId).emit("nuevaCalificacion", data);
  });

  socket.on("enviarNotificacion", (data) => {
    console.log("📩 Notificación recibida:", data);
    io.emit("nuevaNotificacion", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Usuario desconectado:", socket.id);
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Entorno: ${process.env.NODE_ENV || "development"}`);
  console.log(`📁 Uploads: ${uploadsPath}`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || "No configurado"}`);
  console.log(`${"=".repeat(50)}\n`);
});

// ============================================
// MANEJO DE CIERRE GRACEFUL
// ============================================
const gracefulShutdown = (signal) => {
  console.log(`\n⚠️ ${signal} recibido. Cerrando servidor...`);
  server.close(() => {
    console.log("✅ Servidor HTTP cerrado");
    mongoose.connection.close(false, () => {
      console.log("✅ Conexión a MongoDB cerrada");
      process.exit(0);
    });
  });
  
  // Forzar cierre después de 10 segundos
  setTimeout(() => {
    console.error("❌ Cierre forzado después de 10s");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});