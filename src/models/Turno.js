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

    fecha: {
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

    // opcional: la secretaria puede cargar turnos telefónicos sin email
    // (el formulario web de pacientes lo sigue exigiendo en crearTurno)
    email: {
      type: String,
      default: "",
    },

    telefono: {
      type: String,
      required: true,
    },

    observacion: {
      type: String,
      default: "",
    },

    // obra social / prepaga del paciente (opcional; vacío = particular o no informada)
    obraSocial: {
      type: String,
      default: "",
    },

    especialidad: {
      type: String,
      default: "",
    },

    // lo dejamos por ahora
    // por si después querés agregar estados
    estado: {
      type: String,
      default: "pendiente"
    },

    motivoRechazo: {
      type: String,
      default: ""
    },

    // quién cargó el turno: "paciente" (web) o "secretaria"
    origen: {
      type: String,
      default: "paciente"
    }

  },
  {
    timestamps: true
  }
);


export default mongoose.model("Turno", turnoSchema);