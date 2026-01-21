import { Router } from "express";
import {
  crearTurno,
  obtenerTurnos,
  eliminarTurno,
  actualizarTurno,
} from "../controllers/turnoscontroller.js";

const router = Router();

router.get("/", obtenerTurnos);
router.post("/", crearTurno);
router.put("/:id", actualizarTurno);   // 👈 PUT
router.delete("/:id", eliminarTurno);

export default router;

