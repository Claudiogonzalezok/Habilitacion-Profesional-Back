// controllers/examenController.js
import Examen from "../models/Examen.js";
import Curso from "../models/Curso.js";

// Crear examen
export const crearExamen = async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      cursoId,
      claseId,
      preguntas,
      configuracion,
      fechaApertura,
      fechaCierre
    } = req.body;

    // Verificar que el curso existe
    const curso = await Curso.findById(cursoId);
    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    // Verificar permisos
    if (req.usuario.rol !== "admin" && curso.docente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para crear exámenes en este curso" });
    }

    // Validar fechas
    if (new Date(fechaApertura) >= new Date(fechaCierre)) {
      return res.status(400).json({ msg: "La fecha de apertura debe ser anterior a la fecha de cierre" });
    }

    const nuevoExamen = new Examen({
      titulo,
      descripcion,
      curso: cursoId,
      clase: claseId,
      docente: req.usuario._id,
      preguntas,
      configuracion,
      fechaApertura,
      fechaCierre
    });

    // Calcular puntaje total
    nuevoExamen.calcularPuntajeTotal();

    await nuevoExamen.save();
    await nuevoExamen.populate("curso", "titulo codigo");

    res.status(201).json({ 
      msg: "Examen creado exitosamente", 
      examen: nuevoExamen 
    });
  } catch (error) {
    console.error("Error al crear examen:", error);
    res.status(500).json({ msg: "Error al crear examen" });
  }
};

// Listar exámenes (filtrado por rol)
export const listarExamenes = async (req, res) => {
  try {
    const { cursoId } = req.query;
    let filtro = {};

    if (cursoId) {
      filtro.curso = cursoId;
    }

    // Filtrar según rol
    if (req.usuario.rol === "docente") {
      filtro.docente = req.usuario._id;
    } else if (req.usuario.rol === "alumno") {
      // Solo exámenes publicados de cursos donde está inscrito
      const cursosAlumno = await Curso.find({ alumnos: req.usuario._id }).select("_id");
      filtro.curso = { $in: cursosAlumno.map(c => c._id) };
      filtro.estado = "publicado";
    }

    const examenes = await Examen.find(filtro)
      .populate("curso", "titulo codigo")
      .populate("docente", "nombre email")
      .sort({ createdAt: -1 });

    // Para alumnos, agregar info de sus intentos
    if (req.usuario.rol === "alumno") {
      const examenesConIntentos = examenes.map(examen => {
        const examenObj = examen.toObject();
        examenObj.misIntentos = examen.intentos.filter(
          i => i.alumno.toString() === req.usuario._id.toString()
        );
        // No enviar las respuestas correctas al alumno
        examenObj.preguntas = examenObj.preguntas.map(p => ({
          _id: p._id,
          tipo: p.tipo,
          pregunta: p.pregunta,
          opciones: p.opciones?.map(o => ({ texto: o.texto, _id: o._id })),
          puntaje: p.puntaje,
          orden: p.orden
        }));
        delete examenObj.intentos;
        return examenObj;
      });
      return res.json(examenesConIntentos);
    }

    res.json(examenes);
  } catch (error) {
    console.error("Error al listar exámenes:", error);
    res.status(500).json({ msg: "Error al listar exámenes" });
  }
};

