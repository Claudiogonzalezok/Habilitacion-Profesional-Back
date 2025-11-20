// backend/src/controllers/notificacionController.js
import Notificacion from "../models/Notificacion.js";

// Obtener notificaciones del usuario
export const obtenerNotificaciones = async (req, res) => {
  try {
    const { page = 1, limit = 20, leida, tipo } = req.query;

    const query = { usuario: req.usuario._id };

    // Filtros opcionales
    if (leida !== undefined) {
      query.leida = leida === "true";
    }

    if (tipo) {
      query.tipo = tipo;
    }

    const total = await Notificacion.countDocuments(query);
    
    const notificaciones = await Notificacion.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      notificaciones,
      totalPaginas: Math.ceil(total / limit),
      paginaActual: Number(page),
      total
    });
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    res.status(500).json({ msg: "Error al obtener notificaciones" });
  }
};

// Obtener notificación por ID
export const obtenerNotificacion = async (req, res) => {
  try {
    const notificacion = await Notificacion.findById(req.params.id);

    if (!notificacion) {
      return res.status(404).json({ msg: "Notificación no encontrada" });
    }

    // Verificar que la notificación pertenece al usuario
    if (notificacion.usuario.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes acceso a esta notificación" });
    }

    res.json(notificacion);
  } catch (error) {
    console.error("Error al obtener notificación:", error);
    res.status(500).json({ msg: "Error al obtener notificación" });
  }
};

// Marcar notificación como leída
export const marcarComoLeida = async (req, res) => {
  try {
    const notificacion = await Notificacion.findById(req.params.id);

    if (!notificacion) {
      return res.status(404).json({ msg: "Notificación no encontrada" });
    }

    // Verificar que la notificación pertenece al usuario
    if (notificacion.usuario.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes acceso a esta notificación" });
    }

    if (!notificacion.leida) {
      notificacion.leida = true;
      notificacion.fechaLectura = new Date();
      await notificacion.save();
    }

    res.json({ msg: "Notificación marcada como leída", notificacion });
  } catch (error) {
    console.error("Error al marcar como leída:", error);
    res.status(500).json({ msg: "Error al marcar como leída" });
  }
};

// Marcar todas las notificaciones como leídas
export const marcarTodasLeidas = async (req, res) => {
  try {
    await Notificacion.updateMany(
      {
        usuario: req.usuario._id,
        leida: false
      },
      {
        $set: {
          leida: true,
          fechaLectura: new Date()
        }
      }
    );

    res.json({ msg: "Todas las notificaciones marcadas como leídas" });
  } catch (error) {
    console.error("Error al marcar todas como leídas:", error);
    res.status(500).json({ msg: "Error al marcar todas como leídas" });
  }
};

// Eliminar notificación
export const eliminarNotificacion = async (req, res) => {
  try {
    const notificacion = await Notificacion.findById(req.params.id);

    if (!notificacion) {
      return res.status(404).json({ msg: "Notificación no encontrada" });
    }

    // Verificar que la notificación pertenece al usuario
    if (notificacion.usuario.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes acceso a esta notificación" });
    }

    await Notificacion.findByIdAndDelete(req.params.id);

    res.json({ msg: "Notificación eliminada" });
  } catch (error) {
    console.error("Error al eliminar notificación:", error);
    res.status(500).json({ msg: "Error al eliminar notificación" });
  }
};

// Eliminar todas las notificaciones leídas
export const eliminarTodasLeidas = async (req, res) => {
  try {
    const resultado = await Notificacion.deleteMany({
      usuario: req.usuario._id,
      leida: true
    });

    res.json({
      msg: "Notificaciones leídas eliminadas",
      cantidad: resultado.deletedCount
    });
  } catch (error) {
    console.error("Error al eliminar notificaciones leídas:", error);
    res.status(500).json({ msg: "Error al eliminar notificaciones" });
  }
};

// Obtener cantidad de notificaciones no leídas
export const obtenerNoLeidas = async (req, res) => {
  try {
    const cantidad = await Notificacion.countDocuments({
      usuario: req.usuario._id,
      leida: false
    });

    res.json({ cantidad });
  } catch (error) {
    console.error("Error al obtener no leídas:", error);
    res.status(500).json({ msg: "Error al obtener cantidad" });
  }
};

// Obtener notificaciones recientes (últimas 10)
export const obtenerRecientes = async (req, res) => {
  try {
    const notificaciones = await Notificacion.find({
      usuario: req.usuario._id
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ notificaciones });
  } catch (error) {
    console.error("Error al obtener notificaciones recientes:", error);
    res.status(500).json({ msg: "Error al obtener notificaciones" });
  }
};

// Crear notificación (uso interno o admin)
export const crearNotificacion = async (req, res) => {
  try {
    const { usuarioId, tipo, titulo, mensaje, enlace, prioridad, metadata } = req.body;

    if (!usuarioId || !tipo || !titulo || !mensaje) {
      return res.status(400).json({ msg: "Campos requeridos: usuarioId, tipo, titulo, mensaje" });
    }

    const notificacion = new Notificacion({
      usuario: usuarioId,
      tipo,
      titulo,
      mensaje,
      enlace,
      prioridad: prioridad || "normal",
      metadata
    });

    await notificacion.save();

    res.status(201).json({
      msg: "Notificación creada",
      notificacion
    });
  } catch (error) {
    console.error("Error al crear notificación:", error);
    res.status(500).json({ msg: "Error al crear notificación" });
  }
};

// Crear notificación masiva (admin)
export const crearNotificacionMasiva = async (req, res) => {
  try {
    const { usuariosIds, tipo, titulo, mensaje, enlace, prioridad } = req.body;

    if (!usuariosIds || !Array.isArray(usuariosIds) || usuariosIds.length === 0) {
      return res.status(400).json({ msg: "Se requiere un array de IDs de usuarios" });
    }

    if (!tipo || !titulo || !mensaje) {
      return res.status(400).json({ msg: "Campos requeridos: tipo, titulo, mensaje" });
    }

    const notificaciones = usuariosIds.map(usuarioId => ({
      usuario: usuarioId,
      tipo,
      titulo,
      mensaje,
      enlace,
      prioridad: prioridad || "normal"
    }));

    await Notificacion.insertMany(notificaciones);

    res.json({
      msg: `Notificaciones enviadas a ${usuariosIds.length} usuarios`,
      cantidad: usuariosIds.length
    });
  } catch (error) {
    console.error("Error al crear notificaciones masivas:", error);
    res.status(500).json({ msg: "Error al crear notificaciones" });
  }
};

// Obtener estadísticas de notificaciones
export const obtenerEstadisticas = async (req, res) => {
  try {
    const total = await Notificacion.countDocuments({ usuario: req.usuario._id });
    const noLeidas = await Notificacion.countDocuments({
      usuario: req.usuario._id,
      leida: false
    });

    // Contar por tipo
    const porTipo = await Notificacion.aggregate([
      { $match: { usuario: req.usuario._id } },
      { $group: { _id: "$tipo", cantidad: { $sum: 1 } } },
      { $sort: { cantidad: -1 } }
    ]);

    res.json({
      total,
      noLeidas,
      leidas: total - noLeidas,
      porTipo
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ msg: "Error al obtener estadísticas" });
  }
};
