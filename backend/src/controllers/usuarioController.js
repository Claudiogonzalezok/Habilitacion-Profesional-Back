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
    res.json({ token, usuario });
  } catch (error) {
    res.status(500).json({ msg: "Error en el servidor" });
  }
};
