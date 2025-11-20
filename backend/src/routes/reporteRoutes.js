// backend/src/routes/reporteRoutes.js
import express from "express";
import {
  obtenerEstadisticasGenerales,
  obtenerReporteCurso,
  obtenerReporteAlumno
} from "../controllers/reporteController.js";
import { auth, esDocenteOAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Estadísticas generales (todos los roles autenticados)
router.get("/estadisticas-generales", auth, obtenerEstadisticasGenerales);

// Reporte de curso (docente del curso o admin)
router.get("/curso/:cursoId", auth, esDocenteOAdmin, obtenerReporteCurso);

// Reporte de alumno (el mismo alumno, docente o admin)
router.get("/alumno/:alumnoId", auth, obtenerReporteAlumno);

export default router;
