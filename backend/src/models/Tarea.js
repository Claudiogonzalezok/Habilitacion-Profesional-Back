// backend/src/models/Tarea.js
import mongoose from "mongoose";

const tareaSchema = new mongoose.Schema({
  titulo: { 
    type: String, 
    required: true 
  },
  descripcion: { 
    type: String, 
    required: true 
  },
  curso: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Curso", 
    required: true 
  },
  clase: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Clase",
    default: null // Puede ser general del curso o específica de una clase
  },
  docente: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Usuario", 
    required: true 
  },
  
  // Configuración de la tarea
  fechaCreacion: { 
    type: Date, 
    default: Date.now 
  },
  fechaApertura: { 
    type: Date, 
    required: true 
  },
  fechaCierre: { 
    type: Date, 
    required: true 
  },
  
  // Configuración de entrega
  permitirEntregasTarde: { 
    type: Boolean, 
    default: false 
  },
  penalizacionTarde: { 
    type: Number, 
    default: 0, // Porcentaje de penalización (ej: 10 = -10%)
    min: 0,
    max: 100
  },
  
  // Archivos y recursos
  archivosAdjuntos: [{
    nombre: String,
    url: String,
    tipo: String,
    tamano: Number
  }],
  
  // Calificación
  puntajeMaximo: { 
    type: Number, 
    required: true,
    min: 0
  },
  
  // Rúbrica de evaluación (opcional)
  rubrica: [{
    criterio: String,
    descripcion: String,
    puntajeMaximo: Number
  }],
  
  // Estado
  publicada: { 
    type: Boolean, 
    default: true 
  },
  
  // Configuración adicional
  tipoEntrega: {
    type: String,
    enum: ["archivo", "texto", "ambos"],
    default: "archivo"
  },
  formatosPermitidos: [String], // ["pdf", "docx", "jpg", etc.]
  tamanioMaximo: { 
    type: Number, 
    default: 10485760 // 10MB en bytes
  },
  cantidadMaximaArchivos: {
    type: Number,
    default: 5
  },
  
  // Instrucciones adicionales
  instrucciones: String,
  
  // Visibilidad de calificaciones
  mostrarCalificacionesAlumnos: {
    type: Boolean,
    default: true
  }
});

// Índices para mejorar rendimiento
tareaSchema.index({ curso: 1, fechaCierre: -1 });
tareaSchema.index({ docente: 1 });

// Virtual para calcular si está vencida
tareaSchema.virtual("estaVencida").get(function() {
  return new Date() > this.fechaCierre;
});

// Virtual para calcular si está abierta
tareaSchema.virtual("estaAbierta").get(function() {
  const ahora = new Date();
  return ahora >= this.fechaApertura && ahora <= this.fechaCierre;
});

tareaSchema.set('toJSON', { virtuals: true });
tareaSchema.set('toObject', { virtuals: true });

export default mongoose.model("Tarea", tareaSchema);