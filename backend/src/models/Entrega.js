// models/Entrega.js
import mongoose from "mongoose";

const EntregaSchema = new mongoose.Schema({
  tarea: { type: mongoose.Schema.Types.ObjectId, ref: "Tarea", required: true },
  alumno: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  archivo: { type: String },  // opcional, si se sube archivo
  texto: { type: String },    // opcional, si es texto
  calificacion: { type: Number },
  retroalimentacion: { type: String },
  fechaEntrega: { type: Date, default: Date.now },
});

export default mongoose.model("Entrega", EntregaSchema);
