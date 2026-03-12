import Turno from "../models/Turno.js";

// CREAR TURNO (YA CONFIRMADO)
export const crearTurno = async (req, res) => {
  try {
    const {
      doctorId,
      doctorNombre,
      fecha,
      horario,
      pacienteNombre,
      dni,
      email,
      telefono
    } = req.body;

    if (!doctorId || !doctorNombre || !fecha || !horario || !pacienteNombre || !dni || !email || !telefono) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    // 👇 evitar turnos duplicados
    const turnoExistente = await Turno.findOne({
      doctorId,
      fecha,
      horario
    });

    if (turnoExistente) {
      return res.status(400).json({
        message: "❌ Este horario ya está reservado"
      });
    }

    const nuevoTurno = new Turno({
      doctorId,
      doctorNombre,
      fecha,
      horario,
      pacienteNombre,
      dni,
      email,
      telefono
    });

    await nuevoTurno.save();

    res.status(201).json({
      message: "Turno asignado correctamente",
      turno: nuevoTurno
    });

  } catch (error) {
    console.log("❌ Error real:", error);
    res.status(500).json({
      message: "Error al crear turno"
    });
  }
};

// VER TODOS LOS TURNOS (ADMIN)
export const obtenerTurnos = async (req, res) => {
  try {
    const turnos = await Turno.find().sort({ createdAt: -1 });
    res.json(turnos);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener turnos",
    });
  }
};

// CANCELAR TURNO
export const eliminarTurno = async (req, res) => {
  try {
    await Turno.findByIdAndDelete(req.params.id);
    res.json({ message: "Turno eliminado" });
  } catch (error) {
    res.status(400).json({
      message: "Error al eliminar turno",
    });
  }
};

// AGENDA DEL DOCTOR (VER SOLO SUS PACIENTES)
export const obtenerTurnosPorDoctor = async (req, res) => {
  try {
    const turnos = await Turno.find({
      doctorId: req.params.doctorId
    }).sort({ horario: 1 });

    res.json(turnos);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener turnos del doctor",
    });
  }
};

// VER TURNOS POR FECHA Y DOCTOR
export const obtenerTurnosPorFecha = async (req, res) => {

  try {

    const { doctorId, fecha } = req.query;

    const turnos = await Turno.find({
      doctorId,
      fecha
    });

    res.json(turnos);

  } catch (error) {

    res.status(500).json({
      message: "Error al obtener turnos"
    });

  }

};