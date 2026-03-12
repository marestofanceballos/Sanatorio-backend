import mongoose from "mongoose";

const turnoSchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      required: true,
    },
    doctorNombre: {
      type: String,
      required: true,
    },
     fecha: {                 // 👈 AGREGAR ESTO
    type: String,
    required: true,
    },
    horario: {
      type: String,
      required: true,
    },
    pacienteNombre: {
      type: String,
      required: true,
    },
    dni: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    telefono: {
      type: String,
      required: true,
    },
    observacion: {
      type: String,
      default: "",
    }
  },
  { timestamps: true }
);

export default mongoose.model("Turno", turnoSchema);