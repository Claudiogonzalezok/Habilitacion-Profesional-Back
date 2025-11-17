// backend/src/controllers/entregaController.js
import Entrega from "../models/Entrega.js";
import Tarea from "../models/Tarea.js";
import Inscripcion from "../models/Inscripcion.js";
import Usuario from "../models/Usuario.js";

// Obtener mis entregas (alumno)
export const obtenerMisEntregas = async (req, res) => {
  try {
    const { page = 1, limit = 10, estado, curso } = req.query;
    const alumnoId = req.usuario.id;

    let query = { alumno: alumnoId };

    if (estado) {
      query.estado = estado;
    }

    // Si se filtra por curso, buscar tareas de ese curso
    if (curso) {
      const tareasCurso = await Tarea.find({ curso }).select("_id");
      const tareasIds = tareasCurso.map(t => t._id);
      query.tarea = { $in: tareasIds };
    }

    const total = await Entrega.countDocuments(query);
    const entregas = await Entrega.find(query)
      .populate({
        path: "tarea",
        select: "titulo fechaCierre puntajeMaximo curso",
        populate: {
          path: "curso",
          select: "titulo nombre"
        }
      })
      .sort({ fechaEntrega: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      entregas,
      totalPaginas: Math.ceil(total / limit),
      paginaActual: Number(page),
      total
    });
  } catch (error) {
    console.error("Error al obtener mis entregas:", error);
    res.status(500).json({ msg: "Error al obtener las entregas" });
  }
};

// 🔥 CORREGIDO: Obtener entregas por tarea (docente)
export const obtenerEntregasPorTarea = async (req, res) => {
  try {
    const { tareaId } = req.params;

    // Verificar que la tarea existe
    const tarea = await Tarea.findById(tareaId);
    if (!tarea) {
      return res.status(404).json({ msg: "Tarea no encontrada" });
    }

    // Verificar permisos
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;

    if (rol === "docente" && tarea.docente.toString() !== usuarioId) {
      return res.status(403).json({ msg: "No tienes acceso a estas entregas" });
    }

    // 🔥 CLAVE: Solo traer entregas que REALMENTE tienen contenido
    const entregas = await Entrega.find({ 
      tarea: tareaId,
      $or: [
        { estado: { $ne: "pendiente" } }, // Estados: entregada, calificada, devuelta
        { archivosEntregados: { $exists: true, $ne: [] } }, // Tiene archivos
        { comentarioAlumno: { $exists: true, $ne: "", $ne: null } } // Tiene comentario
      ]
    })
      .populate("alumno", "nombre email")
      .populate("docenteCalificador", "nombre")
      .sort({ fechaEntrega: -1 });

    // Obtener TODOS los alumnos inscritos
    const inscripciones = await Inscripcion.find({
      curso: tarea.curso,
      estado: "aprobada"
    }).populate("alumno", "nombre email");

    // Alumnos que SÍ entregaron (con contenido real)
    const alumnosEntregadosIds = entregas.map(e => e.alumno._id.toString());
    
    // Alumnos que NO entregaron
    const alumnosSinEntregar = inscripciones
      .filter(i => !alumnosEntregadosIds.includes(i.alumno._id.toString()))
      .map(i => ({
        alumno: i.alumno,
        estado: "sin entregar",
        sinEntregar: true
      }));

    res.json({
      entregas, // Solo las que REALMENTE tienen contenido
      alumnosSinEntregar,
      estadisticas: {
        total: inscripciones.length,
        entregadas: entregas.length,
        sinEntregar: alumnosSinEntregar.length,
        calificadas: entregas.filter(e => e.estado === "calificada").length,
        pendientes: entregas.filter(e => e.estado === "entregada").length,
        devueltas: entregas.filter(e => e.estado === "devuelta").length,
        tarde: entregas.filter(e => e.entregadaTarde).length
      }
    });
  } catch (error) {
    console.error("Error al obtener entregas por tarea:", error);
    res.status(500).json({ msg: "Error al obtener las entregas" });
  }
};

