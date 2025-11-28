// models/Usuario.js
import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  rol: { 
    type: String, 
    enum: ["admin", "docente", "alumno"], 
    default: "alumno" 
  },
  
  // 🆕 Campos de perfil adicionales
  imagen: {
    type: String,
    default: null
  },
  telefono: {
    type: String,
    default: ""
  },
  direccion: {
    type: String,
    default: ""
  },
  biografia: {
    type: String,
    default: "",
    maxlength: 500
  },
  fechaNacimiento: {
    type: Date,
    default: null
  },
  legajo: {
    type: String,
    default: ""
  },
  
  // 🆕 Preferencias del usuario
  preferencias: {
    notificacionesEmail: {
      type: Boolean,
      default: true
    },
    notificacionesPush: {
      type: Boolean,
      default: true
    },
    temaOscuro: {
      type: Boolean,
      default: false
    },
    idioma: {
      type: String,
      default: "es"
    }
  },
  
  // Verificación de email
  emailVerificado: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Recuperación de contraseña
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Refresh token para "recordarme"
  refreshToken: String,
  
  // Timestamps
  fechaCreacion: { 
    type: Date, 
    default: Date.now 
  },
  ultimoAcceso: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Índices
usuarioSchema.index({ email: 1 });
usuarioSchema.index({ rol: 1 });

// Virtual para obtener la URL completa de la imagen
usuarioSchema.virtual("imagenUrl").get(function() {
  if (this.imagen) {
    // Si es una URL completa, devolverla tal cual
    if (this.imagen.startsWith("http")) {
      return this.imagen;
    }
    // Si es una ruta relativa, agregar el dominio base
    return this.imagen;
  }
  // Imagen por defecto según el rol
  return null;
});

// Método para obtener iniciales del nombre
usuarioSchema.virtual("iniciales").get(function() {
  if (!this.nombre) return "?";
  const partes = this.nombre.trim().split(" ");
  if (partes.length >= 2) {
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }
  return this.nombre.substring(0, 2).toUpperCase();
});

usuarioSchema.set('toJSON', { virtuals: true });
usuarioSchema.set('toObject', { virtuals: true });

export default mongoose.model("Usuario", usuarioSchema);