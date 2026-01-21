import app from "./src/app.js";
import "./src/config/db.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});
