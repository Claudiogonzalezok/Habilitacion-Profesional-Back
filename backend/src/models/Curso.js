// models/Curso.js
import mongoose from "mongoose";

const cursoSchema = new mongoose.Schema({
  titulo: { 
    type: String, 
    required: true,
    trim: true 
  },
  descripcion: { 
    type: String,
    default: "" 
  },
  codigo: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  docente: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Usuario", 
    required: true 
  },
  alumnos: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Usuario" 
  }],
  imagen: {
    type: String,
    default: "https://via.placeholder.com/300x200?text=Curso"
  },
  estado: {
    type: String,
    enum: ["activo", "inactivo", "finalizado"],
    default: "activo"
  },
  fechaInicio: {
    type: Date,
    required: true
  },
  fechaFin: {
    type: Date,
    required: true
  },
  duracionHoras: {
    type: Number,
    default: 0
  },
  categoria: {
    type: String,
    default: "General"
  },
  fechaCreacion: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Índices para búsquedas optimizadas
//cursoSchema.index({ codigo: 1 });
//cursoSchema.index({ docente: 1 });
//cursoSchema.index({ estado: 1 });

export default mongoose.model("Curso", cursoSchema);