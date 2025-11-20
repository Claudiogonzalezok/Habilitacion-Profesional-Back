// backend/src/models/Foro.js
import mongoose from "mongoose";

const respuestaSchema = new mongoose.Schema({
  autor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true
  },
  mensaje: {
    type: String,
    required: true,
    trim: true
  },
  editado: {
    type: Boolean,
    default: false
  },
  fechaEdicion: Date,
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario"
  }]
}, {
  timestamps: true
});

const foroSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  contenido: {
    type: String,
    required: true
  },
  curso: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Curso",
    required: true
  },
  autor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true
  },
  respuestas: [respuestaSchema],
  cerrado: {
    type: Boolean,
    default: false
  },
  fijado: {
    type: Boolean,
    default: false
  },
  vistas: {
    type: Number,
    default: 0
  },
  ultimaActividad: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices
foroSchema.index({ curso: 1, ultimaActividad: -1 });
foroSchema.index({ autor: 1 });
foroSchema.index({ fijado: 1 });

// Middleware para actualizar última actividad
foroSchema.pre('save', function(next) {
  if (this.isModified('respuestas')) {
    this.ultimaActividad = new Date();
  }
  next();
});

export default mongoose.model("Foro", foroSchema);
