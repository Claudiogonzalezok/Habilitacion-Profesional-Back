// controllers/solicitudInscripcionController.js
import SolicitudInscripcion from "../models/SolicitudInscripcion.js";
import Curso from "../models/Curso.js";
import Usuario from "../models/Usuario.js";

// Helper para enviar notificaciones (usa la estructura de tu modelo)
const enviarNotificacion = async ({ usuario, tipo, titulo, mensaje, enlace, metadata }) => {
  try {
    const Notificacion = (await import("../models/Notificacion.js")).default;
    await Notificacion.create({
      usuario,
      tipo,
      titulo,
      mensaje,
      enlace,
      metadata
    });
  } catch (error) {
    // Si el modelo no existe o hay error, simplemente logueamos y continuamos
    console.log("Notificación no enviada:", error.message);
  }
};

// ============================================
// FUNCIONES PARA ALUMNOS
// ============================================

// Obtener cursos disponibles para inscripción
export const obtenerCursosDisponibles = async (req, res) => {
  try {
    const alumnoId = req.usuario._id;
    const hoy = new Date();

    // Obtener cursos donde:
    // 1. Estado activo
    // 2. Fecha de inicio > hoy (no ha comenzado)
    // 3. El alumno NO está inscrito
    // 4. Hay cupo disponible (opcional)
    const cursos = await Curso.find({
      estado: "activo",
      fechaInicio: { $gt: hoy },
      alumnos: { $ne: alumnoId }
    })
      .populate("docente", "nombre email")
      .select("titulo codigo descripcion fechaInicio fechaFin horario cupoMaximo alumnos imagen")
      .sort({ fechaInicio: 1 });

    // Obtener solicitudes pendientes del alumno para marcar cursos ya solicitados
    const solicitudesPendientes = await SolicitudInscripcion.find({
      alumno: alumnoId,
      estado: "pendiente"
    }).select("curso");

    const cursosSolicitados = new Set(
      solicitudesPendientes.map(s => s.curso.toString())
    );

    // Agregar info de cupo y si ya solicitó
    const cursosConInfo = cursos.map(curso => {
      const cursoObj = curso.toObject();
      const inscritos = curso.alumnos?.length || 0;
      const cupoMaximo = curso.cupoMaximo || 0;
      
      return {
        ...cursoObj,
        inscritos,
        cupoDisponible: cupoMaximo > 0 ? cupoMaximo - inscritos : null,
        hayCupo: cupoMaximo === 0 || inscritos < cupoMaximo,
        yaSolicitado: cursosSolicitados.has(curso._id.toString())
      };
    });

    // Filtrar solo cursos con cupo disponible
    const cursosConCupo = cursosConInfo.filter(c => c.hayCupo);

    res.json(cursosConCupo);
  } catch (error) {
    console.error("Error al obtener cursos disponibles:", error);
    res.status(500).json({ msg: "Error al obtener cursos disponibles" });
  }
};

