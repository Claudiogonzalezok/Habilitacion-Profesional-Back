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


const router = express.Router();

router.post("/register", registrarUsuario);
router.post("/login", login);

router.get("/", listarUsuarios);
router.post("/", crearUsuario);
router.get("/:id", obtenerUsuario);
router.put("/:id", actualizarUsuario);
router.delete("/:id", eliminarUsuario);

export default router;
