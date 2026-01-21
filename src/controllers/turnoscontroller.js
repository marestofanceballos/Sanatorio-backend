import Turno from "../models/Turno.js";

// POST
export const crearTurno = async (req, res) => {
  try {
    const turno = new Turno(req.body);
    await turno.save();

    res.status(201).json({
      message: "Turno creado correctamente",
      turno,
    });
  } catch (error) {
    res.status(400).json({
      message: "Error al crear turno",
      error,
    });
  }
};

// GET
export const obtenerTurnos = async (req, res) => {
  try {
    const turnos = await Turno.find();
    res.json(turnos);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener turnos",
    });
  }
};

// DELETE
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

// PUT ✅ ESTE ES EL IMPORTANTE
export const actualizarTurno = async (req, res) => {
  try {
    const id = req.params.id.trim(); // 👈 CLAVE

    const turnoActualizado = await Turno.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!turnoActualizado) {
      return res.status(404).json({ message: "Turno no encontrado" });
    }

    res.json({
      message: "Turno actualizado",
      turno: turnoActualizado,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
