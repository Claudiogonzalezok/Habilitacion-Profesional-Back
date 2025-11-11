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
  obtenerEstadisticas,
  obtenerAlumnosCurso
} from "../controllers/cursoController.js";
import { auth, esAdmin, esDocenteOAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rutas con autenticación (todos los roles)
router.get("/", auth, listarCursos);
router.get("/:id", auth, obtenerCurso);
router.get("/:id/estadisticas", auth, obtenerEstadisticas);

// 🆕 NUEVA: Obtener alumnos de un curso (docente y admin)
router.get("/:id/alumnos", auth, esDocenteOAdmin, obtenerAlumnosCurso);

// Rutas de docente/admin
router.post("/", auth, esDocenteOAdmin, crearCurso);
router.put("/:id", auth, esDocenteOAdmin, actualizarCurso);
router.delete("/:id", auth, esAdmin, eliminarCurso); // Solo admin puede eliminar

// Inscripciones - SOLO ADMIN
router.post("/:id/inscribir", auth, esAdmin, inscribirAlumno);
router.post("/:id/desinscribir", auth, esAdmin, desinscribirAlumno);

export default router;