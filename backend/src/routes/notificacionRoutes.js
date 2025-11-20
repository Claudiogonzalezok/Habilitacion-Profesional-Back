// backend/src/routes/notificacionRoutes.js
import express from "express";
import {
  obtenerNotificaciones,
  obtenerNotificacion,
  marcarComoLeida,
  marcarTodasLeidas,
  eliminarNotificacion,
  eliminarTodasLeidas,
  obtenerNoLeidas,
  obtenerRecientes,
  crearNotificacion,
  crearNotificacionMasiva,
  obtenerEstadisticas
} from "../controllers/notificacionController.js";
import { auth, esAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rutas de usuario
router.get("/", auth, obtenerNotificaciones);
router.get("/recientes", auth, obtenerRecientes);
router.get("/no-leidas/count", auth, obtenerNoLeidas);
router.get("/estadisticas", auth, obtenerEstadisticas);
router.get("/:id", auth, obtenerNotificacion);

// Marcar como leída
router.put("/:id/leida", auth, marcarComoLeida);
router.put("/marcar-todas-leidas", auth, marcarTodasLeidas);

// Eliminar
router.delete("/:id", auth, eliminarNotificacion);
router.delete("/leidas/todas", auth, eliminarTodasLeidas);

// Rutas de admin
router.post("/", auth, esAdmin, crearNotificacion);
router.post("/masiva", auth, esAdmin, crearNotificacionMasiva);

export default router;
