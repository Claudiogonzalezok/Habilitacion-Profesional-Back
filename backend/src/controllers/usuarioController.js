// controllers/usuarioController.js
import Usuario from "../models/Usuario.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { 
  enviarEmailRecuperacion, 
  enviarEmailConfirmacionCambio,
  enviarEmailVerificacion,
  enviarEmailBienvenida,
  enviarEmailCredenciales
} from "../services/emailService.js";

// 🔧 UTILIDADES PARA TOKENS
const generarAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRATION || "15m",
  });
};

const generarRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION || "30d",
  });
};

// 🔧 VALIDACIÓN DE EMAIL
const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// 🔧 VALIDACIÓN DE CONTRASEÑA SEGURA
const validarPassword = (password) => {
  if (password.length < 6) {
    return { valido: false, mensaje: "La contraseña debe tener al menos 6 caracteres" };
  }
  if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
    return { valido: false, mensaje: "La contraseña debe contener al menos una letra y un número" };
  }
  return { valido: true };
};

// ✅ REGISTRO MEJORADO CON VERIFICACIÓN DE EMAIL
export const registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // Validación de campos vacíos
    if (!nombre || !email || !password) {
      return res.status(400).json({ 
        msg: "Por favor, completa todos los campos obligatorios",
        campo: !nombre ? "nombre" : !email ? "email" : "password"
      });
    }

    // Validación de email
    if (!validarEmail(email)) {
      return res.status(400).json({ 
        msg: "Por favor, ingresa un email válido",
        campo: "email"
      });
    }

    // Validación de contraseña
    const passwordValidacion = validarPassword(password);
    if (!passwordValidacion.valido) {
      return res.status(400).json({ 
        msg: passwordValidacion.mensaje,
        campo: "password"
      });
    }

    // Verificar si el email ya existe
    const existe = await Usuario.findOne({ email: email.toLowerCase() });
    if (existe) {
      return res.status(400).json({ 
        msg: "Este email ya está registrado. ¿Olvidaste tu contraseña?",
        campo: "email"
      });
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // 🆕 Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

    // 🆕 Crear usuario con email NO verificado
    const usuario = new Usuario({ 
      nombre, 
      email: email.toLowerCase(), 
      password: hash, 
      rol: rol || "alumno",
      emailVerificado: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: Date.now() + 86400000 // 24 horas
    });
    
    await usuario.save();

    // 🆕 Enviar email de verificación
    try {
      await enviarEmailVerificacion(usuario.email, usuario.nombre, verificationToken);
      
      res.status(201).json({ 
        msg: "¡Registro exitoso! Por favor, verifica tu email para activar tu cuenta. Revisa tu bandeja de entrada y spam.",
        requiresVerification: true,
        usuario: {
          _id: usuario._id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol
        }
      });
    } catch (emailError) {
      console.error("Error al enviar email de verificación:", emailError);
      // Si falla el envío del email, eliminar el usuario creado
      await Usuario.findByIdAndDelete(usuario._id);
      
      return res.status(500).json({ 
        msg: "No se pudo enviar el email de verificación. Por favor, intenta registrarte nuevamente." 
      });
    }
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ msg: "Error en el servidor. Por favor, intenta nuevamente." });
  }
};

// 🆕 VERIFICAR EMAIL (simplificado)
export const verificarEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Hash del token recibido
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Buscar usuario con token válido y no expirado
    const usuario = await Usuario.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!usuario) {
      return res.status(400).json({ 
        msg: "El enlace de verificación es inválido o ha expirado. Por favor, solicita un nuevo enlace." 
      });
    }

    // Verificar email (la contraseña ya está guardada)
    usuario.emailVerificado = true;
    usuario.emailVerificationToken = undefined;
    usuario.emailVerificationExpires = undefined;
    await usuario.save();

    // Enviar email de bienvenida
    await enviarEmailBienvenida(usuario.email, usuario.nombre);

    res.json({ 
      msg: "¡Email verificado exitosamente! Ya puedes iniciar sesión con las credenciales que te enviamos.",
      emailVerificado: true
    });
  } catch (error) {
    console.error("Error al verificar email:", error);
    res.status(500).json({ msg: "Error en el servidor. Por favor, intenta nuevamente." });
  }
};

