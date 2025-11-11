// models/Clase.js
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

export default mongoose.model("Clase", claseSchema);