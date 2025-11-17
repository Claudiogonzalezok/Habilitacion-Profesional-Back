// backend/src/controllers/inscripcionController.js
import Inscripcion from "../models/Inscripcion.js";
import Curso from "../models/Curso.js";
import Usuario from "../models/Usuario.js";

// 🔥 ADMIN: Inscribir alumno en un curso
export const inscribirAlumnoAdmin = async (req, res) => {
  try {
    const { cursoId, alumnoId } = req.body;

    // Verificar que el usuario es admin o docente
    if (!["admin", "docente"].includes(req.usuario.rol)) {
      return res.status(403).json({ msg: "No tienes permisos" });
    }

    // Verificar que el curso existe
    const curso = await Curso.findById(cursoId);
    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Verificar que el alumno existe
    const alumno = await Usuario.findById(alumnoId);
    if (!alumno || alumno.rol !== "alumno") {
      return res.status(404).json({ msg: "Alumno no encontrado" });
    }

    // Verificar si ya está inscrito
    const yaInscrito = await Inscripcion.findOne({
      alumno: alumnoId,
      curso: cursoId
    });

    if (yaInscrito) {
      return res.status(400).json({ msg: "El alumno ya está inscrito" });
    }

    // Crear inscripción (directamente aprobada porque es el admin)
    const inscripcion = await Inscripcion.create({
      alumno: alumnoId,
      curso: cursoId,
      estado: "aprobada",
      fecha: new Date()
    });

    // OPCIONAL: Actualizar array de alumnos en el curso (por compatibilidad)
    if (!curso.alumnos.includes(alumnoId)) {
      curso.alumnos.push(alumnoId);
      await curso.save();
    }

    res.status(201).json({ 
      msg: "Alumno inscrito exitosamente",
      inscripcion 
    });
  } catch (error) {
    console.error("Error al inscribir alumno:", error);
    res.status(500).json({ msg: "Error al inscribir alumno" });
  }
};

// Obtener inscritos de un curso
export const obtenerInscritosCurso = async (req, res) => {
  try {
    const { cursoId } = req.params;

    const inscripciones = await Inscripcion.find({ curso: cursoId })
      .populate("alumno", "nombre email")
      .sort({ fecha: -1 });

    res.json(inscripciones);
  } catch (error) {
    console.error("Error al obtener inscritos:", error);
    res.status(500).json({ msg: "Error al obtener inscritos" });
  }
};

// Eliminar inscripción (Admin)
export const eliminarInscripcion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!["admin", "docente"].includes(req.usuario.rol)) {
      return res.status(403).json({ msg: "No tienes permisos" });
    }

    const inscripcion = await Inscripcion.findById(id);
    if (!inscripcion) {
      return res.status(404).json({ msg: "Inscripción no encontrada" });
    }

    // OPCIONAL: Quitar del array de alumnos del curso
    await Curso.findByIdAndUpdate(
      inscripcion.curso,
      { $pull: { alumnos: inscripcion.alumno } }
    );

    await inscripcion.deleteOne();

    res.json({ msg: "Inscripción eliminada" });
  } catch (error) {
    console.error("Error al eliminar inscripción:", error);
    res.status(500).json({ msg: "Error al eliminar inscripción" });
  }
};

// Obtener mis inscripciones (Alumno)
export const obtenerMisInscripciones = async (req, res) => {
  try {
    const inscripciones = await Inscripcion.find({ 
      alumno: req.usuario.id 
    })
      .populate("curso", "titulo nombre descripcion imagen")
      .sort({ fecha: -1 });

    res.json(inscripciones);
  } catch (error) {
    console.error("Error al obtener inscripciones:", error);
    res.status(500).json({ msg: "Error al obtener inscripciones" });
  }
};

// 🆕 OPCIONAL: Alumno solicita inscripción (queda pendiente)
export const solicitarInscripcion = async (req, res) => {
  try {
    const { cursoId } = req.body;
    const alumnoId = req.usuario.id;

    // Verificar que el curso existe
    const curso = await Curso.findById(cursoId);
    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Verificar si ya existe solicitud
    const yaExiste = await Inscripcion.findOne({
      alumno: alumnoId,
      curso: cursoId
    });

    if (yaExiste) {
      return res.status(400).json({ 
        msg: `Ya tienes una solicitud ${yaExiste.estado}` 
      });
    }

    // Crear solicitud pendiente
    const inscripcion = await Inscripcion.create({
      alumno: alumnoId,
      curso: cursoId,
      estado: "pendiente", // 🔥 Requiere aprobación del admin
      fecha: new Date()
    });

    res.status(201).json({ 
      msg: "Solicitud enviada. Espera la aprobación del administrador",
      inscripcion 
    });
  } catch (error) {
    console.error("Error al solicitar inscripción:", error);
    res.status(500).json({ msg: "Error al solicitar inscripción" });
  }
};

// 🆕 OPCIONAL: Admin aprueba/rechaza solicitud
export const actualizarEstadoInscripcion = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // "aprobada" o "rechazada"

    if (!["admin", "docente"].includes(req.usuario.rol)) {
      return res.status(403).json({ msg: "No tienes permisos" });
    }

    if (!["aprobada", "rechazada"].includes(estado)) {
      return res.status(400).json({ msg: "Estado inválido" });
    }

    const inscripcion = await Inscripcion.findById(id);
    if (!inscripcion) {
      return res.status(404).json({ msg: "Inscripción no encontrada" });
    }

    inscripcion.estado = estado;
    await inscripcion.save();

    // Si se aprueba, agregar al array del curso (opcional)
    if (estado === "aprobada") {
      await Curso.findByIdAndUpdate(
        inscripcion.curso,
        { $addToSet: { alumnos: inscripcion.alumno } }
      );
    }

    res.json({ 
      msg: `Inscripción ${estado}`,
      inscripcion 
    });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ msg: "Error al actualizar estado" });
  }
};