import express from "express";

const app = express();

// Guardar el raw body (útil si quieres validar firmas más adelante)
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf?.toString("utf8") || "";
    },
  })
);

// === Env ===
const {
  VERIFY_TOKEN = "prueba-123",
  MAKE_INBOUND_URL,
  SEND_SECRET,
  WHATSAPP_TOKEN,     // reservado para responder mensajes luego
  PHONE_NUMBER_ID,    // reservado para responder mensajes luego
  WABA_ID,            // reservado para responder mensajes luego
} = process.env;

const PORT = process.env.PORT || 3000;

// === Rutas básicas ===
app.get("/", (_req, res) => res.send("✅ Meta middleware corriendo"));
app.get("/healthz", (_req, res) => res.sendStatus(200));

// === Verificación del webhook (GET) ===
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// === Recepción del webhook (POST) y reenvío a Make ===
app.post("/webhook", async (req, res) => {
  try {
    console.log("📦 Webhook recibido:", JSON.stringify(req.body));

    if (MAKE_INBOUND_URL) {
      const r = await fetch(MAKE_INBOUND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(SEND_SECRET ? { "x-arkanosecret": SEND_SECRET } : {}),
        },
        body: JSON.stringify({
          provider: "meta_whatsapp",
          received_at: new Date().toISOString(),
          body: req.body,
          raw: req.rawBody || null,
          headers: req.headers,
        }),
      });
      console.log("➡️  Reenvío a Make:", r.status, r.statusText);
    } else {
      console.warn("⚠️ MAKE_INBOUND_URL no está configurado; no se reenvía a Make.");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error reenviando a Make:", err);
    res.sendStatus(500);
  }
});

// === Arranque ===
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor en ${PORT}`);
});
