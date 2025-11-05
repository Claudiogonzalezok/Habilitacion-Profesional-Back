// backend/seed-clases.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Clase from "./src/models/Clase.js";
import Curso from "./src/models/Curso.js";

dotenv.config();

const clasesTemplate = {
  "JS101": [
    {
      titulo: "Introducción a JavaScript",
      descripcion: "Conceptos básicos de JavaScript, variables y tipos de datos",
      fecha: "2025-02-03",
      horaInicio: "14:00",
      horaFin: "16:00",
      tipo: "virtual",
      enlaceReunion: "https://meet.google.com/abc-defg-hij",
      contenido: "En esta clase veremos: variables (let, const, var), tipos de datos primitivos, operadores básicos y primeros ejemplos prácticos.",
      objetivos: [
        "Comprender qué es JavaScript y su uso en la web",
        "Declarar y usar variables correctamente",
        "Identificar los diferentes tipos de datos"
      ],
      estado: "finalizada",
      orden: 1
    },
    {
      titulo: "Funciones en JavaScript",
      descripcion: "Declaración de funciones, parámetros y valores de retorno",
      fecha: "2025-02-10",
      horaInicio: "14:00",
      horaFin: "16:00",
      tipo: "virtual",
      enlaceReunion: "https://meet.google.com/abc-defg-hij",
      contenido: "Aprenderemos sobre funciones tradicionales, arrow functions, scope y closure.",
      objetivos: [
        "Crear funciones reutilizables",
        "Entender el scope y contexto de ejecución",
        "Aplicar arrow functions correctamente"
      ],
      estado: "finalizada",
      orden: 2
    },
    {
      titulo: "Arreglos y Métodos",
      descripcion: "Manipulación de arrays con map, filter, reduce",
      fecha: "2025-02-17",
      horaInicio: "14:00",
      horaFin: "16:00",
      tipo: "virtual",
      enlaceReunion: "https://meet.google.com/abc-defg-hij",
      contenido: "Trabajaremos con arrays y sus métodos más importantes para manipular colecciones de datos.",
      objetivos: [
        "Usar métodos de arrays efectivamente",
        "Comprender las diferencias entre map, filter y reduce",
        "Resolver problemas prácticos con arrays"
      ],
      estado: "finalizada",
      orden: 3
    },
    {
      titulo: "Objetos en JavaScript",
      descripcion: "Creación y manipulación de objetos, destructuring",
      fecha: "2025-02-24",
      horaInicio: "14:00",
      horaFin: "16:00",
      tipo: "virtual",
      enlaceReunion: "https://meet.google.com/abc-defg-hij",
      contenido: "Profundizaremos en objetos, propiedades, métodos y técnicas modernas de JavaScript.",
      objetivos: [
        "Crear y manipular objetos complejos",
        "Usar destructuring y spread operator",
        "Trabajar con métodos de objetos"
      ],
      estado: "programada",
      orden: 4
    },
    {
      titulo: "DOM - Manipulación del Documento",
      descripcion: "Interacción con el DOM, eventos y manipulación de elementos",
      fecha: "2025-03-03",
      horaInicio: "14:00",
      horaFin: "16:00",
      tipo: "virtual",
      enlaceReunion: "https://meet.google.com/abc-defg-hij",
      contenido: "Aprenderemos a manipular el DOM para crear páginas web interactivas.",
      objetivos: [
        "Seleccionar elementos del DOM",
        "Modificar contenido y estilos dinámicamente",
        "Manejar eventos de usuario"
      ],
      estado: "programada",
      orden: 5
    }
  ],
  "REACT301": [
    {
      titulo: "Introducción a React",
      descripcion: "Conceptos fundamentales de React y JSX",
      fecha: "2025-03-03",
      horaInicio: "16:00",
      horaFin: "18:00",
      tipo: "virtual",
      enlaceReunion: "https://meet.google.com/xyz-abcd-efg",
      contenido: "Introducción a React, componentes, JSX y el virtual DOM.",
      objetivos: [
        "Comprender la arquitectura de React",
        "Crear componentes básicos",
        "Entender el concepto de JSX"
      ],
      estado: "programada",
      orden: 1
    },
    {
      titulo: "Componentes y Props",
      descripcion: "Componentes funcionales, props y composición",
      fecha: "2025-03-10",
      horaInicio: "16:00",
      horaFin: "18:00",
      tipo: "virtual",
      enlaceReunion: "https://meet.google.com/xyz-abcd-efg",
      contenido: "Profundizaremos en componentes funcionales y cómo pasar datos mediante props.",
      objetivos: [
        "Crear componentes reutilizables",
        "Pasar y recibir props correctamente",
        "Componer interfaces complejas"
      ],
      estado: "programada",
      orden: 2
    },
    {
      titulo: "State y useState Hook",
      descripcion: "Manejo de estado con useState",
      fecha: "2025-03-17",
      horaInicio: "16:00",
      horaFin: "18:00",
      tipo: "virtual",
      enlaceReunion: "https://meet.google.com/xyz-abcd-efg",
      contenido: "Aprenderemos a manejar el estado de los componentes con el hook useState.",
      objetivos: [
        "Comprender el concepto de estado",
        "Usar useState correctamente",
        "Actualizar el estado de forma efectiva"
      ],
      estado: "programada",
      orden: 3
    }
  ],
  "PY401": [
    {
      titulo: "Introducción a Python y NumPy",
      descripcion: "Fundamentos de Python para ciencia de datos",
      fecha: "2025-02-17",
      horaInicio: "10:00",
      horaFin: "12:00",
      tipo: "virtual",
      enlaceReunion: "https://meet.google.com/python-ds-001",
      contenido: "Introducción a Python, sintaxis básica y la librería NumPy para cálculos numéricos.",
      objetivos: [
        "Dominar la sintaxis básica de Python",
        "Trabajar con arrays de NumPy",
        "Realizar operaciones matemáticas eficientes"
      ],
      estado: "programada",
      orden: 1
    },
    {
      titulo: "Pandas - Análisis de Datos",
      descripcion: "Manipulación de DataFrames con Pandas",
      fecha: "2025-02-24",
      horaInicio: "10:00",
      horaFin: "12:00",
      tipo: "virtual",
      enlaceReunion: "https://meet.google.com/python-ds-001",
      contenido: "Trabajaremos con Pandas para cargar, limpiar y analizar conjuntos de datos.",
      objetivos: [
        "Crear y manipular DataFrames",
        "Limpiar datos sucios",
        "Realizar análisis exploratorio"
      ],
      estado: "programada",
      orden: 2
    }
  ],
  "WEB201": [
    {
      titulo: "HTML5 Semántico",
      descripcion: "Estructura semántica de documentos HTML5",
      fecha: "2025-01-20",
      horaInicio: "09:00",
      horaFin: "11:00",
      tipo: "presencial",
      enlaceReunion: "",
      contenido: "Aprenderemos las etiquetas semánticas de HTML5 y su importancia para SEO y accesibilidad.",
      objetivos: [
        "Usar etiquetas semánticas correctamente",
        "Estructurar documentos accesibles",
        "Mejorar el SEO mediante HTML semántico"
      ],
      estado: "finalizada",
      orden: 1
    },
    {
      titulo: "CSS3 - Selectores y Box Model",
      descripcion: "Selectores CSS y modelo de cajas",
      fecha: "2025-01-27",
      horaInicio: "09:00",
      horaFin: "11:00",
      tipo: "presencial",
      enlaceReunion: "",
      contenido: "Dominaremos los selectores CSS y entenderemos el modelo de cajas para un mejor control del diseño.",
      objetivos: [
        "Dominar selectores CSS avanzados",
        "Comprender el box model",
        "Aplicar margin, padding y border correctamente"
      ],
      estado: "finalizada",
      orden: 2
    },
    {
      titulo: "Flexbox Layout",
      descripcion: "Diseño flexible con Flexbox",
      fecha: "2025-02-03",
      horaInicio: "09:00",
      horaFin: "11:00",
      tipo: "presencial",
      enlaceReunion: "",
      contenido: "Aprenderemos a crear layouts flexibles y responsivos con Flexbox.",
      objetivos: [
        "Crear layouts con Flexbox",
        "Alinear elementos horizontal y verticalmente",
        "Diseñar interfaces responsivas"
      ],
      estado: "programada",
      orden: 3
    }
  ]
};

