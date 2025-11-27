// controllers/calificacionesController.js
import Curso from "../models/Curso.js";
import Examen from "../models/Examen.js";
import Tarea from "../models/Tarea.js";
import Entrega from "../models/Entrega.js";
import Usuario from "../models/Usuario.js";

// Obtener todos los alumnos de un curso con sus calificaciones
export const obtenerCalificacionesCurso = async (req, res) => {
  try {
    const { cursoId } = req.params;

    // Verificar que el curso existe
    const curso = await Curso.findById(cursoId)
      .populate("alumnos", "nombre email legajo")
      .populate("docente", "nombre email");

    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Verificar permisos (solo docente del curso o admin)
    if (req.usuario.rol === "docente" && 
        curso.docente._id.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes acceso a este curso" });
    }

    // Obtener exámenes del curso
    const examenes = await Examen.find({ 
      curso: cursoId,
      estado: { $in: ["publicado", "cerrado"] }
    }).select("titulo puntajeTotal intentos configuracion");

    // Obtener tareas del curso
    const tareas = await Tarea.find({ 
      curso: cursoId,
      publicada: true 
    }).select("titulo puntajeMaximo");

    // Obtener entregas de tareas
    const tareasIds = tareas.map(t => t._id);
    const entregas = await Entrega.find({
      tarea: { $in: tareasIds }
    }).select("tarea alumno calificacion estado fechaEntrega");

    // Construir datos de calificaciones por alumno
    const calificaciones = curso.alumnos.map(alumno => {
      // Calificaciones de exámenes
      const calificacionesExamenes = examenes.map(examen => {
        const intentosAlumno = examen.intentos.filter(
          i => i.alumno.toString() === alumno._id.toString() && 
               (i.estado === "calificado" || i.estado === "completado")
        );
        
        // Tomar el mejor intento o el último
        const mejorIntento = intentosAlumno.reduce((mejor, actual) => {
          if (!mejor) return actual;
          return actual.porcentaje > mejor.porcentaje ? actual : mejor;
        }, null);

        return {
          examenId: examen._id,
          titulo: examen.titulo,
          puntajeMaximo: examen.puntajeTotal,
          puntajeObtenido: mejorIntento ? mejorIntento.puntuacionTotal : null,
          porcentaje: mejorIntento ? parseFloat(mejorIntento.porcentaje) : null,
          estado: mejorIntento ? mejorIntento.estado : "sin_realizar",
          intentos: intentosAlumno.length,
          intentosPermitidos: examen.configuracion.intentosPermitidos
        };
      });

      // Calificaciones de tareas
      const calificacionesTareas = tareas.map(tarea => {
        const entrega = entregas.find(
          e => e.tarea.toString() === tarea._id.toString() && 
               e.alumno.toString() === alumno._id.toString()
        );

        return {
          tareaId: tarea._id,
          titulo: tarea.titulo,
          puntajeMaximo: tarea.puntajeMaximo,
          puntajeObtenido: entrega?.calificacion ?? null,
          porcentaje: entrega?.calificacion != null 
            ? ((entrega.calificacion / tarea.puntajeMaximo) * 100).toFixed(2)
            : null,
          estado: entrega?.estado || "pendiente",
          fechaEntrega: entrega?.fechaEntrega || null
        };
      });

      // Calcular promedios
      const examenesCalificados = calificacionesExamenes.filter(e => e.porcentaje !== null);
      const tareasCalificadas = calificacionesTareas.filter(t => t.porcentaje !== null);

      const promedioExamenes = examenesCalificados.length > 0
        ? (examenesCalificados.reduce((sum, e) => sum + e.porcentaje, 0) / examenesCalificados.length).toFixed(2)
        : null;

      const promedioTareas = tareasCalificadas.length > 0
        ? (tareasCalificadas.reduce((sum, t) => sum + parseFloat(t.porcentaje), 0) / tareasCalificadas.length).toFixed(2)
        : null;

      const promedioGeneral = (promedioExamenes !== null || promedioTareas !== null)
        ? (((parseFloat(promedioExamenes) || 0) + (parseFloat(promedioTareas) || 0)) / 
           ((promedioExamenes !== null ? 1 : 0) + (promedioTareas !== null ? 1 : 0))).toFixed(2)
        : null;

      return {
        alumno: {
          _id: alumno._id,
          nombre: alumno.nombre,
          email: alumno.email,
          legajo: alumno.legajo
        },
        examenes: calificacionesExamenes,
        tareas: calificacionesTareas,
        promedios: {
          examenes: promedioExamenes,
          tareas: promedioTareas,
          general: promedioGeneral
        }
      };
    });

    res.json({
      curso: {
        _id: curso._id,
        titulo: curso.titulo,
        codigo: curso.codigo,
        docente: curso.docente
      },
      resumen: {
        totalAlumnos: curso.alumnos.length,
        totalExamenes: examenes.length,
        totalTareas: tareas.length
      },
      examenes: examenes.map(e => ({ _id: e._id, titulo: e.titulo, puntajeTotal: e.puntajeTotal })),
      tareas: tareas.map(t => ({ _id: t._id, titulo: t.titulo, puntajeMaximo: t.puntajeMaximo })),
      calificaciones
    });
  } catch (error) {
    console.error("Error al obtener calificaciones:", error);
    res.status(500).json({ msg: "Error al obtener calificaciones" });
  }
};