// Obtener una entrega específica
export const obtenerEntrega = async (req, res) => {
  try {
    const entrega = await Entrega.findById(req.params.id)
      .populate("alumno", "nombre email")
      .populate({
        path: "tarea",
        populate: {
          path: "curso docente",
          select: "titulo nombre email"
        }
      })
      .populate("docenteCalificador", "nombre email");

    if (!entrega) {
      return res.status(404).json({ msg: "Entrega no encontrada" });
    }

    // Verificar permisos
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;

    if (rol === "alumno" && entrega.alumno._id.toString() !== usuarioId) {
      return res.status(403).json({ msg: "No tienes acceso a esta entrega" });
    }

    if (rol === "docente" && entrega.tarea.docente._id.toString() !== usuarioId) {
      return res.status(403).json({ msg: "No tienes acceso a esta entrega" });
    }

    res.json(entrega);
  } catch (error) {
    console.error("Error al obtener entrega:", error);
    res.status(500).json({ msg: "Error al obtener la entrega" });
  }
};

// Crear/enviar entrega (alumno)
export const crearEntrega = async (req, res) => {
  try {
    const { tareaId, comentarioAlumno } = req.body;
    const alumnoId = req.usuario.id;

    console.log("📝 Crear entrega - tareaId:", tareaId);
    console.log("📝 Crear entrega - alumnoId:", alumnoId);
    console.log("📝 Crear entrega - comentario:", comentarioAlumno);
    console.log("📝 Crear entrega - archivos:", req.files?.length || 0);

    // Validaciones
    if (!tareaId) {
      return res.status(400).json({ msg: "El ID de la tarea es obligatorio" });
    }

    // Verificar que la tarea existe
    const tarea = await Tarea.findById(tareaId).populate("curso");
    if (!tarea) {
      return res.status(404).json({ msg: "Tarea no encontrada" });
    }

    // Verificar que el alumno está inscrito en el curso
    const inscripcion = await Inscripcion.findOne({
      alumno: alumnoId,
      curso: tarea.curso._id,
      estado: "aprobada"
    });

    if (!inscripcion) {
      return res.status(403).json({ msg: "No estás inscrito en este curso" });
    }

    // Verificar si la tarea está abierta
    const ahora = new Date();
    if (ahora < tarea.fechaApertura) {
      return res.status(400).json({ msg: "La tarea aún no está disponible para entregas" });
    }

    // Verificar si la tarea está cerrada
    const entregadaTarde = ahora > tarea.fechaCierre;
    if (entregadaTarde && !tarea.permitirEntregasTarde) {
      return res.status(400).json({ msg: "El plazo de entrega ha finalizado" });
    }

    // Verificar si ya existe una entrega
    let entrega = await Entrega.findOne({
      tarea: tareaId,
      alumno: alumnoId
    });

    // Procesar archivos
    let archivosEntregados = [];
    if (req.files && req.files.length > 0) {
      // Validar cantidad de archivos
      if (req.files.length > tarea.cantidadMaximaArchivos) {
        return res.status(400).json({ 
          msg: `Solo puedes subir hasta ${tarea.cantidadMaximaArchivos} archivos` 
        });
      }

      // Validar tamaño y formato
      for (const file of req.files) {
        if (file.size > tarea.tamanioMaximo) {
          return res.status(400).json({ 
            msg: `El archivo ${file.originalname} excede el tamaño máximo permitido` 
          });
        }

        const extension = file.originalname.split('.').pop().toLowerCase();
        if (tarea.formatosPermitidos.length > 0 && !tarea.formatosPermitidos.includes(extension)) {
          return res.status(400).json({ 
            msg: `El formato .${extension} no está permitido` 
          });
        }
      }

      archivosEntregados = req.files.map(file => ({
        nombre: file.originalname,
        url: file.path,
        tipo: file.mimetype,
        tamano: file.size,
        fechaSubida: new Date()
      }));
    }

    // Validar que haya contenido (archivos o comentario) según tipo de entrega
    if (tarea.tipoEntrega === "archivo" && archivosEntregados.length === 0 && (!entrega || !entrega.archivosEntregados || entrega.archivosEntregados.length === 0)) {
      return res.status(400).json({ msg: "Debes subir al menos un archivo" });
    }

    if (tarea.tipoEntrega === "texto" && !comentarioAlumno && (!entrega || !entrega.comentarioAlumno)) {
      return res.status(400).json({ msg: "Debes escribir un comentario" });
    }

    if (entrega) {
      // Actualizar entrega existente
      console.log("🔄 Actualizando entrega existente:", entrega._id);
      
      // Guardar versión anterior en historial SI tenía contenido
      if (entrega.archivosEntregados.length > 0 || entrega.comentarioAlumno) {
        entrega.versiones.push({
          archivos: entrega.archivosEntregados,
          comentario: entrega.comentarioAlumno,
          fecha: entrega.fechaEntrega || new Date()
        });
      }

      // Actualizar campos
      if (comentarioAlumno) {
        entrega.comentarioAlumno = comentarioAlumno;
      }
      
      if (archivosEntregados.length > 0) {
        entrega.archivosEntregados = [...(entrega.archivosEntregados || []), ...archivosEntregados];
      }
      
      entrega.fechaEntrega = new Date();
      entrega.fechaUltimaModificacion = new Date();
      entrega.estado = "entregada";
      entrega.entregadaTarde = entregadaTarde;

      await entrega.save();

      console.log("✅ Entrega actualizada exitosamente");

      return res.json({
        msg: "Entrega actualizada correctamente",
        entrega
      });
    }

    // Crear nueva entrega
    console.log("🆕 Creando nueva entrega");
    
    const nuevaEntrega = new Entrega({
      tarea: tareaId,
      alumno: alumnoId,
      comentarioAlumno: comentarioAlumno || "",
      archivosEntregados,
      fechaEntrega: new Date(),
      estado: "entregada",
      entregadaTarde
    });

    await nuevaEntrega.save();

    console.log("✅ Nueva entrega creada exitosamente");

    res.status(201).json({
      msg: "Entrega enviada correctamente",
      entrega: nuevaEntrega
    });
  } catch (error) {
    console.error("❌ Error al crear entrega:", error);
    res.status(500).json({ msg: "Error al enviar la entrega" });
  }
};

