// controllers/usuarioController.js
import Usuario from "../models/Usuario.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Registro
export const registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(400).json({ msg: "Usuario ya registrado" });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const usuario = new Usuario({ nombre, email, password: hash, rol });
    await usuario.save();

    res.json({ msg: "Usuario registrado", usuario });
  } catch (error) {
    res.status(500).json({ msg: "Error en el servidor" });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(400).json({ msg: "Credenciales inválidas" });

    const esValido = await bcrypt.compare(password, usuario.password);
    if (!esValido) return res.status(400).json({ msg: "Credenciales inválidas" });

    const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // devolver solo lo necesario
    res.json({
      token,
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,   // 👈 este es clave para tu botón
      },
    });
  } catch (error) {
    res.status(500).json({ msg: "Error en el servidor" });
  }
};

// Obtener usuarios con paginado
// Obtener usuarios con búsqueda y paginado
export const listarUsuarios = async (req, res) => {
  try {
    const { page = 1, limit = 15, search = "" } = req.query;
    const query = search ? { nombre: { $regex: search, $options: "i" } } : {};

    const total = await Usuario.countDocuments(query);
    const usuarios = await Usuario.find(query)
      .select("-password")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      usuarios,
      totalPaginas: Math.ceil(total / limit),
      paginaActual: Number(page),
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener los usuarios" });
  }
};


// Obtener un usuario por ID
export const obtenerUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select("-password");
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener el usuario" });
  }
};

// Crear un nuevo usuario
export const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(400).json({ msg: "El email ya está registrado" });

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const nuevoUsuario = new Usuario({ nombre, email, password: hash, rol });
    await nuevoUsuario.save();
    res.status(201).json({ msg: "Usuario creado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: "Error al crear usuario" });
  }
};

// Actualizar un usuario
export const actualizarUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    const updateData = { nombre, email, rol };

    if (password) {
      const salt = bcrypt.genSaltSync(10);
      updateData.password = bcrypt.hashSync(password, salt);
    }

    await Usuario.findByIdAndUpdate(req.params.id, updateData);
    res.json({ msg: "Usuario actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: "Error al actualizar usuario" });
  }
};

// Eliminar un usuario
export const eliminarUsuario = async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ msg: "Usuario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar usuario" });
  }
};