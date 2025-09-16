// routes/usuarioRoutes.js
import express from "express";
import { registrarUsuario, login } from "../controllers/usuarioController.js";

const router = express.Router();

router.post("/register", registrarUsuario);
router.post("/login", login);

export default router;
