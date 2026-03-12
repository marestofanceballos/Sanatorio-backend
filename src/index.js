import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import doctorAuthRoutes from "./routes/doctorAuthRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/doctor-auth", doctorAuthRoutes);

app.get("/", (req, res) => {
  res.send("Backend Sanatorio funcionando");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 MongoDB conectado"))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});