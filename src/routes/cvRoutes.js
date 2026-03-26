import { Router } from "express";
import upload from "../middleware/uploadCV.js";
import { recibirCV, listarCVs, descargarCV, eliminarCV } from "../controllers/cvcontroller.js";

const router = Router();

router.post("/", upload.single("cv"), recibirCV);
router.get("/", listarCVs);
router.get("/:id/descargar", descargarCV);
router.delete("/:id", eliminarCV);

export default router;