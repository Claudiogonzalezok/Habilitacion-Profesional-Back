// routes/examenRoutes.js
import express from "express";
import { auth, esDocente } from "../middlewares/authMiddleware.js";
import { crearExamen, listarExamenes, registrarNota, listarNotas } from "../controllers/examenController.js";

const router = express.Router();

// Docente/admin
router.post("/", auth, esDocente, crearExamen);
router.post("/notas", auth, esDocente, registrarNota);

// Todos los usuarios
router.get("/curso/:cursoId", auth, listarExamenes);
router.get("/notas/:alumnoId", auth, listarNotas);

export default router;
