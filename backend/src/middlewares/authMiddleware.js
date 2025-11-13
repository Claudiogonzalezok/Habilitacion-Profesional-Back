// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

export const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ msg: "No hay token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = await Usuario.findById(decoded.id).select("-password");
    
    if (!req.usuario) {
      return res.status(401).json({ msg: "Usuario no encontrado" });
    }
    
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token inválido" });
  }
};

export const esAlumno = (req, res, next) => {
  if (req.usuario.rol !== "alumno") {
    return res.status(403).json({ msg: "Acceso denegado - Solo alumnos" });
  }
  next();
};

export const esAdmin = (req, res, next) => {
  if (req.usuario.rol !== "admin") {
    return res.status(403).json({ msg: "Acceso denegado - Solo administradores" });
  }
  next();
};

export const esDocente = (req, res, next) => {
  if (req.usuario.rol !== "docente" && req.usuario.rol !== "admin") {
    return res.status(403).json({ msg: "Acceso denegado - Solo docentes" });
  }
  next();
};

export const esDocenteOAdmin = (req, res, next) => {
  if (req.usuario.rol !== "docente" && req.usuario.rol !== "admin") {
    return res.status(403).json({ msg: "Acceso denegado - Requiere rol docente o admin" });
  }
  next();
};

export const verificarAccesoCurso = async (req, res, next) => {
  try {
    const { id, cursoId } = req.params;
    const Curso = (await import("../models/Curso.js")).default;
    
    const curso = await Curso.findById(id || cursoId);
    
    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Admin puede todo
    if (req.usuario.rol === "admin") {
      req.curso = curso;
      return next();
    }

    // Docente solo sus cursos
    if (req.usuario.rol === "docente") {
      if (curso.docente.toString() !== req.usuario._id.toString()) {
        return res.status(403).json({ msg: "No tienes acceso a este curso" });
      }
      req.curso = curso;
      return next();
    }

    // Alumno solo cursos inscritos
    if (req.usuario.rol === "alumno") {
      const estaInscrito = curso.alumnos.some(
        alumno => alumno.toString() === req.usuario._id.toString()
      );
      if (!estaInscrito) {
        return res.status(403).json({ msg: "No estás inscrito en este curso" });
      }
      req.curso = curso;
      return next();
    }

    res.status(403).json({ msg: "Acceso denegado" });
  } catch (error) {
    res.status(500).json({ msg: "Error al verificar acceso" });
  }
};