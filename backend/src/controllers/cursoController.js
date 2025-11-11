// controllers/cursoController.js
import Curso from "../models/Curso.js";
import Clase from "../models/Clase.js";

// Crear curso
export const crearCurso = async (req, res) => {
  try {
    const { titulo, descripcion, codigo, fechaInicio, fechaFin, duracionHoras, categoria, imagen } = req.body;

    // Validar que el código no exista
    const cursoExistente = await Curso.findOne({ codigo: codigo.toUpperCase() });
    if (cursoExistente) {
      return res.status(400).json({ msg: "El código del curso ya existe" });
    }

    // Validar fechas
    if (new Date(fechaInicio) > new Date(fechaFin)) {
      return res.status(400).json({ msg: "La fecha de inicio no puede ser posterior a la fecha de fin" });
    }

    const curso = new Curso({ 
      titulo,
      descripcion,
      codigo: codigo.toUpperCase(),
      fechaInicio,
      fechaFin,
      duracionHoras,
      categoria,
      imagen,
      docente: req.usuario._id 
    });

    await curso.save();
    await curso.populate("docente", "nombre email");

    res.status(201).json({ msg: "Curso creado exitosamente", curso });
  } catch (error) {
    console.error("Error al crear curso:", error);
    res.status(500).json({ msg: "Error al crear curso" });
  }
};

// Listar cursos según rol
export const listarCursos = async (req, res) => {
  try {
    let filtro = {};

    // Si es docente, solo sus cursos
    if (req.usuario.rol === "docente") {
      filtro.docente = req.usuario._id;
    }
    // Si es alumno, solo cursos donde está inscrito
    else if (req.usuario.rol === "alumno") {
      filtro.alumnos = req.usuario._id;
    }
    // Admin ve todos

    const cursos = await Curso.find(filtro)
      .populate("docente", "nombre email")
      .populate("alumnos", "nombre email")
      .sort({ fechaCreacion: -1 });

    res.json(cursos);
  } catch (error) {
    console.error("Error al obtener cursos:", error);
    res.status(500).json({ msg: "Error al obtener cursos" });
  }
};

// Obtener curso por ID
export const obtenerCurso = async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.id)
      .populate("docente", "nombre email")
      .populate("alumnos", "nombre email");

    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Verificar acceso
    if (req.usuario.rol === "alumno") {
      const estaInscrito = curso.alumnos.some(
        alumno => alumno._id.toString() === req.usuario._id.toString()
      );
      if (!estaInscrito) {
        return res.status(403).json({ msg: "No tienes acceso a este curso" });
      }
    } else if (req.usuario.rol === "docente") {
      if (curso.docente._id.toString() !== req.usuario._id.toString()) {
        return res.status(403).json({ msg: "No tienes acceso a este curso" });
      }
    }

    res.json(curso);
  } catch (error) {
    console.error("Error al obtener curso:", error);
    res.status(500).json({ msg: "Error al obtener curso" });
  }
};

// Actualizar curso
export const actualizarCurso = async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.id);

    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Verificar permisos
    if (req.usuario.rol !== "admin" && curso.docente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para editar este curso" });
    }

    // Validar fechas si se actualizan
    if (req.body.fechaInicio && req.body.fechaFin) {
      if (new Date(req.body.fechaInicio) > new Date(req.body.fechaFin)) {
        return res.status(400).json({ msg: "La fecha de inicio no puede ser posterior a la fecha de fin" });
      }
    }

    // Validar código único si se actualiza
    if (req.body.codigo && req.body.codigo !== curso.codigo) {
      const codigoExiste = await Curso.findOne({ codigo: req.body.codigo.toUpperCase() });
      if (codigoExiste) {
        return res.status(400).json({ msg: "El código del curso ya existe" });
      }
      req.body.codigo = req.body.codigo.toUpperCase();
    }

    const cursoActualizado = await Curso.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("docente", "nombre email")
     .populate("alumnos", "nombre email");

    res.json({ msg: "Curso actualizado exitosamente", curso: cursoActualizado });
  } catch (error) {
    console.error("Error al actualizar curso:", error);
    res.status(500).json({ msg: "Error al actualizar curso" });
  }
};

