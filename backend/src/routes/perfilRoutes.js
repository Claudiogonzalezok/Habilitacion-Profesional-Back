// routes/perfilRoutes.js
import express from "express";
import { auth } from "../middlewares/authMiddleware.js";
import { handleUploadPerfil } from "../middlewares/uploadMiddleware.js";
import {
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
  subirImagenPerfil,
  eliminarImagenPerfil,
  obtenerEstadisticas,
  actualizarPreferencias
} from "../controllers/perfilController.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

// Obtener perfil del usuario logueado
router.get("/", obtenerPerfil);

// Actualizar datos del perfil
router.put("/", actualizarPerfil);

// Cambiar contraseña
router.put("/password", cambiarPassword);

// Subir imagen de perfil
router.post("/imagen", handleUploadPerfil, subirImagenPerfil);

// Eliminar imagen de perfil
router.delete("/imagen", eliminarImagenPerfil);

// Obtener estadísticas del usuario
router.get("/estadisticas", obtenerEstadisticas);

// Actualizar preferencias
router.put("/preferencias", actualizarPreferencias);

export default router;