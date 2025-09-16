// models/Usuario.js
import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // se guarda hasheado
  rol: { 
    type: String, 
    enum: ["admin", "docente", "alumno"], 
    default: "alumno" 
  },
  fechaRegistro: { type: Date, default: Date.now }
});

export default mongoose.model("Usuario", usuarioSchema);
