import express from "express";
import {
  loginSecretaria,
  getTurnosSecretaria,
  crearTurnoSecretaria,
  eliminarTurnoSecretaria,
} from "../controllers/secretariaController.js";

const router = express.Router();

router.post("/login", loginSecretaria);
router.get("/:secretariaId/turnos", getTurnosSecretaria);
router.post("/:secretariaId/turnos", crearTurnoSecretaria);
router.delete("/:secretariaId/turnos/:turnoId", eliminarTurnoSecretaria);

export default router;