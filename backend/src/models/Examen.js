// models/Examen.js
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
  respuestaCorrecta: String, // Para verdadero/falso o respuesta corta
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
    respuesta: mongoose.Schema.Types.Mixed, // Puede ser String, Number, o Array
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
  tiempoTranscurrido: Number, // En minutos
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
      default: true // Mostrar respuestas correctas después de completar
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

// Calcular puntaje total del examen
examenSchema.methods.calcularPuntajeTotal = function() {
  this.puntajeTotal = this.preguntas.reduce((sum, pregunta) => sum + pregunta.puntaje, 0);
  return this.puntajeTotal;
};

// Verificar si un alumno puede realizar el examen
examenSchema.methods.puedeRealizarExamen = function(alumnoId) {
  const ahora = new Date();
  
  // Verificar si está dentro del período
  if (ahora < this.fechaApertura || ahora > this.fechaCierre) {
    return { puede: false, razon: "Fuera del período permitido" };
  }

  // Verificar estado
  if (this.estado !== "publicado") {
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
    const suma = intentosCalificados.reduce((sum, i) => sum + i.porcentaje, 0);
    this.estadisticas.promedioGeneral = (suma / intentosCalificados.length).toFixed(2);
    
    this.estadisticas.alumnosAprobados = intentosCalificados.filter(
      i => i.porcentaje >= this.configuracion.notaAprobacion
    ).length;
    
    this.estadisticas.alumnosReprobados = intentosCalificados.filter(
      i => i.porcentaje < this.configuracion.notaAprobacion
    ).length;
  }
};

export default mongoose.model("Examen", examenSchema);
