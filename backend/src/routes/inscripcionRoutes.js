// routes/inscripcionRoutes.js
import express from "express";
import { solicitarInscripcion, gestionarInscripcion } from "../controllers/inscripcionController.js";
import { auth, esDocente } from "../middlewares/authMiddleware.js";
import { listarInscripciones } from "../controllers/inscripcionController.js";

const router = express.Router();

router.post("/", auth, solicitarInscripcion);
router.put("/:id", auth, esDocente, gestionarInscripcion);
router.get("/", auth, esDocente, listarInscripciones);
export default router;
