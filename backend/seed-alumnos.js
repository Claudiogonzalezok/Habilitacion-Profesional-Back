// backend/seed-alumnos.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Usuario from "./src/models/Usuario.js";

dotenv.config();

const alumnos = [
  {
    nombre: "Juan Pérez",
    email: "juan.perez@alumno.com",
    password: "123456",
    rol: "alumno"
  },
  {
    nombre: "María González",
    email: "maria.gonzalez@alumno.com",
    password: "123456",
    rol: "alumno"
  },
  {
    nombre: "Carlos Rodríguez",
    email: "carlos.rodriguez@alumno.com",
    password: "123456",
    rol: "alumno"
  },
  {
    nombre: "Ana Martínez",
    email: "ana.martinez@alumno.com",
    password: "123456",
    rol: "alumno"
  },
  {
    nombre: "Luis Fernández",
    email: "luis.fernandez@alumno.com",
    password: "123456",
    rol: "alumno"
  },
  {
    nombre: "Laura Sánchez",
    email: "laura.sanchez@alumno.com",
    password: "123456",
    rol: "alumno"
  },
  {
    nombre: "Pedro López",
    email: "pedro.lopez@alumno.com",
    password: "123456",
    rol: "alumno"
  },
  {
    nombre: "Sofía Ramírez",
    email: "sofia.ramirez@alumno.com",
    password: "123456",
    rol: "alumno"
  },
  {
    nombre: "Diego Torres",
    email: "diego.torres@alumno.com",
    password: "123456",
    rol: "alumno"
  },
  {
    nombre: "Valentina Castro",
    email: "valentina.castro@alumno.com",
    password: "123456",
    rol: "alumno"
  }
];

const seedAlumnos = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    // Opcional: Eliminar alumnos existentes
    // await Usuario.deleteMany({ rol: "alumno" });
    // console.log("🗑️ Alumnos anteriores eliminados");

    // Hashear passwords y crear alumnos
    for (const alumno of alumnos) {
      // Verificar si el alumno ya existe
      const existe = await Usuario.findOne({ email: alumno.email });
      
      if (existe) {
        console.log(`⚠️  Alumno ya existe: ${alumno.nombre}`);
        continue;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(alumno.password, salt);

      const nuevoAlumno = new Usuario({
        ...alumno,
        password: hashedPassword
      });

      await nuevoAlumno.save();
      console.log(`✅ Alumno creado: ${alumno.nombre} - ${alumno.email}`);
    }

    console.log(`\n🎉 Proceso completado`);
    console.log(`📧 Email: cualquier.alumno@alumno.com`);
    console.log(`🔑 Password: 123456`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

seedAlumnos();