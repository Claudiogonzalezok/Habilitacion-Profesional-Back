// backend/src/routes/entregaRoutes.js
import express from "express";
import {
  listarEntregas,
  obtenerEntrega,
  crearEntrega,
  actualizarEntrega,
  calificarEntrega,
  obtenerMisEntregas,
  obtenerEntregasPorTarea,
  exportarCalificaciones,
  devolverEntrega,
} from "../controllers/entregaController.js";
import { auth, esDocente, esDocenteOAdmin, esAlumno } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// ========== RUTAS PARA ALUMNOS ==========
router.get("/mis-entregas", auth, esAlumno, obtenerMisEntregas);
router.post("/", auth, esAlumno, upload.array("archivos", 5), crearEntrega);
router.put("/:id", auth, esAlumno, upload.array("archivos", 5), actualizarEntrega);
router.get("/:id", auth, obtenerEntrega);

// ========== RUTAS PARA DOCENTES ==========
router.get("/tarea/:tareaId", auth, esDocenteOAdmin, obtenerEntregasPorTarea);
router.post("/:id/calificar", auth, esDocenteOAdmin, upload.array("archivosDevolucion", 5), calificarEntrega);
router.post("/:id/devolver", auth, esDocenteOAdmin, devolverEntrega);
router.get("/tarea/:tareaId/exportar", auth, esDocenteOAdmin, exportarCalificaciones);

export default router;