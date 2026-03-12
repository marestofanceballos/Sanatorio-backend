import Doctor from "../models/Doctor.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// LOGIN
export const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      return res.status(400).json({ msg: "Doctor no encontrado" });
    }

    const validPassword = bcrypt.compareSync(password, doctor.password);

    if (!validPassword) {
      return res.status(400).json({ msg: "Contraseña incorrecta" });
    }

    res.json({
      id: doctor._id,
      nombre: doctor.nombre,
      especialidad: doctor.especialidad
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error en login" });
  }
};

// CREAR DOCTOR
export const crearDoctor = async (req, res) => {
  try {
    const { nombre, especialidad, email, password, codigo, horarios } = req.body;

    // 🔐 VALIDACIÓN DEL CÓDIGO PROFESIONAL
    if (codigo !== process.env.CODIGO_DOCTOR) {
      return res.status(400).json({ msg: "Código profesional inválido" });
    }

    const existe = await Doctor.findOne({ email });

    if (existe) {
      return res.status(400).json({ msg: "Doctor ya existe" });
    }

    const salt = bcrypt.genSaltSync();
    const hashedPassword = bcrypt.hashSync(password, salt);

    const nuevoDoctor = new Doctor({
      nombre,
      especialidad,
      email,
      password: hashedPassword,
      horarios
    });

    await nuevoDoctor.save();

    res.json({ msg: "Doctor creado correctamente" });

  } catch (error) {
    res.status(500).json({ msg: "Error creando doctor" });
  }
};