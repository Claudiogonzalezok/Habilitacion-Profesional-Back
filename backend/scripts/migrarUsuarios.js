// backend/scripts/migrarUsuarios.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Usuario from "../src/models/Usuario.js";

dotenv.config();

const migrarUsuarios = async () => {
  try {
    console.log("🔄 Conectando a MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    console.log("\n🔄 Actualizando usuarios existentes...");
    
    // Actualizar todos los usuarios que no tienen el campo emailVerificado
    const resultado = await Usuario.updateMany(
      { emailVerificado: { $exists: false } }, // Usuarios sin el campo
      { 
        $set: { 
          emailVerificado: true, // Marcarlos como verificados
          emailVerificationToken: null,
          emailVerificationExpires: null
        } 
      }
    );

    console.log(`✅ ${resultado.modifiedCount} usuarios actualizados`);
    console.log(`📊 Total de usuarios verificados: ${resultado.matchedCount}`);

    // Mostrar resumen
    const total = await Usuario.countDocuments();
    const verificados = await Usuario.countDocuments({ emailVerificado: true });
    const noVerificados = await Usuario.countDocuments({ emailVerificado: false });

    console.log("\n📊 RESUMEN:");
    console.log(`   Total de usuarios: ${total}`);
    console.log(`   ✅ Verificados: ${verificados}`);
    console.log(`   ❌ No verificados: ${noVerificados}`);

    console.log("\n🎉 Migración completada exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en la migración:", error);
    process.exit(1);
  }
};

migrarUsuarios();