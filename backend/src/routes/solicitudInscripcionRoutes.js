// routes/solicitudInscripcionRoutes.js
import express from "express";
import { auth, esAdmin } from "../middlewares/authMiddleware.js";
import {
  // Funciones para alumnos
  obtenerCursosDisponibles,
  crearSolicitud,
  obtenerMisSolicitudes,
  cancelarSolicitud,
  // Funciones para admin
  obtenerTodasSolicitudes,
  obtenerResumenSolicitudes,
  aprobarSolicitud,
  rechazarSolicitud,
  aprobarMultiples
} from "../controllers/solicitudInscripcionController.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

// ============================================
// RUTAS PARA ALUMNOS
// ============================================

// Obtener cursos disponibles para inscripción
router.get("/cursos-disponibles", obtenerCursosDisponibles);

// Crear solicitud de inscripción
router.post("/", crearSolicitud);

// Obtener mis solicitudes
router.get("/mis-solicitudes", obtenerMisSolicitudes);

// Cancelar una solicitud pendiente
router.put("/cancelar/:solicitudId", cancelarSolicitud);

// ============================================
// RUTAS PARA ADMIN
// ============================================

// Obtener resumen de solicitudes (para dashboard)
router.get("/resumen", esAdmin, obtenerResumenSolicitudes);

// Obtener todas las solicitudes (con filtros y paginación)
router.get("/todas", esAdmin, obtenerTodasSolicitudes);

// Aprobar solicitud
router.put("/aprobar/:solicitudId", esAdmin, aprobarSolicitud);

// Rechazar solicitud
router.put("/rechazar/:solicitudId", esAdmin, rechazarSolicitud);

// Aprobar múltiples solicitudes
router.put("/aprobar-multiples", esAdmin, aprobarMultiples);

export default router;