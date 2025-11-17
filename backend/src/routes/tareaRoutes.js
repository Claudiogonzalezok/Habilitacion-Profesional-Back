// backend/src/routes/tareaRoutes.js
import express from "express";
import {
  listarTareas,
  obtenerTarea,
  crearTarea,
  actualizarTarea,
  eliminarTarea,
  obtenerTareasPorCurso,
  obtenerTareasProximas,
  duplicarTarea,
} from "../controllers/tareaController.js";
import { auth, esDocente, esDocenteOAdmin } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// ========== RUTAS PROTEGIDAS - DOCENTES ==========
router.get("/", auth, listarTareas); // Listar todas (filtradas por rol)
router.get("/proximas", auth, obtenerTareasProximas); // Tareas próximas a vencer
router.get("/curso/:cursoId", auth, obtenerTareasPorCurso); // Tareas de un curso específico
router.get("/:id", auth, obtenerTarea); // Detalle de una tarea

router.post("/", auth, esDocenteOAdmin, upload.array("archivos", 10), crearTarea);
router.put("/:id", auth, esDocenteOAdmin, upload.array("archivos", 10), actualizarTarea);
router.delete("/:id", auth, esDocenteOAdmin, eliminarTarea);
router.post("/:id/duplicar", auth, esDocenteOAdmin, duplicarTarea);

export default router;