// Eliminar curso
export const eliminarCurso = async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.id);

    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Verificar permisos
    if (req.usuario.rol !== "admin" && curso.docente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para eliminar este curso" });
    }

    // Eliminar clases asociadas
    await Clase.deleteMany({ curso: req.params.id });

    await Curso.findByIdAndDelete(req.params.id);

    res.json({ msg: "Curso y clases asociadas eliminados exitosamente" });
  } catch (error) {
    console.error("Error al eliminar curso:", error);
    res.status(500).json({ msg: "Error al eliminar curso" });
  }
};

// Inscribir alumno
export const inscribirAlumno = async (req, res) => {
  try {
    const { alumnoId } = req.body;

    if (!alumnoId) {
      return res.status(400).json({ msg: "El ID del alumno es requerido" });
    }

    const curso = await Curso.findById(req.params.id);

    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Verificar que el curso esté activo
    if (curso.estado !== "activo") {
      return res.status(400).json({ msg: "No se puede inscribir en un curso inactivo" });
    }

    // Verificar si ya está inscrito
    if (curso.alumnos.includes(alumnoId)) {
      return res.status(400).json({ msg: "El alumno ya está inscrito en este curso" });
    }

    curso.alumnos.push(alumnoId);
    await curso.save();

    const cursoActualizado = await Curso.findById(curso._id)
      .populate("docente", "nombre email")
      .populate("alumnos", "nombre email");

    res.json({ msg: "Alumno inscrito exitosamente", curso: cursoActualizado });
  } catch (error) {
    console.error("Error al inscribir alumno:", error);
    res.status(500).json({ msg: "Error al inscribir alumno" });
  }
};

// Desinscribir alumno
export const desinscribirAlumno = async (req, res) => {
  try {
    const { alumnoId } = req.body;

    if (!alumnoId) {
      return res.status(400).json({ msg: "El ID del alumno es requerido" });
    }

    const curso = await Curso.findById(req.params.id);

    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Verificar si el alumno está inscrito
    if (!curso.alumnos.includes(alumnoId)) {
      return res.status(400).json({ msg: "El alumno no está inscrito en este curso" });
    }

    curso.alumnos = curso.alumnos.filter(
      id => id.toString() !== alumnoId
    );

    await curso.save();

    const cursoActualizado = await Curso.findById(curso._id)
      .populate("docente", "nombre email")
      .populate("alumnos", "nombre email");

    res.json({ msg: "Alumno desinscrito exitosamente", curso: cursoActualizado });
  } catch (error) {
    console.error("Error al desinscribir alumno:", error);
    res.status(500).json({ msg: "Error al desinscribir alumno" });
  }
};

// Obtener estadísticas del curso
export const obtenerEstadisticas = async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.id);

    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    const totalClases = await Clase.countDocuments({ curso: req.params.id });
    const clasesFinalizadas = await Clase.countDocuments({ 
      curso: req.params.id, 
      estado: "finalizada" 
    });
    const clasesProgramadas = await Clase.countDocuments({ 
      curso: req.params.id, 
      estado: "programada" 
    });

    const estadisticas = {
      totalAlumnos: curso.alumnos.length,
      totalClases,
      clasesFinalizadas,
      clasesProgramadas,
      progreso: totalClases > 0 ? ((clasesFinalizadas / totalClases) * 100).toFixed(2) : 0
    };

    res.json(estadisticas);
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ msg: "Error al obtener estadísticas" });
  }
};
// 🆕 NUEVA FUNCIÓN: Obtener alumnos de un curso (para docentes)
export const obtenerAlumnosCurso = async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.id)
      .populate("alumnos", "nombre email legajo");

    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Verificar acceso
    if (req.usuario.rol === "docente") {
      if (curso.docente.toString() !== req.usuario._id.toString()) {
        return res.status(403).json({ msg: "No tienes acceso a este curso" });
      }
    }

    res.json(curso.alumnos);
  } catch (error) {
    console.error("Error al obtener alumnos:", error);
    res.status(500).json({ msg: "Error al obtener alumnos" });
  }
};