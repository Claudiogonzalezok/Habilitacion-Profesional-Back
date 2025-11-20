// backend/src/models/Anuncio.js
import mongoose from "mongoose";

const anuncioSchema = new mongoose.Schema({
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
  prioridad: {
    type: String,
    enum: ["baja", "normal", "alta", "urgente"],
    default: "normal"
  },
  fijado: {
    type: Boolean,
    default: false
  },
  adjuntos: [{
    nombre: String,
    url: String,
    tipo: String,
    tamano: Number
  }],
  lecturas: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario"
    },
    fechaLectura: {
      type: Date,
      default: Date.now
    }
  }],
  fechaPublicacion: {
    type: Date,
    default: Date.now
  },
  fechaProgramada: {
    type: Date
  },
  publicado: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices
anuncioSchema.index({ curso: 1, fechaPublicacion: -1 });
anuncioSchema.index({ autor: 1 });
anuncioSchema.index({ fijado: 1 });

export default mongoose.model("Anuncio", anuncioSchema);
