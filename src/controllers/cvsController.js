import mongoose from "mongoose";
import nodemailer from "nodemailer";
import CV from "../models/CV.js";

// ── Subir CV ──────────────────────────────────────────────────────────────────
export const subirCV = async (req, res) => {
  try {
    const { nombre, fechaNacimiento, celular, email, dni, puesto, tieneExperiencia } = req.body;

    if (!nombre || !fechaNacimiento || !celular || !email || !dni || !puesto) {
      return res.status(400).json({ message: "Faltan campos obligatorios." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No se recibió ningún archivo." });
    }

    // ── Guardar archivo en GridFS ──────────────────────────────────────────
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "cvs",
    });

    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
    });

    uploadStream.end(req.file.buffer);

    const archivoId = await new Promise((resolve, reject) => {
      uploadStream.on("finish", () => resolve(uploadStream.id));
      uploadStream.on("error", reject);
    });

    // ── Guardar documento en MongoDB ───────────────────────────────────────
    const nuevoCV = await CV.create({
      nombre,
      fechaNacimiento,
      celular,
      email,
      dni,
      puesto,
      tieneExperiencia: tieneExperiencia === "true" || tieneExperiencia === true,
      archivoNombre: req.file.originalname,
      archivoId,
    });

    // ── Enviar email con el CV adjunto ─────────────────────────────────────
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Postulaciones Sanatorio Mayo" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_DESTINO,
      subject: `Nueva postulación: ${puesto} — ${nombre}`,
      html: `
        <h2 style="color:#2d7a4f;">Nueva postulación recibida</h2>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif;">
          <tr><td style="padding:8px;font-weight:bold;">Nombre</td><td style="padding:8px;">${nombre}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:8px;font-weight:bold;">DNI</td><td style="padding:8px;">${dni}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Fecha de nacimiento</td><td style="padding:8px;">${fechaNacimiento}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:8px;font-weight:bold;">Celular</td><td style="padding:8px;">${celular}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;">${email}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:8px;font-weight:bold;">Puesto</td><td style="padding:8px;">${puesto}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Experiencia previa</td><td style="padding:8px;">${tieneExperiencia === "true" || tieneExperiencia === true ? "Sí" : "No"}</td></tr>
        </table>
        <p style="margin-top:16px;color:#555;">El CV adjunto se encuentra en el archivo adjunto a este correo.</p>
      `,
      attachments: [
        {
          filename: req.file.originalname,
          content: req.file.buffer,
          contentType: req.file.mimetype,
        },
      ],
    });

    return res.status(201).json({
      message: "Postulación recibida correctamente.",
      id: nuevoCV._id,
    });
  } catch (error) {
    console.error("Error en subirCV:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};