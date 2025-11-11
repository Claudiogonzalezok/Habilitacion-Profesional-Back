// controllers/claseController.js
import Clase from "../models/Clase.js";
import Curso from "../models/Curso.js";

// Obtener clases por curso
export const obtenerClasesPorCurso = async (req, res) => {
  try {
    const { cursoId } = req.params;

    // Verificar que el curso existe
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

    const clases = await Clase.find({ curso: cursoId })
      .populate("curso", "titulo codigo")
      .sort({ fecha: 1, orden: 1 });

    res.json(clases);
  } catch (error) {
    console.error("Error al obtener clases:", error);
    res.status(500).json({ msg: "Error al obtener clases" });
  }
};

// Obtener clase por ID
export const obtenerClase = async (req, res) => {
  try {
    const clase = await Clase.findById(req.params.id)
      .populate("curso", "titulo codigo docente alumnos")
      .populate("asistencias.estudiante", "nombre email");

    if (!clase) {
      return res.status(404).json({ msg: "Clase no encontrada" });
    }

    // Verificar acceso
    const curso = await Curso.findById(clase.curso._id);
    if (req.usuario.rol === "alumno") {
      const estaInscrito = curso.alumnos.some(
        alumno => alumno.toString() === req.usuario._id.toString()
      );
      if (!estaInscrito) {
        return res.status(403).json({ msg: "No tienes acceso a esta clase" });
      }
    } else if (req.usuario.rol === "docente") {
      if (curso.docente.toString() !== req.usuario._id.toString()) {
        return res.status(403).json({ msg: "No tienes acceso a esta clase" });
      }
    }

    res.json(clase);
  } catch (error) {
    console.error("Error al obtener clase:", error);
    res.status(500).json({ msg: "Error al obtener clase" });
  }
};

// Crear clase
export const crearClase = async (req, res) => {
  try {
    const { 
      titulo, 
      descripcion, 
      cursoId,
      fecha, 
      horario,  // { inicio, fin }
      ubicacion, // { tipo, enlace }
      contenido, 
      orden 
    } = req.body;

    // Verificar que el curso existe
    const cursoExiste = await Curso.findById(cursoId);
    if (!cursoExiste) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Verificar permisos
    if (req.usuario.rol !== "admin" && cursoExiste.docente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para crear clases en este curso" });
    }

    // Validar que horario e ubicacion existan
    if (!horario || !horario.inicio || !horario.fin) {
      return res.status(400).json({ msg: "El horario (inicio y fin) es requerido" });
    }

    if (!ubicacion || !ubicacion.tipo) {
      return res.status(400).json({ msg: "El tipo de ubicación es requerido" });
    }

    // Validar horas
    if (horario.inicio >= horario.fin) {
      return res.status(400).json({ msg: "La hora de inicio debe ser anterior a la hora de fin" });
    }

    // Validar fecha dentro del rango del curso
    const fechaClase = new Date(fecha);
    if (fechaClase < new Date(cursoExiste.fechaInicio) || 
        fechaClase > new Date(cursoExiste.fechaFin)) {
      return res.status(400).json({ msg: "La fecha debe estar dentro del período del curso" });
    }

    // Crear clase con los campos del modelo actual
    const nuevaClase = new Clase({
      titulo,
      descripcion,
      curso: cursoId,
      fecha,
      horaInicio: horario.inicio,  // Mapear al campo del modelo
      horaFin: horario.fin,         // Mapear al campo del modelo
      tipo: ubicacion.tipo,         // Mapear al campo del modelo
      enlaceReunion: ubicacion.enlace || "", // Mapear al campo del modelo
      contenido,
      orden
    });

    await nuevaClase.save();
    await nuevaClase.populate("curso", "titulo codigo");

    res.status(201).json({ msg: "Clase creada exitosamente", clase: nuevaClase });
  } catch (error) {
    console.error("Error al crear clase:", error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ msg: messages.join(', ') });
    }

    res.status(500).json({ msg: "Error al crear clase" });
  }
};

// Actualizar clase
export const actualizarClase = async (req, res) => {
  try {
    const clase = await Clase.findById(req.params.id).populate("curso");

    if (!clase) {
      return res.status(404).json({ msg: "Clase no encontrada" });
    }

    // Verificar permisos
    if (req.usuario.rol !== "admin" && clase.curso.docente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para editar esta clase" });
    }

    const { horario, ubicacion, cursoId, ...otrosCampos } = req.body;

    // Preparar datos para actualizar
    const datosActualizacion = { ...otrosCampos };

    // Mapear horario si viene
    if (horario) {
      if (horario.inicio) datosActualizacion.horaInicio = horario.inicio;
      if (horario.fin) datosActualizacion.horaFin = horario.fin;
      
      // Validar horas si se actualizan
      if (datosActualizacion.horaInicio && datosActualizacion.horaFin) {
        if (datosActualizacion.horaInicio >= datosActualizacion.horaFin) {
          return res.status(400).json({ msg: "La hora de inicio debe ser anterior a la hora de fin" });
        }
      }
    }

    // Mapear ubicacion si viene
    if (ubicacion) {
      if (ubicacion.tipo) datosActualizacion.tipo = ubicacion.tipo;
      if (ubicacion.enlace !== undefined) datosActualizacion.enlaceReunion = ubicacion.enlace;
    }

    // Validar fecha si se actualiza
    if (req.body.fecha) {
      const curso = await Curso.findById(clase.curso._id);
      const fechaClase = new Date(req.body.fecha);
      if (fechaClase < new Date(curso.fechaInicio) || 
          fechaClase > new Date(curso.fechaFin)) {
        return res.status(400).json({ msg: "La fecha debe estar dentro del período del curso" });
      }
    }

    const claseActualizada = await Clase.findByIdAndUpdate(
      req.params.id,
      datosActualizacion,
      { new: true, runValidators: true }
    ).populate("curso", "titulo codigo");

    res.json({ msg: "Clase actualizada exitosamente", clase: claseActualizada });
  } catch (error) {
    console.error("Error al actualizar clase:", error);
    res.status(500).json({ msg: "Error al actualizar clase" });
  }
};

