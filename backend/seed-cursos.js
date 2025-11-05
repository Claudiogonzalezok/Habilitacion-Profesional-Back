// backend/seed-cursos.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Curso from "./src/models/Curso.js";
import Usuario from "./src/models/Usuario.js";

dotenv.config();

const cursos = [
  {
    titulo: "Introducción a JavaScript",
    descripcion: "Aprende los fundamentos de JavaScript desde cero. Este curso cubre variables, funciones, objetos, arrays y manipulación del DOM.",
    codigo: "JS101",
    fechaInicio: "2025-02-01",
    fechaFin: "2025-06-30",
    duracionHoras: 60,
    categoria: "Programación",
    imagen: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800",
    estado: "activo"
  },
  {
    titulo: "Diseño Web con HTML y CSS",
    descripcion: "Domina el diseño web moderno con HTML5 y CSS3. Incluye Flexbox, Grid, responsive design y animaciones.",
    codigo: "WEB201",
    fechaInicio: "2025-01-15",
    fechaFin: "2025-05-15",
    duracionHoras: 50,
    categoria: "Diseño Web",
    imagen: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800",
    estado: "activo"
  },
  {
    titulo: "React - Desarrollo de Aplicaciones",
    descripcion: "Construye aplicaciones web modernas con React. Hooks, Context API, React Router y gestión de estado.",
    codigo: "REACT301",
    fechaInicio: "2025-03-01",
    fechaFin: "2025-07-31",
    duracionHoras: 80,
    categoria: "Programación",
    imagen: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
    estado: "activo"
  },
  {
    titulo: "Python para Ciencia de Datos",
    descripcion: "Análisis de datos con Python, Pandas, NumPy y Matplotlib. Incluye machine learning básico con Scikit-learn.",
    codigo: "PY401",
    fechaInicio: "2025-02-15",
    fechaFin: "2025-08-15",
    duracionHoras: 100,
    categoria: "Data Science",
    imagen: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800",
    estado: "activo"
  },
  {
    titulo: "Marketing Digital y Redes Sociales",
    descripcion: "Estrategias de marketing digital, SEO, SEM, gestión de redes sociales y analítica web.",
    codigo: "MKT101",
    fechaInicio: "2025-01-20",
    fechaFin: "2025-06-20",
    duracionHoras: 45,
    categoria: "Marketing",
    imagen: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
    estado: "activo"
  },
  {
      titulo: "Node.js y Express - Backend",
      descripcion: "Desarrollo de APIs REST con Node.js y Express. Incluye MongoDB, autenticación JWT y deployment.",
      codigo: "NODE301",
      fechaInicio: "2025-02-10",
      fechaFin: "2025-07-10",
      duracionHoras: 70,
      categoria: "Programación",
      imagen: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
      estado: "activo"
    },
    {
      titulo: "Fotografía Digital Profesional",
      descripcion: "Técnicas de fotografía digital, composición, iluminación y edición con Adobe Lightroom y Photoshop.",
      codigo: "FOTO201",
      fechaInicio: "2025-03-15",
      fechaFin: "2025-08-15",
      duracionHoras: 55,
      categoria: "Arte y Diseño",
      imagen: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800",
      estado: "activo"
    },
    {
      titulo: "Excel Avanzado para Negocios",
      descripcion: "Domina Excel para análisis empresarial. Fórmulas avanzadas, tablas dinámicas, macros y Power BI.",
      codigo: "EXCEL301",
      fechaInicio: "2025-01-10",
      fechaFin: "2025-04-10",
      duracionHoras: 40,
      categoria: "Ofimática",
      imagen: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
      estado: "activo"
    },
    {
      titulo: "Inglés Intermedio",
      descripcion: "Mejora tu nivel de inglés con énfasis en conversación, gramática y vocabulario profesional.",
      codigo: "ENG201",
      fechaInicio: "2025-02-01",
      fechaFin: "2025-11-30",
      duracionHoras: 120,
      categoria: "Idiomas",
      imagen: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800",
      estado: "activo"
    },
    {
      titulo: "Finanzas Personales",
      descripcion: "Gestiona tus finanzas personales, inversiones, ahorro e impuestos de manera inteligente.",
      codigo: "FIN101",
      fechaInicio: "2024-10-01",
      fechaFin: "2024-12-31",
      duracionHoras: 30,
      categoria: "Finanzas",
      imagen: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800",
      estado: "finalizado"
    },
    {
      titulo: "Diseño UX/UI con Figma",
      descripcion: "Diseña interfaces de usuario profesionales. Incluye prototipado, wireframes y diseño de sistemas.",
      codigo: "UX301",
      fechaInicio: "2025-03-20",
      fechaFin: "2025-08-20",
      duracionHoras: 65,
      categoria: "Diseño Web",
      imagen: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
      estado: "activo"
    },
    {
      titulo: "Ciberseguridad Básica",
      descripcion: "Fundamentos de seguridad informática, protección de datos, hacking ético y mejores prácticas.",
      codigo: "SEC201",
      fechaInicio: "2025-04-01",
      fechaFin: "2025-09-01",
      duracionHoras: 75,
      categoria: "Seguridad",
      imagen: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800",
      estado: "activo"
    }
];

const seedCursos = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    // Buscar un docente existente
    const docente = await Usuario.findOne({ rol: "docente" });
    
    if (!docente) {
      console.log("❌ No hay docentes en la base de datos. Crea uno primero.");
      process.exit(1);
    }

    console.log(`📚 Asignando cursos al docente: ${docente.nombre}`);

     //Limpiar cursos existentes (opcional)
     await Curso.deleteMany({});
     console.log("🗑️ Cursos anteriores eliminados");

    // Insertar cursos
    const cursosConDocente = cursos.map(curso => ({
      ...curso,
      docente: docente._id
    }));

    await Curso.insertMany(cursosConDocente);
    console.log(`✅ ${cursos.length} cursos insertados correctamente`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

seedCursos();