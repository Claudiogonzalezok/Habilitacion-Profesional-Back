// models/Inscripcion.js
import mongoose from "mongoose";

const inscripcionSchema = new mongoose.Schema({
  alumno: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  curso: { type: mongoose.Schema.Types.ObjectId, ref: "Curso", required: true },
  estado: { 
    type: String, 
    enum: ["pendiente", "aprobada", "rechazada"], 
    default: "pendiente" 
  },
  fecha: { type: Date, default: Date.now }
});

export default mongoose.model("Inscripcion", inscripcionSchema);
