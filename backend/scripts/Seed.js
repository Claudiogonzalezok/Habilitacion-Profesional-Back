// backend/scripts/seed.js
// Ejecutar con: node scripts/seed.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde el directorio raíz del backend
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Importar modelos
import Usuario from "../src/models/Usuario.js";
import Curso from "../src/models/Curso.js";
import Clase from "../src/models/Clase.js";
import Examen from "../src/models/Examen.js";
import Tarea from "../src/models/Tarea.js";

// ============================================
// CONFIGURACIÓN
// ============================================
const CONFIG = {
  LIMPIAR_DB: true, // ⚠️ En true borra todo antes de insertar
  PASSWORD_DEFAULT: "123456",
  CANTIDAD_ALUMNOS: 10,
  CURSOS: 3,
  CLASES_POR_CURSO: 8,
  EXAMENES_POR_CURSO: 2,
  TAREAS_POR_CURSO: 3,
};

// ============================================
// DATOS DE PRUEBA
// ============================================

const USUARIOS = {
  admin: {
    nombre: "Administrador Sistema",
    email: "admin@aulavirtual.com",
    rol: "admin",
  },
  docentes: [
    { nombre: "Prof. María García", email: "maria.garcia@aulavirtual.com" },
    { nombre: "Prof. Carlos López", email: "carlos.lopez@aulavirtual.com" },
    { nombre: "Prof. Ana Rodríguez", email: "ana.rodriguez@aulavirtual.com" },
  ],
  alumnos: [
    { nombre: "Juan Pérez", email: "juan.perez@alumno.com" },
    { nombre: "Laura Fernández", email: "laura.fernandez@alumno.com" },
    { nombre: "Martín González", email: "martin.gonzalez@alumno.com" },
    { nombre: "Sofía Ramírez", email: "sofia.ramirez@alumno.com" },
    { nombre: "Diego Torres", email: "diego.torres@alumno.com" },
    { nombre: "Valentina Díaz", email: "valentina.diaz@alumno.com" },
    { nombre: "Lucas Morales", email: "lucas.morales@alumno.com" },
    { nombre: "Camila Ruiz", email: "camila.ruiz@alumno.com" },
    { nombre: "Nicolás Castro", email: "nicolas.castro@alumno.com" },
    { nombre: "Isabella Vargas", email: "isabella.vargas@alumno.com" },
  ],
};

const CURSOS_DATA = [
  {
    titulo: "Programación Web Full Stack",
    descripcion: "Aprende desarrollo web completo con React, Node.js y MongoDB. Incluye proyectos prácticos y despliegue en la nube.",
    codigo: "PWFS-2024",
    categoria: "Programación",
    duracionHoras: 120,
    imagen: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400",
  },
  {
    titulo: "Base de Datos Avanzadas",
    descripcion: "Diseño, optimización y administración de bases de datos SQL y NoSQL. MongoDB, PostgreSQL y Redis.",
    codigo: "BDA-2024",
    categoria: "Bases de Datos",
    duracionHoras: 80,
    imagen: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400",
  },
  {
    titulo: "Desarrollo Mobile con React Native",
    descripcion: "Crea aplicaciones móviles multiplataforma para iOS y Android usando React Native y Expo.",
    codigo: "DMRN-2024",
    categoria: "Mobile",
    duracionHoras: 100,
    imagen: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400",
  },
];

