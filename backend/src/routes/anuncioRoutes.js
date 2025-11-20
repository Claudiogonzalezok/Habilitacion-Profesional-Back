// backend/src/routes/anuncioRoutes.js
import express from "express";
import {
  crearAnuncio,
  obtenerAnunciosPorCurso,
  obtenerAnuncio,
  actualizarAnuncio,
  eliminarAnuncio,
  marcarComoLeido,
  obtenerNoLeidos,
  toggleFijar
} from "../controllers/anuncioController.js";
import { auth, esDocenteOAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rutas públicas (con autenticación)
router.get("/curso/:cursoId", auth, obtenerAnunciosPorCurso);
router.get("/no-leidos", auth, obtenerNoLeidos);
router.get("/:id", auth, obtenerAnuncio);

// Marcar como leído (cualquier usuario autenticado)
router.patch("/:id/leido", auth, marcarComoLeido);

// Rutas de docente/admin
router.post("/", auth, esDocenteOAdmin, crearAnuncio);
router.put("/:id", auth, esDocenteOAdmin, actualizarAnuncio);
router.delete("/:id", auth, esDocenteOAdmin, eliminarAnuncio);
router.patch("/:id/fijar", auth, esDocenteOAdmin, toggleFijar);

export default router;
