// backend/src/routes/foroRoutes.js
import express from "express";
import {
  crearForo,
  listarForos,
  obtenerForo,
  responderForo,
  eliminarForo,
  eliminarRespuesta,
  toggleCerrarForo,
  toggleFijar
} from "../controllers/foroController.js";
import { auth, esDocenteOAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rutas generales (con autenticación)
router.get("/curso/:cursoId", auth, listarForos);
router.get("/:id", auth, obtenerForo);
router.post("/", auth, crearForo);
router.post("/:id/responder", auth, responderForo);

// Eliminar (autor, docente o admin)
router.delete("/:id", auth, eliminarForo);
router.delete("/:foroId/respuestas/:respuestaId", auth, eliminarRespuesta);

// Acciones de docente/admin
router.patch("/:id/cerrar", auth, esDocenteOAdmin, toggleCerrarForo);
router.patch("/:id/fijar", auth, esDocenteOAdmin, toggleFijar);

export default router;