const CLASES_TEMPLATES = [
  {
    titulo: "Introducción y Configuración del Entorno",
    descripcion: "Instalación de herramientas necesarias y configuración del ambiente de desarrollo.",
    contenido: "En esta clase configuraremos todo el entorno necesario para el curso.",
    objetivos: ["Instalar las herramientas necesarias", "Configurar el IDE", "Crear el primer proyecto"],
  },
  {
    titulo: "Fundamentos y Conceptos Básicos",
    descripcion: "Repaso de conceptos fundamentales necesarios para el curso.",
    contenido: "Estudiaremos los conceptos teóricos básicos que aplicaremos en las próximas clases.",
    objetivos: ["Comprender los fundamentos", "Identificar casos de uso", "Aplicar conceptos básicos"],
  },
  {
    titulo: "Práctica Guiada I",
    descripcion: "Primera sesión práctica con ejercicios guiados.",
    contenido: "Realizaremos ejercicios prácticos paso a paso.",
    objetivos: ["Aplicar conocimientos teóricos", "Resolver ejercicios", "Identificar errores comunes"],
  },
  {
    titulo: "Desarrollo de Proyecto - Parte 1",
    descripcion: "Inicio del proyecto integrador del módulo.",
    contenido: "Comenzaremos a desarrollar el proyecto integrador.",
    objetivos: ["Planificar el proyecto", "Crear estructura base", "Implementar funcionalidades básicas"],
  },
  {
    titulo: "Técnicas Avanzadas",
    descripcion: "Exploración de técnicas y patrones avanzados.",
    contenido: "Profundizaremos en técnicas más complejas.",
    objetivos: ["Implementar patrones avanzados", "Optimizar código", "Aplicar mejores prácticas"],
  },
  {
    titulo: "Desarrollo de Proyecto - Parte 2",
    descripcion: "Continuación del proyecto integrador.",
    contenido: "Seguiremos desarrollando funcionalidades del proyecto.",
    objetivos: ["Implementar features adicionales", "Integrar componentes", "Realizar testing"],
  },
  {
    titulo: "Debugging y Optimización",
    descripcion: "Técnicas de depuración y mejora de rendimiento.",
    contenido: "Aprenderemos a encontrar y solucionar errores, y optimizar el rendimiento.",
    objetivos: ["Usar herramientas de debugging", "Identificar cuellos de botella", "Aplicar optimizaciones"],
  },
  {
    titulo: "Presentación Final y Cierre",
    descripcion: "Presentación de proyectos y conclusiones del módulo.",
    contenido: "Cada alumno presentará su proyecto y recibirá retroalimentación.",
    objetivos: ["Presentar proyecto", "Recibir feedback", "Identificar áreas de mejora"],
  },
];