// Obtener calificaciones de un alumno específico
export const obtenerCalificacionesAlumno = async (req, res) => {
  try {
    const { cursoId, alumnoId } = req.params;

    // Verificar que el curso existe
    const curso = await Curso.findById(cursoId)
      .populate("docente", "nombre email");

    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Verificar permisos
    if (req.usuario.rol === "docente" && 
        curso.docente._id.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes acceso a este curso" });
    }

    // Verificar que el alumno está inscrito
    if (!curso.alumnos.includes(alumnoId)) {
      return res.status(404).json({ msg: "Alumno no encontrado en este curso" });
    }

    // Obtener datos del alumno
    const alumno = await Usuario.findById(alumnoId)
      .select("nombre email legajo");

    // Obtener exámenes con detalles completos
    const examenes = await Examen.find({ 
      curso: cursoId,
      estado: { $in: ["publicado", "cerrado"] }
    });

    const calificacionesExamenes = examenes.map(examen => {
      const intentosAlumno = examen.intentos.filter(
        i => i.alumno.toString() === alumnoId && 
             (i.estado === "calificado" || i.estado === "completado")
      );

      return {
        examenId: examen._id,
        titulo: examen.titulo,
        descripcion: examen.descripcion,
        puntajeMaximo: examen.puntajeTotal,
        fechaApertura: examen.fechaApertura,
        fechaCierre: examen.fechaCierre,
        intentos: intentosAlumno.map(i => ({
          intentoId: i._id,
          puntajeObtenido: i.puntuacionTotal,
          porcentaje: i.porcentaje,
          estado: i.estado,
          fechaInicio: i.fechaInicio,
          fechaEntrega: i.fechaEntrega,
          tiempoTranscurrido: i.tiempoTranscurrido,
          retroalimentacion: i.retroalimentacion
        })),
        mejorCalificacion: intentosAlumno.length > 0
          ? Math.max(...intentosAlumno.map(i => parseFloat(i.porcentaje)))
          : null
      };
    });

    // Obtener tareas con entregas
    const tareas = await Tarea.find({ 
      curso: cursoId,
      publicada: true 
    });

    const tareasIds = tareas.map(t => t._id);
    const entregas = await Entrega.find({
      tarea: { $in: tareasIds },
      alumno: alumnoId
    });

    const calificacionesTareas = tareas.map(tarea => {
      const entrega = entregas.find(
        e => e.tarea.toString() === tarea._id.toString()
      );

      return {
        tareaId: tarea._id,
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        puntajeMaximo: tarea.puntajeMaximo,
        fechaApertura: tarea.fechaApertura,
        fechaCierre: tarea.fechaCierre,
        entrega: entrega ? {
          entregaId: entrega._id,
          estado: entrega.estado,
          fechaEntrega: entrega.fechaEntrega,
          calificacion: entrega.calificacion,
          porcentaje: entrega.calificacion != null
            ? ((entrega.calificacion / tarea.puntajeMaximo) * 100).toFixed(2)
            : null,
          comentarios: entrega.comentarios,
          entregadaTarde: entrega.entregadaTarde
        } : null
      };
    });

    // Calcular estadísticas
    const examenesCalificados = calificacionesExamenes.filter(e => e.mejorCalificacion !== null);
    const tareasCalificadas = calificacionesTareas.filter(t => t.entrega?.calificacion != null);

    res.json({
      alumno,
      curso: {
        _id: curso._id,
        titulo: curso.titulo,
        codigo: curso.codigo
      },
      examenes: calificacionesExamenes,
      tareas: calificacionesTareas,
      estadisticas: {
        examenesRealizados: examenesCalificados.length,
        examenesTotales: examenes.length,
        tareasEntregadas: tareasCalificadas.length,
        tareasTotales: tareas.length,
        promedioExamenes: examenesCalificados.length > 0
          ? (examenesCalificados.reduce((sum, e) => sum + e.mejorCalificacion, 0) / examenesCalificados.length).toFixed(2)
          : null,
        promedioTareas: tareasCalificadas.length > 0
          ? (tareasCalificadas.reduce((sum, t) => sum + parseFloat(t.entrega.porcentaje), 0) / tareasCalificadas.length).toFixed(2)
          : null
      }
    });
  } catch (error) {
    console.error("Error al obtener calificaciones del alumno:", error);
    res.status(500).json({ msg: "Error al obtener calificaciones del alumno" });
  }
};

