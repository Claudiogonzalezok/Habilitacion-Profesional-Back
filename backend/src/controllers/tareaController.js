// backend/src/controllers/tareaController.js
import Tarea from "../models/Tarea.js";
import Entrega from "../models/Entrega.js";
import Curso from "../models/Curso.js";
import Inscripcion from "../models/Inscripcion.js";

// Listar tareas
export const listarTareas = async (req, res) => {
  try {
    const { page = 1, limit = 10, curso, estado } = req.query;
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;

    let query = {};

    // Filtrar por curso si se proporciona
    if (curso) {
      query.curso = curso;
    }

    // Si es docente, solo ver sus tareas
    if (rol === "docente") {
      query.docente = usuarioId;
    }

    // Si es alumno, solo ver tareas de cursos en los que está inscrito
    if (rol === "alumno") {
      const inscripciones = await Inscripcion.find({ 
        alumno: usuarioId, 
        estado: "aprobada" 
      }).select("curso");
      const cursosIds = inscripciones.map(i => i.curso);
      query.curso = { $in: cursosIds };
      query.publicada = true;
    }

    // Filtrar por estado (abierta, cerrada, proxima)
    if (estado === "abierta") {
      query.fechaApertura = { $lte: new Date() };
      query.fechaCierre = { $gte: new Date() };
    } else if (estado === "cerrada") {
      query.fechaCierre = { $lt: new Date() };
    } else if (estado === "proxima") {
      query.fechaApertura = { $gt: new Date() };
    }

    const total = await Tarea.countDocuments(query);
    const tareas = await Tarea.find(query)
      .populate("curso", "titulo nombre codigo")
      .populate("docente", "nombre email")
      .populate("clase", "titulo")
      .sort({ fechaCierre: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

 // Si es alumno, agregar info de su entrega
if (rol === "alumno") {
  const tareasConEntregas = await Promise.all(
    tareas.map(async (tarea) => {
      const entrega = await Entrega.findOne({
        tarea: tarea._id,
        alumno: usuarioId
      }).select("estado fechaEntrega calificacion entregadaTarde");

      // 🔥 CAMBIAR ESTO:
      const tareaObj = tarea.toObject();
      return {
        ...tareaObj,
        curso: tarea.curso, // 🔥 Preservar el curso poblado explícitamente
        miEntrega: entrega
      };
    })
  );

      return res.json({
        tareas: tareasConEntregas,
        totalPaginas: Math.ceil(total / limit),
        paginaActual: Number(page),
        total
      });
    }

    res.json({
      tareas,
      totalPaginas: Math.ceil(total / limit),
      paginaActual: Number(page),
      total
    });
  } catch (error) {
    console.error("Error al listar tareas:", error);
    res.status(500).json({ msg: "Error al obtener las tareas" });
  }
};

// Obtener tarea por ID
export const obtenerTarea = async (req, res) => {
  try {
    const tarea = await Tarea.findById(req.params.id)
      .populate("curso", "nombre descripcion")
      .populate("docente", "nombre email")
      .populate("clase", "titulo orden");

    if (!tarea) {
      return res.status(404).json({ msg: "Tarea no encontrada" });
    }

    // Verificar permisos
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;

    if (rol === "alumno") {
      // Verificar que el alumno esté inscrito en el curso
      const inscripcion = await Inscripcion.findOne({
        alumno: usuarioId,
        curso: tarea.curso._id,
        estado: "aprobada"
      });

      if (!inscripcion) {
        return res.status(403).json({ msg: "No tienes acceso a esta tarea" });
      }

      // Obtener la entrega del alumno si existe
      const entrega = await Entrega.findOne({
        tarea: tarea._id,
        alumno: usuarioId
      });

      return res.json({
        ...tarea.toObject(),
        miEntrega: entrega
      });
    }

    if (rol === "docente" && tarea.docente._id.toString() !== usuarioId) {
      return res.status(403).json({ msg: "No tienes acceso a esta tarea" });
    }

    // Si es docente, incluir estadísticas de entregas
    if (rol === "docente" || rol === "admin") {
      const estadisticas = await Entrega.aggregate([
        { $match: { tarea: tarea._id } },
        {
          $group: {
            _id: "$estado",
            cantidad: { $sum: 1 }
          }
        }
      ]);

      const totalInscritos = await Inscripcion.countDocuments({
        curso: tarea.curso._id,
        estado: "aprobada"
      });

      return res.json({
        ...tarea.toObject(),
        estadisticas: {
          totalInscritos,
          entregas: estadisticas,
          porcentajeEntrega: totalInscritos > 0 
            ? ((estadisticas.reduce((sum, e) => sum + e.cantidad, 0) / totalInscritos) * 100).toFixed(2)
            : 0
        }
      });
    }

    res.json(tarea);
  } catch (error) {
    console.error("Error al obtener tarea:", error);
    res.status(500).json({ msg: "Error al obtener la tarea" });
  }
};

// Crear tarea
export const crearTarea = async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      curso,
      clase,
      fechaApertura,
      fechaCierre,
      puntajeMaximo,
      permitirEntregasTarde,
      penalizacionTarde,
      tipoEntrega,
      formatosPermitidos,
      tamanioMaximo,
      cantidadMaximaArchivos,
      instrucciones,
      rubrica,
      publicada
    } = req.body;

    // Validaciones
    if (!titulo || !descripcion || !curso || !fechaApertura || !fechaCierre || !puntajeMaximo) {
      return res.status(400).json({ msg: "Faltan campos obligatorios" });
    }

    // Verificar que el curso existe
    const cursoExiste = await Curso.findById(curso);
    if (!cursoExiste) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Verificar que el docente tiene acceso al curso
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;

    if (rol === "docente" && cursoExiste.docente.toString() !== usuarioId) {
      return res.status(403).json({ msg: "No tienes permiso para crear tareas en este curso" });
    }

    // Procesar archivos adjuntos si existen
    let archivosAdjuntos = [];
    if (req.files && req.files.length > 0) {
      archivosAdjuntos = req.files.map(file => ({
        nombre: file.originalname,
        url: file.path, // O la URL si usas cloud storage
        tipo: file.mimetype,
        tamano: file.size
      }));
    }

    // Parsear rúbrica si viene como string
    let rubricaParsed = rubrica;
    if (typeof rubrica === 'string') {
      try {
        rubricaParsed = JSON.parse(rubrica);
      } catch (e) {
        rubricaParsed = [];
      }
    }

    const nuevaTarea = new Tarea({
      titulo,
      descripcion,
      curso,
      clase: clase || null,
      docente: usuarioId,
      fechaApertura,
      fechaCierre,
      puntajeMaximo,
      permitirEntregasTarde: permitirEntregasTarde || false,
      penalizacionTarde: penalizacionTarde || 0,
      archivosAdjuntos,
      tipoEntrega: tipoEntrega || "archivo",
      formatosPermitidos: formatosPermitidos ? formatosPermitidos.split(',') : [],
      tamanioMaximo: tamanioMaximo || 10485760,
      cantidadMaximaArchivos: cantidadMaximaArchivos || 5,
      instrucciones,
      rubrica: rubricaParsed || [],
      publicada: publicada !== undefined ? publicada : true
    });

    await nuevaTarea.save();

    // Crear entregas pendientes para todos los alumnos inscritos
    const inscripciones = await Inscripcion.find({
      curso,
      estado: "aprobada"
    });

    const entregasPendientes = inscripciones.map(inscripcion => ({
      tarea: nuevaTarea._id,
      alumno: inscripcion.alumno,
      estado: "pendiente"
    }));

    if (entregasPendientes.length > 0) {
      await Entrega.insertMany(entregasPendientes);
    }

    res.status(201).json({
      msg: "Tarea creada correctamente",
      tarea: nuevaTarea
    });
  } catch (error) {
    console.error("Error al crear tarea:", error);
    res.status(500).json({ msg: "Error al crear la tarea" });
  }
};

