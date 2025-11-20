// backend/src/controllers/mensajeController.js
import Mensaje from "../models/Mensaje.js";
import Usuario from "../models/Usuario.js";
import Notificacion from "../models/Notificacion.js";

// Enviar mensaje
export const enviarMensaje = async (req, res) => {
  try {
    const { destinatarioId, contenido } = req.body;

    if (!destinatarioId || !contenido || contenido.trim() === "") {
      return res.status(400).json({ msg: "Destinatario y contenido son requeridos" });
    }

    // Verificar que el destinatario existe
    const destinatario = await Usuario.findById(destinatarioId);
    if (!destinatario) {
      return res.status(404).json({ msg: "Destinatario no encontrado" });
    }

    // No permitir enviarse mensajes a sí mismo
    if (destinatarioId === req.usuario._id.toString()) {
      return res.status(400).json({ msg: "No puedes enviarte mensajes a ti mismo" });
    }

    const nuevoMensaje = new Mensaje({
      remitente: req.usuario._id,
      destinatario: destinatarioId,
      contenido: contenido.trim()
    });

    await nuevoMensaje.save();
    await nuevoMensaje.populate("remitente", "nombre email");
    await nuevoMensaje.populate("destinatario", "nombre email");

    // Crear notificación para el destinatario
    await Notificacion.create({
      usuario: destinatarioId,
      tipo: "mensaje",
      titulo: `Nuevo mensaje de ${req.usuario.nombre}`,
      mensaje: contenido.substring(0, 50) + "...",
      enlace: `/dashboard/mensajes`,
      metadata: {
        mensajeId: nuevoMensaje._id
      }
    });

    res.status(201).json({
      msg: "Mensaje enviado exitosamente",
      mensaje: nuevoMensaje
    });
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    res.status(500).json({ msg: "Error al enviar mensaje" });
  }
};

// Obtener conversación con un usuario
export const obtenerConversacion = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    // Verificar que el usuario existe
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const mensajes = await Mensaje.find({
      $or: [
        { remitente: req.usuario._id, destinatario: usuarioId },
        { remitente: usuarioId, destinatario: req.usuario._id }
      ],
      eliminadoPor: { $ne: req.usuario._id }
    })
      .populate("remitente", "nombre email")
      .populate("destinatario", "nombre email")
      .sort({ createdAt: 1 });

    res.json({ mensajes });
  } catch (error) {
    console.error("Error al obtener conversación:", error);
    res.status(500).json({ msg: "Error al obtener conversación" });
  }
};

// Obtener lista de conversaciones
export const obtenerConversaciones = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;

    // Obtener todos los mensajes del usuario
    const mensajes = await Mensaje.find({
      $or: [
        { remitente: usuarioId },
        { destinatario: usuarioId }
      ],
      eliminadoPor: { $ne: usuarioId }
    })
      .populate("remitente", "nombre email rol")
      .populate("destinatario", "nombre email rol")
      .sort({ createdAt: -1 });

    // Agrupar por conversaciones
    const conversacionesMap = new Map();

    mensajes.forEach(mensaje => {
      const otroUsuarioId = mensaje.remitente._id.toString() === usuarioId.toString()
        ? mensaje.destinatario._id.toString()
        : mensaje.remitente._id.toString();

      if (!conversacionesMap.has(otroUsuarioId)) {
        const otroUsuario = mensaje.remitente._id.toString() === usuarioId.toString()
          ? mensaje.destinatario
          : mensaje.remitente;

        conversacionesMap.set(otroUsuarioId, {
          _id: otroUsuarioId,
          nombre: otroUsuario.nombre,
          email: otroUsuario.email,
          rol: otroUsuario.rol,
          ultimoMensaje: mensaje.contenido,
          fecha: mensaje.createdAt,
          noLeidos: 0
        });
      }

      // Contar no leídos (solo mensajes recibidos)
      if (
        mensaje.destinatario._id.toString() === usuarioId.toString() &&
        !mensaje.leido
      ) {
        conversacionesMap.get(otroUsuarioId).noLeidos++;
      }
    });

    const conversaciones = Array.from(conversacionesMap.values())
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    res.json({ conversaciones });
  } catch (error) {
    console.error("Error al obtener conversaciones:", error);
    res.status(500).json({ msg: "Error al obtener conversaciones" });
  }
};

