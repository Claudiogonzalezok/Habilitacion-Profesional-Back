// controllers/cursoController.js
import Curso from "../models/Curso.js";

export const crearCurso = async (req, res) => {
  try {
    const curso = new Curso({ ...req.body, docente: req.usuario._id });
    await curso.save();
    res.json(curso);
  } catch (error) {
    res.status(500).json({ msg: "Error al crear curso" });
  }
};

export const listarCursos = async (req, res) => {
  try {
    const cursos = await Curso.find().populate("docente", "nombre email");
    res.json(cursos);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener cursos" });
  }
};
