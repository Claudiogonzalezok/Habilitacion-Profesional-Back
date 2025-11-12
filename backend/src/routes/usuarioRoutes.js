// routes/usuarioRoutes.js
import express from "express";
import {
  registrarUsuario,
  login,
  logout,
  refreshToken,
  solicitarRecuperacion,
  restablecerPassword,
  verificarEmail,           // 🆕 NUEVO
  reenviarVerificacion,     // 🆕 NUEVO
  listarUsuarios,
  obtenerUsuario,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from "../controllers/usuarioController.js";
import { auth, esAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ========== RUTAS PÚBLICAS ==========
router.post("/register", registrarUsuario);
router.post("/login", login);

// 🆕 Recuperación de contraseña
router.post("/forgot-password", solicitarRecuperacion);
router.post("/reset-password/:token", restablecerPassword);

// 🆕 Verificación de email
router.get("/verify-email/:token", verificarEmail);
router.post("/resend-verification", reenviarVerificacion);

// 🆕 Refresh token
router.post("/refresh-token", refreshToken);

// ========== RUTAS PROTEGIDAS ==========
// 🆕 Logout
router.post("/logout", auth, logout);

// Rutas protegidas - SOLO ADMINISTRADORES
router.get("/", auth, esAdmin, listarUsuarios);
router.post("/", auth, esAdmin, crearUsuario);
router.get("/:id", auth, esAdmin, obtenerUsuario);
router.put("/:id", auth, esAdmin, actualizarUsuario);
router.delete("/:id", auth, esAdmin, eliminarUsuario);

export default router;