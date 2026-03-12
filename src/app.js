import express from "express";
import cors from "cors";
import turnosRoutes from "./routes/turnos.routes.js";
import doctorAuthRoutes from "./routes/doctorAuthRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/turnos", turnosRoutes);
app.use("/api/doctor-auth", doctorAuthRoutes);

export default app;
