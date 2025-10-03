// controllers/inscripcionController.js
import Inscripcion from "../models/Inscripcion.js";

export const solicitarInscripcion = async (req, res) => {
  try {
    const inscripcion = new Inscripcion({ alumno: req.usuario._id, curso: req.body.curso });
    await inscripcion.save();
    res.json(inscripcion);
  } catch (error) {
    res.status(500).json({ msg: "Error al inscribirse" });
  }
};

export const gestionarInscripcion = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const inscripcion = await Inscripcion.findByIdAndUpdate(id, { estado }, { new: true });
    res.json(inscripcion);
  } catch (error) {
    res.status(500).json({ msg: "Error al gestionar inscripción" });
  }
};

// controllers/inscripcionController.js
export const listarInscripciones = async (req, res) => {
  try {
    const inscripciones = await Inscripcion.find()
      .populate("alumno", "nombre email")
      .populate("curso", "titulo");
    res.json(inscripciones);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener inscripciones" });
  }
};
