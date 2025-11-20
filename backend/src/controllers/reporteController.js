// backend/src/controllers/reporteController.js
import Curso from "../models/Curso.js";
import Usuario from "../models/Usuario.js";
import Tarea from "../models/Tarea.js";
import Entrega from "../models/Entrega.js";
import Examen from "../models/Examen.js";
import Clase from "../models/Clase.js";
import Inscripcion from "../models/Inscripcion.js";

// Obtener estadísticas generales (para docentes y admin)
export const obtenerEstadisticasGenerales = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;
    const rol = req.usuario.rol;

    let estadisticas = {};

    if (rol === "admin") {
      // Estadísticas globales para admin
      estadisticas = {
        totalCursos: await Curso.countDocuments(),
        totalAlumnos: await Usuario.countDocuments({ rol: "alumno" }),
        totalDocentes: await Usuario.countDocuments({ rol: "docente" }),
        tareasPendientes: await Tarea.countDocuments({
          fechaCierre: { $gte: new Date() }
        }),
        examenesEsteMes: await Examen.countDocuments({
          fechaApertura: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            $lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
          }
        })
      };
    } else if (rol === "docente") {
      // Estadísticas para docente
      const cursosDocente = await Curso.find({ docente: usuarioId });
      const cursosIds = cursosDocente.map(c => c._id);

      const totalAlumnos = cursosDocente.reduce((sum, c) => sum + c.alumnos.length, 0);

      estadisticas = {
        totalCursos: cursosDocente.length,
        totalAlumnos,
        tareasPendientes: await Tarea.countDocuments({
          docente: usuarioId,
          fechaCierre: { $gte: new Date() }
        }),
        examenesEsteMes: await Examen.countDocuments({
          docente: usuarioId,
          fechaApertura: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            $lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
          }
        })
      };
    } else {
      // Estadísticas para alumno
      const inscripciones = await Inscripcion.find({
        alumno: usuarioId,
        estado: "aprobada"
      });
      const cursosIds = inscripciones.map(i => i.curso);

      const tareas = await Tarea.find({
        curso: { $in: cursosIds },
        fechaCierre: { $gte: new Date() }
      });

      const entregasPendientes = await Promise.all(
        tareas.map(async (tarea) => {
          const entrega = await Entrega.findOne({
            tarea: tarea._id,
            alumno: usuarioId
          });
          return !entrega || entrega.estado === "pendiente";
        })
      );

      estadisticas = {
        totalCursos: cursosIds.length,
        tareasPendientes: entregasPendientes.filter(Boolean).length,
        tareasEntregadas: await Entrega.countDocuments({
          alumno: usuarioId,
          estado: { $in: ["entregada", "calificada"] }
        }),
        promedioGeneral: await calcularPromedioAlumno(usuarioId)
      };
    }

    // Datos para gráficos
    estadisticas.rendimientoPorCurso = await obtenerRendimientoPorCurso(usuarioId, rol);
    estadisticas.distribucionNotas = await obtenerDistribucionNotas(usuarioId, rol);
    estadisticas.evolucionTemporal = await obtenerEvolucionTemporal(usuarioId, rol);

    res.json(estadisticas);
  } catch (error) {
    console.error("Error al obtener estadísticas generales:", error);
    res.status(500).json({ msg: "Error al obtener estadísticas" });
  }
};

