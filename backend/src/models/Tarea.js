// models/Tarea.js
import mongoose from "mongoose";

const TareaSchema = new mongoose.Schema({
  curso: { type: mongoose.Schema.Types.ObjectId, ref: "Curso", required: true },
  titulo: { type: String, required: true },
  descripcion: { type: String },
  fechaEntrega: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  creador: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
});

export default mongoose.model("Tarea", TareaSchema);
