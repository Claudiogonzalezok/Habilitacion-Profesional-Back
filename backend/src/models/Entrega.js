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
  comentarioAlumno: String,
  archivosEntregados: [{
    nombre: String,
    url: String,
    tipo: String,
    tamano: Number,
    fechaSubida: { type: Date, default: Date.now }
  }],
  
  // Fechas
  fechaEntrega: { 
    type: Date, 
    default: Date.now 
  },
  fechaUltimaModificacion: { 
    type: Date, 
    default: Date.now 
  },
  
  // Estado de entrega
  estado: {
    type: String,
    enum: ["pendiente", "entregada", "tarde", "calificada", "devuelta"],
    default: "pendiente"
  },
  entregadaTarde: {
    type: Boolean,
    default: false
  },
  
  // Calificación
  calificacion: {
    type: Number,
    min: 0,
    default: null
  },
  calificacionRubrica: [{
    criterio: String,
    puntajeObtenido: Number,
    puntajeMaximo: Number
  }],
  
  // Feedback del docente
  comentarioDocente: String,
  archivosDevolucion: [{
    nombre: String,
    url: String,
    tipo: String,
    tamano: Number
  }],
  
  // Metadata
  fechaCalificacion: Date,
  docenteCalificador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario"
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
    fecha: { type: Date, default: Date.now }
  }]
});

// Índices
entregaSchema.index({ tarea: 1, alumno: 1 }, { unique: true }); // Un alumno solo puede tener una entrega por tarea
entregaSchema.index({ tarea: 1, estado: 1 });
entregaSchema.index({ alumno: 1, estado: 1 });

// Middleware para actualizar fecha de modificación
entregaSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.fechaUltimaModificacion = new Date();
  }
  next();
});

export default mongoose.model("Entrega", entregaSchema);