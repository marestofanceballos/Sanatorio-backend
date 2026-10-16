import mongoose from "mongoose";

const DoctorSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  especialidad: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
   horarios: {
    type: [String],
    default: []
  },
  // 🔵 NUEVO: control de acceso por pago.
  // Por defecto false -> el doctor se registra pero no puede loguearse
  // hasta que lo habilites a mano en MongoDB (Compass/Atlas, campo "habilitado" -> true)
  habilitado: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model("Doctor", DoctorSchema);