// Actualizar tarea
export const actualizarTarea = async (req, res) => {
  try {
    const tarea = await Tarea.findById(req.params.id);

    if (!tarea) {
      return res.status(404).json({ msg: "Tarea no encontrada" });
    }

    // Verificar permisos
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;

    if (rol === "docente" && tarea.docente.toString() !== usuarioId) {
      return res.status(403).json({ msg: "No tienes permiso para editar esta tarea" });
    }

    // Procesar nuevos archivos si existen
    let archivosAdjuntos = tarea.archivosAdjuntos;
    if (req.files && req.files.length > 0) {
      const nuevosArchivos = req.files.map(file => ({
        nombre: file.originalname,
        url: file.path,
        tipo: file.mimetype,
        tamano: file.size
      }));
      archivosAdjuntos = [...archivosAdjuntos, ...nuevosArchivos];
    }

    // Parsear rúbrica si viene como string
    let rubricaParsed = req.body.rubrica;
    if (typeof req.body.rubrica === 'string') {
      try {
        rubricaParsed = JSON.parse(req.body.rubrica);
      } catch (e) {
        rubricaParsed = tarea.rubrica;
      }
    }

    const datosActualizados = {
      ...req.body,
      archivosAdjuntos,
      rubrica: rubricaParsed,
      formatosPermitidos: req.body.formatosPermitidos 
        ? req.body.formatosPermitidos.split(',') 
        : tarea.formatosPermitidos
    };

    const tareaActualizada = await Tarea.findByIdAndUpdate(
      req.params.id,
      datosActualizados,
      { new: true }
    ).populate("curso", "titulo nombre codigo").populate("docente", "nombre email");

    res.json({
      msg: "Tarea actualizada correctamente",
      tarea: tareaActualizada
    });
  } catch (error) {
    console.error("Error al actualizar tarea:", error);
    res.status(500).json({ msg: "Error al actualizar la tarea" });
  }
};