const EXAMENES_TEMPLATES = [
  {
    titulo: "Evaluación Parcial",
    descripcion: "Evaluación de los conceptos vistos en la primera mitad del curso.",
    configuracion: {
      duracionMinutos: 45,
      intentosPermitidos: 2,
      mostrarRespuestas: true,
      mezclarPreguntas: true,
      mezclarOpciones: true,
      notaAprobacion: 60,
    },
    preguntas: [
      {
        tipo: "multiple",
        pregunta: "¿Cuál es el propósito principal de usar un control de versiones?",
        opciones: [
          { texto: "Hacer backups del código", esCorrecta: false },
          { texto: "Rastrear cambios y colaborar en equipo", esCorrecta: true },
          { texto: "Compilar el código más rápido", esCorrecta: false },
          { texto: "Reducir el tamaño del proyecto", esCorrecta: false },
        ],
        puntaje: 2,
      },
      {
        tipo: "multiple",
        pregunta: "¿Qué comando se usa para crear una nueva rama en Git?",
        opciones: [
          { texto: "git new branch", esCorrecta: false },
          { texto: "git branch nombre", esCorrecta: true },
          { texto: "git create branch", esCorrecta: false },
          { texto: "git add branch", esCorrecta: false },
        ],
        puntaje: 2,
      },
      {
        tipo: "verdadero_falso",
        pregunta: "En programación orientada a objetos, la herencia permite reutilizar código.",
        respuestaCorrecta: "verdadero",
        puntaje: 1,
      },
      {
        tipo: "verdadero_falso",
        pregunta: "JavaScript es un lenguaje de programación compilado.",
        respuestaCorrecta: "falso",
        puntaje: 1,
      },
      {
        tipo: "corta",
        pregunta: "¿Qué significa la sigla API?",
        puntaje: 2,
      },
      {
        tipo: "desarrollo",
        pregunta: "Explica brevemente la diferencia entre let, const y var en JavaScript.",
        puntaje: 4,
      },
    ],
  },
  {
    titulo: "Evaluación Final",
    descripcion: "Evaluación integradora de todos los contenidos del curso.",
    configuracion: {
      duracionMinutos: 90,
      intentosPermitidos: 1,
      mostrarRespuestas: false,
      mezclarPreguntas: true,
      mezclarOpciones: true,
      notaAprobacion: 60,
    },
    preguntas: [
      {
        tipo: "multiple",
        pregunta: "¿Cuál es la principal ventaja de usar una base de datos NoSQL?",
        opciones: [
          { texto: "Mejor integridad referencial", esCorrecta: false },
          { texto: "Escalabilidad horizontal y flexibilidad de esquema", esCorrecta: true },
          { texto: "Soporte para transacciones ACID", esCorrecta: false },
          { texto: "Menor uso de memoria", esCorrecta: false },
        ],
        puntaje: 2,
      },
      {
        tipo: "multiple",
        pregunta: "¿Qué patrón de diseño se utiliza para crear una única instancia de una clase?",
        opciones: [
          { texto: "Factory", esCorrecta: false },
          { texto: "Observer", esCorrecta: false },
          { texto: "Singleton", esCorrecta: true },
          { texto: "Strategy", esCorrecta: false },
        ],
        puntaje: 2,
      },
      {
        tipo: "multiple",
        pregunta: "En el modelo MVC, ¿cuál componente maneja la lógica de negocio?",
        opciones: [
          { texto: "Model", esCorrecta: true },
          { texto: "View", esCorrecta: false },
          { texto: "Controller", esCorrecta: false },
          { texto: "Router", esCorrecta: false },
        ],
        puntaje: 2,
      },
      {
        tipo: "verdadero_falso",
        pregunta: "REST es un protocolo de comunicación.",
        respuestaCorrecta: "falso",
        puntaje: 1,
      },
      {
        tipo: "verdadero_falso",
        pregunta: "MongoDB almacena datos en formato BSON.",
        respuestaCorrecta: "verdadero",
        puntaje: 1,
      },
      {
        tipo: "corta",
        pregunta: "¿Qué puerto usa por defecto MongoDB?",
        puntaje: 1,
      },
      {
        tipo: "corta",
        pregunta: "¿Qué significa CRUD?",
        puntaje: 2,
      },
      {
        tipo: "desarrollo",
        pregunta: "Describe el flujo completo de una petición HTTP desde el cliente hasta la base de datos en una aplicación MERN.",
        puntaje: 5,
      },
      {
        tipo: "desarrollo",
        pregunta: "Explica las diferencias entre autenticación y autorización, y menciona un ejemplo de implementación de cada una.",
        puntaje: 4,
      },
    ],
  },
];

const TAREAS_TEMPLATES = [
  {
    titulo: "Ejercicio Práctico: Configuración Inicial",
    descripcion: "Configura tu entorno de desarrollo y sube capturas de pantalla mostrando las herramientas instaladas.",
    instrucciones: `
      1. Instala todas las herramientas indicadas en clase
      2. Crea un proyecto de prueba
      3. Sube capturas mostrando:
         - Terminal con versiones instaladas
         - IDE configurado
         - Proyecto ejecutándose
    `,
    puntajeMaximo: 10,
    tipoEntrega: "archivo",
    formatosPermitidos: ["pdf", "png", "jpg", "zip"],
  },
  {
    titulo: "Trabajo Práctico: Proyecto Mini",
    descripcion: "Desarrolla una pequeña aplicación aplicando los conceptos vistos en clase.",
    instrucciones: `
      Desarrolla una aplicación que incluya:
      - Al menos 3 componentes
      - Manejo de estado
      - Consumo de una API
      - Estilos personalizados
      
      Entrega el código fuente en un archivo ZIP.
    `,
    puntajeMaximo: 25,
    tipoEntrega: "archivo",
    formatosPermitidos: ["zip", "rar"],
    rubrica: [
      { criterio: "Funcionalidad", descripcion: "La aplicación funciona correctamente", puntajeMaximo: 10 },
      { criterio: "Código limpio", descripcion: "Código bien organizado y comentado", puntajeMaximo: 5 },
      { criterio: "Diseño", descripcion: "Interfaz agradable y usable", puntajeMaximo: 5 },
      { criterio: "Buenas prácticas", descripcion: "Aplica patrones y convenciones", puntajeMaximo: 5 },
    ],
  },
  {
    titulo: "Informe de Investigación",
    descripcion: "Investiga y redacta un informe sobre una tecnología relacionada con el curso.",
    instrucciones: `
      Elige uno de los siguientes temas:
      - Microservicios vs Monolitos
      - GraphQL vs REST
      - Contenedores y Docker
      - CI/CD y DevOps
      
      El informe debe tener:
      - Mínimo 1500 palabras
      - Introducción, desarrollo y conclusión
      - Al menos 5 fuentes bibliográficas
    `,
    puntajeMaximo: 15,
    tipoEntrega: "archivo",
    formatosPermitidos: ["pdf", "docx"],
  },
];

