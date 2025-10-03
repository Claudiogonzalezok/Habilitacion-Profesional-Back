// routes/claseRoutes.js
import express from "express";
import { crearClase, listarClases } from "../controllers/claseController.js";
import { auth, esDocente } from "../middlewares/authMiddleware.js";
import { subirMaterial } from "../controllers/claseController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/", auth, esDocente, crearClase);
router.get("/:cursoId", auth, listarClases);
router.post("/:id/materiales", auth, esDocente, upload.single("archivo"), subirMaterial);

export default router;