// Obtener reporte de un curso específico
export const obtenerReporteCurso = async (req, res) => {
  try {
    const { cursoId } = req.params;

    const curso = await Curso.findById(cursoId)
      .populate("docente", "nombre email")
      .populate("alumnos", "nombre email");

    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Verificar permisos
    if (req.usuario.rol === "docente" && curso.docente._id.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes acceso a este reporte" });
    }

    const tareas = await Tarea.find({ curso: cursoId });
    const examenes = await Examen.find({ curso: cursoId });

    // Estadísticas de alumnos
    const alumnosConEstadisticas = await Promise.all(
      curso.alumnos.map(async (alumno) => {
        const entregas = await Entrega.find({
          alumno: alumno._id,
          tarea: { $in: tareas.map(t => t._id) }
        });

        const calificaciones = entregas.filter(e => e.calificacion !== null && e.calificacion !== undefined);
        const promedio = calificaciones.length > 0
          ? calificaciones.reduce((sum, e) => sum + e.calificacion, 0) / calificaciones.length
          : 0;

        const intentosExamenes = [];
        for (const examen of examenes) {
          const intentos = examen.intentos.filter(
            i => i.alumno.toString() === alumno._id.toString() && i.estado === "calificado"
          );
          intentosExamenes.push(...intentos);
        }

        return {
          _id: alumno._id,
          nombre: alumno.nombre,
          email: alumno.email,
          promedio: promedio.toFixed(2),
          tareasEntregadas: entregas.filter(e => e.estado !== "pendiente").length,
          examenesRealizados: intentosExamenes.length
        };
      })
    );

    // Calcular promedios
    const promedios = alumnosConEstadisticas.map(a => parseFloat(a.promedio)).filter(p => p > 0);
    const promedioGeneral = promedios.length > 0
      ? (promedios.reduce((sum, p) => sum + p, 0) / promedios.length).toFixed(2)
      : 0;

    const reporte = {
      curso: {
        _id: curso._id,
        nombre: curso.titulo,
        docente: curso.docente.nombre,
        fechaInicio: curso.fechaInicio,
        fechaFin: curso.fechaFin
      },
      totalAlumnos: curso.alumnos.length,
      tareasTotal: tareas.length,
      examenesTotal: examenes.length,
      promedioGeneral,
      promedioMasAlto: promedios.length > 0 ? Math.max(...promedios) : 0,
      promedioMasBajo: promedios.length > 0 ? Math.min(...promedios) : 0,
      tasaAprobacion: promedios.length > 0
        ? ((promedios.filter(p => p >= 60).length / promedios.length) * 100).toFixed(1)
        : 0,
      tasaReprobacion: promedios.length > 0
        ? ((promedios.filter(p => p < 60).length / promedios.length) * 100).toFixed(1)
        : 0,
      alumnos: alumnosConEstadisticas,
      distribucionNotas: calcularDistribucionNotas(promedios),
      rendimientoPorEvaluacion: await obtenerRendimientoPorEvaluacion(cursoId),
      evolucionTemporal: await obtenerEvolucionTemporalCurso(cursoId)
    };

    res.json(reporte);
  } catch (error) {
    console.error("Error al obtener reporte de curso:", error);
    res.status(500).json({ msg: "Error al obtener reporte" });
  }
};

// Obtener reporte de un alumno específico
export const obtenerReporteAlumno = async (req, res) => {
  try {
    const { alumnoId } = req.params;

    const alumno = await Usuario.findById(alumnoId);
    if (!alumno || alumno.rol !== "alumno") {
      return res.status(404).json({ msg: "Alumno no encontrado" });
    }

    // Verificar permisos
    if (req.usuario.rol === "alumno" && req.usuario._id.toString() !== alumnoId) {
      return res.status(403).json({ msg: "No tienes acceso a este reporte" });
    }

    const inscripciones = await Inscripcion.find({
      alumno: alumnoId,
      estado: "aprobada"
    }).populate("curso", "titulo");

    const cursosIds = inscripciones.map(i => i.curso._id);

    // Obtener todas las entregas
    const entregas = await Entrega.find({ alumno: alumnoId })
      .populate({
        path: "tarea",
        populate: { path: "curso", select: "titulo" }
      });

    const calificaciones = entregas
      .filter(e => e.calificacion !== null && e.calificacion !== undefined)
      .map(e => ({
        _id: e._id,
        nombre: e.tarea.titulo,
        tipo: "Tarea",
        nota: e.calificacion,
        fecha: e.fechaCalificacion,
        estado: e.calificacion >= 60 ? "aprobado" : "reprobado",
        observaciones: e.comentarioDocente
      }));

    // Obtener intentos de exámenes
    const examenes = await Examen.find({ curso: { $in: cursosIds } });
    const intentosCalificados = [];
    
    for (const examen of examenes) {
      const intentos = examen.intentos.filter(
        i => i.alumno.toString() === alumnoId && i.estado === "calificado"
      );
      intentos.forEach(intento => {
        calificaciones.push({
          _id: intento._id,
          nombre: examen.titulo,
          tipo: "Examen",
          nota: intento.porcentaje,
          fecha: intento.fechaEntrega,
          estado: intento.porcentaje >= examen.configuracion.notaAprobacion ? "aprobado" : "reprobado",
          observaciones: intento.retroalimentacion
        });
      });
    }

    const promedioGeneral = calificaciones.length > 0
      ? (calificaciones.reduce((sum, c) => sum + c.nota, 0) / calificaciones.length).toFixed(2)
      : 0;

    const reporte = {
      alumno: {
        _id: alumno._id,
        nombre: alumno.nombre,
        email: alumno.email
      },
      cursosInscritos: inscripciones.length,
      promedioGeneral,
      evaluacionesAprobadas: calificaciones.filter(c => c.estado === "aprobado").length,
      evaluacionesPendientes: entregas.filter(e => e.estado === "pendiente").length,
      porcentajeAprobadas: calificaciones.length > 0
        ? ((calificaciones.filter(c => c.estado === "aprobado").length / calificaciones.length) * 100).toFixed(1)
        : 0,
      calificaciones,
      rendimientoPorCurso: await obtenerRendimientoAlumnoPorCurso(alumnoId, cursosIds),
      evolucionTemporal: await obtenerEvolucionTemporalAlumno(alumnoId)
    };

    res.json(reporte);
  } catch (error) {
    console.error("Error al obtener reporte de alumno:", error);
    res.status(500).json({ msg: "Error al obtener reporte" });
  }
};

