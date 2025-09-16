// models/Curso.js
import mongoose from "mongoose";

const cursoSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String },
  docente: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  alumnos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }], // inscriptos
  fechaCreacion: { type: Date, default: Date.now }
});

export default mongoose.model("Curso", cursoSchema);
