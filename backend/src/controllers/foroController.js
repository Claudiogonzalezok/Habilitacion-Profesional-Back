// backend/src/controllers/foroController.js
import Foro from "../models/Foro.js";
import Curso from "../models/Curso.js";
import Notificacion from "../models/Notificacion.js";

// Crear foro
export const crearForo = async (req, res) => {
  try {
    const { titulo, contenido, cursoId } = req.body;

    if (!titulo || !contenido || !cursoId) {
      return res.status(400).json({ msg: "Todos los campos son requeridos" });
    }

    // Verificar que el curso existe
    const curso = await Curso.findById(cursoId);
    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Verificar que el usuario está inscrito o es docente
    const esDocente = curso.docente.toString() === req.usuario._id.toString();
    const estaInscrito = curso.alumnos.some(
      alumno => alumno.toString() === req.usuario._id.toString()
    );

    if (!esDocente && !estaInscrito && req.usuario.rol !== "admin") {
      return res.status(403).json({ msg: "No tienes acceso a este curso" });
    }

    const nuevoForo = new Foro({
      titulo,
      contenido,
      curso: cursoId,
      autor: req.usuario._id
    });

    await nuevoForo.save();
    await nuevoForo.populate("autor", "nombre email rol");
    await nuevoForo.populate("curso", "titulo codigo");

    // Crear notificación para el docente si el autor es un alumno
    if (req.usuario.rol === "alumno") {
      await Notificacion.create({
        usuario: curso.docente,
        tipo: "foro",
        titulo: `Nuevo tema de foro: ${titulo}`,
        mensaje: `${req.usuario.nombre} ha creado un nuevo tema en ${curso.titulo}`,
        enlace: `/dashboard/foros/${nuevoForo._id}`,
        metadata: {
          cursoId,
          foroId: nuevoForo._id
        }
      });
    }

    res.status(201).json({
      msg: "Tema de foro creado exitosamente",
      foro: nuevoForo
    });
  } catch (error) {
    console.error("Error al crear foro:", error);
    res.status(500).json({ msg: "Error al crear foro" });
  }
};

// Obtener foros por curso
export const listarForos = async (req, res) => {
  try {
    const { cursoId } = req.params;

    const curso = await Curso.findById(cursoId);
    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Verificar acceso
    const esDocente = curso.docente.toString() === req.usuario._id.toString();
    const estaInscrito = curso.alumnos.some(
      alumno => alumno.toString() === req.usuario._id.toString()
    );

    if (!esDocente && !estaInscrito && req.usuario.rol !== "admin") {
      return res.status(403).json({ msg: "No tienes acceso a este curso" });
    }

    const foros = await Foro.find({ curso: cursoId })
      .populate("autor", "nombre email rol")
      .populate("respuestas.autor", "nombre email rol")
      .sort({ fijado: -1, ultimaActividad: -1 });

    res.json(foros);
  } catch (error) {
    console.error("Error al listar foros:", error);
    res.status(500).json({ msg: "Error al obtener foros" });
  }
};

// Obtener foro por ID
export const obtenerForo = async (req, res) => {
  try {
    const foro = await Foro.findById(req.params.id)
      .populate("autor", "nombre email rol")
      .populate("respuestas.autor", "nombre email rol")
      .populate("curso", "titulo codigo docente alumnos");

    if (!foro) {
      return res.status(404).json({ msg: "Foro no encontrado" });
    }

    // Verificar acceso
    const curso = foro.curso;
    const esDocente = curso.docente.toString() === req.usuario._id.toString();
    const estaInscrito = curso.alumnos.some(
      alumno => alumno.toString() === req.usuario._id.toString()
    );

    if (!esDocente && !estaInscrito && req.usuario.rol !== "admin") {
      return res.status(403).json({ msg: "No tienes acceso a este foro" });
    }

    // Incrementar vistas
    foro.vistas += 1;
    await foro.save();

    res.json(foro);
  } catch (error) {
    console.error("Error al obtener foro:", error);
    res.status(500).json({ msg: "Error al obtener foro" });
  }
};

// Responder en un foro
export const responderForo = async (req, res) => {
  try {
    const { mensaje } = req.body;

    if (!mensaje || mensaje.trim() === "") {
      return res.status(400).json({ msg: "El mensaje no puede estar vacío" });
    }

    const foro = await Foro.findById(req.params.id).populate("curso");

    if (!foro) {
      return res.status(404).json({ msg: "Foro no encontrado" });
    }

    if (foro.cerrado) {
      return res.status(400).json({ msg: "Este foro está cerrado" });
    }

    // Verificar acceso
    const curso = await Curso.findById(foro.curso._id);
    const esDocente = curso.docente.toString() === req.usuario._id.toString();
    const estaInscrito = curso.alumnos.some(
      alumno => alumno.toString() === req.usuario._id.toString()
    );

    if (!esDocente && !estaInscrito && req.usuario.rol !== "admin") {
      return res.status(403).json({ msg: "No tienes acceso a este foro" });
    }

    const nuevaRespuesta = {
      autor: req.usuario._id,
      mensaje: mensaje.trim()
    };

    foro.respuestas.push(nuevaRespuesta);
    foro.ultimaActividad = new Date();
    await foro.save();

    // Poblar la nueva respuesta
    await foro.populate("respuestas.autor", "nombre email rol");

    // Notificar al autor del foro (si no es el mismo que responde)
    if (foro.autor.toString() !== req.usuario._id.toString()) {
      await Notificacion.create({
        usuario: foro.autor,
        tipo: "foro",
        titulo: `Nueva respuesta en: ${foro.titulo}`,
        mensaje: `${req.usuario.nombre} ha respondido a tu tema`,
        enlace: `/dashboard/foros/${foro._id}`,
        metadata: {
          cursoId: foro.curso._id,
          foroId: foro._id
        }
      });
    }

    res.json({
      msg: "Respuesta publicada exitosamente",
      foro
    });
  } catch (error) {
    console.error("Error al responder foro:", error);
    res.status(500).json({ msg: "Error al responder" });
  }
};

