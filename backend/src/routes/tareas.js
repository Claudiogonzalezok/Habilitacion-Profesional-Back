// routes/tareas.js
import express from "express";
import { auth, esAlumno, esDocente } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import {
  crearTarea,
  listarTareas,
  entregarTarea,
  listarEntregas,
  calificarEntrega,
} from "../controllers/tareaController.js";

const router = express.Router();

// Docente/Admin crea tarea
router.post("/:cursoId", auth, esDocente, crearTarea);

// Listar tareas de un curso (todos los roles)
router.get("/:cursoId", auth, listarTareas);

// Alumno entrega tarea
router.post("/:tareaId/entregar", auth, esAlumno, upload.single("archivo"), entregarTarea);

// Docente ve entregas
router.get("/:tareaId/entregas", auth, esDocente, listarEntregas);

// Docente califica entrega
router.post("/entrega/:entregaId/calificar", auth, esDocente, calificarEntrega);

export default router;
