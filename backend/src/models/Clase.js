// backend/src/models/Clase.js
import mongoose from "mongoose";

const materialSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ["documento", "video", "enlace", "presentacion", "otro"],
    default: "documento"
  },
  url: {
    type: String,
    required: true
  },
  descripcion: String,
  tamano: Number,
  fechaSubida: {
    type: Date,
    default: Date.now
  }
});

const claseSchema = new mongoose.Schema({
  titulo: { 
    type: String, 
    required: true,
    trim: true 
  },
  descripcion: { 
    type: String,
    default: "" 
  },
  curso: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Curso", 
    required: true 
  },
  fecha: {
    type: Date,
    required: true
  },
  horaInicio: {
    type: String,
    required: true
  },
  horaFin: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ["presencial", "virtual", "hibrida"],
    default: "virtual"
  },
  enlaceReunion: {
    type: String,
    default: ""
  },
  materiales: [materialSchema],
  contenido: {
    type: String,
    default: ""
  },
  objetivos: [{
    type: String
  }],
  estado: {
    type: String,
    enum: ["programada", "en_curso", "finalizada", "cancelada"],
    default: "programada"
  },
  asistencias: [{
    estudiante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario"
    },
    presente: {
      type: Boolean,
      default: false
    },
    fechaRegistro: {
      type: Date,
      default: Date.now
    }
  }],
  orden: {
    type: Number,
    default: 0
  },
  fechaCreacion: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Índices
claseSchema.index({ curso: 1, fecha: 1 });
claseSchema.index({ estado: 1 });

// ============================================
// MÉTODOS DE INSTANCIA
// ============================================

// Helper para obtener fecha/hora de inicio completa
claseSchema.methods.obtenerFechaHoraInicio = function() {
  const fecha = new Date(this.fecha);
  const [horas, minutos] = this.horaInicio.split(":");
  fecha.setHours(parseInt(horas), parseInt(minutos), 0, 0);
  return fecha;
};

// Helper para obtener fecha/hora de fin completa
claseSchema.methods.obtenerFechaHoraFin = function() {
  const fecha = new Date(this.fecha);
  const [horas, minutos] = this.horaFin.split(":");
  fecha.setHours(parseInt(horas), parseInt(minutos), 0, 0);
  return fecha;
};

// ============================================
// VIRTUALS
// ============================================

// Virtual para calcular el estado actual basado en fecha/hora
claseSchema.virtual("estadoCalculado").get(function() {
  // Si está cancelada, mantener ese estado (es manual)
  if (this.estado === "cancelada") return "cancelada";
  
  const ahora = new Date();
  const fechaInicio = this.obtenerFechaHoraInicio();
  const fechaFin = this.obtenerFechaHoraFin();
  
  if (ahora < fechaInicio) {
    return "programada";
  } else if (ahora >= fechaInicio && ahora <= fechaFin) {
    return "en_curso";
  } else {
    return "finalizada";
  }
});

// Virtual para saber si está próxima a iniciar (en los próximos 15 minutos)
claseSchema.virtual("proximaAIniciar").get(function() {
  if (this.estado === "cancelada") return false;
  
  const ahora = new Date();
  const fechaInicio = this.obtenerFechaHoraInicio();
  const diferencia = fechaInicio - ahora;
  
  // Entre 0 y 15 minutos antes
  return diferencia > 0 && diferencia <= 15 * 60 * 1000;
});

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

// Actualizar estados de todas las clases
claseSchema.statics.actualizarEstados = async function() {
  const clases = await this.find({ 
    estado: { $nin: ["cancelada", "finalizada"] } // Solo las que pueden cambiar
  });
  
  let actualizadas = 0;
  
  for (const clase of clases) {
    const estadoCalculado = clase.estadoCalculado;
    
    if (clase.estado !== estadoCalculado) {
      clase.estado = estadoCalculado;
      await clase.save();
      actualizadas++;
      console.log(`   📝 Clase "${clase.titulo}" -> ${estadoCalculado}`);
    }
  }
  
  return actualizadas;
};

// Obtener clases que están por comenzar
claseSchema.statics.obtenerProximasAIniciar = async function(minutosAntes = 15) {
  const ahora = new Date();
  const limite = new Date(ahora.getTime() + minutosAntes * 60 * 1000);
  
  const clases = await this.find({
    estado: "programada",
    fecha: {
      $gte: new Date(ahora.toDateString()),
      $lte: new Date(limite.toDateString())
    }
  }).populate("curso", "titulo codigo");
  
  // Filtrar las que realmente están en el rango de tiempo
  return clases.filter(clase => {
    const fechaInicio = clase.obtenerFechaHoraInicio();
    return fechaInicio > ahora && fechaInicio <= limite;
  });
};

claseSchema.set('toJSON', { virtuals: true });
claseSchema.set('toObject', { virtuals: true });

export default mongoose.model("Clase", claseSchema);