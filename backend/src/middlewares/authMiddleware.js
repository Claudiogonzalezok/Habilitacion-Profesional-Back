// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

export const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ msg: "No hay token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = await Usuario.findById(decoded.id).select("-password");
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token inválido" });
  }
};

export const esAlumno = (req, res, next) => {
  if (req.usuario.rol !== "alumno") return res.status(403).json({ msg: "Acceso denegado" });
  next();
};

export const esAdmin = (req, res, next) => {
  if (req.usuario.rol !== "admin") {
    return res.status(403).json({ msg: "Acceso denegado" });
  }
  next();
};

export const esDocente = (req, res, next) => {
  if (req.usuario.rol !== "docente" && req.usuario.rol !== "admin") {
    return res.status(403).json({ msg: "Acceso denegado" });
  }
  next();
};
