import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Secretaria from "../models/Secretaria.js";
import Turno from "../models/Turno.js";

// Verifica que la secretaria exista, esté habilitada y (si se pasa) que maneje ese doctor
const verificarSecretaria = async (secretariaId, doctorId = null) => {
  if (!mongoose.Types.ObjectId.isValid(secretariaId)) return null;
  const secretaria = await Secretaria.findById(secretariaId);
  if (!secretaria || !secretaria.habilitada) return null;
  if (doctorId && !secretaria.doctores.includes(doctorId)) return null;
  return secretaria;
};

// POST /api/secretaria/login
export const loginSecretaria = async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({ mensaje: "Completá usuario y contraseña" });
    }

    const secretaria = await Secretaria.findOne({ usuario: usuario.toLowerCase().trim() });
    if (!secretaria) {
      return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos" });
    }

    const ok = await bcrypt.compare(password, secretaria.password);
    if (!ok) {
      return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos" });
    }

    if (!secretaria.habilitada) {
      return res.status(403).json({ mensaje: "Tu cuenta está deshabilitada" });
    }

    res.json({
      id: secretaria._id,
      nombre: secretaria.nombre,
      doctores: secretaria.doctores, // mongoIds de los doctores que maneja
    });
  } catch (error) {
    console.error("Error login secretaria:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// GET /api/secretaria/:secretariaId/turnos?doctorId=...&fecha=YYYY-MM-DD
export const getTurnosSecretaria = async (req, res) => {
  try {
    const { secretariaId } = req.params;
    const { doctorId, fecha } = req.query;

    if (!doctorId) {
      return res.status(400).json({ mensaje: "Falta el doctor" });
    }

    const secretaria = await verificarSecretaria(secretariaId, doctorId);
    if (!secretaria) {
      return res.status(403).json({ mensaje: "No tenés acceso a este doctor" });
    }

    const filtro = { doctorId, estado: { $ne: "rechazado" } };
    if (fecha) filtro.fecha = fecha;

    const turnos = await Turno.find(filtro).sort({ fecha: 1, horario: 1, createdAt: 1 });
    res.json(turnos);
  } catch (error) {
    console.error("Error obteniendo turnos (secretaria):", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// POST /api/secretaria/:secretariaId/turnos
export const crearTurnoSecretaria = async (req, res) => {
  try {
    const { secretariaId } = req.params;
    const {
      doctorId,
      doctorNombre,
      fecha,
      horario,
      pacienteNombre,
      dni,
      telefono,
      email = "",
      observacion = "",
    } = req.body;

    if (!doctorId || !doctorNombre || !fecha || !horario || !pacienteNombre || !dni || !telefono) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
    }

    const secretaria = await verificarSecretaria(secretariaId, doctorId);
    if (!secretaria) {
      return res.status(403).json({ mensaje: "No tenés acceso a este doctor" });
    }

    // Evita turnos duplicados en el mismo horario (salvo "Por orden de llegada")
    if (horario !== "Por orden de llegada") {
      const ocupado = await Turno.findOne({
        doctorId,
        fecha,
        horario,
        estado: { $ne: "rechazado" },
      });
      if (ocupado) {
        return res.status(409).json({ mensaje: "Ese horario ya está ocupado" });
      }
    }

    const turno = await Turno.create({
      doctorId,
      doctorNombre,
      fecha,
      horario,
      pacienteNombre: pacienteNombre.trim(),
      dni: dni.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      observacion: observacion.trim(),
      estado: "confirmado",
      origen: "secretaria",
    });

    res.status(201).json(turno);
  } catch (error) {
    console.error("Error creando turno (secretaria):", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// DELETE /api/secretaria/:secretariaId/turnos/:turnoId
export const eliminarTurnoSecretaria = async (req, res) => {
  try {
    const { secretariaId, turnoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(turnoId)) {
      return res.status(400).json({ mensaje: "Turno inválido" });
    }

    const turno = await Turno.findById(turnoId);
    if (!turno) {
      return res.status(404).json({ mensaje: "Turno no encontrado" });
    }

    const secretaria = await verificarSecretaria(secretariaId, turno.doctorId);
    if (!secretaria) {
      return res.status(403).json({ mensaje: "No tenés acceso a este turno" });
    }

    await turno.deleteOne();
    res.json({ mensaje: "Turno eliminado" });
  } catch (error) {
    console.error("Error eliminando turno (secretaria):", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};
