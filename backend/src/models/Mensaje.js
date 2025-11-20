// backend/src/models/Mensaje.js
import mongoose from "mongoose";

const mensajeSchema = new mongoose.Schema({
  remitente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true
  },
  destinatario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true
  },
  contenido: {
    type: String,
    required: true,
    trim: true
  },
  leido: {
    type: Boolean,
    default: false
  },
  fechaLectura: Date,
  adjuntos: [{
    nombre: String,
    url: String,
    tipo: String,
    tamano: Number
  }],
  eliminadoPor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario"
  }]
}, {
  timestamps: true
});

// Índices para mejorar búsquedas
mensajeSchema.index({ remitente: 1, destinatario: 1, createdAt: -1 });
mensajeSchema.index({ destinatario: 1, leido: 1 });
mensajeSchema.index({ remitente: 1, createdAt: -1 });

// Middleware para actualizar fecha de lectura
mensajeSchema.pre('save', function(next) {
  if (this.isModified('leido') && this.leido && !this.fechaLectura) {
    this.fechaLectura = new Date();
  }
  next();
});

export default mongoose.model("Mensaje", mensajeSchema);