// Marcar mensaje como leído
export const marcarComoLeido = async (req, res) => {
  try {
    const mensaje = await Mensaje.findById(req.params.id);

    if (!mensaje) {
      return res.status(404).json({ msg: "Mensaje no encontrado" });
    }

    // Solo el destinatario puede marcar como leído
    if (mensaje.destinatario.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para esta acción" });
    }

    if (!mensaje.leido) {
      mensaje.leido = true;
      mensaje.fechaLectura = new Date();
      await mensaje.save();
    }

    res.json({ msg: "Mensaje marcado como leído" });
  } catch (error) {
    console.error("Error al marcar como leído:", error);
    res.status(500).json({ msg: "Error al marcar como leído" });
  }
};

// Marcar todos los mensajes de una conversación como leídos
export const marcarConversacionLeida = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    await Mensaje.updateMany(
      {
        remitente: usuarioId,
        destinatario: req.usuario._id,
        leido: false
      },
      {
        $set: {
          leido: true,
          fechaLectura: new Date()
        }
      }
    );

    res.json({ msg: "Conversación marcada como leída" });
  } catch (error) {
    console.error("Error al marcar conversación como leída:", error);
    res.status(500).json({ msg: "Error al marcar conversación como leída" });
  }
};

// Eliminar mensaje (soft delete)
export const eliminarMensaje = async (req, res) => {
  try {
    const mensaje = await Mensaje.findById(req.params.id);

    if (!mensaje) {
      return res.status(404).json({ msg: "Mensaje no encontrado" });
    }

    // Verificar que el usuario es parte de la conversación
    const esRemitente = mensaje.remitente.toString() === req.usuario._id.toString();
    const esDestinatario = mensaje.destinatario.toString() === req.usuario._id.toString();

    if (!esRemitente && !esDestinatario) {
      return res.status(403).json({ msg: "No tienes permiso para eliminar este mensaje" });
    }

    // Agregar usuario a la lista de eliminadoPor
    if (!mensaje.eliminadoPor.includes(req.usuario._id)) {
      mensaje.eliminadoPor.push(req.usuario._id);
      await mensaje.save();
    }

    // Si ambos usuarios eliminaron, borrar permanentemente
    if (mensaje.eliminadoPor.length >= 2) {
      await Mensaje.findByIdAndDelete(req.params.id);
      return res.json({ msg: "Mensaje eliminado permanentemente" });
    }

    res.json({ msg: "Mensaje eliminado" });
  } catch (error) {
    console.error("Error al eliminar mensaje:", error);
    res.status(500).json({ msg: "Error al eliminar mensaje" });
  }
};

// Obtener cantidad de mensajes no leídos
export const obtenerNoLeidos = async (req, res) => {
  try {
    const cantidad = await Mensaje.countDocuments({
      destinatario: req.usuario._id,
      leido: false,
      eliminadoPor: { $ne: req.usuario._id }
    });

    res.json({ cantidad });
  } catch (error) {
    console.error("Error al obtener no leídos:", error);
    res.status(500).json({ msg: "Error al obtener mensajes no leídos" });
  }
};

// Buscar usuarios para enviar mensajes
export const buscarUsuarios = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ msg: "Parámetro de búsqueda requerido" });
    }

    const usuarios = await Usuario.find({
      _id: { $ne: req.usuario._id }, // Excluir usuario actual
      $or: [
        { nombre: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ]
    })
      .select("nombre email rol")
      .limit(10);

    res.json({ usuarios });
  } catch (error) {
    console.error("Error al buscar usuarios:", error);
    res.status(500).json({ msg: "Error al buscar usuarios" });
  }
};
