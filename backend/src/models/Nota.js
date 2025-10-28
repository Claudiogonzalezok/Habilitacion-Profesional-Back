// models/Nota.js
import mongoose from "mongoose";

const NotaSchema = new mongoose.Schema({
  alumno: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  examen: { type: mongoose.Schema.Types.ObjectId, ref: "Examen", required: true },
  puntaje: { type: Number, required: true },
  total: { type: Number, required: true },
});

export default mongoose.model("Nota", NotaSchema);