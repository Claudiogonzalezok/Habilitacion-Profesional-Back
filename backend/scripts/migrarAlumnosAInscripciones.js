// backend/scripts/migrarAlumnosAInscripciones.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Curso from "../src/models/Curso.js";
import Inscripcion from "../src/models/Inscripcion.js";

dotenv.config();

const migrarAlumnos = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB\n");

    const cursos = await Curso.find({ alumnos: { $exists: true, $ne: [] } });
    console.log(`📚 Cursos con alumnos: ${cursos.length}\n`);

    let totalInscripciones = 0;

    for (const curso of cursos) {
      console.log(`\n📖 Procesando: ${curso.titulo || curso.nombre}`);
      console.log(`   Alumnos en el array: ${curso.alumnos.length}`);

      for (const alumnoId of curso.alumnos) {
        // Verificar si ya existe inscripción
        const existe = await Inscripcion.findOne({
          alumno: alumnoId,
          curso: curso._id
        });

        if (!existe) {
          await Inscripcion.create({
            alumno: alumnoId,
            curso: curso._id,
            estado: "aprobada",
            fecha: curso.fechaCreacion || new Date()
          });
          totalInscripciones++;
          console.log(`   ✅ Inscripción creada para alumno: ${alumnoId}`);
        } else {
          console.log(`   ℹ️  Ya existe inscripción para alumno: ${alumnoId}`);
        }
      }
    }

    console.log(`\n🎉 Migración completada!`);
    console.log(`📊 Total de inscripciones creadas: ${totalInscripciones}`);
    console.log(`\n⚠️  IMPORTANTE: No olvides actualizar tus controladores para usar inscripciones`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

migrarAlumnos();