// ============================================
// FUNCIONES AUXILIARES
// ============================================

// Generar fecha relativa a hoy
const fechaRelativa = (dias, horas = 0, minutos = 0) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  fecha.setHours(horas, minutos, 0, 0);
  return fecha;
};

// Generar fecha para clases (solo fecha, sin hora - se guarda como UTC midnight)
const fechaClase = (dias) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  fecha.setHours(0, 0, 0, 0);
  return fecha;
};

// Hashear password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Seleccionar elementos aleatorios de un array
const seleccionarAleatorios = (array, cantidad) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, cantidad);
};

// ============================================
// FUNCIONES DE CREACIÓN
// ============================================

async function crearUsuarios() {
  console.log("\n👤 Creando usuarios...");
  const passwordHash = await hashPassword(CONFIG.PASSWORD_DEFAULT);
  
  const usuarios = {
    admin: null,
    docentes: [],
    alumnos: [],
  };

  // Crear admin
  usuarios.admin = await Usuario.create({
    ...USUARIOS.admin,
    password: passwordHash,
    emailVerificado: true,
  });
  console.log(`   ✅ Admin: ${usuarios.admin.email}`);

  // Crear docentes
  for (const docente of USUARIOS.docentes) {
    const nuevoDocente = await Usuario.create({
      ...docente,
      rol: "docente",
      password: passwordHash,
      emailVerificado: true,
    });
    usuarios.docentes.push(nuevoDocente);
    console.log(`   ✅ Docente: ${nuevoDocente.email}`);
  }

  // Crear alumnos
  for (const alumno of USUARIOS.alumnos.slice(0, CONFIG.CANTIDAD_ALUMNOS)) {
    const nuevoAlumno = await Usuario.create({
      ...alumno,
      rol: "alumno",
      password: passwordHash,
      emailVerificado: true,
    });
    usuarios.alumnos.push(nuevoAlumno);
    console.log(`   ✅ Alumno: ${nuevoAlumno.email}`);
  }

  return usuarios;
}

async function crearCursos(usuarios) {
  console.log("\n📚 Creando cursos...");
  const cursos = [];

  for (let i = 0; i < Math.min(CONFIG.CURSOS, CURSOS_DATA.length); i++) {
    const cursoData = CURSOS_DATA[i];
    const docente = usuarios.docentes[i % usuarios.docentes.length];
    
    // Asignar 5-8 alumnos aleatorios al curso
    const alumnosDelCurso = seleccionarAleatorios(
      usuarios.alumnos, 
      Math.floor(Math.random() * 4) + 5
    );

    const curso = await Curso.create({
      ...cursoData,
      docente: docente._id,
      alumnos: alumnosDelCurso.map(a => a._id),
      fechaInicio: fechaRelativa(-30),
      fechaFin: fechaRelativa(60),
      estado: "activo",
    });

    cursos.push(curso);
    console.log(`   ✅ Curso: ${curso.codigo} - ${curso.titulo} (${alumnosDelCurso.length} alumnos)`);
  }

  return cursos;
}