// Actualizar entrega (alumno - antes de ser calificada)
export const actualizarEntrega = async (req, res) => {
  try {
    const { comentarioAlumno } = req.body;
    const alumnoId = req.usuario.id;

    console.log("🔄 Actualizar entrega - ID:", req.params.id);
    console.log("🔄 Actualizar entrega - comentario:", comentarioAlumno);
    console.log("🔄 Actualizar entrega - archivos:", req.files?.length || 0);

    const entrega = await Entrega.findById(req.params.id).populate("tarea");

    if (!entrega) {
      return res.status(404).json({ msg: "Entrega no encontrada" });
    }

    // Verificar que es el alumno dueño de la entrega
    if (entrega.alumno.toString() !== alumnoId) {
      return res.status(403).json({ msg: "No tienes permiso para editar esta entrega" });
    }

    // No permitir edición si ya fue calificada
    if (entrega.estado === "calificada") {
      return res.status(400).json({ msg: "No puedes editar una entrega ya calificada" });
    }

    // Verificar plazo
    const ahora = new Date();
    const entregadaTarde = ahora > entrega.tarea.fechaCierre;
    if (entregadaTarde && !entrega.tarea.permitirEntregasTarde) {
      return res.status(400).json({ msg: "El plazo de entrega ha finalizado" });
    }

    // Guardar versión anterior SI tenía contenido
    if (entrega.archivosEntregados.length > 0 || entrega.comentarioAlumno) {
      entrega.versiones.push({
        archivos: entrega.archivosEntregados,
        comentario: entrega.comentarioAlumno,
        fecha: entrega.fechaEntrega || new Date()
      });
    }

    // Procesar nuevos archivos
    let archivosEntregados = [...(entrega.archivosEntregados || [])];
    if (req.files && req.files.length > 0) {
      const nuevosArchivos = req.files.map(file => ({
        nombre: file.originalname,
        url: file.path,
        tipo: file.mimetype,
        tamano: file.size,
        fechaSubida: new Date()
      }));
      archivosEntregados = [...archivosEntregados, ...nuevosArchivos];

      // Validar cantidad total
      if (archivosEntregados.length > entrega.tarea.cantidadMaximaArchivos) {
        return res.status(400).json({ 
          msg: `Solo puedes tener hasta ${entrega.tarea.cantidadMaximaArchivos} archivos en total` 
        });
      }
    }

    // Actualizar campos
    if (comentarioAlumno !== undefined) {
      entrega.comentarioAlumno = comentarioAlumno;
    }
    entrega.archivosEntregados = archivosEntregados;
    entrega.fechaUltimaModificacion = new Date();
    entrega.estado = "entregada";
    entrega.entregadaTarde = entregadaTarde;

    await entrega.save();

    console.log("✅ Entrega actualizada exitosamente");

    res.json({
      msg: "Entrega actualizada correctamente",
      entrega
    });
  } catch (error) {
    console.error("❌ Error al actualizar entrega:", error);
    res.status(500).json({ msg: "Error al actualizar la entrega" });
  }
};

