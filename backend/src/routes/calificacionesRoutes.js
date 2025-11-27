// routes/calificacionesRoutes.js
import express from "express";
import { auth, esDocenteOAdmin } from "../middlewares/authMiddleware.js";
import {
  obtenerCalificacionesCurso,
  obtenerCalificacionesAlumno,
  obtenerCursosDocente,
  obtenerResumenExportacion
} from "../controllers/calificacionesController.js";

const router = express.Router();

// Todas las rutas requieren autenticación y rol docente/admin
router.use(auth);
router.use(esDocenteOAdmin);

// Obtener cursos del docente (para el selector)
router.get("/cursos", obtenerCursosDocente);

// Obtener calificaciones de todos los alumnos de un curso
router.get("/curso/:cursoId", obtenerCalificacionesCurso);

// Obtener calificaciones detalladas de un alumno específico
router.get("/curso/:cursoId/alumno/:alumnoId", obtenerCalificacionesAlumno);

// Obtener datos para exportación (puede filtrar por alumnos específicos)
router.post("/curso/:cursoId/exportar", obtenerResumenExportacion);

export default router;