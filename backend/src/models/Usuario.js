// backend/src/models/Usuario.js
import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol: { 
    type: String, 
    enum: ["admin", "docente", "alumno"], 
    default: "alumno" 
  },
  fechaRegistro: { type: Date, default: Date.now },
  
  // Campos para recuperación de contraseña
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  
  // Campo para refresh token
  refreshToken: { type: String },
  
  // Campos para verificación de email
  emailVerificado: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date }
});

export default mongoose.model("Usuario", usuarioSchema);