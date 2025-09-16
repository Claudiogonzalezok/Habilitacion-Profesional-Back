// controllers/claseController.js
import Clase from "../models/Clase.js";

export const crearClase = async (req, res) => {
  try {
    const clase = new Clase(req.body);
    await clase.save();
    res.json(clase);
  } catch (error) {
    res.status(500).json({ msg: "Error al crear clase" });
  }
};

export const listarClases = async (req, res) => {
  try {
    const clases = await Clase.find({ curso: req.params.cursoId });
    res.json(clases);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener clases" });
  }
};
