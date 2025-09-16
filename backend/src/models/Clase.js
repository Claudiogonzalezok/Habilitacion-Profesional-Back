// models/Clase.js
import mongoose from "mongoose";

const claseSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String },
  curso: { type: mongoose.Schema.Types.ObjectId, ref: "Curso", required: true },
  materiales: [{ 
    nombre: String,
    url: String // link al archivo subido (puede ser local o cloud)
  }],
  fechaCreacion: { type: Date, default: Date.now }
});

export default mongoose.model("Clase", claseSchema);
