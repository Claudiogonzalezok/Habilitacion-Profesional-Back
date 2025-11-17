// backend/scripts/crearEntregasDesdeInscripciones.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Tarea from "../src/models/Tarea.js";
import Entrega from "../src/models/Entrega.js";
import Inscripcion from "../src/models/Inscripcion.js";
import Curso from "../src/models/Curso.js"; // 🔥 AGREGAR ESTE IMPORT
import Usuario from "../src/models/Usuario.js"; // 🔥 AGREGAR ESTE IMPORT

dotenv.config();

const crearEntregas = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB\n");

    const tareas = await Tarea.find().populate("curso", "titulo nombre codigo");
    console.log(`📋 Total de tareas: ${tareas.length}\n`);

    if (tareas.length === 0) {
      console.log("⚠️ No hay tareas en el sistema");
      process.exit(0);
    }

    let totalCreadas = 0;

    for (const tarea of tareas) {
      console.log(`\n📝 Procesando: ${tarea.titulo}`);
      console.log(`   Curso: ${tarea.curso?.titulo || tarea.curso?.nombre || "Sin nombre"}`);

      // Obtener alumnos inscritos en el curso
      const inscripciones = await Inscripcion.find({
        curso: tarea.curso._id,
        estado: "aprobada"
      }).populate("alumno", "nombre email");

      console.log(`   👥 Alumnos inscritos: ${inscripciones.length}`);

      if (inscripciones.length === 0) {
        console.log(`   ⚠️ No hay alumnos inscritos en este curso`);
        continue;
      }

      for (const inscripcion of inscripciones) {
        // Verificar si ya existe una entrega
        const entregaExistente = await Entrega.findOne({
          tarea: tarea._id,
          alumno: inscripcion.alumno._id
        });

        if (!entregaExistente) {
          // Crear entrega pendiente
          await Entrega.create({
            tarea: tarea._id,
            alumno: inscripcion.alumno._id,
            estado: "pendiente"
          });
          totalCreadas++;
          console.log(`   ✅ Entrega creada: ${inscripcion.alumno.nombre}`);
        } else {
          console.log(`   ℹ️  Ya existe entrega: ${inscripcion.alumno.nombre} (${entregaExistente.estado})`);
        }
      }
    }

    console.log(`\n${"=".repeat(50)}`);
    console.log(`🎉 Proceso completado!`);
    console.log(`📊 Total de entregas creadas: ${totalCreadas}`);
    
    const totalEntregas = await Entrega.countDocuments();
    const entregasPendientes = await Entrega.countDocuments({ estado: "pendiente" });
    const entregasRealizadas = await Entrega.countDocuments({ estado: "entregada" });
    const entregasCalificadas = await Entrega.countDocuments({ estado: "calificada" });
    
    console.log(`\n📊 RESUMEN DEL SISTEMA:`);
    console.log(`   Total de entregas: ${totalEntregas}`);
    console.log(`   Pendientes: ${entregasPendientes}`);
    console.log(`   Entregadas: ${entregasRealizadas}`);
    console.log(`   Calificadas: ${entregasCalificadas}`);
    console.log(`${"=".repeat(50)}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

crearEntregas();