// Obtener cursos del docente para el selector
export const obtenerCursosDocente = async (req, res) => {
  try {
    let filtro = {};

    if (req.usuario.rol === "docente") {
      filtro.docente = req.usuario._id;
    }
    // Admin puede ver todos

    const cursos = await Curso.find(filtro)
      .select("titulo codigo estado alumnos fechaInicio fechaFin")
      .sort({ fechaCreacion: -1 });

    const cursosConConteo = cursos.map(curso => ({
      _id: curso._id,
      titulo: curso.titulo,
      codigo: curso.codigo,
      estado: curso.estado,
      cantidadAlumnos: curso.alumnos.length,
      fechaInicio: curso.fechaInicio,
      fechaFin: curso.fechaFin
    }));

    res.json(cursosConConteo);
  } catch (error) {
    console.error("Error al obtener cursos del docente:", error);
    res.status(500).json({ msg: "Error al obtener cursos" });
  }
};

// Obtener resumen de calificaciones para múltiples alumnos (para exportación)
export const obtenerResumenExportacion = async (req, res) => {
  try {
    const { cursoId } = req.params;
    const { alumnosIds } = req.body; // Array de IDs de alumnos (opcional)

    const curso = await Curso.findById(cursoId)
      .populate("alumnos", "nombre email legajo")
      .populate("docente", "nombre email");

    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Verificar permisos
    if (req.usuario.rol === "docente" && 
        curso.docente._id.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes acceso a este curso" });
    }

    // Filtrar alumnos si se especificaron IDs
    let alumnosFiltrados = curso.alumnos;
    if (alumnosIds && alumnosIds.length > 0) {
      alumnosFiltrados = curso.alumnos.filter(a => 
        alumnosIds.includes(a._id.toString())
      );
    }

    // Obtener exámenes y tareas
    const examenes = await Examen.find({ 
      curso: cursoId,
      estado: { $in: ["publicado", "cerrado"] }
    }).select("titulo puntajeTotal intentos");

    const tareas = await Tarea.find({ 
      curso: cursoId,
      publicada: true 
    }).select("titulo puntajeMaximo");

    const tareasIds = tareas.map(t => t._id);
    const entregas = await Entrega.find({
      tarea: { $in: tareasIds }
    }).select("tarea alumno calificacion estado");

    // Construir datos para exportación
    const datosExportacion = alumnosFiltrados.map(alumno => {
      const fila = {
        nombre: alumno.nombre,
        email: alumno.email,
        legajo: alumno.legajo || "N/A"
      };

      // Agregar calificaciones de exámenes
      let sumaExamenes = 0;
      let conteoExamenes = 0;

      examenes.forEach(examen => {
        const intentosAlumno = examen.intentos.filter(
          i => i.alumno.toString() === alumno._id.toString() && 
               i.estado === "calificado"
        );
        
        const mejorIntento = intentosAlumno.reduce((mejor, actual) => {
          if (!mejor) return actual;
          return parseFloat(actual.porcentaje) > parseFloat(mejor.porcentaje) ? actual : mejor;
        }, null);

        const nota = mejorIntento ? parseFloat(mejorIntento.porcentaje) : null;
        fila[`examen_${examen._id}`] = nota;
        
        if (nota !== null) {
          sumaExamenes += nota;
          conteoExamenes++;
        }
      });

      // Agregar calificaciones de tareas
      let sumaTareas = 0;
      let conteoTareas = 0;

      tareas.forEach(tarea => {
        const entrega = entregas.find(
          e => e.tarea.toString() === tarea._id.toString() && 
               e.alumno.toString() === alumno._id.toString()
        );

        const nota = entrega?.calificacion != null 
          ? ((entrega.calificacion / tarea.puntajeMaximo) * 100)
          : null;
        fila[`tarea_${tarea._id}`] = nota;

        if (nota !== null) {
          sumaTareas += nota;
          conteoTareas++;
        }
      });

      // Agregar promedios
      fila.promedioExamenes = conteoExamenes > 0 
        ? (sumaExamenes / conteoExamenes).toFixed(2) 
        : null;
      fila.promedioTareas = conteoTareas > 0 
        ? (sumaTareas / conteoTareas).toFixed(2) 
        : null;
      fila.promedioGeneral = (conteoExamenes > 0 || conteoTareas > 0)
        ? (((parseFloat(fila.promedioExamenes) || 0) + (parseFloat(fila.promedioTareas) || 0)) / 
           ((fila.promedioExamenes ? 1 : 0) + (fila.promedioTareas ? 1 : 0))).toFixed(2)
        : null;

      return fila;
    });

    res.json({
      curso: {
        _id: curso._id,
        titulo: curso.titulo,
        codigo: curso.codigo,
        docente: curso.docente.nombre
      },
      columnas: {
        examenes: examenes.map(e => ({ id: e._id, titulo: e.titulo })),
        tareas: tareas.map(t => ({ id: t._id, titulo: t.titulo }))
      },
      datos: datosExportacion,
      fechaGeneracion: new Date()
    });
  } catch (error) {
    console.error("Error al obtener resumen para exportación:", error);
    res.status(500).json({ msg: "Error al generar resumen" });
  }
};