// Eliminar clase
export const eliminarClase = async (req, res) => {
  try {
    const clase = await Clase.findById(req.params.id).populate("curso");

    if (!clase) {
      return res.status(404).json({ msg: "Clase no encontrada" });
    }

    // Verificar permisos
    if (req.usuario.rol !== "admin" && clase.curso.docente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para eliminar esta clase" });
    }

    await Clase.findByIdAndDelete(req.params.id);

    res.json({ msg: "Clase eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar clase:", error);
    res.status(500).json({ msg: "Error al eliminar clase" });
  }
};

// Agregar material
export const agregarMaterial = async (req, res) => {
  try {
    const { nombre, tipo, url, descripcion, tamano } = req.body;

    if (!nombre || !url) {
      return res.status(400).json({ msg: "Nombre y URL son requeridos" });
    }

    const clase = await Clase.findById(req.params.id).populate("curso");

    if (!clase) {
      return res.status(404).json({ msg: "Clase no encontrada" });
    }

    // Verificar permisos
    if (req.usuario.rol !== "admin" && clase.curso.docente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para agregar materiales" });
    }

    const nuevoMaterial = {
      nombre,
      tipo: tipo || "documento",
      url,
      descripcion,
      tamano
    };

    clase.materiales.push(nuevoMaterial);
    await clase.save();

    res.json({ msg: "Material agregado exitosamente", clase });
  } catch (error) {
    console.error("Error al agregar material:", error);
    res.status(500).json({ msg: "Error al agregar material" });
  }
};

// Eliminar material
export const eliminarMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;

    const clase = await Clase.findById(req.params.id).populate("curso");

    if (!clase) {
      return res.status(404).json({ msg: "Clase no encontrada" });
    }

    // Verificar permisos
    if (req.usuario.rol !== "admin" && clase.curso.docente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para eliminar materiales" });
    }

    // Verificar que el material existe
    const materialExiste = clase.materiales.id(materialId);
    if (!materialExiste) {
      return res.status(404).json({ msg: "Material no encontrado" });
    }

    clase.materiales = clase.materiales.filter(
      mat => mat._id.toString() !== materialId
    );

    await clase.save();

    res.json({ msg: "Material eliminado exitosamente", clase });
  } catch (error) {
    console.error("Error al eliminar material:", error);
    res.status(500).json({ msg: "Error al eliminar material" });
  }
};

// Registrar asistencia
export const registrarAsistencia = async (req, res) => {
  try {
    const { estudianteId, presente } = req.body;

    if (!estudianteId || presente === undefined) {
      return res.status(400).json({ msg: "ID del estudiante y estado son requeridos" });
    }

    const clase = await Clase.findById(req.params.id).populate("curso");

    if (!clase) {
      return res.status(404).json({ msg: "Clase no encontrada" });
    }

    // Verificar permisos (solo docente o admin)
    if (req.usuario.rol !== "admin" && clase.curso.docente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para registrar asistencia" });
    }

    // Verificar que el estudiante está inscrito
    const curso = await Curso.findById(clase.curso._id);
    const estaInscrito = curso.alumnos.some(
      alumno => alumno.toString() === estudianteId
    );

    if (!estaInscrito) {
      return res.status(400).json({ msg: "El estudiante no está inscrito en este curso" });
    }

    // Buscar si ya existe registro
    const asistenciaExistente = clase.asistencias.find(
      a => a.estudiante.toString() === estudianteId
    );

    if (asistenciaExistente) {
      asistenciaExistente.presente = presente;
      asistenciaExistente.fechaRegistro = new Date();
    } else {
      clase.asistencias.push({
        estudiante: estudianteId,
        presente,
        fechaRegistro: new Date()
      });
    }

    await clase.save();

    const claseActualizada = await Clase.findById(clase._id)
      .populate("asistencias.estudiante", "nombre email");

    res.json({ msg: "Asistencia registrada exitosamente", clase: claseActualizada });
  } catch (error) {
    console.error("Error al registrar asistencia:", error);
    res.status(500).json({ msg: "Error al registrar asistencia" });
  }
};

// Cambiar estado de la clase
export const cambiarEstado = async (req, res) => {
  try {
    const { estado } = req.body;

    const estadosValidos = ["programada", "en_curso", "finalizada", "cancelada"];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ msg: "Estado no válido" });
    }

    const clase = await Clase.findById(req.params.id).populate("curso");

    if (!clase) {
      return res.status(404).json({ msg: "Clase no encontrada" });
    }

    // Verificar permisos
    if (req.usuario.rol !== "admin" && clase.curso.docente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para cambiar el estado" });
    }

    clase.estado = estado;
    await clase.save();

    res.json({ msg: "Estado actualizado exitosamente", clase });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    res.status(500).json({ msg: "Error al cambiar estado" });
  }
};