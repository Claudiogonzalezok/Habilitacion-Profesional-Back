// backend/src/middlewares/uploadMiddleware.js
import multer from "multer";
import path from "path";
import fs from "fs";

// 🔥 Usar variable de entorno para el directorio
const uploadDir = process.env.UPLOAD_DIR || "./uploads";

// Crear directorio de uploads si no existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Crear subdirectorios
["tareas", "entregas", "materiales"].forEach(dir => {
  const fullPath = path.join(uploadDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "tareas";
    
    // Determinar carpeta según la ruta
    if (req.path.includes("/entregas") || req.baseUrl.includes("/entregas")) {
      folder = "entregas";
    } else if (req.path.includes("/materiales")) {
      folder = "materiales";
    }
    
    cb(null, path.join(uploadDir, folder));
  },
  filename: (req, file, cb) => {
    // Generar nombre único
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    
    // Sanitizar nombre de archivo
    const sanitizedName = nameWithoutExt
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);
    
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  // Extensiones permitidas
  const allowedExtensions = [
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".txt", ".csv", ".zip", ".rar",
    ".jpg", ".jpeg", ".png", ".gif", ".svg",
    ".mp4", ".avi", ".mov", ".mp3", ".wav"
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Formato de archivo no permitido: ${ext}`), false);
  }
};

// 🔥 Usar variable de entorno para el tamaño máximo
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 52428800; // 50MB por defecto

// Configuración de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: maxFileSize,
    files: 10 // Máximo 10 archivos por request
  }
});

// Middleware de manejo de errores de multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ 
        msg: `El archivo excede el tamaño máximo permitido (${(maxFileSize / 1048576).toFixed(0)}MB)` 
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ 
        msg: "Excediste el número máximo de archivos permitidos" 
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ 
        msg: "Campo de archivo no esperado" 
      });
    }
    return res.status(400).json({ msg: err.message });
  }
  
  if (err) {
    return res.status(400).json({ msg: err.message });
  }
  
  next();
};

export default upload;