import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0"; // importante para Docker

app.use(express.json());

// raíz clara para probar rápido
app.get("/", (_req, res) => res.send("OK desde Node /"));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api/hello", (_req, res) => res.json({ message: "Hello from Node!" }));

app.listen(PORT, HOST, () => {
  console.log(`Node escuchando en http://${HOST}:${PORT}`);
});
