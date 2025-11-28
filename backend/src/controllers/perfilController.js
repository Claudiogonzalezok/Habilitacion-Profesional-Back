// controllers/perfilController.js
import Usuario from "../models/Usuario.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// Directorio de uploads
const uploadDir = process.env.UPLOAD_DIR || "./uploads";

// Obtener perfil del usuario logueado
export const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id)
      .select("-password -refreshToken -resetPasswordToken -resetPasswordExpires -emailVerificationToken");

    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    res.json(usuario);
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ msg: "Error al obtener perfil" });
  }
};

// Actualizar perfil del usuario
export const actualizarPerfil = async (req, res) => {
  try {
    const { nombre, telefono, direccion, biografia, fechaNacimiento } = req.body;

    // Validar nombre
    if (nombre && nombre.trim().length < 2) {
      return res.status(400).json({ msg: "El nombre debe tener al menos 2 caracteres" });
    }

    const usuario = await Usuario.findById(req.usuario._id);

    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Actualizar campos permitidos
    if (nombre) usuario.nombre = nombre.trim();
    if (telefono !== undefined) usuario.telefono = telefono;
    if (direccion !== undefined) usuario.direccion = direccion;
    if (biografia !== undefined) usuario.biografia = biografia;
    if (fechaNacimiento !== undefined) usuario.fechaNacimiento = fechaNacimiento;

    await usuario.save();

    // Devolver usuario sin campos sensibles
    const usuarioActualizado = await Usuario.findById(usuario._id)
      .select("-password -refreshToken -resetPasswordToken -resetPasswordExpires -emailVerificationToken");

    res.json({
      msg: "Perfil actualizado correctamente",
      usuario: usuarioActualizado
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ msg: "Error al actualizar perfil" });
  }
};

// Cambiar contraseña
export const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNueva, confirmarPassword } = req.body;

    // Validaciones
    if (!passwordActual || !passwordNueva || !confirmarPassword) {
      return res.status(400).json({ msg: "Todos los campos son requeridos" });
    }

    if (passwordNueva !== confirmarPassword) {
      return res.status(400).json({ msg: "Las contraseñas nuevas no coinciden" });
    }

    if (passwordNueva.length < 6) {
      return res.status(400).json({ msg: "La contraseña debe tener al menos 6 caracteres" });
    }

    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(passwordNueva)) {
      return res.status(400).json({ msg: "La contraseña debe contener al menos una letra y un número" });
    }

    const usuario = await Usuario.findById(req.usuario._id);

    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Verificar contraseña actual
    const passwordValida = await bcrypt.compare(passwordActual, usuario.password);
    if (!passwordValida) {
      return res.status(400).json({ msg: "La contraseña actual es incorrecta" });
    }

    // Verificar que la nueva contraseña sea diferente
    const mismPassword = await bcrypt.compare(passwordNueva, usuario.password);
    if (mismPassword) {
      return res.status(400).json({ msg: "La nueva contraseña debe ser diferente a la actual" });
    }

    // Hashear y guardar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(passwordNueva, salt);
    
    // Invalidar refresh tokens existentes
    usuario.refreshToken = undefined;
    
    await usuario.save();

    res.json({ msg: "Contraseña actualizada correctamente. Por seguridad, vuelve a iniciar sesión." });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({ msg: "Error al cambiar contraseña" });
  }
};

// Subir imagen de perfil
export const subirImagenPerfil = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No se ha subido ninguna imagen" });
    }

    const usuario = await Usuario.findById(req.usuario._id);

    if (!usuario) {
      // Eliminar archivo subido si el usuario no existe
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Si ya tiene una imagen, eliminar la anterior (excepto si es la por defecto)
    if (usuario.imagen && !usuario.imagen.includes("default") && !usuario.imagen.includes("placeholder")) {
      const imagenAnterior = path.join(uploadDir, "perfiles", path.basename(usuario.imagen));
      if (fs.existsSync(imagenAnterior)) {
        fs.unlinkSync(imagenAnterior);
      }
    }

    // Guardar ruta de la nueva imagen
    const imagenUrl = `/uploads/perfiles/${req.file.filename}`;
    usuario.imagen = imagenUrl;
    await usuario.save();

    res.json({
      msg: "Imagen de perfil actualizada correctamente",
      imagen: imagenUrl
    });
  } catch (error) {
    console.error("Error al subir imagen:", error);
    // Eliminar archivo si hubo error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ msg: "Error al subir imagen de perfil" });
  }
};

