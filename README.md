# 🔧 Aula Virtual - Backend

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io">
</p>

API REST para el sistema de gestión de aulas virtuales desarrollado con Node.js, Express y MongoDB.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Modelos de Datos](#-modelos-de-datos)
- [Autenticación](#-autenticación)
- [WebSockets](#-websockets)
- [Cron Jobs](#-cron-jobs)
- [Despliegue](#-despliegue)

---

## ✨ Características

- ✅ API RESTful completa
- ✅ Autenticación JWT con refresh tokens
- ✅ Sistema de roles (Admin, Docente, Alumno)
- ✅ WebSockets para notificaciones en tiempo real
- ✅ Cron jobs para tareas automatizadas
- ✅ Subida de archivos (local y Cloudinary)
- ✅ Envío de emails transaccionales
- ✅ Validación de datos con express-validator
- ✅ Manejo centralizado de errores
- ✅ CORS configurado para múltiples orígenes

---

## 📦 Requisitos

- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm >= 9.0.0

---

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/aula-virtual.git

# Navegar al directorio del backend
cd aula-virtual/backend

# Instalar dependencias
npm install
```

---

## ⚙️ Configuración

Crear un archivo `.env` en la raíz del directorio `backend`:

```env
# ===========================================
# SERVIDOR
# ===========================================
PORT=5000
NODE_ENV=development

# ===========================================
# BASE DE DATOS
# ===========================================
MONGO_URI=mongodb://localhost:27017/aula-virtual

# ===========================================
# JWT (JSON Web Tokens)
# ===========================================
JWT_SECRET=tu_clave_secreta_super_segura_cambiar_en_produccion
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# ===========================================
# EMAIL (Nodemailer)
# ===========================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=contraseña_de_aplicacion_gmail

# Para Gmail, usar contraseña de aplicación:
# https://myaccount.google.com/apppasswords

# ===========================================
# CLOUDINARY (Opcional - para imágenes)
# ===========================================
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# ===========================================
# FRONTEND URL
# ===========================================
FRONTEND_URL=http://localhost:5173

# URLs adicionales para CORS (separadas por coma)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js                 # Conexión a MongoDB
│   │   ├── cloudinary.js         # Configuración de Cloudinary
│   │   └── socket.js             # Configuración de Socket.io
│   │
│   ├── controllers/
│   │   ├── authController.js     # Autenticación
│   │   ├── usuarioController.js  # Gestión de usuarios
│   │   ├── cursoController.js    # Gestión de cursos
│   │   ├── claseController.js    # Gestión de clases
│   │   ├── tareaController.js    # Gestión de tareas
│   │   ├── examenController.js   # Gestión de exámenes
│   │   ├── notificacionController.js
│   │   ├── mensajeController.js
│   │   └── reporteController.js
│   │
│   ├── middlewares/
│   │   ├── auth.js               # Verificación de JWT
│   │   ├── roles.js              # Control de roles
│   │   ├── upload.js             # Manejo de archivos
│   │   └── errorHandler.js       # Manejo de errores
│   │
│   ├── models/
│   │   ├── Usuario.js
│   │   ├── Curso.js
│   │   ├── Clase.js
│   │   ├── Tarea.js
│   │   ├── Entrega.js
│   │   ├── Examen.js
│   │   ├── RespuestaExamen.js
│   │   ├── Notificacion.js
│   │   ├── Mensaje.js
│   │   └── ...
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── usuarioRoutes.js
│   │   ├── cursoRoutes.js
│   │   ├── claseRoutes.js
│   │   ├── tareaRoutes.js
│   │   ├── examenRoutes.js
│   │   └── ...
│   │
│   ├── services/
│   │   ├── cronService.js        # Tareas programadas
│   │   ├── emailService.js       # Envío de emails
│   │   └── notificacionService.js
│   │
│   └── utils/
│       ├── generateToken.js
│       ├── sendEmail.js
│       └── helpers.js
│
├── uploads/                      # Archivos subidos (local)
├── server.js                     # Punto de entrada
├── package.json
└── .env
```

---

## 🔌 API Endpoints

### Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/registro` | Registrar nuevo usuario | ❌ |
| POST | `/login` | Iniciar sesión | ❌ |
| GET | `/me` | Obtener usuario actual | ✅ |
| POST | `/verificar-email` | Verificar email con token | ❌ |
| POST | `/reenviar-verificacion` | Reenviar email de verificación | ❌ |
| POST | `/recuperar-password` | Solicitar recuperación | ❌ |
| POST | `/reset-password/:token` | Resetear contraseña | ❌ |
| PUT | `/cambiar-password` | Cambiar contraseña | ✅ |
| POST | `/logout` | Cerrar sesión | ✅ |

### Usuarios (`/api/usuarios`)

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/` | Listar usuarios | Admin |
| GET | `/:id` | Obtener usuario | Admin |
| POST | `/` | Crear usuario | Admin |
| PUT | `/:id` | Actualizar usuario | Admin |
| DELETE | `/:id` | Eliminar usuario | Admin |
| PUT | `/perfil` | Actualizar mi perfil | Todos |
| PUT | `/perfil/imagen` | Actualizar foto de perfil | Todos |

### Cursos (`/api/cursos`)

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/` | Listar cursos | Todos |
| GET | `/:id` | Obtener curso | Todos |
| POST | `/` | Crear curso | Admin |
| PUT | `/:id` | Actualizar curso | Admin |
| DELETE | `/:id` | Eliminar curso | Admin |
| GET | `/:id/alumnos` | Listar alumnos del curso | Admin/Docente |
| POST | `/:id/inscribir` | Inscribir alumno | Admin |
| DELETE | `/:id/desinscribir/:alumnoId` | Desinscribir alumno | Admin |

### Clases (`/api/clases`)

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/curso/:cursoId` | Clases de un curso | Todos |
| GET | `/:id` | Obtener clase | Todos |
| POST | `/` | Crear clase | Admin/Docente |
| PUT | `/:id` | Actualizar clase | Admin/Docente |
| DELETE | `/:id` | Eliminar clase | Admin/Docente |
| POST | `/sincronizar-estados` | Sincronizar estados | Admin/Docente |
| GET | `/proximas` | Clases próximas | Todos |
| POST | `/:id/asistencia` | Registrar asistencia | Docente |

### Tareas (`/api/tareas`)

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/` | Listar tareas | Todos |
| GET | `/curso/:cursoId` | Tareas de un curso | Todos |
| GET | `/:id` | Obtener tarea | Todos |
| POST | `/` | Crear tarea | Admin/Docente |
| PUT | `/:id` | Actualizar tarea | Admin/Docente |
| DELETE | `/:id` | Eliminar tarea | Admin/Docente |
| POST | `/:id/entregar` | Entregar tarea | Alumno |
| GET | `/:id/entregas` | Ver entregas | Admin/Docente |
| PUT | `/entregas/:entregaId/calificar` | Calificar entrega | Admin/Docente |

### Exámenes (`/api/examenes`)

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/` | Listar exámenes | Todos |
| GET | `/:id` | Obtener examen | Todos |
| POST | `/` | Crear examen | Admin/Docente |
| PUT | `/:id` | Actualizar examen | Admin/Docente |
| DELETE | `/:id` | Eliminar examen | Admin/Docente |
| POST | `/:id/iniciar` | Iniciar examen | Alumno |
| POST | `/:id/entregar` | Entregar examen | Alumno |
| GET | `/:id/respuestas` | Ver respuestas | Admin/Docente |
| PUT | `/respuestas/:id/calificar` | Calificar respuesta | Admin/Docente |
| GET | `/:id/estadisticas` | Estadísticas del examen | Admin/Docente |

### Notificaciones (`/api/notificaciones`)

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/` | Mis notificaciones | Todos |
| GET | `/no-leidas/count` | Contar no leídas | Todos |
| PUT | `/:id/leer` | Marcar como leída | Todos |
| PUT | `/leer-todas` | Marcar todas como leídas | Todos |
| DELETE | `/:id` | Eliminar notificación | Todos |

### Mensajes (`/api/mensajes`)

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/` | Listar conversaciones | Todos |
| GET | `/conversacion/:userId` | Mensajes con usuario | Todos |
| POST | `/` | Enviar mensaje | Todos |
| PUT | `/:id/leer` | Marcar como leído | Todos |

---

## 📊 Modelos de Datos

### Usuario
```javascript
{
  nombre: String,           // Requerido
  email: String,            // Único, requerido
  password: String,         // Encriptado con bcrypt
  rol: String,              // 'admin' | 'docente' | 'alumno'
  imagen: String,           // URL de la imagen
  verificado: Boolean,      // Email verificado
  tokenVerificacion: String,
  tokenRecuperacion: String,
  expiracionToken: Date,
  activo: Boolean,
  ultimoAcceso: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Curso
```javascript
{
  codigo: String,           // Único, requerido
  titulo: String,           // Requerido
  descripcion: String,
  docente: ObjectId,        // Ref: Usuario
  alumnos: [ObjectId],      // Ref: Usuario
  estado: String,           // 'activo' | 'inactivo' | 'finalizado'
  fechaInicio: Date,
  fechaFin: Date,
  imagen: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Clase
```javascript
{
  curso: ObjectId,          // Ref: Curso, requerido
  titulo: String,           // Requerido
  descripcion: String,
  fecha: Date,              // Requerido
  horaInicio: String,       // "HH:MM"
  horaFin: String,          // "HH:MM"
  tipo: String,             // 'virtual' | 'presencial'
  enlaceReunion: String,    // URL para clases virtuales
  ubicacion: String,        // Para clases presenciales
  estado: String,           // 'programada' | 'en_curso' | 'finalizada' | 'cancelada'
  materiales: [{
    nombre: String,
    url: String,
    tipo: String
  }],
  asistencia: [{
    alumno: ObjectId,
    presente: Boolean,
    fecha: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Examen
```javascript
{
  curso: ObjectId,          // Ref: Curso
  titulo: String,
  descripcion: String,
  preguntas: [{
    tipo: String,           // 'opcion_multiple' | 'verdadero_falso' | 'respuesta_corta' | 'desarrollo'
    enunciado: String,
    opciones: [String],     // Para opción múltiple
    respuestaCorrecta: Mixed,
    puntaje: Number
  }],
  tiempoLimite: Number,     // En minutos
  intentosPermitidos: Number,
  fechaDisponible: Date,
  fechaLimite: Date,
  estado: String,           // 'borrador' | 'publicado' | 'cerrado'
  mostrarResultados: Boolean,
  mezclarPreguntas: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 Autenticación

El sistema utiliza JWT (JSON Web Tokens) para la autenticación.

### Flujo de autenticación:

1. El usuario se registra o inicia sesión
2. El servidor genera un JWT con los datos del usuario
3. El token se envía en cada request en el header `Authorization`
4. El middleware `auth` verifica el token y adjunta el usuario a `req.usuario`

### Ejemplo de uso:

```javascript
// Header de autenticación
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Middleware de roles:

```javascript
// Verificar que sea admin
router.post('/usuarios', auth, esAdmin, crearUsuario);

// Verificar que sea docente o admin
router.post('/clases', auth, esDocenteOAdmin, crearClase);

// Verificar que sea alumno
router.post('/tareas/:id/entregar', auth, esAlumno, entregarTarea);
```

---

## 🔌 WebSockets

El servidor utiliza Socket.io para comunicación en tiempo real.

### Eventos del servidor:

```javascript
// Conexión
io.on('connection', (socket) => {
  // Unirse a sala personal
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
  });

  // Unirse a sala de curso
  socket.on('joinCourse', (courseId) => {
    socket.join(`course_${courseId}`);
  });
});

// Emitir notificación a usuario
io.to(`user_${userId}`).emit('nueva-notificacion', notificacion);

// Emitir a todos los alumnos de un curso
io.to(`course_${courseId}`).emit('nueva-tarea', tarea);
```

### Eventos disponibles:

| Evento | Descripción |
|--------|-------------|
| `nueva-notificacion` | Nueva notificación para el usuario |
| `nuevo-mensaje` | Nuevo mensaje recibido |
| `nueva-tarea` | Nueva tarea publicada en un curso |
| `nuevo-examen` | Nuevo examen disponible |
| `clase-iniciada` | Una clase ha comenzado |
| `clase-por-iniciar` | Recordatorio de clase próxima |

---

## ⏰ Cron Jobs

El sistema ejecuta tareas programadas automáticamente.

### Tareas configuradas:

```javascript
// Cada 5 minutos - Actualizar estados de clases
cron.schedule('*/5 * * * *', actualizarEstadosClases);

// Cada minuto (7am-11pm) - Actualización precisa durante horario de clases
cron.schedule('* 7-23 * * *', actualizarEstadosClases);

// 3:00 AM - Limpieza nocturna
cron.schedule('0 3 * * *', limpiezaNocturna);

// Cada hora - Verificar tareas vencidas
cron.schedule('0 * * * *', verificarTareasVencidas);
```

### Funciones de los cron jobs:

- **actualizarEstadosClases**: Cambia automáticamente el estado de las clases (programada → en_curso → finalizada)
- **limpiezaNocturna**: Limpia tokens expirados y datos temporales
- **verificarTareasVencidas**: Notifica sobre tareas no entregadas

---

## 🚀 Despliegue

### Render

1. Crear cuenta en [Render](https://render.com)
2. Nuevo > Web Service
3. Conectar repositorio de GitHub
4. Configurar:
   - **Name**: aula-virtual-api
   - **Region**: Oregon (US West)
   - **Branch**: main
   - **Root Directory**: backend
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Agregar variables de entorno
6. Deploy

### Variables de entorno en producción:

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=clave_muy_segura_produccion
FRONTEND_URL=https://tu-frontend.vercel.app
```

---

## 🧪 Testing

```bash
# Ejecutar tests (si están configurados)
npm test

# Ejecutar con coverage
npm run test:coverage
```

---

## 📝 Scripts

| Script | Descripción |
|--------|-------------|
| `npm start` | Inicia en producción |
| `npm run dev` | Inicia con nodemon (desarrollo) |
| `npm run seed` | Carga datos de prueba |
| `npm run seed:admin` | Crea usuario admin por defecto |

---

## 🐛 Solución de Problemas

### Error de conexión a MongoDB

```bash
# Verificar que MongoDB esté corriendo
mongod --version

# O usar MongoDB Atlas (cloud)
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/aula-virtual
```

### Error de CORS

```javascript
// Verificar FRONTEND_URL en .env
FRONTEND_URL=http://localhost:5173

// O agregar múltiples orígenes
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Error de JWT

```bash
# Verificar que JWT_SECRET esté configurado
JWT_SECRET=tu_clave_secreta
```

---

## 📄 Licencia

MIT License - ver [LICENSE](../LICENSE)

---

## 👨‍💻 Autor

**Claudio Gonzalez** - UTN-FRT

---

<p align="center">
  Desarrollado para Habilitación Profesional - UTN FRT
</p>
