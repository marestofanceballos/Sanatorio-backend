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
  // días que atiende: 0 = domingo ... 6 = sábado (vacío = todos los días)
  diasAtencion: {
    type: [Number],
    default: []
  },
  // true = atiende por orden de llegada, sin horarios fijos
  sinTurno: {
    type: Boolean,
    default: false
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