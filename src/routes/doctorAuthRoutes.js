import { Router } from "express";
import { loginDoctor, crearDoctor } from "../controllers/doctorAuthController.js";
import Doctor from "../models/Doctor.js"; // 👈 importar modelo

const router = Router();

router.post("/login", loginDoctor);
router.post("/crear", crearDoctor);

// 🔵 NUEVA RUTA
router.get("/doctors", async (req, res) => {
  try {
    const doctores = await Doctor.find();
    res.json(doctores);
  } catch (error) {
    res.status(500).json({ msg: "Error obteniendo doctores" });
  }
});

export default router;