async function crearClases(cursos) {
  console.log("\n📅 Creando clases...");
  const clases = [];
  const tiposClase = ["virtual", "presencial", "hibrida"];

  for (const curso of cursos) {
    console.log(`   📖 Curso: ${curso.codigo}`);
    
    for (let i = 0; i < Math.min(CONFIG.CLASES_POR_CURSO, CLASES_TEMPLATES.length); i++) {
      const template = CLASES_TEMPLATES[i];
      
      // Distribuir clases: algunas pasadas, una hoy, otras futuras
      let diasOffset;
      if (i < 3) {
        diasOffset = -14 + (i * 7); // Pasadas: -14, -7, 0
      } else if (i === 3) {
        diasOffset = 0; // Hoy
      } else {
        diasOffset = (i - 3) * 7; // Futuras: 7, 14, 21, 28
      }

      // Horarios variados
      const horaInicio = 9 + (i % 3) * 3; // 9:00, 12:00, 15:00
      
      const clase = await Clase.create({
        ...template,
        titulo: `Clase ${i + 1}: ${template.titulo}`,
        curso: curso._id,
        fecha: fechaClase(diasOffset),
        horaInicio: `${String(horaInicio).padStart(2, "0")}:00`,
        horaFin: `${String(horaInicio + 2).padStart(2, "0")}:00`,
        tipo: tiposClase[i % 3],
        enlaceReunion: tiposClase[i % 3] !== "presencial" 
          ? `https://meet.example.com/${curso.codigo.toLowerCase()}-clase-${i + 1}` 
          : "",
        orden: i + 1,
        materiales: i < 3 ? [
          {
            nombre: `Material Clase ${i + 1}.pdf`,
            tipo: "documento",
            url: `https://example.com/materiales/${curso.codigo}/clase-${i + 1}.pdf`,
            descripcion: "Material de lectura para la clase",
          }
        ] : [],
      });

      clases.push(clase);
      
      const estadoIcon = diasOffset < 0 ? "✓" : diasOffset === 0 ? "▶" : "○";
      console.log(`      ${estadoIcon} ${clase.titulo} (${clase.fecha.toLocaleDateString()})`);
    }
  }

  return clases;
}

async function crearExamenes(cursos, usuarios) {
  console.log("\n📝 Creando exámenes...");
  const examenes = [];

  for (const curso of cursos) {
    console.log(`   📖 Curso: ${curso.codigo}`);
    
    for (let i = 0; i < Math.min(CONFIG.EXAMENES_POR_CURSO, EXAMENES_TEMPLATES.length); i++) {
      const template = EXAMENES_TEMPLATES[i];
      
      // Calcular fechas: parcial ya disponible, final próximamente
      let fechaApertura, fechaCierre, estado;
      
      if (i === 0) {
        // Parcial: ya abierto, cierra en 7 días
        fechaApertura = fechaRelativa(-3, 8, 0);
        fechaCierre = fechaRelativa(7, 23, 59);
        estado = "publicado";
      } else {
        // Final: abre en 14 días
        fechaApertura = fechaRelativa(14, 8, 0);
        fechaCierre = fechaRelativa(21, 23, 59);
        estado = "publicado";
      }

      // Calcular puntaje total
      const puntajeTotal = template.preguntas.reduce((sum, p) => sum + p.puntaje, 0);

      const examen = await Examen.create({
        titulo: `${template.titulo} - ${curso.codigo}`,
        descripcion: template.descripcion,
        curso: curso._id,
        docente: curso.docente,
        preguntas: template.preguntas.map((p, idx) => ({ ...p, orden: idx + 1 })),
        configuracion: template.configuracion,
        fechaApertura,
        fechaCierre,
        puntajeTotal,
        estado,
      });

      examenes.push(examen);
      console.log(`      ✅ ${examen.titulo} (${estado})`);
    }
  }

  return examenes;
}

