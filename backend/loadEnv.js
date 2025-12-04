import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, ".env"), // backend/.env
});

console.log("🌱 VARIABLES CARGADAS DESDE loadEnv.js");
console.log("   RESEND_API_KEY:", process.env.RESEND_API_KEY ? "OK" : "❌ NO CARGÓ");
