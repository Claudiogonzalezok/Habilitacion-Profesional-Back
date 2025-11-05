// controllers/tareaController.js
import Tarea from "../models/Tarea.js";
import Entrega from "../models/Entrega.js";
import io from "../server.js"; // Socket.io para notificaciones

export const crearTarea = async (req, res) => {
  try {
    const tarea = new Tarea({
      ...req.body,
      curso: req.params.cursoId,
      creador: req.usuario._id,
    });
    await tarea.save();

    // Notificación en tiempo real
    io.to(req.params.cursoId).emit("notificacion", {
      tipo: "tarea",
      mensaje: `Nueva tarea creada: ${tarea.titulo}`,
      tareaId: tarea._id,
      fecha: new Date(),
    });

    res.json(tarea);
  } catch (error) {
    res.status(500).json({ msg: "Error al crear tarea" });
  }
};

export const listarTareas = async (req, res) => {
  const tareas = await Tarea.find({ curso: req.params.cursoId }).sort({ fechaEntrega: 1 });
  res.json(tareas);
};

export const entregarTarea = async (req, res) => {
  const entrega = new Entrega({
    tarea: req.params.tareaId,
    alumno: req.usuario._id,
    archivo: req.file?.filename,
    texto: req.body.texto,
  });
  await entrega.save();
  res.json(entrega);
};

export const listarEntregas = async (req, res) => {
  const entregas = await Entrega.find({ tarea: req.params.tareaId }).populate("alumno");
  res.json(entregas);
};

export const calificarEntrega = async (req, res) => {
  const { calificacion, retroalimentacion } = req.body;
  const entrega = await Entrega.findByIdAndUpdate(
    req.params.entregaId,
    { calificacion, retroalimentacion },
    { new: true }
  );
  res.json(entrega);
};
