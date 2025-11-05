// models/Material.js
import mongoose from "mongoose";

const MaterialSchema = new mongoose.Schema({
  curso: { type: mongoose.Schema.Types.ObjectId, ref: "Curso", required: true },
  nombre: { type: String, required: true },
  archivo: { type: String, required: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Material", MaterialSchema);
