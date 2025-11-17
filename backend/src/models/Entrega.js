// backend/src/models/Entrega.js
import mongoose from "mongoose";

const entregaSchema = new mongoose.Schema({
  tarea: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tarea",
    required: true
  },
  alumno: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true
  },
  
  // Contenido de la entrega
  comentarioAlumno: {
    type: String,
    trim: true
  },
  archivosEntregados: [{
    nombre: String,
    url: String,
    tipo: String,
    tamano: Number,
    fechaSubida: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Estado de la entrega
  estado: {
    type: String,
    enum: ["pendiente", "entregada", "calificada", "devuelta"],
    default: "pendiente"
  },
  
  // Fechas
  fechaEntrega: {
    type: Date
  },
  fechaUltimaModificacion: {
    type: Date
  },
  fechaCalificacion: {
    type: Date
  },
  
  // Calificación
  calificacion: {
    type: Number,
    min: 0
  },
  comentarioDocente: {
    type: String,
    trim: true
  },
  calificacionRubrica: [{
    criterio: String,
    puntajeObtenido: Number,
    comentario: String
  }],
  docenteCalificador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario"
  },
  
  // Archivos de devolución del docente
  archivosDevolucion: [{
    nombre: String,
    url: String,
    tipo: String,
    tamano: Number
  }],
  
  // Control de entregas tardías
  entregadaTarde: {
    type: Boolean,
    default: false
  },
  
  // Historial de versiones
  versiones: [{
    archivos: [{
      nombre: String,
      url: String,
      tipo: String,
      tamano: Number
    }],
    comentario: String,
    fecha: Date
  }]
}, {
  timestamps: true
});

// Índices para mejorar rendimiento
entregaSchema.index({ tarea: 1, alumno: 1 }, { unique: true });
entregaSchema.index({ tarea: 1, estado: 1 });
entregaSchema.index({ alumno: 1, estado: 1 });

// Middleware pre-save para actualizar fechas
entregaSchema.pre('save', function(next) {
  // Si cambia de pendiente a entregada, establecer fechaEntrega
  if (this.isModified('estado') && this.estado === 'entregada' && !this.fechaEntrega) {
    this.fechaEntrega = new Date();
  }
  
  // Si se califica, establecer fechaCalificacion
  if (this.isModified('estado') && this.estado === 'calificada' && !this.fechaCalificacion) {
    this.fechaCalificacion = new Date();
  }
  
  next();
});

export default mongoose.model("Entrega", entregaSchema);