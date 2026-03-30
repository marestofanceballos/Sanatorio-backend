import { Router } from "express";
import {
  crearTurno,
  obtenerTurnos,
  eliminarTurno,
  obtenerTurnosPorDoctor,
  obtenerTurnosPorFecha,
  confirmarTurno,
  rechazarTurno
} from "../controllers/turnoscontroller.js";

const router = Router();

router.post("/", crearTurno);
router.get("/", obtenerTurnos);
router.get("/doctor/:doctorId", obtenerTurnosPorDoctor);
router.delete("/:id", eliminarTurno);
router.get("/fecha", obtenerTurnosPorFecha);
router.put("/confirmar/:id", confirmarTurno);
router.put("/rechazar/:id", rechazarTurno);

export default router;

