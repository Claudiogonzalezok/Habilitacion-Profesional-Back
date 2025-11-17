// backend/src/routes/inscripcionRoutes.js
import express from "express";
import {
  inscribirAlumnoAdmin,
  obtenerInscritosCurso,
  eliminarInscripcion,
  obtenerMisInscripciones,
  solicitarInscripcion,
  actualizarEstadoInscripcion
} from "../controllers/inscripcionController.js";
import { auth, esDocenteOAdmin } from "../middlewares/authMiddleware.js"; // 🔥 CORREGIDO

const router = express.Router();

// Admin/Docente inscribe alumno
router.post("/admin", auth, esDocenteOAdmin, inscribirAlumnoAdmin);

// Obtener inscritos de un curso
router.get("/curso/:cursoId", auth, obtenerInscritosCurso);

// Eliminar inscripción
router.delete("/:id", auth, esDocenteOAdmin, eliminarInscripcion);

// Alumno: Obtener mis inscripciones
router.get("/mis-inscripciones", auth, obtenerMisInscripciones);

// OPCIONAL: Alumno solicita inscripción
router.post("/solicitar", auth, solicitarInscripcion);

// OPCIONAL: Admin aprueba/rechaza
router.patch("/:id/estado", auth, esDocenteOAdmin, actualizarEstadoInscripcion);

export default router;