// Crear solicitud de inscripción
export const crearSolicitud = async (req, res) => {
  try {
    const alumnoId = req.usuario._id;
    const { cursoId, mensaje } = req.body;

    // Validar que el curso existe
    const curso = await Curso.findById(cursoId).populate("docente", "nombre");
    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Validar que el curso está activo
    if (curso.estado !== "activo") {
      return res.status(400).json({ msg: "El curso no está disponible para inscripciones" });
    }

    // Validar que el curso no ha comenzado
    const hoy = new Date();
    if (new Date(curso.fechaInicio) <= hoy) {
      return res.status(400).json({ msg: "El curso ya ha comenzado, no se pueden aceptar inscripciones" });
    }

    // Validar que el alumno no está ya inscrito
    if (curso.alumnos.includes(alumnoId)) {
      return res.status(400).json({ msg: "Ya estás inscrito en este curso" });
    }

    // Validar cupo disponible
    if (curso.cupoMaximo > 0 && curso.alumnos.length >= curso.cupoMaximo) {
      return res.status(400).json({ msg: "No hay cupo disponible en este curso" });
    }

    // Verificar si ya tiene una solicitud pendiente para este curso
    const solicitudExistente = await SolicitudInscripcion.findOne({
      alumno: alumnoId,
      curso: cursoId,
      estado: "pendiente"
    });

    if (solicitudExistente) {
      return res.status(400).json({ msg: "Ya tienes una solicitud pendiente para este curso" });
    }

    // Crear la solicitud
    const nuevaSolicitud = new SolicitudInscripcion({
      alumno: alumnoId,
      curso: cursoId,
      mensaje: mensaje || ""
    });

    await nuevaSolicitud.save();

    // Notificar a los administradores
    try {
      const admins = await Usuario.find({ rol: "admin" }).select("_id");
      const alumno = await Usuario.findById(alumnoId).select("nombre");

      for (const admin of admins) {
        await enviarNotificacion({
          usuario: admin._id,
          tipo: "inscripcion", // Asegurate de agregar "inscripcion" al enum de Notificacion
          titulo: "Nueva solicitud de inscripción",
          mensaje: `${alumno.nombre} ha solicitado inscribirse al curso "${curso.titulo}"`,
          enlace: "/dashboard/solicitudes-inscripcion",
          metadata: {
            cursoId: cursoId
          }
        });
      }
    } catch (notifError) {
      console.log("Error en notificaciones:", notifError.message);
    }

    // Populate para respuesta
    await nuevaSolicitud.populate([
      { path: "curso", select: "titulo codigo fechaInicio" },
      { path: "alumno", select: "nombre email" }
    ]);

    res.status(201).json({
      msg: "Solicitud de inscripción enviada correctamente",
      solicitud: nuevaSolicitud
    });
  } catch (error) {
    console.error("Error al crear solicitud:", error);
    
    // Error de duplicado
    if (error.code === 11000) {
      return res.status(400).json({ msg: "Ya tienes una solicitud pendiente para este curso" });
    }
    
    res.status(500).json({ msg: "Error al crear solicitud de inscripción" });
  }
};

// Obtener mis solicitudes (alumno)
export const obtenerMisSolicitudes = async (req, res) => {
  try {
    const alumnoId = req.usuario._id;
    const { estado } = req.query;

    const filtro = { alumno: alumnoId };
    if (estado && ["pendiente", "aprobada", "rechazada", "cancelada"].includes(estado)) {
      filtro.estado = estado;
    }

    const solicitudes = await SolicitudInscripcion.find(filtro)
      .populate("curso", "titulo codigo fechaInicio fechaFin docente imagen")
      .populate({
        path: "curso",
        populate: { path: "docente", select: "nombre" }
      })
      .sort({ fechaSolicitud: -1 });

    res.json(solicitudes);
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    res.status(500).json({ msg: "Error al obtener solicitudes" });
  }
};

// Cancelar solicitud (alumno)
export const cancelarSolicitud = async (req, res) => {
  try {
    const alumnoId = req.usuario._id;
    const { solicitudId } = req.params;

    const solicitud = await SolicitudInscripcion.findOne({
      _id: solicitudId,
      alumno: alumnoId
    });

    if (!solicitud) {
      return res.status(404).json({ msg: "Solicitud no encontrada" });
    }

    if (solicitud.estado !== "pendiente") {
      return res.status(400).json({ msg: "Solo se pueden cancelar solicitudes pendientes" });
    }

    solicitud.estado = "cancelada";
    solicitud.fechaProcesamiento = new Date();
    await solicitud.save();

    res.json({ msg: "Solicitud cancelada correctamente" });
  } catch (error) {
    console.error("Error al cancelar solicitud:", error);
    res.status(500).json({ msg: "Error al cancelar solicitud" });
  }
};

// ============================================
// FUNCIONES PARA ADMIN
// ============================================

