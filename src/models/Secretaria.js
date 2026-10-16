import mongoose from "mongoose";

const secretariaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    usuario: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // hasheada con bcrypt
    // IDs de los doctores que maneja (mismo valor que se guarda en Turno.doctorId)
    doctores: [{ type: String }],
    habilitada: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Secretaria", secretariaSchema);