// Obtener examen por ID
export const obtenerExamen = async (req, res) => {
  try {
    const examen = await Examen.findById(req.params.id)
      .populate("curso", "titulo codigo alumnos")
      .populate("docente", "nombre email")
      .populate("intentos.alumno", "nombre email");

    if (!examen) {
      return res.status(404).json({ msg: "Examen no encontrado" });
    }

    // Verificar acceso
    const curso = await Curso.findById(examen.curso._id);
    
    if (req.usuario.rol === "alumno") {
      const estaInscrito = curso.alumnos.some(
        a => a.toString() === req.usuario._id.toString()
      );
      if (!estaInscrito) {
        return res.status(403).json({ msg: "No tienes acceso a este examen" });
      }
      
      // Solo enviar info necesaria para el alumno
      const examenAlumno = examen.toObject();
      examenAlumno.misIntentos = examen.intentos.filter(
        i => i.alumno._id.toString() === req.usuario._id.toString()
      );
      
      // No enviar respuestas correctas si no ha completado
      const tieneIntentoCalificado = examenAlumno.misIntentos.some(
        i => i.estado === "calificado"
      );
      
      if (!tieneIntentoCalificado || !examen.configuracion.mostrarRespuestas) {
        examenAlumno.preguntas = examenAlumno.preguntas.map(p => ({
          _id: p._id,
          tipo: p.tipo,
          pregunta: p.pregunta,
          opciones: p.opciones?.map(o => ({ texto: o.texto, _id: o._id })),
          puntaje: p.puntaje,
          orden: p.orden
        }));
      }
      
      delete examenAlumno.intentos;
      return res.json(examenAlumno);
    } else if (req.usuario.rol === "docente") {
      if (curso.docente.toString() !== req.usuario._id.toString()) {
        return res.status(403).json({ msg: "No tienes acceso a este examen" });
      }
    }

    res.json(examen);
  } catch (error) {
    console.error("Error al obtener examen:", error);
    res.status(500).json({ msg: "Error al obtener examen" });
  }
};

// Actualizar examen
export const actualizarExamen = async (req, res) => {
  try {
    const examen = await Examen.findById(req.params.id).populate("curso");

    if (!examen) {
      return res.status(404).json({ msg: "Examen no encontrado" });
    }

    // Verificar permisos
    if (req.usuario.rol !== "admin" && examen.docente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para editar este examen" });
    }

    // No permitir editar si ya hay intentos completados
    if (examen.intentos.some(i => i.estado === "completado" || i.estado === "calificado")) {
      return res.status(400).json({ 
        msg: "No se puede editar un examen que ya tiene intentos completados" 
      });
    }

    // Actualizar campos
    Object.assign(examen, req.body);

    // Recalcular puntaje total si se modificaron preguntas
    if (req.body.preguntas) {
      examen.calcularPuntajeTotal();
    }

    await examen.save();
    await examen.populate("curso", "titulo codigo");

    res.json({ msg: "Examen actualizado exitosamente", examen });
  } catch (error) {
    console.error("Error al actualizar examen:", error);
    res.status(500).json({ msg: "Error al actualizar examen" });
  }
};

