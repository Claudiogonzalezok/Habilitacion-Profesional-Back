// backend/src/models/Clase.js
import mongoose from "mongoose";

const materialSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  tipo: {
    type: String,
    enum: ["documento", "video", "enlace", "presentacion", "otro"],
    default: "documento"
  },
  url: { type: String, required: true },
  descripcion: String,
  tamano: Number,
  fechaSubida: { type: Date, default: Date.now }
});

const claseSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true },
  descripcion: { type: String, default: "" },
  curso: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Curso",
    required: true
  },
  fecha: { type: Date, required: true },

  horaInicio: {
    type: String,
    required: true
  },
  horaFin: {
    type: String,
    required: true
  },

  tipo: {
    type: String,
    enum: ["presencial", "virtual", "hibrida"],
    default: "virtual"
  },
  enlaceReunion: { type: String, default: "" },

  materiales: [materialSchema],
  contenido: { type: String, default: "" },
  objetivos: [{ type: String }],

  estado: {
    type: String,
    enum: ["programada", "en_curso", "finalizada", "cancelada"],
    default: "programada"
  },

  asistencias: [{
    estudiante: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
    presente: { type: Boolean, default: false },
    fechaRegistro: { type: Date, default: Date.now }
  }],

  orden: { type: Number, default: 0 },
  fechaCreacion: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// ===================
// ÍNDICES
// ===================
claseSchema.index({ curso: 1, fecha: 1 });
claseSchema.index({ estado: 1 });

// ===================
// MÉTODOS DE INSTANCIA
// ===================

// Ajuste de timezone (OK)
claseSchema.methods.obtenerFechaAjustada = function () {
  if (!this.fecha) return null;
  const fecha = new Date(this.fecha);
  return new Date(fecha.getTime() + fecha.getTimezoneOffset() * 60000);
};

// 🔒 BLINDADO
claseSchema.methods.obtenerFechaHoraInicio = function () {
  if (!this.fecha || !this.horaInicio) return null;

  const fecha = this.obtenerFechaAjustada();
  if (!fecha) return null;

  const partes = this.horaInicio.split(":");
  if (partes.length !== 2) return null;

  const [horas, minutos] = partes;
  fecha.setHours(Number(horas), Number(minutos), 0, 0);
  return fecha;
};

// 🔒 BLINDADO
claseSchema.methods.obtenerFechaHoraFin = function () {
  if (!this.fecha || !this.horaFin) return null;

  const fecha = this.obtenerFechaAjustada();
  if (!fecha) return null;

  const partes = this.horaFin.split(":");
  if (partes.length !== 2) return null;

  const [horas, minutos] = partes;
  fecha.setHours(Number(horas), Number(minutos), 0, 0);
  return fecha;
};

// ===================
// VIRTUALS
// ===================

claseSchema.virtual("estadoCalculado").get(function () {
  if (this.estado === "cancelada") return "cancelada";

  const inicio = this.obtenerFechaHoraInicio();
  const fin = this.obtenerFechaHoraFin();
  if (!inicio || !fin) return this.estado;

  const ahora = new Date();

  if (ahora < inicio) return "programada";
  if (ahora >= inicio && ahora <= fin) return "en_curso";
  return "finalizada";
});

claseSchema.virtual("proximaAIniciar").get(function () {
  if (this.estado === "cancelada") return false;

  const inicio = this.obtenerFechaHoraInicio();
  if (!inicio) return false;

  const ahora = new Date();
  const diff = inicio - ahora;

  return diff > 0 && diff <= 15 * 60 * 1000;
});

// ===================
// MÉTODOS ESTÁTICOS
// ===================

claseSchema.statics.actualizarEstados = async function () {
  const clases = await this.find({
    estado: { $nin: ["cancelada", "finalizada"] }
  });

  let actualizadas = 0;

  for (const clase of clases) {
    const nuevoEstado = clase.estadoCalculado;
    if (clase.estado !== nuevoEstado) {
      clase.estado = nuevoEstado;
      await clase.save();
      actualizadas++;
    }
  }

  return actualizadas;
};

claseSchema.statics.obtenerProximasAIniciar = async function (minutosAntes = 15) {
  const ahora = new Date();
  const limite = new Date(ahora.getTime() + minutosAntes * 60000);

  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const finHoy = new Date();
  finHoy.setHours(23, 59, 59, 999);

  const clases = await this.find({
    estado: "programada",
    fecha: { $gte: inicioHoy, $lte: finHoy }
  }).populate("curso", "titulo codigo");

  return clases.filter(c => {
    const inicio = c.obtenerFechaHoraInicio();
    return inicio && inicio > ahora && inicio <= limite;
  });
};

claseSchema.set("toJSON", { virtuals: true });
claseSchema.set("toObject", { virtuals: true });

export default mongoose.model("Clase", claseSchema);
