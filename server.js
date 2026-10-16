import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import "./src/config/db.js";

const PORT = process.env.PORT || 4000;

process.on("uncaughtException", (err) => {
  console.error("ERROR CAPTURADO:", err.message);
});

app.listen(PORT, "127.0.0.1", () => {
  console.log("Servidor corriendo en puerto", PORT);
});