// Eliminar imagen de perfil
export const eliminarImagenPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id);

    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Si tiene una imagen personalizada, eliminarla
    if (usuario.imagen && !usuario.imagen.includes("default") && !usuario.imagen.includes("placeholder")) {
      const imagenPath = path.join(uploadDir, "perfiles", path.basename(usuario.imagen));
      if (fs.existsSync(imagenPath)) {
        fs.unlinkSync(imagenPath);
      }
    }

    // Restablecer a imagen por defecto
    usuario.imagen = null;
    await usuario.save();

    res.json({ msg: "Imagen de perfil eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar imagen:", error);
    res.status(500).json({ msg: "Error al eliminar imagen de perfil" });
  }
};

// Obtener estadísticas del usuario (para mostrar en perfil)
export const obtenerEstadisticas = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;
    const rol = req.usuario.rol;

    let estadisticas = {};

    if (rol === "alumno") {
      // Importar modelos dinámicamente para evitar dependencias circulares
      const Curso = (await import("../models/Curso.js")).default;
      const Examen = (await import("../models/Examen.js")).default;
      const Entrega = (await import("../models/Entrega.js")).default;

      const cursosInscritos = await Curso.countDocuments({ alumnos: usuarioId });
      
      const cursos = await Curso.find({ alumnos: usuarioId }).select("_id");
      const cursosIds = cursos.map(c => c._id);

      const examenes = await Examen.find({ curso: { $in: cursosIds }, estado: "publicado" });
      let examenesRealizados = 0;
      let sumaNotas = 0;
      let conteoNotas = 0;

      examenes.forEach(examen => {
        const intentos = examen.intentos.filter(
          i => i.alumno.toString() === usuarioId.toString() && i.estado === "calificado"
        );
        if (intentos.length > 0) {
          examenesRealizados++;
          const mejorNota = Math.max(...intentos.map(i => parseFloat(i.porcentaje)));
          sumaNotas += mejorNota;
          conteoNotas++;
        }
      });

      const tareasEntregadas = await Entrega.countDocuments({
        alumno: usuarioId,
        estado: { $in: ["entregada", "calificada"] }
      });

      estadisticas = {
        cursosInscritos,
        examenesRealizados,
        tareasEntregadas,
        promedioGeneral: conteoNotas > 0 ? (sumaNotas / conteoNotas).toFixed(1) : null
      };
    } else if (rol === "docente") {
      const Curso = (await import("../models/Curso.js")).default;
      const Examen = (await import("../models/Examen.js")).default;
      const Tarea = (await import("../models/Tarea.js")).default;

      const cursosCreados = await Curso.countDocuments({ docente: usuarioId });
      const cursos = await Curso.find({ docente: usuarioId });
      const totalAlumnos = cursos.reduce((sum, c) => sum + (c.alumnos?.length || 0), 0);
      const examenesCreados = await Examen.countDocuments({ docente: usuarioId });
      const tareasCreadas = await Tarea.countDocuments({ docente: usuarioId });

      estadisticas = {
        cursosCreados,
        totalAlumnos,
        examenesCreados,
        tareasCreadas
      };
    } else if (rol === "admin") {
      const Curso = (await import("../models/Curso.js")).default;
      const Examen = (await import("../models/Examen.js")).default;

      const totalUsuarios = await Usuario.countDocuments();
      const totalCursos = await Curso.countDocuments();
      const totalExamenes = await Examen.countDocuments();
      const usuariosPorRol = await Usuario.aggregate([
        { $group: { _id: "$rol", count: { $sum: 1 } } }
      ]);

      estadisticas = {
        totalUsuarios,
        totalCursos,
        totalExamenes,
        usuariosPorRol: usuariosPorRol.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };
    }

    res.json(estadisticas);
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ msg: "Error al obtener estadísticas" });
  }
};

// Actualizar preferencias de notificaciones
export const actualizarPreferencias = async (req, res) => {
  try {
    const { notificacionesEmail, notificacionesPush, temaOscuro, idioma } = req.body;

    const usuario = await Usuario.findById(req.usuario._id);

    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Inicializar preferencias si no existen
    if (!usuario.preferencias) {
      usuario.preferencias = {};
    }

    // Actualizar preferencias
    if (notificacionesEmail !== undefined) usuario.preferencias.notificacionesEmail = notificacionesEmail;
    if (notificacionesPush !== undefined) usuario.preferencias.notificacionesPush = notificacionesPush;
    if (temaOscuro !== undefined) usuario.preferencias.temaOscuro = temaOscuro;
    if (idioma !== undefined) usuario.preferencias.idioma = idioma;

    await usuario.save();

    res.json({
      msg: "Preferencias actualizadas correctamente",
      preferencias: usuario.preferencias
    });
  } catch (error) {
    console.error("Error al actualizar preferencias:", error);
    res.status(500).json({ msg: "Error al actualizar preferencias" });
  }
};