// Obtener todas las solicitudes (admin)
export const obtenerTodasSolicitudes = async (req, res) => {
  try {
    const { estado, cursoId, page = 1, limit = 20 } = req.query;

    const filtro = {};
    if (estado && ["pendiente", "aprobada", "rechazada", "cancelada"].includes(estado)) {
      filtro.estado = estado;
    }
    if (cursoId) {
      filtro.curso = cursoId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [solicitudes, total] = await Promise.all([
      SolicitudInscripcion.find(filtro)
        .populate("alumno", "nombre email legajo imagen")
        .populate("curso", "titulo codigo fechaInicio cupoMaximo alumnos")
        .populate("procesadaPor", "nombre")
        .sort({ fechaSolicitud: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SolicitudInscripcion.countDocuments(filtro)
    ]);

    // Agregar info de cupo a cada solicitud
    const solicitudesConInfo = solicitudes.map(sol => {
      const solObj = sol.toObject();
      if (sol.curso) {
        const inscritos = sol.curso.alumnos?.length || 0;
        const cupoMaximo = sol.curso.cupoMaximo || 0;
        solObj.curso.inscritos = inscritos;
        solObj.curso.cupoDisponible = cupoMaximo > 0 ? cupoMaximo - inscritos : "Sin límite";
      }
      return solObj;
    });

    res.json({
      solicitudes: solicitudesConInfo,
      total,
      pagina: parseInt(page),
      paginas: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    res.status(500).json({ msg: "Error al obtener solicitudes" });
  }
};

// Obtener resumen de solicitudes pendientes (admin)
export const obtenerResumenSolicitudes = async (req, res) => {
  try {
    const [pendientes, aprobadas, rechazadas, porCurso] = await Promise.all([
      SolicitudInscripcion.countDocuments({ estado: "pendiente" }),
      SolicitudInscripcion.countDocuments({ estado: "aprobada" }),
      SolicitudInscripcion.countDocuments({ estado: "rechazada" }),
      SolicitudInscripcion.aggregate([
        { $match: { estado: "pendiente" } },
        { $group: { _id: "$curso", count: { $sum: 1 } } },
        { $lookup: { from: "cursos", localField: "_id", foreignField: "_id", as: "curso" } },
        { $unwind: "$curso" },
        { $project: { _id: 1, count: 1, titulo: "$curso.titulo", codigo: "$curso.codigo" } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      pendientes,
      aprobadas,
      rechazadas,
      porCurso
    });
  } catch (error) {
    console.error("Error al obtener resumen:", error);
    res.status(500).json({ msg: "Error al obtener resumen de solicitudes" });
  }
};

// Aprobar solicitud (admin)
export const aprobarSolicitud = async (req, res) => {
  try {
    const adminId = req.usuario._id;
    const { solicitudId } = req.params;

    const solicitud = await SolicitudInscripcion.findById(solicitudId)
      .populate("curso")
      .populate("alumno", "nombre email");

    if (!solicitud) {
      return res.status(404).json({ msg: "Solicitud no encontrada" });
    }

    if (solicitud.estado !== "pendiente") {
      return res.status(400).json({ msg: "Esta solicitud ya fue procesada" });
    }

    const curso = solicitud.curso;

    // Verificar que el curso sigue disponible
    if (curso.estado !== "activo") {
      return res.status(400).json({ msg: "El curso ya no está disponible" });
    }

    // Verificar cupo
    if (curso.cupoMaximo > 0 && curso.alumnos.length >= curso.cupoMaximo) {
      return res.status(400).json({ msg: "No hay cupo disponible en el curso" });
    }

    // Verificar que no esté ya inscrito
    if (curso.alumnos.includes(solicitud.alumno._id)) {
      solicitud.estado = "aprobada";
      solicitud.procesadaPor = adminId;
      solicitud.fechaProcesamiento = new Date();
      await solicitud.save();
      return res.status(400).json({ msg: "El alumno ya está inscrito en este curso" });
    }

    // Inscribir al alumno en el curso
    curso.alumnos.push(solicitud.alumno._id);
    await curso.save();

    // Actualizar solicitud
    solicitud.estado = "aprobada";
    solicitud.procesadaPor = adminId;
    solicitud.fechaProcesamiento = new Date();
    await solicitud.save();

    // Notificar al alumno
    await enviarNotificacion({
      usuario: solicitud.alumno._id,
      tipo: "inscripcion",
      titulo: "Inscripción aprobada",
      mensaje: `Tu solicitud de inscripción al curso "${curso.titulo}" ha sido aprobada. ¡Ya puedes acceder al curso!`,
      enlace: `/dashboard/cursos/${curso._id}`,
      metadata: {
        cursoId: curso._id
      }
    });

    res.json({
      msg: "Solicitud aprobada correctamente. El alumno ha sido inscrito en el curso.",
      solicitud
    });
  } catch (error) {
    console.error("Error al aprobar solicitud:", error);
    res.status(500).json({ msg: "Error al aprobar solicitud" });
  }
};

// Rechazar solicitud (admin)
export const rechazarSolicitud = async (req, res) => {
  try {
    const adminId = req.usuario._id;
    const { solicitudId } = req.params;
    const { motivoRechazo } = req.body;

    if (!motivoRechazo || motivoRechazo.trim().length < 5) {
      return res.status(400).json({ msg: "Debes indicar un motivo de rechazo (mínimo 5 caracteres)" });
    }

    const solicitud = await SolicitudInscripcion.findById(solicitudId)
      .populate("curso", "titulo")
      .populate("alumno", "nombre");

    if (!solicitud) {
      return res.status(404).json({ msg: "Solicitud no encontrada" });
    }

    if (solicitud.estado !== "pendiente") {
      return res.status(400).json({ msg: "Esta solicitud ya fue procesada" });
    }

    // Actualizar solicitud
    solicitud.estado = "rechazada";
    solicitud.motivoRechazo = motivoRechazo.trim();
    solicitud.procesadaPor = adminId;
    solicitud.fechaProcesamiento = new Date();
    await solicitud.save();

    // Notificar al alumno
    await enviarNotificacion({
      usuario: solicitud.alumno._id,
      tipo: "inscripcion",
      titulo: "Inscripción rechazada",
      mensaje: `Tu solicitud de inscripción al curso "${solicitud.curso.titulo}" ha sido rechazada. Motivo: ${motivoRechazo}`,
      enlace: "/dashboard/inscripcion",
      metadata: {
        cursoId: solicitud.curso._id
      }
    });

    res.json({
      msg: "Solicitud rechazada correctamente",
      solicitud
    });
  } catch (error) {
    console.error("Error al rechazar solicitud:", error);
    res.status(500).json({ msg: "Error al rechazar solicitud" });
  }
};

// Aprobar múltiples solicitudes (admin)
export const aprobarMultiples = async (req, res) => {
  try {
    const adminId = req.usuario._id;
    const { solicitudIds } = req.body;

    if (!Array.isArray(solicitudIds) || solicitudIds.length === 0) {
      return res.status(400).json({ msg: "Debes seleccionar al menos una solicitud" });
    }

    const resultados = {
      aprobadas: 0,
      errores: []
    };

    for (const solicitudId of solicitudIds) {
      try {
        const solicitud = await SolicitudInscripcion.findById(solicitudId)
          .populate("curso")
          .populate("alumno", "nombre");

        if (!solicitud || solicitud.estado !== "pendiente") {
          resultados.errores.push({ id: solicitudId, error: "Solicitud no válida o ya procesada" });
          continue;
        }

        const curso = solicitud.curso;

        // Verificar cupo
        if (curso.cupoMaximo > 0 && curso.alumnos.length >= curso.cupoMaximo) {
          resultados.errores.push({ id: solicitudId, error: "Sin cupo disponible" });
          continue;
        }

        // Verificar que no esté inscrito
        if (!curso.alumnos.includes(solicitud.alumno._id)) {
          curso.alumnos.push(solicitud.alumno._id);
          await curso.save();
        }

        solicitud.estado = "aprobada";
        solicitud.procesadaPor = adminId;
        solicitud.fechaProcesamiento = new Date();
        await solicitud.save();

        // Notificar
        await enviarNotificacion({
          usuario: solicitud.alumno._id,
          tipo: "inscripcion",
          titulo: "Inscripción aprobada",
          mensaje: `Tu solicitud de inscripción al curso "${curso.titulo}" ha sido aprobada.`,
          enlace: `/dashboard/cursos/${curso._id}`,
          metadata: {
            cursoId: curso._id
          }
        });

        resultados.aprobadas++;
      } catch (err) {
        resultados.errores.push({ id: solicitudId, error: err.message });
      }
    }

    res.json({
      msg: `Se aprobaron ${resultados.aprobadas} de ${solicitudIds.length} solicitudes`,
      ...resultados
    });
  } catch (error) {
    console.error("Error al aprobar múltiples:", error);
    res.status(500).json({ msg: "Error al procesar solicitudes" });
  }
};