// models/SolicitudInscripcion.js
import mongoose from "mongoose";

const solicitudInscripcionSchema = new mongoose.Schema({
  alumno: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true
  },
  curso: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Curso",
    required: true
  },
  estado: {
    type: String,
    enum: ["pendiente", "aprobada", "rechazada", "cancelada"],
    default: "pendiente"
  },
  mensaje: {
    type: String,
    default: "",
    maxlength: 500
  },
  // Razón del rechazo (si aplica)
  motivoRechazo: {
    type: String,
    default: ""
  },
  // Admin que procesó la solicitud
  procesadaPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    default: null
  },
  fechaSolicitud: {
    type: Date,
    default: Date.now
  },
  fechaProcesamiento: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Índice compuesto para evitar solicitudes duplicadas pendientes
solicitudInscripcionSchema.index(
  { alumno: 1, curso: 1, estado: 1 },
  { 
    unique: true,
    partialFilterExpression: { estado: "pendiente" }
  }
);

// Índices para búsquedas frecuentes
solicitudInscripcionSchema.index({ estado: 1, fechaSolicitud: -1 });
solicitudInscripcionSchema.index({ alumno: 1, fechaSolicitud: -1 });

export default mongoose.model("SolicitudInscripcion", solicitudInscripcionSchema);