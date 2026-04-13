import mongoose from "mongoose";

const cvSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    fechaNacimiento: { type: String, required: true },
    celular: { type: String, required: true },
    email: { type: String, required: true },
    dni: { type: String, required: true },
    puesto: { type: String, required: true },
    tieneExperiencia: { type: Boolean, default: false },
    archivoNombre: { type: String },
    archivoId: { type: mongoose.Schema.Types.ObjectId }, // referencia al archivo en GridFS
  },
  { timestamps: true }
);

export default mongoose.model("CV", cvSchema);