// Eliminar tarea
export const eliminarTarea = async (req, res) => {
  try {
    const tarea = await Tarea.findById(req.params.id);

    if (!tarea) {
      return res.status(404).json({ msg: "Tarea no encontrada" });
    }

    // Verificar permisos
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;

    if (rol === "docente" && tarea.docente.toString() !== usuarioId) {
      return res.status(403).json({ msg: "No tienes permiso para eliminar esta tarea" });
    }

    // Eliminar entregas asociadas
    await Entrega.deleteMany({ tarea: req.params.id });

    await Tarea.findByIdAndDelete(req.params.id);

    res.json({ msg: "Tarea eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    res.status(500).json({ msg: "Error al eliminar la tarea" });
  }
};

// Obtener tareas por curso
export const obtenerTareasPorCurso = async (req, res) => {
  try {
    const { cursoId } = req.params;
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;

    let query = { curso: cursoId };

    // Si es alumno, solo tareas publicadas
    if (rol === "alumno") {
      query.publicada = true;

      // Verificar inscripción
      const inscripcion = await Inscripcion.findOne({
        alumno: usuarioId,
        curso: cursoId,
        estado: "aprobada"
      });

      if (!inscripcion) {
        return res.status(403).json({ msg: "No estás inscrito en este curso" });
      }
    }

    const tareas = await Tarea.find(query)
      .populate("docente", "nombre")
      .populate("clase", "titulo orden")
      .sort({ fechaCierre: -1 });

    // Si es alumno, incluir info de entregas
    if (rol === "alumno") {
      const tareasConEntregas = await Promise.all(
        tareas.map(async (tarea) => {
          const entrega = await Entrega.findOne({
            tarea: tarea._id,
            alumno: usuarioId
          }).select("estado fechaEntrega calificacion entregadaTarde");

          return {
            ...tarea.toObject(),
            miEntrega: entrega
          };
        })
      );

      return res.json(tareasConEntregas);
    }

    res.json(tareas);
  } catch (error) {
    console.error("Error al obtener tareas por curso:", error);
    res.status(500).json({ msg: "Error al obtener las tareas" });
  }
};

// Obtener tareas próximas a vencer
export const obtenerTareasProximas = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;

    const ahora = new Date();
    const enTresDias = new Date();
    enTresDias.setDate(enTresDias.getDate() + 3);

    let tareas = [];

    if (rol === "alumno") {
      // Obtener cursos del alumno
      const inscripciones = await Inscripcion.find({
        alumno: usuarioId,
        estado: "aprobada"
      }).select("curso");
      const cursosIds = inscripciones.map(i => i.curso);

      // Tareas abiertas próximas a vencer
      tareas = await Tarea.find({
        curso: { $in: cursosIds },
        publicada: true,
        fechaCierre: { $gte: ahora, $lte: enTresDias }
      })
        .populate("curso", "titulo nombre codigo")
        .sort({ fechaCierre: 1 })
        .limit(10);

      // Incluir info de entregas
      const tareasConEntregas = await Promise.all(
        tareas.map(async (tarea) => {
          const entrega = await Entrega.findOne({
            tarea: tarea._id,
            alumno: usuarioId
          }).select("estado fechaEntrega");

          return {
            ...tarea.toObject(),
            miEntrega: entrega
          };
        })
      );

      return res.json(tareasConEntregas);
    }

    if (rol === "docente") {
      tareas = await Tarea.find({
        docente: usuarioId,
        fechaCierre: { $gte: ahora, $lte: enTresDias }
      })
        .populate("curso", "titulo nombre codigo")
        .sort({ fechaCierre: 1 })
        .limit(10);
    }

    if (rol === "admin") {
      tareas = await Tarea.find({
        fechaCierre: { $gte: ahora, $lte: enTresDias }
      })
        .populate("curso", "titulo nombre codigo")
        .populate("docente", "nombre")
        .sort({ fechaCierre: 1 })
        .limit(20);
    }

    res.json(tareas);
  } catch (error) {
    console.error("Error al obtener tareas próximas:", error);
    res.status(500).json({ msg: "Error al obtener las tareas" });
  }
};

// Duplicar tarea
export const duplicarTarea = async (req, res) => {
  try {
    const tareaOriginal = await Tarea.findById(req.params.id);

    if (!tareaOriginal) {
      return res.status(404).json({ msg: "Tarea no encontrada" });
    }

    // Verificar permisos
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;

    if (rol === "docente" && tareaOriginal.docente.toString() !== usuarioId) {
      return res.status(403).json({ msg: "No tienes permiso para duplicar esta tarea" });
    }

    const tareaDuplicada = new Tarea({
      ...tareaOriginal.toObject(),
      _id: undefined,
      titulo: `${tareaOriginal.titulo} (Copia)`,
      fechaCreacion: new Date(),
      publicada: false, // Por defecto no publicada
      // Ajustar fechas si se desea
    });

    await tareaDuplicada.save();

    res.status(201).json({
      msg: "Tarea duplicada correctamente",
      tarea: tareaDuplicada
    });
  } catch (error) {
    console.error("Error al duplicar tarea:", error);
    res.status(500).json({ msg: "Error al duplicar la tarea" });
  }
};