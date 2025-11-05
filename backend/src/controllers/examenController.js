// controllers/examenController.js
import Examen from "../models/Examen.js";
import Nota from "../models/Nota.js";
import { io } from "socket.io-client";

export const crearExamen = async (req, res) => {
  try {
    const examen = new Examen({ ...req.body, curso: req.body.curso });
    await examen.save();

    // Emitir notificación a todos los alumnos del curso
    io.to(req.body.curso).emit("notificacion", {
      tipo: "examen",
      mensaje: `Se creó un nuevo examen: ${examen.titulo}`,
      examenId: examen._id,
      fecha: new Date(),
    });

    res.json(examen);
  } catch (error) {
    res.status(500).json({ msg: "Error al crear examen" });
  }
};

export const listarExamenes = async (req, res) => {
  try {
    const examenes = await Examen.find({ curso: req.params.cursoId });
    res.json(examenes);
  } catch (error) {
    res.status(500).json({ msg: "Error al listar examenes" });
  }
};

// Registrar nota de un alumno
export const registrarNota = async (req, res) => {
  try {
    const { alumno, examenId, puntaje, total } = req.body;
    const nota = new Nota({ alumno, examen: examenId, puntaje, total });
    await nota.save();
    res.json(nota);
  } catch (error) {
    res.status(500).json({ msg: "Error al registrar nota" });
  }
};

// Listar notas de un alumno
export const listarNotas = async (req, res) => {
  try {
    const notas = await Nota.find({ alumno: req.params.alumnoId })
      .populate("examen", "titulo curso");
    res.json(notas);
  } catch (error) {
    res.status(500).json({ msg: "Error al listar notas" });
  }
};
