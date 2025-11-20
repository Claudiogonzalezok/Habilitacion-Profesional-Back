// backend/src/controllers/anuncioController.js
import Anuncio from "../models/Anuncio.js";
import Curso from "../models/Curso.js";
import Notificacion from "../models/Notificacion.js";

// Crear anuncio
export const crearAnuncio = async (req, res) => {
  try {
    const { titulo, contenido, cursoId, prioridad, fijado, fechaProgramada } = req.body;

    // Verificar que el curso existe
    const curso = await Curso.findById(cursoId);
    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Verificar permisos
    if (req.usuario.rol === "docente" && curso.docente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para crear anuncios en este curso" });
    }

    const nuevoAnuncio = new Anuncio({
      titulo,
      contenido,
      curso: cursoId,
      autor: req.usuario._id,
      prioridad: prioridad || "normal",
      fijado: fijado || false,
      fechaProgramada: fechaProgramada || null,
      publicado: fechaProgramada ? false : true
    });

    await nuevoAnuncio.save();
    await nuevoAnuncio.populate("autor", "nombre email");

    // Crear notificaciones para alumnos del curso si está publicado
    if (!fechaProgramada) {
      const alumnos = curso.alumnos;
      const notificaciones = alumnos.map(alumnoId => ({
        usuario: alumnoId,
        tipo: "anuncio",
        titulo: `Nuevo anuncio: ${titulo}`,
        mensaje: contenido.substring(0, 100) + "...",
        enlace: `/dashboard/cursos/${cursoId}/anuncios`,
        prioridad: prioridad === "urgente" ? "alta" : "normal",
        metadata: {
          cursoId,
          anuncioId: nuevoAnuncio._id
        }
      }));

      if (notificaciones.length > 0) {
        await Notificacion.insertMany(notificaciones);
      }
    }

    res.status(201).json({
      msg: "Anuncio creado exitosamente",
      anuncio: nuevoAnuncio
    });
  } catch (error) {
    console.error("Error al crear anuncio:", error);
    res.status(500).json({ msg: "Error al crear anuncio" });
  }
};

// Obtener anuncios por curso
export const obtenerAnunciosPorCurso = async (req, res) => {
  try {
    const { cursoId } = req.params;

    const curso = await Curso.findById(cursoId);
    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Verificar acceso
    if (req.usuario.rol === "alumno") {
      const estaInscrito = curso.alumnos.some(
        alumno => alumno.toString() === req.usuario._id.toString()
      );
      if (!estaInscrito) {
        return res.status(403).json({ msg: "No tienes acceso a este curso" });
      }
    } else if (req.usuario.rol === "docente") {
      if (curso.docente.toString() !== req.usuario._id.toString()) {
        return res.status(403).json({ msg: "No tienes acceso a este curso" });
      }
    }

    const query = { curso: cursoId };
    
    // Los alumnos solo ven anuncios publicados
    if (req.usuario.rol === "alumno") {
      query.publicado = true;
    }

    const anuncios = await Anuncio.find(query)
      .populate("autor", "nombre email rol")
      .sort({ fijado: -1, fechaPublicacion: -1 });

    // Marcar si el usuario ha leído cada anuncio
    const anunciosConLectura = anuncios.map(anuncio => {
      const anuncioObj = anuncio.toObject();
      anuncioObj.leido = anuncio.lecturas.some(
        l => l.usuario.toString() === req.usuario._id.toString()
      );
      return anuncioObj;
    });

    res.json({ anuncios: anunciosConLectura });
  } catch (error) {
    console.error("Error al obtener anuncios:", error);
    res.status(500).json({ msg: "Error al obtener anuncios" });
  }
};

// Obtener anuncio por ID
export const obtenerAnuncio = async (req, res) => {
  try {
    const anuncio = await Anuncio.findById(req.params.id)
      .populate("autor", "nombre email rol")
      .populate("curso", "titulo codigo");

    if (!anuncio) {
      return res.status(404).json({ msg: "Anuncio no encontrado" });
    }

    // Verificar acceso
    const curso = await Curso.findById(anuncio.curso._id);
    if (req.usuario.rol === "alumno") {
      const estaInscrito = curso.alumnos.some(
        alumno => alumno.toString() === req.usuario._id.toString()
      );
      if (!estaInscrito) {
        return res.status(403).json({ msg: "No tienes acceso a este anuncio" });
      }
    } else if (req.usuario.rol === "docente") {
      if (curso.docente.toString() !== req.usuario._id.toString()) {
        return res.status(403).json({ msg: "No tienes acceso a este anuncio" });
      }
    }

    res.json(anuncio);
  } catch (error) {
    console.error("Error al obtener anuncio:", error);
    res.status(500).json({ msg: "Error al obtener anuncio" });
  }
};