// ========== FUNCIONES AUXILIARES ==========

async function calcularPromedioAlumno(alumnoId) {
  const entregas = await Entrega.find({
    alumno: alumnoId,
    estado: "calificada",
    calificacion: { $exists: true, $ne: null }
  });

  if (entregas.length === 0) return 0;

  const suma = entregas.reduce((sum, e) => sum + e.calificacion, 0);
  return (suma / entregas.length).toFixed(2);
}

async function obtenerRendimientoPorCurso(usuarioId, rol) {
  try {
    let cursos = [];

    if (rol === "docente") {
      cursos = await Curso.find({ docente: usuarioId });
    } else if (rol === "alumno") {
      const inscripciones = await Inscripcion.find({
        alumno: usuarioId,
        estado: "aprobada"
      });
      const cursosIds = inscripciones.map(i => i.curso);
      cursos = await Curso.find({ _id: { $in: cursosIds } });
    } else {
      cursos = await Curso.find().limit(10);
    }

    const rendimiento = await Promise.all(
      cursos.map(async (curso) => {
        const entregas = await Entrega.find({
          tarea: { $in: await Tarea.find({ curso: curso._id }).distinct("_id") },
          estado: "calificada"
        });

        const promedio = entregas.length > 0
          ? entregas.reduce((sum, e) => sum + e.calificacion, 0) / entregas.length
          : 0;

        return {
          nombre: curso.titulo.substring(0, 20),
          promedio: parseFloat(promedio.toFixed(2)),
          cantidad: entregas.length
        };
      })
    );

    return rendimiento.filter(r => r.cantidad > 0);
  } catch (error) {
    console.error("Error en obtenerRendimientoPorCurso:", error);
    return [];
  }
}

function calcularDistribucionNotas(promedios) {
  const rangos = {
    "Excelente (90-100)": 0,
    "Muy Bueno (80-89)": 0,
    "Bueno (70-79)": 0,
    "Regular (60-69)": 0,
    "Insuficiente (0-59)": 0
  };

  promedios.forEach(p => {
    if (p >= 90) rangos["Excelente (90-100)"]++;
    else if (p >= 80) rangos["Muy Bueno (80-89)"]++;
    else if (p >= 70) rangos["Bueno (70-79)"]++;
    else if (p >= 60) rangos["Regular (60-69)"]++;
    else rangos["Insuficiente (0-59)"]++;
  });

  return Object.entries(rangos).map(([nombre, cantidad]) => ({
    nombre,
    valor: cantidad,
    porcentaje: promedios.length > 0 ? ((cantidad / promedios.length) * 100).toFixed(1) : 0
  }));
}

async function obtenerDistribucionNotas(usuarioId, rol) {
  try {
    let entregas = [];

    if (rol === "docente") {
      entregas = await Entrega.find({
        tarea: { $in: await Tarea.find({ docente: usuarioId }).distinct("_id") },
        estado: "calificada"
      });
    } else if (rol === "alumno") {
      entregas = await Entrega.find({
        alumno: usuarioId,
        estado: "calificada"
      });
    } else {
      entregas = await Entrega.find({ estado: "calificada" }).limit(100);
    }

    const promedios = entregas.map(e => e.calificacion);
    return calcularDistribucionNotas(promedios);
  } catch (error) {
    console.error("Error en obtenerDistribucionNotas:", error);
    return [];
  }
}