// Eliminar examen
export const eliminarExamen = async (req, res) => {
  try {
    const examen = await Examen.findById(req.params.id);

    if (!examen) {
      return res.status(404).json({ msg: "Examen no encontrado" });
    }

    // Verificar permisos
    if (req.usuario.rol !== "admin" && examen.docente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para eliminar este examen" });
    }

    await Examen.findByIdAndDelete(req.params.id);

    res.json({ msg: "Examen eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar examen:", error);
    res.status(500).json({ msg: "Error al eliminar examen" });
  }
};

// Iniciar intento de examen (alumno)
export const iniciarIntento = async (req, res) => {
  try {
    const examen = await Examen.findById(req.params.id);

    if (!examen) {
      return res.status(404).json({ msg: "Examen no encontrado" });
    }

    // Verificar si puede realizar el examen
    const verificacion = examen.puedeRealizarExamen(req.usuario._id);
    
    if (!verificacion.puede) {
      return res.status(400).json({ msg: verificacion.razon });
    }

    // Si ya tiene un intento en progreso, devolverlo
    if (verificacion.intentoActual) {
      return res.json({ 
        msg: "Ya tienes un intento en progreso",
        intentoId: verificacion.intentoActual 
      });
    }

    // Crear nuevo intento
    const intentosAnteriores = examen.intentos.filter(
      i => i.alumno.toString() === req.usuario._id.toString()
    ).length;

    const nuevoIntento = {
      alumno: req.usuario._id,
      respuestas: examen.preguntas.map(p => ({
        pregunta: p._id,
        respuesta: null,
        esCorrecta: null,
        puntajeObtenido: 0
      })),
      estado: "en_progreso",
      intentoNumero: intentosAnteriores + 1,
      fechaInicio: new Date()
    };

    examen.intentos.push(nuevoIntento);
    await examen.save();

    const intentoCreado = examen.intentos[examen.intentos.length - 1];

    res.json({ 
      msg: "Intento iniciado correctamente",
      intentoId: intentoCreado._id,
      duracionMinutos: examen.configuracion.duracionMinutos
    });
  } catch (error) {
    console.error("Error al iniciar intento:", error);
    res.status(500).json({ msg: "Error al iniciar intento" });
  }
};

// Enviar respuestas del examen (alumno)
export const enviarRespuestas = async (req, res) => {
  try {
    const { intentoId, respuestas } = req.body;

    const examen = await Examen.findById(req.params.id);
    if (!examen) {
      return res.status(404).json({ msg: "Examen no encontrado" });
    }

    const intento = examen.intentos.id(intentoId);
    if (!intento) {
      return res.status(404).json({ msg: "Intento no encontrado" });
    }

    // Verificar que el intento pertenece al alumno
    if (intento.alumno.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes acceso a este intento" });
    }

    // Verificar que el intento está en progreso
    if (intento.estado !== "en_progreso") {
      return res.status(400).json({ msg: "Este intento ya fue completado" });
    }

    // Calcular tiempo transcurrido
    const tiempoTranscurrido = Math.round((new Date() - intento.fechaInicio) / 60000);
    intento.tiempoTranscurrido = tiempoTranscurrido;
    intento.fechaEntrega = new Date();

    let puntuacionTotal = 0;

    // Calificar respuestas
    respuestas.forEach(resp => {
      const pregunta = examen.preguntas.id(resp.preguntaId);
      if (!pregunta) return;

      const respuestaIntento = intento.respuestas.find(
        r => r.pregunta.toString() === resp.preguntaId
      );
      if (!respuestaIntento) return;

      respuestaIntento.respuesta = resp.respuesta;

      // Calificar automáticamente según tipo
      if (pregunta.tipo === "multiple") {
        const opcionCorrecta = pregunta.opciones.find(o => o.esCorrecta);
        respuestaIntento.esCorrecta = resp.respuesta === opcionCorrecta._id.toString();
        respuestaIntento.puntajeObtenido = respuestaIntento.esCorrecta ? pregunta.puntaje : 0;
      } else if (pregunta.tipo === "verdadero_falso") {
        respuestaIntento.esCorrecta = resp.respuesta.toLowerCase() === pregunta.respuestaCorrecta.toLowerCase();
        respuestaIntento.puntajeObtenido = respuestaIntento.esCorrecta ? pregunta.puntaje : 0;
      } else {
        // Preguntas de desarrollo o cortas requieren calificación manual
        respuestaIntento.esCorrecta = null;
        respuestaIntento.puntajeObtenido = 0;
      }

      puntuacionTotal += respuestaIntento.puntajeObtenido;
    });

    intento.puntuacionTotal = puntuacionTotal;
    intento.porcentaje = ((puntuacionTotal / examen.puntajeTotal) * 100).toFixed(2);

    // Determinar si necesita calificación manual
    const necesitaCalificacionManual = examen.preguntas.some(
      p => p.tipo === "corta" || p.tipo === "desarrollo"
    );

    intento.estado = necesitaCalificacionManual ? "completado" : "calificado";

    // Actualizar estadísticas
    examen.actualizarEstadisticas();

    await examen.save();

    res.json({ 
      msg: intento.estado === "calificado" 
        ? "Examen completado y calificado" 
        : "Examen enviado, pendiente de calificación",
      puntuacionTotal: intento.puntuacionTotal,
      porcentaje: intento.porcentaje,
      estado: intento.estado
    });
  } catch (error) {
    console.error("Error al enviar respuestas:", error);
    res.status(500).json({ msg: "Error al enviar respuestas" });
  }
};

// Calificar respuestas manualmente (docente)
export const calificarManualmente = async (req, res) => {
  try {
    const { intentoId, calificaciones } = req.body;

    const examen = await Examen.findById(req.params.id);
    if (!examen) {
      return res.status(404).json({ msg: "Examen no encontrado" });
    }

    // Verificar permisos
    if (req.usuario.rol !== "admin" && examen.docente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para calificar este examen" });
    }

    const intento = examen.intentos.id(intentoId);
    if (!intento) {
      return res.status(404).json({ msg: "Intento no encontrado" });
    }

    let puntuacionTotal = 0;

    // Aplicar calificaciones manuales
    calificaciones.forEach(cal => {
      const respuesta = intento.respuestas.find(
        r => r.pregunta.toString() === cal.preguntaId
      );
      if (respuesta) {
        respuesta.puntajeObtenido = cal.puntaje;
        respuesta.comentarioDocente = cal.comentario;
        puntuacionTotal += cal.puntaje;
      }
    });

    // Sumar puntajes ya calificados automáticamente
    intento.respuestas.forEach(r => {
      if (!calificaciones.find(c => c.preguntaId === r.pregunta.toString())) {
        puntuacionTotal += r.puntajeObtenido;
      }
    });

    intento.puntuacionTotal = puntuacionTotal;
    intento.porcentaje = ((puntuacionTotal / examen.puntajeTotal) * 100).toFixed(2);
    intento.estado = "calificado";
    intento.retroalimentacion = req.body.retroalimentacion;

    // Actualizar estadísticas
    examen.actualizarEstadisticas();

    await examen.save();

    res.json({ 
      msg: "Calificación guardada exitosamente",
      puntuacionTotal: intento.puntuacionTotal,
      porcentaje: intento.porcentaje
    });
  } catch (error) {
    console.error("Error al calificar manualmente:", error);
    res.status(500).json({ msg: "Error al calificar" });
  }
};

// Obtener estadísticas del examen (docente)
export const obtenerEstadisticas = async (req, res) => {
  try {
    const examen = await Examen.findById(req.params.id)
      .populate("intentos.alumno", "nombre email");

    if (!examen) {
      return res.status(404).json({ msg: "Examen no encontrado" });
    }

    // Verificar permisos
    if (req.usuario.rol !== "admin" && examen.docente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para ver estas estadísticas" });
    }

    const intentosCalificados = examen.intentos.filter(i => i.estado === "calificado");

    const estadisticas = {
      totalIntentos: examen.intentos.length,
      intentosEnProgreso: examen.intentos.filter(i => i.estado === "en_progreso").length,
      intentosPendientes: examen.intentos.filter(i => i.estado === "completado").length,
      intentosCalificados: intentosCalificados.length,
      promedioGeneral: examen.estadisticas.promedioGeneral,
      alumnosAprobados: examen.estadisticas.alumnosAprobados,
      alumnosReprobados: examen.estadisticas.alumnosReprobados,
      mejorNota: intentosCalificados.length > 0 
        ? Math.max(...intentosCalificados.map(i => i.porcentaje))
        : 0,
      peorNota: intentosCalificados.length > 0 
        ? Math.min(...intentosCalificados.map(i => i.porcentaje))
        : 0,
      intentosDetalle: intentosCalificados.map(i => ({
        alumno: i.alumno,
        puntuacion: i.puntuacionTotal,
        porcentaje: i.porcentaje,
        fechaEntrega: i.fechaEntrega,
        tiempoTranscurrido: i.tiempoTranscurrido,
        intentoNumero: i.intentoNumero
      }))
    };

    res.json(estadisticas);
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ msg: "Error al obtener estadísticas" });
  }
};