// Actualizar anuncio
export const actualizarAnuncio = async (req, res) => {
  try {
    const anuncio = await Anuncio.findById(req.params.id);

    if (!anuncio) {
      return res.status(404).json({ msg: "Anuncio no encontrado" });
    }

    // Verificar permisos
    if (req.usuario.rol === "docente" && anuncio.autor.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para editar este anuncio" });
    }

    const anuncioActualizado = await Anuncio.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("autor", "nombre email");

    res.json({
      msg: "Anuncio actualizado exitosamente",
      anuncio: anuncioActualizado
    });
  } catch (error) {
    console.error("Error al actualizar anuncio:", error);
    res.status(500).json({ msg: "Error al actualizar anuncio" });
  }
};

// Eliminar anuncio
export const eliminarAnuncio = async (req, res) => {
  try {
    const anuncio = await Anuncio.findById(req.params.id);

    if (!anuncio) {
      return res.status(404).json({ msg: "Anuncio no encontrado" });
    }

    // Verificar permisos
    if (req.usuario.rol === "docente" && anuncio.autor.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para eliminar este anuncio" });
    }

    await Anuncio.findByIdAndDelete(req.params.id);

    res.json({ msg: "Anuncio eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar anuncio:", error);
    res.status(500).json({ msg: "Error al eliminar anuncio" });
  }
};

// Marcar anuncio como leído
export const marcarComoLeido = async (req, res) => {
  try {
    const anuncio = await Anuncio.findById(req.params.id);

    if (!anuncio) {
      return res.status(404).json({ msg: "Anuncio no encontrado" });
    }

    // Verificar si ya está marcado como leído
    const yaLeido = anuncio.lecturas.some(
      l => l.usuario.toString() === req.usuario._id.toString()
    );

    if (!yaLeido) {
      anuncio.lecturas.push({
        usuario: req.usuario._id,
        fechaLectura: new Date()
      });
      await anuncio.save();
    }

    res.json({ msg: "Anuncio marcado como leído" });
  } catch (error) {
    console.error("Error al marcar como leído:", error);
    res.status(500).json({ msg: "Error al marcar como leído" });
  }
};

// Obtener anuncios no leídos
export const obtenerNoLeidos = async (req, res) => {
  try {
    // Obtener cursos del usuario
    const cursos = await Curso.find({
      $or: [
        { docente: req.usuario._id },
        { alumnos: req.usuario._id }
      ]
    }).select("_id");

    const cursosIds = cursos.map(c => c._id);

    const anuncios = await Anuncio.find({
      curso: { $in: cursosIds },
      publicado: true,
      "lecturas.usuario": { $ne: req.usuario._id }
    })
      .populate("autor", "nombre")
      .populate("curso", "titulo")
      .sort({ fechaPublicacion: -1 })
      .limit(20);

    res.json({ anuncios, cantidad: anuncios.length });
  } catch (error) {
    console.error("Error al obtener anuncios no leídos:", error);
    res.status(500).json({ msg: "Error al obtener anuncios" });
  }
};

// Toggle fijar/desfijar anuncio
export const toggleFijar = async (req, res) => {
  try {
    const anuncio = await Anuncio.findById(req.params.id);

    if (!anuncio) {
      return res.status(404).json({ msg: "Anuncio no encontrado" });
    }

    // Verificar permisos
    const curso = await Curso.findById(anuncio.curso);
    if (req.usuario.rol === "docente" && curso.docente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para esta acción" });
    }

    anuncio.fijado = !anuncio.fijado;
    await anuncio.save();

    res.json({
      msg: anuncio.fijado ? "Anuncio fijado" : "Anuncio desfijado",
      fijado: anuncio.fijado
    });
  } catch (error) {
    console.error("Error al fijar/desfijar anuncio:", error);
    res.status(500).json({ msg: "Error al procesar solicitud" });
  }
};
