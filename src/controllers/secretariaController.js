import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";
import Secretaria from "../models/Secretaria.js";
import Turno from "../models/Turno.js";
import Doctor from "../models/Doctor.js";

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
      obraSocial = "",
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

    const doctor = mongoose.Types.ObjectId.isValid(doctorId)
      ? await Doctor.findById(doctorId).select("especialidad")
      : null;

    const turno = await Turno.create({
      doctorId,
      doctorNombre,
      especialidad: doctor?.especialidad || "",
      fecha,
      horario,
      pacienteNombre: pacienteNombre.trim(),
      dni: dni.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      observacion: observacion.trim(),
      obraSocial: obraSocial.trim(),
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

// PUT /api/secretaria/:secretariaId/turnos/:turnoId  (reprogramar)
export const reprogramarTurnoSecretaria = async (req, res) => {
  try {
    const { secretariaId, turnoId } = req.params;
    const { fecha, horario } = req.body;

    if (!fecha || !horario) {
      return res.status(400).json({ mensaje: "Falta nueva fecha u horario" });
    }
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

    if (horario !== "Por orden de llegada") {
      const ocupado = await Turno.findOne({
        doctorId: turno.doctorId,
        fecha,
        horario,
        estado: { $ne: "rechazado" },
        _id: { $ne: turno._id },
      });
      if (ocupado) {
        return res.status(409).json({ mensaje: "Ese horario ya está ocupado" });
      }
    }

    turno.fecha = fecha;
    turno.horario = horario;
    await turno.save();

    res.json(turno);
  } catch (error) {
    console.error("Error reprogramando turno (secretaria):", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// GET /api/secretaria/:secretariaId/doctores  (datos de los doctores que maneja)
export const getDoctoresSecretaria = async (req, res) => {
  try {
    const secretaria = await verificarSecretaria(req.params.secretariaId);
    if (!secretaria) {
      return res.status(403).json({ mensaje: "Secretaria no válida" });
    }

    const doctores = await Doctor.find({ _id: { $in: secretaria.doctores } })
      .select("nombre especialidad email horarios diasAtencion sinTurno");

    res.json(doctores);
  } catch (error) {
    console.error("Error obteniendo doctores (secretaria):", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// POST /api/secretaria/crear  (requiere el código profesional)
export const crearSecretaria = async (req, res) => {
  try {
    const { nombre, usuario, password, codigo, doctores = [] } = req.body;

    if (codigo !== process.env.CODIGO_DOCTOR) {
      return res.status(400).json({ mensaje: "Código profesional inválido" });
    }
    if (!nombre || !usuario || !password) {
      return res.status(400).json({ mensaje: "Completá nombre, usuario y contraseña" });
    }

    const usuarioNormalizado = usuario.toLowerCase().trim();
    const existe = await Secretaria.findOne({ usuario: usuarioNormalizado });
    if (existe) {
      return res.status(400).json({ mensaje: "Ese usuario ya existe" });
    }

    const error = await validarDoctores(doctores);
    if (error) {
      return res.status(400).json({ mensaje: error });
    }

    const secretaria = await Secretaria.create({
      nombre,
      usuario: usuarioNormalizado,
      password: await bcrypt.hash(password, 10),
      doctores,
    });

    res.status(201).json({
      mensaje: "Secretaria creada",
      id: secretaria._id,
      nombre: secretaria.nombre,
      usuario: secretaria.usuario,
      doctores: secretaria.doctores,
    });
  } catch (error) {
    console.error("Error creando secretaria:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// PUT /api/secretaria/:secretariaId/doctores  (requiere el código profesional)
// body: { codigo, doctores: ["<idDoctor1>", "<idDoctor2>", "<idDoctor3>"] }
export const asignarDoctores = async (req, res) => {
  try {
    const { secretariaId } = req.params;
    const { codigo, doctores } = req.body;

    if (codigo !== process.env.CODIGO_DOCTOR) {
      return res.status(400).json({ mensaje: "Código profesional inválido" });
    }
    if (!mongoose.Types.ObjectId.isValid(secretariaId)) {
      return res.status(400).json({ mensaje: "Secretaria inválida" });
    }

    const error = await validarDoctores(doctores);
    if (error) {
      return res.status(400).json({ mensaje: error });
    }

    const secretaria = await Secretaria.findByIdAndUpdate(
      secretariaId,
      { doctores },
      { new: true }
    ).select("-password");

    if (!secretaria) {
      return res.status(404).json({ mensaje: "Secretaria no encontrada" });
    }

    res.json(secretaria);
  } catch (error) {
    console.error("Error asignando doctores:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// Devuelve un mensaje de error si la lista de doctores no es válida, o null si está bien
const validarDoctores = async (doctores) => {
  if (!Array.isArray(doctores)) return "doctores tiene que ser una lista de IDs";
  if (doctores.some((id) => !mongoose.Types.ObjectId.isValid(id))) return "Hay un ID de doctor inválido";

  const encontrados = await Doctor.countDocuments({ _id: { $in: doctores } });
  if (encontrados !== new Set(doctores).size) return "Algún doctor no existe";
  return null;
};

// Valida y normaliza los datos editables de un doctor.
// Devuelve { error } o { datos } con solo los campos que vinieron en el body.
const datosDoctor = (body, { nuevo }) => {
  const datos = {};
  const { nombre, especialidad, email, horarios, diasAtencion, sinTurno } = body;

  if (nuevo || nombre !== undefined) {
    if (typeof nombre !== "string" || !nombre.trim()) return { error: "Falta el nombre del doctor" };
    datos.nombre = nombre.trim();
  }
  if (nuevo || especialidad !== undefined) {
    if (typeof especialidad !== "string" || !especialidad.trim()) return { error: "Falta la especialidad" };
    datos.especialidad = especialidad.trim();
  }
  if (nuevo) {
    if (typeof email !== "string" || !email.trim()) return { error: "Falta el email del doctor" };
    datos.email = email.toLowerCase().trim();
  }
  if (horarios !== undefined) {
    if (!Array.isArray(horarios) || horarios.some((h) => typeof h !== "string" || !h.trim())) {
      return { error: "horarios tiene que ser una lista de horarios (ej: [\"09:00\", \"09:30\"])" };
    }
    datos.horarios = [...new Set(horarios.map((h) => h.trim()))];
  }
  if (diasAtencion !== undefined) {
    if (!Array.isArray(diasAtencion) || diasAtencion.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
      return { error: "diasAtencion tiene que ser una lista de días del 0 (domingo) al 6 (sábado)" };
    }
    datos.diasAtencion = [...new Set(diasAtencion)].sort();
  }
  if (sinTurno !== undefined) {
    if (typeof sinTurno !== "boolean") return { error: "sinTurno tiene que ser true o false" };
    datos.sinTurno = sinTurno;
  }
  return { datos };
};

const doctorParaSecretaria = (doctor) => ({
  _id: doctor._id,
  nombre: doctor.nombre,
  especialidad: doctor.especialidad,
  email: doctor.email,
  horarios: doctor.horarios,
  diasAtencion: doctor.diasAtencion,
  sinTurno: doctor.sinTurno,
});

// POST /api/secretaria/:secretariaId/doctores  (la secretaria agrega un doctor nuevo)
// body: { nombre, especialidad, email, horarios?, diasAtencion?, sinTurno? }
export const crearDoctorSecretaria = async (req, res) => {
  try {
    const secretaria = await verificarSecretaria(req.params.secretariaId);
    if (!secretaria) {
      return res.status(403).json({ mensaje: "Secretaria no válida" });
    }

    const { error, datos } = datosDoctor(req.body, { nuevo: true });
    if (error) {
      return res.status(400).json({ mensaje: error });
    }

    const existe = await Doctor.findOne({ email: datos.email });
    if (existe) {
      return res.status(400).json({ mensaje: "Ya hay un doctor registrado con ese email" });
    }

    // El doctor no inicia sesión por su cuenta: contraseña aleatoria y habilitado en false (default)
    const doctor = await Doctor.create({
      ...datos,
      password: await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10),
    });

    secretaria.doctores.push(doctor._id.toString());
    await secretaria.save();

    res.status(201).json(doctorParaSecretaria(doctor));
  } catch (error) {
    console.error("Error creando doctor (secretaria):", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// PUT /api/secretaria/:secretariaId/doctores/:doctorId  (la secretaria modifica uno de sus doctores)
// body: cualquiera de { nombre, especialidad, horarios, diasAtencion, sinTurno }
export const modificarDoctorSecretaria = async (req, res) => {
  try {
    const { secretariaId, doctorId } = req.params;

    const secretaria = await verificarSecretaria(secretariaId, doctorId);
    if (!secretaria) {
      return res.status(403).json({ mensaje: "No tenés acceso a este doctor" });
    }

    const { error, datos } = datosDoctor(req.body, { nuevo: false });
    if (error) {
      return res.status(400).json({ mensaje: error });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ mensaje: "Doctor no encontrado" });
    }

    doctor.set(datos);
    await doctor.save();

    // Mantener nombre y especialidad al día en los turnos ya agendados
    if (datos.nombre || datos.especialidad) {
      await Turno.updateMany(
        { doctorId },
        { doctorNombre: doctor.nombre, especialidad: doctor.especialidad }
      );
    }

    res.json(doctorParaSecretaria(doctor));
  } catch (error) {
    console.error("Error modificando doctor (secretaria):", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// Fecha de hoy (YYYY-MM-DD) en Argentina, para separar turnos próximos de pasados
const hoyArgentina = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

// DELETE /api/secretaria/:secretariaId/doctores/:doctorId  (la secretaria elimina uno de sus doctores)
// Se quita de su lista y se cancelan los turnos próximos; los turnos pasados quedan como historial.
// El doctor se borra de la base solo si no es una cuenta habilitada y ninguna otra secretaria lo maneja.
export const eliminarDoctorSecretaria = async (req, res) => {
  try {
    const { secretariaId, doctorId } = req.params;

    const secretaria = await verificarSecretaria(secretariaId, doctorId);
    if (!secretaria) {
      return res.status(403).json({ mensaje: "No tenés acceso a este doctor" });
    }

    secretaria.doctores = secretaria.doctores.filter((id) => id !== doctorId);
    await secretaria.save();

    const { deletedCount: turnosCancelados } = await Turno.deleteMany({
      doctorId,
      fecha: { $gte: hoyArgentina() },
    });

    const doctor = await Doctor.findById(doctorId);
    const otraSecretaria = await Secretaria.findOne({ doctores: doctorId });
    const borrado = Boolean(doctor && !doctor.habilitado && !otraSecretaria);
    if (borrado) {
      await doctor.deleteOne();
    }

    res.json({
      mensaje: borrado ? "Doctor eliminado" : "Doctor quitado de tu lista",
      doctorBorrado: borrado,
      turnosCancelados,
    });
  } catch (error) {
    console.error("Error eliminando doctor (secretaria):", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};