// 🆕 REENVIAR EMAIL DE VERIFICACIÓN
export const reenviarVerificacion = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        msg: "Por favor, ingresa tu email",
        campo: "email"
      });
    }

    const usuario = await Usuario.findOne({ email: email.toLowerCase() });

    if (!usuario) {
      // Por seguridad, no revelar si el email existe
      return res.json({ 
        msg: "Si el email está registrado y no verificado, recibirás un nuevo correo de verificación." 
      });
    }

    if (usuario.emailVerificado) {
      return res.status(400).json({ 
        msg: "Este email ya está verificado. Puedes iniciar sesión." 
      });
    }

    // Generar nuevo token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

    usuario.emailVerificationToken = hashedToken;
    usuario.emailVerificationExpires = Date.now() + 86400000; // 24 horas
    await usuario.save();

    // Enviar email
    try {
      await enviarEmailVerificacion(usuario.email, usuario.nombre, verificationToken);
      res.json({ 
        msg: "Si el email está registrado y no verificado, recibirás un nuevo correo de verificación." 
      });
    } catch (emailError) {
      console.error("Error al enviar email:", emailError);
      return res.status(500).json({ 
        msg: "No se pudo enviar el email. Por favor, intenta nuevamente." 
      });
    }
  } catch (error) {
    console.error("Error al reenviar verificación:", error);
    res.status(500).json({ msg: "Error en el servidor. Por favor, intenta nuevamente." });
  }
};

// ✅ LOGIN MEJORADO - Verificar email antes de permitir login
export const login = async (req, res) => {
  try {
    const { email, password, recordarme } = req.body;

    // Validación de campos
    if (!email || !password) {
      return res.status(400).json({ 
        msg: "Por favor, ingresa tu email y contraseña",
        campo: !email ? "email" : "password"
      });
    }

    // Buscar usuario
    const usuario = await Usuario.findOne({ email: email.toLowerCase() });
    if (!usuario) {
      return res.status(400).json({ 
        msg: "No existe una cuenta con este email",
        campo: "email"
      });
    }

    // 🆕 Verificar si el email está verificado
    if (!usuario.emailVerificado) {
      return res.status(403).json({ 
        msg: "Por favor, verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.",
        requiresVerification: true
      });
    }

    // Verificar contraseña
    const esValido = await bcrypt.compare(password, usuario.password);
    if (!esValido) {
      return res.status(400).json({ 
        msg: "Los datos son incorrectos",
        campo: "password"
      });
    }

    // Generar tokens
    const accessToken = generarAccessToken(usuario._id);
    const refreshToken = recordarme ? generarRefreshToken(usuario._id) : null;

    // Guardar refresh token si "recordarme" está activado
    if (refreshToken) {
      usuario.refreshToken = refreshToken;
      await usuario.save();
    }

    res.json({
      msg: "Inicio de sesión exitoso",
      accessToken,
      refreshToken,
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ msg: "Error en el servidor. Por favor, intenta nuevamente." });
  }
};

// 🆕 REFRESH TOKEN
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ msg: "No se proporcionó refresh token" });
    }

    // Verificar el refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    // Buscar usuario y verificar que el token coincida
    const usuario = await Usuario.findById(decoded.id);
    if (!usuario || usuario.refreshToken !== refreshToken) {
      return res.status(401).json({ msg: "Refresh token inválido" });
    }

    // Generar nuevo access token
    const nuevoAccessToken = generarAccessToken(usuario._id);

    res.json({
      accessToken: nuevoAccessToken,
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error al refrescar token:", error);
    res.status(401).json({ msg: "Refresh token inválido o expirado" });
  }
};

// 🆕 SOLICITAR RECUPERACIÓN DE CONTRASEÑA
export const solicitarRecuperacion = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        msg: "Por favor, ingresa tu email",
        campo: "email"
      });
    }

    // Buscar usuario
    const usuario = await Usuario.findOne({ email: email.toLowerCase() });
    if (!usuario) {
      // Por seguridad, no revelamos si el email existe o no
      return res.json({ 
        msg: "Si el email está registrado, recibirás un correo con instrucciones para restablecer tu contraseña" 
      });
    }

    // Generar token de recuperación
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Guardar token y expiración
    usuario.resetPasswordToken = hashedToken;
    usuario.resetPasswordExpires = Date.now() + 3600000; // 1 hora
    await usuario.save();

    // Enviar email
    try {
      await enviarEmailRecuperacion(usuario.email, usuario.nombre, resetToken);
      res.json({ 
        msg: "Si el email está registrado, recibirás un correo con instrucciones para restablecer tu contraseña" 
      });
    } catch (emailError) {
      console.error("Error al enviar email:", emailError);
      // Limpiar tokens si falla el envío
      usuario.resetPasswordToken = undefined;
      usuario.resetPasswordExpires = undefined;
      await usuario.save();
      
      return res.status(500).json({ 
        msg: "No se pudo enviar el email de recuperación. Por favor, intenta nuevamente." 
      });
    }
  } catch (error) {
    console.error("Error en solicitud de recuperación:", error);
    res.status(500).json({ msg: "Error en el servidor. Por favor, intenta nuevamente." });
  }
};

