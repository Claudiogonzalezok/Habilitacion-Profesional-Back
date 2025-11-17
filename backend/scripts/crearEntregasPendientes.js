// backend/scripts/crearEntregasPendientes.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Tarea from "../src/models/Tarea.js";
import Entrega from "../src/models/Entrega.js";
import Inscripcion from "../src/models/Inscripcion.js";

dotenv.config();

const crearEntregasPendientes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB\n");

    const tareas = await Tarea.find();
    console.log(`📋 Total de tareas: ${tareas.length}\n`);

    let totalCreadas = 0;

    for (const tarea of tareas) {
      console.log(`Procesando tarea: ${tarea.titulo}`);

      // Obtener alumnos inscritos en el curso
      const inscripciones = await Inscripcion.find({
        curso: tarea.curso,
        estado: "aprobada"
      });

      console.log(`  - Alumnos inscritos: ${inscripciones.length}`);

      for (const inscripcion of inscripciones) {
        // Verificar si ya existe una entrega
        const entregaExistente = await Entrega.findOne({
          tarea: tarea._id,
          alumno: inscripcion.alumno
        });

        if (!entregaExistente) {
          // Crear entrega pendiente
          await Entrega.create({
            tarea: tarea._id,
            alumno: inscripcion.alumno,
            estado: "pendiente"
          });
          totalCreadas++;
          console.log(`  ✅ Entrega creada para alumno ${inscripcion.alumno}`);
        }
      }
    }

    console.log(`\n🎉 Proceso completado!`);
    console.log(`📊 Total de entregas creadas: ${totalCreadas}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

crearEntregasPendientes();