// 🔥 CORREGIDO: Calificar entrega (docente)
export const calificarEntrega = async (req, res) => {
  try {
    const { calificacion, comentarioDocente, calificacionRubrica } = req.body;
    const docenteId = req.usuario.id;

    console.log("📝 Calificar entrega - ID:", req.params.id);
    console.log("📝 Calificar entrega - calificación:", calificacion);
    console.log("📝 Calificar entrega - comentario:", comentarioDocente);

    const entrega = await Entrega.findById(req.params.id).populate("tarea");

    if (!entrega) {
      return res.status(404).json({ msg: "Entrega no encontrada" });
    }

    // Verificar permisos
    const rol = req.usuario.rol;
    if (rol === "docente" && entrega.tarea.docente.toString() !== docenteId) {
      return res.status(403).json({ msg: "No tienes permiso para calificar esta entrega" });
    }

    // Validar calificación
    const calificacionNum = Number(calificacion);
    if (isNaN(calificacionNum) || calificacionNum < 0 || calificacionNum > entrega.tarea.puntajeMaximo) {
      return res.status(400).json({ 
        msg: `La calificación debe estar entre 0 y ${entrega.tarea.puntajeMaximo}` 
      });
    }

    // Aplicar penalización si es entrega tarde
    let calificacionFinal = calificacionNum;
    if (entrega.entregadaTarde && entrega.tarea.penalizacionTarde > 0) {
      const penalizacion = (calificacionNum * entrega.tarea.penalizacionTarde) / 100;
      calificacionFinal = Math.max(0, calificacionNum - penalizacion);
    }

    // Procesar archivos de devolución si existen
    let archivosDevolucion = entrega.archivosDevolucion || [];
    if (req.files && req.files.length > 0) {
      const nuevosArchivos = req.files.map(file => ({
        nombre: file.originalname,
        url: file.path,
        tipo: file.mimetype,
        tamano: file.size
      }));
      archivosDevolucion = [...archivosDevolucion, ...nuevosArchivos];
    }

    // Parsear calificación por rúbrica si viene
    let calificacionRubricaParsed = calificacionRubrica;
    if (typeof calificacionRubrica === 'string') {
      try {
        calificacionRubricaParsed = JSON.parse(calificacionRubrica);
      } catch (e) {
        calificacionRubricaParsed = [];
      }
    }

    entrega.calificacion = calificacionFinal;
    entrega.comentarioDocente = comentarioDocente || "";
    entrega.calificacionRubrica = calificacionRubricaParsed || [];
    entrega.archivosDevolucion = archivosDevolucion;
    entrega.estado = "calificada";
    entrega.fechaCalificacion = new Date();
    entrega.docenteCalificador = docenteId;

    await entrega.save();

    console.log("✅ Entrega calificada exitosamente");

    res.json({
      msg: "Entrega calificada correctamente",
      entrega,
      penalizacionAplicada: entrega.entregadaTarde ? entrega.tarea.penalizacionTarde : 0
    });
  } catch (error) {
    console.error("❌ Error al calificar entrega:", error);
    res.status(500).json({ msg: "Error al calificar la entrega" });
  }
};

// Devolver entrega para corrección (docente)
export const devolverEntrega = async (req, res) => {
  try {
    const { comentarioDocente } = req.body;
    const docenteId = req.usuario.id;

    const entrega = await Entrega.findById(req.params.id).populate("tarea");

    if (!entrega) {
      return res.status(404).json({ msg: "Entrega no encontrada" });
    }

    // Verificar permisos
    const rol = req.usuario.rol;
    if (rol === "docente" && entrega.tarea.docente.toString() !== docenteId) {
      return res.status(403).json({ msg: "No tienes permiso para esta acción" });
    }

    entrega.estado = "devuelta";
    entrega.comentarioDocente = comentarioDocente;
    entrega.docenteCalificador = docenteId;

    await entrega.save();

    res.json({
      msg: "Entrega devuelta para corrección",
      entrega
    });
  } catch (error) {
    console.error("Error al devolver entrega:", error);
    res.status(500).json({ msg: "Error al devolver la entrega" });
  }
};

