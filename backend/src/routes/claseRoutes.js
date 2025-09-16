// routes/claseRoutes.js
import express from "express";
import { crearClase, listarClases } from "../controllers/claseController.js";
import { auth, esDocente } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", auth, esDocente, crearClase);
router.get("/:cursoId", auth, listarClases);

export default router;
