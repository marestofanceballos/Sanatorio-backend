import express from "express";
import {
  loginSecretaria,
  crearSecretaria,
  asignarDoctores,
  getDoctoresSecretaria,
  getTurnosSecretaria,
  crearTurnoSecretaria,
  reprogramarTurnoSecretaria,
  eliminarTurnoSecretaria,
} from "../controllers/secretariaController.js";

const router = express.Router();

router.post("/login", loginSecretaria);
router.post("/crear", crearSecretaria);
router.get("/:secretariaId/doctores", getDoctoresSecretaria);
router.put("/:secretariaId/doctores", asignarDoctores);
router.get("/:secretariaId/turnos", getTurnosSecretaria);
router.post("/:secretariaId/turnos", crearTurnoSecretaria);
router.put("/:secretariaId/turnos/:turnoId", reprogramarTurnoSecretaria);
router.delete("/:secretariaId/turnos/:turnoId", eliminarTurnoSecretaria);

export default router;
