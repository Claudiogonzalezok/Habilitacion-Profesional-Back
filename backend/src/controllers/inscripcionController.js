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
