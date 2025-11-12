// config/email.config.js
import nodemailer from "nodemailer";

let transporterInstance = null;

// Función para obtener el transporter (LAZY LOADING)
export const getTransporter = () => {
  // Si ya existe, devolverlo
  if (transporterInstance) {
    return transporterInstance;
  }

  // Primera vez: crear el transporter
  console.log("=== INICIALIZANDO EMAIL CONFIG ===");
  console.log("EMAIL_USER:", process.env.EMAIL_USER || "❌ NO EXISTE");
  console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ Existe (" + process.env.EMAIL_PASS.length + " caracteres)" : "❌ NO EXISTE");
  console.log("==================================");

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ FALTAN CREDENCIALES DE EMAIL EN .ENV");
    throw new Error("Configuración de email incompleta");
  }

  transporterInstance = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Verificar conexión (asíncrono, no bloqueante)
  transporterInstance.verify((error, success) => {
    if (error) {
      console.error("❌ Error al configurar el email:", error.message);
    } else {
      console.log("✅ Servidor de email listo para enviar mensajes");
    }
  });

  return transporterInstance;
};

// ⚠️ NO ejecutar nada aquí - solo definir la función