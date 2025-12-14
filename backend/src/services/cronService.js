// backend/src/services/cronService.js
import cron from "node-cron";
import Clase from "../models/Clase.js";
import Examen from "../models/Examen.js";

// =============================================
// Actualizar estados de clases
// =============================================
const actualizarEstadosClases = async () => {
  try {
    const cantidad = await Clase.actualizarEstados();
    if (cantidad > 0) {
      console.log(`🔄 [CRON] ${cantidad} clase(s) actualizada(s)`);
    }
  } catch (error) {
    console.error("❌ [CRON] Error al actualizar estados de clases:", error);
  }
};

// =============================================
// Actualizar estados de exámenes
// =============================================
const actualizarEstadosExamenes = async () => {
  try {
    const cantidad = await Examen.actualizarEstados();
    if (cantidad > 0) {
      console.log(`📝 [CRON] ${cantidad} examen(es) cerrado(s) automáticamente`);
    }
  } catch (error) {
    console.error("❌ [CRON] Error al actualizar estados de exámenes:", error);
  }
};

// =============================================
// Función combinada para actualizar todo
// =============================================
const actualizarTodosLosEstados = async () => {
  await actualizarEstadosClases();
  await actualizarEstadosExamenes();
};

// =============================================
// Iniciar todos los cron jobs
// =============================================
export const iniciarCronJobs = () => {
  console.log("⏰ Iniciando cron jobs...");

  // Cada 5 minutos - Actualización general
  cron.schedule("*/5 * * * *", async () => {
    console.log("🔄 [CRON] Ejecutando actualización periódica...");
    await actualizarTodosLosEstados();
  });

  // Cada minuto durante horario de clases (7am - 11pm) - Actualización precisa
  cron.schedule("* 7-23 * * *", async () => {
    await actualizarTodosLosEstados();
  });

  // A las 3:00 AM - Limpieza nocturna
  cron.schedule("0 3 * * *", async () => {
    console.log("🌙 [CRON] Ejecutando limpieza nocturna...");
    await actualizarTodosLosEstados();
  });

  // A las 00:00 - Cierre de exámenes del día anterior
  cron.schedule("0 0 * * *", async () => {
    console.log("🕛 [CRON] Verificando exámenes vencidos a medianoche...");
    await actualizarEstadosExamenes();
  });

  console.log("✅ Cron jobs iniciados correctamente");
};

// Exportar funciones individuales para uso manual
export { actualizarEstadosClases, actualizarEstadosExamenes, actualizarTodosLosEstados };