async function crearTareas(cursos, clases) {
  console.log("\n📋 Creando tareas...");
  const tareas = [];

  for (const curso of cursos) {
    console.log(`   📖 Curso: ${curso.codigo}`);
    const clasesDelCurso = clases.filter(c => c.curso.toString() === curso._id.toString());
    
    for (let i = 0; i < Math.min(CONFIG.TAREAS_POR_CURSO, TAREAS_TEMPLATES.length); i++) {
      const template = TAREAS_TEMPLATES[i];
      
      // Asociar algunas tareas a clases específicas
      const claseAsociada = i < clasesDelCurso.length ? clasesDelCurso[i] : null;
      
      // Fechas: primera vencida, segunda abierta, tercera futura
      let fechaApertura, fechaCierre;
      
      if (i === 0) {
        // Ya vencida
        fechaApertura = fechaRelativa(-14, 0, 0);
        fechaCierre = fechaRelativa(-2, 23, 59);
      } else if (i === 1) {
        // Abierta actualmente
        fechaApertura = fechaRelativa(-5, 0, 0);
        fechaCierre = fechaRelativa(10, 23, 59);
      } else {
        // Futura
        fechaApertura = fechaRelativa(7, 0, 0);
        fechaCierre = fechaRelativa(21, 23, 59);
      }

      const tarea = await Tarea.create({
        ...template,
        titulo: `${template.titulo} - ${curso.codigo}`,
        curso: curso._id,
        clase: claseAsociada?._id || null,
        docente: curso.docente,
        fechaApertura,
        fechaCierre,
        publicada: true,
        permitirEntregasTarde: i === 0, // Solo la primera permite entregas tarde
        penalizacionTarde: 10,
      });

      tareas.push(tarea);
      
      const estadoIcon = new Date() > fechaCierre ? "⏰" : new Date() >= fechaApertura ? "📬" : "📅";
      console.log(`      ${estadoIcon} ${tarea.titulo}`);
    }
  }

  return tareas;
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function seed() {
  console.log("🌱 ========================================");
  console.log("   SEED - Aula Virtual");
  console.log("   ========================================\n");

  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error("MONGO_URI no está definido en .env");
    }
    
    console.log(`📦 Conectando a MongoDB...`);
    console.log(`   URI: ${mongoUri.replace(/\/\/.*:.*@/, "//***:***@")}`);
    
    await mongoose.connect(mongoUri);
    console.log("   ✅ Conectado!\n");

    // Limpiar base de datos si está configurado
    if (CONFIG.LIMPIAR_DB) {
      console.log("🗑️  Limpiando base de datos...");
      await Promise.all([
        Usuario.deleteMany({}),
        Curso.deleteMany({}),
        Clase.deleteMany({}),
        Examen.deleteMany({}),
        Tarea.deleteMany({}),
      ]);
      console.log("   ✅ Base de datos limpiada!\n");
    }

    // Crear datos
    const usuarios = await crearUsuarios();
    const cursos = await crearCursos(usuarios);
    const clases = await crearClases(cursos);
    const examenes = await crearExamenes(cursos, usuarios);
    const tareas = await crearTareas(cursos, clases);

    // Resumen
    console.log("\n📊 ========================================");
    console.log("   RESUMEN");
    console.log("   ========================================");
    console.log(`   👤 Usuarios: ${1 + usuarios.docentes.length + usuarios.alumnos.length}`);
    console.log(`      - 1 Admin`);
    console.log(`      - ${usuarios.docentes.length} Docentes`);
    console.log(`      - ${usuarios.alumnos.length} Alumnos`);
    console.log(`   📚 Cursos: ${cursos.length}`);
    console.log(`   📅 Clases: ${clases.length}`);
    console.log(`   📝 Exámenes: ${examenes.length}`);
    console.log(`   📋 Tareas: ${tareas.length}`);
    
    console.log("\n🔐 ========================================");
    console.log("   CREDENCIALES DE ACCESO");
    console.log("   ========================================");
    console.log(`   Password para todos: ${CONFIG.PASSWORD_DEFAULT}`);
    console.log(`   `);
    console.log(`   Admin:   ${usuarios.admin.email}`);
    console.log(`   Docente: ${usuarios.docentes[0].email}`);
    console.log(`   Alumno:  ${usuarios.alumnos[0].email}`);
    
    console.log("\n✅ Seed completado exitosamente!\n");

  } catch (error) {
    console.error("\n❌ Error durante el seed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("📦 Desconectado de MongoDB\n");
  }
}

// Ejecutar
seed();

