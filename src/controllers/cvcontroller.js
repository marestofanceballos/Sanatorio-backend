import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { GridFSBucket } from "mongodb";
import { Readable } from "stream";

// ─── Modelo ──────────────────────────────────────────────────────────────────
const postulacionSchema = new mongoose.Schema({
  nombre:           { type: String, required: true, trim: true },
  fechaNacimiento:  { type: String },
  dni:              { type: String, trim: true },
  domicilio:        { type: String, trim: true },
  telefono:         { type: String, trim: true },
  email:            { type: String, required: true, trim: true, lowercase: true },
  tieneExperiencia: { type: String, enum: ["Sí", "No"], default: "No" },
  aniosExperiencia: { type: Number, default: 0 },
  archivoId:        { type: mongoose.Schema.Types.ObjectId, required: true },
  nombreArchivo:    { type: String },
  fechaPostulacion: { type: Date, default: Date.now },
});

const Postulacion = mongoose.model("Postulacion", postulacionSchema);

// ─── Subir archivo a GridFS ───────────────────────────────────────────────────
const subirAGridFS = (buffer, filename, mimetype) => {
  return new Promise((resolve, reject) => {
    try {
      const db = mongoose.connection.db;
      console.log("db disponible:", !!db);

      const bucket = new GridFSBucket(db, { bucketName: "cvs" });
      const uploadStream = bucket.openUploadStream(filename, {
        contentType: mimetype,
        metadata: { originalName: filename, uploadedAt: new Date() },
      });

      uploadStream.on("finish", () => {
        console.log("GridFS upload terminado, id:", uploadStream.id);
        resolve(uploadStream.id);
      });

      uploadStream.on("error", (err) => {
        console.error("GridFS error:", err);
        reject(err);
      });

      uploadStream.end(buffer);  // ← cambiamos pipe por end()
    } catch (err) {
      console.error("Error en subirAGridFS:", err);
      reject(err);
    }
  });
};

// ─── Nodemailer ──────────────────────────────────────────────────────────────
const enviarNotificacion = async (datos) => {
  const { nombre, fechaNacimiento, dni, domicilio, telefono, email,
          tieneExperiencia, aniosExperiencia, nombreArchivo } = datos;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Sistema de CVs" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_RECEIVER,
    subject: `📄 Nuevo CV recibido — ${nombre}`,
    html: `
      <h2>Nueva postulación recibida</h2>
      <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
        <tr><td style="padding:6px 14px;font-weight:bold;">Nombre</td><td style="padding:6px 14px;">${nombre}</td></tr>
        <tr><td style="padding:6px 14px;font-weight:bold;">Fecha de nac.</td><td style="padding:6px 14px;">${fechaNacimiento || "—"}</td></tr>
        <tr><td style="padding:6px 14px;font-weight:bold;">DNI</td><td style="padding:6px 14px;">${dni || "—"}</td></tr>
        <tr><td style="padding:6px 14px;font-weight:bold;">Domicilio</td><td style="padding:6px 14px;">${domicilio || "—"}</td></tr>
        <tr><td style="padding:6px 14px;font-weight:bold;">Celular</td><td style="padding:6px 14px;">${telefono || "—"}</td></tr>
        <tr><td style="padding:6px 14px;font-weight:bold;">Email</td><td style="padding:6px 14px;">${email}</td></tr>
        <tr><td style="padding:6px 14px;font-weight:bold;">Experiencia</td><td style="padding:6px 14px;">${tieneExperiencia}${tieneExperiencia === "Sí" ? ` (${aniosExperiencia} año/s)` : ""}</td></tr>
        <tr><td style="padding:6px 14px;font-weight:bold;">Archivo</td><td style="padding:6px 14px;">${nombreArchivo}</td></tr>
      </table>
    `,
  });
};

// ─── Controllers ─────────────────────────────────────────────────────────────
export const recibirCV = async (req, res) => {
  try {
    const { nombre, fechaNacimiento, dni, domicilio, telefono,
            email, tieneExperiencia, aniosExperiencia } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({ error: "Nombre y email son obligatorios." });
    }
    if (!req.file) {
      return res.status(400).json({ error: "El archivo del CV es obligatorio." });
    }

    const archivoId = await subirAGridFS(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const postulacion = await Postulacion.create({
      nombre, fechaNacimiento, dni, domicilio, telefono, email,
      tieneExperiencia: tieneExperiencia || "No",
      aniosExperiencia: tieneExperiencia === "Sí" ? Number(aniosExperiencia) || 0 : 0,
      archivoId,
      nombreArchivo: req.file.originalname,
    });

    enviarNotificacion({
      nombre, fechaNacimiento, dni, domicilio, telefono, email,
      tieneExperiencia, aniosExperiencia, nombreArchivo: req.file.originalname,
    }).catch((err) => console.error("⚠️ Error enviando email:", err.message));

    return res.status(201).json({
      message: "CV recibido correctamente. ¡Gracias por postularte!",
      id: postulacion._id,
    });
  } catch (error) {
    console.error("Error en recibirCV:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};

export const listarCVs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [postulaciones, total] = await Promise.all([
      Postulacion.find().sort({ fechaPostulacion: -1 }).skip(skip).limit(Number(limit)).select("-__v"),
      Postulacion.countDocuments(),
    ]);
    return res.json({ total, page: Number(page), totalPages: Math.ceil(total / Number(limit)), postulaciones });
  } catch (error) {
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};

export const descargarCV = async (req, res) => {
  try {
    const postulacion = await Postulacion.findById(req.params.id);
    if (!postulacion) return res.status(404).json({ error: "Postulación no encontrada." });

    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "cvs" });
    const files = await bucket.find({ _id: postulacion.archivoId }).toArray();
    if (!files.length) return res.status(404).json({ error: "Archivo no encontrado." });

    res.setHeader("Content-Disposition", `attachment; filename="${postulacion.nombreArchivo}"`);
    res.setHeader("Content-Type", files[0].contentType || "application/octet-stream");
    bucket.openDownloadStream(postulacion.archivoId).pipe(res);
  } catch (error) {
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};

export const eliminarCV = async (req, res) => {
  try {
    const postulacion = await Postulacion.findById(req.params.id);
    if (!postulacion) return res.status(404).json({ error: "Postulación no encontrada." });

    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "cvs" });
    await bucket.delete(postulacion.archivoId);
    await postulacion.deleteOne();
    return res.json({ message: "Postulación eliminada correctamente." });
  } catch (error) {
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};