// 🆕 RESTABLECER CONTRASEÑA
export const restablecerPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ 
        msg: "Por favor, ingresa tu nueva contraseña",
        campo: "password"
      });
    }

    // Validar contraseña
    const passwordValidacion = validarPassword(password);
    if (!passwordValidacion.valido) {
      return res.status(400).json({ 
        msg: passwordValidacion.mensaje,
        campo: "password"
      });
    }

    // Hash del token recibido
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Buscar usuario con token válido y no expirado
    const usuario = await Usuario.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!usuario) {
      return res.status(400).json({ 
        msg: "El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo." 
      });
    }

    // Hash de la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Actualizar contraseña y limpiar tokens
    usuario.password = hash;
    usuario.resetPasswordToken = undefined;
    usuario.resetPasswordExpires = undefined;
    usuario.refreshToken = undefined; // Invalidar sesiones anteriores
    await usuario.save();

    // Enviar email de confirmación
    await enviarEmailConfirmacionCambio(usuario.email, usuario.nombre);

    res.json({ 
      msg: "Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión." 
    });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    res.status(500).json({ msg: "Error en el servidor. Por favor, intenta nuevamente." });
  }
};

// 🆕 LOGOUT (Invalidar refresh token)
export const logout = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);
    if (usuario) {
      usuario.refreshToken = undefined;
      await usuario.save();
    }
    res.json({ msg: "Sesión cerrada exitosamente" });
  } catch (error) {
    console.error("Error en logout:", error);
    res.status(500).json({ msg: "Error al cerrar sesión" });
  }
};

// ========== FUNCIONES EXISTENTES (sin cambios significativos) ==========

export const listarUsuarios = async (req, res) => {
  try {
    const { page = 1, limit = 15, search = "" } = req.query;
    const query = search ? { nombre: { $regex: search, $options: "i" } } : {};

    const total = await Usuario.countDocuments(query);
    const usuarios = await Usuario.find(query)
      .select("-password -resetPasswordToken -resetPasswordExpires -refreshToken -emailVerificationToken")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      usuarios,
      totalPaginas: Math.ceil(total / limit),
      paginaActual: Number(page),
    });
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    res.status(500).json({ msg: "Error al obtener los usuarios" });
  }
};

// ✅ Listar usuarios básicos para mensajería (TODOS LOS USUARIOS AUTENTICADOS)
export const listarUsuariosParaMensajes = async (req, res) => {
  try {
    console.log("📨 Solicitud de usuarios para mensajería por:", req.usuario.nombre);
    
    // Solo devolver información básica necesaria para enviar mensajes
    // Buscar todos los usuarios activos (sin filtrar por emailVerified)
    const usuarios = await Usuario.find()
      .select("_id nombre email rol emailVerified")
      .sort({ nombre: 1 })
      .limit(100);

    console.log(`✅ Se encontraron ${usuarios.length} usuarios para mensajería`);

    res.json({ 
      usuarios,
      total: usuarios.length 
    });
  } catch (error) {
    console.error("❌ Error al listar usuarios para mensajes:", error);
    res.status(500).json({ msg: "Error al obtener los usuarios" });
  }
};

export const obtenerUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id)
      .select("-password -resetPasswordToken -resetPasswordExpires -refreshToken -emailVerificationToken");
    
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }
    
    res.json(usuario);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ msg: "Error al obtener el usuario" });
  }
};

