// routes/cursoRoutes.js
import express from "express";
import { 
  crearCurso, 
  listarCursos, 
  obtenerCurso,
  actualizarCurso,
  eliminarCurso,
  inscribirAlumno,
  desinscribirAlumno,
  obtenerEstadisticas
} from "../controllers/cursoController.js";
import { auth, esDocente, esAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rutas públicas (con autenticación)
router.get("/", auth, listarCursos);
router.get("/:id", auth, obtenerCurso);
router.get("/:id/estadisticas", auth, obtenerEstadisticas);

// Rutas de docente/admin
router.post("/", auth, esDocente, crearCurso);
router.put("/:id", auth, actualizarCurso);
router.delete("/:id", auth, eliminarCurso);

// Inscripciones
router.post("/:id/inscribir", auth, esDocente, inscribirAlumno);
router.post("/:id/desinscribir", auth, esDocente, desinscribirAlumno);

export default router;