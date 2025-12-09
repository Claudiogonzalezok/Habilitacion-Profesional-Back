// backend/src/routes/claseRoutes.js
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
  cambiarEstado,
  sincronizarEstados,
  obtenerClasesProximas,
} from "../controllers/claseController.js";
import { auth, esDocenteOAdmin, esAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rutas públicas con autenticación
router.get("/curso/:cursoId", auth, obtenerClasesPorCurso);
router.get("/proximas", auth, obtenerClasesProximas);
router.get("/:id", auth, obtenerClase);

// Rutas de docente/admin
router.post("/", auth, esDocenteOAdmin, crearClase);
router.put("/:id", auth, esDocenteOAdmin, actualizarClase);
router.delete("/:id", auth, esDocenteOAdmin, eliminarClase);

// Materiales
router.post("/:id/materiales", auth, esDocenteOAdmin, agregarMaterial);
router.delete("/:id/materiales/:materialId", auth, esDocenteOAdmin, eliminarMaterial);

// Asistencia y estado
router.post("/:id/asistencia", auth, esDocenteOAdmin, registrarAsistencia);
router.put("/:id/estado", auth, esDocenteOAdmin, cambiarEstado);

// Sincronización de estados (admin o docente)
router.post("/sincronizar-estados", auth, esDocenteOAdmin, sincronizarEstados);

export default router;