// backend/src/routes/mensajeRoutes.js
import express from "express";
import {
  enviarMensaje,
  obtenerConversacion,
  obtenerConversaciones,
  marcarComoLeido,
  marcarConversacionLeida,
  eliminarMensaje,
  obtenerNoLeidos,
  buscarUsuarios
} from "../controllers/mensajeController.js";
import { auth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.post("/", auth, enviarMensaje);
router.get("/conversaciones", auth, obtenerConversaciones);
router.get("/conversacion/:usuarioId", auth, obtenerConversacion);
router.get("/no-leidos/count", auth, obtenerNoLeidos);
router.get("/buscar-usuarios", auth, buscarUsuarios);

// Marcar como leído
router.put("/:id/leido", auth, marcarComoLeido);
router.put("/conversacion/:usuarioId/leido", auth, marcarConversacionLeida);

// Eliminar
router.delete("/:id", auth, eliminarMensaje);

export default router;
