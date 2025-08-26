import express from "express";
const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "prueba-123";

app.use(express.json());
app.get("/", (req, res) => res.send("✅ Meta middleware corriendo"));

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) return res.status(200).send(challenge);
  return res.sendStatus(403);
});

app.post("/webhook", (req, res) => {
  console.log("🔔 Webhook recibido:", JSON.stringify(req.body));
  res.sendStatus(200);
});

app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Servidor en ${PORT}`));