// Exportar calificaciones (docente)
export const exportarCalificaciones = async (req, res) => {
  try {
    const { tareaId } = req.params;

    const tarea = await Tarea.findById(tareaId).populate("curso", "titulo nombre");
    if (!tarea) {
      return res.status(404).json({ msg: "Tarea no encontrada" });
    }

    // Verificar permisos
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;

    if (rol === "docente" && tarea.docente.toString() !== usuarioId) {
      return res.status(403).json({ msg: "No tienes acceso a esta información" });
    }

    // Solo entregas reales
    const entregas = await Entrega.find({ 
      tarea: tareaId,
      $or: [
        { estado: { $ne: "pendiente" } },
        { archivosEntregados: { $ne: [] } },
        { comentarioAlumno: { $ne: "" } }
      ]
    })
      .populate("alumno", "nombre email")
      .sort({ "alumno.nombre": 1 });

    // Obtener alumnos sin entregar
    const inscripciones = await Inscripcion.find({
      curso: tarea.curso._id,
      estado: "aprobada"
    }).populate("alumno", "nombre email");

    const alumnosEntregados = entregas.map(e => e.alumno._id.toString());
    const alumnosSinEntregar = inscripciones
      .filter(i => !alumnosEntregados.includes(i.alumno._id.toString()));

    // Preparar datos para exportar
    const datos = [
      {
        curso: tarea.curso.titulo || tarea.curso.nombre,
        tarea: tarea.titulo,
        puntajeMaximo: tarea.puntajeMaximo,
        fechaExportacion: new Date().toISOString()
      },
      {},
      ["Alumno", "Email", "Estado", "Fecha Entrega", "Tarde", "Calificación", "Comentario Docente"]
    ];

    // Agregar entregas
    entregas.forEach(e => {
      datos.push([
        e.alumno.nombre,
        e.alumno.email,
        e.estado,
        e.fechaEntrega ? new Date(e.fechaEntrega).toLocaleString() : "-",
        e.entregadaTarde ? "Sí" : "No",
        e.calificacion !== null && e.calificacion !== undefined ? e.calificacion : "-",
        e.comentarioDocente || "-"
      ]);
    });

    // Agregar alumnos sin entregar
    alumnosSinEntregar.forEach(i => {
      datos.push([
        i.alumno.nombre,
        i.alumno.email,
        "Sin entregar",
        "-",
        "-",
        "-",
        "-"
      ]);
    });

    res.json({
      datos,
      nombreArchivo: `calificaciones_${tarea.titulo.replace(/\s+/g, '_')}_${Date.now()}.csv`
    });
  } catch (error) {
    console.error("Error al exportar calificaciones:", error);
    res.status(500).json({ msg: "Error al exportar calificaciones" });
  }
};

// Listar todas las entregas (admin)
export const listarEntregas = async (req, res) => {
  try {
    const { page = 1, limit = 20, estado, curso } = req.query;

    let query = {};

    if (estado) {
      query.estado = estado;
    }

    if (curso) {
      const tareasCurso = await Tarea.find({ curso }).select("_id");
      const tareasIds = tareasCurso.map(t => t._id);
      query.tarea = { $in: tareasIds };
    }

    const total = await Entrega.countDocuments(query);
    const entregas = await Entrega.find(query)
      .populate("alumno", "nombre email")
      .populate({
        path: "tarea",
        select: "titulo puntajeMaximo curso",
        populate: {
          path: "curso",
          select: "titulo nombre"
        }
      })
      .sort({ fechaEntrega: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      entregas,
      totalPaginas: Math.ceil(total / limit),
      paginaActual: Number(page),
      total
    });
  } catch (error) {
    console.error("Error al listar entregas:", error);
    res.status(500).json({ msg: "Error al obtener las entregas" });
  }
};