export const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol, requiereVerificacion } = req.body;

    // Validaciones básicas
    if (!nombre || !email) {
      return res.status(400).json({ msg: "Nombre y email son obligatorios" });
    }

    if (!validarEmail(email)) {
      return res.status(400).json({ msg: "Email inválido" });
    }

    // 🔥 AHORA LA CONTRASEÑA ES OBLIGATORIA EN AMBOS CASOS
    if (!password) {
      return res.status(400).json({ msg: "La contraseña es obligatoria" });
    }

    const passwordValidacion = validarPassword(password);
    if (!passwordValidacion.valido) {
      return res.status(400).json({ msg: passwordValidacion.mensaje });
    }

    // Verificar si el email ya existe
    const existe = await Usuario.findOne({ email: email.toLowerCase() });
    if (existe) {
      return res.status(400).json({ msg: "El email ya está registrado" });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // OPCIÓN 1: USUARIO CON VERIFICACIÓN PENDIENTE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (requiereVerificacion) {
      
      // Generar token de verificación
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

      const nuevoUsuario = new Usuario({ 
        nombre, 
        email: email.toLowerCase(), 
        password: hash, // 🔥 Guardamos la contraseña hasheada
        rol: rol || "alumno",
        emailVerificado: false,
        emailVerificationToken: hashedToken,
        emailVerificationExpires: Date.now() + 86400000 // 24 horas
      });
      
      await nuevoUsuario.save();

      // 🔥 Enviar email de verificación CON contraseña en texto plano
      try {
        await enviarEmailVerificacion(
          nuevoUsuario.email, 
          nuevoUsuario.nombre, 
          verificationToken,
          password // 🔥 Pasar contraseña original
        );
        
        return res.status(201).json({ 
          msg: "Usuario creado. Se ha enviado un email de verificación con las credenciales.",
          requiereVerificacion: true,
          usuario: {
            _id: nuevoUsuario._id,
            nombre: nuevoUsuario.nombre,
            email: nuevoUsuario.email,
            rol: nuevoUsuario.rol,
            emailVerificado: false
          }
        });
      } catch (emailError) {
        console.error("Error al enviar email de verificación:", emailError);
        
        // Si falla el envío del email, eliminar el usuario
        await Usuario.findByIdAndDelete(nuevoUsuario._id);
        
        return res.status(500).json({ 
          msg: "No se pudo enviar el email de verificación. Usuario no creado." 
        });
      }
    } 
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // OPCIÓN 2: USUARIO PRE-VERIFICADO CON CREDENCIALES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    else {
      const nuevoUsuario = new Usuario({ 
        nombre, 
        email: email.toLowerCase(), 
        password: hash, 
        rol: rol || "alumno",
        emailVerificado: true // 👈 Pre-verificado
      });
      
      await nuevoUsuario.save();

      // Intentar enviar email con credenciales
      try {
        await enviarEmailCredenciales(nuevoUsuario.email, nuevoUsuario.nombre, password);
        
        return res.status(201).json({ 
          msg: "Usuario creado correctamente. Se han enviado las credenciales por email.",
          emailEnviado: true,
          usuario: {
            _id: nuevoUsuario._id,
            nombre: nuevoUsuario.nombre,
            email: nuevoUsuario.email,
            rol: nuevoUsuario.rol,
            emailVerificado: true
          }
        });
      } catch (emailError) {
        console.error("No se pudo enviar email con credenciales:", emailError);
        
        return res.status(201).json({ 
          msg: "Usuario creado correctamente (no se pudo enviar email con credenciales).",
          emailEnviado: false,
          usuario: {
            _id: nuevoUsuario._id,
            nombre: nuevoUsuario.nombre,
            email: nuevoUsuario.email,
            rol: nuevoUsuario.rol,
            emailVerificado: true
          }
        });
      }
    }
    
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ msg: "Error al crear usuario" });
  }
};

export const actualizarUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    const updateData = { nombre, email: email?.toLowerCase(), rol };

    if (password) {
      const passwordValidacion = validarPassword(password);
      if (!passwordValidacion.valido) {
        return res.status(400).json({ msg: passwordValidacion.mensaje });
      }
      const salt = bcrypt.genSaltSync(10);
      updateData.password = bcrypt.hashSync(password, salt);
    }

    await Usuario.findByIdAndUpdate(req.params.id, updateData);
    res.json({ msg: "Usuario actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ msg: "Error al actualizar usuario" });
  }
};

export const eliminarUsuario = async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ msg: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ msg: "Error al eliminar usuario" });
  }
};