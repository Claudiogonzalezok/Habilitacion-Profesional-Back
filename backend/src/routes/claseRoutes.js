// routes/claseRoutes.js
import express from "express";
import {
  obtenerClasesPorCurso,
  obtenerClase,
  crearClase,
  actualizarClase,
  eliminarClase,
  agregarMaterial,
  eliminarMaterial,
  registrarAsistencia,
  cambiarEstado
} from "../controllers/claseController.js";
import { auth, esDocente } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rutas públicas (con autenticación)
router.get("/curso/:cursoId", auth, obtenerClasesPorCurso);
router.get("/:id", auth, obtenerClase);

// Rutas de docente/admin
router.post("/", auth, esDocente, crearClase);
router.put("/:id", auth, actualizarClase);
router.delete("/:id", auth, eliminarClase);

// Materiales
router.post("/:id/materiales", auth, esDocente, agregarMaterial);
router.delete("/:id/materiales/:materialId", auth, esDocente, eliminarMaterial);

// Asistencia y estado
router.post("/:id/asistencia", auth, esDocente, registrarAsistencia);
router.put("/:id/estado", auth, esDocente, cambiarEstado);

export default router;