import mongoose from "mongoose";

const turnoSchema = new mongoose.Schema(
  {
    doctorId: {
      type: Number,
      required: true,
    },
    doctorNombre: {
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
    estado: {
      type: String,
      default: "pendiente",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Turno", turnoSchema);
