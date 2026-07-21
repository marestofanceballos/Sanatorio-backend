import { Router } from "express";
import {
  crearTurno,
  obtenerTurnos,
  eliminarTurno,
  obtenerTurnosPorDoctor,
  obtenerTurnosPorFecha,
  reprogramarTurno,
} from "../controllers/turnoscontroller.js";

const router = Router();

router.post("/", crearTurno);
router.get("/", obtenerTurnos);
router.get("/doctor/:doctorId", obtenerTurnosPorDoctor);
router.delete("/:id", eliminarTurno);
router.get("/fecha", obtenerTurnosPorFecha);
router.put("/reprogramar/:id", reprogramarTurno);

export default router;

