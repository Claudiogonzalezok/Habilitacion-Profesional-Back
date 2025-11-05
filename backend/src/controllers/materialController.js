// controllers/materialController.js
import Material from "../models/Material.js";

export const subirMaterial = async (req, res) => {
  try {
    const material = new Material({
      curso: req.params.cursoId,
      nombre: req.body.nombre || req.file.originalname,
      archivo: req.file.filename,
      uploader: req.usuario._id,
    });
    await material.save();
    res.json(material);
  } catch (error) {
    res.status(500).json({ msg: "Error al subir material" });
  }
};

export const listarMateriales = async (req, res) => {
  try {
    const materiales = await Material.find({ curso: req.params.cursoId });
    res.json(materiales);
  } catch (error) {
    res.status(500).json({ msg: "Error al listar materiales" });
  }
};
