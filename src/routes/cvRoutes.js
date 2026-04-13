import express from "express";
import multer from "multer";
import { subirCV } from "../controllers/cvsController.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se aceptan archivos PDF o Word."));
    }
  },
});

router.post("/", upload.single("cv"), subirCV);

export default router;
