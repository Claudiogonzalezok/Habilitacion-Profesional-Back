// routes/examenRoutes.js
import express from "express";
import {
  crearExamen,
  listarExamenes,
  obtenerExamen,
  actualizarExamen,
  eliminarExamen,
  iniciarIntento,
  enviarRespuestas,
  calificarManualmente,
  obtenerEstadisticas
} from "../controllers/examenController.js";
import { auth, esDocenteOAdmin, esAlumno } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rutas generales (con autenticación)
router.get("/", auth, listarExamenes);
router.get("/:id", auth, obtenerExamen);

// Rutas de docente/admin
router.post("/", auth, esDocenteOAdmin, crearExamen);
router.put("/:id", auth, esDocenteOAdmin, actualizarExamen);
router.delete("/:id", auth, esDocenteOAdmin, eliminarExamen);

// Calificación manual (docente/admin)
router.post("/:id/calificar", auth, esDocenteOAdmin, calificarManualmente);

// Estadísticas (docente/admin)
router.get("/:id/estadisticas", auth, esDocenteOAdmin, obtenerEstadisticas);

// Rutas de alumno
router.post("/:id/iniciar", auth, iniciarIntento);
router.post("/:id/enviar", auth, enviarRespuestas);

export default router;