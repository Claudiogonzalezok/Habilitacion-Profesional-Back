// controllers/notasAlumnoController.js
import Curso from "../models/Curso.js";
import Examen from "../models/Examen.js";
import Tarea from "../models/Tarea.js";
import Entrega from "../models/Entrega.js";

// Obtener resumen de notas del alumno (para el dashboard)
export const obtenerResumenNotas = async (req, res) => {
  try {
    const alumnoId = req.usuario._id;

    // Obtener cursos donde está inscrito el alumno
    const cursos = await Curso.find({ alumnos: alumnoId })
      .select("titulo codigo estado")
      .populate("docente", "nombre");

    if (cursos.length === 0) {
      return res.json({
        cursos: [],
        estadisticasGenerales: {
          promedioGeneral: null,
          cursosInscritos: 0,
          tareasCompletadas: 0,
          tareasPendientes: 0,
          examenesRealizados: 0,
          examenesPendientes: 0
        },
        proximasEntregas: []
      });
    }

    const cursosIds = cursos.map(c => c._id);

    // Obtener exámenes de los cursos del alumno
    const examenes = await Examen.find({
      curso: { $in: cursosIds },
      estado: "publicado"
    }).select("titulo curso puntajeTotal intentos fechaCierre configuracion");

    // Obtener tareas de los cursos del alumno
    const tareas = await Tarea.find({
      curso: { $in: cursosIds },
      publicada: true
    }).select("titulo curso puntajeMaximo fechaCierre");

    // Obtener entregas del alumno
    const tareasIds = tareas.map(t => t._id);
    const entregas = await Entrega.find({
      tarea: { $in: tareasIds },
      alumno: alumnoId
    });

    // Calcular estadísticas
    let sumaNotas = 0;
    let conteoNotas = 0;
    let tareasCompletadas = 0;
    let tareasPendientes = 0;
    let examenesRealizados = 0;
    let examenesPendientes = 0;

    // Procesar exámenes
    examenes.forEach(examen => {
      const intentosAlumno = examen.intentos.filter(
        i => i.alumno.toString() === alumnoId.toString() &&
             (i.estado === "calificado" || i.estado === "completado")
      );

      if (intentosAlumno.length > 0) {
        examenesRealizados++;
        const mejorIntento = intentosAlumno.reduce((mejor, actual) => {
          if (!mejor) return actual;
          return parseFloat(actual.porcentaje) > parseFloat(mejor.porcentaje) ? actual : mejor;
        }, null);
        
        if (mejorIntento && mejorIntento.porcentaje) {
          sumaNotas += parseFloat(mejorIntento.porcentaje);
          conteoNotas++;
        }
      } else if (new Date(examen.fechaCierre) > new Date()) {
        examenesPendientes++;
      }
    });

    // Procesar tareas
    tareas.forEach(tarea => {
      const entrega = entregas.find(e => e.tarea.toString() === tarea._id.toString());
      
      if (entrega && entrega.estado === "calificada") {
        tareasCompletadas++;
        if (entrega.calificacion != null) {
          const porcentaje = (entrega.calificacion / tarea.puntajeMaximo) * 100;
          sumaNotas += porcentaje;
          conteoNotas++;
        }
      } else if (entrega && entrega.estado === "entregada") {
        tareasCompletadas++;
      } else if (new Date(tarea.fechaCierre) > new Date()) {
        tareasPendientes++;
      }
    });

    // Obtener próximas entregas (tareas y exámenes)
    const ahora = new Date();
    const enUnaSemana = new Date();
    enUnaSemana.setDate(enUnaSemana.getDate() + 7);

    const proximasTareas = tareas
      .filter(t => {
        const entrega = entregas.find(e => e.tarea.toString() === t._id.toString());
        return new Date(t.fechaCierre) > ahora && 
               new Date(t.fechaCierre) <= enUnaSemana &&
               (!entrega || entrega.estado === "pendiente");
      })
      .map(t => {
        const curso = cursos.find(c => c._id.toString() === t.curso.toString());
        return {
          tipo: "tarea",
          titulo: t.titulo,
          curso: curso?.titulo || "Curso",
          fechaLimite: t.fechaCierre
        };
      });

    const proximosExamenes = examenes
      .filter(e => {
        const intentos = e.intentos.filter(i => i.alumno.toString() === alumnoId.toString());
        return new Date(e.fechaCierre) > ahora && 
               new Date(e.fechaCierre) <= enUnaSemana &&
               intentos.length < e.configuracion.intentosPermitidos;
      })
      .map(e => {
        const curso = cursos.find(c => c._id.toString() === e.curso.toString());
        return {
          tipo: "examen",
          titulo: e.titulo,
          curso: curso?.titulo || "Curso",
          fechaLimite: e.fechaCierre
        };
      });

    const proximasEntregas = [...proximasTareas, ...proximosExamenes]
      .sort((a, b) => new Date(a.fechaLimite) - new Date(b.fechaLimite))
      .slice(0, 5);

    // Calcular promedio por curso para el resumen
    const resumenCursos = await Promise.all(cursos.map(async (curso) => {
      const examenesCurso = examenes.filter(e => e.curso.toString() === curso._id.toString());
      const tareasCurso = tareas.filter(t => t.curso.toString() === curso._id.toString());
      
      let sumaCurso = 0;
      let conteoCurso = 0;

      examenesCurso.forEach(examen => {
        const intentos = examen.intentos.filter(
          i => i.alumno.toString() === alumnoId.toString() && i.estado === "calificado"
        );
        if (intentos.length > 0) {
          const mejor = Math.max(...intentos.map(i => parseFloat(i.porcentaje)));
          sumaCurso += mejor;
          conteoCurso++;
        }
      });

      tareasCurso.forEach(tarea => {
        const entrega = entregas.find(
          e => e.tarea.toString() === tarea._id.toString() && e.calificacion != null
        );
        if (entrega) {
          sumaCurso += (entrega.calificacion / tarea.puntajeMaximo) * 100;
          conteoCurso++;
        }
      });

      return {
        _id: curso._id,
        titulo: curso.titulo,
        codigo: curso.codigo,
        docente: curso.docente?.nombre || "Sin asignar",
        promedio: conteoCurso > 0 ? (sumaCurso / conteoCurso).toFixed(1) : null,
        totalActividades: examenesCurso.length + tareasCurso.length,
        actividadesCompletadas: conteoCurso
      };
    }));

    res.json({
      cursos: resumenCursos,
      estadisticasGenerales: {
        promedioGeneral: conteoNotas > 0 ? (sumaNotas / conteoNotas).toFixed(1) : null,
        cursosInscritos: cursos.length,
        tareasCompletadas,
        tareasPendientes,
        examenesRealizados,
        examenesPendientes
      },
      proximasEntregas
    });
  } catch (error) {
    console.error("Error al obtener resumen de notas:", error);
    res.status(500).json({ msg: "Error al obtener resumen de notas" });
  }
};