async function obtenerEvolucionTemporal(usuarioId, rol) {
  // Implementación simplificada - últimos 6 meses
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - i);
    meses.push({
      nombre: fecha.toLocaleDateString("es", { month: "short" }),
      mes: fecha.getMonth(),
      año: fecha.getFullYear()
    });
  }

  const evolucion = await Promise.all(
    meses.map(async (mes) => {
      const inicio = new Date(mes.año, mes.mes, 1);
      const fin = new Date(mes.año, mes.mes + 1, 0);

      let entregas = [];
      if (rol === "alumno") {
        entregas = await Entrega.find({
          alumno: usuarioId,
          estado: "calificada",
          fechaCalificacion: { $gte: inicio, $lte: fin }
        });
      } else {
        entregas = await Entrega.find({
          estado: "calificada",
          fechaCalificacion: { $gte: inicio, $lte: fin }
        }).limit(50);
      }

      const promedio = entregas.length > 0
        ? entregas.reduce((sum, e) => sum + e.calificacion, 0) / entregas.length
        : 0;

      return {
        nombre: mes.nombre,
        promedio: parseFloat(promedio.toFixed(2))
      };
    })
  );

  return evolucion;
}

async function obtenerRendimientoPorEvaluacion(cursoId) {
  const tareas = await Tarea.find({ curso: cursoId }).limit(10);

  const rendimiento = await Promise.all(
    tareas.map(async (tarea) => {
      const entregas = await Entrega.find({
        tarea: tarea._id,
        estado: "calificada"
      });

      const promedio = entregas.length > 0
        ? entregas.reduce((sum, e) => sum + e.calificacion, 0) / entregas.length
        : 0;

      return {
        nombre: tarea.titulo.substring(0, 20),
        promedio: parseFloat(promedio.toFixed(2)),
        cantidad: entregas.length
      };
    })
  );

  return rendimiento;
}

async function obtenerEvolucionTemporalCurso(cursoId) {
  const tareas = await Tarea.find({ curso: cursoId }).sort({ fechaCierre: 1 }).limit(10);

  const evolucion = await Promise.all(
    tareas.map(async (tarea) => {
      const entregas = await Entrega.find({
        tarea: tarea._id,
        estado: "calificada"
      });

      const promedio = entregas.length > 0
        ? entregas.reduce((sum, e) => sum + e.calificacion, 0) / entregas.length
        : 0;

      return {
        nombre: tarea.titulo.substring(0, 15),
        promedio: parseFloat(promedio.toFixed(2))
      };
    })
  );

  return evolucion;
}

async function obtenerRendimientoAlumnoPorCurso(alumnoId, cursosIds) {
  const rendimiento = await Promise.all(
    cursosIds.map(async (cursoId) => {
      const curso = await Curso.findById(cursoId);
      const tareas = await Tarea.find({ curso: cursoId });
      const entregas = await Entrega.find({
        alumno: alumnoId,
        tarea: { $in: tareas.map(t => t._id) },
        estado: "calificada"
      });

      const promedio = entregas.length > 0
        ? entregas.reduce((sum, e) => sum + e.calificacion, 0) / entregas.length
        : 0;

      return {
        nombre: curso.titulo.substring(0, 20),
        promedio: parseFloat(promedio.toFixed(2)),
        cantidad: entregas.length
      };
    })
  );

  return rendimiento.filter(r => r.cantidad > 0);
}

async function obtenerEvolucionTemporalAlumno(alumnoId) {
  const entregas = await Entrega.find({
    alumno: alumnoId,
    estado: "calificada"
  })
    .populate("tarea", "titulo fechaCierre")
    .sort({ fechaCalificacion: 1 })
    .limit(10);

  return entregas.map(e => ({
    nombre: e.tarea.titulo.substring(0, 15),
    promedio: e.calificacion
  }));
}

export default {
  obtenerEstadisticasGenerales,
  obtenerReporteCurso,
  obtenerReporteAlumno
};
