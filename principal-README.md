# 🎓 Aula Virtual

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io">
</p>

<p align="center">
  <strong>Sistema de Gestión de Aulas Virtuales</strong><br>
  Plataforma educativa completa para la gestión de cursos, clases, tareas y exámenes online.
</p>

---

## 📋 Descripción

**Aula Virtual** es una plataforma educativa integral desarrollada con el stack MERN (MongoDB, Express, React, Node.js) que permite la gestión completa de cursos online, incluyendo:

- Gestión de usuarios con roles diferenciados (Administrador, Docente, Alumno)
- Administración de cursos y clases virtuales/presenciales
- Sistema de tareas con entregas y calificaciones
- Módulo de exámenes con múltiples tipos de preguntas
- Comunicación mediante mensajería y foros
- Notificaciones en tiempo real
- Reportes y estadísticas

## 🏗️ Arquitectura del Proyecto

```
aula-virtual/
├── backend/                 # API REST con Node.js y Express
│   ├── src/
│   │   ├── config/         # Configuraciones (DB, cloudinary, etc.)
│   │   ├── controllers/    # Controladores de la API
│   │   ├── middlewares/    # Middlewares de autenticación y validación
│   │   ├── models/         # Modelos de Mongoose
│   │   ├── routes/         # Rutas de la API
│   │   ├── services/       # Servicios (cron jobs, emails, etc.)
│   │   └── utils/          # Utilidades
│   └── server.js           # Punto de entrada del servidor
│
├── frontend/               # Aplicación React con Vite
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── context/        # Contextos de React (Auth, Socket)
│   │   ├── pages/          # Páginas de la aplicación
│   │   ├── services/       # Servicios y API calls
│   │   └── App.jsx         # Componente principal
│   └── index.html
│
└── README.md               # Este archivo
```

## ✨ Características Principales

### 👥 Gestión de Usuarios
- Registro con verificación por email
- Login con opción "Recordarme"
- Recuperación de contraseña
- Perfiles con foto personalizable
- Tres roles: Administrador, Docente, Alumno

### 📚 Gestión de Cursos
- Creación y administración de cursos
- Asignación de docentes
- Inscripción de alumnos (directa o por solicitud)
- Materiales y recursos por curso

### 📅 Clases Virtuales
- Programación de clases (virtuales/presenciales)
- Estados automáticos (programada, en curso, finalizada)
- Integración con plataformas de videoconferencia
- Registro de asistencia
- Notificaciones de clases próximas

### 📝 Tareas
- Creación de tareas con fecha límite
- Entrega de archivos por alumnos
- Sistema de calificación
- Filtros por curso y estado
- Notificaciones de vencimiento

### 📋 Exámenes
- Múltiples tipos de preguntas:
  - Opción múltiple
  - Verdadero/Falso
  - Respuesta corta
  - Desarrollo
- Tiempo límite configurable
- Calificación automática y manual
- Estadísticas por examen

### 💬 Comunicación
- Mensajería interna
- Foros por curso
- Notificaciones en tiempo real (Socket.io)
- Sistema de avisos

### 📊 Reportes
- Dashboard por rol
- Estadísticas de rendimiento
- Exportación de datos
- Gráficos interactivos

## 🚀 Instalación

### Prerrequisitos

- Node.js 18.x o superior
- MongoDB 6.x o superior
- npm o yarn

### Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/aula-virtual.git
cd aula-virtual
```

### Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env` en la carpeta `backend`:

```env
# Servidor
PORT=5000
NODE_ENV=development

# Base de datos
MONGO_URI=mongodb://localhost:27017/aula-virtual

# JWT
JWT_SECRET=tu_clave_secreta_muy_segura
JWT_EXPIRE=7d

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion

# Cloudinary (opcional - para imágenes)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Frontend URL (para CORS y emails)
FRONTEND_URL=http://localhost:5173
```

### Configurar Frontend

```bash
cd frontend
npm install
```

Crear archivo `.env` en la carpeta `frontend`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Ejecutar en desarrollo

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## 🧪 Scripts Disponibles

### Backend
| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor en modo desarrollo con nodemon |
| `npm start` | Inicia el servidor en modo producción |
| `npm run seed` | Carga datos de prueba en la base de datos |

### Frontend
| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo de Vite |
| `npm run build` | Genera la build de producción |
| `npm run preview` | Previsualiza la build de producción |
| `npm run lint` | Ejecuta el linter ESLint |

## 🌐 Despliegue

### Backend (Render)

1. Crear nuevo Web Service en Render
2. Conectar repositorio de GitHub
3. Configurar:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Agregar variables de entorno