// Eliminar foro
export const eliminarForo = async (req, res) => {
  try {
    const foro = await Foro.findById(req.params.id).populate("curso");

    if (!foro) {
      return res.status(404).json({ msg: "Foro no encontrado" });
    }

    // Solo el autor, docente del curso o admin pueden eliminar
    const curso = await Curso.findById(foro.curso._id);
    const esAutor = foro.autor.toString() === req.usuario._id.toString();
    const esDocente = curso.docente.toString() === req.usuario._id.toString();
    const esAdmin = req.usuario.rol === "admin";

    if (!esAutor && !esDocente && !esAdmin) {
      return res.status(403).json({ msg: "No tienes permiso para eliminar este foro" });
    }

    await Foro.findByIdAndDelete(req.params.id);

    res.json({ msg: "Foro eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar foro:", error);
    res.status(500).json({ msg: "Error al eliminar foro" });
  }
};

// Eliminar respuesta
export const eliminarRespuesta = async (req, res) => {
  try {
    const { foroId, respuestaId } = req.params;

    const foro = await Foro.findById(foroId).populate("curso");

    if (!foro) {
      return res.status(404).json({ msg: "Foro no encontrado" });
    }

    const respuesta = foro.respuestas.id(respuestaId);
    if (!respuesta) {
      return res.status(404).json({ msg: "Respuesta no encontrada" });
    }

    // Solo el autor de la respuesta, docente del curso o admin pueden eliminar
    const curso = await Curso.findById(foro.curso._id);
    const esAutor = respuesta.autor.toString() === req.usuario._id.toString();
    const esDocente = curso.docente.toString() === req.usuario._id.toString();
    const esAdmin = req.usuario.rol === "admin";

    if (!esAutor && !esDocente && !esAdmin) {
      return res.status(403).json({ msg: "No tienes permiso para eliminar esta respuesta" });
    }

    foro.respuestas = foro.respuestas.filter(
      r => r._id.toString() !== respuestaId
    );

    await foro.save();

    res.json({ msg: "Respuesta eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar respuesta:", error);
    res.status(500).json({ msg: "Error al eliminar respuesta" });
  }
};

// Cerrar/abrir foro (solo docente)
export const toggleCerrarForo = async (req, res) => {
  try {
    const foro = await Foro.findById(req.params.id).populate("curso");

    if (!foro) {
      return res.status(404).json({ msg: "Foro no encontrado" });
    }

    // Solo docente del curso o admin
    const curso = await Curso.findById(foro.curso._id);
    const esDocente = curso.docente.toString() === req.usuario._id.toString();
    const esAdmin = req.usuario.rol === "admin";

    if (!esDocente && !esAdmin) {
      return res.status(403).json({ msg: "No tienes permiso para esta acción" });
    }

    foro.cerrado = !foro.cerrado;
    await foro.save();

    res.json({
      msg: foro.cerrado ? "Foro cerrado" : "Foro abierto",
      cerrado: foro.cerrado
    });
  } catch (error) {
    console.error("Error al cerrar/abrir foro:", error);
    res.status(500).json({ msg: "Error al procesar solicitud" });
  }
};

// Toggle fijar foro
export const toggleFijar = async (req, res) => {
  try {
    const foro = await Foro.findById(req.params.id).populate("curso");

    if (!foro) {
      return res.status(404).json({ msg: "Foro no encontrado" });
    }

    // Solo docente del curso o admin
    const curso = await Curso.findById(foro.curso._id);
    const esDocente = curso.docente.toString() === req.usuario._id.toString();
    const esAdmin = req.usuario.rol === "admin";

    if (!esDocente && !esAdmin) {
      return res.status(403).json({ msg: "No tienes permiso para esta acción" });
    }

    foro.fijado = !foro.fijado;
    await foro.save();

    res.json({
      msg: foro.fijado ? "Foro fijado" : "Foro desfijado",
      fijado: foro.fijado
    });
  } catch (error) {
    console.error("Error al fijar/desfijar foro:", error);
    res.status(500).json({ msg: "Error al procesar solicitud" });
  }
};
