// routes/cursoRoutes.js
import express from "express";
import { crearCurso, listarCursos } from "../controllers/cursoController.js";
import { auth, esDocente } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", auth, esDocente, crearCurso);
router.get("/", auth, listarCursos);

export default router;