### Frontend (Vercel)

1. Importar proyecto en Vercel
2. Configurar:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Agregar variables de entorno

## 📱 Capturas de Pantalla

<details>
<summary>Ver capturas</summary>

### Dashboard Alumno
![Dashboard Alumno](docs/screenshots/dashboard-alumno.png)

### Gestión de Cursos
![Cursos](docs/screenshots/cursos.png)

### Sistema de Exámenes
![Exámenes](docs/screenshots/examenes.png)

</details>

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **Socket.io** - Comunicación en tiempo real
- **JWT** - Autenticación
- **Nodemailer** - Envío de emails
- **Cloudinary** - Almacenamiento de imágenes
- **node-cron** - Tareas programadas
- **bcryptjs** - Encriptación de contraseñas
- **multer** - Manejo de archivos

### Frontend
- **React 18** - Biblioteca de UI
- **Vite** - Build tool
- **React Router DOM** - Navegación
- **React Bootstrap** - Componentes UI
- **Socket.io Client** - Cliente de websockets
- **React Toastify** - Notificaciones toast
- **React Icons** - Iconos
- **Axios** - Cliente HTTP
- **FullCalendar** - Calendario interactivo
- **Chart.js / Recharts** - Gráficos

## 👥 Roles y Permisos

| Funcionalidad | Admin | Docente | Alumno |
|---------------|:-----:|:-------:|:------:|
| Gestionar usuarios | ✅ | ❌ | ❌ |
| Crear cursos | ✅ | ❌ | ❌ |
| Asignar docentes | ✅ | ❌ | ❌ |
| Crear clases | ✅ | ✅ | ❌ |
| Crear tareas | ✅ | ✅ | ❌ |
| Crear exámenes | ✅ | ✅ | ❌ |
| Calificar | ✅ | ✅ | ❌ |
| Ver reportes | ✅ | ✅ | ❌ |
| Inscribirse a cursos | ❌ | ❌ | ✅ |
| Entregar tareas | ❌ | ❌ | ✅ |
| Realizar exámenes | ❌ | ❌ | ✅ |
| Ver notas | ❌ | ❌ | ✅ |

## 📄 API Endpoints

<details>
<summary>Ver endpoints principales</summary>

### Autenticación
```
POST   /api/auth/registro     - Registrar usuario
POST   /api/auth/login        - Iniciar sesión
POST   /api/auth/verificar    - Verificar email
POST   /api/auth/recuperar    - Solicitar recuperación
POST   /api/auth/reset        - Resetear contraseña
```

### Usuarios
```
GET    /api/usuarios          - Listar usuarios (admin)
GET    /api/usuarios/:id      - Obtener usuario
PUT    /api/usuarios/:id      - Actualizar usuario
DELETE /api/usuarios/:id      - Eliminar usuario
```

### Cursos
```
GET    /api/cursos            - Listar cursos
POST   /api/cursos            - Crear curso
GET    /api/cursos/:id        - Obtener curso
PUT    /api/cursos/:id        - Actualizar curso
DELETE /api/cursos/:id        - Eliminar curso
```

### Clases
```
GET    /api/clases/curso/:id  - Clases de un curso
POST   /api/clases            - Crear clase
PUT    /api/clases/:id        - Actualizar clase
DELETE /api/clases/:id        - Eliminar clase
POST   /api/clases/sincronizar-estados - Sincronizar estados
```

### Tareas
```
GET    /api/tareas            - Listar tareas
POST   /api/tareas            - Crear tarea
GET    /api/tareas/:id        - Obtener tarea
PUT    /api/tareas/:id        - Actualizar tarea
POST   /api/tareas/:id/entregar - Entregar tarea
```

### Exámenes
```
GET    /api/examenes          - Listar exámenes
POST   /api/examenes          - Crear examen
GET    /api/examenes/:id      - Obtener examen
POST   /api/examenes/:id/iniciar - Iniciar examen
POST   /api/examenes/:id/entregar - Entregar examen
```

</details>

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autores

- **Claudio** - *Desarrollo Full Stack* - [GitHub](https://github.com/tu-usuario)
- **Nestor Molina** - *Colaborador* - [GitHub](https://github.com/nestor-molina)

## 🎓 Contexto Académico

Este proyecto fue desarrollado como trabajo final para la materia **Habilitación Profesional** en la **Universidad Tecnológica Nacional - Facultad Regional Tucumán (UTN-FRT)**.

**Profesor:** Rodriguez

---

<p align="center">
  Hecho con ❤️ en Tucumán, Argentina
</p>