const seedClases = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    // Obtener todos los cursos
    const cursos = await Curso.find();
    
    if (cursos.length === 0) {
      console.log("❌ No hay cursos en la base de datos. Ejecuta seed-cursos.js primero.");
      process.exit(1);
    }

    console.log(`📚 Encontrados ${cursos.length} cursos`);

    // Opcional: Limpiar clases existentes
     await Clase.deleteMany({});
     console.log("🗑️ Clases anteriores eliminadas");

    let totalClasesCreadas = 0;

    // Para cada curso, agregar sus clases
    for (const curso of cursos) {
      const clasesParaEsteCurso = clasesTemplate[curso.codigo];
      
      if (clasesParaEsteCurso) {
        const clasesConCurso = clasesParaEsteCurso.map(clase => ({
          ...clase,
          curso: curso._id
        }));

        await Clase.insertMany(clasesConCurso);
        totalClasesCreadas += clasesConCurso.length;
        console.log(`✅ ${clasesConCurso.length} clases agregadas al curso: ${curso.titulo} (${curso.codigo})`);
      } else {
        console.log(`⚠️  No hay clases predefinidas para el curso: ${curso.titulo} (${curso.codigo})`);
      }
    }

    console.log(`\n🎉 Total: ${totalClasesCreadas} clases insertadas correctamente`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

seedClases();