// Obtener notas detalladas de un curso específico
export const obtenerNotasCurso = async (req, res) => {
  try {
    const alumnoId = req.usuario._id;
    const { cursoId } = req.params;

    // Verificar que el alumno está inscrito en el curso
    const curso = await Curso.findById(cursoId)
      .populate("docente", "nombre email");

    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    const estaInscrito = curso.alumnos.some(
      a => a.toString() === alumnoId.toString()
    );

    if (!estaInscrito) {
      return res.status(403).json({ msg: "No estás inscrito en este curso" });
    }

    // Obtener exámenes del curso
    const examenes = await Examen.find({
      curso: cursoId,
      estado: { $in: ["publicado", "cerrado"] }
    }).select("titulo descripcion puntajeTotal intentos fechaApertura fechaCierre configuracion");

    // Obtener tareas del curso
    const tareas = await Tarea.find({
      curso: cursoId,
      publicada: true
    }).select("titulo descripcion puntajeMaximo fechaApertura fechaCierre");

    // Obtener entregas del alumno
    const tareasIds = tareas.map(t => t._id);
    const entregas = await Entrega.find({
      tarea: { $in: tareasIds },
      alumno: alumnoId
    });

    // Procesar exámenes
    const calificacionesExamenes = examenes.map(examen => {
      const intentosAlumno = examen.intentos.filter(
        i => i.alumno.toString() === alumnoId.toString()
      );

      const intentosInfo = intentosAlumno.map(i => ({
        intentoNumero: i.intentoNumero,
        puntaje: i.puntuacionTotal,
        porcentaje: parseFloat(i.porcentaje),
        estado: i.estado,
        fecha: i.fechaEntrega || i.fechaInicio,
        tiempoUsado: i.tiempoTranscurrido,
        retroalimentacion: i.retroalimentacion
      }));

      const mejorNota = intentosAlumno.length > 0
        ? Math.max(...intentosAlumno.filter(i => i.estado === "calificado").map(i => parseFloat(i.porcentaje) || 0))
        : null;

      const puedeIntentar = intentosAlumno.length < examen.configuracion.intentosPermitidos &&
                           new Date() <= new Date(examen.fechaCierre) &&
                           new Date() >= new Date(examen.fechaApertura);

      return {
        _id: examen._id,
        tipo: "examen",
        titulo: examen.titulo,
        descripcion: examen.descripcion,
        puntajeMaximo: examen.puntajeTotal,
        fechaApertura: examen.fechaApertura,
        fechaCierre: examen.fechaCierre,
        intentosPermitidos: examen.configuracion.intentosPermitidos,
        intentosUsados: intentosAlumno.length,
        intentos: intentosInfo,
        mejorNota,
        estado: intentosAlumno.length === 0 
          ? "pendiente" 
          : intentosAlumno.some(i => i.estado === "calificado") 
            ? "calificado" 
            : "en_revision",
        puedeIntentar
      };
    });

    // Procesar tareas
    const calificacionesTareas = tareas.map(tarea => {
      const entrega = entregas.find(e => e.tarea.toString() === tarea._id.toString());

      const puedeEntregar = new Date() <= new Date(tarea.fechaCierre) &&
                           new Date() >= new Date(tarea.fechaApertura) &&
                           (!entrega || entrega.estado === "pendiente");

      return {
        _id: tarea._id,
        tipo: "tarea",
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        puntajeMaximo: tarea.puntajeMaximo,
        fechaApertura: tarea.fechaApertura,
        fechaCierre: tarea.fechaCierre,
        entrega: entrega ? {
          estado: entrega.estado,
          fechaEntrega: entrega.fechaEntrega,
          calificacion: entrega.calificacion,
          porcentaje: entrega.calificacion != null 
            ? ((entrega.calificacion / tarea.puntajeMaximo) * 100).toFixed(1)
            : null,
          comentarios: entrega.comentarios,
          entregadaTarde: entrega.entregadaTarde
        } : null,
        estado: !entrega 
          ? "pendiente" 
          : entrega.estado === "calificada" 
            ? "calificado" 
            : entrega.estado,
        puedeEntregar
      };
    });

    // Calcular estadísticas del curso
    const actividadesCalificadas = [
      ...calificacionesExamenes.filter(e => e.mejorNota !== null),
      ...calificacionesTareas.filter(t => t.entrega?.calificacion != null)
    ];

    const promedioCurso = actividadesCalificadas.length > 0
      ? (actividadesCalificadas.reduce((sum, a) => {
          if (a.tipo === "examen") return sum + a.mejorNota;
          return sum + parseFloat(a.entrega.porcentaje);
        }, 0) / actividadesCalificadas.length).toFixed(1)
      : null;

    res.json({
      curso: {
        _id: curso._id,
        titulo: curso.titulo,
        codigo: curso.codigo,
        docente: curso.docente
      },
      examenes: calificacionesExamenes,
      tareas: calificacionesTareas,
      estadisticas: {
        promedioCurso,
        totalExamenes: examenes.length,
        examenesCompletados: calificacionesExamenes.filter(e => e.estado === "calificado").length,
        totalTareas: tareas.length,
        tareasEntregadas: calificacionesTareas.filter(t => t.estado !== "pendiente").length,
        tareasCalificadas: calificacionesTareas.filter(t => t.estado === "calificado").length
      }
    });
  } catch (error) {
    console.error("Error al obtener notas del curso:", error);
    res.status(500).json({ msg: "Error al obtener notas del curso" });
  }
};

