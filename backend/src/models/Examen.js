// backend/src/models/Examen.js
import mongoose from "mongoose";

const preguntaSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ["multiple", "verdadero_falso", "corta", "desarrollo"],
    required: true
  },
  pregunta: {
    type: String,
    required: true,
    trim: true
  },
  opciones: [{
    texto: String,
    esCorrecta: Boolean
  }],
  respuestaCorrecta: String,
  puntaje: {
    type: Number,
    required: true,
    min: 0
  },
  orden: {
    type: Number,
    default: 0
  }
});

const intentoSchema = new mongoose.Schema({
  alumno: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true
  },
  respuestas: [{
    pregunta: {
      type: mongoose.Schema.Types.ObjectId
    },
    respuesta: mongoose.Schema.Types.Mixed,
    esCorrecta: Boolean,
    puntajeObtenido: {
      type: Number,
      default: 0
    },
    comentarioDocente: String
  }],
  puntuacionTotal: {
    type: Number,
    default: 0
  },
  porcentaje: {
    type: Number,
    default: 0
  },
  estado: {
    type: String,
    enum: ["en_progreso", "completado", "calificado"],
    default: "en_progreso"
  },
  fechaInicio: {
    type: Date,
    default: Date.now
  },
  fechaEntrega: Date,
  tiempoTranscurrido: Number,
  intentoNumero: {
    type: Number,
    default: 1
  },
  retroalimentacion: String
}, {
  timestamps: true
});

const examenSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  curso: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Curso",
    required: true
  },
  clase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Clase"
  },
  docente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true
  },
  preguntas: [preguntaSchema],
  configuracion: {
    duracionMinutos: {
      type: Number,
      default: 60
    },
    intentosPermitidos: {
      type: Number,
      default: 1,
      min: 1
    },
    mostrarRespuestas: {
      type: Boolean,
      default: true
    },
    mezclarPreguntas: {
      type: Boolean,
      default: false
    },
    mezclarOpciones: {
      type: Boolean,
      default: false
    },
    notaAprobacion: {
      type: Number,
      default: 60,
      min: 0,
      max: 100
    }
  },
  fechaApertura: {
    type: Date,
    required: true
  },
  fechaCierre: {
    type: Date,
    required: true
  },
  puntajeTotal: {
    type: Number,
    default: 0
  },
  estado: {
    type: String,
    enum: ["borrador", "publicado", "cerrado"],
    default: "borrador"
  },
  intentos: [intentoSchema],
  estadisticas: {
    totalIntentos: {
      type: Number,
      default: 0
    },
    promedioGeneral: {
      type: Number,
      default: 0
    },
    alumnosAprobados: {
      type: Number,
      default: 0
    },
    alumnosReprobados: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Índices
examenSchema.index({ curso: 1, estado: 1 });
examenSchema.index({ docente: 1 });
examenSchema.index({ "intentos.alumno": 1 });
examenSchema.index({ fechaApertura: 1, fechaCierre: 1 }); // Nuevo índice para consultas por fecha

// =============================================
// VIRTUAL: Estado calculado en tiempo real
// =============================================
examenSchema.virtual("estadoCalculado").get(function () {
  // Si está en borrador, mantener borrador (requiere publicación manual)
  if (this.estado === "borrador") {
    return "borrador";
  }

  const ahora = new Date();
  const apertura = new Date(this.fechaApertura);
  const cierre = new Date(this.fechaCierre);

  // Si ya pasó la fecha de cierre → cerrado
  if (ahora > cierre) {
    return "cerrado";
  }

  // Si está dentro del período y está publicado → publicado (disponible)
  if (ahora >= apertura && ahora <= cierre && this.estado === "publicado") {
    return "publicado";
  }

  // Si aún no abre pero está publicado → publicado (próximamente)
  if (ahora < apertura && this.estado === "publicado") {
    return "publicado";
  }

  return this.estado;
});

// =============================================
// VIRTUAL: Información de disponibilidad
// =============================================
examenSchema.virtual("disponibilidad").get(function () {
  const ahora = new Date();
  const apertura = new Date(this.fechaApertura);
  const cierre = new Date(this.fechaCierre);

  if (this.estado === "borrador") {
    return { disponible: false, razon: "El examen está en borrador" };
  }

  if (ahora < apertura) {
    const diffMs = apertura - ahora;
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHoras = Math.ceil(diffMs / (1000 * 60 * 60));
    
    return {
      disponible: false,
      razon: "Aún no disponible",
      abreEn: diffDias > 1 ? `${diffDias} días` : `${diffHoras} horas`,
      fechaApertura: apertura
    };
  }

  if (ahora > cierre) {
    return { disponible: false, razon: "El examen ya cerró", vencido: true };
  }

  // Está disponible
  const diffMs = cierre - ahora;
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHoras = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return {
    disponible: true,
    cierraEn: diffDias > 0 ? `${diffDias} días y ${diffHoras} horas` : `${diffHoras} horas`,
    fechaCierre: cierre
  };
});

// =============================================
// MÉTODO: Sincronizar estado de un examen
// =============================================
examenSchema.methods.sincronizarEstado = function () {
  const estadoAnterior = this.estado;
  const nuevoEstado = this.estadoCalculado;

  // Solo actualizar si cambió y no es borrador
  if (estadoAnterior !== nuevoEstado && estadoAnterior !== "borrador") {
    this.estado = nuevoEstado;
    return true; // Indica que hubo cambio
  }

  return false;
};

// =============================================
// MÉTODO ESTÁTICO: Actualizar estados de todos los exámenes
// =============================================
examenSchema.statics.actualizarEstados = async function () {
  const ahora = new Date();
  
  // Cerrar exámenes publicados cuya fecha de cierre ya pasó
  const resultado = await this.updateMany(
    {
      estado: "publicado",
      fechaCierre: { $lt: ahora }
    },
    {
      $set: { estado: "cerrado" }
    }
  );

  return resultado.modifiedCount;
};

// =============================================
// MÉTODO ESTÁTICO: Obtener exámenes próximos a cerrar
// =============================================
examenSchema.statics.obtenerProximosACerrar = async function (horasAntes = 24) {
  const ahora = new Date();
  const limite = new Date(ahora.getTime() + horasAntes * 60 * 60 * 1000);

  return await this.find({
    estado: "publicado",
    fechaCierre: {
      $gte: ahora,
      $lte: limite
    }
  }).populate("curso", "titulo codigo alumnos");
};

// =============================================
// MÉTODO ESTÁTICO: Obtener exámenes próximos a abrir
// =============================================
examenSchema.statics.obtenerProximosAAbrir = async function (horasAntes = 24) {
  const ahora = new Date();
  const limite = new Date(ahora.getTime() + horasAntes * 60 * 60 * 1000);

  return await this.find({
    estado: "publicado",
    fechaApertura: {
      $gte: ahora,
      $lte: limite
    }
  }).populate("curso", "titulo codigo alumnos");
};

// =============================================
// MÉTODOS EXISTENTES (sin cambios)
// =============================================

// Calcular puntaje total del examen
examenSchema.methods.calcularPuntajeTotal = function() {
  this.puntajeTotal = this.preguntas.reduce((sum, pregunta) => sum + pregunta.puntaje, 0);
  return this.puntajeTotal;
};

// Verificar si un alumno puede realizar el examen
examenSchema.methods.puedeRealizarExamen = function(alumnoId) {
  const ahora = new Date();
  
  // Verificar si está dentro del período
  if (ahora < this.fechaApertura) {
    return { puede: false, razon: "El examen aún no está disponible" };
  }
  
  if (ahora > this.fechaCierre) {
    return { puede: false, razon: "El examen ya cerró" };
  }

  // Verificar estado (usar estadoCalculado para mayor precisión)
  if (this.estadoCalculado !== "publicado") {
    return { puede: false, razon: "El examen no está disponible" };
  }

  // Verificar intentos
  const intentosAlumno = this.intentos.filter(
    i => i.alumno.toString() === alumnoId.toString()
  );

  if (intentosAlumno.length >= this.configuracion.intentosPermitidos) {
    return { puede: false, razon: "Ya usaste todos tus intentos" };
  }

  // Verificar si hay un intento en progreso
  const intentoEnProgreso = intentosAlumno.find(i => i.estado === "en_progreso");
  if (intentoEnProgreso) {
    return { puede: true, intentoActual: intentoEnProgreso._id };
  }

  return { puede: true };
};

// Actualizar estadísticas
examenSchema.methods.actualizarEstadisticas = function() {
  const intentosCalificados = this.intentos.filter(i => i.estado === "calificado");
  
  this.estadisticas.totalIntentos = intentosCalificados.length;
  
  if (intentosCalificados.length > 0) {
    const suma = intentosCalificados.reduce((sum, i) => sum + parseFloat(i.porcentaje), 0);
    this.estadisticas.promedioGeneral = (suma / intentosCalificados.length).toFixed(2);
    
    this.estadisticas.alumnosAprobados = intentosCalificados.filter(
      i => parseFloat(i.porcentaje) >= this.configuracion.notaAprobacion
    ).length;
    
    this.estadisticas.alumnosReprobados = intentosCalificados.filter(
      i => parseFloat(i.porcentaje) < this.configuracion.notaAprobacion
    ).length;
  }
};

// Configurar virtuals para JSON
examenSchema.set("toJSON", { virtuals: true });
examenSchema.set("toObject", { virtuals: true });

export default mongoose.model("Examen", examenSchema);