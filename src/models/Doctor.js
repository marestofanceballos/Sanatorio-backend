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
  }
});

export default mongoose.model("Doctor", DoctorSchema);