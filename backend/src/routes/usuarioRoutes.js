// routes/usuarioRoutes.js
import express from "express";
import {
    registrarUsuario,
    login,
    listarUsuarios,
    obtenerUsuario,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
} from "../controllers/usuarioController.js";
import { auth, esAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rutas públicas
router.post("/register", registrarUsuario);
router.post("/login", login);

// Rutas protegidas - SOLO ADMINISTRADORES
router.get("/", auth, esAdmin, listarUsuarios);
router.post("/", auth, esAdmin, crearUsuario);
router.get("/:id", auth, esAdmin, obtenerUsuario);
router.put("/:id", auth, esAdmin, actualizarUsuario);
router.delete("/:id", auth, esAdmin, eliminarUsuario);

export default router;