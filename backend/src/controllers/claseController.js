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

export const subirMaterial = async (req, res) => {
  try {
    const clase = await Clase.findById(req.params.id);
    if (!clase) return res.status(404).json({ msg: "Clase no encontrada" });

    const nuevoMaterial = {
      nombre: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
    };

    clase.materiales.push(nuevoMaterial);
    await clase.save();

    res.json(clase);
  } catch (error) {
    res.status(500).json({ msg: "Error al subir material" });
  }
};