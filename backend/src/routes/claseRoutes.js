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
import { auth, esDocenteOAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rutas con autenticación (todos los roles con verificación de acceso)
router.get("/curso/:cursoId", auth, obtenerClasesPorCurso);
router.get("/:id", auth, obtenerClase);

// Rutas de docente/admin
router.post("/", auth, esDocenteOAdmin, crearClase);
router.put("/:id", auth, esDocenteOAdmin, actualizarClase);
router.delete("/:id", auth, esDocenteOAdmin, eliminarClase);

// Materiales (docente y admin)
router.post("/:id/materiales", auth, esDocenteOAdmin, agregarMaterial);
router.delete("/:id/materiales/:materialId", auth, esDocenteOAdmin, eliminarMaterial);

// Asistencia y estado (docente y admin)
router.post("/:id/asistencia", auth, esDocenteOAdmin, registrarAsistencia);
router.put("/:id/estado", auth, esDocenteOAdmin, cambiarEstado);

export default router;