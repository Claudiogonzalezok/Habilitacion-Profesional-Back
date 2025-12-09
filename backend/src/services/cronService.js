// backend/src/services/cronService.js
import cron from "node-cron";
import Clase from "../models/Clase.js";

export const iniciarCronJobs = () => {
  console.log("⏰ Iniciando cron jobs...");

  // ============================================
  // Actualizar estados cada 5 minutos
  // ============================================
  cron.schedule("*/5 * * * *", async () => {
    try {
      const actualizadas = await Clase.actualizarEstados();
      if (actualizadas > 0) {
        console.log(`[CRON ${new Date().toLocaleTimeString()}] ${actualizadas} clase(s) actualizada(s)`);
      }
    } catch (error) {
      console.error("[CRON] Error al actualizar estados:", error.message);
    }
  });

  // ============================================
  // Durante horario de clases (7am - 11pm): cada minuto
  // Esto asegura que el estado "en_curso" se active puntualmente
  // ============================================
  cron.schedule("* 7-23 * * *", async () => {
    try {
      await Clase.actualizarEstados();
    } catch (error) {
      console.error("[CRON] Error en actualización frecuente:", error.message);
    }
  });

  // ============================================
  // Limpieza nocturna (3am): finalizar clases pendientes
  // ============================================
  cron.schedule("0 3 * * *", async () => {
    try {
      console.log("[CRON] Ejecutando limpieza nocturna...");
      const actualizadas = await Clase.actualizarEstados();
      console.log(`[CRON] Limpieza completada: ${actualizadas} clase(s) actualizada(s)`);
    } catch (error) {
      console.error("[CRON] Error en limpieza nocturna:", error.message);
    }
  });

  console.log("✅ Cron jobs iniciados correctamente");
  console.log("   - Actualización general: cada 5 minutos");
  console.log("   - Actualización frecuente: cada minuto (7am-11pm)");
  console.log("   - Limpieza nocturna: 3:00 AM");
};

// Función para ejecutar actualización manual
export const ejecutarActualizacionManual = async () => {
  try {
    const actualizadas = await Clase.actualizarEstados();
    return { success: true, actualizadas };
  } catch (error) {
    return { success: false, error: error.message };
  }
};