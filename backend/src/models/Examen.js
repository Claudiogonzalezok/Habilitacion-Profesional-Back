// models/Examen.js
import mongoose from "mongoose";

const ExamenSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: String,
  curso: { type: mongoose.Schema.Types.ObjectId, ref: "Curso", required: true },
  preguntas: [
    {
      pregunta: String,
      opciones: [String],
      respuestaCorrecta: Number, // índice de la opción correcta
    },
  ],
});

export default mongoose.model("Examen", ExamenSchema);