// Obtener todas las notas del alumno (vista completa)
export const obtenerTodasLasNotas = async (req, res) => {
  try {
    const alumnoId = req.usuario._id;

    // Obtener cursos del alumno
    const cursos = await Curso.find({ alumnos: alumnoId })
      .populate("docente", "nombre");

    if (cursos.length === 0) {
      return res.json({ cursos: [] });
    }

    const cursosIds = cursos.map(c => c._id);

    // Obtener todos los exámenes
    const examenes = await Examen.find({
      curso: { $in: cursosIds },
      estado: { $in: ["publicado", "cerrado"] }
    });

    // Obtener todas las tareas
    const tareas = await Tarea.find({
      curso: { $in: cursosIds },
      publicada: true
    });

    // Obtener entregas
    const tareasIds = tareas.map(t => t._id);
    const entregas = await Entrega.find({
      tarea: { $in: tareasIds },
      alumno: alumnoId
    });

    // Construir respuesta por curso
    const cursosConNotas = cursos.map(curso => {
      const examenesCurso = examenes.filter(e => e.curso.toString() === curso._id.toString());
      const tareasCurso = tareas.filter(t => t.curso.toString() === curso._id.toString());

      let sumaNotas = 0;
      let conteoNotas = 0;

      const notasExamenes = examenesCurso.map(examen => {
        const intentos = examen.intentos.filter(
          i => i.alumno.toString() === alumnoId.toString() && i.estado === "calificado"
        );
        
        const mejorNota = intentos.length > 0
          ? Math.max(...intentos.map(i => parseFloat(i.porcentaje)))
          : null;

        if (mejorNota !== null) {
          sumaNotas += mejorNota;
          conteoNotas++;
        }

        return {
          _id: examen._id,
          titulo: examen.titulo,
          tipo: "examen",
          puntajeMaximo: examen.puntajeTotal,
          nota: mejorNota,
          estado: intentos.length > 0 ? "calificado" : "pendiente",
          fechaCierre: examen.fechaCierre
        };
      });

      const notasTareas = tareasCurso.map(tarea => {
        const entrega = entregas.find(e => e.tarea.toString() === tarea._id.toString());
        
        const nota = entrega?.calificacion != null
          ? ((entrega.calificacion / tarea.puntajeMaximo) * 100)
          : null;

        if (nota !== null) {
          sumaNotas += nota;
          conteoNotas++;
        }

        return {
          _id: tarea._id,
          titulo: tarea.titulo,
          tipo: "tarea",
          puntajeMaximo: tarea.puntajeMaximo,
          nota: nota ? parseFloat(nota.toFixed(1)) : null,
          estado: entrega?.estado || "pendiente",
          fechaCierre: tarea.fechaCierre
        };
      });

      return {
        _id: curso._id,
        titulo: curso.titulo,
        codigo: curso.codigo,
        docente: curso.docente?.nombre,
        promedio: conteoNotas > 0 ? (sumaNotas / conteoNotas).toFixed(1) : null,
        actividades: [...notasExamenes, ...notasTareas].sort(
          (a, b) => new Date(b.fechaCierre) - new Date(a.fechaCierre)
        )
      };
    });

    res.json({ cursos: cursosConNotas });
  } catch (error) {
    console.error("Error al obtener todas las notas:", error);
    res.status(500).json({ msg: "Error al obtener notas" });
  }
};