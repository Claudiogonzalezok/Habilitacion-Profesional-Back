// routes/notasAlumnoRoutes.js
import express from "express";
import { auth } from "../middlewares/authMiddleware.js";
import {
  obtenerResumenNotas,
  obtenerNotasCurso,
  obtenerTodasLasNotas
} from "../controllers/notasAlumnoController.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

// Obtener resumen de notas (para dashboard del alumno)
router.get("/resumen", obtenerResumenNotas);

// Obtener todas las notas del alumno
router.get("/todas", obtenerTodasLasNotas);

// Obtener notas detalladas de un curso específico
router.get("/curso/:cursoId", obtenerNotasCurso);

export default router;