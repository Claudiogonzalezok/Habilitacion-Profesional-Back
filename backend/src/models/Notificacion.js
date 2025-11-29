// backend/src/models/Notificacion.js
import mongoose from "mongoose";

const notificacionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true
  },
  tipo: {
    type: String,
    enum: ["tarea", "examen", "calificacion", "mensaje", "anuncio", "foro", "curso", "alerta", "sistema"],
    required: true
  },
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  mensaje: {
    type: String,
    required: true
  },
  enlace: {
    type: String // URL para redirigir al hacer clic
  },
  leida: {
    type: Boolean,
    default: false
  },
  fechaLectura: Date,
  prioridad: {
    type: String,
    enum: ["baja", "normal", "alta"],
    default: "normal"
  },
  tipo: {
  type: String,
  enum: ["tarea", "examen", "calificacion", "mensaje", "anuncio", "foro", "curso", "alerta", "sistema", "inscripcion"], 
  required: true
},
  metadata: {
    cursoId: mongoose.Schema.Types.ObjectId,
    tareaId: mongoose.Schema.Types.ObjectId,
    examenId: mongoose.Schema.Types.ObjectId,
    mensajeId: mongoose.Schema.Types.ObjectId,
    anuncioId: mongoose.Schema.Types.ObjectId,
    foroId: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: true
});

// Índices
notificacionSchema.index({ usuario: 1, leida: 1, createdAt: -1 });
notificacionSchema.index({ usuario: 1, tipo: 1 });

// Middleware para actualizar fecha de lectura
notificacionSchema.pre('save', function(next) {
  if (this.isModified('leida') && this.leida && !this.fechaLectura) {
    this.fechaLectura = new Date();
  }
  next();
});

export default mongoose.model("Notificacion", notificacionSchema);
