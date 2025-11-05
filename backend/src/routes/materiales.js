// routes/materiales.js
import express from "express";
import { auth, esDocente } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { subirMaterial, listarMateriales } from "../controllers/materialController.js";

const router = express.Router();

// Subir material (solo docente/admin)
router.post("/:cursoId", auth, esDocente, upload.single("archivo"), subirMaterial);

// Listar materiales (todos los roles)
router.get("/:cursoId", auth, listarMateriales);

export default router;
