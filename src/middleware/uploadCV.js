import multer from "multer";

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  allowedMimes.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Solo se permiten archivos PDF o Word (.doc, .docx)"), false);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;