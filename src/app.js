import express from "express";
import cors from "cors";
import turnosRoutes from "./routes/turnos.routes.js";
import doctorAuthRoutes from "./routes/doctorAuthRoutes.js";
import cvRoutes from "./routes/cvRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/turnos", turnosRoutes);
app.use("/api/doctor-auth", doctorAuthRoutes);
app.use("/api/cvs", cvRoutes);

console.log("Rutas registradas: /api/turnos, /api/doctor-auth, /api/cvs"); // ← agregá esto

// Manejo de errores de Multer
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "El archivo supera el límite de 5 MB." });
  }
  if (err.message?.includes("Solo se permiten")) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default app;